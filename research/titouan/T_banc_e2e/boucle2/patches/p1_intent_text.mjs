// boucle2, tour 1 : lecture de la phrase (extension/intent_text.js). Extraction seulement ; aucune interface.
//   node patches/p1_intent_text.mjs ../extension/intent_text.js
import { readFileSync, writeFileSync } from 'node:fs';
const f = process.argv[2]; let s = readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); if (crlf) s = s.replace(/\r\n/g, '\n');
const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error('motif attendu une fois : ' + a.slice(0, 60)); s = s.replace(a, () => b); };
// 1) vocabulaire : vendre / mettre en vente / offre ; une phrase qui donne un droit est comprise
rep("['buy_or_swap', /\\b(echang|achet|vend[sr]?\\b|convert|swap|trade|buy|sell)/],", "['buy_or_swap', /\\b(echang|achet|vend(s|re|u|ue|us|ez|ons)?\\b|(mettre|mets|met|mis) en vente|vente\\b|convert|swap|trade|buy|sell|sale\\b|list(er|e|ing)?\\b|offre\\b|offer\\b)/],");
rep("  if (facts.giveRight) { facts.grant = 1; if (kind === 'pay_someone') { kind = NO_MATCH; confidence = 0; } } // a right is given, nobody is paid", "  if (facts.giveRight) { facts.grant = 1; if (kind === 'pay_someone') { kind = NO_MATCH; confidence = 0; } } // a right is given, nobody is paid\n  // \"autoriser X à dépenser 50 USDC\", \"approve 50 USDC for X\" : the person says what they want (give a right for an operation). It is read as the\n  // kind whose checks apply to a right (amount, token, nothing else leaves) ; the fact `grant` stays set. Never when someone asked for it.\n  if (facts.grant && kind === NO_MATCH && !facts.asked) { kind = 'buy_or_swap'; confidence = 0.55; }\n  // \"faire une offre de 0,5 WETH sur le NFT 12\" : an offer the person MAKES, with an amount they give, is a purchase, not an offer they accept.\n  if (kind === 'connect_or_accept_offer' && FR[2][1].test(f) && extractFields(t).amount && !facts.receive) { kind = 'buy_or_swap'; confidence = 0.55; }");
// 2) montants écrits comme les gens écrivent
const a0 = s.indexOf('// "20 USDC", "0,5 eth", "1 000 USDC"'), a1 = s.indexOf('// True only when the sentence holds ONE amount');
if (a0 < 0 || a1 < 0) throw new Error('bloc extractFields introuvable');
const block = String.raw`// "20 USDC", "0,5 eth", "1 000 USDC" : an amount is kept only when it is glued to a token symbol (a bare number could be anything).
// Known symbols in any case ; any other symbol only in capitals ("50 JOE").
// Amounts as people write them : "1 500" and "1,500" (thousands), "12,5" (decimal comma), "cinquante" / "two hundred" (words, only when a
// token or a currency follows), "50 dollars", "50 $", "$50", "50 usd", "50 balles" (everyday money : symbol 'USD', money = true ; the token
// stays the one of the REQUEST, and only a stable token known by its address can ever match it : written_check.js).
const NUM = '([1-9]\\d{0,2}(?:[ \\u00a0\\u202f]\\d{3})+|[1-9]\\d{0,2}(?:,\\d{3})+(?![\\d,])|\\d{1,12})([.,]\\d{1,8})?';
const KNOWN_SYM = 'ETH|BTC|USDT|USDC|AVAX|SOL|MATIC|POL|DAI|WETH|WBTC|WAVAX';
const AMOUNT_KNOWN = new RegExp('(?:^|[^\\w.,])' + NUM + '\\s?(' + KNOWN_SYM + ')\\b', 'i');
const AMOUNT_OTHER = new RegExp('(?:^|[^\\w.,])' + NUM + '\\s?([A-Z][A-Z0-9]{1,7})(?![A-Za-z0-9])');
const MONEY_AFTER = new RegExp('(?:^|[^\\w.,$])' + NUM + '\\s?(dollars?|\\$|usd|us\\$|balles|bucks)(?![A-Za-z0-9])', 'i');
const MONEY_BEFORE = new RegExp('(?:^|[^\\w.,])\\$\\s?' + NUM + '(?![\\d.,]*\\s?(?:' + KNOWN_SYM + ')\\b)', 'i');
const ADDRESS = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;
// "à Paul", "vers mon Ledger", "to bob" : someone is named. Without a pasted address the recipient cannot be checked.
const NAMED = /(?:^|\s)(?:à|a|au|aux|pour|vers|chez|to)\s+[\p{L}\d]/iu;
// ---- numbers written in words (French, English), up to the thousands. Converted only when a token symbol or a currency word follows.
const W1 = { zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const W100 = new Set(['cent', 'cents', 'hundred']), W1000 = new Set(['mille', 'thousand']), WAND = new Set(['et', 'and']);
const UNIT_AFTER = new RegExp('^(?:' + KNOWN_SYM + '|dollars?|\\$|usd|balles|bucks)$', 'i');
export function wordsToDigits(text) {
  const parts = String(text).split(/(\s+)/); // words and the spaces between them
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (/^\s+$/.test(parts[i])) { out.push(parts[i]); continue; }
    let j = i, total = 0, cur = 0, n = 0, last = i;
    for (; j < parts.length; j++) {
      if (/^\s+$/.test(parts[j])) continue;
      let ok = true; const save = [total, cur, n];
      for (const w of fold(parts[j]).split('-')) {
        if (Object.prototype.hasOwnProperty.call(W1, w)) { if (W1[w] === 20 && cur % 100 === 4) cur += 76; else cur += W1[w]; n++; } // quatre-vingt = 80
        else if (W100.has(w)) { const h = cur % 100 || 1; cur = cur - (cur % 100) + h * 100; n++; }
        else if (W1000.has(w)) { total += (cur || 1) * 1000; cur = 0; n++; }
        else if (WAND.has(w) && n) continue;
        else { ok = false; break; }
      }
      if (!ok) { [total, cur, n] = save; break; }
      last = j;
    }
    while (last > i && WAND.has(fold(parts[last]))) last -= 2; // a trailing "et" / "and" is not part of the number
    const next = parts.slice(last + 1).find((p) => !/^\s+$/.test(p));
    if (n && next && (UNIT_AFTER.test(next.replace(/[.,;:!?]+$/, '')) || /^[A-Z][A-Z0-9]{1,7}$/.test(next))) { out.push(String(total + cur)); i = last; }
    else out.push(parts[i]);
  }
  return out.join('');
}
const numOf = (m) => m[1].replace(/[   ,]/g, '') + (m[2] || '').replace(',', '.');
// "1,500" : fifteen hundred, or one and a half. Both readings are kept (amount = the thousands reading, amountAlt = the decimal one).
const altOf = (m) => (!m[2] && /^[1-9]\d{0,2},\d{3}$/.test(m[1]) ? m[1].replace(',', '.').replace(/0+$/, '').replace(/\.$/, '') : null);
const SYMS = '(' + KNOWN_SYM + '|[A-Z][A-Z0-9]{1,7}(?![a-z]))';
const ART = "(?:du |des |de la |de l'|d'|de |un peu de |some |le |la |les |l')?";
const MINW = '(?:au moins|au minimum|minimum|min\\.?|at least|no less than)';
// What comes back, when written right after the amount : "contre AVAX", "en WETH", "for USDT", "pour avoir du AVAX", "de WAVAX" (after "pour 40 USD").
const COUNTER_AFTER = new RegExp('^[\\s,]*(?:contre|pour avoir|pour obtenir|pour recevoir|pour|en|vers|for|to|into|in|against|->|=>|→|de|d\'|of|worth of)\\s+(?:' + MINW + '\\s+)?(?:' + NUM + '\\s?)?' + ART + SYMS, 'i');
const GIVEN_AFTER = new RegExp('^[\\s,]*(?:avec|with|using|en payant|contre|for|pour)\\s+' + ART + SYMS, 'i');
const MIN_ANY = new RegExp(MINW + '\\s+' + NUM + '\\s?' + SYMS, 'i');
const KNOWN_SET = new Set(KNOWN_SYM.split('|'));
const isSym = (raw) => KNOWN_SET.has(String(raw).toUpperCase()) || /^[A-Z][A-Z0-9]{1,7}$/.test(String(raw)); // any other symbol : capitals only
const BUY_BEFORE = /\b(achet\w*|buy\w*|purchas\w*|get|obtenir|recevoir)\s+(?:du |des |de |some |me |moi )?$/;
const PRICE_BEFORE = /(?:\b(?:pour|au prix de|for|at|contre)|(?:^|\s)a)\s+$/;
const SELL_WORD = /\b(vend\w*|vente|sell\w*|sale|list\w*|lister|liste)\b/;
const NFT_WORD = /\bnfts?\b/;
export function extractFields(text) {
  const t = wordsToDigits(cleanText(text)), out = {};
  let m = t.match(AMOUNT_KNOWN), money = false;
  if (!m) { const a = t.match(MONEY_AFTER), b = a ? null : t.match(MONEY_BEFORE); if (a || b) { m = a || b; money = true; } }
  if (!m) m = t.match(AMOUNT_OTHER);
  const f = fold(t), nft = NFT_WORD.test(f);
  if (m) {
    out.amount = numOf(m); out.symbol = money ? 'USD' : m[3].toUpperCase();
    if (out.symbol === 'USD') out.money = true;
    const alt = altOf(m); if (alt) out.amountAlt = alt;
    // which side of the operation the written amount is : what I give (default), or what I get ("acheter 0,5 WETH", "vendre mon NFT pour 2 AVAX")
    const at = m.index + m[0].indexOf(m[1]);
    const before = fold(t.slice(0, at)), after = t.slice(m.index + m[0].length);
    if (BUY_BEFORE.test(before) && !nft) out.side = 'get';
    else if (nft && SELL_WORD.test(f) && PRICE_BEFORE.test(before)) out.side = 'get';
    else out.side = 'give';
    const c = nft ? null : after.match(out.side === 'get' ? GIVEN_AFTER : COUNTER_AFTER);
    if (c && isSym(c[c.length - 1])) { const sym = c[c.length - 1].toUpperCase(); if (sym !== out.symbol) out.counter = sym; }
    const mn = nft ? null : t.match(MIN_ANY);
    if (mn && isSym(mn[3])) out.min = { amount: numOf([null, mn[1], mn[2]]), symbol: mn[3].toUpperCase() };
  }
  if (nft) { out.nft = true; const id = f.match(/\bnfts?\s*(?:numero|number|no\.?|n°|n|#)?\s*#?(\d{1,12})\b/); if (id) out.nftId = id[1]; }
  const found = [...new Set((t.match(ADDRESS) || []).map((a) => a.toLowerCase()))];
  if (found.length === 1) out.address = found[0];
  const rest = t.replace(ADDRESS, ' ').replace(AMOUNT_KNOWN, ' ').replace(MONEY_AFTER, ' ').replace(AMOUNT_OTHER, ' ');
  if (found.length > 1 || NAMED.test(rest.replace(/(?:contre|for).*$/i, ' '))) out.named = true;
  return out;
}

`;
s = s.slice(0, a0) + block + s.slice(a1);
rep("  const t = cleanText(text), seen = new Set();", "  const t = wordsToDigits(cleanText(text)), seen = new Set();");
rep("  for (const re of [AMOUNT_KNOWN, AMOUNT_OTHER]) {", "  for (const re of [AMOUNT_KNOWN, AMOUNT_OTHER, MONEY_AFTER, MONEY_BEFORE]) {");
rep("      seen.add(m[1].replace(/ /g, '') + (m[2] || '').replace(',', '.') + ' ' + m[3].toUpperCase());\n      if (m[2] && m[2].length === 4 && m[1].length <= 3) ambiguous = true; // \"1,000\" : a decimal comma or a thousands separator",
  "      seen.add(numOf(m) + ' ' + String(m[3] || 'USD').toUpperCase().replace(/^(DOLLARS?|\\$|US\\$|BALLES|BUCKS)$/, 'USD'));\n      if ((m[2] && m[2].length === 4 && m[1].length <= 3) || altOf(m)) ambiguous = true; // \"1,000\" : a decimal comma or a thousands separator");
writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('ok');
