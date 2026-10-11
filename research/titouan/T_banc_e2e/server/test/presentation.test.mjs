// Tests de la presentation des verdicts de Hold up (choix de la fiche, textes). Node seulement, un seul processus, aucun reseau.
// Usage : node server/test/presentation.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const S = await import(pathToFileURL(join(HERE, '..', 'server.mjs')).href);
const E = await import(pathToFileURL(join(ROOT, 'engine', 'src', 'engine.mjs')).href);
const TEXTS = JSON.parse(readFileSync(join(ROOT, '..', 'U_textes_utilisateur.json'), 'utf8'));
let fails = 0, n = 0;
const check = (name, cond, info = '') => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  [' + String(info).slice(0, 200) + ']' : '')); };
const L0 = { contacts: [], history: [], protected: [], knownSpenders: [] };
const ME = '0x8bcea1b8558ac307b50ad720045c35783c9efb6c', PAUL = '0x1234567890abcdef1234567890abcdef12345678', OTHER = '0x9999999999999999999999999999999999999999';
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', SP = '0x7777777777777777777777777777777777777777';
const w = (h) => h.replace(/^0x/, '').padStart(64, '0');
const MAXU = 'f'.repeat(64);
const req = (method, params, extra = {}) => ({ origin: 'https://app.exemple-defi.org', method, params, chainId: '0x1', from: ME, ...extra });
const send = (to, value, extra = {}, chain = '0x1') => req('eth_sendTransaction', [{ from: ME, to, value, data: '0x', chainId: chain }], { chainId: chain, ...extra });
const approve = (amt, extra = {}) => req('eth_sendTransaction', [{ from: ME, to: USDC, data: '0x095ea7b3' + w(SP) + amt, value: '0x0' }], extra);
const all = (v) => Object.values(v.texts).join(' | ');
const withPaul = { contacts: [{ address: PAUL, label: 'Paul' }], history: [], protected: [], knownSpenders: [] };

// ---- (1) F26 seulement pour un contact connu
{
  const unk = S.evaluate(send(OTHER, '0x16345785d8a0000'), L0);
  check('1a destinataire inconnu : pas F26, fiche F31 "adresse nouvelle"', unk.fiche === 'F31' && !/contact|comme tu l.as dit/.test(all(unk)), unk.fiche + ' ' + unk.texts.reel);
  const kn = S.evaluate(send(PAUL, '0x16345785d8a0000'), withPaul);
  check('1b destinataire du carnet : F26 avec son nom', kn.fiche === 'F26' && /Paul/.test(kn.texts.reel), kn.fiche + ' ' + kn.texts.reel);
  const noSend = S.evaluate(req('personal_sign', ['0x48656c6c6f', ME]), L0);
  check('1c aucun envoi : F26 partiel sans "contact"', noSend.fiche === 'F26' && !/contact/.test(noSend.texts.reel), noSend.texts.reel);
}
// ---- (2) jeton natif
{
  const t = (chain) => S.evaluate(send(OTHER, '0xde0b6b3a7640000', {}, chain), L0);
  const a = t('0xa86a'), f = t('0xa869'), e = t('0x1'), u = t('0x7a69');
  check('2a AVAX sur 43114', /AVAX/.test(all(a)) && !/NATIVE/.test(all(a)), a.texts.reel);
  check('2b AVAX sur 43113', /AVAX/.test(all(f)) && !/NATIVE/i.test(all(f)), f.texts.reel);
  check('2c ETH sur 1', /ETH/.test(all(e)) && !/NATIVE/.test(all(e)), e.texts.reel);
  check('2d reseau inconnu : jamais NATIVE', !/NATIVE/i.test(all(u)) && /unités du réseau/.test(all(u)), u.texts.reel);
  check('2e table : 137 POL, 56 BNB, 8453 ETH', S.nativeSymbol(137) === 'POL' && S.nativeSymbol(56) === 'BNB' && S.nativeSymbol(8453) === 'ETH');
}
// ---- (3) motifs de pression avec bornes de mots
{
  const no = ['Ton ami t’invite à visiter le site', 'Invitation à une visite guidée', 'investissement', 'Nous supportons Chrome', 'convite vitesse', 'la suite est rapide', 'Visitez nos pages', 'un support technique supporté'.replace('support technique', 'soutien')];
  const yes = ['Agissez vite', 'Il faut agir VITE!', 'Contactez le support', 'URGENT : action immédiate', 'ne le dis à personne', 'Votre compte sera bloqué', 'Remboursement en cours', 'Dernier avertissement', 'vite.', '(vite)'];
  check('3a faux positifs : aucun mot contenant "vite"/"support" ne declenche', no.every((x) => !S.findPressure(x)), no.filter((x) => S.findPressure(x)).join(' | '));
  check('3b vrais positifs detectes', yes.every((x) => S.findPressure(x)), yes.filter((x) => !S.findPressure(x)).join(' | '));
  check('3c accents : "dernier avertissement", "déplace tes fonds", NFD', !!S.findPressure('Déplace tes fonds'.normalize('NFD')) && !!S.findPressure('ACTION IMMÉDIATE'));
  const fp = S.evaluate(approve(MAXU, { pageText: 'Ton ami t’invite à visiter la boutique' }), L0);
  const tp = S.evaluate(approve(MAXU, { pageText: 'Agissez vite, contactez le support' }), L0);
  check('3d page "invite/visite" : pas de manipulation ; page "vite/support" : manipulation', fp.level !== 'manipulation' && tp.level === 'manipulation', fp.level + '/' + tp.level);
  check('3e remboursement + envoi : fiche F22 ; support + envoi : F21', S.evaluate(send(OTHER, '0x16345785d8a0000', { pageText: 'Remboursement : paie les frais vite' }), L0).fiche === 'F22' || S.findPressure('Remboursement').fiche === 'F22');
}
// ---- (4) droit illimite : pas de "autorise seulement jetons"
{
  const u = S.evaluate(approve(MAXU), L0);
  const l = S.evaluate(approve((100_000_000).toString(16).padStart(64, '0')), L0);
  check('4a droit illimite : action sans montant vide', u.fiche === 'F01' && /ce qu'il faut pour cet échange/.test(u.texts.action) && !/seulement\s+jetons|seulement\s*,/.test(u.texts.action), u.texts.action);
  check('4b droit limite : fiche F34, montant cité, jamais "sans limite"', l.fiche === 'F34' && /100/.test(l.texts.reel) && !/sans limite/.test(all(l)), l.fiche + ' ' + l.texts.reel);
}
// ---- (5) permit sans echeance
{
  const DOMAIN = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
  const permit = (deadline, value = '1000') => req('eth_signTypedData_v4', [ME, JSON.stringify({ types: { EIP712Domain: DOMAIN, Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC }, message: { owner: ME, spender: SP, value, nonce: '0', deadline } })]);
  const MAXV = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  const inf = S.evaluate(permit(MAXV, MAXV), L0);
  const fin = S.evaluate(permit(String(Math.floor(Date.now() / 1000) + 30 * 86400), MAXV), L0);
  const lim = S.evaluate(permit(MAXV), L0);
  check('5a deadline illimitee : "sans date de fin", jamais "e+"', inf.fiche === 'F02' && /sans date de fin/.test(inf.texts.reel) && !/e\+/.test(all(inf)), inf.texts.reel);
  check('5b deadline dans 30 jours : "pendant 30 jours"', /pendant 30 jours/.test(fin.texts.reel), fin.texts.reel);
  check('5c signature à montant fini : F35, jamais "sans limite"', lim.fiche === 'F35' && !/sans limite/.test(all(lim)), lim.fiche + ' ' + lim.texts.reel);
}
// ---- (5 bis) niveau et fiches ajoutées (rapport RAPPORT_TEXTES.md)
{
  const unk = S.evaluate(send(OTHER, '0x16345785d8a0000'), L0);
  check('5d F31 : level attention ET niveau warn (jamais info), niveau_moteur info', unk.fiche === 'F31' && unk.level === 'attention' && unk.niveau === 'warn' && unk.niveau_moteur === 'info', unk.level + '/' + unk.niveau);
  const kn = S.evaluate(send(PAUL, '0x16345785d8a0000'), withPaul);
  check('5e F26 (contact connu) reste niveau info', kn.fiche === 'F26' && kn.niveau === 'info' && kn.niveau_moteur === undefined);
  const lk = S.evaluate(approve((50_000_000).toString(16).padStart(64, '0')), { ...L0, knownSpenders: [SP] });
  check('5f droit limité à un programme connu : F34 décrit le droit (pas F26 "aucun signal")', lk.fiche === 'F34' && /50 USDC/.test(lk.texts.reel) && !/aucun signal/.test(all(lk)), lk.fiche + ' ' + lk.texts.reel);
  const ul = S.evaluate(approve(MAXU), { ...L0, knownSpenders: [SP] });
  check('5g droit sans limite à un programme connu (sans phrase) : F37, pas "aucun signal"', ul.fiche === 'F37' && !/aucun signal/.test(all(ul)), ul.fiche + ' ' + ul.niveau);
  const fakeTok = '0x' + '5'.repeat(40);
  const ut = S.evaluate(req('eth_sendTransaction', [{ from: ME, to: fakeTok, data: '0xa9059cbb' + w(PAUL) + w('64'), value: '0x0' }]), withPaul);
  check('5h jeton non reconnu : F36 "je n’ai pas pu le vérifier"', ut.fiche === 'F36' && /pas pu/.test(all(ut)), ut.fiche + ' ' + ut.texts.reel);
  check('5i fiches ajoutées dans la table', S.REASON_FICHE.lookalike_weak === 'F39' && S.REASON_FICHE.signed_calldata === 'F40' && S.REASON_FICHE.signed_text_grants_assets === 'F41');
  check('5j chaque fiche F34 à F42 existe, jamais de "bloqu" ni de vert', ['F34', 'F35', 'F36', 'F37', 'F38', 'F39', 'F40', 'F41', 'F42'].every((i) => { const x = TEXTS.fiches.find((q) => q.id === i); return x && !/bloqu|vert|OK/i.test([x.menace, x.croit, x.reel, x.danger, x.action].join(' ')); }));
}
// ---- (6) thirdParty fusionne dans les lots
{
  const mk = (tp) => ({ counterparties: [], risk_flags: [], opaque: false, opaqueReasons: [], outgoing: [], incoming: [], approvals: [], controlChange: [], nested: [], raw: {}, ...(tp ? { thirdParty: tp } : {}) });
  const m = S.mergeEffects([mk([{ a: 1 }]), mk([{ a: 2 }]), mk(null)]);
  check('6 mergeEffects concatene thirdParty', Array.isArray(m.thirdParty) && m.thirdParty.length === 2, JSON.stringify(m.thirdParty));
}
// ---- (7) table complete code -> fiche
{
  const codes = new Set();
  for (const f of readdirSync(join(ROOT, 'engine', 'src')).filter((x) => x.endsWith('.mjs'))) {
    const t = readFileSync(join(ROOT, 'engine', 'src', f), 'utf8');
    for (const m of t.matchAll(/['"`]([a-z][a-z0-9]*(?:_[a-z0-9]+)+)['"`]\s*,\s*(?:\w+\s*\?\s*)?['"`](?:info|warn|critical)['"`]/g)) codes.add(m[1]);
    for (const m of t.matchAll(/code:\s*['"`]([a-z0-9_]+)['"`]/g)) codes.add(m[1]);
  }
  const cmp = readFileSync(join(ROOT, 'engine', 'vendor', 'compare.ts'), 'utf8');
  for (const m of cmp.matchAll(/reason\(\s*['"]([a-z_]+)['"]/g)) codes.add(m[1]);
  for (const m of cmp.matchAll(/reason\(\s*\n\s*['"]([a-z_]+)['"]/g)) codes.add(m[1]);
  for (const c of ['delegatecall', 'approval_for_all', 'nft_all', 'nft_one', 'unlimited_allowance', 'address_poisoning', 'swap_recipient', 'opaque', 'control_change', 'eth_sign']) codes.add(c);
  const missing = [...codes].filter((c) => !(c in S.REASON_FICHE));
  check(`7a toutes les raisons du moteur (${codes.size}) ont une entrée dans la table`, missing.length === 0, missing.join(' '));
  const ids = new Set(TEXTS.fiches.map((f) => f.id));
  const bad = Object.entries(S.REASON_FICHE).filter(([, v]) => typeof v === 'string' && (v[0] === '~' ? !(v.slice(1) in S.SECOURS) : !ids.has(v)));
  check('7b chaque cible existe (fiche du JSON ou texte de secours)', bad.length === 0, JSON.stringify(bad));
  const eff0 = { approvals: [], outgoing: [], controlChange: [], counterparties: [] };
  const pick = (codes, eff = eff0, o = {}) => S.pickFiche(new Set(codes), eff, 'eth_sendTransaction', o).fid;
  check('7c F14 empoisonnement, F19 mauvaise adresse, F24 adresse neuve, F30 abonnement',
    pick(['address_poisoning']) === 'F14' && pick(['wrong_recipient']) === 'F19' && pick(['first_seen_recipient']) === 'F24' && pick(['recurring_spend_permission']) === 'F30');
  check('7d F29 mauvais reseau (envoi), F28 proche, F21 sinon', pick(['domain_chain_mismatch'], eff0, { funds: true }) === 'F29' && pick(['asked_by_someone_outgoing'], eff0, { intentText: 'Mon frère me demande' }) === 'F28' && pick(['asked_by_someone_outgoing']) === 'F21');
  check('7e F27 cadeau et F23 recruteur (droit sans envoi)', S.scenarioFiche({ fid: 'F01', pressure: null, pageText: 'Réclame ton cadeau !', funds: false, grants: true, niveau: 'critical' }) === 'F27' && S.scenarioFiche({ fid: 'F02', pressure: null, pageText: 'Notre recruteur valide ton embauche', funds: false, grants: true, niveau: 'critical' }) === 'F23');
  // fiches choisies par de vraies requetes
  const real = new Set([S.evaluate(send(OTHER, '0x1'), L0).fiche, S.evaluate(approve(MAXU), L0).fiche]);
  check('7f raison connue sans fiche : texte de secours de 4 lignes (jamais F25 "inconnu")', (() => { const v = S.present({ eff: { ...eff0, chainId: 1 }, S: new Set(['high_balance_share']), niveau: 'warn', method: 'x', host: 'a.org', funds: false, opaque: false }); return v.source === 'secours' && Object.keys(v.texts).length === 4; })(), [...real].join());
  // regle des 12 mots + mots interdits pour tous les textes de secours
  const INTERDITS = ['spender', 'calldata', 'permit', 'approve', 'approval', 'allowance', 'siwe', 'seaport', 'delegatecall', 'multicall', 'nonce', 'slippage', 'hash', 'token', 'tokens', 'wallet', 'blockchain', 'smart contract', 'contrat', 'proxy', 'module', 'safe', 'owner', 'gas', 'phishing', 'drainer', 'ens', 'dapp', 'airdrop', 'bridge', 'swap', 'ok', 'vert', 'protégé', 'bloqué', 'vous', 'votre', 'vos'];
  const bads = [];
  for (const [k, s] of Object.entries(S.SECOURS)) for (const [l, txt] of Object.entries(s)) {
    const nw = txt.trim().split(/\s+/).length;
    if (nw > 12 || nw < 4) bads.push(`${k}.${l}:${nw}`);
    for (const m of INTERDITS) if (new RegExp(`(?<![\\p{L}\\p{N}_])${m}(?![\\p{L}\\p{N}_])`, 'iu').test(txt)) bads.push(`${k}.${l}:interdit ${m}`);
  }
  for (const [k, t] of Object.entries(S.SECOURS_TITRE)) if (!(k in S.SECOURS)) bads.push('titre sans secours ' + k);
  check('7g textes de secours : 4 lignes de 4 à 12 mots, aucun mot interdit', bads.length === 0, bads.join(' '));
}
// ---- (8) vraie fiche pour les demandes de reseau
{
  const add = S.evaluate(req('wallet_addEthereumChain', [{ chainId: '0x539', chainName: 'X', rpcUrls: ['http://rpc.example'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } }]), L0);
  const sw = S.evaluate(req('wallet_switchEthereumChain', [{ chainId: '0xdeadbe' }]), L0);
  check('8a ajout de réseau : fiche F32, source "fiche"', add.fiche === 'F32' && add.texts_source === 'fiche' && add.niveau === 'critical', add.fiche + '/' + add.texts_source);
  check('8b bascule vers un réseau hors registre : fiche F33', sw.fiche === 'F33' && sw.niveau === 'warn', sw.fiche);
}
// ---- (a)(b) titre et opacity_only
{
  const u = S.evaluate(approve(MAXU), L0);
  const op = S.evaluate(req('eth_sendTransaction', [{ from: ME, to: OTHER, data: '0x12345678' + w(SP), value: '0x0' }]), L0);
  const bad = S.evaluate({ origin: 'https://x.org' }, L0);
  check('a1 title = fiche.menace', u.title === TEXTS.fiches.find((f) => f.id === 'F01').menace, u.title);
  check('b1 opacity_only faux pour un droit illimité', u.opacity_only === false);
  check('b2 appel inconnu : opacity_only vrai, titre discret, jamais vert', op.opacity_only === true && /pas pu vérifier/.test(op.title) && op.level !== 'ok', op.title + ' ' + op.level + ' ' + op.niveau);
  check('b3 analyse impossible : opacity_only + titre', bad.opacity_only === true && /pas pu vérifier/.test(bad.title));
}
console.log(`\nRESUME ${n - fails}/${n}`);
process.exit(fails ? 1 : 0);
