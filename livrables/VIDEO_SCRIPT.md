# Script de la vidéo de démo : un seul fichier, 2 min 40

Base : `research/titouan/PITCH_V3_TITOUAN.md` corrigé (voir `livrables/PITCH_5MIN.md`). Format : 1280x720, 30 images par seconde, fenêtre de navigateur de bureau, lisible sans son. Chaque plan porte une légende en bas de l'image (22 px minimum, fond uni). La voix off est facultative et reprend la légende mot pour mot.
Règle de vérité : la vidéo montre ce qui tourne réellement, sur la chaîne locale, avec l'extension autonome chargée. Pas de Fuji, pas de portefeuille simulé sans le dire, pas de montage qui change un verdict. Chaque plan est une prise continue.
Ancien matériel : les trois clips de `livrables/video/` montrent l'ancien produit (leurre, RPC de garde, sosie d'adresse). Ils ne servent plus. Aucun plan de la vidéo finale n'en vient.
Enregistrement : script de rejeu `research/demo_reelle/site_echange/test/film_scene.mjs` (arguments : dossier playwright-core, chrome.exe, dossier de sortie, racine du dépôt, mode `honnete|piege|permit`, phrase). Non lancé à la rédaction : le garde-fou de la session refuse un Chromium avec débogage. À jouer à la main sur la machine d'Adem ou de Titouan.

| # | Durée | Source à enregistrer | Légende à l'image (et voix) |
|---|---|---|---|
| 1 | 0:00 à 0:12 | Titre fixe : « Hold up. Une couche indépendante devant ton portefeuille. » Sous-titre : « Tout service peut être compromis. Ce jour-là, tu perds ce que tu lui as laissé le droit de prendre. » Mention « chaîne locale, argent fictif » en petit | Idem |
| 2 | 0:12 à 0:27 | Site Neve, mode piège. Le champ « Que veux-tu faire sur Neve ? » : on tape « échanger 50 USDC contre AVAX » | « J'écris ce que je veux faire, avant de voir la demande. » |
| 3 | 0:27 à 0:57 | Le site envoie la demande. Fenêtre Hold up : « Ça ne correspond pas à ce que tu as écrit. » et la ligne sur le droit illimité. Le portefeuille ne s'ouvre pas | « Le site demande un droit sur tout l'USDC. Tu avais écrit 50. Ça ne correspond pas. » |
| 4 | 0:57 à 1:10 | Même plan, bouton Annuler. Contrôle de la chaîne : le droit n'existe pas | « Annuler : rien n'est accordé. La personne décide toujours. » |
| 5 | 1:10 à 1:30 | Neve, mode honnête, même phrase. « Ça correspond à ce que tu as écrit. » puis le portefeuille s'ouvre seul après une seconde | « Même phrase, site honnête : 50 USDC, pas plus. Ça correspond. Rien à cliquer. » |
| 6 | 1:30 à 1:45 | Neve, mode piège par signature (`via=permit`) : « Ça ne correspond pas », avec la ligne « cette signature ne peut pas être limitée » | « Une signature accorde un droit sans transaction. Elle ne peut pas être limitée. On le dit. » |
| 7 | 1:45 à 2:00 | Glacier Rewards : phrase « me connecter », la page demande un droit de dépense : « Ça ne correspond pas » | « Tu voulais te connecter. La page demande un droit de dépense. » |
| 8 | 2:00 à 2:15 | Rejeu du moteur sur le coffre à signatures multiples (`demo_typologie/safe_signataire.mjs`) : virement de 20 USDC écrit, appel délégué reçu. Écran « danger », y compris sans phrase | « Scène synthétique, adresses factices, inspirée du cas Bybit. Danger même sans phrase : c'est le plancher de règles. » |
| 9 | 2:15 à 2:40 | Slide des mesures, puis slide « ce qu'on ne couvre pas » | « Contrôle scellé, mêmes auteurs phrases et règles : le code seul attrape 86,6 %, avec 7,7 % de fausses alertes ; avec un modèle qui classe, 1,3 %. Produit, banc synthétique : 13,9 % de rouges sur des honnêtes. Avalanche réel : 0,30 % de rouges, 76,84 % d'avertissements. Jeu aveugle pas passé. Hors périmètre : fraude voulue, Ledger direct. » |

Total : 2 min 40. Si le plan 8 ne se rejoue pas : le couper, la vidéo tombe à 2 min 25 et reste valable (consigne : 2 à 3 minutes).
Le plan 9 est dense : si la légende est illisible à 22 px en moins de 25 secondes, ne garder à l'écran que « 86,6 % / 7,7 % », « 13,9 % » et « 0,30 % / 76,84 % », le reste va en voix.
Montage : coupes sèches, ni musique ni transition. Légendes écrites après avoir vu l'écran. Si la fenêtre affiche une autre phrase que celles de `extension/outcome.js`, la légende reprend la phrase affichée.
Avant chaque prise : chaîne locale lancée, site Neve servi sur 8793, extension autonome chargée, trois modes rejoués une fois sans enregistrer.
