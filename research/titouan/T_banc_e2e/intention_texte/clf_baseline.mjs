// clf_baseline.mjs - le repli mots-cles ACTUEL, tel quel (importe depuis extension_standalone, lecture seule).
// classify(text) -> { type, amount, token, recipient, asked, receive, grant }
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(resolve(HERE, '..', 'extension_standalone', 'extension', 'intent_text.js')).href);
export async function classify(text) {
  const raw = await M.keywordClassify(text);
  const it = M.interpret(raw, text);
  return { type: it.clear ? it.kind : 'none', amount: it.amount ?? null, token: it.symbol ?? null, recipient: null, facts: it.facts, raw_kind: raw.kind };
}
export const name = 'baseline (repli mots-cles actuel)';
