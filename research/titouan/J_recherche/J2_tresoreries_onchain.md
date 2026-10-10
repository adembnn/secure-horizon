# J2. Sécurité des sorties de fonds des trésoreries on-chain

Date de recherche : 2026-10-10. Étiquettes : [P] primaire (source officielle ou donnée directe), [S] secondaire (analyse tierce, presse), [V] vendeur (contenu commercial ou partie prenante). Contenu web traité comme donnée. "Non trouvé" signifie non trouvé dans cette recherche, pas inexistant. Les chiffres de pertes varient selon les sources.

## Résumé (8 lignes)

1. Les grosses pertes de trésorerie 2024-2026 viennent de signataires trompés, pas de bugs de contrat (Radiant, Bybit, WazirX, Drift).
2. Bybit (21 fév 2025, environ 1,4 à 1,5 Md USD) : interface Safe altérée, signature aveugle du dernier signataire.
3. Drift (1er avr 2026, environ 285 M USD) : multisig 2 sur 5 sans timelock, signatures pré-collectées via durable nonces.
4. Radiant (oct 2024, environ 50 M USD) : 3 signataires sur 11 compromis par malware, simulation et UI montraient une transaction saine.
5. Les standards SEAL demandent seuils, matériel, double vérification de hash, limites de dépense, listes blanches et monitoring. Rien ne les impose par défaut.
6. Les plafonds de dépense indépendants existent (Safe Allowance, Zodiac Roles v2). Seul cas public d'usage trouvé : ENS (Roles v2, via karpatkey). Aucun comptage global trouvé.
7. Le blocage avant exécution (Hypernative Guardian via Safe Shield) se vend sur devis. Aucun prix public trouvé.
8. Trésoreries sur Avalanche : aucun montant par protocole obtenu (DefiLlama bloqué, 403 et 402). Trou majeur pour la cible Avalanche.

## 1. Pratiques

| Pratique | Détail | Étiquette | URL |
|---|---|---|---|
| Multisig Safe, seuil et nombre | SEAL : minimum 3 signataires, seuil 50 %, 7 signataires ou plus au-dessus de 1 M USD, tous en matériel | [P] | https://frameworks.securityalliance.org/wallet-security/secure-multisig-best-practices |
| Séparation des rôles | Un multisig par fonction (upgrade, paramètres, urgence, trésorerie) pour limiter le rayon d'impact | [P] | https://frameworks.securityalliance.org/multisig-for-protocols/overview |
| Vérification de transaction | Calldata décodée, simulation, transaction test, appel vidéo avec preuve de vie et lecture à voix haute pour les gros montants. Hash recoupé sur deux interfaces indépendantes (formulation issue d'un commentaire, à confirmer) | [P] | https://frameworks.securityalliance.org/certs/sfc-treasury-ops |
| Limites de dépense | SEAL : plafond par personne, plafond pour les chemins automatisés, dépassement = quorum élevé, listes blanches avec délai de refroidissement | [P] | https://frameworks.securityalliance.org/certs/sfc-treasury-ops |
| Timelock | Schéma courant : la Safe exécute via un timelock de 24 à 72 h. Compound débat de passer de 2 à 10 jours | [S] | https://arem.is-a.dev/blog/dao-treasury-multisig-timelock-snapshot ; https://www.onesafe.io/blog/crypto-treasury-management-compound-vote |
| Safe Allowance module | Un délégué dépense jusqu'à un montant par période, sans changer le seuil. Installé par transaction depuis l'interface Safe | [P] | https://help.safe.global/en/articles/40842-set-up-and-use-spending-limits |
| Zodiac Roles v2 | Permissions scopées sur appels et calldata, avec allowances. Adopté par ENS (EP 5.12, exécuté) | [P] | https://docs.ens.domains/dao/proposals/5.12 |
| Zodiac Roles chez d'autres | Haus (HAI) ajoute Roles à sa Safe de trésorerie en janv 2025. Spectra l'utilise pour ses MetaVaults | [P] | https://www.tally.xyz/gov/hai/proposal/71232920685128172221431433589301790868107413093536771388303049247330839170330 ; https://dev.spectra.finance/docs/metavaults/access-control-and-roles |
| ENS : plafond annuel proposé | Temp check du 2 juil 2026 : plafond annuel sur l'Endowment (environ 5 %), Delay Modifier, rôle d'annulation du Security Council. Pas de résultat final, débat en cours | [P] (forum) | https://discuss.ens.domains/t/temp-check-rate-limiting-the-endowment-to-safely-secure-it/22234 |
| Safe Shield et Guardian (Hypernative) | Guard sur la Safe : chaque transaction est vérifiée contre des politiques, approuvée, signalée ou bloquée. Retrait du Guard : transaction signée plus timelock de 24 h. Activation sur demande | [P] (aide Safe) | https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative |
| Aave | Deux multisigs Guardian 5 sur 9 (pause, veto). Trésorerie opérée par stewards délégués. Seuil de la Safe fondation non trouvé | [S] | https://proofoftalk.io/blog/who-controls-a-protocol-diligence/ |
| Uniswap | Gouvernance on-chain (seuil de proposition 1 M UNI, quorum 40 M UNI). Multisig Foundation : non trouvé | [S] | https://eco.com/support/en/articles/14799687-dao-treasury-management |

## 2. Incidents 2024-2026

| Date | Cible | Perte | Ce qui a manqué | Étiquette | URL |
|---|---|---|---|---|---|
| 18 juil 2024 | WazirX (Safe 4 sur 6, 5 signataires WazirX plus 1 Liminal) | environ 230 à 235 M USD | Les signataires croyaient valider des transferts, c'était un upgrade de contrat. Signature aveugle via l'interface de custody. Les parties se renvoient la faute | [S] | https://website.cobo.com/post/wazirx-hack-incident-analysis ; https://quillaudits.com/blog/hack-analysis/wazirx-235m-hack |
| Sept-oct 2024 | Radiant Capital (3 signataires sur 11 compromis) | environ 50 M USD | Malware macOS via faux contractuel Telegram. UI Safe et simulation Tenderly montraient une transaction saine pendant que la charge réelle était signée. Aucune vérification hors machine | [S] (récit cité du post-mortem Radiant, original non lu) | https://onekey.so/blog/ecosystem/one-pdf-50m-gone-the-radiant-capital-hack-explained ; https://multisiginspector.quillaudits.com/hacks |
| 21 fév 2025 | Bybit (cold wallet via Safe) | environ 1,4 à 1,5 Md USD | Code malveillant injecté dans le bucket S3 de Safe le 19 fév, déclenché sur l'adresse Bybit. Le signataire n'a pas lu l'écran du Ledger. Ni liste blanche ni délai n'ont bloqué le changement de propriétaire. Origine exacte (poste développeur ou identifiants AWS) non tranchée | [S] (Sygnia et Safe, cités par la presse) | https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/ ; https://www.certik.com/resources/blog/bybit-incident-technical-analysis |
| Janv 2026 | Unleash Protocol | environ 3,9 M USD | Cause non confirmée (clés, social engineering ou malware) | [S] | https://www.neuracybintel.com/articles/hackers-drain-39-million-dollars-from-unleash-protocol-after-multisig-wallet-hijack |
| 1er avr 2026 | Drift (Solana, Squads 2 sur 5) | environ 270 à 295 M USD (285 M selon BlockSec) | Seuil bas 2 sur 5, aucun timelock, durable nonces rendant les signatures valides sans expiration, campagne de plusieurs mois (rencontres, malware). Pas de garde-fou sur changements d'admin, d'oracle et de plafonds de retrait. Post-mortem complet de Drift non trouvé | [S] | https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation ; https://www.coindesk.com/tech/2026/04/02/how-a-solana-feature-designed-for-convenience-let-an-attacker-drain-usd270-million-from-drift ; https://www.trmlabs.com/resources/blog/north-korean-hackers-attack-drift-protocol-in-285-million-heist |
| Juin 2026 | Humanity Protocol | environ 36,4 M USD | Clés concentrées sur un seul appareil (selon un agrégateur, non vérifié en primaire) | [S] | https://shattered.io/safe-wallet-multisig-setup-bybit-hack-2026/ |
| 2026 | Step Finance, KelpDAO | non confirmé ici | Step : malware via faux appel investisseur. Kelp : le multisig d'urgence a gelé 46 min après le drain, cause non établie | [S] | https://www.cryptotimes.io/insights/top-10-crypto-hacks-of-h1-2026-how-hackers-drained-972-million-in-six-months/ |

Cas de "signataires piégés" trouvés : WazirX, Radiant, Bybit, Drift, probablement Step Finance. Dans aucun cas un plafond de dépense indépendant (Allowance, Roles) n'est cité comme présent.

## 3. Tailles de trésoreries

| Entité | Montant | Date | Étiquette | URL |
|---|---|---|---|---|
| ENS Endowment | environ 86 M USD (contre environ 130 M six mois avant, sous 88 M selon l'auteur) | juil 2026 | [S] (chiffres du forum, contestés) | https://discuss.ens.domains/t/temp-check-rate-limiting-the-endowment-to-safely-secure-it/22234 |
| Uniswap | 4,8 Md USD (tracker tiers cité par un vendeur) | T1 2026 | [V] | https://eco.com/support/en/articles/14799687-dao-treasury-management |
| DAO, total on-chain | plus de 26 Md USD | T1 2026 | [V] | https://eco.com/support/en/articles/14799687-dao-treasury-management |
| Avalanche, TVL réseau (pas des trésoreries) | environ 467 M USD, contre 11 Md au pic de nov 2021 | juin 2026 | [S] (cite DefiLlama) | https://coinbureau.com/analysis/best-avax-dapps |
| Avalanche Treasury Co. (AVAT), société cotée | 15,3 M AVAX, 100 M USD au 30 juin 2026. Actifs numériques 105,4 M USD | 30 juin 2026 | [S] (résultats T2) | https://www.joplinglobe.com/region/national_business/avalanche-treasury-company-reports-second-quarter-2026-financial-results/article_7e7aae80-d05f-5e0b-8a3e-8ed784066650.html |
| Trésoreries de protocoles Avalanche (Benqi, LFJ/Trader Joe, GMX, Pharaoh, Euler, etc.) | NON TROUVÉ. defillama.com/treasuries et api.llama.fi/treasuries ont répondu 403 et 402 | | | https://defillama.com/treasuries |

À faire : extraire à la main le filtre Avalanche de DefiLlama Treasuries (navigateur) ou via l'API payante, avec date.

## 4. Ce que les équipes achètent

| Outil | Prix public | Étiquette | URL |
|---|---|---|---|
| Hypernative Guardian et Safe Shield | Non trouvé. Démo et devis, offre "entreprise" | [V] | https://hypernative.io/safe-x-hypernative ; https://safe.global/safeshield |
| Safe Allowance, Zodiac Roles/Delay | Modules ouverts, coût = gas et audit (aucun prix trouvé) | [P] | https://help.safe.global/en/articles/40842-set-up-and-use-spending-limits |
| Gestionnaires type karpatkey (Zodiac) | Rémunération ENS non relevée. Gnosis Guild déclare une participation minoritaire dans karpatkey | [P] (forum) | https://discuss.ens.domains/t/service-provider-stream-nomination-thread/18142/33 |
| Plateformes de custody (Liminal, etc.) | Non trouvé | | |

## 5. Trous (ce qui manque aux trésoreries)

1. Plafond de dépense indépendant du seuil de signature : rarement déployé. ENS est le seul cas public trouvé, et son plafond annuel reste en débat. Nombre de Safes avec Allowance ou Roles : non trouvé (à calculer par Dune sur les adresses de modules).
2. Seuil trop bas ou signataires non indépendants (Drift 2 sur 5, Humanity une seule machine). SEAL le dit, aucun contrôle ne l'applique.
3. Pas de délai bloquant les changements de propriété ou d'admin (Bybit, Drift).
4. Vérification faite sur la machine ou l'interface compromise (Radiant, Bybit, WazirX). Il manque une vérification indépendante de ce qui est réellement signé.
5. Outils de blocage avant exécution (Guardian) réservés aux entreprises, sur devis, activation manuelle.
6. Approbations qui ne périment pas (durable nonces Solana).
7. Tailles Avalanche absentes : impossible de chiffrer le marché cible sans extraction DefiLlama.
8. Post-mortems primaires non lus : Radiant, Drift, Safe final. Les récits ci-dessus sont secondaires.
