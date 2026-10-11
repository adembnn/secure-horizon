// Registry of Adem's detectors, applied in order by redteam/check_plus.mjs after the engine + comparator + policy chain.
// Each detector: { id, run({c, ctx, eff, request, intent, level, reasons, adem, policy}) -> null | { flags: [{code, severity, detail}], lower?: {to, why} } } (run may be async)
// Rules read only the decoded request, the case context (what a wallet would know) and public facts.
// No case id, no address copied from the measurement set.
import { indirectPull } from './indirect_pull.mjs';
import { lookalikeKnown } from './lookalike_known.mjs';
import { spendRights } from './spend_rights.mjs';
import { tokenGuard } from './token_guard.mjs';
import { simEvents } from './sim_events.mjs';
import { nftOrders } from './nft_orders.mjs';
export const DETECTORS = [indirectPull, lookalikeKnown, spendRights, tokenGuard, simEvents, nftOrders];
