## 6. Ce que vaut le chiffre du contrôle, et la règle pour la suite

- Le contrôle a été mesuré **une fois, sur un build en panne** (commit `7a5eadc`, empreinte du décideur `38e3afdd56bd…`, 11 oct. 07:45 UTC). `const niveau` est réaffecté à la ligne 512 de `extension_standalone/extension/engine/sentinelle_core.js` : exception pour toute demande classée au niveau le plus bas. Sur le contrôle : 520 paires sur 2 662 en panne (19,5 %), dont tous les envois de jeton (202 sur 202) et tous les envois de monnaie du réseau (114 sur 114).
- Ce résultat est gardé tel quel. Il dit ce que faisait le build livré à cette heure. Il ne mesure pas la décision du produit sur les demandes en panne.
- Les exécutions suivantes sur ce même code figé (bras Clef complété, erratum E1, colonne des pannes) sont des rejeux à l'identique : `preuves/panel/OUVERTURES.log`.
- **Mesure finale après corrections : la RÉSERVE** (`preuves/panel/RESERVE.jsonl`, 2 673 paires, jamais ouverte), une seule fois, par `node --no-warnings preuves/banc.mjs --ouvrir-reserve`, une fois les corrections gelées et commitées. Le contrôle, dont les erreurs sont publiées, ne sert plus que de réglage.
- Le banc refuse maintenant de mesurer un moteur qui lève une exception (contrôle préalable sur 17 demandes d'essai).

### État intermédiaire du code vivant, à titre indicatif (réglage seulement)

Un autre agent corrige le produit pendant cette mission. Le banc a mesuré un état intermédiaire, sur la **moitié réglage** du panel seulement, sans modèle, installation par défaut. Ce n'est ni un contrôle ni un état commité : 63 fichiers modifiés hors commit, et le code a encore changé depuis.

| État du code | Panne | Attrapé | Raté | Non conforme laissé « pas pu vérifier » | Fausse alerte | Conforme laissé « pas pu vérifier » | Surconfiance |
|---|---|---|---|---|---|---|---|
| Référence, commit `7a5eadc`, empreinte `38e3afdd56bd…` (avant erratum E1 et avant la colonne des pannes : ici les pannes sont dans « pas pu vérifier ») | 718/3 561 = 20,2 % | 1 188/2 370 = 50,1 % [48,1 ; 52,1] | 50/2 370 = 2,1 % [1,6 ; 2,8] | 1 132/2 370 = 47,8 % | 51/702 = 7,3 % [5,6 ; 9,4] | 435/702 = 62,0 % | 0/489 |
| Intermédiaire, commit `f1ca0ec` + 63 fichiers, empreinte `c21809a218cc…`, 11 oct. 07:58 UTC (avant erratum E1) | 0/3 561 | 1 597/2 370 = 67,4 % [65,5 ; 69,2], dont 115 corrigés par réécriture du droit | 173/2 370 = 7,3 % [6,3 ; 8,4] | 600/2 370 = 25,3 % | 109/702 = 15,5 % [13,0 ; 18,4] | 130/702 = 18,5 % | 12/489 = 2,5 % [1,4 ; 4,2] |

Lecture : la panne corrigée, le produit attrape plus (67 % contre 50 %), mais il rate trois fois plus (7,3 % contre 2,1 %), alerte deux fois plus à tort (15,5 % contre 7,3 %), et dit « ça correspond » à 12 messages libres que personne ne peut vérifier. Commande : `node --no-warnings preuves/banc.mjs --a-cote --sans-controle --bras=mots`. Fichiers : `preuves/out/etats/c21809a218cc4d21/`. Ces deux lignes comptent 31 paires d'envoi natif avec la vérité d'avant l'erratum E1 : les relancer donne les chiffres corrigés.

## 7. Comparaison avec `livrables/CHIFFRES.md` (version 2, lue le 11 oct. 2026)

Ce banc mesure l'extension elle-même. La plupart des lignes A des livrables mesurent autre chose : une chaîne de banc (`run/arms.mjs`, `pipeline/grille/lib.mjs`, `pipeline/evaluate_plus.mjs`) avec un contexte que le produit n'a pas. Trois statuts : **diffère**, **non retrouvé** (ce banc ne peut ni confirmer ni infirmer), **retrouvé**.

| Ligne | Ce que disent les livrables | Ce que ce banc trouve | Statut |
|---|---|---|---|
| A6 et en-tête, `PRODUCT.md` ligne 50 | Jeu aveugle de 250 cas : « Non passé », « n'est toujours pas passé » | Il a été ouvert le 11 oct. à 07:10:52 UTC (`blind_decalage/run/OUVERT.lock`, `RESULTAT.md`). Résultat publié par son lanceur : code seul, rappel 131/150 = 87,3 % [81,1 ; 91,7], fausses alertes rouges 15/100 = 15,0 % [9,3 ; 23,3] ; avec Clef 88,7 % et 16,0 % ; critères publiés avant ouverture non atteints. L'empreinte du fichier est conforme à l'empreinte publiée (`REGISTRE.json`) | **Diffère : ligne périmée.** D-012 demande de publier ce résultat en A6 |
| A6, suite | (rien) | Ce jeu a été mesuré par la chaîne de la grille (`blind_decalage/run/chaine/`), pas par l'extension. Ce banc ne l'a pas rejoué : il est interdit | À dire à côté du chiffre |
| A11 | Grille, contrôle, code seul : attrapé 399/461 = 86,6 %, fausses alertes 23/298 = 7,7 %, invérifiable reconnu 293/320. « C'est ce que fait le build autonome » | Même fichier (empreinte `3644a72c…` retrouvée à l'octet près), à travers le build autonome réel, sans modèle, installation par défaut : attrapé 176/461 = 38,2 % [33,9 ; 42,7], raté 21/461 = 4,6 %, « pas pu vérifier » 99/461, panne 165/461 = 35,8 % ; fausses alertes 29/298 = 9,7 % [6,9 ; 13,6] ; surconfiance 41/320 = 12,8 % | **Diffère.** Le 86,6 % est celui d'une chaîne de banc qui ajoute un repli lexical écrit sur le réglage de la grille. La phrase « c'est ce que fait le build autonome » est fausse |
| A11, rôle | « Contrôle scellé » | Depuis l'ouverture, `extension/intent_text.js` a reçu la règle `GIVE_RIGHT`, écrite d'après les 23 fausses alertes de ce contrôle (son commentaire le dit) | **Diffère :** ce n'est plus un contrôle pour le produit actuel |
| A12 | Même grille, Clef classe : 86,6 %, fausses alertes 4/298 = 1,3 % | À travers l'extension et le vrai relais : attrapé 176/461 = 38,2 %, raté 26/461 = 5,6 %, fausses alertes 27/298 = 9,1 % [6,3 ; 12,9] | **Diffère.** Le relais du produit pose d'autres questions à Clef que le banc de la grille (`intent_text.js` contre `pipeline/intent_clef.mjs`) |
| A13, A14 | Bras (c), (d), (da) | Ces bras n'existent pas dans l'extension | Non retrouvé |
| A5 | Décalage : 228 écarts signalés sur 228, 0 fausse alerte sur 166 | 410 cas régénérés, phrase libre du cas, à travers l'extension : attrapé 157/244 = 64,3 % [58,2 ; 70,1] (244 = 228 + 16 limites connues), raté 4/244, panne 83/244 ; fausses alertes 0/166 [0 ; 2,3], panne 103/166 | **Diffère sur le rappel**, retrouvé sur les fausses alertes. Le 228/228 utilisait l'intention structurée du cas, pas la phrase |
| A1, A2, A3, A15 | Moteur seul ou complet sur V2_DEV et `jury_*` : rappel rouge 41,2 % à 84,3 %, fausses alertes rouges 16,3 % à 25,4 % | Autre mesure (niveau « rouge » d'un moteur avec contexte, sans phrase). Par l'extension, avec la phrase du cas, V2_DEV sans modèle : attrapé 1 637/2 451 = 66,8 %, raté 6/2 451, panne 538/2 451 ; fausses alertes 283/1 867 = 15,2 %, panne 938/1 867 | Non retrouvé (objets différents) |
| A4, `PRODUCT.md` « 13,9 % » et « 54,2 % » | Banc « conditions du produit » : rappel rouge 71,3 %, fausses alertes rouges 13,9 % | Le banc réaliste n'est pas l'extension ; non rejoué | Non retrouvé |
| A7 | Aucune intention ne baisse un verdict | Non mesuré ici | Non retrouvé |
| A8, A9, A10 | Lecture de la phrase par mots-clés et par Clef | Non rejoué (pas de demande associée ; `intention_texte` n'a pas de fichier de cas sur le disque) | Non retrouvé |
| A16 | Latence du verdict local : médiane 32,31 ms, p95 47,33 ms (serveur HTTP) | Verdict local de l'extension sous Node, sans HTTP, sur le contrôle : p50 2,0 ms, p95 13,0 ms (n = 2 662) | Objets différents ; « médiane sous 50 ms » tient |
| A17 | Appel Clef-flash : p50 369 ms, p95 1 083 ms, 3 203 réussis sur 3 210 | 10 227 réponses pour 10 229 appels, 1 erreur, 1 attente pour limite de débit : p50 356 ms, p95 1 007 ms. Sur le contrôle, 96 paires sur 2 101 dépassent le budget de 1 500 ms du relais | **Retrouvé** |
| (absent) | Coût | 689 jetons d'entrée par phrase (p50), soit environ 0,000026 $ par phrase au prix public | Chiffre nouveau |
| B1 à B14 | Données du monde et lectures de chaîne | Hors périmètre de ce banc : non vérifié | Non retrouvé |

Chiffres des livrables à ne plus citer sans correction : A6 « non passé » ; A11 « c'est ce que fait le build autonome » ; A11 et A12 comme mesure du produit ; A5 « 228 sur 228 » comme résultat sur phrase libre.
