// D-JETONS : trapped tokens.
//  (1) counterfeit : a token touched by the request whose symbol belongs to a reference family (USDC, USDT, WAVAX, WETH, DAI, BTC)
//      but whose address is not that family's contract on THIS chain (public registry official_tokens.mjs). Works even when the
//      case's own reference list is missing or incomplete (the engine's F8 compares only against the case list).
//  (2) honeypot / sell tax : sell simulation of every token the user would RECEIVE or BUY.
//      mode 'fork' (HOLDUP_FORK_RPC) or 'eth_call' (HOLDUP_SIM_RPC) ; ancien nom en repli : SENTINELLE_FORK_RPC, SENTINELLE_RPC ; runs it for real ; otherwise mode 'context' reads
//      token_info.sell_simulation / sell_tax_pct. The mode is written in the flag detail.
// NIST CSF DE.AE-02, DE.CM-09, ID.RA ; MITRE ATT&CK T1036 (masquerading), T1657 ; D3FEND D3-DA (dynamic analysis : sell simulation on a fork).
import { lc, isAddr, parseTyped } from './util.mjs';
import { OFFICIAL, familyOf } from './official_tokens.mjs';
import { sellCheckFork, sellCheckEthCall } from './fork_sim.mjs';

function touchedTokens(eff, request) {
  const s = new Set();
  if (eff) {
    for (const o of eff.outgoing || []) if (o.std !== 'native') s.add(lc(o.token));
    for (const o of eff.incoming || []) if (o.std !== 'native') s.add(lc(o.token));
    for (const a of eff.approvals || []) s.add(lc(a.token));
  }
  const hay = JSON.stringify(request.params || []).toLowerCase();
  return { set: s, hay };
}
function symbolOf(ctx, addr) {
  const m = ctx.tokenMeta && ctx.tokenMeta[lc(addr)];
  if (m && m.symbol) return m.symbol;
  const ti = ctx._tokenInfo || {};
  for (const [a, v] of Object.entries(ti)) if (lc(a) === lc(addr) && v && v.symbol) return v.symbol;
  return null;
}
// tokens the user is buying / receiving : incoming effects, swap outputs (path end), token_info entries named in the request
function boughtTokens(eff, ctx, hay) {
  const s = new Set();
  for (const o of (eff && eff.incoming) || []) if (o.std !== 'native') s.add(lc(o.token));
  for (const a of Object.keys(ctx._tokenInfo || {})) if (hay.includes(lc(a).slice(2))) s.add(lc(a));
  return [...s];
}

export const tokenGuard = {
  id: 'token_guard',
  async run({ eff, ctx, request, c }) {
    const flags = [];
    const chain = Number(ctx.chainId);
    const reg = OFFICIAL[chain];
    const { set, hay } = touchedTokens(eff, request);
    // typed data : the signed token contract is the verifyingContract (EIP-2612) or message.details.token (Permit2)
    const td = parseTyped(request);
    if (td && td.domain && isAddr(td.domain.verifyingContract)) set.add(lc(td.domain.verifyingContract));
    for (const a of Object.keys(ctx._tokenInfo || {})) if (hay.includes(lc(a).slice(2))) set.add(lc(a));
    if (reg) for (const t of set) {
      const fam = familyOf(symbolOf(ctx, t));
      if (!fam || !reg[fam]) continue;
      if (!reg[fam].includes(t)) flags.push({ code: 'counterfeit_reference_token', severity: 'critical', detail: `le jeton ${t} se présente comme ${symbolOf(ctx, t)} mais n'est pas le contrat officiel ${fam} de la chaîne ${chain} (${reg[fam].join(', ')})` });
    }
    // sell simulation
    const forkUrl = process.env.HOLDUP_FORK_RPC || process.env.SENTINELLE_FORK_RPC, callUrl = process.env.HOLDUP_SIM_RPC || process.env.SENTINELLE_RPC; // SENTINELLE_* : ancien nom, repli
    for (const t of boughtTokens(eff, ctx, hay)) {
      if (reg && Object.values(reg).some((l) => l.includes(t))) continue; // reference tokens are sellable by definition
      let res = null;
      const pool = (c.context && c.context.sell_pool) || (eff && eff.raw && eff.raw.to);
      if ((forkUrl || callUrl) && isAddr(pool)) {
        try { res = forkUrl ? await sellCheckFork(forkUrl, t, lc(ctx.from), lc(pool)) : await sellCheckEthCall(callUrl, t, lc(ctx.from), lc(pool)); } catch (e) { res = { mode: forkUrl ? 'fork' : 'eth_call', sellable: null, note: e.message }; }
      }
      if (!res || res.sellable === null) {
        const ti = Object.entries(ctx._tokenInfo || {}).find(([a]) => lc(a) === t);
        if (ti) {
          const v = ti[1]; const sim = String(v.sell_simulation ?? '').toLowerCase();
          res = { mode: 'context', sellable: sim ? ['ok', 'success', 'pass', 'passed'].includes(sim) : null, taxPct: Number.isFinite(Number(v.sell_tax_pct)) ? Number(v.sell_tax_pct) : undefined };
        }
      }
      if (!res) continue;
      if (res.sellable === false) flags.push({ code: 'token_cannot_be_sold', severity: 'critical', detail: `[mode=${res.mode}] la revente de ${t} échoue${res.revert ? ' (' + String(res.revert).slice(0, 80) + ')' : ''} : jeton piège (honeypot)` });
      else if (Number.isFinite(res.taxPct) && res.taxPct >= 50) flags.push({ code: 'token_sell_tax_confiscatory', severity: 'critical', detail: `[mode=${res.mode}] taxe à la revente ${res.taxPct} % sur ${t}` });
      else if (Number.isFinite(res.taxPct) && res.taxPct >= 10) flags.push({ code: 'token_sell_tax_high', severity: 'warn', detail: `[mode=${res.mode}] taxe à la revente ${res.taxPct} % sur ${t}` });
    }
    return flags.length ? { flags } : null;
  },
};
