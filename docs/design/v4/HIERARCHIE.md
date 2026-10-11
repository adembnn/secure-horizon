> **PÉRIMÉ le 11/10/2026 : voir livrables\**

# Hiérarchie de l'information : seulement ce qui compte (v0, à affiner par l'expert UX)

Règle d'Adem : « mettre en avant sur l'interface UNIQUEMENT les infos importantes pour l'utilisateur ».

## Principes
1. Au premier regard (3 s), trois choses au maximum : le verdict en une phrase, l'écart (ce que tu crois / ce qui se passe) et le bouton Annuler.
2. Tout le reste est derrière « Pourquoi ? » (dépliable) : âge du contrat, explications, nom du site.
3. Aucun texte qui parle de Sentinelle elle-même, aucun libellé décoratif, aucune icône qui ne porte pas d'information.
4. Un seul accent de couleur, posé sur l'écart, nulle part ailleurs.
5. Les montants et les adresses sont les plus grandes données de l'écran.

## Écran Danger, signature piégée
- Verdict : « Ce n'est pas ce que tu as demandé. »
- Écart :
  - Tu crois : **recevoir 50 USDC**
  - En vrai : **donner l'accès à tes 2 480 USDC**
- Action : **Annuler** (plein, pleine largeur)
- Replié : Pourquoi ? (« Ce site pourrait prendre tes USDC maintenant et plus tard, sans te redemander. Le contrat a été créé il y a 3 minutes. »)
- Tout en bas, discret : « Continuer quand même », qui ouvre la barrière (recopier « je donne l'accès à tous mes USDC », puis 30 s).

## Écran Danger, adresse sosie
- Verdict : « Ce n'est pas l'adresse de ton compte Coinbase. »
- Écart : les deux adresses l'une sous l'autre en chasse fixe, seuls les caractères différents sont marqués (accent), et un comptage « 26 caractères différents ».
  - Ton adresse habituelle : `0x7a3F 9c21 B04e 5D8a 1f6C 2E90 aB47 33dE 8c15 E2b9`
  - Adresse collée : `0x7a3F 1d88 Ce02 77aF 0b3D 9a41 F6c2 0e5B 4d19 E2b9`
- Actions : **Envoyer à mon adresse habituelle** (principal) / Annuler
- Replié : Pourquoi ? (« Quelqu'un t'a envoyé 0 USDC depuis cette adresse pour qu'elle apparaisse dans ton historique. »)
- Discret : « Continuer quand même ».

## Écran Manipulation
- Verdict : « Personne de sérieux ne te demande de déplacer ton argent. »
- Une consigne : « Si tu es au téléphone, raccroche. »
- Le minuteur : 9:41, avec « Ta demande attend 10 minutes ».
- Actions : **Annuler la demande** (principal) / Appeler un proche
- Replié : le message collé, classé « faux support ».
- Aucun bouton « continuer » pendant le délai.

## Écran Question d'intention
- Question : « Qu'essaies-tu de faire ? »
- 5 choix en une ligne chacun, sans sous-texte :
  - Recevoir de l'argent
  - Payer quelqu'un
  - Échanger une crypto
  - Me connecter
  - On m'a demandé de le faire
- Lien discret : « Coller le message reçu »
- Actions : Vérifier / Annuler
- Rien d'autre : pas d'explication sur Sentinelle, pas de mention « ta réponse rend la vérification plus stricte » (on la met dans l'aide).
