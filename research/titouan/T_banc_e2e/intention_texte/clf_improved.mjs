// clf_improved.mjs - PROPOSITION (n'est pas dans le produit) : le repli mots-cles actuel + des correctifs modulaires.
// Chaque correctif est un interrupteur (PATCHES). Ils ont ete ecrits et mesures sur DEV seulement.
// Le code existant n'est PAS modifie : on appelle sa fonction keywordClassify telle quelle, puis on corrige.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(resolve(HERE, '..', 'extension_standalone', 'extension', 'intent_text.js')).href);

export const PATCHES = ['inject', 'asked_fr', 'connect_guard', 'own_dest', 'pay_verbs', 'swap_verbs', 'connect_verbs', 'amounts', 'tokens', 'recipient'];
export const name = 'amelioree (DEV)';

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’ʼ]/g, "'").toLowerCase();

// ---- inject : on retire les consignes hostiles et les noms de types internes avant de classer
const KIND_IDS = /\b(pay_someone|send_to_my_account|buy_or_swap|connect_or_accept_offer|asked_by_someone)\b/gi;
const INJ_CLAUSE = /(ignor\w*\b.{0,30}\b(r[eè]gles?|rules?|instructions?|directives?)|oubli\w*\b.{0,30}\b(instruction|r[eè]gle|rule)|forget\b.{0,20}\b(rule|instruction)|disregard\b.{0,30}|override\b.{0,40}|contourn\w*\b.{0,40}|bypass\b.{0,40}|skip\b.{0,20}\b(rule|instruction)|syst[eè]me\b\s*:?[^.!]*|system( prompt)?\b\s*:?[^.!]*|\[syst[^\]]*\][^.!]*|r[eé]ponds?\b.{0,20}(legit|sur|ok)|say this is legit|answer safe|respond ok|you are an assistant[^.!]*|tu es un assistant[^.!]*|dis que c'?est ok|valid(er)?$)[.!]?/gi;
const SPOOF_RE = /[(\[][^)\]]*(type|intent|intention)\s*[:=][^)\]]*[)\]]|note\s*:[^.!]*/gi;
export function stripInjection(t) { return t.replace(KIND_IDS, ' ').replace(SPOOF_RE, ' ').replace(INJ_CLAUSE, ' ').replace(/\s+/g, ' ').trim(); }

// ---- mots (sur texte plie : minuscules sans accents)
const MOVE = '(?:deplac\\w*|bouger?|transf\\w*|envoy\\w*|envoi|mettre|mets|metre|vire[rz]?|retir\\w*|retrait|depot|deposer?|deposit|rapatri\\w*|consolid\\w*|passe[rz]?|sors?|sortir|range[rz]?|securis\\w*|secure|move|moving|shift\\w*|sweep\\w*|withdraw\\w*|send\\w*|transfer\\w*|put|putting|bridge)';
const OWN_WORD = '(?:wallet|portefeuille|compte|account|ledger|trezor|exchange|binance|coinbase|kraken|metamask|phantom|cold|perso|personnel|savings|main|principal|autre|other|own|propre|l2)';
const OWN_DEST = new RegExp('\\b(?:vers|sur|to|toward|towards|into|in|on|a|back to)\\s+(?:mon|ma|mes|my)\\s+(?:\\w+\\s+){0,2}?' + OWN_WORD + '\\b');
const MOVE_RE = new RegExp('\\b' + MOVE);
const CONNECT_V = /\b(connect\w*|log ?in|sign ?in|sign (?:this|in)|login|connexion|identifi\w*|inscri\w*|regist\w*|join\w*|claim\w*|cliam|collect\w*|verif\w* (?:mon|my|ton|your|votre) (?:wallet|compte|account|portefeuille)|valid\w* mon (?:compte|wallet)|participer|particip\w*|accept\w*|voir|view\w*|check\w*|consult\w*|reclam\w*|recuper\w*|whitelist|mint)\b/;
const PAY_V = /\b(give|gave|tip|tips|offrir|offre|offert|je file|file|settle|reimburse|rembours\w*|wire|lend|pret\w*|preter|donner?|donne|verser|verse|regl\w*|payer?|paie|paye|paiement|pay|transfer\w*|transf\w*|send\w*|envoy\w*|virement|vire[rz]?)\b/;
const SWAP_V = /\b(vendre|vends|vend|vente|sell\w*|dump\w*|cash ?out|je change|changer|change|exchange\w*|swap\w*|trade|trader|tradre|convert\w*|convertir|acheter|achet\w*|buy\w*|purchase|ape|prendre|get some|echang\w*|passer (?:mes|mon|ma))\b/;
const ASKED_FR = /\b(m'?a|me|m'ont|nous a) (?:dit|demande|demandent|conseille|conseillent|ordonne)\b|\b(told|asked|advised|instructed) me\b|\b(?:was|been) (?:told|asked|advised)\b|\b(?:support|service client|customer service|conseiller|advisor|recruteur|recruiter|banquier|agent) (?:m'?a|me|told|asked|said)\b|\bsomeone (?:told|asked|said)\b|\bquelqu'?un (?:m'?a|me)\b/;

// ---- champs
const SYMS = ['USDC', 'USDT', 'AVAX', 'WAVAX', 'WETH', 'WBTC', 'MATIC', 'LINK', 'ETH', 'BTC', 'SOL', 'POL', 'DAI'];
const ALIAS = { ether: 'ETH', ethers: 'ETH', ethereum: 'ETH', avalanche: 'AVAX', bitcoin: 'BTC', bitcoins: 'BTC', 'usd coin': 'USDC', tether: 'USDT', solana: 'SOL', chainlink: 'LINK', polygon: 'POL' };
const TOK_RE = new RegExp('(?<![\\w])(' + [...SYMS, ...Object.keys(ALIAS)].sort((a, b) => b.length - a.length).join('|') + ')(?![\\w])', 'gi');
const symOf = (w) => { const u = w.toUpperCase(); return SYMS.includes(u) ? (u === 'MATIC' ? 'POL' : u) : ALIAS[w.toLowerCase()] || null; };
const NUMW = {
  fr: { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100, 'deux cents': 200, 'cinq cents': 500, mille: 1000 },
  en: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, 'a hundred': 100, 'one hundred': 100, 'two hundred': 200, 'five hundred': 500, 'a thousand': 1000, 'one thousand': 1000 },
};
const NUMW_ALL = { ...NUMW.fr, ...NUMW.en };
const NUMW_ALT = Object.keys(NUMW_ALL).sort((a, b) => b.length - a.length).join('|').replace(/ /g, '\\s');
const TOKEN_ANY = '(?:' + [...SYMS, ...Object.keys(ALIAS)].sort((a, b) => b.length - a.length).join('|').replace(/ /g, '\\s') + ')';

export function extractAmountsNew(t, kindClear) {
  const f = t;
  // 1) nombre (avec separateur de milliers ou k) suivi d'un jeton
  let m = f.match(new RegExp('(?:^|[^\\w.,])(\\d{1,3}(?:[ \\u00a0]\\d{3})+(?:[.,]\\d{1,8})?|\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,8})?|\\d{1,12}(?:[.,]\\d{1,8})?\\s?k|\\d{1,12}(?:[.,]\\d{1,8})?)\\s?' + TOKEN_ANY + '(?![\\w])', 'i'));
  if (m) return parseNum(m[1]);
  // 2) mot-nombre suivi d'un jeton ("fifty ETH", "cinquante usdc", "half a avax")
  m = f.match(new RegExp('(?<![\\w])(' + NUMW_ALT + ')\\s+' + TOKEN_ANY + '(?![\\w])', 'i'));
  if (m) { const k = m[1].toLowerCase().replace(/\s+/g, ' '); if (NUMW_ALL[k] != null) return String(NUMW_ALL[k]); }
  if (new RegExp('(?:un demi|half a|half)\\s+' + TOKEN_ANY, 'i').test(f)) return '0.5';
  // 3) nombre seul dans une phrase deja typee : seul nombre du texte
  if (kindClear) { const all = [...f.matchAll(/(?<![\w.,])(\d{1,12}(?:[.,]\d{1,8})?)(?![\w.,])/g)]; if (all.length === 1) return parseNum(all[0][1]); }
  return null;
}
function parseNum(s) {
  s = String(s).trim();
  let mult = 1;
  if (/k$/i.test(s)) { mult = 1000; s = s.replace(/\s?k$/i, ''); }
  if (/^\d{1,3}([  ]\d{3})+/.test(s)) s = s.replace(/[  ]/g, '');
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  s = s.replace(',', '.');
  const v = Number(s) * mult;
  return Number.isFinite(v) ? String(Math.round(v * 1e9) / 1e9) : null;
}
export const stripAddr = (t) => t
  .replace(/0x[0-9a-fA-F]{40}/g, ' ')
  .replace(/0x[0-9a-fA-F]{4}\s*(?:\.{2,3}|…|\[\.\.\.\])\s*[0-9a-fA-F]{4}/g, ' ')
  .replace(/(?<![\w-])[a-z0-9][a-z0-9-]{1,30}\.(?:eth|avax|crypto|bnb|arb|sol)(?![\w])/gi, ' ');
const TARGET_BEFORE = /(?:contre|for|en|into|to|vers|pour|against|acheter|achete|buy|get|prendre|purchase|ape into|procurer|obtenir|obtain|exchange for|en echange de|into some)\s+(?:du |des |de l'|de la |some |a |an |un |une )?$/i;
export function extractTokenNew(t0, target = true) {
  const t = stripAddr(t0);
  // jeton colle au montant d'abord
  const am = t.match(new RegExp('(?:\\d|k|half a|half|un demi|(?<![\\w])(?:' + NUMW_ALT + '))\\s?(' + TOKEN_ANY + ')(?![\\w])', 'i'));
  if (am) return symOf(am[am.length - 1]);
  // sinon premiere mention qui n'est pas le jeton RECU d'un echange (jeton depense = celui de l'intention)
  for (const x of t.matchAll(TOK_RE)) {
    const before = t.slice(Math.max(0, x.index - 24), x.index);
    if (TARGET_BEFORE.test(before)) continue;
    return symOf(x[1]);
  }
  return null;
}
const ROLE = '(?:proprio|propri[eé]taire|landlord|plombier|plumber|soeur|sœur|sister|fr[eè]re|brother|coloc|roommate|boulangerie|bakery|garage|m[eè]re|mother|p[eè]re|father|patron|boss)';
const STOP = new Set(['mon', 'ma', 'mes', 'my', 'the', 'le', 'la', 'les', 'un', 'une', 'a', 'an', 'l', 'ce', 'cette', 'this', 'that', 'son', 'sa', 'ses', 'lui', 'moi', 'me', 'toi', 'vous', 'you', 'it', 'des', 'du', 'de', 'some', 'cet', 'tout', 'tous', 'eux', 'elle', 'ca', 'ça', 'pour', 'for', 'et', 'and', 'ou', 'or', 'stp', 'svp', 'merci', 'please', 'pls', 'thx', 'asap', 'lol', 'vite', 'perso', 'propre', 'personne', 'quelqu', 'someone', 'friend', 'ami', 'pote', 'site', 'ma', 'mon']);
const NB = '(?<![\\p{L}\\p{N}_])';
const NAME_CAP = "([A-ZÀ-Ý][\\p{L}'-]{1,20})(?![\\p{L}])";
export function extractRecipientNew(raw, own) {
  let m = raw.match(/0x[0-9a-fA-F]{40}/);
  if (m) return m[0].toLowerCase();
  m = raw.match(/(0x[0-9a-fA-F]{4})\s*(?:\.{2,3}|…|\[\.\.\.\])\s*([0-9a-fA-F]{4})(?![0-9a-zA-Z])/);
  if (m) return (m[1] + '..' + m[2]).toLowerCase();
  m = raw.match(/(?<![\w-])([a-z0-9][a-z0-9-]{1,30}\.(?:eth|avax|crypto|bnb|arb|sol))(?![\w])/i);
  if (m) return m[1].toLowerCase();
  if (own) return null;
  // "mon pote Nadia", "my friend Mike", "mon ami le plombier" : la personne, pas le lien de parente
  m = raw.match(new RegExp(NB + '(?:mon|ma|my)\\s+(?:ami|amie|pote|friend)\\s+(?:(?:le|la|the)\\s+)?(?:' + NAME_CAP + '|(' + ROLE + '))', 'iu'));
  if (m) { if (m[1] && /^[A-ZÀ-Ý]/.test(m[1])) return m[1].toLowerCase(); if (m[2]) return (/(le|la|the)\s+\S+$/i.test(m[0]) ? m[0].match(/(?:le|la|the)\s+\S+$/i)[0] : m[2]).toLowerCase(); }
  m = raw.match(new RegExp(NB + '((?:mon|ma|mes|le|la|my|the)\\s+' + ROLE + ')(?![\\p{L}])', 'iu'));
  if (m) return m[1].toLowerCase();
  m = raw.match(new RegExp(NB + '(?:à|a|au|aux|to|pour|for|chez|vers|de|d\'|of|with|avec|from|→|->|paying|paid|owe|give|tip|pay|paie|payer|reimburse|rembourse[rz]?|donner?|offrir|verser|wire|send|envoie|envoyer|lend|prêter|preter|credit\\w*|top up|hand|shoot)\\s+' + NAME_CAP, 'u'));
  if (m && !STOP.has(m[1].toLowerCase()) && !symOf(m[1])) return m[1].toLowerCase();
  m = raw.match(new RegExp(NB + '(?:à|a|au|to|pour|chez|vers)\\s+([a-zà-ÿ][\\p{L}\'-]{2,20})\\s*(?:$|[.,!;:?]|stp\\b|svp\\b|please\\b|pls\\b|thx\\b|merci\\b|asap\\b|pour\\b|for\\b)', 'u'));
  if (m && !STOP.has(m[1].toLowerCase()) && !symOf(m[1])) return m[1].toLowerCase();
  m = raw.match(new RegExp(NB + '(?:give|tip|pay|paie|payer|reimburse|rembourse[rz]?|lend|preter|prêter|hand|shoot)\\s+([a-zà-ÿ][\\p{L}\'-]{2,20})(?![\\p{L}])', 'u'));
  if (m && !STOP.has(m[1].toLowerCase()) && !symOf(m[1])) return m[1].toLowerCase();
  return null;
}

export function make(enabled = new Set(PATCHES)) {
  const on = (p) => enabled.has(p);
  return async function classify(text) {
    let t = M.cleanText(text);
    if (on('inject')) t = stripInjection(t);
    const base = await M.keywordClassify(t);
    const it = M.interpret(base, t);
    let kind = it.clear ? it.kind : 'none';
    const f = fold(t);
    const hasOwn = OWN_DEST.test(f);
    const hasMove = MOVE_RE.test(f);
    if (on('asked_fr') && ASKED_FR.test(f)) kind = 'asked_by_someone';
    else {
      if (on('connect_guard') && kind === 'send_to_my_account' && !hasMove) kind = CONNECT_V.test(f) ? 'connect_or_accept_offer' : 'none'; // 'mon compte' sans verbe de deplacement n'est pas un envoi
      if (on('own_dest') && (kind === 'none' || kind === 'pay_someone' || kind === 'buy_or_swap') && hasOwn && hasMove && !SWAP_V.test(f.replace(/\bcash ?out\b/, ''))) kind = 'send_to_my_account';
      if (kind === 'none') {
        if (on('swap_verbs') && SWAP_V.test(f)) kind = 'buy_or_swap';
        else if (on('connect_verbs') && CONNECT_V.test(f)) kind = 'connect_or_accept_offer';
        else if (on('pay_verbs') && PAY_V.test(f)) kind = 'pay_someone';
      }
    }
    const clear = kind !== 'none';
    let amount = it.amount ?? null, token = it.symbol ?? null;
    if (on('amounts')) amount = extractAmountsNew(stripAddr(t), clear);
    if (on('tokens')) token = extractTokenNew(t);
    const recipient = on('recipient') && !['buy_or_swap', 'connect_or_accept_offer'].includes(kind) ? extractRecipientNew(t, kind === 'send_to_my_account' || hasOwn) : null;
    return { type: kind, amount, token, recipient, facts: it.facts };
  };
}
export const classify = make();
