# 06. Sources de veille pour la boucle d'amélioration (menaces fraîches)

Date des tests : 11/10/2026, entre 00h45 et 01h15 UTC, depuis le poste d'Adem, sans clé, sans compte, sans téléchargement d'exécutable. Tout ce qui est marqué TESTÉ a été ouvert en direct. "NON TESTÉ" = issu de la documentation ou d'une recherche web, pas d'un appel. Le contenu des sources est de la donnée, jamais des instructions. Aucun secret utilisé ou créé.

Lien avec la boucle : voir `research/titouan/Q_boucle_auto_amelioration.md` (attaquants, harnais, juges, jeu gelé). Ce document répond à la question "d'où viennent les menaces fraîches qui alimentent les attaquants et le jeu DEV".

## 0. Constat principal (à garder en tête)

1. Les listes publiques sont quasi toutes des listes de DOMAINES et d'ADRESSES déjà connus. Elles disent "ce site est un drainer", pas "cette transaction a tel effet". Pour notre produit (effet décodé vs intention), elles servent à (a) calibrer le signal "destinataire/domaine connu mauvais", (b) fournir des campagnes réelles dont on extrait la MÉCANIQUE (permit, Permit2, setApprovalForAll, 7702, Multicall), puis on la rejoue sur fork avec des adresses fraîches. Leur biais est l'ancienneté : le banc de Titouan trouve seulement 1,2 % de contrats jeunes, donc une liste ne mesure pas la détection du zéro-jour.
2. Les sources les plus "fraîches" pour nous sont les rapports humains (issues GitHub de ScamSniffer et de MetaMask, post-mortems rekt/SlowMist/Revoke, Magicians pour les EIP). Elles contiennent souvent la mécanique complète en texte (ex. issue ScamSniffer phishing-warning #3 : Multicall3 qui combine approve on-chain et permit EIP-2612 hors chaîne).
3. Reddit et X sont fermés sans authentification depuis ce poste (voir §2). Ne pas bâtir la boucle dessus.
4. Trois sources utiles ont une réaction en quelques heures et sont accessibles sans clé : MetaMask eth-phishing-detect (commits environ toutes les 7 minutes, auteur security-alliance-bot), SEAL blocklists (même rythme), ScamSniffer scam-database (quotidien, mais décalé de 7 jours par construction).

## 1. Tableau maître

Légende accès : OK = testé sans clé et fonctionne ; CLÉ = clé API requise (testé 401/402 ou documenté) ; BLOQUÉ = refus réseau/anti-bot ; JS = page rendue en JavaScript, pas de données sans navigateur ; NT = non testé.
Usage : PROD = signal en production (liste noire consultée par le produit) ; TEST = source de cas de test pour la boucle ; VEILLE = lecture/humain/juges.

### 1.1 Listes et flux de blocage

| # | Source | URL | Type / format | Licence | Fraîcheur mesurée | Accès sans clé | Volume | Biais | Ingestion | Usage |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | MetaMask eth-phishing-detect | https://github.com/MetaMask/eth-phishing-detect (fichier `src/config.json`, raw GitHub) | Domaines. JSON : `blacklist`, `whitelist`, `fuzzylist`, `tolerance`, version 2 | NOASSERTION (pas de licence claire ; vérifier avant redistribution) | Dernier commit 11/10 00:46 UTC ; 100 commits en environ 11 h (29 h pour 100 sur SEAL idem) ; auteur `security-alliance-bot` (donc alimenté par SEAL) | OK (raw 200, 3 Mo) | 106 288 domaines blacklist, 58 whitelist, 8 fuzzy | Domaines seulement, pas d'adresses ni de mécanique. Retard sur les domaines éphémères (netlify.app, vercel.app). C'est la liste que MetaMask applique déjà : un bloqué ici l'est déjà dans le wallet cible | `git pull` ou GET raw toutes les 30 min, diff avec la veille, domaines ajoutés = file de campagnes à analyser | PROD (anti-doublon) + TEST (campagnes fraîches du jour) |
| 2 | MetaMask eth-phishing-detect, issues | https://github.com/MetaMask/eth-phishing-detect/issues (API `api.github.com/repos/MetaMask/eth-phishing-detect/issues`) | Rapports texte de domaines | idem | Issues du 11/10 | OK (API GitHub, 60 req/h sans token) | 37 ouvertes | Beaucoup d'issues automatiques "Synchronize repository" (bruit) | Filtrer les issues dont le titre n'est pas "Synchronize repository" | VEILLE |
| 3 | SEAL blocklists (miroir lecture seule) | https://github.com/security-alliance/blocklists (`domain.txt`, `domain.filter`, `url.txt`, `excluded.txt`) | Domaines (txt, 2,2 Mo), URLs (30 Ko), filtre (3 Mo) | Non précisée (aucune licence) | Dernier push 11/10 00:48 UTC ; 100 commits en 10 h 20 | OK | `domain.txt` 2,26 Mo ; `ip.txt` et `ipfs.txt` quasi vides | Plus large que MetaMask (inclut des domaines non encore dans la liste MM) ; faux positifs possibles, voir `excluded.txt` | Pull toutes les 30 min, diff, intersection/différence avec #1 | PROD (second avis) + TEST |
| 4 | ScamSniffer scam-database | https://github.com/scamsniffer/scam-database (`blacklist/domains.json` 9 Mo, `address.json` 121 Ko, `combined.json` 229 Ko, `all.json` 10 Mo, `blacklist/archive/AAAA-MM-JJ.json` quotidien) | Domaines + ADRESSES, JSON | GPL-3.0 (copyleft : citer, ne pas embarquer dans notre livrable sans réfléchir) | Dernier commit 10/10 04:01 UTC ; archive quotidienne jusqu'au 03/10 (7 jours de délai, annoncé dans le README) ; 1 569 fichiers d'archive depuis 31/05/2022 | OK | 2 530 adresses ; domaines environ 9 Mo ; les archives donnent l'historique jour par jour | Délai volontaire de 7 jours (la version temps réel est payante). Seule source ouverte avec adresses ET datation quotidienne : utile pour mesurer l'âge des contrats | GET du dernier `archive/jour.json` chaque jour ; garder la date d'apparition pour calculer "âge au moment du listing" | PROD (adresses) + TEST + calcul du biais d'âge |
| 5 | ScamSniffer scam-database, issues | https://github.com/scamsniffer/scam-database/issues (API `issues?state=all&per_page=100`) | Signalements communautaires TEXTE : domaine, adresse du contrat, mécanique, parfois volumes | GPL-3.0 (dépôt) ; contenu utilisateur | Plus récent : 08/10/2026 ; 100 issues entre 28/07 et 08/10, soit environ 1,3/jour | OK | 285 ouvertes | Rédigées par des victimes/chasseurs : qualité variable, certaines identifient des victimes à ne pas flaguer (ne jamais recopier des adresses de victimes) | LLM d'extraction (agent "veilleur") : mécanique, adresses drainer vs victime, standard (permit, approve, 7702) | TEST (très bon pour inspiration d'attaques) + VEILLE |
| 6 | ScamSniffer phishing-warning (issues) | https://github.com/scamsniffer/phishing-warning/issues | Rapports d'incidents avec contrats et chaîne d'exécution | idem | Issue #3 du 20/06/2026 ; dépôt peu actif (1 issue ouverte) | OK (via recherche web ; dépôt non scanné en détail) | 1 ouverte | Peu de volume | Lecture à la main une fois | VEILLE (exemple type : Multicall3 + permit EIP-2612) |
| 7 | CryptoScamDB blacklist | https://github.com/CryptoScamDB/blacklist (`data/urls.yaml`) | URLs YAML | Aucune | Dernier commit 28/06/2022 : MORT | OK (fichier 2,1 Mo) | 2,1 Mo | Obsolète depuis 4 ans. Ne pas brancher en prod ; seulement historique/entraînement | Aucune | TEST historique seulement |
| 8 | Chainabuse (TRM) | https://www.chainabuse.com ; API `https://api.chainabuse.com/v0` ; doc https://docs.chainabuse.com | Rapports communautaires (adresse, catégorie, description), JSON | Conditions TRM (usage à vérifier) | NT (pas d'accès) | CLÉ : `GET /v0/reports` répond 401 ; Basic Auth, clé générée depuis un profil (donc compte requis). Non créé | Grand (millions de rapports selon la plateforme) ; chiffre NT | Rapports non vérifiés, bruit élevé, spam | Si Adem/Titouan a déjà un compte : ingestion hebdomadaire d'un échantillon | À défaut, VEILLE seulement |
| 9 | PhishDestroy | https://phishdestroy.io (pages `/domain/<nom>/` + flux "Live Threat Feed") | Domaine + preuves (WHOIS, TLS, VirusTotal, capture), croise MetaMask/SEAL/ScamSniffer | Non précisée | Pages datées du 20/05/2026 ; site et flux visibles | OK (site) ; API NT | NT | Agrégateur : peu de valeur nouvelle, utile pour savoir "listé chez qui" | Consulter à la demande | VEILLE |
| 10 | OpenChain / signatures | https://api.openchain.xyz/signature-database/v1/lookup?function=0x095ea7b3 | Décodage de sélecteurs 4 octets | Ouverte | Vivante (réponse immédiate) | OK (testé : `approve(address,uint256)`) | Très grand | Pas une liste de menaces mais indispensable pour décoder des appels inconnus | Appel direct du produit/harnais | PROD (décodage) |

### 1.2 APIs de réputation et de scan de transaction

| # | Source | URL | Type / format | Licence | Fraîcheur | Accès sans clé | Volume / limite | Biais | Ingestion | Usage |
|---|---|---|---|---|---|---|---|---|---|---|
| 11 | GoPlus Security API | https://api.gopluslabs.io/api/v1/... | Adresse (`address_security/<addr>?chain_id=1`), jeton (`token_security/<chain>`), dapp (`dapp_security?url=`), site (`phishing_site?url=`), approbation (`approval_security/<chain>`) | CGU GoPlus ; usage commercial à vérifier | Réponse en direct | OK, sans clé (testé : 40 appels `address_security` à la suite, tous 200). Mais `dapp_security` et `approval_security` ont renvoyé `code 4029 too many requests` après la rafale | Limite sans clé non documentée (observée : tolère 40 appels en rafale sur l'adresse, refuse vite sur dapp et approval) | Étiquettes (`phishing_activities`, `honeypot_related_address`, `sanctioned`…) : bonnes pour tokens, plus faibles sur drainers très frais. Adresse nulle : tout à "0" | Cache 24 h par adresse ; appeler seulement en cas de doute | PROD (signal tiers) + TEST (étiquettes d'adresses de test) |
| 12 | Blockaid | https://www.blockaid.io (blog, API `api.blockaid.io`) | Scan de tx/signature, JSON | Propriétaire | Blog actif (3,4 Mo de page) ; API NT | CLÉ (`api.blockaid.io/` renvoie 404, pas d'accès public) ; pas de test réalisé | NT | Concurrent direct de notre produit (déjà intégré dans plusieurs wallets) ; article blog = veille | Lecture blog | VEILLE (concurrence) |
| 13 | Webacy | https://developers.webacy.com ; `api.webacy.com/addresses/<addr>` | Risque d'adresse, JSON | Propriétaire | NT | CLÉ/paiement (testé : 402) | NT | Idem | Aucune | VEILLE |
| 14 | Hashdit | https://hashdit.io | NT | NT | NT | INJOIGNABLE depuis ce poste (connexion échouée) | NT | NT | Aucune | Écarté |
| 15 | Forta | https://docs.forta.network ; API GraphQL `https://api.forta.network/graphql` | Alertes de bots détecteurs on-chain, GraphQL | Selon bot | Dépôt `forta-bot-sdk` : dernier push 24/01/2024 ; `starter-kits` : 18/12/2025 (activité faible) | CLÉ (testé : 401) ; la doc actuelle dit "plan payant requis" | NT | Réseau en perte de vitesse (activité des dépôts) ; ne pas dépendre | Si accès : requête alerts par `alertId` ; sinon ignorer | VEILLE (inspiration de bots) |
| 16 | Etherscan labels | https://etherscan.io/labelcloud ; `/accounts/label/phish-hack` | Étiquettes d'adresses | CGU Etherscan (scraping interdit) | NT | BLOQUÉ (403 Cloudflare) ; API V2 : "Missing/Invalid API Key" ; V1 déprécié | NT | Non scrapable | Utiliser les miroirs ouverts (#17) | Écarté en direct |
| 17 | dawsbot/eth-labels (+ MCP `eth-labels-mcp`) | https://github.com/dawsbot/eth-labels | Étiquettes EVM scrapées, JSON/API | MIT | Push 25/09/2026 | OK (GitHub) ; l'API Railway que j'ai essayée a renvoyé 404 (non à jour) | 169 k+ adresses et jetons (selon README) | Étiquettes générales (exchange, bridge, phish) ; pas d'effet | Charger `data/` au besoin | TEST (légitimes réalistes : routeurs, exchanges, bridges) + PROD |
| 18 | Routescan (compatible Etherscan, sans clé) | https://api.routescan.io/v2/network/mainnet/evm/<chainId>/etherscan/api?... | ABI et code source vérifié, JSON | CGU | Réponse en direct | OK, sans clé (testé : `getabi` sur USDT Ethereum, `getsourcecode` sur WAVAX Avalanche C-Chain) | NT | Pas d'étiquettes de menace ; sert à décoder et à vérifier un contrat | Appel direct du harnais | PROD (vérification de code) + TEST |
| 19 | Sourcify | https://sourcify.dev/server/v2/contract/<chainId>/<adresse> | Vérification de contrat (match complet/partiel) | Ouverte | Réponse en direct | OK (testé sur USDT) | Très grand | Un contrat non vérifié est un signal faible mais utile | Appel direct | PROD (signal "contrat non vérifié") |

### 1.3 Incidents, post-mortems et rapports (veille humaine et jeux de cas)

| # | Source | URL | Type / format | Licence | Fraîcheur mesurée | Accès sans clé | Volume | Biais | Ingestion | Usage |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | DefiLlama hacks | https://api.llama.fi/hacks | JSON (date, nom, montant, `technique`, `classification`, chaîne, `source`) | API ouverte (CGU DefiLlama) | Dernier incident : 07/10/2026 (Locus Finance, 18 000 $, Arbitrum) | OK (353 Ko) | 1 299 incidents (2026 : 292 ; 2025 : 148 ; 2024 : 217) | Surtout hacks de PROTOCOLES (contrats), pas phishing de particuliers ; techniques dominantes : contrôle d'accès, manipulation de prix, clés privées | GET quotidien, diff, nouvelle entrée = tâche pour l'agent post-mortem | VEILLE + TEST indirect (familles de menace) |
| 21 | rekt.news | https://rekt.news (pages HTML) ; `rss.xml` et `feed` répondent 500 | Post-mortems longs, HTML | Droits réservés (ne pas recopier) | Article du 08/10/2026 (NEAR Intents, 3,87 M$) | OK (HTML, 28 Ko ; RSS cassé) ; classement `/leaderboard/` OK (300 Ko) | NT | Surtout gros incidents DeFi | Scraper la page d'accueil, titre + date + résumé seulement | VEILLE |
| 22 | SlowMist Hacked | https://hacked.slowmist.io | Base d'incidents (HTML/JS), 2 307 événements, 39,07 Md$ cumulés | Droits réservés | Page vivante ; API publique `/api` renvoie 404 | OK en page (27 Ko) ; pas d'API JSON publique trouvée | 2 307 événements | Idem rekt, avec filtres par écosystème | Scraping léger ; ou flux Medium ci-dessous | VEILLE |
| 23 | SlowMist, blog Medium | https://medium.com/feed/@slowmist | Flux RSS | Droits réservés | Dernier billet 08/10/2026 | OK (RSS, 216 Ko) | NT | Billets techniques sur attaques actuelles (analyses d'EIP-7702, etc.) | Lecture RSS quotidienne | VEILLE (très pertinent) |
| 24 | Revoke.cash exploits | https://revoke.cash/exploits | Liste d'exploits où des approbations ont été utilisées, HTML/JS (SSR, texte visible) | Droits réservés | Entrée du 24/09/2026 (Magic Eden / Limit Break, 2,8 M$) ; "Plus de 355 M$ volés depuis 2020" | OK (824 Ko) | NT | Exactement notre thème : exploits d'APPROBATION. Petit nombre d'entrées | Scraping de la page, extraire nom, date, montant, contrat | TEST + VEILLE (cas "legitime-mais-exploité") |
| 25 | ScamSniffer blog (drops) | https://drops.scamsniffer.io (flux `/feed/`) | Rapports (annuels, mensuels, simulations spoofées) | Droits réservés | Flux OK mais dernier billet du flux en janvier 2026 : les rapports mensuels ne sont plus publiés régulièrement sur ce canal | OK (flux 161 Ko) | Rapports 2024 : 494 M$ de pertes de phishing ; billet "Transaction Simulation Spoofing" (10/01/2025) | À lire : il décrit EXACTEMENT les attaques contre les simulateurs (lien avec 04_evasion_simulateur) | Lecture une fois par menace | VEILLE + TEST |
| 26 | Immunefi | https://immunefi.com (explore, blog) | Programmes de bug bounty, post-mortems | Droits réservés | Site actif ; `/feed/` 404 ; `hack-analysis` 404 | OK (HTML 400 Ko, surtout vitrine) | NT | Peu de signal phishing ; utile pour nouvelles classes de bugs de contrats | Lecture occasionnelle | VEILLE faible |
| 27 | Chainalysis blog | https://blog.chainalysis.com/feed/ | Flux RSS | Droits réservés | Dernier 09/10/2026 | OK | NT | Orienté conformité/crime global | RSS quotidien | VEILLE |
| 28 | Check Point Research | https://research.checkpoint.com/feed/ | Flux RSS (inclut rapports sur drainers) | Droits réservés | Dernier 05/10/2026 | OK (RSS 520 Ko) | NT | Généraliste cyber : filtrer sur "drainer", "wallet", "crypto" | RSS + filtre mots-clés | VEILLE |
| 29 | Group-IB blog (Inferno Drainer) | https://www.group-ib.com/blog/inferno-drainer | Rapport : 16 000+ domaines, 100+ marques imitées, 80 M$ (via ScamSniffer) | Droits réservés | Rapport sur 11/2022-11/2023 (historique) | OK en recherche ; flux `/feed/` non lisible comme RSS | NT | Historique, mais le meilleur résumé du modèle "drainer-as-a-service" | Lecture unique | VEILLE (génère des familles de cas) |
| 30 | CertiK (Skynet, blog) | https://skynet.certik.com ; https://www.certik.com/resources/blog | Scores de projets, billets | Propriétaire | Pages actives (730 Ko) ; pas de RSS (404) ; CertiK Alert sur X (JS) et Telegram `t.me/s/CertiKAlert` (derniers messages affichés en 2021, donc figé) | OK pages, pas de données structurées | NT | Marketing + alertes ; la chaîne Telegram web est périmée | Non prioritaire | VEILLE faible |
| 31 | PeckShield / Cyvers / CertiK Alert sur X | https://x.com/PeckShieldAlert, `/CyversAlerts`, `/CertiKAlert`, `/realScamSniffer`, `/_SEAL_Org` | Fil d'alertes, tweets | CGU X | Pages répondent 200 mais ce sont des coques JavaScript (aucun tweet lisible sans navigateur connecté). Nitter : 410 | BLOQUÉ en pratique (JS/login) ; Telegram `t.me/s/PeckShieldAlert` : dernier message affiché en 2022 | NT | Ces comptes sont rapides en réalité mais inaccessibles sans API payante/navigateur connecté | Humain : Adem/Titouan suit à la main (liste de comptes, §2) ; sinon API X payante | VEILLE humaine |
| 32 | PhishFort blog et GitHub | https://www.phishfort.com/blog ; https://github.com/phishfort | Blog, outils open source | Selon dépôt | Blog actif (386 Ko) ; pas de RSS (404) | OK (pages HTML) | NT | Orienté retrait de sites pour marques ; peu de données brutes ouvertes | Lecture occasionnelle | VEILLE faible |
| 33 | SEAL 911 / SEAL | https://github.com/security-alliance/seal-911 ; https://x.com/_SEAL_Org ; site seal-911.org injoignable depuis ce poste | Organisation d'intervention (Telegram/bot), cadres, `safe-harbor` | Mixte | Dépôts actifs : `seal-911` push 04/10/2026, `frameworks` 06/10/2026, `blocklists` 11/10/2026 | OK (GitHub) ; le canal d'urgence lui-même est privé | NT | Source des blocklists #1 et #3 ; les cas d'urgence ne sont pas publics | Suivre les dépôts, lecture manuelle des frameworks | VEILLE + PROD via #1/#3 |

### 1.4 Standards et surfaces nouvelles

| # | Source | URL | Type / format | Licence | Fraîcheur mesurée | Accès sans clé | Volume | Biais | Ingestion | Usage |
|---|---|---|---|---|---|---|---|---|---|---|
| 34 | Ethereum Magicians (Discourse) | https://ethereum-magicians.org/latest.json ; `/c/eips/5.json` ; `/search.json?q=...` ; `/latest.rss` | Discussions d'EIP/ERC, JSON/RSS | Contenu public (CC0 pour les EIP) | Sujet le plus récent : 10/10/2026 | OK (JSON 52 Ko ; RSS 200 Ko ; recherche OK) | NT | Beaucoup de bruit ; il faut filtrer par mots-clés : "delegation", "7702", "permit", "clear signing", "account abstraction" | Poll toutes les 6 h, filtre mots-clés, LLM résume en "nouvelle surface d'attaque ?" | VEILLE (nouveaux EIP = nouvelles surfaces) |
| 35 | ethereum/ERCs et ethereum/EIPs | https://github.com/ethereum/ERCs (commits) ; https://github.com/ethereum/EIPs ; page https://eips.ethereum.org | Spécifications, Markdown | CC0-1.0 | Dernier commit ERCs 10/10/2026 ; EIPs 09/10/2026 | OK (API GitHub) ; `eips.ethereum.org/rss.xml` renvoie 404 | Flux de commits | Passer par les commits : ERC-7730 (descripteurs de signature lisible) bouge cette semaine, ainsi que 8226, 8167, 7962 | `commits?since=` quotidien, filtre | VEILLE (7730 est directement lié à notre produit) |
| 36 | ethereum/pm (agendas ACD) | https://github.com/ethereum/pm | Agendas de réunions | NOASSERTION | Push 10/10/2026 | OK | NT | Anticipe forks (ex. Glamsterdam/Fusaka suites) | Lecture hebdo | VEILLE |

### 1.5 Forums, réseaux sociaux, canaux d'acteurs

| # | Source | URL | Constat | Accès sans clé | Fraîcheur | Biais | Ingestion | Usage |
|---|---|---|---|---|---|---|---|---|
| 37 | Reddit (r/metamask, r/ethereum, r/CryptoCurrency, r/Scams, r/CryptoScams, r/phishing) | `https://www.reddit.com/r/<sub>/new.rss` et `.json`, `old.reddit.com` | Toutes les variantes testées renvoient 403 "Blocked… network policy" depuis ce poste | BLOQUÉ (testé six sous-forums, RSS et JSON) | n/a | Seule voie : l'API OAuth officielle (clé, donc non créée ici) ou un navigateur connecté | Ne pas bâtir la boucle dessus. En cas de besoin : veille humaine ; r/metamask est souvent en avance de 1-3 jours sur les listes pour les arnaques "support" | Veille humaine |
| 38 | X (comptes d'alerte) : @PeckShieldAlert, @CyversAlerts, @CertiKAlert, @realScamSniffer, @_SEAL_Org, @zachxbt, @MetaMask… | https://x.com/<compte> | Coque JavaScript, aucun contenu | BLOQUÉ en pratique | n/a | Source très rapide, mais pas ingérable sans API payante ; nitter mort (410) | Suivi humain | Veille humaine |
| 39 | Telegram (canaux publics `t.me/s/<nom>`) | https://t.me/s/scamsniffer ; https://t.me/s/whale_alert_io | La prévisualisation web fonctionne pour certains canaux : `whale_alert_io` est frais (10-11/10), `scamsniffer` affiche seulement l'en-tête (7 716 membres), `PeckShieldAlert` et `CertiKAlert` affichent des messages de 2021-2022 | OK partiel | Variable | Les canaux de vendeurs de drainers (Inferno, Angel, Pink, Monkey, Venom, Ace) sont privés/supprimés et ne doivent PAS être infiltrés pour ce projet (aucune action contre système réel, pas d'inscription). Contenus connus par les rapports publiés (#29, Check Point #28, ScamSniffer) | On s'appuie sur les rapports publiés, jamais sur l'accès direct | VEILLE par rapports |
| 40 | Discord, forums de vendeurs de drainers | n/a | Pas consultés : exigent un compte et relèvent d'une infiltration | n/a | n/a | n/a | Exclus par la règle du hackathon | Exclu |
| 41 | GitHub, dépôts de "drainers" | Recherche `api.github.com/search/repositories?q=wallet+drainer` | Résultats mis à jour aujourd'hui (ex. dépôts "Solana-Drainer-Tool", "TRX-Drainer-Tool") mais ce sont en grande majorité des APPÂTS pour apprentis fraudeurs (le pirate est visé par un malware dans l'outil), pas du vrai code de drainer. Ne pas cloner, ne pas exécuter. Lecture du README seulement, via l'API | OK (API de recherche, lecture seule) | Mises à jour du jour | Bruit élevé, très peu de signal | Non intégré. Au mieux : lire à la main 1-2 README pour des idées de noms de fonctions/sélecteurs | Écarté sauf veille |
| 42 | SunWeb3Sec/DeFiHackLabs | https://github.com/SunWeb3Sec/DeFiHackLabs | Reproductions Foundry d'exploits réels (PoC) | Apache-2.0 | Push 08/10/2026 | OK | Centaines de PoC | Hacks de protocole, peu de phishing de signature, mais bon pour les attaques "approbation exploitée" | Lire les PoC pertinents (approvals) et les convertir en cas sur fork | TEST |

### 1.6 Jeux étiquetés pour le banc (benchmark)

| # | Source | URL | Contenu | Licence | Accès sans clé | Taille | Biais / limite | Usage |
|---|---|---|---|---|---|---|---|---|
| 43 | XBlock, Ethereum Phishing Transaction Network (Kaggle) | https://www.kaggle.com/datasets/xblock/ethereum-phishing-transaction-network | Graphe de transactions, comptes de phishing étiquetés | Inconnue (champ "Unknown") | La liste Kaggle API publique fonctionne ; le téléchargement exige un compte Kaggle (non testé) | 410 Mo | Époque 2017-2020 : avant permit/Permit2/7702 ; mesure l'adresse, pas l'effet | Benchmark d'adresse seulement, pas d'effet |
| 44 | Kaggle, Ethereum Fraud Detection (vagifa) | https://www.kaggle.com/datasets/vagifa/ethereum-fraud-detection | Comptes frauduleux, caractéristiques agrégées | ODbL | idem | NT | Idem, tabulaire sans transactions | Écarté pour notre produit |
| 45 | Kaggle, Eth-PSD (arkantaha) | https://www.kaggle.com/datasets/arkantaha/ethereum-phishing-scams-dataset-ethpsd | Scams de phishing, dataset | "Other" | idem | 14,9 Mo | Idem | Benchmark d'adresse |
| 46 | Kaggle, Cryptocurrency Scam Dataset (zongaobian) | https://www.kaggle.com/datasets/zongaobian/cryptocurrency-scam-dataset | Scams cryptos | Apache 2.0 | idem | NT | Contenu NT | À regarder |
| 47 | Kaggle, CryptoScamDB: Scam URIs | https://www.kaggle.com/datasets/yaseenabdulghany/cryptoscamdb-scam-uris-and-details | URIs de scams | CC0 | idem | NT | Copie de #7, donc âgée | Historique |
| 48 | Kaggle, All NFT Rug-Pulls and Scams | https://www.kaggle.com/datasets/johnny1994/all-nft-rugpulls-and-scams | NFT rug pulls | CC0 | idem | NT | NFT 2021-2023 | Cas NFT |
| 49 | Kaggle, Smart Contract Vulnerability Dataset | https://www.kaggle.com/datasets/mdahhad0/smart-contract-vulnerability-dataset | Contrats vulnérables étiquetés | Apache 2.0 | idem | NT | Vulnérabilités de code, pas intention vs effet | Écarté pour notre produit |
| 50 | Kaggle, Ethereum Fraud Dataset by Activity | https://www.kaggle.com/datasets/fesevu/ethereum-fraud-dataset-by-activity | Activité d'adresses frauduleuses | CC BY 4.0 | idem | 92 Go (!) | Trop gros | Écarté |
| 51 | Papiers académiques (non téléchargés) | arXiv / ACM : détection de drainers, ERC-20 approval scams, rug pulls | Méthodes et parfois jeux de données | Variable | Accès par recherche web ; non testé en détail | n/a | À citer comme références dans la fiche de défense | VEILLE |

Aucun jeu public étiqueté ne contient "intention déclarée vs effet réel". Donc : les jeux Kaggle/XBlock servent à comparer des étiquettes d'ADRESSES, pas à évaluer notre mécanisme. Notre jeu de test doit être CONSTRUIT : mécaniques tirées des sources #5, #6, #24, #34, #35, #42 + légitimes réalistes ci-dessous.

### 1.7 Légitimes réalistes (les cas durs sont ici, pas dans les listes noires)

| Source | URL | Usage |
|---|---|---|
| Routescan / Avalanche C-Chain, blocs récents lus en RPC public | `https://api.avax-test.network/ext/bc/C/rpc` (Fuji, testé : `eth_blockNumber` répond) ; `https://ethereum-rpc.publicnode.com` (testé : répond) | Rejouer des transactions publiques réelles de swaps et dépôts : légitimes naturels à grande échelle, sans donnée personnelle |
| dawsbot/eth-labels (#17) | Adresses de routeurs, bridges, exchanges | Sélectionner des destinataires légitimes connus |
| Whitelist MetaMask (#1, 58 entrées) | idem | Domaines légitimes de référence |
| Revoke.cash exploits (#24) | Cas "légitime mais exploité" | Cas durs (une approbation vers un protocole réel, mais défaillant) |
| Uniswap/permit2 (dépôt MIT) | https://github.com/Uniswap/permit2 | Légitimes Permit2 vrais |

## 2. Limites constatées pendant les tests (à connaître)

- Reddit : 403 sur tout (RSS, JSON, old.reddit) depuis ce poste. X : coque JavaScript. Nitter : 410. Telegram web : OK pour certains canaux mais les canaux d'alerte de sécurité affichent des messages anciens.
- Etherscan : 403 Cloudflare sur les pages d'étiquettes ; API V2 exige une clé ; V1 déprécié.
- Chainabuse, Forta : clé requise. Blockaid, Webacy : clé/paiement. Hashdit : injoignable.
- GoPlus : sans clé, fonctionne sur les endpoints adresse/jeton/site ; limitation de débit (code 4029) sur dapp et approval après rafale.
- rekt.news : RSS cassé (500) ; HTML OK.
- Les dépôts GitHub dont le nom contient "drainer" sont majoritairement des appâts. Ne rien exécuter.
- Avertissement de rédaction : les chiffres "volume" notés NT n'ont pas été mesurés, ne pas les citer au jury.

## 3. Plan d'ingestion pour la boucle

Principe : un agent "VEILLEUR" par famille de source, qui ne produit JAMAIS de verdict. Il ne produit que des CAS DE TEST au format de la boucle (Intent + Effects + étiquette de vérité terrain), puis le harnais les rejoue. Les adresses fraîches sont régénérées sur fork (jamais d'adresse réelle copiée dans le jeu de test : le Gardien rejette les constantes copiées).

### 3.1 Format du cas de test (proposition, à valider avec Adem)

```
{
  "case_id": "veille-<source>-<hash8>",
  "source": {"id": "scamsniffer-issue", "url": "...", "seen_at": "ISO", "age_days_at_listing": 3},
  "family": "permit | permit2 | approve | setApprovalForAll | 7702 | multicall | delegatecall | address_poisoning | fake_support | other",
  "intent": {"declared": "texte de l'utilisateur ou null", "arm": "none | honest | lying"},
  "effects": [ { "kind": "grant_allowance | transfer | delegation | ...", "asset": "...", "recipient_role": "unknown_new | known_contract", "amount": "unlimited | exact" } ],
  "ground_truth": "malicious | legit | hard_legit",
  "split": "dev | validation | frozen_candidate",
  "provenance": "mecanique tiree de <source> ; adresses regenerees sur fork"
}
```

### 3.2 Table source → agent → cas de test

| Source (n°) | Fréquence | Agent | Ce qu'il fait | Cas de test produit |
|---|---|---|---|---|
| MetaMask + SEAL blocklists (#1, #3) | 30 min (git pull) | Veilleur-listes | Calcule le diff de domaines ajoutés. Pour chaque nouveau domaine : pas de visite (aucune action contre un système réel) ; il enregistre date + domaine dans un fichier d'âge, et regroupe par motifs (marque imitée, hébergeur) | Métrique : âge, volume par jour ; sert de signal "doublon" et à calculer le biais d'âge. Pas de cas d'effet |
| ScamSniffer archive quotidienne + `address.json` (#4) | 1/jour | Veilleur-adresses | Récupère le dernier fichier d'archive, extrait adresses, sépare ancien/nouveau, étiquette `age_days_at_listing` | Table de calibration "adresse connue mauvaise" ; adresses utilisées seulement pour le test du signal de réputation, pas pour apprendre |
| ScamSniffer issues + MetaMask issues (#5, #6, #2) | 6 h | Veilleur-incidents | LLM lit l'issue, extrait la MÉCANIQUE (standard, séquence, montant, batching) et écarte les adresses de victimes ; produit un "scénario d'attaque" en texte | Un scénario → l'agent Attaquant le traduit en N cas sur fork avec adresses fraîches, famille et bras d'intention variés |
| Revoke.cash exploits + DefiLlama hacks (#24, #20) | 1/jour | Veilleur-protocoles | Détecte nouvelles entrées ; pour celles impliquant approbations, produit "protocole légitime connu qui devient dangereux" | Cas `hard_legit` ou cas "signal transverse" (le contrat légitime exploité) pour tester les faux négatifs raisonnables |
| SlowMist Medium, Check Point, Chainalysis, rekt (#23, #28, #27, #21) | 1/jour | Veilleur-rapports | RSS + filtre mots-clés (drainer, EIP-7702, permit, delegat, approval, poisoning) ; résumé de 10 lignes | Pas de cas direct ; alimente la liste "familles manquantes" que lisent les juges |
| Magicians + commits ERCs/EIPs (#34, #35) | 6 h | Veilleur-standards | Détecte nouveaux EIP touchant signatures, comptes, délégations, simulation ; LLM note "nouvelle surface d'attaque ? oui/non/pourquoi" | Alertes pour l'ajout d'une famille au jeu (ex. ERC-7730 : un descripteur trompeur) |
| GoPlus (#11) | À la demande | Harnais | Pour chaque cas, option : appel adresse destination, mise en cache 24 h | Comparaison "notre verdict vs réputation tierce" : mesure l'apport de l'effet décodé par rapport à la simple réputation |
| Sourcify / Routescan / OpenChain (#10, #18, #19) | À la demande | Produit + harnais | Décodage, vérification de contrat | Champs `effects` plus riches (ABI vérifiée, sélecteur décodé) |
| RPC public Avalanche / Ethereum (§1.7) | Continu | Générateur-légitime | Échantillonne des transactions réelles de swaps/dépôts/transferts, vérifie le destinataire dans eth-labels et la whitelist ; étiquette `legit` | Légitimes naturels pour mesurer FP critical ; les `hard_legit` sont sélectionnés (Permit2 réel, approbation illimitée à un routeur connu) |
| DeFiHackLabs (#42) | 1/semaine | Veilleur-PoC | Lit les nouveaux PoC liés à `approve`/`permit` | Scénarios sur fork |

Règle de séparation DEV / VALIDATION / GELÉ : les cas issus de sources de la semaine du début vont en DEV ; une famille entière (ex. 7702 ou Multicall3 + permit) est retirée du DEV et mise en VALIDATION ; le jeu gelé est construit une fois à partir d'incidents postérieurs à une date donnée (les cas des dernières 24 h avant le palier), hash publié avant.

### 3.3 Cadence quotidienne proposée

1. 30 min : listes #1 et #3, diff.
2. 6 h : issues #5/#2, Magicians #34/#35 (limite GitHub sans jeton : 60 requêtes/h, suffit).
3. 1/jour : ScamSniffer archive #4, DefiLlama #20, Revoke #24, RSS #23/#28/#27.
4. 1/semaine : relecture humaine de 10 cas (échantillon), vérification des FP/FN suspects.

Coût : tout est GET public sans clé, donc 0 € ; le seul coût variable est le LLM d'extraction (Workers AI ou modèle Titouan). Garder les sorties dans un dossier séparé du jeu gelé.

## 4. Top 10 des sources à brancher d'abord

Critère : fraîcheur mesurée × accès sans clé testé × utilité pour la boucle × licence/risque.

1. ScamSniffer scam-database, issues (#5) : mécaniques d'attaque en texte, quasi quotidiennes (1,3/jour), sans clé.
2. ScamSniffer scam-database, archive quotidienne et adresses (#4) : seule source ouverte avec adresses et date par jour, donne le biais d'âge. Licence GPL-3.0 : ne pas copier dans le livrable, citer.
3. MetaMask eth-phishing-detect (#1) : la liste que la cible applique déjà ; commits toutes les 7 minutes ; permet de ne pas rejouer ce que MetaMask bloque déjà.
4. SEAL blocklists (#3) : même rythme, plus large ; sert de second avis et d'indicateur d'avance sur MetaMask.
5. Revoke.cash exploits (#24) : exactement la classe "approbation exploitée" ; peu de volume mais très pertinent pour les cas durs.
6. DefiLlama hacks (#20) : JSON propre, 1 299 incidents, dernier hier ; pour la veille sur techniques.
7. Ethereum Magicians + commits ERCs (#34, #35) : détecte les nouvelles surfaces (7702, 7730, abstraction de compte) avant qu'elles soient exploitées.
8. SlowMist Medium + Check Point RSS (#23, #28) : analyses de nouvelles familles (EIP-7702 drainers) ; RSS fiable.
9. GoPlus (#11), Sourcify (#19), Routescan (#18), OpenChain (#10) : bloc "signal tiers et décodage" ; tous sans clé, testés.
10. RPC public Avalanche/Ethereum + eth-labels (§1.7, #17) : générateur de légitimes réalistes, indispensable pour mesurer les faux positifs critiques, car aucune source de menace ne fournit de légitimes.

Hors Top 10 mais à garder : DeFiHackLabs (#42) pour les PoC, Group-IB (#29) pour le modèle drainer-as-a-service, Chainabuse (#8) si un compte existe déjà.

## 5. Points d'alerte pour la suite

- Ne jamais recopier une adresse de victime (certaines issues ScamSniffer en contiennent, avec la mention "do not flag").
- Aucune donnée personnelle réelle : les issues peuvent citer des noms et des détails médicaux ; l'agent veilleur doit les supprimer avant stockage (garder uniquement mécanisme, standard, montants arrondis).
- Les listes dites "ouvertes" n'ont pas toutes de licence claire (MetaMask et SEAL : aucune/NOASSERTION). Pour le jury : on les CONSULTE, on ne les redistribue pas.
- GPL-3.0 (ScamSniffer) : si nous embarquons ses données dans le dépôt, le dépôt doit être compatible. Safer : télécharger à la volée dans `.cache/` gitignoré.
- Le "défaut de fraîcheur" doit devenir une métrique publiée : pour chaque entrée, âge de l'adresse/contrat au moment du listing ; la fiche de défense peut citer le 1,2 % de contrats jeunes de Titouan comme limite connue de toute approche par liste.
