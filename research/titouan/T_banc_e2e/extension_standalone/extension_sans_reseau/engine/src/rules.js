// Règles indépendantes de l'intention (SYNTHESE.md R_cas_complexes). Retourne des risk_flags {code,severity,detail}.
import { lc, tokenInfo } from './util.js';
import { ADDR } from './registry.js';

export const POISON = { prefix: 3, suffix: 4, windowSec: 1200 }; // USENIX : préfixe>=3, suffixe>=4, fenêtre ~20 min
export const SLIPPAGE_MAX_PCT = 5;
const YEAR = 365 * 86400;

export function matchLens(a, b) {
  const x = lc(a).slice(2), y = lc(b).slice(2);
  let p = 0; while (p < x.length && x[p] === y[p]) p++;
  let s = 0; while (s < x.length && x[x.length - 1 - s] === y[y.length - 1 - s]) s++;
  return { prefix: p, suffix: s };
}
// Empoisonnement d'adresse (USENIX Sec. 2025, R4.1/R4.3). history : [{address, ts, direction:'in'|'out', dust?}] ; contacts sans ts.
// D = adresse destinataire. Une adresse A de l'historique avec prefixe>=3 et suffixe>=4 communs (D != A) est un sosie.
// "poisoning" si D est apparue dans l'historique au plus windowSec APRES l'activité de A (ou marquée dust) ; sinon "lookalike".
// Retourne null | {entry, prefix, suffix, level, paidBefore}
export function lookalikeMatch(addr, history, now, cfg = POISON) {
  if (!addr || !history) return null;
  const D = lc(addr);
  const self = history.find((h) => h && lc(h.address) === D);
  const paidBefore = !!(self && self.direction === 'out');
  let best = null;
  for (const h of history) {
    if (!h || !h.address || lc(h.address) === D) continue;
    const { prefix, suffix } = matchLens(D, h.address);
    if (prefix >= cfg.prefix && suffix >= cfg.suffix) {
      const dt = self && self.ts != null && h.ts != null ? self.ts - h.ts : null;
      const inWindow = (dt !== null && dt >= 0 && dt <= cfg.windowSec) || !!(self && self.dust) || !!h.dust;
      const cand = { entry: h, prefix, suffix, level: inWindow ? 'poisoning' : 'lookalike', paidBefore };
      if (!best || (cand.level === 'poisoning' && best.level !== 'poisoning')) best = cand;
    }
  }
  return best;
}

export function expectedOutFor(act, ctx) {
  if (ctx.expectedOut) { const v = ctx.expectedOut(act); if (v != null) return v; }
  const a = tokenInfo(ctx, act.tokenIn), b = tokenInfo(ctx, act.tokenOut);
  if (a.stable && b.stable && act.amountIn != null && act.outKind === 'min') { // heuristique stable/stable
    const d = b.decimals - a.decimals;
    return d >= 0 ? act.amountIn * 10n ** BigInt(d) : act.amountIn / 10n ** BigInt(-d);
  }
  return null;
}

export function applyRules(eff, acts, nodes, ctx) {
  const out = [];
  const now = ctx.now ?? Math.floor(Date.now() / 1000);
  const push = (code, severity, detail, extra) => out.push({ code, severity, detail, ...(extra || {}) });
  const known = ctx.knownSpenders || new Set();
  const isKnownSpender = (a) => known.has(lc(a)) || lc(a) === ADDR.PERMIT2;
  const actors = ctx.actors;

  // droits de dépense
  for (const ap of eff.approvals) {
    const sp = lc(ap.spender);
    const code = ctx.codeOf ? ctx.codeOf(sp) : undefined; // true/false/undefined
    const knownSp = isKnownSpender(sp);
    if (ap.amount === 'unlimited') {
      if (ap.via === 'setApprovalForAll') push('approval_for_all', knownSp ? 'warn' : 'critical', `opérateur ${sp} sur toute la collection ${ap.token}`);
      else push('unlimited_allowance', knownSp ? 'warn' : 'critical', `droit illimité sur ${ap.token} pour ${sp}`);
    }
    if (!knownSp) {
      if (code === false) push('approval_to_eoa', 'critical', `droit accordé à un compte externe (sans code) ${sp}`);
      else push('external_spender', 'warn', `bénéficiaire ${sp} hors liste connue${code === undefined ? ' (nature contrat/EOA inconnue)' : ''}`);
    }
    if (ap.expiry != null && ap.expiry !== 0 && (ap.expiry > now + YEAR)) push('far_expiry', 'warn', `échéance du droit dans plus d'un an (${ap.expiry})`);
    if (ap.dai && ap.expiry === undefined) push('no_expiry', 'warn', 'DAI permit sans expiration');
  }
  // contrôle
  for (const a of acts) {
    if (a.t === 'control') push('control_change', a.severity === 'info' ? 'info' : 'critical', `${a.type} sur ${a.target} → ${a.subject}`, { controlType: a.type });
    if (a.t === 'delegatecall') push('delegatecall', 'critical', `delegatecall depuis ${a.inside} vers ${a.target}`);
    if (a.t === 'delegation') {
      if (lc(a.to) === ADDR.ZERO) push('delegation_7702_revoke', 'info', 'révocation de délégation 7702');
      else {
        push('delegation_7702', 'critical', `l'EOA exécutera le code de ${a.to}`);
        if (Number(a.chainId) === 0) push('delegation_7702_all_chains', 'critical', 'chain_id = 0 : valable sur toutes les chaînes');
      }
    }
    if (a.t === 'swap') {
      const self = lc(ctx.from);
      if (a.recipient && a.recipient !== self && a.recipient !== lc(a.router) && !actors.has(a.recipient)) push('swap_recipient_not_self', 'critical', `sortie du swap envoyée à ${a.recipient}`);
      if (a.outKind === 'min' && a.minOut === 0n) push('slippage_unbounded', 'warn', 'minimum reçu = 0 : aucun garde-fou de prix (slippage 100 %)', { slippagePct: 100 });
      else {
        const exp = expectedOutFor(a, ctx);
        if (exp && exp > 0n && a.outKind === 'min') {
          const pct = Number(((exp - a.minOut) * 10000n) / exp) / 100;
          if (pct > SLIPPAGE_MAX_PCT) push('slippage_high', 'warn', `minimum reçu inférieur de ${pct.toFixed(2)} % à l'attendu`, { slippagePct: pct });
        }
      }
    }
    if (a.t === 'transfer' && a.sweep && a.to && !actors.has(lc(a.to)) && lc(a.to) !== lc(a.from)) push('router_payout_to_other', 'critical', `le routeur verse ${a.token} à ${a.to}`);
    if (a.t === 'transfer' && a.via === 'permit2-signature' && actors.has(lc(a.from)) && a.to && !actors.has(lc(a.to)) && !isKnownSpender(a.to)) push('signed_transfer_to_other', 'warn', `transfert Permit2 signé : ${a.token} vers ${a.to}`);
  }
  // approbations imbriquées
  for (const n of nodes) {
    if (n.depth > 0) for (const a of n.acts) {
      if (a.t === 'approval' && !a.revoke && (actors.has(lc(a.owner)))) push('nested_approval', 'warn', `droit accordé dans un appel imbriqué (${n.path})`);
      if (n.allowFailure && (a.t === 'approval' || a.t === 'transfer')) push('allow_failure_sensitive', 'info', `sous-appel ${n.path} avec allowFailure`);
    }
  }
  // lookalike / empoisonnement
  const hist = ctx.history || [];
  const toCheck = new Set([...eff.outgoing.map((o) => lc(o.to)), ...eff.approvals.map((a) => lc(a.spender)), ...acts.filter((a) => a.t === 'swap').map((a) => a.recipient), ...acts.filter((a) => a.t === 'control').map((a) => lc(a.subject))]);
  for (const addr of toCheck) {
    if (!addr || !/^0x[0-9a-f]{40}$/.test(addr)) continue;
    const m = lookalikeMatch(addr, [...hist, ...(ctx.contacts || [])], now);
    if (m) {
      const sev = m.paidBefore ? 'warn' : 'critical'; // R4.1 : alerte rouge si D n'a jamais été payée par l'utilisateur
      push(m.level === 'poisoning' ? 'address_poisoning' : 'lookalike_address', sev, `${addr} ressemble à ${m.entry.address} (préfixe ${m.prefix}, suffixe ${m.suffix})${m.paidBefore ? ' ; déjà payée auparavant' : ''}`, { address: addr, lookalikeOf: lc(m.entry.address) });
    }
  }
  if (eff.shareOfBalancePct !== undefined && eff.shareOfBalancePct > 50) push('high_balance_share', 'warn', `${eff.shareOfBalancePct.toFixed(1)} % du solde sort`);
  if (eff.opaque) push('opaque', 'warn', 'au moins une partie de l\'appel n\'a pas pu être décodée');
  return out;
}
