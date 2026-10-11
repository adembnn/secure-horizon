// Hold up - RPC guard : presenter script, no wallet needed. LOCAL CHAIN ONLY.
// Signs with the Hardhat PUBLIC test account that is the demo "victim" and sends through the proxy, exactly as a wallet would :
//   (a) a DemoUSDC transfer to the real contact            -> relayed, mined
//   (b) the same transfer to a lookalike of that contact   -> held, the wallet gets an error with the decision link
// Usage : node demo_send.mjs                 (a then b)
//         node demo_send.mjs contact | sosie | approve     (one step ; approve = unlimited approval to an unknown address)
// Env   : HOLDUP_RPC_URL (http://127.0.0.1:8555), HOLDUP_ADDRESSES (../chain/addresses.local.json), HOLDUP_CONTEXT, HOLDUP_DEMO_AMOUNT (25)
// Refuses to run when the node behind the proxy is not a loopback Hardhat node.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers, testWallet, lookalike, rpc, signTx, balanceOf, assertLocalNode, ERC20 } from './demo_lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROXY = process.env.HOLDUP_RPC_URL || 'http://127.0.0.1:8555';
const ADDR_FILE = process.env.HOLDUP_ADDRESSES || join(HERE, '..', 'chain', 'addresses.local.json');
const CTX_FILE = process.env.HOLDUP_CONTEXT || [join(HERE, 'context.local.json'), join(HERE, 'context.demo.json')].find(existsSync);
const AMOUNT = BigInt(Math.round(Number(process.env.HOLDUP_DEMO_AMOUNT || 25) * 1e6));
const fmt = (v) => (Number(v) / 1e6).toLocaleString('fr-FR') + ' DemoUSDC';
const say = (s = '') => console.log(s);

async function main() {
  const steps = process.argv.slice(2).length ? process.argv.slice(2) : ['contact', 'sosie'];
  if (!steps.every((s) => ['contact', 'sosie', 'approve'].includes(s))) throw new Error('étapes possibles : contact, sosie, approve');
  let chainId;
  try { chainId = await assertLocalNode(PROXY); } catch (e) {
    throw new Error(e.cause || /fetch failed/.test(e.message) ? `le proxy ne répond pas sur ${PROXY}. Lance d'abord : node research/demo_reelle/rpc_garde/proxy.mjs` : e.message);
  }
  const A = JSON.parse(readFileSync(ADDR_FILE, 'utf8'));
  const contact = JSON.parse(readFileSync(CTX_FILE, 'utf8')).contacts[0];
  const victim = Array.from({ length: 20 }, (_, i) => testWallet(i)).find((w) => w.address.toLowerCase() === String(A.victim).toLowerCase());
  if (!victim) throw new Error(`la victime du fichier d'adresses (${A.victim}) n'est pas un compte de test Hardhat : ce script ne peut pas signer pour elle. Envoie depuis ton portefeuille.`);
  const fake = lookalike(contact.address);
  say(`Proxy ${PROXY}, chaîne locale ${chainId}. Compte de test ${victim.address} (clé publique Hardhat, aucune valeur réelle).`);
  say(`Contact « ${contact.label} » : ${contact.address.toLowerCase()}`);
  say(`Sosie               : ${fake}  (mêmes 4 premiers et 4 derniers caractères)`);

  const TX = {
    contact: [`(a) Envoi de ${fmt(AMOUNT)} à ${contact.label}, le vrai contact`, { to: A.usdc, data: ERC20.encodeFunctionData('transfer', [contact.address, AMOUNT]) }, contact.address],
    sosie: [`(b) Le même envoi de ${fmt(AMOUNT)}, vers l'adresse sosie`, { to: A.usdc, data: ERC20.encodeFunctionData('transfer', [fake, AMOUNT]) }, fake],
    approve: ['(c) Droit de dépense sans limite donné à une adresse inconnue', { to: A.usdc, data: ERC20.encodeFunctionData('approve', [testWallet(19).address, ethers.MaxUint256]) }, null],
  };
  for (const step of steps) {
    const [title, tx, dest] = TX[step];
    say(); say(title);
    const before = dest ? await balanceOf(PROXY, A.usdc, dest) : null;
    const raw = await signTx(PROXY, victim, tx, chainId);
    const answer = await rpc(PROXY, 'eth_sendRawTransaction', [raw]);
    say('Ce que le portefeuille reçoit :');
    say(JSON.stringify(answer, null, 2).split('\n').map((l) => '  ' + l).join('\n'));
    if (answer.result) {
      say(`=> Transmise sans attente. Hash ${answer.result}`);
      if (dest) say(`   Solde du destinataire : ${fmt(before)} -> ${fmt(await balanceOf(PROXY, A.usdc, dest))}`);
    } else if (answer.error && answer.error.data && answer.error.data.holdup && answer.error.data.holdup.url) {
      say(`=> Retenue par Hold up (niveau ${answer.error.data.holdup.level}). Rien n'est parti.`);
      if (dest) say(`   Solde du destinataire : ${fmt(before)} -> ${fmt(await balanceOf(PROXY, A.usdc, dest))}`);
      say(`   Page de décision : ${answer.error.data.holdup.url}`);
      say(`   Liste des demandes retenues : ${new URL('/', PROXY).href}`);
    } else say('=> Refusée, sans demande retenue.');
  }
}
main().catch((e) => { console.error('demo_send : ' + e.message); process.exit(1); });
