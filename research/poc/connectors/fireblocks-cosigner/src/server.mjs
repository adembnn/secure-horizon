// Fireblocks API Co-Signer callback handler (Node reimplementation of fireblocks/plugin-based-callback-handler).
// POST /v2/tx_sign_request : body = raw JWT (RS256, signed by co-signer); reply = raw JWT {action, requestId, rejectionReason} signed by us.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { signJwt, verifyJwt, JwtError } from './jwt.mjs';
import { decide } from './policy.mjs';

const COSIGNER_PUB = readFileSync(process.env.COSIGNER_PUBLIC_KEY_PATH || 'keys/cosigner_public.pem', 'utf8');
const CALLBACK_PRIV = readFileSync(process.env.CALLBACK_PRIVATE_KEY_PATH || 'keys/callback_private.pem', 'utf8');
const PORT = Number(process.env.APP_LISTENING_PORT || 8000);
const log = (o) => console.log('[handler]', JSON.stringify(o));

http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/v2/tx_sign_request') { res.writeHead(404).end('not found'); return; }
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 64e3) req.destroy(); });
  req.on('end', () => {
    let payload;
    try { payload = verifyJwt(body, COSIGNER_PUB); }
    catch (e) {
      const code = e instanceof JwtError ? e.code : 403;
      log({ event: 'auth_failed', status: code, detail: e.message });
      res.writeHead(code, { 'content-type': 'application/json' }).end(JSON.stringify({ detail: e.message }));
      return;
    }
    if (!payload.requestId) { res.writeHead(400).end(JSON.stringify({ detail: 'requestId missing' })); return; }
    const d = decide(payload);
    log({ event: 'decision', txId: payload.txId, requestId: payload.requestId, dest: payload.destAddress, amountUSD: payload.amountUSD, action: d.action, reason: d.reason });
    const out = signJwt({ action: d.action, requestId: payload.requestId, rejectionReason: d.reason }, CALLBACK_PRIV);
    res.writeHead(200, { 'content-type': 'text/plain' }).end(out);
  });
}).listen(PORT, '127.0.0.1', () => log({ event: 'listening', port: PORT }));
