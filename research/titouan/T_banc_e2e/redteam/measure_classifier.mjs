// measure_classifier.mjs - compares the pasted-message classifiers (keyword fallback, Clef-flash, Clef) on existing cases.
// Usage (repo root) : node --env-file=.env research/titouan/T_banc_e2e/redteam/measure_classifier.mjs [--providers=keyword,clef-flash,clef] [--limit=N] [--files=a.jsonl,b.jsonl]
// Defaults : blind_adem/v2/V2_DEV.jsonl (tuning set) + redteam/jury_social.jsonl. V2_TEST is refused (frozen).
// Ground truth is the CASE label (malveillant / benin), used as a proxy for "this message or explanation is a manipulation" :
// a benign case with a pasted message measures false alarms, a malicious one measures recall. Other labels are reported apart.
// Without CF_ACCOUNT_ID / CF_API_TOKEN the Clef rows are skipped and the output says so. Message texts are never printed.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyPasted } from '../detectors_adem/pasted_message.mjs';
import { clefAvailable, USD_PER_M_INPUT } from '../detectors_adem/clef_client.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const providers = arg('providers', 'keyword,clef-flash,clef').split(',').filter(Boolean);
const limit = Number(arg('limit', '0'));
const files = arg('files', [join(ROOT, 'blind_adem', 'v2', 'V2_DEV.jsonl'), join(HERE, 'jury_social.jsonl')].join(',')).split(',');
const THRESHOLDS = [0.3, 0.5, 0.7, 0.9];
const POOL = 8;

const items = [];
const seen = new Set();
for (const f of files) {
  if (/V2_TEST/i.test(f)) { console.error('Refus : V2_TEST est gelé.'); process.exit(2); }
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let c; try { c = JSON.parse(line); } catch { continue; }
    const pasted = c.intent && c.intent.pastedMessage, freeText = c.intent && c.intent.freeText;
    if (!pasted && !freeText) continue;
    const k = (pasted || '') + '\u0000' + (freeText || '');
    if (seen.has(k)) continue; seen.add(k);
    items.push({ label: c.label || '?', pasted, freeText, hasPasted: Boolean(pasted) });
  }
}
const sample = limit > 0 ? items.slice(0, limit) : items;
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const quant = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

const report = { date: new Date().toISOString(), n_textes_uniques: sample.length, avec_message_colle: sample.filter((x) => x.hasPasted).length, par_label: {}, fournisseurs: {} };
for (const x of sample) report.par_label[x.label] = (report.par_label[x.label] || 0) + 1;

for (const provider of providers) {
  const isClef = provider !== 'keyword';
  if (isClef && !clefAvailable()) { report.fournisseurs[provider] = { ignore: 'CF_ACCOUNT_ID / CF_API_TOKEN absents de l\'environnement' }; continue; }
  const res = new Array(sample.length);
  let next = 0;
  await Promise.all(Array.from({ length: isClef ? POOL : 1 }, async () => {
    while (next < sample.length) { const i = next++; res[i] = await classifyPasted(sample[i], { provider }); }
  }));
  const fell = res.filter((r) => isClef && r.provider === 'keyword');
  const lat = res.filter((r) => r.provider === provider && r.ms).map((r) => r.ms);
  const tokens = res.reduce((s, r) => s + ((r.usage && (r.usage.input_tokens ?? r.usage.prompt_tokens)) || 0), 0);
  const row = { appels_reussis: res.length - fell.length, replis_mots_cles: fell.length, erreurs: [...new Set(fell.map((r) => r.error))].slice(0, 5), latence_ms: { p50: quant(lat, 0.5), p95: quant(lat, 0.95) }, tokens_entree: tokens, cout_usd: isClef ? Math.round((tokens / 1e6) * USD_PER_M_INPUT[provider] * 1e4) / 1e4 : 0, seuils: {} };
  for (const t of isClef ? THRESHOLDS : [0.6]) {
    const hit = (r) => Object.values(r.signals).some((p) => p >= t);
    const by = (label) => sample.map((x, i) => [x, res[i]]).filter(([x]) => x.label === label);
    const mal = by('malveillant'), ben = by('benin');
    row.seuils[t] = {
      rappel_malveillant_pct: pct(mal.filter(([, r]) => hit(r)).length, mal.length), n_malveillant: mal.length,
      fausses_alertes_benin_pct: pct(ben.filter(([, r]) => hit(r)).length, ben.length), n_benin: ben.length,
      autres_labels_signales: Object.fromEntries(Object.keys(report.par_label).filter((l) => l !== 'malveillant' && l !== 'benin').map((l) => [l, `${by(l).filter(([, r]) => hit(r)).length}/${by(l).length}`])),
    };
  }
  report.fournisseurs[provider] = row;
}
const out = join(HERE, 'classifier_measure.json');
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.error(`écrit : ${out}`);
