# Sources des chiffres et faits montrés dans la vidéo

| Fait affiché ou dit | Valeur | Source | Date | Vérification |
|---|---|---|---|---|
| Incident LI.FI | 16 juillet 2024, environ 11,6 M$, 153 portefeuilles, seules les autorisations illimitées touchées (le montant fini était le réglage par défaut) | Rapport d'incident de LI.FI, document officiel de la plateforme : https://li.fi/knowledge-hub/incident-report-16th-july/ ; repris dans `research/demo_reelle/RECHERCHE_douleurs_secondaires.md` (ligne 29) et `RECHERCHE_these_moindre_privilege.md` | juil. 2024 | Page relue le 11 oct. 2026 : « impacting 153 wallets », « around $11.6 million », « limited to infinite approvals » |
| Part d'autorisations illimitées sur Avalanche | 34,2 % : 7 103 droits illimités sur 20 753 droits non nuls (34 393 événements lus, 398 contrats bénéficiaires distincts). À l'écran : « 34 % : notre mesure, sur un échantillon de blocs d'Avalanche », montré comme une sur trois. Aucune mention d'une autre chaîne | Mesure de l'équipe : `research/titouan/Z_approbations/onchain/result_avax.json` (champs `illimites_tous`, `droits_non_nuls`, `part_illimitee_tous`) | 11 oct. 2026 | Fichier lu le 11 oct. 2026 ; mesure non relancée |
| Détection | 87 % signalés avec la phrase (131 sur 150), 65 % sans, 15 % d'alertes à tort (15 sur 100), objectif de 10 % manqué | `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`. Légende obligatoire : « moteur de comparaison, jeu aveugle de 250 cas, ouvert une seule fois », jamais « l'extension » | 11 oct. 2026 | Lu dans `livrables/CHIFFRES.md` (A6), pas relancé |
| Latence du classement | « Compris par Clef en … s » : valeur mesurée sur la prise réelle, laissée en variable jusqu'au second temps | `research/titouan/T_banc_e2e/pipeline/RESULTATS_INTENTION_CLEF.md` (ordre de 300 à 700 ms) | 11 oct. 2026 | À mesurer sur la prise |
| Scène du piratage | Sans Hold up : 50 puis 0. Avec : le pirate prend 0 | `research/demo_reelle/site_echange/test/preuve_piratage.mjs`, copie locale d'Avalanche, argent fictif | 11 oct. 2026 | Pas relancé pour la vidéo |

Illustration, pas un fait : dans l'essai, 168 poches sont dessinées, 153 se vident et 15 restent pleines. Le nombre 15 n'est pas sourcé (le rapport ne dit pas combien d'autorisations finies existaient). Aucun chiffre ne l'accompagne à l'écran.

## Voix

Gradium, documentation officielle lue le 11 oct. 2026 : https://docs.gradium.ai/api-reference/endpoint/tts-post (appel), https://docs.gradium.ai/guides/voice-settings (débit : `padding_bonus`), https://docs.gradium.ai/guides/voices/flagship-voices (voix françaises). Voix retenue : Damien, `padding_bonus` 1. Seul le texte de la voix est envoyé au service.
