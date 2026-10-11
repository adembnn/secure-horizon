// boucle2, tour 2 : compléments au cœur de comparaison (patches/p2_written_core.txt), puis réapplication.  node patches/p3_core_suite.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const p = join(dirname(fileURLToPath(import.meta.url)), 'p2_written_core.txt'); let s = readFileSync(p, 'utf8');
if (s.includes('facts.nftAll')) { console.log('déjà appliqué'); process.exit(0); }
const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error('motif : ' + a.slice(0, 60)); s = s.replace(a, () => b); };
// M2b : le prix total de l'ordre doit être le prix écrit ; la part versée à d'autres (commission) reste sous 10 %
rep("      let toMe = 0n, dec = null, sym = null, unknownLeg = false;\n      for (const x of moneyIn) { const l = leg(x); if (!mine(x.to)) continue;", "      let toMe = 0n, total = 0n, dec = null, sym = null, unknownLeg = false;\n      for (const x of moneyIn) { const l = leg(x); if (!l.unknown && l.family === fam(intent.symbol)) total += x.amount; if (!mine(x.to)) continue;");
rep("      if (want == null || toMe * 10n < want * 9n) return", "      if (want == null || total * 100n < want * 99n) return { outcome: 'mismatch', line: said + ' Cet ordre vend pour ' + fromRaw(total, dec) + ' ' + sym + '.' };\n      if (toMe * 10n < want * 9n) return");
// M11 : un jeton intermédiaire inconnu
rep("    const lo = legOf(outToken, tokens, chain);", "    const lo = legOf(outToken, tokens, chain);\n    if ((s.via || []).some((t) => legOf(t, tokens, chain).unknown) && !flags.cannot) flags.cannot = 'Cet échange passe par un jeton que je ne connais pas.';");
// D4a : un droit sur toute une collection de NFT
rep("  // 4) an exchange read in the call", "  // a right on a whole NFT collection is never what a sentence with one amount says. Selling one NFT may need it for a marketplace of the\n  // public list or of the settings : even then it is wider than the sale, and it cannot be said to match.\n  for (const n of facts.nftAll) {\n    const sale = intent.nft && get && known && known.has(n.operator);\n    if (!sale) return { outcome: 'mismatch', line: said + ' Cette demande donne à ' + shortA(n.operator) + ' accès à tous tes NFT de cette collection.' };\n    flags.cannot = 'Cette demande donne accès à tous tes NFT de cette collection, pas seulement à celui que tu vends.';\n  }\n  // 4) an exchange read in the call");
rep("  if (facts.swaps.length) return { outcome: 'match', line: swapLine || line };", "  if (facts.swaps.length) return { outcome: 'match', line: swapLine || line };\n  if (facts.nftAll.length) return { outcome: 'match', line };");
writeFileSync(p, s);
console.log('ok');
