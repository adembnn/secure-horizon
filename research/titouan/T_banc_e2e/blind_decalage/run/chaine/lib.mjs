// Bras (a) « code seul » de la grille : phrase -> intention (mots-clés + extraction par code) -> comparateur du moteur -> décision à trois valeurs.
// COPIE de pipeline/grille/lib.mjs (sha256 d'origine à la fin du journal) : seule modification = les imports pointent vers le moteur vivant de T_banc_e2e au lieu de snapshot/.
// Décision : 'correspond' | 'ne_correspond_pas' | 'inverifiable'.
//   inverifiable si : demande illisible ; aucun effet visible hors connexion ; phrase sans type compris ; ou élément nécessaire non dit (montant, jeton, destinataire, protocole).
//   ne_correspond_pas si le niveau (moteur + politique + détecteurs, avec l'intention extraite) est orange ou rouge, ou si le protocole nommé n'est pas celui qui reçoit le droit.
//   correspond sinon.
// Règles dures : le niveau final n'est jamais sous le niveau sans intention (max) ; montant, jeton, adresse viennent du code, jamais d'un modèle.
// Garde réseau : tout appel est refusé, sauf vers api.cloudflare.com pendant une fenêtre ouverte par openClef() (bras Clef uniquement).
export const NET = { cloudflareOpen: false, blocked: 0, calls: 0 };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const u = String(url && url.url ? url.url : url);
  if (NET.cloudflareOpen && /^https:\/\/api\.cloudflare\.com\//.test(u)) { NET.calls++; return realFetch(url, init); }
  NET.blocked++;
  throw new Error('réseau interdit par la grille : ' + u.slice(0, 60));
};
export async function withCloudflare(fn) { NET.cloudflareOpen = true; try { return await fn(); } finally { NET.cloudflareOpen = false; } }
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..'); // T_banc_e2e : moteur VIVANT (pas la copie figée de pipeline/grille/snapshot)
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
export const A = await imp('run/arms.mjs');
export const IC = await imp('pipeline/intent_clef.mjs');
export const RANK = { ok: 0, warn: 1, critical: 2 };
export const NOW = 1760000000000;
const lc = (s) => (typeof s === 'string' ? s.toLowerCase() : s);
import { fold, wordsToDigits, stripInjection, hasFuzzy, CONNECT } from './textool.mjs';
const maxLevel = (a, b) => (RANK[b] > RANK[a] ? b : a);

export const prepCase = (c) => A.prepare(A.normalizeCase({ ...c, intent: { declaredAt: NOW } }));

// protocole nommé dans la phrase : on compare au premier mot du libellé des protocoles connus du contexte
export function protocolNamed(text, ctx) {
  const t = ' ' + fold(text).replace(/[^a-z0-9]+/g, ' ') + ' ';
  const hit = [];
  for (const p of ctx.known_protocols || []) {
    const w = fold(p.label || p.name || '').split(/[^a-z0-9]+/)[0];
    if (w && w.length >= 3 && t.includes(' ' + w + ' ') && !/^(permit|collection|nft|token|contrat|contract)/.test(w)) hit.push(lc(p.address));
  }
  return [...new Set(hit)];
}
const SIWE = (req) => req && req.method === 'personal_sign' && typeof req.params?.[0] === 'string' && /^0x[0-9a-f]*$/i.test(req.params[0]) && Buffer.from(req.params[0].slice(2), 'hex').toString('utf8').includes('wants you to sign in');
const SWAPWORDS = /\b(swap|echang|change|convert|trade|exchange|flip|gimme|mets?)\b/;


// ------------------------------------------------------------------ couche « grille » (réglée sur la moitié réglage seulement)
// Repli de classification quand les mots-clés du produit ne comprennent rien. Écrit à partir des phrases du RÉGLAGE ; aucun mot propre
// aux gabarits du contrôle n'y a été ajouté volontairement (même auteur, voir le rapport).
const NFT = /\bnfts?\b/;
const SELLW = /\b(vend\w*|vente|sale|sell\w*|list\w*|liste\w*|lister)\b/;
const SENDW = /\b(envoy\w*|transf\w*|donn\w*|send\w*|give|pass\w*|file|balance|yeet)\b/;
const RIGHTW = /\b(autoriser|approuver|approuve|approve|allow\w*|grant|laisse|donne\w* (l |lacces|a )|give \w+ access|acces|ok pour que|let\w* \w+ (spend|grab|use|take))\b/;
const DEPW = /\b(depos\w*|deposit\w*|supply|placer|au chaud|putting|dropping)\b/;
const BUYW = /\b(achet\w*|prends? un|buy\w*|purchase|copping)\b/;
const LOGW = /\b(logg?\w*|log in|login|sign(ing)? in|connecter|connect\w*)\b/;
const WL = { sell: ['vente', 'vends', 'vendre', 'lister', 'liste', 'listing', 'selling', 'sell', 'list'], buy: ['acheter', 'achete', 'prends', 'buying', 'buy', 'purchase', 'copping'], send: ['envoyer', 'envoie', 'transferer', 'donner', 'send', 'sending', 'give', 'passe', 'balance', 'yeet'],
  right: ['autoriser', 'approuver', 'approve', 'allow', 'grant', 'laisse', 'letting', 'spend', 'toucher', 'prenne'], dep: ['deposer', 'depose', 'deposit', 'supply', 'placer', 'dropping', 'putting', 'chaud'], pay: ['payer', 'paye', 'pay', 'envoyer', 'envoie', 'send', 'sending', 'balance', 'shoot', 'transferer'], swap: ['swap', 'swapping', 'echanger', 'exchange', 'change', 'gimme', 'into'], recv: ['reclamer', 'recuperer', 'airdrop', 'remboursement', 'refund', 'recevoir', 'receive', 'cadeau', 'claim', 'claiming'] };
const hasW = (t, k) => hasFuzzy(t, WL[k]);
const syms = (t) => (t.match(/\b(usdc|usdt|dai|weth|eth)\b/g) || []);
export function kindFallback(text, ctx = {}) {
  const t = fold(text).replace(/'/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.split(' ').length < 3) return null; // un ou deux mots : trop vague
  const nft = NFT.test(t);
  if (nft && (SELLW.test(t) || hasW(t, 'sell'))) return 'buy_or_swap';
  if (nft && (BUYW.test(t) || hasW(t, 'buy'))) return 'buy_or_swap';
  if (nft && (SENDW.test(t) || hasW(t, 'send'))) return 'pay_someone';
  if (RIGHTW.test(t) || hasW(t, 'right')) return 'buy_or_swap';
  if (DEPW.test(t) || hasW(t, 'dep')) return 'buy_or_swap';
  const ss = syms(t);
  if (new Set(ss).size >= 2 && new RegExp(`\\b${CONNECT}\\b`).test(t)) return 'buy_or_swap'; // deux jetons reliés par « en », « for », « into »...
  if (hasW(t, 'swap')) return 'buy_or_swap';
  const labels = (ctx.address_book || []).map((b) => fold(b.label)).filter(Boolean);
  const toPerson = labels.some((l) => t.includes(l)) || /\b0x[0-9a-f]{40}\b/.test(t) || /\b(un ami|a friend)\b/.test(t);
  if (toPerson && (hasW(t, 'pay') || ss.length || /\d/.test(t))) return 'pay_someone';
  if (hasW(t, 'recv')) return 'connect_or_accept_offer';
  if (LOGW.test(t)) return 'connect_or_accept_offer';
  return null;
}
// symboles cités dans la phrase, dans l'ordre (registre du contexte plus ETH)
export function symbolsIn(text, ctx) {
  const set = new Set([...(ctx.token_registry || []).map((t) => t.symbol.toUpperCase()), 'ETH']);
  const out = [];
  for (const m of String(text).matchAll(/(?<![A-Za-z0-9])\$?([A-Za-z]{2,6})(?![A-Za-z0-9])/g)) { const u = m[1].toUpperCase(); if (set.has(u)) out.push(u); }
  return out;
}
// Classification de la grille : mots-clés du produit, puis repli, puis jeton reçu extrait par code.
// Un jeton n'est « celui qu'on donne » que s'il est collé au montant (« 50 USDC », « USDC 50 »). Sinon (« 5 en WETH ») on ne conclut pas.
const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, (m) => '\\' + m);
function gluedToAmount(text, amount, token) {
  if (amount === undefined || !token) return false;
  const t = String(text).replace(/\u00a0|\u202f/g, ' ');
  const num = '[\\d][\\d .,\']*';
  return new RegExp(`${num}\\s?(de |of |d')?\\$?${esc(token)}\\b`, 'i').test(t) || new RegExp(`${esc(token)}\\s?[:=]?\\s?${num}`, 'i').test(t);
}
export async function classifyGrille(text0, ctx, { fallback = true, raw = null, kindRepli = fallback } = {}) {
  const contacts = (ctx.address_book || []).flatMap((b) => [{ address: b.address, label: b.label }, ...(/^(mon|ma) /i.test(b.label) ? [{ address: b.address, label: b.label.replace(/^(mon|ma) /i, 'my ') }] : [])]);
  const o = { provider: 'keyword', contacts, declaredAt: NOW };
  const inj = stripInjection(text0);
  const text = wordsToDigits(inj.text).trim() === '' ? inj.text : wordsToDigits(inj.text);
  let cls = raw ? { ...IC.decide(raw, text, { ...o, threshold: IC.threshold({}) }), provider: raw.source } : await IC.classifyIntent(text, o);
  if (kindRepli && !cls.classified) {
    const k = kindFallback(text, ctx);
    if (k) cls = { ...IC.decide({ source: 'keyword', kind: k, confidence: 0.9, asked: false, receive: false }, text, o), provider: 'keyword+repli' };
  }
  if (kindRepli && cls.classified && cls.kind !== 'connect_or_accept_offer' && cls.kind !== 'asked_by_someone' && LOGW.test(fold(text)) && cls.extracted.amount === undefined && !cls.extracted.token && !cls.extracted.address) {
    cls = { ...IC.decide({ source: 'keyword', kind: 'connect_or_accept_offer', confidence: 0.9, asked: false, receive: false }, text, o), provider: 'keyword+connexion' };
  }
  // 1. montant en « dollars » ou jeton non collé au montant : le jeton n'est pas dit
  const ex = { ...cls.extracted };
  if (ex.token && (ex.money || !gluedToAmount(text, ex.amount, ex.token)) && ex.amount !== undefined) delete ex.token;
  // 2. jeton reçu (échange) : l'autre symbole cité
  const syms = symbolsIn(text, ctx), tk = cls.extracted.token;
  let receive;
  if (cls.kind === 'buy_or_swap' && !RIGHTW.test(fold(text)) && !SELLW.test(fold(text)) && !NFT.test(fold(text))) {
    const gluedTok = ex.token || null;
    receive = syms.find((x) => x !== gluedTok && x !== (tk && gluedTok ? tk : undefined)) || (!gluedToAmount(text, cls.extracted.amount, tk) ? tk : undefined);
    if (receive === gluedTok) receive = undefined;
  }
  const details = { ...cls.details }; if (!ex.token) delete details.token; else details.token = ex.token;
  let intent = cls.intent ? { ...cls.intent } : null; if (intent) { if (!ex.token) delete intent.token; if (receive) intent.receiveToken = receive; }
  return { ...cls, extracted: ex, intent, details, receiveToken: receive, injection: inj.injection, textUsed: text };
}
// acte lu dans le texte (mots-clés, fautes comprises) et effets compatibles
export function actOfText(text) {
  const t = fold(text).replace(/'/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const nft = NFT.test(t);
  if (nft && (SELLW.test(t) || hasW(t, 'sell'))) return 'list_nft';
  if (nft && (BUYW.test(t) || hasW(t, 'buy'))) return 'buy_nft';
  if (nft && (SENDW.test(t) || hasW(t, 'send'))) return 'send_nft';
  if (RIGHTW.test(t) || hasW(t, 'right')) return 'approve';
  if (DEPW.test(t) || hasW(t, 'dep')) return 'deposit';
  if (new Set(syms(t)).size >= 2 && new RegExp(`\\b${CONNECT}\\b`).test(t)) return 'swap';
  if (hasW(t, 'swap')) return 'swap';
  if (/\b(claim\w*|reclam\w*|recup\w*|airdrop|remboursement|refund|recevoir|receive|cadeau|free)\b/.test(t)) return 'receive';
  if (LOGW.test(t)) return 'connect';
  if (hasW(t, 'pay') || /\b(a|to|vers) (un ami|a friend|paul|maman|mon ledger|my ledger)\b/.test(t)) return 'pay';
  return null;
}
export function effectType(prep) {
  const eff = prep.eff, req = prep.c.request, known = new Set((prep.c.context.known_protocols || []).map((p) => lc(p.address)));
  if (SIWE(req)) return 'login';
  if (eff.approvals.some((a) => a.std === 'nft_all')) return 'nft_all';
  if (eff.incoming.length) return 'swap';
  if (eff.outgoing.some((o) => o.std === 'erc721')) return 'nft_out';
  if (eff.outgoing.length && eff.outgoing.every((o) => known.has(lc(o.to))) && (eff.outgoing.some((o) => o.std === 'erc20') || true)) return eff.outgoing.some((o) => o.std === 'native') ? 'native_to_known' : 'deposit';
  if (eff.approvals.length) return 'right';
  if (eff.outgoing.some((o) => o.std === 'native')) return 'native';
  if (eff.outgoing.length) return 'transfer';
  return null;
}
const KIND_EFFECTS = { pay_someone: ['transfer', 'native', 'nft_out'], send_to_my_account: ['transfer', 'native', 'nft_out'], buy_or_swap: ['swap', 'right', 'deposit', 'nft_all', 'native_to_known', 'nft_out'], connect_or_accept_offer: ['login'] };
const ACT_EFFECTS = { list_nft: ['nft_all'], buy_nft: ['native_to_known'], send_nft: ['nft_out'], approve: ['right'], deposit: ['deposit', 'right'], swap: ['swap', 'right'], pay: ['transfer', 'native'], connect: ['login'], receive: ['login'] };
// décodeur complémentaire : Aave supply(asset, amount, onBehalfOf, ref). Le moteur ne voit aucun effet pour cet appel.
const SUPPLY_SEL = '0x617ba037';
function addSupply(prep) {
  const req = prep.c.request; if (req.method !== 'eth_sendTransaction') return null;
  const p = req.params[0], d = p.data || '0x'; if (!d.startsWith(SUPPLY_SEL) || prep.eff.outgoing.length) return null;
  const w = (i) => d.slice(10 + 64 * i, 10 + 64 * (i + 1));
  const token = '0x' + w(0).slice(24), amountRaw = BigInt('0x' + w(1)), onBehalf = '0x' + w(2).slice(24);
  const meta = prep.ctx.tokenMeta[lc(token)]; if (!meta) return null;
  const hum = (Number(amountRaw) / 10 ** meta.decimals);
  prep.eff.outgoing.push({ token: lc(token), symbol: meta.symbol, amount: String(hum), to: lc(p.to), std: 'erc20', amountRaw: amountRaw.toString(), decimals: meta.decimals, path: '0' });
  prep.eff.counterparties.push({ address: lc(p.to), roles: ['recipient'] });
  return { onBehalf: lc(onBehalf), me: lc(prep.ctx.from) };
}
const symOf = (prep, addr) => (prep.ctx.tokenMeta[lc(addr)] || {}).symbol;
const symName = (s) => (String(s).toUpperCase() === 'NATIVE' ? 'ETH' : String(s).toUpperCase());
// contradictions visibles par le code entre ce qui est extrait de la phrase et ce que la demande fait
function contradictions(cls, prep, text, extraInfo) {
  const d = cls.extracted || {}, eff = prep.eff, out = [];
  const tol = (a, said) => Number.isFinite(a) && Number.isFinite(said) && a > said * 1.01;
  const said = d.amount !== undefined ? Number(d.amount) : undefined;
  const swapLeg = eff.incoming.length > 0;
  for (const o of eff.outgoing) {
    if (o.std !== 'erc20' && o.std !== 'native') continue;
    const sym = o.symbol || symOf(prep, o.token);
    if (d.token && sym && d.token.toUpperCase() !== symName(sym)) out.push('jeton');
    if (said !== undefined && tol(Number(o.amount), said)) out.push('montant');
  }
  for (const a of eff.approvals) {
    if (a.std === 'nft_all') continue;
    const sym = symOf(prep, a.token);
    if (d.token && sym && d.token.toUpperCase() !== sym.toUpperCase()) out.push('jeton');
    if (said !== undefined && (a.amount === 'unlimited' || tol(Number(a.amount), said))) out.push('montant');
  }
  if (swapLeg && cls.intent && cls.intent.receiveToken) for (const i of eff.incoming) { const sym = i.symbol || symOf(prep, i.token); if (sym && sym.toUpperCase() !== cls.intent.receiveToken) out.push('jeton reçu'); }
  if (extraInfo && extraInfo.onBehalf !== extraInfo.me) out.push('bénéficiaire du dépôt');
  return [...new Set(out)];
}

// éléments manquants / contradictions visibles par le code. -> { missing: [], contradict: string|null, visible: bool }
// libellés d'un contact, avec les variantes « mon X » / « my X » / « X »
export const aliasesOf = (label) => { const f = fold(label).trim(); const base = f.replace(/^(mon|ma|my) /, ''); return [...new Set([f, base, 'mon ' + base, 'my ' + base])]; };
const sameLabel = (book, addr, said) => aliasesOf(book.get(lc(addr)) || '').includes(fold(said).trim());
export function sufficiency(cls, prep, text) {
  const { eff, c } = prep, d = cls.extracted || {}, ctx = c.context, req = c.request;
  const miss = new Set(); let contradict = null;
  const login = SIWE(req);
  const visible = eff.outgoing.length > 0 || eff.approvals.length > 0 || login;
  const known = new Set((ctx.known_protocols || []).map((p) => lc(p.address)));
  const named = protocolNamed(text, ctx);
  const book = new Map((ctx.address_book || []).map((b) => [lc(b.address), b.label]));
  for (const o of eff.outgoing) {
    if (o.std === 'erc721' || o.std === 'erc1155') {
      const labelOk = d.counterpartyLabel && book.has(lc(o.to)) && sameLabel(book, o.to, d.counterpartyLabel);
      if (!labelOk && !(d.address && lc(d.address) === lc(o.to))) { if (d.counterpartyLabel || d.address) contradict = 'destinataire'; else miss.add('destinataire'); }
      continue;
    }
    if (d.amount === undefined) miss.add('montant');
    if (!d.token) miss.add('jeton');
    const to = lc(o.to);
    const isSwapLeg = eff.incoming.length > 0; // sortie d'échange : le destinataire est le routeur
    if (!isSwapLeg && !known.has(to)) {
      const labelOk = d.counterpartyLabel && book.has(to) && sameLabel(book, to, d.counterpartyLabel);
      const addrOk = d.address && lc(d.address) === to;
      if (!labelOk && !addrOk) { if (d.counterpartyLabel || d.address) contradict = 'destinataire'; else miss.add('destinataire'); }
    }
    if (!isSwapLeg && known.has(to)) { if (!named.length) miss.add('protocole'); else if (!named.includes(to)) contradict = 'protocole'; }
  }
  for (const a of eff.approvals) {
    const sp = lc(a.spender);
    if (a.std === 'nft_all') { if (!named.length) miss.add('protocole'); else if (!named.includes(sp)) contradict = 'protocole'; continue; }
    if (d.amount === undefined) miss.add('montant');
    if (!d.token) miss.add('jeton');
    if (named.length) { if (!named.includes(sp)) contradict = 'protocole'; }
    else if (!(actOfText(text) === 'swap' && known.has(sp))) miss.add('protocole');
  }
  return { missing: [...miss], contradict, visible, login };
}

// -> { decision, level, floor, kindFound, why, reasons }
export async function decideCode(c, cls, { actSource = 'text' } = {}) {
  const prep = prepCase(c);
  const extraInfo = prep.unsupported ? null : addSupply(prep);
  if (prep.unsupported) return { decision: 'inverifiable', level: 'warn', floor: 'warn', why: 'méthode non prise en charge' };
  const text = c.text;
  const opts = { detectors: true, premiseCap: true, guard: true };
  const floor = (await A.runArm(prep, 'none', { detectors: true, premiseCap: true })).level;
  const none0 = await A.runArm(prep, 'none', { detectors: true, premiseCap: true });
  let level = floor, raw = floor, typeLevel = floor, via = 'floor', raised = false;
  if (cls.classified && cls.intent) {
    const p2 = { ...prep, c: { ...prep.c, intent: cls.intent } };
    const rf = await A.runArm(p2, 'full', opts); raw = rf.level; level = maxLevel(floor, raw); via = 'classified';
    raised = RANK[raw] > RANK[floor] || rf.reasons.some((r) => !none0.reasons.includes(r) && RANK[raw] >= 1);
    typeLevel = maxLevel(floor, (await A.runArm(p2, 'type', opts)).level);
    if (cls.noSpend && cls.kind !== 'connect_or_accept_offer' && cls.kind !== 'asked_by_someone') {
      const r2 = await A.runArm({ ...prep, c: { ...prep.c, intent: { ...cls.intent, kind: 'connect_or_accept_offer' } } }, 'full', opts);
      if (RANK[r2.level] > RANK[floor]) { raised = true; level = maxLevel(level, r2.level); }
    }
  } else if (cls.details && (cls.details.amount !== undefined || cls.details.token || cls.details.counterpartyAddress || cls.details.counterpartyLabel)) {
    const p2 = { ...prep, c: { ...prep.c, intent: cls.details } };
    const rf = await A.runArm(p2, 'full', opts); raw = rf.level; level = maxLevel(floor, raw); via = RANK[level] > RANK[floor] ? 'raised_by_details' : 'floor';
  }
  const S = sufficiency(cls, prep, cls.textUsed || text);
  const base = { level, floor, raw, typeLevel, via, raised, kindFound: !!cls.classified };
  if (prep.eff.opaque) return { ...base, decision: 'inverifiable', why: 'illisible' };
  if (!cls.classified) {
    if (via === 'raised_by_details') return { ...base, decision: 'ne_correspond_pas', why: 'détails extraits contredisent la demande' };
    return { ...base, decision: 'inverifiable', why: 'phrase sans type compris (' + cls.reason + ')' };
  }
  if (actSource === 'text' && cls.kind !== 'connect_or_accept_offer' && !actOfText(cls.textUsed || text) && !Object.keys(cls.extracted || {}).some((k) => k !== 'money')) return { ...base, decision: 'inverifiable', why: 'type deviné sans aucun indice dans la phrase' };
  if (cls.kind === 'asked_by_someone') return { ...base, decision: 'inverifiable', why: 'dicté par un tiers' };
  if (!S.visible) return { ...base, decision: 'inverifiable', why: 'aucun effet visible' };
  const act = actSource === 'text' ? actOfText(cls.textUsed || text) : ({ pay_someone: 'pay', send_to_my_account: 'pay', connect_or_accept_offer: 'connect' }[cls.kind] || null), et = effectType(prep);
  // le moteur n'a pas de modèle pour « mettre un NFT en vente » ni « acheter un NFT » : son écart sur ces deux actes n'est pas lu comme une contradiction avec la phrase (règle ajoutée sur le réglage)
  const engineBlind = actSource === 'text' ? (act === 'list_nft' && et === 'nft_all') || (act === 'buy_nft' && et === 'native_to_known') : ['nft_all', 'native_to_known', 'nft_out'].includes(et);
  if (actSource === 'kind' && et && KIND_EFFECTS[cls.kind] && !KIND_EFFECTS[cls.kind].includes(et)) return { ...base, decision: 'ne_correspond_pas', why: `type compris « ${cls.kind} », demande de type « ${et} »` };
  if (raised && !engineBlind) return { ...base, decision: 'ne_correspond_pas', why: 'le comparateur lève un écart avec l intention (niveau ' + level + ')' };
  if (S.contradict) return { ...base, decision: 'ne_correspond_pas', why: S.contradict + ' contredit' };
  if (act && et && !ACT_EFFECTS[act].includes(et)) return { ...base, decision: 'ne_correspond_pas', why: `acte lu « ${act} », demande de type « ${et} »` };
  const K = contradictions(cls, prep, text, extraInfo);
  if (K.length) return { ...base, decision: 'ne_correspond_pas', why: 'contredit par le code : ' + K.join(', ') };
  if (S.missing.length) return { ...base, decision: 'inverifiable', why: 'non dit : ' + S.missing.join(', ') };
  return { ...base, decision: 'correspond', why: 'conforme' };
}
export { addSupply };

export const VERDICT = ['correspond', 'ne_correspond_pas', 'inverifiable'];
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, ce = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (ce - m) / d), Math.min(1, (ce + m) / d)];
}

// ------------------------------------------------------------------ description en clair de l'effet (pour le bras « Clef juge direct »)
// Construite par le code seul à partir des effets décodés et du contexte : aucun montant ni adresse n'est inventé.
export function describeEffect(prep, extraInfo) {
  const { eff, c } = prep, ctx = c.context, req = c.request;
  const nameOf = (a) => {
    const x = lc(a);
    if (x === lc(ctx.victim)) return 'your own address';
    const b = (ctx.address_book || []).find((y) => lc(y.address) === x); if (b) return `${x} (saved contact "${b.label}")`;
    const k = (ctx.known_protocols || []).find((y) => lc(y.address) === x); if (k) return `${x} (known service "${k.label}")`;
    return `${x} (unknown address, not in your contacts)`;
  };
  const parts = [];
  if (SIWE(req)) parts.push('Signs a sign-in message for the site ' + (ctx.origin || 'unknown') + '. It moves no funds and grants no permission.');
  if (eff.opaque) parts.push('Calls a contract function that could not be decoded. The effect is unknown.');
  const swap = eff.incoming.length > 0;
  for (const o of eff.outgoing) {
    const sym = o.symbol && o.symbol !== 'NATIVE' ? o.symbol : o.std === 'native' ? 'ETH' : null;
    if (o.std === 'erc721' || o.std === 'erc1155') { parts.push('Transfers one NFT (id ' + o.tokenId + ') to ' + nameOf(o.to) + '.'); continue; }
    if (swap) { parts.push(`Sells ${o.amount} ${sym || 'tokens'} to the router ${nameOf(o.to)}.`); continue; }
    if (extraInfo && lc(o.to) !== lc(ctx.victim) && (ctx.known_protocols || []).some((y) => lc(y.address) === lc(o.to))) { parts.push(`Deposits ${o.amount} ${sym} into ${nameOf(o.to)}. The deposit is credited to ${extraInfo.onBehalf === extraInfo.me ? 'your own address' : extraInfo.onBehalf + ' (not you)'}.`); continue; }
    parts.push(`Sends ${o.amount} ${sym || 'tokens'} to ${nameOf(o.to)}.`);
  }
  for (const i of eff.incoming) {
    const thirdParty = (eff.thirdParty || []).length ? ' The output goes to a third party, not to you.' : '';
    parts.push(`Receives at least ${i.amount} ${i.symbol || 'tokens'}.` + thirdParty);
  }
  for (const a of eff.approvals) {
    if (a.std === 'nft_all') { parts.push('Gives ' + nameOf(a.spender) + ' the right to move ALL your NFTs of a collection.'); continue; }
    const sym = (prep.ctx.tokenMeta[lc(a.token)] || {}).symbol || 'tokens';
    parts.push(`Gives ${nameOf(a.spender)} the right to spend ${a.amount === 'unlimited' ? 'an UNLIMITED amount of' : 'up to ' + a.amount} ${sym}.`);
  }
  if (!parts.length) parts.push('No effect on your funds or permissions could be read.');
  return parts.join(' ');
}
