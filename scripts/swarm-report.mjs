#!/usr/bin/env node
// Usage : node scripts/swarm-report.mjs logs/swarm/<run> [--no-journal]
// Lit <run>/*.jsonl (stream-json de `claude -p`), extrait le message final "result" de chaque worker,
// affiche un tableau + coût total estimé, et ajoute une ligne par worker à coord/JOURNAL.md (append-only).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
const noJournal = process.argv.includes('--no-journal');
if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error('usage: node scripts/swarm-report.mjs <dossier logs/swarm/RUN> [--no-journal]');
  process.exit(1);
}

let total = 0;
const rows = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort()) {
  const id = f.replace(/\.jsonl$/, '');
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/).filter(Boolean);
  let res = null, retries = 0, badLines = 0;
  for (const l of lines) {
    try {
      const j = JSON.parse(l);
      if (j.type === 'result') res = j;
      if (j.type === 'system' && j.subtype === 'api_retry') retries++;
    } catch { badLines++; }
  }
  const errFile = path.join(dir, `${id}.err`);
  const errBytes = fs.existsSync(errFile) ? fs.statSync(errFile).size : 0;
  const cost = Number(res?.total_cost_usd) || 0;
  total += cost;
  rows.push({
    id,
    status: res ? (res.is_error ? 'ERROR' : (res.subtype || 'ok')) : 'NO_RESULT',
    turns: res?.num_turns ?? '-',
    cost: cost.toFixed(2),
    min: res?.duration_ms ? (res.duration_ms / 60000).toFixed(1) : '-',
    retries,
    stderr: errBytes ? `${errBytes}B` : '-',
    nonjson: badLines,
  });
}

if (!rows.length) console.log('(aucun fichier .jsonl dans ce run)');
else console.table(rows);
console.log(`TOTAL estimé : $${total.toFixed(2)} (estimation client Claude Code)`);
if (rows.some(r => r.retries > 5)) console.log('ATTENTION : nombreux retries API (throttling ?) — baisser -j.');

if (!noJournal && rows.length) {
  const now = new Date().toISOString();
  const run = path.basename(path.resolve(dir));
  const txt = rows.map(r => `${now} | swarm | ${r.id} | run ${run}: ${r.status} turns=${r.turns} cost=$${r.cost} retries=${r.retries}`).join('\n') + '\n';
  const journal = path.join(root, 'coord', 'JOURNAL.md');
  fs.mkdirSync(path.dirname(journal), { recursive: true });
  fs.appendFileSync(journal, txt);
}
