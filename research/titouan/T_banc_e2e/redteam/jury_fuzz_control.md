# Red team `fuzz_control` — prise de contrôle & opérations de chaîne

Surface couverte : ownership/admin (transferOwnership, setOwner, renounceOwnership), Safe
(addOwnerWithThreshold, swapOwner, changeThreshold, enableModule, setGuard via execTransaction),
proxy (upgradeTo, upgradeToAndCall, changeAdmin), rôles (grantRole DEFAULT_ADMIN), délégation de
vote, `wallet_addEthereumChain`, `wallet_switchEthereumChain`, `wallet_requestPermissions`,
`eth_signTransaction`, EIP-7702 (chaîne 1). Fuzzer déterministe (graine 20261011), boîte noire :
seul `check.mjs` est utilisé. Tout est synthétique (aucune clé, aucune adresse réelle, rien de signé).

- **Cas testés : 38 251** (28 459 en base + 9 792 en mutation sur 2 tours).
- **Contournements observés : ~26 200** (malveillant non-`critical`) + une classe de faux positifs bénins confirmée.
- `jury_fuzz_control.jsonl` : 373 contournements dédupliqués (≤ 8 exemples/technique), avec `label`, `expected_severity`, `bypass:true`, `technique`.

## Ce que le moteur ATTRAPE bien (témoins, 0 contournement)
Le moteur tient un **registre de sélecteurs de contrôle connus** → raison `control_change` → `critical`,
intention ou pas : `transferOwnership(address)`, `setOwner`, `renounceOwnership`,
`addOwnerWithThreshold`, `swapOwner`, `upgradeTo`, `upgradeToAndCall`, `grantRole(DEFAULT_ADMIN)`,
`changeAdmin` (EIP-1967). ~400 variantes chacun, toutes `critical`. Le wrapping `execTransaction`
(Safe) et le batch `wallet_sendCalls` (EIP-5792) sont correctement décodés et n'aident pas l'attaquant sur ces sélecteurs.

## Contournements (techniques, verdict, raison probable)

### 1. Prise de contrôle par sélecteur hors registre → `warn` au lieu de `critical` (100 %)
L'attaque : au lieu du sélecteur canonique, appeler une fonction de prise de contrôle **équivalente
mais hors liste**. Verdict obtenu : `warn` (raison `unknown_selector : sélecteur 0x… hors registre`),
jamais `critical` — quel que soit l'intention (`connect`, `asked_by_someone`/support…), l'origine
(officielle/sosie/suspecte), la chaîne (1/43114/43113) ou le wrapper (direct/execTransaction/sendCalls).
Raison probable : la détection des opérations d'administration repose sur une **allowlist de
sélecteurs** ; tout ce qui n'y figure pas retombe sur le plancher générique `warn`, qui ne déclenche
pas l'alerte critique. Chaque sélecteur ci-dessous correspond à un schéma réel de cession de pouvoir :

| Sélecteur (schéma réel) | passe / testé |
|---|---|
| `nominateNewOwner(address)` — Synthetix | 1807/1807 |
| `_setPendingAdmin(address)` — Compound Comptroller | 1803/1803 |
| `setPendingOwner(address)` | 1780/1780 |
| `proposeOwner(address)` | 1756/1756 |
| `pushOwner(address)` / `pushManagement(address)` — deux-étapes type Yearn | 1753 / 1820 |
| `transferOwnership(address,uint256)` — variante avec délai | 1804/1804 |
| `transferOwnership(address,address)` — surcharge 2 args | 1781/1781 |
| `setAdmin(address)` | 1812/1812 |
| `addOwner(address)` — ajout de signataire 1 arg | 1792/1792 |
| `setImplementation(address)` — swap d'implémentation hors UUPS | 1765/1765 |
| `setGovernance(address)` | 1771/1771 |
| `transferManagement(address)` | 1768/1768 |
| `beginDefaultAdminTransfer(address)` — AccessControlDefaultAdminRules | 1782/1782 |

Total : **~25 000 variantes, 100 % en `warn`** (cession d'ownership / prise de Safe / swap de proxy non signalée critique).

### 2. `eth_signTransaction` et `wallet_requestPermissions` → `unknown` (100 %)
L'attaque : présenter une transaction de prise de contrôle (ou de transfert de valeur) via
`eth_signTransaction`, ou demander des permissions larges via `wallet_requestPermissions`.
Verdict obtenu : `unknown` (champ `unsupported`). Raison probable : ces méthodes ne sont pas dans la
liste supportée par le moteur (`eth_sendTransaction`, `wallet_sendCalls`, `*_sign*`,
`wallet_switch/addEthereumChain`) ; une méthode non supportée ne produit aucun verdict → angle mort total.
`eth_signTransaction/312`, `wallet_requestPermissions/312`.

### 3. Opérations de réseau : RPC/chaîne non évalués → `warn`/`ok`
L'attaque : `wallet_addEthereumChain` avec un faux Avalanche C-Chain (0xa86a) pointant un RPC
malveillant (`http://185.220.101.44:9650/...`, `rpc.avalanche-secure.app`) ; ou
`wallet_switchEthereumChain` vers 0xa86a/0xa869 préalable à une signature. Verdict obtenu : `warn`
(addChain) ou `ok`/`warn` (switch). Raison probable : le moteur ne juge pas la confiance de l'URL RPC
ni l'enchaînement switch→signature (chaque requête est vue isolément, aucune valeur ne bouge sur le
switch lui-même). `addEthereumChain_malicious_rpc : 271/312` ; `switchEthereumChain_to_signature : 312/312`.

### 4. (Faux positif) Administration légitime de son propre Safe → `critical`
Cas bénin vérifié à la main (origine `app.safe.global`, Safe connu, intention honnête de maintenance) :
`changeThreshold`, `enableModule` et `setGuard` sur **son propre** Safe renvoient `critical` alors que
le contrat v3 attend `warn` (pas d'IntentKind d'administration). `addOwnerWithThreshold` et `swapOwner`
retombent correctement sur `warn`. C'est un faux positif de fatigue sur de la maintenance multisig réelle.
(Les compteurs bruts du fuzzer pour cette famille sont gonflés par la mutation qui bascule l'origine ;
le fait FP est établi par sonde manuelle en configuration propre, pas par un taux.)

## 3 pires techniques
1. **Cession/takeover par sélecteur de contrôle hors registre** (ownership, admin proxy, Safe owner add) → `warn`. 100 %, ~25 k variantes, aucun signal critique. C'est la faille structurelle : détection par allowlist de sélecteurs.
2. **`eth_signTransaction`** : une transaction complète (prise de contrôle ou transfert) retourne `unknown` → aucun avertissement du tout.
3. **`wallet_addEthereumChain` vers un RPC malveillant** (faux Avalanche C-Chain) → `warn` : l'utilisateur bascule sur un RPC hostile sans alerte critique.

## Reproduire
`node research/titouan/T_banc_e2e/redteam/gen_fuzz_control.mjs` (déterministe). Écrit
`jury_fuzz_control.jsonl` ; les verdicts sont obtenus en rejouant les lots via `check.mjs`.
