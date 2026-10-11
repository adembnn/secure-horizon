// Faux Clef pour l'essai : répond d'après quelques mots de la phrase. MOCK_QUOTA_APRES=N : renvoie 429 à partir du N+1e appel.
let n = 0;
export default async function mock(req) {
  n++;
  const lim = Number(process.env.MOCK_QUOTA_APRES || 0);
  if (lim && n > lim) return { ok: false, status: 429, error: 'quota' };
  const t = String(req.state.user_intent_text || '').toLowerCase();
  const kind = /envoie|send/.test(t) ? 'pay_someone' : /connect/.test(t) ? 'connect_or_accept_offer' : 'buy_or_swap';
  const probs = { pay_someone: 0.05, send_to_my_account: 0.02, buy_or_swap: 0.05, connect_or_accept_offer: 0.05, asked_by_someone: 0.01, none: 0.02 };
  probs[kind] = 0.85;
  return { ok: true, answers: { kind: { choice: kind, probabilities: probs }, gives_amount: { noul: /\d/.test(t) ? 0.95 : 0.05 }, expects_no_spend: { noul: kind === 'connect_or_accept_offer' ? 0.9 : 0.05 }, asked_by_someone: { noul: 0.02 }, too_vague: { noul: 0.03 } }, usage: null, model: 'mock' };
}
