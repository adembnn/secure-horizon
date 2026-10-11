# Correctifs à appliquer dans des fichiers que `pipeline/` ne possède pas

Date : 11 octobre 2026. Rien de ce qui suit n'a été appliqué par l'agent d'intégration. Chiffres : `pipeline/RESULTATS_INTEGRATION.md`.

## 1. `server/server.mjs` (propriétaire : Titouan) : fait

`pipeline/server_integration.diff` a été appliqué par son propriétaire (commit 5c1df06). `POST /check` passe par `evaluatePlus`, retombe sur `evaluate` en cas d'erreur, et journalise la voie. Rien à faire. Deux constantes restent dupliquées dans `pipeline/evaluate_plus.mjs` faute d'export : `CANONICAL` et `TOKENS`. Les exporter depuis `server.mjs` supprimerait le risque de dérive (aujourd'hui mesurée à 0 cas sur 9 908).

## 2. `engine/vendor/compare.ts` et `run/policy.mjs` : aucun correctif nécessaire pour l'anomalie

L'anomalie « donner le type d'intention fait rater plus d'arnaques » ne vient ni du comparateur ni de la politique. Elle venait d'une seule règle de `detectors_adem/intent_guard.mjs`, corrigée (0 cas restant sur 9 908). À ajouter côté propriétaire, comme garde-fou : un test qui rejoue chaque cas avec et sans type d'intention nu et exige que le niveau ne baisse pas (modèle : `pipeline/test/evaluate_plus.test.mjs`, test « invariant »).

## 3. Extension : le choix d'intention ne sait pas dire « j'échange »

`toIntent()` (serveur et extension) ne connaît que payer / recevoir / se connecter / on me l'a demandé. Un échange tombe dans « autre », donc sans intention. Or 180 cas passent de rouge à orange, à raison, dès que l'intention « échange » est connue (grosse part du solde vers un routeur, signature de droit pour le routeur). Ajouter un choix « j'échange ou j'achète » → `{ kind: 'buy_or_swap' }`.

## 4. `research/demo_reelle/lab/server/product.mjs` et `rpc_garde/proxy.mjs`

- La seconde colonne du lab recopie la chaîne du banc. La remplacer par `evaluatePlus` (import dans `RESULTATS_INTEGRATION.md`) donne la même chose que le serveur livré, avec les textes « Tu crois / En vrai ».
- Donner le solde (ou laisser `live: true` le lire) : sans lui, « tout le solde vers une adresse neuve » ne peut pas être distingué d'un petit paiement.
- Ne pas charger `chain/addresses.local.json` en bloc comme « protocoles connus » : le fichier contient aussi les contrats de l'attaquant.

## 5. `engine/src` : valeur native qui transite par un relais

`analyzeTransaction` attribue la sortie d'AVAX au contrat appelé (Multicall3) et range le vrai destinataire dans `eff.nested`. Les règles de destinataire (sosie, poussière, premier paiement) ne le voient donc pas. `detectors_adem/forwarded_value.mjs` couvre le cas en attendant ; la correction propre est d'ajouter dans `eff.outgoing` une entrée par feuille du lot qui reçoit de la valeur sans données d'appel.

## 6. `redteam/check_product.mjs`

Ses options `--live-like` et `--with-detectors` appliquent `context_live/server_integration.diff` à une copie du serveur ; ce diff ne s'applique plus depuis que le serveur a changé. Le plus simple : importer `runCase` de `pipeline/measure.mjs` (mêmes conventions d'entrée, mêmes chiffres pour le produit seul).

## 7. `pipeline/known_protocols.json` : adresses à ajouter après vérification

Routeurs LFJ / Trader Joe (V1, LB 2.1, LB 2.2), Pangolin, marchés Benqi, pont Avalanche, Stargate, GMX. Chaque entrée doit citer la page officielle où l'adresse a été lue. Ne rien recopier depuis les jeux de mesure.

## 8. Extension autonome

`detectors_adem/pasted_message.mjs` (`node:path`, `node:url`), `fork_sim.mjs` et `sig_rights.mjs` (`Buffer`) et `token_guard.mjs` (`process.env`) ne tournent pas dans un service worker. Soit les exclure de la liste passée à `makeEvaluatePlus`, soit remplacer `Buffer` par `Uint8Array` et lire la configuration ailleurs que dans `process.env`.
