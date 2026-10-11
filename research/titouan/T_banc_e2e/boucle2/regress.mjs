// boucle2 : non-régression sur les jeux de RÉGLAGE existants, à travers le décideur réel (sources vivantes, ou copie « avant » si B2_EXT est posé).
//   node regress.mjs panel|grille [tag]         B2_EXT=out/ext_avant node regress.mjs panel avant
// Jeux lus : preuves/panel/REGLAGE.jsonl (moitié réglage du grand panel) et preuves/out/regen/grille/REGLAGE.jsonl (moitié réglage de la grille).
// Jamais lus : les moitiés contrôle, la réserve, les jeux scellés.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { essai } from './harnais.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..', '..', '..', '..');
const jeu = process.argv[2] || 'panel', tag = process.argv[3] || 'apres';
const file = jeu === 'panel' ? join(ROOT, 'preuves', 'panel', 'REGLAGE.jsonl') : join(ROOT, 'preuves', 'out', 'regen', 'grille', 'REGLAGE.jsonl');
const rows = readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
const lc = (a) => String(a).toLowerCase();
const ctxOf = (c) => ({ contacts: (c.address_book || []).map((b) => ({ address: b.address, label: b.label })), history: c.history || [], protected: [], knownSpenders: (c.known_protocols || []).map((p) => lc(p.address)), tokens: (c.token_registry || []).map((t) => ({ address: t.address, symbol: t.symbol, decimals: t.decimals })) });
const TRUTH = { correspond: 'conforme', ne_correspond_pas: 'non_conforme', inverifiable: 'indecidable' };
const res = [];
for (const r of rows) {
  const verite = r.verite || TRUTH[r.truth], phrase = r.phrase ?? r.text, c = r.context;
  let o; try { o = await essai({ req: r.request, text: phrase, contexte: jeu === 'grille' ? ctxOf(c) : null, origin: /^https?:/.test(c.origin || '') ? c.origin : 'https://' + (c.origin || 'app.exemple.org'), chainId: '0x' + Number(c.chainId).toString(16), from: c.victim, now: jeu === 'panel' ? 1791700000000 : undefined }); } catch (e) { o = { erreur: String(e && e.message || e).slice(0, 120) }; }
  const issue = o.gate ? (o.gate.startsWith('LAISS') ? 'sans_fenetre' : 'refuse') : o.erreur ? 'erreur' : o.outcome;
  res.push({ id: r.id, verite, phrase, nature: r.nature || r.family, ecart: r.ecart_construit || r.relation, style: r.style, issue, corrige: !!o.corrected, line: o.line || null, codes: o.codes || [], written: o.written || null, relance: !!o.relance });
}
const flagged = (x) => x.issue === 'mismatch' || x.issue === 'refuse' || (x.verite !== 'conforme' && x.corrige), passed = (x) => !flagged(x) && (x.issue === 'match' || x.issue === 'sans_fenetre');
const K = res.filter((x) => x.verite === 'non_conforme'), C = res.filter((x) => x.verite === 'conforme'), I = res.filter((x) => x.verite === 'indecidable');
const T = { jeu, tag, n_ko: K.length, signale: K.filter(flagged).length, rate: K.filter(passed).length, ko_inverifiable: K.filter((x) => !flagged(x) && !passed(x)).length, n_ok: C.length, fausse_alerte: C.filter(flagged).length, ok_inverifiable: C.filter((x) => !flagged(x) && !passed(x)).length, ok_correspond: C.filter(passed).length, n_ind: I.length, surconfiance: I.filter(passed).length, ind_alerte: I.filter(flagged).length, erreurs: res.filter((x) => x.issue === 'erreur').length };
mkdirSync(join(HERE, 'out'), { recursive: true });
writeFileSync(join(HERE, 'out', `regress_${jeu}_${tag}.json`), JSON.stringify({ total: T, lignes: res }));
console.log(JSON.stringify(T));
