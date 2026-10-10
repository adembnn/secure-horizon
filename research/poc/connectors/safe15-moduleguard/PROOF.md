# PROOF — Safe 1.5.0 Module Guard bloque la sortie par module, 1.4.1 est contourné

Statut : exécuté pour de vrai. 7 tests verts en local, 7 verts sur un fork Hardhat de Fuji (chainId 43113). Aucune transaction signée sur un vrai réseau, aucune clé existante lue (les 3 propriétaires sont générés à la volée par `Wallet.createRandom()`), Docker non utilisé (rien à arrêter).

## Approche
- Compilation depuis les sources officielles : `@safe-global/safe-smart-account@1.5.0` (alias npm `s15`) et `@safe-global/safe-contracts@1.4.1` (alias `s141`), solc 0.8.24.
- Safe 2-sur-3 créé via `SafeProxyFactory.createProxyWithNonce` + `setup`.
- `contracts/SentinelGuard.sol` : une politique (destinations allowlistées, plafond, pas de delegatecall) exposée via les deux interfaces : Transaction Guard (`0xe6d7a83a`) et Module Guard (`0x58401ed8`).
- `TestModule` : module de test, n'importe qui peut lui demander `drain(safe, to, amount)` (modélise un module compromis).
- Mode fork (`FORK=1`) : le singleton et la factory de proxy sont déployés par la Safe singleton factory réelle de Fuji (`0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7`, CREATE2, le test échoue si son code est absent).
- Scénario : setGuard, enableModule ; sortie normale (passe si destination allowlistée, bloquée sinon) ; 1.5.0 : `setModuleGuard` puis `drain` vers l'attaquant = revert `SENTINEL: destination not allowlisted`, `drain` vers destination allowlistée = passe ; 1.4.1 : `drain` vers l'attaquant réussit, attaquant payé 1 AVAX, `moduleChecks == 0`.

## Versions
Node 25.6.0 (non supporté officiellement par Hardhat, a fonctionné), hardhat 2.29.1, @nomicfoundation/hardhat-ethers 3.1.3, ethers 6.17, Safe 1.5.0 et 1.4.1 (`VERSION()` lu on-chain dans le test). `.npmrc` : `legacy-peer-deps=true` (conflit de peer deps ethers 5/6).

## Rejouer
```
cd "C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors/safe15-moduleguard/attempt-1"
./run-proof.sh            # npm install si besoin, compile, tests locaux puis fork Fuji
# ou séparément : npx hardhat test   |   FORK=1 npx hardhat test
```
Le fork exige un accès réseau à https://api.avax-test.network/ext/bc/C/rpc (lecture seule).

## Sortie réelle observée (proof-output.txt, run-proof.sh, code retour 0)
```
=== LOCAL ===
  Safe 1.5.0 (local)
    version=1.5.0 safe=0x806C09E3F2d88e57376E795dD593c0c6c24A88eF threshold=2 owners=3
    ✔ 2-of-3 Safe: Transaction Guard + enabled module
    ✔ normal exit: allowlisted destination passes the Transaction Guard, attacker destination is blocked
    module->evil: reverted by Module Guard; module->allowlisted: passed (moduleChecks=1)
    ✔ 1.5.0: module exit is BLOCKED by the Module Guard (and allowed destinations still pass)
  Safe 1.4.1 (local)
    version=1.4.1 safe=0x3517ce798cd6cdDA499d1D4dDB0A6673333D4f00 threshold=2 owners=3
    ✔ 2-of-3 Safe: Transaction Guard + enabled module
    ✔ normal exit: allowlisted destination passes the Transaction Guard, attacker destination is blocked
    ✔ 1.4.1: no Module Guard exists (setModuleGuard hits the fallback, nothing is stored)
    module->evil: SUCCEEDED on 1.4.1 (guard never consulted)
    ✔ 1.4.1: module exit BYPASSES the Transaction Guard (attacker is paid)
  7 passing (821ms)
=== FUJI FORK ===
  Safe 1.5.0 (Fuji fork, Safe singleton factory)
    version=1.5.0 safe=0x9c1aF6788aeC03a05ADefd6f4668eD5A26BafbEF threshold=2 owners=3
    ✔ 2-of-3 Safe: Transaction Guard + enabled module (434ms)
    ✔ normal exit: allowlisted destination passes the Transaction Guard, attacker destination is blocked (344ms)
    module->evil: reverted by Module Guard; module->allowlisted: passed (moduleChecks=1)
    ✔ 1.5.0: module exit is BLOCKED by the Module Guard (and allowed destinations still pass) (190ms)
  Safe 1.4.1 (Fuji fork, Safe singleton factory)
    version=1.4.1 safe=0x2913ebCa4397A81FBfC3cFb6Ee1c84890914F2fe threshold=2 owners=3
    ✔ 2-of-3 Safe: Transaction Guard + enabled module (478ms)
    ✔ normal exit: allowlisted destination passes the Transaction Guard, attacker destination is blocked (285ms)
    ✔ 1.4.1: no Module Guard exists (setModuleGuard hits the fallback, nothing is stored) (171ms)
    module->evil: SUCCEEDED on 1.4.1 (guard never consulted)
    ✔ 1.4.1: module exit BYPASSES the Transaction Guard (attacker is paid) (85ms)
  7 passing (5s)
```

## Limites
- Les adresses des Safe, du singleton et de la factory de proxy diffèrent entre local et fork ; rien n'est déployé sur Fuji réel : le fork s'évapore à la fin du test. Déployer pour de vrai sur Fuji demande une clé et des fonds (hors périmètre).
- Le Module Guard ne s'applique qu'aux modules qui passent par `execTransactionFromModule(ReturnData)` de 1.5.0. Un module peut aussi être retiré/ajouté par les propriétaires (2-sur-3) : le Module Guard ne protège pas contre des propriétaires qui coupent le guard (`setModuleGuard(0)`). Un garde pleinement intouchable demande un timelock ou un plafond côté coffre.
- La politique de test est volontairement minimale (allowlist + plafond par transaction, pas de cumul journalier).
- `checkTransaction` n'est pas appelé pour le `setGuard` qui l'installe (comportement Safe normal), ce qui explique `txChecks == 2` et non 3.
- Safe 1.5.0 est récent : peu d'outillage (Safe{Wallet} / Transaction Service absents sur Fuji, comme noté dans la recherche), signatures collectées en local.
- Les contrats 1.4.1 sont compilés avec solc 0.8.24, pas la version de build officielle du déploiement canonique : le comportement testé est celui du code source, pas du bytecode canonique 1.4.1 de Fuji.
