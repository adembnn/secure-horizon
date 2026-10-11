# Chaîne de démo locale — répétition « Hold up »

Tout se passe sur un nœud **local**, gratuit, qui se comporte comme Avalanche (mode `fork`)
ou sur une chaîne vide hors-ligne (mode `plain`). Rien ne touche jamais le mainnet. Fuji
(chainId 43113) est la cible secondaire optionnelle.

## 1. Démarrer le nœud local

```bash
cd blockchain
npm install          # une seule fois
npx hardhat compile

# mode fork : fork local d'Avalanche C-Chain (chainId 43114), lit le RPC public
# https://api.avax.network/ext/bc/C/rpc (lecture seule, rien n'est jamais envoyé dessus)
HOLDUP_CHAIN_MODE=fork npm run chain:local

# mode plain (hors-ligne, pas de réseau) : chaîne vide, chainId 31337
HOLDUP_CHAIN_MODE=plain npm run chain:local
```

Le nœud écoute sur `127.0.0.1:8545` (changer avec `HOLDUP_PORT`). Sans `HOLDUP_CHAIN_MODE`,
le script essaie `fork` et retombe sur `plain` si le RPC public est inatteignable.

**Les comptes par défaut de Hardhat sont PUBLICS** (clé privée affichée au démarrage,
connue de tout le monde). Ne jamais y mettre de vrais fonds, ne jamais les utiliser sur
Fuji ou le mainnet — ils ne servent qu'à ce nœud local jetable.

## 2. Déployer les contrats de démo

```bash
DEMO_VICTIM=0xVotreAdresseDeWallet npm run demo:deploy -- --network localhost
```

Déploie DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter (approvisionné), puis en dernier un
FreshDrainer tout neuf dont le collecteur est un compte « attaquant » dédié. La victime
reçoit 2 480 DemoUSDC et de l'AVAX de test local pour le gas. En mode `fork`, la victime
reçoit aussi 2 480 vrais USDC (code réel du contrat, état écrit localement) — adresse
notée `realUsdc` dans `addresses.local.json`.

## 3. Ce que fait l'humain dans son wallet

1. Ajouter un réseau : RPC `http://127.0.0.1:8545`, Chain ID `43114` (mode fork) ou
   `31337` (mode plain), symbole AVAX.
2. Importer **UN seul compte de test local** (une clé privée de la liste affichée par
   `chain:local`, jamais la sienne) — jamais sur Fuji ou le mainnet, jamais pour de
   vrais fonds : ces clés sont publiques.
3. Vérifier le solde dans `addresses.local.json` (`usdc`, `realUsdc` en mode fork).

## 3 bis. Le faux contact (empoisonnement d'adresse)

```bash
# DEMO_CONTACT=0x... (optionnel : le vrai contact de la victime ; sinon une adresse neuve est générée et stockée)
node research/demo_reelle/chain/lookalike.mjs --network local
```

Cherche par force brute (threads, 5 à 30 s) une adresse qui partage les 3 premiers et 3 derniers
caractères hexa du contact, lui donne du gas, fait envoyer à la victime une poussière de
0,001 DemoUSDC (elle apparaît dans l'historique du wallet) et, en local, fait d'abord envoyer 120 DemoUSDC
de la victime au contact (usurpation locale) pour que le contact figure aussi dans l'historique.
Écrit `contact` et `lookalike` (adresses seulement) dans `addresses.<réseau>.json` et génère
`context.local.json` (contexte local de la victime, format de `server.mjs` : pointer dessus avec
`SENTINELLE_CONTEXT=research/demo_reelle/chain/context.local.json`). La clé du sosie est jetable :
jamais affichée, jamais écrite. Sur Fuji l'étape « victime -> contact » est sautée.

## 4. Jouer le contrefactuel (le "drain")

```bash
node research/demo_reelle/chain/drain.mjs --network local --serve
```

Sert `127.0.0.1:8792` : `GET /state` (soldes, dernier events, domaine EIP-712 à faire
signer), `POST /drain` (CORS limité à `http://localhost:8791` et `http://127.0.0.1:8791`).
`--network local|fuji` est obligatoire (jamais deviné). Refuse tout RPC qui n'est pas
`127.0.0.1` ou Fuji, et tout jeton autre que le DemoUSDC du fichier d'adresses. Sur Fuji, la clé du
déployeur joue le relayeur de l'attaquant (elle paie le gas) et chaque résultat affiche un lien
`https://testnet.snowtrace.io/tx/...`.

## 5. Rejouer en 10 secondes

```bash
node research/demo_reelle/chain/reset.mjs --network local
```

Remet la victime à 2 480 DemoUSDC, révoque l'allowance, redéploie un FreshDrainer neuf.
Sur Fuji (`--network fuji`) : remet le solde à 2 480 en mintant, redéploie un FreshDrainer, affiche les liens
Snowtrace. Il ne peut PAS révoquer l'allowance de la victime ni vider le collecteur (sans clé) : si une
allowance reste, le script l'affiche et l'humain doit appeler `approve(<ancien drainer>, 0)` sur le DemoUSDC
depuis son propre wallet (Snowtrace > Write Contract). Inutile pour rejouer : le nouveau drainer est un autre spender.

## 6. Ordre des commandes

### Répétition locale

```bash
cd blockchain
HOLDUP_CHAIN_MODE=fork npm run chain:local        # terminal 1 (ou =plain hors-ligne)
DEMO_VICTIM=0xTonWalletDeTest npm run demo:deploy -- --network localhost
node ../research/demo_reelle/chain/lookalike.mjs --network local     # faux contact + poussière + context.local.json
node ../research/demo_reelle/chain/drain.mjs --network local --serve  # console attaquant, terminal 2
node ../research/demo_reelle/chain/reset.mjs --network local          # entre deux passages
npm run anchor:local                                                  # optionnel : EvidenceAnchor, adresse sous "anchor"
```

Pour un nœud jetable (tests) : `HOLDUP_PORT=8548 HOLDUP_CHAIN_OUT_DIR=<dossier tmp>` redirige le nœud,
les scripts Hardhat et tous les fichiers générés (`addresses.*.json`, `context.local.json`) : les fichiers
de la répétition en cours ne sont pas touchés.

### Fuji (une seule fois, quand le déployeur est financé)

**Tout en une commande : `cd blockchain && npm run fuji:all`** (contrôle seul : `npm run fuji:check`). Marche à suivre,
robinets, AVAX nécessaires et répétition sur une copie locale de Fuji : `blockchain/FUJI.md`. Les commandes ci-dessous
restent valables une par une.

```bash
cd blockchain
# FUJI_PRIVATE_KEY dans .env (jamais commité). Financer le déployeur : https://build.avax.network/console/primary-network/faucet
DEMO_VICTIM=0xTonWalletFuji npm run demo:fuji           # coût estimé affiché d'abord, abandon net si solde insuffisant
#   options : -- --fresh (tout redéployer)  |  -- --fresh-drainer (FreshDrainer seul)
#   DEMO_VICTIM_AVAX=0.2 (défaut) : AVAX de test envoyés à la victime, sauté si déjà couverts
node ../research/demo_reelle/chain/lookalike.mjs --network fuji
node ../research/demo_reelle/chain/drain.mjs --network fuji --serve
node ../research/demo_reelle/chain/reset.mjs --network fuji
npm run anchor:fuji                                     # optionnel
```

Relancer `demo:fuji` ne redéploie rien tant que les contrats ont du code (réutilise `addresses.fuji.json`).
Le collecteur est une adresse neuve dont la clé n'existe nulle part (adresse seule dans le fichier) ; la clé du
déployeur joue le relayeur. Les nouveaux contrats s'ajoutent à `blockchain/DEPLOYMENTS.md` avec leurs liens Snowtrace.

Tester le chemin Fuji sans AVAX, sur un nœud local : `HOLDUP_CHAIN_OUT_DIR=<tmp> node scripts/demo/deploy-fuji.js --network localhost`
(fichier marqué `fujiEquivalent`), puis `--network fuji` pour lookalike/drain/reset avec le même `HOLDUP_CHAIN_OUT_DIR`.

## Sécurité

- Jamais de clé réelle dans ce dossier ni dans les scripts : `FUJI_PRIVATE_KEY`/`PRIVATE_KEY`
  viennent de l'environnement (`.env` racine, jamais commité).
- `drain.mjs`/`reset.mjs` refusent tout RPC hors `127.0.0.1`/Fuji et tout token hors
  DemoUSDC : impossible de les pointer par erreur sur un vrai compte.
- Tous les contrats (`FreshDrainer` inclus) sont des contrats de test synthétiques,
  documentés comme tels dans leur code, et ne tournent que sur ce nœud local ou Fuji.
