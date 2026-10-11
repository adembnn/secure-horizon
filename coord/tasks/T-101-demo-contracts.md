---
id: T-101
title: Contrats de démo (token avec permit, drainer, routeur légitime) + déploiement Fuji
lane: tech
status: done
owner: none
agent: builder-backend
branch: t/T-101
depends_on: []
files: ["blockchain/contracts/demo/**", "blockchain/test/demo/**", "blockchain/scripts/demo/**", "coord/reports/T-101.md"]
test: "cd blockchain && npx hardhat test test/demo/*.js"
nist_csf: [Detect]
threat_refs: [T1566, T1657]
deadline: 2026-10-11T07:00+02:00
budget_usd: 6
created_by: claude-adem
updated: 2026-10-11T01:05+02:00
---
## Objectif
Fournir les contrats synthétiques qui reproduisent les vrais schémas d'arnaque, pour la démo live sur Fuji et pour le banc d'essai. Lis `docs/intent-barrier.md`.

## Critères d'acceptation (DoD)
- [ ] `DemoUSDC` : ERC-20 6 décimales avec EIP-2612 `permit` (OpenZeppelin ERC20Permit), `mint` libre pour la démo.
- [ ] `DemoNFT` : ERC-721 minimal (pour setApprovalForAll).
- [ ] `FreshDrainer` : reproduit le schéma réel d'un kit de drainer. Il reçoit un `permit` signé hors chaîne puis appelle `permit` + `transferFrom` pour tout le solde vers un collecteur. Il gère aussi le cas `approve` puis `sweep`, et le cas `setApprovalForAll` puis `sweepNFT`. Ce contrat ne doit être déployé que sur nos réseaux de test.
- [ ] `DemoRouter` : routeur de swap légitime minimal (DemoUSDC ↔ DemoWAVAX à taux fixe), qui exige une approbation bornée et envoie au `msg.sender`.
- [ ] `DemoWAVAX` : ERC-20 simple.
- [ ] Scripts `blockchain/scripts/demo/deploy-all.js` (déploie tout et écrit les adresses dans `blockchain/scripts/demo/deployments.<network>.json`) et `deploy-fresh-drainer.js` (déploie UN drainer neuf en une commande, < 10 s sur Fuji, affiche l'adresse et le lien Snowtrace testnet). Réseau via `--network fuji` (config existante, clé lue uniquement depuis la variable d'env, jamais écrite) ou `hardhat` local.
- [ ] `blockchain/scripts/demo/poison-address.js` : génère localement une adresse sosie (mêmes 4 premiers et 4 derniers caractères hexa qu'une adresse cible) par recherche de clés aléatoires ; affiche la paire. Prévoir un nombre de caractères paramétrable (défaut 4+4 ; si trop lent en JS, documenter le temps mesuré et descendre à 3+3).
- [ ] Tests Hardhat : chaque schéma de vol réussit contre une victime qui a signé, échoue sans signature ; le routeur fonctionne.
- [ ] Rapport `coord/reports/T-101.md`.

## Contexte / liens
- docs/intent-barrier.md, coord/DECISIONS.md#D-007
- Aucune action contre un système réel : ces contrats ne visent que nos comptes de test.
