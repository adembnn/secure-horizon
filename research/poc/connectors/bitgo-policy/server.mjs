// Sentinelle - BitGo "webhook policy rule" endpoint (local).
// Contract (developers.bitgo.com/docs/policies-webhook): POST JSON; HTTP 200 = continue, non-200 = rule action (deny/getApproval).
// Signed mode (docs/policies-webhook-signing-keys): incoming JWT verified, response = signed JWT {evaluationId,statusCode}.
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const CONFIG = {
  allowlist: new Set((process.env.ALLOWLIST || '2MzVfLyXXXjLBQdA6D8gY6DM9hR1XdJkZjR').split(',')),
  maxSpend: BigInt(process.env.MAX_SPEND || '1000000'), // base units per tx
};
const seen = new Map(); // idempotency cache (BitGo may retry)

export function evaluate(p) {
  const reasons = [];
  if (p.type !== 'webhook') reasons.push('bad_type');
  let spend;
  try { spend = BigInt(p.spendAmount); } catch { reasons.push('bad_spendAmount'); }
  if (spend !== undefined && spend > CONFIG.maxSpend) reasons.push(`over_cap:${spend}>${CONFIG.maxSpend}`);
  if (!Array.isArray(p.outputs) || !p.outputs.length) reasons.push('no_outputs');
  else for (const o of p.outputs) {
    const internal = o.wallet && o.wallet === p.walletId; // change returning to same wallet
    if (!internal && !CONFIG.allowlist.has(o.address)) reasons.push(`dest_not_allowlisted:${o.address}`);
  }
  return { approve: reasons.length === 0, reasons };
}

const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64u = (s) => Buffer.from(s, 'base64url');
export function signJwt(claims, privateKey, kid, alg) {
  const h = b64u(JSON.stringify({ alg, kid, typ: 'JWT' }));
  const c = b64u(JSON.stringify(claims));
  const data = Buffer.from(`${h}.${c}`);
  const sig = alg === 'EdDSA' ? crypto.sign(null, data, privateKey)
    : crypto.sign('sha256', data, { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${h}.${c}.${b64u(sig)}`;
}
export function verifyJwt(token, jwks, trustedIss) {
  const [h, c, s] = String(token).split('.');
  if (!s) throw new Error('malformed');
  const header = JSON.parse(unb64u(h)); const claims = JSON.parse(unb64u(c));
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown_kid');
  if (jwk.alg !== header.alg) throw new Error('alg_mismatch');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const data = Buffer.from(`${h}.${c}`);
  const ok = header.alg === 'EdDSA' ? crypto.verify(null, data, key, unb64u(s))
    : header.alg === 'ES256' ? crypto.verify('sha256', data, { key, dsaEncoding: 'ieee-p1363' }, unb64u(s)) : false;
  if (!ok) throw new Error('bad_signature');
  if (trustedIss && !trustedIss.includes(claims.iss)) throw new Error('untrusted_iss');
  return claims;
}

export function makeServer({ signed = null } = {}) {
  return http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      const send = (code, text, type = 'application/json') => { res.writeHead(code, { 'content-type': type }); res.end(text); };
      try {
        if (req.method !== 'POST') return send(405, '{"error":"POST only"}');
        if (signed) {
          const token = (req.headers.authorization || '').replace(/^Bearer /, '') || body.trim();
          const claims = verifyJwt(token, signed.bitgoJwks, signed.trustedIss);
          if (!claims.evaluationId) throw new Error('no_evaluationId');
          if (seen.has(claims.evaluationId)) return send(200, seen.get(claims.evaluationId), 'application/jwt');
          const v = evaluate(claims);
          console.log(JSON.stringify({ mode: 'signed', evaluationId: claims.evaluationId, ...v }));
          const out = signJwt({ evaluationId: claims.evaluationId, statusCode: v.approve ? 200 : 403, iat: Math.floor(Date.now() / 1000) }, signed.myKey, signed.myKid, 'EdDSA');
          seen.set(claims.evaluationId, out);
          return send(200, out, 'application/jwt');
        }
        const p = JSON.parse(body);
        const v = evaluate(p);
        console.log(JSON.stringify({ mode: 'plain', walletId: p.walletId, ...v }));
        return v.approve ? send(200, '{"approved":true}') : send(403, JSON.stringify({ approved: false, reasons: v.reasons }));
      } catch (e) {
        console.log(JSON.stringify({ error: e.message }));
        return send(e instanceof SyntaxError ? 400 : 401, JSON.stringify({ error: e.message })); // fail closed
      }
    });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 8787);
  makeServer().listen(port, '127.0.0.1', () => console.log(`bitgo-policy webhook (plain) on :${port}`));
}
