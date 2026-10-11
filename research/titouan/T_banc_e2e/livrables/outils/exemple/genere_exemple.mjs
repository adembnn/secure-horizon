// Génère exemple/journal_export.json avec le VRAI journal_chain.js (chainAppend + exportChain), puis la fiche d'exemple.
// Les entrées ressemblent à celles que gatekeeper.js écrit. Elles contiennent volontairement une phrase et une adresse :
// le journal ne les garde pas (contentOf), l'export n'en contient donc aucune.
// Usage : node livrables/outils/exemple/genere_exemple.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chainAppend, exportChain } from '../../../extension/journal_chain.js';
import { buildFiche } from '../fiche_tracabilite.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const mem = {}; const storage = { get: async (k) => ({ [k]: mem[k] }), set: async (o) => { Object.assign(mem, JSON.parse(JSON.stringify(o))); } };
const T0 = Date.UTC(2026, 9, 11, 9, 0, 0); const BOB = '0x' + 'b2'.repeat(20);
const lines = [
  { type: 'verdict', origin: 'https://shop.example', method: 'eth_sendTransaction', level: 'attention', codes: ['external_spender'], ts: T0 },
  { type: 'decision', stage: 'verdict', decision: 'confirm', by: 'human', origin: 'https://shop.example', method: 'eth_sendTransaction', level: 'attention', codes: ['geste'], ts: T0 + 9000 },
  { type: 'decision', stage: 'intent', decision: 'answer', intent: 'pay_someone', text: 'payer 20 USDC à ' + BOB, origin: 'https://app.uniswap.org.claim-rewards-airdrop-official-portal.evil.example/x?to=' + BOB, method: 'eth_signTypedData_v4', ts: T0 + 60000 },
  { type: 'verdict', origin: 'https://app.uniswap.org.claim-rewards-airdrop-official-portal.evil.example', method: 'eth_signTypedData_v4', level: 'danger', codes: ['unlimited_allowance', 'external_spender', 'no_expiry'], ts: T0 + 61000 },
  { type: 'decision', stage: 'verdict', decision: 'cancel', by: 'human', origin: 'https://app.uniswap.org.claim-rewards-airdrop-official-portal.evil.example', method: 'eth_signTypedData_v4', level: 'danger', ts: T0 + 75000 },
  { type: 'decision', stage: 'verdict', decision: 'confirm', by: 'auto', origin: 'https://dex.example', method: 'eth_sendTransaction', level: 'attention', codes: ['envoi_automatique', 'droit_limite'], ts: T0 + 120000 },
  { type: 'revocation', origin: 'https://dex.example', method: 'erc20_approve', decision: 'submitted', ts: T0 + 180000 }
];
for (const l of lines) await chainAppend(storage, l, '0.3.0');
const body = exportChain(mem.chain);
writeFileSync(join(here, 'journal_export.json'), body);
const f = await buildFiche(JSON.parse(body), { generatedAt: '2026-10-11T10:00:00.000Z' });
writeFileSync(join(here, '..', 'fiche_exemple.html'), f.html);
const f4 = await buildFiche(JSON.parse(body), { n: 4, generatedAt: '2026-10-11T10:00:00.000Z' });
writeFileSync(join(here, 'fiche_ligne4.html'), f4.html);
console.log('journal_export.json : ' + mem.chain.entries.length + ' lignes ; fiche_exemple.html (session) ; exemple/fiche_ligne4.html ; chaîne ' + f.record.chain.state);
