# Que voit l'utilisateur MetaMask quand le RPC répond une erreur à eth_sendRawTransaction

Date : 2026-10-11. Branche lue : `main` des dépôts publics (état au moment de la lecture, pas une version publiée précise).
Légende : [V] lu dans le source / la doc à l'URL indiquée ; [NV] non vérifié (déduction ou non lu). Les numéros de ligne n'étaient pas disponibles (l'outil de lecture renvoie des extraits) : les repères sont des noms de fonctions et des citations courtes.

## TL;DR
1. Réponse directe : PARTIELLEMENT. Le texte de notre `message` arrive bien jusqu'à `txMeta.error` (préfixé par un contexte), mais l'écran principal d'activité de la branche `main` ne l'affiche probablement pas ; l'endroit où il est le plus susceptible d'apparaître est une notification navigateur « Transaction N failed! <message> » et une infobulle sur le statut « Failed » (composants plus anciens). [V pour le stockage, NV pour l'affichage réel]
2. Le statut devient `failed`. Aucune réémission : la logique de resoumission a été retirée de `PendingTransactionTracker` (core 67.0.0). Le nonce n'est pas consommé, le prochain envoi le réutilise (déduction).
3. Pas de contournement par failover : le failover du NetworkController ne s'applique qu'aux endpoints Infura ; un endpoint custom n'a pas de failover. Smart Transactions : Avalanche absente de la liste de `main`.
4. Mobile, Core wallet, ajout d'un RPC http loopback : NON ÉTABLI (non lus).
5. Reco proxy : erreur JSON-RPC, code -32000, message court (< 120 caractères), sans URL cliquable comptée comme acquise, plus un lien repris hors wallet (page /hold ouverte par la sentinelle).

## 1. Chemin de code après « Confirmer » (envoi simple)
- Interface : `ui/pages/confirmations/components/confirm/footer/footer.tsx`. `onSubmit` appelle `onTransactionConfirm()` ; il n'y a pas de bloc `catch`, seulement `finally { resetTransactionState(); }` ; le composant n'affiche aucun message d'erreur. [V]
- `ui/pages/confirmations/hooks/transactions/useTransactionConfirm.ts` : `await dispatch(updateAndApproveTx(...))`. Les erreurs non liées au matériel (hardware wallet) sont relancées (`rethrown`), pas affichées ; `showErrorModal` ne sert qu'aux wallets matériels. [V]
- `ui/store/actions.ts`, `approveTransaction` : dans le `catch`, restauration des params, `goHome()`, `hideLoadingIndication()`, `logErrorWithMessage(err)`, puis relance. Donc l'utilisateur est renvoyé à l'accueil, sans bannière d'erreur dans ce chemin. [V]
- Contrôleur : `MetaMask/core` `packages/transaction-controller/src/TransactionController.ts`. `#approveTransaction` libère le verrou de nonce avant publication (`clearNonceLock?.();` puis `log('Publishing transaction', ...)`). `#publishTransaction` appelle `rpcRequest({ messenger, networkClientId, method: 'eth_sendRawTransaction', ...})`. Dans `#processApproval`, le `catch` appelle `this.#failTransaction(meta, error, actionId)` ; `#failTransaction` fait `draftTransactionMeta.status = TransactionStatus.failed`, stocke `error = normalizeTxError(error)`, publie `transactionFailed` (payload `error: error.message`). [V]
- `packages/transaction-controller/src/utils/utils.ts`, `normalizeTxError` : conserve `name`, `message`, `stack`, `code`, et `rpc: isJsonCompatible(error.value) ? error.value : undefined`. [V]
- Transformation de notre erreur, en deux étapes :
  1. `packages/eth-json-rpc-middleware/src/fetch.ts` : si la réponse contient `error`, le middleware lève `rpcErrors.internal({ data: jsonRpcResponse.error })`. Notre `{code,message}` est donc dans `data`, et le `message` de l'erreur levée devient le texte générique « Internal JSON-RPC error. ». [V]
  2. `packages/transaction-controller/src/utils/provider.ts`, `throwWithRpcContext` : `const message = errorObject.data?.message ?? errorObject.message;` puis `prefix = \`RPC ${chainId} ${getEndpointLabel(...)}...\`` et `errorObject.message = \`${prefix}: ${message}\``. Notre texte est donc repris mot pour mot mais précédé d'un préfixe du type « RPC 43114 Custom eth_sendRawTransaction: » (forme exacte du préfixe : [NV], le CHANGELOG 65.1.0 parle de « RPC submit: », 68.1.0 de « RPC method, chain ID, endpoint type »). [V pour le mécanisme]
  3. Le `error.value` (champ `rpc`) n'est renseigné que si la couche fournisseur le pose ; je n'ai pas lu qui le pose. `rpc.message` est donc probablement vide ; `error.message` (avec préfixe) est utilisé. [NV]
- Affichage (anciens composants) : `ui/components/app/transaction-status-label/transaction-status-label.js` : `const tooltipText = tooltip || error?.rpc?.message || error?.message;` donc infobulle au survol du libellé « Failed ». `ui/components/app/transaction/transaction-status.tsx` : si statut failed et erreur locale, bouton + popover `transaction-status-error-tooltip` avec `localError?.rpc?.message` sinon `localError?.message`. [V]
- Mais `transaction-status.tsx` retrouve l'erreur par `useLocalTransactionMeta(hash)?.error` (clé : le hash, `ui/hooks/activity/useLocalTransactionMeta.ts`). Une transaction dont la publication a échoué n'a pas de hash. [V pour la recherche par hash ; la conclusion « pas d'erreur affichée » est une déduction NV]
- Nouvelle page d'activité de `main` : `ui/pages/activity/rows/useActivityRowContent.tsx` : l'échec se traduit par un titre en rouge (`text-error-default`), aucun message d'erreur ni infobulle. `ui/pages/activity/activity-list.tsx` : le clic ouvre `TransactionDetails` seulement si `getActivityItemIdentifier(item)` existe ; cet identifiant est le hash (`ui/pages/activity/helpers.ts`) : sans hash, le clic ne fait rien. `ui/pages/details/components/sections.tsx` passe `status` et `hash` seulement à `TransactionStatus`. [V]
- Notification : la clé de traduction `notificationTransactionFailedMessage` = « Transaction $1 failed! $2 » et `notificationTransactionFailedTitle` = « Failed transaction » existent dans `app/_locales/en/messages.json`. [V pour l'existence] Qui les déclenche, et si `$2` est le message d'erreur brut ou tronqué : [NV] (j'ai seulement trouvé `app/scripts/platforms/extension.ts` et `app/scripts/lib/notification-manager.ts`, non lus).
- Cliquable ? Aucun composant lu ne transforme le texte en lien ; une notification système ou une infobulle affiche du texte brut. URL cliquable : [NV], probablement non.
- Troncature : non établie. [NV]

## 2. Réémission et nonce
- `PendingTransactionTracker.ts` ne suit que les transactions `submitted` non vérifiées (`tx.status === TransactionStatus.submitted && !tx.verifiedOnBlockchain`) ; la recherche de « resubmit/rebroadcast » n'y donne rien. CHANGELOG `packages/transaction-controller/CHANGELOG.md` : « 67.0.0 : Removed resubmit logic from PendingTransactionTracker ». Une transaction `failed` n'est donc jamais rediffusée. [V]
- Une transaction sans hash et bloquée est marquée en échec (`NoTxHashError`) plutôt que rediffusée. [V]
- Nonce : `#createNonceTracker` compte comme en attente les statuts `approved`, `signed`, `submitted` et comme confirmée `confirmed`. Une transaction `failed` n'y figure pas, donc son nonce n'est pas réservé et le prochain envoi le réutilise (le réseau n'a jamais vu la transaction). [V pour les statuts, la conclusion est une déduction] Remarque : une anomalie apparente (`chainId` passé là où `address` est attendu) a été relevée dans la lecture, non confirmée. [NV]
- Le « speed up/annuler » (`utils/retry.ts`) est une surenchère de frais, sans lien. [V]

## 3. Failover, plusieurs RPC, Smart Transactions
- `packages/network-controller/src/create-network-client.ts`, `getAvailableEndpoints` : les failovers ne sont ajoutés que si `new URL(primaryEndpointUrl).hostname.endsWith('.infura.io')` ; sinon `return [{ url: primaryEndpointUrl, isFailover: false }]`. Pour un RPC custom, `failoverRpcUrls` est ignoré. CHANGELOG network-controller : 33.0.0 « Failover endpoints are only considered when using Infura », 34.0.0 « Custom endpoints are unaffected ». [V]
- `rpc-service-chain.ts` : bascule vers le service suivant seulement quand le disjoncteur est ouvert (« This service's circuit is open. Proceeding to next service »), sinon l'erreur est relancée. `rpc-service.ts` : une réponse HTTP 200 avec champ `error` est renvoyée telle quelle, sans retry ni comptage de panne ; seuls connexion, JSON invalide, 502/503/504, timeout, reset sont réessayés ; 429 devient -32005. [V] Conséquence : notre erreur JSON-RPC en HTTP 200 ne déclenche ni retry ni failover ; une panne réseau/5xx répétée de notre proxy ouvrirait le disjoncteur mais, sans failover custom, l'envoi échoue simplement.
- Plusieurs RPC pour un réseau : MetaMask n'en utilise qu'un (le RPC par défaut choisi) ; pas de répartition automatique pour un custom. Détail de l'interface : [NV].
- Smart Transactions : `shared/constants/smartTransactions.ts` (production) : MAINNET, BSC, BASE, ARBITRUM, LINEA_MAINNET, POLYGON, ROBINHOOD_CHAIN. Avalanche C-Chain absente. [V pour le fichier ; des drapeaux distants pourraient élargir la liste : NV] La page support `support.metamask.io/.../how-to-use-smart-transactions/` répond 404 : non lue.

## 4. MetaMask mobile : non établi
Aucune lecture de `MetaMask/metamask-mobile`. Il partage `@metamask/transaction-controller` (donc statut failed et message préfixé), mais l'affichage est [NV].

## 5. Core wallet (Avalanche) : non établi
`ava-labs/core-extension` non lu. Changement d'URL du C-Chain vs ajout d'un réseau custom : [NV].

## 6. RPC http://127.0.0.1:8555 avec chain id 43114/43113 : non établi
Rien lu sur la validation d'URL (http en loopback), la comparaison du chain id avec `eth_chainId` du endpoint, l'avertissement affiché, ni le choix du RPC par défaut. Seul point sûr : le client réseau de MetaMask passe par `createCustomNetworkMiddleware` avec `createChainIdMiddleware` pour un endpoint non-Infura (`create-network-client.ts`) [V], ce qui n'établit pas la validation à l'ajout. Notre proxy doit répondre correctement à `eth_chainId`, `eth_blockNumber`, `eth_getTransactionCount`, `eth_gasPrice`/`eth_feeHistory`, `eth_estimateGas`, `eth_call`. [NV : liste déduite]

## 7. Forme d'erreur recommandée pour le proxy
Recommandation : erreur JSON-RPC (pas de faux hash), `code: -32000`, `message` court (idéalement < 100 caractères, sans accent critique, une phrase d'action en tête), `data` optionnel avec l'URL et un identifiant.
- Pourquoi une erreur : le contrôleur passe la transaction en `failed`, libère le nonce, ne rediffuse jamais, et le texte est préservé (`data.message ?? message`). C'est honnête : la transaction n'est pas partie.
- Pourquoi -32000 : code générique serveur. Le code n'est pas affiché (le middleware le remplace par une erreur interne enveloppant la nôtre dans `data`). Le choix a peu d'effet visible ; éviter -32005 (traité comme limitation de débit) et les codes 4001/4900 (réservés au fournisseur). [V pour l'enveloppe, NV pour tout effet de code]
- Message : mettre l'essentiel dans les ~100 premiers caractères (« Hold up retient cet envoi, ouvrir http://127.0.0.1:8555/hold/abc »), car le préfixe de MetaMask s'ajoute et une notification ou infobulle peut tronquer. Ne pas compter sur un lien cliquable ; l'URL doit être courte. `data` n'est lu que par `throwWithRpcContext` (via `data.message`) : y dupliquer le message n'apporte rien ; le garder pour un identifiant.
- Alternative « succès avec hash puis retenue » : MetaMask passerait en `submitted` et afficherait « En attente » ; le suivi (`PendingTransactionTracker`) sonderait le reçu, ne le trouverait pas, et finirait par marquer `dropped` ou `failed` (« not found on network after timeout » si activé) ; le nonce resterait réservé localement (statut `submitted`), ce qui bloque les envois suivants ; sans resoumission, l'état serait un mensonge pour l'utilisateur. Gain : aucun message d'erreur nécessaire. Perte : honnêteté, nonce bloqué, confusion. À éviter pour une démo de protection.
- Compromis : l'erreur est honnête et débloquante mais son affichage dans MetaMask est incertain ; il faut donc que la décision visible passe aussi par un second canal (page /hold ouverte par la sentinelle ou l'extension), pas seulement par le texte du wallet.

## Ce qu'un essai réel de 10 minutes doit encore confirmer
- [ ] Ajouter http://127.0.0.1:8555 en RPC pour Avalanche (43114) ou Fuji (43113) : accepté ? avertissement ? contrôle du chain id ? comment le définir par défaut ?
- [ ] Envoyer une transaction simple, cliquer Confirmer : que voit-on tout de suite (retour accueil, bannière, rien) ?
- [ ] Une notification navigateur « Failed transaction » apparaît-elle, avec quel texte exact (préfixe, troncature, URL) ?
- [ ] Onglet Activité : la ligne « échec » existe-t-elle ? Le clic ouvre-t-il un détail ? Y a-t-il une infobulle avec notre message ?
- [ ] Relever le texte exact du préfixe (« RPC 43114 Custom eth_sendRawTransaction: ... ») dans la console du service worker.
- [ ] Le renvoi suivant réutilise-t-il le même nonce ? Aucune rediffusion côté proxy (compter les appels `eth_sendRawTransaction`) ?
- [ ] Vérifier qu'aucun autre endpoint n'est contacté (Infura, relais STX) pendant l'essai.
- [ ] Tester la même chose avec une erreur HTTP 200 contre un 4xx/5xx pour comparer l'affichage.
- [ ] Refaire en version stable publiée de l'extension (pas seulement `main`), puis sur mobile et Core wallet (sections 4 et 5).
- [ ] Une URL dans le message est-elle cliquable ou seulement copiable ?

## Sources
- https://raw.githubusercontent.com/MetaMask/core/main/packages/transaction-controller/src/TransactionController.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/transaction-controller/src/utils/utils.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/transaction-controller/src/utils/provider.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/transaction-controller/src/utils/nonce.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/transaction-controller/src/helpers/PendingTransactionTracker.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/transaction-controller/CHANGELOG.md
- https://raw.githubusercontent.com/MetaMask/core/main/packages/eth-json-rpc-middleware/src/fetch.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/network-controller/src/create-network-client.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/network-controller/src/rpc-service/rpc-service.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/network-controller/src/rpc-service/rpc-service-chain.ts
- https://raw.githubusercontent.com/MetaMask/core/main/packages/network-controller/CHANGELOG.md
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/pages/confirmations/components/confirm/footer/footer.tsx
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/pages/confirmations/hooks/transactions/useTransactionConfirm.ts
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/store/actions.ts
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/components/app/transaction-status-label/transaction-status-label.js
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/components/app/transaction/transaction-status.tsx
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/hooks/activity/useLocalTransactionMeta.ts
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/pages/activity/ (activity-list.tsx, helpers.ts, rows/useActivityRowContent.tsx)
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/ui/pages/details/components/sections.tsx
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/shared/constants/smartTransactions.ts
- https://raw.githubusercontent.com/MetaMask/metamask-extension/main/app/_locales/en/messages.json
