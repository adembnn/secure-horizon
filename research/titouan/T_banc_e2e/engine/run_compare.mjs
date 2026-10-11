// Exécute le comparateur d'Adem (vendor/compare.ts) sur les scénarios et affiche le tableau PASS/FAIL.
import { runScenarios } from './test/scenarios.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const rows = runScenarios();
mkdirSync('out', { recursive: true });
writeFileSync('out/compare_table.json', JSON.stringify(rows, null, 1));
const P = (b) => (b ? 'PASS' : 'FAIL');
console.log('id   attendu        Adem(verdict) Adem   Notre(floor)  Notre  Combiné  | description');
for (const r of rows) console.log(r.id.padEnd(4), r.expected.padEnd(14), r.adem.padEnd(13), P(r.ademPass).padEnd(6), r.ours.padEnd(13), P(r.oursPass).padEnd(6), P(r.combinedPass).padEnd(8), '|', r.desc);
const n = rows.length, c = (k) => rows.filter((r) => r[k]).length;
console.log(`\nAdem seul : ${c('ademPass')}/${n} PASS ; notre moteur seul : ${c('oursPass')}/${n} ; combiné (max) : ${c('combinedPass')}/${n}`);
