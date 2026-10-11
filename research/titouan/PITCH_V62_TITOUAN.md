# Pitch Hold up V6.2 (11/10/2026) : la trame d'Adem + l'idée « les droits sont ouverts en grand » + nos preuves

> **ARCHIVE, ne pas dire (11 oct., MSG-080).** Les chiffres d'autres chaînes ont été remplacés dans cette version : nous adressons Avalanche seulement (34 %, une autorisation sur trois, notre mesure sur un échantillon de blocs). Version à dire : `livrables/PITCH_5MIN.md`, `livrables/PITCH_3MIN.md`. Chiffres : `METRIQUES.md`.

Base : livrables/pitch_v7/PITCH_ADEM.md (postulat, constat, LI.FI, démo avant/après, fin) + jeu aveugle + après l'alerte + modèle économique.
Réserve de sourcing : « la plupart des portefeuilles » n'est pas dans nos mesures. Notre chiffre : 34,2 % des autorisations sont illimitées sur Avalanche (une sur trois). La seule mesure par adresse est une étude de 2021 (arXiv 2207.01790, lue) : 60,3 % des adresses avaient au moins un droit illimité. On la cite avec sa date.

## 1. Le postulat (30 s)
« En novembre 2025, le site d'Aerodrome est détourné. Il faut 81 minutes pour que quelqu'un le signale. Pendant 81 minutes, le site est piégé et personne ne le sait.
Alors on part d'un postulat : tout service en ligne finira par être compromis. La question n'est plus comment le sécuriser. C'est : qu'est-ce que je lui ai laissé le droit de prendre, le jour où ça arrive ? »

## 2. Le constat (50 s)
« Quand tu utilises un site, tu signes un contrat qui dit ce qu'il a le droit de prendre dans ton portefeuille. Presque personne ne le lit.
Et la porte est grande ouverte. 34 % des autorisations lues sur Avalanche sont illimitées, une sur trois : notre mesure, sur un échantillon de blocs. Une étude de 2021 trouvait que six adresses sur dix avaient déjà donné au moins un accès illimité. Tu veux échanger 50 dollars, tu signes un accès à tout, sans date de fin.
Ce droit reste. Juillet 2024, LI.FI : 11,6 millions de dollars, 153 portefeuilles vidés. Tous avaient laissé un droit illimité. Ceux qui l'avaient limité n'ont rien perdu. »

## 3. Hold up (35 s)
« MetaMask affiche illimité sans alerte, d'après son code public, pour une adresse que personne n'a signalée. Il ne sait ni combien tu voulais donner, ni à qui.
Avant de signer, tu écris ce que tu veux faire : échanger 50 USDC. Hold up lit le contrat et le compare. Si ça correspond, ça passe. Si le site demande plus, Hold up ramène le droit à ton montant. Si ça ne colle pas, il lève la main. »

## 4. La démonstration (1 min 20)
« Un site d'échange honnête. J'écris échanger 50 USDC. Le site demande un accès à tout mon USDC, comme beaucoup de services. Hold up affiche : droit limité à 50 USDC. L'échange se fait.
Maintenant, on pirate ce site. Même faille, deux portefeuilles. Sans Hold up, le compte tombe à zéro. Avec Hold up, le droit de 50 a servi à l'échange. Il ne reste rien à prendre.
Et si j'avais continué par erreur sur un site piégé : je clique sur Révoquer ce droit. Hold up prépare la demande, c'est le portefeuille qui signe, et une fiche d'incident garde la trace. »

## 5. La preuve et les limites (40 s)
« 250 cas écrits par un agent qui n'avait pas vu nos règles, ouverts une seule fois. Sans la phrase, on signale 65 % des demandes dangereuses. Avec la phrase, 87 %.
Ce qui ne va pas : 15 % des demandes honnêtes reçoivent une alerte rouge. Notre objectif était 10 %. Nous publions le résultat tel quel.
Nous ne couvrons ni la fraude que vous voulez vraiment faire, ni un Ledger branché en direct. Un modèle hébergé est optionnel : il reçoit la phrase seule, jamais les montants ni les adresses. Le code lit les montants, et la personne garde le dernier geste. »

## 6. Le modèle économique (20 s)
« Gratuit pour les particuliers. Les revenus viendront de ceux qui ont intérêt à ce que leurs clients ne donnent pas trop : une vérification avant retrait pour les plateformes d'échange, une licence pour les portefeuilles, plus tard des mandats pour les agents IA. Les prix sont des hypothèses à valider avec des pilotes. »

## 7. La fin (10 s)
« On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse. »

## À vérifier avant de le dire
- Aerodrome 81 minutes : chiffre publié par Blockaid sur son propre délai, source intéressée : à dire si on nous le demande.
- LI.FI : 153 portefeuilles, 11,6 M$ : post-mortem officiel (RECHERCHE_douleurs_secondaires.md).
- Étude de 2021 : données de 2021 d'une autre chaîne, définition large de « illimité » : toujours citer la date.
- La démo « deux portefeuilles, sans et avec Hold up » doit exister avant de la promettre (DEMO_DEROULE d'Adem). La démo web de Titouan a la scène « Après l'alerte » en simulation.
