// Minimal RS256 JWT (RFC 7519/7515) on node:crypto, no dependency.
import { createSign, createVerify } from 'node:crypto';
const b64u = (b) => Buffer.from(b).toString('base64url');
export function signJwt(payload, privateKeyPem) {
  const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify(payload));
  const s = createSign('RSA-SHA256').update(`${h}.${p}`).sign(privateKeyPem).toString('base64url');
  return `${h}.${p}.${s}`;
}
export class JwtError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
export function verifyJwt(token, publicKeyPem, now = Math.floor(Date.now() / 1000)) {
  const parts = String(token).trim().split('.');
  if (parts.length !== 3) throw new JwtError(403, 'Token could not be decoded.');
  let header, payload;
  try { header = JSON.parse(Buffer.from(parts[0], 'base64url')); payload = JSON.parse(Buffer.from(parts[1], 'base64url')); }
  catch { throw new JwtError(403, 'Token could not be decoded.'); }
  if (header.alg !== 'RS256') throw new JwtError(403, 'Invalid token (alg must be RS256).');
  const ok = createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(publicKeyPem, Buffer.from(parts[2], 'base64url'));
  if (!ok) throw new JwtError(403, 'Token signature is invalid.');
  if (typeof payload.exp === 'number' && payload.exp < now) throw new JwtError(401, 'Token has expired.');
  return payload;
}
