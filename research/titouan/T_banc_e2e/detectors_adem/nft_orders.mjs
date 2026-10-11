// D-NFT : signed NFT marketplace orders (Seaport OrderComponents and BulkOrder trees, Blur/LooksRare-style `Order` with
// trader/side/price) read structurally, whatever the primaryType name.
//  RAISE  : the victim OFFERS assets (NFT or tokens) and the order pays the victim nothing or a negligible amount
//           (< 1 % of a reference : quote floor / declared amount ; or, without reference, below one milli-unit) -> critical.
//  LOWER  : documented false-positive fix (comparator says `unexpected_outgoing` / `unexpected_approval_connect` on an
//           honest listing). Lowered to warn ONLY when ALL hold :
//           - the engine floor (without intention) is not critical ;
//           - the user declared selling / listing (free text) ;
//           - Seaport : verifying contract is a known protocol ; conduit key = zero (Seaport itself) or the public OpenSea conduit key ;
//             offer = only NFTs of the victim ; every token consideration is native/ERC-20 ; >= 80 % of the price goes to the
//             victim ; price >= 50 % of the quoted floor or within 10 % of the declared amount ;
//           - setApprovalForAll : the operator is a known protocol (marketplace conduit), the collection is the one the
//             user declared listing (context.nft.collection), intent = selling / listing.
// NIST CSF DE.AE-02, RS.AN ; MITRE ATT&CK T1657 ; OWASP ASI09 (human-agent trust exploitation) ; D3FEND D3-DA.
import { lc, isAddr, isKnown, parseTyped, big, benchLower } from './util.mjs';

const SELL_WORDS = /\b(list|listing|sell|selling|sale|vend|vendre|vends|vente|lister|liste)\b/i;
const OPENSEA_CONDUIT_KEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000'; // public (OpenSea docs)
const ZERO32 = '0x' + '0'.repeat(64);
const isNftType = (t) => [2, 3, 4, 5].includes(Number(t));

function seaportOrders(msg) {
  if (!msg || typeof msg !== 'object') return [];
  if (Array.isArray(msg.offer) && Array.isArray(msg.consideration)) return [msg];
  if (msg.tree) { const out = []; const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if (Array.isArray(x.offer)) out.push(x); else Object.values(x).forEach(walk); } }; walk(msg.tree); return out; }
  return [];
}
function nativeUnits(amountRaw, decimals = 18) { return Number(big(amountRaw)) / 10 ** decimals; }

function refPrice(c) {
  const q = (c.context && c.context.quote) || {};
  const floor = Number(q.floorNative ?? q.floor ?? NaN);
  const declared = Number((c.intent && c.intent.amount) ?? NaN);
  return { floor: Number.isFinite(floor) && floor > 0 ? floor : null, declared: Number.isFinite(declared) && declared > 0 ? declared : null };
}

export const nftOrders = {
  id: 'nft_orders',
  run({ c, ctx, eff, request, intent, policy }) {
    const td = parseTyped(request);
    const v = lc(ctx.from);
    const flags = [];
    const ref = refPrice(c);
    if (td && td.message) {
      const m = td.message;
      // ---- Seaport-shaped
      const orders = seaportOrders(m);
      let honest = orders.length > 0;
      for (const o of orders) {
        const offerer = lc(o.offerer);
        const victimOffers = offerer === v && (o.offer || []).length > 0;
        const toVictim = (o.consideration || []).filter((x) => lc(x.recipient) === v && !isNftType(x.itemType)).reduce((s, x) => s + nativeUnits(x.endAmount ?? x.startAmount), 0);
        const total = (o.consideration || []).filter((x) => !isNftType(x.itemType)).reduce((s, x) => s + nativeUnits(x.endAmount ?? x.startAmount), 0);
        const thirdNft = (o.consideration || []).some((x) => isNftType(x.itemType) && lc(x.recipient) !== v);
        const reference = ref.floor ?? ref.declared;
        if (victimOffers && (toVictim === 0 || (reference ? toVictim < reference * 0.01 : toVictim < 0.001))) {
          flags.push({ code: 'order_gives_assets_for_nothing', severity: 'critical', detail: `ordre signé : vous cédez ${(o.offer || []).length} actif(s) contre ${toVictim} (unité native) versé(s) à vous${reference ? ` (référence ${reference})` : ''}` });
          honest = false; break;
        }
        const conduitOk = !o.conduitKey || lc(o.conduitKey) === ZERO32 || lc(o.conduitKey) === OPENSEA_CONDUIT_KEY;
        const nftOnly = (o.offer || []).every((x) => isNftType(x.itemType));
        const priceOk = (ref.floor && total >= ref.floor * 0.5) || (ref.declared && Math.abs(total - ref.declared) <= ref.declared * 0.1);
        if (!(victimOffers && nftOnly && !thirdNft && conduitOk && total > 0 && toVictim >= total * 0.8 && priceOk)) honest = false;
      }
      // ---- Blur / LooksRare-style flat order : trader + side + price
      if (!orders.length && isAddr(m.trader) && m.price !== undefined && m.side !== undefined) {
        const sell = String(m.side) === '1';
        const price = nativeUnits(m.price);
        const reference = ref.floor ?? ref.declared;
        if (lc(m.trader) === v && sell && (price === 0 || (reference ? price < reference * 0.01 : price < 0.001))) flags.push({ code: 'order_gives_assets_for_nothing', severity: 'critical', detail: `ordre de vente signé à un prix de ${price} : n'importe qui peut acheter votre NFT pour rien` });
      }
      if (flags.length) return { flags };
      const vcKnown = td.domain && isKnown(ctx, td.domain.verifyingContract);
      // `lower` COUPÉ dans le chemin produit (jamais de baisse) ; rendu au banc seulement (HOLDUP_BENCH_LOWER=1)
      if (benchLower() && honest && vcKnown && intent && SELL_WORDS.test(String(intent.freeText || '')) && policy && policy.floorLevel !== 'critical') {
        return { lower: { to: 'warn', why: 'listing NFT honnête : contrat de marché connu, conduit officiel, prix cohérent payé à vous, intention de vendre' } };
      }
      return null;
    }
    // ---- setApprovalForAll to a known marketplace operator for the collection the user is listing
    if (eff && request.method === 'eth_sendTransaction' && (eff.approvals || []).length) {
      const all = eff.approvals.every((a) => a.via === 'setApprovalForAll' && isKnown(ctx, a.spender));
      const coll = c.context && c.context.nft && c.context.nft.collection;
      const sameColl = isAddr(coll) && eff.approvals.every((a) => lc(a.token) === lc(coll));
      const noValue = !(eff.outgoing || []).length && !(eff.controlChange || []).length && !eff.delegation;
      // `lower` COUPÉ dans le chemin produit ; extra.nft.collection ne doit jamais venir de la page (voir pipeline/evaluate_plus.mjs, provenance de `extra`)
      if (benchLower() && all && sameColl && noValue && intent && SELL_WORDS.test(String(intent.freeText || '')) && policy && policy.floorLevel !== 'critical') {
        return { lower: { to: 'warn', why: 'approbation de collection au conduit d\'une place de marché connue, pour la collection que vous mettez en vente' } };
      }
    }
    return null;
  },
};
