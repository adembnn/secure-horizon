# Plan v1.4 en une page : réponse automatique après compromission + paquet de preuves, pour particuliers à patrimoine (Claude-Titouan)

Statut : plan, rien n'est construit. Remplace plan_v1_3 pour la porte d'entrée "particuliers" de D-005. Les institutions sont un export du même moteur.

## Le problème
Quand l'appareil ou la phrase secrète d'un particulier est compromis, tout part en quelques minutes et il n'existe presque rien après la signature. Chiffres (W1, à revérifier) : 158 000 incidents et au moins 80 000 victimes en 2025 pour 713 M$ (Chainalysis, relayé par la presse) ; drainers de signature 494 M$ en 2024 puis 83,85 M$ en 2025, perte moyenne 790 $ (Scam Sniffer) ; empoisonnement d'adresse 83,8 M$ en deux ans (étude CMU) ; faux support, cas de 330 M$ en BTC dont environ 7 M$ gelés (ZachXBT, presse). Récupération faible : environ 5 à 6 % gelé ou récupéré (médiane de 9 cas crypto, agent D).

## Pour qui
Un détenteur de crypto à patrimoine significatif (hypothèse : à partir de 100 k€), exposé aux drainers, aux infostealers, aux faux supports et, en France, aux attaques physiques. Distribution visée : portefeuilles et exchanges (B2B2C) ; le particulier fortuné en premium direct (hypothèse 100 à 250 $/an).

## Le produit, quatre pièces
1. **Compte protégé** : un compte intelligent (EIP-7702 sur l'adresse existante, ou Safe à un propriétaire + gardiens) avec plafond à seau, resserrer seulement, relâcher par gardiens + délai, et un **coffre à délai** vers lequel les fonds peuvent être déplacés.
2. **Moniteur hors appareil** : lit la chaîne, calcule en code (montants, similarité d'adresses, nouveauté du destinataire, approbations illimitées), et demande à un modèle de classification (Jev) seulement le sémantique ("est-ce une signature de drainer ?"). Le code décide, le modèle classe. Double passage avec options mélangées, détection d'injection, escalade humaine sous 0,6 de confiance (W7).
3. **Réponse automatique** (le vide du marché, W4) : resserrer la limite, révoquer les approbations, déplacer vers le coffre à délai, alerter un contact de confiance. Chaque action est réversible par les gardiens.
4. **Paquet de preuves** pour la police ou l'assureur (format commun "preuve d'incident", rendu particulier ; le rendu DORA reste un export) : chronologie, transactions, règle déclenchée, approbations révoquées, empreinte ancrée.

## Démo unique
Un drainer signé (ou une seed volée) sur un compte synthétique : le moniteur voit la signature malveillante, Jev la classe, le code déclenche la réponse : limite resserrée, approbations révoquées, fonds déplacés vers le coffre à délai, contact alerté, paquet de preuves généré. Écran partagé "sans / avec". Chiffres à mesurer : fonds sauvés, délai de réponse en blocs, faux positifs sur le trafic légitime de référence (agent J8), ratés publiés. Règles scellées avant les attaques de test.

## Le parcours wrench (clé de détresse) : mon avis
Il entre comme **variante d'une phrase**, pas comme module. Le même coffre à délai + gardien de confiance + alerte silencieuse offre du temps (le seul mécanisme efficace documenté par la recherche d'Adem). Pas de promesse sur une détection de contrainte (aucun produit validé), et dire que le délai peut prolonger la séquestration. Accroche possible : le cas Balland (Ledger, janvier 2025), France épicentre selon Chainalysis (chiffres de la recherche d'Adem, à revérifier).

## Ce qu'on n'affirme pas
"Zéro faux positif", "empêche tout vol", "conforme DORA" (rendu institutionnel), "personne ne le fait" (on dit : nous n'avons pas trouvé de produit qui agit seul après compromission pour un particulier). Limites écrites : interface détournée non couverte, délai dépendant des gardiens, pas de donnée de conversion en abonnement, Jev non évalué sur des données crypto.

## Risque technique principal
EIP-7702 : plus de 80 % des délégations observées en 2025 pointaient vers des vidangeurs (Wintermute, presse) et Ledger ne laisse passer qu'un seul contrat de délégation. Il faut un chemin qui ne ressemble pas à un drainer. Repli : Safe à un propriétaire + gardiens (Safe 1.4.1 existe sur Fuji).

## Priorités
P0 : compte protégé (plafond, resserrer seulement, coffre à délai), moniteur à signaux de code, réponse automatique, paquet de preuves, rejeu et banc d'essai avec ratés. P1 : classification Jev branchée, contact de confiance, rendu DORA en export. Coupé : multi-chaînes, passkey, paliers multiples.
