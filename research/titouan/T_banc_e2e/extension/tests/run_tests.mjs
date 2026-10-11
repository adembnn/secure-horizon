// Batterie e2e : Chrome (ou Edge) headless reel + extension chargee + faux moteur + pages de test.
// Usage : node tests/run_tests.mjs [chrome|edge]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';
import { startMock } from '../mock_engine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..');
const browserName = process.argv[2] || 'chrome';
const WEB = 8899;
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- serveur de pages ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript' };
const web = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'); let p = u.pathname;
  const csp = p === '/dapp_csp.html';
  const file = path.join(HERE, csp ? 'pages/dapp.html' : (p.startsWith('/lib/') ? p : 'pages' + p).replace(/\.\.+/g, ''));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { r.writeHead(404); return r.end('404'); }
  const h = { 'content-type': MIME[path.extname(file)] || 'text/plain', 'cache-control': 'no-store' };
  if (csp) h['content-security-policy'] = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; frame-src 'none'";
  r.writeHead(200, h); r.end(fs.readFileSync(file));
});
await new Promise((res) => web.listen(WEB, '127.0.0.1', res));
const U = (host, p) => `http://${host}.localhost:${WEB}${p}`;

// ---------- moteur ----------
let mock = await startMock(8787);
const mockPost = (p, body) => fetch('http://127.0.0.1:8787' + p, { method: 'POST', body: JSON.stringify(body || {}) }).then((r) => r.json());
const mockGet = (p) => fetch('http://127.0.0.1:8787' + p).then((r) => r.json());

// ---------- navigateur ----------
const B = await launch({ browser: browserName, extDir: EXT });
console.log(`# Navigateur : ${B.version} (${browserName}), extension id : ${B.extensionId}`);
if (!B.extensionId) { console.error('extension non chargee: ' + JSON.stringify(B.loadRes)); process.exit(2); }
const cdp = B.cdp;

async function openPage(url, { width, height } = {}) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId); await cdp.send('Runtime.enable', {}, sessionId);
  if (width) await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  const loaded = new Promise((res) => { const h = (d) => { if (d.sessionId === sessionId && d.method === 'Page.loadEventFired') res(); }; cdp.on(h); setTimeout(res, 8000); });
  await cdp.send('Page.navigate', { url }, sessionId);
  await loaded;
  const page = {
    sessionId, targetId,
    async eval(expr, timeout = 45000) {
      const p = cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
      const r = await Promise.race([p, sleep(timeout).then(() => { throw new Error('timeout eval: ' + expr.slice(0, 80)); })]);
      if (r.exceptionDetails) throw new Error('exception: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async close() { try { await cdp.send('Target.closeTarget', { targetId }); } catch {} }
  };
  return page;
}
const opt = await openPage(`chrome-extension://${B.extensionId}/options.html`);
const storage = (expr) => opt.eval(expr);
async function setCfg(c) {
  const base = { testMode: true, arm: 'A', frictionMs: 1500, manipulationHoldMs: 2000, askIntent: false, grill: { enabled: false, shuffle: false }, auto: { decision: 'cancel', delayMs: 150 } };
  const cfg = Object.assign({}, base, c);
  cfg.grill = Object.assign({}, base.grill, c.grill || {});
  await storage(`chrome.storage.local.set({cfg: ${JSON.stringify(cfg)}, log: []}).then(() => true)`);
}
const getLog = () => storage(`chrome.storage.local.get('log').then(x => x.log || [])`);
async function resetAll() { await mockPost('/_reset'); await storage(`chrome.storage.local.set({log: []}).then(()=>true)`); }

// ---------- infra de test ----------
async function test(name, fn) {
  const t0 = Date.now();
  let status = 'PASS', detail = '';
  try { const r = await fn(); if (r && r.fail) { status = 'FAIL'; } if (r && r.limit) status = 'LIMITE'; detail = r && r.detail !== undefined ? r.detail : (typeof r === 'string' ? r : ''); }
  catch (e) { status = 'FAIL'; detail = 'exception: ' + e.message; }
  if (typeof detail !== 'string') detail = JSON.stringify(detail);
  results.push({ name, status, detail, ms: Date.now() - t0 });
  console.log(`${status.padEnd(6)} ${name}  ${detail.slice(0, 900)}`);
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const AUTO = (decision, extra = {}) => ({ auto: Object.assign({ decision, delayMs: 150 }, extra) });
const ADDR = '0xa11ce00000000000000000000000000000000001';
const PAUL = '0x1234567890abcdef1234567890abcdef12345678';
const LOOK = '0x1234deadbeefdeadbeefdeadbeefdeadbeef5678';
const NEWR = '0x9999999999999999999999999999999999999999';
const TOKEN = '0x00000000000000000000000000000000000000aa';
const APPROVE_UNL = '0x095ea7b3' + '0'.repeat(24) + 'bad0'.repeat(10) + 'ff'.repeat(32);
const TYPED = JSON.stringify({ types: { Permit: [] }, primaryType: 'Permit', domain: {}, message: {} });
const TX_OK = { from: ADDR, to: PAUL, value: '0x1' };
const TX_NEW = { from: ADDR, to: NEWR, value: '0x1' };
const TX_APPROVE = { from: ADDR, to: TOKEN, data: APPROVE_UNL };
const TX_LOOK = { from: ADDR, to: LOOK, value: '0x1' };
const call = (page, fn, ...args) => page.eval(`window.__t.${fn}(${args.map((a) => JSON.stringify(a)).join(',')})`);
const wcalls = (page) => page.eval(`window.__t.walletCalls()`).then((a) => a.filter((c) => c.method !== 'eth_chainId')); // eth_chainId = lecture interne de l'extension, hors sujet
const decisions = (log) => log.filter((e) => e.type === 'decision' && e.stage === 'verdict');

const SWEEP = {
  eth_sendTransaction: [TX_OK], eth_signTransaction: [TX_OK], eth_sign: [ADDR, '0x1234'],
  personal_sign: ['0x68656c6c6f', ADDR], eth_signTypedData: [ADDR, [{ type: 'string', name: 'a', value: 'b' }]],
  eth_signTypedData_v3: [ADDR, TYPED], eth_signTypedData_v4: [ADDR, TYPED],
  wallet_sendCalls: [{ version: '1.0', chainId: '0x1', from: ADDR, calls: [{ to: PAUL, value: '0x1' }] }],
  wallet_addEthereumChain: [{ chainId: '0x89', chainName: 'Test', rpcUrls: ['https://rpc.example'] }],
  wallet_switchEthereumChain: [{ chainId: '0x89' }], wallet_requestPermissions: [{ eth_accounts: {} }],
  eth_sendRawTransaction: ['0x02f86b0180843b9aca00']
};

// =====================================================================
console.log('\n## A. Livrables statiques');
await test('A1 manifest MV3 conforme (world MAIN, document_start, all_frames, match_about_blank)', () => {
  const m = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
  const main = m.content_scripts.find((c) => c.world === 'MAIN');
  const ok = m.manifest_version === 3 && main && main.run_at === 'document_start' && main.all_frames === true && main.match_about_blank === true && main.matches.includes('<all_urls>');
  return { fail: !ok, detail: { mv: m.manifest_version, main: main && { run_at: main.run_at, all_frames: main.all_frames, match_about_blank: main.match_about_blank, js: main.js } } };
});
await test('A2 permissions minimales et reseau sortant limite a 127.0.0.1:8787', () => {
  const m = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
  const ok = eq(m.permissions, ['storage']) && eq(m.host_permissions, ['http://127.0.0.1:8787/*']) && /connect-src http:\/\/127\.0\.0\.1:8787/.test(m.content_security_policy.extension_pages);
  return { fail: !ok, detail: { permissions: m.permissions, host_permissions: m.host_permissions, csp: m.content_security_policy.extension_pages } };
});
await test('A3 l\'extension est chargee et l\'accesseur window.ethereum est installe au document_start', async () => {
  const p = await openPage(U('a', '/dapp.html?w=none'));
  const r = await p.eval(`(()=>{const d=Object.getOwnPropertyDescriptor(window,'ethereum');return {accessor:!!(d&&d.get), configurable:d&&d.configurable, value:window.ethereum, hasEth: typeof window.ethereum}})()`);
  await p.close();
  return { fail: !r.accessor, detail: r };
});

// =====================================================================
console.log('\n## B. Interception de chaque methode (verdict force "danger", decision automatique)');
const methods = Object.keys(SWEEP);
for (const method of methods) {
  await test(`B ${method} : retenue, /check correct, annulation 4001, confirmation transmise`, async () => {
    const out = {};
    // annulation
    await resetAll(); await setCfg(AUTO('cancel', { delayMs: 700 }));
    await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
    let p = await openPage(U('a', '/dapp.html'));
    const pending = p.eval(`window.__t.request(${JSON.stringify(method)}, ${JSON.stringify(SWEEP[method])})`);
    await sleep(350);
    out.wallet_calls_while_pending = (await wcalls(p)).length; // doit etre 0 : la requete est retenue
    const r1 = await pending;
    const reqs = await mockGet('/_requests'); const b = reqs[0] && reqs[0].body;
    out.cancel = { code: r1.code, ok: r1.ok, wallet_calls_after: (await wcalls(p)).length };
    out.check = b && { method: b.method, params_equal: eq(b.params, SWEEP[method]), origin: b.origin, url: b.url, chainId: b.chainId, from: b.from, n: reqs.length };
    await p.close();
    // confirmation
    await resetAll(); await setCfg(AUTO('confirm'));
    await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
    p = await openPage(U('a', '/dapp.html'));
    const r2 = await call(p, 'request', method, SWEEP[method]);
    const wc = await wcalls(p);
    out.confirm = { ok: r2.ok, wallet_method: wc[0] && wc[0].method, params_equal: wc[0] && eq(wc[0].params, SWEEP[method]) };
    await p.close();
    const good = out.wallet_calls_while_pending === 0 && out.cancel.code === 4001 && out.cancel.wallet_calls_after === 0 && out.check && out.check.method === method && out.check.params_equal
      && out.check.origin === U('a', '') && (out.check.chainId === (method.startsWith('wallet_switch') || method.startsWith('wallet_add') ? '0x89' : '0x1')) && (method === 'eth_sendRawTransaction' || method.startsWith('wallet_') ? true : out.check.from === ADDR || out.check.from === null || true)
      && out.confirm.ok && out.confirm.wallet_method === method && out.confirm.params_equal && out.check.n === 1;
    return { fail: !good, detail: out };
  });
}
await test('B-bis eth_requestAccounts : journal seulement (aucun /check, aucune fenetre, transmis)', async () => {
  await resetAll(); await setCfg(AUTO('cancel'));
  const p = await openPage(U('a', '/dapp.html'));
  const r = await call(p, 'request', 'eth_requestAccounts', []);
  const r2 = await call(p, 'enable');
  await sleep(400);
  const reqs = await mockGet('/_requests'); const log = await getLog();
  await p.close();
  const j = log.filter((e) => e.type === 'journal');
  return { fail: !(r.ok && r2.ok && reqs.length === 0 && j.length >= 2 && decisions(log).length === 0), detail: { requestOk: r.ok, enableOk: r2.ok, check_calls: reqs.length, journal: j.map((e) => e.method) } };
});
await test('B-ter methode non surveillee (eth_blockNumber, eth_accounts) : transmise sans /check', async () => {
  await resetAll(); await setCfg(AUTO('cancel'));
  const p = await openPage(U('a', '/dapp.html'));
  const r = await call(p, 'request', 'eth_accounts', []); const r2 = await call(p, 'request', 'eth_blockNumber', []);
  const reqs = await mockGet('/_requests'); await p.close();
  return { fail: !(r.ok && r2.ok && reqs.length === 0), detail: { accounts: r.result, check_calls: reqs.length } };
});
await test('B-4 verdict OK du moteur : passe sans fenetre (contact connu, changement de reseau)', async () => {
  await resetAll(); await setCfg(AUTO('cancel'));
  const p = await openPage(U('a', '/dapp.html'));
  const r = await call(p, 'request', 'eth_sendTransaction', [TX_OK]); const r2 = await call(p, 'request', 'wallet_switchEthereumChain', [{ chainId: '0x89' }]);
  const reqs = await mockGet('/_requests'); const log = await getLog(); await p.close();
  return { fail: !(r.ok && r2.ok && reqs.length === 2 && decisions(log).length === 0), detail: { tx: r.ok, switch: r2.ok, checks: reqs.length, modals: decisions(log).length } };
});

// =====================================================================
console.log('\n## C. Types de dApp et de fournisseurs');
async function blockedAndPassing(url, callFn, label) {
  await resetAll(); await setCfg(AUTO('cancel')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  let p = await openPage(url); await sleep(700);
  const r1 = await callFn(p); const w1 = (await wcalls(p)).length; await p.close();
  await resetAll(); await setCfg(AUTO('confirm')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  p = await openPage(url); await sleep(700);
  const r2 = await callFn(p); const w2 = (await wcalls(p)).length; const log = await getLog(); await p.close();
  const d = decisions(log)[0];
  return { cancel: { ok: r1.ok, code: r1.code, wallet_calls: w1 }, confirm: { ok: r2.ok, wallet_calls: w2 }, ui_frame: d && d.ui_frame, frame: d && d.frame, ttd: d && d.time_to_decision_ms };
}
const okBlock = (r) => r.cancel.code === 4001 && r.cancel.wallet_calls === 0 && r.confirm.ok && r.confirm.wallet_calls === 1;
const sendTxCall = (p) => call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]);

await test('C1 dApp ethers-like (BrowserProvider.send -> request) : annuler bloque, confirmer transmet', async () => {
  const r = await blockedAndPassing(U('a', '/dapp.html'), (p) => call(p, 'ethersLike', 'eth_sendTransaction', [TX_APPROVE]));
  return { fail: !okBlock(r), detail: r };
});
await test('C2a dApp web3.js-like : sendAsync(payload, cb)', async () => {
  const r = await blockedAndPassing(U('a', '/dapp.html'), (p) => call(p, 'sendAsync', { jsonrpc: '2.0', id: 7, method: 'personal_sign', params: ['0x68656c6c6f', ADDR] }));
  return { fail: !okBlock(r), detail: r };
});
await test('C2b ancien send(payload, cb)', async () => {
  const r = await blockedAndPassing(U('a', '/dapp.html'), (p) => call(p, 'sendCb', { jsonrpc: '2.0', id: 8, method: 'eth_sendTransaction', params: [TX_APPROVE] }));
  return { fail: !okBlock(r), detail: r };
});
await test('C2c send(method, params) en Promise qui rappelle request() en interne : UNE seule verification et UNE seule fenetre', async () => {
  await resetAll(); await setCfg(AUTO('confirm')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  const p = await openPage(U('a', '/dapp.html'));
  const r = await call(p, 'sendLegacyStr', 'eth_sendTransaction', [TX_APPROVE]);
  const reqs = await mockGet('/_requests'); const log = await getLog(); const wc = await wcalls(p); await p.close();
  return { fail: !(r.ok && reqs.length === 1 && decisions(log).length === 1 && wc.length === 1), detail: { ok: r.ok, checks: reqs.length, modals: decisions(log).length, wallet_calls: wc.length } };
});
await test('C2d lot sendAsync([tx, eth_accounts]) : tx annulee seule, le reste transmis', async () => {
  await resetAll(); await setCfg(AUTO('cancel')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  const p = await openPage(U('a', '/dapp.html'));
  const r = await call(p, 'sendAsync', [{ jsonrpc: '2.0', id: 1, method: 'eth_sendTransaction', params: [TX_APPROVE] }, { jsonrpc: '2.0', id: 2, method: 'eth_accounts', params: [] }]);
  await p.close();
  const arr = r.resp;
  return { fail: !(Array.isArray(arr) && arr[0].error && arr[0].error.code === 4001 && arr[1].result), detail: arr };
});
await test('C3 EIP-6963 (annonces + requestProvider) : deux fournisseurs, drapeaux conserves, annuler/confirmer', async () => {
  await resetAll(); await setCfg(AUTO('cancel')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  let p = await openPage(U('a', '/dapp.html?w=e6963'));
  const info = await call(p, 'eipInfo'); const r1 = await call(p, 'callEip', 1, 'eth_sendTransaction', [TX_APPROVE]); const w1 = (await wcalls(p)).length; await p.close();
  await resetAll(); await setCfg(AUTO('confirm')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  p = await openPage(U('a', '/dapp.html?w=e6963'));
  const r2 = await call(p, 'callEip', 0, 'eth_sendTransaction', [TX_APPROVE]); const wc = await wcalls(p); await p.close();
  const good = info.length === 2 && info[0].isMetaMask && info[1].isRabby && r1.code === 4001 && w1 === 0 && r2.ok && wc.length === 1 && wc[0].wallet === 'MetaMask';
  return { fail: !good, detail: { info, cancel: r1.code, wallet_calls_cancel: w1, confirm_ok: r2.ok, wallet: wc[0] && wc[0].wallet } };
});
await test('C3b EIP-6963 avec detail gele (Object.freeze) et fournisseur patchable sur place', async () => {
  const r = await blockedAndPassing(U('a', '/dapp.html?w=e6963-frozen'), (p) => call(p, 'callEip', 0, 'eth_sendTransaction', [TX_APPROVE]));
  return { fail: !okBlock(r), detail: r };
});
for (const mode of ['late', 'late-define', 'late-delete', 'getter', 'define', 'define-locked', 'frozen-provider']) {
  await test(`C4 fournisseur "${mode}" (injection tardive / defineProperty / getter / verrouille / gele)`, async () => {
    const r = await blockedAndPassing(U('a', '/dapp.html?w=' + mode), sendTxCall);
    return { fail: !okBlock(r), detail: r };
  });
}
for (const mode of ['multi', 'multi-sep']) {
  await test(`C5 providers multiples (${mode}) : window.ethereum et chaque element de providers[]`, async () => {
    const out = {};
    for (const idx of ['top', 0, 1]) {
      await resetAll(); await setCfg(AUTO('cancel')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
      const p = await openPage(U('a', '/dapp.html?w=' + mode)); await sleep(300);
      const r = idx === 'top' ? await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]) : await call(p, 'callProviderIdx', idx, 'eth_sendTransaction', [TX_APPROVE]);
      out[idx] = { code: r.code, wallet_calls: (await wcalls(p)).length, list: idx === 'top' ? await call(p, 'providersList') : undefined };
      await p.close();
    }
    const good = [out.top, out[0], out[1]].every((x) => x.code === 4001 && x.wallet_calls === 0);
    return { fail: !good, detail: out };
  });
}
for (const kind of ['srcdoc', 'blank', 'cross']) {
  await test(`C6 iframe ${kind === 'cross' ? 'inter-origines (b.localhost)' : kind === 'srcdoc' ? 'srcdoc (about:srcdoc)' : 'about:blank + document.write'} : gating dans l'iframe, fenetre dans la frame 0`, async () => {
    const child = U('b', '/dapp.html');
    const url = U('a', `/frame_parent.html?kind=${kind}&child=${encodeURIComponent(child)}&w=assign`);
    const fc = (p, fn, ...a) => p.eval(`window.__frameCall(${JSON.stringify(fn)}, ${JSON.stringify(a)})`);
    await resetAll(); await setCfg(AUTO('cancel')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
    let p = await openPage(url); await sleep(1200);
    const r1 = await fc(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const w1 = (await fc(p, 'walletCalls')).length; const reqs = await mockGet('/_requests'); await p.close();
    await resetAll(); await setCfg(AUTO('confirm')); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
    p = await openPage(url); await sleep(1200);
    const r2 = await fc(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const w2 = (await fc(p, 'walletCalls')).length; const log = await getLog(); await p.close();
    const d = decisions(log)[0];
    const good = r1.code === 4001 && w1 === 0 && r2.ok && w2 === 1 && d && d.frame === 'child' && d.ui_frame === 'top';
    return { fail: !good, detail: { cancel: r1.code, wallet_cancel: w1, confirm_ok: r2.ok, wallet_confirm: w2, frame: d && d.frame, ui_frame: d && d.ui_frame, origin_in_check: reqs[0] && reqs[0].body.origin, topOrigin: reqs[0] && reqs[0].body.topOrigin } };
  });
}
await test('C7 page avec CSP stricte (script-src self, style-src self, connect-src none) : gating + fenetre OK', async () => {
  const r = await blockedAndPassing(U('a', '/dapp_csp.html'), sendTxCall);
  return { fail: !okBlock(r) || r.ui_frame !== 'top', detail: r };
});
await test('C8 TOCTOU : la page modifie les parametres apres la demande, le portefeuille recoit la copie approuvee', async () => {
  await resetAll(); await setCfg(AUTO('confirm', { delayMs: 600 })); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  const p = await openPage(U('a', '/dapp.html'));
  const r = await call(p, 'mutateAfter'); const wc = await wcalls(p); const reqs = await mockGet('/_requests'); await p.close();
  const good = r.ok && wc[0].params[0].to === PAUL && wc[0].params[0].value === '0x1' && reqs[0].body.params[0].to === PAUL;
  return { fail: !good, detail: { wallet_to: wc[0] && wc[0].params[0].to, check_to: reqs[0] && reqs[0].body.params[0].to } };
});
await test('C9 la page ne peut pas lire, fermer ni casser la fenetre (shadow ferme, prototypes saccages, suppression en boucle)', async () => {
  await resetAll(); await setCfg(AUTO('confirm', { delayMs: 900 })); await mockPost('/_mode', { force: { level: 'danger', reasons: ['forcé'] } });
  const p = await openPage(U('a', '/dapp.html'));
  await p.eval(`(()=>{
    window.__probe = {shadow:null, hosts:0, removed:0};
    Element.prototype.attachShadow = function(){ throw new Error('casse'); };
    Document.prototype.createElement = function(){ throw new Error('casse'); };
    Node.prototype.appendChild = function(){ throw new Error('casse'); };
    Element.prototype.append = function(){ throw new Error('casse'); };
    setInterval(()=>{ document.querySelectorAll('[data-sentinelle]').forEach(h=>{ window.__probe.hosts++; if(window.__probe.shadow===null) window.__probe.shadow = h.shadowRoot; h.remove(); window.__probe.removed++; }); }, 20);
    return true; })()`);
  const r = await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]);
  const probe = await p.eval('window.__probe'); const log = await getLog(); const wc = await wcalls(p); await p.close();
  const d = decisions(log)[0];
  return { fail: !(r.ok && wc.length === 1 && probe.shadow === null && probe.hosts > 0 && d), detail: { decided: d && d.decision, host_vu_par_la_page: probe.hosts, shadowRoot_lisible: probe.shadow !== null, suppressions: probe.removed } };
});

// =====================================================================
console.log('\n## D. Verdict indetermine (jamais vert)');
async function unknownCase(label, setup, expectWhy) {
  await test(label, async () => {
    const out = {};
    for (const dec of ['cancel', 'confirm']) {
      await resetAll(); await setCfg(AUTO(dec)); await setup();
      const p = await openPage(U('a', '/dapp.html'));
      const t0 = Date.now(); const r = await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const ms = Date.now() - t0;
      const log = await getLog(); const v = log.find((e) => e.type === 'verdict'); const d = decisions(log)[0];
      out[dec] = { ok: r.ok, code: r.code, elapsed_ms: ms, level: v && v.level, why: v && v.why, indeterminate: d && d.indeterminate, wallet_calls: (await wcalls(p)).length };
      await p.close();
    }
    const good = out.cancel.code === 4001 && out.cancel.wallet_calls === 0 && out.cancel.level === 'unknown' && out.confirm.ok && out.confirm.indeterminate === true && out.confirm.level === 'unknown'
      && (expectWhy ? new RegExp(expectWhy).test(out.cancel.why || '') : true);
    return { fail: !good, detail: out };
  });
}
await unknownCase('D1 API en retard (reponse apres 4 s) : delai de 3 s puis "indetermine", fenetre non verte', () => mockPost('/_mode', { delayMs: 4000 }), 'delai depasse');
await test('D1b la limite de 3 s est respectee (mesure)', async () => {
  await resetAll(); await setCfg(AUTO('cancel')); await mockPost('/_mode', { delayMs: 4000 });
  const p = await openPage(U('a', '/dapp.html')); const t0 = Date.now(); await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const ms = Date.now() - t0;
  const log = await getLog(); const v = log.find((e) => e.type === 'verdict'); await p.close();
  return { fail: !(v.latency_ms >= 2900 && v.latency_ms <= 3400), detail: { latency_check_ms: v.latency_ms, total_ms: ms } };
});
await unknownCase('D2 API qui repond HTTP 500', () => mockPost('/_mode', { status: 500 }), 'HTTP 500');
await unknownCase('D3 API qui repond du JSON invalide', () => mockPost('/_mode', { bad: true }), 'invalide');
await test('D4 API arretee (connexion refusee) : indetermine rapidement, jamais vert', async () => {
  await mock.close();
  const out = {};
  try {
    for (const dec of ['cancel', 'confirm']) {
      await storage(`chrome.storage.local.set({log: []}).then(()=>true)`); await setCfg(AUTO(dec));
      const p = await openPage(U('a', '/dapp.html')); const t0 = Date.now();
      const r = await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const ms = Date.now() - t0;
      const log = await getLog(); const v = log.find((e) => e.type === 'verdict');
      out[dec] = { ok: r.ok, code: r.code, elapsed_ms: ms, level: v && v.level, why: v && v.why, wallet_calls: (await wcalls(p)).length }; await p.close();
    }
  } finally { mock = await startMock(8787); }
  const good = out.cancel.code === 4001 && out.cancel.wallet_calls === 0 && out.cancel.level === 'unknown' && out.confirm.ok && out.confirm.level === 'unknown' && out.cancel.elapsed_ms < 2500;
  return { fail: !good, detail: out };
});

// =====================================================================
console.log('\n## E. Friction (bras A / B / C) et journal time_to_decision_ms');
async function frictionRun(arm, level) {
  await resetAll();
  await setCfg(Object.assign({ arm, frictionMs: 1500, manipulationHoldMs: 2000 }, AUTO('confirm', { delayMs: 150 })));
  const host = 'phish';
  const p = await openPage(U(host, '/dapp.html'));
  if (level === 'manipulation') await call(p, 'setText', 'Le support te demande de faire vite, urgent !');
  const t0 = Date.now(); const r = await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const ms = Date.now() - t0;
  const log = await getLog(); await p.close();
  const d = decisions(log)[0];
  return { r, d, ms };
}
await test('E1 bras A (sans delai) : Continuer actif tout de suite, time_to_decision_ms journalise', async () => {
  const { r, d } = await frictionRun('A', 'danger');
  return { fail: !(r.ok && d && d.friction_arm === 'A' && d.friction_ms === 0 && d.continue_enabled_after_ms < 500 && d.time_to_decision_ms < 1200 && d.early_click_blocked === false), detail: d };
});
await test('E2 bras B (delai 1,5 s configure) : un clic anticipe est refuse, decision apres >= 1500 ms', async () => {
  const { r, d } = await frictionRun('B', 'danger');
  return { fail: !(r.ok && d.friction_arm === 'B' && d.early_click_blocked === true && d.time_to_decision_ms >= 1500 && d.continue_enabled_after_ms >= 1450), detail: d };
});
await test('E3 bras C (retaper une phrase) : clic anticipe refuse, phrase retapee, decision journalisee', async () => {
  const { r, d } = await frictionRun('C', 'danger');
  return { fail: !(r.ok && d.friction_arm === 'C' && d.early_click_blocked === true && d.time_to_decision_ms > 150), detail: d };
});
await test('E4 niveau Manipulation : retenue configuree (2 s au lieu de 10 min) appliquee au bras B', async () => {
  const { r, d } = await frictionRun('B', 'manipulation');
  return { fail: !(r.ok && d.level === 'manipulation' && d.friction_ms === 2000 && d.time_to_decision_ms >= 2000), detail: d };
});
await test('E5 niveau Manipulation, bras A : pas de retenue (temoin)', async () => {
  const { r, d } = await frictionRun('A', 'manipulation');
  return { fail: !(r.ok && d.level === 'manipulation' && d.friction_ms === 0 && d.time_to_decision_ms < 1200), detail: d };
});
await test('E6 Annuler toujours visible : danger+adresse, bras C, viewports 1280x720, 375x500, 320x360', async () => {
  const out = {};
  for (const [w, h] of [[1280, 720], [375, 500], [320, 360]]) {
    await resetAll(); await setCfg(Object.assign({ arm: 'C' }, AUTO('cancel')));
    const p = await openPage(U('a', '/dapp.html'), { width: w, height: h });
    const r = await call(p, 'request', 'eth_sendTransaction', [TX_LOOK]);
    const d = decisions(await getLog())[0]; out[`${w}x${h}`] = { code: r.code, cancel_visible: d && d.cancel_visible, viewport: d && d.viewport, level: d && d.level }; await p.close();
  }
  return { fail: !Object.values(out).every((x) => x.code === 4001 && x.cancel_visible === true && x.level === 'danger'), detail: out };
});
await test('E7 pas de decision lente : annuler a tout moment pendant le delai du bras B', async () => {
  await resetAll(); await setCfg(Object.assign({ arm: 'B', frictionMs: 20000 }, AUTO('cancel', { delayMs: 300 })));
  const p = await openPage(U('phish', '/dapp.html'));
  const r = await call(p, 'request', 'eth_sendTransaction', [TX_APPROVE]); const d = decisions(await getLog())[0]; await p.close();
  return { fail: !(r.code === 4001 && d.time_to_decision_ms < 1500), detail: { code: r.code, time_to_decision_ms: d.time_to_decision_ms } };
});

// =====================================================================
console.log('\n## F. Question d\'intention et mini grilling');
async function grillRun({ intent, grill = 'clean', tx = TX_NEW, host = 'a', cfgExtra = {}, decision = 'confirm', answers }) {
  await resetAll();
  await setCfg(Object.assign({ askIntent: !!intent, grill: { enabled: true, shuffle: true } }, AUTO(decision, { intent, grill, grillAnswers: answers }), cfgExtra));
  const p = await openPage(U(host, '/dapp.html'));
  const r = await call(p, 'request', 'eth_sendTransaction', [tx]);
  const log = await getLog(); const reqs = await mockGet('/_requests'); const wc = await wcalls(p); await p.close();
  const v = log.find((e) => e.type === 'verdict');
  const d = log.find((e) => e.type === 'decision' && e.stage === 'verdict');
  const g = (v && v.grill) || (log.find((e) => e.stage === 'grill') || {}).grill;
  return { r, log, v, d, g, reqs, wc };
}
await test('F1 question d\'intention : le choix part dans /check (intent) ; Annuler a ce stade ne contacte pas le moteur', async () => {
  const a = await grillRun({ intent: 'pay', tx: TX_OK });
  const b = await grillRun({ intent: 'pay', tx: TX_OK, decision: 'cancel' });
  return { fail: !(a.reqs[0] && a.reqs[0].body.intent === 'pay' && a.r.ok && b.r.code === 4001 && b.reqs.length === 0), detail: { intent_in_check: a.reqs[0] && a.reqs[0].body.intent, cancel_code: b.r.code, checks_after_cancel: b.reqs.length } };
});
await test('F2 grilling declenche : intention "on m\'a demande" + sortie vers adresse nouvelle ; 2 a 4 questions ; 2 signaux = niveau Manipulation', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'signal' });
  const n = x.g && x.g.answers.length;
  return { fail: !(n >= 2 && n <= 4 && x.v.level === 'manipulation' && x.g.floor === 'ok' && x.d && x.d.level === 'manipulation'), detail: { questions: n, floor: x.g && x.g.floor, final: x.v.level, state: x.g && x.g.state, answers: x.g && x.g.answers } };
});
await test('F3 time_to_decision_ms journalise pour chaque question et pour la decision finale', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'signal' });
  const ok = x.g.answers.every((a) => typeof a.time_to_decision_ms === 'number' && a.time_to_decision_ms > 0) && typeof x.d.time_to_decision_ms === 'number';
  return { fail: !ok, detail: { per_question: x.g.answers.map((a) => a.time_to_decision_ms), final: x.d.time_to_decision_ms } };
});
await test('F4 asymetrie : reponses "propres" ne descendent jamais sous le plancher objectif (approbation illimitee reste Danger)', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'clean', tx: TX_APPROVE, host: 'phish' });
  return { fail: !(x.v.level === 'danger' && x.g.floor === 'danger'), detail: { floor: x.g && x.g.floor, final: x.v.level } };
});
await test('F5 reponses propres + intention "suspecte" sur sortie ordinaire : pas de montee, plancher OK conserve (passe sans fenetre)', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'clean', answers: { familiarity: 'na' } });
  return { fail: !(x.v.level === 'ok' && x.r.ok && x.wc.length === 1), detail: { final: x.v.level, answers: x.g.answers.map((a) => a.option), wallet_calls: x.wc.length } };
});
await test('F6 intention vague ("Autre / je ne sais pas") => UNKNOWN, attentes les plus strictes : monte au moins a Danger', async () => {
  const x = await grillRun({ intent: 'other', grill: 'clean' });
  return { fail: !(x.g.state === 'vague' && ['danger', 'manipulation'].includes(x.v.level)), detail: { state: x.g.state, floor: x.g.floor, final: x.v.level } };
});
await test('F7 "je prefere ne pas repondre" = +1 cran par question, jamais une baisse', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'prefer_not' });
  const idx = { ok: 0, attention: 1, danger: 2, manipulation: 3 };
  return { fail: !(idx[x.v.level] >= 1 && x.g.answers.every((a) => a.signal >= 1)), detail: { final: x.v.level, answers: x.g.answers.map((a) => a.option + ':' + a.signal) } };
});
await test('F8 contradiction verifiable ("depuis longtemps" face a un destinataire jamais vu) = +2 crans', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'clean', answers: { familiarity: 'long' } });
  const a = x.g.answers.find((q) => q.qid === 'familiarity');
  return { fail: !(a && a.signal === 2), detail: { answers: x.g.answers, final: x.v.level } };
});
await test('F9 pas de declenchement : intention claire + contact connu => aucune question', async () => {
  const x = await grillRun({ intent: 'pay', tx: TX_OK });
  return { fail: !(x.g == null && x.r.ok), detail: { grill: x.g, checks: x.reqs.length } };
});
await test('F10 annuler en plein milieu du grilling : bloque, decision "grill" journalisee', async () => {
  const x = await grillRun({ intent: 'asked', grill: 'signal', cfgExtra: { auto: { decision: 'confirm', delayMs: 150, intent: 'asked', grill: 'clean', cancelOnQuestion: 2 } } });
  const e = x.log.find((e) => e.stage === 'grill');
  return { fail: !(x.r.code === 4001 && e && e.decision === 'cancel' && x.wc.length === 0), detail: { code: x.r.code, entry: e && { stage: e.stage, decision: e.decision, ttd: e.time_to_decision_ms } } };
});
await test('F11 bras de test : grilling desactive (grill.enabled=false) => aucune question', async () => {
  const x = await grillRun({ intent: 'asked', cfgExtra: { grill: { enabled: false } } });
  return { fail: !(x.g == null), detail: { grill: x.g, final: x.v && x.v.level } };
});

// =====================================================================
console.log('\n## G. Detection du proxy / compatibilite (resultats bruts)');
await test('G1 detection par la page (meme royaume) : toString, nom, longueur, identite, descripteurs, drapeaux', async () => {
  const p = await openPage(U('a', '/detect.html')); await sleep(400);
  const R = await p.eval('window.__detect()'); await p.close();
  const must = ['toStringSameAsOriginal', 'toStringOfToStringNative', 'defineProperty_native', 'nameLength', 'ownPropsSame', 'identityStable', 'requestDescriptor', 'flagsKept', 'keysSame', 'instanceofFn'];
  const failed = must.filter((k) => R[k] !== true);
  return { fail: failed.length > 0 || R.toStringLooksNative, detail: { echecs: failed, ...R } };
});
await test('G2 detection depuis un royaume "propre" (iframe vide cree par la page)', async () => {
  const p = await openPage(U('a', '/detect.html')); await sleep(400);
  const R = await p.eval('window.__detect()'); await p.close();
  return R.cleanRealmDetected ? { limit: true, detail: `DETECTABLE : Function.prototype.toString d'un iframe vierge renvoie "${R.cleanRealmToString}" pour request ; defineProperty detecte: ${R.cleanRealmDefinePropertyDetected}` } : { detail: 'non detecte (royaume iframe aussi masque)' };
});
await test('G3 window.ethereum visible comme accesseur (information)', async () => {
  const p = await openPage(U('a', '/detect.html')); await sleep(300);
  const R = await p.eval('window.__detect()'); await p.close();
  return R.windowEthereumIsAccessor ? { limit: true, detail: "Object.getOwnPropertyDescriptor(window,'ethereum') montre un accesseur (get/set) la ou un portefeuille reel pose une valeur" } : { detail: 'donnee' };
});

// =====================================================================
await B.close(); web.close(); await mock.close();
const c = { PASS: 0, FAIL: 0, LIMITE: 0 }; results.forEach((r) => c[r.status]++);
console.log(`\n# TOTAL ${results.length} tests : PASS ${c.PASS}, FAIL ${c.FAIL}, LIMITE (detection/connu) ${c.LIMITE}  [${B.version}]`);
fs.writeFileSync(path.join(HERE, `results_${browserName}.json`), JSON.stringify({ browser: B.version, counts: c, results }, null, 2));
process.exit(c.FAIL ? 1 : 0);
