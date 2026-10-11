// Deploiement de EvidenceAnchor sur Fuji en JS PUR (voie A). ADEM le lance avec sa cle de test.
//   PowerShell :  $env:FUJI_PRIVATE_KEY="0x..." ; node deploy_anchor.mjs --bin build/EvidenceAnchor.bin
// Prerequis : le BYTECODE de creation (hex) dans un fichier --bin. Ce depot n'embarque pas de compilateur
// Solidity (aucun telechargement) : produire le .bin avec Remix (onglet Compile -> "Bytecode" -> copier "object"),
// ou `solc --bin contracts/EvidenceAnchor.sol`, ou voie B (Hardhat) : voir hardhat/ et ANCHOR_README.md.
// La cle est lue UNIQUEMENT dans l'environnement ; elle n'est jamais affichee ni ecrite.
//   --record <adresse> <txHash> : enregistre dans DEPLOYMENTS_ANCHOR.md un deploiement fait ailleurs (Remix/Hardhat).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rpc, sendAndWait, FUJI_RPC, FUJI_CHAIN_ID, addressOf, SNOWTRACE } from './eth.mjs';
import { recordLine } from './deployments.mjs';

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }

if (process.argv.includes('--record')) {
  const i = process.argv.indexOf('--record'); const [addr, tx] = process.argv.slice(i + 1);
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr || '') || !/^0x[0-9a-fA-F]{64}$/.test(tx || '')) { console.error('usage: --record <0xadresse> <0xtxhash>'); process.exit(2); }
  recordLine({ type: 'contrat', address: addr, txHash: tx }); console.log('enregistre dans DEPLOYMENTS_ANCHOR.md'); process.exit(0);
}

const key = process.env.FUJI_PRIVATE_KEY;
if (!key) { console.error('FUJI_PRIVATE_KEY absente de l\'environnement. Rien envoye.'); process.exit(2); }
const binPath = arg('bin', fileURLToPath(new URL('./build/EvidenceAnchor.bin', import.meta.url)));
if (!fs.existsSync(binPath)) { console.error(`Bytecode introuvable : ${binPath}\nVoir l'en-tete du script (Remix / solc / voie Hardhat).`); process.exit(2); }
const bin = fs.readFileSync(binPath, 'utf8').trim().replace(/^0x/, '');
if (!/^[0-9a-fA-F]+$/.test(bin) || bin.length < 100) { console.error('Bytecode invalide.'); process.exit(2); }
const url = arg('rpc', FUJI_RPC);

const cid = parseInt(await rpc(url, 'eth_chainId'), 16);
if (cid !== FUJI_CHAIN_ID) { console.error(`chainId ${cid} != ${FUJI_CHAIN_ID} : refus.`); process.exit(2); }
const from = addressOf(key);
const bal = BigInt(await rpc(url, 'eth_getBalance', [from, 'latest']));
console.log(`Deployeur ${from} | solde ${Number(bal) / 1e18} AVAX | chainId ${cid}`);
if (bal === 0n) { console.error('Solde nul : utiliser le faucet Fuji.'); process.exit(2); }

const { hash, receipt } = await sendAndWait(url, { to: null, data: '0x' + bin, value: 0 }, key);
const address = receipt.contractAddress;
console.log(`EvidenceAnchor deploye : ${address}\ntx ${hash}\n${SNOWTRACE}/address/${address}\nbloc de deploiement : ${parseInt(receipt.blockNumber, 16)} (a passer en --from-block a verify_anchor)\ngas utilise : ${parseInt(receipt.gasUsed, 16)}`);
recordLine({ type: 'contrat', address, txHash: hash, note: `(bloc ${parseInt(receipt.blockNumber, 16)})` });
console.log('Ligne ajoutee a DEPLOYMENTS_ANCHOR.md');
