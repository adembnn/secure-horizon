// Tests synthétiques de la politique / des règles (adresses fabriquées par code, aucun cas du catalogue, TEST jamais lu).
// node run/test_policy.mjs   (avec POLICY_FIXES=all pour activer tous les correctifs)
import { pathToFileURL } from 'node:url'; import { join, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const H = dirname(fileURLToPath(import.meta.url)), ENG = join(H, '..', 'engine', 'src');
const imp = (p) => import(pathToFileURL(p).href);
process.env.POLICY_FIXES = process.env.POLICY_FIXES || 'all';
const E = await imp(join(ENG, 'engine.mjs')); const X = await imp(join(ENG, 'rules_extra.mjs')); const P = await imp(join(H, 'policy.mjs'));
const { compare } = await imp(join(ENG, '..', 'vendor', 'compare.ts'));
const A = (c) => '0x' + c.repeat(40);
let fails = 0; const t = (name, got, want) => { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ' (attendu ' + want + ')'}`); };
const me = A('1'), impl = A('2'), evil = A('3');
const mkCtx = (extra = {}) => ({ chainId: 1, from: me, now: 1760000000, knownSpenders: [impl], history: [], contacts: [], codeOf: () => undefined, ...extra, _k: extra._k || {} });
const intent = { kind: 'connect_or_accept_offer', freeText: 'x', declaredAt: 1760000000000 };
function run(tx, ctx, req) { const eff = E.analyzeTransaction(tx, ctx); X.applyExtraRules(eff, req || { method: 'eth_sendTransaction', params: [tx] }, ctx); return P.applyPolicy({ eff, adem: compare(intent, eff), ctx, intent, request: req || { method: 'eth_sendTransaction', params: [tx] } }); }
// F4 : 7702
const del = (addr, chainId) => ({ type: '0x4', from: me, to: me, data: '0x', value: '0x0', chainId: '0x1', authorizationList: [{ chainId, address: addr, nonce: '0x0' }] });
t('7702 implémentation connue chaîne 1', run(del(impl, '0x1'), mkCtx()).level, 'warn');
t('7702 cible inconnue', run(del(evil, '0x1'), mkCtx()).level, 'critical');
t('7702 implémentation connue chain_id=0', run(del(impl, '0x0'), mkCtx()).level, 'critical');
console.log(fails ? `${fails} échec(s)` : 'tous OK'); process.exit(fails ? 1 : 0);
