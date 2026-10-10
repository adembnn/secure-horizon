# PROOF : Chainlink AggregatorV3 sur Fuji (réel) + MockV3Aggregator local, même code client

## Approche
- Un seul `readFeed(rpc, address)` (scripts/client.js, ethers v6, ABI AggregatorV3 : decimals, description, latestRoundData), uniquement `eth_call`, sans signer.
- Réel : flux AVAX/USD Fuji `0x5498BB86BC934c8D34FDA08E81D444153d0D06aD` (trouvé sur docs.chain.link, page Avalanche ; vérifié en direct : chainId 43113, description() = "AVAX / USD").
- Mock : `MockV3Aggregator` de `@chainlink/contracts` compilé avec Hardhat 2, déployé sur un nœud `hardhat node` local (chainId 31337) avec un compte de dev débloqué du nœud (aucune clé dans le code). Valeur synthétique : 1 000 000,00000000 (8 décimales) = fausse « réserve ».
- Docker non nécessaire : aucun conteneur lancé, rien à arrêter. Le nœud Hardhat est tué en fin de script (trap).

## Versions
Node 25.6.0 (avertissement Hardhat non supporté, mais fonctionne), hardhat 2.29.1, @chainlink/contracts 1.5.0, ethers 6.17.0, solc 0.8.19.

## Rejouer
```
cd <dossier attempt-1> && ./run-proof.sh
```
(installe via npm si node_modules absent, compile, lance le nœud local, déploie le mock, lance le client.) Nécessite l'accès Internet au RPC public Fuji.

## Sortie réelle observée (proof-output.txt)
```


Nothing to compile
MockV3Aggregator deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 (local chain 31337)
{
  "label": "REAL Fuji AVAX/USD",
  "chainId": 43113,
  "address": "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
  "description": "AVAX / USD",
  "decimals": 8,
  "roundId": "55340232221128815267",
  "answerRaw": "1049408100",
  "answerHuman": 10.494081,
  "updatedAt": 1791665320,
  "updatedAtISO": "2026-10-10T20:48:40.000Z",
  "ageSeconds": 533
}
{
  "label": "MOCK local (synthetic PoR)",
  "chainId": 31337,
  "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "description": "v0.8/tests/MockV3Aggregator.sol",
  "decimals": 8,
  "roundId": "1",
  "answerRaw": "100000000000000",
  "answerHuman": 1000000,
  "updatedAt": 1791665851,
  "updatedAtISO": "2026-10-10T20:57:31.000Z",
  "ageSeconds": 2
}
OK: same readFeed() code read both feeds
```

## Limites
- Le mock n'est pas une vraie preuve de réserves : c'est la même interface (latestRoundData), valeur synthétique. Aucun feed PoR officiel testé sur Fuji ici.
- `description()` du mock est un nom de fichier, pas un libellé ; à étiqueter « mock » dans le produit.
- Le client ne contrôle pas encore la fraîcheur (ageSeconds est affiché, pas de seuil) ni answeredInRound ; à ajouter pour une alerte de heartbeat.
- Dépend de la disponibilité du RPC public Fuji ; l'adresse peut changer (vérifier docs.chain.link).
- Aucune transaction sur Fuji ; la seule écriture est sur la chaîne locale.
- Pas de fork Fuji utilisé (inutile ici).
