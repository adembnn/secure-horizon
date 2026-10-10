#!/usr/bin/env node
// PreToolUse(Read|Edit|Write|MultiEdit|NotebookEdit)
// - bloque la lecture/écriture de fichiers sensibles (.env*, clés, ~/.aws), sauf *.example ;
// - bloque l'écriture d'un contenu qui ressemble à un secret.
// Détection => exit 2. Erreur interne => exit 1 (non bloquant).
import fs from 'node:fs';

const PATTERNS = [
  /\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b/, /aws_secret_access_key["']?\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}\b/i,
  /\bABSK[A-Za-z0-9+/=]{40,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{36}\b/, /\bgithub_pat_[A-Za-z0-9_]{40,}/, /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{35}\b/, /\b[sr]k_live_[0-9A-Za-z]{24,}/,
];
const ALLOW = [/EXAMPLE/];

export function isSensitivePath(p) {
  const f = String(p || '').replace(/\\/g, '/');
  if (!f) return false;
  if (/\.example$/i.test(f)) return false;
  const base = f.split('/').pop();
  return /^\.env(\..+)?$/i.test(base)                     // .env, .env.bedrock, .env.local…
    || /\.(pem|key|p12|pfx|jks)$/i.test(base)
    || /^id_(rsa|ed25519|ecdsa|dsa)$/i.test(base)
    || /(^|\/)\.aws\//i.test(f)
    || /(^|\/)credentials$/i.test(f);
}

function looksLikeSecret(text) {
  for (const line of String(text).split(/\r?\n/)) {
    for (const re of PATTERNS) {
      const m = line.match(re);
      if (m && !ALLOW.some(a => a.test(m[0]))) return true;
    }
  }
  return false;
}

function main() {
  let inp = {};
  try { inp = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  const tool = inp.tool_name || '';
  const t = inp.tool_input || {};
  const file = t.file_path || t.notebook_path || t.path || '';

  if (isSensitivePath(file)) {
    process.stderr.write(`BLOQUÉ par file-guard : ${tool || 'accès'} sur un fichier sensible (${file}). ` +
      'Les secrets sont gérés par les humains ; utilise les variables d\'environnement (seuls les *.example sont lisibles).\n');
    process.exit(2);
  }
  if (tool === 'Read') process.exit(0);

  const text = [t.content, t.new_string, t.new_source, ...((t.edits || []).map(e => e?.new_string))]
    .filter(v => typeof v === 'string').join('\n');
  if (text && looksLikeSecret(text)) {
    process.stderr.write('BLOQUÉ par file-guard : le contenu ressemble à un secret. ' +
      'Utilise process.env.X / os.environ["X"] et documente le NOM de X (sans valeur) dans .env.example.\n');
    process.exit(2);
  }
  process.exit(0);
}

try { main(); } catch (e) {
  process.stderr.write(`file-guard: erreur interne (non bloquante) : ${e?.message || e}\n`);
  process.exit(1);
}
