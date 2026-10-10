# DECISIONS — ADR très courts (APPEND-ONLY, merge=union)

Format : `D-NNN | date | décision | raison`. Pour réviser une décision : nouvelle ligne qui la remplace (« remplace D-00x »).

D-000 | 2026-10-10 | Harness de coordination = repo git (coord/), 1 fichier par tâche, INBOX/JOURNAL/DECISIONS append-only, workers headless Bedrock en worktrees | voir research/07_harness_design.md
D-001 | 2026-10-10 | EN ATTENTE — choix du projet. Candidats principaux : famille « garde-fou pour agents IA » (Seatbelt / AgentShield / TrifectaGuard). Décision non prise | à trancher par Adem + Titouan ; ensuite compléter la section « Projet / Stack » de CLAUDE.md
D-002 | 2026-10-10 | Règlement officiel = context/notion_guide.md (prime sur kickoff_slides.md) : gel dim. 12h00, cœur codé sam. 11h30 → dim. 12h00, 1 seule track confirmée sam. 18h30, mapping NIST CSF + OWASP Agentic/ATLAS/ATT&CK/D3FEND, données synthétiques, zéro secret | règlement ; livrables suivis en T-18x / T-28x
2026-10-10T21:25+02:00 | adem | D-003 | Track 1, sous-track 4 (DeFi + DORA) : projet « Sentinelle Fuji ». Remplace D-001. Archi v0 docs/architecture.md, amendée par boucle jury↔solveurs (research/loop/). | choix Adem 10/10 soir : trou le moins couvert (aucun outil ne relie incident on-chain et déclaration DORA), fit KPMG + Avalanche
2026-10-10T21:50+02:00 | adem | D-004 | Cœur du produit = détournement du circuit qui approuve les sorties de fonds (Bitget, KelpDAO, Drift ; ~76 % des pertes H1 2026 selon TRM). Limite de sortie indépendante du circuit + surveillant hors-bande ; DORA = sortie de chaîne. Précise D-003. | research/tracks/T1_P4_douleur_classement.md, validé par Adem
