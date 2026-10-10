#!/usr/bin/env node
// Génère coord/BOARD.md à partir des frontmatters de coord/tasks/*.md.
// Usage : node scripts/board.mjs   (fonctionne depuis n'importe quel dossier)
// N'écrit le fichier que si le contenu a changé (sinon le hook Stop commiterait à chaque tour).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'coord', 'tasks');
const out = path.join(root, 'coord', 'BOARD.md');

export function parseFrontmatter(txt) {
  const fm = (txt.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];
  const o = {};
  for (const l of fm.split(/\r?\n/)) {
    const m = l.match(/^([A-Za-z_][\w-]*):\s*(.*?)(\s+#.*)?$/);
    if (m) o[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return o;
}

const cell = v => String(v ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');

const tasks = fs.existsSync(dir) ? fs.readdirSync(dir)
  .filter(f => f.endsWith('.md') && !/^T-000\b/.test(f) && !/template/i.test(f))
  .map(f => ({ file: f, ...parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8')) }))
  .map(t => ({ ...t, id: t.id || t.file.replace(/\.md$/, '') })) : [];

const order = ['doing', 'claimed', 'review', 'blocked', 'todo', 'done'];
const sections = [...order, 'autre'];
let body = '';
for (const s of sections) {
  const ts = tasks.filter(t => (s === 'autre' ? !order.includes(t.status) : t.status === s))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (s === 'autre' && !ts.length) continue;
  body += `## ${s.toUpperCase()} (${ts.length})\n\n| ID | Titre | Lane | Owner | Agent | Dépend de |\n|---|---|---|---|---|---|\n`;
  for (const t of ts) {
    body += `| [${cell(t.id)}](tasks/${encodeURI(t.file)}) | ${cell(t.title)} | ${cell(t.lane)} | ${cell(t.owner)} | ${cell(t.agent)} | ${cell(t.depends_on)} |\n`;
  }
  body += '\n';
}

const header = '# BOARD (généré par `node scripts/board.mjs` — ne pas éditer)\n\n';
const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
const prevBody = prev.replace(/^[\s\S]*?\n_MAJ [^\n]*_\n\n/, '');
if (prevBody !== body || !prev.startsWith(header)) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${header}_MAJ ${new Date().toISOString()}_\n\n${body}`);
  console.log(`BOARD: ${tasks.length} tâche(s) — mis à jour`);
} else {
  console.log(`BOARD: ${tasks.length} tâche(s) — inchangé`);
}
