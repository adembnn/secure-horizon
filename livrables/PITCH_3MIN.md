# Pitch finale : 3 min + 3 min de questions (dimanche 15h25, Grand Amphi)

Même produit, même base (`research/titouan/PITCH_V3_TITOUAN.md` corrigé), même répartition. Une seule scène en live (le héros, deux modes), le reste en slides. Grande salle : la vidéo de secours n'a pas de son, chaque plan porte sa légende. Chiffres : `livrables/CHIFFRES.md` seulement.
Débit : environ 105 mots par minute, avec une quarantaine de secondes de silence pour la démo. Le texte dit fait 320 mots (compté par script).

| Temps | Qui | À l'écran | Live ou vidéo | Texte dit |
|---|---|---|---|---|
| 0:00 à 0:25 | Adem | Neve, la demande avec « illimité » | Live | « Je veux échanger 50 USDC. Le site me demande un droit sur tout mon USDC, sans date de fin. D'après le code public de MetaMask, il l'affiche sans alerte propre à ce montant. Il ne sait pas que j'ai voulu 50. » |
| 0:25 à 0:50 | Titouan | Slide 1 | Slide | « Tout service peut être compromis. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. Dans nos échantillons de blocs, 47,6 % des droits de dépense sont illimités sur Ethereum, 34,2 % sur Avalanche. En 2025, 83,85 millions de dollars perdus par signature, selon ScamSniffer : une borne basse. » |
| 0:50 à 1:40 | Adem | Neve, mode piège, puis mode honnête ; slide Bybit | Live, puis slide | « Hold up est une couche indépendante, devant le portefeuille. J'écris : échanger 50 USDC. Piège : ça ne correspond pas, la demande donne tout l'USDC. Même phrase, site honnête : ça correspond, le portefeuille s'ouvre seul. Et sans phrase, un plancher de règles : un appel délégué, comme chez Bybit, c'est danger. Scène synthétique, adresses factices. » |
| 1:40 à 2:15 | Titouan | Slide 5 | Slide | « Contrôle scellé de 1 079 paires, même auteur que les règles : le code seul attrape 86,6 % des écarts, avec 7,7 % de fausses alertes. Avec un modèle qui classe et le code qui compare, 1,3 %. Conditions du produit, banc synthétique : 13,9 % de rouges sur des honnêtes. Avalanche réel, 6 325 transactions : 0,30 % de rouges, 76,84 % d'avertissements. Jeu aveugle : pas passé. » |
| 2:15 à 2:40 | Titouan | Slide 7 | Slide | « Réponse graduée, jamais de vert. La personne garde le dernier geste. Chaque décision laisse une ligne datée, chaînée par hachage dans la version serveur, pas encore dans l'autonome. Aucune conformité déclarée. Version autonome sans réseau ; avec le relais Clef, la phrase part vers un modèle hébergé. » |
| 2:40 à 3:00 | Adem | Slide 9 | Slide | « Jamais essayé avec un vrai portefeuille, rien sur Fuji, failles trouvées par notre revue en cours de correction. Fraude voulue et Ledger direct : hors périmètre. Hold up ne lui laisse que ce que tu as écrit vouloir faire. Écrivez votre phrase, attaquez-nous. » |

Questions (3 min) : `livrables/QR_JURY.md`. Garder Neve ouvert en mode honnête pour répondre à « et les fausses alertes ? » par l'exemple.
Coupes si on est en retard : retirer la slide Bybit (dans 0:50 à 1:40), jamais le contraste piège contre honnête, ni l'aveu des 13,9 % et des 76,84 %.
Fuji n'est pas déployé : ne pas dire « sur Fuji ».
