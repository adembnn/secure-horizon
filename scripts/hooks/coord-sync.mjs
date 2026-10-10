#!/usr/bin/env node
// Stop — commit + push de coord/ UNIQUEMENT, pour les sessions humaines, sur main.
// No-op si : worker / acteur absent, aucun remote, pas sur main, rebase/merge en cours, rien à pousser.
// Ne bloque jamais la session : sort toujours en 0.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SECRET = [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, /\bABSK[A-Za-z0-9+/=]{40,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}/, /\bgh[pousr]_[A-Za-z0-9]{36}\b/, /\bgithub_pat_[A-Za-z0-9_]{40,}/,
  /aws_secret_access_key["']?\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}\b/i];

const say = msg => console.log(JSON.stringify({ systemMessage: `coord-sync: ${msg}` }));

function main() {
  let inp = {};
  try { inp = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* ok */ }
  if (inp.stop_hook_active) return;
  const me = process.env.CLAUDE_ACTOR || 'worker';
  if (me === 'worker') return;                                  // les workers passent par branche + PR

  const root = process.env.CLAUDE_PROJECT_DIR || inp.cwd || process.cwd();
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const g = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', env, timeout: 30000 });

  if (g('rev-parse', '--is-inside-work-tree').stdout?.trim() !== 'true') return;
  if (!(g('remote').stdout || '').trim()) return;               // pas de remote => no-op total
  if (g('rev-parse', '--abbrev-ref', 'HEAD').stdout?.trim() !== 'main') return;
  for (const p of ['rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD']) {
    const gp = g('rev-parse', '--git-path', p).stdout?.trim();
    if (gp && fs.existsSync(path.resolve(root, gp))) return;
  }

  const board = path.join(root, 'scripts', 'board.mjs');
  if (fs.existsSync(board)) spawnSync(process.execPath, [board], { cwd: root, timeout: 15000 });
  if (!(g('status', '--porcelain', '--', 'coord').stdout || '').trim()) return;

  g('add', '--', 'coord');
  const staged = (g('diff', '--cached', '-U0', '--no-color', '--', 'coord').stdout || '')
    .split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
  if (staged.some(l => SECRET.some(re => re.test(l)))) {
    g('reset', '-q', '--', 'coord');
    say('secret potentiel détecté dans coord/ — rien n\'a été commité. Nettoie avant le prochain tour.');
    return;
  }
  const c = g('commit', '-q', '-m', `coord: auto-sync (${me})`, '--', 'coord');
  if (c.status !== 0) { say(`commit refusé (${(c.stderr || '').trim().slice(0, 200)})`); return; }

  // Fast path : si origin/main est déjà un ancêtre de HEAD, pas besoin de rebase (évite l'autostash).
  if (g('fetch', '-q', 'origin', 'main').status !== 0) { say('fetch impossible (réseau/auth ?) — commit gardé en local.'); return; }
  const behind = g('merge-base', '--is-ancestor', 'origin/main', 'HEAD').status !== 0;
  if (behind) {
    const p = g('pull', '--rebase', '--autostash', '-q', 'origin', 'main');
    if (p.status !== 0) {
      g('rebase', '--abort');
      say('conflit au pull --rebase, commit gardé en local — lance /sync (vérifie aussi `git stash list`).');
      return;
    }
  }
  const push = g('push', '-q', 'origin', 'main');
  if (push.status !== 0) say(`push échoué (${(push.stderr || '').trim().slice(0, 200)}) — commit gardé en local.`);
}

try { main(); } catch (e) { say(`erreur ignorée (${e?.message || e})`); }
process.exit(0);
