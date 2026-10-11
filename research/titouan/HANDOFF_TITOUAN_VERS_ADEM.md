# Passation Titouan vers Adem (11/10/2026, ~04h00, limite de session de Titouan atteinte)

Adem prend le relais jusqu'à environ 04h30 ; Titouan reprend ses parts ensuite. Tout est poussé sur GitHub. Le produit s'appelle **Hold up** (anciennement Sentinelle). Racine de travail : `research/titouan/T_banc_e2e/`.

## Règles à garder (non négociables)
- Aucun secret : jamais de clé privée ni de `.env` dans le dépôt. Le déploiement Fuji se fait avec ta `FUJI_PRIVATE_KEY` en variable d'environnement, toi seul.
- Jeux scellés : `attacks/TEST.jsonl` (déjà ouvert une fois, contaminé, ne PAS rouvrir) et `blind_adem/v2/V2_TEST.jsonl` (sha256 `ab2aa0b4…`, à ouvrir UNE seule fois, journalisée, annoncée à Titouan). Règle sur DEV seulement.
- Pas de hardcoding (ids, adresses, hashes de cas dans les règles) : `run/check_nohardcode.mjs`.
- Le modèle ne peut qu'aggraver ; jamais de « OK » vert ; on avertit et on ralentit, on ne bloque pas.
- Aucun Chrome avec drapeaux de débogage (refusés par le garde-fou). Essai réel = humain, mode développeur.
- Chiffres retirés (ne jamais citer) : rappel R3 80,4 %, filet 81,9 %, preuve sociale 99 %, nonce, 100 %/0 % sur DEV.

## État (tout est vérifié sauf mention)
| Bloc | État | Où |
|---|---|---|
| Moteur d'effets | 447/447 tests, syntaxe OK au moment de l'arrêt | `engine/` |
| Politique + correctifs F1-F10 | gardés ; F11+ en cours (voir ci-dessous) | `run/policy.mjs`, `engine/src/rules_extra.mjs`, `fixes.mjs`, `run/out/JOURNAL.md` |
| Catalogue 589 cas + fixtures publiques 144 | prêts | `attacks/`, `attacks_public/` |
| Extension avec serveur local | prête, 33/33 tests serveur | `extension/`, `server/`, `dist/hold-up-extension.zip` |
| Extension autonome (moteur embarqué) | prête, 21/21 + équivalence 1155/1155 et 402/402 ; MOTEUR EN RETARD sur server.mjs (règle Seaport prix quasi nul) : à reconstruire | `extension_standalone/`, `dist/hold-up-standalone.zip` |
| Interface Figma | écrite, check_ui 0 erreur, jamais vue dans un navigateur ; titre : le serveur doit envoyer `fiche.menace` | `ui_holdup/` |
| Démo web sans installation | prête, 59 vérifications, jamais vue dans un navigateur | `webdemo/` (publier : Vercel racine webdemo, sans build) |
| Trafic réel | mesuré : C-Chain 0,30 % critical, Ethereum 3,33 % ; 96 % des alertes C-Chain = opacité | `realtraffic/REALTRAFFIC.md` |
| Compat 96 sites | 0 casse sur 89 avec un Proxy de substitution (PAS l'extension réelle) | `compat/COMPAT_REEL.md` |
| Textes clairs 30 fiches v2 | check_textes 0 erreur ; compréhension simulée non concluante | `U_textes_utilisateur.*`, `U_comprehension/` |
| Livrables du jury (brouillons, encore « Sentinelle » par endroits) | README, fiche de défense, playbook, slide conformité, RESULTATS_A_JOUR | `W_livrables/` |
| Protocole d'essai réel MetaMask/Fuji | écrit, jamais joué ; BLOQUÉ par le déploiement des contrats de démo | `essai_reel/` |
| Ancrage Fuji (journal chaîné + Merkle + EvidenceAnchor.sol) | code et tests écrits, agent arrêté avant la fin des tests ; à vérifier | `anchor/` |
| Scan réel empoisonnement C-Chain | script écrit, agent arrêté, AUCUN chiffre | `realscan/` |

## Agents que j'ai ARRÊTÉS à la limite (travail partiel sur disque)
1. **Améliorateur V2** (modifie seul `run/policy.mjs`, `engine/src/rules_extra.mjs`, `fixes.mjs`) : il avait reçu TA scène héros (MSG-054) en priorité absolue ; il était en train d'ajouter une fonction F14 dans rules_extra. Le code compile et les 447 tests passent, mais le correctif « plancher critical pour toute signature qui accorde un droit » (permit 2612, DAI permit, personal_sign hex qui encode un approve, approve(MAX) dans un lot, transferFrom sous « payer quelqu'un », virgule décimale, sAVAX, Fuji) n'est PAS validé : rejoue `node redteam/check.mjs redteam/jury_fuzz_sig.jsonl` (1 101 cas attendus critical, sans fausse alerte sur les bénins), puis `node run/run_loop.mjs --dry …`, `node attacks_public/run_public.mjs`, V2_DEV.
2. **Ancrage Fuji** : lancer `node anchor/test_anchor.mjs`, relire `anchor/` ; tu déploies `EvidenceAnchor.sol` avec ta clé.
3. **Scan réel poisoning** : relancer `node realscan/scan_poisoning.mjs` si tu veux le chiffre (RPC publics, lecture seule ; les caches sont ignorés par git).
4. **Retenue MV3 persistante + fenêtre de verdict séparée** (côté `extension_standalone/`) : pas terminé, probablement rien d'écrit de fiable ; à refaire ou à reprendre (spécification dans `extension/COMPAT.md` point 13 et ton MSG-053).
5. **Revue de sécurité de l'extension** : arrêtée en lisant ; à refaire si le temps le permet (injection dans l'interface, canal page-extension, TOCTOU, contournement de l'interception, serveur local).
6. **Défauts de textes** (F26 « à ton contact » pour un inconnu, jeton « NATIVE », motifs de pression sans bornes de mots, texte « autorise seulement » pour un droit illimité, F14/F19/F24/F27-F30 jamais choisies, fiche réseau) : arrêté, rien de sûr.

## Ordre de travail proposé pour Adem (jusqu'à 04h30)
1. Vérifier l'état : `cd research/titouan/T_banc_e2e/engine && node --test test/*.test.mjs` ; `node server/test/server.test.mjs`.
2. Scène héros (permit critical) : l'améliorateur doit être relancé par toi (agent unique, exclusif sur policy/rules_extra) avec ton MSG-054 ; mesure avec ton `redteam/check.mjs`.
3. Déployer les contrats de démo sur Fuji (blockchain/DEPLOYMENTS.md : OpenZeppelin manquant, `PRIVATE_KEY` vs `FUJI_PRIVATE_KEY`), ce qui débloque l'essai réel.
4. Reconstruire l'extension autonome après les correctifs (`node extension_standalone/build_standalone.mjs`, `powershell -File extension_standalone/package_standalone.ps1`, tests + équivalence) et la démo web (`node webdemo/build_webdemo.mjs`, `node webdemo/tests/run_webdemo_tests.mjs`).
5. Ouverture unique de V2_TEST (après l'amélioration), tous chiffres publiés.
6. Mettre à jour `W_livrables/` avec les chiffres réels et le nom Hold up.

## Ce que Titouan reprend après 04h30
Essai réel dans son Chrome (mode développeur, `INSTALL_FR.md` / `INSTALL_STANDALONE_FR.md`, protocole `essai_reel/`), publication de la démo web, fiche de défense, vidéo avec toi.

## Boucles planifiées dans la session de Titouan
Elles s'arrêtent avec sa session (superviseur toutes les 2 min, point toutes les 15 min). Reprendre à la main : `git pull`, `coord/INBOX.md`, `research/titouan/T_banc_e2e/points/`.
