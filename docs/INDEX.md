# Index : quoi lire, dans quel ordre

Pour un jury ou un relecteur. Mis à jour le 11 oct. 2026. Tous les chemins partent de la racine du dépôt `secure-horizon`. Ce qui est marqué « périmé » décrit l'ancien produit (nom Sentinelle, retenue graduée, deux portes) : ne pas s'en servir.

## Parcours conseillé (20 minutes)

| Ordre | À lire | Chemin | Pourquoi |
|---|---|---|---|
| 1 | README | `README.md` | Le produit, ce qu'il fait, l'installation, les limites, en deux pages |
| 2 | Chiffres | `livrables/CHIFFRES.md` | Seule table de chiffres autorisée. Chaque ligne a sa source, sa date et sa réserve |
| 3 | Fiche de défense | `livrables/FICHE_DEFENSE.md` | Une page : menace, réponse, référentiels, métriques |
| 4 | Pitch | `research/titouan/PITCH_V6_TITOUAN.md` | Pitch retenu (D-010). Versions chronométrées : `livrables/PITCH_5MIN.md`, `livrables/PITCH_3MIN.md` |
| 5 | Démo web | `research/titouan/T_banc_e2e/webdemo/index.html` | Rien à installer, faux portefeuille. Notice : `research/titouan/T_banc_e2e/webdemo/README_WEBDEMO_FR.md` |
| 6 | Scènes de démo | `pitch/DEMO_SCENES.md` | Les trois scènes, ce qui vient après l'alerte, les limites |
| 7 | Questions du jury | `livrables/QR_JURY.md` | Les questions les plus dures, réponses courtes |
| 8 | Rapports de mesure | voir la liste ci-dessous | Les preuves derrière chaque chiffre |

## Rapports de mesure

| Mesure | Chemin | Ligne de CHIFFRES.md |
|---|---|---|
| Moteur seul et avec détecteurs | `research/titouan/T_banc_e2e/pipeline/RESULTATS_INTEGRATION.md` | A1 à A3 |
| Conditions du produit (synthétique) | `research/titouan/T_banc_e2e/banc_realiste/BANC_REALISTE.md` | A4 |
| Cas de décalage « j'ai écrit X, la demande donne Y » | `research/titouan/T_banc_e2e/attacks_decalage/RAPPORT.md` | A5, A7 |
| Jeu aveugle de 250 cas (non passé) | `research/titouan/T_banc_e2e/blind_decalage/README.md` | A6 |
| Lecture de la phrase écrite | `research/titouan/T_banc_e2e/intention_texte/RAPPORT.md` | A8 |
| Apport de l'intention écrite, lecture par Clef | `research/titouan/T_banc_e2e/pipeline/RESULTATS_INTENTION_CLEF.md` | A9, A10 |
| Grille phrase / demande, contrôle scellé | `research/titouan/T_banc_e2e/pipeline/grille/RAPPORT_GRILLE.md` | A11 à A14 |
| Pipeline strict, avant et après | `research/titouan/T_banc_e2e/pipeline/RAPPORT_STRICT.md` | A15 |
| Latence du verdict local | `research/titouan/T_banc_e2e/server/test/results.json` | A16 |
| Trafic réel Avalanche et Ethereum | `research/titouan/T_banc_e2e/realtraffic/REALTRAFFIC.md` | B11, B12 |
| Droits illimités par plateforme | `research/titouan/Z_approbations/onchain/Z4_illimite_par_plateforme.md` | B1 |
| Compatibilité avec des sites réels | `research/titouan/T_banc_e2e/compat/COMPAT_REEL.md` | B10 (ancienne couche, à refaire) |
| Revue de sécurité de l'extension | `research/titouan/T_banc_e2e/security_review2/REVUE.md` | aucune (contournements trouvés) |
| Essai avec un vrai MetaMask | `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_METAMASK.md` | aucune (aucun résultat consigné) |

Sources de la douleur et de la thèse : `research/demo_reelle/RECHERCHE_chiffres_douleur.md`, `RECHERCHE_these_moindre_privilege.md`, `RECHERCHE_metamask_couverture.md`, `RECHERCHE_concurrents_particuliers.md`. Relire chaque citation à son URL avant de la projeter.

## Pour aller plus loin

| Sujet | Chemin |
|---|---|
| Installer l'extension (dossier, zip, panneau latéral) | `livrables/INSTALLATION.md` |
| Architecture du produit figé | `livrables/ARCHITECTURE.md` |
| Explicabilité et référentiels | `livrables/EXPLICABILITE.md`, `livrables/MAPPING_REFERENTIELS.md`, `livrables/SLIDE_CONFORMITE.md` |
| Réponse à incident, playbook | `livrables/PLAYBOOK_REPONSE.md` |
| Deck | `livrables/deck/DECK.md`, `livrables/deck/holdup.pptx` |
| Script de la vidéo | `livrables/VIDEO_SCRIPT.md` |
| Fiche produit (une page) | `PRODUCT.md` |
| Décisions | `coord/DECISIONS.md` (D-009 à D-013 pour le produit actuel) |
| Passation du produit figé | `coord/HANDOFF_ADEM_SESSION_2.md` |

## Périmé : ne pas lire pour juger le produit

| Chemin | Pourquoi |
|---|---|
| `research/titouan/PITCH_V1_TITOUAN.md` à `PITCH_V5_TITOUAN.md` | Versions antérieures du pitch, remplacées par V6 |
| `livrables/video/archives_ancien_produit/1_sans_holdup_le_vol.mp4`, `2_avec_holdup_les_alertes.mp4`, `3_envoi_depuis_le_portefeuille_rpc.mp4` | Ancien produit (leurre, RPC de garde, adresse sosie) |
| `livrables/RAPPORT_MISE_A_JOUR.md`, `livrables/RAPPORT_MISE_A_JOUR_2.md` | Journaux de mise à jour, utiles pour l'historique seulement |
| `pitch/JURY_ATTAQUES.md` | Remplacé par `livrables/QR_JURY.md` |
| `pitch/comprendre_piste4.md`, `pitch/track1_4_pitches.md`, `pitch/track1_chiffres_sources.md` | Piste DeFi et DORA abandonnée (D-007) |
| `docs/architecture.md`, `docs/BRIEF_direction.md`, `docs/intent-barrier.md` | Architecture et brief d'avant le produit figé |
| `docs/comprendre.html`, `docs/explainer.html`, `docs/dashboard/index.html` | Pages de l'ancien produit |
| `docs/demo/banc/` | Ancien banc de démonstration |
| `docs/design/modal/`, `docs/design/page/`, `docs/design/v2/`, `docs/design/v3/`, `docs/design/v4/` | Maquettes sous l'ancien nom. Le dossier `docs/design/v5/` n'est pas couvert par cet index |
| `docs/design/REGLES_avertissements.md` | Règles sourcées sur les avertissements : le fond reste utile, le nom et les écrans sont d'avant |

Un bandeau « PÉRIMÉ le 11/10/2026 : voir livrables\ » figure en tête de la plupart de ces fichiers. Ce qui date d'avant le 11 oct. et n'a pas été relu (`livrables/PITCH_5MIN.md`, `PITCH_3MIN.md` et le deck citent encore la base V3 du pitch) est à réaligner sur la V6 ou la V7.
