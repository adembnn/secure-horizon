---
id: T-102
title: Moteur d'effets — ce que fait réellement une transaction ou une signature
lane: tech
status: doing
owner: titouan
agent: builder-backend
branch: t/T-102
depends_on: []
files: ["app/engine/**", "coord/reports/T-102.md"]
test: "cd app/engine && npm install && npm test"
nist_csf: [Detect]
threat_refs: [T1566, T1657]
deadline: 2026-10-11T07:00+02:00
budget_usd: 8
created_by: claude-adem
updated: 2026-10-11T01:05+02:00
---
## Objectif
Bibliothèque TypeScript (Node 20, ESM, viem, vitest) : `analyze(input, ctx) → Effects`, au format exact de `docs/intent-barrier.md`. Tu peux créer `app/engine/package.json` (exception accordée par Claude-Adem pour ce sous-dossier).

## Critères d'acceptation (DoD)
- [ ] Entrées :
  - `{ kind: "transaction", tx: { from, to, data, value, chainId } }` ;
  - `{ kind: "signature", typedData }` (EIP-712) ;
  - `{ kind: "signature", personalMessage }` ;
  - autorisation EIP-7702 (`authorizationList`).
- [ ] Décodage déterministe :
  - transfer, transferFrom, approve, increaseAllowance, setApprovalForAll ;
  - EIP-2612 Permit (typed data `Permit`), Permit2 (`PermitSingle`, `PermitBatch`, `PermitTransferFrom`) ;
  - multicall et lots imbriqués (au moins `multicall(bytes[])`) ;
  - envoi natif (value) ;
  - délégation 7702.

  `amount = "unlimited"` si ≥ 2^255. Les sélecteurs inconnus sont marqués et non devinés.
- [ ] Simulation optionnelle via un RPC fourni (`ctx.rpcUrl`, par exemple un nœud Hardhat lancé avec un fork de Fuji). Utiliser `eth_call` pour vérifier que la tx ne revert pas, et les lectures `balanceOf`, `decimals`, `symbol`. Sans RPC, le module doit fonctionner en décodage pur.
- [ ] Contexte utilisateur (`ctx.history` : liste d'adresses déjà utilisées, avec leur libellé ; `ctx.balances`) pour remplir `counterparties[].firstSeenByUser`, `lookalikeOf` (mêmes 4 premiers et 4 derniers caractères hexa sans être identique, insensible à la casse) et `shareOfBalancePct`.
- [ ] `isContract` et `ageBlocks` via RPC (`getCode`, plus une recherche du bloc de création par dichotomie sur `getCode` à un bloc donné, bornée à environ 20 appels) ; absents sans RPC.
- [ ] Au moins 25 tests vitest à partir de calldata et typed data construits avec viem, couvrant chaque schéma, plus les cas sosie et unlimited.
- [ ] Performance : décodage pur < 20 ms par cas (mesuré dans un test).
- [ ] README court dans `app/engine/` et rapport `coord/reports/T-102.md`.

## Contexte / liens
docs/intent-barrier.md ; D-007 ; research/titouan/K_delais_drainers.md (§3 : répartition permit / approve / Permit2 / 7702).
