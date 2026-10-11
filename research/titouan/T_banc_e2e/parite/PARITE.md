# Parite serveur local / extension autonome de Hold up

Verifie par `parite/run_parite.mjs` (un seul processus Node 24, lecture seule hors `parite/`, aucun reseau, horloge figee, sortie brute dans `parite/results.json`).
Voie serveur = `evaluate()` de `server/server.mjs` (contexte local vide). Voie autonome = `check()` de `extension_standalone/extension/engine/sentinelle_core.js` (le noyau embarque du dossier livre, tel quel, sans faux chrome : il n'en a pas besoin).
Etat verifie : HEAD `2f60e13` (apres le commit d'Adem `e0a89a7`). Jamais lus : `attacks/TEST.jsonl`, `V2_TEST` (l'export `scenarios.json` n'en contient pas).

## 1. Taux d'identite (champs : niveau, level, title, texts, fiche, reasons, opacity_only)

| Jeu | Requetes | Comparees | Identiques | Ecarts |
|---|---|---|---|---|
| DEV (`attacks/DEV.jsonl`) | 385 | 385 | 385 | 0 |
| PUBLIC (`attacks_public/PUBLIC.jsonl`) | 144 | 144 | 144 | 0 |
| Echantillon 1 500 de `scenarios.json` (source v2, graine 20261011) | 1 500 | 1 500 | 1 496 | 4 |
| 40 malformees / limites | 40 | 35 | 35 | 0 |
| **Total** | **2 069** | **2 064** | **2 060** | **4** |

**Taux d'identite : 2 060 / 2 064 = 99,81 %** (identique aussi sur tous les champs du verdict hors moteur et latences : 99,81 %).
Les 5 requetes restantes des malformees (corps `null`, tableau, chaine, nombre, corps de plus de 256 Ko) sont refusees par la couche HTTP du serveur (400 / 413) avant `evaluate()` : pas de verdict serveur a comparer. Cote autonome elles donnent toutes un verdict indetermine (`level unknown`, `niveau warn`), 5 sur 5.
Corps envoye : tel que `bridge.js` l'envoie (origine, methode, params, chainId, from), avec intention (`pay`/`receive`/`asked`), `intent_text` et `pageText` (message recu) quand le cas en a.
Niveaux observes (voie serveur + voie autonome) : critical 1 886, warn 1 023, info 1 224 ; `level` : danger 1 724, attention 1 592, unknown 655, manipulation 162.

Supplement (hors total) : tous les 5 927 scenarios v2 de l'export : 5 909 identiques, 18 ecarts (99,70 %), tous de la meme cause que ci-dessous (personal_sign, 1 cas aussi sur `raisons`/`codes`/`lead`).

## 2. Ecarts par cause

| Cause | Ecarts (total) | Supplement 5 927 |
|---|---|---|
| Regle Seaport | 0 | 0 |
| Texte | 0 | 0 |
| Fiche | 0 | 0 |
| Titre | 0 | 0 |
| Opacite | 0 | 0 |
| Contexte (moteur : drapeaux / niveau) | **4** | **18** |

Tous les ecarts ont une seule origine : le drapeau `signed_calldata` (critical) sur un `personal_sign` dont le « message » a la forme d'un appel de contrat (selecteur + adresse alignee, par ex. un `approve` illimite signe comme texte). Le serveur dit `critical / danger` (fiche F05) ; l'extension autonome dit `warn / attention` (meme fiche F05, memes textes). Ce n'est donc PAS une divergence de la couche de presentation (PRESENTATION identique), c'est la **copie embarquee du moteur qui est perimee**.

Exemples (echantillon de 1 500, les 4 uniques) : V2-SIG-01114, V2-SIG-01162, V2-SIG-01165, V2-SIG-01125 : `personal_sign`, chainId 0xa86a (Avalanche), serveur critical/danger, autonome warn/attention. Autres exemples du supplement : V2-SIG-01097, V2-SIG-01098, V2-SIG-01106, V2-SIG-01115, V2-SIG-01118, V2-SIG-01122, V2-SIG-01127, V2-SIG-01136 (`personal_sign`, chaines 0x1 / 0xa86a / 0xa869, critical -> warn).

Cause racine verifiee : `BUILD_INFO.json` hache 34 sources ; 3 ont change depuis le build : `engine/src/rules_extra.mjs`, `engine/src/fixes.mjs`, `run/policy.mjs`. Le commit `2f60e13` (« Collecte: amelioration V2 », 04:49:30, cote moteur de Titouan) est posterieur au commit d'Adem `e0a89a7` (04:44:35) et corrige la detection de lisibilite (`readable`, regex avec caracteres de controle) qui active `signed_calldata`, plus de nouvelles regles (F30 signalisation hors chaine). Rien de mal fait par Adem : **il faut relancer `node extension_standalone/build_standalone.mjs`**, puis regenerer le zip. Apres reconstruction, il restera a reverifier ce rapport (le moteur plus recent pourrait aussi toucher d'autres cas non couverts ici).

## 3. Garanties du build livre

- `ok` ne sort jamais : 0 occurrence de `niveau` ou `level` = `ok` sur les 2 064 verdicts serveur + 2 069 verdicts autonomes + 5 927 du supplement. Les seules chaines `'ok'` du noyau sont un commentaire, le calcul interne de fusion de lots (ligne 110, puis rehausse par `niveau`) et la garde « ne renvoie jamais ok » (la garde de `check()` rejette tout niveau hors critical/warn/info).
- `info` distinct de `ok` : `niveau` ne prend que `critical`, `warn`, `info` (1 224 `info` observes, `level` correspondant `attention`).
- Pas de mode de test : aucune occurrence de `testMode`, `test_mode`, `TEST_HOOK`, `autoApprove`, `autoDecide`, `HOLDUP_TEST` dans les 35 fichiers du dossier `extension/` (pas de dossier `extension_test` livre ; `BUILD_INFO.build = holdup-standalone`).
- Pas de reseau : 0 occurrence de `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `importScripts`, ni d'URL `http(s)://` dans tout le dossier ; `manifest.json` : permissions `storage`, `alarms` seulement, CSP `connect-src 'none'`. Pendant les tests, `fetch`/XHR/WebSocket etaient pieges : 0 appel.
- Pas d'`eval` ni de `new Function` : 0 occurrence.

## 4. Zip `dist/hold-up-standalone.zip`

**Le zip ne correspond PAS au dossier.** Date du zip : 2026-10-11 03:39:34 (heure locale), 97 935 octets, dossier `hold-up-standalone/` a 26 fichiers ; le dossier `extension_standalone/extension/` (35 fichiers, derniere modification 04:49:35) est plus recent d'une heure et dix minutes. Hachages SHA-256 fichier par fichier : 13 fichiers identiques sur 35 ; 13 differents (`BUILD_INFO.json`, `background.js`, `bridge.js`, `engine/policy.js`, `engine/sentinelle_core.js`, `engine/src/fixes.js`, `engine/src/rules_extra.js`, `engine/textes.js`, `engine/textes.json`, `inject.js`, `manifest.json`, `options.html`, `options.js`) ; 9 absents du zip (`gatekeeper.js`, `hold_core.js`, `window.html/css/js`, `ui/verdict.html/css/js`, `engine/src/protocols_extra.js`). Le zip est donc l'ancienne version, avant la fenetre de verdict separee et la retenue persistante. A regenerer apres le rebuild (`package_standalone.ps1`).

## 5. Latence de la voie autonome (1 500 requetes, apres 60 de chauffe, Node 24)

Mediane **0,30 ms**, p95 **5,96 ms**, max 14,8 ms (mesure externe `performance.now()` autour de `check()` : 0,27 ms / 4,8 ms sur la premiere passe ; latence interne `latency_ms` equivalente). Mesure hors navigateur : la latence dans un service worker MV3 (stockage, messages, ouverture de fenetre) s'y ajoute.

## Limites de cette verification

Contexte local vide des deux cotes (le carnet d'adresses / l'historique ne sont pas exerces ici) ; `NATIVE_SYMBOL[31337/1337] = 'AVAX'` est une difference voulue cote extension (hors bloc PRESENTATION) : aucun cas des jeux n'utilise ces chaines, donc non exercee. Faux objet `chrome` non necessaire (noyau pur ES module).
