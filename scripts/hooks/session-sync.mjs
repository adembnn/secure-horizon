#!/usr/bin/env node
// SessionStart — pull (si remote + upstream), régénère BOARD, injecte dans le contexte
// les messages INBOX non acquittés pour CLAUDE_ACTOR et un extrait du BOARD.
// Ne bloque jamais : sort toujours en 0.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function main() {
  try { fs.readFileSync(0, 'utf8'); } catch { /* stdin absent : ok */ }
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', env, timeout: 45000 });
  const me = process.env.CLAUDE_ACTOR || 'worker';
  let out = `[harness] acteur=${me}`;

  if (git('rev-parse', '--is-inside-work-tree').stdout?.trim() !== 'true') {
    console.log(out + ' | pas un repo git : sync sautée.');
    return;
  }
  const hasRemote = !!(git('remote').stdout || '').trim();
  const hasUpstream = git('rev-parse', '--verify', '-q', '@{u}').status === 0;
  if (!hasRemote) out += ' | git pull: sauté (aucun remote)';
  else if (!hasUpstream) out += ' | git pull: sauté (branche sans upstream)';
  else {
    const pull = git('pull', '--rebase', '--autostash', '-q');
    out += pull.status === 0 ? ' | git pull: ok'
      : ` | git pull: ÉCHEC — résoudre avant de travailler (/sync) : ${(pull.stderr || pull.error?.message || '').slice(0, 300)}`;
  }
  out += '\n';

  const board = path.join(root, 'scripts', 'board.mjs');
  if (fs.existsSync(board)) spawnSync(process.execPath, [board], { cwd: root, encoding: 'utf8', timeout: 15000 });

  const inboxPath = path.join(root, 'coord', 'INBOX.md');
  if (me !== 'worker' && fs.existsSync(inboxPath)) {
    const lines = fs.readFileSync(inboxPath, 'utf8').split(/\r?\n/);
    const acked = new Set(lines.map(l => (l.match(/ACK (MSG-\d+)/) || [])[1]).filter(Boolean));
    const mine = lines.filter(l => new RegExp(`(→|->)${me}\\b`, 'i').test(l) && !/ACK MSG-/.test(l)
      && !acked.has((l.match(/(MSG-\d+)/) || [])[1])).slice(-15);
    out += mine.length ? `Messages non acquittés pour toi :\n${mine.join('\n')}\n` : 'INBOX : rien de neuf.\n';
  }
  const boardMd = path.join(root, 'coord', 'BOARD.md');
  if (fs.existsSync(boardMd)) out += fs.readFileSync(boardMd, 'utf8').slice(0, 4000);
  console.log(out);
}

try { main(); } catch (e) { console.log(`[harness] session-sync: erreur ignorée (${e?.message || e})`); }
process.exit(0);
