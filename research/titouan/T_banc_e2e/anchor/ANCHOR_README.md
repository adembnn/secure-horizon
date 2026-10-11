# Journal de verdicts ancre sur Avalanche Fuji (produit : Hold up)

Valeur reelle de la blockchain ici : une victime, un assureur ou la police peut prouver **qu'une alerte a ete montree, quand, avec quelles versions de regles/modele, et ce que la personne a choisi**, sans que personne (y compris nous) puisse reecrire l'historique apres coup.

## Architecture

1. `journal.mjs` : journal JSONL local, une entree par verdict, chainee par hash (keccak256). Champs : `index, ts, rulesVersion, modelVersion, level, reasons[] (codes), effectHash, decision, prevHash, hash`.
2. `merkle.mjs` : racine de Merkle (keccak256, prefixes de domaine feuille/noeud) d'un intervalle d'entrees, preuve d'inclusion et verificateur autonome.
3. `contracts/EvidenceAnchor.sol` : `anchor(bytes32 root, uint64 fromIndex, uint64 toIndex, uint32 ruleVersion)` emet `Anchored(sender, root, fromIndex, toIndex, ruleVersion, seq, blockTime)` et stocke l'ordre. Lectures `count()` et `get(seq)`. Pas de proprietaire, pas d'admin, pas de mise a jour.
4. `anchor_now.mjs` (ancre les nouvelles entrees), `deploy_anchor.mjs` (deploie), `verify_anchor.mjs` (rejeu, lecture seule), `eth.mjs` (secp256k1/EIP-155/JSON-RPC en JS pur, reutilise `engine/src/keccak.mjs` et `rlp.mjs` sans les modifier).

## Ce que ca prouve

- La racine R existait **au plus tard** au bloc N, donc a la date de ce bloc, publiee par l'adresse `sender`.
- Si le journal presente aujourd'hui recalcule exactement R pour l'intervalle [a..b], alors **aucune entree de cet intervalle n'a ete modifiee, deplacee, inseree ni supprimee depuis l'ancrage**.
- Une preuve d'inclusion (log2 n hash, 10 pour 1 000 entrees) montre qu'une entree donnee faisait partie de cet intervalle, sans reveler les autres.
- Confidentialite : **seule une racine de 32 octets** est publiee. Le journal ne contient ni texte libre ni adresse en clair (l'effet decode est reduit a un hash sale avec un sel local ; sans le sel, pas de dictionnaire inverse). Pour prouver un cas, la personne montre l'entree, l'effet decode et le sel : n'importe qui peut recalculer `effectHash`.

## Ce que ca ne prouve PAS

- **La veracite de l'alerte** : l'horodatage prouve l'existence d'une racine a une date, pas que le verdict etait juste, ni que l'utilisateur a vraiment vu l'ecran.
- **L'authenticite d'une entree avant l'ancrage** : une entree fabriquee avant le prochain ancrage serait ancree comme les autres. Entre deux ancrages, la fenetre est de confiance locale (intervalle de lot = fenetre d'exposition).
- **L'identite de la victime** : `sender` est l'adresse du compte d'ancrage (celui du produit ou de l'utilisateur), pas une identite civile.
- **L'exhaustivite** : une entree jamais ecrite n'est pas detectable. La troncature de **queue** du journal n'est pas vue par la seule chaine (testee : la derniere ligne supprimee passe `verify()` seul) ; elle l'est par `expectedCount` ou, mieux, par `verify_anchor.mjs`, tant que l'entree supprimee est deja ancree. Les entrees posterieures au dernier ancrage ne sont pas protegees.
- Quelqu'un qui controle la machine **avant** l'ancrage peut tout reecrire cohéremment. Ancrer souvent reduit la fenetre.
- Un attaquant qui modifie une ligne et recalcule son hash est vu par la chaine (ligne suivante) sauf pour la derniere ligne ; dans ce cas seule la racine ancree le revele (teste : 37/37 via le rejeu).

## Utilisation

Journal (interface pour l'extension) :
```js
const j = new Journal({ path, salt });            // salt = secret local, genere une fois (newSalt())
j.append({ rulesVersion, modelVersion, level, reasons: ['PERMIT_SIG'], effect: decodedEffect, decision: 'cancelled' });
j.verify();                                       // { ok, count, head, errors[] }
j.proofOf(index, from, to);                       // preuve d'inclusion
```
`level` : info|low|medium|high|critical. `decision` : shown|proceeded|cancelled|waited|dismissed|none. `reasons` : codes `[A-Za-z0-9_.-]{1,48}`, tout texte libre est refuse. Dans l'extension (MV3), l'ecriture se fait dans le service worker apres chaque verdict ; l'ancrage periodique est un processus cote serveur/outil (la cle ne doit jamais etre dans l'extension). Le fichier JSONL peut etre remplace par `chrome.storage` en gardant les memes entrees.

Deploiement et ancrage (Adem, cle de test, jamais commitee), PowerShell :
```
$env:FUJI_PRIVATE_KEY="0x..."          # seule source de la cle ; jamais affichee ni ecrite
node deploy_anchor.mjs --bin build\EvidenceAnchor.bin     # voie A (JS pur) : exige le bytecode
node anchor_now.mjs --journal journal.jsonl --rule-version 3
node verify_anchor.mjs --contract 0x... --journal journal.jsonl --from-block <bloc de deploiement>
```
- **Voie A (JS pur)** : aucune librairie, mais le depot n'a pas de compilateur Solidity. Le bytecode (`.bin`) doit venir de Remix (copier `object` de l'onglet Compile) ou de `solc --bin`. `anchor_now.mjs` n'a, lui, besoin d'aucun bytecode.
- **Voie B (Hardhat)** : copier `EvidenceAnchor.sol` dans `blockchain\contracts\anchor\` et `hardhat\deploy_anchor.js` dans `blockchain\scripts\anchor\`, puis `npx hardhat run scripts/anchor/deploy_anchor.js --network fuji` (cle via l'env, comme `hardhat.config.js`). Enregistrer ensuite : `node deploy_anchor.mjs --record <adresse> <txHash>`.
- Les deux scripts ajoutent une ligne a `DEPLOYMENTS_ANCHOR.md` (reseau, adresse, hash de transaction, lien testnet.snowtrace.io). Penser a reporter l'adresse dans `blockchain\DEPLOYMENTS.md`. Ils refusent tout chainId different de 43113.
- `anchor_now.mjs --dry-run` calcule la racine et le calldata sans cle ni envoi.

## Cout en gas (HYPOTHESE, non mesuree)

Ordre de grandeur, a mesurer au premier ancrage : transaction de base 21 000 gaz + calldata ~ 1 700 + ecriture d'un Record (3 slots : root, from/to/ruleVersion/timestamp, sender, soit 3 x 22 100) + evenement ~ 3 000 + tableau (longueur 5 000) = environ 100 000 gaz par ancrage. Un ancrage toutes les heures ~ 2,4 M gaz/jour. Sur Fuji l'AVAX n'a aucune valeur. Sur mainnet, ordre de grandeur de quelques centimes par ancrage a 25 nAVAX : a verifier. Si le cout compte, supprimer le stockage et ne garder que l'evenement (~ 30 000 gaz de moins).

## Tests (node test_anchor.mjs, resultats dans test_results.json)

Executes pour de vrai : 42 verifications OK, 0 echec. Integrite (journal de 60 entrees) : 180/180 modifications detectees, 59/60 suppressions par la chaine seule (la derniere par compteur/ancrage), 59/59 reordonnancements, 12/12 insertions. Merkle : 1 000/1 000 preuves valides sur 1 000 entrees, 1 000/1 000 alterations et fausses racines rejetees. Reproductibilite : journaux identiques a l'octet pour une meme graine. Rejeu contre un faux RPC HTTP local (300 entrees, 3 ancrages) : 37/37 modifications, 37/37 modifications avec hash recalcule, 8/8 suppressions/troncatures, reordonnancement detecte. Signature : transaction EIP-155 identique au vecteur de la specification. RPC Fuji reel : `eth_blockNumber` et `eth_chainId` (43113) lus.

## Limites honnetes

- Aucun contrat n'est encore deploye ; aucune transaction reelle n'a ete envoyee. Le code d'envoi (signature, nonce, estimation de gaz, recu) est valide par le vecteur de signature EIP-155 mais **pas par un envoi reel**. Le contrat n'a pas ete compile ici (pas de solc) : son code est a compiler et a tester avant usage (voie B, ou chaine locale de `blockchain\` si `npm install` y est fait ; `node_modules` y est absent aujourd'hui, donc non teste sur la chaine locale).
- `eth_getLogs` sur Fuji de la tres vieille epoque peut etre limite par le RPC public : passer `--from-block` (bloc de deploiement) et `--chunk`.
- keccak en BigInt pur JS : ~1 ms par hash, suffisant pour des milliers d'entrees, lent pour des millions.
- Le sel local doit etre conserve : perdu, on ne peut plus prouver le contenu d'un `effectHash`.
