// Panneau latéral (ui/sidepanel.*) : rendu avec une fausse chrome, effacement, aucune phrase écrite ni adresse dans le stockage.
// Run : node --test extension/tests/unit/sidepanel.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
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

const cls = (t, c) => t.D.all(t.root).filter((e) => (' ' + e.className + ' ').includes(' ' + c + ' '));
test('header, sections and footer ; the version, counters, "Comment ça marche", chain sentence and offline line are gone', async () => {
  const log = [{ type: 'verdict', ts: NOW - 1000 }, dec(1, { decision: 'cancel', level: 'danger' }), dec(2), { type: 'journal', ts: NOW }];
  const t = panel({ log }); await t.p.render();
  const tx = t.texts();
  assert.deepEqual(cls(t, 'hu-top')[0].children.map((c) => c.textContent), ['Hold up', 'Actif']);
  assert.equal(t.root.className.includes('hu-panel'), true);
  assert.equal(cls(t, 'hu-scroll')[0].attrs['aria-label'], 'Journal');
  assert.ok(tx.includes('Ce que tu as laissé ouvert') && tx.includes('Tu n’as rien laissé ouvert sur cet onglet.') && tx.includes('Aujourd’hui'));
  assert.deepEqual(t.buttons().map((b) => b.textContent), ['Effacer le journal', 'Réglages', 'Exporter le journal']);
  assert.ok(tx.includes('Ça correspondait.'));
  assert.ok(tx.includes(' Tu n’as rien envoyé.') && tx.includes('Ça ne correspondait pas.'));
  assert.ok(!tx.some((x) => /Version|Aucune connexion|demandes? vérifiée|Comment ça marche|Un site demande|Tu écris|Tu continues|journal garde|Droits? accordé|Révoquer|historique|jeton|Continuer/i.test(x)), tx.join(' | '));
  assert.ok(!tx.some((x) => /Danger|Manipulation|Attention|.mjs|JSON|fournisseur|\bOK\b/.test(x)));
  t.buttons()[1].listeners.click[0](); assert.equal(t.chrome.opened, true);
});
test('inactive when the worker does not answer ; empty state without a link to a test page', async () => {
  const t = panel({ alive: false }); await t.p.render();
  assert.deepEqual(cls(t, 'hu-top')[0].children.map((c) => c.textContent), ['Hold up', 'Inactif']);
  assert.ok(t.texts().includes('Rien à raconter pour l’instant.') && t.texts().some((x) => x.startsWith('Dès qu’un site veut utiliser ton portefeuille')));
  assert.deepEqual(t.buttons().map((b) => b.textContent), ['Réglages']);
});
test('at most 20 requests, newest first ; the site is cut in the middle, never the real domain', async () => {
  const log = Array.from({ length: 30 }, (_, i) => dec(i + 1)).reverse();
  log.push(dec(0, { origin: 'https://app.uniswap.org.' + 'x'.repeat(80) + '.evil.example' }));
  const t = panel({ log }); await t.p.render();
  const sites = cls(t, 'hu-entry-site').map((e) => e.textContent);
  assert.equal(sites.length, 20);
  assert.ok(sites[0].endsWith('evil.example') && sites[0].includes('…') && sites[0].length <= 41, sites[0]);
  assert.equal(t.P.siteLabel('https://app.uniswap.org'), 'app.uniswap.org');
  assert.equal(t.P.siteLabel('null'), 'null');
});
test('the journal is grouped by day (Aujourd’hui, Hier, then the date), newest first', async () => {
  const D = (d, h) => new Date(2026, 9, d, h, 5).getTime();
  const log = [dec(1, { ts: D(8, 9) }), dec(2, { ts: D(10, 18) }), dec(3, { ts: D(11, 14) }), dec(4, { ts: D(11, 15) })];
  const s = panel({ log }).P.summarize(log, NOW);
  assert.deepEqual(JSON.parse(JSON.stringify(s.days.map((d) => [d.label, d.rows.length]))), [['Aujourd’hui', 2], ['Hier', 1], ['8 octobre', 1]]);
  assert.equal(s.rows.length, 4); assert.equal(s.days[0].rows[0].time, '15:05');
  const t = panel({ log }); await t.p.render();
  const heads = cls(t, 'hu-h').map((e) => e.textContent);
  assert.deepEqual(heads, ['Ce que tu as laissé ouvert', 'Aujourd’hui', 'Hier', '8 octobre']);
});
test('the sentences of a journal line, including a limited authorisation and a revocation', () => {
  const P = panel().P, w = (e) => P.verdictWords(Object.assign({ decision: 'confirm' }, e));
  assert.deepEqual([w({ outcome: 'match' }).strong, w({ outcome: 'match' }).words], ['', 'Ça correspondait.']);
  assert.equal(w({ outcome: 'match', decision: 'cancel' }).words, 'Ça correspondait. Tu n’as rien envoyé.');
  assert.deepEqual([w({ level: 'danger', decision: 'cancel' }).strong, w({ level: 'danger', decision: 'cancel' }).words], ['Ça ne correspondait pas.', 'Tu n’as rien envoyé.']);
  assert.equal(w({ level: 'manipulation' }).words, 'Tu as envoyé quand même.');
  assert.equal(w({ outcome: 'unverifiable', decision: 'cancel' }).words, 'Je n’ai pas pu vérifier. Tu n’as rien envoyé.');
  assert.equal(w({ outcome: 'unverifiable' }).words, 'Je n’ai pas pu vérifier. Tu as envoyé quand même.');
  const l = w({ level: 'danger', sent: { limited: true, sent: '50 USDC' } });
  assert.deepEqual([l.strong, l.words], ['Ça ne correspondait pas.', 'Tu as limité l’autorisation à 50 USDC.']);
  const s = P.summarize([{ type: 'revocation', ts: NOW - 1, origin: 'https://a.example', wallet: 'submitted' }, { type: 'revocation', ts: NOW - 2, origin: 'https://a.example', wallet: 'rejected' }, { type: 'revocation', ts: NOW - 3, origin: 'https://a.example' }], NOW);
  assert.deepEqual(JSON.parse(JSON.stringify(s.rows.map((r) => r.words))), ['Retrait d’une autorisation : pas envoyé.', 'Retrait d’une autorisation : refusé dans ton portefeuille.', 'Retrait d’une autorisation : envoyé à ton portefeuille.']);
});
test('the discreet line : how the last written sentence was read', async () => {
  const intent = (n, classifier) => ({ type: 'decision', stage: 'intent', decision: 'answer', classifier, ts: NOW - n * 1000 });
  const line = async (log) => { const t = panel({ log }); await t.p.render(); return t.texts().filter((x) => x.startsWith('Dernière phrase')); };
  assert.deepEqual(await line([intent(5, 'jev'), intent(1, 'clef'), dec(1)]), ['Dernière phrase : intention classée par Clef.']);
  assert.deepEqual(await line([intent(1, 'jev'), dec(1)]), ['Dernière phrase : intention classée par Jev.']);
  assert.deepEqual(await line([intent(1, 'keywords'), dec(1)]), ['Dernière phrase : intention classée sans modèle.']);
  assert.deepEqual(await line([dec(1)]), []);
});
test('the withdrawal : one constant for every button, busy then done, other outcomes keep the button and say it', async () => {
  const mkRes = () => ({ status: 'revocable', oneClick: true, kind: 'erc20_approve', says: 'x', steps: [], requests: [] });
  let answer = { state: 'submitted' }, check = { state: 'zero' }; const later = [], asked = [];
  const F = makeChrome(); F.state.local.log = [dec(1)];
  const chrome = Object.assign({}, F.chrome, { tabs: { query: async () => [{ id: 7 }] }, runtime: Object.assign({}, F.chrome.runtime, { sendMessage: async (m) => { asked.push(m.type);
    if (m.type === 'hu.revoke.get') return { grants: [{ id: 'a1', origin: 'https://app.exemple.org', result: mkRes(), can: '50 USDC' }, { id: 'b2', origin: 'https://old.exemple.org', result: mkRes() }] };
    if (m.type === 'hu.revoke.send') return answer; if (m.type === 'hu.revoke.check') return check; return { state: 'unknown' }; } }) });
  const D = dom(), sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const root = D.mk('main'), p = sb.HoldupPanel.mount(D.document, root, { chrome, now: () => NOW, setTimeout: (f) => { later.push(f); } });
  await p.render();
  const texts = () => D.all(root).map((e) => e.textContent).filter(Boolean), btns = () => D.all(root).filter((e) => e.tag === 'button' && e.textContent === sb.HoldupPanel.REVOKE_LABEL);
  assert.equal(sb.HoldupPanel.REVOKE_LABEL, 'Retirer l’autorisation');
  assert.equal((SRC.match(/'Retirer l’autorisation'/g) || []).length, 1, 'the label is written once in the source');
  assert.ok(texts().includes('app.exemple.org peut dépenser 50 USDC.') && texts().includes('old.exemple.org a une autorisation sur ton compte.'));
  assert.equal(btns().length, 2, 'every button comes from the constant'); assert.ok(texts().includes('Ton portefeuille te demandera de confirmer.'));
  answer = { state: 'rejected' }; await btns()[0].listeners.click[0]();
  assert.ok(texts().includes('Tu as refusé dans ton portefeuille. L’autorisation est toujours là.')); assert.equal(btns().length, 2);
  answer = { state: 'error', code: 'no_provider' }; await btns()[0].listeners.click[0]();
  assert.ok(texts().includes('Ouvre à nouveau le site ou ton portefeuille, puis reviens ici.'));
  answer = { state: 'error' }; await btns()[0].listeners.click[0]();
  assert.ok(texts().includes('Le retrait n’a pas pu partir. L’autorisation est toujours là.'));
  answer = { state: 'submitted' }; later.length = 0; await btns()[0].listeners.click[0]();
  const li = D.all(root).filter((e) => e.className.startsWith('hu-right'));
  assert.ok(li[0].className.includes('is-busy') && texts().includes('En cours…') && btns().length === 1, 'busy : no button');
  assert.equal(later.length, 1); await later[0]();
  const done = D.all(root).filter((e) => e.className.includes('is-done'));
  assert.equal(done.length, 1); assert.ok(texts().includes('app.exemple.org ne peut plus rien dépenser.') && texts().includes('Retirée'));
  assert.deepEqual(asked.filter((t) => t === 'hu.revoke.send').length, 4);
  check = { state: 'still_active' }; later.length = 0; await btns()[0].listeners.click[0]();
  for (let i = 0; i < 6; i++) { const f = later.pop(); await f(); }
  assert.ok(texts().includes('Retrait envoyé. L’autorisation est encore là pour l’instant.'));
});
test('"Tout retirer" : every one-click right of the tab, one wallet request at a time ; a refusal skips one, an absent wallet stops the rest', async () => {
  const one = () => ({ status: 'revocable', oneClick: true, kind: 'erc20_approve', says: 'x', steps: [], requests: [] });
  const two = () => ({ status: 'two_steps', oneClick: false, kind: 'eip2612_permit', says: 'Un clic ne suffit pas.', steps: ['1. Tu signes.'], requests: [] });
  const later = [], sent = []; let answers = {}, inFlight = 0, maxInFlight = 0, list;
  const F = makeChrome(); F.state.local.log = [dec(1)];
  const chrome = Object.assign({}, F.chrome, { tabs: { query: async () => [{ id: 7 }] }, runtime: Object.assign({}, F.chrome.runtime, { sendMessage: async (m) => {
    if (m.type === 'hu.revoke.get') return { grants: list };
    if (m.type === 'hu.revoke.send') { assert.deepEqual(Object.keys(m).sort(), ['id', 'index', 'tabId', 'type'], 'the panel never sends a request'); sent.push(m.id); inFlight++; maxInFlight = Math.max(maxInFlight, inFlight); await null; inFlight--; return answers[m.id] || { state: 'submitted' }; }
    if (m.type === 'hu.revoke.check') return { state: 'zero' }; return { state: 'unknown' }; } }) });
  const D = dom(), sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const root = D.mk('main'), p = sb.HoldupPanel.mount(D.document, root, { chrome, now: () => NOW, setTimeout: (f) => { later.push(f); } });
  const texts = () => D.all(root).map((e) => e.textContent).filter(Boolean), all = () => D.all(root).filter((e) => e.tag === 'button' && e.textContent.startsWith(sb.HoldupPanel.REVOKE_ALL_LABEL));
  const g = (id, res) => ({ id, origin: 'https://' + id + '.exemple.org', result: res(), can: 'tout ton USDC' });

  list = [g('a1', one)]; await p.render();
  assert.equal(all().length, 0, 'one right : its own button is enough');
  list = [g('a1', one), g('p9', two)]; await p.render();
  assert.equal(all().length, 0, 'an off-chain signature is never counted');

  list = [g('a1', one), g('b2', one), g('p9', two), g('c3', one)]; await p.render();
  assert.equal(sb.HoldupPanel.REVOKE_ALL_LABEL, 'Tout retirer');
  assert.deepEqual(all().map((b) => b.textContent), ['Tout retirer (3)']);
  assert.ok(texts().includes('Tout retirer : une confirmation par autorisation, l’une après l’autre.'));
  answers = { b2: { state: 'rejected' } };
  await all()[0].listeners.click[0]();
  assert.deepEqual(sent, ['a1', 'c3', 'b2'].sort((x, y) => list.findIndex((q) => q.id === x) - list.findIndex((q) => q.id === y)), 'in the order shown, never the signature');
  assert.equal(maxInFlight, 1, 'one wallet request at a time');
  assert.ok(texts().includes('Tu as refusé dans ton portefeuille. L’autorisation est toujours là.'));
  assert.equal(D.all(root).filter((e) => e.className.includes('is-busy')).length, 2, 'the two sent ones wait for the chain');
  assert.equal(all().length, 0, 'one right left open : no "Tout retirer"');
  while (later.length) await later.shift()();
  assert.equal(D.all(root).filter((e) => e.className.includes('is-done')).length, 2);
  assert.ok(texts().includes('a1.exemple.org ne peut plus rien dépenser.') && texts().includes('c3.exemple.org ne peut plus rien dépenser.'));

  // the wallet cannot be reached : the first failure stops the run, nothing else is asked
  list = [g('d4', one), g('e5', one), g('f6', one)]; sent.length = 0; answers = { d4: { state: 'error', code: 'no_provider' } }; await p.render();
  await all()[0].listeners.click[0]();
  assert.deepEqual(sent, ['d4']);
  assert.equal(texts().filter((x) => x === 'Ouvre à nouveau le site ou ton portefeuille, puis reviens ici.').length, 3);
  assert.deepEqual(all().map((b) => b.textContent), ['Tout retirer (3)'], 'still open, the person can try again');
  assert.ok(!texts().includes('En attente…'));
});
test('a new top row arrives with is-arriving and pushes what follows, then the classes go (DOM with measures)', async () => {
  const D = dom(), F = makeChrome(); F.state.local.log = [dec(2), dec(1)];
  const mk = (tag) => { const e = D.mk(tag); const ac = e.appendChild; e.appendChild = (c) => { c.parentNode = e; return ac(c); };
    Object.defineProperty(e, 'nextElementSibling', { get: () => e.parentNode ? e.parentNode.children[e.parentNode.children.indexOf(e) + 1] || null : null });
    e.style = { props: {}, setProperty(k, v) { e.style.props[k] = v; } }; if (tag === 'li') e.getBoundingClientRect = () => ({ height: 40 }); return e; };
  const chrome = Object.assign({}, F.chrome, { runtime: Object.assign({}, F.chrome.runtime, { sendMessage: async () => ({ state: 'unknown' }) }) });
  const sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const later = [], root = mk('main'), p = sb.HoldupPanel.mount({ createElement: mk }, root, { chrome, now: () => NOW, setTimeout: (f) => later.push(f) });
  await p.render(); assert.ok(root.className.includes('is-opening')); assert.equal(later.length, 1); later[0](); assert.ok(!root.className.includes('is-opening'));
  assert.ok(!D.all(root).some((e) => e.className.includes('is-arriving')), 'first render : no arrival');
  F.state.local.log = [dec(2), dec(1), dec(0)]; later.length = 0; await p.render();
  const all = D.all(root), arriving = all.filter((e) => e.className.includes('is-arriving')), pushed = all.filter((e) => e.className.includes('is-pushed'));
  assert.equal(arriving.length, 1); assert.equal(arriving[0].tag, 'li'); assert.equal(pushed.length, 2);
  assert.ok(pushed.every((e) => e.style.props['--hu-dy'] === '-40px'));
  assert.equal(later.length, 1); later[0]();
  assert.ok(!all.some((e) => /is-arriving|is-pushed/.test(e.className)));
  F.state.local.log = [dec(5), dec(2), dec(1), dec(0)]; F.state.local.log.splice(1, 1); later.length = 0; await p.render();
  assert.ok(!D.all(root).some((e) => e.className.includes('is-arriving')), 'two changes at once : no animation');
});
test('"Effacer le journal" removes the journal and the list is empty', async () => {
  const t = panel({ log: [dec(1), dec(2)] }); await t.p.render();
  assert.equal(cls(t, 'hu-entry').length, 2);
  await t.buttons()[0].listeners.click[0]();
  assert.equal(t.F.state.local.log.length, 2, 'the first click only asks');
  assert.equal(t.buttons()[0].textContent, 'Effacer pour de bon ?');
  await t.buttons()[0].listeners.click[0]();
  assert.equal(t.F.state.local.log, undefined);
  assert.ok(t.texts().includes('Rien à raconter pour l’instant.'));
});
test('page data is only ever text : a hostile origin or method never becomes markup', async () => {
  const t = panel({ log: [dec(1, { origin: 'https://<img src=x onerror=alert(1)>.example', method: '<script>x</script>' })] }); await t.p.render();
  assert.ok(!SRC.includes('innerHTML') && !SRC.includes('insertAdjacentHTML') && !SRC.includes('outerHTML'));
  assert.equal(cls(t, 'hu-entry').length, 1);
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
  assert.ok(tx.some((x) => /Tu n’as rien envoyé./.test(x)), tx.join(' | '));
  assert.ok(tx.includes('shop.example'));
  assert.ok(!JSON.stringify(tx).includes('payer 20 USDC'));
  clock.restore(); delete globalThis.chrome;
});

test('manifests and files : sidePanel permission, Chrome 116, panel sheets, no old sheet', () => {
  for (const mf of [JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'))]) {
    assert.ok(mf.permissions.includes('sidePanel')); assert.equal(mf.minimum_chrome_version, '116'); assert.equal(mf.side_panel.default_path, 'ui/sidepanel.html');
  }
  const html = readFileSync(join(DIR, 'ui', 'sidepanel.html'), 'utf8');
  assert.ok(/<script src="sidepanel\.js"><\/script>/.test(html) && !/<script>[^<]/.test(html) && !/\son[a-z]+=/.test(html));
  assert.ok(/<link rel="stylesheet" href="tokens.css">/.test(html) && /href="components.css"/.test(html) && /href="motion.css"/.test(html) && !/sidepanel.css/.test(html));
  assert.ok(/<main id="panel" class="hu hu-panel is-opening"/.test(html) && /name="color-scheme"/.test(html));
  assert.ok(!existsSync(join(DIR, 'ui', 'sidepanel.css')));
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
  assert.ok(D.all(root).some((e) => /^Sur shop\.example, je n’ai pas pu me placer devant le portefeuille\. Des demandes peuvent partir sans vérification\./.test(e.textContent)));
  clock.restore(); delete globalThis.chrome;
});
