# Rapport V7 : fusion des pitchs, alignement des livrables

Date : 11 oct. 2026. Aucun commit, aucun `.env` lu ou écrit, aucun fichier de `livrables/pitch_v7/` modifié, aucun code touché.

## 1. Ce qui a été lu

- `research/titouan/PITCH_V6_TITOUAN.md` (base Titouan) et `pitch_loop/round2/`, `round3/` (jurés simulés sur V5 : 68, 71, 75, 77, 79, moyenne 74,0).
- `livrables/pitch_v7/` d'Adem (commits a09be1d et f1ca0ec) : `PITCH_ADEM.md`, `PITCH_5MIN.md`, `PITCH_3MIN.md`, `DEMO_DEROULE.md`, `QR.md`, `SOURCES.md`, `AUTOCRITIQUE.md`, `ACCROCHES.md` (survolé).
- `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`, `LISEZ_MOI.md`, `JOURNAL_OUVERTURE.md`, `README.md` du jeu.
- `webdemo/RAPPORT_REVOQUER.md`, `extension/RAPPORT_SECURITE_CORRECTIFS.md`, `coord/reports/AUDIT_APPLICATION_FINIE.md` (points 7, 13, 15), `coord/DECISIONS.md` (D-014 à D-016), `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` (résumé).
- `research/titouan/BM2/BM_MODELE.md` (promesse, segments, modèles M1 à M3, script de 45 s), `BM_MARCHE.md`.

## 2. Livrables produits ou mis à jour

| Fichier | Changement |
|---|---|
| `research/titouan/PITCH_V7_TITOUAN.md` | Nouveau. Fusion V6 + jurés + Adem + jeu aveugle + BM2. 560 mots dits, 4 chiffres, Q&R de 23 questions |
| `livrables/PITCH_5MIN.md` | Réécrit sur la fusion (table temps, qui, écran, geste, texte). Renvoie à `pitch_v7/DEMO_DEROULE.md` pour les gestes |
| `livrables/PITCH_3MIN.md` | Réécrit : 306 mots, scène d'Adem, jeu aveugle, modèle, promesse |
| `livrables/VIDEO_SCRIPT.md` | 7 plans, 2 min 40 : deux fenêtres, terminal 100 vers 0 légendé, droit ramené à 50, révocation (démo web), fiche et journal, jeu aveugle |
| `livrables/FICHE_DEFENSE.md` | Une page : promesse, démo, jeu aveugle en premier, limites du jeu, couverture 18 sur 58, BM2 |
| `livrables/QR_JURY.md` | Réécrit (31 questions) : preuve, produit, scène d'Adem, BM2. Renvoie à `pitch_v7/QR.md` pour Aerodrome, NIST, Anthropic |
| `livrables/SLIDE_CONFORMITE.md` | Aucune conformité revendiquée, journal chaîné aussi en autonome, build livré avec Clef (D-015), inexactitudes du journal, Fuji selon D-016, note 4 sans le 1,3 % |
| `livrables/CHIFFRES.md` | Version 3. A6 rempli ; section « Jeu aveugle » (3 bras, intervalles, critères, gain de la phrase, familles faibles, règles d'oral) ; A12 marqué « ne plus citer comme garantie » ; nouvelles lignes A18 (révocation), A19 (journal chaîné autonome), A20 (couverture 18 sur 58), A21 (scène dans Chromium), B15 (Transaction Shield), B16 (Aerodrome), B17 (SCONE-bench), B18 (ScamSniffer 2024, questions seulement) ; phrases interdites complétées |
| `livrables/deck/build_deck.js`, `holdup.pptx`, `DECK.md` | 9 slides refaites ; pptx régénéré (`NODE_PATH=...\Ghg_tracker\node_modules`), sans installation. Rendu image non vérifié |
| `README.md` | Retouches minimales sur la version d'Adem (commit 0d97e90) : promesse, « jamais de vert » remplacé, démo V7, jeu aveugle, limites (révocation hors extension, 18 sur 58, 15 % de faux rouges), carte du dépôt |

## 3. Comptage des mots dits

Script Node : texte entre « ## 0:00 » et « ## Questions », titres et crochets exclus, découpe sur les espaces, mots avec au moins une lettre ou un chiffre.

| Texte | Mots | Durée à 130 mots/min |
|---|---|---|
| `PITCH_V7_TITOUAN.md` et `livrables/PITCH_5MIN.md` (fusion) | 560 | 4 min 18 s, plus environ 40 s de gestes |
| `livrables/PITCH_3MIN.md` (fusion) | 306 | 2 min 21 s |
| `livrables/pitch_v7/PITCH_5MIN.md` (Adem, colonne « Texte dit ») | 540 (dont 4 mots de renvoi) | 4 min 09 s ; Adem annonçait « environ 540 », compté à la main : confirmé |
| `livrables/pitch_v7/PITCH_3MIN.md` (Adem) | 297 | 2 min 17 s |

## 4. Différences entre ma V7 et celle d'Adem

### Structure

| Point | Adem (`pitch_v7/PITCH_5MIN.md`) | Fusion (`PITCH_V7_TITOUAN.md`) |
|---|---|---|
| Ouverture | Deux fenêtres, le même site, l'un piraté | Gardée telle quelle |
| Postulat | NIST SP 800-207 et Aerodrome (81 min) | Remplacé par « tout service peut être compromis » et 48 % d'illimité, avec l'image des clés de la maison |
| Démo | Honnête, piraté sans Hold up (100 vers 0), avec Hold up (droit ramené à 50), main levée | Gardée, phrase « ça correspond » rendue défendable |
| Après l'alerte | Absent (Annuler et droit ramené à 50) | Ajouté : révoquer en un clic, fiche d'incident (démo web, portefeuille simulé, dit) |
| Fait réel | LI.FI avec 153 portefeuilles et 11,6 M$, puis 47,6 %, 34,2 %, 106 106 et 83,85 M$ | LI.FI dit sans chiffre (« illimités vidés, limités rien perdu ») ; chiffres sur la slide seulement |
| IA | Anthropic, 207 contrats sur 405 en simulation | Retiré de l'oral (trop proche de « l'ère de l'IA »), gardé en question |
| Preuve | Jeu aveugle : 64,7 %, 87,3 %, 6 sur 19, 18 sur 19, 15 %, 10 %, 11 sur 15 | Jeu aveugle : 87 %, 65 %, 15 %, seuil dit sans le chiffre, cause NFT, **limite dite : auteur de la même famille de modèles** (absente chez Adem) |
| Données | Non dit à l'oral, exprès (en question) | Une phrase : la phrase seule part vers un modèle par un relais local ; le modèle ne peut pas baisser une alerte ; cahier numéroté |
| Limites | Carton « contrôlé aujourd'hui / pas encore » | Gardé et complété (fraude voulue, Ledger, téléphone, pas de vrai MetaMask) |
| Référentiel | Carton Detect et Respond, Vitalik Buterin | En question et dans la fiche (avec PR.AA-05 pour la limitation, comme le note Adem) |
| Modèle économique | « gratuitement », une demi-phrase | 30 secondes BM2 : particulier gratuit, API verdict avant retrait, licence, mandats pour agents, pilotes maintenant |
| Fin | « Si ça ne colle pas, je lève la main. On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse. » | Promesse de Titouan puis phrase de fin d'Adem |

### Chiffres dits à l'oral

| | Adem | Fusion |
|---|---|---|
| Nombre de chiffres (hors montants de scène) | Environ 15 : 81 min, 800-207, 153, 11,6 M$, 47,6 %, 34,2 %, 106 106, 83,85 M$, 207 sur 405, 64,7 %, 87,3 %, 6 sur 19, 18 sur 19, 15 %, 10 %, 11 sur 15 | 4 : 48 %, 87 %, 65 %, 15 % |
| Arrondis | Décimales (47,6 ; 64,7 ; 87,3) | Entiers à l'oral, décimales dans les slides et la fiche |
| Écarts de valeur | Aucun : tous les chiffres d'Adem sont exacts au regard de `RESULTAT.md` et de `CHIFFRES.md` | Aucun |
| Chiffres d'Adem absents de `CHIFFRES.md` avant cette passe | Aerodrome 81 min, SCONE-bench 207 sur 405, 18 sur 58, latences de la scène, 494 M$ de 2024 | Ajoutés (B16, B17, A20, A21, B18) avec leurs réserves, pour que `CHIFFRES.md` reste la source unique |
| Point de vigilance | `pitch_v7/QR.md` question 12 compare 2024 et 2025 (« la douleur a fondu ») ; `CHIFFRES.md` interdit toute comparaison d'années comme tendance | La fusion répond sans comparer (B3 seul, B18 en réserve). À aligner chez Adem si on veut une seule règle |
| Point de vigilance | `pitch_v7/SOURCES.md` signale que `CHIFFRES.md` A6 disait « non passé » | Corrigé : A6 et la section « Jeu aveugle » publient le résultat tel quel (D-012) |

### Promesses et phrases

| | Adem | Fusion |
|---|---|---|
| Promesse | « On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse. » | Les deux : « cesser de donner plus que nécessaire, car on s'expose en le faisant » (Titouan), puis la phrase d'Adem en fin |
| « Ça correspond » | « Ça correspond. La demande part seule vers le portefeuille » | « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. » (texte de la démo web ; Adem note lui-même que la deuxième demande n'est pas comparée) |
| MetaMask | Absent de l'oral (en question) | « MetaMask affiche "illimité" sans alerte si l'adresse n'est sur aucune liste. Il ne sait ni combien je voulais donner, ni à qui. » |
| Perte bornée | « le pirate ne peut prendre que ce que j'avais écrit » | Identique, et « le pirate ne prend rien » interdit partout |
| Gratuité | « gratuitement » | « le particulier ne paie pas », payeurs nommés |
| Fuji | Non dit | Non promis ; formule D-016 en questions |
| Mots interdits | Aucun « bloque », « sécurisé », « premier » | Idem, plus « jamais de vert » retiré partout |

## 5. Recommandation : une version unique

**Jouer la fusion (`livrables/PITCH_5MIN.md` et `PITCH_3MIN.md`, base `PITCH_V7_TITOUAN.md`).** Elle garde l'ossature d'Adem, qui est la meilleure idée des deux (une scène, une main levée, une phrase de fin), et y ajoute ce que les jurés ont demandé et qui manque chez Adem :
1. quatre chiffres au lieu d'une quinzaine (Kryptosphère et le « juré qui n'y connaît rien » de l'autocritique d'Adem disent la même chose) ;
2. la limite du jeu aveugle dite à voix haute (même famille de modèles) : sans elle, Utopia et KPMG retrouvent le biais d'auteur ;
3. une réponse après l'alerte (Team1 et AWS : « aucune réponse au sens strict ») ;
4. le modèle économique en 30 secondes (BM2), qui répond à « s'intègre-t-il aux outils d'une fintech ? » ;
5. aucun appui sur le NIST 800-207 (absent du dépôt, signalé par Adem lui-même) ni sur l'IA en simulation.

Garder `livrables/pitch_v7/DEMO_DEROULE.md` comme feuille de démo unique : il est plus précis que tout ce que j'ai écrit sur l'état de chaque geste. Garder `pitch_v7/QR.md` comme réserve pour Aerodrome, NIST et Anthropic.

Risque principal de la fusion : 560 mots plus environ 40 s de gestes, plus le changement d'onglet vers la démo web. Si la répétition dépasse 5 min, couper dans cet ordre : « Le fait » (LI.FI, 25 mots), puis la phrase sur la révocation passe en question. Ne jamais couper le 15 % ni la limite de l'auteur.

À trancher par Adem et Titouan : qui dit le postulat (fusion : Adem, pour garder le clavier jusqu'à 2:20) ; garder ou non le carton Detect et Respond (fusion : en question seulement).

## 6. Corrections des jurés du round 3 : où elles sont

| Demande | Fait |
|---|---|
| Remplacer « jamais de vert » | « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. » partout ; « jamais de vert » listé dans les phrases interdites |
| Ne plus citer le 1,3 % comme garantie | Retiré de l'oral, de la slide de conformité et du deck ; en question avec « grille écrite par nous » ; A12 annoté |
| Jeu aveugle en premier, avec ses limites | Section « La preuve » ; fiche, README, CHIFFRES, deck slide 6 |
| Scène après l'alerte | 2:00 à 2:20, démo web, portefeuille simulé dit ; vidéo plans 5 et 6 ; deck slide 4 |
| Dire ce qu'on ne couvre pas | 3:50 à 4:15 ; deck slide 8 ; fiche |
| 4 chiffres à l'oral | 48 %, 87 %, 65 %, 15 % |
| Langage simple | Clés de la maison, cahier numéroté, page arrachée |
| Promesse de Titouan | Fin du pitch, fiche, deck, README |
| Phrase sur MetaMask, adresse non listée | 1:05 à 1:30, avec la condition |
| Pas de « bloque », « premier », « rien ne quitte la machine », « sécurisé », « à l'ère de l'IA », chiffres retirés, DORA ou MiCA revendiqués | Vérifié par grep sur les 10 fichiers (les seuls « premier » restants sont « premier revenu », « premier pilote », « le premier critère ») |

## 7. Vérification de cohérence (grep)

- Valeurs du jeu aveugle identiques dans tous les fichiers : 87,3 % (11 occurrences), 15,0 % (11), 64,7 % (6), 88,7 % (5), 16,0 % (6), 76,0 % (5), intervalles [81,1 ; 91,7] et [9,3 ; 23,3]. Aucune variante.
- Plus aucune mention « jeu aveugle non passé » ou « à mesurer » dans les fichiers dont je suis propriétaire.
- Fuji : toujours « préparé et répété, non exécuté » ou « rien n'y est déployé ».
- Aucun tiret long.

## 8. Ce qui reste ouvert

- Le texte fusionné n'a pas été dit à voix haute : chronométrer une répétition avec les gestes.
- Rendu du pptx non vérifié visuellement (pas de LibreOffice).
- `BM2/BM_MODELE.md` contient encore « jamais de vert » et cite le 1,3 % dans sa réponse 4 : fichiers d'un autre agent, non modifiés. À aligner avant de les projeter.
- `pitch_v7/QR.md` compare 2024 et 2025 (question 12) : contraire à la règle de `CHIFFRES.md`. À Adem de trancher.
- La scène dépend des jetons déclarés à la main et du build actuel non retesté (`DEMO_DEROULE.md`, points 3 et 4).
- La révocation n'est pas dans l'extension (audit, point 7) ; le journal a deux inexactitudes (audit, point 13).
