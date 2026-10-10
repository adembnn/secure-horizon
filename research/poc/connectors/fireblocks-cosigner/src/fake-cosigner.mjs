// Fake API Co-Signer: sends signed approval requests, verifies the signed responses. Synthetic data.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { signJwt, verifyJwt } from './jwt.mjs';

const URL_ = process.env.CALLBACK_URL || 'http://127.0.0.1:8000/v2/tx_sign_request';
const COSIGNER_PRIV = readFileSync('keys/cosigner_private.pem', 'utf8');
const CALLBACK_PUB = readFileSync('keys/callback_public.pem', 'utf8');
const ROGUE_PRIV = readFileSync('keys/rogue_private.pem', 'utf8');

const base = (over) => ({
  txId: randomUUID(), requestId: randomUUID(), operation: 'TRANSFER', asset: 'USDC_AVAX_FUJI',
  sourceType: 'VAULT', sourceId: '0', sourceName: 'Synthetic treasury vault',
  destType: 'ONE_TIME_ADDRESS', destAddressType: 'ONE_TIME', signerId: 'synthetic-api-user-1',
  fee: '0.0001', ...over,
});
const claims = () => { const n = Math.floor(Date.now() / 1000); return { iat: n, exp: n + 55, nonce: randomUUID() }; };

async function send(token) {
  const r = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: token });
  return { status: r.status, text: await r.text() };
}
let failures = 0;
const check = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!cond) failures++; };

async function scenario(name, req, expected) {
  const token = signJwt({ ...req, ...claims() }, COSIGNER_PRIV);
  console.log(`\n== ${name}\n   request payload: ${JSON.stringify(req)}`);
  const { status, text } = await send(token);
  check('HTTP 200', status === 200, `(got ${status})`);
  const resp = verifyJwt(text, CALLBACK_PUB); // throws if signature is wrong
  console.log(`   response JWT header + payload: ${text.split('.').slice(0, 2).map((s) => Buffer.from(s, 'base64url').toString()).join('  ')}`);
  if (expected === 'APPROVE') { // keep a real response for the independent openssl check
    const [h, p, s] = text.split('.');
    writeFileSync('keys/_msg', `${h}.${p}`); writeFileSync('keys/_sig', Buffer.from(s, 'base64url'));
  }
  check('response signature verified with callback public key', true);
  check('requestId echoed', resp.requestId === req.requestId);
  check(`action === ${expected}`, resp.action === expected, `(got ${resp.action}; reason: ${resp.rejectionReason})`);
}

await scenario('1. Under cap, known address -> APPROVE',
  base({ amount: '2500', amountStr: '2500', amountUSD: 2500, destAddress: '0x1111111111111111111111111111111111111111' }), 'APPROVE');
await scenario('2. Unknown address, above cap -> REJECT',
  base({ amount: '250000', amountStr: '250000', amountUSD: 250000, destAddress: '0x9999999999999999999999999999999999999999' }), 'REJECT');

console.log('\n== 3. Negative: authentication of the request');
const good = base({ amount: '1', amountUSD: 1, destAddress: '0x1111111111111111111111111111111111111111' });
let r = await send(signJwt({ ...good, ...claims() }, ROGUE_PRIV));
check('JWT signed by a rogue key is refused (403)', r.status === 403, `(got ${r.status}: ${r.text})`);
const t = signJwt({ ...good, ...claims() }, COSIGNER_PRIV).split('.');
const tampered = [t[0], Buffer.from(JSON.stringify({ ...good, destAddress: '0x9999999999999999999999999999999999999999', ...claims() })).toString('base64url'), t[2]].join('.');
r = await send(tampered);
check('tampered payload (swapped destination) is refused (403)', r.status === 403, `(got ${r.status}: ${r.text})`);
const n = Math.floor(Date.now() / 1000);
r = await send(signJwt({ ...good, iat: n - 200, exp: n - 100 }, COSIGNER_PRIV));
check('expired JWT is refused (401)', r.status === 401, `(got ${r.status}: ${r.text})`);

console.log('\n== 4. Negative: a response forged by a rogue key must not verify on the co-signer side');
let rejected = false;
try { verifyJwt(signJwt({ action: 'APPROVE', requestId: 'x' }, ROGUE_PRIV), CALLBACK_PUB); } catch { rejected = true; }
check('forged APPROVE response rejected by co-signer verification', rejected);

console.log(failures ? `\nRESULT: ${failures} FAILURE(S)` : '\nRESULT: ALL CHECKS PASSED');
process.exitCode = failures ? 1 : 0;
