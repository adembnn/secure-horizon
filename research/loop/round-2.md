# Boucle jury ↔ solveurs — tour 2

Architecture critiquée : `docs/architecture.md` v1. Architecture produite : v2.
Date : 10 oct. 2026, samedi soir (tour 2).

## 1. Notes du jury

**Moyenne avant amendement : 60,6 / 100** (tour 1 : 56,3, soit +4,3).

Les notes individuelles par critique n'ont pas été transmises à l'intégrateur, seule la moyenne l'a été (comme au tour 1). Le tableau donne le volume et la gravité des défauts par critique, qui expliquent la note. À renseigner au tour 3 si les notes brutes sont disponibles.

| Critique | Défauts | Bloquants | Majeurs | Mineurs | Note |
|---|---|---|---|---|---|
| kpmg (auditeur conformité) | 10 | 1 | 9 | 0 | n.c. |
| avalanche (écosystème) | 8 | 2 | 5 | 1 | n.c. |
| kryptosphere (chercheur DeFi) | 9 | 2 | 7 | 0 | n.c. |
| redteam | 10 | 2 | 8 | 0 | n.c. |
| rssi (acheteur CASP) | 10 | 2 | 8 | 0 | n.c. |
| pitch (jury pitch) | 9 | 2 | 7 | 0 | n.c. |
| regles (règlement et livrables) | 10 | 2 | 8 | 0 | n.c. |
| **Total** | **66** | **13** | **52** | **1** | **60,6 (moyenne)** |

Évolution depuis le tour 1 : 69 défauts dont 20 bloquants, contre 66 dont 13 bloquants.

Thèmes qui reviennent chez plusieurs critiques :
1. **Mesure des faux positifs invalide** : mauvaise unité (par jour), mauvaise population (infrastructure, Fuji) — kryptosphere, rssi, regles, redteam, avalanche.
2. **Budget P0 de 42,5 h pour 40 h de capacité**, pas de branche d'échec du banc — kpmg, redteam, pitch, regles.
3. **Compteur « fonds sauvés » et badge « RÉEL » non démontrés**, scénario auto-référentiel — rssi, pitch, avalanche, kryptosphere, regles.
4. **Mode Watch qui ne borne rien**, Guard limité à notre coffre — kryptosphere, redteam, rssi, regles.
5. **Conformité : horloge de connaissance, effacement, RGPD, AML, matrice DORA, responsabilité asymétrique** — kpmg (7 des 10), regles, redteam, rssi.
6. **Contournements de détection** (pré-positionnement, pont ou routeur, absence de traces, jetons rebase, Safe) — redteam, avalanche, kryptosphere, rssi.
7. **Écran trop chargé** et réponse de l'analyste hors parcours — pitch, regles.
8. **Chiffre « 54 % » faux** (Tectonic en prévention) — kryptosphere, pitch.
9. **Valeur d'Avalanche** : la finalité n'est pas un apport — avalanche.

## 2. Défauts relevés

| id | critique | gravité | défaut |
|---|---|---|---|
| kpmg-r2-01 | kpmg | majeur | T_connaissance = première alerte machine ; un L1 devient un horodatage opposable ; niveau de crise publié sur chaîne publique |
| kpmg-r2-02 | kpmg | majeur | Effacement sans contrôle de conservation (AML, DORA) : destruction de preuves possible |
| kpmg-r2-03 | kpmg | majeur | « Pas de donnée personnelle on-chain » faux en mode Guard (adresses, comptabilité par déposant) |
| kpmg-r2-04 | kpmg | majeur | Pack AML mélange déclaration de soupçon et lettre de gel ; « gel » mal qualifié ; CASP volé ≠ déclarant |
| kpmg-r2-05 | kpmg | majeur | Matrice DORA sur les mauvais articles (manque 10, 11, 17-18, RTS 1774), surclaim « couvert », « test de résilience » |
| kpmg-r2-06 | kpmg | bloquant | « Qui est responsable » : asymétrique (faux positif seul), signature sur des seuils illisibles, pas de contrat |
| kpmg-r2-07 | kpmg | majeur | Information des clients sans horloge ; retenue des clients sans durée maximale |
| kpmg-r2-08 | kpmg | majeur | Gabarit INITIAL ne correspond pas aux champs de l'ITS ; durée d'indisponibilité provoquée par nous |
| kpmg-r2-09 | kpmg | majeur | Cycle de vie de la charte : toute recalibration invalide les preuves, pas de revalidation |
| kpmg-r2-10 | kpmg | majeur | P0 = 42,5 h pour 40 h ; `verified:true` posé par un modèle ; coupe-feu 22h30 dépassé |
| avalanche-r2-finality-is-a-non-feature | avalanche | majeur | La finalité est une propriété du réseau, pas un apport de la Sentinelle |
| avalanche-r2-no-avalanche-incident-in-replay | avalanche | bloquant | Aucun incident C-Chain nommé ; rejeu réel conditionnel et probablement vide |
| avalanche-r2-bridge-router-blind-spot | avalanche | bloquant | D1 aveugle quand la sortie passe par un pont ou routeur « connu » |
| avalanche-r2-rpc-no-trace-no-internal-transfers | avalanche | majeur | RPC public sans traces : transferts internes sans destinataire, limites de logs |
| avalanche-r2-real-badge-on-self-made-scenario | avalanche | majeur | Badge « RÉEL » sur des transactions de notre propre scénario |
| avalanche-r2-anchor-trust-root-is-operator-repo | avalanche | majeur | Racine de confiance de `verify` = dépôt de l'opérateur, redéploiement cohérent possible |
| avalanche-r2-reasonhash-binds-nothing-onchain | avalanche | majeur | `reasonHash` libre : le contrat ne vérifie rien, équivalent à un horodatage |
| avalanche-r2-snowtrace-verification-and-fee-model-ignored | avalanche | mineur | Contrats non vérifiés sur Snowtrace ; modèle de frais dynamique non traité |
| kryptosphere-r2-01 | kryptosphere | bloquant | Faux positifs jamais mesurés sur le profil revendiqué ; critère « par jour » invérifiable |
| kryptosphere-r2-02 | kryptosphere | majeur | Attaques held-out dans la distribution des détecteurs ; n trop petit pour les intervalles |
| kryptosphere-r2-03 | kryptosphere | bloquant | Plafond « 54 % » mal calculé (41,3 %) ; pertes de valeur sans sortie non vues |
| kryptosphere-r2-04 | kryptosphere | majeur | D1 suppose des destinataires récurrents ; adresses de dépôt neuves par construction |
| kryptosphere-r2-05 | kryptosphere | majeur | D3 et D7 : transferts internes, rebase, delegatecall Safe sans événement |
| kryptosphere-r2-06 | kryptosphere | majeur | Apport de la détection non séparé du plafond statique du contrat |
| kryptosphere-r2-07 | kryptosphere | majeur | Mode Watch seul compatible avec les vrais incidents mais n'arrête rien (128 s à 41 min) |
| kryptosphere-r2-08 | kryptosphere | majeur | Démo scriptée contre notre contrat sous badge « RÉEL-FUJI » |
| kryptosphere-r2-09 | kryptosphere | majeur | Incidents cités hors C-Chain ; latence non comparée à une chronologie réelle |
| redteam-r2-01 | redteam | majeur | Pré-positionnement : « connue » contournable pour quelques dollars |
| redteam-r2-02 | redteam | majeur | Watch n'arrête rien ; Guard seulement sur notre coffre ; intégrations = fichiers ; Safe sans signaux natifs |
| redteam-r2-03 | redteam | majeur | D3 : faux positifs structurels (rebase, frais, traces, jetons poussière) |
| redteam-r2-04 | redteam | bloquant | Voie rapide : comptes préparés, plafond partagé affamant les clients |
| redteam-r2-05 | redteam | majeur | Déni de service par la défense : budget de restriction épuisable, auto-incident DORA |
| redteam-r2-06 | redteam | majeur | Banc faible : mêmes familles de modèles, n petit, unités de FP incompatibles |
| redteam-r2-07 | redteam | bloquant | Plan de construction à 42,5 h ; aucune branche si le test scellé échoue |
| redteam-r2-08 | redteam | majeur | Preuve contournable de l'intérieur : rejeu identique, queue non ancrée, shred comme porte dérobée |
| redteam-r2-09 | redteam | majeur | Responsabilité sur une signature qui ne couvre rien ; `verified:true` posé par un modèle |
| redteam-r2-10 | redteam | majeur | Aucun chiffre de latence utilisable à l'oral ; six segments de pitch, ordre de coupe absent |
| rssi-r2-01 | rssi | bloquant | Guard seulement sur notre coffre ; callback stub sans mode de panne |
| rssi-r2-02 | rssi | bloquant | Profil calibré (destinataires récurrents) ≠ celui d'un CASP ; valeur face à « alerte si > X » non démontrée |
| rssi-r2-03 | rssi | majeur | Démarrage à froid non spécifié (historique, labels, jour 1) |
| rssi-r2-04 | rssi | majeur | Preuves chiffrées mauvaise unité ; critère d'échec = 365 réveils par an et par adresse |
| rssi-r2-05 | rssi | majeur | RESTREINT sans durée maximale, gardiens sans SLA, coût de faux positif non monétisé |
| rssi-r2-06 | rssi | majeur | Sorties = fichiers ; deux sources de vérité pour l'accusé ; pas de RBAC |
| rssi-r2-07 | rssi | majeur | Modèle de déploiement, clé, sauvegarde, rétention, plan de sortie absents |
| rssi-r2-08 | rssi | majeur | Gain DORA revendiqué sur le mauvais segment ; compteur démarre à un clic ; canal de dépôt absent |
| rssi-r2-09 | rssi | majeur | Trois compteurs auto-référentiels |
| rssi-r2-10 | rssi | majeur | Une seule chaîne EVM ; différenciation = la partie la moins calibrée |
| pitch-r2-01 | pitch | bloquant | Test des 30 s échoué : écran trop chargé |
| pitch-r2-02 | pitch | majeur | Moment wow dilué entre « fonds sauvés » et « supprimer une entrée » |
| pitch-r2-03 | pitch | majeur | Sept messages ; la finale perd détection et business |
| pitch-r2-04 | pitch | majeur | Intervalle de confiance faible (15/15 → 78 %) ; attaques dans la distribution des détecteurs |
| pitch-r2-05 | pitch | majeur | « 54 % » se retourne contre nous (41 %) |
| pitch-r2-06 | pitch | majeur | La réponse utile à l'analyste est reléguée en P2 |
| pitch-r2-07 | pitch | bloquant | Le récit promet des éléments non garantis par le budget (banc scellé, matrice, latence) |
| pitch-r2-08 | pitch | majeur | Transparence systématique : « simulé » partout noie le réel |
| pitch-r2-09 | pitch | majeur | « Pas de modèle d'IA » perçu comme contournement ; différenciation faible |
| regles-r2-01 | regles | bloquant | Critère « FP par jour » invérifiable ; population bénigne ≠ cible |
| regles-r2-02 | regles | majeur | Règles fixes contre l'enjeu officiel de la track |
| regles-r2-03 | regles | majeur | « Fonds sauvés » non défini ; Watch sans fonds sauvés |
| regles-r2-04 | regles | bloquant | P0 = 42,5 h ; un seul dev ; aucune tâche T-1xx créée ; intégrations en P2 |
| regles-r2-05 | regles | majeur | Slide conformité dépendante de modules P1/P2 et de workers sans juriste |
| regles-r2-06 | regles | majeur | Feuilles HMAC : l'auditeur dépend des sels de l'audité |
| regles-r2-07 | regles | majeur | Responsabilité : faux négatif muet, seuils à la charge du client, « pas de modèle » |
| regles-r2-08 | regles | majeur | Mapping incohérent (T1078, ASI09, D3FEND absent, Recover partiel), pas de frontmatter T-1xx |
| regles-r2-09 | regles | majeur | Classification automatique DORA absente ; 3 cases ne reprennent pas les critères |
| regles-r2-10 | regles | majeur | Pitch à six blocs, une slide business, démo mêlant trois étiquettes |

## 3. Solutions et votes

Statut : 49 propositions, **47 retenues** (presque toutes avec amendements), **2 rejetées** (`detection-r2-expected-flows-reconciliation`, `detection-r2-detection-agnostic-response-layer`). « Pour » = accepter + amender ; « contre » = rejeter. Détail A / Am / R = accepter / amender / rejeter, sur 7 votants. Les heures citées sont celles de l'amendement retenu. Le thème constant des amendements : réduire le périmètre construit, garder la règle ou l'étiquette honnête.

### 3.1 Détection

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| detection-r2-fp-corpus-address-week | retenue | 7/0 (0/7/0) | Timebox dur 3 h ; 15 à 20 adresses d'organisations publiques, 7 à 14 jours, jamais d'EOA ; 2 profils mesurés, profil C affiché non couvert ; critère L2+ ≤ 0,2 par adresse-semaine écrit avant le run ; vecteurs de features seulement ; repli « non mesuré sur mainnet » ; chiffres du pitch issus du run |
| detection-r2-adaptive-thresholds-fitcheck | retenue | 7/0 (0/7/0) | Quantile empirique par adresse + plancher + APPRENTISSAGE ; mot « garantie » interdit (« budget d'alertes cible mesuré ») ; seuil plafonné par la borne du contrat ; fit-check CLI texte, pas d'écran ; courbe d'historique et écran en bonus |
| detection-r2-expected-flows-reconciliation | **rejetée** | 4/3 (0/4/3) | Non constructible avant 08h, surface de falsification d'ordres, non démontrable ; les amendements proposaient un D8 minimal en P1 ; D8 passe en feuille de route avec la limite « hot wallet de retraits : D1 désactivé, D2, D3 et plafond seulement » |
| detection-r2-intermediary-decoder | retenue | 6/1 (0/6/1) | Garder `OPAQUE_EXIT` (fail-closed) en P0 ; décodage `MockRouter` / `MockBridge` et D2 par classe en P1, 2 h ; CCIP, Teleporter, annuaire d'ABI, famille F8 et ablation coupés |
| detection-r2-bounded-familiarity-cohort | retenue | 6/1 (0/6/1) | Seulement `capacity(addr)` (≈ 1 h, c, N, k gelés) ; D9 et famille F7 en feuille de route ; limite « préparation lente avec capital réel » chiffrée |
| detection-r2-chainsource-tiers-failclosed | retenue | 7/0 (5/2/0) | `probe-rpc` en tout premier ; T1 + fail-closed en P0, T2 si D7 le requiert, T3 si le probe le permet ; badge « traces : oui / non » ; N unifié à 20 avec la latence ; aucune clé dans `rpc_probe.json` |
| detection-r2-d3-d7-hardening | retenue | 7/0 (0/7/0) | D3 asymétrique (baisses seulement) + anti faux `Transfer` + registre de 3 jetons ; D7 : slot EIP-1967 + owner ; code hash écarté pour un proxy ; F10 Safe et F11 coupées, rebase en cas du corpus ; aucune citation Bybit avant vérification ; valorisation Chainlink coupée |
| detection-r2-bench-v2-diverse-adversaries | retenue | 7/0 (0/7/0) | Sources G (≈ 100 scénarios) et W (100 essais) ; M en bonus conditionnel ; critère par famille (≥ 90 % et borne CP ≥ 70 %) écrit avant le gel ; « pré-enregistré », pas « aveugle » ; unité statistique = la famille ; un seul mécanisme de held-out avec demo-r2-branche-echec-banc-scelle |
| detection-r2-baselines-pareto-cap-only | retenue | 7/0 (4/3/0) | B0 / B1 / B2 sur les mêmes jeux en P0 (tableau) ; Pareto limité à 3 points de plafond en P1 ; compteur scindé « plafond seul » / « en plus » ; résultat publié même défavorable ; attaquant glouton en bonus |
| detection-r2-perimeter-real-share-and-value-loss | retenue | 7/0 (0/7/0) | Retirer 54 % partout ; CSV de 20 incidents classés A à E avec mode, parts en valeur et en nombre, sensibilité sans le plus gros ; D5 / D6 et seconde chaîne en feuille de route ; « part bornée sur le passé nulle » |
| detection-r2-incident-corpus-honest | retenue | 7/0 (6/1/0) | Étape 0 de 30 min ; sinon 2 à 3 formes publiques « transposées, chaîne synthétique » ; mot « rejoué » interdit ; aucun incident nommé avant vérification ; phrase de repli mot pour mot |
| detection-r2-detection-agnostic-response-layer | **rejetée** | 1/6 (0/1/6) | Dilue le récit, surface de déni de service par alerte forgée, non démontrable ; une ligne de feuille de route « accepte des signaux tiers via webhook JSON » |
| detection-r2-accept-known-limits | retenue | 7/0 (6/1/0) | Cinq formulations de limites dans `limits.md`, toute formulation chiffrée générée de `results/*.json` ; ordre de coupe réaligné sur le budget unique |

### 3.2 Réponse

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| reponse-r2-01-restrict-verifie-par-contrat | retenue | 7/0 (0/7/0) | Version minimale : `mapping(ruleId => maxLevel)` (pas de Merkle), un prédicat on-chain (sorties cumulées / solde), règles attestées plafonnées à L2, 4 reverts testés ; **événement sans niveau ni `entryBytes`** (conformite-r2-01 prime) ; pas de test de propriété en P0 |
| reponse-r2-02-safe-guard-et-d7-natif-safe | retenue | 5/2 (0/5/2) | **(a) Safe Guard coupé** (feuille de route) ; seule (b) retenue : D7 sur signaux natifs Safe, `operation=1` vers cible hors liste = L2 immédiat en Watch, testé sur fixtures de logs, 2 h ; aucune citation Bybit sans vérification |
| reponse-r2-03-watch-honnete-escalade-par-temps-avant-vidage | retenue | 7/0 (2/5/0) | TTE affiché, escalade `by_tte` dans `playbook.yaml` avec règle anti-bruit, courbe Watch contre Guard montrant la défaite à 128 s ; kit réduit au freeze-pack JSON et à la liste `approve()` à révoquer ; « perte évitée » interdit sur incident sans Guard |
| reponse-r2-04-voie-rapide-droit-au-prorata | retenue | 5/2 (0/5/2) | Version simple sans checkpoints : droit = plafond de crise × solde / Σ éligibles (éligible si dernier dépôt avant B − K) ; ajouts de liste blanche gelés sous L2+, activation doublée sous L1 ; test 50 comptes contre 5 ; prorata complet en feuille de route ; P1 |
| reponse-r2-05-quarantaine-par-compte-puis-goutte-a-goutte | retenue | 7/0 (0/7/0) | `quarantined[account]`, RESTREINT global réservé aux ruptures d'invariant, DRIP après T_restreint au débit du plafond statique, `cause=SELF_INFLICTED` en colonne séparée ; gardiens 3 sur 5, suppléants, SLA nuit en texte seulement ; P1 (4 h) |
| reponse-r2-06-cout-faux-positif-en-euros-et-sla-reprise | retenue | 7/0 (4/3/0) | « valeur × minutes » et « clients × minutes » mesurés ; `cost_model.yaml` de 10 lignes tout HYPOTHESE, jamais cité à l'oral sans étiquette ; durée maximale CGU = celle du DRIP ; 1 h |
| reponse-r2-07-pdp-callback-panne-et-mode-defaut | retenue | 7/0 (0/7/0) | HMAC + nonce + 800 ms, `failMode` par classe (BASSE fail-open, HAUTE fail-closed) **avec plafond agrégé de fail-open**, script de chaos 20 requêtes, une instance, pas de réplicas ni de rotation ; « jamais testé contre un co-signataire réel » ; slogan reformulé |
| reponse-r2-08-integration-itsm-siem-rbac | retenue | 6/1 (0/6/1) | Repli : `ticket-sink` REST (POST/PATCH) + accusé unique dans le ticket + déduplication par empreinte, 3 h ; RBAC en table `roles.yaml` documentée, sans JWT ; CEF/syslog fusionné avec demo-r2-integration-cef-syslog-verifiee ; plus de bouton d'accusé concurrent |
| reponse-r2-09-carte-d-astreinte-cliquable-dans-le-parcours | retenue | 7/0 (3/4/0) | Carte = phrase + TTE + faits de la machine avec liens Snowtrace + 3 boutons (Confirmer / Faux positif avec seconde signature et sans baisse de palier / Escalader) ; « Confirmer » = prise de connaissance déclarée ; cases puis brouillon de gel coupés en premier ; première entrée P1 |
| reponse-r2-10-fonds-sauves-jumeau-non-protege | retenue | 7/0 (5/2/0) | Trois définitions (valeur retenue, perte évitée sur ce scénario, exposée à l'alerte) + glossaire + test `loss_twin − loss_guarded` ; **fusionné** avec demo-r2-coffre-jumeau-contrefactuel : flag immuable `guardsEnabled` ; « — » en Watch |
| reponse-r2-11-limites-connues-formulation-jury | retenue | 7/0 (7/0/0) | Six formulations dans `limits.md` (Watch à 128 s, pas de co-signataire réel, compte whitelisté compromis, règles attestées, pas de RFC 3161, gardiens = cible) ; limites supposant des solutions rejetées réalignées ; ordre de livraison remplacé par le budget unique |

### 3.3 Conformité

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| conformite-r2-01 | retenue | 7/0 (5/2/0) | Signal machine / prise de connaissance déclarée / classification ; L1 sans horloge ; échéance de référence affichée = variante prudente, date déclarée en seconde ligne ; `ResponseEvidence` sans `level` ; ancrage à cadence constante ; limite « RESTREINT public en Guard » ; « à confirmer sur RTS 2025/301 » |
| conformite-r2-02 | retenue | 7/0 (1/6/0) | Feuille = décision en clair + `client_ref = HMAC(sel par client)` dès le P0 (10 lignes) ; `shred` qui refuse sous incident ouvert en P1 (le refus est la fonctionnalité) ; double signature en table de rôles ; durées « à confirmer » ; « rupture du lien interne », jamais « anonymisation » |
| conformite-r2-03 | retenue | 7/0 (7/0/0) | RGPD « partiel », phrase corrigée, conception cible documentée non construite, 0,5 h |
| conformite-r2-04 | retenue | 7/0 (4/3/0) | Deux gabarits (INTERNE / EXTERNE), « demande de blocage conservatoire », nœud `qui_est_victime`, linter de termes interdits ; références L561-19 « à confirmer » ; P2 |
| conformite-r2-05 | retenue | 7/0 (7/0/0) | Matrice sur art. 10, 11, 17-19, 28, 30, RTS 2024/1774 ; trois statuts (contribue, prépare, hors périmètre) ; art. 5 « maquette » ; « test de résilience » supprimé (art. 24-25 en feuille de route) ; fusionné avec demo-r2-citations-mecaniques |
| conformite-r2-06 | retenue | 7/0 (7/0/0) | Slide en 3 colonnes (Démontré, Préparé, Feuille de route) pilotée par `demo_artifact` existant sur disque ; `audit:line` de 15 lignes ; slide v0 commitée tôt |
| conformite-r2-07 | retenue | 7/0 (4/3/0) | Réponse en trois étages ; charte en trois phrases générées (sinon NON EXÉCUTÉ) avec mention « calculés à date, config@hash » ; `responsabilite.md` et fiche de modèle ; ligne AI Act (fournisseur / déployeur) ; « l'assureur couvre le reste » reformulé en point à négocier ; pas d'onglet clauses |
| conformite-r2-08 | retenue | 6/1 (0/6/1) | Quatrième échéance d'information des clients sans délai légal chiffré (« cible interne, non légale ») ; compteur « clients retenus / âge max » ; escalades T+1 h / T+4 h ; `releaseTicket` retiré du contrat (feuille de route) ; aucune durée légale MiCA affirmée |
| conformite-r2-09 | retenue | 7/0 (3/4/0) | `its_initial_fields.yaml` avec quote et hash, cadre « éléments de classification » séparé, `classify.ts` limité aux critères avec données, verdict « provisoire » plutôt que « majeur » forcé, repli si l'extraction n'est pas fiable à 03h, xBRL-CSV « à confirmer », chrono manuel n=1 « indicatif » |
| conformite-r2-10 | retenue | 7/0 (0/7/0) | `verify --pinned` + adresse publiée hors bande (action humaine de Titouan, P0) ; `WITNESS` + `attest` + `witness.ts` (P1, clé hors dépôt) ; scène « réécriture cohérente » ; voyants intégrité / complétude ; « indépendance démontrée en maquette » ; seconde implémentation Python de D1 supprimée |
| conformite-r2-11 | retenue | 6/1 (2/4/1) | `docs/deploiement.md` seulement (clé chez le client, journal en ajout seul, plan de sortie, WORM documenté) ; **heartbeat qui resserre retiré** (levier de déni de service) ; `export --bundle` en feuille de route |
| conformite-r2-12 | retenue | 7/0 (0/7/0) | `charte@hash` affichée avec les résultats rattachés au hash, badge « NON VALIDÉ pour cette configuration », `review_due` ; enveloppe immuable contre plafonds opérationnels en une phrase ; `revalidate` complet et indicateur de dérive en limite |
| conformite-r2-13 | retenue | 7/0 (6/1/0) | Colonne `exercised_by` ; T1078 reformulé « effet détecté » ; ASI09 retiré ; D3FEND « non utilisé » si rien de vérifié ; Recover partiel ; test d'injection LLM seulement si le LLM est dans la démo ; tâches T-1xx générées |
| conformite-r2-14 | retenue | 7/0 (7/0/0) | Tableau « ce qu'un moniteur gratuit plus un tableur ne font pas » (cinq différences construites) ; « à notre connaissance publique, à vérifier » ; réponse « notre IA rédige, un vérificateur déterministe contrôle, un humain valide » |

### 3.4 Démo et pitch

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| demo-r2-budget-p0-coupe | retenue | 7/0 (6/1/0) | Arbitre unique : P0 recalé (36 h dans la v2 : 29,5 code + 6,5 écrits), coupes écrites d'avance, `plan/p0.yaml` + `mk-tasks.mjs`, premier worker = schémas, développement contre fixtures, plus d'heure « 22h30 » ; toute autre solution entre en échange d'une sortie |
| demo-r2-citations-mecaniques | retenue | 7/0 (6/1/0) | `refs.yaml` unique `{celex, article, quote ≤ 25 mots, snapshot_sha256}` + `check-refs.mjs` ; drapeau dérivé du test ; limité à 12 références ; snapshots téléchargés par un humain (accord explicite) ; fusionné avec conformite-r2-05 |
| demo-r2-coffre-jumeau-contrefactuel | retenue | 7/0 (4/3/0) | Deux coffres de même code (flag `guardsEnabled`), mêmes retraits, mêmes blocs ; libellé « Perte évitée sur ce scénario » ; balayage de plafond à 3 valeurs ; attaquant boîte noire LLM coupé ; curseur de vitesse hors parcours ; fusionné avec reponse-r2-10 |
| demo-r2-branche-echec-banc-scelle | retenue | 7/0 (3/4/0) | Un seul mécanisme de held-out avec le banc par famille ; règle écrite et ancrée avant 04h ; rouge publié, une seule v2 étiquetée post-échec ancrée en B3 ; test « pas de résultat v2 sans ancre B3 » ; intervalle de 10/10 expliqué (bilatéral 69 %, unilatéral 74 %) |
| demo-r2-ecran-scene-et-audit | retenue | 7/0 (5/2/0) | Vue Scène à 4 éléments + bande de vérité + vue Audit ; « RÉEL » remplacé par « TX VÉRIFIABLE » ; test des 20 s à 3 lecteurs à 05h30 et 07h00 (critère « vole / freine / prêt », ≥ 2 sur 3) ; mode auditeur à un clic ; Playwright limité à l'absence de « RÉEL » et à la bande |
| demo-r2-un-chiffre-latence-et-live-lite | retenue | 7/0 (4/3/0) | Un chiffre oral mesuré sans compression, **N = 20 partout**, `mini-drain` de 4 tx, bouton « Relancer en direct » avec repli REJEU à 15 s, deux prises vidéo horodatées ; chiffre en blocs si le faucet bloque ; faucet financé à la main |
| demo-r2-avalanche-valeur-honnete | retenue | 7/0 (0/7/0) | §16 réécrit (rien n'est propre à Avalanche dans le code, finalité = contexte sourcé) ; `deploy:fuji` avec vérification Snowtrace ; `FeePolicy` testée à base fee × 5 ; **spike L1 Subnet-EVM supprimé** ; dernier redéploiement à 06h30 |
| demo-r2-pitch-quatre-temps-et-deck | retenue | 7/0 (6/1/0) | Quatre temps identiques à 5 et 3 min, **avec 10 % de marge** (4 min 30 s et 2 min 40 s de contenu) ; 20 s de conformité et responsabilité même en finale ; business coupé en premier, jamais le chiffre de détection ; deck 8 slides avec slide marché ; « prix non validé » plutôt qu'un faux prix |
| demo-r2-livrables-generes-depuis-resultats | retenue | 7/0 (5/2/0) | `build-deliverables.mjs` ; « NON EXÉCUTÉ À CETTE VERSION » si résultat absent ; test de nombre libre limité à la fiche, au deck et au README (liste blanche : dates, versions, articles) |
| demo-r2-integration-cef-syslog-verifiee | retenue | 7/0 (6/1/0) | CEF vers fichier + UDP syslog validé par un analyseur indépendant (sinon regex, dit) ; fusionné avec reponse-r2-08 ; Wazuh / Graylog supprimés ; « branché / non branché » |
| demo-r2-accepter-limites-demo | retenue | 7/0 (7/0/0) | Phrase de cadrage mot pour mot dans `limits.md`, la fiche et la bande de vérité ; plus de formule « détection en conditions réelles » |

## 4. Contradictions arbitrées par l'intégrateur

| Sujet | Positions | Arbitrage retenu |
|---|---|---|
| Jumeau : contrat séparé ou drapeau | reponse-r2-10 et rssi : contrat `UnguardedVault` ; pitch, regles : drapeau immuable `guardsEnabled` | **Drapeau immuable sur le même code** : « même code de retrait, une seule variable » est l'argument causal ; le déploiement garde deux adresses |
| `ResponseEvidence` : niveau et `entryBytes` | reponse-r2-01 les émet ; conformite-r2-01 les supprime | **conformite-r2-01 prime** : `reasonHash` et `blockNumber` seulement ; limite « Guard public par construction » écrite |
| Heartbeat | v1 : plafond conservateur sur absence de battement ; conformite-r2-11 et redteam : levier de déni de service | **Heartbeat retiré** ; la panne de la Sentinelle ne change pas les retraits |
| HMAC et shred en P0 ? | demo-r2-budget : sortis du P0 ; conformite-r2-02 : `client_ref` dès le début | **`client_ref` en P0** (schéma, 10 lignes), `shred` avec contrôle de gel en P1 |
| N d'exécutions de latence | 10 (demo), 30 (chainsource), 20 (rssi, regles) | **N = 20 partout**, rapporté tel quel |
| Held-out : deux lots, B réservé, ou un seul | demo-r2-branche-echec vs bench-v2 | **Un seul mécanisme** : sources G et W, critère par famille, règle de décision ancrée ; B réserve en bonus |
| Rejet malgré 4 votes « amender » | `expected-flows` : 4 amender, 3 rejeter, statut « rejetée » du jury | Statut du jury conservé ; D8 en feuille de route, son amendement (P1 minimal) documenté pour un éventuel tour 3 |
| Critère L3 des faux positifs | detection-r2-fp-corpus : L3 ≤ 0,02 par adresse-semaine | Non vérifiable avant 150 adresse-semaines (le corpus en aura 15 à 40) : **la borne s'affiche sans verdict** en dessous |
| Safe Guard | reponse-r2-02 (a) 8 h | **Coupé** (2 rejets, 5 amendements sur (b) seul) ; D7 natif Safe en P1 |

## 5. Ce qui a changé dans l'architecture (v1 vers v2)

| Zone | v1 | v2 |
|---|---|---|
| Périmètre | « 54 % observables par principe » | Chiffre retiré (41,3 % pour Bitget seul) ; CSV de 20 incidents classés A à E avec mode ; « part bornée sur le passé nulle » |
| Faux positifs | Critère « un FP par jour », rejeu sur contrats d'infrastructure, règle des trois par transaction | Alertes par adresse-semaine, trésoreries publiques de la C-Chain en lecture seule, profils A / B (C non couvert), borne de Poisson indicative, critère écrit avant le run, repli explicite |
| Seuils | `config.frozen.json` de seuils globaux fixes | Procédure gelée : quantile empirique par adresse, budget d'alertes cible, plancher, plafond du contrat, APPRENTISSAGE, fit-check |
| Visibilité | Logs, soldes, rôles ; pas de choix d'infra | `probe-rpc`, niveaux T1 T2 T3, fail-closed sur l'attribution, badge « traces », N = 20 |
| Détecteurs | D1 « connue » booléen, D3 symétrique, D7 événements | Capacité bornée, `OPAQUE_EXIT`, D3 baisses seulement + anti faux `Transfer`, D7 slots EIP-1967 et signaux natifs Safe (P1), D8 rejeté |
| Contrat de réponse | `restrict(reasonHash)` libre | `restrict(ruleId, level, fenêtre, reasonHash)` vérifié : 4 reverts, prédicat on-chain, règles attestées plafonnées à L2, événement sans niveau |
| Échelle | RESTREINT global pour L3, budget de restriction, heartbeat | Quarantaine par compte, RESTREINT réservé aux invariants, DRIP à débit statique, `SELF_INFLICTED`, heartbeat retiré |
| Voie rapide | Éligibilité « dernier dépôt avant B », seau partagé | Droit individuel au prorata simple, gel des ajouts de liste blanche, test 50 contre 5 |
| Mode Watch | « Ne retient aucun fonds » | Idem, plus TTE, escalade selon le TTE, courbe Watch contre Guard, kit « prêt à signer », D7 natif Safe, « 128 s : nous ne battons pas » |
| Compteur | « Fonds sauvés » calculé | Coffres jumeaux (`guardsEnabled`), « Perte évitée sur ce scénario », « valeur retenue », « exposée à l'alerte », ligne « plafond seul » |
| Banc | Calibration + held-out 12 à 20 + rejeu conditionnel + adaptatif | Sources G et W, critère par famille, « pré-enregistré », baselines B0 B1 B2, règle de décision d'échec ancrée, jeu 3a bénin et 3b incidents ou formes |
| Preuve | `EvidenceAnchor` v2, ancrage à chaque palier, 3 voyants, feuilles HMAC par entrée | v3 avec `WITNESS`, cadence constante, épinglage hors bande, 4 voyants, deux scènes rouges, décision en clair + `client_ref`, `shred` soumis à contrôle de conservation |
| DORA | `T_connaissance` = première détection ; 4 champs dont montant et durée ; matrice « couvert » | Connaissance déclarée par un humain (L1 sans horloge), échéance prudente affichée, champs initiaux tirés de l'ITS, `classify.ts` + verdict provisoire, 4e échéance clients, refs vérifiées mécaniquement, matrice art. 10 / 11 / 17-19 / 28 / 30 / RTS 1774, trois statuts, slide trois colonnes |
| Responsabilité | « Le CASP, pas de modèle d'IA » | Trois étages (charte en 3 chiffres générés, faux négatif en face, RACI + gabarits), fiche de modèle, deux modèles |
| AML | Un pack unique | INTERNE / EXTERNE, « blocage conservatoire », branche `qui_est_victime`, linter |
| RGPD | « Couvert (démonstration de principe) » | « Partiel » : état du coffre = adresses pseudonymes publiques |
| Intégration | Fichiers CEF et payload PagerDuty | CEF/syslog validé, ticket-sink avec accusé unique, PDP avec HMAC, mode de défaut par classe et chaos (P1) ; « branché / non branché » |
| Avalanche | Finalité mesurée comme apport | Finalité = contexte ; `deploy:fuji` avec vérification Snowtrace, `FeePolicy` ; L1 et ICM en feuille de route ; spike supprimé |
| Écran | 4 actes, 3 compteurs, badges partout | Vue Scène (4 éléments + bande de vérité) et vue Audit ; « RÉEL » interdit ; test des 20 s à 3 lecteurs |
| Pitch | 6 segments, détection absente de la finale | 4 temps identiques à 5 et 3 min avec marge de 10 %, chiffre de détection jamais coupé, livrables générés des résultats |
| Budget | P0 à 42,5 h pour 40 h, coupe-feu 22h30 | P0 à 36 h (29,5 code + 6,5 écrits), tampon 4 h, P1 en ordre d'entrée strict, jalons relatifs, table « si coupé, l'écran montre » |

## 6. Points ouverts pour le tour 3
- **Notes individuelles** des sept critiques à fournir pour mesurer le gain par critique (60,6 de moyenne seulement).
- **Budget** : P0 à 36 h laisse 4 h de tampon ; P1 contient environ 45 h dans l'ordre d'entrée. À confirmer avec Adem : faut-il promouvoir la carte d'astreinte en P0 (au détriment du corpus FP ou de la vue Audit) ?
- **À vérifier par worker avant affichage** : formule des horloges (RTS 2025/301), champs initiaux de l'ITS 2025/302, critères du RTS 2024/1772, art. 10, 11, 17-19, 24-25, 28 DORA, RTS 2024/1774, art. 6(5), CMF L561-12 et L561-19, MiCA art. 49, 70, 75, RGPD art. 17(3)(b), lignes directrices EDPB 02/2025, chiffres CertiK (939,2 M$, 387,5 M$), 20 incidents du CSV, mécanisme de l'incident Bybit, disponibilité d'un modèle non-Claude sur Bedrock, mécanisme de vérification Snowtrace sur Fuji, adresse du flux Chainlink Fuji.
- **Actions humaines** : Titouan publie l'adresse de l'ancre avant 07h et lance `witness.ts` ; Titouan chronomètre le gabarit manuel (20 min) ; Titouan fait 2 à 3 appels marché avant 10h ; un humain télécharge les textes officiels dans `regulatory/sources/` (accord explicite) ; Adem finance les comptes Fuji à la main avant minuit et génère les tâches T-1xx.
- **Risque principal** : le jeu pré-enregistré peut sortir « insuffisant » à 05h ; la table de décision du §9.2 est écrite, mais la slide 3 et le pitch doivent être prêts à montrer un rouge.
- **Idées rejetées à reconsidérer si le temps le permet** : D8 (réconciliation des ordres), adaptateur d'alertes externes.
