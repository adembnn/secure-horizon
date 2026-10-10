# PROOF — flux WebSocket Fuji temps réel (attempt-1)

## Approche
`monitor.mjs` (Node + `ws`) ouvre un WebSocket, s'abonne via `eth_subscribe` à : `newHeads`, `logs` filtré sur l'adresse USDC de test de Fuji (0x5425890298aed601595a70ab815c96711a31bc65), `logs` filtré sur le topic ERC-20 `Transfer`, et `logs` sans filtre. Il mesure l'intervalle entre blocs (arrivée et timestamp d'en-tête) et la latence (heure de réception moins timestamp d'en-tête). Reconnexion : backoff exponentiel, réabonnement à l'ouverture, détection de trou de numéro de bloc et récupération des blocs manquants en HTTPS (`eth_getBlockByNumber`). Le test de reconnexion tue la socket de force (`ws.terminate()`) à t=25 s. Les deux fournisseurs tournent en parallèle sur les mêmes 60 s. `probe.mjs` vérifie par `eth_getCode`/`eth_call` (lecture seule HTTPS) que l'adresse est bien le contrat USDC de Fuji.
Aucune clé, aucun compte, aucune transaction sur Fuji. La partie "écriture" (transferts ERC-20) est faite sur un Hardhat local (chainId 43113).

## Versions
Node v25.6.0, npm 11.8.0, ws 8.18.3, hardhat 2.22.17, ethers 6.13.4, solc 0.8.24. Docker non utilisé.

## Rejouer
```
cd <dossier attempt-1>
./run-proof.sh                      # 60 s sur api.avax-test.network et publicnode, kill à 25 s
# preuve locale du filtre ERC-20 (hardhat node + transferts) :
cd local-erc20 && npm install && npx hardhat compile
(npx hardhat node --port 8545 &) ; sleep 8 ; node local-test.mjs
```

## Sortie réelle observée (run-output.txt, 10 oct. 2026)
Pré-contrôle : `{"chainId":43113,"codeBytes":1852,"symbol":"USDC"}`

### avax
```json
{
 "name": "avax-official",
 "url": "wss://api.avax-test.network/ext/bc/C/ws",
 "seconds": 60,
 "blocksReceivedLive": 23,
 "firstBlock": 59279924,
 "lastBlock": 59279946,
 "blocksMissingInRange": 0,
 "blocksRecoveredByHttpsBackfill": 0,
 "arrivalIntervalMs": {
  "n": 22,
  "min": 468,
  "avg": 2418,
  "p50": 1439,
  "max": 10204
 },
 "headerTsIntervalMs": {
  "n": 22,
  "min": 1000,
  "avg": 2455,
  "p50": 2000,
  "max": 10000
 },
 "latencyMs_rxMinusHeaderTs_1sResolution": {
  "n": 23,
  "min": 1269,
  "avg": 1808,
  "p50": 1762,
  "max": 2472
 },
 "logs": {
  "addrFilter": 0,
  "transferTopic": 0,
  "unfiltered": 41
 },
 "connects": 2,
 "disconnects": 1,
 "killedAtMs": 25056,
 "reconnects": [
  {
   "atMs": 27321,
   "downMs": 2265
  }
 ],
 "msKillToFirstNewHeadAfterReconnect": 7236,
 "gaps": [],
 "errors": []
}
```
### publicnode
```json
{
 "name": "publicnode",
 "url": "wss://avalanche-fuji-c-chain-rpc.publicnode.com",
 "seconds": 60,
 "blocksReceivedLive": 24,
 "firstBlock": 59279923,
 "lastBlock": 59279946,
 "blocksMissingInRange": 0,
 "blocksRecoveredByHttpsBackfill": 0,
 "arrivalIntervalMs": {
  "n": 23,
  "min": 163,
  "avg": 2391,
  "p50": 1431,
  "max": 10190
 },
 "headerTsIntervalMs": {
  "n": 23,
  "min": 1000,
  "avg": 2435,
  "p50": 2000,
  "max": 10000
 },
 "latencyMs_rxMinusHeaderTs_1sResolution": {
  "n": 24,
  "min": 1260,
  "avg": 1930,
  "p50": 1963,
  "max": 2489
 },
 "logs": {
  "addrFilter": 0,
  "transferTopic": 0,
  "unfiltered": 42
 },
 "connects": 2,
 "disconnects": 1,
 "killedAtMs": 25059,
 "reconnects": [
  {
   "atMs": 27049,
   "downMs": 1990
  }
 ],
 "msKillToFirstNewHeadAfterReconnect": 7075,
 "gaps": [],
 "errors": []
}
```
### Local Hardhat (logs filtrés ERC-20)
```json
{
 "name": "local-hardhat",
 "url": "ws://127.0.0.1:8545",
 "seconds": 8,
 "blocksReceivedLive": 2,
 "firstBlock": 2,
 "lastBlock": 3,
 "blocksMissingInRange": 0,
 "blocksRecoveredByHttpsBackfill": 0,
 "arrivalIntervalMs": {
  "n": 1,
  "min": 4638,
  "avg": 4638,
  "p50": 4638,
  "max": 4638
 },
 "headerTsIntervalMs": {
  "n": 1,
  "min": 5000,
  "avg": 5000,
  "p50": 5000,
  "max": 5000
 },
 "latencyMs_rxMinusHeaderTs_1sResolution": {
  "n": 2,
  "min": 115,
  "avg": 296,
  "p50": 477,
  "max": 477
 },
 "logs": {
  "addrFilter": 2,
  "transferTopic": 2,
  "unfiltered": 2
 },
 "connects": 1,
 "disconnects": 0,
 "killedAtMs": null,
 "reconnects": [],
 "msKillToFirstNewHeadAfterReconnect": null,
 "gaps": [],
 "errors": []
}
```

## Lecture
- Flux réel reçu 60 s des deux fournisseurs : 23 et 24 en-têtes live, aucun trou après reconnexion (blocksMissingInRange 0), 41/42 logs non filtrés reçus. Les deux fournisseurs sont quasi identiques (même dernier bloc 59279946).
- Intervalle entre blocs : médiane 2 s (timestamp d'en-tête), moyenne ~2,4 s, max 10 s. Fuji n'est pas à cadence fixe : peu de blocs quand il n'y a pas de transactions.
- Latence réception moins timestamp : médiane ~1,8-2,0 s, mais mesure biaisée (timestamp à la seconde entière, horloge locale non synchronisée). C'est une borne haute, pas une latence réseau pure.
- Reconnexion testée sur les deux : socket coupée à 25 s, reconnectée en ~2 s (backoff 500 ms + handshake), premier nouvel en-tête 7,1 à 7,2 s après la coupure (inclut l'attente du prochain bloc).
- Filtre sur logs ERC-20 : sur Fuji, 0 événement USDC et 0 Transfer en 60 s (testnet peu actif). Ce chemin n'est donc PAS prouvé sur Fuji. Prouvé seulement en local : 2 Transfer émis pendant la fenêtre, reçus par le filtre adresse (2), le filtre topic (2) et le filtre vide (2).

## Limites
- Un seul run de 60 s par fournisseur (deux runs ont été faits, le premier avec une version du script sans backfill fonctionnel ni abonnement "tous logs" ; il avait détecté un trou d'un bloc à la reconnexion, d'où la correction). Pas de statistique sur plusieurs heures.
- Le second run n'a eu aucun trou ; le backfill HTTPS est donc codé mais non exercé en conditions réelles.
- Dans le test local, un 3e transfert est parti après la fin du moniteur (ethers attend 4 s par reçu) ; il n'est pas compté.
- Les endpoints publics sont sans SLA ni clé : limites de débit possibles, non mesurées.
