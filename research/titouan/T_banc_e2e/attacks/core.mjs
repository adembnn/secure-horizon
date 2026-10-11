// core.mjs - monde synthetique, constructeurs de cas. TOUT EST SYNTHETIQUE.
import { rng, ri, pick, newAddr, rnd32, rndBytes, calldata, hex, toHexBytes, MAXU, MAXU160, MAXU48 } from './lib.mjs';

export const CASES = [];
const counters = {};
export const LABELS = { m: 'malveillant', b: 'benin', a: 'ambigu', f: 'fraude_conforme' };

// Tokens reels (adresses Ethereum mainnet, donnees DE MEMOIRE [V] : a verifier avant tout usage hors banc)
export const TOK = {
  USDC: { addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', dec: 6 },
  USDT: { addr: '0xdAC17F958D2ee523a2206206994597C13D831ec7', dec: 6 },
  DAI: { addr: '0x6B175474E89094C44Da98b954EedeAC495271d0F', dec: 18 },
  WETH: { addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', dec: 18 },
};
export const units = (n, sym) => BigInt(Math.round(n * 1e6)) * 10n ** BigInt(TOK[sym].dec - 6);

// Protocoles "connus" : reels de memoire [V] quand marque R, sinon synthetiques S (adresses tirees du PRNG)
export const KP = {
  permit2: { label: 'Permit2 (canonique)', address: '0x000000000022D473030F116dDEE9F6B43aC78BA3', prov: 'R[V]' },
  multicall3: { label: 'Multicall3', address: '0xcA11bde05977b3631167028862bE2a173976CA11', prov: 'R[V]' },
  cow: { label: 'CoW GPv2Settlement', address: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41', prov: 'R[V]' },
  seaport: { label: 'Seaport 1.6', address: '0x0000000000000068F116a894984e2DB1123eB395', prov: 'R[V]' },
  multisend: { label: 'Safe MultiSendCallOnly 1.3.0', address: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D', prov: 'R[V]' },
  routerV2: { label: 'Routeur swap V2 (connu)', address: newAddr(), prov: 'S' },
  routerV3: { label: 'Routeur swap V3 (connu)', address: newAddr(), prov: 'S' },
  universal: { label: 'Universal Router (connu)', address: newAddr(), prov: 'S' },
  aavePool: { label: 'Pool de pret (connu)', address: newAddr(), prov: 'S' },
  vault: { label: 'Coffre de rendement (connu)', address: newAddr(), prov: 'S' },
  nftKnown: { label: 'Collection NFT (mint officiel connu)', address: newAddr(), prov: 'S' },
  bridge: { label: 'Pont officiel (connu)', address: newAddr(), prov: 'S' },
  safeImpl: { label: 'Implementation Safe 1.3.0 (connue)', address: newAddr(), prov: 'S' },
  smartAcct: { label: 'Implementation compte intelligent 7702 (connue, auditee)', address: newAddr(), prov: 'S' },
  blurPool: { label: 'Place de marche NFT B (connue)', address: newAddr(), prov: 'S' },
  ens: { label: 'Registrar de noms (connu)', address: newAddr(), prov: 'S' },
  staking: { label: 'Staking liquide (connu)', address: newAddr(), prov: 'S' },
};
export const KNOWN_LIST = Object.values(KP).map((p) => ({ label: p.label, address: p.address, provenance: p.prov }));

export const LEGIT_SITES = ['app.uniswap.org', 'opensea.io', 'app.1inch.io', 'cowswap.exchange', 'app.aave.com', 'blur.io', 'app.safe.global', 'app.ens.domains', 'bridge.example-official.org'];

export const DECLARED_AT = 1760000000000;

export function world(o = {}) {
  const victim = newAddr(), paul = newAddr(), mum = newAddr(), exch = newAddr();
  return {
    chainId: o.chainId || 1,
    origin: o.origin || 'app.uniswap.org',
    victim,
    address_book: [
      { label: 'Paul', address: paul, kind: 'eoa' },
      { label: 'Maman', address: mum, kind: 'eoa' },
      { label: 'Mon Coinbase (depot)', address: exch, kind: 'exchange_deposit' },
    ],
    known_protocols: KNOWN_LIST,
    token_registry: Object.entries(TOK).map(([symbol, v]) => ({ symbol, address: v.addr, decimals: v.dec, canonical: true })),
    history: [],
    counterparty_facts: {},
    native_balance_eth: pick(['0.8', '2.4', '7.1', '31.0']),
    ...o.extra,
    _paul: paul, _mum: mum, _exch: exch,
  };
}
export function fact(ctx, addr, f) { ctx.counterparty_facts[addr.toLowerCase()] = f; return addr; }
export const EOA_NEW = { isContract: false, firstSeenByUser: true, ageBlocks: 40 };
export const CON_NEW = (age = 120) => ({ isContract: true, firstSeenByUser: true, ageBlocks: age });
export const CON_OLD = { isContract: true, firstSeenByUser: false, ageBlocks: 4000000 };

export function intent(kind, freeText, x = {}) {
  return { kind, freeText, declaredAt: DECLARED_AT, ...x };
}
export const AMTS = [20, 50, 100, 250, 500, 1000, 2500];
export const SYMS = ['USDC', 'USDT', 'DAI'];

export function tx(ctx, to, data, value = 0n, extra = {}) {
  return { method: 'eth_sendTransaction', params: [{ from: ctx.victim, to, value: hex(value), data: data || '0x', chainId: hex(ctx.chainId), ...extra }] };
}
export function typed(ctx, domain, types, primaryType, message) {
  const dt = [];
  if (domain.name !== undefined) dt.push({ name: 'name', type: 'string' });
  if (domain.version !== undefined) dt.push({ name: 'version', type: 'string' });
  if (domain.chainId !== undefined) dt.push({ name: 'chainId', type: 'uint256' });
  if (domain.verifyingContract !== undefined) dt.push({ name: 'verifyingContract', type: 'address' });
  const td = { types: { EIP712Domain: dt, ...types }, primaryType, domain, message };
  const s = JSON.stringify(td, (k, v) => typeof v === 'bigint' ? v.toString() : v);
  return { method: 'eth_signTypedData_v4', params: [ctx.victim, s] };
}
export function psign(ctx, text) { return { method: 'personal_sign', params: [toHexBytes(text), ctx.victim] }; }
export function psignHex(ctx, h) { return { method: 'personal_sign', params: [h, ctx.victim] }; }

// add(spec) : spec = {f,s,cat,src,req,ctx,intent,l,why,sev,ideal,sig,hard,approx,note,scen,blind}
export function add(sp) {
  counters[sp.f] = (counters[sp.f] || 0) + 1;
  const ctx = sp.ctx; const pub = { ...ctx }; delete pub._paul; delete pub._mum; delete pub._exch;
  const label = LABELS[sp.l];
  const ideal = sp.ideal || sp.sev;
  CASES.push({
    id: `${sp.f}-${String(counters[sp.f]).padStart(3, '0')}`,
    synthetic: true,
    notice: 'SYNTHETIQUE : jeu de test defensif, jamais a utiliser contre un systeme ou un utilisateur reel',
    family: sp.f,
    subfamily: sp.s,
    request: sp.req,
    context: pub,
    intent: sp.intent,
    label,
    reason: sp.why,
    expected_severity: sp.sev,
    ideal_severity: ideal,
    required_signals: sp.sig || [],
    blind_to_v3_contract: !!sp.blind,
    catalog_category: sp.cat,
    source: sp.src,
    hard: !!sp.hard,
    approximation: sp.approx ? { typed_data_or_selector_from_memory: true, note: sp.approx === true ? 'structure de memoire, a regenerer depuis le depot officiel' : sp.approx } : null,
    scenario: sp.scen || null,
    lang: sp.lang || 'fr',
  });
}
export { rng, ri, pick, newAddr, rnd32, rndBytes, calldata, hex, toHexBytes, MAXU, MAXU160, MAXU48 };
