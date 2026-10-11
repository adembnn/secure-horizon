---
id: T-105
title: Sites de démo (fausse offre, faux support, vrai swap) + console jury
lane: tech
status: doing
owner: titouan
agent: builder-frontend
branch: t/T-105
depends_on: []
files: ["app/demo-sites/**", "coord/reports/T-105.md"]
test: "cd app/demo-sites && npm install && npm run build"
nist_csf: [Detect]
threat_refs: [T1566, T1656]
deadline: 2026-10-11T07:00+02:00
budget_usd: 6
created_by: claude-adem
updated: 2026-10-11T01:05+02:00
---
## Objectif
Une application web Vite et React (`app/demo-sites`) qui sert les scènes de la démo live sur Fuji, avec des données synthétiques et des marques fictives. **Aucune imitation d'une vraie marque** : pas de logo ni de nom Ledger, Coinbase ou MetaMask. On utilise des noms fictifs, par exemple « NovaWallet Support ». Tu peux créer `app/demo-sites/package.json`.

## Critères d'acceptation (DoD)
- [ ] `/offre` : un site de « remboursement / cadeau » crédible pour le grand public, qui demande à l'utilisateur de « valider pour recevoir 50 USDC ». En réalité, il demande une signature `permit` (EIP-712) au profit du drainer (adresse lue dans `deployments.fuji.json` produit par T-101, ou saisie dans un champ de config).
- [ ] `/support` : une fausse conversation de support, sous forme de page de chat simulée et scriptée. Le faux agent explique que « ton portefeuille est compromis, transfère tout vers ce coffre sécurisé », avec un bouton « copier l'adresse » qui copie l'adresse sosie.
- [ ] `/swap` : un vrai swap légitime sur `DemoRouter`, avec une approbation bornée. C'est le témoin qui ne doit PAS déclencher d'alerte.
- [ ] `/historique` : une fausse page d'historique où l'adresse sosie apparaît à côté de la vraie (scène d'empoisonnement).
- [ ] `/console` : la console du jury. Elle affiche en direct les verdicts reçus par l'API locale (polling de `GET http://127.0.0.1:8787/events` si disponible, sinon un mock) : intention, effets, verdict, latence. Elle sert aussi de bouton pour lancer `deploy-fresh-drainer` (affichage de la commande à copier : la page n'exécute rien côté serveur).
- [ ] Connexion au wallet via EIP-1193 (`window.ethereum`) et viem, réseau Fuji 43113.
- [ ] Design soigné, lisible sur un projecteur, en français. README avec le déroulé de la démo (scènes et clics) et rapport `coord/reports/T-105.md`.

## Contexte / liens
docs/intent-barrier.md ; D-007 ; CLAUDE.md (données synthétiques, aucune action contre un système réel).
