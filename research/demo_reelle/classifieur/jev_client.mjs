// Client for Jev (TypeSafe System One) : state + typed questions -> typed answers with probabilities.
// Contract read on 2026-10-11 from https://docs.typesafe.ai/api.md :
//   POST https://api.typesafe.ai/v1/systemone      Authorization: Bearer {key}      Content-Type: application/json
//   body  { state: string | object | array, model: "jev-latest", questions: { <id>: { type: "noul" | "choice" | "score", instructions, criteria? } } }
//         choice : criteria = map option -> description (required, 255 options max) ; noul : criteria optional ({ true, false })
//   reply { model, answers: { <id>: { type, noul } | { type, choice, probabilities, confidence } | { type, score, ... } }, usage: { input_tokens, output_tokens } }
//   errors : 401 (key), 422 (validation, the body names the field), 429 / 529 (retry later)
// Same shape as detectors_adem/clef_client.mjs on purpose : the relay treats both the same way.
// Secret : JEV_API_KEY is read from the environment only. It is never logged, never echoed in an error.

export const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
export const jevConfig = (env = process.env) => ({ key: env.JEV_API_KEY || '', model: (env.HOLDUP_JEV_MODEL || 'jev-latest').trim() || 'jev-latest' });
export const jevAvailable = (env = process.env) => Boolean(jevConfig(env).key);

// -> { ok: true, answers, usage, ms, model } | { ok: false, error, status?, ms }   (never throws, never prints the key)
export async function askJev({ state, questions }, { timeoutMs = 4000, env = process.env, fetchImpl = fetch } = {}) {
  const cfg = jevConfig(env);
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  if (!cfg.key) return { ok: false, error: 'JEV_API_KEY absent', ms: 0 };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(JEV_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ state, model: cfg.model, questions }),
      signal: ctl.signal,
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}`, ms: ms() };
    if (!data || typeof data.answers !== 'object' || !data.answers) return { ok: false, error: 'réponse sans champ answers', ms: ms() };
    return { ok: true, answers: data.answers, usage: data.usage || null, model: data.model || cfg.model, ms: ms() };
  } catch (e) {
    return { ok: false, error: e && e.name === 'AbortError' ? `délai dépassé (${timeoutMs} ms)` : 'réseau', ms: ms() };
  } finally { clearTimeout(timer); }
}
