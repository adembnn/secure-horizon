# fuzz_fp : fausses alertes sur opérations honnêtes (red team, boîte noire)

Générateur : `redteam/fuzz_fp_gen.mjs` (graine 11, 40 opérations par sous-famille). 98 sous-familles honnêtes sur Avalanche 43114, Fuji 43113 et Ethereum 1, chacune déclinée en 8 à 14 variantes d'intention. Tout est synthétique : victimes et contacts sont aléatoires, les adresses de protocoles sont publiques.
Ici, un « contournement » est une **fausse alerte** : un cas `benin` classé `critical`. Les `warn` sont comptés comme **fatigue**.

## Totaux (32 545 cas testés)
| Variante d'intention | n | critical (FP) | warn (fatigue) |
|---|---|---|---|
| **toutes** | 32 545 | 5 279 (16,2 %) | 18 606 (57,2 %) |
| honnête complète | 3 920 | 472 (12,0 %) | 2 263 (57,7 %) |
| honnête, texte seul / vague | 3 920 chacune | 472 (12,0 %) | 2 263 (57,7 %) |
| absente (`{}`) | 3 920 | 157 (4,0 %) | 2 561 (65,3 %) |
| maladroite : token synonyme / token acheté | 2 583 / 1 080 | 13 % / 11 % | 61 % / 58 % |
| maladroite : montant arrondi / en euros | 2 741 / 2 741 | 14 % / 12 % | 60 % / 60 % |
| maladroite : contact sans adresse | 440 | 10 % | 37 % |
| mauvais bouton → connect_or_accept_offer | 1 960 | 69 % | 29 % |
| mauvais bouton → buy_or_swap / send_to_my_account / pay_someone | 1 600 / 1 880 / 1 760 | 23 % / 21 % / 16 % | 57 % / 58 % / 59 % |
| un ami demande un remboursement (asked_by_someone, friend) | 80 | 100 % (voulu par conception) | 0 % |

Constat : « vague » donne exactement le même verdict que « honnête complète ». Le comparateur ne lit donc que `kind`. Sans intention du tout, il y a 3 fois moins de fausses alertes que lorsque l'utilisateur la déclare honnêtement : déclarer son intention est pénalisant.
Fatigue : 100 % de `warn` sur tous les agrégateurs (1inch, ParaSwap/Velora, Odos, 0x, Curve, Balancer), sur Aave, Benqi, Compound, CCTP, Across, Stargate, sAVAX unlock, Lido, Snapshot et les votes, à cause de `unknown_selector`/`opaque` ou `unknown_typed_data`.

## Techniques de fausse alerte (critical sur intention HONNÊTE ; tous variants entre parenthèses)
1. **Paiement au vrai contact quand l'historique contient un sosie (poussière reçue)** : `transfer` USDC vers « Paul », présent dans le carnet et déjà payé. → critical `lookalike_address`. Le destinataire est le vrai, mais le moteur signale le sosie présent dans l'historique, même quand la cible est exactement l'adresse du carnet. **40/40 honnêtes (360/360)**. Ex. FZFP-027906.
2. **Staking liquide par appel payable au token (sAVAX `submit()`, Lido `submit(address)`)** : → critical `no_incoming`. Le mint de sAVAX/stETH vers l'utilisateur n'est pas modélisé comme une entrée. **40/40 et 40/40 honnêtes (720/800)**. Ex. FZFP-016984, FZFP-017984.
3. **Approbation plafonnée à un contrat marchand ou d'abonnement, et checkout approve+pay en wallet_sendCalls** : intention `pay_someone`. → critical `unexpected_approval`. La règle v0 interdit toute approbation dans un paiement, alors que c'est le schéma standard des paiements marchands et des abonnements. **80/80 honnêtes (520/680)**. Ex. FZFP-013744, FZFP-030346.
4. **Approve du token LP au routeur pour retirer sa liquidité** (intention send_to_my_account) → critical `unexpected_approval`. **40/40 honnêtes (174/240)**. Ex. FZFP-019984.
5. **Mint public NFT payant sur une collection récente** → critical `no_incoming`. Le mint de l'ERC-721 n'est pas vu comme une entrée. **38/40 honnêtes (266/360)**. Ex. FZFP-023864.
6. **SIWE quand l'origine et le domaine diffèrent légitimement** (www/apex, app.lfj.gg/lfj.gg, traderjoexyz→lfj.gg, paraswap→velora, snapshot.org→snapshot.box, localhost) → critical `siwe_domain_mismatch` + `siwe_uri_mismatch`. **36/40 honnêtes (180/200)**. Ex. FZFP-024984.
7. **Passage au compte intelligent MetaMask (EIP-7702 vers le DeleGator officiel) ou révocation de la délégation (adresse 0)** → critical `delegation_7702`. **31/40 honnêtes (195/240)**. Ex. FZFP-032312. La révocation vers 0x0 est elle aussi en critical.
8. **Wrap natif → WAVAX/WETH** (`deposit()` ou envoi simple au contrat) → critical `no_incoming` / `first_seen_recipient`. **14/40 honnêtes (178/400)**. Ex. FZFP-010185.
9. **DAI permit legacy (`allowed:true`) vers 1inch, Uniswap V2 ou Aave** → critical `unlimited_allowance` + `unlimited_approval_swap`. **10/40 (90/240)**.
10. **wallet_addEthereumChain pour un L1 Avalanche légitime** (Dexalot ALOT, Beam BEAM, DFK JEWEL) → critical `chain_add_native_symbol_spoof`. **9/40 (45/200)**.
11. **Swap natif quand le routeur est « vu pour la première fois » ou absent du registre** (LB, joeV1, SR02, 1inch ethUnoswap, Aave gateway, UniV3 mint, ponts natifs OP/Arbitrum, Stargate) → critical `no_incoming` / `first_seen_recipient`. Entre 3 et 7/40 honnêtes par famille. Ce sont surtout les cas `router_not_in_registry` ou `protocol_firstSeen` du contexte.
12. **Intention adjacente cochée de bonne foi** : `pay_someone` pour un dépôt sur exchange, `send_to_my_account` pour un wrap ou un pont, `buy_or_swap` pour un listing Seaport, une co-signature Safe ou un ordre CoW → critical `unexpected_outgoing`, `no_incoming` ou `unexpected_approval_connect`. De 10 à 25 % par famille, et 69 % dès que `connect_or_accept_offer` est coché.

Sans aucun critical sur intention honnête : les révocations (approve 0, lockdown Permit2, setApprovalForAll false, lot de révocations), SIWE au même domaine, messages de connexion simples, votes, payroll en sendCalls, swaps sur agrégateurs (seulement du warn), Aave, Benqi, Compound et les ponts CCTP/Across.

Fichiers : `redteam/jury_fuzz_fp.jsonl` contient 509 fausses alertes dédupliquées par (sous-famille, variante d'intention, codes critical). Le générateur est `redteam/fuzz_fp_gen.mjs`.
