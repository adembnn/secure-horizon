// D-SOSIE : look-alike address against EVERYTHING the user already knows by name, not only the payment history.
// USENIX Security 2025 (address poisoning) : prefix >= 3 AND suffix >= 4 hex chars in common, different address.
// The engine already applies it to history + address book (rules.mjs) ; this detector extends the reference set to
// known protocols (routers, Permit2, Multicall...), reference tokens, and the address the user COPIED (clipboard),
// and the exposed set to the called contract and to swap recipients.
// Clipboard : if the wallet sees that the pasted destination differs from what was copied, the clipper is caught
// even when the substituted address does not look alike (`clipboard_substituted`).
// NIST CSF DE.AE-02, DE.CM-09 ; MITRE ATT&CK T1115 (clipboard data), T1036 (masquerading) ; D3FEND D3-ID (identifier analysis).
import { lc, isAddr, matchLens, trustedAddresses, exposedAddresses } from './util.mjs';

export const PREFIX = 3, SUFFIX = 4;

export const lookalikeKnown = {
  id: 'lookalike_known',
  run({ eff, ctx, c }) {
    if (!eff) return null;
    const trusted = trustedAddresses(ctx);
    const clip = c.context && c.context.clipboard;
    if (clip && isAddr(clip.copied)) trusted.set(lc(clip.copied), { src: 'presse-papiers (adresse copiée)' });
    const flags = [];
    const seen = new Set();
    for (const { addr, role } of exposedAddresses(eff)) {
      if (seen.has(addr)) continue; seen.add(addr);
      if (trusted.has(addr) || addr === lc(ctx.from)) continue;
      for (const [t, info] of trusted) {
        const { prefix, suffix } = matchLens(addr, t);
        if (prefix >= PREFIX && suffix >= SUFFIX) {
          flags.push({ code: 'lookalike_of_known', severity: 'critical', detail: `${role} ${addr} imite ${t} (${info.src}${info.label ? ' « ' + info.label + ' »' : ''}) : préfixe ${prefix}, suffixe ${suffix}` });
          break;
        }
      }
    }
    if (clip && isAddr(clip.copied) && isAddr(clip.pasted) && lc(clip.copied) !== lc(clip.pasted)) {
      const pasted = lc(clip.pasted);
      if (exposedAddresses(eff).some((x) => x.addr === pasted) || JSON.stringify(c.request.params || []).toLowerCase().includes(pasted.slice(2))) {
        flags.push({ code: 'clipboard_substituted', severity: 'critical', detail: `l'adresse collée ${pasted} n'est pas celle copiée ${lc(clip.copied)} : presse-papiers modifié` });
      }
    }
    return flags.length ? { flags } : null;
  },
};
