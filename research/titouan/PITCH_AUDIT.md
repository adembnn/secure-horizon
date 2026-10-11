# Audit indépendant du pitch Hold up V1 (11/10/2026)

Pitch jugé : `research/titouan/PITCH_V1_TITOUAN.md`. Règlement : `context/notion_guide.md` (fait foi). Chiffres : `livrables/CHIFFRES.md` (seule table autorisée).
Méthode : j'ai lu les sources, recompté les mots par script, vérifié Bybit sur le web (NCC Group, Blockstream, QuillAudits). Aucun test sur le produit lui-même. Aucun commit.

---

## (a) Ce que le règlement et la grille attendent, et ce que le pitch couvre

Format Round 1 : 5 min + 2 min de questions, devant au moins 3 experts. Finale : 3 min + 3 min (le pitch V1 n'a pas de version 3 min, voir `livrables/PITCH_3MIN.md`).

| # | Attendu (source : règlement, Track 1) | Couvert ? | Où dans le pitch V1 |
|---|---|---|---|
| 1 | Un seul scénario traité parfaitement (conseil Track 1) | Partiel | Trois scènes en 75 s. Le héros « échanger 50 » est net, les deux autres sont survolées |
| 2 | Des chiffres, même synthétiques, avec précision, faux positifs, temps de détection (30 %) | Partiel | 3:15 à 4:10. Chiffres présents mais deux sont mal appariés (rappel 83,8 % avec fausses alertes rouges 13,9 %) et le plus gênant (54,2 % d'honnêtes avertis) est absent |
| 3 | Scénario réaliste (grille détection) | Partiel | Trafic Avalanche réel cité (0,30 %), mais rien sur les 77 % d'avertissements du même rapport |
| 4 | Temps de détection et de réponse (fiche de défense) | Partiel | 18 ms cité, mais « rien ne quitte la machine » est faux dès qu'on lit la phrase par un modèle hébergé |
| 5 | Réponse proportionnée, actionnable (20 %) | Partiel | 4:10 à 4:40 : niveaux gradués, Annuler. Rien sur le playbook (qui est alerté, ce qui est automatique, ce qui reste humain). Livrable de la track : `livrables/PLAYBOOK_REPONSE.md` existe, le pitch ne l'évoque pas |
| 6 | Playbook de réponse (livrable de track) | Non | Absent du texte dit |
| 7 | Slide conformité : DORA, AML/CFT, MiCA, AI Act, comment un auditeur vérifie (15 %) | Partiel | Une phrase de journal. Aucun mot sur DORA, MiCA, AML, AI Act ni sur l'auditeur. KPMG est dans la salle |
| 8 | Fonction NIST CSF 2.0 (Detect ou Respond), ATT&CK / OWASP | Non | Aucune fonction nommée à l'oral |
| 9 | « Si votre modèle se trompe, qui est responsable ? » (conseil explicite) | Oui | Réponse prête dans les questions probables. Pas dans le texte dit |
| 10 | Explicable à un régulateur, un auditeur, un assureur | Partiel | Journal chaîné. Surdit : « prouver qu'elle n'a pas été modifiée » |
| 11 | Faisabilité : le PoC marche, s'intègre à une banque, une fintech ou un protocole | Partiel | La démo existe mais le pitch ne dit pas qu'elle tourne sur une chaîne locale, ni qu'il n'y a rien sur Fuji, ni qu'aucun vrai MetaMask n'a été essayé |
| 12 | Honnêteté sur les limites | Oui | 4:40 à 5:00, mais l'essentiel manque : pas essayé avec une vraie personne, pas de Fuji, pas de jeu aveugle passé (ce dernier est dit en 3:15) |
| 13 | Pitch deck : problème, cible, solution, démo, business model, équipe | Partiel | Cible implicite (Camille). Business model et équipe absents du texte (le pitch 5 min livré les dit en 15 s) |
| 14 | Aucune donnée personnelle réelle, aucun secret | Sans objet à l'oral | À ne pas contredire : « rien ne quitte la machine » le contredit côté confidentialité de la phrase |
| 15 | Débit tenable, démo qui peut planter | Partiel | Pas de plan B dit. Le texte tient en 4:22 de parole, mais plusieurs blocs débordent leur créneau (voir (d)) |

---

## (b) Vérification de chaque affirmation

Légende : VRAIE, FAUSSE, NON SOURCÉE, VRAIE MAIS À CORRIGER (vraie en substance, formulation ou statut fautifs).

| # | Affirmation du pitch | Verdict | Source et valeur exacte |
|---|---|---|---|
| 1 | « droit de dépense sur tout mon USDC, pour toujours » | VRAIE | Un `approve` illimité n'a pas de date de fin. Scène S1 de `X_scenarios_hors_metamask.md` |
| 2 | « MetaMask l'affiche. Il ne dit rien d'alarmant, parce que ce site n'est pas sur une liste noire » | VRAIE MAIS À CORRIGER | `RECHERCHE_metamask_couverture.md`, ajout du 11 oct. : MetaMask affiche « Unlimited » et propose « Edit spending cap ». Aucune alerte « unlimited » dans le code lu. Mais c'est une lecture de code de la branche `main`, pas un essai à l'écran. Il faut dire « d'après son code public lu le 11 octobre ». Le pitch l'énonce comme une observation en direct |
| 3 | Scène d'ouverture avec « MetaMask s'ouvre » | FAUSSE si présentée comme preuve | La démo tourne sur chaîne locale. Les chaînes locales et Fuji ne sont pas servies par l'API d'alertes (43113, 31337, 1337 absents). Le silence de MetaMask sur la scène ne prouve rien. Aucun essai avec un vrai MetaMask n'est consigné (`QR_JURY.md` Q6) |
| 4 | « Il ne sait pas que j'ai dit 50 » | VRAIE | Le questionnaire « Security check » n'a pas de texte libre et ne reçoit pas le montant (couverture, point 9) |
| 5 | « Les portefeuilles préviennent de ce qu'ils reconnaissent : sites listés, drainers connus, adresses sosies » | VRAIE | Couverture : listes de domaines, Blockaid, empoisonnement d'adresse (17 juin 2026). Les sosies sont cités comme couverture de MetaMask, pas comme apport de Hold up : conforme à la règle |
| 6 | « C'est utile et ça marche » | NON SOURCÉE | MetaMask écrit lui-même que les simulations « do not guarantee detection of all threats ». Aucune mesure d'efficacité des listes dans nos fichiers. Retirer |
| 7 | « Signer sans comprendre est la faille que les filtres ne ferment pas » | NON SOURCÉE | Affirmation générale et absolue. À reformuler en « un filtre de menaces connues ne dit rien d'une demande légitime mais non voulue » |
| 8 | « Sur Ethereum, nous avons mesuré que 47 % des droits de dépense accordés sont illimités » | VRAIE MAIS À CORRIGER | B1 : 47,7 % [47,0 ; 48,3] (10 427 sur 21 866), droits non nuls, échantillon de blocs, graine 20261011, « échantillon non représentatif ». Le pitch tronque 47,7 en 47, dit « accordés » (ce sont des droits non nuls observés) et omet la réserve. Avalanche C-Chain : 34,2 % (7 094 sur 20 753), chiffre plus pertinent devant Team1 |
| 9 | « Ce n'est pas un détail : c'est la norme » | FAUSSE | 47,7 % est inférieur à la moitié, donc pas « la norme ». Le premier spender d'Ethereum est le contrat Permit2 (B1), ce qui biaise la lecture. Le chiffre 59,8 % existe mais date de 2021 (B2), interdit comme part actuelle |
| 10 | Bybit « en 2025 » | VRAIE | 21 février 2025 (NCC Group, Blockstream, QuillAudits) |
| 11 | « les signataires approuvent un virement affiché alors que la charge signée est un delegatecall » | VRAIE | NCC Group : JavaScript malveillant injecté dans l'interface Safe{Wallet}, affichage normal. QuillAudits : delegatecall qui remplace le `masterCopy`. Réserve : les analyses publiques ne confirment pas ce qu'affichait l'écran du matériel Ledger (`Y_typologie_demos.md`). Rester sur « l'interface affichait un virement » |
| 12 | « 1,5 milliard de dollars » | VRAIE MAIS À CORRIGER | Les sources divergent : 1,4 Md$ (NCC Group) à 1,5 Md$ (autres). Dire « environ 1,5 milliard » ou « entre 1,4 et 1,5 » |
| 13 | « Aucun filtre de portefeuille n'avait de raison de s'allumer » | NON SOURCÉE | Aucun fichier ne l'établit. Les trois signataires utilisaient des Ledger via l'interface du coffre, pas MetaMask : parler de « filtre de portefeuille » est hors sujet. Retirer. Et attention : une extension de navigateur ne voit rien si la page parle au matériel en direct (`Y`, limites) |
| 14 | « Hold up est une extension qui pose une seule question avant de signer » | VRAIE | `PITCH_5MIN.md`, produit |
| 15 | « Hold up décode ce que la demande fait vraiment » | VRAIE avec réserve | Le moteur décode ; 74,5 % du trafic C-Chain réel est « opaque » (REALTRAFFIC). Le pitch ne dit pas que beaucoup de demandes ne se décodent pas |
| 16 | « Si ça correspond : rien, le portefeuille s'ouvre » | VRAIE MAIS À CORRIGER | Le portefeuille s'ouvre seul après une seconde (`PITCH_5MIN`). Mais 54,2 % des honnêtes reçoivent au moins un avertissement (A4). « Rien » est trop beau |
| 17 | « On ne bloque pas. On ralentit et on explique » | FAUSSE (interdit interne) | Le mot « bloque » figure dans la liste des phrases interdites. « Ralentit » n'est pas sourcé : `PLAYBOOK_REPONSE.md` dit « durée de retenue : question ouverte, ne pas citer de durée » |
| 18 | « un bouton Annuler toujours visible » | VRAIE | `PITCH_5MIN.md`, `PLAYBOOK_REPONSE.md` |
| 19 | Scène 1 : « Il propose de limiter le droit à 50, et je continue » | VRAIE MAIS À CORRIGER | Le produit « dit comment ramener le droit au montant écrit » (`PLAYBOOK` §2). Il ne propose pas un bouton qui le fait. Mauvais verbe |
| 20 | Scène 2 : coffre multisig, 20 USDC, delegatecall vers contrat inconnu, critical, fiche F09 | VRAIE | `Y_typologie_demos.md` : critical, F09, codes `delegatecall_unknown_target`, avec ou sans intention. Mais la scène est synthétique, adresses factices, rejeu du moteur sans portefeuille. Le pitch ne le dit pas, alors que `PITCH_5MIN` l'exige |
| 21 | « critical » (mot anglais) | À CORRIGER | Le produit affiche « danger ». Le pitch doit parler comme l'écran |
| 22 | Scène 3 : « Me connecter » demande un Permit | VRAIE | Cas `connexion_droit_signe`, 31 écarts, 31/31 avec l'intention (RAPPORT décalage) |
| 23 | « Nous avons construit 410 cas où la demande semble banale mais ne correspond pas à l'intention » | FAUSSE | A5 : 410 = 394 en 6 familles (228 écarts + 166 jumeaux honnêtes) + 16 limites connues. Seuls 228 sont des écarts. Plusieurs ne sont pas « banals » (31/31 de `swap_destinataire_tiers` sont déjà rouges sans intention) |
| 24 | « Sans intention, notre moteur en attrape 54 % » | VRAIE | RAPPORT décalage : bras `sans` 124/228 (54 %). Plancher seul : 112/228 (49 %). Type seul : 128/228 (56 %). À dire « signale 54 % des 228 écarts » |
| 25 | « Avec l'intention détaillée, 100 % » | VRAIE MAIS À CORRIGER | 228/228, 0 fausse alerte rouge sur 166 jumeaux, mais en bras `honnete` où jeton, montant et jeton reçu sont déjà extraits. Depuis du texte libre (A8, jeu TEST, phrases fabriquées) : montant 93,2 %, jeton 100 %, destinataire 76,3 %, type 42,7 %. Et l'extension ne transmet pas encore ces détails (RAPPORT décalage, « à appliquer » point 2 ; état à confirmer). Le pitch laisse croire que « vous l'écrivez avec vos mots » donne 100 % |
| 26 | « ces cas sont écrits par nous. C'est un chiffre de réglage, pas un test indépendant » | VRAIE MAIS À CORRIGER | CHIFFRES A5 : « test de couverture, pas une mesure de généralisation ». Les règles F31 à F33 ont été écrites contre ces cas. Dire « test de couverture » (cohérent avec la fiche et le 5 min) |
| 27 | « Un jeu de 250 cas écrit par un agent qui n'a pas vu nos règles est scellé » | VRAIE | `blind_decalage/README.md` : 150 malveillants + 100 jumeaux, auteur aveugle (n'a lu ni engine, run, server, detectors, attacks_decalage), hash `ab3dcab9…ee79fd2`. Réserve du README : signatures et structures EIP-712 écrites de mémoire |
| 28 | « nous l'ouvrirons une seule fois » | VRAIE | A6 : « Ouvrir une seule fois ». Non passé |
| 29 | « Sur le trafic réel d'Avalanche, la règle sans intention donne 0,30 % d'alertes critiques » | VRAIE MAIS NON AUTORISÉE | `REALTRAFFIC.md` : 19 sur 6 325, 0,30 % [0,19 ; 0,47]. Mais ce chiffre n'est pas dans `CHIFFRES.md` (B11 donne 0,28 % pour l'ancien filet). Règle : un chiffre absent de la table n'est pas cité. Autres omissions du même rapport : 76,84 % des transactions en avertissement, 95,8 % des alertes C-Chain sont de la seule opacité, revue manuelle de 19 critiques : 2 fausses confirmées, 2 vraies, 15 indéterminées. Le « légitime » est présumé, ce sont des blocs aléatoires avec des robots |
| 30 | « le rappel est de 83,8 % et les fausses alertes critiques de 13,9 % » | FAUSSE (mélange interdit) | BANC_REALISTE bras `intention_produit`, niveau B : 83,8 % est le rappel avertissement ou rouge ; 13,9 % est le taux de fausses alertes rouges. CHIFFRES : « les deux ne se mélangent jamais ». Appariements justes : rappel rouge 71,3 % [69,7 ; 72,9] avec 13,9 % [12,5 ; 15,4] ; ou rappel au moins avertissement 83,8 % avec 54,2 % d'honnêtes avertis. De plus 83,8 % n'est pas dans la table CHIFFRES (A4) |
| 31 | « conditions du produit par défaut » (placé juste après le trafic réel) | À CORRIGER | Banc synthétique (3 254 arnaques, 2 136 honnêtes), pas du trafic réel. La phrase d'avant parle du réel : le jury lira les deux comme réels. Le statut « synthétique » manque |
| 32 | « Nous publions les deux, parce que le second chiffre est le moins flatteur » | VRAIE MAIS INCOMPLÈTE | Le moins flatteur est 54,2 % d'honnêtes avec un avertissement, non cité |
| 33 | « 18 millisecondes en médiane » | VRAIE | A12 : 18,39 ms, p95 34,08 ms, max 97,02 ms, 400 requêtes qui répètent 8 requêtes types, sans réseau, sans l'appel à Clef. Varie d'une exécution à l'autre : retenir « moins de 50 ms » |
| 34 | « hors ligne, rien ne quitte la machine » | FAUSSE | `QR_JURY.md` Q13 : la phrase est lue par un modèle hébergé (Clef), minimisation et durée de conservation non rédigées. Un appel Clef-flash : p50 369 ms, p95 1 083 ms (A13). Le temps de 18 ms exclut cet appel |
| 35 | « journal chaîné par hachage : on peut rejouer la décision » | VRAIE MAIS À CORRIGER | `PLAYBOOK` §6 : « la version des règles n'est pas dans le journal » ; le journal « ne garde pas encore la phrase écrite ni les paramètres complets ». Rejeu partiel |
| 36 | « et prouver qu'elle n'a pas été modifiée » | FAUSSE | `QR_JURY.md` Q16 : le journal détecte une ligne modifiée ou retirée au milieu. Une réécriture complète ne se détecte qu'avec l'ancrage, non déployé sur Fuji. Deux formats de journal sans pont (sha256 serveur, keccak ancrage) |
| 37 | « L'ancrage de la racine sur la blockchain est prévu pour la version suivante » | NON SOURCÉE | `PLAYBOOK` §6 : ancrage fait sur chaîne locale seulement ; aucune transaction Fuji. Aucune feuille de route chiffrée. Écrire « fait en local, pas sur Fuji » |
| 38 | « La réponse est graduée : information, attention, danger, manipulation » | VRAIE | `server/server.mjs` : niveaux `info`, `attention`, `danger`, `manipulation` (plus `unknown`) |
| 39 | « Jamais de vert qui dit tout va bien » | VRAIE | Invariant : aucun niveau `ok` produit (RAPPORT décalage) |
| 40 | « Hold up ne voit pas une fraude consentie » | VRAIE | T5, QR 9 |
| 41 | « Il ne remplace pas MetaMask : il complète ce que MetaMask ne peut pas savoir, c'est-à-dire ce que vous vouliez » | VRAIE MAIS À CORRIGER | Couverture, fin de (b) : « par construction » décrit l'état du produit, pas une impossibilité technique ; MetaMask a déjà l'écran, les questions et le délai. Contredit la réponse prévue plus bas (« C'est possible, il a déjà l'écran »). Proche de la formule interdite « MetaMask ne le voit pas » en général. Remplacer par « MetaMask n'interroge pas aujourd'hui sur une demande qu'il juge normale » |
| 42 | Q : « toute demande et pas seulement les envois signalés, texte libre, comparaison à l'effet réel » | VRAIE | Position défendable de la couverture et `QR_JURY` 1 |
| 43 | Q : « Le comparateur final est du code. Le modèle ne fait que comprendre la phrase » | VRAIE avec réserve | `QR_JURY` 2. Réserve manquante : la précision du modèle sur la comparaison n'est pas mesurée par nous (pas de clé) ; type juste 72,8 % (DEV), 38,0 % (TEST, tournures jamais vues), type faux grave 3,6 % et 8,7 % |
| 44 | Q : « Une extension voit aussi les signatures hors chaîne, que ni un RPC ni les envois du portefeuille ne montrent » | FAUSSE en partie | Un Snap MetaMask dispose de `onSignature` (couverture, ligne Snaps d'aperçu) : il voit les signatures. Pour le RPC, vrai. Surtout, le RPC de garde est un interdit comme apport et n'est plus une porte du produit |
| 45 | Q : « Nous ne savons pas à quelle fréquence une demande bénigne diverge de l'intention » | VRAIE | Honnête et sourcée par l'absence de mesure |

### Contrôle des interdits internes

| Interdit | Présent dans le pitch V1 ? |
|---|---|
| « MetaMask ne le voit pas » en général | Frôlé : « ce que MetaMask ne peut pas savoir » (n° 41) |
| « personne ne protège » | Non |
| « à l'ère de l'IA » | Non |
| Tendances en hausse | Non. « La norme » n'est pas une tendance mais est fausse (n° 9) |
| « premier » | Non |
| « bloque » | OUI : « On ne bloque pas » (n° 17) |
| « Sentinelle » | Non |
| Chiffres retirés (R3 80,4, filet 81,9, preuve sociale 99, nonce, 100 % et 0 % sur DEV) | Non. Attention : le « 100 % » du pitch est le A5 (cas de décalage), pas le 100 % DEV retiré, mais il sonne pareil. Le préciser « 228 sur 228, test de couverture » |
| « Clef classe l'intention » sans mesure | Non cité. Mais le modèle est invoqué sans réserve de mesure (n° 43) |
| Sosie d'adresse ou RPC de garde comme apport | Sosies cités comme couverture du portefeuille (acceptable). RPC cité dans une réponse (n° 44) : à retirer |
| Chiffre absent de CHIFFRES | OUI : 83,8 % et 0,30 % (n° 29, 30) |
| Mélange rappel rouge / rappel avertissement | OUI (n° 30) |

---

## (c) Notes simulées du jury, pitch V1 tel quel

Je note le pitch (et ce qu'il laisse savoir du produit), avec l'état connu du dépôt. Les notes sont en points sur le poids du critère.

| Membre | Détection /30 | Réponse /20 | Faisabilité /20 | Conformité /15 | Pitch /15 | Total /100 |
|---|---|---|---|---|---|---|
| Team1 Avalanche | 15 | 9 | 9 | 6 | 10 | **49** |
| KPMG | 14 | 9 | 8 | 5 | 9 | **45** |
| Kryptosphère | 16 | 9 | 10 | 7 | 11 | **53** |
| Utopia | 14 | 10 | 10 | 7 | 11 | **52** |
| AWS | 14 | 8 | 10 | 6 | 10 | **48** |
| **Moyenne** | 14,6 | 9,0 | 9,4 | 6,2 | 10,2 | **49,4** |

Justifications.

- **Team1 Avalanche (49).** Il aime le trafic réel de la C-Chain et l'aveu « rien ne quitte… » le gêne moins que Fuji : « Vous citez Bybit, vous mesurez sur Avalanche, mais votre démo n'est pas sur Fuji et vous ne le dites pas. » Détection 15 : 0,30 % est une bonne ligne, mais le rapport source dit 77 % d'avertissements. Faisabilité 9 : chaîne locale non annoncée, aucun vrai portefeuille. Il note que 47 % est un chiffre Ethereum alors que le projet vise Avalanche (34 %).
- **KPMG (45).** « Je ne vois ni DORA, ni MiCA, ni AML, ni AI Act, ni qui alerte quoi. » Conformité 5 : un journal sans version des règles, avec la phrase « prouver qu'elle n'a pas été modifiée » qui est fausse. Réponse 9 : pas de playbook. Détection 14 : « 410 cas banals » et le mélange 83,8 / 13,9 coûtent en crédibilité.
- **Kryptosphère (53).** Elle aime la scène « échanger 50 » et le cas Bybit. Elle sanctionne « c'est la norme » (47 % n'est pas une majorité) et « MetaMask ne peut pas savoir » alors que MetaMask a déjà un questionnaire. Détection 16, la meilleure note de la salle.
- **Utopia (52).** Elle regarde le modèle : précision de la lecture de phrase non mesurée, 38 % de type juste sur tournures neuves, intention qui n'apporte presque rien sur les arnaques vertes (A9 : 0 sur 298). Elle relève « rien ne quitte la machine » contre « modèle hébergé ». Réponse 10 grâce à « le comparateur est du code ».
- **AWS (48).** « 13,9 % de rouges sur des honnêtes, c'est de la fatigue d'alerte ; qu'est-ce qui tourne sur quoi ? » Faisabilité 10 : tout est local, aucune architecture hébergée dite. Réponse 8.

Écart avec les passes précédentes (`coord/reports/jury/SUIVI.md`, 59,1 à la passe 4) : ces passes jugeaient le dépôt entier ; ici je ne juge que ce qui est dit en 5 minutes, ce qui explique environ 10 points de moins.

### Les 3 questions pièges les plus probables

1. **« Vos 13,9 % de fausses alertes rouges et vos 54,2 % d'avertissements : qui lira vos alertes au bout d'une semaine ? Et vos 100 % sont de vous. »** Réponse dans le pitch V1 : PARTIELLE. Le 100 % est bien signalé comme non indépendant. Le 54,2 % manque, le 83,8 % est mal apparié, aucune réponse sur la fatigue d'alerte. Réponse du pitch corrigé : chiffres appariés, fatigue d'alerte nommée comme limite principale (fiche de défense), l'intention réduit le bruit seulement si elle est précise.
2. **« Avez-vous essayé avec un vrai MetaMask ? Sur Fuji ? Et où va la phrase que j'écris ? »** Réponse dans le pitch V1 : MANQUANTE, et le texte dit même « rien ne quitte la machine », faux. Réponse corrigée : non, chaîne locale, rien sur Fuji, le silence de MetaMask sur une chaîne locale ne prouve rien ; la phrase part vers un modèle hébergé, minimisation à rédiger ; montants et adresses lus en local.
3. **« MetaMask a déjà un questionnaire de 3 questions et un délai de 10 secondes. Pourquoi pas eux ? Et si le modèle se trompe, qui répond ? »** Réponse dans le pitch V1 : PRÉSENTE (questions probables 1 et 2) mais contredite par la phrase finale « ce que MetaMask ne peut pas savoir ». Il manque aussi l'aveu que MetaMask a ce questionnaire (10 s, `PROCEED_DELAY_SECONDS`), que le jury peut citer.

Quatrième probable : « Qu'est-ce qui empêche un escroc de dicter la phrase ? » Réponse prête dans `QR_JURY` Q10, absente du pitch.

---

## (d) Timing

Comptage par script, texte dit seulement (didascalies et questions exclues), 130 mots par minute.

| Section | Créneau prévu | Mots | Temps parlé | Écart au créneau |
|---|---|---|---|---|
| 0:00 à 0:30 Accroche | 30 s | 49 | 23 s | 7 s de marge pour la scène jouée |
| 0:30 à 1:15 Problème | 45 s | 112 | 52 s | + 7 s de dépassement |
| 1:15 à 2:00 Solution | 45 s | 68 | 31 s | 14 s de marge |
| 2:00 à 3:15 Démo | 75 s | 106 | 49 s | 26 s pour taper et attendre trois scènes : tendu |
| 3:15 à 4:10 Mesures | 55 s | 126 | 58 s | + 3 s de dépassement |
| 4:10 à 4:40 Réponse | 30 s | 51 | 24 s | 6 s de marge |
| 4:40 à 5:00 Conclusion | 20 s | 55 | 25 s | + 5 s de dépassement |
| **Total** | 5:00 | **567** | **4 min 22** | 38 s de marge globale |

Lecture : le total passe, mais le problème, les mesures et la conclusion débordent leur créneau, et la démo en direct ne laisse que 26 s d'actions (trois scènes, dont une avec un site honnête). Le pitch 5 min livré (`PITCH_5MIN.md`) fait environ 620 mots. La version corrigée ci-dessous fait environ 600 mots (556 avant l'ajout du deuxième temps d'ouverture, +45) pour garder 50 à 60 s de silence de démo et d'actions. Débit du pitch livré : moins de 18 mots par 10 secondes, soit 108 mots par minute ; à 130 mots par minute on parle trop vite pour une salle qui découvre. Pour la finale (3 min), voir les coupes en fin de document.

---

## (e) Pitch corrigé, prêt à dire

Même structure. Toutes les corrections de (b) y sont appliquées. Voir la ligne « Dépendances » plus bas avant de le dire.

### 0:00 à 0:30. L'accroche (scène jouée, sans slide)
[Écran : le site d'échange sur la chaîne locale. Deux temps : droit illimité vers le routeur connu, puis vers une adresse neuve. Taper : « Échanger 50 USDC contre de l'AVAX ». La demande apparaît, avec « illimité ». Ne pas montrer MetaMask comme preuve.]
« Je veux échanger 50 USDC. Le site me demande un droit de dépense sur tout mon USDC, sans date de fin. Pas 50. Tout. D'après le code public de MetaMask, lu le 11 octobre, il affiche le plafond, illimité, sans alerte propre à ce montant. Il ne sait pas que j'ai voulu 50.
Deuxième temps : même demande, mais le droit va à une adresse neuve, que personne n'a listée comme malveillante. Au mieux, MetaMask signale une adresse sans historique. Il n'a aucune raison de s'alarmer si l'adresse n'est pas listée, et il ne sait ni combien je voulais donner, ni à qui. Hold up compare à ma phrase et à sa liste de protocoles connus : routeur connu, orange léger ; adresse inconnue, rouge. »
[Réserve à ne pas dire à voix haute mais à savoir : ce que MetaMask affiche pour une adresse neuve n'a pas encore été vu en vrai. Source : code et doc publics (`RECHERCHE_metamask_couverture.md`, lignes « Contrat jamais vu » et ajout du 11 oct.). À vérifier sur Sepolia avant de l'affirmer comme observé. Si le jury demande : « d'après son code et sa doc, pas observé à l'écran ». Jamais « MetaMask ne le voit pas ». Cohérent avec F31 : bénéficiaire connu = orange, sinon rouge (`attacks_decalage/RAPPORT.md`).]

### 0:30 à 1:15. Le problème
« Les portefeuilles préviennent de ce qu'ils reconnaissent : sites listés, drainers connus. Mais une demande peut être légitime pour tous les détecteurs et ne pas être ce que vous vouliez. Dans un échantillon de blocs que nous avons lus, 48 % des droits de dépense non nuls sont illimités sur Ethereum, 34 % sur Avalanche. Mesure interne, échantillon non représentatif. Chez Bybit en février 2025, l'interface affichait un virement, les signataires ont signé un delegatecall : environ 1,5 milliard de dollars. »

### 1:15 à 2:00. La solution
« Hold up est une extension de navigateur. Avant que vous voyiez la demande, elle pose une question : qu'est-ce que tu veux faire ? Vous l'écrivez avec vos mots. Du code lit dans la demande le montant, le jeton, l'adresse et le droit accordé, puis compare. Si ça correspond, le portefeuille s'ouvre seul après une seconde. Sinon, une alerte d'une ligne, et Annuler reste visible. Si on ne peut pas vérifier, on le dit. La personne décide. »

### 2:00 à 3:15. La démo
[Scène 1 en direct, mode piège puis mode honnête. Scène 2 : slide, rejeu du moteur. Scène 3 : site Glacier Rewards. Si la scène 1 diffère de « ne correspond pas » en piège ou de « correspond » en honnête, le dire et passer à la vidéo.]
« Scène un, en direct, sur une chaîne locale. J'écris : échanger 50 USDC. Le site demande un droit illimité. Hold up : ça ne correspond pas. Tu as écrit 50, la demande donne tout ton USDC. Même phrase, site honnête : ça correspond, le portefeuille s'ouvre seul.
Scène deux, synthétique, adresses factices, rejeu de notre moteur, inspirée de Bybit. Un coffre à signatures multiples affiche un virement de 20 USDC. La charge est un delegatecall vers un contrat inconnu. Danger, même sans phrase écrite : c'est un plancher, pas une comparaison.
Scène trois : je veux me connecter. La page réclame un Permit, un droit de dépense. Ça ne correspond pas. »

### 3:15 à 4:10. Ce qu'on a mesuré
[Slide : un tableau, une colonne « jeu », une colonne « statut ».]
« Le statut de chaque chiffre. Cas écrits par nous : 410, dont 228 écarts et 166 jumeaux honnêtes. Sans intention, 54 % des écarts sont signalés. Avec l'intention détaillée : 228 sur 228, zéro fausse alerte rouge sur les jumeaux. C'est un test de couverture, pas un test indépendant. Le jeu aveugle de 250 cas, hash publié, sera ouvert une seule fois.
Conditions du produit, banc synthétique : rappel rouge 71,3 %, fausses alertes rouges 13,9 %, et 54,2 % des opérations honnêtes reçoivent au moins un avertissement. C'est notre point faible. Sur 6 325 transactions réelles d'Avalanche, 0,30 % d'alertes rouges.
Verdict local en 18 millisecondes. La phrase, elle, est lue par un modèle hébergé. »

### 4:10 à 4:40. Réponse et traçabilité
« Réponse graduée : information, attention, danger, manipulation. Jamais de vert. Chaque décision laisse une ligne dans un journal chaîné par hachage : une ligne modifiée ou retirée se détecte, un auditeur rejoue la décision. L'ancrage sur la chaîne est fait en local, pas sur Fuji. Fonctions NIST CSF 2.0 : Detect et Respond. Si le modèle se trompe : montants et adresses sont lus par du code, la personne garde le dernier geste. Nous ne revendiquons aucune conformité DORA. »

### 4:40 à 5:00. Ce qu'on ne fait pas (et la conclusion)
« Nous ne couvrons pas : la fraude que vous voulez vraiment faire, une phrase dictée et exacte, un contrat qui change à l'exécution, un Ledger branché directement. Jamais essayé avec un vrai MetaMask, rien sur Fuji. Deux ingénieurs ; gratuit pour les personnes, des partenaires ensuite. MetaMask a déjà l'écran ; Hold up interroge avant, en texte libre, sur toute demande, et compare à l'effet. Écrivez votre phrase, attaquez-nous. »

### Questions probables (réponses courtes)
- **Et si MetaMask élargit son questionnaire ?** « Il a déjà l'écran, trois questions fermées et dix secondes de retenue. Aujourd'hui, ce questionnaire s'ouvre seulement si l'envoi est déjà classé malveillant ou le site listé, les réponses sont fermées et jamais rapprochées du montant. Élargir le déclencheur est un réglage, nous le disons. Notre avance, vérifiable aujourd'hui : toute demande, texte libre, comparaison à l'effet. Pas une barrière durable. »
- **Qui est responsable si le modèle se trompe ?** « Le comparateur et la lecture des montants sont du code. Le modèle ne lit que la phrase, et sa précision n'est pas mesurée par nous : type juste 72,8 % sur le jeu de réglage, 38,0 % sur tournures jamais vues. Une fausse alerte coûte un clic. Une alerte manquée laisse la personne où elle serait sans nous. Elle garde le dernier geste ; le journal dit ce qui lui a été montré. »
- **Pourquoi pas un RPC ou un Snap ?** « Un Snap voit la demande une fois dans le portefeuille ; il ne peut pas poser la question avant, et ne marche que dans MetaMask. Le RPC n'est plus une porte de notre produit. » (À dire seulement si le jury insiste ; ne pas revendiquer plus.)
- **Vous avez essayé avec un vrai MetaMask ?** « Non. Chaîne locale, que l'API d'alertes de MetaMask ne sert pas : son silence là ne prouve rien. Notre affirmation vient de son code public, lu le 11 octobre. Un essai sur Sepolia reste à faire. »
- **Où va ma phrase ?** « À un modèle hébergé. Minimisation et durée de conservation ne sont pas rédigées. Montants, jetons et adresses sont lus en local. À traiter avant tout service hébergé. »
- **Les fausses alertes ?** « Trop hautes : 13,9 % de rouges, 54,2 % d'avertissements sur nos honnêtes synthétiques. C'est la limite principale. Le mode honnête de la démo montre un cas qui ne sonne pas. »
- **L'escroc dicte la phrase ?** « Si elle est exacte, rien ne l'arrête : limite assumée. Si elle est vague, on dit que nous n'avons pas pu vérifier. »
- **Quelle part des cas réels ?** « Nous ne savons pas à quelle fréquence une demande bénigne diverge de l'intention. Nous mesurons des cas construits, nous ne prétendons pas une fréquence. »

### Dépendances à régler avant de le dire
1. Ajouter à `livrables/CHIFFRES.md` la ligne trafic réel Avalanche : 19 sur 6 325 (0,30 % [0,19 ; 0,47]), avec 76,84 % d'avertissements et la réserve « légitime présumé, blocs aléatoires, robots ». Sinon retirer cette phrase.
2. Vérifier que l'extension transmet le montant et le jeton (swap et `intent_details`) : sans cela, la scène « échanger 50 » se joue au bras catalogue (56 %), pas à 100 %.
3. Vérifier à l'écran la phrase sur MetaMask et l'illimité, ou garder la formule « d'après son code public ».
4. Vérifier que l'écran affiche bien « danger » pour un delegatecall inconnu (n° 21).
5. Avoir la vidéo de secours (un seul fichier de 2 à 3 minutes ; `livrables/video/` contenait trois clips lors de la passe 4).

---

## (f) Les 5 changements qui rapportent le plus de points

1. **Corriger le mélange de chiffres et l'omission du 54,2 %** (détection, 30 pts ; pitch). Apparier 71,3 % avec 13,9 %, citer 54,2 %. Un expert qui retrouve 83,8 % avec 13,9 % dans `BANC_REALISTE` perd confiance dans tout le reste. Gain estimé : +2 à +3.
2. **Supprimer « rien ne quitte la machine » et dire où va la phrase** (faisabilité, conformité, crédibilité devant Utopia et AWS). Une contradiction trouvée en questions coûte plus que l'aveu fait au pitch. Gain : +1,5.
3. **Ajouter 15 secondes de conformité et de réponse pour KPMG** : fonctions NIST CSF Detect et Respond, ce qui est automatique (rien) et humain (tout), qui lit le journal (la plateforme intégratrice), jamais « conforme ». Cela touche 35 pts de la grille (réponse 20, conformité 15) aujourd'hui à 15 sur 35. Gain : +3.
4. **Dire ce qu'est la démo : chaîne locale, scène Bybit synthétique, rien sur Fuji, pas de vrai MetaMask** (faisabilité devant Team1). L'honnêteté coûte peu ; la découverte par le jury coûte cher. Gain : +1,5.
5. **Retirer ou corriger les fausses phrases fortes** : « c'est la norme » (47,7 % < 50 %), « On ne bloque pas » (interdit), « prouver qu'elle n'a pas été modifiée » (faux sans ancrage), « ce que MetaMask ne peut pas savoir » (contredit la réponse suivante), « aucun filtre n'avait de raison de s'allumer » (non sourcé). Chacune est une question piège offerte au jury. Gain : +1,5 en crédibilité et pitch.

Estimation des notes du pitch corrigé, mêmes jurés (le produit, lui, ne change pas : jeu aveugle non passé, 13,9 % de fausses alertes rouges, Fuji vide) : Team1 58, KPMG 57, Kryptosphère 61, Utopia 60, AWS 57, soit **58,6 en moyenne** contre 49,4. Le plafond reste le produit : tant que le jeu aveugle n'est pas passé, la détection ne dépasse pas environ 17 sur 30.

### Coupes pour la finale (3 min + 3 min)
Garder : accroche (20 s), scène 1 piège puis honnête (50 s), mesures en 30 s (54 % puis 228 sur 228 test de couverture, 71,3 % contre 13,9 %, 54,2 %), conformité et réponse en 25 s, limites en 15 s. Couper : Bybit (déjà prévu dans `PITCH_3MIN`), trafic réel Avalanche, scène 3, NIST à l'oral. Ne jamais couper le contraste piège contre honnête ni l'aveu des 13,9 %.
