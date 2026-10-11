# Catalogue d'attaques SYNTHETIQUES (banc E2E, barriere d'intention v3)

**TOUT EST SYNTHETIQUE.** Jeu de test defensif : aucun cas n'est a utiliser contre un systeme ou un utilisateur reel. Adresses de victimes, d'attaquants et de contrats = tirage du PRNG (aucune cle, aucun secret, aucune signature). Aucune requete n'est signee : les demandes sont celles que le portefeuille recevrait AVANT signature. Node pur, zero dependance.

## Fichiers
| Fichier | Role |
|---|---|
| `gen.mjs` + `lib.mjs`, `core.mjs`, `fam1..fam6.mjs`, `scenarios.mjs` | generateur (graine fixe 20261011). `node gen.mjs` |
| `cases.jsonl` | tous les cas (un JSON par ligne, tries par id), champ `split` = DEV ou TEST |
| `DEV.jsonl` / `TEST.jsonl` | jeux separes |
| `TEST_HASH.txt` | SHA-256 de `TEST.jsonl`, ecrit par `gen.mjs` avant tout usage |
| `MANIFEST.json` | hash des jeux et des sources du generateur |
| `scenarios.json` / `SCENARIOS.md` | 8 scenarios de dialogue d'escroc FR/EN (agents joueurs) |
| `validate.mjs` / `VALIDATION_REPORT.txt` | validateur (execute pour de vrai) et son dernier rapport |

Reproduire : `node gen.mjs` puis `node validate.mjs` (le validateur regenere dans un dossier temporaire et compare octet pour octet).

## Schema d'un cas (JSONL)
| Champ | Sens |
|---|---|
| `id` | `<famille>-NNN`, stable pour une graine donnee |
| `synthetic`, `notice` | toujours `true` / texte SYNTHETIQUE |
| `family`, `subfamily` | famille et variante (les benins reprennent la famille de l'attaque qu'ils imitent) |
| `request` | `{method, params}` exact de la requete wallet : `eth_sendTransaction` (calldata reel encode), `eth_signTypedData_v4` (params[1] = JSON-string EIP-712), `personal_sign`, `eth_sign`, `wallet_switchEthereumChain`, `wallet_addEthereumChain`, `wallet_sendCalls` (EIP-5792). Les 7702 sont des `eth_sendTransaction` type `0x4` avec `authorizationList` non signee |
| `context` | monde du cas : `victim`, `origin` du site, `address_book`, `known_protocols` (routeurs connus), `token_registry`, `history` (dust/sosies), `counterparty_facts` (contrat ou non, age en blocs, vu par l'utilisateur), `share_of_balance_pct`, `token_info`, `ens`, `claimed_site`, `quote`... pour construire `Effects` sans RPC |
| `intent` | `Intent` du contrat `docs/intent-barrier.md` (`kind`, `freeText`, `token`, `amount`, `counterpartyLabel/Address`, `askedBy`, `pastedMessage`, `declaredAt` fixe) : ce que la victime croit faire |
| `label` | `malveillant` / `benin` / `ambigu` / `fraude_conforme` |
| `reason` | pourquoi |
| `expected_severity` | `critical`/`warn`/`ok`. **malveillant** : minimum exigible (toujours critical). **ambigu** : warn. **benin** : MAXIMUM tolerable (critical = faux positif ; warn = fatigue acceptee seulement quand `hard`). **fraude_conforme** : ce que le contrat v3 peut produire (ok, ou warn si part du solde >= 50 %) |
| `ideal_severity` | ce qu'un systeme ideal devrait dire. Egal a `expected_severity` sauf `fraude_conforme` (ideal = critical) |
| `required_signals` | signaux necessaires pour tenir `expected_severity` (ex. `approval_unlimited`, `recursive_decode_required`, `sell_simulation_fails`) |
| `blind_to_v3_contract` | `true` si le comparateur intention/effets seul (contrat v3) ne peut pas trancher : honeypot, taxe de vente, toute la `fraude_conforme` |
| `catalog_category` | categorie de la matrice SYNTHESE §2 (`1_droits_depense_directs`, `2_signatures_hors_chaine`, `3_controle_et_roles`, `4_execution_indirecte`, `6_contrepartie`, `7_tokens`, `8_swaps_et_ponts`, `9_faux_frontend_et_sites`, `11_parcours_conformes`) ou `benin` |
| `source` | motif source : sections de R1..R5, SYNTHESE, `docs/intent-barrier.md`, `C` (banc C) |
| `hard` | cas dur (benin legitime qui ressemble a une attaque) |
| `approximation` | `null`, ou `{typed_data_or_selector_from_memory:true, note}` : voir plus bas |
| `scenario` | `S1..S8` si le cas correspond a un script de dialogue |
| `lang`, `split`, `split_reason` | langue du message colle ; DEV/TEST et niveau de decoupe |

Mesure (contrat) : FN = `malveillant` sans `critical` ; FP = `benin` avec `critical` ; fatigue = `benin` avec `warn`/`critical` ; `fraude_conforme` = a rapporter a part (ce qu'on ne sait pas attraper). Les `ambigu` sont rapportes a part, hors FN/FP.

## Decoupe DEV / TEST
Trois niveaux, tous deterministes : (1) la famille `eip7702` est entierement hors DEV (test de generalisation a une famille jamais vue) ; (2) une sous-famille sur 4, choisie par hachage SHA-256, va entierement en TEST ; (3) parmi le reste, 1 cas sur 10 (hachage de l'id) va en TEST. TEST ne sert qu'a la mesure finale : aucun seuil ne se regle dessus. `TEST_HASH.txt` fixe son contenu ; `validate.mjs` le verifie.

Limite assumee : le niveau 3 laisse des sous-familles presentes des deux cotes, avec des variantes parametriques proches (voir rapport : 25 sous-familles de TEST sur 73 existent aussi en DEV). Seuls les niveaux 1 et 2 isolent vraiment.

## Honnetete : ce qui est approximatif ou limite
- **Structures de typed data et selecteurs de memoire** : 235 cas sur 589 portent un champ `approximation`. Regenerer depuis les depots officiels avant tout codage : Permit2 (PermitSingle/Batch/TransferFrom/Witness), Seaport OrderComponents (domaine 1.6), **Blur (tres approximatif : domaine, champs, adresse inventes)**, CoW (Gnosis Protocol v2), **UniswapX (ExclusiveDutchOrder/DutchOutput de memoire)**, DAI permit, EIP-2612 (name/version de domaine de token), SafeTx v1.3, **PackedUserOperation v0.7 (le typed data depend du compte)**, encodage packed de MultiSend, `wallet_sendCalls` (EIP-5792 evolue), `authorizationList` EIP-7702, SwapRouter02 `exactInputSingle` (7 champs). Le type `Witness` de Permit2 et le type `Claim` du verifyingContract sont **inventes** pour le banc.
- **Selecteurs** : calcules par un keccak256 local (verifie sur la valeur de reference de la chaine vide et sur `approve`=0x095ea7b3, `transfer`=0xa9059cbb, `setApprovalForAll`=0xa22cb465, `execTransaction`=0x6a761202), mais les signatures sont de memoire.
- **Adresses « connues »** : Permit2, Multicall3, CoW Settlement, Seaport 1.6, MultiSend 1.3.0, EntryPoint, USDC/USDT/DAI/WETH sont des adresses Ethereum de memoire (provenance `R[V]`, a verifier). Les autres routeurs/protocoles connus sont synthetiques (`S`).
- **Auteur non aveugle** : ce catalogue est ecrit par la meme main qui a lu le contrat et les rapports R1..R5 ; il ne remplit PAS le protocole anti-circularite de `C_banc_essai_evasions_v1.md` (attaques en aveugle apres H0). A utiliser comme jeu de non-regression et de couverture, pas comme preuve de robustesse.
- **Variantes parametriques** : beaucoup de cas d'une sous-famille ne different que par des adresses et des montants.
- **Cas non couverts** : vrai pont inter-chaines (ERC-7683), session keys/spend permissions (ERC-7715), ERC-1271, hooks de tokens, flash loans, detection de simulation, CREATE2 : absents ou seulement approches (R2 §2.12-2.14, R3 §4-6, §10). Trafic benin de masse (10 000 tx) : hors perimetre ici.
- **Contexte** : `counterparty_facts`, `token_info.sell_simulation`, `history` sont fournis tels quels ; un banc E2E reel doit les deduire d'un fork ou d'un RPC.
- **Trous du contrat v3 reveles** : pas de regle slippage (`slippage` = ambigu/warn), pas de IntentKind pour les operations d'administration (Safe, ownership, 7702 : les benins correspondants ont `reason` qui le signale et attendent `warn`), `fraude_conforme` aveugle par construction.
- **Fraude conforme** : l'etiquette est donnee par la conception du scenario (transfert legitime, intention honnete). `ideal_severity=critical` est un parti pris de mesure, pas une regle realisable par l'outil.

## Scenarios d'escroc (livrable 4)
`SCENARIOS.md`/`scenarios.json` : S1 faux support (Ledger/Coinbase/MetaMask), S2 faux remboursement, S3 faux recrutement, S4 pig butchering, S5 urgence bancaire, S6 faux proche, S7 faux airdrop, S8 faux concours. Chacun : persona, canal, 5 a 7 repliques FR et EN par etape avec tactique, reponses aux objections, objectif de transaction (methode wallet visee) et charge technique de repli, criteres de succes/abandon, et familles de cas liees (`scenario` S1..S8 dans les cas). Placeholders `{ATTACKER_ADDRESS}`, `{FAKE_SITE}` : a substituer par une adresse synthetique du banc.
