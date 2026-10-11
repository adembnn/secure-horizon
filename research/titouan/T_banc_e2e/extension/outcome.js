/* Hold up - what the window says. Pure ES module (no chrome.*, no DOM).
 * THE one place where the engine's internal levels become one of the three answers the person reads :
 *
 *   engine level / state                                                 -> outcome
 *   -------------------------------------------------------------------------------------
 *   'unknown', or verdict.indeterminate (engine down, unreadable request) -> 'unverifiable'
 *   nothing was written (question skipped by a setting, body too large)   -> 'unverifiable'
 *   the written amount or recipient is not the request's (verdict.written) -> 'mismatch'
 *   the sentence stayed too vague after the one follow-up (intent.vague)   -> never 'match'
 *   'manipulation'                                                        -> 'mismatch'
 *   'danger'                                                              -> 'mismatch', unless the written intent covers it (*)
 *   verdict.intent_contradiction (comparator : said X, does Y)            -> 'mismatch'
 *   the text was not understood (intent.clear === false)                  -> 'unverifiable'
 *   'attention' with an understood intent and no contradiction            -> 'match'
 *   the only gap was a right wider than the written amount AND Hold up brought it back to that amount in the request itself
 *   (verdict.written.corrected + verdict.relief, both set by the gatekeeper only)                      -> 'match'
 *
 *   (*) covers() : the person wrote that they want to give a permission, the request ONLY grants a right (no funds leave),
 *       nobody told them to do it, no look-alike address, no contradiction. The level and its delay do not change.
 *
 * The outcome is display only : the hold (hold_core.js) is driven by the level, never by the outcome. "match" is never
 * shown green and never says "sûr". */
export const TEXT = {
  question: (site) => (site ? 'Que veux-tu faire sur ' + site + ' ?' : 'Que veux-tu faire sur ce site ?'),
  placeholder: 'Par exemple : échanger 50 USDC contre AVAX',
  match: 'Ça correspond à ce que tu as écrit.',
  mismatch: 'Ça ne correspond pas à ce que tu as écrit.',
  unverifiable: 'Je n’ai pas pu vérifier cette demande.',
  lineFallback: 'Je ne sais pas dire ce que fait cette demande.',
  expected: 'Adresse que tu connais', written: 'Adresse que tu as écrite', actual: 'Adresse de cette demande'
};

export function covers(intent, verdict) {
  const eff = verdict.effects || {};
  return !!(intent && intent.clear && intent.facts && intent.facts.grant && !intent.facts.asked && intent.kind !== 'asked_by_someone'
    && verdict.level === 'danger' && eff.grants_right && !eff.funds_out && !verdict.intent_contradiction && !verdict.address_diff
    && !(verdict.risk_signals || []).includes('lookalike'));
}

export function outcomeOf(verdict, intent) {
  if (!verdict || verdict.level === 'unknown' || verdict.indeterminate) return 'unverifiable';
  if (!intent || !intent.text) return 'unverifiable';
  const w = verdict.written && verdict.written.outcome;
  if (w === 'mismatch' || verdict.level === 'manipulation') return 'mismatch';
  // The request that goes to the wallet is the corrected one : it carries the written amount, nothing else was wrong with it.
  if (w === 'match' && verdict.written.corrected === true && verdict.relief === true && !verdict.intent_contradiction && !verdict.address_diff) return intent.clear && !intent.vague ? 'match' : 'unverifiable';
  if (verdict.level === 'danger') return !intent.vague && w !== 'unverifiable' && covers(intent, verdict) ? 'match' : 'mismatch';
  if (verdict.intent_contradiction) return 'mismatch';
  if (!intent.clear || intent.vague || w === 'unverifiable') return 'unverifiable';
  return 'match';
}

// ---- the single line "what the request really does" (engine texts, repaired at the display layer only)
const LOCAL_HOST = /(?:https?:\/\/)?(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]|0\.0\.0\.0)(?::\d{1,5})?/gi;
export const isLocalHost = (site) => { LOCAL_HOST.lastIndex = 0; const s = String(site || ''); const m = s.match(LOCAL_HOST); return !!m && m[0].length === s.length; };
// A loopback address is not a name a person knows : "ce site". A real host is shown as is.
// S9 : never cut from the right (the real domain is at the right end). A long host keeps its last two labels whole and loses the middle.
export function siteName(site) {
  if (!site || isLocalHost(site)) return '';
  const s = String(site);
  if (s.length <= 80) return s;
  const labels = s.split('.');
  let tail = labels.slice(-2).join('.');
  for (let i = 3; i <= labels.length; i++) { const t = labels.slice(-i).join('.'); if (t.length > 50) break; tail = t; }
  const room = 80 - tail.length - 1;
  return (room > 0 ? s.slice(0, room) : '') + '…' + tail;
}
export function cleanLine(text) {
  let s = String(text == null ? '' : text);
  s = s.replace(LOCAL_HOST, 'ce site');
  // "pendant 1178 jours" : nobody counts in days beyond a year. Above 365 the line says "plus d'un an" (still true).
  s = s.replace(/pendant (\d[\d\s.,]*) jours?/gi, (all, n) => (Number(String(n).replace(/[\s.,]/g, '')) > 365 ? 'pendant plus d’un an' : all));
  s = s.replace(/pendant (un nombre illimité de|plusieurs) jours/gi, 'sans limite de durée');
  s = s.replace(/(\d)\.(\d+)(?=\s\p{Lu})/gu, '$1,$2'); // "0.01 AVAX" -> "0,01 AVAX"
  s = s.replace(/(0x[0-9a-fA-F]{2,8})…([0-9a-fA-F]{2,8})/g, '$1⁠…⁠$2'); // a shortened address never breaks across two lines
  s = s.replace(/\b(tes|les|ton|mes) {2,}/g, '$1 ').replace(/\s{2,}/g, ' ').replace(/\s+([.,])/g, '$1').trim();
  s = s.replace(/^à ce site\b/, 'À ce site').replace(/(^|[.!?] )ce site/g, (all, a) => a + 'Ce site');
  return s.slice(0, 240);
}
export function lineOf(verdict) {
  if (verdict && verdict.written && typeof verdict.written.line === 'string' && verdict.written.line) return verdict.written.line.slice(0, 240);
  const t = verdict && verdict.texts && typeof verdict.texts.reel === 'string' ? verdict.texts.reel : verdict && verdict.real && typeof verdict.real.amount === 'string' ? verdict.real.amount : '';
  return cleanLine(t) || TEXT.lineFallback;
}

// The network of the request, as a name a person knows. An unknown one is shown by its number : never hidden.
const NETWORKS = { 1: 'Ethereum', 10: 'Optimism', 56: 'BNB Chain', 137: 'Polygon', 8453: 'Base', 42161: 'Arbitrum', 43113: 'Avalanche Fuji (test)', 43114: 'Avalanche', 11155111: 'Sepolia (test)', 31337: 'chaîne locale de test' };
export function networkName(chainId) {
  let n; try { n = chainId == null || chainId === '' ? null : BigInt(chainId); } catch (_) { n = null; }
  if (n == null || n < 0n) return '';
  return NETWORKS[n.toString()] || 'réseau n° ' + n.toString();
}

// Two addresses, each as 2 rows of 5 groups of 4 characters ; `diff` marks the characters that differ.
const HEX40 = /^0x[0-9a-fA-F]{40}$/;
export function addressesOf(verdict) {
  const d = verdict && ((verdict.written && verdict.written.address_diff) || verdict.address_diff);
  if (!d || !HEX40.test(d.expected || '') || !HEX40.test(d.actual || '')) return null;
  const a = d.expected.slice(2), b = d.actual.slice(2);
  const cells = (x, y) => Array.from({ length: 10 }, (_, g) => Array.from({ length: 4 }, (_, i) => ({ c: x[g * 4 + i], diff: x[g * 4 + i].toLowerCase() !== y[g * 4 + i].toLowerCase() })));
  let n = 0; for (let i = 0; i < 40; i++) if (a[i].toLowerCase() !== b[i].toLowerCase()) n++;
  return { expected: cells(a, b), actual: cells(b, a), differing: n, expectedFull: d.expected, actualFull: d.actual };
}

// Everything the window needs for the answer screen, from a verdict and the stored intent.
export function answerOf(verdict, intent) {
  const outcome = outcomeOf(verdict, intent);
  return { outcome, headline: TEXT[outcome], line: lineOf(verdict), fix: verdict && verdict.written && typeof verdict.written.fix === 'string' ? verdict.written.fix.slice(0, 120) : null, addresses: addressesOf(verdict), labels: { expected: verdict && verdict.written && verdict.written.address_diff ? TEXT.written : TEXT.expected, actual: TEXT.actual }, noModel: !!(intent && intent.text && intent.model === false),
    model: intent && intent.text && intent.model === true && (intent.source === 'clef' || intent.source === 'jev') ? intent.source : null }; // which model classified the sentence (null : none) : the window says it
}
