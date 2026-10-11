// Panneau latéral (ui/sidepanel.*) : rendu avec une fausse chrome, effacement, aucune phrase écrite ni adresse dans le stockage.
// Run : node --test extension/tests/unit/sidepanel.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeChrome, fakeClock, load, DIR } from './fake_chrome.mjs';

const SRC = readFileSync(join(DIR, 'ui', 'sidepanel.js'), 'utf8');
function dom() {
  const mk = (tag) => { const e = { tag, children: [], attrs: {}, listeners: {}, className: '', textContent: '',
    appendChild(c) { e.children.push(c); return c; }, removeChild(c) { e.children.splice(e.children.indexOf(c), 1); },
    setAttribute(k, v) { e.attrs[k] = String(v); }, addEventListener(t, f) { (e.listeners[t] = e.listeners[t] || []).push(f); } };
    Object.defineProperty(e, 'firstChild', { get: () => e.children[0] || null }); return e; };
  const all = (e, out = []) => { out.push(e); for (const c of e.children) all(c, out); return out; };
  return { document: { createElement: mk }, mk, all };
}
const NOW = new Date(2026, 9, 11, 15, 30).getTime();
function panel({ log = [], manifest = { version: '0.3.0', content_security_policy: { extension_pages: "script-src 'self'; connect-src 'none'" } }, alive = true } = {}) {
  const F = makeChrome(); F.state.local.log = log;
  const chrome = Object.assign({}, F.chrome);
  chrome.runtime = Object.assign({}, F.chrome.runtime, { getManifest: () => manifest, sendMessage: async () => { if (!alive) throw new Error('worker absent'); return { state: 'unknown' }; }, openOptionsPage: () => { chrome.opened = true; } });
  const D = dom(), sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const root = D.mk('main');
  const p = sb.HoldupPanel.mount(D.document, root, { chrome, now: () => NOW });
  return { F, chrome, root, D, p, P: sb.HoldupPanel, texts: () => D.all(root).map((e) => e.textContent).filter(Boolean), buttons: () => D.all(root).filter((e) => e.tag === 'button') };
}
const dec = (n, over = {}) => Object.assign({ type: 'decision', stage: 'verdict', decision: 'confirm', origin: 'https://app' + n + '.example.org', method: 'eth_sendTransaction', level: 'attention', ts: NOW - n * 60000 }, over);

test('state, version, offline line (standalone), counters, how it works, the two controls', async () => {
  const log = [{ type: 'verdict', ts: NOW - 1000 }, { type: 'verdict', ts: NOW - 2000 }, { type: 'verdict', ts: NOW - 86400000 * 2 }, dec(1, { decision: 'cancel', level: 'danger' }), dec(2), { type: 'journal', ts: NOW }];
  const t = panel({ log }); await t.p.render();
  const tx = t.texts();
  assert.ok(tx.includes('Hold up est actif.'));
  assert.ok(tx.includes('Version 0.3.0 · Aucune connexion réseau'));
  assert.ok(tx.includes('2 demandes vérifiées, 1 annulée.'), 'verified today, cancelled today, with the plural agreed');
  assert.equal(t.P.plural(1, 'demande vérifiée', 'demandes vérifiées'), '1 demande vérifiée');
  assert.equal(tx.filter((x) => /^(Un site demande|Tu écris|Tu continues)/.test(x)).length, 3, 'three lines "Comment ça marche"');
  assert.deepEqual(t.buttons().map((b) => b.textContent), ['Exporter le journal', 'Ouvrir les réglages', 'Effacer l’historique']);
  assert.ok(tx.includes('Transaction · Ne correspondait pas. Annulée. · 15:29'));
  assert.ok(tx.includes('Transaction · Correspondait. Continuée. · 15:28'));
  assert.ok(!tx.some((x) => /Danger|Manipulation|Attention|.mjs|JSON|fournisseur/.test(x)), 'no level name, no developer word : ' + tx.join(' | '));
  assert.ok(!tx.some((x) => /\bOK\b|sûr\b/.test(x.replace('que c’est sûr', ''))), 'never a green OK');
  t.buttons()[1].listeners.click[0](); assert.equal(t.chrome.opened, true);
});
test('inactive when the worker does not answer ; server build shows no "Aucune connexion réseau"', async () => {
  const t = panel({ alive: false, manifest: { version: '0.2.0', content_security_policy: { extension_pages: "connect-src http://127.0.0.1:8787" } } }); await t.p.render();
  assert.ok(t.texts().includes('Hold up est inactif.')); assert.ok(t.texts().includes('Version 0.2.0'));
});
test('at most 20 requests, newest first ; the site is cut in the middle, never the real domain', async () => {
  const log = Array.from({ length: 30 }, (_, i) => dec(i + 1)).reverse();
  log.push(dec(0, { origin: 'https://app.uniswap.org.' + 'x'.repeat(80) + '.evil.example' }));
  const t = panel({ log }); await t.p.render();
  const sites = t.D.all(t.root).filter((e) => e.className === 'site').map((e) => e.textContent);
  assert.equal(sites.length, 20);
  assert.ok(sites[0].endsWith('evil.example') && sites[0].includes('…') && sites[0].length <= 41, sites[0]);
  assert.equal(t.P.siteLabel('https://app.uniswap.org'), 'app.uniswap.org');
  assert.equal(t.P.siteLabel('null'), 'null');
});
test('"Effacer l’historique" removes the journal and the list is empty', async () => {
  const t = panel({ log: [dec(1), dec(2)] }); await t.p.render();
  assert.equal(t.D.all(t.root).filter((e) => e.className === 'site').length, 2);
  await t.buttons()[2].listeners.click[0]();
  assert.equal(t.F.state.local.log.length, 2, 'the first click only asks');
  assert.equal(t.buttons()[2].textContent, 'Effacer pour de bon ?');
  await t.buttons()[2].listeners.click[0]();
  assert.equal(t.F.state.local.log, undefined);
  assert.ok(t.texts().includes('Aucune demande pour l’instant.'));
});
test('page data is only ever text : a hostile origin or method never becomes markup', async () => {
  const t = panel({ log: [dec(1, { origin: 'https://<img src=x onerror=alert(1)>.example', method: '<script>x</script>' })] }); await t.p.render();
  assert.ok(!SRC.includes('innerHTML') && !SRC.includes('insertAdjacentHTML') && !SRC.includes('outerHTML'));
  assert.ok(t.texts().some((x) => x.startsWith('Autre demande')));
});

test('after a real request, the stored journal holds neither the written sentence nor a full address ; the panel shows the decision', async () => {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  const { createGatekeeper } = await load('gatekeeper.js');
  const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), BOB = '0x' + 'b2'.repeat(20);
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [], tokens: [{ address: TOKEN, symbol: 'USDC', decimals: 6 }] } });
  createGatekeeper({ check: async () => ({ level: 'attention', texts: { croit: 'a', reel: 'x', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: false, funds_out: true }, risk_signals: [] }),
    classify: async () => ({ source: 'clef', model: true, kind: 'pay_someone', confidence: 0.95, facts: { asked: 0.02, receive: 0.02, grant: 0.02 } }) });
  const rid = 'rid-panel-0001', page = F.page(9, 'https://shop.example');
  const SENTENCE = 'payer 20 USDC à ' + BOB;
  const data = '0xa9059cbb' + BOB.slice(2).padStart(64, '0') + (20000000).toString(16).padStart(64, '0');
  await F.send({ type: 'gate', rid, payload: { kind: 'gate', method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data }], chainId: '0x1', from: ME } }, page);
  let wid = null; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) wid = id;
  const win = F.win(wid, rid);
  clock.advance(1000); await F.send({ type: 'hu.decision', rid, seq: 1, decision: 'answer', text: SENTENCE }, win);
  clock.advance(2000); await F.send({ type: 'hu.decision', rid, seq: 2, decision: 'cancel' }, win);
  const stored = JSON.stringify(F.state.local.log);
  assert.ok(F.state.local.log.length >= 2);
  assert.ok(!stored.includes('payer 20 USDC'), 'the written sentence is not in the journal');
  assert.ok(!stored.toLowerCase().includes(BOB.slice(2).toLowerCase()) && !stored.toLowerCase().includes(ME.slice(2).toLowerCase()), 'no address in the journal');
  const D = dom(), sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const root = D.mk('main'); const chrome2 = Object.assign({}, F.chrome, { runtime: Object.assign({}, F.chrome.runtime, { getManifest: () => ({ version: '0.3.0' }), sendMessage: async () => ({ state: 'unknown' }) }) });
  await sb.HoldupPanel.mount(D.document, root, { chrome: chrome2, now: () => Date.now() }).render();
  const tx = D.all(root).map((e) => e.textContent).filter(Boolean);
  assert.ok(tx.some((x) => /^Transaction .*Annulée/.test(x)), tx.join(' | '));
  assert.ok(tx.includes('shop.example'));
  assert.ok(!JSON.stringify(tx).includes('payer 20 USDC'));
  clock.restore(); delete globalThis.chrome;
});

test('manifests and files : sidePanel permission, Chrome 114, panel files, no network in the standalone CSP', () => {
  for (const mf of [JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'))]) {
    assert.ok(mf.permissions.includes('sidePanel')); assert.equal(mf.minimum_chrome_version, '114'); assert.equal(mf.side_panel.default_path, 'ui/sidepanel.html');
  }
  const html = readFileSync(join(DIR, 'ui', 'sidepanel.html'), 'utf8');
  assert.ok(/<script src="sidepanel\.js"><\/script>/.test(html) && !/<script>[^<]/.test(html) && !/\son[a-z]+=/.test(html));
  const css = readFileSync(join(DIR, 'ui', 'sidepanel.css'), 'utf8');
  assert.ok(!/gradient|box-shadow:\s*[^0n]|emoji/i.test(css.replace(/box-shadow:\s*none/g, '')));
});

test('S10 : a page where the provider could not be wrapped is said in the panel and written in the journal and the chain', async () => {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  const { createGatekeeper } = await load('gatekeeper.js');
  createGatekeeper({ check: async () => ({ level: 'attention', texts: {}, reasons: [], effects: {}, risk_signals: [] }) });
  const page = F.page(11, 'https://shop.example');
  const r = await F.send({ type: 'gate', rid: 'rid-partial-001', payload: { kind: 'journal', method: 'interception_partielle' } }, page);
  assert.equal(r.done, true);
  assert.ok(F.state.local.partial['shop.example'] > 0);
  assert.ok(F.state.local.log.some((e) => e.type === 'partial')); assert.ok(F.state.local.chain.entries.some((e) => e.type === 'partial'));
  const t = panel({ log: [] }); t.F.state.local.partial = F.state.local.partial;
  const chrome2 = t.chrome; chrome2.storage = F.chrome.storage;
  const D = dom(), sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const root = D.mk('main'); await sb.HoldupPanel.mount(D.document, root, { chrome: chrome2, now: () => Date.now() }).render();
  assert.ok(D.all(root).some((e) => /^Interception partielle : sur shop\.example/.test(e.textContent)));
  clock.restore(); delete globalThis.chrome;
});
