// D-CONTROLE : takeover of a contract by SHAPE and NAME MORPHOLOGY, not by an allow-list of selectors.
// The engine knows ~a dozen canonical control selectors (transferOwnership, upgradeTo, grantRole...) ; every other spelling of the same
// act (nominateNewOwner, _setPendingAdmin, proposeOwner, pushManagement, setImplementation, setGovernance, beginDefaultAdminTransfer...)
// falls back on `unknown_selector` = warn. Rule : a call whose function NAME follows the grammar  <verb><modifier><role>(address[, x])
// (verb in set/propose/nominate/push/transfer/change/add/begin/update/assign/grant/appoint/replace/migrate, modifier in ""/New/Pending,
// role in Owner/Admin/DefaultAdmin/Governance/Management/Implementation/...), with an optional leading underscore, and whose first argument
// is an address the user cannot vouch for (not self, not a known protocol, not in the address book, never paid) -> critical.
// The selector set is COMPUTED (keccak of the generated signatures), nothing is copied from a measurement file.
// The scan runs on every 32-byte aligned position of the calldata (direct call, Safe execTransaction inner bytes, multicall bytes[],
// wallet_sendCalls entries), like the engine's own embedded-selector heuristic.
// Objections (a practitioner will make them) :
//  - "a game contract's setOwner(item) on a thing I own" : the new owner must also be a stranger to the wallet ; one confirmation is cheap
//    next to losing a contract. A self-call that hands a Safe module/guard to the user's own address is unaffected (address is self).
//  - "an attacker can name the function giveKeys(address)" : true, this layer only covers names a human reads as ownership ; a renamed
//    selector stays at the engine's warn. That is a known limit, stated in the defence sheet, not a claim.
// NIST CSF DE.AE-02, RS.MI-02 ; MITRE ATT&CK T1098 (account manipulation), T1068 ; OWASP ASI03 (identity & privilege abuse) ; D3FEND D3-UAP (user account permissions).
import { keccak256 } from '../engine/src/keccak.mjs';
import { lc, isAddr, isKnown, isSelf, trustedAddresses } from './util.mjs';

const VERBS = ['set', 'propose', 'nominate', 'push', 'transfer', 'change', 'add', 'begin', 'update', 'assign', 'grant', 'appoint', 'replace', 'migrate', 'schedule', 'queue'];
const MODS = ['', 'New', 'Pending'];
const ROLES = ['Owner', 'Owners', 'Admin', 'DefaultAdmin', 'DefaultAdminTransfer', 'Governance', 'Governor', 'Gov', 'Management', 'Manager', 'Implementation', 'Authority', 'Guardian', 'Controller', 'Beacon', 'Operator', 'Minter', 'Timelock', 'Ownership'];
const ARGS = ['address', 'address,uint256', 'address,address', 'address,uint48', 'address,bool'];

let SELECTORS = null;
export function controlSelectors() {
  if (SELECTORS) return SELECTORS;
  SELECTORS = new Map();
  for (const v of VERBS) for (const m of MODS) for (const r of ROLES) for (const a of ARGS) for (const u of ['', '_']) {
    const name = `${u}${v}${m}${r}`;
    SELECTORS.set(keccak256(`${name}(${a})`).slice(0, 10), `${name}(${a})`);
  }
  return SELECTORS;
}

// every (selector, first address argument) found at a 32-byte aligned position of a calldata blob
export function scanControlCalls(dataHex) {
  const out = [];
  if (typeof dataHex !== 'string' || !/^0x([0-9a-fA-F]{2})*$/.test(dataHex)) return out;
  const hex = dataHex.slice(2).toLowerCase();
  const sels = controlSelectors();
  for (let pos = 0; pos + 36 <= hex.length / 2 && out.length < 8; pos += pos === 0 ? 4 : 32) {
    const sig = sels.get('0x' + hex.slice(pos * 2, pos * 2 + 8));
    if (!sig) continue;
    const word = hex.slice(pos * 2 + 8, pos * 2 + 8 + 64);
    if (word.length < 64 || !/^0{24}[0-9a-f]{40}$/.test(word)) continue;
    const addr = '0x' + word.slice(24);
    if (/^0x0{40}$/.test(addr) || addr.slice(2).match(/../g).filter((b) => b !== '00').length < 12) continue;
    out.push({ sig, addr });
  }
  return out;
}

function blobs(request) {
  const p = request && request.params && request.params[0];
  if (!p) return [];
  if (request.method === 'eth_sendTransaction' || request.method === 'eth_signTransaction') return [p.data || p.input];
  if (request.method === 'wallet_sendCalls') return (p.calls || []).map((c) => c && c.data);
  return [];
}

export const controlShape = {
  id: 'control_shape',
  run({ ctx, request }) {
    const trusted = trustedAddresses(ctx);
    for (const b of blobs(request)) {
      for (const { sig, addr } of scanControlCalls(b)) {
        if (isSelf(ctx, addr) || isKnown(ctx, addr) || trusted.has(addr)) continue;
        return { flags: [{ code: 'control_change_by_shape', severity: 'critical', detail: `appel ${sig} qui remet un pouvoir de contrôle (propriété, administration, implémentation, gouvernance) à ${addr}, inconnu de vous` }] };
      }
    }
    return null;
  },
};
