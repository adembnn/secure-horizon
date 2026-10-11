# Vidéo Hold up, 3 minutes : script en images (V9, 11/10/2026)

Principe : l'image montre, le texte confirme, la voix soutient. Environ 150 mots de voix pour 3 minutes (une voix tous les 15 secondes en moyenne). Voix générée avec Gradium. Mis à jour le 11 oct. vers 11h20 (MSG-080) : écran clé de l'extension livrée, panneau « Retirer l'autorisation », 87 % toujours avec 15 %. Tout le texte à l'écran tient en 6 mots ou moins, en grand, sous-titré pour la lecture sans le son.

## Règles de réalisation
1. Accroche en moins de 5 secondes, sans logo ni titre : une question visuelle.
2. On voit le produit utilisé, en capture réelle avec le curseur et des zooms sur l'élément qui compte. Aucune diapo de texte.
3. Une idée par scène. Une scène sans nouvelle image dure moins de 4 secondes.
4. Avant et après en écran partagé : c'est la preuve la plus rapide.
5. Les chiffres s'animent (compteur), ils ne se lisent pas : un seul chiffre par scène.
6. Son : clic discret, tic-tac pendant le piratage, silence juste après « 0 ». Pas de musique dramatique.
7. Étiquettes d'honnêteté en petit, bas de l'écran : « chaîne locale », « scène synthétique », « portefeuille simulé ».

## Découpage

| Temps | Image | Texte à l'écran | Voix |
|---|---|---|---|
| 0:00 à 0:05 | Deux fenêtres de navigateur identiques, même site, côte à côte. Le curseur hésite entre les deux. | « L'un est piraté. » | (silence, un tic) |
| 0:05 à 0:15 | Gros plan sur l'écran du portefeuille : « Autoriser la dépense : illimité » entouré en rouge. Un doigt clique sur Signer. | « Tu voulais échanger 50 $. » puis « Avalanche : 1 sur 3 est illimitée. » | « Tu voulais échanger cinquante dollars. Tu viens de donner accès à tout. Sur Avalanche, une autorisation sur trois fait pareil. » |
| 0:15 à 0:30 | Le site piraté : le solde 100 descend à 0 en une seconde, puis silence. Petit bandeau : LI.FI, juillet 2024. | « 0 » puis « LI.FI · 11,6 M$ » | « Chez LI.FI, ceux qui avaient limité leur droit n'ont rien perdu. » |
| 0:30 à 0:40 | Fond uni. Le mot Hold up s'écrit. | « Hold up » puis « Donne seulement ce qu'il faut. » | « Hold up. » |
| 0:40 à 1:10 | Capture réelle : la fenêtre de l'extension s'ouvre. Le curseur tape « échanger 50 USDC ». La fenêtre répond : « Ça ne correspond pas à ce que tu as écrit. », le gant, deux lignes face à face : « Tu as écrit 50 » et « La demande donne tout ». Boutons « Annuler » et « Limiter à 50 USDC et envoyer ». Zoom sur ce bouton, le curseur clique : rien ne part tout seul. | « Ça ne correspond pas à ce que tu as écrit. » | « Tu écris ce que tu veux faire. Hold up lit la demande, et compare. C'est toi qui cliques. » |
| 1:10 à 1:40 | Écran partagé. Gauche : sans Hold up, solde 100 à 0. Droite : avec Hold up, le droit de 50 sert l'échange, un compteur « Droit restant » arrive à 0, le solde reste. | « Sans » / « Avec » puis « Rien à prendre. » | « Même piratage. Cette fois, il ne reste rien à prendre. » |
| 1:40 à 2:15 | Panneau latéral de l'extension : « Ce que tu as laissé ouvert », une ligne « app.neve.exchange peut dépenser… », bouton « Retirer l'autorisation ». Un clic, le portefeuille demande de confirmer. Puis le journal de la session défile, une ligne par décision. Bandeau : « portefeuille simulé ». | « Retirer l'autorisation. » | « Une autorisation déjà donnée ? Un clic pour la retirer. Et le journal garde la trace. » |
| 2:15 à 2:35 | Deux barres qui montent : 65 % puis 87 %, puis une troisième, en rouge : 15 %. Légende fine : « notre moteur de comparaison, jeu aveugle de 250 cas ». | « 65 % → 87 % » puis « 15 % à tort » | « Notre moteur de comparaison, jeu aveugle de deux cent cinquante cas : quatre-vingt-sept pour cent signalés. Et quinze pour cent d'honnêtes en rouge : à baisser. » |
| 2:35 à 3:00 | Retour aux deux fenêtres du début, calmes. Fondu vers la carte finale : logo, lien du dépôt, code QR. | « Tout site peut tomber. Ce qu'il emporte, c'est toi qui le décides. » | « Tout site peut tomber. Ce qu'il emporte avec lui, c'est toi qui le décides. » |

Total de voix : 114 mots (comptage par script, voix seule, coupure aux espaces), soit environ 53 secondes de parole sur 180 secondes. Le reste est image, son et lecture.

## Ce qu'il faut tourner (liste des plans)
1. Deux fenêtres identiques du site de démo Neve (research/demo_reelle/site_echange), mode honnête et mode piège.
2. Écran du portefeuille avec « illimité » (chaîne locale, compte de test jetable).
3. Compteur du solde 100 à 0 (console de l'attaquant du site Glacier ou de la démo d'Adem).
4. Fenêtre de l'extension, texte tapé, « Ça ne correspond pas à ce que tu as écrit. », le gant, bouton « Limiter à 50 USDC et envoyer » cliqué à la main (extension chargée en mode développeur).
5. Écran partagé sans et avec Hold up (la scène à deux portefeuilles d'Adem dans DEMO_DEROULE).
6. Panneau latéral de l'extension : « Retirer l'autorisation », puis le journal (mention « portefeuille simulé »). Secours : la démo web, dont le bouton garde le libellé « Révoquer ce droit ».
7. Trois cartes de chiffres animées (65 %, 87 %, 15 %).
8. Carte finale.

## Honnêteté (ne pas retirer)
- Seule la chaîne Avalanche est citée (34,2 % des autorisations illimitées sur la C-Chain, notre mesure, un échantillon de blocs). Aucune autre chaîne citée.
- Le piratage est une scène de démonstration sur une copie locale d'Avalanche : le dire en petit.
- Le retrait d'une autorisation est branché dans l'extension, jamais essayé devant un vrai portefeuille : « portefeuille simulé » reste affiché.
- LI.FI est cité comme un fait public (rapport de LI.FI) : 11,6 M$ et 153 portefeuilles, sans plus.
- Le 87 % ne sort jamais sans le 15 % de faux rouges, ni sans « notre moteur de comparaison, jeu aveugle de 250 cas » : ce n'est pas l'extension.

## Variantes de la dernière phrase
1. « Tout site peut tomber. Ce qu'il emporte avec lui, c'est toi qui le décides. » (retenue)
2. « Un site peut tomber. Ne le laisse pas t'emporter avec lui. »
3. « On ne choisit pas quel site sera piraté. On choisit ce qu'on lui laisse. »
