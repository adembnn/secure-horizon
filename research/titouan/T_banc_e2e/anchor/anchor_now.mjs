// Ancre maintenant les entrees NON ENCORE ancrees du journal (voie A, JS pur, aucun bytecode requis).
//   PowerShell :  $env:FUJI_PRIVATE_KEY="0x..." ; node anchor_now.mjs --journal journal.jsonl [--contract 0x...] [--rule-version 3]
//   --dry-run : calcule racine et calldata, N'ENVOIE RIEN (ne demande pas de cle).
// Le point de reprise (dernier index ancre) est dans <journal>.anchor_state.json (local, non secret).
// Avant d'ancrer, l'integrite du journal est verifiee : on n'ancre jamais une chaine cassee.
import fs from 'node:fs';
import { Journal } from './journal.mjs';
import { rpc, sendAndWait, encodeAnchorCall, FUJI_RPC, FUJI_CHAIN_ID, SNOWTRACE } from './eth.mjs';
import { recordLine, lastContract } from './deployments.mjs';

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }
const jp = arg('journal');
if (!jp) { console.error('usage: node anchor_now.mjs --journal journal.jsonl [--contract 0x...] [--rule-version N] [--dry-run]'); process.exit(2); }
const j = new Journal({ path: jp });
const v = j.verify();
if (!v.ok) { console.error('Journal corrompu, ancrage refuse :', JSON.stringify(v.errors[0])); process.exit(1); }

const stPath = jp + '.anchor_state.json';
const st = fs.existsSync(stPath) ? JSON.parse(fs.readFileSync(stPath, 'utf8')) : { nextIndex: 0 };
const from = st.nextIndex, to = v.count - 1;
if (to < from) { console.log('Rien de nouveau a ancrer.'); process.exit(0); }
const root = j.rootOf(from, to);
const ruleVersion = Number(arg('rule-version', 1));
const data = encodeAnchorCall(root, from, to, ruleVersion);
console.log(`Intervalle [${from}..${to}] (${to - from + 1} entrees) | racine ${root} | ruleVersion ${ruleVersion}`);
if (process.argv.includes('--dry-run')) { console.log('calldata', data, '\n(dry-run : rien envoye)'); process.exit(0); }

const contract = arg('contract') || lastContract();
if (!contract) { console.error('Adresse du contrat inconnue (--contract ou DEPLOYMENTS_ANCHOR.md).'); process.exit(2); }
const key = process.env.FUJI_PRIVATE_KEY;
if (!key) { console.error('FUJI_PRIVATE_KEY absente de l\'environnement. Rien envoye.'); process.exit(2); }
const url = arg('rpc', FUJI_RPC);
const cid = parseInt(await rpc(url, 'eth_chainId'), 16);
if (cid !== FUJI_CHAIN_ID) { console.error(`chainId ${cid} != ${FUJI_CHAIN_ID} : refus.`); process.exit(2); }

const { hash, receipt } = await sendAndWait(url, { to: contract, data, value: 0 }, key);
console.log(`Ancre : tx ${hash}\n${SNOWTRACE}/tx/${hash}\ngas utilise : ${parseInt(receipt.gasUsed, 16)}`);
fs.writeFileSync(stPath, JSON.stringify({ nextIndex: to + 1, lastRoot: root, lastTx: hash }, null, 2));
recordLine({ type: `ancrage [${from}..${to}]`, address: root, txHash: hash });
console.log('Ligne ajoutee a DEPLOYMENTS_ANCHOR.md');
