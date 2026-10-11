// Builds a small REAL journal with the product's own server (server/server.mjs, in-process, 127.0.0.1, no network out).
// All data is synthetic (fake site names, test addresses). Writes to ./sample/ : journal.jsonl, context.json, requests/NN-*.json.
// The requests are archived next to the journal on purpose: the journal itself keeps only a hash of the params (see EXPLICABILITE.md).
// Usage: node make_sample_journal.mjs
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANC = resolve(HERE, '..', '..', 'titouan', 'T_banc_e2e');
const { createHoldUpServer, loadLocalContext } = await import(pathToFileURL(join(BANC, 'server', 'server.mjs')).href);

const OUT = join(HERE, 'sample');
mkdirSync(join(OUT, 'requests'), { recursive: true });
const jf = join(OUT, 'journal.jsonl');
if (existsSync(jf)) rmSync(jf);

const word = (h) => h.replace(/^0x/, '').padStart(64, '0');
const ME = '0x8bcea1b8558ac307b50ad720045c35783c9efb6c';           // synthetic victim
const PAUL = '0x1234567890abcdef1234567890abcdef12345678';         // synthetic contact
const SOSIE = '0x1234' + '9'.repeat(32) + '5678';                  // same first 6 and last 4 hex chars as Paul
const TOKEN = '0x5425890298aed601595a70ab815c96711a31bc65';        // public Fuji test-USDC address (no value)
const DRAINER = '0x7777777777777777777777777777777777777777';     // synthetic attacker spender
const MAXU = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const context = { contacts: [{ label: 'Paul', address: PAUL }], history: [{ address: PAUL, direction: 'sortie', amount: '0.1', minutes_ago: 5000 }] };
writeFileSync(join(OUT, 'context.json'), JSON.stringify(context, null, 2) + '\n');

const base = { origin: 'https://remboursement-avax-support.example', chainId: '0xa869', from: ME };
const permit = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
    Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 43113, verifyingContract: TOKEN },
  message: { owner: ME, spender: DRAINER, value: MAXU, nonce: '0', deadline: '4102444800' } };

const requests = [
  ['01-permit-fake-reward', { ...base, method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(permit)],
    pageText: 'Reclamez votre remboursement. Contactez le support, action urgente, ne le dites a personne.' }],
  ['02-permit-no-pressure-text', { ...base, method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(permit)] }],
  ['03-send-to-real-contact', { ...base, origin: 'https://wallet-demo.example', method: 'eth_sendTransaction', params: [{ from: ME, to: PAUL, value: '0x16345785d8a0000', data: '0x' }] }],
  ['04-send-to-lookalike-address', { ...base, origin: 'https://wallet-demo.example', method: 'eth_sendTransaction', params: [{ from: ME, to: SOSIE, value: '0x16345785d8a0000', data: '0x' }] }],
  ['05-unlimited-approve', { ...base, method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, value: '0x0', data: '0x095ea7b3' + word(DRAINER) + 'f'.repeat(64) }] }],
  ['06-unknown-method', { ...base, method: 'wallet_foo', params: [] }],
];

const s = await createHoldUpServer({ port: 0, journalFile: jf, journalEnabled: true, local: loadLocalContext(join(OUT, 'context.json')) });
for (const [name, body] of requests) {
  writeFileSync(join(OUT, 'requests', name + '.json'), JSON.stringify(body, null, 2) + '\n');
  const r = await fetch(`http://127.0.0.1:${s.port}/check`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const v = await r.json();
  console.log(name.padEnd(30), 'level=' + v.level, 'niveau=' + v.niveau, 'fiche=' + v.fiche, 'codes=' + (v.codes || []).join(','));
}
await s.close();
console.log('journal:', jf);
