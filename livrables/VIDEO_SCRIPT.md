# Script de la vidéo de démo : un seul fichier, 2 min 40

Format : 1280x720, 30 images par seconde, fenêtre de navigateur de bureau, lisible sans son. Chaque plan porte une légende en bas de l'image (22 px minimum, fond uni). La voix off est facultative et reprend la légende mot pour mot.
Règle de vérité : la vidéo montre ce qui tourne réellement, sur la chaîne locale, avec l'extension chargée. Pas de Fuji, pas de portefeuille simulé sans le dire, pas de montage qui change un verdict. Chaque plan est une prise continue.
Ancien matériel : les trois clips de `livrables/video/` montrent l'ancien produit (leurre, retenue, RPC de garde, sosie d'adresse). Ils ne servent plus. Aucun plan de la vidéo finale n'en vient.
Enregistrement : script de rejeu `research/demo_reelle/site_echange/test/film_scene.mjs` (arguments : dossier playwright-core, chrome.exe, dossier de sortie, racine du dépôt, mode `honnete|piege|permit`, phrase). Non lancé à la rédaction : le garde-fou de la session refuse un Chromium avec débogage. À jouer à la main sur la machine d'Adem ou de Titouan.

| # | Durée | Source à enregistrer | Légende à l'image (et voix) |
|---|---|---|---|
| 1 | 0:00 à 0:10 | Titre fixe : « Hold up. Tu écris ce que tu veux faire. Il dit si la demande correspond. » | Idem. Mention « chaîne locale, argent fictif » en petit |
| 2 | 0:10 à 0:25 | Site Neve, mode piège. Le champ « Que veux-tu faire sur Neve ? » : on tape « échanger 50 USDC contre AVAX » | « J'écris ce que je veux faire, avant de voir la demande. » |
| 3 | 0:25 à 0:55 | Le site envoie la demande. Fenêtre Hold up : « Ça ne correspond pas à ce que tu as écrit. » et la ligne sur le droit illimité. Le portefeuille ne s'ouvre pas | « Le site demande un droit sur tout l'USDC. Tu avais écrit 50. Ça ne correspond pas. » |
| 4 | 0:55 à 1:10 | Même plan, bouton Annuler. Contrôle de la chaîne : le droit n'existe pas | « Annuler : rien n'est accordé. La personne décide toujours. » |
| 5 | 1:10 à 1:35 | Neve, mode honnête, même phrase. « Ça correspond à ce que tu as écrit. » puis le portefeuille s'ouvre seul après une seconde | « Même phrase, site honnête : 50 USDC, pas plus. Ça correspond. Rien à cliquer. » |
| 6 | 1:35 à 1:55 | Neve, mode piège par signature (`via=permit`) : « Ça ne correspond pas », avec la ligne « cette signature ne peut pas être limitée » | « Une signature accorde un droit sans transaction. Elle ne peut pas être limitée. On le dit. » |
| 7 | 1:55 à 2:15 | Glacier Rewards : phrase « me connecter », la page demande un droit de dépense : « Ça ne correspond pas » | « Tu voulais te connecter. La page demande un droit de dépense. » |
| 8 | 2:15 à 2:30 | Rejeu du moteur sur le coffre à signatures multiples (`demo_typologie/safe_signataire.mjs`) : virement de 20 USDC écrit, appel délégué reçu | « Scène synthétique, adresses factices, inspirée du cas Bybit. Elle montre le décodage, pas l'attaque. » |
| 9 | 2:30 à 2:40 | Slide « ce qu'on ne couvre pas », puis slide des mesures | « Mesuré sur nos cas écrits par nous. Jeu aveugle pas encore passé. Fraude voulue, intention vague, contrat qui change : hors périmètre. » |

Total : 2 min 40. Si le plan 8 ne se rejoue pas : le couper, la vidéo tombe à 2 min 25 et reste valable (consigne : 2 à 3 minutes).
Montage : coupes sèches, ni musique ni transition. Légendes écrites après avoir vu l'écran. Si la fenêtre affiche une autre phrase que celles de `extension/outcome.js`, la légende reprend la phrase affichée.
Avant chaque prise : chaîne locale lancée, site Neve servi sur 8793, extension reconstruite, trois modes rejoués une fois sans enregistrer.
