# Lanceur du jeu aveugle decalage

Le jeu `blind_decalage\CASES.jsonl` (250 cas) est scellé. Ce dossier contient le lanceur. Il n'a jamais lu ni exécuté le vrai jeu. Tout a été essayé sur un faux jeu de 10 cas (`essai\`).

## BLOQUANT à lever avant le « go »

Le moteur vivant ne se charge pas aujourd'hui. `detectors_adem\util.mjs` déclare deux fois `benchLower` (lignes 54 et 59, le bloc de commentaire et la ligne `export const benchLower` sont dupliqués). Node s'arrête avec `Identifier 'benchLower' has already been declared`. Le défaut est dans le commit 3f186ae. Je n'ai pas touché au code du produit. Il suffit de supprimer le doublon (lignes 56 à 59), puis de relancer l'essai (voir plus bas). Le `--dry-run` détecte ce genre de panne avant l'ouverture.

## La commande exacte à lancer au « go »

Depuis `C:\Users\detot\Documents\secure-horizon\research\titouan\T_banc_e2e` :

```
node --env-file=C:\Users\detot\Documents\secure-horizon\.env --no-warnings blind_decalage\run\ouvrir_une_fois.mjs
```

Un seul processus node à la fois. Aucune autre option sur le vrai jeu.

Avant le « go », vérifier à blanc (ne lit pas CASES.jsonl, n'écrit rien, ne crée pas de verrou) :

```
node --env-file=C:\Users\detot\Documents\secure-horizon\.env --no-warnings blind_decalage\run\ouvrir_une_fois.mjs --dry-run
```

Il doit finir par `DRY-RUN OK`. Il affiche aussi le sha256 du moteur, le git HEAD et si la clé Clef est présente (sans l'afficher).

## Ce que fait le lanceur, dans l'ordre

1. Refuse si `OUVERT.lock` existe. Rien n'est lu, rien n'est mesuré.
2. Calcule le sha256 du moteur et lit l'état git.
3. Calcule le sha256 de `CASES.jsonl` en flux (octets seulement) et le compare à `SHA256.txt`. Différent : abandon, aucun verrou, rien n'est mesuré, l'abandon est écrit au journal.
4. Crée `OUVERT.lock` (écriture exclusive), AVANT de lire le contenu des cas.
5. Écrit dans `JOURNAL_OUVERTURE.md` : date, sha256 du moteur, sha256 du lanceur, git HEAD, nombre de fichiers modifiés non commités, liste des fichiers hashés.
6. Lit les cas, mesure trois bras, écrit `RESULTAT.md` et `resultat.json`, puis complète le journal avec le résultat et les sha256 des deux fichiers.

Sha256 du moteur : `engine\src`, `engine\vendor`, `run\policy.mjs`, `run\arms.mjs`, `pipeline\evaluate_plus.mjs`, `pipeline\intent_clef.mjs`, `pipeline\known_protocols.json`, `redteam\normalize_v2.mjs`, `detectors_adem\*`, `extension\*.js`, puis le build standalone (`extension_standalone\extension\**` et `dist\hold-up-standalone*.zip`).

Il n'y a pas d'option `--force`. Le lanceur la refuse. Un verrou ne se lève qu'à la main.

## Les trois bras

La seule information donnée aux bras est la phrase libre du cas (`intent.freeText`). L'intention détaillée du cas (type, jeton, montant) n'est jamais utilisée.

- (a) Code seul : mots-clés du produit et repli, extraction du montant, du jeton et de l'adresse par le code, moteur, comparateur. C'est la chaîne de `pipeline\grille\mesure_code.mjs`.
- (b) Clef classe, le code compare : Clef-flash donne le type et quatre réponses oui/non, le code extrait le reste, le comparateur décide. Concurrence 3, cache par hash dans `run\cache_clef`, 250 appels au plus, arrêt propre sur quota (429).
- (c) Sans intention : le plancher (moteur, politique, détecteurs, aucune intention).

Choix à connaître. La chaîne est une copie de `pipeline\grille\lib.mjs` dans `run\chaine\`. Une seule ligne change : elle charge le moteur vivant de `T_banc_e2e` et non la copie figée `pipeline\grille\snapshot`. Les détecteurs vivants diffèrent de la copie figée (dust_guard, intent_guard, nft_orders, util : règle stricte). Le jeu aveugle mesure donc le produit actuel.

## Ce que dit RESULTAT.md

Par bras et par famille (8 familles) : rappel (signalé en warn ou critical), rouge seul, fausses alertes sur les jumeaux bénins en rouge et en warn+rouge, décisions invérifiable et « ne correspond pas », intervalles de Wilson à 95 %. Puis la liste des échecs avec les ids, la monotonie (aucun bras sous le plancher), les cas non pris en charge, et le verdict global.

Le verdict global applique des critères fixés ici, avant l'ouverture : rappel au moins 80 % et fausses alertes rouges au plus 10 % (estimation ponctuelle). Ce sont des seuils proposés par l'auteur du lanceur. Titouan peut les changer dans `CRITERES`, en tête de `mesure.mjs`, AVANT le « go » seulement : le sha256 du lanceur est écrit au journal. Le verdict ne dit rien de plus que ces deux comparaisons.

Les deux fichiers rappellent : **aucun réglage après ouverture; chiffres publiés tels quels.**

## Si la mesure s'interrompt (quota Clef, panne)

Le verrou reste posé. Le résultat est marqué INCOMPLET et le verdict du bras (b) n'est pas valable. L'option `--reprise` termine la mesure à l'identique. Elle n'est acceptée que si le verrou existe, si les cas, le moteur et le lanceur ont le même sha256 qu'à l'ouverture, et si aucun résultat complet n'existe. Les réponses Clef déjà reçues viennent du cache. Cette option dépasse la consigne littérale (« refuse si le verrou existe ») : elle ne permet aucun réglage, mais on peut la supprimer du script si Titouan préfère.

```
node --env-file=C:\Users\detot\Documents\secure-horizon\.env --no-warnings blind_decalage\run\ouvrir_une_fois.mjs --reprise
```

Sans clé Clef, le bras (b) n'est pas mesuré (« non mesuré: clé manquante ») et le lanceur continue avec (a) et (c).

## Essai du lanceur (faux jeu)

```
node --no-warnings blind_decalage\run\essai\tester.mjs
```

Le test génère ses sorties dans `essai\sorties\`. Il vérifie : refus de `--force`, `--dry-run` avec une garde qui interdit toute lecture de `CASES.jsonl`, hash modifié (abandon, pas de verrou), `SHA256.txt` illisible, exécution complète avec un faux Clef, verrou, second lancement refusé, quota puis reprise, et que le vrai `CASES.jsonl` n'a pas bougé (date de modification) et qu'aucun verrou réel n'existe.

Résultat obtenu : 31 réussites, 0 échec, avec le moteur figé de `pipeline\grille\snapshot` (variable `HOLDUP_CHAINE_RACINE`, réservée à l'essai, refusée sur le vrai jeu). Avec le moteur vivant, les tests qui touchent au moteur n'ont pas pu tourner à cause du doublon dans `util.mjs`. Les 19 autres passent. Quand `util.mjs` sera corrigé, relancer la commande ci-dessus sans variable : elle doit afficher 31 réussites.

Le faux jeu est dans `essai\CASES.jsonl` (10 cas, 5 paires, écrits d'après le schéma du README, aucun cas copié du vrai jeu). Il ne mesure rien de valable.

## Fichiers

- `ouvrir_une_fois.mjs` : le lanceur (verrou, hash, journal, orchestration).
- `mesure.mjs` : les trois bras, les chiffres, le rapport, les critères.
- `chaine\` : copie de la chaîne de la grille, branchée sur le moteur vivant.
- `essai\` : faux jeu, faux Clef, garde de lecture, `tester.mjs`.
- Créés au lancement : `OUVERT.lock`, `JOURNAL_OUVERTURE.md`, `RESULTAT.md`, `resultat.json`, `cache_clef\`.
