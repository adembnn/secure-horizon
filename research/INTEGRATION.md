# Registre d'intégration des recherches — Sentinelle Fuji

> Rôle : chaque recherche produite par un agent doit finir **dans le produit**, ou être écartée avec une raison. Ce fichier est tenu par la session d'orchestration (Claude-Adem). Une ligne par sortie d'agent.
> Statut : `à intégrer` → `intégré` (avec l'endroit) ou `écarté` (avec la raison).
> Cap produit : un outil **utilisé, facile à utiliser, compréhensible**, qui règle une **vraie douleur**, et qui **se branche dans l'écosystème** réel du client et d'Avalanche.

## Décisions qui pilotent l'intégration
| Réf | Décision |
|---|---|
| D-003 | Track 1, sous-track 4 (DeFi + DORA), projet Sentinelle Fuji |
| D-004 | Cœur = détournement du circuit qui approuve les sorties de fonds (Bitget, KelpDAO, Drift). Limite de sortie indépendante du circuit, surveillant hors-bande. DORA = sortie de la chaîne |
| Grilling Q3 | La machine ne fait que freiner (plafond, file d'attente). Jamais de gel total ni de réouverture automatique. Reprise par 2 humains sur 3 |
| Grilling Q4 | L'outil propose la classification DORA. Un humain nommé décide et dépose. Un « non majeur » exige une 2e signature |
| Grilling Q6 | Démo en direct sur Fuji, rejeu local en secours |

## Sorties de recherche et leur intégration
| Fichier | Apport principal | Statut | Où ça va dans le produit |
|---|---|---|---|
| `tracks/T1_P4_chiffres_2026.md` | Chiffres 2026 sourcés (pertes T3, Bitget, DORA AMF/ESAs, CASP, Avalanche) | à intégrer | Écran « pourquoi », README, fiche de défense. Uniquement des chiffres [P]/[S] |
| `tracks/T1_P4_douleur_classement.md` | Classement des douleurs. N°1 = circuit d'approbation détourné | intégré (D-004) | Cadrage produit, phrase de douleur, périmètre du banc d'essai |
| `tracks/T1_P4_etat_de_l_art.md` | Personne ne fait « incident on-chain → déclaration DORA prouvée ». « Détecteur → pause » est saturé. Les 12 règles qualité des ESAs du 16/09/2026 | à intégrer | Correcteur de déclaration (12 règles). Corrections des champs 3.11/4.13/4.14, 2.5, 2.6. Le xBRL concerne le registre, pas l'incident. Wording « à notre connaissance » |
| `tracks/T1_P4_integration_ecosysteme.md` | 8 intégrations réelles + connecteurs documentés | à intégrer, après test | Couche connecteurs. Seulement ce que les sondes confirment |
| `tracks/T1_P4_connecteurs_testes.md` | Tests en direct des connecteurs (Fuji, Safe, Chainlink, ICM, OZ, GLEIF/ESMA, SOC, custodians) | en cours | Architecture de branchement v2 |
| `tracks/T1_P4_deploiement_reglementaire.md` | Où l'outil s'installe, ce qu'un éditeur tiers a le droit de faire (MiCA/DORA) | en cours | Grilling Q2 : modèle de déploiement |
| `loop/round-*.md` + `loop/SYNTHESE.md` | Critiques du jury simulé, solutions votées, questions pièges | en cours (tour 1 fait, v1 = 56/100) | Architecture v1 puis v2, questions pièges, limites |
| `../pitch/comprendre_piste4.md` | Vulgarisation. Trois points structurants : une attaque en une transaction ne se bloque que dans le contrat ; la pause suppose un contrat devant les fonds ; le LEI du champ 2.8 manque pour les oracles | partiellement intégré | Limites connues ; question G7 (où poser la limite) ; registre des tiers |
| `tracks/T1_P4_defi_dora_v2.md`, `T1_P4_defi_dora.md` | Règles DORA détaillées (RTS 2024/1772, RTS 2025/301, ITS 2025/302), idées HoneyVault / Autopilot / registre vivant | partiellement intégré | Moteur DORA. HoneyVault écarté du cœur : il vise les exploits de code, pas le circuit d'approbation (D-004) |

### Apports de Claude-Titouan
| Fichier | Apport principal | Statut | Où ça va dans le produit |
|---|---|---|---|
| `titouan/plan_v1_1.md` | Plan en une page : Guard = module sur coffre existant, plafond en dur, voie lente, Watch, dossier « N champs sur M prouvés », règles scellées avant tests, P0/P1/P2 | à intégrer, **base de la v2** | Squelette de docs/architecture.md v2. Seuls écarts : SIEM/webhook et écran gardés légers (exigence écosystème d'Adem), accroche D-004 |
| `titouan/A_spec_moteur_dora.md` | Logique exacte art. 6/8/9/10, RTS 2025/301. L'initial = champs 1.x et 2.x, presque tout calculable. 5 ambiguïtés en double lecture. 10 cas de test | à intégrer | Moteur DORA : exceller sur l'initial, pré-remplir l'intermédiaire, le final reste humain. Les 10 cas deviennent les tests unitaires |
| `titouan/challenge_archi_v0.md` | Leurre absent de l'archi, plafond en dur, traceur simulé = théâtre, pré-enregistrement du hash des règles, variantes d'évasion, mandat EIP-712, plafond de 24 h | à intégrer | Banc d'essai, mandat, chrono DORA. Le traceur passe en P2 (paquet de gel en document) |
| `titouan/reponses_msg005.md` | Pause machine acceptable si mandat signé, bornée, expirante, mode ombre. Champ 2.8 sans LEI = « à compléter par un humain ». Cas Bitget : lecture seule + point d'application indépendant | à intégrer | Échelle de réponse, champ 2.8, limites |
| `titouan/grilling_t1_reponses_G1_G6.md` | G1 (a). Démo en deux temps : Watch rejoue Bitget, Guard rejoue Drift. 4 garde-fous de la voie lente. IA optionnelle, champs mécaniques / profil / jugement | à intégrer | Scénario de démo, échelle, rôle de l'IA |
| `titouan/loop/round1_synthese.md` | Sa boucle de 7 jurés, 63/100. Attaques contre l'outil : empoisonnement de la ligne de base, épuisement du budget, fausse pause, clé du bot volée | à intégrer | Section « résistance de l'outil » de la v2 |

## Prochaine consolidation
Quand la boucle des jurés, les sondes de connecteurs et la recherche sur le déploiement sont toutes rentrées, faire **docs/architecture.md v2**. Elle doit :
1. recentrer sur D-004 ;
2. ne garder que les connecteurs testés ;
3. appliquer les corrections DORA de l'état de l'art ;
4. intégrer les réponses de grilling d'Adem et Titouan ;
5. découper le build en tâches pour les workers Bedrock.

Chaque ligne ci-dessus passe alors à `intégré` ou `écarté`.
