# Hold up (extension MV3) : compatibilité, limites, mode d'emploi du banc

Date : 11 oct. 2026. Tout ce qui est marqué **testé** a été exécuté pour de vrai (Chrome 154.0.8037.98 et Edge 155.0.4283.45, headless, extension chargée, portefeuille simulé, faux moteur local). Tout ce qui est marqué **non testé** est une hypothèse, pas un résultat.

## Lancer
- Faux moteur seul : `node mock_engine.mjs` (127.0.0.1:8787, `/check`, `/log`, `/_requests`, `/_mode`, `/_reset`).
- Batterie complète : `node tests/run_tests.mjs chrome` ou `edge` (66 tests, ~3 min). Sortie dans `tests/out_*.txt`, détail JSON dans `tests/results_*.json`.
- Captures de la fenêtre : `node tests/screenshot.mjs` (écrit `tests/shots/*.png`).
- Chargement : `Extensions.loadUnpacked` par CDP en pipe (le drapeau `--load-extension` seul n'a PAS chargé l'extension dans Chrome 154 branded). À la main : chrome://extensions, mode développeur, "Charger l'extension non empaquetée".
- Réglages : page d'options (JSON : `arm` A/B/C, `frictionMs`, `manipulationHoldMs`, `askIntent`, `grill`, `contact`, `testMode`+`auto`). Le mode automatique n'existe que si `testMode` est vrai, et n'est réglable que par `chrome.storage` (pas par la page). À retirer du build de production.

## Ce qui est couvert (testé)
| Cas | Résultat |
|---|---|
| 12 méthodes (eth_sendTransaction, eth_signTransaction, eth_sign, personal_sign, eth_signTypedData, _v3, _v4, wallet_sendCalls, wallet_addEthereumChain, wallet_switchEthereumChain, wallet_requestPermissions, eth_sendRawTransaction) | retenues, `/check` correct, annuler = erreur 4001 sans appel au portefeuille, confirmer = transmis avec les mêmes paramètres |
| eth_requestAccounts, enable() | journal seulement, jamais bloqué |
| request(), send(method, params), send(payload, cb), sendAsync (simple et lot) | gérés ; un `send()` qui rappelle `request()` en interne ne déclenche qu'UNE vérification |
| EIP-6963 (annonces, requestProvider, détail gelé) | chaque fournisseur annoncé est enveloppé, drapeaux isMetaMask/isRabby conservés |
| Injection tardive (affectation, defineProperty, accesseur, delete + réaffectation, propriété verrouillée, fournisseur gelé) | gérée (gelé : repli par Proxy, donc identité différente) |
| providers multiples (`ethereum.providers[]`, conteneur qui est lui-même un fournisseur) | chaque élément bloqué |
| iframes : srcdoc, about:blank + document.write, inter-origines | gating dans l'iframe, fenêtre dans la frame 0 |
| CSP stricte (script-src, style-src 'self') | OK (la fenêtre utilise une feuille de style construite, pas du `<style>` inline) |
| TOCTOU (la page modifie les paramètres après l'envoi) | le portefeuille reçoit la copie approuvée |
| Page hostile : prototypes DOM saccagés, suppression en boucle de la fenêtre, lecture du shadow root | fenêtre inaltérée, shadow root illisible (le code d'UI vit dans le monde isolé) |
| API absente / lente (> 3 s, mesuré 3011 ms) / HTTP 500 / JSON invalide | verdict "Non vérifié" (écran 6), jamais vert, jamais transmis sans geste explicite |
| Friction : bras A, B (délai), C (phrase), retenue Manipulation configurable | un clic anticipé est refusé, `time_to_decision_ms` journalisé |
| Annuler visible | vérifié à 1280x720, 375x500, 320x360 |
| Mini grilling (2 à 4 questions, déclenché sur droit/sortie + intention vague/suspecte/contradictoire) | monotone (jamais sous le plancher du moteur), vague = Danger minimum, "ne pas répondre" = +1, contradiction vérifiable = +2, temps par question journalisé |
| Chrome et Edge | mêmes résultats (64 PASS, 0 FAIL, 2 LIMITE sur chaque) |

## Détectabilité (résultats bruts du test G)
- **Non détecté** depuis la page dans le même royaume : `toString()` identique à l'original, `Function.prototype.toString.toString()` natif, `Object.defineProperty` natif, nom, longueur, propriétés propres, identité stable, descripteur de `request`, clés énumérables, drapeaux, `on`/`removeListener`.
- **DÉTECTABLE (LIMITE G2)** : une page qui crée un iframe vierge et appelle le `Function.prototype.toString` de cet iframe sur `ethereum.request` obtient `function () { [native code] }` (signature d'un Proxy). Mon masque ne vaut que dans le royaume où il a été posé. Idem pour `Object.defineProperty`. Un site motivé peut donc détecter l'extension.
- **DÉTECTABLE (LIMITE G3)** : `Object.getOwnPropertyDescriptor(window,'ethereum')` montre un accesseur get/set. `'ethereum' in window` est vrai même sans portefeuille (la valeur reste `undefined`).
- **Non testé** : fuite par les traces de pile (`Error().stack`), mesure de timing, détection par `structuredClone`/postMessage de l'objet fournisseur.
- Fournisseur gelé (`Object.freeze`) : repli par Proxy, `window.ethereum !== objet d'origine` (détectable par identité contre une référence gardée par le portefeuille).

## Ce que l'extension ne couvre PAS (impossible ou hors périmètre)
1. **WalletConnect, QR code, portefeuilles mobiles, deep links** : la signature se passe entre l'app mobile et le relais, sans `window.ethereum`. Aucune interposition possible depuis le navigateur du bureau. (Il faut un autre produit : app/wallet mobile.)
2. **Envois lancés depuis l'interface du portefeuille lui-même** (bouton Envoyer/Swap/Bridge de MetaMask, Rabby, etc.) : la page n'est pas dans le chemin. Idem applications natives, CLI, scripts.
3. **Portefeuilles matériels / Ledger Live / Safe (multisig) / Coinbase Smart Wallet / passkeys** : transport par fenêtre pop-up, postMessage SDK ou appareil, pas par le fournisseur injecté. Les applications Safe en iframe parlent au parent par leur SDK : non couvert.
4. **Web Workers, SharedWorker, Service Workers de la page** : aucun script de contenu dans ces contextes (et pas de `window.ethereum` non plus).
5. **Chaînes non EVM** (Solana/Phantom, Bitcoin, Cosmos) : méthodes différentes, non interceptées.
6. **Appels synchrones `send(payload)` sans rappel pour une méthode surveillée** : impossibles à retenir ; l'extension lève une erreur 4900 au lieu de laisser passer.
7. **Autres navigateurs** : Firefox et Safari non construits ni testés. Chrome/Edge seulement, headless. Pas Brave, Opera, Arc (non testés).
8. **Pages `file://`, navigation privée** : demandent l'autorisation explicite de l'utilisateur dans le navigateur. Non testé.
9. **Globales propriétaires** (`okxwallet`, `trustwallet`, `phantom.ethereum`, `web3.currentProvider`, etc.) : enveloppées par un balayage toutes les 150 ms pendant ~30 s et au chargement, pas par interception synchrone. Un site qui lit la globale avant le premier balayage garde la référence non enveloppée. **Non testé** sur un vrai portefeuille.
10. **Vraies bibliothèques** (ethers v5/v6, viem, wagmi, RainbowKit, Web3.js) : AUCUNE n'a été chargée (pas d'installation de paquet autorisée). La compatibilité est testée avec des dApps minimales qui appellent la même API (`request({method, params})`, `sendAsync`, `send`, EIP-6963). C'est une preuve de forme d'API, pas de non-régression sur ces bibliothèques. Point d'attention connu : une bibliothèque qui garde `provider.request.bind(provider)` AVANT notre patch (impossible au document_start) ou qui compare `request` à une référence native serait affectée.
11. **Portefeuilles réels** : MetaMask, Rabby, Coinbase Wallet, Phantom n'ont pas été installés. Le portefeuille est un simulacre EIP-1193 avec une adresse de test. MetaMask enveloppe déjà `request` dans son propre Proxy et définit `window.ethereum` de façon particulière : **non testé**.
12. **Iframes en sandbox (origine opaque)**, **Trusted Types** (`require-trusted-types-for 'script'` : la fenêtre utilise `innerHTML` d'un `<template>` pour les icônes SVG), **fenêtres `window.open`/pop-ups**, **pages avec `document.open()` répété** : non testés (document.write simple : testé et corrigé en réarmant l'écouteur).
13. **Retenue de 10 minutes** : traité le 11 oct. Chaque demande retenue vit dans `chrome.storage.session` (`hold_core.js`), l'échéance est une date absolue confiée à `chrome.alarms`, la page et la fenêtre Hold up se rattachent par identifiant de demande après un arrêt du service worker (`gatekeeper.js`). Sans décision humaine enregistrée, rien n'est transmis. Prouvé en Node avec une horloge simulée (`tests/unit/`, 41 tests) ; pas encore exécuté dans un vrai Chrome : voir `extension_standalone/ESSAI_HUMAIN.md`, contrôles 6 et 10. Le verdict s'affiche dans une fenêtre d'extension séparée (`window.html` + `ui/verdict.*`), la page ne reçoit qu'un bandeau neutre. `tests/run_tests.mjs` (pilotage CDP, ancien mode automatique) n'a pas été adapté à ce fonctionnement et ne tourne plus tel quel.
14. **Mode fermé** : si le pont (bridge) ne répond pas dans les 2,5 s (extension rechargée, contexte invalidé), les méthodes surveillées sont REFUSÉES (4900), pas laissées passer. Choix de sécurité, qui peut bloquer un site jusqu'au rechargement. Non testé en réel.
15. **Qualité du moteur** : `mock_engine.mjs` applique des règles jouets. Les tests valident la plomberie et l'interface, pas la détection. `effects` (`grants_right`, `funds_out`), `risk_signals`, `intent_contradiction`, `address_diff`, `said`/`real`, `quote` sont des champs que j'ai définis pour ce banc : à aligner avec le contrat réel du moteur (Jev).
16. **Vie privée** : `pageText` (4000 premiers caractères visibles de la frame) et `intent_text` partent vers `http://127.0.0.1:8787` seulement. Aucune autre sortie réseau (permissions : `storage` + hôte 127.0.0.1:8787 ; CSP `connect-src` identique).
17. **Rendu** : vérifié par captures headless (`tests/shots/`), pas sur matériel réel, pas avec lecteur d'écran. Aucun test avec des personnes.
18. **Bras C** : la phrase est tirée au hasard parmi 4 (ou 4 derniers caractères de l'adresse si sosie). Elle peut être dictée au téléphone (règle 10 de REGLES_avertissements.md) : elle ralentit, elle ne prouve rien.
