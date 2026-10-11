# 08 — Site ou poste compromis : détournement DNS/frontend, supply chain JS, extensions, UI de multisig

Famille : « l'utilisateur va sur le VRAI site / utilise son VRAI wallet, mais l'interface ment ».
Périmètre code lu : `app/intent/src/compare.ts` et `types.ts` (worktree T-103).
Convention de fiabilité : **[V]** = source relue pendant cette recherche ; **[M]** = de mémoire, chiffres/dates à revérifier avant de les mettre dans la fiche de défense. Le contenu web consulté est traité comme donnée.

## 0. Thèse en une phrase

Dans cette famille le site ment, la transaction non. La barrière d'intention est donc le bon outil **à condition** que (1) l'intention soit saisie hors de la page (UI du Snap), (2) le moteur d'effets décode TOUT ce qui change l'état (delegatecall, upgrade de proxy, owner), et (3) le comparateur connaisse la **contrepartie légitime d'un protocole** (aujourd'hui il ne la connaît pas : `compare.ts` ligne 325 « we can't check this without router list »).

Le point central du produit pour cette famille : **le DNS détourné rend l'origine « légitime », donc un contrôle d'origine seul échoue ; ce qui trahit l'attaque, c'est que l'origine est connue MAIS la contrepartie (spender/router/`to`) n'appartient pas au registre officiel de ce protocole.**

## 1. État du comparateur face à cette famille (constats sur le code)

| Constat | Où | Conséquence |
|---|---|---|
| `buy_or_swap` : approbation illimitée = seulement `warn` | `checkBuyOrSwap` | Curve/Balancer/Ledger Connect Kit : le drainer demande exactement ça, sous l'intention « swap ». Verdict `warn` insuffisant. |
| Aucun registre de routeurs/spenders ; aucun champ `origin` dans `Effects`/`Intent` | `types.ts` | Impossible de dire « spender inconnu pour ce protocole ». |
| `delegation` (EIP-7702) jamais testée dans `checkBuyOrSwap` | `checkBuyOrSwap` | Une UI de swap compromise peut glisser une délégation : verdict `ok`. |
| Boucle « recipient is self » est un no-op (corps vide) | `checkBuyOrSwap` | Pas de vérification que les sorties (outgoing) correspondent au token/montant déclaré ; un `multicall` avec un transfert annexe (sweep) passe tant qu'il y a un `incoming`. |
| `confidence` est constante à 1.0 | `compare()` | Branche `low_confidence` morte : une tx indécodable (cas Bybit : delegatecall imbriqué) n'escalade jamais. Il faut un mode « fail closed ». |
| Rien sur `operation`/delegatecall Safe, upgrade de proxy, `transferOwnership`, `enableModule`, `setGuard` | `types.ts` | Bybit/Radiant/WazirX : invisibles. |
| `pay_someone` : `wrong_recipient` seulement si `counterpartyAddress` vient du carnet d'adresses | `checkPaySomeone` | Bon contre le clipper npm (adresse substituée dans la page) SI l'adresse de l'intention est saisie dans le Snap. Si l'utilisateur colle l'adresse dans l'UI du Snap depuis un presse-papiers déjà piégé par un malware OS : raté. |
| `connect_or_accept_offer` : toute approbation/sortie/délégation = `critical` | `checkConnectOrAcceptOffer` | Très bon : c'est le cas Ledger Connect Kit (modale de connexion piégée). Mais SIWE/`personal_sign` hors effets non vérifié (domaine du message vs origine). |
| `new_contract` < 50 blocs = `warn` seulement | `compare()` | Les contrats de drainer sont souvent déployés des jours avant (Bybit : déployé ~2 jours avant) ; l'âge en blocs est un signal faible. |

## 2. Tableau récapitulatif

Légende couverture : OUI / PARTIEL / NON / HORS (hors portée). « Bon outil ? » = la barrière d'intention est-elle le bon contrôle.

| # | Menace | Incident phare | Bon outil ? | Couvert aujourd'hui ? | Champ clé à ajouter |
|---|---|---|---|---|---|
| F1 | Détournement DNS / registrar de dApp | Curve 08/2022, Balancer 09/2023, Velodrome/Aerodrome 11/2023, Squarespace 07/2024 | OUI (exactement) | PARTIEL (warn si illimité ; rien si montant borné ou `setApprovalForAll`) | `origin`, `registry.official`, `protocolHint` |
| F2 | Détournement BGP / CDN / secret d'infra | Celer cBridge 08/2022, BadgerDAO 12/2021 | OUI | PARTIEL (idem F1) | idem F1 |
| F3 | Supply chain JS dans le frontend (CDN, SDK wallet) | Ledger Connect Kit 12/2023, Polyfill.io 06/2024 | OUI | PARTIEL à bon sur `connect`, faible sur `swap` | idem F1 + `raw.decodedCalls` |
| F4 | Supply chain npm : clipper d'adresse / hook `window.ethereum` | chalk/debug 09/2025, @solana/web3.js 12/2024 | OUI si intention hors page | PARTIEL | `intent.counterpartyAddress` obligatoire pour `pay_someone`, `trustedEntry` |
| F5 | UI de multisig falsifiée (blind signing) | Bybit 02/2025, WazirX 07/2024, Radiant 10/2024 | OUI, mais moteur d'effets à étendre | NON | `stateChanges[]`, `raw.operation`, `decodedCalls` |
| F6 | Extension tierce malveillante / rachetée (altère les requêtes) | Cyberhaven 12/2024 (classe), extensions rachetées | OUI (le Snap voit la tx finale) | PARTIEL = comme F1/F5 | idem |
| F7 | Faux wallet / fausse extension (Chrome Web Store) | faux MetaMask, Trust Wallet 2.68 12/2025 (légitime piégé) | NON : pas de Snap | HORS | — (détection au moment de l'installation, autre produit) |
| F8 | Infostealer / seed volée puis drain direct | Lumma, Atomic, Vidar ; Trust Wallet 2.68 | NON : aucune signature dans le wallet de la victime | HORS | — |
| F9 | Snap malveillant ou Snap lui-même compromis | pas d'incident majeur public connu [M] | PARTIEL | n/a | signature/hash du Snap, build reproductible |
| F10 | Pub Google / SEO poisoning vers clone | Inferno Drainer 2023-2025, Pink/Angel | OUI (clone ≠ origine connue, contrepartie hors registre) | PARTIEL | `originLookalike`, `registry.official` |
| F11 | WalletConnect : faux QR / session hijack / pairing malveillant | campagnes de drainers via fausses modales WC [M] | OUI | PARTIEL = comme F1 | `origin` côté session WC (peer metadata non fiable) |
| F12 | dApp légitime qui change d'adresse de routeur (déploiement légitime) | upgrades Uniswap/1inch/0x | Cas FP majeur plutôt qu'attaque | n/a | `registry.sourceDate`, lignée du déployeur |

## 3. Fiches

### F1 — Détournement DNS / compte registrar d'une dApp légitime

**Mécanisme.** L'attaquant prend le contrôle du nom de domaine (ingénierie sociale du registrar, absence de 2FA, migration de registrar ratée) et fait pointer le vrai nom vers un clone. L'utilisateur tape la bonne URL, TLS valide (l'attaquant obtient un certificat pour le domaine qu'il contrôle), l'UI est identique ; seuls les contrats appelés changent (approve vers le drainer, `permit`, fonction « claim »).

**Incidents.**
- Curve Finance, 9 août 2022 : DNS d'iwantmyname détourné, environ 570 000 USD volés **[M]**. Je n'ai pas pu confirmer un second incident Curve « 2024 » ; ne pas l'affirmer sans source.
- Balancer, 19 sept. 2023 : balancer.fi détourné via le registrar (EasyDNS), environ 240 000 USD **[M]**.
- Velodrome / Aerodrome, 28-29 nov. 2023 : frontends compromis par attaque DNS ; alerte officielle « frontend compromised » **[V]** https://www.theblock.co/post/265104/velodrome-aerodrome-hit-by-attack-on-front-end-websites
- Squarespace, ~12 juil. 2024 : migration des domaines Google Domains ; Compound, Celer, Pendle, Unstoppable Domains détournés **[M]** ; pertes publiques faibles ou non chiffrées, à vérifier.
- Précédent : BadgerDAO, déc. 2021, script injecté via clé API Cloudflare volée, environ 120 M USD **[M]** (voir F2).

**Ce que voit la barrière.** Un `approve`/`permit` (ou transfert) vers un spender qui n'est pas le routeur du protocole. L'effet simulé ne ment pas. Le site, lui, affichait « Swap ».

**Couvert aujourd'hui ?** PARTIEL. `connect_or_accept_offer` : critical. `buy_or_swap` : `unlimited_approval_swap` = **warn** seulement ; approbation bornée, `setApprovalForAll`, `permit` vers un contrat de plus de 50 blocs : **ok**. Le Balancer de 2023 n'était pas une approbation « illimitée » dans tous les cas.

**Règle (pseudo-code).**
```
// ajouts : Effects.origin (string, de transactionOrigin/signatureOrigin du Snap)
//          Effects.counterparties[].registry = { protocol, role, official: bool, source, sourceDate }
//          Intent.protocolHint? (déduit de l'origine ou saisi dans le Snap)
proto = registry.protocolOfOrigin(effects.origin)         // ex. app.balancer.fi -> balancer
if proto:
  for each spender in effects.approvals + each cp in effects.counterparties:
     if !registry.isOfficial(proto, spender.address, chainId):
        CRITICAL "frontend_counterparty_mismatch"
        // "Tu es sur le site de Balancer, mais l'autorisation irait à un contrat qui n'est pas celui de Balancer."
else:  // origine inconnue du registre
  for each approval in effects.approvals:
     if cp.isContract==false                               -> CRITICAL (spender = EOA)
     if cp.unverifiedSource || cp.ageDays<30 || cp.noLabel -> WARN, CRITICAL si amount==unlimited ou via in {setApprovalForAll, permit, permit2}
```

**Champs à ajouter.** `Effects.origin`, `Effects.counterparties[].registry`, `Effects.counterparties[].verifiedSource`, `ageDays`, `Intent.protocolHint`.

**Objection d'un praticien.** « Votre registre sera périmé : Uniswap Universal Router v2, nouveau chain, nouvelle version 1inch ; vous allez crier au loup sur le vrai routeur. » **Parade.** (a) Source = listes de déploiements officielles (docs Uniswap, repo 1inch/0x, `safe-global/safe-deployments`, et surtout le registre ERC-7730 de Ledger qui porte `context.contract.deployments` par chaîne) avec `sourceDate` affichée ; (b) preuve alternative par **lignée du déployeur** : le contrat a été déployé par une adresse/factory CREATE2 qui a déjà déployé des contrats officiels ; (c) protocole connu mais adresse inconnue → `critical` seulement si approbation/permit, `warn` sinon ; (d) lien « signaler une adresse officielle » désactivé en démo (pas de réseau).

**Risque faux positifs.** Moyen sur déploiements récents ; faible sur le gros du trafic (Uniswap, Aave, Curve, 1inch, 0x, Permit2 `0x000000000022D473030F116dDEE9F6B43aC78BA3` identique sur toutes les chaînes). Réduit par la lignée du déployeur et l'ERC-7730.

**Cas de test Fuji.** (1) Origine `app.uniswap-demo.test` (registre local de démo), swap AVAX→USDC, `approve(USDC, spender=0xDEAD…, unlimited)` : critical `frontend_counterparty_mismatch`. (2) Même origine, `approve(USDC, router officiel de démo, 1000)` : ok. (3) Origine inconnue + `approve` borné vers EOA : critical. (4) Origine inconnue + `approve` borné vers contrat vérifié ancien et étiqueté : ok. (5) Nouveau routeur officiel (déployé par la factory officielle, absent du registre) : warn, pas critical.

**Mapping.** ATT&CK : T1584.001 (Compromise Infrastructure: Domains), T1583.001 (Acquire Domains), T1566.002 (lien de phishing), T1189 (Drive-by Compromise). D3FEND : D3-DNSDL (Domain Name Denylisting) hors périmètre ; applicable ici D3-OAM-like « Outbound Traffic Analysis » non ; retenir **D3-IAA (Identifier Activity Analysis)** et **D3-SBV (Service Binary Verification)** par analogie pour vérifier le binaire/contrat appelé **[M, ID D3FEND à vérifier]**. NIST CSF 2.0 : **DE.AE-02** (analyse d'événements indésirables), **DE.CM-09** (surveillance des actifs, y compris logiciels), **RS.MI-01/02** (limiter l'impact : bloquer avant signature), **PR.PS-02** hors périmètre. OWASP Agentic : sans objet. MITRE ATLAS : sans objet.

---

### F2 — Détournement BGP / secret d'infrastructure (CDN, API Cloudflare)

**Mécanisme.** L'attaquant détourne des préfixes BGP du résolveur/hébergeur ou vole une clé d'API CDN et injecte du JS dans le vrai site. Même effet pour l'utilisateur que F1.

**Incidents.** Celer cBridge, 17 août 2022, BGP hijack d'un préfixe AWS, environ 240 000 USD **[M]**. BadgerDAO, déc. 2021, ~120 M USD **[M]**. Ces deux cas datent d'avant la fenêtre 2023-2026 : à citer comme preuve de la classe, pas comme statistiques récentes.

**Ce que voit la barrière.** Approbation vers un contrat de l'attaquant (Badger : approvals injectées vers l'adresse de l'attaquant).

**Couvert ?** PARTIEL, identique à F1.

**Règle / champs.** Identique à F1 (contrepartie ∉ registre). Aucun contrôle DNS/BGP possible dans le Snap : on ne tente pas de détecter l'infra, on détecte l'effet.

**Objection.** « Le registre ne couvre pas les protocoles de niche. » **Parade.** Branche « origine inconnue » (EOA, âge, source non vérifiée, étiquettes) ; honnêteté dans l'UI : « protocole non reconnu, je ne peux pas confirmer le contrat ».

**FP.** Voir F1. **Fuji.** Même jeu que F1, variante `setApprovalForAll` NFT vers EOA : critical.

**Mapping.** ATT&CK : T1584.005 (Compromise Infrastructure: Botnet) non ; retenir T1584.004 (Server) et T1565.002 (Transmitted Data Manipulation). D3FEND : D3-MAN (Message Authentication) par analogie hors périmètre. CSF 2.0 : DE.AE-02, RS.MI-01.

---

### F3 — Supply chain JS dans le frontend (CDN, SDK wallet-connect-kit, Polyfill)

**Mécanisme.** Une dépendance chargée par plusieurs dApps (SDK de connexion, polyfill CDN) est empoisonnée ; toutes les dApps clientes affichent une modale piégée.

**Incidents.**
- Ledger Connect Kit, 14 déc. 2023 : ancien employé hameçonné, versions npm 1.1.5 à 1.1.7 malveillantes ; fausse modale WalletConnect/drainer sur SushiSwap, Revoke.cash, Zapper, etc. ; pertes de l'ordre de 0,5 à 1 M USD, fenêtre de quelques heures **[M]**.
- Polyfill.io, juin 2024 : domaine racheté par un acteur chinois (Funnull), plus de 100 000 sites ont servi du JS de redirection (surtout paris/scams ; lien crypto indirect) **[M]**. Classe pertinente, perte crypto directe non établie.
- Solana `@solana/web3.js` 1.95.6/1.95.7, 2 déc. 2024 : porte dérobée exfiltrant des clés privées, environ 130 à 160 k USD **[M]** (cas « clé volée », voir F8).

**Ce que voit la barrière.** La modale ment sur ce qui est signé ; le wallet reçoit une `approve`/`transfer`/`setApprovalForAll` vers l'attaquant. Sous intention `connect_or_accept_offer` (clic « Connect »), toute approbation est critical : **c'est la meilleure démonstration du produit** (« Tu veux te connecter. En réalité tu donnerais accès à tes tokens »).

**Couvert ?** OUI pour `connect_or_accept_offer` ; PARTIEL pour `buy_or_swap` (voir F1).

**Règle.** Pour `connect` : déjà en place. Ajout : si `kind=='signature'` et `primaryType in {Permit, Permit2*, SetApprovalForAll…}` dans une session `connect` → critical (déjà couvert via approvals si le décodeur EIP-712 remplit `approvals`). Vérifier que `decode712` couvre `PermitSingle`, `PermitBatch`, `PermitTransferFrom`, `Seaport`/`Blur` orders (listes NFT pour 0).

**Objection.** « L'utilisateur qui clique `Connect` puis `Swap` dans la même session change d'intention. » **Parade.** TTL de 10 min existant ; l'intention est redéclarée à chaque action sensible (une ligne dans le Snap).

**FP.** Faible (connexion légitime = aucune approbation). **Fuji.** `connect` + `permit` EIP-712 USDC vers EOA : critical ; `connect` + `personal_sign` SIWE : ok ; `connect` + `setApprovalForAll` : critical.

**Mapping.** ATT&CK : **T1195.001 (Compromise Software Dependencies and Development Tools)**, T1195.002, T1059.007 (JavaScript), T1189. D3FEND : D3-PA (Process Analysis) hors périmètre ; **D3-FA (File Analysis)** côté dev ; retenir D3-IAA. CSF 2.0 : **GV.SC-07** (risques fournisseurs), **ID.RA-09** (intégrité des composants), **DE.AE-02**, **RS.MI-02**.

---

### F4 — Supply chain npm : clipper d'adresse et hook `window.ethereum`

**Mécanisme.** Des paquets compromis (mainteneur hameçonné) remplacent les adresses de destination dans le DOM, les requêtes `fetch`, ou interceptent `window.ethereum.request` / `window.solana` pour réécrire `to` ou `value` avant l'envoi au wallet. Le wallet, lui, affiche ce qu'il reçoit.

**Incidents.**
- 8 sept. 2025 : mainteneur « qix » hameçonné (domaine npmjs.help), 18 paquets dont chalk et debug (milliards de téléchargements hebdo) ; code de clipper ETH/SOL ; gains très faibles (de l'ordre de quelques centaines à ~1 000 USD) **[M]**.
- Shai-Hulud / Sha1-Hulud, sept. et nov. 2025 : ver npm qui vole des secrets de dev ; a abouti à l'incident Trust Wallet (voir F7/F8) **[V]**.
- @solana/web3.js, déc. 2024 (voir F3).

**Ce que voit la barrière.** `pay_someone` : l'adresse réellement envoyée ≠ `intent.counterpartyAddress` → critical `wrong_recipient`. **Conditions** : l'adresse de l'intention doit venir d'un canal que le JS de la page ne touche pas (carnet d'adresses du Snap, saisie dans la boîte de dialogue du Snap, ou ENS résolu par le Snap), jamais d'une lecture du DOM.

**Couvert ?** OUI si `counterpartyAddress` est renseignée et saisie dans le Snap. NON si l'intention est juste « payer Paul » avec `counterpartyLabel` seul (aucune adresse, pas de comparaison).

**Règle.**
```
// pay_someone
if !intent.counterpartyAddress: WARN "address_not_pinned"   // l'intention n'a pas fixé de destinataire
if out.to != intent.counterpartyAddress: CRITICAL
if trustedEntry == 'clipboard' && clipboardSource != 'snap_ui': WARN   // saisie hors carnet
```
Champ : `Intent.addressEntry: 'address_book' | 'typed' | 'ens' | 'clipboard'`.

**Objection.** « L'utilisateur colle l'adresse dans le Snap depuis son presse-papiers ; un clipper OS l'a déjà remplacée. » **Parade.** Honnête : un malware OS est hors portée (voir §5) ; atténuation : afficher l'adresse en 4+4 caractères avec **comparaison visuelle** et exiger la première utilisation en « premier envoi test » (cas `firstSeenByUser`) ; l'ENS résolu dans le Snap évite le presse-papiers.

**FP.** Faible. **Fuji.** Intent `pay_someone` Paul `0xAAA…`, tx vers `0xBBB…` (clipper) : critical `wrong_recipient` ; tx vers lookalike 4+4 : critical `lookalike_address`.

**Mapping.** ATT&CK : **T1195.001**, T1115 (Clipboard Data) pour la variante OS, T1565.002 (Transmitted Data Manipulation), T1557 hors périmètre. D3FEND : D3-IAA, D3-SFA (System File Analysis) hors périmètre. CSF 2.0 : GV.SC-07, ID.RA-09, DE.AE-02.

---

### F5 — Interface de multisig falsifiée (blind signing)

**Mécanisme.** L'UI de gestion de trésorerie (Safe{Wallet} ou équivalent) affiche une transaction anodine ; la charge signée est tout autre (delegatecall vers un contrat qui remplace l'implémentation du proxy, `transferOwnership`, ajout de module). Les signataires valident sur un hardware wallet en blind signing parce que l'écran du Ledger n'affiche qu'un hash.

**Incidents.**
- **Bybit, 21 fév. 2025, ~1,46 Md USD** : machine d'un développeur Safe{Wallet} compromise ; JS malveillant déposé sur un bucket S3 qui servait l'UI ; transaction affichée normale mais `operation=delegatecall` vers un contrat remplaçant l'implémentation du proxy ; attribué à la Corée du Nord (Lazarus/TraderTraitor) par le FBI **[M]**. Rapport Safe et analyse Sygnia/Verichains : à citer pour la date et la mécanique.
- Radiant Capital, 16 oct. 2024, ~50 M USD : malware sur les appareils de développeurs, interface Safe montrant des transactions bénignes pendant que les signatures autorisaient `transferOwnership` **[M]**.
- WazirX, 18 juil. 2024, ~235 M USD : écart entre l'UI (Liminal) et la payload signée **[M]**.

**Ce que voit la barrière.** Un `signTypedData` de type `SafeTx` (`to`, `value`, `data`, `operation`) ou une transaction `execTransaction`. La simulation (trace) montre une écriture sur le slot d'implémentation du proxy, ou un `transferOwnership`. C'est **exactement le cas où le site ment et l'effet simulé non**.

**Couvert ?** NON. `Effects` n'a ni `operation`, ni changement d'état, ni décodage imbriqué ; `confidence` figée à 1.0 donc pas de fail-closed.

**Règle.**
```
// Effects.stateChanges[] : { kind: 'proxy_upgrade'|'owner_change'|'threshold_change'|'module_enabled'|'guard_set'|'delegatecall', target, detail }
// Effects.raw.operation: 0|1 ; Effects.raw.decodedCalls[] (profondeur max 3, MultiSend déroulé)
if raw.primaryType == 'SafeTx' || selector == execTransaction:
   if raw.operation == 1 && target ∉ safeDeployments.{MultiSend, MultiSendCallOnly, SignMessageLib}: CRITICAL "delegatecall_unknown_target"
   if any stateChanges.kind in {proxy_upgrade, owner_change, module_enabled, guard_set, threshold_change}
        && intent.kind not in {'treasury_admin'}: CRITICAL
   if decode failed || trace unavailable: confidence = 0.3 -> WARN minimum, CRITICAL if value > seuil
```
Champ d'intention à ajouter pour ce segment : `kind: 'treasury_admin'` n'existe pas ; dans la version grand public, **toute** modification d'implémentation/propriétaire est critical.

**Objection.** « Les trésoreries font des delegatecall légitimes (MultiSend, modules maison, upgrades planifiés). » **Parade.** Allowlist des cibles officielles Safe (`safe-global/safe-deployments`), sinon critical avec message « cette opération change qui contrôle le coffre », que l'utilisateur peut confirmer seulement en re-saisissant un mot ; produit grand public : Safe est rare, FP acceptable. Autre objection : « le Snap tourne dans MetaMask, pas dans le Ledger blind-signé. » **Parade.** Le Snap lit la requête avant de l'envoyer au Ledger (`onSignature`/`onTransaction` sont appelés pour les comptes hardware aussi) **[M, à tester]** ; si le flux ne passe pas par MetaMask, hors portée.

**FP.** Faible chez le grand public, élevé en usage DAO/trésorerie.

**Cas de test Fuji.** Déployer un proxy minimal + un Safe de test (ou un contrat factice émulant `execTransaction`) ; (1) delegatecall vers un contrat qui écrit le slot EIP-1967 : critical ; (2) MultiSend officiel de démo, 2 transferts : ok si conformes ; (3) payload indécodable : warn minimum, `confidence<0.6`.

**Mapping.** ATT&CK : **T1195.002** (Compromise Software Supply Chain), T1199 (Trusted Relationship), T1565.001/002, T1078 hors périmètre. D3FEND : **D3-IAA**, D3-SBV (vérification du code appelé) ; D3-UBA hors périmètre. CSF 2.0 : DE.AE-02, DE.CM-09, **RS.MI-01**, GV.SC-07, PR.AA hors périmètre.

---

### F6 — Extension de navigateur tierce malveillante ou rachetée

**Mécanisme.** Une extension (outil de productivité, VPN) est piégée via mise à jour, rachat, ou compromission du compte développeur ; avec `<all_urls>` elle réécrit les requêtes `window.ethereum` ou injecte du JS comme en F3/F4.

**Incidents.** Cyberhaven, 24-25 déc. 2024 : compte développeur hameçonné, extension mise à jour avec code voleur (dizaines de milliers de sites ciblés, plusieurs extensions touchées) **[M]** ; classe démontrée, pertes crypto directes non établies. Extensions achetées puis reconverties en adware/vol de sessions : documenté depuis 2019 **[M]**.

**Ce que voit la barrière.** La tx finale reçue par MetaMask, après modification par l'extension. Le Snap voit donc l'effet réel ; équivalent à F1/F4/F5 selon la modification.

**Couvert ?** PARTIEL, identique à F1/F4/F5. **Limites.** Une extension avec des droits excessifs (`debugger`, accès aux autres extensions via `management`) peut désactiver le Snap ou MetaMask : **fail open**. Atténuation : indicateur dans le Snap « barrière active » ; absence de verdict doit être perceptible (le wallet n'affiche rien si le Snap est désactivé).

**Règle / champs.** Pas de règle comparateur spécifique ; ajouter `Verdict.coverage: 'full'|'partial'|'unavailable'` pour qu'une absence de simulation soit affichée en orange, pas en silence.

**Objection.** « Une extension peut aussi réécrire la fenêtre de confirmation. » **Parade.** Les pages d'extensions sont isolées par origine ; la modification de la fenêtre MetaMask demande un accès natif (hors portée, §5).

**FP.** Nul. **Fuji.** Simulation d'une extension qui réécrit `to` après le clic : mêmes cas que F4.

**Mapping.** ATT&CK : **T1176 (Browser Extensions)**, T1195.002, T1185 (Browser Session Hijacking). D3FEND : D3-EAL (Executable Allowlisting) pour l'allowlist d'extensions (GPO/MDM) hors produit ; D3-IAA. CSF 2.0 : PR.PS-01/02 hors périmètre ; DE.CM-09, DE.AE-02.

---

### F7 — Faux wallet / fausse extension (faux MetaMask sur Chrome Web Store, sites d'installation clonés)

**Mécanisme.** L'utilisateur installe un faux wallet (ou clone de site de téléchargement) ; l'import de la seed la transmet à l'attaquant.

**Incidents.** Faux MetaMask / faux Phantom régulièrement signalés sur le Chrome Web Store et via Google Ads [M, pas de chiffre daté vérifié]. Trust Wallet 2.68 (24 déc. 2025) est un cas voisin : **l'extension légitime** a été empoisonnée via une clé Chrome Web Store fuitée, ~7 à 8,5 M USD, exfiltration de la phrase secrète vers `api.metrics-trustwallet[.]com` **[V]** https://thehackernews.com/2025/12/trust-wallet-chrome-extension-hack.html?m=1 et https://trustwallet.com/blog/company/trust-wallet-browser-extension-v268-incident-community-update

**Ce que voit la barrière.** Rien : si le wallet n'est pas MetaMask, il n'y a pas de Snap ; si l'attaquant exfiltre la seed, le drain se fait depuis son infrastructure, sans signature dans le wallet de la victime.

**Couvert ?** HORS portée pour la barrière. Possibles adjacents au projet (autre module) : classifier le message/lien qui pousse à l'installation (`seed_phishing`) ; avertir à l'ouverture du site de téléchargement (liste d'URL officielles de wallets).

**Mapping.** ATT&CK : T1176, T1195.002 (cas Trust Wallet), T1555 / T1552 (accès aux identifiants). CSF 2.0 : GV.SC-07, ID.RA-09 (côté éditeur).

---

### F8 — Infostealer / seed volée puis drain direct

**Mécanisme.** Infostealer (Lumma, Atomic Stealer, Vidar, Redline) extrait le fichier du coffre du wallet, les seed phrases en clair, ou installe un clipper OS. Le drain se fait avec la clé volée, **depuis le poste de l'attaquant**.

**Incidents.** Cas systémiques ; Chainalysis note la compromission de clés privées comme premier vecteur de pertes en 2024 **[M]**. Démantèlement partiel de Lumma en mai 2025 **[M]**. Trust Wallet 2.68 (seed exfiltrée) **[V]**.

**Ce que voit la barrière.** Rien : aucune transaction n'est signée dans le wallet de la victime.

**Couvert ?** **HORS portée, à dire explicitement.** Ce qu'on peut dire sans mentir : la barrière protège contre l'utilisateur **trompé**, pas contre l'utilisateur **dépossédé**. Atténuation possible, non implémentée : séparation hot/cold, Safe 2-sur-N avec la barrière sur chaque signataire.

**Mapping.** ATT&CK : T1555.003/T1555 (Credentials from Web Browsers), T1005, T1056 (Input Capture), T1115. CSF 2.0 : PR.PS, PR.AA (hors périmètre produit).

---

### F9 — Snap malveillant ou Snap Sentinelle lui-même compromis

**Mécanisme.** Un Snap tiers demande des permissions larges (transaction-insight, network-access, ethereum-provider) et ment dans ses « insights » (affiche « sûr ») ; ou un build de Sentinelle est empoisonné (dépendances npm : F4).

**Incidents.** Aucun incident majeur public établi à ma connaissance **[M]** ; risque structurel (permissions Snap, mises à jour automatiques). Notre propre surface d'attaque : un Snap est lui-même un paquet npm.

**Ce que voit la barrière.** Le Snap compromis EST la barrière : verdict « ok » forgé.

**Couvert ?** Contrôle de dépendances à faire (non lié au comparateur). **Règles de durcissement.** Dépendances figées (lockfile, `npm ci`), peu de paquets, build reproductible, empreinte (shasum du bundle Snap) publiée dans le README, permission `endowment:network-access` retirée en démo (registre embarqué), mise à jour manuelle.

**Objection.** « Qui garantit le Snap ? » **Parade.** Honnêteté : MetaMask exécute le Snap en sandbox SES ; l'utilisateur voit la liste des permissions ; l'audit du bundle est reproductible. À présenter comme limite connue.

**Mapping.** ATT&CK : T1195.001/002. D3FEND : D3-SBV, D3-FV (File Verification) **[IDs à vérifier]**. CSF 2.0 : GV.SC-04/07, ID.RA-09, PR.PS-06 (développement sécurisé).

---

### F10 — Pubs Google / SEO poisoning vers clones

**Mécanisme.** Annonce sponsorisée « Uniswap / Aave / MetaMask » menant à un clone avec drainer (Inferno, Angel, Pink, etc.) ; la dApp réelle n'est pas détournée, c'est un **faux site** (domaine ≠ réel).

**Incidents.** Inferno Drainer : mars-nov. 2023, ~80 M USD, plus de 130 000 victimes (ScamSniffer) **[M]** ; réapparition 2024-2025 avec sites légitimes clonés et pubs (Check Point, début 2025) **[M]**. Pink Drainer arrêté mai 2024 après ~85 M USD **[M]**. ScamSniffer : pertes par phishing de signatures (approve/permit) ≈ 494 M USD en 2024 pour ≈ 332 000 victimes **[M]**.

**Ce que voit la barrière.** Origine non reconnue (ou lookalike d'une origine connue) + approbation/permit vers une contrepartie hors registre.

**Couvert ?** PARTIEL (même branche que F1).

**Règle.**
```
if origin ∉ registry.origins && lookalike(origin, registry.origins, dist<=2 | homoglyph | punycode | sous-domaine piégé 'uniswap.org.evil.xyz'):
     WARN "origin_lookalike"; CRITICAL si approvals non vide ou kind=='signature' avec permit
```
Fonction `lookalike` locale (liste embarquée, pas d'appel réseau, pas de fuite de l'historique de navigation).

**Objection.** « Les clones utilisent des domaines propres et des sous-domaines, la distance d'édition rate tout. » **Parade.** Ce n'est pas le seul signal : le contrôle contrepartie (F1) s'applique à toute origine ; la détection de domaine ressemblant ne sert que d'accélérateur. Deuxième objection : « Un site légitime encore inconnu est signalé. » → `warn` jamais `critical` sans approbation.

**FP.** Moyen sur dApps neuves ; faible sur le trafic réel.

**Cas de test Fuji.** Origine `app.unisvvap.test` + `permit` USDC vers EOA : critical. Origine `app.uniswap.org.evil.test` : lookalike. Origine inconnue + transfert simple vers contrat établi : ok.

**Mapping.** ATT&CK : **T1583.001**, T1566.002, T1608.005 (Link Target), T1189. D3FEND : D3-URA (URL Analysis), D3-DNSDL (Domain Name Denylisting). CSF 2.0 : DE.AE-02, DE.CM-09, RS.MI-01, ID.RA-02 (renseignement).

---

### F11 — WalletConnect : faux QR, hijack de session, fausse modale

**Mécanisme.** L'utilisateur scanne un QR frauduleux ou accepte une session dont les métadonnées (nom, icône, URL du pair) sont forgées ; le dApp affiche « Uniswap » alors que la session vient d'un tiers ; ensuite requêtes d'approbation/transfert signées dans le wallet mobile.

**Incidents.** Campagnes de drainers avec fausses modales WalletConnect (Ledger Connect Kit 12/2023 en est le cas principal **[M]**) ; pas de perte unitaire datée vérifiée pour le hijack de session pur.

**Ce que voit la barrière.** Sur mobile, le Snap n'existe pas (MetaMask mobile ne supporte pas les Snaps) **[M, à vérifier à jour]** : donc **couvert seulement si le wallet est MetaMask extension**. Les métadonnées de session WalletConnect (nom/URL du pair) sont auto-déclarées donc non fiables ; elles ne doivent pas servir d'`origin`.

**Règle.** Ne pas utiliser `peer.metadata.url` comme `origin`. Si `origin` indisponible : `registry.protocolOfOrigin` retourne null → branche « origine inconnue » (contrepartie, EOA, âge). Avertir `coverage: 'partial'`.

**Objection.** « Sans origine fiable le contrôle F1 tombe. » **Parade.** Oui ; d'où l'importance de la branche sans origine, basée uniquement sur la contrepartie et l'étiquetage.

**Mapping.** ATT&CK : T1566.002, T1557 (Adversary-in-the-Middle) par analogie, T1185. CSF 2.0 : DE.AE-02, PR.PS.

---

### F12 — dApp légitime qui change d'adresse de routeur (cas FP, pas attaque)

**Mécanisme.** Uniswap passe de SwapRouter02 au Universal Router, 1inch de v5 à v6, nouveau déploiement par chaîne. Un registre figé voit « spender inconnu ».

**Ce que voit la barrière.** Faux critique : détruit la confiance en un jour.

**Règle.** Voir parade F1 : (a) source officielle datée ; (b) **lignée du déployeur** (même factory CREATE2 ou même déployeur que des contrats officiels) ; (c) dégrader en `warn` si protocole connu + adresse inconnue + approbation bornée + contrat vérifié (Sourcify/Etherscan) et ancien ; (d) afficher le motif (« je ne connais pas ce routeur pour Uniswap ») pour que l'utilisateur sache que c'est un manque de données et pas une accusation.

**Objection.** « Vous n'allez pas maintenir 2 000 protocoles. » **Parade.** On n'en maintient pas 2 000 : le top 20 protocoles par volume pour le registre dur ; les autres passent par la branche heuristique. Le produit assume « inconnu » comme état.

**Cas de test Fuji.** Registre de démo avec RouterV1 ; déployer RouterV2 depuis la même factory ; tx vers V2 : warn avec motif (pas critical) ; tx vers EOA : critical.

**Mapping.** Sans objet (gestion de faux positifs). CSF 2.0 : DE.AE-04 (estimation d'impact), ID.IM (amélioration).

---

## 4. Top 5 trous (par ordre d'urgence pour la démo et le dossier de défense)

1. **Aucun registre de contreparties officielles ni champ `origin`** : F1/F2/F3/F10 ne passent qu'en `warn` ou `ok`. Correction minimale pour la démo : registre JSON embarqué de 5 protocoles sur Fuji (routeur + spender de démo) + `transactionOrigin` du Snap + règle `frontend_counterparty_mismatch`. Petit code, énorme valeur de démonstration (même scénario que Curve/Balancer).
2. **`buy_or_swap` trop laxiste** : approbation illimitée = `warn`, `delegation` jamais testée, boucle « recipient is self » vide, aucune vérification du token/montant sortant vs intention. Un frontend compromis y cache le drain. Corriger : critical si spender ∉ registre ; test de `delegation` ; vérifier `outgoing` ⊆ {token déclaré, montant déclaré ± 1 %}.
3. **Moteur d'effets aveugle aux changements d'état** (Bybit, Radiant, WazirX) : pas de `stateChanges`, pas de `operation`, pas de décodage imbriqué. Même sans traitement parfait : détecter `operation==1`, `transferOwnership`, `upgradeTo`, `enableModule`.
4. **`confidence` figée à 1.0, pas de fail-closed** : tx ou signature non décodable → `ok`. Il faut `confidence<0.6` quand le décodeur échoue ou que la simulation est indisponible, et `Verdict.coverage` visible.
5. **L'intention doit être saisie hors page et l'adresse doit être épinglée** : `pay_someone` sans `counterpartyAddress` n'attrape pas le clipper npm. Rendre l'adresse obligatoire (carnet d'adresses / ENS résolu dans le Snap) ou avertir `address_not_pinned`.

Cinquième ex aequo : signal `new_contract` à 50 blocs est trop faible (Bybit : contrat déployé ~2 jours avant). Passer à un âge en jours + absence d'étiquettes + code non vérifié.

## 5. Hors portée assumée (à dire tel quel au jury)

- **Seed ou clé privée volée** (infostealer, faux wallet qui exfiltre la phrase, extension de wallet empoisonnée comme Trust Wallet 2.68, sauvegarde cloud compromise) : le drain n'a aucune signature dans le wallet de la victime. La barrière protège un utilisateur **trompé**, pas **dépossédé**.
- **Faux wallet / fausse extension installée à la place de MetaMask** : pas de Snap, pas de barrière. Seule une garde en amont (liens officiels, classification du message qui pousse à l'installation) peut aider.
- **Compromission du système d'exploitation** (clipper OS, RAT, contrôle à distance via outil légitime, malware pilotant le navigateur après déverrouillage) : peut aussi falsifier le presse-papiers que l'utilisateur colle dans le Snap, voire déclarer une fausse intention.
- **Blind signing sur un matériel qui ne passe pas par MetaMask** (Safe + Ledger sans MetaMask, wallet mobile, WalletConnect vers un autre wallet) : pas de Snap, donc pas de simulation (à tester selon la configuration).
- **Compromission du Snap lui-même ou de MetaMask** : traité par durcissement de la chaîne de build (F9), pas par le comparateur.
- **Malware qui désactive silencieusement le Snap** : on peut seulement rendre l'absence de verdict visible (`coverage`), pas l'empêcher.
- **Attaques sans signature** (SIM swap vers compte exchange, vol de session CEX) : sans rapport avec la barrière.

## 6. Priorités de test Fuji pour la démo (scénarios « le site ment »)

1. Page de démo `app.demo-dex.test` (clonée) : intention swap ; l'UI affiche « Swap 10 USDC » ; la tx fait `approve(unlimited)` vers un EOA → critical `frontend_counterparty_mismatch`.
2. Page `connect` piégée (modale type Ledger Connect Kit) : `setApprovalForAll` → critical.
3. Clipper : `pay_someone` Paul, adresse substituée → critical `wrong_recipient`.
4. Safe de démo : delegatecall vers contrat qui change l'implémentation → critical (si temps).
5. Contrôle : routeur légitime de démo → ok (pour montrer le faible FP).

## Sources relues pendant la recherche
- https://www.theblock.co/post/265104/velodrome-aerodrome-hit-by-attack-on-front-end-websites (Velodrome/Aerodrome, 29 nov. 2023)
- https://trustwallet.com/blog/company/trust-wallet-browser-extension-v268-incident-community-update (post-mortem officiel)
- https://thehackernews.com/2025/12/trust-wallet-chrome-extension-hack.html?m=1 (7 à 8,5 M USD, Shai-Hulud)
- https://www.bleepingcomputer.com/news/security/trust-wallet-confirms-extension-hack-led-to-7-million-crypto-theft
