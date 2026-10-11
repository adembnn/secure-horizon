# 09 - Tokens et DeFi : menaces « j'achète / je swap / je dépose » que Hold up rate

Périmètre : intent `buy_or_swap` (et ses voisins : dépôt, staking, LP, bridge qui, aujourd'hui, retombent dans `buy_or_swap`). Cible : MetaMask, EVM, démo Avalanche Fuji (43113) / C-Chain (43114).
Code lu : `C:\Users\Adem\wt\T-103\app\intent\src\compare.ts` (surtout `checkBuyOrSwap`, l. 319-378) et `types.ts`.

Légende des sources : **[V]** vérifié pendant cette recherche (URL consultée) ; **[M]** de mémoire, à revérifier avant de le citer au jury (date/montant à ±) ; **[~]** mapping par analogie. Aucune action contre un système réel : tous les cas de test sont des contrats déployés par nous sur Fuji.

---

## 0. Ce que fait réellement `checkBuyOrSwap` aujourd'hui (constat)

| Ligne | Règle | Limite |
|---|---|---|
| 326-335 | approbation illimitée -> `warn` | ne regarde PAS le spender. Un swap Uniswap normal (approve MaxUint256 vers Permit2) déclenche un warn : faux positif systématique ; un routeur exploité, lui, ne déclenche rien de plus. |
| 338-347 | `incoming` vide ET `outgoing` non vide -> `critical` | faux positif sur tout bridge, dépôt de staking, dépôt dans un vault sans reçu. Faux négatif dès qu'un seul wei arrive. |
| 350-354 | « check recipient is self » | **boucle vide** (le `if` ne fait rien). Rien ne vérifie le destinataire du token reçu. |
| 357-377 | permit/permit2 vers contrat < 50 blocs -> `critical` | 50 blocs sur Avalanche (~2 s) = ~100 s, pas 10 min comme le commentaire l. 12. Ne s'applique qu'aux permits, et seulement si le spender est dans `counterparties`. |
| 116-127 | `new_contract` (transversal, warn) | s'applique aux contreparties, jamais au **token** reçu (un token créé il y a 3 jours est « vieux » de 6 000 blocs). |
| tout | **`intent.token` / `intent.amount` jamais comparés** à `outgoing`/`incoming` en `buy_or_swap` | `Intent.token` est ambigu (token payé ou acheté ?). Aucune notion de `tokenOut`. |
| tout | **aucune valeur USD en entrée** (`incoming` n'a pas de `usd`), aucune lecture de `minOut`, aucune méta-donnée de token (liste officielle, taxe, revente). | |

Conséquence : aujourd'hui, un swap qui échange 1 000 USDC contre un faux « USDC » honeypot reçu à 1:1 passe **ok** (il y a un outgoing, un incoming, pas d'approbation).

### Extensions de types transversales proposées (réutilisées dans les fiches)

```ts
// Intent
tokenIn?: string; tokenOut?: string;          // adresse OU symbole ; remplace l'ambigu `token` pour buy_or_swap
maxSlippagePct?: number;                      // défaut 1 (stables) / 3 (volatils)
kind += 'bridge' | 'stake_or_deposit' | 'provide_liquidity';

// Effects.incoming[] / outgoing[]
usd?: number; usdSource?: 'chainlink'|'defillama'|'coingecko'|'pool_only'|'none';
minAmount?: string;                           // garantie on-chain (amountOutMin / minShares)
recipient?: `0x${string}`;                    // destinataire effectif décodé du calldata
// Effects (nouveaux blocs)
tokenRisk?: Record<address, {
  inOfficialList: boolean; listSources: string[];        // Uniswap default list, Trader Joe list, CoinGecko
  symbolClashWith?: address;                              // même symbole/nom qu'un token officiel, adresse différente
  ageDays?: number; holders?: number; top10Pct?: number; creatorPct?: number;
  liquidityUsd?: number; lpLockedOrBurnedPct?: number;
  sellSim?: { ok: boolean; reverted?: boolean; roundTripLossPct?: number; atBlockOffsets?: number[] };
  buyTaxPct?: number; sellTaxPct?: number;
  flags: { honeypot, mintable, hiddenOwner, proxy, ownerNotRenounced, taxModifiable,
           transferPausable, blacklist, whitelistOnly, selfdestruct, externalCall, openSource }; // champs GoPlus
}>;
spenderRisk?: Record<address, { officialRouter: boolean; deny: boolean; incidentRef?: string;
  paused?: boolean; tvlDropPct1h?: number; deployedAgeBlocks?: number; verified: boolean }>;
priceSanity?: { inUsd: number; outUsd: number; outMinUsd: number; valueRatio: number };
dataGaps: string[];                           // sources indisponibles -> jamais « ok » silencieux
```

Principe directeur : **« inconnu » n'est pas « ok »**. Si `usdSource` vaut `pool_only`/`none`, ou si la revente n'a pas pu être simulée, on sort au minimum `warn` (« je ne peux pas vérifier »), car un attaquant contrôle le prix de son propre token (cf. M8).

---

## 1. Tableau récapitulatif

| # | Menace | Prévalence | Couvert aujourd'hui ? | Règle clé proposée | Donnée publique | Gravité si ratée |
|---|---|---|---|---|---|---|
| M1 | Faux token (symbole/logo usurpé) | Très élevée | Non | `tokenOut` ∉ liste officielle OU `symbolClashWith` -> critical | Tokenlists (Uniswap, Trader Joe), GoPlus `fake_token`/`trust_list` | Perte totale du montant |
| M2 | Token reçu ≠ annoncé / destinataire ≠ moi / sortie fractionnée | Moyenne (surtout via frontend compromis ou calldata piégée) | Non (boucle vide l. 350) | `incoming.token ≠ intent.tokenOut` ou `recipient ≠ from` -> critical | Aucune (calcul local) | Perte totale |
| M3 | Honeypot (achat ok, revente impossible) | Très élevée | Non | simulation de revente immédiate depuis l'adresse de l'utilisateur | GoPlus `is_honeypot`, simulation fork | Perte totale |
| M4 | Taxes cachées / modifiables | Élevée | Non | `valueRatio` aller-retour + `sellTaxPct` > 10 % ; `taxModifiable` | GoPlus `buy_tax/sell_tax/slippage_modifiable` | Perte 10-100 % |
| M5 | Rug pull (retrait LP, mint caché, privilèges owner) | Très élevée (mémecoins) | Non | score « jeune + LP non verrouillée + concentré + mintable » -> warn/critical | GoPlus, Dexscreener/GeckoTerminal, explorateur | Perte totale, non détectable par simulation seule |
| M6 | Mémecoins launchpad (bonding curve type pump.fun) sur EVM | Élevée | Non | contrat launchpad connu OK mais token < 24 h -> warn fort, non « ok » | Registre launchpads, GoPlus | Perte totale, très rapide |
| M7 | Slippage énorme / sandwich MEV | Moyenne (Avalanche moins que Ethereum), gros incidents ponctuels | Non | `minOutUsd < inUsd × (1 − seuil)` -> warn/critical | Prix oracle indépendant | 1-100 % du swap |
| M8 | Faux pools / prix truqué / liquidité fantôme | Élevée | Non | prix « pool_only » ou liquidité < 10× la taille -> warn ; LP hors factory officielle | Factory officielles, DefiLlama prices, Chainlink | Perte totale |
| M9 | Faux staking / yield (dépôt sans retrait) | Élevée (arnaques « liquidity mining ») | Non (et faux positif sur vrais dépôts) | simuler `redeem/withdraw` immédiat après `deposit` | ERC-4626, GoPlus, audits | Perte totale |
| M10 | Faux bridge | Moyenne | Non (faux positif sur vrais bridges) | contrat de bridge ∈ allowlist officielle + destinataire/chaîne décodés | Adresses officielles (Core/Avalanche Bridge, CCTP, Stargate) | Perte totale |
| M11 | Airdrop piégé (nom = URL de phishing) | Très élevée (spam permanent) | Non | regex nom/symbole + token non sollicité ; bloquer toute interaction | ScamSniffer, GoPlus `is_airdrop_scam`, listes spam | Indirecte (déclenche M12) |
| M12 | Approbations illimitées à routeurs exploités/obsolètes, Permit2 | Élevée, gros montants | Partielle (l. 326 warn aveugle ; l. 357 permit récents) | spender ∉ allowlist -> warn ; spender ∈ deny -> critical ; unlimited vers Permit2 canonique = info | Denylist incidents, DefiLlama hacks, revoke.cash | 3-12 M$ par incident, à l'échelle de l'utilisateur : tout le solde |
| M13 | Dépôt sur protocole en cours d'exploit / pausé / dépeg | Moyenne, impact énorme | Non | `paused` ou `tvlDropPct1h` > 20 % ou alerte incident -> critical | DefiLlama TVL, flux d'alertes, `paused()` | Perte totale |
| M14 | Wrap/unwrap trompeur, variantes bridgées (USDC vs USDC.e) | Faible (wrap) / moyenne (variantes) | Non | wrapper ≠ WAVAX canonique, ou variante bridgée acquise sans l'avoir demandée -> warn/critical | Adresses canoniques, tokenlist | Perte partielle ou totale |
| M15 | Frontend légitime compromis (calldata altérée) | Faible fréquence, très gros impact | **Oui en principe** (c'est le cœur : intention vs effets), mais incomplet | M2 + M12 couvrent le cas | - | Perte totale |

---

## 2. Fiches

### M1 - Faux token (même symbole/logo que USDC/AVAX/WAVAX)

- **Mécanisme.** N'importe qui déploie un ERC-20 `symbol()="USDC"`, `name()="USD Coin"`, `decimals=6`, logo copié. Il le fait lister sur un agrégateur de prix, ou le fait arriver dans le wallet via airdrop (M11). L'utilisateur « achète de l'USDC » depuis une page qui a pré-rempli l'adresse du faux token, ou colle un lien qui pointe vers un faux pool. Les wallets affichent le symbole, pas l'adresse.
- **Incidents.** Tokens usurpant USDT/USDC/WETH : pratique permanente et documentée par les suivis de wallet drainers (ScamSniffer, `https://scamsniffer.io` [M], rapport annuel 2024 : ordre de 490 M$ volés par phishing de signatures sur l'année, ~330 000 victimes [M], à revérifier avant citation). Cas d'archétype : le **« Squid Game token »** (oct. 2021, ~3,4 M$, honeypot + faux symbole) [M] reste la référence, hors fenêtre 2023-26.
- **Prévalence.** Très élevée ; c'est le vecteur n°1 du spam de tokens sur toutes les EVM.
- **Ce que voit le moteur.** `incoming[0] = {token:0xFAKE..., symbol:'USDC', amount:'1000'}`. Il voit un symbole ; il ne sait pas que l'adresse est fausse. Les tokens natifs Avalanche : USDC `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`, WAVAX `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` (C-Chain) [M, à contrôler avec la tokenlist officielle avant usage].
- **Couvert aujourd'hui ?** Non. Aucune ligne ne lit `incoming.token` (le seul usage de `incoming` est l. 338 et l. 350, ce dernier vide).
- **Règle.**
  ```
  for inc of incoming:
    meta = tokenRisk[inc.token]
    if intent.tokenOut is symbol S and inc.token != canonical(S, chainId)  -> critical 'wrong_token_received'
    if meta.symbolClashWith (même symbol/name que token officiel, autre adresse) -> critical 'fake_token'
    if !meta.inOfficialList and meta.liquidityUsd < 100_000                 -> warn  'unlisted_token'
  ```
  Champs : `tokenRisk.inOfficialList`, `symbolClashWith`, `Intent.tokenOut`. Le « canonical(S) » vient de l'union des tokenlists (Uniswap default, Trader Joe, listes Circle/Tether publiées par les émetteurs).
- **Objection + parade.** « Beaucoup de vrais tokens récents ne sont dans aucune liste ». Parade : `unlisted` ne donne que `warn` ; `critical` seulement si **collision de nom/symbole** avec un token officiel, ou si l'utilisateur a dit un symbole connu et reçoit une autre adresse. « USDC.e vs USDC » : voir M14.
- **Risque FP.** Faible pour le critical (collision exacte), moyen pour le warn (tokens neufs légitimes, d'où la nécessité de présenter « pas dans les listes officielles », pas « arnaque »).
- **Test Fuji.** `FakeUSDC` (6 décimales, symbole « USDC », adresse ≠ USDC Fuji de Circle `0x5425890298aed601595a70AB815c96711a31Bc65` [M]) ; mock router qui échange 1 AVAX contre 1 000 FakeUSDC. Attendu : critical `fake_token`. Témoin : swap WAVAX->USDC réel testnet via faux router = ok.
- **Mapping.** ATT&CK T1036.005 Match Legitimate Name [~] ; T1657 Financial Theft. D3FEND D3-IRA Identifier Reputation Analysis [~]. NIST CSF 2.0 : DE.AE-02, ID.RA-02, PR.PS-01 (bonnes pratiques de gestion de config - allowlist).

---

### M2 - Token reçu ≠ token annoncé ; destinataire ≠ moi ; sortie fractionnée

- **Mécanisme.** La tx se présente comme « swap AVAX -> X » mais (a) le champ `to`/`recipient` du routeur est une adresse attaquante (les routeurs acceptent un destinataire arbitraire) ; (b) la route finit sur un autre token que X ; (c) une fraction cachée (« fee » de 20-50 %) part vers un tiers ; (d) route passant par un pool contrôlé (voir Sushi RouteProcessor2 : route arbitraire non validée).
- **Incidents.** Frontends compromis où la calldata est remplacée : **Ledger Connect Kit** (14 déc. 2023, drainer injecté dans des dApps, ~600 k$ avant retrait) [M] ; **Bybit** (21 fév. 2025, ~1,5 Md$, UI Safe altérée : la signature affichait autre chose que l'effet) [M]. Cas de route piégée : SushiSwap RouteProcessor2, 9 avr. 2023, 3,3 M$ **[V]** `https://www.coindesk.com/tech/2023/04/09/sushi-dex-approval-contract-exploited-for-33m` et analyse `https://www.certik.com/skynet-report/post-mortem-sushiswap` (route fournie par l'appelant non vérifiée).
- **Prévalence.** Moyenne ; faible fréquence mais c'est exactement le cas d'usage « ce que tu veux ≠ ce que tu signes » : le produit doit le couvrir sans condition.
- **Ce que voit le moteur.** `outgoing` (ce que je paie), `incoming` (ce que *je* reçois, selon la simulation), `raw.selector`. Si l'output part vers un tiers, `incoming` est vide -> `no_incoming` critical (OK) ; si seulement une partie part ailleurs, `incoming` existe mais plus petit : **rien ne le détecte**.
- **Couvert aujourd'hui ?** Partiellement : l. 338-347 (aucun token reçu). Pas couvert : token différent, montant réduit, destinataire mixte. L. 350-354 est une boucle vide.
- **Règle.**
  ```
  exp = priceSanity (valeur USD sortante)
  if intent.tokenOut set and no incoming matches intent.tokenOut (adresse)      -> critical 'wrong_token_received'
  for out of outgoing: if out.to is EOA and out.to != trustedSet(intent)        -> critical 'funds_to_third_party'
  if sum(incoming.usd) < sum(outgoing.usd) * (1 - maxLossPct)                   -> warn/critical (voir M7)
  if decoded.recipient != effects.from                                          -> critical 'output_not_to_me'
  ```
  Champs : `Intent.tokenOut`, `incoming.recipient`, `incoming.usd`, `outgoing.usd`. `outgoing.to` est déjà présent.
- **Objection + parade.** « Certains swaps envoient légitimement à un autre destinataire (acheter pour un ami, sortir vers un CEX) ». Parade : le destinataire ≠ moi reste admis **seulement si** l'utilisateur l'a déclaré (`counterpartyAddress`) ; sinon critical. « Les agrégateurs prennent une commission » : tolérance fixe (ex. ≤ 1 % de la valeur, cf. frais MetaMask de swap ~0,875 % [M]) ; au-delà warn.
- **Risque FP.** Faible si la tolérance de frais est bien réglée ; les swaps via contrats de relais (UniversalRouter avec constantes `MSG_SENDER`/`ADDRESS_THIS`) doivent être décodés pour ne pas être pris pour des tiers.
- **Test Fuji.** `SplitRouter` mock : reçoit 1 AVAX, envoie 60 % du token à l'attaquant, 40 % à l'utilisateur. Attendu critical. Variante : recipient = autre EOA.
- **Mapping.** ATT&CK T1657 Financial Theft ; T1565.002 Transmitted Data Manipulation [~] (calldata altérée) ; T1195.002 [~] pour le frontend compromis. D3FEND D3-DA Dynamic Analysis (exécution simulée), D3-IAA Identifier Activity Analysis. NIST CSF : DE.CM-09, DE.AE-02, RS.MI-01 (arrêt avant signature).

---

### M3 - Honeypot (achat ok, revente impossible)

- **Mécanisme.** Le token laisse acheter (transfer depuis le pool) mais `transfer`/`transferFrom` vers le pool revert pour tout sauf l'owner (liste blanche, blacklist, `tradingEnabled=false` à la vente, max sell = 0, `tx.origin` check). Variantes évoluées : blocage différé (`block.number > X`), modification via proxy upgradable, détection de simulation (`tx.gasprice==0`, `block.coinbase`, `tx.origin==address(0)`).
- **Incidents.** Archétype Squid Game (oct. 2021) [M]. Dans la fenêtre 2023-26 la littérature GoPlus/TokenSniffer/Honeypot.is décrit des dizaines de milliers de honeypots par an ; je n'ai pas de chiffre sourcé à citer en l'état : **[à compléter avec le rapport annuel GoPlus, `https://gopluslabs.io`]**. Sur les rapports Solidus (« Rug Pull Report », `https://www.soliduslabs.com/reports/rug-pull-report` **[V]** page existante, chiffres de fond non relus) : l'essentiel des tokens listés sur Uniswap v2 sur la période 2021-22 sont des arnaques ; à présenter comme « ordre de grandeur historique », pas comme chiffre 2026.
- **Prévalence.** Très élevée ; c'est la première chose qu'un utilisateur d'un « memecoin chaud » rencontre.
- **Ce que voit le moteur.** Un swap aller propre : `outgoing 1 AVAX`, `incoming 1 000 000 TOKEN`. Il n'a aucun moyen de savoir que la revente échoue : le comparateur ne simule que la tx signée.
- **Couvert aujourd'hui ?** Non.
- **Règle.**
  ```
  simulate sell: après la tx (fork état post-achat), appeler swap(tokenIn=incoming.token, amount=incoming.amount, from=user, vers pool/router de la même route)
  if sellSim.reverted                                         -> critical 'cannot_resell'
  if sellSim.roundTripLossPct > 25 (stable) / 35 (volatil)    -> critical (voir M4)
  also at block offsets +1, +20, +300 (anti blocage différé)  -> sellSim.atBlockOffsets
  GoPlus is_honeypot==1 || cannot_sell_all==1 || transfer_pausable==1 -> critical
  if sellSim could not run (RPC/fork down)                     -> warn 'sell_not_verified' (jamais ok)
  ```
  Champs : `tokenRisk.sellSim`, `flags.honeypot/transferPausable/blacklist/whitelistOnly`.
- **Objection + parade.** (1) « Un honeypot peut détecter la simulation ». Parade : simuler **avec le vrai `from` de l'utilisateur, le vrai gas price et le vrai `block.coinbase`**, plus un second contrôle statique (GoPlus + analyse de code : lecture de `tx.origin`, `gasleft`, `block.timestamp` dans `_transfer`). (2) « L'owner peut activer le piège après coup ». Parade : l'état `ownerNotRenounced && taxModifiable && proxy` est un signal séparé (M4/M5) ; on ne prétend pas garantir l'avenir : le message dit « revente possible *maintenant* ». (3) « La revente simulée dans un pool peu profond renvoie un prix faux ». Parade : on mesure la **capacité** de revente (non-revert + perte aller-retour), pas la valeur.
- **Risque FP.** Moyen : tokens avec fenêtre de lancement (`tradingEnabled` légitimement fermé), tokens à blacklist (USDC, USDT peuvent geler une adresse). Parade : blacklist d'émetteur régulé (Circle/Tether) = info, pas critical.
- **Test Fuji.** `HoneypotToken` : `_transfer(to=pair)` revert si `from != owner`. Router mock qui fait l'achat. Attendu : critical `cannot_resell`. Variante blocage différé (revert si `block.number > deploy+10`) : simulation à +20 blocs doit l'attraper. Témoin : token standard = ok.
- **Mapping.** ATT&CK T1657 Financial Theft ; T1204 User Execution [~]. D3FEND D3-DA Dynamic Analysis (sandbox du comportement), D3-IRA. NIST CSF : DE.AE-02, DE.CM-09, RS.MI-01.

---

### M4 - Taxes cachées ou modifiables

- **Mécanisme.** Taxes sur transfert/achat/vente codées dans `_transfer` (parfois 0 % à l'achat puis 90-99 % à la vente), modifiables par l'owner (`setTax`, `setFees`), ou fee-on-transfer/rebasing qui livre moins que la quote. Le swap « marche » mais la sortie réelle est amputée, ou le sera quand l'owner montera la taxe après l'afflux.
- **Incidents.** Pattern classique des tokens « SafeMoon-like » (SafeMoon : exploit burn public le 28 sept. 2023, ~8,9 M$ [M]) ; les listes GoPlus/TokenSniffer ont un champ dédié (`sell_tax`, `slippage_modifiable`, `personal_slippage_modifiable`) **[V]** existence documentée dans `https://docs.gopluslabs.io` (consultation des noms de champs non refaite : à contrôler).
- **Prévalence.** Élevée sur les mémecoins ; quasi nulle sur tokens officiels.
- **Ce que voit le moteur.** Le **vrai** effet de la tx simulée est correct pour l'achat (la taxe d'achat est visible dans `incoming`), pas pour la vente. Si l'achat est taxé à 25 %, l'écart entre `outgoing.usd` et `incoming.usd` est visible **si on a un prix indépendant**.
- **Couvert aujourd'hui ?** Non (pas d'USD côté incoming, pas de revente).
- **Règle.**
  ```
  valueRatio = incoming.usd / outgoing.usd           (prix indépendant, pas le prix du pool)
  if valueRatio < 0.90 -> warn ; < 0.70 -> critical    (hors frais routeur ≤ 1 % + impact de prix annoncé)
  sellSim.roundTripLossPct = 1 - (valeur revente simulée / outgoing.usd)
  if roundTripLossPct > 20 -> warn ; > 40 -> critical
  if flags.taxModifiable && !ownerRenounced -> warn 'tax_can_change'
  ```
  Champs : `incoming.usd`, `tokenRisk.buyTaxPct/sellTaxPct/taxModifiable`.
- **Objection + parade.** « Un pool peu liquide a lui-même 10 % d'impact de prix ». Parade : on sépare impact de marché (quoter on-chain) et taxe de token (écart résiduel) ; on explique les deux, on ne les confond pas. « Les tokens à taxe légitimes (reflection) existent ». Parade : warn, pas critical, tant que la taxe < 10 % et immuable.
- **Risque FP.** Moyen (tokens à frais honnêtes) ; mitigé par les seuils.
- **Test Fuji.** `TaxToken` : 0 % achat, 95 % vente, `setSellTax` owner. Attendu : critical par simulation de revente (perte 95 %) + warn `tax_can_change`.
- **Mapping.** ATT&CK T1657 ; T1565 [~]. D3FEND D3-DA, D3-IRA. NIST CSF : DE.AE-02, DE.CM-09.

---

### M5 - Rug pull (retrait de liquidité), mint caché, privilèges owner

- **Mécanisme.** (a) L'équipe retire la LP (non verrouillée) ; (b) fonction `mint`/`setBalance`/`_mint` privilégiée gonfle la supply puis vend ; (c) `owner` peut blacklist/pauser/changer taxes (voir M3/M4) ; (d) proxy upgradable remplace l'implémentation ; (e) concentration > 50 % chez le créateur.
- **Incidents.** Étude Solidus **[V]** (page : `https://www.soliduslabs.com/reports/rug-pull-report`) : rug pulls « endémiques » sur DeFi. Mint par clé compromise sur token légitime : **Gala Games, 20 mai 2024**, ~5 Md GALA mintés (~21 M$) [M]. Mémecoins à insiders : **$LIBRA** (14 fév. 2025, Solana, plusieurs centaines de M$ de pertes retail) [M] et **$HAWK** (déc. 2024, Solana) [M] : hors EVM mais le schéma est le même et sert d'archétype au jury.
- **Prévalence.** Très élevée sur les tokens < 7 jours.
- **Ce que voit le moteur.** Rien : un rug par retrait LP est valide jusqu'à l'instant où il survient. La simulation de revente passe.
- **Couvert aujourd'hui ?** Non.
- **Règle (score statique, pas simulation).**
  ```
  risk = 0
  if ageDays < 3: risk += 2 ; elif ageDays < 30: risk += 1
  if lpLockedOrBurnedPct < 80: risk += 2
  if flags.mintable && !ownerRenounced: risk += 2
  if flags.hiddenOwner || flags.proxy&&!ownerRenounced: risk += 1
  if top10Pct > 60 || creatorPct > 20: risk += 1
  if liquidityUsd < 20 * tradeUsd: risk += 1
  risk>=5 -> critical 'rug_risk_high' ; risk 3-4 -> warn
  ```
  Champs : `tokenRisk.ageDays` (en jours, pas en blocs), `lpLockedOrBurnedPct`, `mintable`, `ownerNotRenounced`, `top10Pct`, `liquidityUsd`. Conversion bloc/jour Avalanche C-Chain : ~43 200 blocs/jour (blocs ~2 s) [M].
- **Objection + parade.** « Beaucoup de projets sérieux ont un owner et un mint (stablecoins, gouvernance) ». Parade : `inOfficialList` neutralise le score pour les tokens listés ; le message dit « risque de rug : ce n'est pas une preuve d'arnaque ». « Le score est arbitraire ». Parade : on publie la table de poids et on l'évalue sur un jeu de tokens étiquetés (GoPlus vs historique) dans la fiche de défense (faux positifs/négatifs mesurés).
- **Risque FP.** Moyen-élevé sur les lancements honnêtes jeunes (c'est accepté : warn, pas bloquant).
- **Test Fuji.** `RugToken` : LP appartenant à l'owner (non verrouillée), `mint(onlyOwner)`, age 5 min, top1 holder 90 %. Attendu critical. Témoin : token vieux de 30 j, LP brûlée, owner renoncé = ok.
- **Mapping.** ATT&CK T1657 ; T1498/T1565 non applicable ; D3FEND D3-IRA, D3-UBA [~]. NIST CSF : ID.RA-05, DE.AE-02.

---

### M6 - Mémecoins « pump.fun-like » sur EVM (launchpads à bonding curve)

- **Mécanisme.** Plateformes où n'importe qui crée un token en un clic, vendu sur une courbe de liaison puis « gradué » vers un AMM. Sur EVM : four.meme (BNB Chain, 2024-25) [M], Clanker/Zora (Base) [M] ; sur Avalanche l'écosystème de « token launch » est plus étroit : à vérifier au moment de la démo. Le contrat launchpad est *légitime* ; le token qu'il émet est jetable. Risques : insiders, sniping, retraits coordonnés, pas de « revente » difficile mais prix s'effondre.
- **Incidents.** Archétype Solana (pump.fun) : $LIBRA et $HAWK (cf. M5). Rug EVM de memecoins documentés par ScamSniffer/Chainalysis ; **[à compléter : incident EVM daté avec URL]** (je n'ai pas pu en vérifier un nommé dans le temps imparti).
- **Prévalence.** Élevée ; durée de vie de la plupart des tokens très courte.
- **Ce que voit le moteur.** Un swap/achat normal sur contrat réputé (launchpad connu). `counterparties[i].ageBlocks` du **launchpad** est grand -> aucun signal, alors que le **token** est vieux de 40 s.
- **Couvert aujourd'hui ?** Non (le signal d'âge porte sur la contrepartie, pas sur le token acheté).
- **Règle.**
  ```
  if tokenRisk.ageDays < 1 (ou ageBlocks(token) < 43_200) :
      level = max(level, warn) ; reason 'token_under_24h'
  if token créé par launchpad ET holders < 50 ET creatorPct > 10 -> critical
  ```
  Champs : `tokenRisk.ageDays`, `holders`, `creatorPct`. Registre local des factories de launchpads.
- **Objection + parade.** « Acheter un memecoin du jour est le but de l'utilisateur ; vous le bloquez ». Parade : on ne bloque jamais le warn ; l'intent déclaré « acheter un token neuf » est accepté, mais le message chiffre : « 3 holders, 90 % chez le créateur ». Critical seulement pour les combinaisons à haut risque.
- **Risque FP.** Élevé (c'est la zone la plus subjective) ; assumer warn.
- **Test Fuji.** `LaunchpadMock` + token créé 30 s avant, 90 % au créateur, 3 holders. Attendu : warn `token_under_24h` + critical sur concentration.
- **Mapping.** ATT&CK T1657. D3FEND D3-UBA, D3-IRA. NIST CSF : ID.RA-05, DE.AE-02.

---

### M7 - Slippage énorme / sandwich MEV

- **Mécanisme.** Un site fixe `amountOutMin = 0` (ou slippage 50-100 %) : un bot met la tx en sandwich et capte la différence ; ou swap sur pool très peu liquide : le prix d'exécution est catastrophique. Le user ne voit « 1 AVAX -> X » sans mesurer la garantie.
- **Incidents.** **Aave interface, 12 mars 2025** : swap d'~50 M$ aUSDT contre AAVE via CoW Swap sur pool peu profond, ~36 k$ reçus (perte >99 %) [M] ; l'interface avait affiché un avertissement. Sandwich industriels : **jaredfromsubway.eth** sur Ethereum 2023 (dizaines de M$ extraits en quelques mois) [M]. **[V] pas de chiffre vérifié pour 2024-25** ; si cité, utiliser EigenPhi (`https://eigenphi.io`) après lecture.
- **Prévalence.** Moyenne ; **sur Avalanche C-Chain, les sandwichs existent mais sont moins industrialisés que sur Ethereum** (blocs courts, pas de relais privé dominant) : formuler avec prudence.
- **Ce que voit le moteur.** La simulation donne la sortie *attendue maintenant*, pas la garantie. Le champ qui compte, `amountOutMin` (calldata), n'est pas dans `Effects`.
- **Couvert aujourd'hui ?** Non.
- **Règle.**
  ```
  guaranteedLossPct = 1 - incoming.minAmount_usd / outgoing.usd
  executionLossPct  = 1 - incoming.usd / outgoing.usd
  if guaranteedLossPct > max(2*Intent.maxSlippagePct, 5)   -> critical 'slippage_unbounded'
  if guaranteedLossPct > Intent.maxSlippagePct              -> warn
  if incoming.minAmount == 0                                -> critical
  if pool depth < 20 * outgoing.usd or priceImpact > 3%     -> warn 'illiquid_pool'
  ```
  Champs : `incoming.minAmount`, `Effects.slippage`, `priceImpactPct` du quoter, `Intent.maxSlippagePct`. Décodage du calldata Trader Joe LB / Uniswap V3 / Universal Router nécessaire.
- **Objection + parade.** « Les tokens volatils/petits ont besoin de gros slippage ». Parade : le seuil dépend de l'intent (stable vs volatil) ; au-delà de 5 %, la raison est affichée mais reste warn pour un volatil si le pool est assez profond. « La protection MEV est un problème de route, pas de signature ». Parade : on recommande sans bloquer (RPC privé / protection native du wallet, selon ce qui existe sur Avalanche - **à vérifier**).
- **Risque FP.** Moyen sur tokens à faible liquidité (on prévient quand même).
- **Test Fuji.** `SlippageRouter` mock avec `amountOutMin=0` + pool manipulé ; attendu critical `slippage_unbounded`. Variante : bot de sandwich local sur fork (notre environnement) pour montrer la perte.
- **Mapping.** ATT&CK T1657 ; T1565 [~] (manipulation de prix). D3FEND D3-DA. NIST CSF : DE.AE-02, ID.RA-05.

---

### M8 - Faux pools de liquidité / prix truqué / ajout de liquidité piégé

- **Mécanisme.** (a) L'attaquant crée un pool bidon avec très peu de liquidité de la vraie paire (ex. 1 AVAX contre un faux USDC) pour gonfler son prix ; (b) ajout de liquidité : le LP token est celui d'une factory non officielle ou le pool est verrouillé par l'owner ; (c) pool de prix manipulé pour fausser la valeur affichée. Les calculs « valeur USD » basés sur le pool lui-même sont donc inutilisables.
- **Incidents.** Manipulation d'invariants avec faux tokens : **Balancer V2, 3 nov. 2025, ~128 M$ sur 7+ chaînes dont Avalanche** **[V]** `https://www.dlnews.com/articles/defi/balancer-suffers-128m-exploit-despite-multiple-audits` ; `https://blocksec.com/blog/in-depth-analysis-the-balancer-v2-exploit` ; `https://blog.verichains.io/p/balancer-exploit-small-rounding-errors` (liste Avalanche). Archétype Avalanche : **Platypus (16 fév. 2023, ~8,5 M$)** [M].
- **Prévalence.** Élevée.
- **Ce que voit le moteur.** `priceSanity` est impossible si la seule source de prix est le pool de la tx (`usdSource='pool_only'`).
- **Couvert aujourd'hui ?** Non.
- **Règle.**
  ```
  if provide_liquidity: LP token's factory ∉ OFFICIAL_FACTORIES(chain)        -> warn/critical
  if usdSource ∈ ['pool_only','none']                                          -> warn 'unpriced' (jamais ok)
  if |priceIndependent - pricePool| / priceIndependent > 5%                     -> critical 'pool_price_off'
  if poolLiquidityUsd < 10 * tradeUsd                                           -> warn
  ```
  Champs : `usdSource`, `OFFICIAL_FACTORIES` (Trader Joe LB/V1, Pangolin, Uniswap V3 si déployé), `pool.liquidityUsd`.
- **Objection + parade.** « Les tokens neufs n'ont pas d'oracle ». Parade : c'est précisément le cas où on répond « je ne peux pas vérifier » plutôt qu'« ok ».
- **Risque FP.** Moyen (tokens neufs honnêtes).
- **Test Fuji.** Pool `FakeUSDC/WAVAX` amorcé avec 0,01 AVAX ; prix pool = 1 FakeUSDC = 1 USDC. Attendu : warn `unpriced` + critical `fake_token` (M1).
- **Mapping.** ATT&CK T1565 [~] ; T1657. D3FEND D3-IRA, D3-DA. NIST CSF : ID.RA-05, DE.AE-02.

---

### M9 - Faux staking / yield (dépôt sur un contrat sans retrait)

- **Mécanisme.** « Stake X pour 300 % APY » ; `deposit()` accepte, `withdraw()` revert ou renvoie 0, ou impose un verrou perpétuel ; ou `approve` illimité exigé pour « activer le mining ». Variantes : « liquidity mining » prétendant combler une pénurie, souvent promues par messageries privées.
- **Incidents.** Fraudes « DeFi liquidity mining / pig butchering » : alertes IC3 du FBI et rapports Chainalysis (`https://www.ic3.gov`, `https://www.chainalysis.com`) **[M, à citer avec numéro de PSA exact après lecture]**. Archétype : tout contrat Ponzi à retrait conditionnel type Forsage (poursuites US 2022) [M].
- **Prévalence.** Élevée dans les arnaques à l'investissement.
- **Ce que voit le moteur.** `outgoing X -> contrat`, `incoming` = soit rien (-> `no_incoming` critical, bon réflexe mais **même résultat pour Benqi/Aave légitimes**, d'où FP), soit un « receipt token » (opaque).
- **Couvert aujourd'hui ?** Partiellement et mal : `no_incoming` critical sur un dépôt Aave est un **faux positif** ; sur un faux staking il est « juste par accident ».
- **Règle.**
  ```
  Intent.kind='stake_or_deposit'  (nouveau kind)
  after deposit simulate: redeem()/withdraw()/exit()/previewRedeem (ERC-4626 : maxWithdraw(from), previewRedeem(shares))
  if redeem reverts  OR  previewRedeem_usd < 0.95 * outgoing.usd (hors période de verrouillage documentée) -> critical 'cannot_withdraw'
  if contract ∉ allowlist (Benqi, Aave v3, sAVAX, Trader Joe vaults…) && !openSource -> warn
  ```
  Champs : `Intent.kind += stake_or_deposit`, `tokenRisk.sellSim` appliqué au receipt token, `spenderRisk.verified`.
- **Objection + parade.** « Staking avec période de unbonding est légitime (déposer 7 jours, retirer ensuite) ». Parade : verrou temporel documenté sur protocole connu = info ; contrat inconnu avec verrou = warn ; contrat inconnu sans possibilité de retrait simulé = critical.
- **Risque FP.** Moyen.
- **Test Fuji.** `FakeVault` : `deposit()` ok, `withdraw()` revert (`onlyOwner`). Attendu critical. Témoin : un vault ERC-4626 OpenZeppelin = ok.
- **Mapping.** ATT&CK T1657 ; T1566 [~] (vecteur d'engagement). D3FEND D3-DA, D3-IRA. NIST CSF : DE.AE-02, RS.MI-01.

---

### M10 - Faux bridge

- **Mécanisme.** Faux site de bridge (copie du Core / Avalanche Bridge, de Stargate, d'un bridge de campagne d'airdrop) : l'utilisateur envoie un token vers un contrat/EOA attaquant, ou signe une approbation illimitée. Aucun token reçu sur la chaîne de départ de toute façon (c'est normal pour un bridge).
- **Incidents.** Faux sites de bridge diffusés pendant les campagnes d'airdrop (Blast, 2024) : suivi ScamSniffer (`https://scamsniffer.io`) [M, à relire]. Bridges légitimes compromis (pas « faux » mais même effet pour l'utilisateur) : **Orbit Bridge, 1er janv. 2024, ~81 M$** [M] ; Multichain, juillet 2023, ~126 M$ (+ effondrement des tokens `anyXXX` wrappés, cf. M14) [M].
- **Prévalence.** Moyenne, pics lors d'airdrops.
- **Ce que voit le moteur.** Un `outgoing` et un `to` (le contrat). Aucune notion de « bridge » : `Intent.kind` n'a pas de valeur bridge, donc l'utilisateur dira `buy_or_swap` (ou `send_to_my_account`).
- **Couvert aujourd'hui ?** Non. Et faux positif : `no_incoming` critical sur un vrai bridge.
- **Règle.**
  ```
  Intent.kind='bridge' : { destChain, token, amount, recipient=self }
  decode bridge calldata -> {destChainId, recipient, token}
  if contract ∉ OFFICIAL_BRIDGES(chain)                   -> critical 'unknown_bridge'
  if recipient != self or destChainId != intent.destChain -> critical
  ```
  Champs : `Intent.kind += bridge`, `Effects.bridge {destChainId, recipient}`, `OFFICIAL_BRIDGES` (Avalanche Bridge, Circle CCTP TokenMessenger, Stargate/LayerZero, Core), maintenu à la main + vérifié sur les docs officielles.
- **Objection + parade.** « Une allowlist figée devient vite fausse ». Parade : la liste est un fichier versionné, daté, signé en commit ; absence = warn 'bridge non reconnu' (pas critical) si le contrat est ancien, vérifié et audité.
- **Risque FP.** Moyen (nouveaux bridges).
- **Test Fuji.** `FakeBridge` qui prend 1 000 USDC testnet et ne les crédite pas ; attendu critical `unknown_bridge`. Témoin : CCTP testnet officiel = ok.
- **Mapping.** ATT&CK T1566.002 Spearphishing Link [~] ; T1657. D3FEND D3-URA URL Reputation Analysis, D3-EAL Executable Allowlisting [~]. NIST CSF : DE.AE-02, PR.PS-01.

---

### M11 - Airdrop de tokens piège (nom = URL de phishing)

- **Mécanisme.** Un token est déposé dans des milliers de wallets (`name = "Visit xyz.claim-now.io to claim 5 000 USDC"`, symbole cyrillique/Unicode). Le wallet l'affiche avec une valeur factice. L'utilisateur clique le lien (phishing) ou tente de **vendre** le token (swap vers un faux DEX, ou approbation du token piégé à un spender attaquant : le token appelle à la signature de `approve` un contrat vide qui capture la perm d'autres tokens via Permit2 ou transferFrom caché). Variante : **dust/address poisoning** - micro-transferts depuis une adresse ressemblant à une adresse de l'utilisateur.
- **Incidents.** Spam d'airdrop : masse continue sur EVM [M]. Address poisoning : **3 mai 2024, ~1 155 WBTC (~68 M$)** envoyés à une adresse empoisonnée, partiellement récupérés après négociation [M]. Données chiffrées de volume : ScamSniffer (`https://scamsniffer.io`) [M, à relire].
- **Prévalence.** Très élevée (permanente).
- **Ce que voit le moteur.** Dans `buy_or_swap`, c'est typiquement un `outgoing` avec le token piégé comme `token`, ou une `approval` pour ce token. Le moteur voit un symbole fantaisiste.
- **Couvert aujourd'hui ?** Non pour le token ; `lookalike_address` couvre l'empoisonnement d'adresse (l. 144-156) pour les transferts.
- **Règle.**
  ```
  for t of tokens(outgoing ∪ incoming ∪ approvals):
     if matches(t.name|symbol, /(https?:|www\.|\.(com|io|xyz|net|org|app)\b|claim|visit|reward|airdrop|voucher)/i)
        or hasInvisibleOrMixedScript(t.name|symbol)          -> critical 'phishing_token_name'
     if t unsolicited (jamais interagi) && inOfficialList==false -> flag 'spam_token' ; interdit d'approuver / vendre via spender inconnu
  ```
  Champs : `tokenRisk.nameFlags`, `GoPlus is_airdrop_scam` (si exposé), `firstSeenByUser` pour les tokens.
- **Objection + parade.** « Des tokens légitimes ont des noms qui contiennent des URLs (ex. promotions de DEX) ». Parade : seulement critical si **l'utilisateur interagit** (approve/sell) avec un token non listé et non sollicité ; sinon c'est un simple badge.
- **Risque FP.** Faible à moyen.
- **Test Fuji.** `ClaimToken` nommé `"Visit scam-claim.test to redeem"` airdroppé sur un wallet de test ; tentative de swap -> critical. (Domaine réservé `.test`, aucune ressource réelle.)
- **Mapping.** ATT&CK T1566.002 Phishing: Spearphishing Link [~]. D3FEND D3-URA, D3-IRA. NIST CSF : DE.AE-02, ID.RA-02.

---

### M12 - Approbations illimitées à routeurs exploités/obsolètes ; Permit2

- **Mécanisme.** L'utilisateur a laissé une approbation infinie à un routeur d'agrégateur ; une faille ultérieure (appel arbitraire, route non validée) permet à n'importe qui de tirer les fonds de **tous** les approvers. L'utilisateur n'a rien signé de suspect *le jour du vol*. Le risque est dans la signature d'aujourd'hui : « approve illimité à ce routeur » (ou permit2 allowance) vers un contrat ensuite compromis. Les surfaces sont : approve classique, `increaseAllowance`, Permit2 (`approve` à Permit2 puis `allowance` par spender), `permit` EIP-2612.
- **Incidents.**
  - SushiSwap RouteProcessor2 : 9 avr. 2023, ~3,3 M$ **[V]** (CoinDesk, CertiK ci-dessus).
  - Dexible : 17 fév. 2023, ~1,5-2 M$ **[V partiel]** `https://www.binance.com/en/square/post/229874` (chiffre 2 M$ ; autres sources 1,5 M$).
  - Socket (Gateway) : 16 jan. 2024, ~3,3 M$, 219 utilisateurs **[V]** `https://cointelegraph.com/news/socket-protocol-loses-3-3-million-confirmed-approval-exploit` et `https://cointelegraph.com/news/socket-protocol-recovers-two-thirds-stolen-eth-from-hack`.
  - Seneca : 28 fév. 2024, ~6 M$ (appel arbitraire) [M].
  - LI.FI : 16 juil. 2024, **~11,6 M$**, 153 portefeuilles, **uniquement approbations infinies** **[V]** `https://li.fi/knowledge-hub/incident-report-16th-july` (le détail « fini vs infini » est la meilleure justification de la règle).
  - 1inch (résolveur Fusion V1 tiers) : 5 mars 2025, > 5 M$ **[V]** `https://blocksec.com/blog/1inch-incident-from-calldata-corruption-to-forged-settlement-binary-exploitation-goes-on-chain`.
- **Prévalence.** Élevée en fréquence moyenne, impact individuel total (le solde approuvé).
- **Ce que voit le moteur.** `approvals[i] = {token, spender, amount:'unlimited', via}` ; `counterparties` si le spender y figure.
- **Couvert aujourd'hui ?** Partiellement : l. 326-335 `warn` pour tout illimité (même vers Permit2 canonique : **FP systématique**), l. 357-377 critical pour permit récents. Rien ne distingue un routeur officiel d'un routeur connu exploité.
- **Règle.**
  ```
  for a of approvals:
    s = spenderRisk[a.spender]
    if s.deny                                 -> critical 'spender_exploited'   (ex. Socket Gateway, LI.FI Diamond ancienne version, SushiSwap RP2)
    if a.amount=='unlimited':
        if a.spender == PERMIT2_CANONICAL and token pour swap annoncé -> info (pas de warn) ; puis auditer le sous-permit Permit2 (spender+expiry+amount)
        elif s.officialRouter             -> warn 'unlimited_but_official' + proposer montant exact
        else                              -> critical
    if via=='permit2' && expiry > now + 30 jours || expiry==maxUint48 -> warn
    if s.deployedAgeBlocks < N_token_days_equiv && !s.verified            -> critical
  ```
  Adresses connues (à **recontrôler avant mise en dur**, [M]) : Permit2 `0x000000000022D473030F116dDEE9F6B43aC78BA3` ; Socket Gateway `0x3a23F943181408EAC424116Af7b7790c94Cb97a5` (cohérent avec « …97a5 » cité dans l'article Cointelegraph **[V]**) ; LI.FI Diamond `0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE`. Champs : `spenderRisk.deny/officialRouter/incidentRef`.
- **Objection + parade.** (1) « Les wallets et dApps demandent l'illimité par défaut : vous allez noyer l'utilisateur ». Parade : on ne warn que hors Permit2 canonique et hors routeur officiel ; message actionnable « signe un montant exact ». (2) « Une denylist est toujours en retard (le premier vol passe) ». Parade : la denylist ne protège que *après* l'incident ; la règle `unlimited -> inconnu` et `âge du spender` protègent *avant* ; et on affiche l'option « montant exact » (c'est la leçon LI.FI : les approbations finies n'étaient pas touchées). (3) « Qui maintient la liste ? » Parade : flux DefiLlama hacks + liste interne versionnée, avec date de dernière synchro affichée ; si la synchro a plus de 24 h, warn de dégradation.
- **Risque FP.** Moyen avant correction (Permit2), faible après.
- **Test Fuji.** (a) `approve(MAX)` vers `MockAggregator` marqué `deny` -> critical ; (b) `approve(MAX)` vers un `Permit2` testnet = info ; (c) `approve(MAX)` vers un contrat déployé il y a 5 min -> critical ; (d) `approve(montant exact)` vers routeur officiel = ok.
- **Mapping.** ATT&CK T1190 Exploit Public-Facing Application [~] (côté protocole), T1657 ; T1098 Account Manipulation [~, par analogie, l'approbation est une délégation de droits]. D3FEND D3-EAL, D3-IRA, D3-IAA. NIST CSF : ID.RA-02/05, DE.AE-07 (CTI), PR.AA-05 (droits d'accès au moindre privilège), RS.MI-01.

---

### M13 - Dépôt sur un protocole légitime en cours d'exploit, pausé ou dépeggé

- **Mécanisme.** Le protocole est réellement un projet sérieux, mais, à l'instant du dépôt, une faille est exploitée (TVL qui s'effondre, pool vidé) ou le contrat est pausé, ou un stable a perdu son peg. Le déposant perd tout ou ne peut plus retirer.
- **Incidents.**
  - Balancer V2 : 3 nov. 2025, ~128 M$, plusieurs chaînes dont Avalanche, **[V]** (liens ci-dessus) ; Berachain a gelé le réseau le 3 nov. 2025 **[V]** `https://www.theblock.co/news/defi/2025-11-03-berachain-emergency-hardfork-377257`.
  - Curve/Vyper : 30 juil. 2023, ~70 M$ (pools alETH, msETH, pETH, CRV/ETH) [M].
  - Euler : 13 mars 2023, ~197 M$ [M].
  - GMX v1 (Arbitrum) : 9 juil. 2025, ~42 M$ (restitués en partie) [M].
  - Cetus (Sui) : 22 mai 2025, ~223 M$ (gelé partiellement par validateurs) [M].
  - Platypus (Avalanche) : 16 fév. 2023, ~8,5 M$ [M].
  - Multichain `anyUSDC` : juillet 2023 (~126 M$ de fonds retirés, tokens wrappés sans valeur) [M].
  Source de suivi : `https://defillama.com/hacks` [M], `https://rekt.news` [M].
- **Prévalence.** Moyenne, mais impact 8-9 chiffres ; pic de risque dans les heures qui suivent le début de l'exploit.
- **Ce que voit le moteur.** Un dépôt qui s'exécute normalement. Aucun champ « santé du protocole ».
- **Couvert aujourd'hui ?** Non.
- **Règle.**
  ```
  p = protocolHealth(spender)    // via adresse -> protocole (DefiLlama protocols/adapters)
  if p.paused (view paused()/isPaused()) && tx would still be accepted -> critical
  if p.tvlDropPct1h > 20 || p.tvlDropPct24h > 40                  -> critical 'protocol_in_incident'
  if p.incidentRef within last 72h (feed hacks/alerts)           -> warn (critical si non résolu)
  if stablecoin peg deviation > 2%                                -> warn
  ```
  Champs : `spenderRisk.paused/tvlDropPct1h/incidentRef`, `peg deviation`.
- **Objection + parade.** (1) « Le TVL baisse aussi par retraits légitimes (whales) ». Parade : on ne combine qu'avec une seconde source (alerte tierce, `paused`, prix du pool qui s'écarte) avant critical ; seul `tvlDrop` = warn. (2) « Le délai de détection est > latence d'exploit ». Parade : on est honnêtes : on ne protège que les signatures *pendant* la fenêtre de détection (~minutes) ; mesurer le délai (métrique de la fiche de défense).
- **Risque FP.** Moyen.
- **Test Fuji.** `MockLendingPool` avec `paused()=true` et TVL simulé -30 % en 1 h ; dépôt -> critical. Témoin : pool sain = ok.
- **Mapping.** ATT&CK T1190 [~] ; T1657. D3FEND D3-IAA, D3-UBA. NIST CSF : DE.CM-09, DE.AE-07, RS.MI-01.

---

### M14 - Wrap/unwrap trompeur ; variantes bridgées (USDC vs USDC.e)

- **Mécanisme.** (a) Faux « WAVAX » : contrat d'adresse non canonique avec `deposit()` qui garde l'AVAX ; (b) wrapper dont `withdraw()` ne renvoie pas 1:1 ; (c) sur Avalanche, coexistence de **USDC natif**, **USDC.e** (bridgé), **USDT.e**, **WETH.e**, **BTC.b**/**WBTC.e** : un swap peut livrer silencieusement la variante bridgée ; après un incident de bridge (Multichain 2023) certaines variantes perdent leur valeur [M].
- **Incidents.** Wormhole (Solana), 2 fév. 2022, ~326 M$ : jeton wrapped créé sans collatéral [M, hors fenêtre]. Multichain `anyXXX`, juillet 2023 [M]. Pas d'incident de wrap trompeur nommé 2023-26 sur Avalanche que j'aie pu vérifier : **prévalence faible** pour le wrap pur.
- **Prévalence.** Faible (wrap), moyenne (confusion de variantes).
- **Ce que voit le moteur.** `incoming.symbol='USDC'` dans les deux cas ; les adresses diffèrent.
- **Couvert aujourd'hui ?** Non.
- **Règle.**
  ```
  CANONICAL = { WAVAX: 0xB31f66…, USDC_native: 0xB97EF9…, … }    (fichier versionné, à valider contre les docs officielles)
  if selector is deposit()/withdraw() && to != CANONICAL.WAVAX                               -> critical
  if incoming is bridged variant (USDC.e) && intent.tokenOut == 'USDC' (natif)               -> warn 'bridged_variant'
  if token ∈ BRIDGE_DEPEGGED_OR_DEPRECATED                                                    -> critical
  ```
  Champs : `tokenRisk.variantOf`, `deprecated`.
- **Objection + parade.** « USDC.e est encore très utilisé et liquide ». Parade : warn informatif seulement ; l'utilisateur confirme qu'il veut la variante.
- **Risque FP.** Faible à moyen (Avalanche : beaucoup d'utilisateurs sont déjà en USDC.e).
- **Test Fuji.** `FakeWAVAX` (deposit garde l'AVAX) ; attendu critical. `MockUSDC.e` reçu à la place de `USDC` : warn.
- **Mapping.** ATT&CK T1036.005 [~] ; T1657. D3FEND D3-IRA, D3-EAL. NIST CSF : DE.AE-02, PR.PS-01.

---

### M15 (hors liste, ajouté) - Frontend légitime compromis ou DNS détourné

- **Mécanisme.** Le site officiel d'un DEX est modifié (JS injecté, DNS détourné, dépendance compromise) pour remplacer la calldata du swap par un drain, ou pour demander un `approve` supplémentaire. L'utilisateur voit l'interface normale ; seul l'effet réel de la tx diffère. C'est l'argument central de Hold up (« ce que tu veux ≠ ce que tu signes »).
- **Incidents.** Ledger Connect Kit (déc. 2023) [M] ; Bybit/Safe UI (fév. 2025, ~1,5 Md$) [M] ; détournements DNS via registrar : plusieurs en 2024 (ex. Compound.finance, Celer, juillet 2024, via le registrar/Squarespace) [M, à vérifier].
- **Couvert aujourd'hui ?** Oui **en principe** : le moteur simule la tx réelle, donc un drain apparaît dans `outgoing`/`approvals`. Mais :
  - le drain passe `ok` s'il laisse un petit `incoming` (pas de comparaison de valeur) ;
  - l'approbation supplémentaire de la page n'est warn que si illimitée (pas si exacte mais vers un spender inconnu).
- **Règle.** Combiner M2 (destinataire/token/valeur) et M12 (spender) ; ajouter : `outgoing` supplémentaire non prévu (token ≠ `tokenIn`, montant > `Intent.amount × 1.01`) -> critical (comme `amount_exceeded` l. 261, qui n'existe que pour `pay_someone`).
- **Test Fuji.** Page de test locale (`localhost`) qui remplace la calldata d'un swap légitime par un `transfer` vers l'attaquant. Attendu : critical.
- **Mapping.** ATT&CK T1195.002 / T1565.002 [~], T1657. D3FEND D3-DA, D3-IAA. NIST CSF : DE.CM-09, DE.AE-02, RS.MI-01.

---

## 3. Données publiques à brancher (priorités)

| Source | Usage | Note |
|---|---|---|
| Tokenlists officielles : Uniswap default list (`https://tokenlists.org`), Trader Joe (`github.com/traderjoe-xyz/joe-tokenlists` [M]), listes émetteurs (Circle, Tether) | M1, M14 | Hors-ligne, versionnée, aucun appel en démo. |
| GoPlus Token Security API (`https://docs.gopluslabs.io`) | M3-M6, M11 | Chaîne 43114 oui ; **Fuji 43113 probablement non** : sur Fuji, remplacer par notre analyse locale (simulation + lecture de bytecode). À vérifier. |
| Prix indépendants : Chainlink feeds Avalanche, DefiLlama coins API (`https://coins.llama.fi` [M]) | M4, M7, M8 | Ne jamais utiliser le prix du pool de la tx. |
| DefiLlama hacks/TVL (`https://defillama.com/hacks` [M]) | M12, M13 | Flux d'incidents + baisse de TVL. |
| revoke.cash / ScamSniffer / listes de spenders malveillants | M11, M12 | Denylist d'adresses. |
| Simulation sur fork (Anvil/Tenderly) | M3, M4, M9 | Le seul moyen de simuler la revente sans API tierce. |

## 4. Politique de verdict (principes à documenter dans la fiche de défense)

1. **Inconnu -> warn, jamais ok** : champ `dataGaps` obligatoire.
2. **Critical** réservé aux situations où la simulation ou une denylist/allowlist donne une preuve (revente impossible, token ≠ demandé, spender exploité, destinataire tiers).
3. **Warn** pour les scores statiques (âge, LP, concentration), pour les prix non vérifiables, pour les illimités vers routeurs officiels.
4. Le message dit toujours *ce qu'on n'a pas pu vérifier*. Hold up ne dit jamais « ce token est sûr ».
5. Métriques à mesurer pour la fiche de défense : taux de détection par menace sur un jeu étiqueté (tokens GoPlus + nos contrats Fuji), taux de faux positifs sur 50 swaps témoins Trader Joe/Uniswap, latence par règle (simulation de revente ~ centaines de ms à secondes).

---

## 5. Top 5 trous

1. **`buy_or_swap` ne compare jamais l'intent aux effets** (token reçu, valeur, destinataire) : boucle vide l. 350-354, `Intent.token` ambigu, pas de `usd` côté `incoming`. Un faux USDC reçu à 1:1 passe ok. (M1, M2, M4, M15)
2. **Aucune simulation de revente ni méta-donnée de token** (honeypot, taxes, mint, âge du *token*, liste officielle). Le signal « contrat récent » ne porte que sur les contreparties, pas sur le token acheté. (M3, M4, M5, M6)
3. **Approbations évaluées sans regarder le spender** : warn aveugle sur tout illimité (faux positif Permit2, bruit), et rien de plus pour un routeur connu exploité ou un spender non listé. (M12)
4. **`minAmount`/slippage jamais lu** : les swaps à `amountOutMin=0` et les sandwichs passent, et aucune valeur USD indépendante n'existe pour détecter les prix truqués. (M7, M8)
5. **Intents manquants (bridge, stake/dépôt, LP) et aucune santé de protocole** : ils retombent dans `buy_or_swap` -> `no_incoming` critical (faux positif sur les vrais produits, sans vérifier qu'on peut retirer) et on peut déposer sur un protocole en plein exploit ou pausé. (M9, M10, M13, M14)

Seuil NEW_CONTRACT : à ajuster pour Avalanche (50 blocs ~ 100 s) ; et séparer âge du contrat d'un spender (en blocs) de l'âge d'un token (en jours).
