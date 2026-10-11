// Porte « zéro verdict ok » : le serveur livré (server/server.mjs, evaluate) ne rend jamais le niveau 'ok' ; le plus bas est 'info' (affiché « attention »).
// Rejoue le jeu de réglage (avec l'intention, comme l'extension l'envoie : type, texte, détails) et DEV / public / V2_DEV (sans intention).
//   node attacks_familles/zero_ok.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..');
const S = await import(pathToFileURL(join(ROOT, 'server', 'server.mjs')).href);
const KIND = { buy_or_swap: 'swap', pay_someone: 'pay', connect_or_accept_offer: 'login', send_to_my_account: 'pay', asked_by_someone: 'asked' };
const counts = {}; let n = 0, ok = 0;
function run(c, withIntent) {
  const k = c.context || {}; let origin = typeof k.origin === 'string' ? k.origin : undefined; if (origin && !/^[a-z][a-z0-9+.-]*:/i.test(origin)) origin = 'https://' + origin;
  const it = c.intent || {};
  const body = { method: c.request.method, params: c.request.params, origin, chainId: k.chainId, from: k.victim, ...(withIntent && KIND[it.kind] ? { intent: KIND[it.kind], intent_text: it.freeText, intent_details: { token: it.token, amount: it.amount, receiveToken: it.receiveToken, counterpartyLabel: it.counterpartyLabel, counterpartyAddress: it.counterpartyAddress } } : {}) };
  const local = { contacts: (k.address_book || []).filter((b) => b && b.address).map((b) => ({ address: String(b.address).toLowerCase(), label: String(b.label || '') })), history: (k.history || []).filter((h) => /^0x[0-9a-fA-F]{40}$/.test(String(h.address))), protected: [], knownSpenders: (k.known_protocols || []).map((p) => String(p.address || '').toLowerCase()) };
  const v = S.evaluate(body, local);
  n++; const key = `${v.level}/${v.niveau}`; counts[key] = (counts[key] || 0) + 1;
  if (v.level === 'ok' || v.niveau === 'ok') ok++;
}
for (const l of readFileSync(join(HERE, 'REGLAGE.jsonl'), 'utf8').split('\n').filter(Boolean)) run(JSON.parse(l), true);
for (const f of ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'redteam/V2_DEV_norm.jsonl']) {
  for (const l of readFileSync(join(ROOT, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((x) => x.trim())) { let c; try { c = JSON.parse(l); } catch { continue; } if (c.request && c.request.method) run(c, false); }
}
console.log(JSON.stringify({ n, verdicts_ok: ok, niveaux: counts }));
process.exit(ok ? 1 : 0);
