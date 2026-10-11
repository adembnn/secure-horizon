# COMPAT_REEL - compatibilite reelle de la couche d'interposition (window.ethereum + EIP-6963)

Genere le 2026-10-11T01:12:47.107Z par `report.mjs` a partir de `results/`. Donnees brutes: un JSON par site et par tour.

## Methode (resume)

- Chrome installe, `--headless=new`, CDP brut (WebSocket Node), profil temporaire, contexte de navigateur vierge par visite, UA = celui de Chrome sans le jeton "Headless". Aucune installation.
- Injection par `Page.addScriptToEvaluateOnNewDocument` (tous les cadres, y compris les iframes hors-processus via auto-attach). Fournisseur EIP-1193 SIMULE (adresse de test 0x1111...1111, reponses fictives, se presente comme MetaMask / rdns io.metamask pour que les sites le listent). Toute demande de signature ou de transaction est rejetee (code 4001); aucune transaction n'est creee.
- Trois visites par site, espacees (tours complets l'un apres l'autre): **A1** controle (fournisseur non enveloppe), **B** test (meme fournisseur enveloppe par un Proxy transparent qui journalise), **A2** controle bis. A1 vs A2 mesure le bruit propre au site (pub, A/B tests, horloge): un ecart n'est retenu que si A1 = A2 et B different.
- Clic: uniquement un bouton de connexion (heuristique: texte "Connect wallet"/"Connect", sinon "Launch app"/"Log in"; visible, non masque par un bandeau, jamais de texte d'achat/swap/signature), puis au plus l'option "MetaMask / Browser wallet / Injected" de la modale. Pas de bandeau cookies accepte, pas de formulaire, pas de saisie.
- Criteres de casse (par site, controle stable): la page ne charge plus; le site ne detecte plus le portefeuille (lecture de window.ethereum / requete EIP-6963); `eth_requestAccounts` n'est plus appele; l'UI n'affiche plus l'etat connecte; erreur console nouvelle liee au portefeuille. DIFFÉRENCE = ecart mineur (bouton, modale, erreurs hors portefeuille). Les ecarts de controle sont traites comme du bruit.

## Resultats chiffres

| Mesure | Valeur |
|---|---|
| Sites testes | 96 |
| PASS | 81 |
| DIFFÉRENCE | 8 |
| CASSE | 0 |
| SITE INACCESSIBLE | 7 |
| **Taux de casse** (CASSE / sites accessibles) | 0/89 = 0.0 % [IC95 Wilson 0.0 % ; 4.1 %] |
| Taux de casse ou difference | 8/89 = 9.0 % [IC95 Wilson 4.6 % ; 16.7 %] |
| Sites qui detectent un portefeuille (bras controle) | 65/89 = 73.0 % [IC95 Wilson 63.0 % ; 81.2 %] |
| **Taux de casse parmi les sites sensibles au portefeuille** | 0/65 = 0.0 % [IC95 Wilson 0.0 % ; 5.6 %] |
| Bruit A/A: sites avec >=1 erreur console de A2 absente de A1 | 9/86 = 10.5 % [IC95 Wilson 5.6 % ; 18.7 %] |
| Bras test: sites avec >=1 erreur console absente de A1 et A2 | 6/89 = 6.7 % [IC95 Wilson 3.1 % ; 13.9 %] |

Lecture: le "bruit A/A" donne la part de "erreurs nouvelles" qui apparait SANS aucune difference d'injection; seule la part excedentaire du bras test est attribuable a l'enveloppe.

## Tableau par site

Colonnes: Charge / Detecte / Req = eth_requestAccounts / UI = etat connecte affiche, en A1, B, A2 (oui, non, x = inaccessible, - = pas de donnee). "Bouton" = texte clique en A1.

| Site | Categorie | Verdict | Charge A1/B/A2 | Detecte A1/B/A2 | Req A1/B/A2 | UI A1/B/A2 | Bouton | Causes / raisons |
|---|---|---|---|---|---|---|---|---|
| Uniswap | DEX | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect | CSP (injection par <script> en ligne bloquee) ; worker (1 worker(s): hors portee d'une injection) |
| Pangolin | DEX | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet |  |
| Trader Joe / LFJ | DEX | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet | iframes (le fournisseur est lu dans un sous-cadre) ; WalletConnect propose, pas d'appel eth_requestAccounts |
| Aave | Lending | **DIFFÉRENCE** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet | difference: MetaMask liste dans la modale ; iframes (le fournisseur est lu dans un sous-cadre) |
| Benqi | Lending | **DIFFÉRENCE** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet | 1 erreur(s) console nouvelle(s) hors portefeuille (ex: network: Failed to load resource: the server responded with a status of # () o#.ingest.us.) ; worker (1 worker(s): hors portee d'une injection) |
| Curve | DEX | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | CONNECT WALLET | iframes (le fournisseur est lu dans un sous-cadre) |
| 1inch | Agrégateur | **PASS** | x/oui/oui | x/oui/oui | x/non/oui | x/non/oui | - | iframes (le fournisseur est lu dans un sous-cadre) ; worker (1 worker(s): hors portee d'une injection) |
| CoW Swap | DEX | **PASS** | x/oui/oui | x/oui/oui | x/oui/oui | x/oui/oui | - | worker (1 worker(s): hors portee d'une injection) |
| OpenSea | NFT | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Sign in | iframes (le fournisseur est lu dans un sous-cadre) |
| Blur | NFT | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | CONNECT WALLET | worker (2 worker(s): hors portee d'une injection) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic) |
| Magic Eden | NFT | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | - | mur anti-bot / challenge |
| Rarible | NFT | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) |
| Zora | NFT | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | worker (1 worker(s): hors portee d'une injection) |
| Galxe | Quêtes | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Log in |  |
| Layer3 | Quêtes | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Log in | iframes (le fournisseur est lu dans un sous-cadre) ; worker (1 worker(s): hors portee d'une injection) |
| Snapshot | Gouvernance | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Log in |  |
| Tally | Gouvernance | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| ENS app | Identité | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect | CSP (injection par <script> en ligne bloquee) |
| Etherscan | Explorateur | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | - | mur anti-bot / challenge |
| Snowtrace | Explorateur | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Sign In | worker (2 worker(s): hors portee d'une injection) |
| Revoke.cash | Sécurité | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet |  |
| Rabby (site) | Portefeuille | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Core web | Portefeuille | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | worker (2 worker(s): hors portee d'une injection) |
| Zapper | Portfolio | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | - | mur anti-bot / challenge |
| DeBank | Portfolio | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet | CSP (injection par <script> en ligne bloquee) |
| Jumper / LI.FI | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect | iframes (le fournisseur est lu dans un sous-cadre) ; worker (4 worker(s): hors portee d'une injection) ; WalletConnect propose, pas d'appel eth_requestAccounts |
| Stargate | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet | CSP (injection par <script> en ligne bloquee) |
| Across | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | CONNECT | worker (1 worker(s): hors portee d'une injection) |
| Hop | Bridge | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | - | HTTP 400 |
| Synapse | Bridge | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Core bridge | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | worker (2 worker(s): hors portee d'une injection) |
| Lens | Social | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) |
| Farcaster | Social | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - |  |
| Safe{Wallet} | Multisig | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet | worker (1 worker(s): hors portee d'une injection) |
| Gnosis | Multisig | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Lido | Staking | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect wallet | CSP (injection par <script> en ligne bloquee) |
| Rocket Pool | Staking | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet |  |
| Pendle | Rendement | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet | CSP (injection par <script> en ligne bloquee) ; worker (1 worker(s): hors portee d'une injection) ; WalletConnect propose, pas d'appel eth_requestAccounts |
| GMX | Perps | **PASS** | oui/oui/oui | oui/oui/oui | non/non/oui | non/non/oui | Connect wallet | iframes (le fournisseur est lu dans un sous-cadre) ; worker (2 worker(s): hors portee d'une injection) |
| dYdX | Perps | **DIFFÉRENCE** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Sign in | 1 erreur(s) console nouvelle(s) hors portefeuille (ex: TypeError: Cannot read properties of undefined (reading 'qs_VuPvzzn7yCSn')) ; iframes (le fournisseur est lu dans un sous-cadre) |
| Hyperliquid | Perps | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect | iframes (le fournisseur est lu dans un sous-cadre) |
| Phantom (EVM) | Portefeuille | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Coinbase web | CEX/Wallet | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Sign in | worker (1 worker(s): hors portee d'une injection) |
| Binance Web3 | CEX/Wallet | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | CSP (injection par <script> en ligne bloquee) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| MetaMask Portfolio | Portfolio | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - |  |
| WalletConnect sample dApp | Exemple SDK | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | Connect | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic) |
| RainbowKit | Exemple SDK | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet |  |
| wagmi | Exemple SDK | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Web3Modal lab | Exemple SDK | **DIFFÉRENCE** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | 1 erreur(s) console nouvelle(s) hors portefeuille (ex: security: Executing inline script violates the following Content Security Policy directive) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Reown AppKit lab | Exemple SDK | **DIFFÉRENCE** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | 1 erreur(s) console nouvelle(s) hors portefeuille (ex: security: Executing inline script violates the following Content Security Policy directive) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Balancer | DEX | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Launch app | WalletConnect propose, pas d'appel eth_requestAccounts |
| Compound | Lending | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | - | mur anti-bot / challenge |
| Morpho | Lending | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - |  |
| Spark | Lending | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet |  |
| Yearn | Rendement | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Sushi | DEX | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet | worker (1 worker(s): hors portee d'une injection) |
| PancakeSwap | DEX | **DIFFÉRENCE** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet | difference: bouton de connexion trouve/clique ; iframes (le fournisseur est lu dans un sous-cadre) ; worker (4 worker(s): hors portee d'une injection) |
| KyberSwap | Agrégateur | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect | iframes (le fournisseur est lu dans un sous-cadre) ; WalletConnect propose, pas d'appel eth_requestAccounts |
| Matcha | Agrégateur | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet | iframes (le fournisseur est lu dans un sous-cadre) ; worker (7 worker(s): hors portee d'une injection) |
| Velora (ParaSwap) | Agrégateur | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet | iframes (le fournisseur est lu dans un sous-cadre) |
| Odos | Agrégateur | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - |  |
| Ethena | Rendement | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet | worker (1 worker(s): hors portee d'une injection) |
| EigenLayer | Staking | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | Connect Wallet | HTTP 500 |
| ether.fi | Staking | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Open App | worker (1 worker(s): hors portee d'une injection) |
| Sky (Maker) | Lending | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet | CSP (injection par <script> en ligne bloquee) ; WalletConnect propose, pas d'appel eth_requestAccounts |
| Superbridge | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | worker (2 worker(s): hors portee d'une injection) |
| Arbitrum Bridge | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet |  |
| Polygon Portal | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - |  |
| Gnosis Chain bridge | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | oui/oui/oui | Connect Wallet |  |
| LooksRare | NFT | **PASS** | x/oui/oui | x/oui/oui | x/non/non | x/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) |
| Foundation | NFT | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| SuperRare | NFT | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Log In | worker (1 worker(s): hors portee d'une injection) |
| mint.fun | NFT | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Nouns | DAO | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) |
| DefiLlama | Données | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) |
| Dune | Données | **DIFFÉRENCE** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Log in | 2 erreur(s) console nouvelle(s) hors portefeuille (ex: security: Connecting to 'ad.doubleclick.net' violates the following Content Security Polic) ; CSP (injection par <script> en ligne bloquee) ; iframes (le fournisseur est lu dans un sous-cadre) ; worker (2 worker(s): hors portee d'une injection) |
| Zerion | Portfolio | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect Wallet | worker (1 worker(s): hors portee d'une injection) |
| Gitcoin Passport | Identité | **SITE INACCESSIBLE** | x/x/x | x/x/x | x/x/x | x/x/x | - | net::ERR_NAME_NOT_RESOLVED |
| Guild.xyz | Communauté | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Sign in | worker (1 worker(s): hors portee d'une injection) |
| Collab.Land | Communauté | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Mirror | Social | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | worker (1 worker(s): hors portee d'une injection) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Paragraph | Social | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | worker (1 worker(s): hors portee d'une injection) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| POAP | NFT | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Platypus | DEX | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | worker (1 worker(s): hors portee d'une injection) ; aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Yield Yak | Rendement | **PASS** | oui/oui/oui | oui/oui/oui | oui/oui/oui | non/non/non | Connect Wallet |  |
| gTrade (Gains) | Perps | **DIFFÉRENCE** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | 2 erreur(s) console nouvelle(s) hors portefeuille (ex: Error checking Cross-Origin-Opener-Policy: HTTP error! status: #) ; iframes (le fournisseur est lu dans un sous-cadre) ; worker (1 worker(s): hors portee d'une injection) |
| Instadapp | Lending | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| The Graph | Infra | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Unlock Protocol | Infra | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) ; worker (1 worker(s): hors portee d'une injection) |
| Rainbow | Portefeuille | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| zkSync Portal | Bridge | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - |  |
| Base bridge | Bridge | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |
| Aerodrome | DEX | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect | CSP (injection par <script> en ligne bloquee) ; worker (5 worker(s): hors portee d'une injection) |
| Jupiter (Solana, non-EVM) | Non-EVM | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | Connect |  |
| Tensor (Solana, non-EVM) | Non-EVM | **PASS** | oui/oui/oui | oui/oui/oui | non/non/non | non/non/non | - | iframes (le fournisseur est lu dans un sous-cadre) ; worker (4 worker(s): hors portee d'une injection) |
| ethereum.org | Contenu | **PASS** | oui/oui/oui | non/non/non | non/non/non | non/non/non | - | aucun support d'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic; bouton de connexion non trouve) |

## Classification des causes

| Cause | Sites accessibles concernes | Liste |
|---|---|---|
| worker | 33 | uniswap, benqi, 1inch, cow, blur, zora, layer3, snowtrace, core, jumper, across, corebridge, safe, pendle, gmx, coinbase, sushi, pancake, matcha, ethena, etherfi, superbridge, superrare, dune, zerion, guild, mirror, paragraph, platypus, gains, unlock, aerodrome, tensor |
| aucun support d'injection observe | 24 | blur, tally, rabby, synapse, gnosis, phantom, binanceweb3, wcsample, wagmi, web3modal, appkit, yearn, foundation, mintfun, collabland, mirror, paragraph, poap, platypus, instadapp, thegraph, rainbowwallet, basebridge, ethereumorg |
| iframes | 23 | traderjoe, aave, curve, 1inch, opensea, rarible, layer3, jumper, lens, gmx, dydx, hyperliquid, pancake, kyber, matcha, velora, looksrare, nouns, defillama, dune, gains, unlock, tensor |
| CSP | 10 | uniswap, ens, debank, stargate, lido, pendle, binanceweb3, sky, dune, aerodrome |
| WalletConnect propose, pas d'appel eth_requestAccounts | 6 | traderjoe, jumper, pendle, balancer, kyber, sky |

Sites CASSE: aucun.
Sites DIFFÉRENCE: aave, benqi, dydx, web3modal, appkit, pancake, dune, gains.
Sites INACCESSIBLES: magiceden (mur anti-bot / challenge), etherscan (mur anti-bot / challenge), zapper (mur anti-bot / challenge), hop (HTTP 400), compound (mur anti-bot / challenge), eigenlayer (HTTP 500), gitcoinpassport (net::ERR_NAME_NOT_RESOLVED).

Notes sur les causes: "CSP" est mesure par une sonde reelle (un <script> en ligne est-il execute dans la page ?) donc un injecteur de type content-script qui insere une balise <script> serait bloque; l'injection CDP (utilisee ici) et un content-script "world: MAIN" d'une extension MV3 ne le sont pas. "worker": window.ethereum n'existe pas dans un worker, aucune extension n'y injecte; la ligne ne signale que la presence de workers. "detection de proxy" est une HYPOTHESE (perte d'appel sans erreur), pas une preuve.

## Detection d'alteration (empreinte identique sur tous les sites)

Champs de l'empreinte qui different entre bras controle et bras test, sur les sites ou les deux ont ete mesures:

| Champ | Sites ou B differe de A1 (sur 89) |
|---|---|
| tag | 0 |
| own | 0 |
| proto | 0 |
| reqNative | 89 |
| reqName | 0 |
| reqLen | 0 |
| reqStable | 0 |
| onReturnsSelf | 0 |
| same6963 | 1 |
| isMetaMask | 0 |
| ours | 0 |

Exemple (uniswap): controle `{"type":"object","ours":true,"tag":"[object Object]","own":"_metamask,autoRefreshOnNetworkChange,chainId,isMetaMask,networkVersion,request,selectedAddress","proto":"MockProvider","reqNative":false,"reqName":"request","reqLen":1,"reqStable":true,"onReturnsSelf":true,"same6963":true,"isMetaMask":true,"overwritten":false}`

test `{"type":"object","ours":true,"tag":"[object Object]","own":"_metamask,autoRefreshOnNetworkChange,chainId,isMetaMask,networkVersion,request,selectedAddress","proto":"MockProvider","reqNative":true,"reqName":"request","reqLen":1,"reqStable":true,"onReturnsSelf":true,"same6963":true,"isMetaMask":true,"overwritten":false}`

Le champ attendu est `reqNative`: `Function.prototype.toString.call(window.ethereum.request)` d'un Proxy de fonction renvoie "[native code]" alors que le vrai `request` renvoie son source. C'est la seule trace non triviale de l'enveloppe qu'un site peut tester sans cooperation.

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
- Un seul poste, un seul reseau, une journee: les echecs reseau transitoires peuvent classer un site INACCESSIBLE; l'echantillon (96 sites) est de commodite, pas aleatoire, donc l'IC de Wilson mesure l'incertitude d'echantillonnage seulement.
- Rejouer: `node run_all.mjs` puis `node report.mjs`; validation du harnais: `node selftest.mjs`.
