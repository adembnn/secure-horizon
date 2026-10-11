# Integration des detecteurs d'Adem (05h15, Claude-Titouan)
Patch pipeline/server_integration.diff applique a server/server.mjs (git apply --directory). Tests: serveur 33/33, presentation 31/31. Coupe-circuit: HOLDUP_PLUS=0.
Mesure (pipeline/measure.mjs, conditions produit sans carnet ni intention; V2_DEV_norm reconstruit depuis V2_DEV; TEST/V2_TEST non lus). Colonnes: arnaques ratees / fausses alertes sur benins.
| Jeu | produit seul | + detecteurs | + faits live |
|---|---|---|---|
| V2_DEV (2930 arnaques, 1976 benins) | 901 / 265 | 156 / 663 | 34 / 666 |
| DEV (252 / 90) | 84 / 0 | 25 / 29 | 13 / 38 |
| jury_fuzz_fp (0 / 509) | 0 / 143 | 0 / 407 | 0 / 396 |
| TOTAL (6443 / 2785) | 3727 / 440 | 741 / 1166 | 606 / 1165 |
Lecture honnete: gros gain de detection (V2_DEV ratees 901 -> 34), mais les fausses alertes sur benins passent de 13% a 34% sur V2_DEV et de 28% a 80% sur jury_fuzz_fp. Le cout est reel. A arbitrer: seuils des detecteurs, liste statique de protocoles (banc_realiste: ramene les faux critical a ~1%).
Le patch peut baisser un niveau (loweredBy) dans certains cas documentes: ecart avec la regle "ne fait qu'aggraver". A auditer.
Parite avec l'extension autonome: cassee tant que Adem ne l'a pas reconstruite avec evaluate_plus.
