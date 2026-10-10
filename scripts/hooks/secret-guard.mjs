#!/usr/bin/env node
// PreToolUse(Bash) — avant `git commit` / `git push`, scanne ce qui va partir.
// Détection => exit 2 (bloque, stderr montré à Claude). Toute erreur interne => exit 1 (non bloquant).
// Deux couches : gitleaks (si installé) + regex intégrées (toujours). Une seule détection suffit à bloquer.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PATTERNS = [
  ['aws-access-key-id', /\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b/],
  ['aws-secret-access-key', /aws_secret_access_key["']?\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}\b/i],
  ['aws-bedrock-api-key', /\bABSK[A-Za-z0-9+/=]{40,}/],
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['openai-key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{36}\b/],
  ['github-pat', /\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['stripe-live-key', /\b[sr]k_live_[0-9A-Za-z]{24,}/],
];
// Valeurs d'exemple publiques (docs AWS) à ignorer.
const ALLOW = [/EXAMPLE/];

export function scanText(text) {
  const hits = [];
  for (const line of String(text).split(/\r?\n/)) {
    for (const [name, re] of PATTERNS) {
      const m = line.match(re);
      if (m && !ALLOW.some(a => a.test(m[0]))) hits.push(name);
    }
  }
  return [...new Set(hits)];
}

function main() {
  let inp = {};
  try { inp = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  const cmd = String(inp.tool_input?.command || '');
  const isCommit = /\bgit\b[^\n]*\bcommit\b/.test(cmd);
  const isPush = /\bgit\b[^\n]*\bpush\b/.test(cmd);
  if (!isCommit && !isPush) process.exit(0);

  const cwd = inp.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const git = (...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024, timeout: 60000 });
  if (git('rev-parse', '--is-inside-work-tree').stdout?.trim() !== 'true') process.exit(0);
  const top = git('rev-parse', '--show-toplevel').stdout.trim() || cwd;

  const reasons = [];
  let chunks = [];

  if (isCommit) {
    chunks.push(git('diff', '--cached', '-U0', '--no-color').stdout || '');
    // `git commit -a`, `git add … && git commit` : ce qui n'est pas encore indexé partira aussi.
    const implicitAdd = /\bgit\b[^\n]*\badd\b/.test(cmd) || /\bcommit\b[^\n]*\s-(?:[a-zA-Z]*a[a-zA-Z]*)\b/.test(cmd) || /--all\b/.test(cmd);
    if (implicitAdd) {
      chunks.push(git('diff', '-U0', '--no-color').stdout || '');
      const untracked = (git('ls-files', '--others', '--exclude-standard', '-z').stdout || '').split('\0').filter(Boolean);
      for (const f of untracked.slice(0, 500)) {
        try {
          const p = path.join(top, f);
          const st = fs.statSync(p);
          if (st.isFile() && st.size <= 1024 * 1024) chunks.push('+' + fs.readFileSync(p, 'utf8').split(/\r?\n/).join('\n+'));
        } catch { /* fichier illisible : ignoré */ }
      }
    }
  }

  let range = null;
  if (isPush) {
    const hasHead = git('rev-parse', '--verify', '-q', 'HEAD').status === 0;
    if (hasHead) {
      if (git('rev-parse', '--verify', '-q', '@{u}').status === 0) range = '@{u}..HEAD';
      else if (git('rev-parse', '--verify', '-q', 'origin/main').status === 0) range = 'origin/main..HEAD';
      else range = 'HEAD';
      chunks.push(git('log', '-p', '-U0', '--no-color', '--format=', range).stdout || '');
    }
  }

  // Couche 1 : regex sur les lignes ajoutées.
  const added = chunks.join('\n').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  const hits = scanText(added);
  if (hits.length) reasons.push(`motifs détectés : ${hits.join(', ')} (valeurs masquées)`);

  // Couche 2 : gitleaks si présent (exit 1 = fuite ; autre code = erreur, ignorée).
  const have = spawnSync('gitleaks', ['version'], { encoding: 'utf8', timeout: 10000 }).status === 0;
  if (have) {
    const args = isPush
      ? (range ? ['git', `--log-opts=${range}`, '--redact', '--no-banner', '-v', top] : null)
      : ['git', '--pre-commit', '--staged', '--redact', '--no-banner', '-v', top];
    if (args) {
      const r = spawnSync('gitleaks', args, { cwd: top, encoding: 'utf8', env, timeout: 100000, maxBuffer: 16 * 1024 * 1024 });
      if (r.status === 1) reasons.push('gitleaks:\n' + ((r.stdout || '') + (r.stderr || '')).slice(-1500));
    }
  }

  if (reasons.length) {
    process.stderr.write(
      `BLOQUÉ par secret-guard : un secret potentiel serait ${isPush ? 'poussé' : 'commité'}.\n` +
      reasons.join('\n') + '\n' +
      'Retire-le du fichier, utilise une variable d\'environnement, et si un vrai secret a déjà été commité ' +
      'ou poussé, préviens l\'humain (rotation nécessaire). Ne recopie pas la valeur.\n');
    process.exit(2);
  }
  process.exit(0);
}

try { main(); } catch (e) {
  process.stderr.write(`secret-guard: erreur interne (non bloquante) : ${e?.message || e}\n`);
  process.exit(1);
}
