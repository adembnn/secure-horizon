# Contenu commun aux trois directions (même texte, même données, pour comparer à armes égales)

Données fictives, marques fictives, domaines en `.example`. Monnaie : USDC (jeton fictif de démo sur Fuji). Tutoiement, zéro jargon.

## Écran 1 : intention.html (question d'intention)
- Contexte : le site `rembourse-nova.example` demande une signature.
- Titre : « Avant de continuer : qu'essaies-tu de faire ? »
- Choix (un seul) :
  - « Recevoir de l'argent (remboursement, cadeau) »
  - « Payer quelqu'un »
  - « Échanger une crypto »
  - « Me connecter au site »
  - « Quelqu'un m'a demandé de le faire »
- Champ facultatif : « Colle ici le message qui t'a poussé à le faire »
- Mention : « Ta réponse ne peut que rendre la vérification plus stricte. »
- Actions : « Annuler, rien ne sera envoyé » / « Vérifier »

## Écran 2 : danger-signature.html
- Niveau : Danger.
- Phrase-titre : « Ce n'est pas ce que tu as demandé. »
- Tu as dit : « Recevoir un remboursement de 50 USDC »
- En réalité : « Ce site obtiendrait le droit de prendre tous tes USDC (2 480 USDC), maintenant et plus tard, sans te redemander. »
- Détail : « Le contrat qui recevrait ce droit a été créé il y a 3 minutes. Il n'est connu de personne. »
- Barrière : « Pour continuer quand même, recopie : je donne l'accès à tous mes USDC », puis 30 s.
- Actions : « Annuler, rien ne sera envoyé » (principal) / « Continuer quand même » (désactivé tant que la barrière n'est pas franchie)

## Écran 3 : danger-adresse.html
- Niveau : Danger.
- Phrase-titre : « Cette adresse n'est pas celle de ton compte Coinbase. »
- Tu as dit : « Envoyer 1 200 USDC vers mon compte Coinbase »
- Adresse connue (ton historique) : `0x7a3F 9c21 B04e 5D8a 1f6C 2E90 aB47 33dE 8c15 E2b9`
- Adresse collée : `0x7a3F 1d88 Ce02 77aF 0b3D 9a41 F6c2 0e5B 4d19 E2b9`
- Explication : « Elle commence et finit pareil, mais le milieu est différent. C'est le piège de l'adresse sosie : quelqu'un t'a envoyé 0 USDC depuis cette adresse pour qu'elle apparaisse dans ton historique. »
- Actions : « Annuler » (principal) / « Utiliser l'adresse connue » / « Continuer quand même » (barrière)

## Écran 4 : manipulation.html
- Niveau : Manipulation.
- Phrase-titre : « Personne de sérieux ne te demande de déplacer tes fonds. »
- Contexte : tu as choisi « Quelqu'un m'a demandé de le faire ». Message collé, classé « faux support » : « Bonjour, ici le support NovaWallet, votre compte est compromis, transférez vos fonds vers le coffre sécurisé avant 15h. »
- Corps : « Aucun vrai support, banque ou plateforme ne demande de déplacer ton argent. Si tu es au téléphone avec cette personne, raccroche. »
- Retenue : « Cette demande reste en attente 10 minutes », avec le compte à rebours 9:41.
- Actions : « Annuler » (principal) / « Appeler un proche » / « Raccrocher et me laisser un moment » ; aucune action « continuer » pendant le délai.

## Contraintes communes
- Fenêtre d'extension de 400 px de large, posée sur un faux site flouté ou estompé derrière, affichée dans un cadre de 1280×800 pour la présentation. Tient aussi en 360 px.
- Clair et sombre (prefers-color-scheme, plus `data-theme` forçable).
- Accessibilité : alertdialog, focus visible, contraste AA ou mieux, cibles ≥ 44 px, information jamais portée par la seule couleur, minuteur annoncé.
- HTML/CSS autonome, un CSS partagé par direction (`style.css`), aucun import externe sauf une police Google Fonts si la direction le justifie.
