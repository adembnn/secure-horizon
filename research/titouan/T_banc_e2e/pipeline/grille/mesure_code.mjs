// Bras (a) : code seul. Aucun réseau, aucune clé.
//   node --no-warnings pipeline/grille/mesure_code.mjs --split=reglage [--json=out.json] [--tag=avant]
//   node --no-warnings pipeline/grille/mesure_code.mjs --split=controle --json=resultats_controle_code.json   (UNE SEULE FOIS : verrou CONTROLE_OUVERT_code.lock)
for (const k of Object.keys(process.env)) if (/^CF_|CLOUDFLARE/i.test(k)) delete process.env[k];
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const { decideCode, classifyGrille, RANK } = await import('./lib.mjs');
const S = await import('./stats.mjs');
const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const split = arg('split') || 'reglage';
const file = join(HERE, split === 'controle' ? 'CONTROLE.jsonl' : 'REGLAGE.jsonl');
const raw = readFileSync(file, 'utf8');
if (split === 'controle') {
  const want = readFileSync(join(HERE, 'CONTROLE_SHA256.txt'), 'utf8').split(/\s+/)[0], got = createHash('sha256').update(raw).digest('hex');
  if (want !== got) { console.error('CONTROLE.jsonl ne correspond plus au sha256 publié. Arrêt.'); process.exit(2); }
  const lock = join(HERE, 'CONTROLE_OUVERT_code.lock');
  if (existsSync(lock)) { console.error('Le contrôle a déjà été mesuré pour le bras (a) :', readFileSync(lock, 'utf8')); process.exit(2); }
  writeFileSync(lock, `ouvert ${new Date().toISOString()} sha256=${got}\n`);
}
const cases = raw.split('\n').filter(Boolean).map(JSON.parse);
export const rowOf = (c, d, extra = {}) => ({ id: c.id, family: c.family, style: c.style, lang: c.lang, relation: c.relation, sub: c.subfamily, truth: c.truth, truthWhy: c.why, text: c.text, decision: d.decision, why: d.why, level: d.level, floor: d.floor, raw: d.raw, typeLevel: d.typeLevel, kindFound: d.kindFound, ...extra });
const rows = [];
for (const c of cases) {
  const cls = await classifyGrille(c.text, c.context, { fallback: !process.argv.includes('--sans-repli') });
  const d = await decideCode(c, cls);
  rows.push(rowOf(c, d, { kind: cls.kind, extracted: cls.extracted }));
}
// monotonie : sans intention <= phrase ; type seul <= phrase complète ; phrase vague jamais sous « sans intention »
const viol = { none_sup_final: 0, type_sup_final: 0, brut_sous_none: 0, vague_sous_none: 0, vague_n: 0 };
for (const r of rows) {
  if (RANK[r.level] < RANK[r.floor]) viol.none_sup_final++;
  if (r.kindFound && RANK[r.level] < RANK[r.typeLevel]) viol.type_sup_final++;
  if (RANK[r.raw] < RANK[r.floor]) viol.brut_sous_none++;
  if (['vague', 'horsujet', 'injection'].includes(r.style)) { viol.vague_n++; if (RANK[r.level] < RANK[r.floor]) viol.vague_sous_none++; }
}
let md = `# Bras (a) code seul, moitié ${split} (${rows.length} paires)\n` + S.confusionMd(rows) + S.tableMd(rows, (r) => r.family, 'Par famille de demande') + S.tableMd(rows, (r) => r.style, 'Par style de phrase') + S.tableMd(rows, (r) => r.lang, 'Par langue') +
  '\n#### 20 pires erreurs\n' + S.worstMd(rows, 20) + `\n#### Monotonie\n\n${JSON.stringify(viol)}\n`;
console.log(md);
if (arg('json')) writeFileSync(join(HERE, arg('json')), JSON.stringify({ split, viol, rows }, null, 1));
if (arg('md')) writeFileSync(join(HERE, arg('md')), md);
