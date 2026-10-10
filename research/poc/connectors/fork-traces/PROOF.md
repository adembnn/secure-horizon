# Preuve : fork Hardhat de Fuji + debug_traceTransaction + transferts internes de valeur

Statut : EXECUTE pour de vrai (sortie complete dans `proof-output.txt`). Aucun conteneur Docker utilise (rien a arreter).

## Approche
1. `hardhat node`-equivalent en processus : Hardhat 2 avec `networks.hardhat.forking` sur le RPC public Fuji (lecture seule), chainId 43113, hardfork cancun.
2. Preuve A (locale) : deploiement dans le fork d'un contrat `Splitter` qui redistribue 1 AVAX en interne (transfer + call + create d'un contrat Sink). Trace via `debug_traceTransaction`.
3. Preuve B (tx REELLE de Fuji) : `find-tx.js` lit sur Fuji (RPC public, lecture seule) une tx recente avec valeur + calldata vers un contrat, reconstruit sa forme signee brute (signature d'origine de l'emetteur, aucune cle chez nous), puis on forke Fuji au bloc N-1 et on la rejoue avec `eth_sendRawTransaction` dans le fork LOCAL. Le hash rejoue est identique a l'original (verifie), et on la trace.
4. Extraction des transferts internes : parsing des `structLogs` (op CALL/CALLCODE/CREATE avec valeur > 0 lue sur la pile), avec suivi de la pile de frames pour connaitre l'adresse appelante (`from`) meme a travers DELEGATECALL.

## Versions
Node 25.6.0 (non supporte officiellement par Hardhat, avertissement ignore, fonctionne), hardhat 2.29.1, ethers 6, solc 0.8.24 (telecharge par Hardhat depuis binaries.soliditylang.org, sans compte). Fuji fork au bloc ~59,279,29x.

## Rejouer
```
cd <ce dossier>
npm install        # ou npm ci si lockfile
./run-proof.sh     # ~1 min, reseau requis vers api.avax-test.network
```
Fichiers : `hardhat.config.js`, `contracts/Splitter.sol`, `scripts/find-tx.js`, `scripts/proof.js`, `run-proof.sh`, `real-tx.json` (tx publique), `proof-output.txt`.

## Sortie reelle observee (extraits)
Preuve A : `debug_traceTransaction` renvoie 640 structLogs, profondeur max 2. Transferts internes extraits :
```
Splitter 0xcbde...5c02 -> 0x7099...79c8  300000000000000000 wei (CALL)
Splitter 0xcbde...5c02 -> 0x5e52...dd2d  200000000000000000 wei (CALL vers le Sink cree par le constructeur)
Splitter 0xcbde...5c02 -> 0x3c44...93bc  500000000000000000 wei (CALL)
```
Recoupe avec le solde : le destinataire `a` a bien recu 3e17 wei.

Preuve B : tx reelle Fuji 0x51f41488...2693 (bloc 59279292), rejouee : hash identique, status 0x1, gasUsed 956545, 99172 structLogs, profondeur max 8, 35 DELEGATECALL, 11 CALL, 24 STATICCALL. Transferts internes extraits (valeur 4 wei entrant, puis 1 wei repetes sur 3 niveaux) :
```
depth2 0xfd7e...4c9a -> 0xa2f9...8b9c  4 wei
depth5 0xa2f9...8b9c -> 0x3d04...bcc  1 wei ; depth6 0x3d04...bcc -> 0x593b...2b0f 1 wei  (x4 fois)
```

## Limites
- Hardhat 2 n'accepte PAS `tracer: "callTracer"` (erreur reelle : "only supports the default tracer"). On passe donc par structLogs (lourd : ~100k entrees pour une tx DeFi) puis parsing maison. Un `callTracer` natif demande un noeud Geth/Erigon/anvil (`anvil` n'a pas ete teste ici).
- `debug_traceTransaction` sur une tx DEJA minee avant le bloc du fork echoue (reel : "No known hardfork for execution on historical block ...", meme avec `chains.hardforkHistory` configure). Contournement : fork a N-1 + rejeu de la tx brute signee (le hash prouve l'identite). Ne marche que si l'emetteur n'a pas d'autre tx dans le bloc et que le nonce correspond ; timestamp/base fee du bloc rejoue different (initialBaseFeePerGas fixe), donc un rejeu n'est pas garanti identique pour une tx dependant du temps.
- Le parsing ne gere pas les CREATE avec valeur (adresse du nouveau contrat inconnue : "(new contract)"), ni SELFDESTRUCT, ni les revert partiels d'un sous-appel (un CALL de valeur a l'echec interne est quand meme liste, a croiser avec la valeur de retour sur la pile).
- Le RPC public Fuji ne supporte pas `debug_*` directement : le trace se fait uniquement dans le fork local.
- Rien n'a ete ecrit sur Fuji ; aucune cle ni fonds ; comptes Hardhat par defaut (cles publiques connues) uniquement dans le fork.
