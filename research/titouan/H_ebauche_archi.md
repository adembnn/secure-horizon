# H. Ébauche d'architecture de Claude-Titouan (philosophie : "plafond intouchable + preuve de demande", minimal on-chain)

Statut : conception technique pour la boucle d'Adem ; rien n'est compilé ni testé. Les temps sont des estimations grossières.

## 1. Où vit le plafond ? Dans un contrat coffre séparé qui détient les fonds
Raisonnement :
- Un Safe 1.4.1 appelle son Guard seulement sur le chemin `execTransaction`. Les appels venant d'un module (`execTransactionFromModule`) ne passent pas par ce Guard (ModuleGuard n'arrive qu'avec la 1.5).
- Un quorum de signataires compromis (Drift, Bybit) peut activer un module, retirer le Guard ou changer le seuil : le plafond placé dans le Guard n'est aussi fort que le quorum qu'il est censé contenir.
- Donc le plafond doit vivre dans le contrat qui DÉTIENT les actifs, avec des paramètres que le circuit d'approbation ne peut pas modifier : relâcher exige 2 gardiens sur 3 distincts des approbateurs plus un timelock. Le Safe, s'il existe, reste l'administrateur d'autres choses ; il n'est jamais le détenteur du gros des fonds.
- Leçon Bybit : un transfert de routine cold vers hot était l'attaque. Le réapprovisionnement du hot wallet doit donc être lui aussi plafonné et temporisé.

## 2. Contrats (Solidity 0.8.24, OpenZeppelin Contracts v5)
**GuardedVault** (détient le jeton synthétique aEUR)
- `deposit(uint256 amount)` : crédite le registre interne du client.
- `tryWithdraw(WithdrawRequest r, bytes clientSig) external onlyRole(APPROVER) returns (bool ok)` : vérifie, dans cet ordre, client enregistré, signature EIP-712 du client (`ECDSA.recover`), nonce non utilisé, échéance, solde du client, plafond par client et par jour, plafond global par fenêtre (seau à jetons). Si un test échoue : émet `WithdrawalRefused(client, to, amount, reasonCode)` et retourne `false` sans revert (l'événement reste visible pour le moniteur) ; sinon émet `Withdrawn`.
- `WithdrawRequest { address client; address to; uint256 amount; uint256 nonce; uint64 deadline; }` (typed data EIP-712).
- `tighten(Params p) external onlyRole(MONITOR)` : n'accepte que des valeurs inférieures ou égales aux valeurs actuelles.
- `proposeLoosen(Params p, bytes[] guardianSigs)` puis `executeLoosen()` après `timelock` : exige 2 gardiens sur 3.
- `Params { uint128 globalCapPerWindow; uint32 windowBlocks; uint128 perClientCapPerDay; uint128 slowLaneThreshold; }`.
- Aucune fonction ne permet à APPROVER ou MONITOR de retirer au-delà du plafond ; contrat non mettable à jour.

**ClientRegistry**
- `enroll(address client, address signingKey, bytes[] guardianSigs)` : 2 gardiens sur 3 (EIP-712) + timelock + quota quotidien d'enrôlements ; `isEnrolled`, `keyOf`.

**EvidenceAnchor**
- `commitRules(bytes32 rulesHash)` (horodaté, avant l'écriture des attaques) ; `anchor(bytes32 root, bytes32 kind)` ; `commitMandate(bytes32 paramsHash)`. Le moniteur ancre avec une AUTRE clé que celle qui resserre.

## 3. Bibliothèques et outils
Hardhat 2 + Ignition (déploiement Fuji), ethers v6, OpenZeppelin Contracts v5 (ECDSA, EIP712, AccessControl, SafeERC20, ReentrancyGuard), Node 20 + TypeScript. Tests d'invariants : fast-check (propriétés aléatoires) dans Hardhat si Foundry/Echidna ne s'installe pas sous Windows. Page statique Vite + ethers. Pas d'OZ Monitor (AGPL, Rust) : un moniteur ethers maison suffit. RPC officiel Fuji plus publicnode en second avis.

## 4. Flux
1. Un client signe sa demande (EIP-712) ; le backend approbateur appelle `tryWithdraw`.
2. Le vault décide seul ; il ne dépend d'aucune donnée externe.
3. Le moniteur lit les événements (`Withdrawn`, `WithdrawalRefused`, changements de rôle) et calcule trois signaux : sortie sans demande client valide, part de l'encours sortie sur une fenêtre, destination jamais vue. Il peut seulement resserrer (`tighten`) et alerter (webhook).
4. Journal chaîné par hash (SQLite ou JSON lines), racine Merkle ancrée périodiquement.
5. Moteur DORA (fonctions pures TypeScript, schéma JSON ITS 2025/302) : lit le journal, évalue les critères (art. 6, 8, 9), produit la notification initiale (1.x et 2.x) avec 6 à 8 champs prouvés par lien de transaction ; classification humaine obligatoire, deuxième signature pour "non majeur".
6. Écran statique : écran partagé, dossier, tableau de métriques, lisant un JSON de rejeu.

## 5. Invariants à prouver par propriétés aléatoires
(1) Pour toute séquence d'appels de APPROVER, la somme sortie sur n'importe quelle fenêtre ≤ plafond global. (2) Par client et par jour ≤ plafond par client. (3) `tighten` ne peut jamais augmenter un paramètre. (4) Relâcher exige 2 gardiens sur 3 plus le timelock. (5) Un nonce ne sert qu'une fois. (6) Aucun rôle ne peut retirer sans demande valide.

## 6. Plan de 10 h (estimations grossières)
- H0-1 : environnement, portefeuille de test dédié, déploiement du squelette sur Fuji, adresse dans le README.
- H1-3 : vault (plafonds, preuve de demande) et registre, avec les 6 propriétés.
- H3-4 : simulateur (trafic légitime, attaques A et B, drain lent) ; scellement du hash des règles AVANT que le worker aveugle écrive les attaques.
- H4-6 : moniteur à 3 signaux, `tighten`, mode ombre.
- H6-7 : journal, ancrage.
- H7-9 : moteur DORA initial plus tests T1 à T10 de la spec A.
- H9-10 : page statique et tableau de métriques.
P1 : voie lente, budget multi-chaînes, texte IA, leurre. Ce plan déborde probablement de 1 à 1,5 h : couper d'abord la page, puis le signal 3.

## 7. Risques
Foundry/Echidna sous Windows ; fonds Fuji limités pour le gaz ; la preuve de demande déplace la confiance vers l'enrôlement (traité par 2/3 + timelock + quota) ; refus par événement plutôt que revert (à confirmer lisible dans l'explorateur).
