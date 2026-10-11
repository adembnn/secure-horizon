// Hold up - incident record : the piece a user can hand to the police, an insurer or a platform after a
// dangerous request was stopped (or signed anyway). Built ONLY from the hash-chained journal the product
// already keeps (server.mjs makeJournal : extension door ; rpc_garde/proxy.mjs : RPC door), on the user's request.
//
//   node incident.mjs --journal <file.jsonl> --list | --stats
//   node incident.mjs --journal <file.jsonl> --seq <verdict seq> --out <dir> [--request req.json | --raw 0x...]
//
// OBJECTIONS (stated on purpose)
// 1. "A file on the victim's disk proves nothing, she can rewrite it." True before anchoring : the hash chain
//    only shows internal consistency. anchor_evidence.mjs fixes an upper bound in time (block timestamp) ;
//    the record says which of the two states it is in (`anchor` present or null).
// 2. "The journal has no decoded effect, so 'what it would have done' is your word." True : the journal keeps
//    rule ids, the fiche id and a hash of the parameters, never the parameters. If the user still has the
//    request (extension) or the signed bytes (RPC), --request / --raw checks them against the journalled hash
//    and decodes them again with the product engine. Without them the record only names the rule family.
// 3. "Extension door : verdict and decision are paired by site + method + order, there is no request id."
//    True : two identical requests from one site in a row are paired with the nearest decision. The RPC door
//    has a hold id and is exact. `pairing` says which one applied.
// 4. "'confirm' is not 'signed'." True on the extension door : it means the user overrode the warning ; what
//    she then did in the wallet is not visible. On the RPC door 'continue' means the bytes were broadcast.
// No personal data beyond the journal : no name, no free text, no contact. Addresses appear only on the RPC
// door (the journal already holds from / to there) or if the user supplies the request herself.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { respond, MATRIX } from './matrix.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANC = resolve(HERE, '..', '..', 'titouan', 'T_banc_e2e');
const sha = (s) => createHash('sha256').update(s).digest('hex');
export const recordHash = (r) => sha(r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry)); // same formula as server.mjs

// ------------------------------------------------------------------ journal
export function readJournal(file) {
  if (!existsSync(file)) throw new Error(`journal not found : ${file}`);
  const records = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l); } catch { throw new Error(`journal line ${i + 1} is not JSON`); } });
  let prev = '0'.repeat(64), brokenAt = null;
  for (const r of records) { if (r.prev !== prev || r.hash !== recordHash(r)) { brokenAt = r.seq; break; } prev = r.hash; }
  return { records, chain: { ok: brokenAt === null, n: records.length, brokenAt, head: records.length ? records[records.length - 1].hash : null } };
}

const FINAL = new Set(['cancel', 'confirm', 'continue', 'expire', 'continue_failed']);
// -> { verdict, decision|null, events[], door, pairing }
export function pair(records, seq) {
  const i = records.findIndex((r) => r.seq === seq);
  if (i < 0) throw new Error(`no journal record with seq ${seq}`);
  const v = records[i], e = v.entry || {};
  if (e.type === 'rpc_verdict') {
    if (e.outcome !== 'hold') throw new Error(`record ${seq} is an RPC verdict "${e.outcome}", not a hold : nothing was shown to the user`);
    const decision = records.slice(i + 1).find((r) => r.entry.type === 'rpc_decision' && r.entry.hold === e.hold && FINAL.has(r.entry.decision)) || null;
    return { verdict: v, decision, events: [], door: 'rpc', pairing: 'exact (hold id)' };
  }
  if (e.type !== 'verdict') throw new Error(`record ${seq} is "${e.type}", not a verdict`);
  let decision = null; const events = [];
  for (const r of records.slice(i + 1)) {
    const x = r.entry;
    if (x.origin !== e.origin || x.method !== e.method) continue;
    if (x.type === 'verdict') break; // a new request from the same site : stop, never borrow its decision
    if (x.type !== 'ext_log' || x.kind !== 'decision') continue;
    if (x.decision === 'cancel' || x.decision === 'confirm') { decision = r; break; }
    if (x.decision === 'call_trusted') events.push(r);
  }
  return { verdict: v, decision, events, door: 'extension', pairing: 'by site, method and order (no request id in the journal)' };
}

// Verdicts worth an incident record : shown to the user at Danger or Manipulation (rank >= 3), or any level with all = true.
export function listIncidents(records, { all = false } = {}) {
  const out = [];
  for (const r of records) {
    const e = r.entry || {};
    const shown = e.type === 'verdict' || (e.type === 'rpc_verdict' && e.outcome === 'hold');
    const L = MATRIX.levels[e.level];
    if (!shown || !L || (!all && L.rank < 3)) continue;
    const p = pair(records, r.seq);
    out.push({ seq: r.seq, ts: r.ts, door: p.door, level: e.level, fiche: e.fiche || null, from_site: e.origin || null, tx: e.tx || null, decision: p.decision ? p.decision.entry.decision : null });
  }
  return out;
}

// Response metrics over a whole journal, for the analyst of a platform that integrates the engine : how many alerts
// per level, what users decided, how long they took. Medians only, with n : a mean hides the 10-minute holds.
// OBJECTION : "override rate" on the extension door counts users who passed the warning, not confirmed signatures.
export function stats(records) {
  const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) / 2)] : null);
  const by = {};
  for (const i of listIncidents(records, { all: true })) {
    const p = pair(records, i.seq), o = p.decision ? respond({ level: i.level, door: p.door, decision: p.decision.entry.decision }).outcome : 'pending';
    const b = (by[i.level] = by[i.level] || { shown: 0, cancelled: 0, expired: 0, signed: 0, not_sent: 0, pending: 0, respond_ms: [], detect_ms: [] });
    b.shown++; b[o]++;
    if (p.decision) b.respond_ms.push(Date.parse(p.decision.ts) - Date.parse(p.verdict.ts));
    if (typeof p.verdict.entry.latency_ms === 'number') b.detect_ms.push(p.verdict.entry.latency_ms);
  }
  return Object.fromEntries(Object.entries(by).map(([l, b]) => { const { respond_ms, detect_ms, ...c } = b; const decided = b.shown - b.pending;
    return [l, { ...c, override_rate: decided ? Math.round((b.signed / decided) * 1000) / 1000 : null, median_time_to_respond_ms: median(respond_ms), median_time_to_detect_ms: median(detect_ms), n_detect: detect_ms.length }]; }));
}

let fichesCache = null;
function ficheInfo(id) {
  if (!id) return null;
  try { fichesCache = fichesCache || JSON.parse(readFileSync(join(BANC, '..', 'U_textes_utilisateur.json'), 'utf8')).fiches; } catch { return null; }
  const f = fichesCache.find((x) => x.id === id);
  return f ? { id, threat: f.menace, technique: f.technique } : { id };
}

const ms = (a, b) => Date.parse(b) - Date.parse(a);

// ------------------------------------------------------------------ record
export function buildIncident(journal, seq, { generatedAt = new Date().toISOString() } = {}) {
  const { records, chain } = journal;
  const { verdict: v, decision: d, events, door, pairing } = pair(records, seq);
  const e = v.entry;
  if (!MATRIX.levels[e.level]) throw new Error(`record ${seq} has level "${e.level}" : no response defined`);
  const plan = respond({ level: e.level, fiche: e.fiche, door, decision: d ? d.entry.decision : undefined });
  const latency = typeof e.latency_ms === 'number' ? e.latency_ms : null;
  const timeline = [];
  if (latency !== null) timeline.push({ at: new Date(Date.parse(v.ts) - Math.round(latency)).toISOString(), what: 'request_received', note: 'verdict time minus engine latency' });
  timeline.push({ at: v.ts, what: 'verdict', level: e.level, journal_seq: v.seq });
  for (const x of events) timeline.push({ at: x.ts, what: 'call_trusted_clicked', journal_seq: x.seq });
  if (d) timeline.push({ at: d.ts, what: 'decision', decision: d.entry.decision, outcome: plan.outcome, journal_seq: d.seq });
  const inc = {
    schema: 'holdup.incident/1',
    id: sha(v.hash + '|' + (d ? d.hash : '')).slice(0, 16),
    generated_at: generatedAt,
    generated_on: 'user request',
    outcome: plan.outcome, // cancelled | expired | signed | not_sent | pending
    door,
    asked: door === 'rpc'
      ? { what: 'signed transaction sent for broadcast', tx_hash: e.tx, from: e.from, to: e.to, chain_id: e.chainId, tx_type: e.tx_type ?? null }
      : { what: 'wallet request from a web page', site: e.origin, method: e.method, params_sha256: e.params_sha256 },
    verdict: { level: e.level, niveau: e.niveau ?? null, family: plan.family, family_label: plan.family_label, fiche: ficheInfo(e.fiche), rule_ids: e.codes || [], live_facts_complete: door === 'rpc' ? !!e.live : null },
    decoded: null, // filled by redecode() when the user supplies the original request
    response: { friction_wait_s: door === 'rpc' && typeof e.wait_s === 'number' ? e.wait_s : plan.wait_s, phrase_to_retype: plan.phrase, waited_ms: d && typeof d.entry.waited_ms === 'number' ? d.entry.waited_ms : null, next_steps: plan.next, tool: plan.tool, cannot_undo: plan.cannot_undo, caveat: plan.caveat },
    timeline,
    metrics: {
      time_to_detect_ms: latency,
      time_to_detect_note: latency !== null ? 'engine latency journalled with the verdict' : 'not journalled by this door',
      time_to_respond_ms: d ? ms(v.ts, d.ts) : null,
      time_to_respond_note: d ? 'verdict to final decision, mandatory wait included' : 'no decision in the journal',
    },
    evidence: {
      journal_records: [v, ...events, ...(d ? [d] : [])], // verbatim lines : anyone can recompute their sha256
      pairing,
      chain: { ok: chain.ok, records: chain.n, broken_at: chain.brokenAt, head: chain.head },
    },
    anchor: null, // filled by anchor_evidence.mjs
    proves: [
      "Cette installation de Hold up a enregistré, à l'heure indiquée par son horloge, une alerte de ce niveau pour cette demande, avec ces règles.",
      "La décision enregistrée (annuler, passer outre, expiration) et le temps écoulé entre l'alerte et la décision.",
      "Les lignes de journal citées sont intactes par rapport à la chaîne de hachage du fichier.",
    ],
    does_not_prove: [
      "Qui était devant l'écran.",
      "Qui est derrière le site ou l'adresse, ni son intention : une alerte n'est pas un jugement.",
      "Qu'aucune perte n'a eu lieu par un autre chemin.",
      "L'heure exacte : c'est celle de l'ordinateur. Sans ancrage, le détenteur du fichier peut réécrire tout le journal.",
    ],
  };
  if (!chain.ok) inc.does_not_prove.unshift(`La chaîne de hachage du journal est rompue à la ligne ${chain.brokenAt} : cette fiche n'a pas de valeur d'intégrité.`);
  return inc;
}

// Optional : decode the original request again with the product engine, after checking it IS the journalled one.
export async function redecode(inc, { request, raw } = {}) {
  let body;
  if (inc.door === 'extension') {
    if (!request || !Array.isArray(request.params)) throw new Error('extension door : pass the original request { method, params, origin, chainId, from }');
    if (sha(JSON.stringify(request.params)) !== inc.asked.params_sha256) throw new Error('these parameters are not the ones in the journal (sha256 differs)');
    body = { method: inc.asked.method, params: request.params, origin: inc.asked.site, chainId: request.chainId, from: request.from };
  } else {
    if (typeof raw !== 'string') throw new Error('RPC door : pass the signed transaction bytes (0x...)');
    const K = await import(pathToFileURL(join(BANC, 'engine', 'src', 'keccak.mjs')).href);
    if (K.toHex(K.keccakBytes(K.fromHex(raw))).toLowerCase() !== String(inc.asked.tx_hash).toLowerCase()) throw new Error('these bytes are not the transaction in the journal (hash differs)');
    body = { method: 'eth_sendRawTransaction', params: [raw], chainId: inc.asked.chain_id, from: inc.asked.from };
  }
  const S = await import(pathToFileURL(join(BANC, 'server', 'server.mjs')).href);
  const v = S.evaluate(body, { contacts: [], history: [], protected: [], knownSpenders: [] });
  inc.decoded = {
    note: "Décodé à nouveau à la demande, hors ligne, sans le carnet ni l'historique de la personne, avec le moteur dans son état actuel. Le niveau qui fait foi est celui du journal.",
    request_matches_journal: true,
    believes: v.texts ? v.texts.croit : null, really: v.texts ? v.texts.reel : null, danger: v.texts ? v.texts.danger : null,
    effects: v.effects || null,
    facts: (v.raisons || []).map((r) => ({ rule: r.code, severity: r.severity || null, detail: r.detail || r.does || null })),
    level_now: v.level, same_level_as_journal: v.level === inc.verdict.level,
  };
  return inc;
}

// ------------------------------------------------------------------ one-page HTML (R3-figma tokens : white wall, one red accent)
// Self-contained on purpose : no web font, no script, no network request when the recipient opens the file.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LEVEL_FR = { attention: 'Attention', unknown: 'Non vérifié', danger: 'Danger', manipulation: 'Manipulation' };
const OUTCOME_FR = { cancelled: 'Annulée par la personne. Rien n’est parti.', expired: 'Laissée sans réponse. Rien n’est parti.', signed: 'La personne a passé outre l’avertissement.', not_sent: 'Passage outre demandé, refusé par le réseau. Rien n’est parti.', pending: 'Aucune décision enregistrée.' };
const WHAT_FR = { request_received: 'Demande reçue', verdict: 'Alerte affichée', call_trusted_clicked: 'Bouton « appeler un proche » utilisé', decision: 'Décision' };
const dur = (n) => (n === null || n === undefined ? 'non mesuré' : n < 1000 ? `${Math.round(n * 100) / 100} ms` : `${Math.round(n / 100) / 10} s`);
const short = (h) => (h && h.length > 24 ? `${h.slice(0, 12)}…${h.slice(-8)}` : h || '');

export function renderHtml(inc) {
  const a = inc.asked, v = inc.verdict, m = inc.metrics;
  const rows = (pairs) => pairs.filter(([, val]) => val !== null && val !== undefined && val !== '').map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${val}</dd></div>`).join('');
  const mono = (s) => `<code>${esc(s)}</code>`;
  const asked = inc.door === 'rpc'
    ? rows([['Porte', 'RPC de garde (après signature, avant diffusion)'], ['Transaction', mono(a.tx_hash)], ['De', mono(a.from)], ['Vers', mono(a.to)], ['Réseau', esc(a.chain_id)]])
    : rows([['Porte', 'Extension de navigateur (avant signature)'], ['Site', mono(a.site)], ['Demande', mono(a.method)], ['Empreinte des paramètres', mono(a.params_sha256)]]);
  const would = inc.decoded
    ? rows([['La personne croit', esc(inc.decoded.believes)], ['En vrai', `<strong class="red">${esc(inc.decoded.really)}</strong>`], ['Faits utilisés', inc.decoded.facts.map((f) => `${mono(f.rule)} ${esc(f.detail || '')}`).join('<br>')]]) + `<p class="note">${esc(inc.decoded.note)}</p>`
    : rows([['Menace', `<strong class="red">${esc(v.fiche && v.fiche.threat ? v.fiche.threat : v.family_label)}</strong>`], ['Technique', esc(v.fiche && v.fiche.technique)]]) + '<p class="note">Le journal ne garde pas les paramètres de la demande : l’effet exact n’est pas reconstitué ici.</p>';
  const anchor = inc.anchor
    ? rows([['Réseau', esc(inc.anchor.chain_id) + (inc.anchor.local ? ' (chaîne locale de répétition)' : '')], ['Contrat', mono(inc.anchor.contract)], ['Transaction', mono(inc.anchor.tx_hash)], ['Racine', mono(inc.anchor.root)], ['Bloc', `${esc(inc.anchor.block_number)}, ${esc(inc.anchor.block_time_iso)}`]])
    : '<p class="note">Non ancrée. L’intégrité repose sur le seul fichier de journal.</p>';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fiche d'incident ${esc(inc.id)}</title>
<style>
:root{--bg:#fff;--ink:#000;--muted:#595959;--line:#e2e2e2;--red:#d92d20;--sans:"Hanken Grotesk",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Consolas,monospace}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:13px;line-height:1.4}
.page{max-width:794px;margin:0 auto;padding:40px 48px}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--ink);padding-bottom:12px}
h1{font-size:32px;font-weight:320;letter-spacing:-.02em;margin:0}
h1 b{font-weight:600;color:var(--red);text-decoration:underline;text-underline-offset:4px}
h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:20px 0 6px}
.id{font-family:var(--mono);font-size:11px;color:var(--muted);text-align:right}
.lead{font-size:18px;margin:14px 0 0}
dl{margin:0}dl>div{display:grid;grid-template-columns:170px 1fr;gap:12px;padding:4px 0;border-bottom:1px solid var(--line)}
dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}
code{font-family:var(--mono);font-size:11px}
.red{color:var(--red);font-weight:600;text-decoration:underline;text-underline-offset:3px}
.note{color:var(--muted);font-size:11px;margin:4px 0 0}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
ul{margin:0;padding-left:16px}li{margin:2px 0}
footer{margin-top:20px;border-top:1px solid var(--ink);padding-top:8px;color:var(--muted);font-size:11px}
@media print{.page{padding:0}@page{size:A4;margin:14mm}}
</style>
</head>
<body>
<div class="page">
<header>
  <h1>Fiche d'incident : <b>${esc(LEVEL_FR[v.level] || v.level)}</b></h1>
  <div class="id">${esc(inc.id)}<br>${esc(inc.generated_at)}</div>
</header>
<p class="lead">${esc(OUTCOME_FR[inc.outcome] || inc.outcome)}</p>
${inc.response.caveat ? `<p class="note">${esc(inc.response.caveat)}</p>` : ''}
<h2>Ce qui a été demandé</h2>
<dl>${asked}</dl>
<h2>Ce que la demande aurait fait</h2>
<dl>${would}</dl>
<dl>${rows([['Règles déclenchées', v.rule_ids.map(mono).join(' ')], ['Fiche', v.fiche ? esc(v.fiche.id) : null]])}</dl>
<h2>Chronologie</h2>
<dl>${inc.timeline.map((t) => `<div><dt>${mono(t.at)}</dt><dd>${esc(WHAT_FR[t.what] || t.what)}${t.decision ? ' : ' + esc(t.decision) : ''}${t.journal_seq ? ` <span class="note">ligne ${esc(t.journal_seq)}</span>` : ''}</dd></div>`).join('')}
${rows([['Temps de détection', `${esc(dur(m.time_to_detect_ms))} <span class="note">${m.time_to_detect_ms === null ? 'non journalisé par cette porte' : 'latence du moteur'}</span>`], ['Temps de réponse', `${esc(dur(m.time_to_respond_ms))} <span class="note">de l’alerte à la décision, attente imposée de ${esc(inc.response.friction_wait_s)} s comprise</span>`]])}</dl>
<h2>Preuves</h2>
<dl>${inc.evidence.journal_records.map((r) => `<div><dt>Ligne ${esc(r.seq)} (${esc(r.entry.type)})</dt><dd>${mono(r.hash)}</dd></div>`).join('')}
${rows([['Chaîne du journal', inc.evidence.chain.ok ? `intacte, ${esc(inc.evidence.chain.records)} lignes, tête ${mono(short(inc.evidence.chain.head))}` : `<strong class="red">rompue à la ligne ${esc(inc.evidence.chain.broken_at)}</strong>`], ['Appariement', inc.door === 'rpc' ? 'exact, par identifiant de retenue' : 'par site, méthode et ordre des lignes']])}</dl>
<h2>Ancrage</h2>
<dl>${anchor}</dl>
<div class="cols">
<div><h2>Ce que cette fiche établit</h2><ul>${inc.proves.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
<div><h2>Ce qu'elle n'établit pas</h2><ul>${inc.does_not_prove.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
</div>
${inc.response.next_steps.length ? `<h2>Suite</h2><ul>${inc.response.next_steps.map((p) => `<li>${esc(p)}</li>`).join('')}${inc.response.cannot_undo.map((p) => `<li>Ne peut pas être défait : ${esc(p)}</li>`).join('')}</ul>` : ''}
<footer>Produite par Hold up à la demande de la personne, à partir de son journal local. Aucun nom, aucun texte saisi, aucune clé. Fichier JSON joint : mêmes données, lignes de journal complètes.</footer>
</div>
</body>
</html>
`;
}

export function writeIncident(inc, outDir) {
  mkdirSync(outDir, { recursive: true });
  const base = join(outDir, `incident-${inc.id}`);
  writeFileSync(base + '.json', JSON.stringify(inc, null, 2) + '\n');
  writeFileSync(base + '.html', renderHtml(inc));
  return { json: base + '.json', html: base + '.html' };
}

// ------------------------------------------------------------------ CLI
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const jf = arg('journal');
  if (!jf) { console.error('usage: node incident.mjs --journal <file.jsonl> --list | --seq N --out <dir> [--request req.json | --raw 0x...]'); process.exit(2); }
  const journal = readJournal(jf);
  if (!journal.chain.ok) console.error(`WARNING : journal chain broken at line ${journal.chain.brokenAt}`);
  if (process.argv.includes('--list')) { console.log(JSON.stringify(listIncidents(journal.records, { all: process.argv.includes('--all') }), null, 2)); process.exit(0); }
  if (process.argv.includes('--stats')) { console.log(JSON.stringify(stats(journal.records), null, 2)); process.exit(0); }
  const inc = buildIncident(journal, Number(arg('seq')));
  if (arg('request')) await redecode(inc, { request: JSON.parse(readFileSync(arg('request'), 'utf8')) });
  else if (arg('raw')) await redecode(inc, { raw: arg('raw') });
  const out = writeIncident(inc, arg('out') || join(HERE, 'out'));
  console.log(`incident ${inc.id} (${inc.outcome})\n  ${out.json}\n  ${out.html}`);
}
