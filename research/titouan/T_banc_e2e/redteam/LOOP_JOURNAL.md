# Boucle d'amélioration de la détection (detectors_adem + check_plus)

Mesure : `node redteam/check_plus.mjs redteam/V2_DEV_norm.jsonl --report`. Ajoute `--base` pour les verdicts de check.mjs seul et `--only=<id>` pour un A/B par détecteur.
Les chiffres « ratées » comptent les malveillants sans critical, « FA » les bénins en critical. Effectifs : 2 930 malveillants et 1 976 bénins, plus 795 cas de fraude conforme et 226 ambigus, rapportés à part.
V2_TEST n'a jamais été ouvert. check_plus refuse tout fichier dont le nom contient V2_TEST.

## Tour 0 : normalisation (`redteam/normalize_v2.mjs`)
Six dialectes de contexte étaient en jeu : `victim` sous forme d'objet, `token_registry` en objet de trois formes, `counterparty_facts` en tableau ou en objet simple, `history` en cinq formats, `origin` en objet, `known_protocols` en chaînes ou en objet.
- Avant : 4 410 cas sur 5 927 finissaient en `error`.
- Après : 0 erreur. Mesure de base : **244 ratées, 204 FA, 1 095 warn sur bénins**.

## Tours de la boucle
| Tour | Famille visée | Idée (détecteur) | Ratées avant → après | FA avant → après | Décision |
|---|---|---|---|---|---|
| 1 | exécution indirecte (multicall_depth2_transferFrom_aggregate3, n=11) | `indirect_pull` : un transferFrom de la victime exécuté par un relais engage la victime ; un approve exécuté PAR le relais ne l'engage pas | 244 → 233 (11/11) | 204 → 204 | gardé |
| 2 | presse-papiers et sosies (clipboard_swap n=97, routeurs sosies n=13) | `lookalike_known` : règle 3+4 contre le carnet, l'historique, les protocoles connus, les jetons de référence et l'adresse copiée ; substitution du presse-papiers | 233 → ~140 (+62 clipboard, +13 routeur, +10 drainer sosie) | 204 → 204 | gardé |
| 3 | droits et swaps (approve_drainer, amountOutMin0, permit_eip2612) | `spend_rights` : droit (on-chain ou permit signé hors chaîne) vers un spender inconnu, jeune (< 1 jour) ou jamais vu ; swap sans minimum via un routeur inconnu | +41 pool contrôlé, +17 drainer, +6 permit 2612, +3 Permit2, +3 airdrop | 0 FA ajoutée | gardé |
| 4 | jetons piégés (fake USDC, honeypot, taxe 99 %) | `token_guard` : registre officiel par chaîne (1, 43114, 43113) + simulation de revente en modes fork, eth_call ou context | 0 gain sur V2_DEV, déjà couvert par F8 ; double couverture 164/164 et 0 bénin touché | 0 | gardé (robustesse : ne dépend pas du registre fourni par le cas) |
| 5 | filet générique | `sim_events` : simulation sur fork et lecture des événements Approval / ApprovalForAll / Transfer qui concernent la victime | neutre sur V2_DEV (aucun RPC) ; test réel : sélecteur inconnu qui draine passe de warn à critical | 0 | gardé |
| 6 | NFT (coordinateur a) : FA de listing Seaport et de setApprovalForAll ; ordres Blur et Seaport à prix nul | `nft_orders` : relève un ordre qui cède des actifs contre ~0 ; abaisse en warn un listing honnête (contrat connu, conduit officiel, ≥ 80 % payé à la victime, prix cohérent, intention de vendre) | +21 Blur, +10 Seaport à prix nul | listing 75 → 0 ; setApprovalForAll 60 → 10 | gardé (correction de FP documentée, appliquée en dernier, jamais contre un critical d'un autre détecteur) |

## Sosie 3+4 (coordinateur b)
Vérifié avec check.mjs sur des cas fabriqués : préfixe 3 et suffixe 4, avec poussière, carnet ou historique. Les trois sortent en critical (`address_poisoning` et `lookalike_address`), car le moteur applique déjà 3+4 (rules.mjs, POISON). `lookalike_known` étend la règle aux protocoles connus, aux jetons et au presse-papiers.

## Test réel sur fork local (`detectors_adem/test/fork_test.mjs`)
Hardhat node local, comptes de dev déverrouillés, aucune clé. Contrats SYNTHÉTIQUES : un honeypot, un jeton taxé à 99 %, un jeton sain, un clone de Multicall3.aggregate3 et un « claim » à sélecteur inconnu qui draine via une approbation antérieure.
- Revente, mode fork : honeypot invendable (revert), taxe mesurée à 99 %, jeton sain à 0 %.
- check_plus avec `SENTINELLE_FORK_RPC` : achat du honeypot ok → critical ; achat du jeton taxé ok → critical ; sélecteur inconnu warn → critical (`sim_events`) ; pull via multicall critical ; achat sain reste ok.
- Sans RPC, les détecteurs restent muets (mode context sans donnée). Le mode est écrit dans chaque raison (`[mode=fork|eth_call|context]`).
- Fuji n'a pas été testé : il faut un RPC public, et je n'ai pas lancé de fork distant.

## État final V2_DEV
- Base : **244 ratées / 204 FA / 1 095 warn bénins**.
- Avec detectors_adem : **49 ratées / 79 FA / 1 220 warn bénins**. Les 125 warn supplémentaires sont les FP NFT ramenés de critical à warn.
- Aucune régression : la colonne « -perdus » vaut 0 sur toutes les sous-familles bénignes.

## Fichiers jurés (`jury_*.jsonl`, mesurés au dernier tour, sans réglage dessus)
| Fichier | Ratées avant → après | FA |
|---|---|---|
| jury_defi | 31/60 → 22 | — |
| jury_social | 41/73 → 41 | — |
| fuzz_address | 299 → 273 | — |
| fuzz_encoding | 940 → 879 | — |
| fuzz_intent | 420 → 404 | — |
| fuzz_sig | 1 101 → 879 | — |
| fuzz_control | 368 → 368 | — |

- Les fichiers fuzz ne contiennent que des survivants de mutation : le taux de base est de 100 % par construction.
- Les FA des fichiers jurés sont inchangées : jury_fp 22, fuzz_fp 509, fuzz_address 82, fuzz_control 40.

## Rejetés ou non faits
- `book_trust` (entrée de carnet ajoutée récemment) : non gardé. Le seul champ discriminant de V2 (`added_how`) est une étiquette du générateur, et `added_at` n'existe que chez les malveillants. Le FP n'est donc pas mesurable.
- Classifieur de message collé (T-103, mots-clés) et seuil cumulé sur envois fractionnés : non branchés, faute de temps. Les FP sur bénins n'ont pas pu être mesurés.

## Restes
- multicall_depth1/3_approve_aggregate3 (20 cas) : l'approve est exécuté PAR Multicall3 sur son propre solde et n'engage pas la victime. L'étiquette « malveillant » est une erreur du générateur. Gardé en warn.
- personal_sign d'un calldata hexadécimal (17) : à couvrir par un décodage du blob signé.
- addressbook_poisoned (6) : à couvrir par la confiance dans le carnet.
- FA restantes : savax_submit (14), add_chain_avalanche_l1 (15), bridge_cctp (11), elderly_pays_relative (10), subscription_capped_approve (10), setApprovalForAll à intention vague (10), wrap_deposit_plain_transfer (9).
- Fraude conforme : aveugle par construction. Une limite à assumer.
