---
id: T-106
title: Banc d'essai — faux positifs, faux négatifs, latence
lane: tech
status: todo
owner: none
agent: builder-backend
branch: t/T-106
depends_on: []
files: ["app/bench/**", "coord/reports/T-106.md"]
test: "cd app/bench && npm install && npm test"
nist_csf: [Detect]
threat_refs: [T1566, T1656, T1657]
deadline: 2026-10-11T07:00+02:00
budget_usd: 8
created_by: claude-adem
updated: 2026-10-11T01:05+02:00
---
## Objectif
Construire un jeu étiqueté et un exécuteur qui mesurent la barrière d'intention selon la méthode de `docs/intent-barrier.md` (section Mesure). Tu peux créer `app/bench/package.json`.

## Critères d'acceptation (DoD)
- [ ] `app/bench/cases/*.json` : chaque cas contient `{ id, family, label: "malicious"|"benign", intent, input, ctx, source }`.
  - **Au moins 60 cas malveillants**, répartis en :
    - permit EIP-2612 ;
    - Permit2 single et batch ;
    - approve illimité vers un contrat neuf ;
    - setApprovalForAll ;
    - délégation 7702 ;
    - multicall qui cache une approbation ;
    - envoi vers une adresse sosie ;
    - « on m'a demandé » et faux support : envoi de 90 % du solde ;
    - faux swap dont le destinataire n'est pas soi.

    Chaque cas porte l'intention que la victime croyait avoir.
  - **Au moins 60 cas légitimes** :
    - paiement à un contact connu ;
    - dépôt vers une adresse d'exchange déjà utilisée ;
    - swap sur un routeur connu avec approbation bornée ;
    - connexion par signature de message simple ;
    - gros envoi légitime vers sa propre adresse ;
    - approbation illimitée vers un routeur connu (cas limite : doit rester `warn` au plus).
  - Tous les cas sont générés avec viem, de façon déterministe à partir d'une graine. Le champ `source` cite le schéma réel imité (Scam Sniffer 2024-2025, étude USENIX sur l'empoisonnement d'adresse, etc.).
- [ ] 30 messages synthétiques étiquetés (faux support, demande de seed, faux remboursement, faux recruteur, et des messages légitimes) pour `classifyMessage`.
- [ ] L'exécuteur `npm run bench` appelle l'API `POST http://127.0.0.1:8787/check` si elle répond. Sinon, il appelle une fonction `check` injectée (adaptateur à brancher plus tard sur T-102/T-103 ; fournir un mock pour les tests). Il produit `app/bench/results/latest.json` et `latest.md` avec :
  - faux négatifs et faux positifs (critical) par famille ;
  - taux de fatigue (warn ou critical sur les cas légitimes) ;
  - latence p50 et p95 ;
  - matrice de confusion des messages.
- [ ] Tests vitest de l'exécuteur et du calcul des métriques.
- [ ] Rapport `coord/reports/T-106.md`, avec les limites : jeu synthétique, biais, ce qu'il faudrait pour un jeu réel (PTXPHISH, PhreshPhish, ScamSniffer DB).

## Contexte / liens
docs/intent-barrier.md ; research/titouan/M_innovation_clef_jev.md §3 (jeux de données) ; D-007.
