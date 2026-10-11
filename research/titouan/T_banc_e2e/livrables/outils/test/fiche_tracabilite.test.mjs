// Fiche de traçabilité : chaîne vérifiée, ligne modifiée -> ROMPUE, injection échappée, champs à venir, session, CLI.
// Run : node --test livrables/outils/test/fiche_tracabilite.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chainAppend, exportChain, sha256 } from '../../../extension/journal_chain.js';
import { buildFiche, canonicalJson, siteCut, ABSENT } from '../fiche_tracabilite.mjs';

const TOOL = fileURLToPath(new URL('../fiche_tracabilite.mjs', import.meta.url));
const EXAMPLE = fileURLToPath(new URL('../exemple/journal_export.json', import.meta.url));
const DATE = '2026-10-11T10:00:00.000Z';
const load = () => JSON.parse(readFileSync(EXAMPLE, 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));
async function chainOf(lines) {
  const mem = {}; const st = { get: async (k) => ({ [k]: mem[k] }), set: async (o) => { Object.assign(mem, clone(o)); } };
  for (const l of lines) await chainAppend(st, l, '0.3.0');
  return JSON.parse(exportChain(mem.chain));
}
// adds to one line fields that the current journal does not hash yet (by, limited, rules, tab, frame)
const withFields = (exp, i, fields) => { const x = clone(exp); Object.assign(x.entries[i], fields); return x; };

test('the real example export : chain COHÉRENTE, who/where/when/what/rules shown, fingerprint is the SHA-256 of the canonical record', async () => {
  const f = await buildFiche(load(), { n: 2, generatedAt: DATE });
  assert.equal(f.record.chain.ok, true); assert.equal(f.record.chain.state, 'COHÉRENTE');
  assert.match(f.html, /COHÉRENTE/); assert.match(f.html, /ancrage externe/);
  const l = f.record.lines[0];
  assert.match(l.who.actor, /La personne/); assert.equal(l.who.action, 'continuée'); assert.match(l.who.source, /geste/);
  assert.equal(l.where.site, 'shop.example'); assert.equal(l.when, '2026-10-11 09:00:09 UTC'); assert.equal(l.rules.version, '0.3.0');
  assert.equal(l.position, 2); assert.equal(l.total, 7);
  assert.equal(f.sha256, await sha256(canonicalJson(f.record))); assert.match(f.html, new RegExp(f.sha256));
  assert.equal((await buildFiche(load(), { n: 2, generatedAt: DATE })).sha256, f.sha256, 'deterministic');
});

test('a line modified by hand gives ROMPUE (in the page, in the text and in the exit code)', async () => {
  const bad = load(); bad.entries[2].l = 'attention';
  const f = await buildFiche(bad, { generatedAt: DATE });
  assert.equal(f.record.chain.ok, false); assert.match(f.html, /ROMPUE/); assert.match(f.text, /ROMPUE/);
  assert.match(f.record.chain.problems.join(' '), /n° 3.*modifiée/);
  const dir = mkdtempSync(join(tmpdir(), 'holdup-fiche-')); const p = join(dir, 'bad.json'); writeFileSync(p, JSON.stringify(bad));
  const r = spawnSync(process.execPath, ['--no-warnings', TOOL, p, '--out', join(dir, 'f.html')], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr); assert.match(r.stdout, /ROMPUE/); assert.match(readFileSync(join(dir, 'f.html'), 'utf8'), /ROMPUE/);
});

test('injection : a tag in the site field is escaped ; the page has no script, no external resource, no event handler', async () => {
  const exp = await chainOf([{ type: 'verdict', origin: 'https://shop.example', method: 'eth_sendTransaction', level: 'danger', codes: ['external_spender'], ts: 1 }]);
  const evil = clone(exp);
  evil.entries[0].o = '<script>alert(1)</script><img src=x onerror=alert(2)>.evil.example';
  evil.entries[0].m = '"><svg onload=alert(3)>'; evil.entries[0].c = ['<b>x</b>']; evil.entries[0].by = '<i>moi</i>'; evil.entries[0].rules = { a: '</style><script>' };
  for (const n of [1, null]) {
    const { html } = await buildFiche(evil, { n, generatedAt: DATE });
    assert.ok(!/<script/i.test(html) && !/<img/i.test(html) && !/<svg/i.test(html) && !/<b>x/.test(html) && !/<i>moi/.test(html), 'no raw tag');
    assert.ok(!/<[^>]*\son[a-z]+\s*=/i.test(html), 'no event attribute inside a tag');
    assert.ok(!/(src|href)\s*=/i.test(html) && !/https?:\/\//i.test(html) && !/@import|url\(/i.test(html), 'no external resource');
    assert.match(html, /&lt;script&gt;/); assert.match(html, /script-src 'none'/);
    assert.equal((html.match(/<\/style>/g) || []).length, 1, 'the style block is not closed by journal text');
  }
});

test('fields to come (by, limited, rules, tab, frame) : shown when present, « non enregistré dans cette version » otherwise, never a crash', async () => {
  const exp = load();
  const none = (await buildFiche(exp, { n: 5, generatedAt: DATE })).record.lines[0];
  assert.ok(none.extras.every((x) => x.value === ABSENT)); assert.equal(none.where.tab, ABSENT); assert.equal(none.where.frame, ABSENT);
  assert.match(none.who.actor, /non distingué/);
  const withAll = withFields(exp, 4, { by: 'expired', limited: { limited: true, sent: '20 USDC' }, rules: 'sha256:ab12cd', tab: 7, frame: 'top' });
  const f = await buildFiche(withAll, { n: 5, generatedAt: DATE }); const l = f.record.lines[0];
  assert.match(l.who.actor, /expiré/); assert.equal(l.who.action, 'retenue puis expirée'); assert.equal(l.who.source, 'champ by');
  assert.match(l.extras[1].value, /oui, envoyé : 20 USDC/); assert.equal(l.extras[2].value, 'sha256:ab12cd'); assert.equal(l.where.tab, '7'); assert.equal(l.where.frame, 'top');
  assert.ok(l.extras.every((x) => x.hashed === 'hors du hachage dans cette version'), 'today the journal does not hash them, and the fiche says so');
  assert.match(f.html, /sha256:ab12cd/);
  const auto = withFields(exp, 5, { by: 'auto' }); assert.match((await buildFiche(auto, { n: 6, generatedAt: DATE })).record.lines[0].who.actor, /Automatique/);
  for (const weird of [null, 42, true, [], { x: { y: 1 } }, '']) await buildFiche(withFields(exp, 0, { by: weird, limited: weird, rules: weird }), { n: 1, generatedAt: DATE });
  await buildFiche({ entries: [null, 3, 'x', {}] }, { generatedAt: DATE });
});

test('Hold up itself for a proposed revocation ; automatic send read from the code envoi_automatique', async () => {
  const f = await buildFiche(load(), { generatedAt: DATE });
  const rev = f.record.lines.find((l) => l.type === 'revocation'); assert.match(rev.who.actor, /Hold up a proposé un retrait/);
  const auto = f.record.lines.find((l) => l.n === 6); assert.match(auto.who.actor, /Automatique/); assert.ok(auto.what.codes.some((c) => /droit_limite/.test(c)));
});

test('session summary : every line in one table ; site cut in the middle, the final domain always visible ; no sentence, no full address', async () => {
  const f = await buildFiche(load(), { generatedAt: DATE });
  assert.equal(f.record.mode, 'session'); assert.equal(f.record.lines.length, 7);
  assert.equal((f.html.match(/<tr>/g) || []).length, 8);
  const cut = f.record.lines[3].where.site; assert.ok(cut.includes('…') && cut.endsWith('evil.example') && cut.length <= 41, cut);
  assert.ok(siteCut('a'.repeat(300) + '.' + 'b'.repeat(80) + '.example').length <= 41);
  const all = f.html + f.text + readFileSync(EXAMPLE, 'utf8');
  assert.ok(!/payer|USDC à/i.test(all)); assert.ok(!/0x[0-9a-f]{40}/i.test(all));
  const masked = await buildFiche(withFields(load(), 0, { by: '0x' + 'ab'.repeat(20) }), { n: 1, generatedAt: DATE });
  assert.ok(!/0x[0-9a-f]{40}/i.test(masked.html + masked.text));
  assert.ok(!/(sûr|sans danger|rembours|garanti|green|#0f0|#0a0|#080)/i.test(f.html + f.text), 'no green verdict, no promise');
});

test('CLI : 0 on a coherent chain, 2 on an unreadable file or a missing line', () => {
  const run = (...a) => spawnSync(process.execPath, ['--no-warnings', TOOL, ...a], { encoding: 'utf8' });
  const ok = run(EXAMPLE, '--n', '3'); assert.equal(ok.status, 0, ok.stderr); assert.match(ok.stdout, /COHÉRENTE/);
  assert.equal(run(EXAMPLE, '--n', '99').status, 2);
  const dir = mkdtempSync(join(tmpdir(), 'holdup-fiche-')); writeFileSync(join(dir, 'x.json'), 'pas du json');
  assert.equal(run(join(dir, 'x.json')).status, 2);
});
