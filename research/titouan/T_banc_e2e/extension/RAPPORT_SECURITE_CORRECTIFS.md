# Correctifs de la revue de sécurité n°2

Date : 11 oct. 2026. Source : `security_review2/REVUE.md`. Aucun commit. Aucun navigateur lancé.

## Résultat en bref

- Corrigés : S1, S2, S3, S4, S5 (partiel), S6 (partiel), S7, S8, S9, S10 (partiel).
- Non corrigés : S11 à S21 (hors périmètre demandé). S15 reste ouvert.
- Tests unitaires : 83 d'origine verts, plus 43 nouveaux (securite_*.test.mjs : 36, sidepanel : 7). Total 126 verts.
- Version autonome : 39 contrôles sur 39 verts. Build refait, zip refait (SHA-256 834baa12…d4ed).
- Tests de la revue : r02, r03, r05 sortent 0. r01 et r04 sortent 1 (raisons plus bas, aucune ne vient d'une trouvaille restée ouverte dans `extension/`).

## Tests avant et après

"Avant" = les nouveaux tests rejoués sur l'ancien build autonome. "Après" = sur le code corrigé.

| Fichier | Avant (réussis / total) | Après |
|---|---|---|
| securite_s1_natives | 0 / 6 lancés, puis arrêt brutal de Node (descripteurs empoisonnés) | 10 / 10 |
| securite_s5_jeton | 3 / 6 | 6 / 6 |
| securite_written_check (S2, S3, S8, S9) | 2 / 8 | 8 / 8 |
| securite_gatekeeper (S2, S3, S4, S7) | 1 / 6 | 6 / 6 |
| securite_inject_entrees (S6, S10) | 0 / 6 | 6 / 6 |
| revue : r02 | échoue (4 cas) | 0 |
| revue : r03 | échoue (3 lignes) | 0 |

## S1. Fonctions natives remplaçables (corrigé)

`inject.js` capture au démarrage chaque méthode native utilisée, sous forme décurryfiée (`uncurry`) : Set, Map, WeakMap, WeakSet, Promise.then, Reflect, Object, JSON, charCodeAt, hasOwnProperty. Zone `NATIVES-BEGIN / NATIVES-END`.
Hors de cette zone, plus aucun appel de méthode d'un objet modifiable par la page. Plus de `.then`, `.map`, `for...of`, déstructuration, `Object.assign`, `Promise.*`, regex, `await`.
Autres durcissements trouvés en cours de route :
- Les gestionnaires de Proxy et les descripteurs ont un prototype nul. Sinon `Object.prototype.get` ou `.value` posé par la page se glisse dedans. Cas grave : un piège `get` sur `Object.prototype` donnait à la page la fonction d'origine, donc un contournement.
- La copie transmise au portefeuille est reconstruite structurellement, plus par un second aller-retour JSON. Avant, un `toJSON` posé sur `Object.prototype` pouvait changer le destinataire entre le jugement et l'envoi.
- `method` et `params` sont lus comme propriétés propres. Une demande sans `method` propre est refusée.
- Les objets décision ont un prototype nul (une décision `allow` ne peut plus venir de `Object.prototype`).
- Le port est écouté par `addEventListener` capturé, pas par `onmessage`. `MessageEvent.data` est lu par le getter d'origine.
- Chemins sans promesse pour la décision : la réponse du pont passe par des rappels, jamais par `await` ni `.then` modifiable.
Tests : `securite_s1_natives.test.mjs` (pollue 150 méthodes et 27 emplacements d'`Object.prototype`, compte les appels : zéro attendu ; jeton ; MessagePort ; test statique du fichier).

## S2. Jeton substitué (corrigé)

`assetOf` marque `unknown` un jeton absent du contexte et de la liste intégrée (`BUILTIN_TOKENS`, mêmes adresses que le moteur embarqué : Ethereum et Avalanche C). Une demande qui porte un jeton inconnu ne donne jamais "Ça correspond" : sortie "Je n'ai pas pu vérifier cette demande", avec retenue. Un vrai écart reste signalé comme écart.
Conséquence voulue : une personne dont le jeton n'est ni dans la liste ni dans son contexte voit "pas pu vérifier". Les tests d'origine (flow, operation, decisions) enregistrent maintenant le jeton dans le contexte.
Non fait : lecture de `symbol()` sur la chaîne (S15 : un contrat peut mentir).

## S3. Valeur native ignorée (corrigé)

`txFacts` compte la valeur jointe pour un appel sans données, à données courtes, ou à données lues (transfer, transferFrom, approve). Idem dans `wallet_sendCalls`. Un transfert plus de l'ETH joint donne "ne correspond pas".
Choix : un appel à données illisibles garde sa valeur hors des faits (sa valeur est mesurée par la simulation, comme avant).
Côté moteur (niveau d'un `transfer` avec valeur) : hors de mes fichiers. `r04` reste à 1 (voir plus bas).

## S4. Relief Q16 (corrigé)

Le relief (zéro délai, zéro phrase) n'est accordé que si l'écart est le seul motif : aucun signal de risque, aucune contradiction, aucun écart d'adresse, tous les codes du moteur dans la liste de l'écart (`unlimited_allowance`, `external_spender`, `unlimited_approval_swap`, `approval_exceeds_intent`), et un Danger sans code reste un Danger. Le moteur réel donne Danger pour un approve illimité avec exactement ces codes : le relief normal reste donc en place. Testé avec les deux cas.

## S5. Poignée de main (partiel)

Fait : `bridge.js` tire un jeton de 128 bits et le donne dans `ready`. Chaque message, dans les deux sens, le porte. Sans jeton ou avec un autre : ignoré. Un `ready` sans jeton, ou avec un jeton trop court, n'ouvre pas le canal (échec fermé, code 4900). Un second `ready` est ignoré. Test avec le vrai `bridge.js` : la page ne reçoit aucun port.
Non fait : une page qui tient le port avant le pont (iframe vierge avec `document.open()`) pourrait encore poser son propre jeton. Il faudrait envelopper `Document.prototype.open/write`. À tester dans un vrai Chrome.

## S6. Points d'entrée internes (partiel)

Enveloppés quand ils existent : `_rpcRequest(payload, cb)` et `_rpcEngine.handle(payload, cb)`. `request()` qui passe par `_rpcRequest` ne demande qu'une fenêtre. Un appel de forme sensible sans rappel est refusé.
Non fait : `sendTransaction` et autres méthodes propres à un portefeuille (signature inconnue, risque de double fenêtre). Jamais essayé avec un vrai MetaMask, Rabby ou Coinbase.

## S7. Remplissage au-dessus de 200 000 octets (corrigé)

Au-dessus du seuil, le corps est réduit aux champs lus par le moteur (from, to, value, data, input, gas, chainId, appels des lots). Le remplissage tombe, la question est posée, la vérification a lieu. Un corps réduit n'est jamais réécrit (pas de Q17 ni de relief). Si le corps reste trop gros (données géantes) : échec fermé, "pas pu vérifier", retenue, pas de question.

## S8. Limites de lecture (corrigé)

`wallet_sendCalls` : tous les appels sont lus, jusqu'à 256 (`MAX_CALLS`). Au-delà : "pas pu vérifier" et jamais de réécriture. `data` et `input` : les deux sont lus. S'ils diffèrent, la demande est ambiguë et ne peut pas correspondre.
Côté moteur (`calldata.js`, limite de 64 appels supposée) : non vérifié, hors de mes fichiers.

## S9. Nom du site (corrigé)

`siteName` coupe par le milieu et garde en entier les deux derniers libellés (trois si la fin reste courte). Le vrai domaine n'est jamais caché. Testé avec un hôte à 250 caractères, un nom punycode, une IP, l'adresse locale.

## S10. Globales et window.ethereum (partiel)

Fait : accesseur de capture immédiate sur `okxwallet`, `trustwallet`, `coinbaseWalletExtension`, `rabby`, `BinanceChain`, `tokenpocket`, `bitkeep`, `avalanche` (plus d'attente du balayage). `Reflect.defineProperty` et `Object.defineProperties` sont aussi surveillés pour ces noms. Balayage toutes les 50 ms pendant 30 s, puis toutes les 2 s. `window.ethereum` défini non configurable après l'injection est redirigé vers l'emplacement protégé, objet gelé compris.
Laissés au balayage : `core`, `phantom`, `solflare` (les sites testent `"phantom" in window`, un accesseur vide casserait leur détection).
Limite : `window.ethereum` non configurable AVANT l'injection avec un fournisseur dont `request` n'est pas réinscriptible reste brut pour la page. Rien à faire côté page ; seule la voie EIP-6963 le remplace.

## Écart de CSP

La revue lisait le manifeste du mode serveur. Le build autonome a bien `connect-src 'none'` (manifeste source et build, vérifié par `static_check.mjs`). Le mode serveur garde `127.0.0.1:8787` et `8789` : nécessaire à son fonctionnement, rien à corriger. Pas de changement.

## Tests de la revue

- r02, r03, r05 : sortie 0.
- r01 : le fichier a été modifié par quelqu'un d'autre pendant mon travail (10 h 36). Il contient maintenant une erreur de syntaxe (guillemets simples imbriqués ligne 21) et sort 1 avant d'exécuter quoi que ce soit. Je ne l'ai pas touché. Une copie corrigée dans mon dossier temporaire sort 0. Il passe aussi parce que son faux pont n'envoie pas de jeton (donc l'échec est fermé), ce qui est le bon comportement mais ne teste plus la logique fine : `securite_s1_natives` la teste vraiment.
- r04 : appelle directement le moteur embarqué (`transfer + 1 ETH` doit sortir danger ou unknown). Il est dans `engine/` et `pipeline/`, qui ne sont pas à moi. Sortie 1. À traiter par le propriétaire du moteur. Côté extension, le même cas ne donne plus "Ça correspond" (testé).

## Non corrigés

S11 à S14, S16 à S21 : hors de la liste demandée. S15 : lecture de `symbol()` sur le contrat, non traité (le jeton inconnu ne peut plus correspondre, mais la réécriture Q17 accepte encore un symbole lu sur la chaîne).

## Panneau latéral

Un clic sur l'icône ouvre le panneau (`chrome.sidePanel.setPanelBehavior` au démarrage du service worker, dans les deux builds). Permission `sidePanel`, `minimum_chrome_version` 114, entrée `side_panel` et `action` dans les deux manifestes. Test statique du build autonome mis à jour (permissions : storage, alarms, sidePanel ; toujours aucun hôte, `connect-src 'none'`).
Fichiers : `extension/ui/sidepanel.html`, `.css`, `.js`. Mêmes jetons que `ui/screen.css`. Aucun innerHTML, tout en `textContent`.
Contenu : état (actif ou inactif, déterminé par une réponse du service worker), version du build, "Aucune connexion réseau" quand la CSP du manifeste est `connect-src 'none'`, compteurs du jour (demandes vérifiées, annulées), 20 dernières demandes (site coupé par le milieu, type, niveau, décision, heure), trois lignes "Comment ça marche", bouton vers les réglages, bouton "Effacer l'historique".
Données : lues dans le journal existant (`log`). Le panneau n'écrit rien sauf l'effacement. Le journal ne contient ni la phrase écrite ni une adresse (testé sur un vrai passage par le gatekeeper). Les décisions de signature restent dans la fenêtre séparée.
Tests : `sidepanel.test.mjs` (7).
Non vérifié : affichage réel dans Chrome (pas de navigateur lancé).
