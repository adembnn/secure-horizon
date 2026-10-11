# Corrections à appliquer à `FICHE_DEFENSE.md`

Écrit le 11 oct. 2026 pour le gel. `METRIQUES.md` (racine) fait foi. La fiche n'a pas été modifiée : chaque ligne ci-dessous donne la phrase actuelle, ce qui ne va pas, et le texte de remplacement. La fiche doit rester sur une page : les ajouts sont courts.

## 1. Source des chiffres

- Actuel : « **Métriques** (source unique : `livrables/CHIFFRES.md`). »
- Problème : la source de référence est maintenant `METRIQUES.md`.
- Remplacer par : « **Métriques** (référence : `METRIQUES.md`). »

## 2. Jeu aveugle : dire ce qui a été mesuré

- Actuel : « **Jeu aveugle (A6)**, code seul, 150 arnaques et 100 jumeaux, autre auteur, ouvert une fois »
- Problème : le jeu a été mesuré sur le moteur de comparaison côté serveur, pas sur l'extension livrée. La fiche laisse croire que c'est le produit.
- Remplacer par : « **Jeu aveugle, moteur de comparaison (pas l'extension)**, code seul, 150 arnaques et 100 jumeaux, autre auteur, ouvert une fois »

## 3. Ligne à ajouter : l'extension elle-même

- Actuel : aucune ligne sur l'extension, aucune sur « pas pu vérifier ».
- Ajouter sous la ligne du jeu aveugle :
  « **Extension livrée, contrôle scellé de 2 662 paires**, sans modèle, build qui plantait sur 19,5 % des demandes | Attrapé **49,4 %** [47,1 ; 51,8] ; raté 2,7 % ; « pas pu vérifier » 31,2 % ; en panne 16,7 % ; fausses alertes **8,2 %** [6,1 ; 10,8] »
  « Extension corrigée (panne réparée, commit `b42792d`), réserve scellée de 2 673 paires | **à mesurer** »

## 4. Temps

- Actuel : « Verdict local : médiane sous 50 ms (400 requêtes, sans réseau). Le modèle hébergé ajoute un délai distinct (p50 369 ms) »
- Problème : ce sont les temps du serveur de l'ancienne version et d'un autre classifieur. L'extension a ses propres mesures. Le titre « Temps de réponse » mélange détection et réponse.
- Remplacer la ligne par : « **Temps de détection** (code de l'extension sous Node, sans fenêtre) | Local : p50 2,0 ms, p95 13,0 ms (n = 2 662). Avec le modèle : p50 387 ms, p95 1 436 ms (n = 2 101). De la demande du site au verdict affiché, dans un navigateur : non mesuré de façon reproductible »
- Ajouter : « **Temps de réponse** | Automatique : celui du verdict. Humain (un geste : Annuler ou Continuer) : non mesuré, aucun essai avec des personnes »

## 5. Limites du jeu aveugle

- Actuel : « Cas synthétiques, mesurés en Node, pas dans Chrome. »
- Remplacer par : « Cas synthétiques, mesurés en Node sur le moteur de comparaison, pas sur l'extension ni dans Chrome. »

## 6. Où va la phrase

- Actuel : « La phrase seule part vers le modèle par un relais local qui garde la clé ; jamais les montants ni les adresses. »
- Problème : la phrase contient le montant, et parfois l'adresse, que la personne y a écrits. « Jamais les montants ni les adresses » est faux pour ce cas.
- Remplacer par : « La phrase écrite, avec ce que la personne y a mis, part du navigateur vers un relais local qui garde la clé, puis vers le modèle hébergé. Ni l'adresse du compte ni la demande du site ne sont envoyées. »

- Actuel : « Le modèle ne peut pas baisser une alerte du code. »
- Problème : vrai sur le jeu aveugle pour le moteur de comparaison (aucun cas sous le plancher). Sur le contrôle de l'extension, le bras avec Clef dit « ça correspond » à plus de demandes non conformes que le bras sans modèle : 64/1 752 contre 47/1 752.
- Remplacer par : « Sur le jeu aveugle, le modèle n'a baissé aucune alerte du plancher (moteur de comparaison). Dans l'extension, avec le modèle, les ratés montent de 2,7 % à 3,7 %. »

## 7. Démo

- Actuel : « sans Hold up, 100 USDC tombent à 0 »
- Problème : la preuve rejouable (`research/demo_reelle/site_echange/test/preuve_piratage.mjs`) part de 100, échange 50, puis le piratage fait passer le compte de 50 à 0. Si la fiche parle d'une autre scène, citer son script.
- Remplacer par : « sans Hold up, après l'échange de 50, le pirate prend les 50 restants (50 vers 0) ; avec, droit ramené à 50, le pirate prend 0 ». Garder « chaîne locale, portefeuille simulé ».

## 8. Ce qu'on ne couvre pas

- Actuel : « Sur 58 paires d'essai, 18 contrôlées : ni sens d'un échange, ni durée, ni destinataire d'un droit (perte bornée, pas évitée). »
- Ajouter après : « Hold up ne reconnaît pas un contrat malveillant, il borne ce qu'on lui laisse. Un droit sans échéance reçoit « ça correspond » dans 21 cas sur 43 du contrôle. Phrases de test écrites par des agents ; jeux conçus par notre équipe. Rien sur un réseau public. »

## 9. Trace

- Actuel : « (qui a agi, d'où ça vient, quand, règles, preuve de chaîne ; 7 tests) »
- Remarque : consigne du gel, aucun nombre de tests recopié à la main dans les documents de référence. Retirer « ; 7 tests » ou le remplacer par la commande.

## Ce qui reste juste et ne change pas

Rappel 87,3 % [81,1 ; 91,7], faux rouges 15,0 % [9,3 ; 23,3], faux avertissement ou rouge 30 %, plancher 64,7 %, gain de +34, critère des 10 % non atteint, 11 des 15 faux rouges sur les achats de NFT, pas d'ancrage (D-017), jamais essayé avec un vrai MetaMask, Fuji non déployé, référentiels.
