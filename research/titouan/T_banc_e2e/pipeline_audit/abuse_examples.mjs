// pipeline_audit/abuse_examples.mjs - lecture seule. Détaille quelques cas de forge_facts.mjs : faits honnêtes vs falsifiés, signaux, niveaux.
// Usage : node pipeline_audit/abuse_examples.mjs            (écrit out/abuse_examples.txt via la sortie standard)
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const { readCases, productInput, liveLike, atCaseTime, D } = M;
const { makeEvaluatePlus, benchLevel } = await import(new URL('../pipeline/evaluate_plus.mjs', import.meta.url).href);
const run = makeEvaluatePlus(D);
const files = readFileSync(join(HERE, 'FILES.txt'), 'utf8').trim().split(/\s+/);
const byId = new Map(); for (const f of files) for (const x of readCases(resolve(HERE, '..', f))) if (x.c) byId.set(x.c.id ?? x.id, x.c);
const clone = (x) => JSON.parse(JSON.stringify(x));
const forge = {
  solde_enorme: (L) => { L.sharePct = 0.0001; L.balances = {}; return L; },
  tout_est_contrat_ancien: (L) => { for (const a of Object.keys(L.isContract)) { L.isContract[a] = true; L.ageBlocks[a] = 5e7; } for (const a of Object.keys(L.facts)) L.facts[a] = { ...L.facts[a], isContract: true, ageBlocks: 5e7 }; return L; },
  decimales_36: (L) => { for (const a of Object.keys(L.tokenMeta)) { L.tokenMeta[a] = { ...L.tokenMeta[a], decimals: 36 }; if (L.tokenInfo[a]) L.tokenInfo[a] = { ...L.tokenInfo[a], decimals: 36 }; } return L; },
  firstseen_faux: (L) => { for (const a of Object.keys(L.facts)) L.facts[a] = { ...L.facts[a], firstSeenByUser: false }; return L; },
};
const PICKS = [['V2-ONCHAIN-00512', 'solde_enorme', false], ['V2-ONCHAIN-01079', 'solde_enorme', true], ['V2-POISON-00641', 'tout_est_contrat_ancien', true], ['V2-POISON-00725', 'tout_est_contrat_ancien', false],
  ['fuzzsig-01664', 'decimales_36', true], ['fuzzsig-00626', 'decimales_36', true], ['V2-ONCHAIN-00140', 'firstseen_faux', true], ['V2-SIG-00145', 'firstseen_faux', true]];
const brief = (c) => { const r = c.request, p = (r.params && r.params[0]) || {}; return `${c.family}/${c.subfamily || ''} ${r.method} to=${typeof p === 'object' ? (p.to || '') : ''} note=${String(c.note || c.reason || '').slice(0, 140)} intent=${JSON.stringify(c.intent && { kind: c.intent.kind, amount: c.intent.amount, token: c.intent.token })} share=${c.context && c.context.share_of_balance_pct}`; };
for (const [id, fv, ki] of PICKS) {
  const c = byId.get(id); if (!c) { console.log('absent', id); continue; }
  const { body, local } = productInput(c, { known: ki });
  if (ki && c.intent) { body.intent = { pay_someone: 'pay', connect_or_accept_offer: 'receive', asked_by_someone: 'asked' }[c.intent.kind] || 'other'; if (c.intent.freeText) body.intent_text = c.intent.freeText; }
  const o = { intentPremise: ki ? 'warn' : 'strict' };
  const H = await atCaseTime(c, () => run(body, local, { ...o, live: liveLike(c, body, local) }));
  const F = await atCaseTime(c, () => run(body, local, { ...o, live: forge[fv](clone(liveLike(c, body, local))) }));
  const sig = (v) => (v.plus.signals || []).filter((s) => s.severity !== 'info').map((s) => `${s.by}:${s.code}:${s.severity}`).join(', ') || '(aucun)';
  console.log(`\n## ${id} [${ki ? 'known+intent' : 'plain'}] falsification=${fv}\n  cas: ${brief(c)}\n  produit=${H.plus.product}  honnête=${benchLevel(H)} signaux: ${sig(H)}\n  falsifié=${benchLevel(F)} signaux: ${sig(F)}`);
}
