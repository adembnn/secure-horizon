// Client for Cloudflare Workers AI decision models Clef / Clef-flash (state + typed questions -> probabilities).
// Contract read on 2026-10-11 from developers.cloudflare.com/workers-ai/models/clef and /clef-flash :
//   POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/cloudflare/{clef|clef-flash}
//   Authorization: Bearer {token}
//   body  { model: "clef" | "clef-flash", state: string | object | array, questions: { <id>: { type: "noul" | "choice" | "score", instructions, criteria? } } }
//         1 to 64 questions ; ids made of letters, digits, _ . - ; context 65 536 tokens (clef) / 24 576 (clef-flash)
//   reply { model, answers: { <id>: ... }, usage }  (the Workers AI envelope { result, success, errors } is not documented
//         on those pages : both shapes are accepted here)
// Secrets : CF_ACCOUNT_ID and CF_API_TOKEN are read from the environment only (.env is gitignored). They are never logged.
// Run with `node --env-file=.env ...` from the repo root, or export the two variables in the shell.

const MODELS = new Set(['clef', 'clef-flash']);
// public list prices per million input tokens (output tokens are not billed), same pages, same date
export const USD_PER_M_INPUT = { 'clef': 0.24, 'clef-flash': 0.038 };

export function clefConfig(env = process.env) {
  const model = (env.HOLDUP_CLEF_MODEL || 'clef-flash').trim();
  return {
    accountId: env.CF_ACCOUNT_ID || '',
    token: env.CF_API_TOKEN || '',
    model: MODELS.has(model) ? model : 'clef-flash',
  };
}
export const clefAvailable = (env = process.env) => { const c = clefConfig(env); return Boolean(c.accountId && c.token); };

// probability of "yes" for a noul answer, whatever the exact field name
export function noulOf(answer) {
  if (typeof answer === 'number') return answer;
  if (!answer || typeof answer !== 'object') return null;
  for (const k of ['noul', 'probability', 'value']) if (typeof answer[k] === 'number') return answer[k];
  return null;
}

// -> { ok: true, answers, usage, ms, model } | { ok: false, error, status?, ms }   (never throws, never prints the token)
export async function askClef({ state, questions }, { model, timeoutMs = 4000, env = process.env, fetchImpl = fetch } = {}) {
  const cfg = clefConfig(env);
  const m = MODELS.has(model) ? model : cfg.model;
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  if (!cfg.accountId || !cfg.token) return { ok: false, error: 'CF_ACCOUNT_ID / CF_API_TOKEN absents', ms: 0 };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfg.accountId)}/ai/run/@cf/cloudflare/${m}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${cfg.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: m, state, questions }),
      signal: ctl.signal,
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}${data && data.errors && data.errors[0] ? ' : ' + String(data.errors[0].message).slice(0, 200) : ''}`, ms: ms() };
    const body = data && data.result && data.result.answers ? data.result : data;
    if (!body || typeof body.answers !== 'object' || !body.answers) return { ok: false, error: 'réponse sans champ answers', ms: ms() };
    return { ok: true, answers: body.answers, usage: body.usage || null, model: body.model || m, ms: ms() };
  } catch (e) {
    return { ok: false, error: e && e.name === 'AbortError' ? `délai dépassé (${timeoutMs} ms)` : `réseau : ${String(e && e.message).slice(0, 120)}`, ms: ms() };
  } finally { clearTimeout(timer); }
}
