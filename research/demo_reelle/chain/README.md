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

## 4. Jouer le contrefactuel (le "drain")

```bash
node research/demo_reelle/chain/drain.mjs --serve
```

Sert `127.0.0.1:8792` : `GET /state` (soldes, dernier events, domaine EIP-712 à faire
signer), `POST /drain` (CORS limité à `http://localhost:8791` et `http://127.0.0.1:8791`).
Refuse tout RPC qui n'est pas `127.0.0.1` ou Fuji, et tout jeton autre que le DemoUSDC du
fichier d'adresses.

## 5. Rejouer en 10 secondes

```bash
node research/demo_reelle/chain/reset.mjs
```

Remet la victime à 2 480 DemoUSDC, révoque l'allowance, redéploie un FreshDrainer neuf.

## 6. Fuji (optionnel)

```bash
cd blockchain
FUJI_PRIVATE_KEY=... DEMO_VICTIM=0x... npm run demo:fuji
```

Sans clé ou avec un solde nul : message d'une ligne (adresse du déployeur si connue +
lien du faucet), pas de trace d'erreur.

## Sécurité

- Jamais de clé réelle dans ce dossier ni dans les scripts : `FUJI_PRIVATE_KEY`/`PRIVATE_KEY`
  viennent de l'environnement (`.env` racine, jamais commité).
- `drain.mjs`/`reset.mjs` refusent tout RPC hors `127.0.0.1`/Fuji et tout token hors
  DemoUSDC : impossible de les pointer par erreur sur un vrai compte.
- Tous les contrats (`FreshDrainer` inclus) sont des contrats de test synthétiques,
  documentés comme tels dans leur code, et ne tournent que sur ce nœud local ou Fuji.
