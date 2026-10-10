# Comprendre la piste 4 : détection et réponse DeFi + DORA

> Pour Adem. Objectif : tout comprendre pour pouvoir challenger et innover.
> Rédigé le 10 oct. 2026. Le règlement `context/notion_guide.md` prime.
> Sources : `research/tracks/T1_P4_chiffres_2026.md` (noté **[C]**), `research/tracks/T1_P4_defi_dora_v2.md` (**[v2]**), `research/tracks/T1_P4_defi_dora.md` (**[v1]**), `research/docs/D1_avalanche.md` (**[D1]**), `context/avalanche_fuji_mail.md`.
> `docs/architecture.md` n'existe pas encore. La section 7 décrit donc le combo « Sentinelle Fuji » tel que la recherche le propose. Compare-la avec l'architecture quand elle arrivera.
>
> Trois étiquettes sont utilisées partout :
> - **RÉEL** : fait daté, avec source.
> - **TRANSPOSÉ** : on prend un fait réel et on le déplace chez un client européen. C'est une hypothèse de travail.
> - **CIBLE** : ce qu'on veut atteindre. Ce n'est pas une mesure. Aucune métrique de ce document ne vient d'un test.
>
> Qualité des sources (d'après [C]) : **P** = page lue en entier. **S** = presse qui cite une source primaire. **V** = affirmation d'un vendeur.
> Les cabinets (CertiK, TRM, PeckShield...) ne comptent pas pareil. Ne jamais additionner leurs totaux.

---

## 1. En 30 secondes

**Le problème.** Les pirates volent de plus en plus d'argent en crypto. Au T3 2026, CertiK compte 1,26 Md$ de pertes sur 247 incidents (CertiK, 1er oct. 2026, via Cointelegraph, P). Septembre est le pire mois de 2026 : environ 766 à 769 M$ (PeckShield, CertiK).

La cause n'est plus surtout le code. Selon TRM, 76 % des pertes du premier semestre 2026 viennent de l'infrastructure, des clés et de la signature (TRM, juil. 2026, S). Bitget a perdu 387,5 M$ le 24 sept. 2026 à cause d'un produit de sécurité tiers (Cointelegraph, P).

**Pour qui.** Pour un prestataire crypto agréé en Europe (un **CASP**, voir glossaire). Il est obligé par la loi de déclarer ses incidents informatiques graves. Le registre de l'ESMA compte environ 362 CASP agréés au 7 oct. 2026 (agrégateur outrun.at, S).

Ils ont deux problèmes en même temps :
1. Ils doivent arrêter l'attaque en minutes.
2. Ils doivent déclarer l'incident vite et sans erreur. Le régulateur français constate que les délais sont « rarement respectés » et que les champs sont mal remplis (ACPR-AMF, 2026, S).

**Notre réponse.** « Sentinelle Fuji » est un outil qui :
- surveille un contrat déployé sur le réseau de test Avalanche (Fuji) ;
- le met en pause de façon graduée, avec des règles fixes (pas par une IA) ;
- classe l'incident selon les critères DORA ;
- pré-remplit la déclaration, avec une preuve derrière chaque champ ;
- tient à jour la liste des prestataires tiers dont le contrat dépend.

Ce que personne n'outille : le pont entre « l'alerte on-chain » et « la déclaration au régulateur » (v2, §2.4 : aucun outil trouvé, mais absence de preuve n'est pas preuve d'absence).

---

## 2. Glossaire illustré

Une phrase simple, puis un exemple réel.

**Blockchain.** Un registre partagé que personne ne peut réécrire seul. Chaque ligne est une transaction.
*Exemple RÉEL :* la C-Chain d'Avalanche a traité environ 235,6 millions de transactions au T2 2026 (Nansen, 2026, P).

**Smart contract.** Un programme posé sur la blockchain. Il détient de l'argent et applique ses règles sans humain.
*Exemple RÉEL :* Tectonic, un protocole de prêt sur la chaîne Cronos, est un ensemble de smart contracts. Il a été vidé en une transaction le 30 août 2026 (TRM, S).

**Vault / coffre DeFi.** Un smart contract où l'on dépose des fonds pour qu'ils rapportent. Le contrat les gère à votre place.
*Exemple RÉEL :* Accountable est un protocole de vaults multi-chaînes. Hypernative y a branché un module de pause qui met tous les vaults en pause en une seule transaction (Hypernative, mars 2026, V).
*Chez nous :* « SH Vault » est un vault fictif déployé sur Fuji. Il est à nous, avec des fonds de test.

**Avalanche.** Une blockchain compatible Ethereum (EVM). Elle confirme un bloc en environ 1 seconde.
*Exemple RÉEL :* la finance décentralisée sur Avalanche pèse 624,6 M$ (DefiLlama, 10 oct. 2026, P). Les actifs tokenisés « distribués » y valent environ 1,65 Md$ (Nansen, fin T2 2026, P).

**Fuji.** Le réseau d'essai d'Avalanche. Son identifiant est 43113. Les AVAX de test n'ont aucune valeur.
*Exemple RÉEL :* c'est le réseau demandé par le mail des organisateurs (Pierrick Goutard, 10 oct. 2026). Le mail demande aussi de consigner les adresses des contrats déployés dans le repo.

**AVAX.** La monnaie d'Avalanche. On s'en sert pour payer les frais de transaction.
*Exemple RÉEL :* l'attaquant de Bitget a touché environ 821 000 AVAX, soit 8,4 M$ (Lookonchain, sept. 2026, S).

**Snowtrace.** Le site qui permet de lire toutes les transactions publiques (testnet.snowtrace.io). C'est notre moyen de prouver devant le jury ce qui s'est passé. Il est opéré par Routescan [D1].

**Wallet et clé privée.** Un wallet est un compte. Sa clé privée est le mot de passe qui signe les transactions. Qui a la clé a l'argent.
*Exemple RÉEL :* SlowMist attribue 688 M$ de pertes sur environ 956 M$ au premier semestre 2026 aux clés privées (SlowMist, juil. 2026, S).
Autre cas : Resolv (mars 2026). Un compte de création de jetons, protégé par un service de clés cloud, a servi à créer 80 millions de jetons USR (v2, S).

**Multisig.** Un compte qui exige plusieurs signatures (par exemple 3 sur 5). Un seul signataire piraté ne suffit plus.
*Exemple RÉEL :* Drift (1er avril 2026, 285 M$). Les attaquants ont pris le contrôle du multisig de gouvernance après six mois d'ingénierie sociale (v2, S).

**Oracle.** Un service qui donne au contrat une information extérieure, surtout un prix. Si on le trompe, le contrat se trompe.
*Exemple RÉEL :* Ostium (juillet 2026, 18 à 24 M$). Une clé de signataire d'oracle a été compromise. Il n'y avait pas de faille dans le code (Blockaid, via v1, S).

**Bridge et vérificateur cross-chain.** Un pont qui déplace de la valeur d'une blockchain à une autre. Un « vérificateur » (DVN) confirme que le message du pont est vrai.
*Exemple RÉEL :* KelpDAO (avril 2026, 292 M$). Un seul vérificateur était configuré (« 1-of-1 »). Ses serveurs d'accès (RPC) ont été empoisonnés (crypto.news, 4 sept. 2026, S). Selon la même source, 47 % des applications LayerZero n'avaient qu'un vérificateur.

**Stablecoin et gel par l'émetteur.** Un stablecoin vaut 1 dollar (USDC de Circle, USDT de Tether). Son émetteur peut « geler » une adresse : les jetons n'y bougent plus.
*Exemple RÉEL :* après Bitget, Circle a gelé environ un jour plus tard (vers 05:00 UTC le 25 sept.) et Tether environ 7 h après. Cela représente 318 k$ sur 387,5 M$, soit environ 0,08 % (Decrypt, 25 sept. 2026, S). BlockSec compte 840 k$ (0,2 %).

**Exploit en une transaction.** Toute l'attaque tient dans une seule transaction, donc dans un seul bloc. Aucun humain ni aucun outil externe ne peut réagir au milieu.
*Exemple RÉEL :* Tectonic, 30 août 2026 (section 4).

**Mempool.** La salle d'attente des transactions avant leur entrée dans un bloc. Certaines attaques passent par une salle d'attente privée et restent invisibles.
*Exemple RÉEL :* une étude de 2024 (LookAhead) trouve que 56,3 % de 142 attaques sont passées par des mempools privés (arXiv, 2024, v1). On ne peut donc pas se contenter de surveiller le mempool public.

**CASP (prestataire de services sur crypto-actifs agréé MiCA).** Une plateforme d'échange, un teneur de comptes ou un service de staking, qui a reçu son agrément européen (MiCA).
*Exemple RÉEL :* 362 CASP agréés au 7 oct. 2026 : 96 en Allemagne, 36 en France, 29 aux Pays-Bas (outrun.at, lisant le registre ESMA, S).

**AMF.** L'Autorité des marchés financiers, le régulateur français. Elle supervise les CASP français et reçoit leurs déclarations d'incident.
*Exemple RÉEL :* son rapport du 29 sept. 2026 compte 33 incidents majeurs en 2025, dont plus de 80 % viennent de prestataires (Le Monde du Droit, S).

**DORA.** Un règlement européen (2022/2554), applicable depuis le 17 janvier 2025. Il oblige les entités financières, dont les CASP, à tenir leur informatique solide. Il impose aussi de déclarer vite les incidents graves.

**RTS / ITS.** Des textes d'application de DORA.
- Un RTS fixe les règles.
- Un ITS fixe les formulaires.

Les trois qui nous concernent (v1) :
- RTS 2024/1772 : comment classer un incident.
- RTS 2025/301 : le contenu et les délais.
- ITS 2025/302 : le gabarit de déclaration (les « champs »).

**Incident majeur.** Un incident qui touche un service critique et qui franchit des seuils fixés par DORA. Il doit être déclaré.
*Exemple RÉEL :* 3 383 incidents majeurs ont été déclarés dans l'UE en 2025 (ESAs, rapport du 3 juin 2026, S).

**Registre des tiers.** La liste de tous les prestataires informatiques dont une entité dépend (cloud, oracle, hébergeur...). Le format est fixé par l'ITS 2024/2956, en xBRL-CSV (v1).
*Exemple RÉEL :* 19 prestataires « critiques » (CTPP) ont été désignés le 18 nov. 2025 : AWS, Google Cloud, Microsoft, Oracle, etc. Aucun n'est un prestataire blockchain dans la liste lue (C, S).

**xBRL.** Un format de fichier à structure stricte pour les déclarations réglementaires. Un tableur Excel est refusé à la validation (orbiqhq, V). **Notre outil ne produit pas de xBRL-CSV. Il sort un JSON et un PDF pré-remplis, et il le dit** (v2, §1.4).

**NIST CSF 2.0.** Un cadre américain en 6 fonctions : Govern, Identify, Protect, **Detect, Respond**, Recover. Le hackathon exige de rattacher chaque fonctionnalité à l'une d'elles.
*Chez nous :* Detect pour la sentinelle, Respond pour l'échelle de réponse et la déclaration, Govern pour les tiers (GV.SC).

**MITRE ATT&CK.** Un catalogue public des techniques d'attaquants, chacune avec un code. T1657 = vol financier. T1078 = usage d'un compte valide. T1195 = attaque par la chaîne d'approvisionnement.

**MITRE D3FEND.** Le catalogue jumeau pour les défenses. Il nomme par exemple « Decoy Object » (objet leurre). Les identifiants exacts restent à vérifier (v2, [ÀV]).

---

## 3. Qui est notre client, et pourquoi il est obligé

**Le chemin : MiCA, puis DORA.**
1. MiCA (le règlement européen sur les crypto-actifs) exige un agrément pour offrir des services crypto en Europe.
2. Dès qu'un CASP est agréé, DORA s'applique à lui. DORA est applicable depuis le 17 janvier 2025. Les CASP y sont soumis dès leur agrément MiCA (Q&A ESMA, via v1/v2).
3. La période transitoire MiCA se termine le 1er juillet 2026 pour la France (v2, via [V-interne]). Beaucoup d'agréments sont donc tombés en 2026.

**Combien sont-ils ?**
- 362 CASP au 7 oct. 2026 : 96 Allemagne, 36 France, 29 Pays-Bas. 218 sont « crypto-natifs » et 144 viennent de la finance traditionnelle (outrun.at, S). Cet agrégateur lit les fichiers de l'ESMA. Nous n'avons pas ouvert le registre officiel.
- Les relevés varient : 352 le 17 sept., 361 le 5 oct., 367 le 9 oct. (C). Le registre est mis à jour par paliers. Ne citer qu'un chiffre daté.

**Que montrent les premiers chiffres d'incidents ?**
- **UE, 2025** : 3 383 incidents majeurs, 0,18 par entité. Environ un tiers sont transfrontaliers. Entre 29 % et environ un tiers ont une origine tierce, selon le relais (mondaq : 29 %). Environ 10 % seulement sont des cyberattaques. (ESAs, publié le 3 juin 2026, S. Le rapport primaire n'a pas été lu.)
- **France, 2025** (AMF, 29 sept. 2026, S) : 33 incidents majeurs. Plus de 80 % viennent de prestataires. 55 % sont des indisponibilités dues à une cyberattaque, 27 % sont accidentels. L'AMF s'attend à une hausse en 2026, car la plupart des agréments MiCA sont récents.
- **ACPR-AMF** : les délais sont « rarement respectés ». Il reste des erreurs de complétude et de méthode de classification (Forvis Mazars, 2026, S).

**Avertissements honnêtes.**
- Les définitions de « tiers » diffèrent entre les ESAs (29 %) et l'AMF (> 80 %). Ne jamais mettre les deux pourcentages sur la même slide.
- Nous n'avons trouvé aucun cas public de CASP agréé MiCA déclarant un incident majeur de type on-chain. Les déclarations ne sont pas publiques. Nos cas sont donc des cas **TRANSPOSÉS** (v2, §1.3).
- Nous n'avons trouvé aucune sanction DORA confirmée par une source primaire. Une amende de 42 000 € de la FMA autrichienne (14 juil. 2026) figure dans un seul guide d'éditeur (V). Ne pas la citer.
- Nous n'avons trouvé aucun chiffre public du coût d'une déclaration (v2, §1.4). Ne pas en inventer.

**Qui est le client exactement ?** Le responsable risque ou conformité du CASP, et le RSSI (sécurité). KPMG, dans le jury, est du côté de l'auditeur.

---

## 4. Les trois régimes d'attaque, un cas réel 2026 chacun

Cette lecture vient de v2 §1.2, et c'est une interprétation de l'équipe.

La question utile n'est pas « combien a-t-on volé ? ». C'est « combien de temps a-t-on pour réagir ? ». Elle donne trois situations qui demandent trois défenses différentes.

### Régime 1 : une seule transaction. Cas : Tectonic (30 août 2026)

**Les faits (RÉEL, TRM et Cointelegraph, S).**
- Protocole de prêt sur la chaîne Cronos.
- L'attaquant a gonflé le prix du jeton TONIC d'environ 195 fois, avec 98 boucles d'emprunt, dans une seule transaction.
- Les emprunts valaient 120,4 M$ sur le papier. Environ 74 à 75 M$ sont réellement sortis.
- Cronos a arrêté la chaîne et fait un retour en arrière. 9,19 M$ avaient déjà quitté la chaîne.

**Pourquoi c'est dur.** Tout se joue dans un seul bloc. Une sentinelle qui lit la chaîne voit l'attaque après coup. Une pause qui arrive après le bloc ne sauve rien.

**Ce qui peut l'arrêter.**
- Un **invariant dans le contrat lui-même** : une règle codée dans le contrat qui fait échouer toute transaction qui la viole. Exemple : « on ne peut pas emprunter plus que la valeur du collatéral, mesurée par une deuxième source de prix ». La transaction est refusée avant d'exister.
- Ou l'arrêt de toute la chaîne par ses validateurs, ce qu'a fait Cronos. C'est possible seulement sur une chaîne que l'on gouverne.

**Ce qui ne l'arrête pas.** Un watcher, une alerte, une pause humaine. Notre fonction de pause ne sert ici à rien. **Conséquence pour Adem : la défense du régime 1 se code dans le contrat, pas dans la sentinelle.**

### Régime 2 : étalée sur des minutes à des heures. Cas : Drift (1er avril 2026) et Bitget (24 sept. 2026)

**Drift (RÉEL, S).**
- Protocole sur Solana (pas sur Avalanche).
- 285 M$ volés.
- Six mois d'ingénierie sociale, puis prise de contrôle du multisig.
- 31 retraits en 12 minutes (v2 et 02_track1). Une autre source (crypto.news) parle d'un vidage en 128 secondes. **Les sources divergent : citer « de l'ordre de la minute ».**
- Environ 230 M$ en USDC ont été envoyés vers une autre chaîne via CCTP (le pont natif de Circle) pendant environ 6 h sans gel. Circle gèle seulement sur contrainte légale. L'accusation (ZachXBT) est une allégation (Whale Alert, 2026, S).

**Bitget (RÉEL, S).**
- Plateforme d'échange, 387,5 M$.
- Une faille inconnue (zero-day) dans deux produits de sécurité tiers, un web shell, un déplacement jusqu'au serveur de tâches du wallet.
- Pas de clé privée volée : l'attaquant a falsifié des ordres de retrait (BleepingComputer, Mandiant, sept. 2026, S).
- Détail minute par minute à la section 5.

**Pourquoi c'est jouable.** Il y a du temps : de quelques minutes à trois heures. Une réponse automatique et graduée peut limiter la perte. Un gel de l'émetteur peut en récupérer une partie, à condition de réagir tôt.

**Ce qui peut l'arrêter.**
- Un **plafond de sortie par fenêtre de temps**, codé dans le contrat et **indépendant du système de l'exploitant**. Si le backend est piraté, il ne peut pas retirer plus que le plafond.
- Une alerte quand les signataires, le seuil ou les modules d'un multisig changent. C'est la leçon Drift (v2, S11).
- Un paquet de gel prêt à envoyer à Circle et Tether.

**Ce qui ne l'arrête pas.** Si les fonds sont dans un simple compte (EOA) sans contrat devant, notre pause n'a pas de prise. C'est la limite à comprendre pour la section 5.

### Régime 3 : préparée à l'avance. Cas : Parallel (7 mai 2026)

**Les faits (RÉEL, source vendeur : blog d'Hypernative publié le 26 mai 2026, lu en entier).**
- L'attaquant a déployé un contrat d'attaque.
- Hypernative l'a repéré à son déploiement et a mis le protocole en pause en « quelques secondes », « une poignée de blocs ».
- Plus de 1,52 M$ étaient exposés. Rien n'a été perdu.
- Le rôle de pause avait été donné directement à une adresse d'Hypernative, sans multisig, pour gagner du temps.
- La liste de surveillance inclut Avalanche.
- Réserve : c'est un cas écrit par le vendeur. Nous n'avons trouvé aucune autre pause automatique réussie en 2026, confirmée par un tiers indépendant (C).

**Pourquoi c'est jouable.** Un attaquant a besoin d'un contrat dédié. Ce contrat apparaît avant l'attaque. Une étude académique (BlockWatchdog, 2024) cite un contrat déployé environ 30 minutes avant l'attaque et identifié en 64 secondes (v1).

**Ce qui peut l'arrêter.** Une surveillance des nouveaux contrats. On y cherche l'adresse du coffre, ou des signatures de fonctions suspectes dans le code. C'est le « leurre » de notre HoneyVault (section 7).

**Ce qui ne l'arrête pas.** Une attaque sans nouveau contrat (un compte qui appelle directement), ou une clé admin volée qui agit dans les règles.

### Tableau de synthèse

| Régime | Cas réel 2026 | Temps pour réagir | Défense qui compte | Ce que notre outil apporte |
|---|---|---|---|---|
| 1 : une transaction | Tectonic, 30 août | zéro | invariant dans le contrat | contrat gardé, puis dossier DORA |
| 2 : étalée | Drift (1er avril), Bitget (24 sept.) | minutes à 3 h | plafond de sortie, gel, pause graduée | échelle de réponse, paquet de gel, DORA |
| 3 : préparée | Parallel, 7 mai | quelques minutes (avant la 1re tx) | détection au déploiement | sentinelle et leurre, notification art. 10 |

---

## 5. Un incident minute par minute

**Cas de base : Bitget, 24 sept. 2026.** On le transpose chez un CASP européen fictif, appelé ici « X ».

**Ce qui est réel et ce qui ne l'est pas :**
- Les événements de Bitget (colonne « Ce qui s'est passé ») sont **RÉELS** et sourcés.
- Le CASP X, ses réactions et le déroulé « avec outil » sont **TRANSPOSÉS**.
- Les durées « avec outil » sont des **CIBLES** de conception (v1, idée 1 et idée 2). Aucune n'est mesurée.
- Bitget n'est pas présenté, dans nos sources, comme un CASP agréé MiCA. C'est un exemple d'architecture, pas un cas DORA.

### 5.1 Sans notre outil

| Repère | Ce qui s'est passé (RÉEL) | Source |
|---|---|---|
| Avant le vol | Zero-day sur deux appliances de sécurité tierces. Web shell, déplacement jusqu'au serveur de tâches du wallet. Aucune clé volée. | BleepingComputer / Mandiant, sept. 2026 (S) |
| T+0 | Premiers essais de retrait à 02:31 (UTC+8). | SlowMist, chronologie (S) |
| ~ T+1 h | Environ 183 M$ sortis. | Decrypt, sept. 2026 (S) |
| T+2 h 52 | Dernier transfert à 05:23 (UTC+8). Le vol dure près de 3 heures. | SlowMist (S) |
| Pendant | 75,48 M$ convertis en ETH et AVAX en 41 minutes, dont environ 8,4 M$ en AVAX. | BlockSec, Lookonchain (S) |
| ~ 1 jour après | Circle gèle (vers 05:00 UTC le 25 sept.). Tether environ 7 h après. Environ 318 k$ gelés, soit 0,08 %. | Decrypt (S) |
| Après | Fonds de protection de plus de 464 M$ avant, environ 309 M$ reconstitués au 30 sept. | 247wallst, 3 oct. 2026 (S) |

Sources qui divergent sur la durée (183 M$ en 1 h contre 3 h au total) : citer « de l'ordre de l'heure à trois heures ». L'ancienne affirmation « 228 M$ en 18 minutes » n'a pas été retrouvée (v2, §1.1). Ne pas l'utiliser.

**Ce qui se passerait chez X sans outil (TRANSPOSÉ, règles DORA RÉELLES).**
- Personne ne regarde le solde du wallet en continu.
- Quand quelqu'un s'en aperçoit, c'est une décision humaine de couper. Elle prend du temps.
- Le compteur DORA court dès la prise de connaissance. La notification initiale est due 4 h après la classification en « majeur », et au plus tard 24 h après la prise de connaissance (RTS 2025/301, v1).
- Le responsable conformité classe l'incident à la main, sous pression, avec peu de données. C'est là que les superviseurs voient des erreurs (ACPR).
- Les formulaires sont remplis à la main. Les champs 2.5, 2.6, 2.8 et les montants en milliers sont les pièges classiques.
- La demande de gel à Circle et Tether est rédigée à la main.

### 5.2 Avec Sentinelle Fuji (TRANSPOSÉ + CIBLES)

**Condition indispensable.** Les fonds de retrait de X passent par un **contrat gardé** : un smart contract avec un plafond de sortie et un rôle « guardian » qui peut seulement mettre en pause. Si les fonds sont dans un compte simple, notre outil ne peut rien bloquer. Il détecte et déclare seulement.

| Repère | Ce que fait l'outil | Type |
|---|---|---|
| T+0 (premiers retraits de test) | La sentinelle lit chaque bloc (environ 1 s sur Avalanche). Les petits retraits passent sous le plafond. Niveau L0 : on observe et on journalise. | TRANSPOSÉ |
| Quelques blocs plus tard | Le rythme de retrait dépasse le seuil de vitesse. L1 : alerte à l'astreinte. L2 : le contrat applique son **plafond de sortie par fenêtre de blocs**. | CIBLE : alerte en au plus 2 blocs, environ 3 s (v1) |
| Dès L2 | La perte est **bornée par le plafond choisi**, au lieu de dépendre de la durée de l'attaque. On ne peut pas la chiffrer ici : elle dépend du plafond. | TRANSPOSÉ |
| N minutes | Si une règle sans faux positif se déclenche (par exemple le leurre), L3 ou L4 : on isole l'adresse ou le module. Sinon, un humain d'astreinte décide sous N minutes. Par défaut on reste à L2. N reste à fixer. | CIBLE |
| Dès l'alerte | Le moteur DORA fixe « T de connaissance » au bloc de détection. L'horloge démarre : 4 h, 24 h, 72 h, 1 mois. | RÉGLEMENTAIRE (RTS 2025/301) |
| Moins d'une minute | Brouillon de la notification initiale, chaque champ lié à une transaction ou un bloc. Le dossier est prêt, le responsable conformité le valide. | CIBLE : moins de 60 s (v1) |
| Dans le brouillon | Critères cochés avec preuve. Le cas Bitget franchit largement 100 000 € d'impact économique et correspond à un accès non autorisé réussi (section 6). Classement par défaut : majeur. | TRANSPOSÉ |
| Dans le brouillon | Champ 2.8 pré-rempli au format `NOM;CODE;LEI|EUID;info` pour le fournisseur des appliances. Son nom n'est pas dans nos sources. | TRANSPOSÉ |
| Dès la pause | Un **paquet de gel** (adresses, transactions, montants, techniques ATT&CK, hash des preuves) est généré pour Circle, Tether et les enquêteurs. Un humain l'envoie. | CIBLE (v2, S9). À comparer au gel réel environ 1 jour plus tard. |
| Pendant la pause | Une jauge compte vers 2 h d'indisponibilité. Au-delà, cela ajoute un critère DORA (section 6). | TRANSPOSÉ |
| À la fin | Le hash de chaque version du rapport est ancré sur Fuji. L'auditeur peut vérifier qu'il n'a pas été réécrit. | CIBLE |

### 5.3 Ce que l'outil ne ferait pas, même chez X

- Il ne verrait pas l'intrusion chez le fournisseur ni le web shell. Il voit seulement l'effet sur la chaîne.
- Il ne protégerait pas un wallet qui n'a pas de contrat gardé devant.
- Il ne récupère pas l'argent déjà parti. Le gel dépend de Circle et de Tether.
- Il ne décide pas de la déclaration. Un humain la valide.

---

## 6. La règle DORA expliquée comme un jeu

### Le but
Savoir si un incident est « majeur » (déclaration obligatoire), puis tenir les délais et remplir le formulaire sans erreur.

### Étape 1 : les services concernés (RTS 2024/1772, art. 6, v1)
L'incident doit toucher un **service critique**. Cela veut dire :
- un service informatique qui supporte une fonction critique ou importante ;
- ou un service financier agréé ou supervisé ;
- ou tout accès malveillant non autorisé réussi.

### Étape 2 : les seuils (art. 9, v1)
Voici les seuils tels que nos sources les décrivent. Ils sont à faire valider par KPMG.

| Critère | Seuil |
|---|---|
| Clients touchés | plus de 10 % ou plus de 100 000 |
| Contreparties touchées | plus de 30 % |
| Transactions touchées | plus de 10 % du nombre quotidien moyen, ou plus de 10 % de la valeur quotidienne moyenne |
| Réputation | presse, plaintes répétées, non-conformité, perte probable de clients |
| Durée / indisponibilité | plus de 24 h de durée, ou plus de **2 h** d'indisponibilité d'un service critique |
| Géographie | au moins 2 États membres touchés |
| Perte de données | disponibilité, authenticité, intégrité ou confidentialité |
| Impact économique | plus de **100 000 €**, coûts directs et indirects, **sans déduire les sommes récupérées** (art. 7) |

### Étape 3 : la règle du « majeur » (art. 8, v1)
Un incident est **majeur** si un service critique est touché **ET** si l'une de ces deux conditions est vraie :
- (a) un accès non autorisé, malveillant et réussi (art. 9(5)(b)) ;
- (b) au moins 2 autres seuils de l'art. 9 sont atteints.

**Récurrence (art. 8(2)).** Deux incidents ou plus en 6 mois, avec la même cause apparente, qui atteignent ensemble les critères comptent comme un seul incident majeur. L'évaluation se fait chaque mois.

**Menace bloquée (art. 10).** Si l'on bloque une attaque avant toute perte, on peut faire une notification **volontaire** de « cybermenace importante ». C'est un angle utile pour le cas Parallel : un sauvetage qui ne produit aujourd'hui aucun document.

### Exemple de calcul 1 : le cas Bitget transposé
Les chiffres de Bitget sont réels (387,5 M$ le 24 sept. 2026). L'application des règles à X est **notre interprétation**.
1. Service critique touché ? Oui, c'est le service de retrait/garde de X (hypothèse).
2. Accès non autorisé malveillant réussi ? Oui, des ordres de retrait ont été falsifiés (BleepingComputer, S).
3. Donc l'incident est **majeur**, sans compter les autres seuils.
4. À titre de contrôle : l'impact économique dépasse 100 000 € dans tous les cas, et les sommes récupérées ne se déduisent pas.

### Exemple de calcul 2 : le piège de la pause (HYPOTHÈSE didactique)
Aucun chiffre de client n'est réel ici. L'exemple sert seulement à montrer la mécanique.
1. Un exploit de logique sur un vault est détecté et bloqué. Aucune perte.
2. Faut-il parler d'« accès non autorisé réussi » ? C'est **discutable** (v1, interprétation). Pour une clé admin volée, c'est oui. Pour un bug de logique, on ne sait pas. L'outil affiche les deux lectures et choisit la prudente : majeur. L'humain tranche.
3. L'équipe met le service en pause pendant 2 h 10.
4. La pause **crée** un critère : indisponibilité d'un service critique de plus de 2 h.
5. Si un deuxième critère existe (par exemple la réputation), l'art. 8(1)(b) rend l'incident majeur.

**La leçon.** La bonne réponse technique peut créer une obligation réglementaire. Notre outil affiche donc une jauge « indisponibilité 1 h 52 / 2 h », ce qu'aucun produit trouvé ne fait (v2, angle 4). Une pause longue n'est pas « majeure » à elle seule. Elle ajoute un critère.

### Les délais (RTS 2025/301, art. 5, v1)
- **Notification initiale** : 4 h après la classification en majeur, et au plus tard 24 h après la prise de connaissance.
- **Rapport intermédiaire** : 72 h après la notification initiale. Les ESAs attendent au moins un rapport intermédiaire par mois jusqu'au rapport final (instructions du 16 sept. 2026).
- **Rapport final** : 1 mois après le dernier rapport intermédiaire.

### Les champs qui posent problème (ITS 2025/302 et instructions des ESAs, 16 sept. 2026, v1)

| Champ | Le piège | Comment on le traite |
|---|---|---|
| 1.3a, 1.3b, 2.1 | Identifiants. Ils ne doivent **jamais changer** entre les rapports. | Le moteur les fige à la création. |
| 2.5 | Les critères. Doit toujours inclure « services critiques touchés ». | Case cochée par la règle, pas laissée à la main. |
| 2.6 | La géographie. **Sans le pays d'origine** de l'incident. | Le moteur retire le pays d'origine. |
| 2.8 | Incident venu d'un tiers. Format imposé : `NOM LÉGAL;CODE;LEI|EUID;info`. | Pré-rempli depuis le registre des tiers. Voir question 6 de la section 10. |
| 3.11, 4.13, 4.14 | Les montants sont **en milliers**. Par exemple, 387,5 M se saisit 387 500. | Conversion automatique. La devise exacte est à vérifier dans les instructions. |
| 3.15, 3.16, 3.17 | Durée et indisponibilité, réelles ou estimées. | Calculées à partir des horodatages de blocs. |
| 3.25 | Menaces et techniques de l'acteur. | Liées aux techniques ATT&CK relevées. |
| 4.12 | Seuil d'impact économique. Obligatoire dans le rapport final si ce critère est retenu. | Rappel dans l'horloge. |

Les autorités nationales transmettent les déclarations aux ESAs **en anglais**.

**Format de dépôt.** Le dépôt passe par le portail de l'autorité nationale, en xBRL-CSV. Notre PoC sort un JSON et un PDF. Nous ne prétendons pas « soumettre ».

---

## 7. Ce que fait chaque brique de notre outil, et pourquoi

Source : combo « Sentinelle Fuji » de v1 §5 et v2 §3 (S1, S4, S5, S6, S7, S18, S9). Rien ici n'est promis comme livré. Le statut réel est dans `coord/BOARD.md`.

**1. Le contrat gardé (« SH Vault »).**
- *Ce que c'est :* un coffre déployé sur Fuji par un CASP fictif, avec des fonds de test.
- *Il contient :* des rôles (admin, guardian), un plafond de sortie, un invariant du type « total des actifs au moins égal à la somme des parts », une fonction leurre (voir sentinelle), un mode quarantaine.
- *Pourquoi :* c'est l'**unique** endroit où l'on peut arrêter une attaque en une transaction (régime 1). Une sentinelle externe arrive trop tard.
- *Limite :* il faut que le client accepte de passer par un contrat gardé.

**2. La sentinelle.**
- *Ce que c'est :* un programme qui lit chaque bloc de Fuji. L'ingestion se fait par interrogation du RPC ou par les webhooks d'AvaCloud (Fuji supporté, HMAC, latence non garantie, D1).
- *Il fait :*
  - un scan du code des nouveaux contrats à la recherche du sélecteur de la fonction leurre et de l'adresse du vault ;
  - le calcul de la vitesse des sorties ;
  - un quorum de 3 points d'accès RPC (voir brique 6).
- *Le leurre (HoneyVault) :* une fausse faille que personne de légitime n'appelle. Tout appel est donc hostile, ce qui donne zéro faux positif **par construction**. Le dénominateur doit être annoncé : par exemple 0 alerte sur environ 1 000 transactions normales rejouées (CIBLE, v1).
- *Limites connues :* un attaquant qui lit le code vérifié peut éviter le leurre. Un agent IA qui simule le code peut le reconnaître. C'est une couche de plus, pas une solution unique. Le leurre ne couvre pas une manipulation de prix (Tectonic) : ce sont les invariants qui s'en chargent.
- *Pourquoi un déterministe :* le LLM ne décide jamais de la pause (voir question de responsabilité, section 9).

**3. L'échelle de réponse (L0 à L5).**
- L0 observer. L1 alerter. L2 plafonner les sorties. L3 mettre en quarantaine un acteur. L4 mettre en pause un module. L5 mettre en pause tout le contrat (v2, S4).
- Chaque niveau a une **expiration automatique codée en dur**. Le guardian ne peut **que** mettre en pause. La reprise exige un multisig humain.
- *Pourquoi :* une pause globale sur un faux positif est elle-même un incident (critère de 2 h). Graduer limite les dégâts d'une erreur.
- Chaque niveau est relié à son effet DORA. Exemple : L5 au-delà de 2 h ajoute un critère.

**4. Le traceur de fonds et le paquet de gel.**
- *Ce que c'est :* à la pause, on génère un dossier (adresses, transactions, montants, techniques, preuve ancrée) pour Circle, Tether ou les réseaux d'enquête. Un humain envoie.
- *Pourquoi :* après Bitget, 0,08 % ont été gelés (Decrypt, S). Après Drift, environ 6 h de pont sans gel. Un dossier prêt réduit le temps entre la pause et la demande.
- *Limite :* pour le traçage lui-même, TRM, Chainalysis et Elliptic sont très forts. Nous ne les concurrençons pas. Nous branchons leurs résultats (v2, S10).
- *Honnêteté :* le résultat dépend de tiers que nous ne contrôlons pas.

**5. Le moteur DORA.**
- *Ce que c'est :* les articles 6, 8, 9 et 10 du RTS 2024/1772 codés en règles versionnées. Chaque critère est alimenté par une mesure on-chain prouvée.
- *Il fait :* classer, lancer l'horloge, suivre la récurrence, pré-remplir les champs de l'ITS 2025/302, signaler l'effet de la pause.
- *Rôle du LLM :* il écrit **uniquement** les champs en texte libre. Chaque phrase cite sa preuve (hash de transaction, bloc). Un « sceptique » (deuxième appel isolé) retire toute phrase sans preuve.
- *Pourquoi :* c'est ce qui relie l'alerte à la déclaration. KPMG voit son propre sujet.
- *Deux sorties :* déclaration d'incident, ou brouillon de notification volontaire (art. 10) pour les menaces bloquées.
- *Limites :* les deux questions juridiques (exploit = accès non autorisé ? vault DeFi = service critique ?) sont des interprétations de l'équipe. Elles sont à faire valider par KPMG pendant le mentorat. La soumission reste humaine.

**6. Le registre des tiers vivant.**
- *Ce que c'est :* la lecture de l'état on-chain pour retrouver les dépendances : qui détient quel rôle (compte simple ou multisig, quel seuil), quel oracle, quel vérificateur, quel point d'accès RPC.
- *Il fait :*
  - un graphe qui montre les points uniques de défaillance ;
  - un export CSV aligné sur le registre ;
  - le champ 2.8 pré-rempli ;
  - un **quorum de RPC** : 3 points d'accès Fuji interrogés à chaque bloc. Une divergence au-delà d'environ 1 bloc déclenche l'alerte. C'est la leçon KelpDAO.
- *Pourquoi :* les tiers pèsent lourd. Les ESAs parlent de 29 %, l'AMF de plus de 80 % (définitions différentes). Plus de 630 M$ de pertes 2026 viennent d'infrastructure tierce (agrégateurs, v2, S).
- *Limites :* le quorum ne voit pas un empoisonnement commun à tous les points d'accès. Un registre xBRL complet est hors de portée en 36 h.

**7. Le journal ancré.**
- *Ce que c'est :* chaque version du rapport et chaque décision sont hachées. Le hash est écrit sur Fuji (événement `EvidenceAnchored`).
- *Pourquoi :* le mail des organisateurs demande d'utiliser la blockchain « là où elle apporte une valeur réelle (preuve, traçabilité, journaux infalsifiables) ». L'auditeur peut vérifier que le rapport n'a pas été réécrit après l'incident.
- *Règle :* on écrit **seulement des hashes**, jamais le contenu (confidentialité, RGPD). La blockchain ne « soumet » rien à l'autorité.

**8. Le tableau de bord.**
- *Ce que c'est :* une timeline de blocs, les alertes, le graphe des dépendances, l'écran DORA (critères, preuves cliquables, compte à rebours), les métriques.
- *Pourquoi :* le jury note la démo à 15 % et la réponse à 20 %. Il faut voir le lien Snowtrace en direct.

**Le scorecard de rejeu (S18).**
- *Ce que c'est :* des scénarios rejouables sur un fork local de Fuji, recodés sur nos propres contrats : mint non plafonné, manipulation de collatéral en boucle, changement de signataires, vérificateur unique, sorties étalées. Plus un jeu de trafic normal.
- *Il sort :* le temps de détection, les faux positifs sur N, les fonds sauvés, par scénario.
- *Pourquoi :* les vendeurs affichent 98 à 99,9 % sans protocole reproductible. Le jury note la détection à **30 %**. Un auditeur peut rejouer et retrouver les mêmes chiffres.
- *Règle :* aucune attaque contre un système réel.

**Correspondance NIST CSF 2.0 (identifiants à contrôler sur le référentiel).**
- Detect : DE.CM-01, DE.AE-02, DE.AE-04, DE.AE-08.
- Respond : RS.MA-01, RS.MA-02, RS.MA-03, RS.AN-03, RS.CO-02, RS.CO-03, RS.MI-01.
- Govern : GV.SC-04, GV.SC-07.
- ATT&CK : T1657, T1078, T1195, T1199, T1190, T1587.004, T1565.

---

## 8. Ce que font les concurrents et où ils s'arrêtent

Légende : **[V]** = lu. **[Vendeur]** = chiffre non vérifié. **[À vérifier]** = non confirmé par nos recherches.

### 8.1 Détection et réponse on-chain

| Acteur | Ce qu'il fait | Où il s'arrête |
|---|---|---|
| **Hypernative** | Détection avant exploit. Pause automatique : Parallel (7 mai 2026), Accountable (mars 2026). Surveille Avalanche. « 200+ clients » [Vendeur]. | Aucune sortie DORA. Aucune classification. Pas de registre de tiers. Ses taux (99,8 % et moins de 0,001 % de faux positifs) viennent du vendeur. |
| **Chainalysis Hexagate** | Détection par machine learning, réponse automatisée. Programme **gratuit** sur mesure pour les fondations Base, Avalanche, MegaETH, Plasma (annonce déc. 2025 [V]). | Pas de couche conformité européenne. Pensé pour les développeurs de protocoles, pas pour un CASP régulé. |
| **BlockSec Phalcon** | Mempool, 3 niveaux de risque, pause ou « front-running de sauvetage ». | Le sauvetage par front-running est juridiquement flou. Inopérant avec les relais privés. |
| **Forta** | Bots communautaires, pare-feu avec score de risque avant exécution. | Dépend de l'adoption par les chaînes. Ne couvre pas une clé volée. Pas de DORA. |
| **Cyvers** | Détection d'anomalies pour CASP et custodians. | Fermé. « 99,9 % » [Vendeur]. Aucun rapport réglementaire trouvé. |
| **Venn / Ironblocks** | Filtre les transactions avant inclusion via un RPC protégé. | Aucune actualité 2026 trouvée. L'utilisateur doit passer par ce RPC. |
| **Phylax** | Invariants exécutés par le séquenceur. Une transaction qui viole l'invariant n'est pas incluse. | Impossible sur le C-Chain public. Possible sur une L1 Avalanche souveraine (piste de feuille de route). |
| **CUBE3** | Contrôle intégré au contrat, supporte Avalanche. | Il faut modifier le contrat. Pas de DORA. |
| **Blockaid** | Simulation avant signature. Intégré dans Core, le wallet d'Avalanche. | Côté utilisateur, pas côté CASP. |
| **OpenZeppelin Defender** | Service hébergé **arrêté le 1er juillet 2026**. Monitor et Relayer restent open source. | Briques libres que l'on peut réutiliser. Ce n'est pas un produit fini. |
| **Tenderly** | Alertes et actions déclenchées. | Pas de logique réglementaire. Monitor payant. |
| **Chainlink Proof of Reserve** | Arrêt du mint quand les réserves manquent. | Au moins 4 projets du hackathon Chainlink 2026 font la même chose (v2). **Ce n'est plus un différenciateur.** |
| **TRM, Elliptic, Chainalysis Reactor** | Traçage, sanctions, enquêtes. Le réseau T3 FCU a gelé plus de 450 M$ cumulés (mai 2026, S). | Après coup. Pas intégré au plan de réponse du client. |
| **SEAL 911 / Safe Harbor** | Un accord qui autorise des whitehats à sauver des fonds. | Surtout un texte. Pas d'outil vérifié côté client. |
| **Nexus Mutual** | Assurance discrétionnaire. Plus de 18,5 M$ de sinistres payés depuis 2019. | Environ 0,14 % du TVL DeFi est couvert (130,1 M$ contre 95,7 Md$, calcul de [C], S). La prévention reste la seule parade. |

### 8.2 Côté DORA

| Acteur | Ce qu'il fait | Où il s'arrête |
|---|---|---|
| **Archer, Formalize, SureCloud, Legiscope...** | Registre d'informations et gabarits d'incident. | Saisie manuelle. Aucun lien avec l'état on-chain. |
| **D3 Security (Morpheus), OpenText, Dynatrace** | Workflows d'incident et rapports configurables. | Pour des entreprises classiques. Aucun événement on-chain. |
| **ServiceNow, OneTrust, Prevalent, Regnology, Wolters Kluwer, Corlytics...** | Gouvernance des risques, gestion des tiers et reporting réglementaire généraux. | **[À vérifier]** Nos recherches n'ont **pas** confirmé leurs offres DORA précises. Ce que nous disons d'eux est de la connaissance générale. Les lire avant de les citer sur une slide. |
| **Serveur MCP ArkForge (MIT)** | Couvre le cycle DORA (registre, modèle d'incident). | Outil pour développeurs. Aucune alimentation depuis la chaîne. |
| **Big 4, dont KPMG** | Conseil et solutions DORA. | Pas d'offre produit lue. Dans le jury, KPMG est un lecteur, pas un concurrent. |

### 8.3 Ce que cela veut dire pour notre positionnement

- La phrase « Avalanche n'a pas de monitoring » est **fausse** (Hexagate gratuit, Hypernative, Core + Blockaid).
- Notre place est donc la **couche d'après l'alerte** : classifier, tenir les délais, prouver chaque champ, cartographier les tiers.
- Il faut accepter en entrée les alertes de ces outils. On s'ajoute, on ne les remplace pas.
- Le créneau est un constat de recherche : aucun outil trouvé ne relie un événement on-chain à un champ de l'ITS 2025/302 avec preuve (v2, §2.4). Absence de preuve n'est pas preuve d'absence.

---

## 9. Les objections du jury et nos réponses

**1. « Si votre modèle se trompe, qui est responsable ? »** (question officielle du guide)
- Le modèle ne décide jamais de la pause. La pause vient de règles fixes, validées à l'avance par la direction du CASP.
- Le guardian ne peut que mettre en pause. Il a une expiration codée. La reprise exige un multisig humain.
- Le LLM rédige du texte libre, chaque phrase liée à une preuve. L'humain valide la déclaration.
- La responsabilité reste celle de l'entité régulée, comme DORA l'exige (organe de direction, art. 5). **Un contrat avec un fournisseur ne la décharge pas.** (v2, §6)
- Trois erreurs à distinguer : faux négatif (perte, listé dans nos limites), faux positif (indisponibilité, borné par les paliers), erreur de rédaction (l'humain valide).

**2. « Une pause ne sert à rien contre une attaque en une transaction. »**
- C'est exact. Tectonic en est la preuve : tout est dans un bloc.
- Pour ce régime, notre défense est l'invariant **dans** le contrat, pas la pause. Elle refuse la transaction avant qu'elle existe.
- La pause sert aux régimes 2 et 3. Nous montrons un cas de chaque régime, et nous disons lequel dépend de quoi.

**3. « Le protocole DeFi n'est pas soumis à DORA. »**
- C'est exact (interprétation, v1 §1.5). Le protocole n'est pas une entité DORA.
- Notre client est l'entité régulée qui opère ou utilise le contrat : un CASP, un émetteur de fonds tokenisé, une banque avec un dépôt tokenisé.
- Faiblesse à reconnaître : nous n'avons trouvé aucun CASP nommé qui exploite un vault sur Avalanche. L'hypothèse est plausible (Securitize et Progmat sont sur Avalanche, Nansen), mais c'est une hypothèse.

**4. « Hypernative le fait déjà. »**
- Hypernative détecte et met en pause. Parallel (7 mai 2026) le montre. Nous ne le nions pas.
- Il ne produit aucune classification DORA, aucune horloge, aucun champ de formulaire, aucun registre de tiers (v2, §2.1).
- Ses taux sont des chiffres de vendeur. Nous publions un scorecard rejouable.
- Nous acceptons ses alertes en entrée. Nous sommes complémentaires.

**5. « Votre pause peut elle-même créer un incident. »**
- Oui, c'est un risque réel : plus de 2 h d'indisponibilité est un critère DORA. Nous l'affichons à l'écran.
- L'échelle graduée, l'expiration automatique, et le plafond au niveau L2 pour les déclencheurs probabilistes limitent les dégâts.

**6. « Le leurre, c'est de la sécurité par l'obscurité. »**
- C'est une couche de plus, comme un honeytoken. Les invariants et le plafond restent en place.
- Les honeypots offensifs sont très étudiés (HoneyBadger, USENIX 2019). Nous n'avons trouvé aucun cas défensif sur un protocole vivant (v2, S1).
- Limite assumée : un attaquant qui lit le code peut l'éviter. C'est dans la fiche de défense.

**7. « Vos chiffres de détection sont-ils mesurés ? »**
- Rien dans ce document n'est mesuré. Les chiffres de l'outil seront issus du scorecard de rejeu et des rapports de test, avec le dénominateur annoncé.
- Un jeu de trafic synthétique n'est pas la réalité. Nous le disons.

**8. « Vous traitez Avalanche Fuji, un réseau d'essai sans valeur. »**
- Oui, c'est ce que demande le hackathon. Le code est le même sur le réseau principal.
- Les attaques simulées visent seulement nos contrats, sur nos environnements.
- Avalanche est pertinent : 1,65 Md$ d'actifs tokenisés et 624,6 M$ de DeFi (sources en §2).

**9. « Qui va vraiment payer ? »**
- Le CASP pour sa déclaration et son registre de tiers. L'ordre de grandeur du marché est 362 CASP (7 oct. 2026), avec une hausse attendue (AMF).
- Nous n'avons aucun chiffre de prix ni de coût de déclaration. Ne pas en inventer. Le modèle économique est à définir avec Titouan.

**10. « L'IA génère du texte réglementaire : risque d'hallucination. »**
- Chaque phrase du texte libre cite une transaction ou un bloc. Le sceptique retire toute phrase sans preuve.
- Les champs structurés viennent de règles, pas du LLM.
- Un humain valide avant tout envoi.

**11. « Un attaquant passe par un mempool privé ou par un compte simple. »**
- La détection au déploiement (régime 3) et le plafond dans le contrat (régime 2) ne dépendent pas du mempool.
- Une attaque sans nouveau contrat et sous le plafond n'est pas détectée. C'est une limite écrite.

**12. « Pourquoi la blockchain pour le journal ? Une base de données suffit. »**
- L'ancrage rend la preuve vérifiable par un tiers sans nous faire confiance. L'auditeur peut contrôler le hash.
- Nous n'écrivons que des hashes. Nous ne disons pas que la blockchain soumet le rapport.

---

## 10. Où on peut encore innover : 8 questions ouvertes

Pour Adem et Titouan. Aucune n'a de réponse dans la recherche.

**1. Que garde-t-on quand le CASP utilise un wallet à signature partagée (MPC), type Fireblocks, ou un simple compte ?**
Notre pause suppose un contrat devant les fonds. Beaucoup d'exploitants n'en ont pas. Faut-il livrer un « contrat de retrait gardé » prêt à poser devant un wallet existant ? C'est la leçon Bitget : des limites de vitesse indépendantes du backend (v2, §1.2).

**2. Comment mesurer les faux positifs honnêtement ?**
Le jury note la détection à 30 %. Un jeu de 1 000 transactions synthétiques est faible. Peut-on rejouer du trafic public d'Avalanche (données publiques) pour un dénominateur plus crédible ? Quelle part du temps le plafond gêne-t-il un utilisateur légitime ?

**3. À qui donne-t-on le rôle de pause ?**
Parallel l'a donné directement à une adresse d'Hypernative, sans multisig, pour gagner du temps. Nous voulons un guardian limité. Quel compromis entre vitesse et gouvernance ? Un second guardian indépendant ?

**4. Et si la pause devient l'arme ?**
Un attaquant qui sait que le guardian met en pause à tel seuil peut déclencher des pauses à répétition (déni de service par la défense). Comment limiter le nombre de pauses par période sans désarmer la protection ?

**5. Le leurre face aux agents IA qui lisent le code.**
Un agent peut simuler l'exécution et reconnaître un piège. Le leurre doit-il changer à chaque déploiement ? Peut-on mesurer un taux d'évitement avec notre propre agent attaquant, sur notre fork seulement ?

**6. Le champ 2.8 exige un identifiant légal (LEI ou EUID). Un oracle ou un opérateur de RPC en a-t-il un ?**
Les dépendances DeFi n'ont souvent pas d'entité juridique évidente. Que met-on dans le champ ? Comment représenter un vérificateur 1-of-1 dans un registre prévu pour des contrats commerciaux ?

**7. La notification volontaire (art. 10) pour les menaces bloquées : y a-t-il une vraie valeur ?**
Aujourd'hui un sauvetage comme Parallel ne produit aucun document. Un superviseur voudrait-il recevoir ces notifications ? À poser à KPMG. Cela peut devenir un argument de différenciation ou une fausse bonne idée.

**8. Avalanche : faut-il aller sur une L1 souveraine ?**
Sur une L1, on contrôle le séquenceur : des invariants peuvent refuser une transaction (comme Phylax), et un arrêt de chaîne gouverné est possible (précédent Cronos/Tectonic). C'est un vrai trou Avalanche-natif, mais la démo est fragile (relais, environ 1 min de latence, 3 à 5 h de travail, D1). Est-ce un « acte 2 » en feuille de route, ou à écarter ?

**Pistes bonus à trancher.**
- Brancher les alertes d'Hypernative et d'Hexagate en entrée, pour se positionner en complément.
- Produire un vrai fichier xBRL-CSV, ou assumer le JSON et le PDF ?
- Afficher dans la fiche de défense la liste de ce qu'on ne détecte pas : le jury la lira comme un signe de maturité.

---

## Vérifications à faire avant de mettre un chiffre sur une slide

- Les 362 CASP viennent d'un agrégateur, pas du registre ESMA lui-même.
- Les chiffres ESAs (29 % ou environ un tiers d'origine tierce) varient selon le relais.
- Les chiffres TRM et Immunefi (207 hacks, 972 M$) sont identiques : probable recopie. Éviter ou citer avec réserve (C, note 1).
- Parallel est un cas de vendeur. Le chiffre « 0 perdu » n'a pas de confirmation indépendante.
- Drift : 31 retraits en 12 min (v2) contre 128 secondes (crypto.news). Choisir une formule prudente.
- Les noms exacts des 19 CTPP, le statut d'ERC-7265, les identifiants D3FEND et les deux lectures juridiques sont à confirmer (v2, §8).
- Les chiffres « vendeur » (99,8 %, 99,9 %, plus de 98 %) ne sont jamais présentés comme des faits.
- Toutes les données de démo sont synthétiques. Aucune donnée personnelle réelle.
