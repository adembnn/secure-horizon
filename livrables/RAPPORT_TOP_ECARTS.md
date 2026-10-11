# Rapport : écarts du top 10 corrigés (11 oct. 2026, vers 11 h)

Base : `research/titouan/CONFORMITE/ADEQUATION_TRACK1.md` et les trois `ROUND1_*.md`. Corrections de Titouan reçues en cours de route, appliquées. Aucun commit, aucun `.env` lu. Un seul processus node à la fois.
Attention : d'autres agents ont commité pendant ce travail. Une partie de mes modifications est déjà dans le commit `34d4482` (fait par un autre agent). Le reste est dans l'arbre de travail, non commité.

## Priorité : requalification des chiffres (demande d'Adem, MSG-079)

**Fait.** Source : `preuves/ECARTS_LIVRABLES.md` §6 et §7 (récupéré par `git pull --ff-only`).
- Jeu aveugle : partout dans mon périmètre, il est dit « notre moteur de comparaison, jeu aveugle de 250 cas » (chaîne de banc), jamais « l'extension ». Fichiers : `CHIFFRES.md` (A6, section du jeu aveugle), `PRODUCT.md`, `README.md`, `FICHE_DEFENSE.md`, `QR_JURY.md` (questions 1 et 30), `PITCH_5MIN.md`, `PITCH_3MIN.md`, `research/titouan/PITCH_V7_TITOUAN.md`, `EXPLICABILITE.md`, `VIDEO_SCRIPT.md`, `MAPPING_REFERENTIELS.md`, `pitch/DEMO_SCENES.md`.
- « Non passé » : `PRODUCT.md` le disait encore. Corrigé (ouvert le 11 oct. à 07:10 UTC, moteur figé `74203da`). `CHIFFRES.md` A6 le disait déjà passé.
- A11 et A12 (86,6 %, 7,7 %, 1,3 %) : requalifiés « chaîne de banc, jeu de réglage, non mesuré sur l'extension ». La phrase « c'est ce que fait le build autonome » est retirée. A13 et A14 : même mention.
- A5 : le 228 sur 228 est remplacé par 157 sur 244 (64,3 %) sur phrase libre, 0 fausse alerte sur 166.
- Nouvelle section de `CHIFFRES.md` : « Mesure sur l'extension livrée ». Grille rejouée par le build réel : 176/461 = 38,2 % attrapé ; 27/298 = 9,1 % de fausses alertes avec le relais Clef (9,7 % sans modèle). Mention « chiffre le moins flatteur », build en partie en panne, réserve scellée de 2 673 paires. Titouan décide de l'oral.
- Règle d'Adem écrite en tête de `CHIFFRES.md` : un seul chiffre de détection dans les textes. La ligne trafic réel (B11) est retirée de la fiche. Les 13,9 % et 54,2 % (A4) sont retirés de `PRODUCT.md` et `DEMO_SCENES.md`.
- 1,3 % et 86,6 % : plus cités dans le pitch, la fiche ni les Q&R, sauf dans la question qui les requalifie.
- Comptage des mots refait par script : 5 min passe de 560 à 568 mots dits (limite 580), 3 min de 306 à 314. Les en-têtes sont mis à jour.
- **Non fait, hors de mon périmètre :** `livrables/pitch_v7/` (en lecture seule). Exemple : `pitch_v7/PITCH_3MIN.md` ligne 16 présente encore le jeu aveugle sans dire « notre moteur de comparaison ». Le deck non plus (consigne).

## Point 1 : précision

**Fait.** `CHIFFRES.md`, ligne A6 et sous-section « Précision des signalements sur le jeu aveugle ». Calcul fait depuis `blind_decalage/run/resultat.json` (champ `global`). Faux positif = bénin signalé (`fa_warn_rouge`) ou bénin en rouge (`fa_rouge`).
- (a) code seul : signalés justes 131/161 = 81,4 % [74,6 ; 86,6] ; rouges justes 114/129 = 88,4 % [81,7 ; 92,8]. Chiffres de l'audit confirmés.
- (b) Clef : 133/162 = 82,1 % ; 117/133 = 88,0 %.
- (c) plancher : 97/124 = 78,2 % ; 80/95 = 84,2 %.
- Limite écrite : le jeu contient 60 % d'arnaques (150 sur 250), donc ce n'est pas la précision du monde réel.

## Point 2 : documents contradictoires sur le journal

**Fait.**
- `PLAYBOOK_REPONSE.md` §6 (ancienne l.38) et §8 (ancienne l.52) : journal chaîné dans les deux versions, `journal_chain.js`, 7 tests, export JSON, `verify_journal.mjs`. Pas d'ancrage (D-017).
- `PRODUCT.md` (ancienne l.53) : même correction.
- Recherche « non chaîn », « pas de chaîne », « sans chaîne » dans tout le dépôt. Corrigé aussi : `pitch/DEMO_SCENES.md` l.31 (disait « version serveur seulement ») et `README.md` (ajout de l'export, de `verify_journal.mjs` et de D-017). Laissés tels quels : rapports datés (`RAPPORT_MISE_A_JOUR_2.md`, `RAPPORT_NETTOYAGE.md`, `coord/reports/`) et les autres sens de « chaîne ».
- Preuves : `extension_standalone/extension/journal_chain.js` est identique à `extension/journal_chain.js` (aucune différence au `diff`). `journal_chain.test.mjs` contient 7 tests. `coord/DECISIONS.md` l.22 contient D-017.
- Champs `by`, `limited`, `rules` : `extension/tests/unit/journal_champs.test.mjs` existe maintenant et passe (6 sur 6). Mais `extension_standalone/extension/journal_chain.js` ne contient encore aucun `limited`. Les livrables disent donc « en cours d'ajout ».

## Point 3 : fiche de défense

**Fait.** `livrables/FICHE_DEFENSE.md` : 519 mots (comptage des mots qui contiennent une lettre ou un chiffre), contre 769 avant. Le paragraphe « Modèle économique » est retiré.
- Ligne « Temps de réponse » : verdict local, médiane sous 50 ms (A16). Le modèle hébergé ajoute un délai distinct (p50 369 ms, A17).
- Précision ajoutée, avec sa limite.
- Trace : « journal chaîné exportable, vérifiable hors ligne ». La fiche technique de traçabilité est citée comme faite (qui a agi, d'où ça vient, quand, règles, preuve de chaîne), avec sa commande et l'exemple `fiche_ligne4.html`. Preuve : `research/titouan/T_banc_e2e/livrables/outils/fiche_tracabilite.mjs` existe, et `node --test livrables/outils/test/*.test.mjs` (lancé depuis `T_banc_e2e`) donne 7 sur 7.
- Ligne « Qui lit l'alerte ».
- `QR_JURY.md` : ligne 3 et question 9 mises à jour (journal exportable, fiche technique, commande). La question 4 (« Où ratez-vous ? ») ne parlait pas de fiche : rien à changer. La question 14 cite D-017. Une question 15 bis est ajoutée (« particuliers ou banque »), sans la phrase d'ancrage.
- Rendu imprimé sur une page A4 : non vérifié à l'œil.

## Point 4 : slide conformité dans le deck

**Non fait, sur consigne de Titouan** (les agents d'Adem s'en chargent). J'avais commencé à modifier `build_deck.js`. Je l'ai remis à son état commité (`git checkout`). `holdup.pptx` et `DECK.md` n'ont jamais été modifiés. Preuve : `git diff --stat livrables/deck` est vide.

## Point 5 : phrase d'ancrage

**Non fait, sur consigne de Titouan.** Je l'avais ajoutée à la fiche et aux Q&R, puis je l'ai retirée. Elle n'apparaît dans aucun livrable, pitch ni dans `PITCH_V7_TITOUAN.md` (vérifié par recherche du texte). Elle n'était pas non plus dans le commit `34d4482`. Elle ne reste que dans l'audit interne `ADEQUATION_TRACK1.md`.

## Point 6 : analyste nommé

**Fait.** `PLAYBOOK_REPONSE.md` §4 : sur le moment, la personne devant l'écran. Ensuite, l'équipe fraude de la plateforme qui intègre Hold up lit l'export et le vérifie. Pour un particulier, c'est la personne elle-même. Repris en une ligne dans la fiche.

## Point 7 : répétition

**Fait.** `livrables/REPETITION_DEMO.md` : 15 lignes, deux colonnes de chronométrage, scènes 1 à 4, commandes exactes. Aucune commande lancée.
Écart avec la consigne : le champ « Mon contexte » n'existe plus. Preuves : `PROTOCOLE_V2.md` §5.3, et la recherche ne le trouve pas dans `extension_standalone/extension`. Le jeton est lu au portefeuille (`gatekeeper.js`, `declaredTokens`). La check-list demande donc d'ajouter le routeur dans « Contrats que j'utilise ». Elle signale ce point comme celui qui peut faire casser la scène honnête.
Le site Neve n'a pas de README : ses commandes viennent de `PROTOCOLE_V2.md`, `DEMO_DEROULE.md` et `scripts/demo.mjs`.

## Point 8 : note pour Adem

**Fait, sans le point sur le dépôt public** (consigne de Titouan). Le fichier existant `research/titouan/T_banc_e2e/qa/POUR_ADEM.md` est complété :
- section 4 : exception `.gitignore` pour `research/demo_reelle/audit/sample/journal.jsonl` (`git check-ignore -v` donne `.gitignore:23:*.jsonl`) ;
- section 5 : liste de ce qu'Adem doit pousser (fichiers du journal non commités, champs absents du build livré, `cchain_all.json`, C8).

## Reste ouvert

- Commit et push de mon arbre de travail : non faits (consigne).
- `livrables/pitch_v7/` : à requalifier par son propriétaire.
- Fiche de défense : rendu A4 à vérifier à l'impression.
