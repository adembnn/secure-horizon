// Règles additionnelles du moteur (indépendantes de l'intention). Ne lisent que : l'effet décodé, la requête brute (structure) et le contexte fourni.
import { isOn } from './fixes.mjs';
import { parseSig, decodeParams } from './abi.mjs';
import { lc } from './util.mjs';

const lvl = (fl) => (fl.some((f) => f.severity === 'critical') ? 'critical' : fl.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
const sevRank = { info: 0, warn: 1, critical: 2 };

export function addFlags(eff, flags, opacityCodes) {
  if (!flags.length) return eff;
  eff.risk_flags.push(...flags);
  eff.risk_flags.sort((a, b) => sevRank[b.severity] - sevRank[a.severity]);
  eff.level = lvl(eff.risk_flags);
  eff.levelEvidence = lvl(eff.risk_flags.filter((f) => !(opacityCodes || new Set()).has(f.code)));
  return eff;
}

// ---- F5 : fonctions « valeur contre service » courantes (mint, staking, dépôt de pont, enregistrement de nom) vers un protocole de la liste connue.
// Sélecteurs CALCULÉS (keccak) à partir de signatures ABI usuelles ; aucune adresse. Le service crédite un état (jeton de reçu / NFT / nom) que le calldata ne montre pas :
// l'appel est décodé (non opaque), n'accorde aucun droit, et le bénéficiaire éventuel est vérifié.
const SERVICE = ['mint(uint256 quantity)', 'mint(address to,uint256 quantity)', 'submit(address referral)', 'depositETHTo(address to,uint32 gas,bytes data)', 'depositETH(uint32 gas,bytes data)', 'bridgeETHTo(address to,uint32 gas,bytes data)', 'register(string name,address owner,uint256 duration)', 'stake()'].map((sig) => parseSig(sig));
const BENEFICIARY = { to: 'to', owner: 'owner' };
const OPACITY_ONLY = new Set(['unknown_selector', 'opaque']);
function serviceCall(eff, request, ctx) {
  if (!request || request.method !== 'eth_sendTransaction') return;
  const tx = request.params && request.params[0]; if (!tx || !tx.to) return;
  if (!(ctx.knownSpenders || []).includes(lc(tx.to))) return;           // seulement un protocole de la liste connue
  if (!eff.opaque || eff.approvals.length || (eff.controlChange || []).length || eff.delegation) return;
  if (eff.risk_flags.some((f) => f.severity !== 'info' && !OPACITY_ONLY.has(f.code))) return; // une autre preuve de risque : on ne touche pas
  const data = String(tx.data ?? tx.input ?? '0x').toLowerCase();
  const sig = SERVICE.find((e) => data.startsWith(e.selector));
  if (!sig) return;
  let args; try { args = decodeParams(sig.params, '0x' + data.slice(10)); } catch { return; }       // calldata mal formé : reste opaque
  const bKey = sig.params.map((p) => p.name).find((n) => BENEFICIARY[n]);
  const beneficiary = bKey && typeof args[bKey] === 'string' ? lc(args[bKey]) : undefined;
  eff.risk_flags = eff.risk_flags.filter((f) => !OPACITY_ONLY.has(f.code));
  eff.opaque = false; eff.opaqueReasons = [];
  eff.service = { name: sig.name, ...(beneficiary ? { beneficiary } : {}) };
  eff.risk_flags.push({ code: 'service_call_decoded', severity: 'info', detail: `${sig.canon} vers un protocole connu : aucun droit accordé` });
  if (beneficiary && !(ctx.actors && ctx.actors.has(beneficiary)) && !(ctx.contacts || []).some((c) => lc(c.address) === beneficiary)) {
    eff.risk_flags.push({ code: 'service_beneficiary_not_self', severity: 'warn', detail: `le service profite à ${beneficiary}, ni vous ni un contact` });
  }
}

export function applyExtraRules(eff, request, ctx) {
  const flags = [];
  if (isOn('F5')) serviceCall(eff, request, ctx);
  addFlags(eff, flags);
  return eff;
}

export function analyzeChainRequest(request, ctx) {
  if (!isOn('F6')) return null;
  const eff = { chainId: Number(ctx.chainId ?? 0), from: ctx.from, kind: 'chain', outgoing: [], incoming: [], approvals: [], counterparties: [], raw: { method: request.method }, opaque: false, opaqueReasons: [], controlChange: [], nested: [], risk_flags: [], level: 'ok', levelEvidence: 'ok' };
  return eff;
}
