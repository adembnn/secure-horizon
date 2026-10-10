# Synthèse projet vaccin — Track 1 (nom de travail : **Antibody**)

> Consolide V1 (architecture), V2 (Avalanche/partenaires), V3 (concurrence), V4 (business), V5 (démo/stack). À vérifier avant les slides : IDs ATLAS/D3FEND, adresses ERC-8004 Fuji, articles DORA/AI Act, modèles Bedrock.

## Pitch en une phrase
« Antibody expose vos agents IA financiers à des attaques simulées avant les fraudeurs, transforme chaque faille en vaccin testé, et en apporte la preuve vérifiable à votre auditeur sur Avalanche. »

## Positionnement (après V3)
L'immunité on-chain pour agents existe déjà en germe (Immunity et Sybil à ETHGlobal, Deriv Sentinel, Silmaril YC 2026, ERC-8259). **On les cite nous-mêmes.** Notre différence :
1. **Immunité vérifiable** : on ancre la preuve d'efficacité (hash des corpus d'attaque et légitime, taux de blocage, faux positifs), rejouable par un auditeur ou un assureur. Les autres publient une règle ou un vote.
2. **Vaccins sur l'action financière** (montant, contrepartie, vélocité, provenance de l'instruction), pas sur le texte du prompt.
3. **Boucle complète mesurée, avec rappel des vaccins obsolètes.**
4. **Terrain** : finance régulée UE (DORA, MiCA) sur Avalanche.

## Principes
- Le LLM propose, une règle déterministe décide.
- Un vaccin ne peut que restreindre (DSL sans `allow`) ; un humain l'approuve.
- Rien de sensible on-chain (empreintes, statuts, signatures, attestations seulement).
- La blockchain sert au partage entre institutions et à la vérification par un tiers.

## Cas de démo
**ALBA**, agent « comptes fournisseurs » qui paie en stablecoin de test sur Fuji. Une facture piégée change le bénéficiaire et fractionne le montant. **BORA**, agent d'une autre entreprise, jamais attaqué, devient immun.

## Démo 5 min (V5)
1. ALBA est piégé → paiement visible sur Snowtrace.
2. Autopsie : timeline dont chaque phrase renvoie à la trace qui la prouve.
3. « Essai clinique » du vaccin : variantes jamais vues bloquées, 0 faux positif sur la paie légitime → signature humaine → `VaccinePublished` sur Fuji.
4. BORA reçoit la même attaque → `TxBlocked` ; son score ERC-8004 monte.
5. Le jury propose sa propre attaque.
Chute : le « passeport immunitaire » de l'agent consulté par une banque ou un assureur.

## Stack
- Agents : TypeScript, boucle d'outils maison sur Bedrock Converse.
- Passerelle de vaccins : politiques JSON + json-logic, même code en arène et en prod ; option AWS AgentCore Policy (Cedar).
- On-chain (Fuji, Hardhat déjà dans `blockchain/`) : `HorizonEUR` (token de test), `HorizonTreasury` / `GuardedVault` (plafonds, blocage sans revert, kill switch), `VaccineRegistry` ; registres ERC-8004 existants pour le carnet de vaccination.
- Front : Next.js + SSE, viem. Stockage : SQLite.
- Scénarios : AgentDojo banking, InjecAgent, 7 familles mappées ASI/ATLAS/ATT&CK.
- ICM (propagation inter-L1) : bonus hors chemin critique.

## Banc de validation d'un vaccin (V1)
≥ 95 % de 20 variantes bloquées · 0 faux positif sur 80 cas légitimes de référence · ≤ 0,1 % sur l'historique synthétique · non-régression · jumeau légitime qui passe · quorum 2 sur 3 avant publication.

## Métriques affichées
Taux d'attaques réussies avant/après (variantes jamais vues, avec n et intervalle de confiance) · faux positifs sur ≥ 200 paiements légitimes · temps incident → vaccin (cible < 10 min hors humain) · transfert vers agents jamais exposés · € fictifs protégés.

## Conformité et jury
- **KPMG** :
  - DORA art. 24-25 (tests de base) ; on **prépare** les TLPT sans prétendre les remplacer ;
  - classification d'incident et pré-rapport ;
  - AI Act art. 15 ;
  - responsabilité : l'entité financière reste responsable (DORA art. 5 et 28).
- **Team1 Avalanche** : Fuji, ERC-8004, piste 4 de la Track 1 (surveillance, pause, alertes) ; financement Builder Grants / Retro9000.
- **Kryptosphère** : scénarios DeFi sur l'agent de trésorerie.
- **AWS** : Bedrock + AgentCore.

## Business (hypothèses)
Fintechs et néobanques UE sous DORA, puis CASP MiCA, éditeurs d'agents, protocoles DeFi ; canal assureurs (modèle AIUC-1). 500 à 2 000 €/agent/mois + dossier de preuves pour l'auditeur.

## Playbook (Track 1)
Tout ce qui réduit l'autonomie de l'agent est automatique. Tout ce qui l'augmente ou engage l'entité à l'extérieur reste humain : classification en incident majeur, notification au régulateur, déploiement d'un vaccin, déclaration de soupçon.

## Risques principaux
- **Claude trop robuste pour se faire piéger** : viser la confusion d'autorité et de provenance, mesurer une baseline sur un petit modèle (annoncé), garder une cassette de secours.
- **Ressembler à du red teaming** : montrer la détection en prod simulée.
- RPC Fuji, faucet, latence Bedrock.

## À faire par Adem avant 11h30
1. Vérifier les modèles et quotas Bedrock.
2. Wallet Fuji dédié + AVAX de test pour 4 adresses (clé dans `blockchain/.env`).
3. Vérifier les adresses ERC-8004 sur Snowtrace.
4. Figer les seuils de l'essai clinique dans `coord/DECISIONS.md`.
5. Valider avec Titouan, puis découper en tâches `coord/tasks/`.
