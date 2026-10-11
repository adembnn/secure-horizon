// D-INTENT : the declared intent is a form field typed by a human or produced by a model ; the comparator reads it literally.
// Structural repairs, each one an independent rule (flag code in brackets) :
//  (1) malformed `kind` ["kind_malformed"] : "Pay_Someone", "asked_by_someone " (trailing space), "asked-by-someone" are the same word.
//      The comparator falls back to "no intent" on a literal mismatch, which LOWERS the verdict. We canonicalise (trim, lower-case,
//      [-\s]+ -> _) and, if the canonical kind is in the enum, we re-run the comparator + policy with it and keep the worse level.
//  (2) token said vs token sent ["token_mismatch"] : pay_someone / send_to_my_account with a declared token that differs from the
//      asset leaving (native symbol per chain, or the ERC-20 symbol read from the registry). Wrapped / bridged variants (WAVAX,
//      USDC.e) are the same asset family. Objection : "users type 'dollars' or 'eth' for WETH" ; the mismatch is only raised when both
//      symbols are known and the families differ ; a free-text token is not matched.
//  (3) amount ["amount_exceeded_robust"] : the comparator checks it with parseFloat for pay_someone only ("1,000" and "1k" read as 1,
//      which is also a false alarm on an honest payment) and not at all for send_to_my_account. We parse thousands separators, decimal
//      comma, k/m suffixes and keep EVERY plausible reading : exceeds only if the amount sent is more than 1 % above the LARGEST reading.
//      An unparseable amount ("mille", "NaN") raises nothing : we cannot verify it. When every critical reason of the engine is
//      amount_exceeded and every reading covers the amount sent, we `lower` it (documented false-positive fix).
//  (4) first payment of a large share ["new_recipient_large_share"] : pay_someone / unreadable kind, recipient neither the user, nor a
//      known protocol, nor in the address book, nor ever paid, and the transfer is more than half of the balance -> critical.
//      A recipient who only SENT funds to the user is not "known" (dust laundering rule). Objection : "paying a new landlord 60 % of
//      your balance is legitimate" ; it is rare enough to be worth one confirmation, and the engine already raises a warn.
//  (5) unreadable kind ["kind_missing_unvouched_recipient"] : with no usable kind there is no declared intent to match ; a transfer to a
//      recipient the user never paid is treated like send_to_my_account (first_seen_recipient = critical). Objection : "kind is optional
//      in some flows" ; then the wallet cannot vouch for the recipient, and a missing field must not make the verdict weaker.
//  (6) label vs address book ["recipient_not_label"] : the declared counterparty label ("Paul") is resolved in the address book ; if the book
//      has at least one entry with that label and the recipient is none of them, the funds go to someone else than the person named.
//      The comparator only checks `counterpartyAddress`, which the form leaves empty when the user types a name. Objection : "two people
//      named Paul" : any entry with that label is accepted ; "I pay Paul at a new address he just gave me" : one confirmation, the book
//      is the reference the user chose. Labels are compared without case, accents or repeated spaces.
// NIST CSF DE.AE-02, DE.AE-06, RS.MI ; MITRE ATT&CK T1657 ; OWASP ASI01 (goal hijack: intent not enforced) ; D3FEND D3-UBA (user behavior analysis).
import { lc, isAddr, isKnown, isSelf, trustedAddresses, benchLower } from './util.mjs';

export const KINDS = new Set(['asked_by_someone', 'buy_or_swap', 'connect_or_accept_offer', 'pay_someone', 'send_to_my_account']);
export const canonicalKind = (raw) => {
  if (typeof raw !== 'string') return null;
  const k = raw.trim().toLowerCase().replace(/[-\s]+/g, '_');
  return KINDS.has(k) ? k : null;
};

// every plausible numeric reading of a typed amount ; [] when unreadable
export function amountReadings(s) {
  if (typeof s === 'number' && Number.isFinite(s)) return [s];
  if (typeof s !== 'string') return [];
  let t = s.trim().toLowerCase().replace(/[\s_  ']/g, '');
  let mult = 1;
  if (/[km]$/.test(t)) { mult = t.endsWith('k') ? 1e3 : 1e6; t = t.slice(0, -1); }
  if (!/^\d[\d.,]*(e\d+)?$|^[.,]\d+$/.test(t)) return [];
  const out = new Set();
  const add = (x) => { const n = Number(x); if (Number.isFinite(n)) out.add(n * mult); };
  const hasDot = t.includes('.'), hasCom = t.includes(',');
  if (hasDot && hasCom) { // the LAST separator is the decimal one
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) add(t.replace(/\./g, '').replace(',', '.')); else add(t.replace(/,/g, ''));
  } else if (hasCom) {
    const parts = t.split(',');
    if (parts.length > 2 || /^\d{1,3}(,\d{3})+$/.test(t)) { add(t.replace(/,/g, '')); if (parts.length === 2) add(t.replace(',', '.')); } // 1,000 : thousands or decimal
    else add(t.replace(',', '.'));
  } else if (hasDot && /^\d{1,3}(\.\d{3}){2,}$/.test(t)) add(t.replace(/\./g, ''));
  else add(t);
  return [...out];
}

const normLabel = (x) => (typeof x === 'string' ? x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/s+/g, ' ').trim() : '');
const NATIVE_SYMBOL = { 1: 'ETH', 11155111: 'ETH', 43114: 'AVAX', 43113: 'AVAX' };
const family = (sym) => { const s = String(sym || '').toUpperCase().replace(/^\$/, '').replace(/\.E$/, '').replace(/\.B$/, ''); return s.length > 3 && s.startsWith('W') ? s.slice(1) : s; };
function sentSymbol(ctx, o) {
  if (o.std === 'native') return NATIVE_SYMBOL[Number(ctx.chainId)] || null;
  return o.symbol && o.symbol !== 'NATIVE' ? o.symbol : (ctx.tokenMeta || {})[lc(o.token)]?.symbol || null;
}

// the user has paid / saved / protocol-listed this address. Incoming-only history counts for nothing (dust laundering).
export function vouched(ctx, a) {
  a = lc(a);
  return isSelf(ctx, a) || isKnown(ctx, a) || trustedAddresses(ctx).has(a);
}

const lvlRank = { ok: 0, warn: 1, critical: 2 };
let cmp = null;
async function engine() {
  if (cmp) return cmp;
  try {
    const { compare } = await import(new URL('../engine/vendor/compare.ts', import.meta.url).href);
    const { applyPolicy } = await import(new URL('../run/policy.mjs', import.meta.url).href);
    cmp = { compare, applyPolicy };
  } catch { cmp = {}; }
  return cmp;
}

const WARN_CODES = new Set(['new_contract', 'high_balance_share', 'unlimited_approval_swap', 'low_confidence']);

// Rule (5) severity. Measured 2026-10-11 on V2_DEV + jury files (pipeline/RESULTATS_INTEGRATION.md) : at `critical` this single flag is the first source of
// false alarms of the shipped pipeline (every first payment to a new address turns red) and it disappears as soon as a kind is declared, so a
// declared kind LOWERED the verdict (479 cases). Default `warn`, raised for a missing kind AND for a bare kind alike. HOLDUP_IG_KM=critical restores
// the former behaviour, =off removes the rule ; HOLDUP_IG_BARE=0 restores the former condition (missing kind only).
const KM = () => (typeof process !== 'undefined' && process.env.HOLDUP_IG_KM) || 'warn';
export const intentGuard = {
  id: 'intent_guard',
  async run({ ctx, eff, request, intent, level, policy }) {
    if (!eff || !intent) return null;
    const flags = [];
    const raw = intent.kind;
    const kc = canonicalKind(raw);

    // (1) malformed but recoverable kind : re-run the engine with the canonical word
    if (kc && raw !== kc) {
      const E = await engine();
      if (E.compare) {
        const fixed = { ...intent, kind: kc };
        const adem = E.compare(fixed, eff);
        const p = E.applyPolicy({ eff, adem, ctx, intent: fixed, request });
        if (lvlRank[p.level] > lvlRank[level]) flags.push({ code: 'kind_malformed', severity: p.level, detail: `le type d'intention « ${String(raw)} » n'est pas lu tel quel par le comparateur ; lu comme « ${kc} » le verdict est ${p.level}` });
      }
    }

    // transfers to a protocol (bridge fee, router, vault) are the cost of a service, not a payment : only direct recipients are compared
    const outs = (eff.outgoing || []).filter((o) => (o.std === 'native' || o.std === 'erc20') && isAddr(o.to) && !isKnown(ctx, o.to) && !isSelf(ctx, o.to));
    const sends = ['pay_someone', 'send_to_my_account'].includes(kc) || !kc;

    // (2) token said vs sent
    if (sends && typeof intent.token === 'string' && intent.token) {
      const said = family(intent.token);
      for (const o of outs) {
        const sym = sentSymbol(ctx, o);
        if (!sym || !said) continue;
        if (family(sym) !== said) { flags.push({ code: 'token_mismatch', severity: 'critical', detail: `vous avez dit « ${intent.token} », la demande envoie ${sym} (${o.amount})` }); break; }
      }
    }

    // (3) amount said vs sent
    let covered = false;
    if (sends && intent.amount !== undefined && outs.length) {
      const readings = amountReadings(intent.amount);
      if (readings.length) {
        const said = typeof intent.token === 'string' ? family(intent.token) : '';
        const sentTotal = outs.filter((o) => !said || family(sentSymbol(ctx, o)) === said).reduce((s, o) => s + Number(o.amount || 0), 0);
        if (sentTotal > Math.max(...readings) * 1.01) flags.push({ code: 'amount_exceeded_robust', severity: 'critical', detail: `vous avez dit ${intent.amount}, la demande envoie ${sentTotal}` });
        // `covered` ne sert qu'à baisser : il faut que la lecture la PLUS PETITE (celle du comparateur : « 1,000 » = 1) couvre aussi le montant envoyé.
        // La lecture la plus large sert à lever moins d'alertes, jamais à en retirer une.
        else if (sentTotal <= Math.min(...readings) * 1.01) covered = true;
      }
    }

    // (6) the label names a book entry, the recipient is another address
    if ((kc === 'pay_someone' || kc === 'send_to_my_account') && typeof intent.counterpartyLabel === 'string' && outs.length) {
      const want = normLabel(intent.counterpartyLabel);
      const named = (ctx._book || []).filter((b) => isAddr(b.address) && normLabel(b.label) === want).map((b) => lc(b.address));
      const stray = want && named.length ? outs.find((o) => !named.includes(lc(o.to))) : null;
      if (stray) flags.push({ code: 'recipient_not_label', severity: 'critical', detail: `vous payez « ${intent.counterpartyLabel} » (carnet : ${named[0]}) mais la demande envoie à ${lc(stray.to)}` });
    }

    // (4) / (5) recipient the user never paid
    const share = eff.shareOfBalancePct ?? ctx._sharePct;
    const strangers = outs.filter((o) => !vouched(ctx, o.to));
    const bare = !!kc && !(typeof process !== 'undefined' && process.env.HOLDUP_IG_BARE === '0') && !(isAddr(intent.counterpartyAddress) && strangers.some((o) => lc(o.to) === lc(intent.counterpartyAddress))); // the user did not name THIS recipient (an amount or a token says nothing about who is paid)
    // a swap said WITHOUT what nor how much ("échanger") is a genre alone : it vouches for nobody, so it must not do better than no intent at all
    // (measured 2026-10-11, pipeline/RESULTATS_INTENTION_VAGUE.md). A swap with a token or an amount keeps the former behaviour.
    const said = (x) => (typeof x === 'string' && x.trim() !== '') || typeof x === 'number';
    const nudeSwap = kc === 'buy_or_swap' && !said(intent.token) && !said(intent.amount) && !said(intent.counterpartyLabel) && !said(intent.counterpartyAddress);
    if (strangers.length && (kc === 'pay_someone' || !kc || (bare && (kc !== 'buy_or_swap' || nudeSwap)))) {
      const o = strangers[0];
      if (Number.isFinite(share) && share > 50) flags.push({ code: 'new_recipient_large_share', severity: 'critical', detail: `${lc(o.to)} n'est ni dans votre carnet, ni un destinataire déjà payé, et la demande déplace ${Number(share).toFixed(0)} % du solde` });
      else if (KM() === 'off') { /* rule (5) disabled */ }
      else if (!kc) flags.push({ code: 'kind_missing_unvouched_recipient', severity: KM(), detail: `aucune intention exploitable (type « ${String(raw)} ») et ${lc(o.to)} n'a jamais été payé par vous` });
      // a kind WITHOUT the recipient (the one-click answer of the extension, or a form where only the amount is typed) says nothing about who is paid : it must not make the verdict
      // weaker than no answer at all (invariant : adding intent information never lowers the level). Same rule, same code.
      else if (bare) flags.push({ code: 'kind_missing_unvouched_recipient', severity: KM(), detail: `vous n'avez pas dit ${nudeSwap ? 'quoi ni combien' : 'qui vous payez'}, et ${lc(o.to)} n'a jamais été payé par vous` });
    }

    // false-positive repair : the comparator's only critical is amount_exceeded and the amount typed ("1,000", "1k") covers what is sent
    // COUPÉ dans le chemin produit (jamais de baisse) ; rendu au banc seulement (HOLDUP_BENCH_LOWER=1)
    if (benchLower() && !flags.length && covered && policy) {
      const crit = (policy.reasons || []).filter((r) => (r.sev || (WARN_CODES.has(r.code) ? 'warn' : 'critical')) === 'critical');
      const engineCrit = (eff.risk_flags || []).some((f) => f.severity === 'critical');
      if (crit.length && crit.every((r) => r.code === 'amount_exceeded') && !engineCrit) return { lower: { to: 'warn', why: `amount_exceeded vient de la lecture parseFloat de « ${intent.amount} » ; relu avec séparateurs et suffixes, le montant envoyé est couvert` } };
    }
    return flags.length ? { flags } : null;
  },
};
