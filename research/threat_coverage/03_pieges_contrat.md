# Menaces ratées — Famille 3 : pièges contrat et nouveaux standards

Auteur : worker (recherche), 11 oct. 2026. Cible : `app/intent/src/compare.ts` + `types.ts` (worktree T-103). Les numéros de ligne renvoient à `compare.ts`.
Sources web = DONNÉE, citées par URL. Ce qui vient de ma mémoire et n'a pas été revérifié est marqué *(mémoire)*. Les identifiants D3FEND sont à revérifier avant publication (D3-DA, D3-IAA, D3-IRA, D3-EAL, D3-CSPP, D3-ACH, D3-FCA). Aucune règle ci-dessous ne cite d'adresse en dur : tout repose sur des champs de l'effet décodé ou sur un registre de données (allowlist de délégués/routeurs), jamais sur des constantes dans le code.

## 0. Ce que le code actuel fait et ne fait pas (lecture de `compare.ts`)

- `hasDelegation` n'est évalué que dans `asked_by_someone` (l. 101), `pay_someone` (l. 229) et `connect_or_accept_offer` (l. 438). **Absent de `checkBuyOrSwap` (l. 319-378) et de `checkSendToMyAccount` (l. 281-312)** : un swap ou un « envoi vers mon compte » qui pose une délégation 7702 sort `ok`.
- `Effects.delegation` ne porte que `{to, via}` : rien sur le délégué (âge, vérifié, allowlist), ni sur le `chainId` de l'autorisation (0 = rejouable partout), ni sur le `nonce`, ni sur le cas « révocation » (délégation vers l'adresse zéro, action saine qui serait classée critique en `pay_someone`).
- `confidence` vaut 1.0 en dur (l. 90) et n'est jamais baissée : la branche `low_confidence` (l. 180) est du code mort. **Une tx non décodable, une simulation en échec ou un appel sans flux de tokens (changement d'owner Safe, installation de module, `delegatecall`) donne `ok`.**
- `new_contract` (l. 116-127) : seuil de 50 **blocs**, `warn` seulement. 50 blocs = environ 10 min sur Ethereum, environ 100 s sur Avalanche (blocs de 2 s). Un drainer déployé il y a 2 h passe. Un contrat CREATE2 non encore déployé a `isContract=false` et pas d'`ageBlocks`.
- `buy_or_swap` : l'approbation illimitée est seulement `warn` (l. 326-335) et n'est pas comparée au spender (routeur attendu ou non). La boucle « recipient is self » (l. 350-354) est **vide**. Un `incoming` bidon (poussière) suffit à éviter `no_incoming` (l. 338).
- `pay_someone` : `amount_exceeded` (l. 257-273) compare des nombres de **tokens différents** et ne compare jamais `out.token` à `intent.token` ; `wrong_recipient` ne tourne que si `counterpartyAddress` est fourni (l. 241).
- `connect_or_accept_offer` : le total sortant additionne des montants de tokens hétérogènes (l. 393) ; sans effet sur le niveau (tout `outgoing` = critical) mais le message est faux.
- Aucun champ pour : sous-appels (batch/multicall), `delegatecall`, valeur native envoyée, sélecteur inconnu, vérification de source, proxy/implémentation, métadonnées de token (taxe, blacklist), métadonnées de signature (domaine, deadline), UserOperation, transaction Safe.

## 1. Tableau récapitulatif

Couverture : oui / partiel / non. Priorité = gravité x prévalence x facilité de la règle, pour la démo Fuji et la crédibilité devant un jury blue team.

| # | Menace | Incident phare (date, perte) | Couvert | Priorité |
|---|---|---|---|---|
| F0 | Tx non décodable / sans flux de tokens = `ok` | trou transversal (Bybit, WazirX, Radiant) | non | P0 |
| F1 | Délégation EIP-7702 vers contrat inconnu / sweeper | Pectra 2025-05-07 ; >80 % des délégations = sweeper (Wintermute) ; 146 551 $ (2025-05-24) | partiel (l. 229, 438 ; absent swap/send) | P0 |
| F2 | 7702 `chainId=0` (rejeu multi-chaînes), nonce, révocation | arXiv 2512.12174 (déc. 2025) | non | P1 |
| F3 | Délégation 7702 vers implémentation à stockage/initialisation non sûrs | USENIX 2026 : 63 % d'autorisations malveillantes, 2,3 M$ | non | P2 |
| F4 | Batch camouflé (EIP-5792 `wallet_sendCalls`, batch 7702, multicall) | 2025-08 : 1,54 M$ (batch 7702) | partiel | P0 |
| F5 | `delegatecall` / multicall vers code non fiable | Bybit 2025-02-21 : 1,46 Md$ | non | P0 |
| F6 | Safe : owner / module / guard / fallback / masterCopy | Bybit ; WazirX 2024-07-18 : 235 M$ ; Radiant 2024-10-16 : 50 M$ | non | P0 |
| F7 | Drainer CREATE2 frais / contrat éphémère / non déployé | famille drainer-as-a-service (Inferno, Angel, Pink) | partiel (l. 116, trop étroit) | P0 |
| F8 | Faux `Claim` / `SecurityUpdate` / `Connect` payable (ETH natif) | classique 2021-2026 | partiel | P1 |
| F9 | Sélecteur / nom trompeur, ABI incohérent | classique | non | P2 |
| F10 | Proxy upgradable qui change après l'approbation | Radiant 2024-10-16 | non | P1 |
| F11 | Tokens honeypot / taxe / rebasing / blacklist / mint | Squid Game 2021 *(mémoire)*, vague continue | non | P1 |
| F12 | Faux events Transfer, faux tokens, empoisonnement d'adresse | 2025-12-20 : 50 M$ USDT ; 2024-05-03 : environ 68 M$ WBTC *(mémoire)* | partiel (`lookalikeOf`) | P1 |
| F13 | Hooks ERC-777 / ERC-1363 / callbacks de réception | Hundred Finance 2023-04 *(mémoire)* | non | P3 |
| F14 | Permit2 + Universal Router : calldata malveillante | Permit/Permit2 : 8,72 M$ sur les cas >1 M$ de 2025 | partiel (l. 357-377) | P0 |
| F15 | Hooks Uniswap V4 (pool/hook adverse, `hookData`) | Cork 2025-05-28 : ~12 M$ ; Bunni 2025-09-02 : 8,4 M$ (bugs protocole) | non | P2 |
| F16 | ERC-4337 : UserOperation, paymaster, modules ERC-7579, sessions | Trail of Bits 2026-03 (6 familles de bugs) | non | P1 |
| F17 | Swap déséquilibré : `minOut` nul, poussière en `incoming`, destinataire tiers | transversal | partiel (l. 338, boucle vide l. 350) | P0 |

## 2. Fiches

Les cas de test Fuji (chainId 43113) utilisent des contrats **jetables déployés par nous** depuis notre wallet de test ; aucun système réel visé. Les fixtures `Effects` JSON sont la forme prioritaire (déterministe, hors réseau).

Extension de type proposée, réutilisée par toutes les fiches :

```ts
// types.ts — ajouts
interface SimMeta { ok: boolean; reverted?: boolean; decoded: boolean; unknownCalls: number; stateWritesOutsideBalances: boolean }
interface SubCall { to: `0x${string}`; selector?: string; valueWei: string; operation: 'call'|'delegatecall'|'create'|'create2'; depth: number; decodedAs?: string; recipient?: `0x${string}` }
interface ContractMeta { ageSeconds?: number; verified?: boolean; isProxy?: boolean; implementation?: `0x${string}`; implAgeSeconds?: number;
  upgradableBy?: 'eoa'|'multisig'|'timelock'|'none'; deployedViaCreate2?: boolean; hasSelfdestruct?: boolean;
  codeClass?: ('sweeper'|'generic-executor'|'erc20'|'router'|'safe'|'unknown')[]; undeployed?: boolean; allowlisted?: boolean }
// Effects
sim: SimMeta; calls?: SubCall[]; nativeOutWei?: string; valueRatio?: number /* usd_in / usd_out */
incoming[].usd?: number
delegation?: { to; via:'eip7702'; chainId: number /*0 = any*/; nonce?: number; kind:'set'|'revoke'; meta?: ContractMeta; allowlisted?: boolean }
counterparties[].meta?: ContractMeta
tokenMeta?: Record<string,{ transferTaxPct?: number; sellSimOk?: boolean; hasBlacklist?: boolean; ownerCanMint?: boolean; rebasing?: boolean; erc777?: boolean; ageSeconds?: number; holders?: number }>
safeTx?: { operation:'call'|'delegatecall'; ownersChanged: boolean; thresholdChanged: boolean; modulesChanged: boolean; guardChanged: boolean; fallbackChanged: boolean; masterCopyChanged: boolean; to: `0x${string}` }
sigMeta?: { domainChainId?: number; verifyingContract?: `0x${string}`; deadlineSec?: number }
userOp?: { sender: `0x${string}`; paymaster?: `0x${string}`; paymasterMeta?: ContractMeta; innerCalls: SubCall[]; installsModule: boolean }
```

---

### F0. Transaction non décodable ou sans flux de tokens, jugée `ok`

- **Mécanisme.** Le comparateur ne réagit qu'à `outgoing`, `approvals`, `delegation`. Tout ce qui change l'état sans bouger de token visible (owner d'un Safe, `delegatecall`, module, hook) produit des tableaux vides, donc `ok`. `confidence` est figé à 1.0.
- **Incidents.** Bybit, 2025-02-21, 1,46 Md$ : la tx signée ne contenait aucun transfert, c'était un `delegatecall` remplaçant la masterCopy (https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history). WazirX, 2024-07-18, 235 M$ : mise à niveau de l'implémentation du Safe (https://www.elliptic.co/blog/235-million-lost-by-wazirx-in-north-korea-linked-breach). Radiant, 2024-10-16, 50 M$ : txs empoisonnées derrière une UI Safe propre (https://x.com/RDNTCapital/status/1847121278974480779).
- **Prévalence.** Rare en nombre, énorme en montant (Bybit = 17 fois le total des pertes de phishing par signature de 2025, 83,85 M$ ; https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million). Pour un utilisateur MetaMask : Safe personnels, comptes 4337/7702.
- **Voit le moteur.** Rien. `raw.selector` existe mais n'est pas exploité.
- **Couvert.** Non (l. 90 et l. 180 : code mort).
- **Règle.**
  ```
  if (!e.sim.ok || !e.sim.decoded || e.sim.unknownCalls > 0) -> warn   // critical si intent != connect
  if (e.sim.stateWritesOutsideBalances && noTokenFlow(e)
      && intent.kind in {pay_someone,buy_or_swap,send_to_my_account}) -> critical
  confidence = min(1, 1 - 0.4*unknownCalls/max(1,calls.length)) ; sim en échec -> 0.3
  ```
  Champs : `sim.*`. `stateWritesOutsideBalances` = écriture de stockage sur le compte de l'utilisateur ou sur un contrat dont il est owner/signataire, hors soldes.
- **Objection.** « Beaucoup de tx légitimes ne sont pas décodables (protocoles récents), tu noies l'utilisateur. » **Parade** : `warn` seulement quand l'intention est un paiement ou un swap (où le décodage devrait réussir) ; `unknownCalls` ne compte que les sous-appels sans ABI **et** sans effet de solde ; `ok` conservé si la sim réussit, que les flux correspondent à l'intention et qu'aucune écriture hors solde n'est détectée. Métrique à publier : % de tx de démo en `warn` pour ce motif.
- **Risque FP.** Moyen, atténué par `stateWritesOutsideBalances`.
- **Cas de test Fuji.** Fixture : Safe de test, `execTransaction(operation=1)` vers un contrat jetable qui écrit le slot 0 ; intention `pay_someone` : `critical` `undecoded_state_change`. Contrôle négatif : swap simple sur un routeur de test, flux conformes : `ok`.
- **Mapping.** ATT&CK T1565.002 (altération des données transmises), T1204.002. D3FEND D3-DA (analyse dynamique = simulation), D3-CSPP. NIST CSF 2.0 DE.AE-02, DE.CM-09, PR.PS-06.

---

### F1. Délégation EIP-7702 vers contrat inconnu / sweeper

- **Mécanisme.** Une autorisation signée `(chainId, address, nonce)` écrit `0xef0100||address` comme code du compte : tous les appels vers l'EOA passent dans le code du délégué. Un délégué malveillant (ou un « executor » sans contrôle d'accès) vide le compte, y compris les dépôts futurs (sweeper). La signature d'autorisation n'est pas un message EIP-712 classique, donc beaucoup d'UI ne l'affichent pas.
- **Incidents.** Pectra, mainnet 2025-05-07. 2025-05-24 : 146 551 $ via un batch du delegator MetaMask par Inferno Drainer (SlowMist ; https://www.gate.com/news/detail/11066977 ; https://www.aicoin.com/en/article/463522). 2025-05-30 : Wintermute, plus de 97 % des délégations pointent vers un code quasi identique (« CrimeEnjoyor ») qui balaie les comptes compromis (https://www.theblock.co/post/356481/wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks). 2025-08 : 1,54 M$ en un batch 7702 (ScamSniffer, lien ci-dessus). 2026 : étude USENIX, 63 % des autorisations analysées liées à des contrats de l'attaquant, plus de 2,3 M$ (https://www.kucoin.com/news/flash/eip-7702-wallet-delegation-tied-to-63-malicious-transactions-2-3m-in-losses). Mesure : https://arxiv.org/abs/2512.12174.
- **Prévalence.** Élevée en nombre (milliers de délégations malveillantes), modérée en montant par victime. Nuance honnête : une partie des sweepers frappe des comptes dont la clé est déjà volée, ce que notre barrière ne peut pas empêcher ; la signature d'autorisation obtenue par phishing est en revanche dans notre périmètre.
- **Voit le moteur.** `delegation.to` seulement.
- **Couvert.** Partiel : critique en `pay_someone` (l. 229) et `connect` (l. 438) ; **rien en `buy_or_swap` / `send_to_my_account`** ; aucune évaluation du délégué.
- **Règle.**
  ```
  d = e.delegation
  if (d && d.kind==='set'):
     if (d.allowlisted) -> warn if intent.kind != 'upgrade_account'   // ok si l'utilisateur l'a demandé
     else -> critical   // dans tous les cas du switch
     message: "tu donnerais le contrôle de ton compte au contrat X (créé il y a N h, non vérifié)"
  if (d && d.kind==='revoke') -> ok (info : "retire une délégation")
  ```
  `allowlisted` vient d'un registre de données (délégués audités publiés par les éditeurs de wallets), pas d'une constante du comparateur. Champs : `delegation.{chainId, nonce, kind, meta, allowlisted}`. Sortir ce test du `switch`.
- **Objection.** « Les gens vont légitimement passer en smart account (MetaMask, Coinbase), tu bloques l'adoption. » **Parade** : si `allowlisted` et que l'intention est « mettre à niveau mon compte » (nouvel `IntentKind`), `ok` avec rappel ; une délégation durable posée pendant un paiement/swap reste `critical`.
- **Risque FP.** Faible tant que la révocation n'est pas bloquée.
- **Cas de test Fuji.** Wallet de test signe une autorisation vers `SweeperMock` (fonction `execute(Call[])` sans contrôle d'accès) déployé par nous ; intention `buy_or_swap` : `critical`. Variantes : délégué `allowlisted` + intention « mettre à niveau » : `ok` ; révocation : `ok`.
- **Mapping.** ATT&CK T1098 (manipulation de compte), T1204.001, T1657. D3FEND D3-EAL, D3-IAA. CSF 2.0 PR.AA-05, DE.AE-02, DE.CM-09.

---

### F2. 7702 : `chainId = 0`, rejeu inter-chaînes, nonce

- **Mécanisme.** Une autorisation avec `chainId=0` est valide sur toutes les chaînes EVM où le nonce correspond : l'utilisateur croit signer pour Fuji, l'attaquant rejoue ailleurs. L'article arXiv 2512.12174 décrit aussi l'activation répétée à distance via l'EntryPoint 4337.
- **Incidents.** Mesure académique (déc. 2025) sur plus de 150 000 événements ; pas de perte unitaire isolée citée (https://arxiv.org/abs/2512.12174).
- **Prévalence.** Moyenne, surtout multiplicateur de F1.
- **Voit le moteur.** Rien (`delegation` sans `chainId`).
- **Couvert.** Non.
- **Règle.**
  ```
  if (d && d.chainId === 0 && !d.allowlisted) -> critical   // "valable sur TOUTES les chaînes"
  if (d && d.chainId === 0 && d.allowlisted)  -> warn
  if (d && d.chainId !== 0 && d.chainId !== e.chainId) -> warn
  ```
- **Objection.** « `chainId=0` est un usage prévu pour les smart accounts multi-chaînes. » **Parade** : `warn` si délégué allowlisté, `critical` sinon ; le texte explique le rejeu.
- **Risque FP.** Faible.
- **Cas de test Fuji.** Fixture : autorisation `chainId=0` vers contrat inconnu : `critical` ; `chainId=43113` vers allowlisté : `ok`.
- **Mapping.** ATT&CK T1098 ; T1550 (par analogie, réutilisation de matériel d'authentification). D3FEND D3-IAA, D3-CSPP. CSF 2.0 DE.AE-02, PR.AA-05.

---

### F3. Délégation vers une implémentation à stockage/initialisation non sûrs

- **Mécanisme.** Le code du délégué s'exécute avec le stockage de l'EOA : collisions de slots entre délégués successifs, `initialize()` appelable par tous, absence d'isolation (ERC-7201). Un délégué honnête mais mal conçu devient un vecteur.
- **Incidents.** Pas de perte fiable à citer. Cadrage : https://arxiv.org/abs/2512.12174.
- **Prévalence.** Faible aujourd'hui, croissante.
- **Voit le moteur.** Rien.
- **Couvert.** Non.
- **Règle.**
  ```
  if (d && !d.allowlisted && d.meta?.verified === false) -> critical            // déjà F1
  if (d && !d.allowlisted && d.meta?.codeClass?.includes('generic-executor')) -> critical
  ```
  Champs : `meta.codeClass` (heuristique de bytecode : un `execute(address,uint,bytes)` qui ne lit ni `msg.sender` ni `ecrecover`).
- **Objection.** « Détecter l'absence de contrôle d'accès par bytecode est fragile. » **Parade** : on n'affirme pas la sûreté, on signale l'absence de preuve ; la règle ne se déclenche que hors allowlist.
- **Risque FP.** Moyen si l'heuristique est seule ; faible adossée à l'allowlist.
- **Cas de test Fuji.** Contrat jetable `ExecutorNoAuth` : `critical`.
- **Mapping.** ATT&CK T1098, T1068 (par analogie). D3FEND D3-FCA, D3-DA. CSF 2.0 ID.RA-01, DE.CM-09.

---

### F4. Batch camouflé (EIP-5792 `wallet_sendCalls`, batch 7702, multicall)

- **Mécanisme.** Un site envoie `wallet_sendCalls([approve(spender,max), transfer(...), setApprovalForAll(...)])` : une confirmation, plusieurs actions dont une seule est mise en avant dans l'UI. EIP-5792 laisse le wallet décider de l'atomicité et de la présentation (https://eips.ethereum.org/EIPS/eip-5792).
- **Incidents.** 2025-08 : 1,54 M$ en une signature de batch 7702 (transferts multiples + approbations NFT) (https://www.cryptopolitan.com/eip-7702-user-loses-1-54m-phishing-attack ; https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million). 2025-05-24 : 146 551 $ (batch via un delegator légitime).
- **Prévalence.** Croissante avec les smart accounts ; 2 des 11 cas >1 M$ de 2025.
- **Voit le moteur.** `outgoing`/`approvals` agrégés si le simulateur aplatit les sous-appels ; sinon rien.
- **Couvert.** Partiel : les règles par intention s'appliquent à l'agrégat (un `approve` en `pay_someone` est `critical`, l. 213). Contournements : approbation bornée ou `setApprovalForAll` en `buy_or_swap` (seul l'illimité donne `warn`, l. 326) ; sous-appel sans solde visible (F0).
- **Règle.**
  ```
  for c in e.calls: classify(c)   // approve | transfer | setApprovalForAll | delegatecall | unknown
  expected = expectedActions(intent)   // pay: {transfer}; swap: {approve(routeur), swap}; connect: {}
  extra = e.calls.filter(c => !expected.has(c.decodedAs))
  if (extra.length) -> critical (pay/send/connect) | warn (swap)
  if (e.calls.length >= 3 && intent.kind != 'buy_or_swap') -> warn
  ```
  Champs : `calls[]` avec `decodedAs`.
- **Objection.** « Les dApps légitimes (approve + swap + stake) batchent aussi. » **Parade** : la règle compare à l'intention déclarée, pas au batch en soi ; en `buy_or_swap`, l'`approve` du token vendu vers un spender allowlisté est attendu.
- **Risque FP.** Moyen en `buy_or_swap`, faible ailleurs.
- **Cas de test Fuji.** `[transfer(contact, 10), approve(spenderInconnu, max)]`, intention `pay_someone` : `critical`. `[approve(routeurTest, 10), swap]`, intention swap : `ok`.
- **Mapping.** ATT&CK T1204.001, T1036, T1657. D3FEND D3-CSPP, D3-DA. CSF 2.0 DE.AE-02, DE.CM-09.

---

### F5. `delegatecall` / multicall vers du code non fiable

- **Mécanisme.** `delegatecall` exécute le code cible dans le contexte de l'appelant (stockage, solde, droits). Dans un wallet contrat, un `delegatecall` signé peut remplacer la logique. `Multicall`/`aggregate3Value` enchaîne des appels arbitraires sous l'identité du contrat appelant.
- **Incidents.** Bybit 2025-02-21 : `execTransaction` avec `operation=1` vers le contrat de l'attaquant, qui écrase le slot 0 (masterCopy) (https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history). WazirX 2024-07-18.
- **Prévalence.** Rare en nombre, extrême en gravité ; pertinent pour Safe personnels et wallets contrats.
- **Voit le moteur.** Rien (pas de trace d'opcode).
- **Couvert.** Non.
- **Règle.**
  ```
  dc = e.calls.filter(c => c.operation === 'delegatecall')
  for each in dc: if (!target.allowlisted /* ex. MultiSend officiel, via registre */) -> critical
  ```
  Champs : `calls[].operation`, trace de simulation (`callTracer`).
- **Objection.** « MultiSend officiel de Safe est un delegatecall légitime à chaque batch. » **Parade** : registre de cibles `delegatecall` attendues par type de compte (données), vérifié par `codeHash` et non par adresse figée.
- **Risque FP.** Faible à moyen (Safe) ; nul pour un EOA classique.
- **Cas de test Fuji.** Fixture `calls=[{operation:'delegatecall', meta:{verified:false, ageSeconds:600}}]` : `critical`.
- **Mapping.** ATT&CK T1195.002 (chaîne logicielle, vecteur UI), T1565.002, T1098. D3FEND D3-DA, D3-EAL. CSF 2.0 GV.SC-07, DE.CM-09, PR.PS-06.

---

### F6. Safe : owner / threshold / module / guard / fallback / masterCopy

- **Mécanisme.** Un Safe se prend par `swapOwner`/`addOwnerWithThreshold`/`changeThreshold`, `enableModule`, `setGuard`, `setFallbackHandler` ou écrasement de la masterCopy (F5). Les signataires voient une UI qui présente autre chose (Safe{Wallet} compromis, interface du prestataire Liminal altérée, malware sur le poste).
- **Incidents.** Bybit 2025-02-21 : 1,46 Md$. WazirX 2024-07-18 : 235 M$ (https://www.elliptic.co/blog/235-million-lost-by-wazirx-in-north-korea-linked-breach ; https://www.quillaudits.com/blog/hack-analysis/wazirx-235m-hack). Radiant 2024-10-16 : 50 M$ (https://x.com/RDNTCapital/status/1847121278974480779 ; https://www.ibtimes.com/radiant-capital-exploit-over-50m-lost-after-bnb-chain-arbitrum-contracts-hit-multisig-breach-3747039).
- **Prévalence.** Trois incidents majeurs en 7 mois, plus de 1,7 Md$. Pour la cible (devs, créateurs de SaaS) : trésoreries de petites équipes sur Safe, donc réaliste.
- **Voit le moteur.** Rien de spécifique (`raw.to`/`selector` non interprétés).
- **Couvert.** Non.
- **Règle.**
  ```
  s = e.safeTx
  if (s && (s.ownersChanged || s.thresholdChanged || s.modulesChanged || s.guardChanged
         || s.fallbackChanged || s.masterCopyChanged)) -> critical unless intent.kind==='admin_safe'
  if (s && s.operation==='delegatecall') -> critical
  ```
  Champs : `safeTx.*`, obtenus par décodage de `execTransaction` + diff de stockage Safe. Produit : afficher le hash/décodage indépendant du calldata.
- **Objection.** « Si l'UI du Safe est compromise, ta barrière aussi, puisqu'elle lit ce que le site envoie. » **Parade** : la barrière décode et simule le **calldata/typed data réellement transmis au wallet**, pas le texte affiché par la dApp. L'intention vient de l'utilisateur : « transférer X » + diff de gouvernance Safe non nul = incohérence détectable. Limite à avouer : compromission de l'extension ou du poste = hors périmètre.
- **Risque FP.** Faible ; les administrateurs légitimes déclarent l'intention d'admin.
- **Cas de test Fuji.** Safe de test : `swapOwner`, intention `pay_someone` : `critical` `safe_governance_change`. `enableModule` : `critical`.
- **Mapping.** ATT&CK T1195.002, T1565.002, T1098, T1657. D3FEND D3-CSPP, D3-DA, D3-IAA. CSF 2.0 GV.SC-07, DE.AE-02, DE.CM-09, RS.MA-01.

---

### F7. Drainers CREATE2 frais / contrats éphémères / non déployés

- **Mécanisme.** Les kits drainer-as-a-service (Inferno, Angel, Pink) génèrent des contrats ou proxys minimaux à la volée, souvent via CREATE2, pour échapper aux listes d'adresses ; l'adresse est calculable avant déploiement (aucun code à la signature). Le contrat vit des heures, pas des blocs.
- **Incidents.** 2025 : 83,85 M$ de phishing par signature, 106 106 victimes (https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million). 2024 : environ 494 M$ *(mémoire)*.
- **Prévalence.** Très élevée : mode opératoire dominant du phishing par signature.
- **Voit le moteur.** `counterparties[].isContract`, `ageBlocks`. Pas de `deployedViaCreate2`, de source vérifiée ni d'indicateur « non déployé ».
- **Couvert.** Partiel : `new_contract` (l. 116-127), `warn` si < 50 blocs ; ne tient pas compte d'un âge de plusieurs heures ni d'une adresse sans code (traitée comme EOA).
- **Règle.**
  ```
  for cp of e.counterparties:
     young      = cp.meta.ageSeconds < 7*86400
     unverified = cp.meta.verified === false
     privileged = approvals.some(a=>a.spender===cp.address) || delegation?.to===cp.address || receivesNative(cp)
     if (cp.meta.undeployed && privileged) -> critical
     if (privileged && young && unverified) -> critical
     else if (young && unverified) -> warn
  ```
  Remplacer l'âge en blocs par `ageSeconds` (temps de bloc par chaîne). Champs : `ageSeconds`, `verified`, `undeployed`, `deployedViaCreate2`.
- **Objection.** « Les protocoles légitimes sont jeunes et non vérifiés le jour du lancement ; tu bloques les mints du jour. » **Parade** : `critical` seulement si le contrat reçoit un pouvoir durable (approbation, délégation, valeur native sans contrepartie) ; jeune sans pouvoir durable = `warn`.
- **Risque FP.** Moyen, géré par la condition `privileged`.
- **Cas de test Fuji.** Contrat jetable déployé il y a moins d'une heure, approbation `max` vers lui, intention `buy_or_swap` : `critical`. Adresse CREATE2 calculée non déployée : `critical`.
- **Mapping.** ATT&CK T1583.001, T1608 (infrastructure préparée), T1204.001, T1657. D3FEND D3-IRA, D3-IAA. CSF 2.0 DE.AE-02, DE.CM-09, ID.RA-01.

---

### F8. Faux `Claim` / `SecurityUpdate` / `Connect` payable (ETH natif)

- **Mécanisme.** Un bouton « Claim » appelle une fonction `payable` (`Claim()`, `SecurityUpdate()`, `Verify()`) et l'utilisateur envoie de l'ETH/AVAX avec la tx ; le nom n'a aucun rapport avec l'effet. Variante : l'appel est gratuit mais fait un `approve` caché.
- **Incidents.** Motif classique de drainer 2021-2026 ; pas de montant unitaire fiable à citer.
- **Prévalence.** Élevée dans les faux airdrops.
- **Voit le moteur.** L'ETH natif doit apparaître dans `outgoing` (token « native ») ; pas de champ `value` dédié.
- **Couvert.** Partiel : `connect_or_accept_offer` : tout `outgoing` est `critical` (l. 392) ; `buy_or_swap` : `no_incoming` si rien en retour (l. 338) ; `pay_someone` : seulement si `counterpartyAddress` est renseigné (l. 241).
- **Règle.**
  ```
  if (e.nativeOutWei > 0 && recipient is contract && e.incoming.length === 0) -> critical
  if (nameHint in {claim, securityupdate, verify, connect, register} && e.nativeOutWei > 0) -> critical
  ```
  Champs : `nativeOutWei`, `raw.selectorName` (indice, jamais preuve).
- **Objection.** « Un mint ou une vente peut aussi être payable sans retour immédiat. » **Parade** : en `buy_or_swap` on exige un `incoming` visible dans la sim (mint NFT = `incoming` NFT) ; sinon `critical`.
- **Risque FP.** Faible à moyen (mints à livraison différée).
- **Cas de test Fuji.** Contrat jetable `Claim() payable` qui garde l'AVAX, intention `connect_or_accept_offer` : `critical`.
- **Mapping.** ATT&CK T1204.001, T1036, T1657. D3FEND D3-CSPP, D3-DA. CSF 2.0 DE.AE-02.

---

### F9. Sélecteur / nom trompeur, ABI incohérent

- **Mécanisme.** Le nom d'une fonction ne prouve rien : collisions de sélecteurs 4 octets, fonctions nommées `transfer`/`claimReward` dont le corps approuve, sélecteur non résolu.
- **Incidents.** Pas de perte citée ; technique d'obfuscation des kits drainer.
- **Prévalence.** Moyenne.
- **Voit le moteur.** `raw.selector` brut.
- **Couvert.** Non directement, mais les règles actuelles se fondent sur l'effet simulé, ce qui est la bonne architecture.
- **Règle.**
  ```
  declared = signatureDB.resolve(raw.selector)    // indice
  actual   = classifyFromEffects(e)               // approve | transfer-out | delegation | none
  if (declared in {claim, reward, mint, verify} && actual in {approve, delegation, transfer-out}) -> critical
  ```
- **Objection.** « La base de signatures est elle-même une surface (collisions). » **Parade** : on ne se fie jamais au nom ; il ne sert qu'à détecter la **contradiction** nom/effet.
- **Risque FP.** Faible.
- **Cas de test Fuji.** Contrat jetable `claimReward()` qui exécute `approve(tiers, max)` : `critical`.
- **Mapping.** ATT&CK T1036. D3FEND D3-DA, D3-CSPP. CSF 2.0 DE.AE-02.

---

### F10. Proxy upgradable qui change après l'approbation

- **Mécanisme.** On approuve un proxy « propre » ; l'administrateur (EOA) change l'implémentation ensuite et appelle `transferFrom`.
- **Incidents.** Radiant 2024-10-16 : nouvelle implémentation avec fonctions de vol, approbations d'utilisateurs exploitées (https://thecyberexpress.com/radiant-capital-hit-by-50-million-crypto-hack/). WazirX 2024-07-18.
- **Prévalence.** Moyenne ; touche les approbations durables.
- **Voit le moteur.** Rien sur le spender hors `counterparties`.
- **Couvert.** Non.
- **Règle.**
  ```
  for a of e.approvals:
     m = metaOf(a.spender)
     if (m.isProxy && m.upgradableBy === 'eoa' && a.amount === 'unlimited') -> critical
     if (m.isProxy && m.upgradableBy === 'eoa') -> warn
     if (m.implAgeSeconds < 86400) -> warn
  ```
  Champs : `meta.isProxy`, `upgradableBy`, `implementation`, `implAgeSeconds` (lecture du slot admin EIP-1967 et du type de son détenteur).
- **Objection.** « Presque tous les protocoles sérieux sont des proxys upgradables ; ça pollue. » **Parade** : seul `upgradableBy==='eoa'` (sans multisig ni timelock) avec approbation illimitée est `critical` ; le reste est `warn`.
- **Risque FP.** Moyen.
- **Cas de test Fuji.** Proxy jetable EIP-1967 avec admin EOA, approbation illimitée : `critical`.
- **Mapping.** ATT&CK T1098, T1195. D3FEND D3-IAA, D3-ACH. CSF 2.0 ID.RA-01, PR.AA-05.

---

### F11. Tokens honeypot / taxe / rebasing / blacklist / mint

- **Mécanisme.** Honeypot : achat possible, revente impossible. Taxe de transfert : la réception est inférieure au montant payé. Rebasing : le solde change sans transfert. Blacklist : l'émetteur gèle l'adresse. Mint illimité par l'owner.
- **Incidents.** Squid Game token, 2021-11, environ 3,4 M$ *(mémoire, hors fenêtre 2023-2026)* ; motif permanent sur les tokens d'airdrop et mèmes.
- **Prévalence.** Élevée sur les tokens mèmes ; faible pour les majors.
- **Voit le moteur.** `incoming.amount` simulé à l'achat, pas la revente.
- **Couvert.** Non.
- **Règle.**
  ```
  for t of e.incoming:
     m = tokenMeta[t.token]
     if (m.sellSimOk === false) -> critical      // simuler la revente sur fork
     if (m.transferTaxPct > 50) -> critical ; > 10 -> warn
     if (m.ownerCanMint && m.holders < 100) -> warn
  ```
  Champs : `tokenMeta.*`, calculés par simulation de revente et lecture d'état.
- **Objection.** « Une sim de revente sur fork peut être trompée (comportement dépendant de `tx.origin` ou du bloc). » **Parade** : sim avec plusieurs `tx.origin` et blocs ; incertitude ou échec = `warn`, jamais `ok`.
- **Risque FP.** Moyen (tokens à taxe légitime).
- **Cas de test Fuji.** ERC-20 jetable qui revert sur `transfer` vers le routeur : `critical` `honeypot`. Taxe 90 % : `critical`.
- **Mapping.** ATT&CK T1657, T1204. D3FEND D3-DA. CSF 2.0 DE.AE-02, ID.RA-01.

---

### F12. Faux events Transfer, faux tokens, empoisonnement d'adresse

- **Mécanisme.** Un contrat émet un event `Transfer` sans bouger de solde, ou exécute un `transferFrom` de valeur nulle depuis l'adresse de la victime vers une adresse sosie : l'explorateur et l'historique du wallet affichent une fausse tx « récente ». L'utilisateur copie l'adresse sosie.
- **Incidents.** 2025-12-20 : 50 M$ en USDT après copie d'une adresse empoisonnée (https://www.coindesk.com/web3/2025/12/20/crypto-user-loses-usd50-million-in-address-poisoning-scam). 2024-05-03 : environ 68 M$ de WBTC *(mémoire)*.
- **Prévalence.** Très élevée en tentatives ; peu de pertes mais de gros montants.
- **Voit le moteur.** `counterparties.lookalikeOf`, `firstSeenByUser`.
- **Couvert.** Partiel : `lookalike_address` (l. 144-156) est `critical`. Trous : (a) si l'historique « connu » est construit à partir de transferts entrants, les adresses empoisonnées y sont déjà ; (b) si `outgoing` est reconstruit depuis les **logs**, de faux events falsifient le moteur ; (c) `isLookalike` (l. 21-30) n'est jamais appelée.
- **Règle.**
  ```
  // intégrité du moteur
  outgoing/incoming := deltas de solde (état avant/après de la sim), jamais les logs Transfer
  // historique
  knownSet := adresses auxquelles l'utilisateur a ENVOYÉ (tx sortantes signées)
  ignorer comme "connues" les adresses qui n'ont fait qu'envoyer des transferts nuls ou poussière
  // règle
  if (cp.address ressemble (6 premiers + 4 derniers) à un élément de knownSet sans l'égaler) -> critical (déjà)
  if (cp.zeroValueInbound30d && cp est destinataire) -> critical
  ```
  Champs : `cp.zeroValueInbound30d`, séparation `knownByOutgoing`.
- **Objection.** « Une adresse nouvelle n'est pas forcément un sosie ; critical sur toute première adresse, c'est trop. » **Parade** : `critical` seulement pour un sosie ou une poussière nulle préalable ; sinon `warn` + saisie complète de l'adresse.
- **Risque FP.** Faible pour sosie, moyen pour « première fois ».
- **Cas de test Fuji.** Générer en local une adresse partageant 4 hex de tête et de queue avec un contact de test ; envoyer 0 token depuis elle vers le wallet de test ; intention `pay_someone` vers le contact : `critical`. Contrat jetable émettant un faux `Transfer` : `outgoing` doit rester vide.
- **Mapping.** ATT&CK T1565.001/.002, T1204, T1657. D3FEND D3-IAA, D3-IRA, D3-CSPP. CSF 2.0 DE.AE-02, DE.AE-03.

---

### F13. Hooks ERC-777 / ERC-1363 / callbacks de réception

- **Mécanisme.** `tokensToSend`/`tokensReceived` exécutent du code de l'émetteur ou du destinataire pendant un transfert : réentrance, effets additionnels. Surtout un risque pour les protocoles ; côté utilisateur, un token ERC-777 inconnu peut déclencher du code lors d'un swap.
- **Incidents.** Hundred Finance 2023-04, environ 7 M$ *(mémoire)*.
- **Prévalence.** Faible pour le public cible.
- **Voit le moteur.** Rien.
- **Couvert.** Non.
- **Règle.**
  ```
  if (tokenMeta[t].erc777 && !allowlisted(t)) -> warn
  if (sim révèle un callback réentrant vers un contrat inconnu) -> warn
  ```
- **Objection.** « C'est exotique et n'attaque pas l'utilisateur directement. » **Parade** : accepté, priorité P3 ; F0 (appels inconnus) et F7 couvrent l'essentiel.
- **Risque FP.** Faible.
- **Cas de test Fuji.** ERC-777 jetable dont le hook appelle `approve` : `critical` via F0/F4.
- **Mapping.** ATT&CK T1204 ; T1190 (par analogie). D3FEND D3-DA. CSF 2.0 ID.RA-01.

---

### F14. Permit2 + Universal Router : calldata malveillante

- **Mécanisme.** (a) Signature Permit2 `PermitSingle`/`PermitBatch` avec spender attaquant et `amount`/`expiration` énormes ; (b) `UniversalRouter.execute(commands, inputs)` dont les `inputs` contiennent un destinataire autre que l'utilisateur (`recipient` d'un swap, `SWEEP`, `TRANSFER`) ou un `PERMIT2_TRANSFER_FROM` vers un tiers ; les commandes sont des octets illisibles sans décodage.
- **Incidents.** 2025 : Permit/Permit2 = 3 cas pour 8,72 M$ parmi les cas >1 M$ ; plus gros cas de l'année : 6,5 M$ via Permit, septembre 2025 (https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million).
- **Prévalence.** Très élevée (signature dominante).
- **Voit le moteur.** `approvals` avec `via='permit2'`, `expiry`, `amount`.
- **Couvert.** Partiel : `permit_new_contract` (l. 357-377) agit seulement en `buy_or_swap`, seulement si le spender figure dans `counterparties` et a < 50 blocs. Un spender ancien/inconnu n'obtient qu'un `warn` (illimité, l. 326). Le destinataire final des sorties d'un swap n'est jamais comparé à `effects.from` (boucle vide l. 350-354).
- **Règle.**
  ```
  for a of e.approvals where a.via in {permit, permit2}:
     if (!spenderMeta.allowlisted) -> critical
     if (a.expiry - now > 30d || a.amount === 'unlimited') -> warn
  for c of e.calls where c.decodedAs in {V3_SWAP, V2_SWAP, SWEEP, TRANSFER, PERMIT2_TRANSFER_FROM}:
     if (c.recipient !== e.from && c.recipient !== SELF_SENTINEL) -> critical
  ```
  Champs : `calls[].recipient`, `approvals[].spenderMeta`, `sigMeta.deadlineSec`. Les sentinelles (ADDRESS_THIS / MSG_SENDER) sont des constantes de protocole, pas des adresses d'acteurs.
- **Objection.** « Les agrégateurs envoient légitimement la sortie vers un contrat intermédiaire puis vers l'utilisateur. » **Parade** : calculer la **destination finale** après aplatissement ; si le delta final de l'utilisateur correspond à l'intention, `ok`.
- **Risque FP.** Moyen sans décodage des commandes, faible avec.
- **Cas de test Fuji.** Fixture : `execute` avec `recipient` tiers, intention swap : `critical`. Permit2 vers spender hors allowlist : `critical`.
- **Mapping.** ATT&CK T1204.001, T1566.002, T1657. D3FEND D3-CSPP, D3-IAA. CSF 2.0 DE.AE-02, PR.AA-05.

---

### F15. Hooks Uniswap V4 (hook adverse, `hookData`)

- **Mécanisme.** V4 permet à quiconque de créer un pool avec un hook arbitraire ; un hook adverse peut détourner la sortie d'un swap (deltas de retour), prélever des frais cachés ou réentrer. Les pertes connues viennent surtout de bugs de protocoles à hook, pas de l'utilisateur final.
- **Incidents.** Cork, 2025-05-28 : environ 12 M$, contrôle d'accès manquant dans le hook (https://www.zealynx.io/research/protocol-deep-dives/uniswap-v4-hook-attacks). Bunni, 2025-09-02 : 8,4 M$, erreur d'arrondi (https://bravenewcoin.com/insights/bunni-dex-loses-8-4-million-in-sophisticated-smart-contract-attack ; analyse : https://blog.trailofbits.com/2026/07/30/building-secure-uniswap-v4-hooks/).
- **Prévalence.** Faible côté utilisateur ; risque indirect via pools inconnus.
- **Voit le moteur.** Rien du pool.
- **Couvert.** Non, mais le delta final de `buy_or_swap` détecterait un détournement total (pas d'`incoming`).
- **Règle.**
  ```
  if (swap.pool.hook && !hook.allowlisted && hook.permissions.returnDelta) -> warn
  if (e.valueRatio < 0.9) -> warn ; < 0.5 -> critical        // voir F17
  ```
  Champs : `pool.hook`, `hook.permissions` (bits de l'adresse du hook), `valueRatio`.
- **Objection.** « Un pool V4 avec hook est normal et utile. » **Parade** : `warn` hors allowlist seulement ; `critical` si le résultat monétaire est mauvais.
- **Risque FP.** Faible.
- **Cas de test Fuji.** Fixture : pool avec hook non listé, `valueRatio=0.4` : `critical`.
- **Mapping.** ATT&CK T1657 ; T1195 (par analogie). D3FEND D3-DA. CSF 2.0 ID.RA-01, DE.CM-09.

---

### F16. ERC-4337 : UserOperation, paymaster, modules, clés de session

- **Mécanisme.** Un smart account signe une `UserOperation` dont `callData` peut contenir plusieurs appels, l'installation d'un module ERC-7579 (validateur/exécuteur) ou une clé de session ; un paymaster malveillant peut conditionner ou taxer ; l'EntryPoint permet une activation distante et répétée.
- **Incidents.** Pas de montant unitaire fiable. Cadrage : Trail of Bits, « Six mistakes in ERC-4337 smart accounts », 2026-03-11 (référencé sur https://blog.trailofbits.com/2026/07/30/building-secure-uniswap-v4-hooks/) ; arXiv 2512.12174 (activation via EntryPoint).
- **Prévalence.** Faible mais en croissance.
- **Voit le moteur.** Rien.
- **Couvert.** Non.
- **Règle.**
  ```
  u = e.userOp
  if (u.installsModule && !moduleMeta.allowlisted) -> critical
  if (u.paymaster && !u.paymasterMeta.allowlisted) -> warn
  for c of u.innerCalls: appliquer F4 et F5
  ```
- **Objection.** « Les wallets 4337 gèrent déjà ça. » **Parade** : la barrière est indépendante du wallet et ne voit que le calldata décodé.
- **Risque FP.** Faible.
- **Cas de test Fuji.** Fixture `installModule(inconnu)` : `critical`.
- **Mapping.** ATT&CK T1098, T1204. D3FEND D3-EAL, D3-CSPP. CSF 2.0 PR.AA-05, DE.AE-02.

---

### F17. Swap déséquilibré : `minOut` nul, poussière en `incoming`, destinataire tiers

- **Mécanisme.** Le swap rend un `incoming` dérisoire (1 wei d'un token sans valeur) alors que `outgoing` est important ; `amountOutMin = 0` ; `recipient` tiers. Le contrôle `incoming.length === 0` (l. 338) est contourné par la poussière.
- **Incidents.** Pas de perte unitaire citable ; mécanisme déduit du fonctionnement des drainers *(mémoire)*.
- **Prévalence.** Moyenne.
- **Voit le moteur.** `outgoing.usd`, pas `incoming.usd`.
- **Couvert.** Partiel (l. 338).
- **Règle.**
  ```
  r = usd(incoming) / usd(outgoing)
  buy_or_swap: r < 0.5 -> critical ; r < 0.9 -> warn ; usd inconnu -> warn
  ```
  Champs : `incoming[].usd`, `valueRatio`.
- **Objection.** « Les prix des tokens exotiques manquent souvent. » **Parade** : prix inconnu = `warn`, jamais `ok` ; jamais `critical` sur prix absent.
- **Risque FP.** Moyen (tokens illiquides).
- **Cas de test Fuji.** Fixture : out 100 USDC, in 1 wei d'un token jetable : `critical`.
- **Mapping.** ATT&CK T1657, T1036. D3FEND D3-DA. CSF 2.0 DE.AE-02.

---

## 3. Top 5 trous (dans l'ordre de priorité)

1. **Tx non décodable ou sans flux de tokens = `ok`** (F0, F5, F6). Ajouter `sim.decoded/unknownCalls/stateWritesOutsideBalances` et abaisser `confidence` ; ce seul champ aurait porté Bybit, WazirX et Radiant (plus de 1,7 Md$). Le `low_confidence` actuel est du code mort.
2. **Délégation 7702 absente de `buy_or_swap`/`send_to_my_account` et sans évaluation du délégué** (F1, F2). Sortir le test du `switch`, ajouter `allowlisted`, `chainId`, `kind` (révocation = ok). Menace la plus actuelle depuis Pectra (mai 2025) et la plus démontrable sur Fuji.
3. **Âge de contrat en blocs, `warn` seul, aveugle aux CREATE2 non déployés et aux proxys** (F7, F10). Passer à `ageSeconds` + `verified` + `undeployed`, et monter à `critical` quand le contrat reçoit un pouvoir durable (approbation, délégation, valeur native).
4. **Batch/multicall/Universal Router opaques, destinataire des sorties jamais vérifié** (F4, F14, F17). Aplatir `calls[]`, comparer l'ensemble d'actions à l'intention, comparer le `recipient` final à `from` (la boucle l. 350-354 est vide), calculer `valueRatio` contre la poussière.
5. **Intégrité du moteur et de l'historique : logs falsifiables, historique empoisonné, nom de fonction non fiable** (F9, F12). Construire `outgoing/incoming` depuis des deltas d'état et non des events `Transfer`, ne compter comme « connues » que les adresses auxquelles l'utilisateur a envoyé, ignorer les transferts nuls entrants (50 M$ perdus le 2025-12-20).

Hors famille mais observé en lisant `compare.ts` : `pay_someone` ne compare jamais `out.token` à `intent.token` et compare des montants de tokens différents (l. 257-273) ; `wrong_recipient` ne s'exécute que si `counterpartyAddress` est fourni (l. 241).

## 4. Limites de cette recherche

- Plusieurs chiffres sont de seconde main (presse crypto) ; Bybit, WazirX et Radiant sont recoupés par au moins deux sources ; les montants 7702 (146 551 $, 1,54 M$, 2,3 M$, 63 %) viennent de ScamSniffer, SlowMist et USENIX relayés par la presse. Les éléments marqués *(mémoire)* sont à revérifier avant le dossier de défense.
- Le moteur d'effets est absent de `wt/T-103` (seuls `compare.ts` et `types.ts` existent) : les fiches décrivent les champs que `types.ts` devrait porter ; vérifier avec l'auteur du moteur ce qui existe déjà.
- Les cas Fuji sont des fixtures et contrats jetables déployés par nous ; aucune action contre un système réel.
