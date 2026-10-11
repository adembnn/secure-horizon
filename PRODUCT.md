# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Délégué par Adem, qui demande plusieurs maquettes pour juger sur le rendu : extension navigateur Manifest V3. L'interface est injectée dans la page via Shadow DOM, en HTML/CSS et TypeScript sans framework. Elle doit être légère et ne pas entrer en conflit avec le site, parce qu'elle s'affiche au moment critique de la signature. La stack ne change pas le rendu visuel ; ce sont les maquettes qui tranchent.

## Users
Grand public sous pression (confirmé par Adem) : un particulier avec un wallet crypto normal (MetaMask, Rabby, Core), pas technique, parfois âgé. Il est souvent au moment où un escroc le presse : au téléphone, dans un chat de faux support, sur un faux site de remboursement. Il doit comprendre en quelques secondes ce qui ne va pas, et pouvoir annuler sans se sentir bête.

Public secondaire, pour la démo : le jury du hackathon Secure Horizons, qui regarde l'écran projeté.

## Product Purpose
Sentinelle s'interpose juste avant qu'une personne signe ou envoie de la crypto depuis un site. Elle lui demande, en mots simples, ce qu'elle veut faire, calcule ce que l'opération fait réellement, et retient la demande si les deux divergent : « Tu as dit X. En réalité, Y. »

Réussir, c'est qu'une victime manipulée s'arrête, et qu'un utilisateur honnête ne soit presque jamais dérangé.

## Positioning
Les scanners existants (Blockaid, Rabby, MetaMask) jugent la réputation d'une adresse ou affichent un bilan technique. Sentinelle compare l'intention déclarée par la personne avec l'effet réel. Elle traite aussi la manipulation elle-même (« on m'a demandé de le faire »), et ses taux de fausses alertes sont mesurés et publiés.

## Operating Context
- L'interface apparaît par-dessus un site tiers, juste avant la fenêtre du wallet, souvent pendant un appel ou une conversation avec un escroc.
- Elle comprend :
  - un bandeau avant tout clic quand le site est suspect ;
  - une question d'intention quand l'opération donne un droit ou fait sortir des fonds ;
  - des écrans de niveau Manipulation (demande retenue 10 min, geste qui coupe le lien avec l'escroc), Danger (phrase à retaper puis 30 s), Attention (1 clic) et « vérification impossible », jamais vert ;
  - le miroir Dit / Affiché / Fait ;
  - une popup d'extension.
- Démo sur Avalanche Fuji, avec des sites et des marques fictifs.

## Capabilities and Constraints
- Elle peut retenir la requête du site avant qu'elle n'atteigne le wallet. Elle ne peut pas empêcher les envois faits depuis le bouton Envoyer du wallet. Elle n'existe pas sur mobile.
- Elle n'affiche jamais « protégé » ni « bloqué » : elle avertit, ralentit et explique. Le bouton Annuler est toujours visible et ne pénalise jamais.
- Les réponses de l'utilisateur ne peuvent que relever le niveau d'alerte, jamais l'abaisser.
- Zéro jargon dans l'interface : pas de « permit », « approve » ni « EIP-712 ».
- Undecided : nom définitif, voix, identité visuelle (à construire avec Adem) ; ce qui se passe au bout des 10 min ; les cas exacts de la barrière de 30 s.

## Evidence on Hand
- `docs/BRIEF_direction.md` (problème chiffré, 3 arnaques).
- `docs/design/REGLES_avertissements.md` (règles sourcées : Annuler en bouton principal, forcer la lecture plutôt qu'ajouter des clics, 47 % des outrepassements en moins de 1,5 s).
- Banc réel de Titouan (`research/titouan/bench/`).
- Aucun témoignage d'utilisateur, aucun client, aucune mesure d'efficacité de nos écrans : ne rien inventer.

## Product Principles
1. La personne garde la main : on retient et on explique, on ne décide jamais à sa place.
2. Parler avec ses mots à elle, pas avec ceux de la blockchain.
3. Être rare pour être cru : chaque fausse alerte use la confiance.
4. Ne jamais rassurer à tort : l'incertitude ne s'affiche jamais en vert.
5. Rompre la pression de l'escroc, pas seulement informer.

## Accessibility & Inclusion
Public âgé et sous stress : textes grands, contraste AA minimum, cibles larges, navigation au clavier, lecteurs d'écran (alertdialog, minuteur annoncé), aucune information portée par la seule couleur.
