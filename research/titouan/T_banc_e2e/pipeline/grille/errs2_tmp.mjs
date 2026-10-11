import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8')); const rows = j.rows[process.argv[3]];
const g = {};
for (const x of rows.filter((x) => x.truth !== x.decision)) { const k = `${x.truth}>${x.decision} | ${x.family} | ${x.why}`; (g[k] ??= []).push(x); }
for (const [k, v] of Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, +process.argv[4] || 20)) console.log(v.length, k, '|', v.slice(0, 2).map((x) => x.text + ' <' + (x.kind||'') + (x.p ? ' m' + x.p.matches?.toFixed(2) + ' d' + x.p.differs?.toFixed(2) + ' u' + x.p.unclear?.toFixed(2) : '') + '>').join(' ## '));
