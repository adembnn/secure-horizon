// Popup, welcome page and settings page : pure helpers + static checks on the markup.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { DIR } from './fake_chrome.mjs';

const read = (f) => readFileSync(join(DIR, f), 'utf8');
const run = (f, name) => { const sb = { console, URL, Date }; sb.window = sb; vm.createContext(sb); vm.runInContext(read(f), sb); return sb[name]; };
const P = run('popup.js', 'HoldupPopup'), O = run('options.js', 'HoldupOptions'), W = run('welcome.js', 'HoldupWelcome');

test('popup : stateOf', () => {
  assert.equal(JSON.stringify(P.stateOf('https://app.neve.exchange/swap?x=1', [])), JSON.stringify({ kind: 'active', origin: 'https://app.neve.exchange', host: 'app.neve.exchange' }));
  assert.equal(P.stateOf('https://app.neve.exchange/a', ['https://app.neve.exchange']).kind, 'paused');
  assert.equal(P.stateOf('https://other.example/', ['https://app.neve.exchange']).kind, 'active');
  for (const u of ['chrome://extensions', 'edge://settings', 'about:blank', 'chrome-extension://abc/x.html', 'https://chromewebstore.google.com/detail/x', 'https://chrome.google.com/webstore/detail/x', undefined, ''])
    assert.equal(P.stateOf(u, []).kind, 'nothing', String(u));
});

test('popup : lastLine, the four sentences', () => {
  const o = 'https://shop.example', ts = new Date(2026, 9, 11, 14, 32).getTime();
  const e = (x) => Object.assign({ ts, type: 'decision', origin: o }, x);
  assert.equal(P.lastLine([], o), '');
  assert.equal(P.lastLine([e({ decision: 'confirm', outcome: 'match' })], 'https://other.example'), '');
  assert.equal(P.lastLine([e({ decision: 'confirm', outcome: 'match' })], o), 'À 14:32, ça correspondait.');
  assert.equal(P.lastLine([e({ decision: 'cancel', outcome: 'mismatch' })], o), 'À 14:32, ça ne correspondait pas. Tu n’as rien envoyé.');
  assert.equal(P.lastLine([e({ decision: 'confirm', level: 'danger' })], o), 'À 14:32, ça ne correspondait pas. Tu as envoyé quand même.');
  assert.equal(P.lastLine([e({ decision: 'confirm', outcome: 'mismatch', sent: { limited: true, sent: '50 USDC' } })], o), 'À 14:32, ça ne correspondait pas. Tu as limité l’autorisation à 50 USDC.');
  assert.equal(P.lastLine([e({ decision: 'cancel', level: 'unknown' })], o), 'À 14:32, je n’ai pas pu vérifier. Tu n’as rien envoyé.');
  // newest entry of the site wins ; other types are ignored
  const newer = e({ ts: ts + 60000, decision: 'cancel', outcome: 'mismatch' });
  assert.match(P.lastLine([newer, e({ decision: 'confirm', outcome: 'match' }), { ts: ts + 999999, type: 'revocation', origin: o }], o), /^À 14:33, ça ne correspondait pas/);
});

test('settings : minutes field and out-of-range messages', () => {
  assert.equal(JSON.stringify(O.minutes("10")), JSON.stringify({ ok: true, ms: 600000 }));
  assert.equal(O.minutes('0').ok, false); assert.equal(O.minutes('61').ok, false); assert.equal(O.minutes('').ok, false); assert.equal(O.minutes('1.5').ok, false);
  assert.equal(O.minutes('1').ms, 60000); assert.equal(O.minutes('60').ms, 3600000);
  assert.equal(O.wholeSeconds('4', 'dangerWaitMs').ok, false); assert.equal(O.wholeSeconds('601', 'dangerWaitMs').ok, false); assert.equal(O.wholeSeconds('5', 'dangerWaitMs').ms, 5000);
  assert.equal(O.TEXT.badSeconds(5, 600, 30), 'Entre 5 et 600 secondes. J’ai gardé 30.');
  assert.equal(O.TEXT.badMinutes(1, 60, 10), 'Entre 1 et 60 minutes. J’ai gardé 10.');
  assert.ok(!/jeton/.test(O.networkLines({}).join(' ')));
});

test('welcome : only a web address keeps the test button', () => {
  assert.equal(W.isWebUrl('https://example.test/page'), true); assert.equal(W.isWebUrl('javascript:alert(1)'), false); assert.equal(W.isWebUrl(undefined), false);
});

test('pages : the three sheets, no inline script, none of the forbidden words', () => {
  for (const f of ['popup.html', 'welcome.html', 'options.html']) {
    const html = read(f);
    for (const sheet of ['ui/tokens.css', 'ui/components.css', 'ui/motion.css']) assert.ok(html.includes('href="' + sheet + '"'), f + ' ' + sheet);
    assert.ok(html.includes('name="color-scheme" content="light dark"'), f);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) assert.ok(/\ssrc="[^"]+"/.test(m[1]) && m[2].trim() === '', f + ' inline script');
    assert.ok(!/Révoquer|jeton|Continuer/i.test(html), f);
    assert.ok(!/<style[^>]*>(?!html,body\{height:100%;margin:0\}<\/style>)/.test(html), f + ' only the tiny style rule');
  }
});
