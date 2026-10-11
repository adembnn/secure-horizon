// incident.js : fiche d'incident après l'alerte. Module pur. Sections, échappement, empreinte stable, absence de la phrase,
// Permit non révocable en un clic, entrées hostiles, déterminisme, rejeu des lignes du journal chaîné réel (journal_chain.js).
// Run : node --test extension/tests/unit/incident.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeChrome, load, DIR } from './fake_chrome.mjs';

const I = await load('incident.js');
const R = await load('revoke.js');
const C = await load('journal_chain.js');
const sha = (s) => createHash('sha256').update(s).digest('hex');

const OWNER = '0x' + 'a1'.repeat(20), SPENDER = '0x' + 'd4'.repeat(20), TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', OTHER = '0x' + 'e5'.repeat(20);
const MAXU = (1n << 256n) - 1n, NOW = 1_800_000_000;
const PHRASE = 'je veux envoyer vingt USDC a Paul pour le resto';
const approveReq = (amount, spender = SPENDER) => ({ method: 'eth_sendTransaction', chainId: '0x1', params: [{ from: OWNER, to: TOKEN, data: R.encodeApprove(spender, amount), value: '0x0' }] });
const permitReq = (deadline) => ({ method: 'eth_signTypedData_v4', chainId: '0x1', params: [OWNER, JSON.stringify({ domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: TOKEN }, primaryType: 'Permit', types: {}, message: { owner: OWNER, spender: SPENDER, value: MAXU.toString(), nonce: '0', deadline: String(deadline) } })] });
const unlimited = R.revocationFor(approveReq(MAXU), { tokenKind: 'erc20', tokenLabel: 'tes USDC' });
const permit = R.revocationFor(permitReq(NOW + 86400), { nowSec: NOW });

// un vrai journal de l'extension : verdict, décision « confirm », révocation (avec la phrase dans l'entrée d'origine : journal_chain doit la jeter)
async function chain(extra = []) {
  const F = makeChrome(); const st = F.chrome.storage.local;
  const base = [
    { type: 'verdict', origin: 'https://app.uniswap-claim-airdrop.example.org', method: 'eth_sendTransaction', level: 'danger', codes: ['unlimited_allowance'], ts: 1_800_000_000_000, ecrit: PHRASE },
    { type: 'decision', decision: 'confirm', origin: 'https://app.uniswap-claim-airdrop.example.org', method: 'eth_sendTransaction', level: 'danger', ts: 1_800_000_013_400, phrase: PHRASE },
    ...extra
  ];
  for (const e of base) await C.chainAppend(st, e, '0.3.0');
  return (await st.get('chain')).chain;
}
const CTX = { generatedAt: 1_800_000_100_000, tzOffsetMin: 120, token: { symbol: 'USDC', decimals: 6 }, network: 'Ethereum', phrase: PHRASE, ecrit: PHRASE, privateKey: '0x' + 'ab'.repeat(32) };
const all = (o) => [o.json, o.text, o.markdown, o.html].join('\n');

test('SHA-256 du module = node:crypto (ASCII, accents, multi-blocs)', () => {
  for (const s of ['', 'abc', 'é'.repeat(70), 'x'.repeat(55), 'x'.repeat(56), 'y'.repeat(64), 'z'.repeat(1000)]) assert.equal(I.sha256Hex(s), sha(s));
});

test('les huit sections, dans l’ordre, dans les quatre rendus', async () => {
  const o = I.buildIncident({ journal: await chain(), grant: { result: unlimited, origin: 'https://app.uniswap-claim-airdrop.example.org', at: 1_800_000_013_500 }, context: CTX });
  const titles = ['Ce qui s’est passé', 'Le droit donné', 'Ce que Hold up avait signalé', 'Ce que tu as fait', 'Ce qui reste exposé', 'Ce qu’il faut faire maintenant', 'Preuve', 'Limites'];
  assert.deepEqual(o.view.sections.map((s) => s.title), titles);
  for (const out of [o.text, o.markdown, o.html]) { let at = -1; for (const t of titles) { const i = out.indexOf(t, at + 1); assert.ok(i > at, t); at = i; } }
  const r = o.record;
  assert.equal(r.schema, 'holdup.fiche_incident/1');
  assert.equal(r.right.amount, 'illimité'); assert.equal(r.right.end, 'sans date de fin'); assert.equal(r.right.spender, SPENDER); assert.equal(r.right.token_symbol, 'USDC');
  assert.equal(r.signal.level_label, 'Danger'); assert.equal(r.action.decision, 'continued');
  assert.equal(r.action.at_text, '15/01/2027 à 10:00:13 (UTC+02:00)');
  assert.deepEqual(r.steps.map((s) => s.title.split(' (')[0]), ['Révoquer ce droit', 'Vérifier les autres droits', 'Prévenir la plateforme', 'Conserver la preuve', 'Si une perte a eu lieu']);
  assert.equal(r.steps[0].action, 'revoke'); assert.ok(r.steps[0].text.includes('remet ce droit à zéro')); assert.ok(r.steps[0].text.includes('Cela ne rend pas ce qui a déjà été pris'));
  assert.match(o.markdown, /- \[ \] \*\*1\. Révoquer ce droit\*\*/); assert.match(o.text, /\[ \] 5\. Si une perte a eu lieu/);
  assert.equal((o.html.match(/type="checkbox"/g) || []).length, 5);
});

test('étape 5 : numéros et voies repris de INCIDENT_ETAPES.md, sources citées, aucune voie exclue proposée, aucun lien', () => {
  const md = readFileSync(join(DIR, '..', 'INCIDENT', 'INCIDENT_ETAPES.md'), 'utf8');
  const loss = I.LOSS_STEPS.join('\n');
  for (const n of ['0 805 805 817', '116 006', '+33 1 53 45 62 00'] ) { assert.ok(loss.includes(n), n); assert.ok(md.includes(n.replace('+33 1', '+33 (0)1')) || md.includes(n), 'numéro lu dans le fichier : ' + n); }
  assert.match(loss, /commissariat/); assert.match(loss, /procureur/);
  assert.ok(I.LOSS_STEPS.every((s) => /\(sources? : [a-z]/.test(s)), 'chaque point cite sa source');
  assert.ok(!/https?:\/\//.test(loss) && !/Perceval/.test(loss));
  assert.ok(!/THESEE[^:]*:\s*(dépose|va sur)/i.test(loss), 'THESEE n’est jamais proposé comme démarche');
  assert.match(loss, /PHAROS[^.]*\. Ce n’est pas une plainte/);
  assert.ok(!/fiscal|impôt/i.test(loss));
});

test('échappement : une balise dans le nom du site ne passe jamais dans le HTML ni le Markdown', () => {
  for (const origin of ['<script>alert(1)</script>.example', 'https://x.example/"><img src=x onerror=alert(1)>', '<img src=x onerror=alert(1)>', 'javascript:alert(1)//<b>x</b>']) {
    const o = I.buildIncident({ journal: [], grant: { result: unlimited, origin, at: 1 }, context: { ...CTX, signal: '<iframe src=//evil.example></iframe> « Danger »' } });
    assert.ok(!/<(script|img|iframe)/i.test(o.html), 'aucune balise hostile : ' + origin);
    assert.ok(!/<(script|img|iframe)/i.test(o.markdown), 'markdown : ' + origin);
    assert.ok(o.html.includes('&lt;'), 'le texte hostile est montré échappé');
  }
  const o = I.buildIncident({ journal: [], grant: { result: unlimited, origin: 'https://evil.example', at: 1 }, context: CTX });
  assert.ok(!/<script/i.test(o.html) && !/\son[a-z]+=/i.test(o.html), 'aucun script ni gestionnaire');
  assert.ok(!/(src|href)=/i.test(o.html) && !/url\(/i.test(o.html) && !/@import/.test(o.html), 'aucune ressource externe');
  assert.match(o.html, /Content-Security-Policy" content="default-src 'none'/);
  assert.match(o.html, /@page\{size:A4/);
});

test('caractères invisibles et d’inversion de sens retirés du site et du signal', () => {
  const rlo = String.fromCharCode(0x202e), zw = String.fromCharCode(0x200b);
  const o = I.buildIncident({ journal: [], grant: { result: unlimited, origin: 'https://ap' + zw + 'p.exa' + rlo + 'mple', at: 1 }, context: { ...CTX, signal: 'a' + rlo + 'b' } });
  assert.ok(![...all(o)].some((c) => c === rlo || c === zw));
});

test('site coupé au MILIEU : le domaine reste entier', () => {
  const long = 'https://wallet-connect-secure-verify-session-airdrop-claim.app.real-domain.com/path';
  const s = I.siteOf(long);
  assert.ok(s.length <= 40 + 1); assert.ok(s.endsWith('real-domain.com')); assert.ok(s.includes('…'));
  assert.equal(I.siteOf('https://' + 'a'.repeat(60) + '.verylongregistrabledomainname-example.com').endsWith('verylongregistrabledomainname-example.com'), true);
});

test('adresses complètes seulement dans les champs « à copier »', async () => {
  const o = I.buildIncident({ journal: await chain(), grant: { result: unlimited, origin: 'https://evil.example', at: 2 }, others: [{ result: R.revocationFor(approveReq(5n, OTHER), { tokenKind: 'erc20' }), origin: 'https://autre.example', at: 3 }], context: CTX });
  for (const r of o.view.sections.flatMap((s) => s.rows || [])) if (/0x[0-9a-f]{40}/i.test(r.value)) assert.equal(r.copy, true, r.label);
  const t = o.text.split('\n').filter((l) => /0x[0-9a-f]{40}/i.test(l));
  assert.ok(t.length === 2 && t.every((l) => l.includes('(à copier)')), t.join('\n'));
  assert.ok(!all(o).includes(OWNER), 'jamais le compte de la personne');
  assert.ok(!o.text.includes(OTHER) && o.text.includes('0xe5e5…e5e5'), 'autres droits : adresse courte seulement');
});

test('jamais la phrase écrite ni une clé, même si l’appelant ou une ligne du journal les porte', async () => {
  const j = await chain();
  const page = [{ seq: 1, ts: 1, prev: '0'.repeat(64), entry: { source: 'demo', decision: 'sign', level: 'danger', ecrit: PHRASE } }];
  page[0].hash = I.sha256Hex(page[0].prev + '|1|1|' + JSON.stringify(page[0].entry));
  for (const journal of [j, page]) {
    const o = I.buildIncident({ journal, grant: { result: unlimited, origin: 'https://evil.example', at: 2, phrase: PHRASE }, context: CTX });
    assert.ok(!all(o).includes(PHRASE), 'phrase absente');
    assert.ok(!all(o).includes('ab'.repeat(32)), 'clé absente');
  }
  const o = I.buildIncident({ journal: page, grant: unlimited, context: CTX });
  assert.equal(o.record.proof.rows.length, 0); assert.equal(o.record.proof.withheld.length, 1); assert.match(o.record.proof.withheld[0].why, /texte libre/);
});

test('preuve : les lignes du journal chaîné de l’extension sont recopiées telles quelles et se rejouent avec node:crypto', async () => {
  const j = await chain([{ type: 'revocation', origin: 'https://app.uniswap-claim-airdrop.example.org', method: 'erc20_approve', decision: 'submitted', ts: 1_800_000_060_000 }]);
  const o = I.buildIncident({ journal: j, grant: { result: unlimited, origin: 'https://app.uniswap-claim-airdrop.example.org', at: 1 }, context: CTX });
  const rows = o.record.proof.rows;
  assert.deepEqual(rows.map((r) => r.n), [2, 3]);
  for (const r of rows) assert.equal(sha(r.prev + JSON.stringify([r.n, r.t, r.o, r.type, r.m, r.l, r.c, r.d, r.v])), r.hash);
  assert.equal(o.record.proof.chain.ok, true); assert.equal(o.record.proof.chain.records, 3);
  assert.equal(o.record.revocation.state, 'submitted'); assert.equal(o.record.steps[0].done, false);
  assert.match(o.record.steps[0].text, /reste actif tant qu’elle n’est pas confirmée/);
  assert.match(o.text, /Chaîne du journal : intacte, 3 lignes/);
  assert.equal(o.record.id, sha(j.entries[1].hash + '|' + j.entries[2].hash).slice(0, 16), 'identifiant = formule d’incident.mjs');
  // une ligne retouchée : la fiche le dit
  const bad = JSON.parse(JSON.stringify(j)); bad.entries[1].l = 'attention';
  const ob = I.buildIncident({ journal: bad, grant: unlimited, context: CTX });
  assert.equal(ob.record.proof.chain.ok, false); assert.match(ob.text, /cassée à la ligne 2/); assert.match(ob.record.does_not_prove[0], /cassée/);
});

test('relecture à zéro : étape 1 cochée, sans jamais parler de récupération', async () => {
  const o = I.buildIncident({ journal: await chain(), grant: { result: unlimited, origin: 'https://evil.example', at: 1 }, context: { ...CTX, revocation: { state: 'submitted', at: 1_800_000_070_000, checked: 'zero' } } });
  assert.equal(o.record.steps[0].done, true); assert.match(o.text, /\[x\] 1\. Révoquer ce droit/); assert.match(o.html, /type="checkbox" checked/);
  assert.match(o.record.lead, /remis à zéro/);
});

test('Permit signé hors chaîne : jamais « en un clic », quoi faire est dit (nonce, date limite, course)', () => {
  assert.equal(permit.status, 'two_steps');
  const o = I.buildIncident({ journal: [], grant: { result: permit, origin: 'https://evil.example', at: 1 }, context: CTX });
  const s1 = o.record.steps[0];
  assert.equal(s1.action, null, 'aucun bouton Révoquer pour un Permit');
  assert.match(s1.title, /pas en un clic/); assert.match(s1.text, /Un seul clic ne suffit pas/);
  const sub = s1.sub.join(' ');
  assert.match(sub, /aucune fonction d’annulation/); assert.match(sub, /date limite|date de fin/); assert.match(sub, /course/); assert.match(sub, /déjà été utilisée/);
  assert.notEqual(o.record.right.end, 'sans date de fin');
  // Permit2 signé : les trois fonctions, et l'absence d'interface grand public
  const p2 = R.revocationFor({ method: 'eth_signTypedData_v4', params: [OWNER, JSON.stringify({ domain: { name: 'Permit2', chainId: 1, verifyingContract: R.PERMIT2 }, primaryType: 'PermitSingle', types: {}, message: { details: { token: TOKEN, amount: '1000', expiration: '0', nonce: '0' }, spender: SPENDER, sigDeadline: String(NOW + 60) } })] }, { nowSec: NOW });
  const o2 = I.buildIncident({ journal: [], grant: p2, context: CTX });
  assert.equal(o2.record.steps[0].action, null); assert.match(o2.record.steps[0].sub.join(' '), /lockdown, invalidateNonces, invalidateUnorderedNonces/);
  // signature inconnue
  const u = R.revocationFor({ method: 'eth_signTypedData_v4', params: [OWNER, JSON.stringify({ domain: { verifyingContract: TOKEN }, primaryType: 'Order', types: {}, message: {} })] });
  assert.equal(I.buildIncident({ journal: [], grant: u, context: CTX }).record.steps[0].action, null);
});

test('annulé ou aucun droit : rien à révoquer, et c’est dit', async () => {
  const F = makeChrome(); const st = F.chrome.storage.local;
  await C.chainAppend(st, { type: 'decision', decision: 'cancel', origin: 'https://evil.example', method: 'eth_sendTransaction', level: 'danger', ts: 5 }, '0.3.0');
  const o = I.buildIncident({ journal: (await st.get('chain')).chain, grant: unlimited, context: CTX });
  assert.equal(o.record.action.decision, 'cancelled'); assert.equal(o.record.steps[0].applies, false); assert.match(o.record.lead, /Tu as annulé/);
  const n = I.buildIncident({ journal: [], grant: null, context: CTX });
  assert.equal(n.record.right, null); assert.equal(n.record.steps[0].applies, false);
});

test('ce qui reste exposé : autres droits connus et autres décisions « continuer »', async () => {
  const j = await chain([{ type: 'decision', decision: 'confirm', origin: 'https://autre-site.example', method: 'eth_sendTransaction', level: 'attention', ts: 1_800_000_090_000 }]);
  const o = I.buildIncident({ journal: j, decisionRef: 2, grant: { result: unlimited, origin: 'https://app.uniswap-claim-airdrop.example.org', at: 1 }, others: [{ result: R.revocationFor(approveReq(MAXU, OTHER), { tokenKind: 'erc20' }), origin: 'https://autre.example', at: 7, wallet: 'rejected' }], context: CTX });
  assert.equal(o.record.exposed.length, 2);
  assert.match(o.record.exposed[0].what, /illimité/); assert.equal(o.record.exposed[0].revocation, 'rejected');
  assert.match(o.record.exposed[1].site, /autre-site\.example/);
  const none = I.buildIncident({ journal: [], grant: unlimited, context: CTX });
  assert.match(none.record.exposed_note, /Cela ne veut pas dire qu’il n’y en a pas/);
});

test('empreinte stable et déterministe : mêmes entrées, mêmes octets ; le JSON exporté redonne l’empreinte', async () => {
  const j = await chain();
  const a = I.buildIncident({ journal: j, grant: { result: unlimited, origin: 'https://evil.example', at: 1 }, context: CTX });
  const b = I.buildIncident({ journal: JSON.parse(JSON.stringify(j)), grant: JSON.parse(JSON.stringify({ result: unlimited, origin: 'https://evil.example', at: 1 })), context: { ...CTX } });
  assert.equal(a.sha256, b.sha256); assert.equal(a.html, b.html); assert.equal(a.text, b.text); assert.equal(a.markdown, b.markdown);
  assert.equal(sha(a.json), a.sha256, 'SHA-256 du fichier JSON = empreinte affichée');
  assert.equal(I.canonicalJson(JSON.parse(a.json)), a.json, 'JSON canonique stable');
  assert.ok(a.text.includes(a.sha256) && a.html.includes(a.sha256) && a.markdown.includes(a.sha256));
  const c = I.buildIncident({ journal: j, grant: { result: unlimited, origin: 'https://evil.example', at: 1 }, context: { ...CTX, generatedAt: CTX.generatedAt + 1 } });
  assert.notEqual(c.sha256, a.sha256);
});

test('entrées hostiles ou absentes : jamais d’exception, jamais de balise', () => {
  const evil = [undefined, null, 42, 'x', [], {}, { journal: 'pas un tableau' }, { journal: [null, 1, 'a', { n: 'x' }] }, { journal: { entries: [{ n: 1, hash: 5, prev: [] }] } },
    { grant: { status: 'revocable', oneClick: true, grant: { spender: '<b>', token: 'javascript:', amount: 'NaN', unlimited: false } } },
    { grant: { result: { status: 'two_steps', grant: { amount: 1e309 }, steps: ['<script>x</script>'], expiry: { at: 1e300 } } } },
    { context: { tzOffsetMin: 99999, generatedAt: 'demain', token: { symbol: '<img>', decimals: 99 }, revocation: { state: '<x>', checked: 'peut-être' } } },
    { decisionRef: { toString() { throw new Error('x'); } } }];
  for (const e of evil) {
    const o = I.buildIncident(e);
    assert.equal(typeof o.sha256, 'string'); assert.equal(o.sha256.length, 64);
    assert.ok(!/<(script|img|b)\b/i.test(o.html.replace(/<\/?b>/g, '')), JSON.stringify(e && e.grant));
  }
  const o = I.buildIncident({ grant: { status: 'revocable', oneClick: true, grant: { spender: '<b>x</b>', token: 'zz' } }, context: CTX });
  assert.equal(o.record.right.spender, null); assert.ok(o.text.includes('Adresse qui reçoit le droit (à copier) : non lue'));
});

test('textes : aucun verdict vert, jamais « bloque », aucune promesse, aucun tiret long', async () => {
  const outs = [unlimited, permit, null].map((g) => I.buildIncident({ journal: [], grant: g, context: { ...CTX, demo: true } }));
  const txt = outs.map((o) => o.text + o.markdown + o.html).join('\n');
  assert.ok(!/\b(OK|bloqu\w*|sûr|protégé|garanti\w*|rembours\w*|vert|green)\b/i.test(txt));
  assert.ok(!/[—–]/.test(txt));
  assert.match(txt, /n’est pas un service juridique/); assert.match(txt, /ne promet aucune récupération/);
  assert.match(outs[0].text, /Démonstration : le portefeuille et le réseau sont simulés/);
  const src = readFileSync(join(DIR, 'incident.js'), 'utf8');
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|chrome\.|document\.|\bimport\s/.test(src), 'module pur : ni réseau, ni chrome, ni DOM, ni dépendance');
  assert.ok(!/https?:\/\//.test(src), 'aucune URL dans le module');
});
