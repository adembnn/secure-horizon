# BM_DIAPO. La diapo business model, le script, les questions, les expériences

Date : 11 octobre 2026. Source unique : `BM_SYNTHESE.md`. Statuts : [V] lu à la source, [M] notre mesure, [C] calcul, [H] hypothèse.

Avant de projeter : le chiffre Chainalysis (158 000) et le coût par vérification ne sont pas encore dans `livrables/CHIFFRES.md`. Les y ajouter, ou les retirer de la diapo.

## 1. Texte exact de la diapo

**Titre** : Ne donner que ce qu'on a écrit

**Phrase de promesse (bandeau)** : Cesser de donner plus que nécessaire, car on s'expose en le faisant.

**Bloc 1. Le problème**
- **106 106** victimes de drainers en 2025 ¹
- **158 000** portefeuilles personnels compromis en 2025 ²
- **47,6 %** des droits de dépense non nuls sont illimités sur Ethereum ³
- LI.FI 2024 : **11,6 M$** pris aux droits illimités, rien aux droits finis ⁴

**Bloc 2. Qui utilise, qui paie**
- Particulier : gratuit, local, sans compte, sans publicité
- Ceux qui portent la perte paient : exchanges et fintechs, portefeuilles et plateformes

**Bloc 3. Ce qu'on vend**
1. API de verdict avant retrait (exchanges, fintechs)
2. Licence SDK (portefeuilles, plateformes)
3. Demain : mandats pour agents IA qui dépensent

**Bloc 4. L'économie**
- Coût d'une vérification : environ **0,0002 $** ⁵
- Prix envisagé : **0,005 $** par vérification, marge brute environ 94 % ⁶

**Bloc 5. Prochaine étape**
- 3 pilotes en 90 jours : testeurs ESSEC et Kryptosphère, Team1 Avalanche, une fintech
- Pas de vente avant un nouveau jeu aveugle sous 10 % de fausses alertes

**Sources (en petit)** :
¹ ScamSniffer, rapport 2025, publié le 3 janv. 2026, chaînes EVM, borne basse.
² Chainalysis, 18 déc. 2025, toutes causes, borne basse.
³ Notre mesure sur la chaîne, échantillon de 800 blocs, des événements et non des personnes ; Avalanche C-Chain : 34,2 %.
⁴ Rapport d'incident de LI.FI, 16 juil. 2024.
⁵ Calcul sur les prix publics d'Alchemy et de Cloudflare ; nombre d'appels estimé, non mesuré ; 0 $ dans la version autonome.
⁶ Prix hypothétique, aucun prix de marché comparable publié.

Six chiffres : 106 106, 158 000, 47,6 %, 11,6 M$, 0,0002 $, 0,005 $. Le 94 % est un calcul dérivé du 0,005 $ ; à retirer si le jury compte strictement.

## 2. Script oral, 40 secondes (environ 105 mots)

> « Quand on signe, on donne souvent plus que nécessaire. Sur Ethereum, près d'un droit de dépense sur deux est illimité, d'après notre mesure. Chez LI.FI en 2024, les droits illimités ont perdu 11,6 millions ; les droits finis, rien.
>
> Le particulier ne paie pas : Hold up est gratuit et local. Paient ceux qui remboursent la fraude. Les exchanges et les fintechs, avec une API de verdict avant retrait. Les portefeuilles, avec une licence. Demain, le même mandat écrit bornera les agents qui dépensent pour nous.
>
> Une vérification coûte environ deux dixièmes de millième de dollar. Le défi n'est pas le coût : c'est la confiance. »

## 3. Huit questions de jury, réponses honnêtes

**1. « Qui paie vraiment ? »**
Ceux qui portent la perte à la place du client : exchanges et fintechs qui remboursent, portefeuilles qui portent la confiance. Personne n'a signé, et c'est le pilote fintech des 90 prochains jours qui le dira.

**2. « MetaMask peut copier votre champ demain. »**
Oui, et il pose déjà une question, mais seulement après un verdict malveillant et en choix fermés. S'il l'élargit, il valide l'idée ; notre valeur reste une couche neutre devant tout portefeuille, un retrait ou un agent, et une mesure publique que nous rejouons.

**3. « Pourquoi gratuit pour le particulier ? »**
Parce que l'abonnement de masse rapporte peu dans ce secteur : Revoke.cash déclarait des revenus « très faibles » avant ses offres payantes. Le particulier nous apporte des phrases réelles et la preuve d'usage ; le revenu vient de ceux qui remboursent.

**4. « Comment passer à l'échelle ? »**
Par l'intégration, pas par l'acquisition d'utilisateurs un par un : un SDK dans un portefeuille ou une API chez un exchange touche toute leur base d'un coup. Le coût marginal reste autour de 0,0002 $ par vérification selon notre calcul ; la limite est le temps de vente et les fausses alertes.

**5. « Quelle conformité pour un éditeur comme vous ? »**
Hold up ne détient ni fonds ni clés et n'exécute aucun transfert ; MiCA exclut même les portefeuilles non dépositaires (considérant 83). Restent à faire qualifier par un juriste le RGPD de la phrase écrite, la frontière avec le conseil et toute commission d'assurance ; nous ne revendiquons aucune conformité.

**6. « Les agents IA sont-ils un vrai marché ? »**
Pas encore : TRM mesure 5 000 à 11 000 $ par mois de volume qui ressemble à des agents sur x402. Le besoin est réel (des pertes d'agents sont documentées), c'est pourquoi c'est notre troisième étage, pas notre fondation.

**7. « Vos fausses alertes vont tuer l'usage. »**
C'est notre limite principale : 15 % de faux rouges sur un jeu aveugle de cas synthétiques écrits par un autre auteur (un modèle de la même famille), au-dessus du seuil de 10 % fixé avant l'ouverture. Nous ne vendrons rien avant un nouveau jeu aveugle sous ce seuil, et chaque pilote suit ce taux comme indicateur principal.

**8. « Si votre outil se trompe, qui est responsable ? »**
Hold up ne signe rien : il retient, explique, et la personne décide, avec une ligne datée de ce qui lui a été montré. En B2B, contrat sans promesse de résultat, assurance responsabilité civile, et aucun revenu indexé sur des montants « sauvés ».

## 4. Cinq expériences à lancer cette semaine

Seuils fixés par nous [H], écrits avant de commencer. Aucun fonds réel, aucune donnée personnelle réelle.

| # | Expérience | Comment | Réussite si | Sinon |
|---|---|---|---|---|
| X1 | Entretiens payeurs | 5 entretiens de 30 min avec exchange, néobanque, fintech ou CASP (réseau ESSEC, mentors KPMG et Kryptosphère) ; maquette « motif du retrait » | Au moins 2 acceptent un rejeu de 20 retraits ou une deuxième réunion | Moins de 1 sur 5 : le SDK portefeuille passe en rang 1 |
| X2 | Test de prix | Même entretiens : trois paliers (0,005, 0,01, 0,02 $ par vérification avec forfait mensuel), question « trop cher, acceptable, trop peu cher » | Au moins 3 sur 5 jugent 0,005 $ ou plus acceptable | Repenser en forfait annuel par volume |
| X3 | Test de la fenêtre avec des personnes | 15 testeurs (Kryptosphère ESSEC), démo locale, 10 opérations scénarisées chacun dont 3 avec écart | Phrases vides ou « ok » au plus 20 % ; au moins 1 annulation sur 3 après « Ça ne correspond pas » | Plus de 40 % de phrases inutilisables : revoir le geste avant tout pilote |
| X4 | Nouveau jeu aveugle | Corriger les familles faibles (achat NFT à prix quasi nul, jeton différent), puis sceller un jeu écrit par une personne extérieure, sha256 publié, ouvert une fois | Rappel au moins 80 % et faux rouges au plus 10 % | Au-dessus de 10 % : aucune vente, pilotes de rejeu seulement |
| X5 | Coût réel par vérification | Instrumenter le relais : compter CU et jetons réels sur 1 000 vérifications rejouées | Coût moyen au plus 0,0005 $ (marge brute au moins 90 % à 0,005 $) | Revoir le nombre d'appels RPC ou le prix plancher |

## 5. Quoi copier où (pour Titouan)

- Diapo : section 1 telle quelle dans le deck.
- `livrables/FICHE_DEFENSE.md` ou le pitch : script de la section 2 et questions 1, 2, 7 et 8 en priorité.
- `livrables/CHIFFRES.md` : ajouter Chainalysis 2025 (158 000, [V], BM_MARCHE §4) et le coût par vérification ([C], BM_MODELE §5.1 et BM_MARCHE §5) avant de projeter.
- `PRODUCT.md` : section Modèle et mention « jeu aveugle non passé » à mettre à jour.
