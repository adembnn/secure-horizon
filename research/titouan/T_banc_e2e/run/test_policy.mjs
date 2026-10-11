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

// F5 : service décodé / bénéficiaire / invariant opaque
const sel = (sig) => import(pathToFileURL(join(ENG, 'keccak.mjs')).href).then((k) => k.keccak256(sig).slice(0, 10));
const w32 = (hexAddr) => hexAddr.slice(2).padStart(64, '0');
const known = A('4'), other = A('5');
const mint = (await sel('mint(uint256)')) + '1'.padStart(64, '0');
const depTo = async (to) => (await sel('depositETHTo(address,uint32,bytes)')) + w32(to) + '1'.padStart(64, '0') + '60'.padStart(64, '0') + '0'.padStart(64, '0');
const buy = { kind: 'buy_or_swap', freeText: 'x', declaredAt: 1760000000000 };
const runI = (tx, ctx, it) => { const eff = E.analyzeTransaction(tx, ctx); const rq = { method: 'eth_sendTransaction', params: [tx] }; X.applyExtraRules(eff, rq, ctx); return P.applyPolicy({ eff, adem: compare(it, eff), ctx, intent: it, request: rq }); };
const kctx = mkCtx({ knownSpenders: [impl, known] });
t('mint vers protocole connu', runI({ from: me, to: known, value: '0x10', data: mint, chainId: '0x1' }, kctx, buy).level, 'ok');
t('sélecteur inconnu vers protocole connu (opaque) jamais ok', runI({ from: me, to: known, value: '0x10', data: '0xdeadbeef', chainId: '0x1' }, kctx, buy).level, 'warn');
t('sélecteur inconnu vers contrat inconnu, avec valeur, intention achat', runI({ from: me, to: other, value: '0x10', data: '0xdeadbeef', chainId: '0x1' }, kctx, buy).level, 'critical');
t('mint vers contrat inconnu (non listé) reste opaque', runI({ from: me, to: other, value: '0x10', data: mint, chainId: '0x1' }, kctx, buy).level, 'critical');
t('dépôt de pont vers soi', runI({ from: me, to: known, value: '0x10', data: await depTo(me), chainId: '0x1' }, kctx, buy).level, 'ok');
t('dépôt de pont vers un tiers', runI({ from: me, to: known, value: '0x10', data: await depTo(other), chainId: '0x1' }, kctx, buy).level, 'warn');
// F6 : chaînes
const chain = (m, p) => { const rq = { method: m, params: [p] }; const eff = X.analyzeChainRequest(rq, kctx); return P.applyPolicy({ eff, adem: compare(intent, eff), ctx: kctx, intent, request: rq }).level; };
t('bascule chaîne connue', chain('wallet_switchEthereumChain', { chainId: '0x2105' }), 'ok');
t('bascule chaîne hors registre', chain('wallet_switchEthereumChain', { chainId: '0xaf530' }), 'warn');
t('ajout chaîne hors registre symbole ETH', chain('wallet_addEthereumChain', { chainId: '0xaf530', rpcUrls: ['https://x.example'], nativeCurrency: { symbol: 'ETH' } }), 'critical');
t('ajout chaîne hors registre autre symbole', chain('wallet_addEthereumChain', { chainId: '0xaf530', rpcUrls: ['https://x.example'], nativeCurrency: { symbol: 'ZZZ' } }), 'warn');
t('ajout RPC http', chain('wallet_addEthereumChain', { chainId: '0xaf530', rpcUrls: ['http://x.example'], nativeCurrency: { symbol: 'ZZZ' } }), 'critical');
// F7/F8/F9 sur contexte synthétique
const typed = (m) => ({ method: 'eth_signTypedData_v4', params: [me, JSON.stringify({ types: {}, primaryType: 'Order', domain: {}, message: m })] });
const effT = () => ({ outgoing: [], incoming: [], approvals: [], counterparties: [], controlChange: [], nested: [], opaque: false, opaqueReasons: [], risk_flags: [], level: 'ok', levelEvidence: 'ok' });
const xr = (rq, ctx) => { const e = effT(); X.applyExtraRules(e, rq, ctx); return e.level; };
const tctx = mkCtx({ tokenMeta: { [A('a')]: { decimals: 18 }, [A('b')]: { decimals: 6 } }, _k: { token_info: { [A('c')]: { symbol: 'USDC', sell_simulation: 'revert' }, [A('d')]: { symbol: 'USDC' } }, token_registry: [{ symbol: 'USDC', address: A('b') }], origin: 'a.example', claimed_site: 'a.example' } });
t('ordre : minimum reçu aberrant', xr(typed({ sellToken: A('a'), buyToken: A('b'), sellAmount: '2000000000000000000', buyAmount: '1' }), tctx), 'critical');
t('ordre : prix normal', xr(typed({ sellToken: A('a'), buyToken: A('b'), sellAmount: '2000000000000000000', buyAmount: '6000000000' }), tctx), 'ok');
t('ordre : sortie vers un tiers', xr(typed({ outputs: [{ token: A('b'), recipient: other }] }), tctx), 'critical');
t('ordre : sortie vers soi', xr(typed({ outputs: [{ token: A('b'), recipient: me }] }), tctx), 'ok');
t('jeton sosie / vente en échec', xr({ method: 'eth_sendTransaction', params: [{ to: A('c'), data: '0x' + A('c').slice(2) }] }, tctx), 'critical');
t('jeton sosie (autre adresse que la référence)', xr({ method: 'eth_sendTransaction', params: [{ to: A('d') }] }, tctx), 'critical');
t('jeton de référence non signalé', xr({ method: 'eth_sendTransaction', params: [{ to: A('b') }] }, tctx), 'ok');
t('site identique', xr(typed({}), tctx), 'ok');
t('site différent', xr(typed({}), { ...tctx, _k: { ...tctx._k, origin: 'b.example' } }), 'critical');
t('origine homoglyphe', xr(typed({}), { ...tctx, _k: { ...tctx._k, origin: 'aѕ.example', claimed_site: undefined } }), 'critical');
t('ENS nom différent', xr(typed({}), { ...tctx, _k: { ...tctx._k, ens: { typed_name: 'a.eth ', intended_name: 'a.eth' } } }), 'critical');
console.log(fails ? `${fails} échec(s)` : 'tous OK'); process.exit(fails ? 1 : 0);
