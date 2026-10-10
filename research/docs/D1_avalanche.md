# D1 — Avalanche Fuji : ce que disent la doc officielle et le réseau (lu le 2026-10-10)

Légende :
- **[V-doc]** : lu sur une page de documentation officielle.
- **[V-src]** : lu dans le code source officiel (`ava-labs/builders-hub`, le code de build.avax.network).
- **[V-live]** : vérifié en direct, en lecture seule, par un appel RPC ou à l'API Routescan.
- **[I]** : incertain, ou source tierce.

## Réseau
- **Identifiant de chaîne** : 43113. [V-live]
- **RPC** : `https://api.avax-test.network/ext/bc/C/rpc`, gratuit et sans clé. [V-doc] https://build.avax.network/docs/quick-start/networks/fuji-testnet
- **Débit du RPC** : aucune limite chiffrée dans la doc. Des HTTP 429 sont possibles sous charge : prévoir un retry.
- **Finalité** : déterministe, en **environ 1 s**. [V-src] (Academy x402)
- **Frais de gas** : quasi nuls. Mesure en direct : base fee de 10 wei, gas price de 160 wei. [V-live]
  - Ne pas coder le gas en dur.
- **Explorateur** : https://testnet.snowtrace.io (opéré par Routescan).

## Fonds de test
- **Faucet Builder Console** : 0,5 AVAX par claim.
  - Plafonds : 1 claim par utilisateur et 2 par adresse, sur 24 h.
  - **Compte Builder Hub et wallet connecté obligatoires.** [V-src] https://build.avax.network/console/primary-network/faucet
  - → **À faire par Adem : créer le compte maintenant.**
- **USDC de test Circle** : `0x5425890298aed601595a70AB815c96711a31Bc65`, 6 décimales. [V-doc] https://developers.circle.com/stablecoins/usdc-contract-addresses, [V-live]
- **Faucet USDC** : https://faucet.circle.com
  - 20 USDC par requête, au maximum une requête toutes les 2 h par adresse. [V-doc]
  - → Les montants « réalistes » de la démo (12 000 €) passeront par un token maison, `tEURC`. L'USDC Circle servira à prouver que le mécanisme marche sur un vrai stablecoin.

## Déployer et vérifier
- Hardhat avec `@nomicfoundation/hardhat-verify`, réglage `customChains`. [V-doc] https://info.routescan.io/en/articles/11991333-deploying-and-verifying-contracts-hardhat
  - `apiURL` : `https://api.routescan.io/v2/network/testnet/evm/43113/etherscan`
  - `browserURL` : `https://testnet.snowtrace.io`
  - `apiKey` : n'importe quelle chaîne non vide.
- **API Routescan** sans clé : 2 requêtes/s et 10 000 par jour. [V-doc] https://routescan.io/docs/plans-and-limits/rate-limits
  - Appels utiles : `getLogs` et `txlist`. [V-live]
  - Pour le temps réel : `eth_getLogs` ou WebSocket directement sur le RPC.

## Briques existantes
- **ERC-8004 (Trustless Agents)** : statut Draft. https://eips.ethereum.org/EIPS/eip-8004
  - Déploiements de référence de l'org erc-8004 (pas d'Ava Labs). [V-live] Du code est bien présent sur Fuji.
  - IdentityRegistry : `0x8004A818BFB912233c491871b3d84c89A494BD9e`
  - ReputationRegistry : `0x8004B663056A597Dffe9eCcC1965A193B7388713`
  - Pas de ValidationRegistry déployé.
  - https://github.com/erc-8004/erc-8004-contracts
- **ICM / Teleporter** : le contrat Messenger est présent sur Fuji et sur les L1 de test Echo et Dispatch. [V-live]
  - Il faut un relayer, avec environ 1 min de latence.
  - Estimation : 3 à 5 h d'intégration, avec une démo live fragile.
  - → **Hors chemin critique.**
- **Chainalysis Sanctions Oracle** : **déprécié** depuis le 18 mars 2026 et **absent de Fuji**. [V-doc], [V-live]
  - → Sur Fuji, on déploie un mock avec une liste synthétique, présenté comme tel.
- **x402 sur Avalanche** : un cours officiel existe dans l'Academy.
  - Facilitators sur Fuji : thirdweb, PayAI, Ultravioleta.
  - Paiement par autorisation EIP-3009 (`transferWithAuthorization`). [V-src]
