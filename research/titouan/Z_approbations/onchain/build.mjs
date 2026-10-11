// Génère Z4_illimite_par_plateforme.md à partir de result_eth.json et result_avax.json.
import fs from "node:fs";
import { wilson } from "../../bench/lib.mjs";
const D = { // [plateforme, V/NV, source ou indice]
 eth: {
  "0x000000000022d473030f116ddee9f6b43ac78ba3": ["Permit2 (Uniswap)", "V", "docs.0x.org/docs/core-concepts/contracts.md : « Permit2 is deployed to 0x0000…8BA3 across all chains » (doc d'un tiers, pas de Uniswap)"],
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": ["Uniswap V2 Router02", "V", "docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments"],
  "0x111111125421ca6dc452d289314280a0f8842a65": ["1inch Aggregation Router v6", "V", "github.com/1inch/limit-order-protocol README, tableau Ethereum mainnet"],
  "0x0000000000001ff3684f28c67538d4d072c22734": ["0x / Matcha AllowanceHolder", "V", "github.com/0xProject/0x-settler README et docs.0x.org/docs/core-concepts/contracts.md"],
  "0x40aa958dd87fc8305b97f2ba922cddca374bcd7f": ["non identifié", "NV", "nom du contrat vérifié « TokenApprove » (indice seulement, aucune doc lue)"],
  "0x1111111254eeb25477b68fb85ed929f73a960582": ["non identifié", "NV", "nom du contrat vérifié « AggregationRouterV5 » ; adresse absente des docs lues"],
  "0x881d40237659c251811cec9c364ef91dc08d300c": ["MetaMask Swaps (MetaSwap)", "V", "github.com/MetaMask/metamask-extension, shared/constants/swaps.ts, MAINNET_CONTRACT_ADDRESS"],
  "0x80a64c6d7f12c47b7c66c5b4e20e72bc1fcd5d9e": ["non identifié", "NV", "source non vérifiée sur l'explorateur"],
  "0xdac991621fd8048d9f235324780abd6c3ad26421": ["non identifié", "NV", "nom du contrat vérifié « Migrator »"],
  "0xc465cc50b7d5a29b9308968f870a4b242a8e1873": ["non identifié", "NV", "source non vérifiée"],
  "0x905373b191a418b214b64b324de2b8c3d60bc935": ["non identifié", "NV", "nom du contrat vérifié « BPool »"],
  "0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae": ["LI.FI Diamond", "V", "github.com/lifinance/contracts, deployments/mainnet.json"],
  "0x6131b5fae19ea4f9d964eac0408e4408b66337b5": ["KyberSwap MetaAggregationRouterV2", "V", "docs.kyberswap.com/developer-guide/aggregator-api/contracts"],
  "0xe592427a0aece92de3edee1f18e0157c05861564": ["Uniswap V3 SwapRouter", "V", "docs Uniswap, déploiements V3 Ethereum"],
  "0xb300000b72deaeb607a12d5f54773d1c19c7028d": ["non identifié", "NV", "nom du contrat vérifié « Diamond »"],
  "0x4cd00e387622c35bddb9b4c962c136462338bc31": ["non identifié", "NV", "nom du contrat vérifié « RelayDepository » ; docs.relay.link ne publie pas l'adresse sur la page lue"],
  "0xc92e8bdf79f0507f65a392b0ab4667716bfe0110": ["CoW Protocol GPv2VaultRelayer", "V", "docs.cow.fi/cow-protocol/reference/contracts/core et github.com/cowprotocol/contracts networks.json"],
  "0x888888888889758f76e7103c6cbf23abbf58f946": ["Pendle Router V4", "V", "github.com/pendle-finance/pendle-core-v2-public, deployments/1-core.json"],
  "0x8157a9d65807521fbb8db8f37eeecefdd247e9b1": ["non identifié", "NV", "source non vérifiée"],
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": ["Uniswap SwapRouter02", "V", "docs Uniswap, déploiements V3 Ethereum"],
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": ["Aave V3 Pool", "V", "github.com/bgd-labs/aave-address-book, AaveV3Ethereum.sol (POOL)"],
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": ["non identifié", "NV", "aucune doc lue (le nom affiché par l'explorateur est incohérent)"],
  "0x777777777777aec03fd955926dbf81597e66834c": ["non identifié", "NV", "nom du contrat vérifié « SingletonPaymasterV7 »"],
  "0x297e5e83dba6304030f291abb1ddd9546e984549": ["non identifié", "NV", "source non vérifiée"],
  "0xba12222222228d8ba445958a75a0704d566bf2c8": ["Balancer V2 Vault", "V", "github.com/balancer/balancer-deployments, v2 vault, mainnet.json"] },
 avax: {
  "0x5485a0751a249225d3ba2f6f296551507e22547f": ["non identifié", "NV", "nom du contrat vérifié « SwapRouter »"],
  "0x0b4478e810d48b5882d4019d435a2f864bab4f39": ["non identifié", "NV", "nom « RamsesV3PositionManager »"],
  "0x6131b5fae19ea4f9d964eac0408e4408b66337b5": ["KyberSwap MetaAggregationRouterV2", "V", "docs.kyberswap.com/developer-guide/aggregator-api/contracts (même adresse sur les chaînes listées)"],
  "0x757121c9a8259c4d6b6956c283355b2902a6baa2": ["non identifié", "NV", "nom « Router »"],
  "0x000000000022d473030f116ddee9f6b43ac78ba3": ["Permit2 (Uniswap)", "V", "docs.0x.org : même adresse sur toutes les chaînes (doc d'un tiers)"],
  "0xfd1c727d8a2259493c66899f478ebfea41329545": ["non identifié", "NV", "nom « NonfungiblePositionManager »"],
  "0xbb00ff08d01d300023c629e8ffffcb65a5a578ce": ["Uniswap SwapRouter02", "V", "docs Uniswap, déploiements V3 Avalanche"],
  "0x0000000000001ff3684f28c67538d4d072c22734": ["0x / Matcha AllowanceHolder", "V", "github.com/0xProject/0x-settler README : Avalanche listée"],
  "0xabfc48e8bed7b26762745f3139555f320119709d": ["non identifié", "NV", "nom « SwapRouter »"],
  "0x9357e52260bd5a4c704c02a285608ba6698f405f": ["non identifié", "NV", "source non vérifiée, code de 87 octets"],
  "0x3fed017ec0f5517cdf2e8a9a4156c64d74252146": ["non identifié", "NV", "nom « NonfungiblePositionManager »"],
  "0x60ae616a2155ee3d9a68541ba4544862310933d4": ["non identifié", "NV", "nom « JoeRouter02 » ; la page LFJ (developers.lfj.gg) a répondu 403"],
  "0xd6f5fe1250363a75319d10ae4981aa5aa62ddfb0": ["non identifié", "NV", "proxy transparent"],
  "0xcce9174424bdd18ef444846bdaccecd8ebbad550": ["non identifié", "NV", "source non vérifiée"],
  "0x94b75331ae8d42c1b61065089b7d48fe14aa73b7": ["Uniswap Universal Router", "V", "docs Uniswap, déploiements V3 Avalanche"],
  "0x40aa958dd87fc8305b97f2ba922cddca374bcd7f": ["non identifié", "NV", "nom « TokenApprove »"],
  "0x5acc35397d2ce81ac54a4b1c6d9e1fb29f8ec6c6": ["non identifié", "NV", "nom « UniversalRouter » ; adresse absente de la liste Uniswap lue"],
  "0x20f6ee51340adeed01a59b0e65cb3703f3dc860c": ["non identifié", "NV", "nom « DexAggregator »"],
  "0x18556da13313f3532c54711497a8fedac273220e": ["non identifié", "NV", "nom « LBRouter » ; page LFJ en 403"],
  "0x26a56f289eb7fc3c11e6f656bf3286f3ddb27b6c": ["non identifié", "NV", "source non vérifiée"],
  "0x671094c35c94814bd53eceabd44991e5a846609a": ["non identifié", "NV", "source non vérifiée"],
  "0x6a000f20005980200259b80c5102003040001068": ["Velora / ParaSwap Augustus v6.2", "V", "developers.velora.xyz/augustus-swapper/augustus-v6.2-smart-contracts (Avalanche listée)"],
  "0xb304f8caec0350ab3ccda10d8d7acdc993fc8dfb": ["non identifié", "NV", "source non vérifiée"],
  "0x4cd00e387622c35bddb9b4c962c136462338bc31": ["non identifié", "NV", "nom « RelayDepository »"],
  "0xc8b8fcbdb5c019d7802ffb0b39603395d7d3915c": ["non identifié", "NV", "nom « SwapRouter »"] } };
const pc = x => (x * 100).toFixed(1).replace(".", ",");
const sci = x => x == null ? "n/a" : x.toExponential(1).replace(".", ",");
const NAME = { eth: "Ethereum", avax: "C-Chain" };
let md = "", S = {};
for (const c of ["eth", "avax"]) {
  const r = JSON.parse(fs.readFileSync(`result_${c}.json`)); const t = r.top;
  const miss = t.filter(x => !D[c][x.spender]); if (miss.length) throw new Error("sans libellé " + miss.map(x => x.spender));
  const V = t.filter(x => D[c][x.spender][1] === "V"), NV = t.filter(x => D[c][x.spender][1] !== "V");
  const nV = V.reduce((a, x) => a + x.n, 0), uV = V.reduce((a, x) => a + x.illimites, 0), nN = NV.reduce((a, x) => a + x.n, 0), uN = NV.reduce((a, x) => a + x.illimites, 0);
  const n = r.droits_non_nuls, hors = n - r.n_top25;
  const uOut = r.illimites_tous - uV - uN;
  S[c] = { r, nV, uV, nN, uN, n, hors, uOut, nbV: V.length };
  md += `\n### ${NAME[c]}\n\n| # | Plateforme | Adresse | n | % illimité [Wilson 95 %] | médiane borné / offre | proprio. distincts | source de l'identification [V/NV] |\n|---|---|---|---|---|---|---|---|\n`;
  t.forEach((x, i) => { const d = D[c][x.spender]; md += `| ${i + 1} | ${d[0]} | \`${x.spender}\` | ${x.n} | ${pc(x.pct)} % [${pc(x.wilson[0])} ; ${pc(x.wilson[1])}] | ${sci(x.mediane_borne_rel_offre)} (${x.n_borne_avec_offre}) | ${x.proprietaires_distincts} | [${d[1]}] ${d[2]} |\n`; });
}
const W = (k, n) => { const w = wilson(k, n); return `${pc(k / n)} % [${pc(w[0])} ; ${pc(w[1])}]`; };
const head = `# Z4. Part d'approbations ERC-20 illimitées, par plateforme (mesure en chaîne)

Date : 2026-10-11. Méthode : lecture seule de journaux publics (\`eth_getLogs\`, \`eth_call\` offre totale, \`eth_getCode\`). Aucun secret. Aucune adresse ni liste issue de nos jeux de test : les spenders sortent de l'échantillon lui-même.

## Ce qui est mesuré
- Événement ERC-20 \`Approval\` (topic0 \`0x8c5be1e5…b925\`), 3 topics seulement. Les Approval ERC-721 (4 topics) sont ignorés. Les valeurs nulles (révocations) sont exclues.
- Illimité : valeur >= 2^255, ou valeur >= offre totale actuelle du jeton. Borné : tout le reste.
- Une ligne du tableau compte des événements, pas des personnes. Une même personne peut peser plusieurs fois (colonne « proprio. distincts »).
- Médiane borné / offre : médiane de (montant borné) / (offre totale actuelle du jeton), entre parenthèses le nombre d'événements bornés utilisés. Elle est minuscule presque partout : un montant borné est en général le montant exact du swap, très loin de l'offre. « n/a » : aucun borné.

## Échantillon (fenêtre épinglée, graine 20261011)
| | Ethereum | C-Chain |
|---|---|---|
| fenêtre | 800 blocs isolés tirés entre le bloc ${S.eth.r.meta.lo} et ${S.eth.r.meta.pin} | 40 fenêtres de 500 blocs entre ${S.avax.r.meta.lo} et ${S.avax.r.meta.pin} |
| RPC | gateway.tenderly.co/public/mainnet | api.avax.network (journaux), avalanche-c-chain-rpc.publicnode.com (offre, code) |
| événements Approval ERC-20 | ${S.eth.r.evenements_erc20_total} | ${S.avax.r.evenements_erc20_total} |
| dont valeur nulle (exclus) | ${S.eth.r.valeurs_nulles} (${pc(S.eth.r.valeurs_nulles / S.eth.r.evenements_erc20_total)} %) | ${S.avax.r.valeurs_nulles} (${pc(S.avax.r.valeurs_nulles / S.avax.r.evenements_erc20_total)} %) |
| Approval ERC-721 ignorés | ${S.eth.r.erc721_ignores} | ${S.avax.r.erc721_ignores} |
| droits non nuls analysés | ${S.eth.n} | ${S.avax.n} |
| spenders distincts | ${S.eth.r.spenders_distincts} | ${S.avax.r.spenders_distincts} |

Les ancrages (tête moins 1000 blocs) diffèrent du banc réel v0 car la mesure est plus récente. Fichiers : cache/*.meta.json.

## Résultats globaux (hors révocations)
| | Ethereum | C-Chain |
|---|---|---|
| part illimitée, tous droits non nuls | ${W(S.eth.r.illimites_tous, S.eth.n)} | ${W(S.avax.r.illimites_tous, S.avax.n)} |
| part des droits vers les 25 spenders les plus fréquents | ${pc(S.eth.r.part_top25)} % | ${pc(S.avax.r.part_top25)} % |
| dont vers spenders identifiés [V] (${S.eth.nbV} et ${S.avax.nbV} spenders) | ${pc(S.eth.nV / S.eth.n)} % (n=${S.eth.nV}) | ${pc(S.avax.nV / S.avax.n)} % (n=${S.avax.nV}) |
| dont vers spenders top 25 non identifiés [NV] | ${pc(S.eth.nN / S.eth.n)} % (n=${S.eth.nN}) | ${pc(S.avax.nN / S.avax.n)} % (n=${S.avax.nN}) |
| hors top 25 (non examinés) | ${pc(S.eth.hors / S.eth.n)} % (n=${S.eth.hors}) | ${pc(S.avax.hors / S.avax.n)} % (n=${S.avax.hors}) |
| % illimité chez les identifiés [V] | ${W(S.eth.uV, S.eth.nV)} | ${W(S.avax.uV, S.avax.nV)} |
| % illimité chez les top 25 non identifiés [NV] | ${W(S.eth.uN, S.eth.nN)} | ${W(S.avax.uN, S.avax.nN)} |
| % illimité hors top 25 | ${W(S.eth.uOut, S.eth.hors)} | ${W(S.avax.uOut, S.avax.hors)} |

## Tableaux par plateforme (25 spenders les plus fréquents par chaîne)
Tous les spenders listés ont un \`eth_getCode\` non vide (taille du code dans result_*.json, champ code_octets). Légende : [V] adresse lue dans une documentation ou un dépôt officiel du protocole, cité. [NV] non identifié : « nom du contrat vérifié » est le nom du code source publié par le déployeur sur l'explorateur, un indice, pas une identification.
${md}
## Lecture
- Les chiffres par plateforme décrivent ce que le contrat spender reçoit. Ils ne disent pas ce que l'interface demande par défaut.
- Un spender de type Permit2 ou AllowanceHolder reçoit une approbation de jeton, puis les montants se règlent par signature ou par appel. Son taux illimité est donc très différent de celui d'un routeur direct.
- Les taux sont proches de 0 % ou de 100 % pour plusieurs spenders non identifiés. Ces spenders ont souvent un seul propriétaire ou très peu de jetons : ce sont des bots ou des contrats à usage unique, pas des plateformes grand public.

## Limites
1. L'échantillon montre ce que les contrats reçoivent, pas le défaut de l'interface. Un portefeuille, un routeur ou le choix de l'utilisateur peut avoir changé le montant.
2. Un spender peut recevoir des approbations de plusieurs interfaces (par exemple Uniswap, Matcha et des portefeuilles qui appellent le même routeur). On ne peut pas attribuer une approbation à une interface.
3. Routeur contre agrégateur : approuver un routeur d'agrégateur (1inch, Kyber, Velora) n'est pas la même décision qu'approuver un contrat de pool. La ligne reflète le contrat, pas le produit entier.
4. Identification : seules les adresses [V] sont attribuées. Beaucoup d'adresses [NV] sont de vraies plateformes (le nom de contrat l'indique parfois) mais non vérifiées par une doc lue. Le chiffre « identifiés » est donc un plancher.
5. « Illimité » utilise l'offre actuelle du jeton (état à la date de la mesure) et pas l'offre à la date de l'approbation. Les jetons à offre variable (rebase) peuvent être mal classés. Un jeton sans fonction totalSupply est jugé uniquement par le seuil 2^255.
6. Les événements dépendent du jeton : certains jetons n'émettent pas d'Approval lors d'un transferFrom, d'autres oui (effets de bord). Un Approval n'est pas toujours un acte de la personne.
7. Blocs aléatoires : Ethereum 800 blocs isolés sur environ 6 millions de blocs, C-Chain 40 fenêtres de 500 blocs sur 5 millions de blocs. Les fenêtres C-Chain sont corrélées (une campagne ou un bot peut peser fort). Les intervalles de Wilson supposent l'indépendance, ce qui est faux ici (mêmes propriétaires et jetons répétés). Les lire comme une borne basse de l'incertitude.
8. Les doublons ne sont pas retirés : une personne qui approuve 20 fois pèse 20 fois.
9. La C-Chain a une part de révocations (valeur nulle) bien plus forte que l'Ethereum dans l'échantillon, ce qui peut refléter des outils de nettoyage automatiques.

## Rejouer
\`\`\`
cd research/titouan/Z_approbations/onchain
node fetch.mjs eth 800        # journaux Approval, blocs tirés (graine 20261011), cache dans cache/ (ignoré par git)
node fetch.mjs avax 40        # 40 fenêtres de 500 blocs
node analyse.mjs eth          # agrégation, top 25, offre, eth_getCode -> result_eth.json
node analyse.mjs avax         # -> result_avax.json
node build.mjs                # régénère ce fichier (libellés V/NV dans build.mjs)
\`\`\`
Un seul processus node à la fois. Le RPC avax.network bannit les rafales (erreur 1015) : relancer plus tard ou réduire la concurrence.
`;
fs.writeFileSync("Z4_illimite_par_plateforme.md", head);
console.log(head.split("\n").slice(14, 36).join("\n"));
