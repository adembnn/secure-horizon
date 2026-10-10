# Recommandation finale — Antibody AP (Track 1)

> Consolide V6 à V11. Faits sourcés dans chaque rapport (V9, V10 : URL lues le 2026-10-10). Points [ÀV] listés en bas.

## En une phrase
**« Les scanners vérifient la destination d'un paiement. Antibody vérifie d'où vient cette destination, et le prouve. »**

Antibody est la boucle vaccin appliquée à un seul geste : **un agent IA qui paie un fournisseur** (stablecoin sur Avalanche ou virement IBAN).

## Pourquoi ce périmètre (vérifié)
- **Le trou existe côté crypto** : Blockaid, GoPlus et Coinbase décident sur liste noire, réputation, simulation et plafonds. Une adresse **neuve et propre**, introduite par une fausse facture, passe. Aucun outil ne relie un paiement au document qui a introduit l'adresse (V9, V10).
- **Côté IBAN, le trou est plus fin** : la vérification du bénéficiaire (VoP, obligatoire depuis oct. 2025) et Trustpair bloquent un IBAN au nom d'un autre. Reste le compte **au bon nom détenu par le fraudeur**, limite reconnue par Pay.UK et Trustpair (V9).
- **Contexte** : Microsoft, septembre 2026, campagne de plus d'un million de fausses factures générées par IA visant les services comptables ; BEC 3,05 Md$ (FBI IC3 2025) ; 74 % des entreprises touchées (AFP 2026) ; les agents comptes fournisseurs existent (Ramp depuis oct. 2025, Coupa, SAP).
- **Risque émergent, pas d'incident en production trouvé** : le plus proche est une démo universitaire (Princeton, ElizaOS). À dire honnêtement.

## Ce qu'on assume
- Blockaid fait déjà « le LLM propose, la règle restrictive décide » et rejoue les règles (V10). C'est l'état de l'art, pas notre différence.
- Avalanche n'est pas vide de sécurité : Blockaid (wallet Core), Hexagate, Forta, Cyvers, GoPlus.
- Posture : **on cite Blockaid nous-mêmes et on branche son scan en entrée**. « On ne remplace pas Blockaid, on couvre la couche intention et on la prouve à l'auditeur. »

## Nos 3 différences défendables (V10)
1. **Provenance de la destination** : chaque champ critique (IBAN, adresse, montant) porte son origine (échelle P0 « référentiel vérifié par rappel » à P5 « aucune origine »). C'est la « chaîne d'autorité » demandée par la piste 3 du guide.
2. **Preuve d'efficacité vérifiable par un tiers** : corpus d'attaque et légitime hachés, taux de blocage et faux positifs (avec n et intervalle de confiance) ancrés sur Fuji, rejouables. Les concurrents ne publient que des affirmations.
3. **On teste l'agent du client lui-même** dans l'arène et on en tire un dossier de preuves DORA / AI Act / MiCA.

## Architecture
- **Sources (on ne détecte pas tout seuls)** : GoPlus et TRM Sanctions (sans clé, Avalanche testé), ScamSniffer/MetaMask, OFAC, DeFiHackLabs, MITRE ATLAS, AgentDojo banking, FINOS (V6, V7).
- **Arène** : copies de l'agent comptes fournisseurs, scénarios dérivés des sources, corpus de 80 cas légitimes difficiles + ~2 400 paiements d'historique.
- **Vaccins** : 8 règles restrictives (ex. bascule IBAN → USDC demandée par un document ; changement de coordonnées non rappelé ; adresse sosie).
- **Passerelle** : décide de façon déterministe ; signaux VoP, Blockaid, GoPlus en entrée.
- **Avalanche Fuji** :
  - `AgentTreasury` ne transfère qu'avec une attestation signée par la passerelle, sinon il émet `PaymentHeld` ;
  - `VaccineRegistry` + `EvidenceAnchor` ;
  - USDC de test Circle (+ token maison pour le volume).

## Démo 5 min (V11)
ALBA est piégé par une fausse facture → autopsie → vaccin testé et publié sur Fuji → **à 3:00, écran partagé chez BORA (jamais attaquée) : le scanner est tout vert, Antibody affiche « mise en attente », Snowtrace montre `PaymentHeld`.** Métrique clé : **« écart avec les scanners »**, la part des attaques que VoP et le scan d'adresse laissent passer.

## Livrables Track 1
Playbook en 5 niveaux (l'automatique ne fait que réduire l'autonomie de l'agent ; tout ce qui engage l'entreprise reste humain). Slide conformité : DORA, règlement 2024/886 (VoP), PSR, AI Act art. 12/14/15 (présenté comme anticipation, application au 2 déc. 2027).

## [ÀV] avant les slides
Texte de l'art. 5 quater du règl. 2024/886 · numérotation PSR · IDs ATLAS/ASI · CGU commerciales GoPlus · limite du faucet USDC. `blockchain/contracts` est vide : tous les contrats restent à écrire.
