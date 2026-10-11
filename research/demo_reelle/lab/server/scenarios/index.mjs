// Scenario catalogue loader. Scenarios are plain data (site.mjs, wallet.mjs, others.mjs); this file adds what is derived:
// framework mapping per family, the message text (read from the repo's existing catalogues), coverage, defaults of editable fields,
// and the build / truth functions (thin wrappers over ../ops.mjs and ../run.mjs).
import site from './site.mjs';
import wallet from './wallet.mjs';
import others from './others.mjs';
import { messageText, MESSAGES } from './messages.mjs';
import { TECHNIQUES, DISGUISES, compile } from '../ops.mjs';
import { runScenario, exclusive, withSnapshot } from '../run.mjs';

// NIST CSF 2.0 categories and MITRE ATT&CK techniques. Only identifiers we are sure of.
const DETECT = ['DE.CM-09', 'DE.AE-02'], RESPOND = ['RS.MI-01'];
const REFS = {
  permit: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1657']],
  permit2: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1657']],
  approve: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1657']],
  increase_allowance: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1657']],
  nft_approval: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1657']],
  batch: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1036', 'T1657']],
  blind_sign: [[...DETECT, ...RESPOND], ['T1566.002', 'T1204.001', 'T1657']],
  ownership: [[...DETECT, ...RESPOND], ['T1566.002', 'T1098', 'T1657']],
  swap: [[...DETECT, ...RESPOND], ['T1566.002', 'T1657']],
  lookalike: [[...DETECT, ...RESPOND], ['T1036', 'T1657']],
  support_scam: [[...DETECT, ...RESPOND], ['T1566', 'T1656', 'T1657']],
  exchange: [DETECT, ['T1566', 'T1656', 'T1657']],
  transfer: [[...DETECT, ...RESPOND], ['T1656', 'T1657']],
};
const FAMILY_OF = { permit: 'permit', permit2: 'permit2', approve: 'approve', increase_allowance: 'increase_allowance', set_approval_for_all: 'nft_approval', transfer: 'transfer', transfer_ownership: 'ownership', swap_no_min: 'swap' };
export const familyOfTechnique = (t) => FAMILY_OF[t] || t;

export function staticCoverage(sc) {
  const t = TECHNIQUES[sc.recipe.technique];
  const sig = t.kind !== 'tx' || (sc.recipe.disguises || []).includes('personal_sign_calldata');
  if (sc.door === 'walletconnect' && sig) return { covered: false, coverageNote: "Par WalletConnect, une signature hors chaîne passe par le relais WalletConnect, pas par le RPC du portefeuille : le RPC protecteur ne la voit jamais." };
  if (sc.door === 'exchange') return { covered: true, coverageNote: "Le retrait part de la plateforme, pas du portefeuille : Hold up ne peut ni le voir ni le retenir. Seule vérification possible : l'adresse et le message collés par la personne, avant de valider." };
  if (sc.door === 'wallet' || sc.door === 'walletconnect') return { covered: true, coverageNote: "Vu seulement si le portefeuille utilise le RPC protecteur comme réseau : Hold up reçoit la transaction déjà signée, sans la page ni le message." };
  return { covered: true };
}

export function finalize(sc) {
  const out = { ...sc, staging: { ...sc.staging } };
  if (out.staging.messageId && !out.staging.messageText) { const t = messageText(out.staging.messageId); if (t) { out.staging.messageText = t; out.staging.messageSource = MESSAGES[out.staging.messageId].source; } }
  const label = out.label === 'malveillant';
  const [nist, threat] = REFS[out.family] || [DETECT, []];
  out.nist_csf = out.nist_csf || (label ? nist : ['DE.AE-02']);
  out.threat_refs = out.threat_refs || (label ? threat : []);
  Object.assign(out, staticCoverage(out));
  const p = out.recipe.params || {};
  out.defaults = {};
  for (const f of out.editable || []) out.defaults[f] = f === 'intentKind' ? out.intent.kind : f === 'pastedMessage' ? (out.staging.messageText || '') : p[f] ?? null;
  out.build = async (ctx, params = {}) => exclusive(() => withSnapshot(ctx, async () => (await compile(ctx, out, strip(params))).request));
  out.truth = async (ctx, params = {}) => (await runScenario(ctx, out, { params })).truth;
  return out;
}
const strip = ({ pastedMessage, intentKind, ...rest } = {}) => rest;

export const CATALOGUE = [...site, ...wallet, ...others].map(finalize);
export const byId = (id) => CATALOGUE.find((s) => s.id === id) || null;
export function available(ctx, sc) {
  if (sc.requires === 'permit2' && !ctx.c.permit2) return { available: false, why: "Permit2 n'existe pas sur cette chaîne (mode hors ligne)." };
  if (sc.requires === 'realUsdc' && !ctx.c.realUsdc) return { available: false, why: "Le vrai contrat USDC n'existe que sur la copie d'Avalanche (mode fork)." };
  for (const d of sc.recipe.disguises || []) if (DISGUISES[d] && DISGUISES[d].needs === 'multicall3' && !ctx.c.multicall3) return { available: false, why: "Multicall3 n'existe pas sur cette chaîne (mode hors ligne)." };
  return { available: true };
}
// what the API returns: the scenario without its functions
export function publicScenario(ctx, sc) {
  const { build, truth, ...rest } = sc;
  return { ...rest, ...available(ctx, sc) };
}
