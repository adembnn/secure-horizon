# Dossier de décision Sentinelle (10 oct. 2026, ~23h45)

> Sources : `research/market/segments_acheteurs.md`, `prix_et_traction.md`, `exchanges_adoptabilite.md`, `research/cap/jury_aveugle_2315.md`, `research/tracks/T1_P4_*`. Les chiffres [V] viennent d'éditeurs, les « calc. » sont des calculs à partir de chiffres publiés.

## Correction de cap
Recommander d'abandonner les exchanges était **une erreur**, faute de données. Les chiffres disent l'inverse :
- les exchanges et les CASP portent l'essentiel des pertes et des budgets ;
- deux chemins existent pour les équiper **sans migrer leurs fonds**.

## 1. L'idée en une phrase
Un contrôle des sorties d'argent **indépendant du circuit qui les approuve**. Quand serveurs, signataires ou interface sont piratés, une politique qu'ils ne peuvent pas lever refuse les sorties illégitimes. Le dossier DORA est prêt, chaque fait relié à sa transaction.

## 2. Le problème, en chiffres
| Fait | Chiffre | Source |
|---|---|---|
| Part des pertes du S1 2026 venant des clés, de la signature et de l'infrastructure | ~76 %, pour ~15 % des incidents | TRM Labs [S] |
| Vols 2025 | > 3,4 Md$, dont Bybit 1,5 Md$ | Chainalysis [P] |
| Vols 2026 au 8 sept. | 1,73 Md$ | TRM [S] |
| Pertes CEX/CASP 2025-2026 par circuit d'approbation | ~2,1 Md$ listés : Bybit 1,44 Md$, Bitget 387,5 M$, Phemex 73 M$, BtcTurk 52 M$… | calc., segments_acheteurs |
| Pertes protocoles/DAO 2026 | ~640 M$ : Drift 285, KelpDAO 290, AFX 24 | idem |
| Fonds récupérés | 0,08 % chez Bitget, au bout d'environ 1 jour | Decrypt [S] |
| Rejeu Bitget Avalanche | alerte possible au 1er bloc ; 11 M$ encore présents ; 8,2 M$ partis 98 min plus tard | lecture on-chain [P] |
| Obligation | Déclaration DORA ≤ 4 h après classification ; délais « rarement respectés » (ACPR-AMF) | RTS 2025/301, Forvis Mazars [S] |

**Niche ?** Non. C'est le premier poste de pertes crypto en 2025 comme en 2026.

## 3. Qui est le client, et paie-t-il ?
| Segment | Taille | Pertes 2025-26 | Paie déjà ? | Peut nous adopter sans migrer ? |
|---|---|---|---|---|
| **Exchanges et CASP** | 158 CEX ; 321 à 362 CASP UE (36 FR) ; 225 Md$ de réserves sur le top 12 | **~2,1 Md$** | Oui, le plus : Blockaid ~150 k$/an, Chainalysis ~175 k$, Fireblocks ~39 k$ (médianes Vendr [S]) | **Oui, si Safe** (Bybit et WazirX en avaient un) via un Guard. **Oui, si Fireblocks ou BitGo** via leur callback avant signature, multi-chaînes (BTC, XRP, TRX, ZEC, SOL, EVM…). **Non**, si garde 100 % maison (cas Bitget probable) : surveillance + dossier seulement |
| **Protocoles et DAO** | Safe : « 60 Md$+ sécurisés » [V] | **~640 M$** | Oui, mais peu et lentement : Balancer paie Hypernative 80 k USDC pour 2025-26 [P] | Oui, via le Guard Safe |
| Émetteurs RWA et stablecoins | 39,2 Md$ de RWA ; 1,75 Md$ sur Avalanche | Resolv 24,5 M$ ; aucun vol d'émetteur régulé | Inconnu | Oui, via contrats |
| Entreprises qui détiennent de la crypto | ~214 ; 189 Md$, très concentré | Aucune perte trouvée | Inconnu | Via custodian |

**Conclusion** :
- Les **exchanges et CASP régulés** sont la cible n°1 : le plus de pertes, l'obligation DORA, les plus gros budgets.
- Les **protocoles et DAO** sont la cible n°2.
- Les RWA et les entreprises détentrices ne sont pas une douleur prouvée aujourd'hui.

Fourchettes indicatives, nos hypothèses et pas des devis : CASP 40 à 150 k$/an, 100 à 250 k$ avec le dossier DORA ; protocole 15 à 60 k$/an.

## 4. Ce qui existe déjà, et ce qu'on fait différemment
| Existant | Ce qu'il fait | Où il s'arrête |
|---|---|---|
| Hypernative (Guardian, Safe Shield) | Détecte, met en pause, plafonne via un Guard Safe | Pas de preuve de demande. Pas de dossier réglementaire. Pas de logique de callback custodian trouvée |
| Fireblocks policy engine, BitGo policies | Règles de plafond et de liste blanche dans la garde | Les règles sont écrites par l'admin, que le pirate peut contrôler, et font confiance aux données du backend |
| Blockaid, Chainalysis, TRM | Scan de transaction, réputation d'adresse | Ne bloquent pas un retrait « valide » vers une adresse propre |
| ServiceNow DRIR, OneTrust | Workflow DORA | Saisie manuelle, aucune donnée on-chain |

**Notre différence** : une seule politique, hors du contrôle du circuit d'approbation, appliquée au bon endroit selon le client. Elle a trois propriétés :
1. **Elle ne peut que resserrer.** La relever exige 2 gardiens sur 3 plus un délai, par construction.
2. **Elle peut exiger la preuve d'une demande réelle** : demande client signée, ou ordre interne signé hors du backend.
3. **Elle produit la preuve.** Chaque décision est journalisée et ancrée, et le dossier DORA en sort.

Selon notre recherche, aucun acteur ne fournit aujourd'hui la logique du callback Fireblocks/BitGo comme service tiers (exchanges_adoptabilite §3). C'est un espace libre, à notre connaissance.

## 5. Le produit est la démo (deux points d'application réels, un moteur)
1. **Safe sur Fuji** : vrai Safe 1.5 avec notre Guard et notre Module Guard. Le pirate qui contrôle les signataires tente un retrait illégitime, puis d'activer un module, puis de relever le plafond. Les trois sont refusés, visibles sur Snowtrace.
2. **Serveur de politique au format Fireblocks/BitGo** : la même politique refuse le même retrait, sur une transaction d'une autre chaîne. On montre ainsi le multi-chaînes sans migration.
3. **Surveillance** : rejeu chiffré de Bitget, alertes réelles (téléphone, chat, ticket), dossier DORA rempli dans le XLSX officiel de l'AMF.

Tout cela est déjà prouvé en local, connecteur par connecteur (`research/poc/connectors/`). Il reste à l'assembler.

## 6. Comment on utilise nos outils
- **Avalanche Fuji** : le vrai Safe déployé via la singleton factory présente sur Fuji ; ancrage des preuves ; flux temps réel.
- **Chainlink** : prix réel AVAX/USD pour valoriser les sorties.
- **OpenZeppelin, Safe 1.5, format Fireblocks/BitGo** : on se branche sur ce que les clients utilisent déjà.
- **ntfy, Mattermost, Loki, Gitea** : alertes dans de vrais outils.
- **XLSX AMF** : le vrai formulaire réglementaire.
- **AWS Bedrock** : les workers qui écrivent le code.

## 7. Ce que j'abandonne, et pourquoi
| Abandonné | Pourquoi (chiffre ou fait) |
|---|---|
| « Le client migre ses fonds dans notre coffre » comme modèle principal | Aucun CASP ne le fera (8/8 juges). Inutile : Safe et les callbacks custodian permettent de s'insérer sans migration |
| Les entreprises détentrices et les émetteurs RWA comme cible principale | Aucune perte avérée par ce vecteur en 2025-26 |
| Dire « on aurait protégé Bitget » | Garde probablement 100 % maison. On dit : « un callback aurait vu ces retraits s'il avait été en place » |
| Les extras non démontrables d'ici 08h00 : IA enquêtrice, traceur multi-sauts, 9 détecteurs, passkey P-256 | Ils ne seront pas prouvés, et le jury note ce qui marche |

**À trancher ensemble, non abandonné** :
- La **signature du client final sur chaque retrait** de plateforme. Aucun exchange ne la fait aujourd'hui (exchanges_adoptabilite §6) : c'est à la fois notre idée la plus neuve et la plus dure à faire adopter.
- L'alternative : exiger un **ordre interne signé hors du backend**, par exemple un opérateur sur un appareil dédié, pour les mouvements de trésorerie. C'est exactement ce qui manquait chez Bybit (transfert cold→hot de routine).

## 8. Risques honnêtes
- Les callbacks Fireblocks et BitGo ne sont prouvés qu'au format : aucun vrai Fireblocks ne nous a appelés. Notre panne = panne de retrait du client (fail-closed).
- Le callback Fireblocks est absent de l'environnement cloud UE, formulation à relire.
- Le prix de ces offres reste une hypothèse, sans aucun client interrogé.
