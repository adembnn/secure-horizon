// Usage : node grade.mjs <reponses_persona.json> <corrige.json>  -> taux de compréhension (Wilson), par fiche et global.
import fs from "node:fs";
const wilson = (k, n, z = 1.96) => { if (!n) return [0, 1]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]; };
const ans = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); const key = Object.fromEntries(JSON.parse(fs.readFileSync(process.argv[3], "utf8")).map(x => [x.qid, x.reponse]));
const rep = Array.isArray(ans) ? ans : (ans.reponses || []);
let ok = 0, n = 0; const byCard = {};
for (const r of rep) { if (!(r.qid in key)) continue; n++; const good = String(r.choix).trim().toUpperCase() === key[r.qid]; if (good) ok++; const c = r.qid.split("-")[0]; byCard[c] = byCard[c] || { ok: 0, n: 0 }; byCard[c].n++; if (good) byCard[c].ok++; }
const w = wilson(ok, n); console.log(JSON.stringify({ persona: ans.persona || null, n_questions: n, comprises: ok, taux_pct: +(100 * ok / Math.max(1, n)).toFixed(1), wilson95_pct: w.map(x => +(100 * x).toFixed(1)), fiches_sous_80pct: Object.entries(byCard).filter(([, v]) => v.ok / v.n < 0.8).map(([k, v]) => k + ":" + v.ok + "/" + v.n) }, null, 1));
