# Red team fuzz_sig — contournements des signatures hors chaîne

Surface : signatures hors chaîne (`eth_signTypedData_v4`, `personal_sign`, `eth_sign`).
Outil : boîte noire `check.mjs`. Tout synthétique (Avalanche C-Chain 43114 / Fuji 43113), aucune clé, aucune adresse réelle.

**Total testé : 2600 cas** (2543 malveillants, 57 bénins). **Contournements : 1260** (malveillants non-critical). Faux positifs sur les bénins : 0.

Un contournement = `level_final` ≠ `critical` sur un cas malveillant. Toutes les familles ci-dessous auraient dû donner `critical` (octroi d'un droit de dépense ou cession d'actif sans correspondance d'intention).

## Techniques

### eip2612 — 377/377 variantes passent
- **Attaque** : Signature EIP-2612 `Permit` (approve hors chaîne) : domaine d'un vrai token, spender inconnu, `value` énorme (2^256-2, 2^255, 10^30…).
- **Verdict obtenu** : warn ou ok — jamais critical.
- **Raison probable (vue externe)** : Le moteur ne modélise pas une signature Permit comme une approbation : il ne compare pas `value`/`spender` à l'intention, donc l'octroi d'allowance passe sous le radar.
- Exemple : `fuzzsig-00003`

### blur — 148/148 variantes passent
- **Attaque** : Ordre Blur `Order` (vente NFT) à price 0 / 1 wei.
- **Verdict obtenu** : warn `unknown_typed_data` + `opaque`.
- **Raison probable (vue externe)** : `primaryType` Order non reconnu → décodage impossible → warn générique ; le prix dérisoire et la cession du NFT ne sont jamais évalués.
- Exemple : `fuzzsig-00016`

### dai — 174/174 variantes passent
- **Attaque** : DAI permit (`allowed:true`, sans champ montant) vers un spender neuf/inconnu.
- **Verdict obtenu** : warn `dai_permit_no_amount`.
- **Raison probable (vue externe)** : `allowed:true` = droit illimité, mais le moteur le classe warn au lieu de critical : pas de plancher critique sur le permit DAI.
- Exemple : `fuzzsig-00019`

### psTxHex — 193/193 variantes passent
- **Attaque** : `personal_sign` d'un hex qui encode un calldata approve/setApprovalForAll.
- **Verdict obtenu** : warn `blind_signature` + `opaque`.
- **Raison probable (vue externe)** : Le moteur voit un blob binaire opaque et s'arrête à warn ; il ne tente pas de décoder le hex comme un calldata, donc l'approbation déguisée n'est pas lue.
- Exemple : `fuzzsig-00056`

### psText — 135/192 variantes passent
- **Attaque** : `personal_sign` d'un texte trompeur (« I authorize this app to manage all my tokens… »).
- **Verdict obtenu** : ok — aucun avertissement.
- **Raison probable (vue externe)** : Texte lisible sans transfert on-chain : le moteur ne fait aucune analyse sémantique du message signé, verdict ok total silence.
- Exemple : `fuzzsig-00005`

### p2witness — 71/333 variantes passent
- **Attaque** : Permit2 PermitWitnessTransferFrom avec witness exotique (WalletSync, Mandate, AirdropClaim, LimitOrder) et montant déguisé.
- **Verdict obtenu** : warn au lieu de critical.
- **Raison probable (vue externe)** : Le type de witness inconnu + montant hors sentinelle réduit la confiance du décodage : spender externe signalé en warn seulement.
- Exemple : `fuzzsig-00022`

### p2single — 72/339 variantes passent
- **Attaque** : Permit2 PermitSingle vers spender contrat/sosie avec montant non-sentinelle (2^255, 10^24, 2^48-1…) ou domaine muté (nover/onlyvc/salt).
- **Verdict obtenu** : warn `external_spender` au lieu de critical.
- **Raison probable (vue externe)** : La détection `unlimited` cible le sentinelle uint160 (2^160-1) ; un montant énorme mais différent, ou une intention vague, fait retomber le verdict à warn.
- Exemple : `fuzzsig-00009`

### p2tf — 31/153 variantes passent
- **Attaque** : Permit2 PermitTransferFrom montant déguisé vers spender neuf.
- **Verdict obtenu** : warn au lieu de critical.
- **Raison probable (vue externe)** : Même cause : montant non reconnu comme illimité, verdict abaissé à warn.
- Exemple : `fuzzsig-00033`

### p2batch — 33/189 variantes passent
- **Attaque** : Permit2 PermitBatch multi-tokens, montants mixtes non-sentinelle.
- **Verdict obtenu** : warn au lieu de critical.
- **Raison probable (vue externe)** : Au moins un token sous le seuil sentinelle suffit à éviter le plancher critique sur le lot.
- Exemple : `fuzzsig-00097`

### p2btf — 26/160 variantes passent
- **Attaque** : Permit2 PermitBatchTransferFrom multi-tokens déguisés.
- **Verdict obtenu** : warn au lieu de critical.
- **Raison probable (vue externe)** : Idem batch : montants déguisés non classés illimités.
- Exemple : `fuzzsig-00020`

## Familles correctement bloquées (critical)
- `seaport` : 0/172 contournement — le moteur décode et classe critical.
- `ethSign` : 0/170 contournement — le moteur décode et classe critical.
