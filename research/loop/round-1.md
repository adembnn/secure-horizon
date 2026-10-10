# Boucle jury ↔ solveurs — tour 1

Architecture critiquée : `docs/architecture.md` v0. Architecture produite : v1.
Date : 10 oct. 2026, samedi soir.

## 1. Notes du jury

**Moyenne avant amendement : 56,3 / 100.**

Les notes individuelles par critique n'ont pas été transmises à l'intégrateur, seule la moyenne l'a été. Le tableau donne donc le volume et la gravité des défauts par critique, qui expliquent la note. À renseigner au tour 2 si les notes brutes sont disponibles.

| Critique | Défauts | Bloquants | Majeurs | Mineurs | Note |
|---|---|---|---|---|---|
| kpmg (auditeur conformité) | 10 | 1 | 8 | 1 | n.c. |
| avalanche (écosystème) | 10 | 3 | 7 | 0 | n.c. |
| kryptosphere (chercheur DeFi) | 9 | 2 | 7 | 0 | n.c. |
| redteam | 10 | 4 | 6 | 0 | n.c. |
| rssi (acheteur CASP) | 9 | 4 | 5 | 0 | n.c. |
| pitch (jury pitch) | 10 | 3 | 7 | 0 | n.c. |
| regles (règlement et livrables) | 11 | 3 | 7 | 1 | n.c. |
| **Total** | **69** | **20** | **47** | **2** | **56,3 (moyenne)** |

Thèmes qui reviennent chez presque tous les critiques :
1. Banc d'essai circulaire (7 critiques sur 7).
2. Périmètre irréaliste pour environ 10 h (7 sur 7).
3. Conformité réduite à DORA, réponse à « qui est responsable » absente (6 sur 7).
4. Valeur de la blockchain faible : ancrage final, testnet, journal réécrivable (6 sur 7).
5. Pause globale auto-expirante : fail-open, déni de service, clé Sentinelle (6 sur 7).
6. Produit lié à un coffre maison, pas d'intégration, vecteurs dominants (clés, infra) non couverts (5 sur 7).

## 2. Défauts relevés

| id | critique | gravité | défaut |
|---|---|---|---|
| kpmg-r1-01 | kpmg | bloquant | Conformité limitée à DORA : AML/CFT, MiCA, AI Act absents |
| kpmg-r1-02 | kpmg | majeur | Moteur DORA classe depuis des mesures on-chain : omnibus, dénominateur, pays injectés |
| kpmg-r1-03 | kpmg | majeur | Références et horloge DORA approximatives (art. 9(5)(b), 4 h sans point de départ) |
| kpmg-r1-04 | kpmg | majeur | L2/L3 bloquent les retraits sans base contractuelle, coût du faux positif non chiffré |
| kpmg-r1-05 | kpmg | majeur | Pause expirante fail-open, clé Sentinelle non gouvernée, Sentinelle = tiers TIC |
| kpmg-r1-06 | kpmg | majeur | Valeur de preuve surestimée (testnet, ancrage final, hash non salé, LLM non rejouable) |
| kpmg-r1-07 | kpmg | majeur | Registre des tiers lu on-chain ≠ registre d'informations ; AWS absent |
| kpmg-r1-08 | kpmg | majeur | Métriques circulaires, seuils réglés sur le test |
| kpmg-r1-09 | kpmg | majeur | Périmètre démesuré pour 10 h, réel contre mock flou |
| kpmg-r1-10 | kpmg | mineur | Playbook sans obligations parallèles ni matrice de rôles ni escalade |
| avalanche-r1-anchor-adds-no-trust | avalanche | bloquant | Ancrage final seul : n'ajoute aucune confiance, équivalent RFC 3161 |
| avalanche-r1-mock-everything-no-avalanche | avalanche | majeur | Tout est mock, aucune primitive Avalanche, identique sur Sepolia |
| avalanche-r1-circular-benchmark | avalanche | bloquant | Banc circulaire, pas de rejeu réel, blocs Hardhat ≠ Fuji |
| avalanche-r1-latency-vs-block-time | avalanche | majeur | Latence détection → réponse non chiffrée |
| avalanche-r1-sentinel-key-is-attack-surface | avalanche | majeur | Clé de pause = surface d'attaque, modèle de rôles absent |
| avalanche-r1-oracle-invariant-tautology | avalanche | majeur | Invariant d'oracle tautologique (MockOracle contrôlé par nous) |
| avalanche-r1-persona-mismatch-offchain-losses | avalanche | majeur | Persona CASP ≠ coffre Solidity maison ; pertes surtout hors chaîne ; pas d'intégration |
| avalanche-r1-trace-freeze-is-a-stub | avalanche | majeur | Traçage limité à Fuji, demande de gel sans destinataire réel |
| avalanche-r1-gdpr-immutability-and-llm-liability | avalanche | majeur | RGPD contre immuabilité ; responsabilité de la pause automatique et du LLM |
| avalanche-r1-scope-vs-10-hours | avalanche | bloquant | Périmètre incompatible avec 10 h ; pas de registre d'adresses Fuji |
| kryptosphere-r1-01 | kryptosphere | bloquant | Les 3 attaques ne couvrent pas le vecteur dominant (clés, infra) |
| kryptosphere-r1-02 | kryptosphere | bloquant | Banc circulaire, trafic synthétique sans queue lourde, aucun rejeu |
| kryptosphere-r1-03 | kryptosphere | majeur | Aucune défense contre l'attaquant adaptatif ; latence non mesurée |
| kryptosphere-r1-04 | kryptosphere | majeur | Invariant dans notre contrat, mint non adossé (KelpDAO) non vu |
| kryptosphere-r1-05 | kryptosphere | majeur | Pause automatique à double tranchant, clé de pause, gardiens ciblés |
| kryptosphere-r1-06 | kryptosphere | majeur | Traceur et demande de gel = théâtre |
| kryptosphere-r1-07 | kryptosphere | majeur | Slide conformité : seulement DORA ; LLM rédige des champs réglementaires |
| kryptosphere-r1-08 | kryptosphere | majeur | Ancrage sur testnet = horodatage, complétude non démontrée |
| kryptosphere-r1-09 | kryptosphere | majeur | Périmètre trop large, démo sur nos propres contrats, intégration réduite à Slack |
| redteam-r1-01 | redteam | bloquant | Seuils fixes publics, contournables (drain lent, Sybil, sortie sans Withdraw, latence) |
| redteam-r1-02 | redteam | bloquant | Modèle de pouvoirs sous-spécifié : `revokeRole` désarme la Sentinelle |
| redteam-r1-03 | redteam | majeur | La défense est un déni de service ; pause expirante ; auto-incident DORA |
| redteam-r1-04 | redteam | bloquant | Périmètre loin des pertes réelles ; qui migre ses fonds ? |
| redteam-r1-05 | redteam | majeur | Métriques circulaires, pas de baseline, bruit RPC |
| redteam-r1-06 | redteam | majeur | « Chaque champ prouvé par une transaction » est un surclaim ; horloge floue |
| redteam-r1-07 | redteam | majeur | AML/CFT, MiCA, AI Act absents ; responsabilité ; RGPD fragile |
| redteam-r1-08 | redteam | majeur | Preuve auto-attestée, rejeu tautologique, LLM non reproductible |
| redteam-r1-09 | redteam | bloquant | Périmètre contre gel 08h00 ; Fuji, Bedrock, horloge 4 h truquée, traceur théâtral |
| redteam-r1-10 | redteam | majeur | Demande de gel cosmétique ; registre DORA non lisible on-chain |
| rssi-r1-01 | rssi | bloquant | Ne fonctionne que sur GuardedVault ; pas de connecteur custody/SIEM/ITSM |
| rssi-r1-02 | rssi | bloquant | La détection ne couvre pas ~76 % des pertes (infra, clés, signature) |
| rssi-r1-03 | rssi | majeur | Métriques de détection circulaires |
| rssi-r1-04 | rssi | bloquant | Coût d'une fausse pause non borné, griefing, expiration, reprise sans SLA |
| rssi-r1-05 | rssi | bloquant | « Qui est responsable » sans réponse écrite ; sceptique = LLM |
| rssi-r1-06 | rssi | majeur | Champs DORA off-chain ; registre ≠ entités juridiques ; AML absent |
| rssi-r1-07 | rssi | majeur | Valeur de l'ancrage sur testnet surévaluée |
| rssi-r1-08 | rssi | majeur | Sentinelle = SPOF, cible, nouveau tiers ICT, mode dégradé |
| rssi-r1-09 | rssi | majeur | Périmètre irréaliste, traceur sur adresses simulées |
| pitch-r1-01 | pitch | bloquant | Phrase de pitch à 4 produits, pas de scène à retenir |
| pitch-r1-02 | pitch | majeur | 6 panneaux + onglet, jargon, pas de séquence |
| pitch-r1-03 | pitch | bloquant | 3 attaques au lieu d'un scénario, pas de coupe, pas de repli |
| pitch-r1-04 | pitch | bloquant | Évaluation circulaire, pas de jeu séparé |
| pitch-r1-05 | pitch | majeur | La Sentinelle ne voit que la chaîne, vélocité = limiteur classique, outils gratuits existants |
| pitch-r1-06 | pitch | majeur | Client CASP avec custodian ; intégration faible |
| pitch-r1-07 | pitch | majeur | Pause = risque (DoS, incident DORA), traceur décor |
| pitch-r1-08 | pitch | majeur | Responsabilité = une phrase, pas de coupe-circuit |
| pitch-r1-09 | pitch | majeur | Valeur de la blockchain faible, journal incomplet avant ancrage |
| pitch-r1-10 | pitch | majeur | Moteur DORA sur données synthétiques, champs à jugement, horloge ambiguë |
| regles-r1-01 | regles | bloquant | Périmètre irréaliste, pas de chemin critique ni coupe-feu |
| regles-r1-02 | regles | bloquant | Évaluation circulaire, attaque 3 comptée en détection |
| regles-r1-03 | regles | majeur | Attaques « modelées sur 2026 » infidèles (Bitget, Drift, Resolv non sourcé) |
| regles-r1-04 | regles | majeur | Sentinelle cible et risque, gardiens sans SLA |
| regles-r1-05 | regles | majeur | Playbook exigé inexistant, demande de gel sans canal |
| regles-r1-06 | regles | bloquant | Mapping NIST/ATT&CK/D3FEND provisoire et incomplet |
| regles-r1-07 | regles | majeur | Conformité = DORA et références non vérifiées |
| regles-r1-08 | regles | majeur | Ancrage faible et attaquable ; LLM non déterministe |
| regles-r1-09 | regles | majeur | Intégration faible, mocks, différenciation fragile |
| regles-r1-10 | regles | majeur | Script de démo, pitch 5+2 / 3+3 et deck sans base ; repli absent |
| regles-r1-11 | regles | mineur | Hygiène des clés, manifeste d'adresses, garde de cible non spécifiés |

## 3. Solutions et votes

Statut : toutes les 43 propositions ont été **retenues**, aucune rejetée en bloc ; la quasi-totalité l'a été avec amendements. « Pour » = accepter + amender ; « contre » = rejeter. Détail A / Am / R = accepter / amender / rejeter, sur 7 votants.

### 3.1 Détection

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| detection-r1-01 | retenue | 7/0 (0/7/0) | Banc scellé réduit à 2 jeux (calibration + held-out 12 à 20 attaques de workers isolés), ancre B1/B2 + critères d'échec, IC, pas de branche git (hash seul), plafond 3 à 4 h |
| detection-r1-02 | retenue | 7/0 (0/7/0) | Rejeu réel avec étape 0 de 20 à 30 min puis repli ; adresses de contrats seulement ; incidents à sortie étalée ; une seule interface ChainSource |
| detection-r1-03 | retenue | 7/0 (1/6/0) | D1 D2 D3 en P0 + D7 ; D4 en P2 ; définition stricte de « connue » ; L3 exige 2 détecteurs ; ablation obligatoire |
| detection-r1-04 | retenue | 7/0 (0/7/0) | Plafond agrégé dans le contrat + formule de perte max ; adaptatif = recherche aléatoire 1 h ; Fuji N de 5 à 10 ; fusionné avec reponse-r1-03 |
| detection-r1-05 | retenue | 7/0 (4/3/0) | Modes Watch / Guard + ExecutionAdapter à 1 implémentation ; 54 % = plafond d'observabilité, pas couverture ; sélecteur d'adresse libre |
| detection-r1-06 | retenue | 6/1 (0/6/1) | Réduit : Chainlink Fuji (si confirmé) + invariant de prix par part + colonnes Prévention / Détection ; TWAP et D6 coupés |
| detection-r1-07 | retenue | 7/0 (0/7/0) | Fusionné en un seul modèle de pouvoirs (timelock, SENTINEL qui resserre, D7) ; KMS et 2e clé retirés ; heartbeat large et non ouvrant |
| detection-r1-08 | retenue | 7/0 (7/0/0) | Baseline naïve réglée au mieux ; colonne Hexagate supprimée ; afficher aussi les cas où la baseline gagne |
| detection-r1-09 | retenue | 5/1 (2/4/1) | Rétrogradé en P3 ; version minimale sans alerte par défaut ; pas de « 0 alerte sur 24 h » sans mesure |
| detection-r1-10 | retenue | 7/0 (5/2/0) | 4 familles F1 F2 F3 F6 ; F4 en prévention, F5 via l'adaptatif ; balayage de vitesse ; fiche de fidélité ; Resolv supprimé |
| detection-r1-11 | retenue | 7/0 (7/0/0) | Limites L-A à L-E dans un `limits.md` unique ; L-C reformulée « nous n'en avons pas trouvé » |

### 3.2 Réponse

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| reponse-r1-01-voie-rapide-voie-lente | retenue | 7/0 (0/7/0) | Un seul design de retrait : liste blanche 1 à 2 min en démo, file différée annulable, modes NORMAL / RESTREINT, sortie par gardiens ; snapshot contre Sybil ; 4 à 6 h |
| reponse-r1-02-sentinelle-pouvoirs-bornes | retenue | 7/0 (0/7/0) | Fusionné avec detection-r1-07 ; budget borne le gel total seulement, épuisement = plafond statique ; argument « sous seuil DORA 2 h » retiré |
| reponse-r1-03-budget-de-latence | retenue | 7/0 (0/7/0) | Un seul LatencyProbe avec detection-r1-04 ; pas de tx pré-signée ; aucun chiffre avant mesure |
| reponse-r1-04-charte-signee-et-cout-faux-positif | retenue | 7/0 (0/7/0) | Un seul PolicyRegistry (hash seulement, bornes figées au déploiement) ; coût valeur × minutes ; clause CGU = gabarit d'une page |
| reponse-r1-05-playbook-executable | retenue | 7/0 (0/7/0) | playbook.yaml + RACI + minuteur d'escalade démontré en 30 s ; horloges alignées ; obligations « à confirmer » ; payload JSON seulement |
| reponse-r1-06-adaptateurs-integration-sans-migration | retenue | 7/0 (0/7/0) | Fusionné avec detection-r1-05 et demo-r1-adaptateurs : Observer + ActionAdapter + CEF/JSON ; Safe et custody en conception |
| reponse-r1-07-tracage-triage-gelabilite | retenue | 7/0 (0/7/0) | P2, 3 à 4 h : classifier synthétique, MockStablecoin SIMULATION, freeze-pack JSON ; seconde chaîne et PDF supprimés ; fusionné avec demo-r1-traceur-honnete |
| reponse-r1-08-registre-info-reformule | retenue | 6/1 (1/5/1) | Fusionné dans conformite-r1-07 (compteur de couverture + dérive déclaré / on-chain) |
| reponse-r1-09-limites-connues-a-assumer | retenue | 7/0 (7/0/0) | Dans `limits.md` unique ; étiquette SIMULATION ; dates réglementaires « à vérifier » |

### 3.3 Conformité

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| conformite-r1-01 | retenue | 7/0 (0/7/0) | `reasonHash` dans la tx + EvidenceAnchor v2 (seq) + `verify` à 3 contrôles + démo de suppression ; témoin et TSA en P3 ; 6 à 7 h |
| conformite-r1-02 | retenue | 7/0 (0/7/0) | `obligations.yaml` ≈ 25 lignes / 5 régimes, vérifié EUR-Lex, orange si non vérifié ; loss-ledger + aml-pack gabarit ; AMLR 2027 corrigé ; 1 page Régulateur |
| conformite-r1-03 | retenue | 7/0 (0/7/0) | Un seul bloc Responsabilité fusionné ; désarmement à 1 signature = mode manuel plafonné, jamais ouvrant ; pas de ClassificationRegistry ; pas d'expiration qui rouvre ; 6 h |
| conformite-r1-04 | retenue | 7/0 (2/5/0) | Un seul `Input<T>` et `ProvenanceBadge` ; pourcentage calculé, jamais estimé ; fixtures `synthetic:true` ; portée du dénominateur affichée |
| conformite-r1-05 | retenue | 7/0 (0/7/0) | `refs.yaml` + test bloquant ; 3 horloges (formule à confirmer) ; seul le gabarit initial rempli ; 12 cas relus par Titouan ; export CSV supprimé |
| conformite-r1-06 | retenue | 7/0 (3/4/0) | Vérificateur déterministe `NumbersInEvidence` à la place du sceptique ; LLM off par défaut ; art. 50 AI Act « à confirmer » ; fusionné avec demo-r1-secrets |
| conformite-r1-07 | retenue | 7/0 (0/7/0) | Annexe technique : tableau, colonne source, ligne « sans contrat », compteur ; graphe et validateur LEI coupés ; absorbe reponse-r1-08 ; 2 à 3 h, premier à couper |
| conformite-r1-08 | retenue | 7/0 (3/4/0) | Feuilles HMAC sur entrées avec pseudonyme ; stèle ancrée affichée en orange ; chaîne portée par les feuilles ; 1,5 à 2 h |
| conformite-r1-09 | retenue | 7/0 (4/3/0) | `mapping.yaml` ≈ 12 contrôles reliés à une métrique ; listes d'IDs vérifiées ; D3FEND seulement si vérifié ; T1190 retiré ; fiche HTML générée |
| conformite-r1-10 | retenue | 7/0 (6/1/0) | `keys.ts`, `deployments/fuji.json`, `assertTargetAllowed()` ; test anti-secret contextuel (pas le motif 64 hex) ; P0 |
| conformite-r1-11 | retenue | 7/0 (7/0/0) | Dans `limits.md` unique ; « non relu par un juriste » ; dépôt via le canal de l'autorité |

### 3.4 Démo et pitch

| id | statut | votes pour/contre (A/Am/R) | amendement retenu |
|---|---|---|---|
| demo-r1-priorites-coupe-feu | retenue | 7/0 (0/7/0) | P0 redéfini après fusions (inclut banc minimal et livrables écrits) ; fusions décidées ; coupe-feu 22h30 / 01h / 04h / 06h30 / 07h30 ; schémas figés d'abord |
| demo-r1-badges-provenance-mode-degrade | retenue | 7/0 (6/1/0) | Taxonomie unique avec conformite-r1-04 ; interrupteurs LLM et traceur en P1 ; journaliser l'état |
| demo-r1-trois-modes-rejeu-fuji | retenue | 7/0 (2/5/0) | Deux modes LIVE et REJEU-FUJI ; ChainSource unique ; run de référence dès la première réussite ; comptes préfinancés |
| demo-r1-scenario-unique-pitch-4-lignes | retenue | 7/0 (1/6/0) | Pas de chiffre Drift contesté ; formulation des 4 h corrigée ; 40 s de banc dans le script ; 30 s sur « qui est responsable » |
| demo-r1-ecran-quatre-actes | retenue | 7/0 (6/1/0) | 3 voyants dans l'acte Preuve, voies dans l'acte Frein, banc et sélecteur d'adresse accessibles ; flèches manuelles |
| demo-r1-adaptateurs-sans-migration | retenue | 7/0 (0/7/0) | « OpenZeppelin non modifié » retiré (non pausable) ; Observer + `POST /policy/decision` seulement ; fusionné avec reponse-r1-06 |
| demo-r1-avalanche-natif-concret | retenue | 7/0 (0/7/0) | Chainlink et tag `finalized` testés en 20 min avant promesse ; USDC Circle remplacé par MockStablecoin ; L1 / ICM / AvaCloud en feuille de route |
| demo-r1-horloge-honnete-et-metriques | retenue | 7/0 (5/2/0) | Source AMF/ACPR « rarement respectés » retirée tant que non sourcée ; badge scénario compressé ; seuils en blocs |
| demo-r1-secrets-llm-cache-et-reseau | retenue | 7/0 (6/1/0) | Texte « (cache) » ou « (gabarit) » visible ; fusionné avec conformite-r1-06 et conformite-r1-10 |
| demo-r1-traceur-honnete | retenue | 6/1 (0/6/1) | Pas de module séparé : cas « piste perdue » absorbé par reponse-r1-07 |
| demo-r1-business-et-deck | retenue | 7/0 (0/7/0) | Plan de 8 slides avec détection, conformité et limites ; prix = hypothèse ; aucune conversation citée sans trace ; chiffres sourcés |
| demo-r1-limites-assumees | retenue | 7/0 (3/4/0) | Limites (b) et (e) réécrites selon ce qui est réellement rejoué ; dans `limits.md` unique |

## 4. Ce qui a changé dans l'architecture (v0 vers v1)

| Zone | v0 | v1 |
|---|---|---|
| Produit | Notre coffre protégé | Un produit, trois sorties : Watch (aucune migration), Guard (optionnel), Dossier |
| Détection | Événements `Withdraw`, seuils « à calibrer » | OutflowLedger sur les sorties de valeur : D1 destinataires inédits, D2 multi-échelles, D3 delta de solde, D7 changement de pouvoir ; seuils uniquement dans `config.frozen.json` |
| Réponse | Pause globale avec expiration automatique | Voie rapide / voie lente, file différée annulable, NORMAL / RESTREINT, sortie par 2 gardiens, plafond agrégé, formule de perte max |
| Pouvoirs | Non spécifiés | Un modèle : ADMIN derrière timelock, SENTINEL qui ne peut que resserrer, 3 gardiens ; budget de restriction ; heartbeat non ouvrant ; Sentinelle dans son propre inventaire de tiers |
| Responsabilité | « Règles signées par la direction » | Charte EIP-712 + PolicyRegistry (hash), RACI, classification humaine nommée, coût de faux positif en valeur × minutes, auto-incident compté |
| Banc d'essai | Circulaire, un jeu | Calibration + held-out scellé + rejeu réel conditionnel ; ancre B1 < B2 ; critères d'échec d'avance ; IC ; baseline ; ablation ; adaptatif ; courbe de vitesse |
| Preuve | Une racine Merkle en fin d'incident | `reasonHash` dans la tx de réponse, EvidenceAnchor v2 avec `seq`, ancrage à chaque palier, `verify` à 3 contrôles, démo de suppression, feuilles HMAC et crypto-shredding |
| Moteur DORA | 10 champs « prouvés par une transaction », 1 horloge, art. 9(5)(b) | Provenance par champ, verdict provisoire, 3 horloges (à confirmer), 4 champs prouvés au P0, gabarit initial seul, références vérifiées, deux branches juridiques, décision humaine |
| Registre des tiers | « Lignes du registre d'informations » | Annexe technique avec colonne source, ligne « sans contrat », compteur calculé |
| Conformité | DORA seulement | Matrice `obligations.yaml` (DORA, MiCA, AML/CFT, RGPD, AI Act), loss-ledger, pack AML, `mapping.yaml` avec IDs vérifiés |
| LLM | Rédige le texte libre, sceptique LLM | Désactivé par défaut, gabarits, cache, vérificateur déterministe, supervision humaine |
| Traceur | Pilier de la réponse | P2, triage de gelabilité, émetteur simulé étiqueté, échec montré |
| Avalanche | RPC polling, Mock* | Finalité mesurée, Chainlink si confirmé, `deployments/fuji.json` ; L1 / ICM / AvaCloud en feuille de route |
| Écran | 6 panneaux | 4 actes, 3 compteurs, onglet analyste, badges de provenance, interrupteurs |
| Démo | Live Fuji, 3 attaques | Un scénario ; LIVE et REJEU-FUJI avec bascule annoncée ; horloge jamais truquée |
| Budget | Non chiffré | P0 à P3, 40 h-worker de capacité contre ≈ 80 h de besoin total, coupe-feu 22h30 / 01h / 04h / 06h30 / 07h30, P3 en « bonus si le temps le permet » |
| Limites | 5 puces | `limits.md` unique, section Questions pièges et réponses |

## 5. Points ouverts pour le tour 2
- Contradictions arbitrées sans vote : expiration de la pause (supprimée, contre `maxAutoPause` de conformite-r1-03), désarmement à un gardien (mode manuel plafonné). À faire re-challenger.
- Total des besoins ≈ 80 h-worker pour 40 h de capacité : confirmer la coupe de P2 avec Adem.
- À vérifier par worker avant affichage : formule des 3 horloges (RTS 2025/301), chiffres CertiK (939,2 M$ et les 4 montants), 362 CASP / 36 en France, adresse du flux Chainlink Fuji, tag `finalized`, IDs D3FEND, MiCA art. 49 et 75, AMLR 2027.
- Notes individuelles de chaque critique à fournir pour comparer au tour 2.
