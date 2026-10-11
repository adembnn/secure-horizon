# Les quinze questions les plus dures, réponses en trois phrases au plus

Règle : tu commences par ce qui est vrai dans l'objection. Tu ne donnes aucun chiffre qui n'est pas dans `SOURCES.md`. Si tu ne sais pas, tu dis « nous ne l'avons pas mesuré ».

## Juré de sécurité

**1. « Le portefeuille le fait déjà. »**
En partie, oui : MetaMask affiche « illimité », laisse modifier le plafond et alerte sur les adresses qu'il connaît comme malveillantes ; Talisman plafonne au solde, Matcha et LI.FI demandent un montant fini par défaut. D'après le code public de MetaMask lu le 11 octobre, un droit illimité s'affiche sans alerte propre à ce montant, et un portefeuille ne peut pas savoir combien tu voulais donner ni à qui. Notre ajout est étroit : le montant de référence vient de la phrase que tu viens d'écrire, sur n'importe quel site.

**2. « L'utilisateur écrira n'importe quoi. »**
Alors Hold up relance une fois, puis répond « Je n'ai pas pu vérifier » : une phrase vague ne donne jamais « Ça correspond ». Ce que nous n'avons pas : un seul essai avec de vraies personnes, donc aucun chiffre sur ce qu'elles écrivent ni sur celles qui abandonnent. La question est un effort en plus à chaque signature, et c'est un coût que nous assumons sans l'avoir mesuré.

**3. « Vos chiffres viennent de vos propres jeux de test. »**
Pour la plupart, oui, et le tableau des chiffres le dit ligne par ligne. Ceux du pitch viennent du seul jeu écrit par un autre auteur que celui des règles : 250 cas, empreinte publiée avant, ouvert une seule fois le 11 octobre, critères fixés avant l'ouverture, aucun réglage après. Ça reste un jeu fabriqué, petit, et ça ne vaut pas un audit externe : l'intervalle sur les 87,3 % va de 81,1 à 91,7.

**4. « 15 % de fausses alertes rouges, personne ne lira vos alertes. »**
C'est notre défaut principal : l'objectif était 10 %, il est manqué, et en comptant les avertissements simples on monte à 30 % des opérations honnêtes. Sur les 15 fausses alertes rouges, 11 viennent d'une seule famille, les ventes de NFT à bas prix, où le moteur se trompe 11 fois sur 12 ; sur la famille de la démonstration, zéro sur 13. Nous n'avons rien corrigé après l'ouverture du jeu, pour que le chiffre reste vrai.

**5. « Dans votre scène, le droit de 50 part chez le pirate. Vous perdez 50. »**
Exact : Hold up ne contrôle pas à qui le droit est donné, une phrase ne peut pas le prouver. La perte est bornée à ce que tu as écrit, elle n'est pas évitée, et c'est pour ça que le titre reste « Ça ne correspond pas » et que le premier geste est Annuler. Le « zéro perte » vient du cas LI.FI, où le droit limité était déjà dépensé.

**6. « Votre vérification couvre-t-elle tout ce qu'une demande peut faire ? »**
Non. Sur 58 paires d'essai, 18 sont contrôlées, 20 ne le sont pas, 7 le sont en partie et 13 ne sont pas distinguées. Ce qui tient aujourd'hui : le montant d'un droit, un paiement, un second droit glissé dans un lot, une prise de contrôle du compte ; ce qui manque : le sens d'un échange, la contrepartie, le minimum reçu, la durée.

**7. « Une page hostile peut-elle passer à côté de votre extension ? »**
Oui, notre propre revue a trouvé des contournements, dont un critique : une page peut remplacer des fonctions du navigateur et faire passer une demande sans fenêtre Hold up. Les corrections existent, elles ne sont pas vérifiées dans un navigateur. Hold up ne tient aucune clé et ne signe rien, mais il ne doit pas servir avec de vrais fonds aujourd'hui.

**8. « L'idée n'est pas neuve. »**
Vrai. Vitalik Buterin l'a décrite le 22 février 2026, IntentGuard le fait pour des trésoreries, des projets de hackathon pour des agents. Dans les documentations que nous avons lues, nous n'avons pas trouvé d'outil grand public qui fasse écrire la phrase avant d'afficher la demande puis la compare à l'effet : notre apport est cet assemblage, pas le principe.

## Juré de finance

**9. « Et la fraude où la victime veut vraiment payer ? »**
Hors de notre périmètre : si elle écrit « envoyer 5 000 USDC à cette adresse » et que la demande fait exactement ça, phrase et demande concordent. C'est le gros de la fraude : 7,2 milliards de dollars de plaintes pour fraude à l'investissement avec lien crypto en 2025, selon le FBI. Nous ne traitons pas ce cas, et nous le disons sur le carton des limites.

**10. « Quel est votre modèle économique ? »**
Il n'est pas arrêté : gratuit pour les particuliers, des partenaires ensuite, portefeuilles ou plateformes qui intégreraient le contrôle. Nous n'avons ni prix, ni client, ni taille de marché sourcée. Le risque est connu : Harpie et Wallet Guard ont fermé en mars 2025.

**11. « Où part la phrase que j'écris ? »**
Dans le build livré, elle part vers un modèle hébergé, Clef, à travers un relais qui tourne sur la machine et garde la clé. Les montants, les jetons et les adresses sont lus par du code, sur place. La durée de conservation chez le fournisseur et la base légale ne sont pas rédigées ; une option sans réseau existe, qui lit la phrase par mots-clés et comprend moins de tournures.

**12. « La douleur que vous citez a fondu en un an. »**
Oui : 332 000 adresses et 494 millions de dollars en 2024, 106 106 adresses et 83,85 millions en 2025, même source, qui ne donne aucune cause. Notre thèse ne repose pas sur une courbe. Elle repose sur un mécanisme : ce qu'on perd quand un service tombe dépend du droit qu'on lui a laissé, et 47,6 % des droits de notre échantillon Ethereum sont illimités.

**13. « Pourquoi une extension, et pas dans le portefeuille ? »**
Parce que la personne garde son portefeuille et ses clés, et que nous n'avons rien à garder. Le prix : une extension ne voit ni un Ledger branché en direct, ni le mobile, ni le bouton Envoyer du portefeuille. Un portefeuille ferait mieux que nous, et s'il reprend l'idée, c'est par lui que nous passerions.

## Juré de conformité

**14. « Si votre modèle se trompe, qui est responsable ? »**
Le modèle ne lit que le sens de la phrase ; le montant, le jeton, l'adresse et la comparaison sont du code, et une phrase ne peut pas faire baisser une alerte : zéro cas sous le plancher sur le jeu aveugle. Une fausse alerte coûte un clic, une alerte manquée laisse la personne où elle serait sans l'outil. L'éditeur répond des règles et du choix du modèle, la personne garde le dernier geste.

**15. « Un auditeur peut-il rejouer vos décisions ? »**
Chaque décision laisse une ligne datée, et la version serveur chaîne ces lignes par hachage. Notre audit interne a trouvé le journal inexact sur deux points : le passage automatique de la deuxième demande est noté comme une confirmation humaine, et la limitation du droit à 50 n'y figure pas. Nous ne déclarons aucune conformité : DORA et MiCA incombent à l'organisation qui déploierait l'outil.

## Réponses courtes en réserve

- **« Avez-vous essayé avec un vrai MetaMask ? »** Non. Ce que tu as vu tourne avec un portefeuille de test, sur une chaîne locale. L'API d'alertes de MetaMask ne sert pas ces chaînes : son silence là ne dirait rien.
- **« Et sur Avalanche Fuji ? »** Rien n'y est déployé. La répétition a été faite sur une copie locale.
- **« L'IA, c'est pour faire peur ? »** C'est une capacité montrée en simulation : 207 contrats déjà piratés exploités sur 405, et Anthropic écrit n'avoir jamais essayé sur une chaîne réelle. Dans un autre essai du même article, sur 2 849 contrats récents, l'exécution coûtait 1,22 dollar et le gain net moyen était de 109 dollars par faille : pas encore rentable. Nous n'avons trouvé aucun vol réel attribué à une IA avec preuve.
- **« Pourquoi citer le NIST ? »** La publication 800-207 demande d'agir comme si un attaquant était présent sur le réseau de l'entreprise. Elle parle de réseaux d'entreprise, pas de portefeuilles : nous reprenons la posture, pas le texte.
- **« Combien de temps prend la vérification ? »** Dans la scène, le verdict arrive environ 400 millisecondes après Entrée sans le modèle, 1,1 seconde avec. La fenêtre s'ouvre en un tiers de seconde.
- **« Une signature Permit ? »** Elle ne peut pas être limitée : le site construit le message. Hold up le dit, retient 30 secondes, et n'offre aucune correction.
- **« Le mapping ? »** NIST CSF 2.0 : DE.CM et DE.AE pour l'écart entre la phrase et la demande, RS.MI pour retenir et limiter. ATT&CK : T1204, T1566, T1657. Les identifiants sont à revalider dans les référentiels avant la fiche de défense.

## Limites assumées, à dire avant qu'on les demande

1. Jamais essayé devant un vrai portefeuille. Chaîne locale, argent fictif, rien sur Fuji.
2. La vérification n'est pas complète : 18 paires contrôlées sur 58.
3. 15 % de fausses alertes rouges sur le jeu aveugle, objectif de 10 % manqué.
4. Le droit limité peut être pris : la perte est bornée, pas évitée.
5. Une signature ne peut pas être limitée.
6. La fraude voulue, un Ledger en direct, le mobile : hors périmètre.
7. Des contournements trouvés par notre revue, corrections non vérifiées dans un navigateur.
8. Sur une installation neuve, la scène ne marche qu'après avoir déclaré les jetons de démo à la main.
9. Aucun essai avec des personnes, aucun client, aucun prix.
10. Le principe n'est pas de nous.
