# W3. Comptes intelligents pour particuliers et protections intégrées (état au 10/10/2026)

Étiquettes : [P] source primaire (spec, doc officielle, audit, rapport d'origine). [S] source secondaire (presse, agrégateur). [V] vendeur ou marketing. "Inférence" = déduction de l'auteur, non sourcée.
Méthode : 22 appels web sur 45 autorisés. Contenu web traité comme donnée. Les pages eco.com sont des guides d'agrégateur : [S] faible.

## Résumé (8 lignes)
1. Argent s'appelle désormais Ready. Gardiens, limite quotidienne et "Trusted Contacts" sont décrits seulement par un guide tiers [S]. Les docs officielles Ready lues ne les détaillent pas.
2. Safe : module Allowance (limite par jeton, ponctuelle ou périodique) et Delay Modifier. Seuls les signataires modifient une limite [P]. Aucun chiffre d'utilisateurs actifs 2026 trouvé.
3. Coinbase Smart Wallet : spend permissions (jeton, période, montant) via un contrat Spend Permission Manager [P]. Aucun nombre d'utilisateurs de cette fonction trouvé.
4. ERC-4337 : environ 62,9 millions d'adresses ayant exécuté au moins une UserOperation, cumul mi-2026 [S, ZeroDev citant BundleBear]. Ce n'est pas un nombre de personnes.
5. ERC-7579 et ERC-7715 sont toujours au statut Draft [P]. Pas de métrique d'adoption fiable trouvée.
6. EIP-7702 : actif depuis Pectra (7 mai 2025). Les premières délégations étaient très majoritairement des balayeurs malveillants [S]. Pas de jeu de données 2026 trouvé.
7. Ledger : 7702 limité à un contrat EF simple, tout autre bloqué [P, mai 2025]. Trezor : aucun support 7702 trouvé.
8. Constat clé : une limite appliquée par contrat est contournable si la clé qui la gouverne est celle qui a été volée. Seuls un gardien, un délai ou un second signataire indépendant changent cela.

## Tableau maître des fonctions de sécurité

| Wallet | Limite de dépense | Délai | Liste blanche | Gardiens / récup. sociale | Second appareil | Limite levable par appareil ou seed compromis ? |
|---|---|---|---|---|---|---|
| Ready (ex-Argent) | Limite sur 24 h, au-delà : refus ou file d'attente selon config [S eco.com] | "Délai de sécurité de plusieurs jours" en récupération, durée exacte non trouvée [S]. Audit 2023 : escape d'une semaine [P Consensys] | "Trusted Contacts" contournent la limite [S] | Oui : autre wallet Argent, wallet matériel, service gardien ; quorum configurable [S]. Gardiens sans accès aux fonds [V App Store] | Wallet matériel comme gardien [S] | Non trouvé en source officielle. Inférence : la levée passe par les gardiens, donc la seule clé propriétaire ne suffit pas. À vérifier |
| Safe | Module Allowance : par jeton, unique ou périodique, bénéficiaire sans seuil multisig [P help.safe.global] | Delay Modifier (module natif) [S forum Safe] | Pas de restriction de destinataire dans l'Allowance [P] ; Roles Module pour filtrer [S] | Pas de récupération sociale native dans les sources lues. Multisig = autres signataires | Multisig multi-appareils | Seuls les signataires modifient une limite [P], via le seuil du Safe. Seuil 1 et clé volée : oui. Seuil 2 sur 2 appareils : non |
| Coinbase Smart Wallet | Spend permissions : jeton, période, montant, par dépensier [P docs CDP] | Non trouvé | Non trouvé | Passkeys ; pas de récupération sociale trouvée | Plusieurs propriétaires possibles (non confirmé dans les pages lues) | Non traité dans les docs lues [P]. Inférence : la révocation est une opération du compte, un propriétaire compromis peut créer ou révoquer |
| Ambire | Non trouvé | Récupération avec délai (blog 2023) [P blog Ambire] | Non trouvé | Compte email : multisig 2/2, clé locale chiffrée + clé sur HSM serveur ; une seule clé suffit à lancer une récupération temporisée [P blog 2023]. Sources tierces contradictoires | Non trouvé | Non trouvé |
| Ledger | Aucune limite de dépense trouvée | n/a | Whitelist de contrats 7702 côté appareil [P] | n/a | Appareil = signataire | Hors périmètre : la contrainte porte sur les contrats autorisés, pas sur les montants |
| Trezor | Non trouvé | n/a | Non trouvé | n/a | n/a | Aucun support 7702 trouvé [S forum Magicians, non daté] |

## Détails par produit

### Ready (ex-Argent)
- Renommage : "Ready (formerly Argent)" sur App Store et pages emplois [S] https://apps.apple.com/us/app/-/id6744935604
- Docs officielles : page d'intro seulement, "premier wallet open source sur Starknet à abstraction de compte native" [P] https://docs.ready.co
- Guide tiers (fonctions) : https://eco.com/support/en/articles/15254043-argent-wallet-deep-dive-2026-starknet-and-account-abstraction [S]
- Audit Consensys Diligence : un gardien malveillant pourrait tenter de vider via une transaction d'escape à frais gonflés ; plafonds ajoutés en v3 [P] https://diligence.consensys.io/audits/2024/01/argent-account-argent-multisig-starknet-transaction-v3-updates/argent-audit-2024-01.pdf
- Version actuelle : non trouvée. "Liste blanche depuis 2019" : non trouvé.
- Utilisateurs : "2M+ téléchargements" de l'extension, texte marketing [V] https://addons.mozilla.org/addon/argent-x/ . Comptes actifs : non trouvé.
- Ancienne appli Argent Vault : plus de création de compte, renvoi vers Ready [V] https://apps.apple.com/us/app/-/id6746411858
- Prix : non trouvé (cartes Ready Lite et Ready Metal mentionnées [S]).

### Safe
- Spending limits : module installé au premier usage, seuls les signataires les créent ou modifient, un dépensier n'a pas besoin d'être signataire, limites par jeton sans restriction de destinataire, au-delà de la limite retour au flux normal [P] https://help.safe.global/en/articles/40842-set-up-and-use-spending-limits
- Delay et Roles (exemple Gnosis Pay, délai typique 3 minutes) [S] https://docs.gnosispay.com/gp-onchain/about-GP-safe
- Adoption : "dizaines de milliards de dollars sécurisés" [S eco.com] https://eco.com/support/en/articles/15254042 . Utilisateurs actifs ou comptes créés avec date : non trouvé.
- Prix : non trouvé.

### Coinbase Smart Wallet
- Spend permissions : jeton, période (`periodInDays` ou fenêtres), montant ; réseaux Arbitrum, Avalanche, Base, Ethereum, Optimism, Polygon [P] https://docs.cdp.coinbase.com/wallets/using-wallets/spend-permissions
- Contrat Spend Permission Manager : 0xf85210B21cC50302F477BA56686d2019dC9b67Ad, même adresse sur tous les réseaux [S, résultat de recherche, non revérifié sur la page]
- Gaz : sponsorisable via paymaster [P].
- Usage : "centaines de milliers d'utilisateurs actifs hebdomadaires", chiffre non vérifié [S eco.com] https://eco.com/support/en/articles/15039721 . Non trouvé en source primaire.
- Prix : non trouvé.

### Ambire
- EIP-7702 supporté (un EOA devient Smart EOA en une transaction) [S 2026, eco.com] https://eco.com/support/en/articles/15039721
- Récupération : blog EF grant 2023 https://blog.ambire.com/ambire-ef-grant-proposal [P, ancien]. Utilisateurs, prix, limites de dépense : non trouvé.

## Standards

| Standard | Statut | Fonction liée aux limites | Adoption réelle |
|---|---|---|---|
| ERC-4337 | Déployé | UserOperations, paymasters | ~1,22 Md d'UserOps et 62,9 M d'adresses cumulés mi-2026, 90 à 99 % des UserOps sponsorisées [S ZeroDev, 12 août 2026] https://www.zerodev.app/blogs/erc-4337-final-not-finished |
| ERC-7579 | Draft, créé le 2023-12-14 [P] https://eips.ethereum.org/EIPS/eip-7579 | 4 types de module : validateur, exécuteur, fallback, hook. Une limite de dépense = hook ou validateur à politique, hors spec | Rhinestone (implémentation de référence, registre), ZeroDev Kernel v3, Safe via adaptateur [S eco.com] https://eco.com/support/en/articles/11890018-erc-7579-the-modular-smart-account-standard-explained . Aucun chiffre de modules installés trouvé |
| ERC-7715 | Draft, créé le 2024-05-24 [P] https://eips.ethereum.org/EIPS/eip-7715 | Types `native-token-allowance`, `erc20-token-allowance` ; seule règle définie : `expiry`. Pas de plafond par période dans la spec | Cité en production chez Coinbase, MetaMask, Biconomy, Rhinestone [S, vendeurs], non vérifié. Interopérabilité encore faible [S] |
| Smart Sessions (Rhinestone + Biconomy) | Module | Politiques par action, lien ERC-7715 [S] | Chiffres non trouvés |

## EIP-7702
- Actif depuis Pectra, 7 mai 2025 [S].
- Wintermute (mai-juin 2025) : plus de 80 % des délégations (97 % à 4 semaines selon une autre source) pointaient vers des balayeurs copiés-collés, dont "CrimeEnjoyor" [S The Block] https://www.theblock.co/news/ecosystems/2025-06-01-wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks-356481
- Cas : 146 551 USD perdus par un utilisateur MetaMask le 24 mai 2025 ; 1,54 M USD en août 2025 [S] https://coincentral.com/crypto-investor-hit-by-1-54m-loss-in-phishing-scam-using-eip-7702/
- Scam Sniffer, bilan 2025 (publié début janv. 2026) : 83,85 M USD volés, 106 106 victimes, baisse de 83 % ; 7702 cité comme vecteur nouveau, août 2025 : 2,54 M USD sur deux incidents [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Les chiffres de délégations varient selon la mesure (toutes, malveillantes, étiquetées criminelles). Ne pas les comparer.
- Données 2026 d'adoption (nombre de délégations, attaques 2026) : non trouvé. Pages 2026 sur domaines douteux écartées.
- Wallets déclarant le support : Ambire [S], Argent/Ready (2025) [S eco.com], Ledger (restreint) [P]. Liste complète : non trouvé.
- Matériel : Ledger compatible au niveau appareil avec app Ethereum v1.17 minimum ; seul le contrat simple de l'EF est autorisé, tous les autres bloqués ; Nano S exclu [P, 7 mai 2025] https://www.ledger.com/blog-pectra-upgrade-announcement . Linea, mars 2026 : certains wallets matériels ne signent pas les authorizationList [S] https://docs.linea.build/protocol/eip-7702 . Trezor : aucune mention 7702 dans les notes Suite sept. 2025 ; un fil non daté dit qu'aucun plan n'existe [S] https://ethereum-magicians.org/t/eip-7702-set-eoa-account-code/19923/347
- Persistance : la délégation reste active jusqu'à révocation par l'utilisateur [S Linea].

## Infrastructure (Rhinestone, ZeroDev, Biconomy, Pimlico)
- Rhinestone : seed 5 M USD, août 2024, mené par 1kx [S The Block] https://www.theblock.co/post/310994/1kx-5-million-seed-round-rhinestone
- Pimlico : seed 4,2 M USD, nov. 2023, a16z crypto ; environ 3 M d'UserOps à l'époque [S] https://cryptonews.com/news/uk-web3-firm-pimlico-secures-4-2m-seed-investment-led-by-a16z-crypto/
- ZeroDev : Kernel modulaire (v1 à v4) [S ZeroDev]. Biconomy : Nexus, ERC-7579 [S]. Tarifs, comptes actifs, financements 2026 : non trouvé.

## Adoption (synthèse avec dates)
| Élément | Chiffre | Date | Source |
|---|---|---|---|
| Adresses ERC-4337 actives au moins une fois | 62,9 M | mi-2026 | [S] ZeroDev/BundleBear |
| UserOps cumulées | 1,22 Md | mi-2026 | [S] idem |
| Ready X téléchargements | 2M+ | non daté | [V] Firefox Add-ons |
| Coinbase Smart Wallet actifs hebdo | "centaines de milliers" | non daté | [S] eco.com, non vérifié |
| Safe, Ambire, Trezor | non trouvé | | |

Note : une série "420 000 comptes actifs / 143 000 mensuels" (Cointelegraph) n'a pas d'année claire, écartée.

## Ce qu'un attaquant qui détient la clé peut encore faire
1. EOA classique ou 7702 sans contrat de limite : tout. Une clé volée peut aussi signer une nouvelle délégation vers un balayeur (cas 2025 sur clés fuitées) [S].
2. Safe seuil 1 : modifier ou supprimer l'Allowance puis vider. Seuil 2 ou plus : l'attaquant doit aussi contrôler les autres signataires. Le module n'impose aucune liste de destinataires [P].
3. Coinbase Smart Wallet : inférence, si la clé propriétaire est compromise, créer un dépensier et une permission à son profit. Les docs lues ne décrivent aucun frein supplémentaire.
4. Ready/Argent : la limite protège seulement si la levée exige un gardien. Si l'attaquant contrôle aussi le gardien (même appareil ou même compte email), la protection tombe (inférence). Le délai de récupération permet au propriétaire d'annuler, mais seulement s'il surveille [S].
5. Compromission du gardien ou du service : risque d'escape à frais gonflés, atténué par des plafonds depuis v3 [P audit].
6. Phishing de signature (batch 7702, Permit, Permit2) : l'utilisateur signe lui-même, donc les limites par contrat ne s'appliquent pas si le contrat délégué est celui de l'attaquant [S Scam Sniffer].
7. Matériel : Ledger bloque les contrats 7702 non autorisés, ce qui coupe la délégation vers un balayeur [P]. Cela ne limite pas les montants.
8. Standards de limite (hooks 7579, allowances 7715) : applicables seulement si le module est installé et si sa désinstallation exige une autorisation indépendante de la clé volée. La spec 7579 note que sa section sécurité "Needs more discussion" [P], et les docs lues ne traitent pas ce point.

## Lacunes à combler
Docs Ready sur limites et whitelist, version courante, utilisateurs actifs Safe/Ambire/Coinbase, métriques 7702 2026 (Dune), nombre de modules 7579 installés, support 7702 de Trezor, prix des infrastructures.
