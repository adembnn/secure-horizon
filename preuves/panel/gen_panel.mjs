// Grand panel « phrase écrite / demande » de preuves/ : vérité PAR CONSTRUCTION.
//   node preuves/panel/gen_panel.mjs            (aucun réseau, aucun secret, aucune lecture du produit ni de la grille existante)
// Écrit dans preuves/panel/ : REGLAGE.jsonl, CONTROLE.jsonl, CONTROLE_SHA256.txt, REGLAGE_SHA256.txt, PANEL_STATS.json
//
// Indépendance : générateur, encodeur ABI, graine, gabarits de phrases et règle de vérité sont écrits ici. Rien n'est importé du
// moteur, de l'extension ni de pipeline/grille. Les sélecteurs viennent d'une table écrite à la main (SEL).
//
// Une paire = un EFFET (ce que la demande fait, connu parce qu'on la fabrique) + une AFFIRMATION (ce que la phrase dit, connue parce
// qu'on la rend à partir d'une structure). La vérité est verite(affirmation, effet). Elle ne lit jamais un moteur.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { TPL, PRENOMS, NAMES_EN, LETTRES } from './gabarits.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GRAINE = 'holdup-preuves-panel-A-2026-10-11';
export const NOW_S = 1791700000; // 11 oct. 2026, instant fixe du panel (le banc fige l'horloge sur cet instant)
const REPS = Number(process.env.PANEL_REPS || 7);

// ------------------------------------------------------------------ hasard à graine fixe (sfc32, graine tirée d'un sha256)
const seedWords = (() => { const h = createHash('sha256').update(GRAINE).digest(); return [h.readUInt32LE(0), h.readUInt32LE(4), h.readUInt32LE(8), h.readUInt32LE(12)]; })();
let [sa, sb, sc, sd] = seedWords;
const rnd = () => { sa |= 0; sb |= 0; sc |= 0; sd |= 0; const t = (((sa + sb) | 0) + sd) | 0; sd = (sd + 1) | 0; sa = sb ^ (sb >>> 9); sb = (sc + (sc << 3)) | 0; sc = (sc << 21) | (sc >>> 11); sc = (sc + t) | 0; return (t >>> 0) / 4294967296; };
for (let i = 0; i < 20; i++) rnd();
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const addr = (tag) => '0x' + createHash('sha256').update('panel:' + GRAINE + ':' + tag).digest('hex').slice(0, 40);

// ------------------------------------------------------------------ monde (adresses publiques connues, écrites de mémoire : voir PROTOCOLE.md, limites)
const CHAINS = {
  1: { natif: 'ETH', tokens: {
    USDC: { a: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', d: 6, stable: true }, USDT: { a: '0xdac17f958d2ee523a2206206994597c13d831ec7', d: 6, stable: true },
    DAI: { a: '0x6b175474e89094c44da98b954eedeac495271d0f', d: 18, stable: true }, WETH: { a: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', d: 18 }, WBTC: { a: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', d: 8 } },
    horsListe: { LINK: { a: '0x514910771af9ca656af840dff83e8264ecf986ca', d: 18 }, UNI: { a: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', d: 18 } },
    protos: { Uniswap: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', Aave: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2', OpenSea: '0x1e0049783f008a0085193e00003d00cd54003c71' }, routeur: 'Uniswap', pret: 'Aave' },
  43114: { natif: 'AVAX', tokens: {
    USDC: { a: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', d: 6, stable: true }, USDT: { a: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', d: 6, stable: true }, WAVAX: { a: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', d: 18 } },
    horsListe: {},
    protos: { 'Trader Joe': '0x60ae616a2155ee3d9a68541ba4544862310933d4', Aave: '0x794a61358d6845594f94dc1db02a252b5b4814ad' }, routeur: 'Trader Joe', pret: 'Aave' },
};
const PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3';
const SEAPORT = '0x0000000000000068f116a894984e2db1123eb395';
const ZERO = '0x' + '0'.repeat(40);
// Sélecteurs : table écrite à la main (aucun calcul, aucune importation). Revérifiée par valide_panel.mjs contre une seconde table.
export const SEL = { approve: '0x095ea7b3', increaseAllowance: '0x39509351', transfer: '0xa9059cbb', setApprovalForAll: '0xa22cb465',
  swapExactTokensForTokens: '0x38ed1739', swapExactETHForTokens: '0x7ff36ab5', transferOwnership: '0xf2fde38b', addOwnerWithThreshold: '0x0d582f13' };
const MAX256 = (1n << 256n) - 1n, MAX160 = (1n << 160n) - 1n, MAX48 = (1n << 48n) - 1n;

const POOL = { stable: ['5', '12', '20', '25', '40', '50', '75', '100', '150', '200', '250', '300', '500', '750', '1000', '1500', '2500', '12.5', '49.99', '0.5', '1250.5'],
  eth: ['0.01', '0.05', '0.1', '0.2', '0.25', '0.5', '0.75', '1', '1.5', '2', '3'], btc: ['0.001', '0.01', '0.05', '0.1'],
  lettres: ['1', '2', '3', '5', '12', '20', '25', '40', '50', '75', '100', '150', '200', '250', '300', '500', '1000'], sep: ['1000', '1500', '2500', '12.5', '1250.5', '49.99', '0.5', '10000', '0.25'] };

// ------------------------------------------------------------------ montants décimaux exacts
const toRaw = (s, d) => { const [i, f = ''] = String(s).split('.'); if (f.length > d) throw new Error('trop de décimales ' + s); return BigInt(i) * 10n ** BigInt(d) + BigInt((f + '0'.repeat(d)).slice(0, d) || '0'); };
const fromRaw = (raw, d) => { const b = 10n ** BigInt(d), i = raw / b, f = (raw % b).toString().padStart(d, '0').replace(/0+$/, ''); return i.toString() + (f ? '.' + f : ''); };
const mul = (s, d, num, den = 1n) => fromRaw((toRaw(s, d) * BigInt(num)) / BigInt(den), d);

// ------------------------------------------------------------------ encodeur ABI minimal (écrit ici)
const w = (v) => BigInt(v).toString(16).padStart(64, '0');
const wa = (a) => a.slice(2).toLowerCase().padStart(64, '0');
const enc = {
  approve: (sp, raw) => SEL.approve + wa(sp) + w(raw),
  increaseAllowance: (sp, raw) => SEL.increaseAllowance + wa(sp) + w(raw),
  transfer: (to, raw) => SEL.transfer + wa(to) + w(raw),
  setApprovalForAll: (op, ok) => SEL.setApprovalForAll + wa(op) + w(ok ? 1 : 0),
  swapTokens: (inRaw, minOut, path, to, deadline) => SEL.swapExactTokensForTokens + w(inRaw) + w(minOut) + w(160) + wa(to) + w(deadline) + w(path.length) + path.map(wa).join(''),
  swapEth: (minOut, path, to, deadline) => SEL.swapExactETHForTokens + w(minOut) + w(128) + wa(to) + w(deadline) + w(path.length) + path.map(wa).join(''),
  transferOwnership: (o) => SEL.transferOwnership + wa(o),
  addOwner: (o, th) => SEL.addOwnerWithThreshold + wa(o) + w(th),
};
const hexv = (raw) => '0x' + BigInt(raw).toString(16);
const tx = (W, to, data, valueRaw = 0n, extra = {}) => ({ method: 'eth_sendTransaction', params: [Object.assign({ from: W.me, to, value: hexv(valueRaw), data, chainId: hexv(W.chain) }, extra)] });
const batch = (W, calls) => ({ method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: W.me, chainId: hexv(W.chain), atomicRequired: true, calls: calls.map((c) => ({ to: c.to, data: c.data, value: hexv(c.value || 0n) })) }] });
const typed = (W, td) => ({ method: 'eth_signTypedData_v4', params: [W.me, JSON.stringify(td)] });
const DOM = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
const permitTD = (W, tok, spender, raw, deadline, domChain) => ({ types: { EIP712Domain: DOM, Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  domain: { name: tok.sym === 'USDC' ? 'USD Coin' : tok.sym, version: '2', chainId: domChain ?? W.chain, verifyingContract: tok.a }, primaryType: 'Permit',
  message: { owner: W.me, spender, value: raw.toString(), nonce: 0, deadline: deadline.toString() } });
const permit2TD = (W, tok, spender, raw, expiration, sigDeadline, domChain) => ({ types: { EIP712Domain: [DOM[0], DOM[2], DOM[3]],
  PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }],
  PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
  domain: { name: 'Permit2', chainId: domChain ?? W.chain, verifyingContract: PERMIT2 }, primaryType: 'PermitSingle',
  message: { details: { token: tok.a, amount: raw.toString(), expiration: expiration.toString(), nonce: 0 }, spender, sigDeadline: sigDeadline.toString() } });
const seaportTD = (W, collection, tokenId, sellerWei, feeWei, feeTo) => ({ types: { EIP712Domain: DOM,
  OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
  OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
  ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }] },
  domain: { name: 'Seaport', version: '1.6', chainId: W.chain, verifyingContract: SEAPORT }, primaryType: 'OrderComponents',
  message: { offerer: W.me, zone: ZERO, offer: [{ itemType: 2, token: collection, identifierOrCriteria: String(tokenId), startAmount: '1', endAmount: '1' }],
    consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: '0', startAmount: sellerWei.toString(), endAmount: sellerWei.toString(), recipient: W.me }].concat(feeWei > 0n ? [{ itemType: 0, token: ZERO, identifierOrCriteria: '0', startAmount: feeWei.toString(), endAmount: feeWei.toString(), recipient: feeTo }] : []),
    orderType: 0, startTime: String(NOW_S), endTime: String(NOW_S + 7 * 86400), zoneHash: '0x' + '0'.repeat(64), salt: '12345', conduitKey: '0x' + '0'.repeat(64), counter: '0' } });
const utf8hex = (s) => '0x' + Buffer.from(s, 'utf8').toString('hex');

// ------------------------------------------------------------------ monde d'une paire
let wn = 0;
function world(chain) {
  const tag = 'w' + (++wn), C = CHAINS[chain];
  const W = { tag, chain, C, me: addr(tag + ':moi'), ami: addr(tag + ':ami'), tiers: addr(tag + ':tiers'), inconnu: addr(tag + ':inconnu'), collection: addr(tag + ':collection'),
    origin: 'https://' + pick(['app.echange-demo', 'www.marche-demo', 'app.pret-demo', 'portail-demo', 'app.jetons-demo', 'boutique-demo']) + '.example' };
  return W;
}
const tok = (W, sym, kind = 'canon') => {
  if (kind === 'sosie') { const t = W.C.tokens[sym]; return { sym, a: addr(W.tag + ':sosie:' + sym), d: t.d, stable: !!t.stable, kind }; }
  if (kind === 'horsliste') { const t = W.C.horsListe[sym]; return { sym, a: t.a, d: t.d, stable: false, kind }; }
  const t = W.C.tokens[sym]; return { sym, a: t.a, d: t.d, stable: !!t.stable, kind: 'canon' };
};
const poolOf = (t, hint) => (hint === 'lettres' ? POOL.lettres : hint === 'sep' ? (t.stable ? POOL.sep : ['0.25', '0.5', '1.5', '2.5']) : t.stable ? POOL.stable : t.sym === 'WBTC' ? POOL.btc : POOL.eth);

// ------------------------------------------------------------------ règle de vérité (voir PROTOCOLE.md, section 2)
// affirmation : { act, amount?, unit: 'jeton' | 'USD', token?, toToken?, dest?: { kind: 'addr' | 'proto' | 'nom', addr? }, illimite?, vague?, nftId?, prix? }
// effet : { lisible, parts: [...], defauts: [codes des attentes par défaut trahies] }
const ALLOWED = { pay: ['send'], swap: ['grant', 'swap'], grant: ['grant'], deposit: ['grant'], rien: ['login'], nft_sell: ['nft_one', 'nft_right', 'seaport'] };
const EXTRA = new Set(['control', 'setting']); // ne sont ni un paiement ni un droit : jugés par les attentes par défaut
export function verite(c, e) {
  const R = (v, why, ecart) => ({ v, why, ecart: ecart || null });
  if (!e.lisible) return R('indecidable', 'demande illisible : personne ne peut dire ce qu\'elle fait');
  if (c.vague || c.act === 'none') return R('indecidable', 'la phrase ne dit rien de vérifiable');
  const parts = e.parts.filter((p) => !EXTRA.has(p.t));
  // 1. nature de l'opération
  for (const p of parts) if (!ALLOWED[c.act].includes(p.t)) return R('non_conforme', `nature : la phrase dit « ${c.act} », la demande contient « ${p.t} »`, 'nature');
  // 2. chaque chose dite est-elle contredite ?
  const tokBad = (p, sym) => (c.token && sym !== c.token ? 'jeton' : p.kind === 'sosie' ? 'jeton_sosie' : null);
  const over = (said, real, d) => real === 'max' || toRaw(real, d) > toRaw(said, d);
  let grants = 0, sends = 0;
  for (const p of parts) {
    if (p.t === 'grant') {
      grants++;
      const b = tokBad(p, p.sym); if (b) return R('non_conforme', b === 'jeton' ? `jeton : la phrase dit ${c.token}, le droit porte sur ${p.sym}` : `jeton de même symbole mais d'adresse différente (${p.sym})`, b);
      if (grants > 1) return R('non_conforme', 'un second droit que la phrase n\'annonce pas', 'D7_lot');
      const comparable = c.amount && (c.unit === 'jeton' || p.stable);
      if (!c.illimite && comparable && over(c.amount, p.amount, p.d)) return R('non_conforme', `droit plus large : écrit ${c.amount}, accordé ${p.amount === 'max' ? 'illimité' : p.amount} ${p.sym}`, p.amount === 'max' ? 'droit_illimite' : 'montant');
      if (c.dest && c.dest.kind !== 'nom' && (c.act === 'grant' || c.act === 'deposit') && p.spender !== c.dest.addr) return R('non_conforme', 'le droit est donné à une autre adresse que celle écrite ou nommée', 'destinataire');
    } else if (p.t === 'send') {
      sends++;
      const sym = p.sym; const b = c.token && sym !== c.token ? 'jeton' : p.kind === 'sosie' ? 'jeton_sosie' : null;
      if (b) return R('non_conforme', b === 'jeton' ? `jeton : la phrase dit ${c.token}, la demande envoie ${sym}` : `jeton de même symbole mais d'adresse différente (${sym})`, b);
      if (sends > 1) return R('non_conforme', 'un second envoi que la phrase n\'annonce pas', p.sym === 'NATIF' ? 'D8_valeur' : 'D7_lot');
      const comparable = c.amount && (c.unit === 'jeton' || p.stable);
      if (comparable && toRaw(p.amount, p.d) !== toRaw(c.amount, p.d)) return R('non_conforme', `montant : écrit ${c.amount}, envoyé ${p.amount} ${sym}`, 'montant');
      if (c.dest && c.dest.kind === 'addr' && p.to !== c.dest.addr) return R('non_conforme', 'destinataire : l\'envoi part vers une autre adresse que celle écrite', 'destinataire');
    } else if (p.t === 'swap') {
      const b = c.token && p.inSym !== c.token ? 'jeton' : p.inKind === 'sosie' ? 'jeton_sosie' : null;
      if (b) return R('non_conforme', `jeton dépensé : la phrase dit ${c.token}, l'échange prend ${p.inSym}`, b);
      if (c.toToken && p.outSym !== c.toToken) return R('non_conforme', `jeton reçu : la phrase dit ${c.toToken}, l'échange donne ${p.outSym}`, 'jeton');
      const comparable = c.amount && (c.unit === 'jeton' || p.inStable);
      if (comparable && toRaw(p.inAmount, p.inD) > toRaw(c.amount, p.inD)) return R('non_conforme', `montant : écrit ${c.amount}, l'échange prend ${p.inAmount} ${p.inSym}`, 'montant');
    } else if (p.t === 'nft_one') {
      if (c.nftId && String(p.id) !== String(c.nftId)) return R('non_conforme', 'autre objet que celui écrit', 'jeton');
      if (c.dest && p.operator !== c.dest.addr) return R('non_conforme', 'droit donné à une autre adresse que la place de marché nommée', 'destinataire');
    } else if (p.t === 'nft_right') {
      if (c.dest && p.operator !== c.dest.addr) return R('non_conforme', 'droit donné à une autre adresse que la place de marché nommée', 'destinataire');
    }
  }
  // 3. un élément nécessaire n'est pas dit : on ne conclut pas
  const main = parts.find((p) => p.t === 'grant' || p.t === 'send' || p.t === 'swap');
  if (main) {
    const stable = main.t === 'swap' ? main.inStable : main.stable;
    if (!c.illimite && !c.amount) return R('indecidable', 'montant non écrit');
    if (!c.token && !(c.unit === 'USD' && stable)) return R('indecidable', 'jeton non écrit (ou « dollars » face à un jeton qui n\'est pas un dollar)');
    if (c.act === 'pay' && !(c.dest && c.dest.kind === 'addr')) return R('indecidable', 'destinataire nommé sans adresse : invérifiable');
    if (c.act === 'grant' && !(c.dest && c.dest.kind !== 'nom')) return R('indecidable', 'bénéficiaire du droit non écrit');
  }
  // 4. tout ce qui est écrit est respecté : reste ce que la personne suppose sans l'écrire
  if (e.defauts && e.defauts.length) return R('non_conforme', 'phrase respectée, attente par défaut trahie : ' + e.defauts.join(', '), e.defauts[0]);
  return R('conforme', 'tout ce que la demande fait est couvert par la phrase');
}

// ------------------------------------------------------------------ description lisible de l'effet (pour ERREURS.jsonl)
const court = (a) => a.slice(0, 6) + '…' + a.slice(-4);
function decrire(e, W) {
  if (!e.lisible) return e.note || 'appel illisible';
  const qui = (a) => { for (const [n, x] of Object.entries(W.C.protos)) if (x === a) return n + ' (' + court(a) + ')'; return a === W.me ? 'ton compte' : court(a) + (a === W.inconnu || a === W.tiers ? ' (adresse inconnue)' : ''); };
  const t = (p) => {
    if (p.t === 'grant') return `${p.sig ? 'signature qui donne' : 'donne'} à ${qui(p.spender)} le droit de dépenser ${p.amount === 'max' ? 'un montant illimité de' : p.amount} ${p.sym}${p.kind === 'sosie' ? ' (jeton sosie, autre adresse)' : p.kind === 'horsliste' ? ' (jeton réel hors liste du produit)' : ''}${p.duree ? ', valable ' + p.duree : ''}`;
    if (p.t === 'send') return `envoie ${p.amount} ${p.sym === 'NATIF' ? W.C.natif + ' (monnaie du réseau)' : p.sym}${p.kind === 'sosie' ? ' (jeton sosie)' : p.kind === 'horsliste' ? ' (jeton réel hors liste du produit)' : ''} à ${qui(p.to)}`;
    if (p.t === 'swap') return `échange ${p.inAmount} ${p.inSym} contre ${p.outSym}, reçu par ${p.to === W.me ? 'ton compte' : court(p.to) + ' (une autre adresse)'}, minimum reçu ${p.minOut}`;
    if (p.t === 'nft_right') return `donne à ${qui(p.operator)} le droit de déplacer TOUS les NFT de la collection ${court(p.collection)}`;
    if (p.t === 'nft_one') return `donne à ${qui(p.operator)} le droit de déplacer le NFT n° ${p.id} de la collection ${court(p.collection)}`;
    if (p.t === 'seaport') return `ordre de vente hors chaîne du NFT n° ${p.id} : le vendeur reçoit ${p.recu} ${W.C.natif}`;
    if (p.t === 'login') return 'message de connexion au site (ne déplace rien, ne donne aucun droit)';
    if (p.t === 'control') return p.note;
    if (p.t === 'setting') return p.note;
    if (p.t === 'recurring') return p.note;
    return p.t;
  };
  return e.parts.map(t).join(' ; ') + (e.note ? ' ; ' + e.note : '');
}

// ------------------------------------------------------------------ rendu de la phrase
const split = (list) => { const i = list.indexOf('|'); return i < 0 ? { vus: list, tenus: [] } : { vus: list.slice(0, i), tenus: list.slice(i + 1) }; };
function gabarit(act, style, lang) {
  const node = style === 'vague' ? TPL.vague[lang] : (TPL[act][style] || {})[lang];
  if (!node) return null;
  const { vus, tenus } = split(node);
  const tenu = tenus.length > 0 && chance(0.2);
  const g = pick(tenu ? tenus : vus);
  return { g: typeof g === 'string' ? { t: g } : g, tenu };
}
const fmtNum = (s, lang, sep) => {
  let [i, f] = String(s).split('.');
  if (sep && i.length > 3) i = i.replace(/\B(?=(\d{3})+$)/g, lang === 'fr' ? ' ' : ',');
  return i + (f ? (lang === 'fr' ? ',' : '.') + f : '');
};
const DOLLARS = { fr: ['{n} dollars', '{n} $', '{n}$', '{n} USD'], en: ['${n}', '{n} dollars', '{n} bucks', '{n} USD'] };
// Styles -> (gabarits utilisés, langue, transformation de l'affirmation)
const STYLES = {
  precis: { lang: ['fr'], src: 'precis' }, anglais: { lang: ['en'], src: ['precis', 'familier'] }, familier: { lang: ['fr'], src: 'familier' }, fautes: { lang: ['fr'], src: 'fautes' },
  sans_montant: { lang: ['fr', 'en'], src: 'sans_montant' }, dollars: { lang: ['fr', 'en'], src: 'dollars' }, lettres: { lang: ['fr', 'en'], src: 'precis' }, separateurs: { lang: ['fr', 'en'], src: 'precis' },
  dictee: { lang: ['fr', 'en'], src: 'dictee' }, nom: { lang: ['fr', 'en'], src: 'precis' }, vague: { lang: ['fr', 'en'], src: 'vague' }, illimite: { lang: ['fr', 'en'], src: 'illimite' },
};
// Rend la phrase et renvoie l'affirmation telle que la phrase la dit vraiment (le style peut retirer une information).
function rendre(base, style, W) {
  const S = STYLES[style], lang = pick(S.lang), act = base.act;
  const src = Array.isArray(S.src) ? (TPL[act][S.src[1]] && TPL[act][S.src[1]][lang] && chance(0.35) ? S.src[1] : S.src[0]) : S.src;
  const G = gabarit(act, src, lang); if (!G) return null;
  if (style === 'vague' || G.g.vague) return { phrase: G.g.t, lang, gabarit: `${style === 'vague' ? 'vague' : act}:${src}:${lang}:${G.g.t}`, tenu: G.tenu, claim: { act: 'none', vague: true, dictee: style === 'dictee' } };
  const c = { act, unit: 'jeton', dictee: style === 'dictee' };
  let s = G.g.t;
  const symTxt = (sym) => (style === 'familier' && chance(0.4) ? sym.toLowerCase() : sym);
  if (s.includes('{M}')) {
    const n = style === 'lettres' ? LETTRES[lang][base.amount] : fmtNum(base.amount, lang, style === 'separateurs');
    if (n == null) return null;
    s = s.replace('{M}', n + ' ' + symTxt(base.token)); c.amount = base.amount; c.token = base.token;
  }
  if (s.includes('{D}')) { s = s.replace('{D}', pick(DOLLARS[lang]).replace('{n}', fmtNum(base.amount, lang, false))); c.amount = base.amount; c.unit = 'USD'; }
  if (s.includes('{T}')) { s = s.replace('{T}', symTxt(base.token)); c.token = base.token; }
  if (s.includes('{T2}')) { if (!base.toToken) return null; s = s.replace('{T2}', base.toToken === 'NATIF' ? W.C.natif : base.toToken); c.toToken = base.toToken; }
  if (s.includes('{A}')) {
    if (style === 'nom') { s = s.replace(/(mon Ledger |mon autre portefeuille |my own wallet |my cold wallet |l'adresse )?\{A\}/, pick(lang === 'fr' ? PRENOMS : NAMES_EN)); c.dest = { kind: 'nom' }; }
    else { s = s.replace('{A}', base.dest.addr); c.dest = { kind: 'addr', addr: base.dest.addr }; }
  }
  if (s.includes('{P}')) {
    if (!base.dest) return null;
    s = s.replace('{P}', base.dest.kind === 'proto' ? base.dest.name : (lang === 'fr' ? 'l\'adresse ' : 'the address ') + base.dest.addr); c.dest = { kind: base.dest.kind, addr: base.dest.addr, name: base.dest.name };
  }
  if (s.includes('{ID}')) { s = s.replace('{ID}', String(base.nftId)); c.nftId = base.nftId; if (base.dest) c.dest = base.dest; }
  if (s.includes('{PRIX}')) { s = s.replace('{PRIX}', fmtNum(base.prix, lang, false) + ' ' + W.C.natif); c.prix = base.prix; }
  if (style === 'illimite') c.illimite = true;
  if (/\{[A-Z0-9]+\}/.test(s)) throw new Error('joker non rendu : ' + s);
  return { phrase: s, lang, gabarit: `${act}:${src}:${lang}:${G.g.t}`, tenu: G.tenu, claim: c };
}
// Gabarits propres aux actes NFT (attentes par défaut D3 et D5) : ajoutés ici pour rester à côté de leur usage.
TPL.nft_sell = {
  precis: { fr: ['Mettre en vente mon NFT numéro {ID} sur OpenSea', 'Je veux vendre mon NFT #{ID} sur OpenSea', 'Autoriser OpenSea à vendre mon NFT {ID}', '|', 'Proposer mon NFT {ID} à la vente sur OpenSea'],
    en: ['List my NFT #{ID} on OpenSea', 'I want to sell my NFT {ID} on OpenSea', '|', 'Put my NFT #{ID} up for sale on OpenSea'] },
  familier: { fr: ['je liste mon NFT {ID} sur OpenSea', 'je vends mon NFT {ID} sur OpenSea', '|', 'je mets mon NFT {ID} sur OpenSea'], en: ['listing my NFT {ID} on OpenSea', '|', 'selling NFT {ID} on OpenSea'] },
  fautes: { fr: ['Metre en vente mon NFT numero {ID} sur OpenSea', 'Je veux vendre mon NFT {ID} sur Opensea', '|', 'vandre mon NFT {ID} sur OpenSea'] },
  prix: { fr: ['Vendre mon NFT {ID} pour {PRIX} sur OpenSea', 'Mettre en vente mon NFT numéro {ID} à {PRIX} sur OpenSea', '|', 'Je vends mon NFT {ID} au prix de {PRIX} sur OpenSea'],
    en: ['Sell my NFT {ID} for {PRIX} on OpenSea', 'List my NFT #{ID} at {PRIX} on OpenSea', '|', 'Selling NFT {ID} on OpenSea, price {PRIX}'] },
};
STYLES.prix = { lang: ['fr', 'en'], src: 'prix' };

// ------------------------------------------------------------------ scénarios : (nature, écart) -> affirmation de base + effet + demande
const FACT = [[3, 2], [2, 1], [10, 1], [100, 1], [1000, 1]]; // 1,5 fois à 1 000 fois
const chainFor = (need) => (need === 1 ? 1 : chance(0.7) ? 1 : 43114);
const stableOf = (W) => pick(Object.keys(W.C.tokens).filter((s) => W.C.tokens[s].stable));
const otherTok = (W, sym) => pick(Object.keys(W.C.tokens).filter((s) => s !== sym));
const volatile = (W) => pick(Object.keys(W.C.tokens).filter((s) => !W.C.tokens[s].stable));
function pickTok(W, hint) { return tok(W, hint === 'dollars' || hint === 'lettres' || chance(0.75) ? stableOf(W) : volatile(W)); }
const amountFor = (t, hint) => pick(poolOf(t, hint));
const proto = (W, name) => ({ kind: 'proto', name, addr: W.C.protos[name] });
const far = () => pick([BigInt(NOW_S + 10 * 365 * 86400), MAX256]);
const soon = () => BigInt(NOW_S + 1800);

// Fabrique la demande d'un droit selon la nature. -> { request, part }
function grantReq(W, nature, t, spender, amount, o = {}) {
  const raw = amount === 'max' ? (nature === 'permit2' ? MAX160 : MAX256) : toRaw(amount, t.d);
  const part = { t: 'grant', sym: t.sym, kind: t.kind, stable: t.stable, d: t.d, spender, amount, sig: nature === 'permit' || nature === 'permit2' };
  if (nature === 'approve') return { request: tx(W, t.a, enc.approve(spender, raw), o.value || 0n), part };
  if (nature === 'increaseAllowance') return { request: tx(W, t.a, enc.increaseAllowance(spender, raw), o.value || 0n), part };
  if (nature === 'permit') { const dl = o.deadline ?? soon(); part.duree = dl > BigInt(NOW_S + 86400) ? 'sans échéance proche' : '30 minutes'; return { request: typed(W, permitTD(W, t, spender, raw, dl, o.domChain)), part }; }
  const exp = o.deadline ?? soon(); part.duree = exp > BigInt(NOW_S + 86400) ? 'sans échéance proche' : '30 minutes';
  return { request: typed(W, permit2TD(W, t, spender, raw, exp > MAX48 ? MAX48 : exp, soon(), o.domChain)), part };
}
const GRANT_NATURES = ['approve', 'increaseAllowance', 'permit', 'permit2'];
const okTokFor = (nature, W, hint) => (nature === 'permit' ? tok(W, 'USDC') : pickTok(W, hint));

// Chaque scénario : { nature, ecart, axe: 'ecrit' | 'defaut' | 'aucun', acts: [...], build(act, hint) -> { W, base, effet, request } }
const SC = [];
const add = (nature, ecart, axe, acts, build, styles) => SC.push({ nature, ecart, axe, acts, build, styles });
const baseGrantClaim = (W, act, t, amount, spenderName) => (act === 'swap' ? { act, amount, token: t.sym, toToken: otherTok(W, t.sym) }
  : act === 'deposit' ? { act, amount, token: t.sym, dest: proto(W, W.C.pret) } : { act, amount, token: t.sym, dest: spenderName ? proto(W, spenderName) : { kind: 'addr', addr: W.ami } });
const spenderOf = (W, base) => (base.act === 'swap' ? W.C.protos[W.C.routeur] : base.dest.addr);

for (const nature of GRANT_NATURES) {
  const acts = ['swap', 'grant', 'deposit'];
  add(nature, 'aucun', 'aucun', acts, (act, hint) => {
    const W = world(chainFor(nature === 'permit' ? 0 : 0)), t = okTokFor(nature, W, hint), amount = amountFor(t, hint);
    const base = baseGrantClaim(W, act, t, amount, act === 'grant' && chance(0.6) ? W.C.routeur : null);
    const real = chance(0.2) && hint !== 'illimite' ? mul(amount, t.d, 4, 5) : amount; // parfois un droit INFÉRIEUR au montant écrit : toujours conforme
    const g = grantReq(W, nature, t, spenderOf(W, base), hint === 'illimite' ? 'max' : real);
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  });
  add(nature, 'montant', 'ecrit', acts, (act, hint) => {
    const W = world(chainFor()), t = okTokFor(nature, W, hint), amount = amountFor(t, hint), f = pick(FACT);
    const base = baseGrantClaim(W, act, t, amount, act === 'grant' && chance(0.6) ? W.C.routeur : null);
    const g = grantReq(W, nature, t, spenderOf(W, base), mul(amount, t.d, f[0], f[1]));
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  });
  add(nature, 'droit_illimite', 'ecrit', acts, (act, hint) => {
    const W = world(chainFor()), t = okTokFor(nature, W, hint), amount = amountFor(t, hint);
    const base = baseGrantClaim(W, act, t, amount, act === 'grant' && chance(0.6) ? W.C.routeur : null);
    const g = grantReq(W, nature, t, spenderOf(W, base), 'max');
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  });
  add(nature, 'jeton', 'ecrit', acts, (act, hint) => {
    const W = world(chainFor()), said = pickTok(W, hint), amount = amountFor(said, hint);
    const realSym = nature === 'permit' ? 'USDC' : otherTok(W, said.sym);
    const saidTok = nature === 'permit' ? tok(W, otherTok(W, 'USDC')) : said;
    const real = tok(W, realSym), am = amountFor(saidTok, hint);
    const base = baseGrantClaim(W, act, saidTok, am, act === 'grant' && chance(0.6) ? W.C.routeur : null);
    if (base.toToken === real.sym) base.toToken = otherTok(W, real.sym) === saidTok.sym ? base.toToken : otherTok(W, real.sym);
    const g = grantReq(W, nature, real, spenderOf(W, base), am.includes('.') && am.split('.')[1].length > real.d ? '1' : am);
    void amount;
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  }, ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'lettres', 'separateurs', 'dictee', 'vague']);
  add(nature, 'jeton_sosie', 'defaut', acts, (act, hint) => {
    const W = world(chainFor()), t0 = okTokFor(nature, W, hint), t = tok(W, t0.sym, 'sosie'), amount = amountFor(t, hint);
    const base = baseGrantClaim(W, act, t, amount, act === 'grant' && chance(0.6) ? W.C.routeur : null);
    const g = grantReq(W, nature, t, spenderOf(W, base), amount);
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  });
  add(nature, 'destinataire', 'ecrit', ['grant', 'deposit'], (act, hint) => {
    const W = world(chainFor()), t = okTokFor(nature, W, hint), amount = amountFor(t, hint);
    const base = baseGrantClaim(W, act, t, amount, act === 'grant' && chance(0.6) ? W.C.routeur : null);
    const g = grantReq(W, nature, t, W.inconnu, hint === 'illimite' ? 'max' : amount);
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  });
  add(nature, 'nature', 'ecrit', ['rien', 'pay'], (act, hint) => {
    const W = world(chainFor()), t = okTokFor(nature, W, hint), amount = amountFor(t, hint);
    const base = act === 'rien' ? { act } : { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } };
    const g = grantReq(W, nature, t, act === 'pay' ? W.ami : W.inconnu, chance(0.5) ? 'max' : amount);
    return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
  });
}
// Droit illimité VOULU et écrit : conforme si le bénéficiaire est celui écrit.
add('approve', 'aucun_illimite_voulu', 'aucun', ['grant'], () => {
  const W = world(chainFor()), t = pickTok(W), base = { act: 'grant', token: t.sym, dest: chance(0.6) ? proto(W, W.C.routeur) : { kind: 'addr', addr: W.ami } };
  const g = grantReq(W, 'approve', t, base.dest.addr, 'max');
  return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
}, ['illimite']);
add('approve', 'destinataire_illimite_voulu', 'ecrit', ['grant'], () => {
  const W = world(chainFor()), t = pickTok(W), base = { act: 'grant', token: t.sym, dest: chance(0.6) ? proto(W, W.C.routeur) : { kind: 'addr', addr: W.ami } };
  const g = grantReq(W, 'approve', t, W.inconnu, 'max');
  return { W, base, effet: { lisible: true, parts: [g.part], defauts: [] }, request: g.request };
}, ['illimite']);

// --- droit sur tous les NFT d'une collection, face à une phrase qui n'en parle pas
add('nft_tous', 'nature', 'ecrit', ['rien', 'swap', 'pay'], (act, hint) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint);
  const base = act === 'rien' ? { act } : act === 'swap' ? { act, amount, token: t.sym, toToken: otherTok(W, t.sym) } : { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } };
  return { W, base, effet: { lisible: true, parts: [{ t: 'nft_right', operator: W.inconnu, collection: W.collection }], defauts: [] }, request: tx(W, W.collection, enc.setApprovalForAll(W.inconnu, true)) };
});

// --- envois : jeton ERC-20 et monnaie du réseau
function sendReq(W, nature, t, to, amount, o = {}) {
  if (nature === 'natif') return { request: tx(W, to, '0x', toRaw(amount, 18)), parts: [{ t: 'send', sym: 'NATIF', kind: 'canon', stable: false, d: 18, to, amount }] };
  const parts = [{ t: 'send', sym: t.sym, kind: t.kind, stable: t.stable, d: t.d, to, amount }];
  if (o.value) parts.push({ t: 'send', sym: 'NATIF', kind: 'canon', stable: false, d: 18, to: t.a, amount: fromRaw(o.value, 18) });
  return { request: tx(W, t.a, enc.transfer(to, toRaw(amount, t.d)), o.value || 0n), parts };
}
const natifTok = (W) => ({ sym: W.C.natif, d: 18, stable: false, kind: 'canon' });
for (const nature of ['transfert', 'natif']) {
  const T = (W, hint) => (nature === 'natif' ? natifTok(W) : pickTok(W, hint));
  const styles = nature === 'natif' ? ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'lettres', 'separateurs', 'dictee', 'nom', 'vague'] : undefined;
  add(nature, 'aucun', 'aucun', ['pay'], (act, hint) => {
    const W = world(chainFor()), t = T(W, hint), amount = amountFor(t, hint), base = { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } };
    const s = sendReq(W, nature, t, W.ami, amount);
    return { W, base, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
  }, styles);
  add(nature, 'montant', 'ecrit', ['pay'], (act, hint) => {
    const W = world(chainFor()), t = T(W, hint), amount = amountFor(t, hint), f = pick([[5, 4], [2, 1], [10, 1], [100, 1]]), base = { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } };
    const s = sendReq(W, nature, t, W.ami, mul(amount, t.d, f[0], f[1]));
    return { W, base, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
  }, styles);
  add(nature, 'destinataire', 'ecrit', ['pay'], (act, hint) => {
    const W = world(chainFor()), t = T(W, hint), amount = amountFor(t, hint), base = { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } };
    // une fois sur deux, l'autre adresse partage les 4 premiers et 4 derniers caractères de l'adresse écrite
    const autre = chance(0.5) ? W.ami.slice(0, 6) + W.tiers.slice(6, 38) + W.ami.slice(38) : W.tiers;
    const s = sendReq(W, nature, t, autre, amount);
    return { W, base, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
  }, styles);
  add(nature, 'nature', 'ecrit', ['rien', 'swap', 'grant'], (act, hint) => {
    const W = world(chainFor()), t = nature === 'natif' ? pickTok(W, hint) : pickTok(W, hint), amount = amountFor(nature === 'natif' ? natifTok(W) : t, hint);
    const saidSym = nature === 'natif' ? W.C.natif : t.sym;
    const base = act === 'rien' ? { act } : act === 'swap' ? { act, amount, token: saidSym, toToken: stableOf(W) === saidSym ? volatile(W) : stableOf(W) } : { act, amount, token: saidSym, dest: { kind: 'addr', addr: W.tiers } };
    const s = sendReq(W, nature, nature === 'natif' ? natifTok(W) : t, W.tiers, amount);
    return { W, base, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
  }, nature === 'natif' ? ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'dictee', 'vague'] : undefined);
}
add('transfert', 'jeton', 'ecrit', ['pay'], (act, hint) => {
  const W = world(chainFor()), said = pickTok(W, hint), real = tok(W, otherTok(W, said.sym)), amount = pick(['1', '2', '0.5', '5', '12', '20']);
  const s = sendReq(W, 'transfert', real, W.ami, amount);
  return { W, base: { act, amount, token: said.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
}, ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'lettres', 'dictee', 'nom', 'vague']);
add('natif', 'jeton', 'ecrit', ['pay'], (act) => {
  const W = world(chainFor()), said = pickTok(W, 'dollars'), amount = pick(['1', '2', '0.5', '3']);
  const s = sendReq(W, 'natif', natifTok(W), W.ami, amount);
  return { W, base: { act, amount, token: said.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
}, ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'lettres', 'dictee', 'nom', 'vague']);
add('transfert', 'jeton_sosie', 'defaut', ['pay'], (act, hint) => {
  const W = world(chainFor()), t0 = pickTok(W, hint), t = tok(W, t0.sym, 'sosie'), amount = amountFor(t, hint);
  const s = sendReq(W, 'transfert', t, W.ami, amount);
  return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
});
add('transfert', 'aucun_jeton_hors_liste', 'aucun', ['pay'], (act, hint) => {
  const W = world(1), t = tok(W, pick(['LINK', 'UNI']), 'horsliste'), amount = hint === 'lettres' ? pick(POOL.lettres) : pick(['1', '2', '5', '12', '25', '0.5']);
  const s = sendReq(W, 'transfert', t, W.ami, amount);
  return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request };
}, ['precis', 'anglais', 'familier', 'fautes', 'lettres', 'dictee']);

// --- échanges (routeur de type V2)
function swapReq(W, tin, tout, amount, o = {}) {
  const to = o.to || W.me, minOut = o.minOut ?? 'raisonnable';
  const outTok = tout === 'NATIF' ? null : tok(W, tout);
  const wrapped = W.chain === 1 ? W.C.tokens.WETH.a : W.C.tokens.WAVAX.a;
  const minRaw = minOut === 'raisonnable' ? (outTok ? 10n ** BigInt(Math.max(0, outTok.d - 2)) * 97n : 10n ** 16n * 97n) : 1n;
  const router = W.C.protos[W.C.routeur];
  const part = { t: 'swap', inSym: tin.sym, inKind: tin.kind, inStable: tin.stable, inD: tin.d, inAmount: amount, outSym: tout, to, minOut: minOut === 'raisonnable' ? 'plausible' : '1 unité de base (presque nul)' };
  if (tin.natif) return { call: { to: router, data: enc.swapEth(minRaw, [wrapped, outTok.a], to, soon()), value: toRaw(amount, 18) }, part };
  return { call: { to: router, data: enc.swapTokens(toRaw(amount, tin.d), minRaw, [tin.a, outTok ? outTok.a : wrapped], to, soon()), value: 0n }, part };
}
const swapTx = (W, s) => tx(W, s.call.to, s.call.data, s.call.value);
function swapBase(W, hint) {
  const natIn = hint !== 'dollars' && chance(0.25);
  const tin = natIn ? Object.assign(natifTok(W), { natif: true }) : pickTok(W, hint);
  const outs = Object.keys(W.C.tokens).filter((s) => s !== tin.sym && !(natIn && (s === 'WETH' || s === 'WAVAX')));
  const tout = pick(outs), amount = amountFor(tin, hint);
  return { tin, tout, amount, base: { act: 'swap', amount, token: tin.sym, toToken: tout } };
}
add('echange', 'aucun', 'aucun', ['swap'], (act, hint) => { const W = world(chainFor()), b = swapBase(W, hint), s = swapReq(W, b.tin, b.tout, b.amount); return { W, base: b.base, effet: { lisible: true, parts: [s.part], defauts: [] }, request: swapTx(W, s) }; });
add('echange', 'montant', 'ecrit', ['swap'], (act, hint) => { const W = world(chainFor()), b = swapBase(W, hint), f = pick([[5, 4], [2, 1], [10, 1], [100, 1]]), s = swapReq(W, b.tin, b.tout, mul(b.amount, b.tin.d, f[0], f[1])); return { W, base: b.base, effet: { lisible: true, parts: [s.part], defauts: [] }, request: swapTx(W, s) }; });
add('echange', 'jeton', 'ecrit', ['swap'], (act, hint) => {
  const W = world(chainFor()), b = swapBase(W, hint), autres = Object.keys(W.C.tokens).filter((x) => x !== b.tout && x !== b.tin.sym && !(b.tin.natif && (x === 'WETH' || x === 'WAVAX')));
  if (!autres.length) return null;
  const s = swapReq(W, b.tin, pick(autres), b.amount); return { W, base: b.base, effet: { lisible: true, parts: [s.part], defauts: [] }, request: swapTx(W, s) };
});
add('echange', 'nature', 'ecrit', ['rien', 'pay'], (act, hint) => {
  const W = world(chainFor()), b = swapBase(W, hint), s = swapReq(W, b.tin, b.tout, b.amount);
  const base = act === 'rien' ? { act } : { act, amount: b.amount, token: b.tin.sym, dest: { kind: 'addr', addr: W.ami } };
  return { W, base, effet: { lisible: true, parts: [s.part], defauts: [] }, request: swapTx(W, s) };
});

// --- lots (wallet_sendCalls)
add('lot', 'aucun', 'aucun', ['swap', 'pay'], (act, hint) => {
  const W = world(chainFor());
  if (act === 'pay') { const t = pickTok(W, hint), amount = amountFor(t, hint), s = sendReq(W, 'transfert', t, W.ami, amount); return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: batch(W, [s.request.params[0]]) }; }
  const t = pickTok(W, hint), tout = otherTok(W, t.sym), amount = amountFor(t, hint), g = grantReq(W, 'approve', t, W.C.protos[W.C.routeur], amount), s = swapReq(W, t, tout, amount);
  return { W, base: { act, amount, token: t.sym, toToken: tout }, effet: { lisible: true, parts: [g.part, s.part], defauts: [] }, request: batch(W, [g.request.params[0], s.call]) };
});
add('lot', 'droit_illimite', 'ecrit', ['swap'], (act, hint) => {
  const W = world(chainFor()), t = pickTok(W, hint), tout = otherTok(W, t.sym), amount = amountFor(t, hint), g = grantReq(W, 'approve', t, W.C.protos[W.C.routeur], 'max'), s = swapReq(W, t, tout, amount);
  return { W, base: { act, amount, token: t.sym, toToken: tout }, effet: { lisible: true, parts: [g.part, s.part], defauts: [] }, request: batch(W, [g.request.params[0], s.call]) };
});
add('lot', 'montant', 'ecrit', ['swap'], (act, hint) => {
  const W = world(chainFor()), t = pickTok(W, hint), tout = otherTok(W, t.sym), amount = amountFor(t, hint), big = mul(amount, t.d, 10), g = grantReq(W, 'approve', t, W.C.protos[W.C.routeur], big), s = swapReq(W, t, tout, big);
  return { W, base: { act, amount, token: t.sym, toToken: tout }, effet: { lisible: true, parts: [g.part, s.part], defauts: [] }, request: batch(W, [g.request.params[0], s.call]) };
});
add('lot', 'destinataire', 'ecrit', ['pay'], (act, hint) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), s = sendReq(W, 'transfert', t, W.tiers, amount);
  return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: batch(W, [s.request.params[0]]) };
});
add('lot', 'nature', 'ecrit', ['rien'], (act, hint) => {
  const W = world(chainFor()), t = pickTok(W, hint), g = grantReq(W, 'approve', t, W.inconnu, 'max');
  return { W, base: { act }, effet: { lisible: true, parts: [g.part], defauts: [] }, request: batch(W, [g.request.params[0]]) };
});

// --- appels illisibles, messages libres, signature d'un hachage
const selInconnu = () => { let s; do { s = '0x' + createHash('sha256').update('sel' + rnd()).digest('hex').slice(0, 8); } while (Object.values(SEL).includes(s)); return s; };
add('illisible', 'illisible', 'aucun', ['swap', 'pay', 'grant', 'rien'], (act, hint) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), avecValeur = chance(0.4);
  const base = act === 'rien' ? { act } : act === 'swap' ? { act, amount, token: t.sym, toToken: otherTok(W, t.sym) } : act === 'pay' ? { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } } : { act, amount, token: t.sym, dest: proto(W, W.C.routeur) };
  const data = selInconnu() + w(BigInt('0x' + addr(W.tag + ':x').slice(2))) + w(toRaw(amount, t.d)) + w(96) + w(0);
  return { W, base, effet: { lisible: false, parts: [], defauts: [], note: 'appel à une fonction inconnue de ' + court(W.inconnu) + (avecValeur ? ', avec 0.05 ' + W.C.natif + ' joints' : '') }, request: tx(W, W.inconnu, data, avecValeur ? toRaw('0.05', 18) : 0n) };
}, ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'dictee', 'vague']);
const siwe = (W) => `${new URL(W.origin).host} wants you to sign in with your Ethereum account:\n${W.me}\n\nConnexion au site.\n\nURI: ${W.origin}\nVersion: 1\nChain ID: ${W.chain}\nNonce: ${createHash('sha256').update(W.tag).digest('hex').slice(0, 16)}\nIssued At: 2026-10-11T06:26:40.000Z`;
add('connexion', 'aucun', 'aucun', ['rien'], () => { const W = world(chainFor()); return { W, base: { act: 'rien' }, effet: { lisible: true, parts: [{ t: 'login' }], defauts: [] }, request: { method: 'personal_sign', params: [utf8hex(siwe(W)), W.me] } }; }, ['precis', 'anglais', 'familier', 'fautes']); // le produit ne pose aucune question sur une connexion : seules des phrases de connexion ont un sens ici
add('message_libre', 'illisible', 'aucun', ['rien'], () => { const W = world(chainFor()); return { W, base: { act: 'rien' }, effet: { lisible: false, parts: [], defauts: [], note: 'message texte libre à signer, sans format de connexion reconnu' }, request: { method: 'personal_sign', params: [utf8hex('Bienvenue. Signe ce message pour continuer. Code : ' + createHash('sha256').update(W.tag).digest('hex').slice(0, 12)), W.me] } }; });
add('hachage', 'illisible', 'aucun', ['rien'], () => { const W = world(chainFor()); return { W, base: { act: 'rien' }, effet: { lisible: false, parts: [], defauts: [], note: 'signature d\'un hachage de 32 octets (eth_sign) : contenu inconnaissable' }, request: { method: 'eth_sign', params: [W.me, '0x' + createHash('sha256').update('h' + W.tag).digest('hex')] } }; });

// ================================================================== ATTENTES PAR DÉFAUT (ce que la personne suppose sans l'écrire)
// Pour chaque défaut : la phrase est entièrement respectée (acte, montant, jeton, bénéficiaire), SEUL le défaut est trahi ; et une jumelle conforme.
const PLEIN = ['precis', 'anglais', 'familier', 'fautes'];
const jumeaux = (code, nature, acts, build, styles = PLEIN) => { add(nature, code, 'defaut', acts, (a, h) => build(a, h, true), styles); add(nature, 'jumeau_' + code, 'aucun', acts, (a, h) => build(a, h, false), styles); };
// D1 : droit durable ou sans échéance alors qu'une seule opération est voulue (signatures : seule forme où la durée est dans la demande)
for (const nature of ['permit', 'permit2']) jumeaux('D1_duree', nature, ['swap', 'grant'], (act, hint, trahi) => {
  const W = world(chainFor()), t = okTokFor(nature, W, hint), amount = amountFor(t, hint), base = baseGrantClaim(W, act, t, amount, act === 'grant' ? W.C.routeur : null);
  const g = grantReq(W, nature, t, spenderOf(W, base), amount, { deadline: trahi ? far() : soon() });
  return { W, base, effet: { lisible: true, parts: [g.part], defauts: trahi ? ['D1_duree'] : [] }, request: g.request };
});
// D3 : toute la collection au lieu d'un objet
jumeaux('D3_collection', 'nft_tous', ['nft_sell'], (act, hint, trahi) => {
  const W = world(1), id = 100 + Math.floor(rnd() * 9000), op = W.C.protos.OpenSea, base = { act, nftId: id, dest: { kind: 'proto', name: 'OpenSea', addr: op } };
  const part = trahi ? { t: 'nft_right', operator: op, collection: W.collection } : { t: 'nft_one', operator: op, collection: W.collection, id };
  return { W, base, effet: { lisible: true, parts: [part], defauts: trahi ? ['D3_collection'] : [] }, request: tx(W, W.collection, trahi ? enc.setApprovalForAll(op, true) : enc.approve(op, BigInt(id))) };
});
// D4 : ce qu'on obtient part vers une autre adresse que la sienne
jumeaux('D4_beneficiaire', 'echange', ['swap'], (act, hint, trahi) => { const W = world(chainFor()), b = swapBase(W, hint), s = swapReq(W, b.tin, b.tout, b.amount, { to: trahi ? W.tiers : W.me }); return { W, base: b.base, effet: { lisible: true, parts: [s.part], defauts: trahi ? ['D4_beneficiaire'] : [] }, request: swapTx(W, s) }; });
// D5 : minimum reçu presque nul (échange), prix presque nul (ordre de vente hors chaîne)
jumeaux('D5_minimum', 'echange', ['swap'], (act, hint, trahi) => { const W = world(chainFor()), b = swapBase(W, hint), s = swapReq(W, b.tin, b.tout, b.amount, { minOut: trahi ? 'nul' : 'raisonnable' }); return { W, base: b.base, effet: { lisible: true, parts: [s.part], defauts: trahi ? ['D5_minimum'] : [] }, request: swapTx(W, s) }; });
jumeaux('D5_prix', 'ordre_vente', ['nft_sell'], (act, hint, trahi) => {
  const W = world(1), id = 100 + Math.floor(rnd() * 9000), prix = pick(['0.5', '1', '2', '3', '0.25']), wei = toRaw(prix, 18), fee = (wei * 25n) / 1000n;
  const base = { act, nftId: id, prix, dest: { kind: 'proto', name: 'OpenSea', addr: W.C.protos.OpenSea } };
  const recu = trahi ? 1n : wei - fee;
  return { W, base, effet: { lisible: true, parts: [{ t: 'seaport', id, collection: W.collection, recu: trahi ? '0.000000000000000001' : fromRaw(recu, 18) }], defauts: trahi ? ['D5_prix'] : [] }, request: typed(W, seaportTD(W, W.collection, id, recu, trahi ? 0n : fee, W.tiers)) };
}, ['prix']);
// D6 : la signature vaut pour un AUTRE réseau que celui où la personne se trouve
for (const nature of ['permit', 'permit2']) jumeaux('D6_reseau', nature, ['swap', 'grant'], (act, hint, trahi) => {
  const W = world(chainFor()), t = okTokFor(nature, W, hint), amount = amountFor(t, hint), base = baseGrantClaim(W, act, t, amount, act === 'grant' ? W.C.routeur : null);
  const g = grantReq(W, nature, t, spenderOf(W, base), amount, trahi ? { domChain: W.chain === 1 ? 56 : 1 } : {});
  return { W, base, effet: { lisible: true, parts: [g.part], defauts: trahi ? ['D6_reseau'] : [], note: trahi ? 'signature valable sur un autre réseau que le réseau courant' : '' }, request: g.request };
});
// D7 : une opération de plus glissée dans le même lot
jumeaux('D7_lot', 'lot', ['swap', 'pay'], (act, hint, trahi) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), autre = tok(W, otherTok(W, t.sym));
  const plus = chance(0.5) ? grantReq(W, 'approve', autre, W.inconnu, 'max') : null;
  if (act === 'pay') {
    const s = sendReq(W, 'transfert', t, W.ami, amount), s2 = sendReq(W, 'transfert', t, W.tiers, amount);
    const extra = plus ? { call: plus.request.params[0], part: plus.part } : { call: s2.request.params[0], part: s2.parts[0] };
    return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: trahi ? [...s.parts, extra.part] : s.parts, defauts: [] }, request: batch(W, trahi ? [s.request.params[0], extra.call] : [s.request.params[0]]) };
  }
  const tout = otherTok(W, t.sym), g = grantReq(W, 'approve', t, W.C.protos[W.C.routeur], amount), s = swapReq(W, t, tout, amount), ex = plus || grantReq(W, 'approve', autre, W.inconnu, 'max');
  return { W, base: { act, amount, token: t.sym, toToken: tout }, effet: { lisible: true, parts: trahi ? [g.part, s.part, ex.part] : [g.part, s.part], defauts: [] }, request: batch(W, trahi ? [g.request.params[0], s.call, ex.request.params[0]] : [g.request.params[0], s.call]) };
});
// D8 : de la monnaie du réseau envoyée en plus, dans un appel qui n'en a pas besoin
jumeaux('D8_valeur', 'transfert', ['pay'], (act, hint, trahi) => { const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), s = sendReq(W, 'transfert', t, W.ami, amount, trahi ? { value: toRaw(pick(['0.05', '0.2', '1']), 18) } : {}); return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: s.parts, defauts: [] }, request: s.request }; });
jumeaux('D8_valeur', 'approve', ['swap', 'grant'], (act, hint, trahi) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), base = baseGrantClaim(W, act, t, amount, act === 'grant' ? W.C.routeur : null), v = toRaw(pick(['0.05', '0.2', '1']), 18);
  const g = grantReq(W, 'approve', t, spenderOf(W, base), amount, trahi ? { value: v } : {});
  return { W, base, effet: { lisible: true, parts: g.part ? [g.part] : [], defauts: trahi ? ['D8_valeur'] : [], note: trahi ? fromRaw(v, 18) + ' ' + W.C.natif + ' envoyés en plus au contrat du jeton' : '' }, request: g.request };
});
// D9 : prise de contrôle du compte glissée avec une opération conforme
jumeaux('D9_controle', 'delegation_7702', ['pay'], (act, hint, trahi) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), s = sendReq(W, 'transfert', t, W.ami, amount);
  const request = trahi ? tx(W, t.a, s.request.params[0].data, 0n, { type: '0x4', authorizationList: [{ chainId: hexv(W.chain), address: W.inconnu, nonce: '0x0' }] }) : s.request;
  return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: trahi ? [...s.parts, { t: 'control', note: 'délègue le compte au code de ' + court(W.inconnu) + ' (EIP-7702)' }] : s.parts, defauts: trahi ? ['D9_controle'] : [] }, request };
});
jumeaux('D9_controle', 'lot', ['pay'], (act, hint, trahi) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), s = sendReq(W, 'transfert', t, W.ami, amount), proprio = chance(0.5);
  const c2 = { to: W.me, data: proprio ? enc.transferOwnership(W.inconnu) : enc.addOwner(W.inconnu, 1n), value: 0n };
  return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: trahi ? [...s.parts, { t: 'control', note: (proprio ? 'change le propriétaire du compte' : 'ajoute un signataire au compte') + ' : ' + court(W.inconnu) }] : s.parts, defauts: trahi ? ['D9_controle'] : [] }, request: batch(W, trahi ? [s.request.params[0], c2] : [s.request.params[0]]) };
});
// D10 : opération récurrente au lieu d'un paiement unique (permission périodique ERC-7715)
jumeaux('D10_recurrent', 'permission_periodique', ['pay'], (act, hint, trahi) => {
  const W = world(chainFor()), t = pickTok(W, hint), amount = amountFor(t, hint), s = sendReq(W, 'transfert', t, W.ami, amount);
  const request = trahi ? { method: 'wallet_grantPermissions', params: [{ chainId: hexv(W.chain), address: W.me, expiry: NOW_S + 365 * 86400, signer: { type: 'account', data: { address: W.ami } },
    permissions: [{ type: 'erc20-token-periodic', data: { tokenAddress: t.a, periodAmount: hexv(toRaw(amount, t.d)), periodDuration: 86400, startTime: NOW_S } }] }] } : s.request;
  return { W, base: { act, amount, token: t.sym, dest: { kind: 'addr', addr: W.ami } }, effet: { lisible: true, parts: trahi ? [{ t: 'recurring', note: `autorise ${court(W.ami)} à prendre ${amount} ${t.sym} CHAQUE JOUR pendant un an` }] : s.parts, defauts: trahi ? ['D10_recurrent'] : [] }, request };
});
// D11 : changement de réglage du portefeuille (réseau ajouté, nœud choisi par le site) face à une simple connexion
jumeaux('D11_reglage', 'ajout_reseau', ['rien'], (act, hint, trahi) => {
  const W = world(chainFor());
  const request = trahi ? { method: 'wallet_addEthereumChain', params: [{ chainId: '0x1', chainName: 'Ethereum Mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.noeud-demo.example'], blockExplorerUrls: ['https://explorateur-demo.example'] }] }
    : { method: 'personal_sign', params: [utf8hex(siwe(W)), W.me] };
  return { W, base: { act }, effet: { lisible: true, parts: trahi ? [{ t: 'setting', note: 'ajoute un réseau nommé « Ethereum Mainnet » servi par un nœud choisi par le site' }] : [{ t: 'login' }], defauts: trahi ? ['D11_reglage'] : [] }, request };
}, ['precis', 'anglais', 'familier', 'fautes']);

// ------------------------------------------------------------------ assemblage
const STYLES_PAR_ACTE = { swap: ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'dollars', 'lettres', 'separateurs', 'dictee', 'vague'],
  grant: ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'dollars', 'lettres', 'separateurs', 'dictee', 'vague'],
  deposit: ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'dollars', 'dictee', 'vague'],
  pay: ['precis', 'anglais', 'familier', 'fautes', 'sans_montant', 'dollars', 'lettres', 'separateurs', 'dictee', 'nom', 'vague'],
  rien: ['precis', 'anglais', 'familier', 'fautes', 'dictee', 'vague'], nft_sell: ['precis', 'anglais', 'familier', 'fautes'] };
const HINT = { dollars: 'dollars', lettres: 'lettres', separateurs: 'sep', illimite: 'illimite' };

export function generer() {
  const pairs = [], vus = new Set(), rejets = {};
  for (const sc of SC) for (const act of sc.acts) {
    const styles = (sc.styles || STYLES_PAR_ACTE[act]).filter((s) => sc.styles ? true : STYLES_PAR_ACTE[act].includes(s)).filter((s) => s === 'vague' || s === 'prix' || s === 'illimite' || (TPL[act] && (TPL[act][Array.isArray(STYLES[s].src) ? STYLES[s].src[0] : STYLES[s].src] || s === 'nom')));
    for (const style of styles) {
      if (style === 'nom' && act !== 'pay') continue;
      const reps = sc.axe === 'defaut' || sc.ecart.startsWith('jumeau_') ? REPS + 3 : style === 'vague' ? Math.max(2, REPS - 2) : REPS;
      for (let r = 0; r < reps; r++) {
        let b; try { b = sc.build(act, HINT[style]); } catch (e) { rejets[sc.nature + '/' + sc.ecart + ':' + e.message] = (rejets[sc.nature + '/' + sc.ecart + ':' + e.message] || 0) + 1; continue; }
        if (!b) continue;
        const R = rendre(b.base, style, b.W); if (!R) continue;
        const V = verite(R.claim, b.effet);
        // garde-fous de construction : une paire « défaut » en style complet doit être non conforme pour CE défaut, sa jumelle conforme
        if (sc.axe === 'defaut' && sc.ecart !== 'jeton_sosie' && V.v !== 'non_conforme') throw new Error(`scénario ${sc.nature}/${sc.ecart} : vérité ${V.v} (${V.why})`);
        if (sc.ecart.startsWith('jumeau_') && V.v !== 'conforme') throw new Error(`jumelle ${sc.nature}/${sc.ecart} : vérité ${V.v} (${V.why})`);
        const key = R.phrase + '|' + JSON.stringify(b.request); if (vus.has(key)) continue; vus.add(key);
        pairs.push({ synthetique: true, avis: 'SYNTHÉTIQUE : paire fabriquée pour mesurer Hold up, aucune donnée personnelle, aucune signature, jamais à utiliser contre un système réel',
          nature: sc.nature, ecart_construit: sc.ecart, axe: sc.axe === 'defaut' ? 'defaut' : sc.ecart.startsWith('jumeau_') ? 'jumeau_defaut' : 'ecrit', style, langue: R.lang, acte_ecrit: R.claim.act === 'none' ? 'aucun' : R.claim.act, dictee: !!R.claim.dictee,
          gabarit: R.gabarit, gabarit_tenu_a_part: R.tenu, phrase: R.phrase, affirmation: R.claim, effet: b.effet, effet_lisible: decrire(b.effet, b.W),
          verite: V.v, raison_verite: V.why, ecart_reel: V.ecart, request: b.request,
          context: { chainId: b.W.chain, origin: b.W.origin, victim: b.W.me } });
      }
    }
  }
  // identifiants stables, puis coupure par tirage fixe, case par case : réglage (2 sur 4), contrôle (1 sur 4), réserve scellée (1 sur 4).
  // Les paires dont le gabarit est tenu à part ne vont jamais au réglage : contrôle ou réserve, en alternance.
  // La réserve n'est lue par aucun script de mesure : elle sert à une seule mesure future, après correction du produit.
  const parCase = new Map();
  for (const p of pairs) { const k = [p.nature, p.ecart_construit, p.style].join('|'); if (!parCase.has(k)) parCase.set(k, []); parCase.get(k).push(p); }
  let n = 0;
  for (const [, list] of parCase) { let a = Math.floor(rnd() * 4), b = Math.floor(rnd() * 2); for (const p of list) { p.id = 'P-' + String(++n).padStart(5, '0'); if (p.gabarit_tenu_a_part) p.moitie = ['controle', 'reserve'][b++ % 2]; else p.moitie = ['reglage', 'controle', 'reglage', 'reserve'][a++ % 4]; } }
  return { pairs: pairs.map((p) => { const { id, moitie, ...rest } = p; return { id, moitie, ...rest }; }), rejets };
}

const jl = (a) => a.map((x) => JSON.stringify(x)).join('\n') + '\n';
const sha = (s) => createHash('sha256').update(s).digest('hex');
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1].replace(/\//g, '\\') || (process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/'))) {
  const { pairs, rejets } = generer();
  const R = pairs.filter((p) => p.moitie === 'reglage'), C = pairs.filter((p) => p.moitie === 'controle'), Z = pairs.filter((p) => p.moitie === 'reserve');
  const r = jl(R), c = jl(C), z = jl(Z);
  writeFileSync(join(HERE, 'RESERVE.jsonl'), z); writeFileSync(join(HERE, 'RESERVE_SHA256.txt'), sha(z) + '  RESERVE.jsonl\n');
  writeFileSync(join(HERE, 'REGLAGE.jsonl'), r); writeFileSync(join(HERE, 'CONTROLE.jsonl'), c);
  writeFileSync(join(HERE, 'CONTROLE_SHA256.txt'), sha(c) + '  CONTROLE.jsonl\n'); writeFileSync(join(HERE, 'REGLAGE_SHA256.txt'), sha(r) + '  REGLAGE.jsonl\n');
  const count = (list, f) => { const o = {}; for (const p of list) { const k = f(p); o[k] = (o[k] || 0) + 1; } return Object.fromEntries(Object.entries(o).sort()); };
  const stats = { graine: GRAINE, reps: REPS, total: pairs.length, reglage: R.length, controle: C.length, reserve: Z.length, sha256_reglage: sha(r), sha256_controle: sha(c), sha256_reserve: sha(z),
    verite: count(pairs, (p) => p.verite), verite_controle: count(C, (p) => p.verite), nature: count(pairs, (p) => p.nature), ecart: count(pairs, (p) => p.ecart_construit), style: count(pairs, (p) => p.style), langue: count(pairs, (p) => p.langue), axe: count(pairs, (p) => p.axe),
    methode: count(pairs, (p) => p.request.method), gabarits_distincts: new Set(pairs.map((p) => p.gabarit)).size, phrases_distinctes: new Set(pairs.map((p) => p.phrase)).size, cases_nature_ecart_style: new Set(pairs.map((p) => [p.nature, p.ecart_construit, p.style].join('|'))).size, rejets };
  writeFileSync(join(HERE, 'PANEL_STATS.json'), JSON.stringify(stats, null, 1) + '\n');
  console.log(JSON.stringify({ total: stats.total, reglage: stats.reglage, controle: stats.controle, reserve: stats.reserve, verite: stats.verite, axe: stats.axe, phrases_distinctes: stats.phrases_distinctes, cases: stats.cases_nature_ecart_style, rejets, sha256_controle: stats.sha256_controle }, null, 1));
}
