// validate.mjs - validation du JSONL + rapport (par famille, etiquette, gravite, split). Node pur.
// Usage : node validate.mjs   (code de sortie 1 si une erreur)
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { selector, sharedAffix } from './lib.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);

const read = (f) => readFileSync(join(DIR, f), 'utf8');
const parse = (f) => read(f).split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l); } catch (e) { err(`${f} ligne ${i + 1} : JSON invalide`); return null; } }).filter(Boolean);
const cases = parse('cases.jsonl'), dev = parse('DEV.jsonl'), test = parse('TEST.jsonl');

const LABELS = ['malveillant', 'benin', 'ambigu', 'fraude_conforme'];
const SEVS = ['critical', 'warn', 'ok'];
const KINDS = ['pay_someone', 'send_to_my_account', 'buy_or_swap', 'connect_or_accept_offer', 'asked_by_someone'];
const METHODS = ['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign', 'eth_sign', 'wallet_switchEthereumChain', 'wallet_addEthereumChain', 'wallet_sendCalls'];
const ADDR = /^0x[0-9a-fA-F]{40}$/, HEX = /^0x([0-9a-fA-F]{2})*$/;
const REQ_FIELDS = ['id', 'synthetic', 'notice', 'family', 'subfamily', 'request', 'context', 'intent', 'label', 'reason', 'expected_severity', 'ideal_severity', 'required_signals', 'blind_to_v3_contract', 'catalog_category', 'source', 'hard', 'approximation', 'split'];

const known = new Map(); // selecteurs connus (calcules localement)
for (const sg of ['approve(address,uint256)', 'transfer(address,uint256)', 'transferFrom(address,address,uint256)', 'increaseAllowance(address,uint256)', 'setApprovalForAll(address,bool)', 'aggregate3((address,bool,bytes)[])', 'multicall(bytes[])', 'multicall(uint256,bytes[])', 'execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)', 'transferOwnership(address)', 'grantRole(bytes32,address)', 'upgradeTo(address)', 'upgradeToAndCall(address,bytes)', 'renounceOwnership()', 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', 'swapExactETHForTokens(uint256,address[],address,uint256)', 'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', 'mint(uint256)', 'deposit()', 'deposit(uint256,address)', 'claim()', 'Claim()', 'SecurityUpdate()', 'Connect()', 'Verify(address)', 'claimRewards()', 'Airdrop()', 'execute(address,uint256,bytes)', 'executeBatch(address[],uint256[],bytes[])', 'execute((address,uint256,bytes)[])', 'multiSend(bytes)', 'submit(address)', 'depositETHTo(address,uint32,bytes)', 'register(string,address,uint256)', 'unwrapWETH9(uint256,address)', 'refundETH()']) known.set(selector(sg), sg);

const seenIds = new Set(); const byFam = {}, byLabel = {}, bySev = {}, byIdeal = {}, byCat = {}, bySplit = { DEV: 0, TEST: 0 };
const selCensus = {}; let unknownSel = 0, hardBenign = 0, ethCalls = 0;
for (const c of cases) {
  for (const f of REQ_FIELDS) if (!(f in c)) err(`${c.id} : champ manquant ${f}`);
  if (seenIds.has(c.id)) err(`${c.id} : id duplique`); seenIds.add(c.id);
  if (c.synthetic !== true) err(`${c.id} : synthetic != true`);
  if (!/SYNTHETIQUE/.test(c.notice || '')) err(`${c.id} : notice SYNTHETIQUE absente`);
  if (!LABELS.includes(c.label)) err(`${c.id} : etiquette ${c.label}`);
  if (!SEVS.includes(c.expected_severity) || !SEVS.includes(c.ideal_severity)) err(`${c.id} : gravite invalide`);
  if (!c.reason || c.reason.length < 20) err(`${c.id} : raison trop courte`);
  if (!Array.isArray(c.source) || !c.source.length) err(`${c.id} : source vide`);
  if (!c.intent || !KINDS.includes(c.intent.kind)) err(`${c.id} : intent.kind invalide`);
  if (c.intent && (!c.intent.freeText || typeof c.intent.declaredAt !== 'number')) err(`${c.id} : intent incomplet`);
  if (c.intent && c.intent.counterpartyAddress && !ADDR.test(c.intent.counterpartyAddress)) err(`${c.id} : counterpartyAddress invalide`);
  // coherence etiquette / gravite
  if (c.label === 'malveillant' && c.expected_severity !== 'critical') err(`${c.id} : malveillant doit etre critical`);
  if (c.label === 'ambigu' && c.expected_severity !== 'warn') err(`${c.id} : ambigu doit etre warn`);
  if (c.label === 'benin' && c.expected_severity === 'critical') err(`${c.id} : benin ne peut pas attendre critical`);
  if (c.label === 'fraude_conforme' && !(c.expected_severity !== 'critical' && c.ideal_severity === 'critical' && c.blind_to_v3_contract)) err(`${c.id} : fraude_conforme incoherente`);
  if (c.label === 'benin' && c.ideal_severity !== c.expected_severity) err(`${c.id} : benin ideal != expected`);
  // requete
  const r = c.request;
  if (!r || !METHODS.includes(r.method) || !Array.isArray(r.params)) { err(`${c.id} : request invalide`); continue; }
  if (r.method === 'eth_sendTransaction') {
    const t = r.params[0]; ethCalls++;
    if (!ADDR.test(t.from) || !ADDR.test(t.to)) err(`${c.id} : from/to invalides`);
    if (!HEX.test(t.data || '0x') || !/^0x[0-9a-f]+$/.test(t.value)) err(`${c.id} : data/value invalides`);
    if (t.from.toLowerCase() !== c.context.victim.toLowerCase()) err(`${c.id} : from != victim`);
    if (t.data && t.data.length >= 10) { const s = t.data.slice(0, 10); const nm = known.get(s); selCensus[nm || 'INCONNU'] = (selCensus[nm || 'INCONNU'] || 0) + 1; if (!nm) { unknownSel++; if (c.family !== 'kit_drainer') warn(`${c.id} : selecteur ${s} hors table`); } }
    if (t.authorizationList && c.family !== 'eip7702') err(`${c.id} : authorizationList hors famille 7702`);
  } else if (r.method === 'eth_signTypedData_v4') {
    let td; try { td = JSON.parse(r.params[1]); } catch { err(`${c.id} : typed data non JSON`); continue; }
    if (!td.types || !td.types.EIP712Domain || !td.types[td.primaryType] || !td.domain || !td.message) err(`${c.id} : typed data incomplet`);
    else for (const fld of td.types[td.primaryType]) if (!(fld.name in td.message)) err(`${c.id} : champ ${fld.name} absent du message`);
  } else if (r.method === 'personal_sign') { if (!HEX.test(r.params[0])) err(`${c.id} : personal_sign non hex`); }
  else if (r.method === 'eth_sign') { if (!/^0x[0-9a-f]{64}$/.test(r.params[1])) err(`${c.id} : eth_sign hash`); }
  else if (r.method === 'wallet_sendCalls') { if (!r.params[0].calls || !r.params[0].calls.length) err(`${c.id} : sendCalls vide`); }
  // sosie USENIX
  const m = /prefixe(\d+)_suffixe(\d+)/.exec(c.subfamily || '');
  if (m && c.family === 'adresse_empoisonnee') {
    const to = r.params[0].to; const dest = r.params[0].data === '0x' ? to : '0x' + r.params[0].data.slice(34, 74);
    const real = c.context.history.find((h) => h.kind === 'reel').address; const sa = sharedAffix(real, dest);
    if (sa.pre < +m[1] || sa.suf < +m[2] || +m[1] < 3 || +m[2] < 4) err(`${c.id} : sosie pre/suf ${sa.pre}/${sa.suf} < ${m[1]}/${m[2]}`);
  }
  if (c.family === 'eip7702' && !c.request.params[0].authorizationList) err(`${c.id} : 7702 sans authorizationList`);
  byFam[c.family] = byFam[c.family] || { total: 0, malveillant: 0, benin: 0, ambigu: 0, fraude_conforme: 0 }; byFam[c.family].total++; byFam[c.family][c.label]++;
  byLabel[c.label] = (byLabel[c.label] || 0) + 1; bySev[c.expected_severity] = (bySev[c.expected_severity] || 0) + 1; byIdeal[c.ideal_severity] = (byIdeal[c.ideal_severity] || 0) + 1; byCat[c.catalog_category] = (byCat[c.catalog_category] || 0) + 1;
  bySplit[c.split] = (bySplit[c.split] || 0) + 1;
  if (c.label === 'benin' && c.hard) hardBenign++;
}
// scan de secrets : aucune cle privee plausible dans les champs hors donnees aleatoires declarees
const raw = read('cases.jsonl'); if (/BEGIN (RSA |EC )?PRIVATE KEY|mnemonic|seed phrase:/i.test(raw)) err('motif de secret detecte');

// exigences de couverture
const REQ_FAM = ['approve_erc20', 'increase_allowance', 'set_approval_for_all', 'permit_2612', 'dai_permit', 'permit2_allowance', 'permit2_signature_transfer', 'seaport', 'blur', 'cow_uniswapx', 'siwe', 'verifying_contract', 'eth_sign_aveugle', 'personal_sign_opaque', 'changement_reseau', 'eip7702', 'multicall_cache', 'multisend_delegatecall', 'safe_execution', 'controle_admin', 'safe_gouvernance', 'erc4337_userop', 'adresse_empoisonnee', 'presse_papiers', 'swap_destinataire', 'slippage', 'faux_token', 'honeypot', 'domaine_sosie', 'kit_drainer', 'faux_support', 'faux_remboursement', 'faux_recruteur', 'pig_butchering', 'urgence_bancaire', 'faux_proche', 'faux_airdrop', 'faux_concours', 'ens_sosie'];
for (const f of REQ_FAM) if (!byFam[f] || byFam[f].malveillant + byFam[f].fraude_conforme + byFam[f].ambigu < 1) err(`famille requise absente ou sans attaque : ${f}`);
const SUBREQ = [['eip7702', /chain_id_0/], ['eip7702', /mutable/], ['safe_execution', /operation_1/], ['multisend_delegatecall', /delegue/], ['safe_gouvernance', /enableModule/], ['safe_gouvernance', /setGuard/], ['safe_gouvernance', /changeThreshold/], ['controle_admin', /transferOwnership/], ['controle_admin', /grantRole/], ['controle_admin', /upgradeTo/], ['permit_2612', /valeur_max_deadline_lointaine/], ['seaport', /pour_0/], ['seaport', /bilan_net_negatif/], ['approve_erc20', /illimite_vers_eoa/], ['approve_erc20', /illimite_vers_contrat/], ['approve_erc20', /borne_vers_eoa/], ['approve_erc20', /borne_vers_contrat/], ['siwe', /domaine/], ['adresse_empoisonnee', /transfert_valeur_nulle/], ['adresse_empoisonnee', /faux_token/], ['pig_butchering', /fraude_conforme/], ['multicall_cache', /approve_cache/]];
for (const [f, re] of SUBREQ) if (!cases.some((c) => c.family === f && re.test(c.subfamily))) err(`sous-famille requise absente : ${f} ~ ${re}`);
if (cases.length < 400) err(`moins de 400 cas : ${cases.length}`);
if ((byLabel.benin || 0) < 150) err(`moins de 150 benins : ${byLabel.benin}`);
if (hardBenign < 40) err(`moins de 40 benins durs : ${hardBenign}`);

// split
const devIds = new Set(dev.map((c) => c.id)), testIds = new Set(test.map((c) => c.id));
for (const id of devIds) if (testIds.has(id)) err(`${id} present dans DEV et TEST`);
if (devIds.size + testIds.size !== cases.length) err('DEV+TEST != cases');
const heldOut = 'eip7702'; if (dev.some((c) => c.family === heldOut)) err('famille tenue hors DEV presente dans DEV');
if (!test.some((c) => c.family === heldOut)) err('famille tenue hors DEV absente de TEST');
const testSubs = new Set(test.map((c) => c.family + '/' + c.subfamily)); const devSubs = new Set(dev.map((c) => c.family + '/' + c.subfamily));
const subOverlap = [...testSubs].filter((s) => devSubs.has(s)).length;
const th = read('TEST_HASH.txt'); const wanted = sha(read('TEST.jsonl'));
if (!th.includes(wanted)) err('TEST_HASH.txt ne correspond pas a TEST.jsonl');
const testByLabel = {}; for (const c of test) testByLabel[c.label] = (testByLabel[c.label] || 0) + 1;
for (const l of LABELS) if (!testByLabel[l]) err('TEST sans etiquette ' + l);

// reproductibilite : regenerer dans un dossier temporaire
const tmp = mkdtempSync(join(tmpdir(), 'attacks-repro-'));
const rp = spawnSync(process.execPath, [join(DIR, 'gen.mjs')], { env: { ...process.env, OUT_DIR: tmp }, encoding: 'utf8' });
let repro = 'ECHEC';
if (rp.status === 0 && existsSync(join(tmp, 'TEST.jsonl'))) {
  const same = sha(readFileSync(join(tmp, 'cases.jsonl'))) === sha(read('cases.jsonl')) && sha(readFileSync(join(tmp, 'TEST.jsonl'))) === sha(read('TEST.jsonl'));
  repro = same ? 'OK (cases.jsonl et TEST.jsonl identiques octet pour octet)' : 'DIFFERENT'; if (!same) err('generation non reproductible');
} else err('regeneration impossible : ' + (rp.stderr || '').slice(0, 200));

// rapport
const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(34)} ${v}`).join('\n');
const famLines = Object.entries(byFam).sort().map(([f, v]) => `  ${f.padEnd(28)} total=${String(v.total).padStart(3)}  malv=${String(v.malveillant).padStart(3)}  ben=${String(v.benin).padStart(3)}  amb=${String(v.ambigu).padStart(2)}  fraude_conf=${String(v.fraude_conforme).padStart(2)}`).join('\n');
const report = `RAPPORT DE VALIDATION (SYNTHETIQUE)\n===================================\nCas : ${cases.length}  | DEV=${bySplit.DEV}  TEST=${bySplit.TEST}  | familles=${Object.keys(byFam).length}\nBenins durs : ${hardBenign}\nReproductibilite (graine fixe) : ${repro}\nSous-familles presentes a la fois dans DEV et TEST : ${subOverlap} / ${testSubs.size} (sous-familles de TEST)\nHash TEST : ${wanted}\n\nPAR ETIQUETTE\n${fmt(byLabel)}\n\nPAR GRAVITE ATTENDUE (expected_severity)\n${fmt(bySev)}\n\nPAR GRAVITE IDEALE (ideal_severity)\n${fmt(byIdeal)}\n\nPAR CATEGORIE DU CATALOGUE\n${fmt(byCat)}\n\nPAR FAMILLE\n${famLines}\n\nTEST par etiquette : ${JSON.stringify(testByLabel)}\nSelecteurs eth_sendTransaction : ${ethCalls} requetes, ${unknownSel} selecteurs hors table (attendus : kit_drainer opaque)\n${Object.entries(selCensus).sort((a, b) => b[1] - a[1]).map(([k, v]) => '  ' + k.padEnd(60) + v).join('\n')}\n\nAVERTISSEMENTS : ${warns.length}\n${warns.slice(0, 20).map((w) => '  ' + w).join('\n')}\nERREURS : ${errors.length}\n${errors.slice(0, 50).map((e) => '  ' + e).join('\n')}\n`;
console.log(report);
writeFileSync(join(DIR, 'VALIDATION_REPORT.txt'), report);
process.exit(errors.length ? 1 : 0);
