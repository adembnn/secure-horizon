# Pitch round 1, version 7 : 5 min, puis 2 min de questions

Écrit pour être dit. Construit autour de la démonstration, pas autour de slides.
Chaque chiffre a sa ligne dans `SOURCES.md`. Chaque geste a son état dans `DEMO_DEROULE.md`.

Débit : 130 mots par minute. Texte dit : environ 540 mots, soit 4 min 10. Il reste 50 secondes pour les gestes. Le compte est fait à la main : à recompter par script avant de monter sur scène.

Une seule idée, dite sous trois formes : la scène (1:20 à 2:35), le cas LI.FI (2:45), la phrase de fin (4:52).

Qui parle : Adem tient le clavier et la scène (0:00 à 2:45). Titouan tient les preuves, les limites et la fin (2:45 à 5:00). À confirmer entre vous.

Vocabulaire à tenir : Hold up retient, limite, lève la main. La personne décide.

| Temps | À l'écran | Geste | Texte dit |
|---|---|---|---|
| 0:00 à 0:15 | Deux fenêtres côte à côte, le site Neve dans chacune. Rien d'autre. | Aucun. Mains loin du clavier. | « Deux fenêtres, le même site. Même adresse, même bouton. L'un des deux a été piraté cette nuit. Lequel ? À l'œil, impossible à dire. Alors on a arrêté de deviner. » |
| 0:15 à 0:38 | Les deux fenêtres restent. | Aucun. | « Une règle de sécurité dit d'agir comme si l'attaquant était déjà là. Le NIST l'écrit dans sa publication 800-207. Nous l'appliquons au site où vous signez. Aerodrome, novembre 2025 : adresse détournée, 81 minutes avant le signalement, selon Blockaid. » |
| 0:38 à 1:20 | Fenêtre de gauche : Neve tel qu'il est aujourd'hui. La fenêtre Hold up s'ouvre : « Que veux-tu faire sur ce site ? » | Clic sur « Échanger ». Taper : échanger 50 USDC contre AVAX. Entrée. | « Hold up est une extension, posée devant le portefeuille que vous avez déjà. Avant chaque signature, une question : que veux-tu faire ? J'écris : échanger 50 USDC contre AVAX. Le site demande le droit de prendre 50 USDC dans mon compte. J'avais écrit 50. Ça correspond. La demande part seule vers le portefeuille, je n'ai rien cliqué. » |
| 1:20 à 1:50 | Fenêtre de droite : le même Neve, le jour où il est piraté. Puis un terminal : la ligne « solde de la victime vide : 100.0 vers 0.0 ». Légende visible : « lecture de la chaîne, compte de test, chaîne locale ». | Passer à la fenêtre de droite. Lancer la preuve par lecture de chaîne. | « Maintenant, je pirate ce site. Même page. Seul change ce que le bouton envoie : un droit sur tout mon USDC, pour le contrat du pirate. Sans Hold up, je signe ce qui ressemble à l'étape habituelle. Le pirate se sert. Cent USDC. Zéro. » |
| 1:50 à 2:35 | Fenêtre de droite, avec Hold up. Verdict : « Ça ne correspond pas. » Ligne : « Tu as écrit 50 USDC. La demande donne accès à tout ton USDC. » Le gant se lève. Puis « Droit limité à 50 USDC ». | Clic sur « Échanger ». Taper la même phrase. Entrée. Lever la main, paume vers le jury, au moment du verdict. Laisser deux secondes de silence. | « Je recommence avec Hold up. La même phrase, mot pour mot. Ça ne correspond pas. Tu as écrit 50 USDC, la demande donne accès à tout ton USDC. Le gant se lève. J'annule, rien ne part. Et si je continue quand même, le droit est déjà ramené à 50 : le pirate ne peut prendre que ce que j'avais écrit. » |
| 2:35 à 2:45 | Écran noir, le gant, une ligne : la phrase. | Clic sur Annuler. Regarder le jury. | « On ne peut pas savoir quel site sera piraté. On peut décider de ce qu'on lui laisse. » |
| 2:45 à 3:25 | Carton 1 : « LI.FI, 16 juillet 2024. 153 portefeuilles. 11,6 M$. Droits limités : 0. » Puis carton 2 : « 47,6 % » et « 34,2 % ». Puis carton 3 : « 106 106 adresses. 83,85 M$. 2025. » | Titouan prend la parole. | « LI.FI, juillet 2024. Un service honnête, une faille dans son contrat. 153 portefeuilles vidés, 11,6 millions de dollars. Tous avaient laissé un droit illimité. Les droits limités : zéro perte, selon le rapport de LI.FI. Ce droit illimité est courant : 47,6 % des droits que nous avons mesurés sur Ethereum, 34,2 % sur Avalanche. En 2025, 106 106 adresses ont perdu 83,85 millions de dollars en signant sur un site piégé. Le chiffre vient de Scam Sniffer, un éditeur : c'est une borne basse. » |
| 3:25 à 3:38 | Carton 4 : « 207 contrats sur 405. En simulation. » | Aucun. | « En laboratoire, des modèles d'IA ont exploité 207 contrats sur 405, selon Anthropic. C'est une simulation : aucun vol réel n'est attribué à une IA avec preuve. » |
| 3:38 à 4:15 | Carton 5 : deux barres, « 64,7 % sans la phrase » et « 87,3 % avec ». Dessous, en rouge : « 15 % de fausses alertes rouges. Objectif 10 % : manqué. » | Aucun. | « Notre mesure. 250 cas écrits par un autre auteur, ouverts une seule fois, aucun réglage après. Sans la phrase, le moteur signale 64,7 % des demandes piégées. Avec la phrase, 87,3 %. Sur la scène que vous venez de voir : 6 sur 19 sans la phrase, 18 sur 19 avec. Notre défaut : 15 % des opérations honnêtes reçoivent une alerte rouge. Nous visions 10. C'est manqué, et 11 de ces 15 erreurs viennent des ventes de NFT. » |
| 4:15 à 4:40 | Carton 6, deux colonnes : « Contrôlé aujourd'hui » et « Pas encore ». | Aucun. | « Hold up contrôle aujourd'hui le montant d'un droit, un paiement, un second droit glissé dans un lot, une prise de contrôle du compte. Pas encore le sens d'un échange ni ce que vous recevez en retour. Jamais essayé devant un vrai portefeuille : ici, portefeuille de test, chaîne locale. Et si la victime veut vraiment payer, hors périmètre. » |
| 4:40 à 4:52 | Carton 7 : « Detect : l'écart. Respond : retenir, limiter. » | Aucun. | « Détecter l'écart, c'est Detect dans le NIST CSF. Retenir et limiter, c'est Respond. La personne garde le dernier geste. L'idée vient de Vitalik Buterin, février 2026. Nous la mettons dans les mains d'un particulier, gratuitement. » |
| 4:52 à 5:00 | Écran noir, le gant, paume levée. | Lever la main une seconde fois. | « Si ça ne colle pas, je lève la main. On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse. » |
| 5:00 à 7:00 | Neve, fenêtre de gauche. | Questions. | Réponses dans `QR.md`. |

## Les trois formes de la même idée

1. La scène : le même site, la même phrase, le compte à zéro d'un côté, un droit de 50 de l'autre.
2. Le fait : LI.FI, 153 portefeuilles en droit illimité vidés, zéro perte pour les droits limités.
3. La phrase : « On ne peut pas savoir quel site sera piraté. On peut décider de ce qu'on lui laisse. »

## Phrases de rechange, à connaître par cœur

Tu regardes l'écran avant de parler. Tu dis ce qui est affiché, pas ce qui était prévu.

| Ce qui arrive | Ce que tu dis à la place |
|---|---|
| À gauche, l'écran dit « Je n'ai pas pu vérifier » au lieu de « Ça correspond ». | « Il me dit qu'il n'a pas pu vérifier. Il ne dit jamais oui par défaut. Je vous montre la suite sur l'enregistrement de la même scène. » Puis la vidéo. |
| À droite, la ligne « Droit limité à 50 USDC » n'apparaît pas. | Tu t'arrêtes à « J'annule, rien ne part. » Tu ne dis pas la phrase sur le droit ramené à 50. |
| Le gant ne s'anime pas à l'écran. | Tu lèves la main quand même. Tu remplaces « Le gant se lève » par « Hold up lève la main ». |
| Le terminal ne rend pas la ligne du solde. | « Sans Hold up, le droit illimité est signé. Le contrat du pirate peut prendre tout le solde. » Sans chiffre à l'écran, tu ne dis pas « cent, zéro ». |
| Tout casse. | La vidéo, annoncée telle quelle : « enregistrement de la même scène, même build ». |

## Ce que ce texte ne dit pas, exprès

- Il ne dit pas que Hold up reconnaît le site piraté. Il compare la demande à la phrase.
- Il ne dit pas que l'échange lui-même est vérifié. Dans la fenêtre de gauche, ce qui est contrôlé est le droit de 50 USDC.
- Il ne dit pas où part la phrase. Si on te le demande : elle part vers le modèle Clef par un relais sur la machine. Réponse complète dans `QR.md`, question 11.
- Il ne donne aucune taille de marché et aucune comparaison entre deux années.
- Il ne parle pas de Fuji : rien n'y est déployé.
