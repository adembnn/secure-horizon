// boucle2 : « 25 $ contre du WAVAX » face à un droit de 20 USDT : la politique du moteur ne doit pas lever token_differs_from_intent.
//   node sonde_monnaie.mjs      (sortie attendue : sans monnaie = raison levée pour un vrai autre jeton ; avec USD = aucune raison de jeton)
import { applyPolicy } from '../run/policy.mjs';
const USDT = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', ROUTER = '0x' + '70'.repeat(20);
const eff = () => ({ chainId: 43114, kind: 'transaction', risk_flags: [], outgoing: [], incoming: [], approvals: [{ token: USDT, spender: ROUTER, amount: '20', std: 'erc20', via: 'approve' }], counterparties: [], opaqueReasons: [] });
const ctx = { chainId: 43114, from: '0x' + 'a1'.repeat(20), knownSpenders: [ROUTER], tokenMeta: { [USDT]: { symbol: 'USDT', decimals: 6, stable: true } }, history: [], contacts: [] };
const run = (token, amount) => applyPolicy({ eff: eff(), adem: { level: 'ok', reasons: [] }, ctx, intent: { kind: 'buy_or_swap', token, amount, freeText: 'x' }, request: { method: 'eth_sendTransaction', params: [{}] } });
const a = run('USD', '25'), b = run('USDC', '25');
console.log('jeton dit USD  :', a.level, a.reasons.map((r) => r.code).join(',') || 'aucune raison');
console.log('jeton dit USDC :', b.level, b.reasons.map((r) => r.code).join(',') || 'aucune raison');
process.exit(a.reasons.some((r) => r.code === 'token_differs_from_intent') ? 1 : 0);
