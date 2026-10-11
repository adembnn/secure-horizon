# Auto-test du harnais (pages locales a verite terrain connue)

Genere le 2026-10-11T01:18:04.710Z par `report.mjs` a partir de `results-selftest/`. Donnees brutes: un JSON par site et par tour.

## Methode (resume)

- Chrome installe, `--headless=new`, CDP brut (WebSocket Node), profil temporaire, contexte de navigateur vierge par visite, UA = celui de Chrome sans le jeton "Headless". Aucune installation.
- Injection par `Page.addScriptToEvaluateOnNewDocument` (tous les cadres, y compris les iframes hors-processus via auto-attach). Fournisseur EIP-1193 SIMULE (adresse de test 0x1111...1111, reponses fictives, se presente comme MetaMask / rdns io.metamask pour que les sites le listent). Toute demande de signature ou de transaction est rejetee (code 4001); aucune transaction n'est creee.
- Trois visites par site, espacees (tours complets l'un apres l'autre): **A1** controle (fournisseur non enveloppe), **B** test (meme fournisseur enveloppe par un Proxy transparent qui journalise), **A2** controle bis. A1 vs A2 mesure le bruit propre au site (pub, A/B tests, horloge): un ecart n'est retenu que si A1 = A2 et B different.
- Clic: uniquement un bouton de connexion (heuristique: texte "Connect wallet"/"Connect", sinon "Launch app"/"Log in"; visible, non masque par un bandeau, jamais de texte d'achat/swap/signature), puis au plus l'option "MetaMask / Browser wallet / Injected" de la modale. Pas de bandeau cookies accepte, pas de formulaire, pas de saisie.
- Criteres de casse (par site, controle stable): la page ne charge plus; le site ne detecte plus le portefeuille (lecture de window.ethereum / requete EIP-6963); `eth_requestAccounts` n'est plus appele; l'UI n'affiche plus l'etat connecte; erreur console nouvelle liee au portefeuille. DIFFÉRENCE = ecart mineur (bouton, modale, erreurs hors portefeuille). Les ecarts de controle sont traites comme du bruit.

## Resultats chiffres

| Mesure | Valeur |
|---|---|
| Sites testes | 7 |
| PASS | 6 |
| DIFFÉRENCE | 0 |
| CASSE | 1 |
| SITE INACCESSIBLE | 0 |
| **Taux de casse** (CASSE / sites accessibles) | 1/7 = 14.3 % [IC95 Wilson 2.6 % ; 51.3 %] |
| Taux de casse ou difference | 1/7 = 14.3 % [IC95 Wilson 2.6 % ; 51.3 %] |
| Sites qui detectent un portefeuille (bras controle) | 5/7 = 71.4 % [IC95 Wilson 35.9 % ; 91.8 %] |
| **Taux de casse parmi les sites sensibles au portefeuille** | 1/5 = 20.0 % [IC95 Wilson 3.6 % ; 62.4 %] |
| Bruit A/A: sites avec >=1 erreur console de A2 absente de A1 | 0/7 = 0.0 % [IC95 Wilson 0.0 % ; 35.4 %] |
| Bras test: sites avec >=1 erreur console absente de A1 et A2 | 0/7 = 0.0 % [IC95 Wilson 0.0 % ; 35.4 %] |

Lecture: le "bruit A/A" donne la part de "erreurs nouvelles" qui apparait SANS aucune difference d'injection; seule la part excedentaire du bras test est attribuable a l'enveloppe.

## Tableau par site

Colonnes: Charge / Detecte / Req = eth_requestAccounts / UI = etat connecte affiche, en A1, B, A2 (oui, non, x = inaccessible, - = pas de donnee). "Bouton" = texte clique en A1.

| Site | Categorie | Verdict | Charge A1/B/A2 | Detecte A1/B/A2 | Req A1/B/A2 | UI A1/B/A2 | Bouton | Causes / raisons |
|---|---|---|---|---|---|---|---|---|
| selftest ok | Selftest | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet |  |
| selftest csp | Selftest | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet | CSP (injection par <script> en ligne bloquee) |
| selftest antiproxy | Selftest | **CASSE** | oui/oui/oui | oui/oui/oui | oui/non/oui | oui/non/oui | Connect Wallet | perte: appel eth_requestAccounts ; perte: UI affiche l'etat connecte ; detection de proxy (hypothese: perte d'eth_requestAccounts sans erreur) |
| selftest wconly | Selftest | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | Connect Wallet | WalletConnect uniquement |
| selftest eip6963 | Selftest | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet |  |
| selftest static | Selftest | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| selftest framehost | Selftest | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) |

## Classification des causes

| Cause | Sites accessibles concernes | Liste |
|---|---|---|
| CSP | 1 | self-csp |
| detection de proxy | 1 | self-antiproxy |
| WalletConnect uniquement | 1 | self-wconly |
| aucun support d'injection observe | 1 | self-static |
| iframes | 1 | self-framehost |

Sites CASSE: self-antiproxy.
Sites DIFFÉRENCE: aucun.
Sites INACCESSIBLES: aucun.

Notes sur les causes: "CSP" est mesure par une sonde reelle (un <script> en ligne est-il execute dans la page ?) donc un injecteur de type content-script qui insere une balise <script> serait bloque; l'injection CDP (utilisee ici) et un content-script "world: MAIN" d'une extension MV3 ne le sont pas. "worker": window.ethereum n'existe pas dans un worker, aucune extension n'y injecte; la ligne ne signale que la presence de workers. "detection de proxy" est une HYPOTHESE (perte d'appel sans erreur), pas une preuve.

## Detection d'alteration (empreinte identique sur tous les sites)

Champs de l'empreinte qui different entre bras controle et bras test, sur les sites ou les deux ont ete mesures:

| Champ | Sites ou B differe de A1 (sur 7) |
|---|---|
| tag | 0 |
| own | 0 |
| proto | 0 |
| reqNative | 7 |
| reqName | 0 |
| reqLen | 0 |
| reqStable | 0 |
| onReturnsSelf | 0 |
| same6963 | 0 |
| isMetaMask | 0 |
| ours | 0 |

Exemple (self-ok): controle `{"type":"object","ours":true,"tag":"[object Object]","own":"_metamask,chainId,isMetaMask,networkVersion,request,selectedAddress","proto":"MockProvider","reqNative":false,"reqName":"request","reqLen":1,"reqStable":true,"onReturnsSelf":true,"same6963":true,"isMetaMask":true,"overwritten":false}`

test `{"type":"object","ours":true,"tag":"[object Object]","own":"_metamask,chainId,isMetaMask,networkVersion,request,selectedAddress","proto":"MockProvider","reqNative":true,"reqName":"request","reqLen":1,"reqStable":true,"onReturnsSelf":true,"same6963":true,"isMetaMask":true,"overwritten":false}`

Le champ attendu est `reqNative`: `Function.prototype.toString.call(window.ethereum.request)` d'un Proxy de fonction renvoie "[native code]" alors que le vrai `request` renvoie son source. C'est la seule trace non triviale de l'enveloppe qu'un site peut tester sans cooperation.

## Bras durci (H: Proxy + Function.prototype.toString corrige)

Tour optionnel, execute sur: self-ok, self-csp, self-antiproxy, self-wconly, self-eip6963, self-static, self-framehost.

| Site | Verdict B | reqNative B / H | Req A1/B/H | UI A1/B/H |
|---|---|---|---|---|
| self-ok | PASS | true / false | oui/oui/oui | oui/oui/oui |
| self-csp | PASS | true / false | oui/oui/oui | oui/oui/oui |
| self-antiproxy | CASSE | true / false | oui/non/oui | oui/non/oui |
| self-wconly | PASS | true / false | non/non/non | non/non/non |
| self-eip6963 | PASS | true / false | oui/oui/oui | oui/oui/oui |
| self-static | PASS | true / false | non/non/non | non/non/non |
| self-framehost | PASS | true / false | non/non/non | non/non/non |

## Correctifs que l'injecteur devrait faire

1. **Masquer le Proxy de fonction**: patcher `Function.prototype.toString` (lui-meme proxifie, WeakMap proxy -> original, y compris pour lui-meme) pour que `request`, `on`, etc. renvoient le source d'origine; verifie par le bras H. Preferer ne pas proxifier: poser directement des fonctions liees sur l'objet.
2. **Ne jamais fuiter l'objet brut**: toute methode qui renvoie `this` (`on`, `once`, `removeListener`) doit renvoyer l'enveloppe (corrige dans l'injecteur: verifie par `onReturnsSelf`).
3. **Identite unique**: `window.ethereum`, le `provider` annonce en EIP-6963 et `providers[]` doivent etre le meme objet (`same6963`); annoncer a l'initialisation ET en reponse a chaque `eip6963:requestProvider`.
4. **Injection au bon moment et dans tous les cadres**: `world: "MAIN"`, `run_at: document_start`, `all_frames: true`, `match_about_blank: true` (les sous-cadres lisent le fournisseur: voir la cause iframes); ne pas utiliser de balise <script> en ligne (cause CSP). Pas d'injection possible dans les workers: documenter.
5. **Garder window.ethereum inscriptible/remplacable** comme MetaMask (plusieurs portefeuilles, `window.ethereum.providers`), et ne pas lever d'exception si un site reaffecte la propriete.
6. **Prevoir le cas "portefeuille absent"**: les sites WalletConnect-only ou non-EVM (Solana) n'utilisent pas l'injection; l'extension ne peut pas y etre "interposee" sans cibler WalletConnect/relais, ce qui est une autre couche.
7. **Ne rien journaliser de sensible** et ne jamais signer: la couche de test rejette tout (4001); en production, l'enveloppe doit transmettre sans modifier `params`.

## Limites et ce qui n'a pas pu etre teste

- **Le bras test est le Proxy maison de ce harnais (inject.template.js), PAS l'extension Sentinelle reelle** (extension/inject.js). La demande de la coordination etait de la charger via Extensions.loadUnpacked, ce qui exige `--enable-unsafe-extension-debugging` et `--disable-features=DisableLoadExtensionCommandLineSwitch`; le classificateur de securite de l'environnement a refuse cette commande (drapeaux de contournement de securite), et je n'ai pas cherche a la contourner. Les chiffres ci-dessus mesurent donc la classe "enveloppe Proxy transparente", pas Sentinelle. Pour mesurer Sentinelle: autoriser ces drapeaux (profil temporaire jetable) puis lancer un tour `B:ext` (branche a ajouter: lancement avec pipe + loadUnpacked, contexte de navigateur par defaut).
- Un seul Chrome a la fois pour le tour A2 (consigne de charge); les tours A1 et B ont ete executes avec 3 instances en parallele. Une coupure reseau a interrompu une execution precedente; les resultats ont ete regeneres integralement (96 sites x 3 tours).
- Fournisseur simule: il valide l'absence de casse due a l'ENVELOPPE, pas le comportement du vrai portefeuille ni de la chaine reelle (aucune lecture RPC reelle: eth_call renvoie 0x).
- Aucune connexion reelle, aucune signature: les flux apres connexion (approbations, swaps, SIWE) ne sont pas testes.
- Les boutons de connexion dans des iframes hors-processus ou dans des shadow DOM fermes ne sont pas atteints; les modales exigeant defilement/survol non plus. Un site peut etre "PASS" parce que le bouton n'a pas ete trouve; la colonne Bouton et la cause "bouton non trouve" le signalent.
- Sites derriere mur anti-bot ou redirection de geolocalisation: marques INACCESSIBLES (aucun contournement tente). Chrome headless a ete lance avec le meme UA que Chrome sans jeton "Headless".
- Un seul poste, un seul reseau, une journee: les echecs reseau transitoires peuvent classer un site INACCESSIBLE; l'echantillon (7 sites) est de commodite, pas aleatoire, donc l'IC de Wilson mesure l'incertitude d'echantillonnage seulement.
- Rejouer: `node run_all.mjs` puis `node report.mjs`; validation du harnais: `node selftest.mjs`.
