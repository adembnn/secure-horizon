# Synthèse de la boucle jury ↔ solveurs — Sentinelle Fuji

Date : samedi 10 oct. 2026, soir. Sources : `docs/architecture.md` (v2, version finale), `research/loop/round-1.md`, `research/loop/round-2.md`. Le tour 3 n'a pas de fichier : la boucle s'est arrêtée sur la note (voir §2).

## 1. L'outil en 30 secondes

**Pour qui** : le RSSI d'un prestataire crypto régulé en France (CASP, soumis à DORA) ou l'émetteur d'un fonds tokenisé sur Avalanche.

**Le problème** : une nuit, des fonds sortent en quelques minutes vers des adresses jamais vues. La loi impose une première notification dans les 4 h après qualification, et au plus tard 24 h après la prise de connaissance. Les équipes reconstituent tout à la main, et le gel arrive trop tard.

**Ce que fait l'outil** : une « Sentinelle » surveille les sorties de valeur de vos adresses, donne l'alerte et prépare le dossier de déclaration. Elle a trois sorties :
- **Watch** : on surveille n'importe quelle adresse sans rien migrer. On alerte et on prépare le dossier, mais on ne retient rien.
- **Guard** (optionnel) : un coffre protégé dont le contrat borne la perte lui-même. La Sentinelle ne peut que resserrer, jamais desserrer.
- **Dossier** : horloges DORA avec provenance de chaque champ, trace AML, journal dont l'intégrité est ancrée sur Avalanche. Un auditeur le vérifie sans nous.

**La scène de démo** : deux coffres jumeaux reçoivent la même attaque. L'un se vide jusqu'à zéro, l'autre s'arrête. On casse ensuite le journal, le sceau de preuve passe au rouge, et la carte « déclaration prête » s'affiche.

**Ce que ça n'est pas** : ni une IA qui décide (le modèle de risque est déterministe, le LLM rédige seulement et est désactivé par défaut), ni une détection d'intrusion. On borne la sortie de valeur.

## 2. Courbe des notes par tour

| Tour | Note moyenne du jury (avant amendement) | Défauts | Dont bloquants | Solutions retenues |
|---|---|---|---|---|
| v0 → tour 1 | **56,3** / 100 | 69 | 20 | 43 sur 43 |
| v1 → tour 2 | **60,6** / 100 (+4,3) | 66 | 13 | 47 sur 49 |
| v2 → tour 3 | **59,5** / 100 (-1,1) | non relevé | non relevé | boucle arrêtée |

Lecture honnête :
- Le tour 1 a rendu la copie plus honnête et plus faisable. Le tour 2 a corrigé les erreurs de fond (faux positifs, budget, chiffre 54 %). Le tour 3 ne monte plus.
- La note stagne autour de 60 parce que le jury sanctionne désormais ce qu'on ne peut pas régler par écrit : un PoC pas encore construit, un banc pas encore exécuté, un scénario écrit par nous.
- Les notes par critique n'ont jamais été transmises (seulement la moyenne). On ne sait donc pas quel critique a bougé.
- **Conséquence : la prochaine amélioration ne viendra plus d'une 4e relecture de l'architecture mais de la construction et des chiffres mesurés.**

## 3. Les 10 changements les plus importants apportés par la boucle

1. **Le produit passe d'un coffre maison à trois sorties (Watch / Guard / Dossier).** Pourquoi : cinq critiques sur sept disaient qu'un client n'allait pas migrer ses fonds dans notre coffre. Watch ne demande aucune migration.
2. **La détection porte sur les sorties de valeur, plus sur un événement `Withdraw`.** Pourquoi : un vol d'infrastructure ressemble à des retraits valides. Ce qui trahit le vol, ce sont les destinataires, la cadence et la part du solde.
3. **Plus de pause globale qui expire seule.** Elle est remplacée par une voie rapide / voie lente, une quarantaine par compte et un goutte-à-goutte. Pourquoi : la pause globale était un déni de service. Trois provocations bon marché gelaient toute la clientèle.
4. **Le contrat vérifie `restrict()` (règle, palier, fenêtre), un seul modèle de pouvoirs.** Pourquoi : avec une clé Sentinelle volée, l'attaquant fabriquait un motif de gel. Maintenant le pire cas est une gêne bornée.
5. **Les faux positifs se mesurent en alertes par adresse-semaine, sur des trésoreries publiques du mainnet en lecture seule.** Pourquoi : « un faux positif par jour » était invérifiable et mesuré sur la mauvaise population.
6. **Seuils appris par adresse (quantile de son propre historique), procédure gelée, état APPRENTISSAGE.** Pourquoi : l'énoncé officiel de la track dit que les règles fixes font trop de faux positifs. C'est notre réponse directe.
7. **Banc pré-enregistré, par famille d'attaque, avec trois baselines dont « plafond seul ».** Pourquoi : le banc était circulaire (7 critiques sur 7). Il faut montrer ce que la Sentinelle apporte en plus du plafond du contrat, et publier le résultat même défavorable.
8. **Le chiffre « 54 % » est supprimé, remplacé par un tableau de 20 incidents classés.** Pourquoi : Tectonic (une seule transaction) relève de la prévention. Le vrai plafond observable est 41,3 % (Bitget seul), et il se retournait contre nous.
9. **Conformité refondue : un signal machine ne fait jamais partir d'horloge, la prise de connaissance est déclarée par un humain.** S'y ajoutent la matrice sur les bons articles DORA, l'effacement soumis à un contrôle de conservation, l'AML scindé en dossier interne et externe, et le RGPD « partiel ». Pourquoi : l'auditeur y voyait un horodatage opposable créé par erreur et un risque de destruction de preuves.
10. **Preuve liée à l'action avec racine de confiance externe, écran en deux vues (Scène / Audit), budget P0 recalé à 36 h sur 40.** La preuve : le hash de la décision est dans la transaction, l'adresse de l'ancre est épinglée hors bande, un témoin co-signe. L'écran : 4 éléments pour le jury, le détail dans Audit. Le budget : la v1 demandait 42,5 h, avec des coupes écrites d'avance. Pourquoi : la preuve était réécrivable par l'opérateur, l'écran échouait au test des 30 s, et le plan dépassait la capacité avant tout aléa.

## 4. Défauts restants assumés comme limites connues, et la formulation à donner au jury

Source unique : `limits.md` (à créer ; la section 21 de l'architecture en est le brouillon). Toute formulation chiffrée sera générée depuis `results/*.json`.

| Limite | Formulation à donner au jury |
|---|---|
| Watch ne retient rien, on perd contre un balayage de 2 min | « Aucun humain n'agit en 128 secondes. Watch vise les sorties plus longues et les changements de pouvoir. Borner la perte demande Guard. Nous ne disons jamais perte évitée là où nous n'avions pas la main. » |
| Scénario écrit par nous, sur nos contrats Fuji | « Une attaque jouée par notre équipe sur nos contrats, fonds sans valeur, transactions vérifiables. Nous mesurons ce que la Sentinelle fait contre ce que nous avons modélisé, pas contre le monde réel. » |
| Aucun incident C-Chain rejouable | « Nous n'avons pas trouvé d'incident vérifiable à sortie étalée sur C-Chain et nous n'en nommons aucun sans hash. Le mot rejoué est interdit. Nous transposons des formes publiques. » |
| Faux positifs : un proxy, pas votre trafic | « Alertes par adresse-semaine sur des trésoreries publiques, borne indicative. Chez vous, la phase d'apprentissage fixe votre budget d'alertes et le fit-check dit ce qui n'est pas couvert. » |
| Cible calibrée : trésorerie à destinataires récurrents | « Sur un hot wallet de retraits clients, D1 est désactivé. Il reste D2, D3 et le plafond. Nous le disons à l'écran. » |
| Pré-positionnement lent avec capital réel | « Rester sous le radar des semaines avec de l'argent réel n'est pas arrêté par la détection. Le plafond du contrat le borne, et nous chiffrons le temps pour vider. » |
| Banc : attaques écrites par des modèles, pas par un red team humain | « Pré-enregistré et indépendant de l'implémentation, pas aveugle. L'unité statistique est la famille. Une famille qui échoue s'affiche en rouge. » |
| Intrusion en amont non détectée | « Nous ne détectons pas l'intrusion. Nous détectons et bornons la sortie de valeur, conséquence commune, et nous prouvons ce qui a été fait. » |
| Une seule chaîne EVM, une seule implémentation Guard | « Une chaîne à la fois, C-Chain mesurée. Tron et Bitcoin sont hors périmètre. Le Safe Guard et l'intégration d'un co-signataire réel ne sont pas construits. » |
| Preuve sur Fuji sans horodatage qualifié ; RGPD partiel en Guard | « Fuji est un démonstrateur. Pour la production, nous ajoutons un horodatage qualifié RFC 3161. L'état du coffre contient des adresses pseudonymes publiques : statut RGPD partiel, dit tel quel. » |
| Textes juridiques non relus par un juriste | « Citations vérifiées mécaniquement dans le texte officiel, interprétation non relue. Les signatures de démo ne sont pas opposables. » |
| Pas d'intégration SIEM/ITSM réelle, pas de haute disponibilité | « Export CEF/syslog validé et ticket local. Votre SIEM n'est pas testé : un format standard, pas un développement. » |

## 5. Les 12 questions pièges les plus probables et nos réponses

1. **Si votre modèle se trompe, qui est responsable ?** Deux modèles : un modèle de risque déterministe qui décide, un LLM optionnel qui rédige. Le fournisseur répond de sa conformité à la spécification publiée (trois chiffres recalculables), le CASP répond de ses décisions de restriction et de déclaration. Watch ne promet aucune borne, et le SLA est un gabarit à négocier.
2. **Quel pourcentage des pertes aurait été détecté ?** Nous ne donnons plus de pourcentage global. Sur 20 incidents classés, la part observable est un tableau, et Bitget seul représente 41,3 % des 4 plus gros (plafond d'observabilité, pas un taux). Aucun n'avait de Guard, donc la part bornée sur le passé est nulle.
3. **Citez un incident Avalanche que vous auriez détecté.** Nous n'en avons pas de vérifiable à sortie étalée, et nous ne nommons rien sans hash ni bloc. La précision est mesurée sur des trésoreries C-Chain réelles en lecture seule, la détection sur des formes publiques transposées et des attaques synthétiques.
4. **Combien de faux positifs ?** Nous mesurons en alertes par adresse-semaine sur des trésoreries publiques, le chiffre vient du run et non d'une saisie. C'est un proxy : chez vous, la phase d'apprentissage fixe votre budget d'alertes.
5. **En quoi battez-vous « alerte si transfert > X » ?** Nous publions la baseline réglée au mieux sur les mêmes jeux, même quand elle gagne. Le plus : seuil appris par adresse, destination effective, plafond du contrat, preuve et dossier.
6. **Si je garde le plafond du contrat et je supprime la Sentinelle ?** Deux lignes à l'écran : « sauvé par le plafond seul » et « sauvé en plus par la Sentinelle ». Si le plafond suffit sur ce lot, c'est affiché.
7. **L'attaquant envoie tout au pont officiel, ou rend ses adresses « connues » une heure avant.** Un pont ou routeur illisible est `OPAQUE_EXIT`, traité comme 100 % inédit. Une adresse n'a que la capacité de ce qu'elle a déjà fait transiter : envoyer 1 $ donne 1 $ de capacité.
8. **Votre RPC public n'a pas de traces.** Nous l'avons mesuré (`rpc_probe.json`). Sans traces, une baisse de solde inexpliquée est traitée comme sortie vers un destinataire inconnu, et l'écran affiche « traces : non ».
9. **Si je vole la clé Sentinelle ?** Le contrat refuse une règle inconnue et plafonne l'effet des règles attestées à L2. Au pire, un resserrement borné, jamais une preuve fabriquée. Les gardiens humains restent une cible : limite écrite.
10. **Votre tag « RÉEL », « fonds sauvés » : par rapport à quoi ?** Il n'y a plus de tag RÉEL. « Perte évitée sur ce scénario » est la différence de deux soldes on-chain, coffre témoin moins coffre protégé, face au même script dans les mêmes blocs. L'auditeur refait la soustraction.
11. **Votre signal L1 à 2 h du matin fait-il partir les 24 h ?** Non. Un signal machine ne fait jamais partir d'horloge : la connaissance est déclarée par un humain, motivée. L'échéance affichée est la variante prudente, et l'écart est marqué « à justifier ».
12. **Que fait votre produit de plus qu'un moniteur gratuit et un tableur ?** Cinq choses démontrées : preuve vérifiable sans nous, perte bornée par le contrat, horloges DORA avec provenance, charte en trois chiffres, refus d'effacement sous gel légal. Notre IA rédige, un vérificateur déterministe la contrôle, un humain valide.

Autres questions préparées dans §20 de l'architecture : Sepolia vs Avalanche, ancrage redéployable, RFC 3161, effacement RGPD, pack AML, callback en panne, 8 000 clients bloqués, Safe/delegatecall.

## 6. Découpage de construction recommandé, jusqu'à dimanche 08h00

**Capacité** : environ 40 h-worker pour la nuit. **P0 = 36 h** (29,5 de code + 6,5 d'écrits), tampon 4 h. Seul P0 est promis. Adem est le seul décideur du périmètre. Tout ajout se fait en échange d'une sortie.

**Règle d'or** : chaque module est développé d'abord contre des fixtures, jamais contre un module frère non fini. Le premier worker lancé est celui des schémas. Les workers tournent en parallèle sur les lignes indépendantes.

**P0 code**

| # | Tâche | Fichiers principaux | Heures | Si coupé |
|---|---|---|---|---|
| 1 | Schémas, clés, cibles autorisées, génération des tâches (Adem) | `schemas/*.json`, `keys.ts`, `deployments/fuji.json`, `assertTargetAllowed()`, `plan/p0.yaml`, `scripts/mk-tasks.mjs` | 1,5 | n.d. |
| 2 | `GuardedVault` : plafond agrégé, voie rapide / lente, NORMAL / RESTREINT, `guardsEnabled`, `restrict()` avec 3 reverts, tests Hardhat | contrats + tests Hardhat | 5 | 1 seul revert, jumeau par script |
| 3 | Détection : `probe-rpc` (20 min, tout premier), `ChainSource` T1, `OutflowLedger` (capacité, `OPAQUE_EXIT`, fail-closed), D1 D2 D7, `calibrate.ts`, échelle, `config.frozen.json` | modules Sentinelle, `results/rpc_probe.json` | 5 | seuils globaux gelés, D7 événements seuls |
| 4 | Journal (décision en clair, `client_ref` haché) + `EvidenceAnchor` + `verify` + `--pinned` + 2 scènes rouges | journal, contrat d'ancre | 3,5 | 1 seule scène rouge |
| 5 | Moteur DORA : `its_initial_fields`, `classify.ts` (3 critères), horloges, prise de connaissance déclarée, 6 cas | moteur DORA | 3 | gabarit ancien avec bandeau |
| 6 | Banc : sources G et W, critère par famille, baselines B0 B1 B2, ancre, table de décision | banc, `results/benchmark.json` | 3 | intervalles larges, W en bonus |
| 7 | Corpus faux positifs mainnet lecture seule (timebox dur 3 h) | `results/fp.json` | 3 | « non mesuré sur mainnet » |
| 8 | Écran : vue Scène (jumeaux, ligne d'état, sceau, carte déclaration, bande de vérité) + vue Audit minimale | UI | 3,5 | REJEU-FUJI, sans Audit |
| 9 | `LatencyProbe` + `mini-drain` + bouton « Relancer en direct » | `results/latency.json` | 1,5 | chiffre en blocs seulement |

Total code : 29,5 h.

**P0 écrits (workers texte, en parallèle, 6,5 h)** : `limits.md` et corrections des surclaims (1 h) ; matrice de conformité 12 lignes, `refs.yaml` + `check-refs`, slide 3 colonnes (2,5 h) ; `responsabilite.md`, résumé de charte, fiche de modèle (1,5 h) ; squelettes pitch, deck 8 slides, fiche de défense, `build-deliverables.mjs` (1,5 h).

**Jalons** (chaque jalon raté déclenche un repli écrit d'avance, aucune réunion) :
- **Maintenant (T0)** : schémas figés, tâches générées, `probe-rpc` lancé, comptes de test préfinancés au faucet à la main (Adem, avant minuit).
- **T0 + 3 h** : chemin L3 de bout en bout sur Hardhat local et slide conformité v0 commitée, sinon on gèle P1 et P2 (plan B : démo en rejeu local).
- **T0 + 7 h, avant 04h** : chemin complet sur Fuji, sinon bascule en REJEU-FUJI. Config gelée et critères écrits avant la révélation du jeu pré-enregistré.
- **05h00** : résultat du banc. S'il sort insuffisant, la table de décision s'applique et la slide 3 affiche le rouge. Personne ne rouvre les seuils.
- **05h30** : test des 20 secondes, écran sans son, 3 lecteurs extérieurs.
- **06h30** : plus aucune nouvelle fonction. Dernier redéploiement Fuji, run de référence, chiffres injectés dans les livrables, puis vidéo et répétition.
- **07h00** : second test à 3 lecteurs. **07h30** : tag `demo-ok-0730`. **08h00** : gel démo.

**P1, un seul à la fois, seulement si le tampon est intact, dans cet ordre** : carte d'astreinte 3 boutons (3 h), quarantaine par compte + goutte-à-goutte (4 h), D3 asymétrique (1,5 h), `perimetre_incidents.csv` (2 à 3 h), mapping NIST/ATT&CK + tâches T-1xx (2 h), Pareto 3 points (1,5 h), TTE + escalade + kit (2,5 h), corpus d'incidents (3 h), témoin + `attest` (2 h), D7 natif Safe (2 h), puis `ticket-sink`, shred avec contrôle de conservation, voie rapide en droit de crise, `deploy:fuji` + Snowtrace, décodeur routeur/pont, fit-check, PDP avec chaos (détail au §14 de l'architecture). Chaque entrée P1 coûte une sortie ailleurs ou du tampon.

**Bonus, jamais montrés tant qu'ils ne sont pas finis** : AML interne/externe + linter, inventaire des tiers, traceur, source M Bedrock, D4 D5 D6 D9, frontière de Pareto complète, prorata à checkpoints, 3 sur 5 gardiens, `export --bundle`. Feuille de route : Safe Guard Solidity, D8, CCIP, Teleporter, AvaCloud.

**Actions humaines** : Adem finance les comptes Fuji et génère les tâches T-1xx ; Titouan publie l'adresse de l'ancre avant 07h, lance le témoin, fait 2 à 3 appels marché avant 10h et chronomètre le pitch à voix haute avant 09h ; un humain télécharge les textes officiels DORA dans `regulatory/sources/` (accord explicite).

**Risques** : le banc peut sortir « insuffisant » à 05h ; les sources juridiques doivent être confirmées avant tout affichage (RTS 2025/301, ITS 2025/302, articles DORA, chiffres CertiK) ; aucune tâche T-1xx n'existe encore dans `coord/tasks/`, c'est le prochain geste d'Adem.

**Points tranchés sans vote du jury, à relire** : expiration de la pause supprimée et désarmement à un gardien limité au mode manuel plafonné (tour 1) ; D8 rejeté malgré 4 votes « amender » sur 7 et 9 arbitrages au tour 2 (`research/loop/round-2.md`).
