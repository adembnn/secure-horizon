// Hold up - classifier relay. Keeps the Clef / Jev keys OUT of the browser : the extension sends the sentence the person
// wrote to this loopback service, which asks the model and answers with a kind and three yes/no facts.
//
//   node --env-file=.env research/demo_reelle/classifieur/relay.mjs          (from the repo root ; listens on 127.0.0.1:8789)
//
//   POST /classify   { "text": "payer 20 USDC à Paul" }
//     -> { source: "clef" | "jev" | "keywords", model: boolean, kind, confidence, facts: { asked, receive, grant }, ms, why? }
//   GET  /health     -> { ok: true, provider: "clef" | "jev" | "keywords" }
//
// Providers : Clef on Cloudflare Workers AI (CF_ACCOUNT_ID + CF_API_TOKEN, contract in detectors_adem/clef_client.mjs) or
// Jev on TypeSafe (JEV_API_KEY, contract in jev_client.mjs). HOLDUP_INTENT_PROVIDER = clef | jev | keywords forces one ;
// by default Clef when its two variables are set, else Jev, else the keyword parser.
// With no key, on timeout (BUDGET_MS) or on any error the answer comes from the keyword parser and says so (model: false, why).
//
// What this service refuses : anything that is not loopback, a Host header other than 127.0.0.1:8789 / localhost:8789
// (DNS rebinding), a web page as caller (Origin http/https), a body above MAX_BODY, more than RATE_PER_MIN calls a minute.
// What it never does : read a file, log a key, log the text, place the text inside the instructions (it is a field of `state`).
// The answer is only a classification : the extension applies the threshold and the strict-only rule (extension/intent_text.js).
// NIST CSF 2.0 DE.AE-02, PR.DS-02 ; OWASP ASI01 (prompt injection through the written text) ; MITRE ATLAS AML.T0051.
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { buildQuestions, cleanText, keywordClassify, rawFromAnswers } from '../../titouan/T_banc_e2e/extension/intent_text.js';
import { askClef, clefAvailable } from '../../titouan/T_banc_e2e/detectors_adem/clef_client.mjs';
import { askJev, jevAvailable } from './jev_client.mjs';

export const PORT = 8789;
export const HOST = '127.0.0.1';
export const BUDGET_MS = 1500;
export const MAX_BODY = 4096;
export const RATE_PER_MIN = 120;
const HOSTS = new Set([HOST + ':' + PORT, 'localhost:' + PORT]);
const EXT_ORIGIN = /^chrome-extension:\/\/[a-p]{32}$/;

export function providerOf(env = process.env) {
  const want = String(env.HOLDUP_INTENT_PROVIDER || '').trim().toLowerCase();
  if (want === 'keywords') return 'keywords';
  if (want === 'clef') return clefAvailable(env) ? 'clef' : 'keywords';
  if (want === 'jev') return jevAvailable(env) ? 'jev' : 'keywords';
  return clefAvailable(env) ? 'clef' : jevAvailable(env) ? 'jev' : 'keywords';
}

// The classification itself. Never throws. `fetchImpl` and `env` are injected by the tests.
export async function classify(text, { env = process.env, fetchImpl = fetch, budgetMs = BUDGET_MS } = {}) {
  const t0 = performance.now();
  const done = (raw, why) => Object.assign(raw, why ? { why } : {}, { ms: Math.round(performance.now() - t0) });
  const clean = cleanText(text);
  const provider = providerOf(env);
  if (!clean) return done(await keywordClassify(''), 'empty');
  if (provider === 'keywords') return done(await keywordClassify(clean), 'no-key');
  const req = buildQuestions(clean);
  let r;
  try { r = provider === 'clef' ? await askClef(req, { timeoutMs: budgetMs, env, fetchImpl }) : await askJev(req, { timeoutMs: budgetMs, env, fetchImpl }); }
  catch { r = { ok: false, error: 'exception' }; }
  if (!r || !r.ok) return done(await keywordClassify(clean), /délai/.test(String(r && r.error)) ? 'timeout' : 'error');
  const raw = rawFromAnswers(r.answers, provider);
  // an answer without a usable kind is not a classification : the keyword parser answers instead, and says so
  if (typeof raw.kind !== 'string' || raw.confidence == null) return done(await keywordClassify(clean), 'error');
  return done(raw);
}

// Who may call : a local process (no Origin) or a browser extension. A web page always sends its http(s) Origin on a JSON POST.
export function allowed(req, env = process.env) {
  const ip = req.socket && req.socket.remoteAddress;
  if (!(ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1')) return 'not-loopback';
  if (!HOSTS.has(String(req.headers.host || '').toLowerCase())) return 'bad-host';
  const origin = req.headers.origin;
  if (origin !== undefined) {
    const pinned = String(env.HOLDUP_EXTENSION_ID || '').trim();
    if (!EXT_ORIGIN.test(origin) || (pinned && origin !== 'chrome-extension://' + pinned)) return 'bad-origin';
  }
  return null;
}

export function createRelay({ env = process.env, fetchImpl = fetch, log = () => {} } = {}) {
  const hits = [];
  const send = (res, status, body) => { const s = JSON.stringify(body); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(s), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(s); };
  return http.createServer((req, res) => {
    const no = allowed(req, env);
    if (no) { req.resume(); return send(res, 403, { error: no }); }
    const path = String(req.url || '').split('?')[0];
    if (req.method === 'GET' && path === '/health') return send(res, 200, { ok: true, provider: providerOf(env) });
    if (path !== '/classify') { req.resume(); return send(res, 404, { error: 'not-found' }); }
    if (req.method !== 'POST') { req.resume(); return send(res, 405, { error: 'method' }); }
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) { req.resume(); return send(res, 415, { error: 'content-type' }); }
    const now = Date.now();
    while (hits.length && now - hits[0] > 60000) hits.shift();
    if (hits.length >= RATE_PER_MIN) { req.resume(); return send(res, 429, { error: 'rate' }); }
    hits.push(now);
    const chunks = []; let size = 0, tooBig = false;
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { tooBig = true; chunks.length = 0; } else if (!tooBig) chunks.push(c); });
    req.on('error', () => {});
    req.on('end', async () => {
      if (tooBig) return send(res, 413, { error: 'too-large' });
      let body = null;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* handled below */ }
      if (!body || typeof body !== 'object' || typeof body.text !== 'string') return send(res, 400, { error: 'body' });
      const out = await classify(body.text, { env, fetchImpl });
      log(`classify source=${out.source} kind=${out.kind} ms=${out.ms}${out.why ? ' why=' + out.why : ''}`); // never the text, never a key
      send(res, 200, out);
    });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createRelay({ log: (line) => console.log(new Date().toISOString() + ' ' + line) });
  server.on('error', (e) => { console.error('relais : ' + (e && e.code === 'EADDRINUSE' ? `le port ${PORT} est déjà pris` : String(e && e.message))); process.exit(1); });
  server.listen(PORT, HOST, () => {
    const p = providerOf();
    console.log(`Relais de classification Hold up sur http://${HOST}:${PORT} (fournisseur : ${p === 'keywords' ? 'mots-clés, aucune clé configurée' : p}, budget ${BUDGET_MS} ms)`);
  });
}
