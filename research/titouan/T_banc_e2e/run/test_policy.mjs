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
t('sélecteur inconnu vers contrat inconnu, avec valeur, intention achat (F28 : warn, F28 off : critical)', runI({ from: me, to: other, value: '0x10', data: '0xdeadbeef', chainId: '0x1' }, kctx, buy).level, 'warn');
t('mint vers contrat inconnu (non listé) reste opaque (warn, jamais ok)', runI({ from: me, to: other, value: '0x10', data: mint, chainId: '0x1' }, kctx, buy).level, 'warn');
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

// ---- F11/F14/F16/F21-F30 (adresses fabriquées par code)
const U = await import(pathToFileURL(join(ENG, 'abi_encode.mjs')).href).catch(() => null);
const pad = (x) => x.replace(/^0x/, '').padStart(64, '0');
const swapSel = await sel('swapExactAVAXForTokens(uint256,address[],address,uint256)');
const swapData = (to, min = '5') => swapSel + pad('0x' + min) + pad('0x80') + pad(to) + pad('0x1') + pad('0x1') + pad(A('9'));
const router = A('6');
const rctx = mkCtx({ knownSpenders: [impl, router], contacts: [{ address: other }] });
t('F14 swap bibliothèque vers soi => ok', runI({ from: me, to: router, value: '0x10', data: swapData(me), chainId: '0x1' }, rctx, buy).level, 'ok');
t('F14 swap bibliothèque vers un tiers => critical', runI({ from: me, to: router, value: '0x10', data: swapData(evil), chainId: '0x1' }, rctx, buy).level, 'critical');
t('F14 swap bibliothèque vers un contact => ok', runI({ from: me, to: router, value: '0x10', data: swapData(other), chainId: '0x1' }, rctx, buy).level, 'ok');
t('F14 même fonction sur contrat NON listé => reste opaque (warn ou pire)', runI({ from: me, to: evil, value: '0x10', data: swapData(me), chainId: '0x1' }, rctx, { kind: 'pay_someone', freeText: 'x', declaredAt: 1760000000000 }).level !== 'ok', true);
t('F14 minimum reçu = 0 => warn', runI({ from: me, to: router, value: '0x10', data: swapData(me, '0'), chainId: '0x1' }, rctx, buy).level, 'warn');
// sosie : A11 (vrai contact payé, sosie en poussière entrante) ; vrai sosie ; score faible
const real = '0xabc' + '1'.repeat(33) + 'def0', dust = '0xabc' + '2'.repeat(33) + 'def0', weak = '0xab' + '3'.repeat(35) + 'ef0';
const histCtx = (h) => mkCtx({ history: h, contacts: [] });
const pay = (to) => ({ from: me, to: A('7'), value: '0x0', data: '0xa9059cbb' + pad(to) + pad('0x64'), chainId: '0x1' });
const payI = { kind: 'pay_someone', freeText: 'x', declaredAt: 1760000000000, counterpartyAddress: real };
const lv = (to, h) => { const c = histCtx(h); const eff = E.analyzeTransaction(pay(to), c); X.applyExtraRules(eff, { method: 'eth_sendTransaction', params: [pay(to)] }, c); return P.applyPolicy({ eff, adem: compare({ ...payI, counterpartyAddress: to }, eff), ctx: c, intent: payI, request: {} }).level; };
const HX = [{ address: real, ts: 1759990000, direction: 'out' }, { address: dust, ts: 1759990600, direction: 'in', dust: true }];
t('F22 vrai contact payé malgré un sosie en poussière => pas critical', lv(real, HX) !== 'critical', true);
t('F21/rule 3+4 sosie jamais payé qui imite une adresse payée => critical', lv(dust, [{ address: real, ts: 1759990000, direction: 'out' }]), 'critical');
t('F23 score faible 2+3 sans atteindre 3+4 => warn', lv(weak, [{ address: real, ts: 1759990000, direction: 'out' }]), 'warn');
// F11 : produit négligeable ; F29 : virgule décimale ; F25 : personal_sign en forme d'appel ; F30 : signalisation
const order = (amt) => ({ method: 'eth_signTypedData_v4', params: [me, JSON.stringify({ types: {}, primaryType: 'OrderComponents', domain: {}, message: { offerer: me, offer: [{ itemType: 2, token: A('a'), identifierOrCriteria: '1', startAmount: '1', endAmount: '1' }], consideration: [{ itemType: 0, token: '0x' + '0'.repeat(40), identifierOrCriteria: '0', startAmount: amt, endAmount: amt, recipient: me }] } })] });
t('F11 vente à produit négligeable => critical', xr(order('1000000000'), tctx), 'critical');
t('F11 vente à prix normal => ok', xr(order('2000000000000000000'), tctx), 'ok');
const ps = (hex) => ({ method: 'personal_sign', params: [hex, me] });
t('F25 personal_sign en forme de calldata => critical', xr(ps('0xa9059cbb' + pad(other) + pad('0x64')), tctx), 'critical');
t('F25 personal_sign texte neutre => ok', xr(ps('0x' + Buffer.from('Hello, welcome').toString('hex')), tctx), 'ok');
t('F26 texte qui accorde des jetons => critical', xr(ps('0x' + Buffer.from('I authorize the transfer of all my tokens').toString('hex')), tctx), 'critical');
const vote = { method: 'eth_signTypedData_v4', params: [me, JSON.stringify({ types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }], Vote: [{ name: 'from', type: 'address' }, { name: 'space', type: 'string' }, { name: 'choice', type: 'uint32' }] }, primaryType: 'Vote', domain: { name: 'x', version: '1' }, message: { from: me, space: 's.eth', choice: '1' } })] };
const effV = () => { const e = E.analyzeTypedData(vote.params[1], tctx); X.applyExtraRules(e, vote, tctx); return P.applyPolicy({ eff: e, adem: null, ctx: tctx, intent: null, request: vote }); };
t('F30 vote hors chaîne => ok', effV().level, 'ok');
const payC = { from: me, to: A('7'), value: '0x0', data: '0xa9059cbb' + pad(other) + pad('0x' + (10500000).toString(16)), chainId: '0x1' };
const ctxC = mkCtx({ contacts: [{ address: other }], tokenMeta: { [A('7')]: { decimals: 6, symbol: 'USDC' } } });
const effC = E.analyzeTransaction(payC, ctxC); X.applyExtraRules(effC, { method: 'eth_sendTransaction', params: [payC] }, ctxC);
t('F29 virgule décimale ne crée pas un dépassement', P.applyPolicy({ eff: effC, adem: compare({ kind: 'pay_someone', amount: '10,5', token: 'USDC', counterpartyAddress: other, declaredAt: 1760000000000 }, effC), ctx: ctxC, intent: { amount: '10,5' }, request: {} }).reasons.some((r) => r.code === 'amount_exceeded'), false);
const opq = E.analyzeTransaction({ from: me, to: evil, value: '0x0', data: '0xdeadbeef', chainId: '0x1' }, mkCtx()); X.applyExtraRules(opq, { method: 'eth_sendTransaction', params: [{ to: evil }] }, mkCtx());
const vo = P.applyPolicy({ eff: opq, adem: null, ctx: mkCtx(), intent: null, request: {} });
t('opacity_only : opacité seule => warn + drapeau', vo.level + ':' + vo.opacity_only, 'warn:true');
console.log(fails ? `${fails} échec(s)` : 'tous OK'); process.exit(fails ? 1 : 0);
