# Sentinelle : maquettes de l'extension (HTML/CSS autonome)

Ouvrir les fichiers directement dans un navigateur. Aucun import externe, aucune dépendance. Marques, sites et adresses fictifs (domaines `.example`).

| Fichier | Contenu |
|---|---|
| `1-bandeau.html` | Bandeau injecté sur un faux site, niveaux Danger et Attention, raison en une phrase, « Pourquoi ? » (déroulant natif) |
| `2-miroir.html` | Panneau Dit / Affiché / Fait avec capture miniature de la zone qui annonce le gain ; double confirmation (case à cocher) |
| `3-popup.html` | Popup de 400 px : site courant (Danger / rien à signaler), dernières alertes, contact de confiance |
| `4-accueil.html` | Accueil à l'installation : 3 écrans (ce qu'elle fait, ce qu'elle ne fait pas, vie privée) |
| `sentinelle.css` | Jetons de couleur clair/sombre et composants communs |
| `sentinelle.js` | Bascule de thème de la maquette seulement (auto, clair, sombre) |

## Choix
- **Niveau = mot + forme + couleur.** Danger : octogone, rouge plein. Attention : triangle, jaune pâle. Jamais la couleur seule.
- **Accessibilité** : paires de couleurs choisies pour viser AA dans les deux thèmes (à revérifier avec un outil avant la démo) ; focus visible de 3 px ; cibles de 44 px pour les actions principales ; clavier complet (`details` natif, vraies cases à cocher, interrupteur bâti sur une case).
- **Annonces** : `role="alert"` pour Danger, `role="status"` pour Attention, `alertdialog` pour le miroir.
- **Ralentir sans bloquer** : « Ne pas signer » est l'action principale ; « Continuer malgré tout » reste grisé jusqu'à la case « J'ai lu ce que la signature fait vraiment ».
- **Thèmes** : clair par défaut, sombre selon le système, forçable via `data-theme` sur `<html>`. Polices système (une extension ne doit pas charger de police distante).
- **Vie privée affichée** : le contact de confiance ne reçoit rien tout seul ; Sentinelle prépare un message que la personne envoie elle-même.

## À brancher
- Injecter le bandeau dans un Shadow DOM pour que les styles du site n'interfèrent pas.
- La capture miniature du miroir est ici du HTML ; en production, un recadrage de la zone détectée (texte « Recevez … USDC »).
- Les textes de raison viennent de `Verdict.reasons[].said / does` (voir `docs/intent-barrier.md`).
