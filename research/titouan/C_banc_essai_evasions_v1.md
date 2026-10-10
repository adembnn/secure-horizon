# C. Banc d'essai : catalogue d'attaques, d'évasions et de trafic légitime (v1, Claude-Titouan, 11/10/2026 ~01h00)

Statut : conception pour la v2 d'Adem. Tous les paramètres sont des hypothèses à fixer au moment du scellement. Rien n'est construit.

## 1. Protocole anti-circularité
1. Les règles et leurs seuils sont figés, hachés et le hash est ancré sur Fuji à l'heure H0.
2. Les attaques E-xx sont écrites APRÈS H0 par une personne ou un agent qui n'a pas lu les seuils (attaques en aveugle). Au minimum E2, E3 et E8 sont en aveugle ; le nom de l'auteur est affiché.
3. Le trafic légitime L-xx est écrit par un troisième rôle ou généré avec une graine fixe publiée.
4. Aucun seuil n'est modifié après H0. S'il l'est, la nouvelle version est scellée à nouveau et le tableau montre les deux versions.
5. Le tableau final publie les ratés. Un raté honnête vaut mieux qu'un 100 % non crédible.

## 2. Attaques (E-xx)
| Id | Nom | Description | Attendu | Ce qu'elle teste |
|---|---|---|---|---|
| E1 | Drain rapide | retraits répétés vers une destination fraîche, schéma Drift (31 retraits en 12 min) | arrêtée par le plafond dès le 3e retrait | le plafond en dur |
| E2 | Drain lent sous le seuil | retraits juste sous le seuil de fenêtre, sur de longues heures | perte bornée par fenêtre ; peut passer en partie : à publier comme raté | la limite du plafond |
| E3 | Fractionnement | même montant réparti sur N adresses de destination | arrêtée par le plafond au niveau du coffre, pas de l'adresse | plafond par coffre |
| E4 | Changement de rôle légitime puis retrait | un rôle est changé comme dans une opération normale, puis un retrait suit | doit se distinguer d'un changement réel sous timelock | faux positifs et précurseurs |
| E5 | Précurseur de gouvernance | ajout d'un signataire, baisse du seuil, ajout d'un module, retrait d'un garde, puis drain différé | alerte au précurseur ; plafond au drain | détection avant le vol |
| E6 | Backend menteur | le "backend" annonce un petit retrait alors que la chaîne montre un montant plus élevé | écart détecté entre l'annonce et la chaîne (signal clé d'Adem) | circuit d'approbation compromis |
| E7 | Saturation de la voie lente | dizaines de retraits suspects depuis des adresses bon marché vers des destinations fraîches | la file reste bornée ; les petits retraits légitimes passent encore ; mesurer l'attente | résistance au déni de service |
| E8 | Empoisonnement de la ligne de base | retraits croissants "légitimes" pendant la période d'observation, puis drain juste au-dessus | les plafonds absolus tiennent ; la dérive de la ligne de base est bornée | ligne de base |
| E9 | Retrait géant en une transaction | un seul retrait supérieur au plafond | refusé par l'invariant du contrat | le cas Tectonic |
| E10 | Multi-actifs | vidage d'un actif jusqu'à 100 % pendant que les autres restent | arrêté par un plafond de concentration par actif | invariant de stock |
| E11 | Épuisement du budget de resserrages | beaucoup de petits retraits légitimes, puis vrai drain | le plafond dur reste actif | budget automatique |
| E12 | Fausse pause provoquée | l'attaquant tente de déclencher L3 par un changement de rôle ou un oracle déplacé | aucune pause (L3 réservée aux invariants du contrat) ; au plus L2 | grief et DORA |
| E13 | Deux chaînes, budget global | consommer sur la chaîne A puis frapper la chaîne B (si 2 chaînes locales en démo) | le plus strict gagne ; le plafond local de B tient seul | désynchronisation |

## 3. Trafic légitime (L-xx), pour mesurer les faux positifs
| Id | Nom | Description |
|---|---|---|
| L1 | Gros retrait légitime | un client retire 3 % à 8 % de la réserve en une fois |
| L2 | Ruée | beaucoup de clients retirent en même temps (panique) : mesurer le dommage collatéral |
| L3 | Rebalancement de fin de mois | sorties planifiées vers des adresses connues |
| L4 | Nouveau fournisseur | première sortie vers une destination jamais vue mais ajoutée à la liste blanche par un humain |
| L5 | Changement de rôle sous timelock | opération de gouvernance normale |
| L6 | Rafale de petits retraits | de nombreux clients, petits montants |
| L7 | Retraits récurrents à date fixe | dividendes ou paiements, même heure chaque semaine |
| L8 | Mouvement de réserve interne | transfert entre coffres de l'entité |
Le trafic compte au moins 10 000 transactions avec une part fixée de cas difficiles (par exemple 20 %).

## 4. Métriques à publier (par attaque et au global)
- Détection : arrêtée / partiellement / non détectée.
- Perte maximale avant arrêt, en % de la réserve et en valeur.
- Délai de détection en blocs et en secondes (la valeur observée sur Fuji, pas supposée).
- Faux positifs pour 10 000 transactions légitimes, par règle, avec intervalle.
- Dommage collatéral : clients légitimes retardés, durée totale d'attente, part des retraits légitimes passés sans attente.
- Dossier : temps entre détection et dossier initial relisible ; N champs sur M prouvés on-chain.
- Ratés : liste explicite, avec la raison.

## 5. Ce que le tableau doit pouvoir dire sans mentir
"Voici nos règles scellées à H0. Voici 13 attaques dont 3 écrites par [nom]. Voici ce qui est arrêté, ce qui passe en partie, et ce que coûte un client légitime." Les mots "zéro faux positif" et "conforme DORA" n'y figurent pas.

## 6. Choix à confirmer avec Adem
- Combien de chaînes en démo : une (plus simple) ou deux locales pour E13 ?
- Qui écrit E2, E3, E8 en aveugle ?
- La période de mode ombre est-elle jouée en démo (accélérée) ou seulement décrite ?
