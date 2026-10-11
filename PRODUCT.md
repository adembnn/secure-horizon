# Product : Hold up

<!-- impeccable:product-schema 1 -->

Produit figé le 11 oct. 2026 (voir `coord/HANDOFF_ADEM_SESSION_2.md`). Nom : Hold up (ex-Sentinelle, disponibilité du nom non vérifiée). Plateforme : extension Chrome ou Edge, Manifest V3, ordinateur uniquement. Chiffres : uniquement `livrables/CHIFFRES.md`.

## Le problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Il veut échanger 50 USDC, le site lui demande un droit de dépense illimité présenté comme une étape normale. Tout service peut être compromis un jour. Ce jour-là, la personne perd ce qu'elle lui a laissé le droit de prendre.

Qui : un particulier avec un portefeuille ordinaire (MetaMask, Rabby, Core), pas technique, parfois sous pression (faux support, faux remboursement). Public secondaire : le jury du hackathon Secure Horizons.

## Le produit

Hold up est une couche indépendante, posée devant le portefeuille que la personne utilise déjà. Au moindre privilège : elle ne laisse passer que ce que la personne a écrit vouloir faire.

1. Pour une demande qui déplace de la valeur ou accorde un droit, une fenêtre demande « Que veux-tu faire sur ce site ? » avant de montrer la demande. Champ de texte libre, sans bouton ni pré-remplissage.
2. Du code lit le montant, le jeton et l'adresse écrits, décode ce que la demande fait vraiment, et compare.
3. Trois réponses : « Ça correspond » (le portefeuille s'ouvre seul après une seconde), « Ça ne correspond pas » (alerte d'une ligne, Annuler visible), « Je n'ai pas pu vérifier ». Jamais de vert.
4. En plus, des règles de base indépendantes de la phrase : droit illimité vers une adresse inconnue, appel délégué, changement de contrôle du compte, signature illisible. Une phrase exacte soufflée par un escroc ne les désactive pas.
5. Un panneau latéral s'ouvre au clic sur l'icône de l'extension et montre le journal des décisions. Les décisions de signature restent dans la fenêtre séparée.
6. Chaque décision laisse une ligne datée (500 lignes locales dans l'extension autonome).

## Ce qu'il fait et ne fait pas

| Il fait | Il ne fait pas |
|---|---|
| Retient une demande du site avant qu'elle atteigne le portefeuille | Ne tient aucune clé, ne signe rien, ne remplace pas le portefeuille |
| Compare la phrase écrite à l'effet de la demande | Ne couvre pas la fraude voulue (la personne veut vraiment ce paiement) |
| Dit « Ça ne correspond pas » même sur un site connu si le droit dépasse le montant écrit | Ne couvre pas un Ledger branché en direct, le mobile, ni le bouton Envoyer du portefeuille |
| Dit qu'une signature (Permit) ne peut pas être limitée | Ne prétend pas limiter un droit donné par signature |
| Tourne sans serveur ni réseau dans la version autonome | N'a pas encore été essayé avec un vrai portefeuille |

Lecture de la phrase : dans la version autonome, par mots-clés dans le navigateur. Un modèle hébergé (Clef) ne lit la phrase que si le relais est branché, ce qui n'est pas le cas de la version autonome.

## Positionnement par rapport à MetaMask

MetaMask couvre déjà l'adresse sosie, l'envoi vers une adresse jamais vue, les alertes de sécurité sur transactions et signatures, et l'affichage lisible des Permit (D-009). Nous ne présentons rien de cela comme un apport, et le RPC de garde n'est plus une porte du produit.

Phrase retenue : « MetaMask te prévient de ce qu'il reconnaît ; Hold up vérifie que la demande est celle que tu as écrite. » D'après le code public de MetaMask lu le 11 oct. 2026, un droit illimité est affiché sans alerte propre à ce montant et sans lien avec ce que la personne voulait donner. C'est une lecture de code, pas un essai à l'écran. Le moindre privilège n'est pas nouveau (Matcha, LI.FI, Talisman, Permit2) : l'apport est l'assemblage (phrase libre avant la demande, sur toute demande, comparée à l'effet, avec un plancher de règles).

## Modèle

Gratuit pour construire une base d'utilisateurs, puis des partenaires. Pas d'abonnement des particuliers, pas de publicité faite par nous. Idée mise en parenthèse : aucun modèle abouti n'est pitché.

## Limites

- Jamais essayé avec un vrai portefeuille. La démo tourne sur une chaîne locale pour la démo, Fuji à décider (D-013). L'API d'alertes de MetaMask ne sert pas ces chaînes : son silence là ne prouve rien.
- Fausses alertes : sur le jeu aveugle, notre moteur de comparaison met 15,0 % des opérations honnêtes en rouge et 30 % reçoivent au moins une alerte. C'est la limite principale (fatigue d'alerte).
- Jeu aveugle de 250 cas d'un autre auteur (un modèle de la même famille que les nôtres) : ouvert une fois le 11 oct. 2026 à 07:10 UTC, moteur figé `74203da`. Mesuré par notre moteur de comparaison (chaîne de banc), pas par l'extension livrée : rappel 87,3 %, faux rouges 15,0 %, seuil de 10 % non atteint (`livrables/CHIFFRES.md`, A6). Mesurée elle-même sur une autre grille, l'extension livrée fait moins bien (section « Mesure sur l'extension livrée » de `CHIFFRES.md`).
- Revue de sécurité interne : contournements trouvés, dont un critique ; corrections non vérifiées dans un navigateur. Ne pas utiliser avec de vrais fonds.
- Aucun test avec des personnes, aucun client, aucune mesure d'efficacité de nos écrans : ne rien inventer.
- Journal chaîné par hachage dans les deux versions, dont le build autonome livré (`journal_chain.js`, 7 tests, export JSON depuis le panneau latéral, vérification hors ligne par `extension/tools/verify_journal.mjs`). Pas d'ancrage sur une blockchain (décision D-017) : une réécriture complète ou la suppression des dernières lignes ne se voit pas. Non vérifié dans un vrai Chrome.

## Principes

1. La personne garde la main : on retient et on explique, on ne décide pas à sa place. Annuler est toujours visible.
2. Parler avec ses mots à elle : pas de « permit », « approve » ni « EIP-712 » dans l'interface.
3. Être rare pour être cru : chaque fausse alerte use la confiance.
4. Ne jamais rassurer à tort : l'incertitude ne s'affiche jamais en vert. Une intention ne baisse jamais un verdict.
5. Accessibilité : textes grands, contraste AA, cibles larges, clavier, lecteurs d'écran, aucune information portée par la seule couleur.

## Historique des décisions

- D-003 à D-007 (10 oct.) : piste DeFi et DORA, puis coffre et limite on-chain, puis barrière d'intention pour le grand public. Abandonnés comme cœur : coffre, réponse après coup, institutions.
- D-008 (11 oct.) : deux portes (extension et RPC de garde), démo sur Fuji. Remplacé en partie par D-009 et D-013.
- D-009 (11 oct.) : après essai avec un vrai MetaMask, adresse sosie, envoi vers une adresse jamais vue et Permit lisible retirés des apports ; plus de RPC de garde dans les scènes.
- Périmé et retiré de ce document : démo sur Fuji (reportée, D-013), Snap comme chemin critique (le produit figé est une extension), barrière d'intention à choix et question « quelqu'un me guide », carnet d'adresses, attente de 10 min et barrière de 30 s (une attente sur l'écart de montant reste une question ouverte, Q16).
- D-010 à D-013 (11 oct.) : pitch V6, positionnement « couche indépendante, moindre privilège », jeu aveugle à ouvrir une fois, cible Fuji reportée. Détail : `coord/DECISIONS.md`.
