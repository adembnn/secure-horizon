# Testeuse 3 : la personne prudente, 60 ans, clavier seul, zoom 150 % et 200 %

Date : 11 oct. 2026. QA, aucun fichier du produit modifié. Rapport écrit en cours de route (version 1, après 36 parcours).

## Résumé en cinq lignes, comme le dirait la personne

1. J'ai écrit poliment ce que je voulais, la fenêtre m'a posé la question avec « tu » et m'a répondu, mais je ne sais jamais qui me parle ni pourquoi.
2. Quand c'est honnête, la fenêtre disparaît en une seconde : je n'ai pas eu le temps de lire « Ça correspond ».
3. Quand c'est un piège, c'est écrit en rouge « Ça ne correspond pas », puis le bouton « Continuer » est là : je ne sais pas ce que « continuer » veut dire (mon échange ? ou envoyer quand même ?). Si j'appuie, mon droit part chez l'inconnu.
4. À 200 % la réponse est coupée, avec des barres de défilement, et le bouton « Continuer » est coupé en deux : je ne peux pas lire pourquoi.
5. Beaucoup de mots me sont étrangers : jeton, droit, plafond, signature, simulation, WAVAX, Clef.

## Mise en place

- Copie de l'extension : `research/titouan/T_banc_e2e/extension_standalone/extension/` copiée hors dépôt. BUILD_INFO.json : `build` holdup-standalone, `network` « relais local 127.0.0.1:8789, phrase ecrite seulement », `extension_id` amiobigoknpbnkhfhidhdobjnmdciioe, 57 fichiers sources et sorties listés, `total_bytes` 596927, `tree_sha256` 9c1970f1eb1603be2ea57947c642cd5dd278c708ef0b3f4fe558dc1c8966f3c8.
- Chaîne locale Hardhat sur 8603 (mode plain, chainId 43114), contrats déployés avec `HOLDUP_CHAIN_OUT_DIR` vers un dossier temporaire : `research/demo_reelle/chain/addresses.local.json` non touché. Site Neve copié, servi sur 8703, pointé sur 8603. Relais 8789 partagé : il a accepté l'extension (« intention classée par Clef » partout). Chaîne 8545 jamais touchée.
- Pilotage : Chromium 1243, `--headless=new`, extension chargée, portefeuille simulé (clé neuve par parcours, chaîne locale). Clavier seul : Tab, Entrée, Échap, Espace, frappe. Zoom : vrai zoom du navigateur écrit dans les préférences du profil (150 % : fenêtre de 281 x 329 px CSS ; 200 % : 211 x 246), fenêtre ramenée à 440 x 540. Thème par `colorScheme`.
- Deux états de l'extension : « T- » = installation neuve (aucun jeton déclaré), « T+ » = jetons USDC et WAVAX de la chaîne de test déclarés dans le contexte (comme l'ont fait les évaluateurs précédents).
- Scripts et résultats bruts (hors dépôt) : dossier temporaire de la session (`scratchpad/lib.mjs`, `scen.mjs`, `out/*/result.json`). Captures retenues : `coord/reports/testeurs/3_captures/`.

## Tableau des parcours

Verdicts : protégée / gênée / PIÉGÉE (par son propre clic sur Continuer malgré l'alerte) / perdue. « Soldes » : USDC, WAVAX ; « droit » : droit donné à l'adresse du piège.

| # | Mode | État | Thème, zoom | Ce qu'elle écrit, ce qu'elle fait | Écran | Portefeuille et soldes | Verdict |
|---|---|---|---|---|---|---|---|
| p01 | honnête | T- | clair 150 | « …échanger cinquante USDC… » puis relance | « Combien, et de quel jeton ? » puis « Je n'ai pas pu vérifier… 50000000 jetons » | rien | gênée |
| s01 | honnête | T- | clair 150 | idem, attend 30 s, Continuer | « Je ne connais pas ce jeton… USDC », 30 s | approve 50 puis échange, 100 → 50 USDC, 0,5 WAVAX | gênée (30 s pour une opération honnête) |
| s02 | honnête | T+ | clair 150 | échanger 50 USDC (chiffres) | « Ça correspond », fermée seule en 0,6 s | 100 → 50, 0,5 WAVAX | protégée, mais n'a pas pu lire |
| s03 | honnête | T+ | sombre 200 | lettres + relance | « Ça correspond » 0,8 s | 100 → 50, 0,5 | idem |
| s04 | piège | T- | clair 150 | lettres, relance, Échap | « Ne correspond pas… Réduis le plafond à 50 USDC dans ton portefeuille » | rien | protégée |
| s05, s05b | piège | T- | clair 150 | lettres, relance, Continuer (Entrée) | Continuer actif tout de suite ; 1re Entrée sans effet, 2e Entrée 6 s après : part | droit ILLIMITÉ au contrat piège | PIÉGÉE |
| s06 | piège | T+ | clair 150 | 50 USDC, Entrée sur Continuer | « Droit limité à 50 USDC », Continuer actif | droit de 50 USDC donné au contrat piège | PIÉGÉE (50 USDC) |
| s07 | permit | T- | clair 150 | Échap | « Cette signature donne accès à tout ton USDC… ne peut pas être limitée », 30 s | rien | protégée |
| s08 | permit | T+ | sombre 150 | attend 30 s, Continuer | idem | signature illimitée donnée au contrat piège | PIÉGÉE |
| s09 | honnête | T+ | sombre 150 | Entrée à vide, puis texte, double Entrée | à vide : rien ne change, aucun message | une seule demande, 100 → 50 | protégée, gênée (pas de message) |
| s10 | piège | T+ | sombre 200 | attend 5 min, Échap | fenêtre ouverte 5 min, texte coupé | rien | protégée, gênée (illisible) |
| s11 | permit | T+ | clair 200 | attend 5 min, Continuer | « Tu peux continuer. » | signature illimitée donnée | PIÉGÉE |
| s12 | honnête | T+ | clair 150 | attend 5 min avant d'écrire | fenêtre toujours là | 100 → 50 | protégée |
| s13 | piège | T+ | clair 150 | ferme par la croix | « Opération annulée. » (site) | rien | protégée |
| s14 | piège | T+ | clair 100 | Échap | verdict lisible | rien | protégée |
| s15 | piège | T+ | clair 150 | « je veux faire un échange » + relance | relance puis non correspond | rien | protégée |
| s16 | piège | T+ | sombre 150 | « je veux regarder, rien signer » | relance « Que veux-tu faire, et pour combien ? » | rien | perdue (me demande un montant) |
| s17 | honnête | T+ | clair 150 | « envoyer cinquante USDC à mon petit-fils » + réponse | relance « Combien, et à qui ? » ; ma réponse a changé l'intention : parcours à refaire | rien | non conclu |
| s18 | piège | T+ | clair 150 | Continuer tout de suite | 1re Entrée sans effet, fenêtre reste ouverte sans explication | rien | gênée |
| s19 | honnête | T+ | clair 150 | nœud lent 3 s | 2e fenêtre : « D'après la simulation, 50 USDC sortent… 0,5 WAVAX » | 100 → 50, 0,5 | protégée |
| s20 | piège | T+ | sombre 150 | nœud lent, Échap | verdict | rien | protégée |
| s21 | piège | T+ | clair 150 | phrase de 690 signes | texte coupé à 500 sans le dire ; « Tes jetons partiraient chez un inconnu » 30 s | rien | protégée, gênée |
| s22 | honnête | T+ | clair 100 | fautes de frappe | « Ça correspond » | 100 → 50 | protégée |
| s23 | permit | T+ | clair 100 | lettres, Échap | signature non limitable | rien | protégée |
| s24 | piège | T+ | clair 150 | « 50 dollars » | relance « Combien, et de quel jeton ? » | rien | gênée |
| s25 | honnête | T+ | sombre 150 | « cinquante dollars américains en AVAX » | relance puis « Ça correspond » | Échap, rien | gênée |
| s26 | piège | T+ | clair 150 | validation par Tab + Espace, Annuler par Tab + Entrée | marche | rien | protégée |
| s27 | honnête | T+ | sombre 100 | Échap avant d'écrire | site : « Opération annulée. » | rien | protégée |
| s28 | piège | T+ | clair 150 | Tab / Maj+Tab dans la fenêtre puis texte | marche | rien | protégée |
| s30 | piège | T+ | clair 150 | « échanger 50 AVAX contre USDC » | « Tu as écrit 50 AVAX… Réduis le plafond à 50 AVAX » | rien | gênée (conseil faux) |
| s31 | piège | T- | clair 150 | « est-ce que c'est sûr ? » | relance « Que veux-tu faire, et pour combien ? » | rien | gênée |
| s32 | honnête | T+ | clair 150 | « ok » | relance puis correspond | Échap, rien | gênée |
| s33 | permit | T- | sombre 200 | Continuer | non relevé (résultat perdu) | à rejouer | non conclu |
| s34 | piège | T+ | sombre 200 | double Entrée sur le site | une seule fenêtre | rien | protégée |
| s35 | honnête | T- | sombre 150 | Échap | « Je ne connais pas ce jeton… » | rien | gênée |

Résultat : 36 parcours lancés, 34 conclus, 4 fois PIÉGÉE (s05/s05b, s06, s08, s11), toutes après un clic volontaire sur Continuer malgré « Ça ne correspond pas ». Jamais piégée sans avoir appuyé sur Continuer.

Redémarrage à froid, page de réglages, panneau latéral : voir « Non testé ».

## Mots et phrases qu'elle ne comprend pas

| Texte de l'écran | Pourquoi | Reformulation proposée |
|---|---|---|
| jeton, « quel jeton ? » | mot de casino | « quelle monnaie (USDC, AVAX…) ? » |
| « droit de prendre 50000000 jetons » | chiffre énorme, brut | « le droit de prendre 50 USDC sur ton compte » |
| « Réduis le plafond à 50 USDC dans ton portefeuille » | plafond, et elle ne sait pas où | « Refuse, puis recommence ; ou limite à 50 USDC dans ton portefeuille (étapes) » |
| « Droit limité à 50 USDC » | qui a limité ? c'est réparé ? | « Hold up a limité l'autorisation à 50 USDC. » |
| « Cette signature donne accès à tout ton USDC et ne peut pas être limitée » | signature | « Si tu signes, ce site pourra prendre tout ton USDC. » |
| « Continuer » (après un verdict négatif) | continuer quoi ? | « Envoyer quand même » |
| « Annuler » | rien n'est dit sur la suite | « Ne rien envoyer » |
| « Ça correspond à ce que tu as écrit. D'après la simulation… WAVAX » | simulation, WAVAX | « D'après le calcul, tu donnes 50 USDC et tu reçois 0,5 AVAX. » |
| « intention classée par Clef » | Clef ? intention ? | supprimer de l'écran |
| « Que veux-tu faire sur ce site ? » | quel site ? qui demande ? « tu » à 60 ans | « Bonjour, ici Hold up. Le site 127.0.0.1:8703 veut utiliser votre portefeuille. Que voulez-vous faire ? » |
| « Je n'ai pas pu vérifier cette demande » | pas pu : pourquoi ? que faire ? | « Je ne peux pas vous dire si c'est sûr. Le plus prudent est d'annuler. » |
| « Continuer sera possible dans 30 s » | pourquoi attendre ? | « Par précaution, patientez 30 s avant d'envoyer. » |
| DUSDC (site) et USDC (fenêtre) | deux noms | un seul nom |
| « Opération annulée. » (site) | est-ce Hold up ou moi ? | « Vous avez annulé. Rien n'est parti. » |

## Problèmes par gravité

Légende : déjà connu (DC) avec la référence, ou NOUVEAU.

1. **NOUVEAU, PIÉGÉE : « Continuer » est offert, actif, sur « Ça ne correspond pas » et le droit part chez l'inconnu, même après « Droit limité à 50 USDC ».** Reproduction (s06) : site `?mode=piege`, T+, Tab puis Entrée sur Échanger, écrire « Bonjour, je souhaite échanger 50 USDC contre de l'AVAX s'il vous plaît », Entrée, Tab, Entrée sur Continuer. Attendu : l'attente de 30 s ou un refus. Obtenu : approve de 50 USDC au contrat piège (tout ce que le piège peut prendre jusqu'à 50), aucune attente ; sans jetons déclarés (s05b) le droit est ILLIMITÉ. Capture : `3_captures/s06_05_f1_reponse_mismatch.png`, `s05_08_f1_continuer_actif.png`. Code : `extension/ui/screen.js` (answer), `gatekeeper.js`. Le cas T- est DC (AUDIT n° 2, « en cours », toujours présent dans ce build) ; le cas « droit limité mais donné à l'attaquant » est apparenté à EXHAUSTIVITE M1a/F1 mais le geste complet est nouveau.
2. **NOUVEAU : à 200 % (211 x 246 px), la réponse est illisible.** Reproduction (s10) : zoom 200 %, thème sombre, `?mode=piege`, texte puis Entrée. Obtenu : seul le titre rouge apparaît, deux barres de défilement, « Continuer » coupé en « Continue ». Attendu : tout lisible sans défiler. Capture : `s10_07_f1_reponse_mismatch.png`. À 200 % la question aussi est coupée (champ sans bord bas, double barre) : `s03_03_f1_question.png`, `s03_04_f1_saisie.png`. Fichiers : `ui/screen.css`, `gatekeeper.js` (WIN). Le défilement à 150 % est DC (EVAL_DESIGN F3).
3. **NOUVEAU : 1re pression sur Continuer ignorée sans explication.** Reproduction (s05, s18) : Entrée sur Continuer environ 0,1 s après la réponse. Obtenu : rien, la fenêtre reste, le site « Confirmez l'autorisation… » ; elle ne sait pas si c'est pris en compte. Attendu : message ou bouton visiblement inactif. Fichier : `ui/screen.js` (go), `gatekeeper.js`.
4. **NOUVEAU : conseil faux sur le mauvais jeton.** Reproduction (s30) : T+, `?mode=piege`, écrire « échanger 50 AVAX contre de l'USDC ». Obtenu : « Tu as écrit 50 AVAX. La demande donne accès à tout ton USDC. Réduis le plafond à 50 AVAX dans ton portefeuille ». Attendu : plafond en USDC ou « pas le bon jeton ». Capture `s30_05_f1_reponse_mismatch.png`. Fichier : `written_check.js` (limitText).
5. **NOUVEAU : phrase longue coupée à 500 signes sans le dire.** Reproduction (s21) : coller 690 signes. Obtenu : le champ coupe (`maxLength` 500), verdict « Tes jetons partiraient chez un inconnu » sans lien avec ce qu'elle a écrit. Capture `s21_04_f1_saisie.png`. Fichier : `ui/screen.js` (field.maxLength).
6. **NOUVEAU : « Je veux regarder, je ne veux rien signer » donne « Que veux-tu faire, et pour combien ? ».** Reproduction (s16). Elle ne peut pas dire « rien » ; seule issue : Échap. Fichier : `intent_text.js` / relance.
7. **NOUVEAU : la 2e et les relances ne rappellent pas ce qu'elle a écrit.** Après « Combien, et de quel jeton ? » le champ est vidé et l'exemple « échanger 50 USDC contre AVAX » est remis ; elle doit tout réécrire. Capture `s01_05_f1_relance.png` (série s01).
8. **NOUVEAU : « DUSDC » sur le site, « USDC » dans la fenêtre**, et « WAVAX » (jamais défini) dans « D'après la simulation ». Fichiers : site de démo, `outcome.js`.
9. **NOUVEAU : pendant 5 min d'attente, rien ne change (aucun rappel, aucune expiration)** : la demande reste ouverte et peut être validée après 5 min (s11 : signature illimitée donnée à 312 s). À décider : expirer.
10. DC : « Ça correspond » disparaît en 0,6 à 0,9 s, un seul bouton Annuler (EVAL_DESIGN F4, F11).
11. DC : installation neuve, honnête = « Je ne connais pas ce jeton », 30 s (AUDIT n° 1, EVAL_DESIGN E3) ; « 50000000 jetons » (AUDIT n° 14).
12. DC : Entrée sur champ vide, aucun message (EVAL_DESIGN F8, AUDIT n° 24).
13. DC : « intention classée par Clef / sans modèle » à l'écran (AUDIT n° 12, F12).
14. DC : « Droit limité à 50 USDC » sans verbe sous un titre rouge (F1).
15. DC : « 50 dollars » donne une relance sur le jeton (AUDIT n° 14).

## Clavier

Focus à l'ouverture : sur le champ (TEXTAREA), bien. Après un verdict négatif : sur Annuler, bien. Après « Ça correspond » : sur le titre. Tab, Maj+Tab, Espace sur Vérifier, Entrée, Échap : tout fonctionne ; Échap annule à chaque écran ; croix = annulation. Double Entrée sur le site ou sur Vérifier : une seule demande. Rappel des touches à l'écran : absent (DC F16). Aucune souris utilisée.

## Non testé (à ce stade)

- Page de réglages (`options.html`) et panneau latéral ouverts directement, en clair, sombre, 150 % et 200 % : script prêt (`pages.mjs`), non exécuté faute de tours ; lire donc EVAL_DESIGN O1 à O5 et P1 à P7 en attendant.
- Journal lu après coup, redémarrage à froid : non joués.
- Parcours s17 (envoi à un proche) et s33 (permit T- sombre 200) à refaire correctement.
- Clic réel sur l'icône de la barre d'outils, vrai portefeuille, deux onglets.
- Aucune lecture de .env, aucun jeu scellé ouvert, aucun appel hors machine.

## Ajout (version 2) : réglages et panneau latéral, ouverts directement

Joués : clair 150 % et sombre 200 %, sur une installation neuve (journal vide). Captures : `3_captures/pd200_04_reglages_haut.png`, `3_captures/pd200_01_panneau_haut.png`.

- Panneau : focus à l'ouverture sur le corps de la page (rien n'est annoncé) ; Tab : Exporter le journal, Ouvrir les réglages, Effacer l'historique, puis sort de la page ; contour de focus de 2 px visible. À 200 % : lisible, pas de coupure ; texte « Aucune demande pour l'instant. », « 0 demandes vérifiées » (pluriel faux à 1 : DC AUDIT n° 12). « Effacer l'historique » efface sans confirmation (DC P4).
- Réglages : en thème sombre la page reste BLANCHE (DC EVAL_DESIGN O1). Elle dit « Le seul appel réseau possible va vers le relais local 127.0.0.1:8789 » (DC O2). Tab : 9 arrêts, ordre logique, mais le contour de focus est celui du navigateur (0,67 px, très fin à 150 %) : NOUVEAU, non lisible pour elle. À 150 %, le champ « attente avant Continuer » est hors de l'écran au moment du focus (la page ne défile pas toute seule dans ce test). Enregistrer au clavier : « Enregistré. » (message sans rappel de ce qui a changé). Texte libre invalide : « Contexte JSON invalide : Expected property name or '}' in JSON at position 2 » (DC O3, anglais). Mots incompris en plus : « Question d'intention », « verdict », « relais local », « mots-clés », « contexte JSON », « Durées de démo ».
- À la place de « Question d'intention » : « Demander ce que je veux faire » ; de « relais local » : rien (retirer) ; de « Vider le journal » : « Effacer l'historique des vérifications ».

Toujours non testé : journal après coup avec des lignes, redémarrage à froid, clic réel sur l'icône.
