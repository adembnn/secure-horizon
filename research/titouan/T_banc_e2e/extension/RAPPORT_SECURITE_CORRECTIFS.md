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

---

## Deuxième passe (journal chaîné, intention, restes de la revue)

Cette section remplace les lignes "partiel" et "non corrigé" plus haut quand elle les contredit.

### Priorité 1 : `intent_text.js`, "donner à X le droit d'utiliser…"

Cause : le mot "donner" était lu comme un paiement. Correction générale : un verbe de don (donner, accorder, offrir, give, grant, allow) suivi, à moins de 80 caractères, d'un droit d'utiliser ou de dépenser, d'un accès, d'une autorisation, d'une permission ou d'une allowance est un droit donné, pas un paiement. Le type n'est plus `pay_someone` et le fait `grant` est levé. "Donner 20 USDC à Paul" et "pour son droit d'entrée" restent des paiements.
Preuve de non-régression, bras code seul, moitié réglage (`mesure_code.mjs --split=reglage`), avant puis après : identique à la ligne.
- correspond lu "correspond" 298, "ne correspond pas" 0, invérifiable 9.
- ne correspond pas lu "correspond" 2, "ne correspond pas" 448, invérifiable 2.
- Rappel 448 sur 452 (99,1 %). Faux positifs 0 sur 307. Invérifiable reconnu 332 sur 332.
Le réglage ne contenait pas cette tournure : il ne bouge donc pas, ce qui est le résultat attendu. Le contrôle scellé n'a pas été ouvert. Tests : `securite_intent.test.mjs`.

### Priorité 2 : journal chaîné (build autonome compris)

`extension/journal_chain.js` (copié dans le build autonome) et `gatekeeper.js`. Chaque ligne de type verdict, decision ou partial ajoute une entrée `{n, t, o, type, m, l, c, d, v, prev, hash}`, `hash = SHA-256(prev + contenu canonique)` (crypto.subtle, aucun réseau). Site coupé par le milieu, jamais la phrase, jamais une adresse, codes filtrés (une adresse n'y passe pas).
- `verifyChain()` détecte une ligne modifiée, une ligne retirée au milieu, une ligne déplacée. Elle dit que la suppression des dernières lignes et la réécriture complète ne se détectent pas sans ancrage externe.
- Borne de 500 entrées. À la troncature, la dernière entrée retirée devient le point d'ancrage `{n, hash}` : la suite reste vérifiable.
- Panneau latéral : bouton "Exporter le journal (JSON)". "Effacer l'historique" efface aussi la chaîne.
- Vérification hors ligne : `node extension/tools/verify_journal.mjs export.json` (sortie 0 cohérent, 1 rompu, 2 illisible).
Tests : `journal_chain.test.mjs` (7 : modification, suppression, réordonnancement, limite honnête, borne, champs, export et outil).

### Restes de la revue

- S15 corrigé : la réécriture Q17 n'accepte que les jetons connus par adresse (liste intégrée, contexte local). `symbol()` n'est plus lu sur la chaîne. Test dans `decisions.test.mjs`.
- S5 renforcé : `document.open()`, `write()` et `writeln()` sur le document de la page coupent la connexion. Les demandes en attente échouent fermé, les nouvelles attendent un nouveau port et un nouveau jeton, l'ancien jeton est mort. Le pont ne remplace son port que sur un `hello` marqué `re`, et remet son écouteur toutes les 100 ms. Reste impossible depuis un script de contenu : la fenêtre de quelques millisecondes entre `document.open()` et la remise de l'écouteur (une page qui anticipe peut y lire un `hello`). Sans secret partagé avant le premier échange, ce trou ne se ferme pas. Un port volé ne permet que de refuser des demandes, jamais de les laisser passer sans le jeton du pont.
- S6 corrigé pour `sendTransaction` et `signTransaction` : retenus comme `eth_sendTransaction` et `eth_signTransaction`. Quand le portefeuille rappelle ensuite `request()` avec le même objet de transaction, il n'y a pas de seconde fenêtre. Autres méthodes propres à un portefeuille (inconnues, signatures variables) : non traitées. Jamais testé avec un vrai MetaMask, Rabby ou Coinbase.
- S10 : fournisseur non patchable derrière un `window.ethereum` non configurable : détecté, écrit dans le journal (type `partial`) et affiché dans le panneau latéral ("Interception partielle"). Fermeture impossible, l'objet est gelé.
- S11 corrigé : après un "allow", le réseau est relu ; s'il a changé, la demande est refusée (4900).
- S12 corrigé : `wallet_addEthereumChain` est retenu. Cela change la décision produit n°1 ("changement de réseau sans fenêtre") pour l'ajout seulement ; `wallet_switchEthereumChain` reste libre. Le test de la décision 1 a été adapté.
- S13 partiel : au plus 10 demandes retenues en tout ; cinq annulations de suite depuis une origine = refus pendant 60 s (mémoire du service worker, oubliée si le worker redémarre). Non fait : n'ouvrir la fenêtre que si l'onglet est actif (vol de focus).
- S16 corrigé : `chrome.storage.local.setAccessLevel(TRUSTED_CONTEXTS)` au démarrage. Non testé dans Chrome.
- S18 corrigé par le texte : la note ne dit plus "retape la phrase" (la fenêtre n'en affiche pas). Les réglages (`options.html`) parlent encore de phrase : non touché.
- S19 partiel : les décisions "continuée" ont un anneau à part (`confirms`, 200) que le spam ne repousse pas. L'anneau principal reste à 500 lignes.
- S14 non corrigé : la fusion monotone des faits du modèle et des mots-clés demande de toucher `interpret` et ses tests ; hors du délai.
- S17 non corrigé ici : `relay.mjs` et `server.mjs` ne sont pas dans mes fichiers. À faire par leur propriétaire : définir `HOLDUP_EXTENSION_ID` au démarrage.
- S20, S21 : documentation seulement. La vraie fenêtre est une fenêtre séparée avec `chrome-extension://` dans sa barre ; le dossier `extension/` du mode serveur contient `tests/` et `mock_engine.mjs` et doit être exclu du paquet ; en navigation privée Hold up n'agit pas sans autorisation explicite.
- r01 : la ligne 21 avait des guillemets simples imbriqués ; corrigée dans le dépôt (un seul remplacement, `"function"`). Sortie 0.
- COMPAT.md point 16 : la phrase écrite part vers le relais (8789), le texte de page vers le moteur (8787), et rien en version autonome.

### État final

- Unitaires : tous les fichiers de `extension/tests/unit/` passent un à un, sauf `revoke.test.mjs` (fichier d'un autre agent, rejoué sur le build il cherche `revoke.js` absent du build).
- Version autonome : 34 contrôles sur 39. Les 5 échecs ne viennent pas de ces correctifs : (1) trois contrôles d'équivalence serveur/autonome comparent le moteur courant (`engine/src`, modifié à 8 h 48 et 9 h 00 par d'autres agents) à `sentinelle_core.js` embarqué, qui date de 6 h 49 : les textes diffèrent ("USDC" contre "jetons"), ainsi que quelques niveaux ; (2) le rejeu des unitaires sur le build échoue à cause de `revoke.test.mjs`. À régénérer par le propriétaire du moteur avant le jeu aveugle.
- Build refait une fois : 44 fichiers, arbre 48ca0a51bbdfdb0b. Zip : SHA-256 51cd51b5…33e0.
- r01, r02, r03, r05 sortent 0. r04 sort 1 (moteur, hors de mes fichiers).
