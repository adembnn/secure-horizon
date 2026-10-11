# Couverture des menaces — Famille 1 : PHISHING PAR SIGNATURE

Date : 2026-10-11. Cible : `app/intent/src/compare.ts` + `types.ts` (worktree `C:\Users\Adem\wt\T-103`).
Convention : les numéros de ligne renvoient à `compare.ts`. Sources marquées **[V]** = ouvertes/recoupées pendant cette recherche ; **[M]** = connues mais non rouvertes (à revérifier avant de les citer au jury).

## 0. Ordre de grandeur (pour le pitch)

| Chiffre | Source |
|---|---|
| 2023 : ~295-300 M$ volés par wallet drainers, ~320-324 k victimes | Scam Sniffer, https://drops.scamsniffer.io/scam-sniffer-2023-crypto-phishing-scams-drain-300-million-from-320000-users **[V]** |
| 2024 : 494 M$, 332 k adresses, plus gros vol 55,5 M$ ; **56,7 % des vols de drainers = signature Permit** | https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million ; https://www.infosecurity-magazine.com/news/scammers-drain-500m-crypto-wallets ; ryder.id (56,7 %) **[V]** |
| 2025 : 83,85 M$, 106 106 victimes (-83 % valeur), plus gros vol 6,5 M$ (Permit, sept. 2025) ; Permit/Permit2 = 38 % des pertes des cas > 1 M$ ; perte moyenne ~790 $ | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million ; https://finance.yahoo.com/news/wallet-drainer-phishing-losses-fall-092600947.html **[V]** |
| Kits : Inferno (>80 M$, >16 000 domaines, de retour en 2025), Pink (~85 M$/21 k victimes, retraite mai 2024), Angel | ryder.id, deepstrike.io **[V, secondaire]** |
| Approval phishing depuis mai 2021 : >2,7 Md$ (Chainalysis) | cité par cryptopolitan/coinstats **[V secondaire, source primaire non rouverte]** |
| >90 % des délégations EIP-7702 observées en juin 2025 pointaient vers des contrats malveillants (Wintermute) | https://finance.yahoo.com/news/crypto-investor-loses-1m-uniswap-183021483.html **[V secondaire]** |

Lecture : la baisse 2025 est attribuée aux avertissements/simulations des wallets. C'est précisément notre créneau, mais il faut dire que les attaquants se sont déplacés (EIP-7702, spoofing de simulation, pertes plus fréquentes et plus petites : ~790 $/victime = la cible grand public).

## 1. Ce que `compare.ts` fait réellement (audit préalable)

Constats transversaux qui conditionnent toutes les fiches :

- **C1** — Les approbations ne sont évaluées que par intent : `pay_someone` (L213, tout approval = critical), `send_to_my_account` (L288), `connect_or_accept_offer` (L406), `buy_or_swap` (L326 illimité = warn seulement ; L357 permit/permit2 critical **seulement si spender < 50 blocs**). `asked_by_someone` : tout approval = critical (L100).
- **C2** — `buy_or_swap` est l'intent le plus utilisé et le plus piégé, et il n'a **aucune règle** sur : spender inconnu non récent, montant fini, durée d'expiration, délégation 7702 (`hasDelegation` jamais appelé dans `checkBuyOrSwap`), setApprovalForAll, nombre de tokens approuvés, ni sur l'absence d'`incoming` quand il n'y a pas d'`outgoing` (L338 exige `outgoing.length > 0` : une signature Permit seule, qui n'a aucun outgoing, passe en **ok**).
- **C3** — `expiry` existe dans `Effects.approvals` mais n'est lu nulle part.
- **C4** — Seuil de jeunesse : `NEW_CONTRACT_THRESHOLD_BLOCKS = 50` (L13) ~ 10 min sur Ethereum (12 s) mais ~ 100 s sur Avalanche (2 s). Un drainer déploie son contrat des heures/jours avant la campagne : le signal ne se déclenche presque jamais. Unité à passer en temps (secondes/jours), pas en blocs.
- **C5** — `confidence` vaut 1.0 en dur (L90) et n'est jamais baissée : la règle `low_confidence` (L180) est du code mort. Une signature opaque (eth_sign, typed data inconnu) devrait la faire chuter.
- **C6** — Bug FP : `hasApprovals` (L35) compte une **révocation** (`approve(spender, 0)`) comme approbation → critical en `pay_someone`/`connect`. Un utilisateur qui nettoie ses droits est bloqué.
- **C7** — `checkPaySomeone` n'examine que `approvals[0]` pour le texte (L214) ; avec N approvals (multi-token) le niveau est bon mais le message sous-estime. `amount_exceeded` (L261) compare des `parseFloat` sans vérifier que `out.token === intent.token` (FP/FN entre tokens de décimales différentes).
- **C8** — `isLookalike` (L21) n'est pas utilisé ; on se repose sur `cp.lookalikeOf` fourni par le moteur.
- **C9** — Aucun concept dans `Effects` de : ordre signé (Seaport/Blur/UniswapX/CoW/Fusion), transfert d'autorité (`setOwner`, `transferOwnership`, `addOwner`), délégation de vote, signature opaque, domaine EIP-712 (chainId/verifyingContract), valeur USD des entrées vs sorties.

### Extension minimale proposée de `types.ts` (réutilisée dans les fiches)

```ts
interface Effects {
  // ... existant
  signature?: {
    method: 'eth_sign'|'personal_sign'|'eth_signTypedData_v4'|'eth_sendTransaction';
    opaque: boolean;                 // true si non décodable (hex brut, primaryType inconnu)
    domain?: { name?: string; chainId?: number; verifyingContract?: `0x${string}` };
    deadline?: number;               // epoch s, 0/undefined = aucune
    nonce?: string;
  };
  approvals: Array<{ /* existant */
    standard?: 'erc20'|'erc2612'|'dai-permit'|'permit2-single'|'permit2-batch'|'permit2-transfer'|'erc721-all'|'erc1155-all'|'increase';
    isRevocation?: boolean;          // amount == 0 ou approved=false
    spenderIsContract?: boolean;
    spenderAgeSeconds?: number;      // remplace ageBlocks pour les règles
    spenderFirstSeenByUser?: boolean;
    tokenUsd?: number;               // valeur exposée (solde × prix), pas le montant nominal
    batchSize?: number;
  }>;
  orders?: Array<{                   // Seaport, Blur, UniswapX, CoW, Fusion, Permit2 witness
    kind: 'nft_listing'|'nft_offer'|'swap_order'|'permit_transfer_witness';
    offered: { token: string; amountUsd?: number; count?: number }[];
    consideration: { token: string; amountUsd?: number; recipient: `0x${string}` }[];
    receiver?: `0x${string}`;        // destinataire des sorties
    minOutUsd?: number; deadline?: number;
    zone?: `0x${string}`; conduit?: `0x${string}`;
  }>;
  authority?: Array<{                // changement de contrôle
    kind: 'setOwner'|'transferOwnership'|'addOwner'|'changeThreshold'|'delegatecall'|'upgradeTo'|'vote_delegate';
    target: `0x${string}`; newController: `0x${string}`;
  }>;
  delegation?: { /* existant */ chainId?: number /* 0 = toutes chaînes */; codeAgeSeconds?: number; codeVerified?: boolean };
  incomingUsd?: number; outgoingUsd?: number;   // somme valorisée
  simulatedAtBlock?: number; envDependent?: boolean; // le trace lit NUMBER/TIMESTAMP/BALANCE/COINBASE
}
```

## 2. Tableau récapitulatif

Couverture : O = oui, P = partiel, N = non. Prévalence : F = fréquent (>10 % des pertes drainer), M = moyen, R = rare/émergent.

| # | Menace | Prévalence | Couvert | Gravité sans règle | Règle proposée (id) |
|---|---|---|---|---|---|
| 1 | EIP-2612 `permit` (ERC-20 standard) | F | P (buy_or_swap = trou) | Perte totale d'un token | R-SIG-01 |
| 2 | DAI `permit` (allowed bool, pas de montant) | M | P (amount mal défini) | Perte totale DAI | R-SIG-02 |
| 3 | Permit2 `PermitSingle` / `PermitBatch` | F | P | Perte multi-tokens | R-SIG-03 |
| 4 | Permit2 `PermitTransferFrom` / witness | M | N | Perte immédiate, nonce unique | R-SIG-04 |
| 5 | `increaseAllowance` / `approve` illimité sur tx | F | P | Perte totale | R-SIG-05 |
| 6 | `setApprovalForAll` / `isApprovedForAll` | F (NFT) | P | Perte collection | R-SIG-06 |
| 7 | Ordres Seaport/OpenSea/Blur (zero/low price, private listing) | F (NFT) | N | Perte NFT pour ~0 | R-SIG-07 |
| 8 | Ordres UniswapX / CoW / 1inch Fusion détournés | R | N | Perte vers receiver tiers / minOut≈0 | R-SIG-08 |
| 9 | `eth_sign` / `personal_sign` aveugles (hash/hex opaque) | M | N | Total (rend un tx hash signable) | R-SIG-09 |
| 10 | EIP-712 domaine falsifié / chainId différent / verifyingContract incohérent | M | N | Replay/signature acceptée ailleurs | R-SIG-10 |
| 11 | Délégation de vote / transfert d'autorité (`setOwner`, Safe) | M (gros montants) | N | Jusqu'à 55 M$ | R-SIG-11 |
| 12 | Permits non standards (USDC v2 `transferWithAuthorization`/`receiveWithAuthorization`) | M | N | Perte USDC | R-SIG-12 |
| 13 | Approvals multi-tokens en une seule demande (batch tx/7702 execute) | F (2025) | P | Wallet vidé | R-SIG-13 |
| 14 | Ice phishing / approval phishing classique (tx `approve` vers contrat frais) | F | P | Total | R-SIG-14 (fusion 1,5,6) |
| 15 | Délégation EIP-7702 (authorization tuple) | R→M (croissant) | P (pas en swap) | Compte entier | R-SIG-15 |
| 16 | Spoofing de simulation (état dépendant du bloc) | R | N | Contourne le moteur lui-même | R-SIG-16 |
| 17 | Révocation traitée comme approbation (FP) | — | Bug | UX/FP | R-SIG-00 |

---

## 3. Fiches

### Fiche 1 — EIP-2612 `permit` (signature gasless de type `Permit`)

- **Mécanisme** : typed data `Permit(owner, spender, value, nonce, deadline)` signé hors chaîne ; l'attaquant l'envoie à `token.permit()` puis `transferFrom`. Aucune tx, aucune trace, pas de révocation possible par `approve(0)` avant soumission (seul `nonce` consommé ou deadline expirée l'invalide). Spec : https://eips.ethereum.org/EIPS/eip-2612 **[M]**.
- **Incidents** : 28 sept. 2024, 12 083 spWETH (~32,4 M$) via signature Permit (cointab.com/pepe-holder-loses-1-3m, citant Scam Sniffer **[V secondaire]**) ; sept. 2025, ~6,5 M$ (plus gros vol 2025, signature Permit) (Scam Sniffer 2025, yahoo.com ci-dessus **[V]**) ; 56,7 % des vols de drainers 2024. Rappel 11 mars 2023 : ~7 M$ en un jour, phishing « Circle » pendant le dépeg USDC **[V]**.
- **Prévalence** : la plus élevée de la famille (cf. §0).
- **Ce que voit le moteur** : `kind:'signature'`, `raw.primaryType:'Permit'`, `approvals[{via:'permit', spender, amount:value, expiry:deadline}]`, `outgoing:[]`, `incoming:[]`.
- **Couvert** : **partiel**. `pay_someone`/`send_to_my_account`/`connect`/`asked_by_someone` → critical (L213, L288, L406, L100). `buy_or_swap` → **trou** : rien sauf si `spender.ageBlocks < 50` (L357), cf. C1/C2/C4. Cas bloquant : permit `value=uint256.max`, spender EOA ou contrat de 3 jours, intent swap → verdict **ok** (si `amount` reporté 'unlimited' → warn L326, pas critical).
- **Règle R-SIG-01** :
  ```
  for a in approvals where a.standard in {erc2612,permit} and !a.isRevocation:
    if intent in {pay_someone,send_to_my_account,connect_or_accept_offer,asked_by_someone}: CRITICAL   // déjà là
    if intent == buy_or_swap:
       exposureUsd = a.amount=='unlimited' ? a.tokenUsd : min(valueUsd(a.amount), a.tokenUsd)
       spenderTrusted = a.spenderIsContract && a.spenderAgeSeconds > 30j && a.spender appears in effects.counterparties with isContract && matches routeur DÉCODÉ (cf. objection)
       if !spenderTrusted: CRITICAL
       elif a.amount=='unlimited' || exposureUsd > 1.5 * outgoingUsd: WARN
       if a.deadline absent or > now+30j: WARN
  if signature-only && intent==buy_or_swap && incoming empty && outgoing empty: WARN("signature qui ne produit aucun échange")
  ```
  Champs : `approvals[].tokenUsd`, `spenderAgeSeconds`, `signature.deadline`, `outgoingUsd`.
- **Objection du praticien** : « Uniswap, 1inch, Paraswap demandent des permits légitimes en swap, vous allez crier au loup à chaque swap. Et "routeur connu" = liste en dur. » **Parade** : pas de liste d'adresses ; critère fonctionnel : le spender est-il la **même contrepartie** vers laquelle la tx/ordre de swap est adressée dans la même session (le `to` de la tx de swap ou le `verifyingContract` du bundle) et a-t-il un âge > 30 j et du bytecode ? Un permit dont le spender ≠ cible du swap décodé est la signature typique du drainer. Cohérence montant : `value` ≈ montant de sortie (tolérance 1,5×) sinon warn, pas critical.
- **Risque FP** : moyen en swap illimité (Uniswap demande parfois `max`). Mitigation : warn (pas critical) quand spender = cible du swap et âgé.
- **Cas de test Fuji** : déployer un ERC-20 OpenZeppelin `ERC20Permit` de test (tokens fictifs, wallet de test jetable généré localement, aucune clé dans le repo). Intent `buy_or_swap` de 10 TST. Faire signer `eth_signTypedData_v4` `Permit{owner, spender=EOA fraîche, value=2^256-1, deadline=now+1y}`. Attendu : critical. Contrôle négatif : spender = contrat routeur de test déployé il y a > 30 j (ou horodatage forgé en fixture), `value`=10, deadline=+30 min → ok.
- **Mapping** : ATT&CK T1566.002 (lien d'hameçonnage) + T1204.001 (exécution utilisateur) + T1528 (vol de jeton d'accès applicatif : l'allowance joue ce rôle) + T1657 (vol financier) ; D3FEND D3-UBA (User Behavior Analysis), D3-RAPA (Resource Access Pattern Analysis) — IDs à valider sur d3fend.mitre.org ; NIST CSF 2.0 DE.AE-02 (analyse d'événements), DE.AE-04 (impact), PR.AA-05 (moindre privilège), RS.MI-01 (confinement : on bloque avant signature).

### Fiche 2 — DAI `permit` (non standard)

- **Mécanisme** : `permit(holder, spender, nonce, expiry, allowed:bool, v,r,s)` : pas de montant, `allowed=true` = illimité. Les parseurs naïfs lisent `value` et trouvent rien → affichent « 0 ». Code : https://github.com/makerdao/dss/blob/master/src/dai.sol **[M]**.
- **Incidents** : inclus dans les statistiques Permit ci-dessus ; l'incident DAI de 55 M$ (20 août 2024) est **différent** (transfert de propriété DSProxy, cf. Fiche 11) mais confondu dans la presse. Pas de perte chiffrée spécifique « DAI permit » retrouvée : **[à ne pas affirmer]**.
- **Ce que voit le moteur** : `primaryType:'Permit'` avec champ `allowed`. Si l'adaptateur ne mappe pas `allowed` → `amount:'0'` ou absent.
- **Couvert** : **partiel** ; si l'engine ne marque pas `unlimited`, `unlimited_approval_swap` (L326) ne tire pas et la parité 'amount 0 ⇒ rien' peut cacher le risque (C6 inverse).
- **Règle R-SIG-02** : `if standard=='dai-permit' && allowed==true → approvals.amount = 'unlimited' ; isRevocation=!allowed` (normalisation côté moteur d'effets, puis règles de la fiche 1). Test de non-régression : `allowed=false` ⇒ `isRevocation=true` ⇒ jamais critical.
- **Objection** : « Il y a peu de tokens DAI-style, pourquoi ? » **Parade** : DAI est le plus gros stablecoin décentralisé, et la normalisation est 3 lignes ; sans elle un `allowed:true` est invisible.
- **FP** : nul si normalisé. **Test Fuji** : déployer une copie de `Dai` (DSS, ou stub avec la même `PERMIT_TYPEHASH`) ; signer `allowed=true` pour spender frais en intent swap → critical ; `allowed=false` → ok.
- **Mapping** : identique fiche 1 (T1528, T1566, D3-UBA, DE.AE-02, PR.AA-05).

### Fiche 3 — Permit2 `PermitSingle` / `PermitBatch`

- **Mécanisme** : Permit2 (`0x000000000022D473030F116dDEE9F6B43aC78BA3` sur Ethereum et chaînes majeures) : l'utilisateur fait **une fois** `approve(Permit2, max)` par token, puis des signatures `PermitSingle{details{token, amount(uint160), expiration, nonce}, spender, sigDeadline}` ou `PermitBatch{details[]}` autorisent n'importe quel spender. Un drainer cible les wallets qui ont déjà approuvé Permit2 (669 k adresses en mai 2023, Scam Sniffer). Docs : https://docs.uniswap.org/contracts/permit2/overview **[M]**.
- **Incidents** : 13 oct. 2024, 1,39 M$ (PEPE, MSTR, APU) en un `permit2` (Scam Sniffer sur X, relayé par cointab.com **[V secondaire]**) ; 18 août 2025, 167 342 $ de LINK (Gate News citant Scam Sniffer **[V secondaire]**) ; 9 mai 2023 : Scam Sniffer lance l'outil de gestion Permit2 après vague de victimes (https://drops.scamsniffer.io/introducing-uniswap-permit2-authorization-management **[V]**). Permit/Permit2 = 38 % des pertes > 1 M$ en 2025.
- **Ce que voit le moteur** : `approvals[]` à N entrées (batch), `via:'permit2'`, `amount` uint160 (max = 2^160-1), `expiry` (peut être 2^48-1 = « jamais »).
- **Couvert** : **partiel** : mêmes trous que fiche 1. Spécifique : (a) `amount` Permit2 max n'est pas `'unlimited'` si le moteur compare à 2^256 ; (b) `approvals[0]` seul dans le message (C7) ; (c) `expiration` ignorée (C3).
- **Règle R-SIG-03** :
  ```
  for batch in permit2 approvals grouped by signature:
    if batch.size >= 3 && intent != buy_or_swap-multi-hop: CRITICAL  // un swap n'a besoin que du token d'entrée
    if intent==buy_or_swap && exists a where a.token not in {tokens des outgoing du swap décodé}: CRITICAL
    if a.amount >= 2^160-1 (=unlimited) or a.expiry - now > 30j: WARN
    if a.spender != txTarget(swap) : CRITICAL
  ```
  Champs : normaliser `unlimited` pour 2^160-1, `batchSize`, `expiry`.
- **Objection** : « Un swap Uniswap légitime signe un `PermitSingle` avec `amount=max` et expiration 30 j (c'est la valeur par défaut de l'UI). » **Parade** : le critère critique n'est pas le montant mais **spender ∉ cible du swap** et **token ∉ tokens du swap** ; pour le défaut Uniswap on reste en warn avec message « autorisation valable 30 jours », jamais critical.
- **FP** : moyen (Uniswap par défaut) → warn. **Test Fuji** : vérifier que Permit2 est déployé à l'adresse canonique sur Fuji (`eth_getCode`) ; sinon le déployer depuis https://github.com/Uniswap/permit2 (hardhat/forge, wallet de test). Étapes : `approve(Permit2,max)` d'un TST, signature `PermitBatch` de 3 tokens de test vers EOA fraîche en intent « payer Paul » → critical ; en intent swap avec spender = routeur de test et token d'entrée seul → ok/warn.
- **Mapping** : T1528, T1566.002, T1204 ; D3-UBA, D3-RAPA ; DE.AE-02, DE.AE-04, PR.AA-05.

### Fiche 4 — Permit2 `PermitTransferFrom` / `PermitWitnessTransferFrom`

- **Mécanisme** : signature `PermitTransferFrom{permitted{token,amount}, spender, nonce, deadline}` : autorise un **transfert immédiat unique** (nonce bitmap), pas une allowance : n'apparaît pas dans les listes d'approvals/revoke.cash. La variante **witness** ajoute des données (ex : UniswapX order, destinataire) ; si le wallet n'affiche pas le witness, l'utilisateur ne voit que « token, montant ».
- **Incidents** : pas d'incident chiffré public spécifique retrouvé (les rapports agrègent « Permit2 »). **[Je ne l'affirme pas]**. Menace à traiter par analogie, justifiée par le fait que c'est l'autre mode d'utilisation de Permit2 et qu'il échappe aux outils de révocation.
- **Moteur** : `primaryType:'PermitTransferFrom'|'PermitWitnessTransferFrom'`, `outgoing` potentiel (le transfert se réalisera) mais `approvals` vide si l'adaptateur ne le modélise pas.
- **Couvert** : **non** (le moteur ne sait pas que cette signature = sortie différée ; avec `outgoing:[]` le check `wrong_recipient`/`amount_exceeded` ne tire pas).
- **Règle R-SIG-04** : `permit_transfer → synthétiser outgoing{token, amount, to: spender or witness.recipient}` puis appliquer les règles de sortie existantes (L241-L273) ; si `witness` non décodable → `signature.opaque=true` (R-SIG-09).
- **Objection** : « Sans ABI du witness, comment décoder ? » **Parade** : le witness est dans le typed data (types déclarés) ; on décode les champs `address`/`uint` génériques et on cherche tout champ `address` ≠ owner ; si le type est inconnu → opaque (warn max) plutôt que silence.
- **FP** : faible (signature rare hors Uniswap/Universal Router). **Test Fuji** : Permit2 déployé, signer `PermitTransferFrom` 100 TST vers EOA fraîche en intent « payer Paul (adresse X) » → wrong_recipient critical après synthèse ; vers X → ok.
- **Mapping** : T1657, T1566 ; D3-RAPA ; DE.AE-02 ; RS.MI-01.

### Fiche 5 — `increaseAllowance` / `approve` illimité (transactions)

- **Mécanisme** : même effet que permit mais en tx, contournant les contrôles qui ne regardent que `approve` (`increaseAllowance`, `increaseApproval`, `approve` via multicall). Ice phishing (terme Microsoft, fév. 2022).
- **Incidents** : agrégés dans les 494 M$ ; Chainalysis > 2,7 Md$ approval phishing depuis 2021 **[V secondaire]**. Pas d'incident `increaseAllowance` isolé chiffré retrouvé.
- **Moteur** : `approvals[{via:'increaseAllowance', amount: delta}]` (delta fini mais cumulatif : allowance actuelle + delta non connue).
- **Couvert** : **partiel** : `increaseAllowance` traité dans le switch descriptif (L413) mais jamais au niveau de gravité en swap ; delta fini ne déclenche pas `unlimited` alors que l'allowance cumulée peut l'être.
- **Règle R-SIG-05** : `effectiveAllowance = currentAllowance + delta (lecture RPC) ; unlimited si ≥ 2^255 ou ≥ 10 × solde`. Champ : `currentAllowance`. Puis fiche 1.
- **Objection** : « Lire l'allowance courante coûte un appel RPC et ajoute de la latence. » **Parade** : un seul `eth_call` en parallèle de la simulation (déjà nécessaire), cache 30 s ; si indisponible → on garde `amount` nominal et on baisse `confidence`.
- **FP** : faible. **Test Fuji** : TST avec `increaseAllowance(spender, 1)` sur un spender qui a déjà `max` → effective unlimited ; intent pay → critical (déjà), intent swap → critical si spender hors cible.
- **Mapping** : T1528, T1204 ; D3-RAPA ; DE.AE-02 ; PR.AA-05.

### Fiche 6 — `setApprovalForAll` (ERC-721/1155)

- **Mécanisme** : un seul appel donne l'accès à **toute la collection** à un opérateur ; l'attaquant vide ensuite (`transferFrom`). Variante : approvals sur plusieurs collections en batch.
- **Incidents** : classique 2022-2023 (OpenSea) ; en 2023-2025 la part NFT diminue mais reste (Seaport, cf. fiche 7). Chiffres NFT 2023 : voir Scam Sniffer 2023 (~300 M$ total, détail NFT/ERC-20 dans le rapport) **[V]**.
- **Moteur** : `approvals[{via:'setApprovalForAll', amount:'unlimited'}]`.
- **Couvert** : **partiel** : critical en pay/send/connect/asked ; en `buy_or_swap` → `hasUnlimitedApproval` → **warn** seulement (L326, avec message « tokens », mal adapté) ; or un swap de tokens ne demande **jamais** `setApprovalForAll`. `hasSetApprovalForAll()` (L63) est défini et jamais appelé.
- **Règle R-SIG-06** : `if a.via=='setApprovalForAll' && !a.isRevocation: if intent != nft_trade (aucun intent NFT n'existe) → CRITICAL` ; si on ajoute l'intent `buy_nft`/`sell_nft`, WARN quand l'opérateur = marketplace actif (conduit Seaport) mais CRITICAL pour toute autre cible. Champ : `approvals[].standard='erc721-all'`, `count`/`valueUsd` (floor × nombre).
- **Objection** : « Lister un NFT sur OpenSea exige `setApprovalForAll` au conduit/OpenSea : bloquer = casser l'usage. » **Parade** : critical uniquement si l'intent n'est pas une vente NFT ; en vente NFT, l'opérateur doit être le conduit du marketplace dont la signature d'ordre est dans la même session (même `zone/conduit`), sinon critical.
- **FP** : moyen pour les NFT natifs ; faible pour le grand public tokens. **Test Fuji** : déployer un ERC-721 de test, `setApprovalForAll(EOA fraîche, true)` avec intent « me connecter » → critical ; `setApprovalForAll(op,false)` (révocation) → ok.
- **Mapping** : T1528, T1566, T1657 ; D3-RAPA ; DE.AE-02 ; PR.AA-05.

### Fiche 7 — Ordres Seaport / OpenSea / Blur (zero-price listing, private listing, bids)

- **Mécanisme** : signature EIP-712 `OrderComponents` (Seaport) : `offer = [NFT du user]`, `consideration = [0 ou 1 wei vers le user]` (ou consideration vers l'attaquant = « private listing »). Aucune tx ; l'attaquant « remplit » l'ordre et prend le NFT. Variante Blur : signature d'ordre `Order` avec prix ≈ 0. Doc : https://github.com/ProjectOpenSea/seaport/blob/main/docs/SeaportDocumentation.md **[M]**.
- **Incidents** : 7 nov. 2023, 17 NFT Mocaverse (~52 000 $) via « Seaport Private Listing » (Cointime/Bitget https://www.bitget.com/news/detail/12560603833910 **[V]**) ; 31 août 2023, rapport BlockSec « NFT Listing Scam » (assets.blocksec.com/metasleuth/phishing/… **[V]**) ; les premières vagues Seaport/Wyvern datent de 2022 (OpenSea, fév. 2022) **[M, non rouvert]**. Pas de chiffre agrégé NFT-listing 2025 retrouvé.
- **Moteur** : `primaryType:'OrderComponents'` (Seaport) ; aujourd'hui `outgoing:[]`, `incoming:[]`, `approvals:[]` → **le moteur voit « rien »**.
- **Couvert** : **non**. Une signature Seaport en intent « me connecter » passe en **ok**. Pire : `connect_or_accept_offer` inclut « accepter une offre », et un ordre Seaport est littéralement une offre.
- **Règle R-SIG-07** :
  ```
  for o in orders where kind in {nft_listing, nft_offer}:
    gainUsd = sum(consideration where recipient == from).amountUsd
    lossUsd = sum(offered).amountUsd (floor price × count)
    if gainUsd < 0.1 * lossUsd:            CRITICAL("tu donnes X, tu reçois ~0")
    if exists c in consideration with recipient != from and recipient not in {fees marketplace décodés <= 5 %}: CRITICAL  // private listing
    if o.deadline - now > 90j:              WARN
    if intent != sell_nft: CRITICAL (aucune signature d'ordre NFT n'est attendue en connexion/paiement/swap)
  ```
  Champs : `orders[]` complet (offered/consideration/recipient), prix floor (oracle publique).
- **Objection** : « Les ordres de vente au prix plancher légitimes sont fréquents ; et le prix floor est faussé/volatil, collections sans floor. » **Parade** : on ne compare pas à un floor mais à `consideration` vers soi : un listing normal reçoit ≥ 90 % de la valeur affichée par l'UI ; critère robuste : le **destinataire** de la consideration (≠ soi) et la **valeur ~0**, indépendants de l'oracle ; sans prix connu → warn « tu donnes un NFT sans contrepartie lisible ».
- **FP** : faible si le critère est le destinataire ; moyen pour les dons/transferts internes (ordres à 0 vers son propre autre compte : exiger `recipient ∈ comptes de l'utilisateur`).
- **Test Fuji** : vérifier Seaport (adresse canonique 1.6 `0x0000000000000068F116a894984e2DB1123eB395` — à confirmer `eth_getCode` sur Fuji, sinon déployer Seaport + conduit controller de test). Minter un ERC-721 de test, signer `OrderComponents` (offer = NFT #1, consideration = 0 pour soi) via `eth_signTypedData_v4` avec intent « me connecter » → critical ; ordre à 1 AVAX test vers soi, intent sell_nft → ok.
- **Mapping** : T1566.002, T1204, T1657 ; D3-UBA ; DE.AE-02, DE.AE-04 ; RS.MI-01.

### Fiche 8 — Ordres UniswapX / CoW Protocol / 1inch Fusion détournés

- **Mécanisme** : on signe un ordre intent-based (swap `tokenIn → tokenOut`, `minOut`, `receiver`, `deadline`) exécuté par des solveurs/fillers. Détournements possibles : (a) `receiver ≠ owner` ; (b) `minOut` ≈ 0 ou token de sortie sans valeur ; (c) `decay`/enchère hollandaise réglée pour que le filler paie 0 ; (d) donnée witness Permit2 non affichée (fiche 4). Docs : https://docs.cow.fi/ , https://docs.uniswap.org/contracts/uniswapx/overview **[M]**.
- **Incidents** : **aucun incident de masse documenté trouvé** pour ces trois protocoles spécifiquement ; la menace est plausible par construction (même surface que fiche 7 + Permit2) et par des signatures d'ordres CoW/Seaport de phishing signalées — **je ne chiffre pas**. À présenter comme « surface émergente » au jury, pas comme fait.
- **Moteur** : `OrderComponents`/`GPv2Order`/`ExclusiveDutchOrder` ; `outgoing` implicite (tokenIn), `incoming` implicite (minOut).
- **Couvert** : **non**. Le check « recipient is self » de `checkBuyOrSwap` (L350-L354) est **vide** (le corps du `if` ne fait rien) : même un swap avec receiver tiers n'est pas détecté ; seule la règle `no_incoming` tire quand `incoming` est vide.
- **Règle R-SIG-08** :
  ```
  for o in orders where kind=='swap_order':
    if o.receiver && o.receiver != from:            CRITICAL("le résultat part vers une autre adresse")
    if o.minOutUsd < 0.8 * valueUsd(tokenIn):       CRITICAL  // slippage non borné
    if tokenOut sans liquidité/âge < 7j (counterparties.token):   WARN
    if o.deadline - now > 24h:                      WARN
  ```
  **Corriger L350-L354** : `if inc.to/receiver != effects.from → critical`.
- **Objection** : « Le slippage tolère 3-5 % ; sur des memecoins illiquides 20 % est normal. » **Parade** : seuil dynamique : critical seulement si `minOut < 50 %` de la valeur d'entrée ; entre 80 % et 95 % warn avec message chiffré.
- **FP** : moyen sur tokens illiquides. **Test Fuji** : pas de déploiement UniswapX/CoW sur Fuji : simuler l'ordre via un contrat de test minimal qui reproduit le typed data (`receiver`, `buyAmount`) ; signer `receiver=EOA tierce` en intent swap → critical.
- **Mapping** : T1565 (manipulation de données/ordre), T1657 ; D3-UBA ; DE.AE-02 ; PR.AA-05.

### Fiche 9 — `eth_sign` / `personal_sign` aveugles

- **Mécanisme** : `eth_sign` signe un hash de 32 octets arbitraire : peut être le hash d'une **transaction** (le wallet n'affiche qu'un hex). `personal_sign` d'un message hexadécimal long ressemblant à du texte : trompe l'utilisateur (« Sign in »). MetaMask désactive `eth_sign` par défaut mais les wallets et clients tiers l'acceptent. Cas extrême : Bybit, 21 fév. 2025, ~1,46 Md$, signataires Safe trompés par une interface falsifiée pour signer un `delegatecall` malicieux (Sygnia/Safe post-mortems **[M, non rouvert]**).
- **Moteur** : `signature.method='eth_sign'`, payload hex non décodable. Aujourd'hui `Effects` n'a aucun moyen de l'exprimer : l'adaptateur renvoie `outgoing:[]` etc. → verdict **ok**.
- **Couvert** : **non**. `confidence` est figée à 1.0 (C5) : `low_confidence` (L180) ne peut jamais tirer.
- **Règle R-SIG-09** :
  ```
  if signature.opaque || signature.method=='eth_sign':
     confidence = min(confidence, 0.3) ; WARN
     if intent != connect_or_accept_offer(SIWE décodable) : CRITICAL
  if personal_sign payload is hex && !EIP-4361(SIWE) : WARN
  SIWE: vérifier que `domain` du message == origin de la page, sinon CRITICAL
  ```
  Champs : `signature.opaque`, `signature.method`, origine de la page (`origin`).
- **Objection** : « Beaucoup de dApps légitimes utilisent `personal_sign` (SIWE, Lens, …) : un warn à chaque connexion est insupportable. » **Parade** : si le message est du texte lisible (SIWE/EIP-4361 avec `domain` = origine) → ok ; seul l'hex opaque ou `eth_sign` → warn/critical. L'intent « connexion » + SIWE conforme = zéro friction.
- **FP** : faible si SIWE décodé. **Test Fuji** : page de test appelant `eth_sign` sur 32 octets aléatoires (clé jetable) → critical ; `personal_sign` d'un message SIWE dont `domain=localhost` sur origine localhost → ok ; domain ≠ origine → critical.
- **Mapping** : T1566, T1036 (déguisement), T1204 ; D3-UBA, D3-URA (analyse d'URL/origine) ; DE.AE-02 ; PR.AT-01 (sensibilisation) ; RS.MI-01.

### Fiche 10 — EIP-712 : domaine falsifié / chainId différent / verifyingContract incohérent

- **Mécanisme** : (a) `domain.chainId` ≠ chaîne affichée → la signature est acceptée par la même application déployée sur une autre chaîne ou (wallets laxistes) rejouée ; (b) `verifyingContract` ≠ contrat du token (ex : un Permit « Dai Stablecoin » pointant vers une fausse instance) ; (c) `name/version` usurpés pour passer pour un protocole connu ; (d) `chainId` absent du domaine → replay inter-chaînes. Voir aussi EIP-7702 `chainId=0`.
- **Incidents** : pas de chiffre propre retrouvé. Menace théorique/émergente, **[non chiffrée]**.
- **Moteur** : `signature.domain` n'existe pas dans `types.ts` ; `raw.primaryType` seul.
- **Couvert** : **non**.
- **Règle R-SIG-10** :
  ```
  if sig.domain.chainId defined && != effects.chainId : CRITICAL
  if sig.domain.chainId undefined && primaryType in permit-like: WARN
  if approval.token != sig.domain.verifyingContract (pour permit) : CRITICAL
  if sig.domain.name claims known protocol && verifyingContract.codeHash != ref : WARN  // nécessite référence, pas liste d'adresses: comparer au token réellement détenu par l'utilisateur
  ```
  Champs : `signature.domain`.
- **Objection** : « MetaMask refuse déjà la signature si chainId ≠ chaîne active. » **Parade** : vrai pour la chaîne active, mais pas pour `chainId` absent ni pour `verifyingContract` incohérent, ni pour wallets/mobile moins stricts ; le coût est de 3 comparaisons.
- **FP** : très faible. **Test Fuji** : signer Permit avec domaine chainId=1 (Ethereum) alors que le wallet est sur Fuji (43113) → critical ; verifyingContract = adresse autre que le token → critical.
- **Mapping** : T1565, T1036 ; D3-UBA ; DE.AE-02 ; PR.DS (intégrité des données).

### Fiche 11 — Délégation de vote et transfert d'autorité (`setOwner`, `delegate`, `transferOwnership`, Safe `addOwner`)

- **Mécanisme** : donner à un tiers le contrôle d'un actif sans mouvement de fonds visible : `delegate(addr)` (ERC20Votes/gouvernance), `DSProxy.setOwner`, `transferOwnership`, Safe `addOwner`/`swapOwner`/`changeThreshold`/`delegatecall`.
- **Incidents** : **20 août 2024, 55,47 M$ de DAI** : la victime a signé `setOwner` d'un DSProxy (vault Maker) vers l'attaquant (Inferno Drainer), qui a ensuite minté le DAI (The Block https://www.theblock.co/news/regulation/2024-08-21-hacking-55-million-dai-inferno-drainer-312326 ; CryptoSlate https://cryptoslate.com/crypto-trader-loses-55m-in-dai-to-phishing-attack-using-inferno-drainer-kit **[V]**). Attention : c'était une **transaction**, pas un Permit. Vol de gouvernance par delegate : pas d'incident chiffré retrouvé.
- **Moteur** : `outgoing:[]`, `approvals:[]` (aucun mouvement de fonds, aucune allowance) → **ok**. C'est LE cas où « aucun effet de valeur » ne veut pas dire « inoffensif ».
- **Couvert** : **non**.
- **Règle R-SIG-11** :
  ```
  for x in effects.authority:
     if x.kind in {setOwner,transferOwnership,addOwner,changeThreshold,delegatecall,upgradeTo}: CRITICAL(any intent except explicit 'manage_account' )
     if x.kind=='vote_delegate' && x.newController != from : WARN
  # détection générique sans ABI : diff de storage simulé — slot "owner" (sélecteurs connus ET diff d'un slot qui contient `from` remplacé par une autre adresse)
  ```
  Champs : `authority[]` ; détecter via sélecteurs (`0x13af4035` setOwner, `0xf2fde38b` transferOwnership, `0x0d582f13` addOwnerWithThreshold, `0x5c19a95c` delegate) **[M, à vérifier avant usage]** et par diff de stockage dans la simulation (plus robuste que les sélecteurs).
- **Objection** : « Un protocole DeFi légitime change parfois l'owner d'un proxy (migration). » **Parade** : c'est précisément l'opération la plus rare et la plus irréversible ; une confirmation supplémentaire par ce qui ressemble à une migration est acceptable (critical = friction forte, pas blocage ; l'utilisateur peut passer outre en recopiant le début de la nouvelle adresse).
- **FP** : faible (opération rare). **Test Fuji** : contrat `Ownable` de test détenant des TST ; tx `transferOwnership(EOA fraîche)` en intent « me connecter » → critical ; `delegate(self)` → ok.
- **Mapping** : T1098 (manipulation de compte), T1657, T1566 ; D3-UAP (permissions de compte utilisateur), D3-UBA ; DE.AE-02, PR.AA-05 ; RS.MI-01.

### Fiche 12 — Permits non standards (USDC `transferWithAuthorization`, `receiveWithAuthorization`, EIP-3009)

- **Mécanisme** : USDC (FiatTokenV2) n'a pas `permit` EIP-2612 sur toutes les chaînes mais **EIP-3009** : signature `TransferWithAuthorization{from,to,value,validAfter,validBefore,nonce}` = **transfert direct**, aucune allowance. Outils de révocation aveugles. (Avalanche : USDC natif supporte EIP-3009 — à confirmer par `eth_call` sur Fuji **[M]**.)
- **Incidents** : pas d'incident chiffré isolé retrouvé ; USDC est inclus dans les pertes de permit (ex. 11 mars 2023, ~7 M$/jour pendant le dépeg USDC, phishing usurpant Circle, Scam Sniffer 2023 **[V]**, sans précision qu'il s'agissait d'EIP-3009).
- **Moteur** : `primaryType:'TransferWithAuthorization'` ; `outgoing` = value vers `to`, mais l'adaptateur doit l'extraire.
- **Couvert** : **non** tant que non adapté (sinon comportement des règles `outgoing` : wrong_recipient L241, amount_exceeded L257).
- **Règle R-SIG-12** : `3009 → outgoing{token, amount:value, to}` ; `validBefore - now > 24h` → WARN ; `receiveWithAuthorization` exige que le caller == `to` : un `to` contrat inconnu → CRITICAL.
- **Objection** : « Les paiements sans gas (x402-like) sont légitimes. » **Parade** : ils respectent la règle du `to` = contrepartie déclarée et expirent vite (minutes) ; durée de vie > 24h = signal.
- **FP** : faible. **Test Fuji** : déployer un token de test avec EIP-3009 ; signer vers EOA tierce en intent « payer Paul » → wrong_recipient critical.
- **Mapping** : T1657, T1566 ; D3-UBA ; DE.AE-02 ; PR.AA-05.

### Fiche 13 — Approvals multi-tokens en une demande (batch tx, `multicall`, 7702 `execute`)

- **Mécanisme** : une seule confirmation = N `approve` ou N permits (kits modernes). Avec EIP-7702 un wallet délégué exécute un batch de `approve` (cas Inferno, 24 mai 2025, 146 551 $ ; 22 août 2025 ~1 M$ d'un faux swap Uniswap, batch signé) — Bitget https://www.bitget.com/news/detail/12560604778641 ; Yahoo https://finance.yahoo.com/news/crypto-investor-loses-1m-uniswap-183021483.html **[V secondaires]**.
- **Moteur** : `approvals[N]`.
- **Couvert** : **partiel** : critical en 4 intents, aucun traitement du nombre ; `approvals[0]` seul dans le texte.
- **Règle R-SIG-13** : `if approvals.length >= 3 || distinct(token) >= 3: CRITICAL sauf intent=batch-sweep explicite ; texte : lister tous les tokens ; exposition = Σ tokenUsd`.
- **Objection** : « Un utilisateur DeFi avancé fait des batchs légitimes (Safe, Rabby). » **Parade** : l'intent `buy_or_swap` ne justifie jamais plus d'un token d'entrée + éventuellement un token de gas ; pour d'autres intents la barrière est de toute façon critical.
- **FP** : faible. **Test Fuji** : 3 TST, un seul `multicall` d'`approve` vers EOA fraîche en intent swap → critical.
- **Mapping** : T1528, T1657 ; D3-RAPA ; DE.AE-02, DE.AE-04 ; PR.AA-05.

### Fiche 14 — Ice phishing / approval phishing classique (tx `approve` vers contrat frais)

- **Mécanisme** : site de faux mint/claim/airdrop → tx `approve(spender, max)`. Spender = contrat jetable, parfois CREATE2 par victime.
- **Incidents** : cœur des 494 M$ (2024) / 295-300 M$ (2023) ; Inferno 5,9 M$ / 4 888 victimes (mai 2023, Decrypt https://finance.yahoo.com/news/inferno-drainer-phishing-scam-pilfering-232321301.html **[V]**) ; Group-IB ~87 M$ / 137 000 victimes sur nov. 2022-nov. 2023 **[V secondaire]**.
- **Moteur** : `approvals`, `counterparties[spender]`.
- **Couvert** : **partiel** : critical en 4 intents ; en swap, seulement si spender < 50 blocs (C4).
- **Règle R-SIG-14** (synthèse des fiches 1/5/6) : spender **jamais vu par l'utilisateur** (`!spenderFirstSeenByUser` inversé) ET (âge < 7 j OU non vérifié) → critical ; âge > 30 j, vu avant par l'utilisateur → ok/warn. **Remplacer** `ageBlocks < 50` par `ageSeconds < 7 j`.
- **Objection** : « Les contrats récents légitimes (nouveau routeur, nouveau protocole) seront bloqués. » **Parade** : critical uniquement si spender nouveau **et** non cible de la transaction décodée ; sinon warn avec âge affiché.
- **FP** : moyen (lancements). **Test Fuji** : contrat « spender » fraîchement déployé, tx `approve` unlimited, intent connect → critical (déjà) ; intent swap → critical (nouveau).
- **Mapping** : T1566, T1204, T1528 ; D3-UBA, D3-URA ; DE.AE-02 ; PR.AT-01.

### Fiche 15 — Délégation EIP-7702 (authorization tuple)

- **Mécanisme** : signature d'un tuple `(chainId, address, nonce)` qui installe du code délégué dans l'EOA ; `chainId=0` = valable sur toutes les chaînes ; le code délégué peut tout exécuter ensuite. Spec https://eips.ethereum.org/EIPS/eip-7702 **[M]**. Étude arXiv 2512.12174 (13 déc. 2025) : >150 k événements, 26 k adresses, délégataires concentrés sur des familles liées à la criminalité **[V]**.
- **Incidents** : 24 mai 2025, 146 551 $ (Inferno Drainer sur wallet MetaMask déjà délégué) ; 22 août 2025, ~1 M$ ; >90 % de délégations malveillantes en juin 2025 (Wintermute) **[V secondaires]**.
- **Moteur** : `delegation:{to, via:'eip7702'}`.
- **Couvert** : **partiel** : critical en pay/connect/asked (L229, L438) ; **absent de `send_to_my_account` et `buy_or_swap`**. Aucun test de l'adresse de délégation (âge du code, vérification).
- **Règle R-SIG-15** : `delegation.to ≠ null → CRITICAL pour tout intent, sauf si l'utilisateur est en flux "activer smart account" ET codeAgeSeconds > 90 j ET codeVerified ; delegation.chainId==0 → CRITICAL`. Appeler `hasDelegation` dans `checkSendToMyAccount` et `checkBuyOrSwap`.
- **Objection** : « 7702 est une vraie amélioration d'UX (batching, sponsoring) ; le bloquer est conservateur. » **Parade** : pour le grand public en 2026, un seul usage légitime (smart account officiel du wallet) ; on ne bloque pas, on exige un intent dédié ; le texte reste « donner le contrôle du compte », et le critical se lève si le code délégué est celui publié par le wallet (comparaison de codeHash avec le déploiement canonique du wallet : référence fonctionnelle, pas liste en dur d'adresses).
- **FP** : faible aujourd'hui. **Test Fuji** : Avalanche C-Chain a activé Pectra/7702 (Octane/Granite à vérifier selon réseau) — **à confirmer** (`eth_getCode` d'un EOA après tx type 4 sur Fuji) ; sinon fixture locale (anvil `--hardfork prague`). Étapes : tx type 4 avec délégation vers un contrat de test « sweeper » en intent swap → critical.
- **Mapping** : T1098, T1556 (modification du mécanisme d'authentification), T1657 ; D3-UAP, D3-UBA ; DE.AE-02, PR.AA-05, RS.MI-01.

### Fiche 16 — Spoofing de simulation (le moteur lui-même est la cible)

- **Mécanisme** : la dApp livre un contrat dont le comportement dépend de l'état (bloc, solde, timestamp, coinbase) : simulation « propre », exécution malveillante quelques blocs plus tard ; ou l'état est modifié entre simulation et signature. Scam Sniffer, « Transaction Simulation Spoofing: A New Threat in Web3 » (10 janv. 2025) **[V titre, contenu non ouvert]**.
- **Moteur** : tout est simulé sur un bloc donné ; `Effects` ne mémorise ni le bloc ni si le trace lit l'environnement.
- **Couvert** : **non**.
- **Règle R-SIG-16** : `if trace lit {NUMBER,TIMESTAMP,COINBASE,BALANCE sur un autre compte,PREVRANDAO,BASEFEE} avec branchement conditionnel : WARN (CRITICAL si EOA fonds > 0) ; re-simuler à signature−1s à `pending+1` et comparer la valeur des effets (>5 % d'écart → CRITICAL)`. Champs : `simulatedAtBlock`, `envDependent`.
- **Objection** : « Les AMM lisent TIMESTAMP (deadline) et NUMBER ; faux positifs partout. » **Parade** : on ne signale que le **branchement conditionnel sur ces valeurs qui change le flux de fonds** (diff de trace entre deux simulations à blocs décalés), pas la simple lecture.
- **FP** : moyen (à calibrer). **Test Fuji** : contrat `if (block.number > N) drain()` ; simuler à N-1 (ok) puis à N+5 ; le re-simulateur doit lever critical.
- **Mapping** : T1036, T1565 ; D3-UBA ; DE.AE-02, DE.CM-09 ; ASI/ATLAS non applicable ici.

### Fiche 17 — Révocation comptée comme approbation (FP interne, C6)

- **Mécanisme** : `approve(spender,0)`, `setApprovalForAll(op,false)`, `permit` avec `value=0`/`allowed=false` : bloquent un attaquant.
- **Couvert** : **non (bug)** : `hasApprovals` (L36) + L213/L288/L406 les traitent comme risque ; une sécurité qui bloque la révocation est pire qu'inutile (on décourage le bon comportement).
- **Règle R-SIG-00** : `approvals = approvals.filter(a => !a.isRevocation)` en tête de `compare()` ; la révocation donne `ok` avec message positif.
- **Objection** : « Une révocation d'un spender légitime peut casser l'app. » **Parade** : c'est l'action de l'utilisateur, sans risque de perte ; message informatif seulement.
- **Test Fuji** : TST `approve(X,0)` en intent pay → doit être ok (aujourd'hui critical).
- **Mapping** : DE.AE-02 (réduction des faux positifs) ; PR.AA-05.

---

## 4. Top 5 trous (priorité démo + impact réel)

1. **Signatures d'ordres sans effets visibles (Seaport/Blur/UniswapX/CoW/Permit2-transfer)** — `Effects` n'a pas de modèle d'ordre : une signature qui livre un NFT ou un solde passe en `ok` (fiches 4, 7, 8). Fix : `orders[]` + règle « contrepartie reçue ≈ 0 ou destinataire ≠ soi ». Impact : Mocaverse 52 k$ (nov. 2023) et toute la classe NFT.
2. **`buy_or_swap` ne contrôle ni spender, ni durée, ni délégation, ni receiver** — le corps du check de receiver (L350-L354) est vide, `hasDelegation` n'y est jamais appelé, une signature Permit seule sans outgoing passe `ok` (C2). C'est l'intent le plus fréquent et celui où se cachent 56,7 % (Permit) des vols. Fix : R-SIG-01/03/08/15.
3. **Transfert d'autorité sans mouvement de fonds (setOwner / delegate / Safe / 7702 hors pay)** — le cas des 55,47 M$ (août 2024) donne `ok` aujourd'hui (fiches 11 et 15). Fix : `authority[]` via diff de stockage simulé + sélecteurs ; délégation 7702 critique pour tous les intents.
4. **Signature opaque et confiance figée** — `eth_sign`/`personal_sign` hex, typed data inconnu : aucune représentation, `confidence=1.0` en dur, `low_confidence` mort (fiches 9, 10, C5). Fix : `signature.opaque`, `domain`, baisse de confiance, SIWE décodé.
5. **Seuil de jeunesse en blocs + approbation lue seulement par `approvals[0]` + révocation en faux positif** — C4/C6/C7 : le signal « contrat récent » ne tire presque jamais sur Avalanche (50 blocs ≈ 100 s), les révocations sont bloquées, les batchs sont sous-décrits. Fix : jours au lieu de blocs, `isRevocation`, résumé multi-tokens avec exposition USD.

## 5. Remarques de méthode et limites

- Aucun des cas de test ne cible un système réel : wallets, tokens, contrats et ordres sont créés par nous sur Fuji ou en local (anvil/hardhat) ; clés jetables hors repo, aucune adresse de victime ou de drainer réelle n'est utilisée.
- Chiffres issus de rapports d'éditeurs (Scam Sniffer, Chainalysis, Group-IB) : méthodologies différentes (EVM seulement, chiffres révisés d'un rapport à l'autre : 2023 = ~300 M$ puis ~295 M$). Citer « ordre de grandeur » devant le jury.
- Non retrouvés/chiffrés : incidents spécifiques UniswapX/CoW/Fusion, DAI-permit isolé, EIP-3009, domaine EIP-712 falsifié. Ne pas les affirmer en pitch ; les présenter comme surface émergente couverte par construction.
- Sélecteurs et adresses cités depuis la mémoire sont marqués **[M]** : à vérifier (`eth_getCode`/Etherscan/Snowtrace) avant mise en fixture.
- Les IDs D3FEND (D3-UBA, D3-RAPA, D3-URA, D3-UAP) sont à confirmer sur https://d3fend.mitre.org ; les IDs ATT&CK (T1566.002, T1204.001, T1528, T1657, T1098, T1556, T1036, T1565) et les contrôles CSF 2.0 (DE.AE-02, DE.AE-04, DE.CM-09, PR.AA-05, PR.AT-01, RS.MI-01) sont les rattachements les plus naturels, à resserrer pour la fiche de défense.
