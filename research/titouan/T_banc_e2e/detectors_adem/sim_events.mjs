// D-FILET : encoding-independent safety net. Whatever the encoding (Multicall3, Universal Router commands, nested
// wallet_sendCalls, router multicall, unknown aggregator, unknown selector...), the request is SIMULATED on a fork and
// the token events that concern the victim are read :
//  - Approval / ApprovalForAll whose owner is the victim and whose spender is not a known protocol -> critical ;
//  - Transfer out of the victim to an address that is neither the victim nor a known protocol, while the simulation shows
//    NO token coming back to the victim, and the user did not declare a payment -> critical.
// Modes : 'fork' (HOLDUP_FORK_RPC, ancien nom SENTINELLE_FORK_RPC, local Hardhat/anvil fork, impersonation, revert) ; 'context' (logs already present
// in context.simulation.logs, e.g. produced by the wallet's own simulator). Without either, the detector is silent.
// NIST CSF DE.CM-09, DE.AE-02 ; MITRE ATT&CK T1657 ; OWASP ASI02 ; D3FEND D3-DA (dynamic analysis).
import { lc, isKnown, isSelf } from './util.mjs';
import { simulateTxFork, TOPIC, topicAddr } from './fork_sim.mjs';

export function readVictimEvents(logs, ctx) {
  const v = lc(ctx.from);
  const out = { approvals: [], outflows: [], inflows: 0 };
  for (const l of logs || []) {
    const t = (l.topics || []).map(lc);
    if (t[0] === TOPIC.Approval && t.length >= 3 && topicAddr(t[1]) === v) {
      const amount = t.length === 3 ? BigInt(l.data && l.data !== '0x' ? l.data : '0x0') : 1n;
      if (amount > 0n) out.approvals.push({ token: lc(l.address), spender: topicAddr(t[2]), amount });
    } else if (t[0] === TOPIC.ApprovalForAll && topicAddr(t[1]) === v && BigInt(l.data || '0x0') !== 0n) {
      out.approvals.push({ token: lc(l.address), spender: topicAddr(t[2]), amount: 'all' });
    } else if (t[0] === TOPIC.Transfer && t.length >= 3) {
      if (topicAddr(t[1]) === v && topicAddr(t[2]) !== v) out.outflows.push({ token: lc(l.address), to: topicAddr(t[2]) });
      if (topicAddr(t[2]) === v && topicAddr(t[1]) !== v) out.inflows++;
    }
  }
  return out;
}

export const simEvents = {
  id: 'sim_events',
  async run({ c, ctx, request, intent }) {
    let mode = null, logs = null;
    const forkUrl = process.env.HOLDUP_FORK_RPC || process.env.SENTINELLE_FORK_RPC; // SENTINELLE_* : ancien nom, repli
    if (forkUrl && request.method === 'eth_sendTransaction') {
      const tx = request.params[0];
      try { const r = await simulateTxFork(forkUrl, { ...tx, from: tx.from || ctx.from }); mode = 'fork'; logs = r.logs; } catch { /* fork unreachable : fall back */ }
    }
    if (!logs && c.context && c.context.simulation && Array.isArray(c.context.simulation.logs)) { mode = 'context'; logs = c.context.simulation.logs; }
    if (!logs) return null;
    const ev = readVictimEvents(logs, ctx);
    const flags = [];
    for (const a of ev.approvals) if (!isKnown(ctx, a.spender) && !isSelf(ctx, a.spender)) { flags.push({ code: 'sim_approval_by_victim', severity: 'critical', detail: `[mode=${mode}] la simulation montre un droit ${a.amount === 'all' ? 'sur toute la collection' : 'de dépense'} ${a.token} accordé par vous à ${a.spender}` }); break; }
    const declaredPay = intent && ['pay_someone', 'send_to_my_account'].includes(intent.kind);
    if (!declaredPay && ev.inflows === 0) for (const o of ev.outflows) if (!isKnown(ctx, o.to)) { flags.push({ code: 'sim_outflow_without_return', severity: 'critical', detail: `[mode=${mode}] la simulation montre ${o.token} sortant de votre compte vers ${o.to}, sans rien recevoir en retour` }); break; }
    return flags.length ? { flags } : null;
  },
};
