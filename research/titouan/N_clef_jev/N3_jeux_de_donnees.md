# N3 Jeux de données publics pour classifieur de menaces de portefeuille

Étiquettes : [P] page principale lue, [S] snippet de recherche seul, [V] vérifié sur la page source du jeu. "Non trouvé" = absent des sources consultées. Rien n'a été téléchargé, aucun lien de phishing visité. Date de consultation : 2026-10-11.

## Résumé (8 lignes)
1. Le meilleur jeu de domaines crypto réutilisable est ScamSniffer scam-database (GPL-3.0, JSON, 7 jours de retard) [V]. https://github.com/scamsniffer/scam-database
2. MetaMask eth-phishing-detect est la référence de liste de blocage, mais la licence n'a pas été identifiée [V]. https://github.com/MetaMask/eth-phishing-detect
3. Forta labelled-datasets (MIT) donne des adresses de phishing et contrats malveillants en CSV, mais les étiquettes viennent d'Etherscan donc bruitées [V]. https://github.com/forta-network/labelled-datasets
4. Seul grand jeu de pages avec étiquettes propres : PhreshPhish, 666 315 pages HTML, CC BY 4.0, mais HTML et non captures [V]. https://huggingface.co/datasets/phreshphish/phreshphish
5. Pour les captures d'écran, il n'existe que des petits jeux (2 759 à 4 428 échantillons) sur IEEE DataPort ou GitHub [S].
6. Transactions malveillantes : PTXPHISH (5 000 transactions, étiquettes manuelles) et DeFiHackLabs (Apache-2.0, reproductions Foundry, pas un jeu tabulaire) [S][V].
7. Messages d'arnaque : jeux SMS génériques (UCI, CC BY 4.0). Aucun jeu public de faux support Telegram crypto trouvé.
8. Manque principal : un jeu de test indépendant, daté, avec étiquettes humaines, couvrant drainers, signatures Permit et faux support.

## Tableau des jeux

| Jeu | Contenu | Taille | Dernière MàJ | Licence | Format | Accès sans clé | Qualité / risques |
|---|---|---|---|---|---|---|---|
| ScamSniffer scam-database [V] https://github.com/scamsniffer/scam-database | domaines et adresses de phishing | 1 442 commits; nombre d'entrées non trouvé (le site annonce plus de 258K au total, base payante incluse [S] https://scamsniffer.io/) | rafraîchi toutes les 24 h, retard de 7 jours en open source | GPL-3.0 (copyleft, attention aux modèles dérivés) | JSON (domains.json, address.json) | oui | positifs seulement, pas de négatifs; faux positifs possibles; domaines actifs dangereux |
| MetaMask eth-phishing-detect [V] https://github.com/MetaMask/eth-phishing-detect | domaines malveillants Web3 (blocklist, allowlist) | 255 457 commits; nombre d'entrées non trouvé | non trouvée | non trouvée (fichier LICENSE présent, type non lu) | config.json, listes texte | oui | liste utilisée en production, donc sélection biaisée vers ce que MetaMask détecte; domaines actifs |
| Forta labelled-datasets [V] https://github.com/forta-network/labelled-datasets | malicious_smart_contracts, phishing_scams, etherscan_malicious_labels | tailles non trouvées | non trouvée (14 commits) | MIT | CSV par chaîne | oui | étiquettes Etherscan reprises, bruit hérité; source indiquée par ligne |
| Forta Scam Detector (flux) [S] https://docs.forta.network/en/latest/scam-detector-bot/ | adresses et URL signalées par ML | non trouvée | continu | non trouvée | API Labels | non vérifié | faux positifs corrigés en un jour ouvré selon Forta; sortie d'un modèle, risque de circularité |
| CryptoScamDB blacklist [V] https://github.com/CryptoScamDB/blacklist | URLs et profils Twitter malveillants | 577 commits | non trouvée | non trouvée | dossier data, format non lu | oui | projet ancien, activité actuelle non vérifiée; liens actifs |
| OpenPhish community feed [V] https://github.com/openphish/public_feed | URLs de phishing générales | non trouvée | toutes les 12 h | usage non commercial, conditions sur openphish.com/terms.html | feed.txt | oui | pas spécifique crypto; réutilisation restreinte |
| PhishTank [S] https://phishunt.io/vs/phishtank/ (page d'un concurrent) | URLs de phishing vérifiées par la communauté | non trouvée | toutes les 1 à 6 h selon source | "custom, attribution" selon un concurrent, à confirmer | CSV | inscription recommandée pour éviter les limites | pas spécifique crypto; vérification par vote |
| PhreshPhish [V] https://huggingface.co/datasets/phreshphish/phreshphish | pages web (HTML, URL, marque ciblée, date) | 666 315 lignes, 36,6 Go; 335 marques; 52 langues | v1.0.1 du 2026-02-07 | CC BY 4.0, usage anti-phishing seulement | Parquet | oui, public | meilleur jeu daté avec splits train/test et benchmarks à faible taux de base; HTML malveillant à ne pas exécuter; pas de captures |
| Phishing Screenshots Dataset [S] https://ieee-dataport.org/documents/phishing-screenshots-dataset | captures | 2 759 (1 443 phishing, 1 316 légitimes) | non trouvée | non trouvée | images + vecteurs | non vérifié (IEEE DataPort) | petit; non crypto |
| PhishVisNet [S] https://ieee-dataport.org/documents/phishvisnet-multimodal-visual-structural-dataset-advanced-phishing-website-detection | captures, logos, HTML, DOM | 4 428 | non trouvée | recherche et éducation seulement | multimodal | non vérifié | petit; non crypto |
| Phish-IRIS [S] https://web.cs.hacettepe.edu.tr/~selman/phish-iris-dataset/ | captures multi-classes (marques) | 1 313 train, 1 539 test | non trouvée | non trouvée | images | non vérifié | petit, ancien |
| PhishIntentionLLM [S] https://arxiv.org/pdf/2507.15419 | environ 2 000 sites avec captures et intention | environ 2K | 2025 | non trouvée | GitHub | non vérifié | utile pour étiqueter l'intention (vol d'identifiants) |
| PTXPHISH [S] https://arxiv.org/pdf/2409.02386 | transactions de phishing sur Ethereum | 5 000 transactions | 2024 | non trouvée | dépôt GitHub cité, lien non vérifié | non vérifié | étiquettes par deux experts, donc plus propres; positifs seulement |
| Étude contrats de phishing (ACM 2025) [S] source exacte non trouvée | contrats de phishing | 37 654 contrats (déc. 2022 à janv. 2025) | 2025 | non trouvée | non trouvé | non trouvé | étendu par simulation, bruit probable |
| NDSS drainclog (NFT) [S] https://www.ndss-symposium.org/ndss-paper/drainclog-detecting-rogue-accounts-with-illegally-obtained-nfts-using-classifiers-learned-on-graphs | comptes drainers NFT | 1 135 comptes, 127M transactions NFT | 2022 | non trouvée | non trouvé | non trouvé | étiquettes de cinq sources |
| Address poisoning, USENIX Sec. 2025 [S] https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya | mesure sur Ethereum et BSC | 270M attaques, 6 633 incidents | 2025 | non trouvée | publication de jeu non trouvée | non trouvé | l'article est lisible, la publication des données n'est pas confirmée |
| DeFiHackLabs [V] https://github.com/SunWeb3Sec/DeFiHackLabs | reproductions d'exploits Foundry | 3 974 commits; nombre d'incidents non trouvé | non trouvée | Apache-2.0 | code Solidity, pas de table | oui | surtout exploits de protocoles, peu de phishing de portefeuille |
| GoPlus Security API [S] https://gopluslabs.io/security-api | adresses malveillantes | API, pas un jeu | continu | API, conditions non lues | JSON | offre gratuite (150K CU/mois) selon la page; clé probablement requise, non vérifié | boîte noire, sert de témoin, pas de vérité terrain |
| Chainabuse [S] https://docs.trmlabs.com/guides/chainabuse/getting-started-2-1.md | signalements de victimes | non trouvée | continu | non trouvée | API | non (accès partenaire annoncé) | signalements non vérifiés, bruit élevé, données personnelles possibles |
| Chainalysis sanctions API [S] https://financefeeds.com/chainalysis-announces-sanctions-screening-tools-free-charge-amid-war/ | adresses sanctionnées | non trouvée | non trouvée | non trouvée | API | gratuité actuelle non confirmée | sanctions, pas phishing |
| Etherscan labels [S] https://docs.etherscan.io/metadata-api | étiquettes d'adresses (phish-hack, exploit) | non trouvée | continu | Etherscan API Terms | API, CSV entreprise | non (offre payante pour labels, sources discordantes) | ne pas scraper sans lire les conditions |
| hildobby (Dune) | labels d'adresses | non trouvé | non trouvé | non trouvé | non trouvé | non trouvé | recherche infructueuse |
| UCI SMS Spam Collection [V] https://archive.ics.uci.edu/dataset/228/sms+spam+collection | SMS spam | 5 574 (environ 747 spam) | 2012 | CC BY 4.0 | texte | oui | ancien, hors crypto, numéros de téléphone présents |
| Shade63/scam-classification-multiclass [S] https://huggingface.co/datasets/Shade63/scam-classification-multiclass | SMS/e-mails d'arnaque | environ 14 000 lignes | non trouvée | non trouvée | HF | oui | centré Inde, catégorie fraude crypto |
| TGDataset (Telegram) [S] https://arxiv.org/pdf/2111.13530 | canaux Telegram, dont arnaques | plus de 35 000 canaux | 2021 | non trouvée | non trouvé | non trouvé | niveau canal, présence de texte de messages non confirmée; données personnelles |
| Faux support Telegram crypto | non trouvé | non trouvé | non trouvé | non trouvé | non trouvé | non trouvé | lacune |

## Plan d'évaluation honnête

Principe : séparer par temps, par source et par entité. Une séparation aléatoire gonflerait les scores.

1. Entraînement domaines et pages : PhreshPhish train (avant une date T) plus ScamSniffer et Forta jusqu'à T. Négatifs : PhreshPhish benign, plus des dApps légitimes réelles (liste à constituer, non trouvée).
2. Test principal : PhreshPhish test et ses benchmarks à faible taux de base (5e-4 à 5e-2), car le vrai taux de menace est faible. Rapporter la précision à faible taux de faux positifs, pas l'exactitude globale.
3. Test crypto indépendant : domaines MetaMask apparus après T, jamais présents dans ScamSniffer ni Forta. Gelé et daté.
4. Transactions : entraîner sur une partie de PTXPHISH et d'adresses Forta, tester sur une période postérieure. Négatifs : transactions bénignes échantillonnées sur la même période et les mêmes contrats pour éviter un raccourci sur le temps.
5. Messages : UCI et jeux HF pour le style SMS, à traiter comme indice faible. Ne pas prétendre couvrir le faux support Telegram.

Contrôle des fuites :
- Dédoublonner par domaine enregistrable (eTLD+1), par hachage de page et par adresse, entre tous les jeux.
- Regrouper par marque ciblée et par kit de phishing, et garder des marques entières hors entraînement.
- Regrouper les adresses par entité (déployeur, cluster de financement) avant de couper.
- Les listes ScamSniffer, MetaMask, Forta et Etherscan se recopient probablement entre elles. Mesurer le recouvrement avant de les compter comme sources indépendantes.
- Ne jamais utiliser GoPlus ou Forta Scam Detector comme étiquette de test s'ils servent aussi de caractéristique.
- Ne pas évaluer sur la liste qui a produit l'étiquette d'entraînement (circularité).

Bruit d'étiquettes : échantillonner 200 éléments par source et les relire à la main pour estimer le taux d'erreur. Aucun taux publié n'a été trouvé dans les sources consultées.

Risques à respecter : liens actifs (ne jamais ouvrir, manipuler en texte), HTML malveillant (ne pas exécuter), numéros de téléphone et identifiants dans les messages et signalements, licences : GPL-3.0 pour ScamSniffer, usage non commercial pour OpenPhish, usage anti-phishing pour PhreshPhish.

Ce qui manque :
- Captures d'écran de faux sites crypto (dApps, faux connecteurs de portefeuille) en grand volume avec licence claire.
- Négatifs réalistes : vraies dApps et leurs pages d'approbation.
- Signatures hors chaîne (Permit, Permit2, setApprovalForAll) étiquetées.
- Messages de faux support Telegram et X.
- Un jeu de test gelé avec double relecture humaine.

Limites de cette recherche : environ 22 appels web utilisés; plusieurs licences, tailles et dates non trouvées; les pages [S] n'ont pas été relues à la source.
