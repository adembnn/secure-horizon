import fs from 'node:fs';
import crypto from 'node:crypto';
import { makeServer, signJwt, verifyJwt } from './server.mjs';

let fails = 0;
const check = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!cond) fails++; };
const listen = (s) => new Promise((r) => s.listen(0, '127.0.0.1', () => r(s.address().port)));
const fx = (f) => fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');

console.log('== A. plain mode (doc payload, HTTP 200 / non-200)');
const s1 = makeServer(); const p1 = await listen(s1);
for (const [f, want] of [['approve.json', 200], ['deny-unknown-dest.json', 403], ['deny-over-cap.json', 403]]) {
  const r = await fetch(`http://127.0.0.1:${p1}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: fx(f) });
  check(`${f} -> HTTP ${want}`, r.status === want, `got ${r.status} ${await r.text()}`);
}
const r0 = await fetch(`http://127.0.0.1:${p1}/`, { method: 'POST', body: '{not json' });
check('malformed body -> non-200 (fail closed)', r0.status !== 200, `got ${r0.status}`);
s1.close();

console.log('== B. signed mode (JWT in, signed JWT {evaluationId,statusCode} out) with local stand-in keys');
const bitgo = crypto.generateKeyPairSync('ed25519'); const mine = crypto.generateKeyPairSync('ed25519');
const jwk = (k, kid) => ({ keys: [{ ...k.publicKey.export({ format: 'jwk' }), use: 'sig', kid, alg: 'EdDSA' }] });
const bitgoJwks = jwk(bitgo, 'bitgo-key-v1'); const myJwks = jwk(mine, 'customer-test-key');
const trustedIss = ['https://app.bitgo.com', 'https://app.bitgo-test.com'];
const s2 = makeServer({ signed: { bitgoJwks, trustedIss, myKey: mine.privateKey, myKid: 'customer-test-key' } });
const p2 = await listen(s2);
const mk = (f, evaluationId, { iss = 'https://app.bitgo-test.com', key = bitgo.privateKey } = {}) =>
  signJwt({ ...JSON.parse(fx(f)), evaluationId, iss, iat: Math.floor(Date.now() / 1000) }, key, 'bitgo-key-v1', 'EdDSA');
const rt = async (tok) => { const r = await fetch(`http://127.0.0.1:${p2}/`, { method: 'POST', headers: { 'content-type': 'application/jwt' }, body: tok }); return { status: r.status, text: await r.text() }; };
const decide = async (tok, id) => {
  const o = await rt(tok); if (o.status !== 200) return { http: o.status };
  const c = verifyJwt(o.text, myJwks, null); return { http: 200, evaluationIdEchoed: c.evaluationId === id, statusCode: c.statusCode };
};
let d = await decide(mk('approve.json', 'eval-1'), 'eval-1');
check('signed approve payload -> statusCode 200, evaluationId echoed', d.statusCode === 200 && d.evaluationIdEchoed, JSON.stringify(d));
d = await decide(mk('deny-unknown-dest.json', 'eval-2'), 'eval-2');
check('signed drain payload -> statusCode 403, evaluationId echoed', d.statusCode === 403 && d.evaluationIdEchoed, JSON.stringify(d));
d = await decide(mk('approve.json', 'eval-3', { key: mine.privateKey }), 'eval-3');
check('JWT signed with wrong key -> rejected (non-200 HTTP)', d.http === 401, JSON.stringify(d));
d = await decide(mk('approve.json', 'eval-4', { iss: 'https://evil.example' }), 'eval-4');
check('untrusted iss -> rejected', d.http === 401, JSON.stringify(d));
const a1 = await rt(mk('approve.json', 'eval-5')); const a2 = await rt(mk('approve.json', 'eval-5'));
check('retry with same evaluationId is idempotent', a1.text === a2.text);
s2.close();

console.log('== C. live public BitGo JWKS (read-only GET) parses with our code path');
try {
  const j = await (await fetch('https://app.bitgo.com/.well-known/jwks.json')).json();
  const k = crypto.createPublicKey({ key: j.keys[0], format: 'jwk' });
  check('BitGo prod JWKS key importable', k.asymmetricKeyType === 'ec', `kid=${j.keys[0].kid} alg=${j.keys[0].alg}`);
  const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const ejwks = { keys: [{ ...ec.publicKey.export({ format: 'jwk' }), kid: 'ec1', alg: 'ES256' }] };
  const t = signJwt({ iss: 'x' }, ec.privateKey, 'ec1', 'ES256');
  check('ES256 sign/verify roundtrip (BitGo prod key type)', verifyJwt(t, ejwks, null).iss === 'x');
} catch (e) { console.log('SKIP  (network)', e.message); }

console.log(fails ? `RESULT: ${fails} FAILED` : 'RESULT: ALL PASSED');
process.exit(fails ? 1 : 0);
