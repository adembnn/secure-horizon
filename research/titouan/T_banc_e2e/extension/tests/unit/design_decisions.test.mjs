// Founder's decisions of 11 Oct. that came with the design system (docs/design/system) : a real application (welcome page, toolbar
// popup, badge, pause per site), targeted follow-up questions, "Ce que j'ai compris" read with the code of the check, the discreet
// line "Compris par …", the detection time. Fake chrome, no browser, no network. Run : node --test extension/tests/unit/*.test.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { makeChrome, fakeClock, load, DIR, EXT_URL, EXT_ID } from './fake_chrome.mjs';

const { createGatekeeper, askOf } = await load('gatekeeper.js');
const I = await load('intent_text.js');
const SITE = 'https://echange.exemple.org', OTHER = 'https://autre.exemple.org';
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), ROUTER = '0x' + 'd4'.repeat(20);
const pad = (x) => (typeof x === 'bigint' ? x.toString(16) : String(x).slice(2)).padStart(64, '0');
const approve = (amount) => ({ method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data: '0x095ea7b3' + pad(ROUTER) + pad(amount) }], chainId: '0xa86a', from: ME });

let F, clock, badge, created, installed, n = 0;
beforeEach(() => {
  clock = fakeClock(); F = makeChrome(); badge = []; created = []; installed = [];
  // what the real browser has and the shared fake does not : the toolbar icon, tabs.create, onInstalled
  F.chrome.action = { setBadgeText: (o) => { badge.push(o); }, setBadgeBackgroundColor: (o) => { badge.push({ bg: o.color }); }, setBadgeTextColor: (o) => { badge.push({ ink: o.color }); }, setTitle: () => {} };
  F.chrome.tabs.create = (o) => { created.push(o); };
  F.chrome.runtime.onInstalled = { addListener: (fn) => installed.push(fn) };
  F.chrome.runtime.getManifest = () => ({ version: '9.9.9' });
  globalThis.chrome = F.chrome;
});
afterEach(() => { clock.restore(); delete globalThis.chrome; });
const worker = () => createGatekeeper({ closeMs: 0, check: async () => ({ level: 'attention', texts: { reel: 'Ligne du moteur.' }, reasons: [], risk_signals: [], effects: { grants_right: true, funds_out: false } }) });
const gate = (payload, origin = SITE, tab = 7) => F.send({ type: 'gate', rid: 'rid-dsn-' + String(++n).padStart(6, '0'), payload: Object.assign({ kind: 'gate' }, payload) }, F.page(tab, origin));
const extPage = (file) => ({ id: EXT_ID, url: EXT_URL + file, origin: EXT_URL.slice(0, -1) });

test('pause per site : a paused origin goes straight to the wallet with no window, it is written in the journal, and another site is still held', async () => {
  worker();
  await F.chrome.storage.local.set({ paused: [SITE] });
  const r = await gate(approve(2n ** 256n - 1n));
  assert.deepEqual(r, { done: true, allow: true }); assert.equal(F.state.windows.size, 0, 'no window for a paused site');
  const j = F.state.local.log.filter((e) => e.type === 'decision' && e.decision === 'paused');
  assert.equal(j.length, 1); assert.equal(j[0].origin, SITE); assert.equal(F.state.local.chain.entries.find((e) => e.d === 'paused').by, 'auto', 'never written as a human confirmation');
  await gate(approve(1n)); assert.equal(F.state.local.log.filter((e) => e.decision === 'paused').length, 1, 'one line per origin and method every 10 s');
  const o = await gate(approve(50n), OTHER, 8);
  assert.deepEqual(o, { pending: true }); assert.equal(F.state.windows.size, 1, 'the other site is held as usual');
  // the pause is lifted : held again
  await F.chrome.storage.local.set({ paused: [] });
  assert.deepEqual(await gate(approve(50n), SITE, 9), { pending: true });
});

test('badge : white with black text, "II" on a tab whose site is paused, nothing otherwise ; only an extension page may ask for it', async () => {
  worker();
  assert.ok(badge.some((b) => b.bg === '#ffffff') && badge.some((b) => b.ink === '#000000'));
  await F.chrome.storage.local.set({ paused: [SITE] });
  await F.send({ type: 'hu.page' }, F.page(7, SITE));
  assert.deepEqual(badge.filter((b) => 'text' in b).pop(), { text: 'II', tabId: 7 });
  await F.send({ type: 'hu.page' }, F.page(8, OTHER));
  assert.deepEqual(badge.filter((b) => 'text' in b).pop(), { text: '', tabId: 8 });
  // the popup lifts the pause and tells the worker
  await F.chrome.storage.local.set({ paused: [] });
  assert.deepEqual(await F.send({ type: 'hu.badge', tabId: 7, origin: SITE }, extPage('popup.html')), { ok: true });
  assert.deepEqual(badge.filter((b) => 'text' in b).pop(), { text: '', tabId: 7 });
  const before = badge.length;
  assert.deepEqual(await F.send({ type: 'hu.badge', tabId: 7, origin: SITE }, F.page(7, SITE)), { ok: false }, 'a page cannot drive the badge');
  assert.equal(badge.length, before);
});

test('real application : welcome page on first install only ; popup declared, so the panel opens from the popup (Chrome 116)', () => {
  worker();
  assert.equal(installed.length, 1);
  installed[0]({ reason: 'update' }); installed[0]({ reason: 'chrome_update' }); assert.deepEqual(created, []);
  installed[0]({ reason: 'install' }); assert.deepEqual(created, [{ url: EXT_URL + 'welcome.html' }]);
  const mf = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'));
  assert.equal(mf.action.default_popup, 'popup.html'); assert.equal(mf.minimum_chrome_version, '116');
  assert.ok(mf.permissions.includes('activeTab') && mf.permissions.includes('sidePanel') && !mf.permissions.includes('tabs'));
  assert.ok(!JSON.stringify(mf.web_accessible_resources || []).includes('welcome'), 'the welcome page is not exposed to sites');
  for (const f of ['popup.html', 'popup.js', 'welcome.html', 'welcome.js', 'icons/icon16.png', 'icons/icon48.png', 'ui/tokens.css', 'ui/components.css', 'ui/motion.css']) assert.ok(existsSync(join(DIR, f)), f);
  const bg = readFileSync(join(DIR, 'background.js'), 'utf8');
  assert.ok(/openPanelOnActionClick: false/.test(bg) && !/openPanelOnActionClick: true/.test(bg), 'a declared popup takes the click : the panel is opened by chrome.sidePanel.open');
  assert.match(readFileSync(join(DIR, 'popup.js'), 'utf8'), /sidePanel\.open\(/);
});

test('one follow-up, about the one thing that is missing : Combien, Quelle monnaie, À quelle adresse, Contre quoi', async () => {
  const intent = async (text) => Object.assign(I.interpret(await I.keywordClassify(text), text), { text });
  let it = await intent('échanger des USDC contre AVAX');
  assert.deepEqual(askOf(it, it.text, 'x'), { title: 'Combien ?', missing: 'much' });
  it = await intent('échanger 50 contre AVAX');
  assert.deepEqual(askOf(it, it.text, 'x'), { title: 'Quelle monnaie ?', missing: 'much', label: '50 de quoi' });
  it = await intent('payer 20 USDC à Léa');
  assert.equal(it.clear, true); assert.deepEqual(askOf(it, it.text, 'x'), { title: 'À quelle adresse ?', missing: 'other' });
  it = await intent('échanger 50 USDC');
  assert.deepEqual(askOf(it, it.text, 'x'), { title: 'Contre quoi ?', missing: 'other' });
  assert.equal(askOf({ clear: false }, 'bonjour', 'x').title, 'Que veux-tu faire, et pour combien ?');
  // in the window : the follow-up screen carries the title, the first sentence, the missing place, and an empty field ; asked once
  worker();
  const rid = 'rid-dsn-ask-0001', page = F.page(7, SITE);
  await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, approve(50n * 10n ** 6n)) }, page);
  const win = F.win(F.state.session['hu:req:' + rid].windowId, rid);
  let v = (await F.send({ type: 'hu.view', rid }, win)).view;
  assert.deepEqual(Object.keys(v.screen).sort(), ['kind', 'max', 'placeholder', 'site', 'title']);
  assert.equal(v.screen.title, 'Que veux-tu faire ?'); assert.equal(v.screen.site, 'echange.exemple.org');
  clock.advance(1000);
  v = (await F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text: 'échanger des USDC contre AVAX' }, win)).view;
  assert.equal(v.screen.kind, 'question'); assert.equal(v.screen.title, 'Combien ?'); assert.equal(v.screen.first, 'échanger des USDC contre AVAX');
  assert.equal(v.screen.missing, 'much'); assert.equal(v.screen.placeholder, '');
  clock.advance(1000);
  v = (await F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text: 'beaucoup' }, win)).view;
  assert.equal(v.screen.kind, 'answer', 'never a second follow-up'); assert.notEqual(v.screen.outcome, 'match');
});

test('"Ce que j’ai compris" : read with the code of the check (extractFields, keyword classifier), three fixed places', async () => {
  const ctx = { window: { HoldupFields: I.extractFields }, document: {}, setTimeout, clearTimeout, setInterval, clearInterval, Date };
  ctx.globalThis = ctx.window;
  vm.runInNewContext(readFileSync(join(DIR, 'ui', 'screen.js'), 'utf8'), ctx);
  const U = ctx.window.HoldupScreen.understood;
  const kind = async (t) => { const r = await I.keywordClassify(t); return I.KINDS.includes(r.kind) ? r.kind : null; };
  let t = 'échanger 50 USDC contre AVAX';
  assert.deepEqual({ ...U(t, await kind(t)) }, { what: 'échanger', much: '50 USDC', other: 'contre AVAX', otherLabel: 'contre quoi', off: false });
  t = 'échanger 50 USDC';
  assert.deepEqual({ ...U(t, await kind(t)) }, { what: 'échanger', much: '50 USDC', other: '', otherLabel: 'contre quoi', off: false });
  t = 'payer 20 USDC à 0x' + 'b2'.repeat(20);
  { const u = U(t, await kind(t)); assert.equal(u.what, 'payer'); assert.equal(u.much, '20 USDC'); assert.equal(u.other, '0xb2b2…b2b2'); assert.equal(u.otherLabel, 'à qui'); }
  t = 'me connecter';
  assert.equal(U(t, await kind(t)).off, true, 'a connection : the two other places stay, unseen');
  assert.deepEqual({ ...U('', null) }, { what: '', much: '', other: '', otherLabel: 'à qui', off: false });
  // the window page wires both readers, read only ; a short pause in the typing before reading
  const fields = readFileSync(join(DIR, 'ui', 'fields.js'), 'utf8');
  assert.match(fields, /import \{[^}]*extractFields[^}]*keywordClassify[^}]*\} from '\.\.\/intent_text\.js'/);
  assert.equal(ctx.window.HoldupScreen.TIMING.type, 150);
});

test('the discreet line "Compris par Clef en … s" carries the latency really measured ; without a model : "Compris sans modèle" ; detection time on the screen and in the journal', async () => {
  const run = async (classify) => {
    const F2 = makeChrome(); globalThis.chrome = F2.chrome; F2.chrome.runtime.getManifest = () => ({ version: '9.9.9' });
    createGatekeeper({ closeMs: 0, classify, check: async () => ({ level: 'attention', texts: { reel: 'Ligne du moteur.' }, reasons: [], risk_signals: [], effects: { grants_right: true, funds_out: false } }) });
    const rid = 'rid-dsn-read-' + String(++n).padStart(4, '0');
    await F2.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, approve(50n * 10n ** 6n)) }, F2.page(7, SITE));
    const win = F2.win(F2.state.session['hu:req:' + rid].windowId, rid);
    const v = (await F2.send({ type: 'hu.view', rid }, win)).view;
    clock.advance(1500);
    return { screen: (await F2.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text: 'échanger 50 USDC contre AVAX' }, win)).view.screen, log: F2.state.local.log };
  };
  // the relay answers after 420 ms of the (fake) clock
  let r = await run(async () => { clock.advance(420); return { source: 'clef', model: true, kind: 'buy_or_swap', confidence: 0.9, facts: {} }; });
  assert.deepEqual(r.screen.read, { by: 'clef', ms: 420 });
  assert.equal(r.screen.detectMs, 1920, 'request received -> answer shown');
  assert.ok(r.log.some((e) => e.type === 'verdict' && e.detect_ms === 1920 && e.read_ms === 420));
  r = await run(async () => { clock.advance(80); return { source: 'clef', model: true, kind: 'buy_or_swap', confidence: 0.9, facts: {} }; });
  assert.equal(r.screen.read.ms, 80, 'never a fixed value');
  r = await run(null);
  assert.deepEqual(r.screen.read, { by: null, ms: null });
  r = await run(async () => { throw new Error('relais arrêté'); });
  assert.deepEqual(r.screen.read, { by: null, ms: null });
  const T = (() => { const ctx = { window: {}, document: {} }; vm.runInNewContext(readFileSync(join(DIR, 'ui', 'screen.js'), 'utf8'), ctx); return ctx.window.HoldupScreen.TEXT; })();
  assert.equal(T.readBy({ by: 'clef', ms: 420 }), 'Compris par Clef en 0,4 s'); assert.equal(T.readBy({ by: null, ms: null }), 'Compris sans modèle');
});
