// validate_public.mjs - validation du JSONL REGRESSION_PUBLIQUE : schema, couverture des fiches, jumeaux, comptages par famille / etiquette / gravite,
// reproductibilite octet pour octet (regenere dans un dossier temporaire). Node pur. Code de sortie 1 si erreur.
// Ne lit ni attacks/TEST.jsonl ni attacks/cases.jsonl.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { selector } from '../attacks/lib.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const body = readFileSync(join(DIR, 'PUBLIC.jsonl'), 'utf8');
const cases = body.split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l); } catch { err(`ligne ${i + 1} : JSON invalide`); return null; } }).filter(Boolean);

const LABELS = ['malveillant', 'benin', 'ambigu', 'fraude_conforme'], SEVS = ['critical', 'warn', 'ok'];
const KINDS = ['pay_someone', 'send_to_my_account', 'buy_or_swap', 'connect_or_accept_offer', 'asked_by_someone'];
const EVM_METHODS = ['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign', 'eth_sign', 'wallet_switchEthereumChain', 'wallet_addEthereumChain', 'wallet_sendCalls', 'wallet_requestExecutionPermissions'];
const PLATS = ['evm_toutes_chaines', 'ethereum_seulement', 'hors_perimetre_evm', 'sans_requete_wallet'];
const ADDR = /^0x[0-9a-fA-F]{40}$/, HEX = /^0x([0-9a-fA-F]{2})*$/;
const REQ = ['id', 'synthetic', 'notice', 'jeu', 'family', 'subfamily', 'fiche', 'domaine', 'request', 'context', 'intent', 'label', 'reason', 'expected_severity', 'ideal_severity', 'required_signals', 'blind_to_v3_contract', 'catalog_category', 'source', 'hard', 'approximation', 'split', 'plateforme', 'executable', 'twin_of', 'twin_id'];
const EXPECT_FICHES = [...Array.from({ length: 25 }, (_, i) => 'A' + String(i + 1).padStart(2, '0')), 'T2A1', 'T2A2', 'T2A3', 'T2A4', 'T2A5', 'T2B1', 'T2B2', 'T2B3', 'T2B4', 'T2C1', 'T2C2', 'T2C3', 'T2C4', 'T2C5', 'T2D1', 'T2D2', 'T2D3', 'T2D4', 'T2D5'];

const sel = new Map(); for (const sg of ['approve(address,uint256)', 'transfer(address,uint256)', 'setApprovalForAll(address,bool)', 'aggregate3((address,bool,bytes)[])', 'execute((address,uint256,bytes)[])', 'enableModule(address)', 'installModule(uint256,address,bytes)', 'setFallbackHandler(address)', 'swapExactETHForTokens(uint256,address[],address,uint256)', 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', 'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', 'mint(uint256)', 'claim()', 'claimRewards()', 'pay(address,uint256)', 'deposit(uint256,address,uint256)', 'depositETHTo(address,uint32,bytes)']) sel.set(selector(sg), sg);
if (selector('enableModule(address)') !== '0x610b5925') err('keccak local : enableModule != 0x610b5925');
if (selector('approve(address,uint256)') !== '0x095ea7b3') err('keccak local : approve != 0x095ea7b3');

const seen = new Set(); const byId = new Map();
for (const c of cases) { byId.set(c.id, c); }
const tally = (k) => (o, v) => { o[v] = (o[v] || 0) + 1; return o; };
const byFam = {}, byLabel = {}, bySev = {}, byPlat = {}, byFiche = {};
for (const c of cases) {
  for (const f of REQ) if (!(f in c)) err(`${c.id} : champ manquant ${f}`);
  if (!/^P-/.test(c.id)) err(`${c.id} : prefixe P- absent`);
  if (seen.has(c.id)) err(`${c.id} : id duplique`); seen.add(c.id);
  if (c.synthetic !== true || !/SYNTHETIQUE/.test(c.notice || '')) err(`${c.id} : marquage synthetique`);
  if (c.jeu !== 'REGRESSION_PUBLIQUE' || c.split !== 'REGRESSION_PUBLIQUE') err(`${c.id} : jeu/split != REGRESSION_PUBLIQUE`);
  if (!LABELS.includes(c.label)) err(`${c.id} : etiquette`);
  if (!SEVS.includes(c.expected_severity) || !SEVS.includes(c.ideal_severity)) err(`${c.id} : gravite`);
  if (!PLATS.includes(c.plateforme)) err(`${c.id} : plateforme`);
  if (!c.reason || c.reason.length < 30) err(`${c.id} : raison courte`);
  if (!Array.isArray(c.source) || !/threatintel\/TI_00[12]\.md/.test(c.source[0] || '')) err(`${c.id} : source`);
  if (!c.intent || !KINDS.includes(c.intent.kind) || !c.intent.freeText || typeof c.intent.declaredAt !== 'number') err(`${c.id} : intent`);
  if (c.intent && c.intent.counterpartyAddress && !ADDR.test(c.intent.counterpartyAddress)) err(`${c.id} : counterpartyAddress`);
  // coherence etiquette / gravite (schema du catalogue, adapte : la gravite d'une fiche MOYENNE ou une variante honnete est warn)
  if (c.label === 'malveillant') {
    if (c.expected_severity === 'ok') err(`${c.id} : malveillant ne peut pas attendre ok`);
    if (c.expected_severity === 'warn' && !(c.gravite_fiche === 'MOYENNE' || c.gravite_fiche === 'FAIBLE' || /variante_honnete/.test(c.subfamily) || c.gravite_fiche === null)) err(`${c.id} : malveillant warn sans justification de fiche`);
    if (['CRITIQUE', 'HAUTE'].includes(c.gravite_fiche) && c.expected_severity !== 'critical') err(`${c.id} : gravite fiche ${c.gravite_fiche} => critical`);
    if (['MOYENNE', 'FAIBLE'].includes(c.gravite_fiche) && c.expected_severity !== 'warn') err(`${c.id} : gravite fiche ${c.gravite_fiche} => warn`);
  }
  if (c.label === 'benin' && (c.expected_severity === 'critical' || c.ideal_severity !== c.expected_severity)) err(`${c.id} : benin incoherent`);
  if (c.label === 'benin' && c.expected_severity === 'warn' && !c.hard) warn(`${c.id} : benin warn sans hard`);
  if (c.label === 'fraude_conforme' && !(c.expected_severity !== 'critical' && c.ideal_severity !== 'ok' && c.blind_to_v3_contract)) err(`${c.id} : fraude_conforme`);
  if (c.label === 'benin' && c.blind_to_v3_contract) err(`${c.id} : benin blind`);
  // jumeaux
  if (c.label === 'malveillant' || c.label === 'fraude_conforme') {
    if (c.executable && !c.twin_id) err(`${c.id} : fixture executable sans jumeau benin`);
    if (c.twin_id) { const t = byId.get(c.twin_id); if (!t) err(`${c.id} : twin_id inconnu`); else { if (t.label !== 'benin') err(`${c.id} : jumeau non benin`); if (t.twin_of !== c.id) err(`${c.id} : lien jumeau non reciproque`); if (t.executable !== c.executable) err(`${c.id} : executable != jumeau`); if (t.plateforme !== c.plateforme && !(c.fiche === 'T2D1')) err(`${c.id} : plateforme != jumeau`); } }
  } else if (c.label === 'benin') { if (!c.twin_of || !byId.has(c.twin_of)) err(`${c.id} : benin sans parent`); }
  // requete
  const r = c.request;
  if (!r || typeof r.method !== 'string' || !Array.isArray(r.params)) { err(`${c.id} : request`); continue; }
  if (c.executable) {
    if (!EVM_METHODS.includes(r.method)) err(`${c.id} : methode executable non EVM ${r.method}`);
    const k = c.context; if (!k || !ADDR.test(k.victim || '')) err(`${c.id} : victim`);
    if (r.method === 'eth_sendTransaction') {
      const t = r.params[0];
      if (!ADDR.test(t.from)) err(`${c.id} : from`);
      if (!(t.to === null || ADDR.test(t.to))) err(`${c.id} : to`);
      if (t.to === null && !c.notes) err(`${c.id} : creation sans note`);
      if (!HEX.test(t.data || '0x') || !/^0x[0-9a-f]+$/.test(t.value)) err(`${c.id} : data/value`);
      if (t.from.toLowerCase() !== k.victim.toLowerCase()) err(`${c.id} : from != victim`);
      if (t.data && t.data.length >= 10 && t.to !== null && !/^0x6080/.test(t.data)) { const s = t.data.slice(0, 10); if (!sel.has(s)) warn(`${c.id} : selecteur ${s} hors table`); }
      if (t.authorizationList && c.plateforme !== 'ethereum_seulement') err(`${c.id} : 7702 non marque ethereum_seulement`);
      if (c.plateforme === 'ethereum_seulement' && !t.authorizationList && !/execute|eth_sign|7702/i.test(JSON.stringify(c.subfamily) + c.family)) warn(`${c.id} : ethereum_seulement sans authorizationList`);
    } else if (r.method === 'eth_signTypedData_v4') {
      let td; try { td = JSON.parse(r.params[1]); } catch { err(`${c.id} : typed data JSON`); continue; }
      if (!td.types || !td.primaryType || !td.message || !td.types[td.primaryType]) err(`${c.id} : typed data incomplet`);
    } else if (r.method === 'personal_sign' || r.method === 'eth_sign') {
      const hx = r.method === 'eth_sign' ? r.params[1] : r.params[0]; if (!HEX.test(hx)) err(`${c.id} : message hex`);
    } else if (r.method === 'wallet_sendCalls') { const p = r.params[0]; if (!Array.isArray(p.calls) || !p.calls.length) err(`${c.id} : calls`); for (const q of p.calls) if (!ADDR.test(q.to)) err(`${c.id} : call.to`); }
  } else {
    if (!c.non_executable_reason) err(`${c.id} : non executable sans raison`);
  }
  if (c.plateforme === 'ethereum_seulement' && !c.executable) err(`${c.id} : ethereum_seulement mais non executable (devrait etre executable en decodage hors ligne)`);
  tally()(byFam, c.family); byFam[c.family] = byFam[c.family];
  byLabel[c.label] = (byLabel[c.label] || 0) + 1; bySev[`${c.label}/${c.expected_severity}`] = (bySev[`${c.label}/${c.expected_severity}`] || 0) + 1; byPlat[c.plateforme] = (byPlat[c.plateforme] || 0) + 1; byFiche[c.fiche] = (byFiche[c.fiche] || 0) + 1;
}
// fiches couvertes
for (const f of EXPECT_FICHES) if (!byFiche[f]) err(`fiche ${f} sans fixture`);
for (const f of Object.keys(byFiche)) if (!EXPECT_FICHES.includes(f)) err(`fiche inattendue ${f}`);
// marquage 'approximation' present quand la fiche le dit
const nApprox = cases.filter((c) => c.approximation).length;
// reproductibilite
const tmp = mkdtempSync(join(tmpdir(), 'pub-'));
const r1 = spawnSync(process.execPath, [join(DIR, 'gen_public.mjs')], { env: { ...process.env, OUT_DIR: tmp }, encoding: 'utf8' });
if (r1.status !== 0) err('regeneration en echec : ' + (r1.stderr || '').slice(0, 300));
else { const again = readFileSync(join(tmp, 'PUBLIC.jsonl'), 'utf8'); if (again !== body) err('PUBLIC.jsonl non reproductible (octets differents)'); }
const hashFile = readFileSync(join(DIR, 'PUBLIC_HASH.txt'), 'utf8');
if (!hashFile.includes(sha(body))) err('PUBLIC_HASH.txt ne correspond pas a PUBLIC.jsonl');

// rapport
const L = [];
L.push('VALIDATION REGRESSION_PUBLIQUE (validate_public.mjs)');
L.push(`cas=${cases.length} sha256=${sha(body)}`);
L.push(`par etiquette : ${JSON.stringify(byLabel)}`);
L.push(`par etiquette/gravite attendue : ${JSON.stringify(bySev)}`);
L.push(`par plateforme : ${JSON.stringify(byPlat)}`);
L.push(`executables=${cases.filter((c) => c.executable).length} non_executables=${cases.filter((c) => !c.executable).length} ; marques approximation=${nApprox}`);
L.push('\npar famille (n total / malveillant / benin / fraude_conforme / executable) :');
const famRows = {}; for (const c of cases) { const o = (famRows[c.family] = famRows[c.family] || { n: 0, m: 0, b: 0, f: 0, e: 0, fiche: c.fiche, plat: c.plateforme, sev: new Set() }); o.n++; o[c.label === 'malveillant' ? 'm' : c.label === 'benin' ? 'b' : 'f']++; if (c.executable) o.e++; if (c.label !== 'benin') o.sev.add(c.expected_severity); }
for (const [f, o] of Object.entries(famRows).sort((a, b) => a[1].fiche < b[1].fiche ? -1 : 1)) L.push(`  ${o.fiche.padEnd(5)} ${f.padEnd(46)} n=${String(o.n).padStart(2)} m=${o.m} b=${o.b} f=${o.f} exec=${o.e} grav_attendue=${[...o.sev].join('/')} ${o.plat !== 'evm_toutes_chaines' ? '[' + o.plat + ']' : ''}`);
L.push(`\nfiches couvertes : ${Object.keys(byFiche).length}/${EXPECT_FICHES.length}`);
L.push(`avertissements (${warns.length}) : ${warns.slice(0, 20).join(' | ') || 'aucun'}`);
L.push(`erreurs (${errors.length}) : ${errors.slice(0, 30).join(' | ') || 'aucune'}`);
const rep = L.join('\n'); console.log(rep); writeFileSync(join(DIR, 'VALIDATION_PUBLIC_REPORT.txt'), rep + '\n');
process.exit(errors.length ? 1 : 0);
