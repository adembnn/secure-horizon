// T02 - Passe-droit "approvedInflight" : une fois une demande approuvee et transmise au portefeuille (popup du portefeuille encore ouverte),
// la page peut renvoyer la MEME demande N fois ; gate() (inject.js:113-116) consomme le compteur et laisse passer sans nouvelle decision.
import { makeWindow, TX } from './harness_inject.mjs';
const w = await makeWindow();
let calls = 0;
w.sandbox.__wallet = { request(a) { if (a.method === 'eth_chainId') return Promise.resolve('0x1'); calls++; return new Promise(() => {}); } };   // popup du portefeuille jamais fermee : la promesse reste en attente
w.run('globalThis.ethereum = globalThis.__wallet;'); w.sandbox.__tx = TX;
const send = () => w.run('globalThis.ethereum.request({method:"eth_sendTransaction", params:[globalThis.__tx]})');
send();                                   // 1re demande : approuvee par la personne
await new Promise((r) => setTimeout(r, 150));
send();                                   // la page renvoie la meme demande pendant que la 1re est en cours
await new Promise((r) => setTimeout(r, 300));
console.log('decisions demandees a la personne :', w.gates.length, '| demandes recues par le portefeuille :', calls);
const bad = w.gates.length === 1 && calls === 2;   // 1 approbation -> 2 demandes au portefeuille (chaque approbation offre UN passe-droit tant que la 1re est en attente)
console.log(bad ? 'PROBLEME : une demande identique passe sans nouvelle decision tant que la premiere est en cours (1 passe-droit par approbation).' : 'OK');
w.close(); process.exit(bad ? 0 : 1);
