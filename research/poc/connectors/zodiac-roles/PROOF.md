# Preuve : Zodiac Roles v2 sur un Safe, rôle « sentinelle » limité à tighten()

Statut : **PREUVE FAITE, tests exécutés et verts** (9/9 dans chacun des 3 modes), le 10 oct. 2026.

## Approche
- Chaîne Hardhat locale (aucun fonds, aucune clé existante ; comptes de test jetables fournis par Hardhat).
- **Safe 1.4.1 réel** (singleton + SafeProxyFactory, paquet `@safe-global/safe-contracts`), 1 propriétaire, seuil 1.
- **Roles v2 déployé** avec owner = avatar = target = le Safe. Deux sources : (A) compilation du dépôt gnosisguild/zodiac-modifier-roles (commit 820e5bc, `packages/evm/contracts`, solc 0.8.21, libs Integrity + Packer liées) ; (B) **bytecode officiel publié Roles 2.1.0** (`mastercopies.json` du même dépôt), libs posées à leurs adresses officielles, **limite EVM de 24576 octets appliquée** (runtime mesuré : 24401 octets).
- Le Safe se configure lui-même par de vraies transactions Safe : `enableModule(roles)`, `assignRoles(sentinelle, [role], [true])`, `scopeTarget(role, Target)` (clearance = Function, rien d'autorisé), `allowFunction(role, Target, tighten(uint256), None)`.
- Contrat cible synthétique `Target` : `tighten(uint256)` (baisse le plafond) et `relax(uint256)` (le monte), tous deux réservés au Safe (`onlySafe`) : un refus venant de Roles est donc distinguable d'un refus du contrat.

## Versions
Node 25.6.0 (Hardhat affiche un avertissement « non supporté », sans effet), hardhat 2.29.1, ethers 6.17.0, @nomicfoundation/hardhat-ethers 3.1.3, @safe-global/safe-contracts 1.4.1, @gnosis-guild/zodiac-core 3.0.2, @openzeppelin/contracts(+upgradeable) 4.9.3, solc 0.8.21 (optimizer 100 runs, shanghai). Roles : dépôt gnosisguild/zodiac-modifier-roles commit 820e5bc975d1 ; release 2.1.0 pour le mode B. Le paquet npm `zodiac-roles-deployments` 3.3.0 n'est qu'un client d'API sans bytecode : inutile pour déployer.

## Rejouer
```
cd C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors/zodiac-roles/attempt-1
./run-proof.sh            # installe si besoin, lance A, B, C ; ~1 min
# ou à la main :
npx hardhat test                       # A : source compilée
OFFICIAL=1 npx hardhat test            # B : bytecode officiel 2.1.0, limite de taille appliquée
FORK=1 OFFICIAL=1 npx hardhat test     # C : fork en lecture seule de Fuji (43113)
```
La sortie complète observée est dans `proof-output.txt`.

## Sortie réelle observée (mode B, extrait)
```
OFFICIAL Roles v2.1.0 runtime size: 24401 bytes (limit 24576)
tighten(500) executed, cap 1000 -> 500
 ✔ ALLOWED: sentinel calls target.tighten(500) via Roles -> executed by the Safe
 ✔ REFUSED: sentinel calls target.relax(10**9) (function not in role)
decoded revert: ConditionViolation 3,0x5cea1d7e000...   (3 = FunctionNotAllowed ; 0x5cea1d7e = sélecteur de relax)
 ✔ REFUSED: error is a Roles ConditionViolation(FunctionNotAllowed, selector relax), not a Target error
 ✔ REFUSED: tighten() on another address (target not in role)
 ✔ REFUSED: tighten() through DelegateCall (options None)
 ✔ REFUSED: native value transfer from the Safe
 ✔ REFUSED: a stranger (not a role member) cannot even call tighten()
 ✔ CONTROL: sentinel calling target.tighten() directly fails (only the Safe may)
 ✔ REVOCABLE: Safe revokes the function; sentinel is then refused on tighten() too
9 passing
```
Résultat A, B et C : 9 passing, 0 failing.

## Pièges rencontrés (utiles pour l'intégration)
- `allowFunction` seul ne suffit pas : sans `scopeTarget` préalable, l'appel autorisé est refusé avec `TargetAddressNotAllowed` (statut 2). Il faut `scopeTarget` puis `allowFunction`.
- Les refus sont des erreurs personnalisées `ConditionViolation(Status, info)` : 3 = FunctionNotAllowed (info = sélecteur refusé), 2 = TargetAddressNotAllowed, 1 = DelegateCallNotAllowed, 4 = SendNotAllowed. Elles se décodent avec l'ABI de Roles : bon signal pour la détection/la preuve.
- Le build depuis HEAD du dépôt (optimizer 100 runs) fait 25297 octets, **au-dessus de la limite de 24576** : inutilisable tel quel hors Hardhat. Utiliser le bytecode publié 2.1.0 (24401 octets) ou un tag de release.

## Limites
- Chaîne locale ou fork en lecture seule : **rien n'a été déployé ni signé sur Fuji**. Le mode C prouve seulement que le même scénario passe sur un état forké de Fuji (ERC-2470 présente), pas un déploiement réel.
- Roles est déployé ici par un CREATE direct, pas via le ModuleProxyFactory ni la singleton factory ERC-2470 : le déploiement déterministe sur Fuji (adresse 0x9646… absente de Fuji, vérifié par eth_getCode) reste à faire, déduit mais non testé.
- Permission par fonction seulement : pas de conditions sur les paramètres (ex. `tighten(x)` avec x borné) ni d'allowances, non testées ici (Roles v2 les supporte via `scopeFunction`).
- Safe de test : propriétaire unique, signature « approved hash » (v=1), pas de garde ni de ModuleGuard Safe 1.5.0 testés avec Roles.
- Roles est un module du Safe : il contourne un éventuel Guard du Safe si celui-ci ne couvre pas les modules (point déjà connu de l'équipe).
- Aucun conteneur Docker utilisé : rien à arrêter. Clone du dépôt gnosisguild dans `vendor-src/`.
