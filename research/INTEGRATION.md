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
| `tracks/T1_P4_connecteurs_testes.md` | Testés en direct. **Branchables sans clé** : RPC Fuji (officiel + publicnode), Data API, Routescan, Chainlink AVAX/USD, lecture ICM, Safe 1.4.1 + Guard, plafond OZ (4 tests verts), GLEIF, registre ESMA, gabarit DORA, export OCSF (0 erreur). **Clé ou compte requis** : webhooks AvaCloud, sandbox Fireblocks et BitGo, Slack, PagerDuty, Jira, SIEM. **Absents sur Fuji** : traces, interface Safe, Zodiac Roles v2, Proof of Reserve, API de dépôt AMF. Corrections : ~350 CASP UE (36 FR confirmés), blocs de 2,27 s en moyenne, exemple OCSF à refaire | à intégrer | Couche connecteurs v2 : seulement les « branchables ». Démarches humaines pour les clés |
| `tracks/T1_P4_faux_positifs_evasion.md` | 12 opérations légitimes qui déclenchent à tort. Remède : **périmètre d'adresses propres signé**, les mouvements internes ne sont pas des sorties. Opération déclarée = voie différente, jamais exemptée (leçon Bybit). La ruée bancaire est bornée aussi par le plafond. 13 évasions avec parade. Protocole de banc chiffré | à intégrer | Périmètre signé au MVP. Banc d'essai (10 000 événements, 13 classes, boîte blanche et noire). Limites dures dans les « limites connues » |
| `tracks/T1_P4_deploiement_reglementaire.md` | Recommande un **gardien à veto seul** : Guard Safe qui ne fait que resserrer, plus un callback de politique documenté (Fireblocks co-signer, règle webhook BitGo), avec Watch comme porte d'entrée. Les contrats Safe 1.4.1 sont à l'adresse canonique sur Fuji. L'éditeur est un prestataire TIC (DORA art. 3(19)) et le CASP reste responsable. Un veto relève probablement de l'art. 30(3). Une part de clé ou un module à droit d'exécution risque d'être qualifié de garde (MiCA). L'extension Chrome est un mauvais socle (Wallet Guard fermé, Blowfish absorbé) | à intégrer (Q2 en attente d'Adem) | Modèle de déploiement v2 : Watch → Guard Safe → callback custodian. Section réglementaire. Démo de 3 min (§5.3 du fichier) |
| `loop/round-*.md` + `loop/SYNTHESE.md` | Boucle terminée : 56,3 → 60,6 → 59,5, arrêt sur stagnation. 10 changements majeurs (Watch/Guard/Dossier, fin de la pause globale, `restrict()` vérifié par le contrat, faux positifs par adresse-semaine, banc pré-enregistré avec baseline « plafond seul », horloges DORA déclenchées par un humain), 12 limites, 12 questions pièges. **Budget P0 = 36 h sur 40** | à intégrer | Questions pièges et limites dans la v2. Budget à recaler sur le temps réel restant |
| `../pitch/comprendre_piste4.md` | Vulgarisation. Trois points structurants : une attaque en une transaction ne se bloque que dans le contrat ; la pause suppose un contrat devant les fonds ; le LEI du champ 2.8 manque pour les oracles | partiellement intégré | Limites connues ; question G7 (où poser la limite) ; registre des tiers |
| `tracks/T1_P4_defi_dora_v2.md`, `T1_P4_defi_dora.md` | Règles DORA détaillées (RTS 2024/1772, RTS 2025/301, ITS 2025/302), idées HoneyVault / Autopilot / registre vivant | partiellement intégré | Moteur DORA. HoneyVault écarté du cœur : il vise les exploits de code, pas le circuit d'approbation (D-004) |

| `tracks/T1_P4_catalogue_detecteurs.md` | Taxonomie de ~60 signaux en 8 familles. Standard partout : gros transfert, sanctions, rôles, allowlist, vélocité. **Rare : écart backend vs chaîne** (seul analogue : Forta Bridge Balance Difference). 14 signaux manquants à (a)-(e), dont : indexer les `Transfer` par `from` (drain par allowance), `delegatecall` et événements Safe (Bybit, Drift), % du solde par tx et « vidé à zéro », âge du destinataire. Le contexte ne fait que relever la sévérité | à intégrer | Détecteurs v2 : (a)-(d) + top 3 des manques au MVP. Annuaire synthétique `synthetic:true` sur Fuji |

| `tracks/T1_P4_preuve_demande_client.md` | **Preuve de demande client : partiellement neuf.** La signature d'intention existe en non-custodial (Hyperliquid, StarkEx, Gnosis Pay, passkeys Safe et Coinbase). Aucun CEX, CASP ou custodian trouvé ne la fait vérifier par un garde on-chain indépendant du backend (~70 % de confiance). **Précompile P-256 actif sur Fuji, testé** (ACP-204, ~6 900 gas). OpenZeppelin 5.1+ a P256 et WebAuthn. Limites : faux clients créés par le backend (registre sous quorum humain + timelock + quota), WebAuthn n'affiche rien (front compromis), EVM seulement, omnibus | à intégrer, candidat d'innovation | Vigile v2 : règle « sortie adossée à une demande signée par le client » + plafond agrégé. Formulation jury : « transposer la signature d'intention du non-custodial vers la garde omnibus » |

| `tracks/T1_P4_signaux_incidents.md` | 33 incidents 2022-2026 × signaux. Sur 32 : **(a) destinataires inédits se déclenche dans 31 cas, (b) cumul dans 30**. (d) changement de pouvoirs : 8 cas seulement (classe Safe/multisig). (c) écart backend franc : 7 cas, sinon il exige le flux back-office du client. Sorties en 12 à 18 min, réaction médiane ~66 min, récupéré 0,08 à 24 %. Nouveaux signaux étayés : adresse financée par mixeur (WazirX J-8, Drift J-21), tx de test, vidage simultané multi-wallets, changement d'implémentation, mint non adossé, adresse sosie, rôle dormant. « Gas anormal » non étayé | à intégrer | Banc d'essai rejouant les schémas réels. (a)+(b) cœur, (d) pour la classe Safe, financement par mixeur et vidage simultané au MVP. Agrégation par entité. Chiffre pitch : 31/32 |

| `tracks/T1_P4_nouveaute_verdict.md` | **Contradicteurs 3/3 sur N1-N4 : aucune brique n'est inventée seule.** N1 fait par Coinbase IVy et Blockdaemon (mais l'intention vient du backend). N2 en morceaux chez Morpho, Spark, Lido, ERC-8238, Hypernative Safe Shield. N3 partiel chez Incident Oracle et QENEX. N4 chez ERC-8196 et OPA. **Alerte : Tripwire (ETHGlobal Tokyo, sept. 2026) = détection + clé qui ne peut que pauser + approbation humaine.** Innovation réelle = assemblage et cible : (1) plafonds sans fonction de hausse + retrait du Guard protégé + reprise 2/3, testés contre signataires compromis ; (2) intention venant d'un canal que le backend ne peut pas écrire ; (3) chaque champ DORA prouvé on-chain, reclassé quand le Guard agit ; (4) décisions engagées et rejouables par un tiers ; (5) pouvoir minimal gradué | à intégrer, **cadre la v2** | Positionnement et pitch. Liste « ne jamais dire » du §5. Démo : attaque des signataires compromis contre le plafond |

| `tracks/T1_P4_alternatives_gratuites.md` | **Testé** : ntfy.sh (notification téléphone sans compte), gh connecté, Docker 29.6 disponible, déployeur Arachnid + Safe singleton factory + ERC-2470 présents sur Fuji, donc **Safe 1.5.0 et son ModuleGuard déployables par nous**. XLSX officiel AMF téléchargeable sans compte. Handler Fireblocks officiel open source | à intégrer | Alertes ntfy, tickets GitHub, SIEM Docker, Safe 1.5 auto-déployé (règle le contournement par module), fichier AMF pré-rempli |

| `tracks/T1_P4_rejeu_bitget_avalanche.md` | **Rejeu réel, lu sur la chaîne** : 821 012 AVAX (90 % du solde de « Bitget: 35 ») puis 8,2 M USDC sortis vers 0x770b le 24 sept. La règle « destinataire inconnu > 50 % du solde » alerte **au premier bloc, 0 faux positif sur 30 jours**. La règle « cumul » a besoin de N ≥ 200 et ne sert que la gravité. **À l'alerte, ~11 M$ restaient sur les wallets frères ; 8,2 M$ sont partis 98 min plus tard** : il faut une action, pas seulement une alerte. Piège : 24 transferts sur 34 sont de l'address poisoning | à intégrer, **mesure de détection non circulaire** | Banc d'essai : rejeu Bitget comme preuve d'existence. Argument « plafond sur les wallets frères ». Filtre anti-poisoning |

| `tracks/T1_P4_connecteurs_implementes.md` + `poc/connectors/` | **12 connecteurs sur 12 prouvés en local, vérifiés par un tiers** : Fireblocks (format co-signer), BitGo (policy webhook), Mattermost (format Slack), Loki (OCSF), Gitea (ticket), Safe 1.5.0 ModuleGuard, Zodiac Roles, traces sur fork Fuji, Chainlink réel + mock, WebSocket temps réel, XLSX AMF (`fill-xml.mjs`, pas exceljs seul), ntfy. Code source des PoC dans `research/poc/connectors/`, sans clés | à intégrer | Base de code réutilisable par les workers de build |
| `cap/revue-2300.md` + `cap/jury_aveugle_2315.md` | **Revue de cap : À CORRIGER. Jury à l'aveugle : 67/100**, « pas une idée de merde » 8/8, problème réel vérifié 8/8, exécution risquée 8/8. Défaut commun : **mauvaise cible** (un CEX multi-chaînes ne migre pas vers un coffre Avalanche). Faiblesse : registre des clés clients. Ce qui vaut l'argent : dossier DORA relié aux transactions | à trancher par Adem | Recentrage proposé : trésoreries on-chain, démo unique chiffrée, coupes de la revue de cap |

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

## D-007 barrière d'intention (11/10, 01h15)
| Sortie | Statut | Où |
|---|---|---|
| O_barriere_intention (synthèse O0-OC) | intégré : filet indépendant de l'intention, réponse graduée, mesure 3 bras, « avertit » au lieu de « bloque » | MSG-029, docs/BRIEF_direction.md à mettre à jour |
| CHALLENGE-INTENT-BARRIER-V3 (10 critiques) | intégré sauf « un seul scénario » (amendé : héros + 2 scènes courtes) | MSG-029 |
| P_signers_mirror (dit / affiché / fait) | intégré : usage vision de Clef sur la page affichée, à chiffrer | MSG-029 |
| Q_boucle_auto_amelioration + loop_v3/round1 (6 juges, ~60/100) | intégré : faisabilité plafonnée tant que rien n'est mesuré → test Snap et banc réel prioritaires | MSG-029 |
| T-101 contrats de démo | intégré : 26 tests verts, non déployé sur Fuji | branche t/T-101 |
| T-103 comparateur | intégré avec réserves : 67 tests verts, jargon « permit » résiduel, Clef non appelé | branche t/T-103 |
| T1_P4_faisabilite_particulier | écarté (direction D-006 abandonnée), archivé | research/tracks/ |
