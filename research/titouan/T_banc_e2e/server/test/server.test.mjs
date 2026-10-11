// Tests du serveur Hold up : demarre le VRAI serveur (port libre, journal temporaire) et lui envoie de vraies requetes HTTP.
// Usage : node server/test/server.test.mjs      (aucun navigateur, aucun reseau externe, un seul processus Node)
import http from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const { createHoldUpServer, verifyJournal, loadLocalContext } = await import(pathToFileURL(join(HERE, '..', 'server.mjs')).href);

const tmp = mkdtempSync(join(tmpdir(), 'holdup-test-'));
const PAUL = '0x1234567890abcdef1234567890abcdef12345678';
const SOSIE = '0x1234' + '9'.repeat(32) + '5678'; // meme debut (0x1234) et meme fin (5678) que Paul
const ctxFile = join(tmp, 'ctx.json');
writeFileSync(ctxFile, JSON.stringify({ contacts: [{ label: 'Paul', address: PAUL }], history: [{ address: PAUL, direction: 'sortie', amount: '0.1', minutes_ago: 5000 }] }));
const journalFile = join(tmp, 'j', 'verdicts.jsonl');
const s = await createHoldUpServer({ port: 0, journalFile, journalEnabled: true, local: loadLocalContext(ctxFile) });
const BASE = `http://127.0.0.1:${s.port}`;

const results = [];
let fails = 0;
function check(name, cond, info = '') { results.push({ name, ok: !!cond, info }); if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  [' + info + ']' : '')); }
const post = async (body, headers = {}) => { const t = performance.now(); const r = await fetch(BASE + '/check', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }); const ms = performance.now() - t; let j = null; try { j = await r.json(); } catch {} return { status: r.status, j, ms }; };
const word = (h) => h.replace(/^0x/, '').padStart(64, '0');
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', ME = '0x8bcea1b8558ac307b50ad720045c35783c9efb6c', SPENDER = '0x7777777777777777777777777777777777777777';
const approveData = (amt) => '0x095ea7b3' + word(SPENDER) + word(amt);
const MAXU = 'f'.repeat(64);
const base = { origin: 'https://app-uniswap-swap.example', url: 'https://app-uniswap-swap.example/swap', chainId: '0x1', from: ME };
const tx = (o) => ({ ...base, method: 'eth_sendTransaction', params: [{ from: ME, ...o }] });
const typed = (obj) => ({ ...base, method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(obj)] });
const permit = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
  Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC },
  message: { owner: ME, spender: SPENDER, value: '115792089237316195423570985008687907853269984665640564039457584007913129639935', nonce: '0', deadline: '4102444800' } };

const lat = [];
const run = async (name, body, test) => { const r = await post(body); lat.push(r.ms); const level = r.j && r.j.level; check(name, r.status === 200 && test(r.j, r), `HTTP ${r.status} level=${level} niveau=${r.j && r.j.niveau} fiche=${r.j && r.j.fiche} ${r.ms.toFixed(1)} ms`); return r; };
const four = (j) => j.texts && ['croit', 'reel', 'danger', 'action'].every((k) => typeof j.texts[k] === 'string' && j.texts[k].length > 3 && !/[{}]/.test(j.texts[k]));

// ---- 1. requetes types
await run('1 approve illimite -> critical + fiche F01 + 4 lignes', tx({ to: USDC, data: approveData(MAXU), value: '0x0' }), (j) => j.niveau === 'critical' && j.level === 'danger' && j.fiche === 'F01' && four(j) && j.effects.grants_right);
await run('2 permit EIP-2612 illimite (signature) -> critical + F02', typed(permit), (j) => j.niveau === 'critical' && j.fiche === 'F02' && four(j));
await run('3 envoi simple a un contact connu -> pas critical, jamais ok', tx({ to: PAUL, value: '0x16345785d8a0000', data: '0x' }), (j) => j.niveau !== 'critical' && ['info', 'warn'].includes(j.niveau) && j.fiche);
await run('4 setApprovalForAll -> critical + F03', tx({ to: '0xd27d9f9d0ee60dc6f8f304147cafe5284e64c4c8', data: '0xa22cb465' + word(SPENDER) + word('1') }), (j) => j.niveau === 'critical' && j.fiche === 'F03' && four(j));
await run('5 transferOwnership -> critical + F07', tx({ to: '0xd27d9f9d0ee60dc6f8f304147cafe5284e64c4c8', data: '0xf2fde38b' + word(SPENDER) }), (j) => j.niveau === 'critical' && j.fiche === 'F07' && four(j));
const sosie = await run('6 adresse sosie du contact -> critical + F13 + address_diff', tx({ to: SOSIE, value: '0x16345785d8a0000', data: '0x' }), (j) => j.niveau === 'critical' && j.fiche === 'F13' && j.address_diff && j.address_diff.expected === PAUL && j.address_diff.actual === SOSIE.toLowerCase());
await run('7 intention "je recois" + approve illimite -> contradiction', { ...tx({ to: USDC, data: approveData(MAXU) }), intent: 'receive' }, (j) => j.niveau === 'critical' && j.intent_contradiction === true);
// Founder's decision, 11 Oct. : the words of the page are not evidence. The verdict is the one of the request itself (an unlimited right : danger).
await run('8 texte de page "support / urgent" + approve : le texte de la page ne change pas le verdict (danger, jamais manipulation)', { ...tx({ to: USDC, data: approveData(MAXU) }), pageText: 'Contactez le support, action urgente, ne le dites a personne' }, (j) => j.level === 'danger' && j.niveau === 'critical' && j.quote === undefined);
await run('9 methode inconnue -> non verifie (unknown/warn), pas ok', { ...base, method: 'wallet_foo', params: [] }, (j) => j.level === 'unknown' && j.niveau === 'warn' && j.indeterminate === true && j.fiche === 'F25');
await run('10 ajout de reseau a symbole ETH usurpe -> critical', { ...base, method: 'wallet_addEthereumChain', params: [{ chainId: '0x3e7', chainName: 'Faux', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.faux.example'] }] }, (j) => j.niveau === 'critical');
await run('11 changement vers un reseau connu -> pas critical', { ...base, method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] }, (j) => j.niveau !== 'critical' && j.level !== 'ok');
await run('12 personal_sign simple -> pas ok', { ...base, method: 'personal_sign', params: ['0x48656c6c6f', ME] }, (j) => j.level !== 'ok' && ['info', 'warn'].includes(j.niveau));
await run('13 eth_sign (signature aveugle) -> critical + F05', { ...base, method: 'eth_sign', params: [ME, '0x' + '11'.repeat(32)] }, (j) => j.niveau === 'critical' && j.fiche === 'F05');
await run('14 params absents/charabia -> pas de plantage, jamais ok', { method: 'eth_sendTransaction', params: 'nope', origin: 5 }, (j) => j.level === 'unknown' && j.niveau === 'warn');

// ---- 2. requetes anormales
let r = await post('{ pas du json');
check('15 JSON malforme -> HTTP 400', r.status === 400, 'HTTP ' + r.status);
r = await post('[1,2,3]');
check('16 tableau JSON (pas un objet) -> HTTP 400', r.status === 400, 'HTTP ' + r.status);
const big = JSON.stringify({ method: 'personal_sign', params: ['0x' + 'ab'.repeat(300 * 1024), ME], origin: 'https://x.example' });
r = await post(big).catch((e) => ({ status: 'err:' + e.message }));
check('17 corps de 600 Ko -> HTTP 413 (ou connexion coupee)', r.status === 413 || String(r.status).startsWith('err'), 'HTTP ' + r.status);
const raw = (opts, body) => new Promise((res) => { const q = http.request({ host: '127.0.0.1', port: s.port, ...opts }, (rs) => { let d = ''; rs.on('data', (c) => d += c); rs.on('end', () => res({ status: rs.statusCode, headers: rs.headers, body: d })); }); q.on('error', (e) => res({ status: 'err:' + e.code })); q.end(body); });
let rr = await raw({ path: '/check', method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' } }, '{}');
check('18 Origin d\'une page web (https://evil.example) -> HTTP 403, pas de CORS', rr.status === 403 && !rr.headers['access-control-allow-origin'], 'HTTP ' + rr.status);
rr = await raw({ path: '/check', method: 'POST', headers: { origin: 'null' } }, '{}');
check('19 Origin "null" (page file://) -> HTTP 403', rr.status === 403, 'HTTP ' + rr.status);
const EXT = 'chrome-extension://' + 'abcdefghijklmnopabcdefghijklmnop';
rr = await raw({ path: '/check', method: 'POST', headers: { origin: EXT, 'content-type': 'application/json' } }, JSON.stringify(tx({ to: PAUL, value: '0x1', data: '0x' })));
check('20 Origin chrome-extension:// -> 200 et CORS limite a cette extension', rr.status === 200 && rr.headers['access-control-allow-origin'] === EXT, 'HTTP ' + rr.status + ' ACAO=' + rr.headers['access-control-allow-origin']);
rr = await raw({ path: '/check', method: 'OPTIONS', headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } });
check('21 Preflight depuis une page web -> 403', rr.status === 403, 'HTTP ' + rr.status);
rr = await raw({ path: '/check', method: 'POST', headers: { host: 'localhost:' + s.port } }, '{}');
check('22 en-tete Host different de 127.0.0.1 (DNS rebinding) -> 403', rr.status === 403, 'HTTP ' + rr.status);
rr = await raw({ path: '/health', method: 'GET' });
check('23 GET /health -> 200', rr.status === 200 && JSON.parse(rr.body).status === 'up', 'HTTP ' + rr.status);
rr = await raw({ path: '/test_page/', method: 'GET' });
check('23b page d essai servie en local (/test_page/)', rr.status === 200 && rr.body.includes('Page d'), 'HTTP ' + rr.status);
rr = await raw({ path: '/autre', method: 'GET' });
check('24 route inconnue -> 404', rr.status === 404);
check('25 le serveur ecoute sur 127.0.0.1 uniquement', s.srv.address().address === '127.0.0.1', JSON.stringify(s.srv.address()));

// ---- 3. latence et jamais "ok" sur un lot
const batch = [tx({ to: USDC, data: approveData(MAXU) }), typed(permit), tx({ to: PAUL, value: '0x1', data: '0x' }), tx({ to: SOSIE, value: '0x1', data: '0x' }), { ...base, method: 'wallet_foo', params: [] },
  { ...base, method: 'personal_sign', params: ['0x00', ME] }, tx({ to: '0xd27d9f9d0ee60dc6f8f304147cafe5284e64c4c8', data: '0xa22cb465' + word(SPENDER) + word('1') }), tx({ to: PAUL, value: '0x0', data: '0xdeadbeef' })];
const lv = {}; let okSeen = 0; const batchLat = [];
for (let i = 0; i < 400; i++) { const t = performance.now(); const x = await post(batch[i % batch.length]); batchLat.push(performance.now() - t); if (x.j) { lv[x.j.level] = (lv[x.j.level] || 0) + 1; if (x.j.level === 'ok' || x.j.niveau === 'ok') okSeen++; } }
const sorted = [...batchLat].sort((a, b) => a - b); const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const stat = { n: batchLat.length, p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +sorted[sorted.length - 1].toFixed(2) };
check('26 400 requetes en serie : aucun niveau "ok"', okSeen === 0, JSON.stringify(lv));
check('27 latence bout en bout p95 < 100 ms et max < 3000 ms', stat.p95 < 100 && stat.max < 3000, JSON.stringify(stat));
check('28 latence du moteur seule (champ latency_ms) < 50 ms sur la requete sosie', sosie.j.latency_ms < 50, sosie.j.latency_ms + ' ms');

// ---- 4. journal chaine
const v1 = verifyJournal(journalFile);
check('29 journal : chaine de hachage valide', v1.ok && v1.n >= 400, JSON.stringify(v1));
const lines = readFileSync(journalFile, 'utf8').trim().split('\n');
check('30 journal : pas de parametres bruts, ni adresse du portefeuille', !readFileSync(journalFile, 'utf8').includes(ME.slice(2, 14)) && JSON.parse(lines[0]).entry.params_sha256.length === 64);
const copy = join(tmp, 'tamper.jsonl'); const arr = [...lines]; const o = JSON.parse(arr[5]); o.entry.level = 'attention'; arr[5] = JSON.stringify(o); writeFileSync(copy, arr.join('\n') + '\n');
check('31 journal : une ligne modifiee est detectee', verifyJournal(copy).ok === false, JSON.stringify(verifyJournal(copy)));
const s2File = join(tmp, 'off', 'verdicts.jsonl');
const s2 = await createHoldUpServer({ port: 0, journalFile: s2File, journalEnabled: false, local: loadLocalContext(ctxFile) });
await fetch(`http://127.0.0.1:${s2.port}/check`, { method: 'POST', body: JSON.stringify(tx({ to: PAUL, value: '0x1', data: '0x' })) });
check('32 journal desactive : aucun fichier cree', !existsSync(s2File));
await s2.close();

await s.close();
const summary = { passed: results.filter((x) => x.ok).length, failed: fails, total: results.length, latency_ms_400_requests: stat, levels_in_400: lv, first_17_requests_ms: lat.map((x) => +x.toFixed(1)) };
console.log('\nRESUME ' + JSON.stringify(summary));
writeFileSync(join(HERE, 'results.json'), JSON.stringify({ date: new Date().toISOString(), node: process.version, summary, results }, null, 1));
rmSync(tmp, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
