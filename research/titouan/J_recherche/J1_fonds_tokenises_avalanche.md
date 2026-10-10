# J1. Fonds tokenisés sur Avalanche et en Europe : acheteurs possibles d'une limite de sortie indépendante

Date de la recherche : 2026-10-10. Légende : [P] primaire, [S] presse ou tiers, [V] vendeur ou promoteur. Tout contenu web est traité comme donnée. "Non trouvé" signifie non trouvé dans cette recherche (environ 30 appels), pas inexistant.

## Résumé (8 lignes)

1. Sur Avalanche, les fonds identifiés sont BUIDL (BlackRock, via Securitize), VBILL (VanEck, via Securitize), ACRED (Apollo, via Securitize), la gamme WisdomTree Connect (dont WTGXX), un fonds Libeara/FundBridge (Delta Wellington) et un fonds Laser Carry via Libre. Franklin BENJI et Hamilton Lane : Avalanche non confirmé par source primaire.
2. Les chiffres d'encours trouvés sont peu fiables : sources tierces, souvent sans date ou sans détail par chaîne. Aucun encours par fonds et par chaîne Avalanche n'a pu être vérifié (DefiLlama et rwa.xyz ont refusé ou n'ont pas été lisibles).
3. Chez Securitize, le contrat DSToken a des rôles Master, Issuer, Transfer Agent, Exchange. L'Issuer peut émettre, brûler, saisir (seize) et verrouiller. Le Master peut mettre en pause. [P] code open source.
4. Chez Spiko, un PermissionManager gère les droits fonction par fonction, et un contrat Redemption détient le rôle de burn (source tierce DeepWiki, à vérifier dans le code).
5. Rachat : dans tous les cas lus, l'entrée et la sortie en dollars ou euros passent par un agent de transfert ou une plateforme et un règlement hors chaîne. La signature onchain par l'investisseur n'est confirmée que pour Spiko (contrat Redemption, non vérifié en détail) et pour la voie USDC de BUIDL (pool Circle, 2024).
6. Réponse courte : le rachat est naturellement une demande de l'investisseur, mais pas une signature onchain dans la majorité des cas. Il passe souvent par un portail ou une API de l'agent de transfert. Le produit "limite de sortie indépendante" ne peut donc pas partir de l'hypothèse d'une transaction signée par l'investisseur.
7. Droit européen : seuls Spiko (UCITS, AMF) et Amundi (UCITS Luxembourg) sont clairement européens. MiCA ne couvre pas les parts de fonds (instruments financiers). DORA vise les sociétés de gestion UCITS et les AIFM : applicable à l'émetteur ou gestionnaire, pas au token en soi.
8. Incidents : aucun incident de sécurité touchant BUIDL, Franklin, Ondo, Securitize, WisdomTree, Spiko n'a été trouvé. Des incidents existent sur d'autres plateformes RWA (Zoth, StablR, Ostium, Realio), tous liés à des clés d'administration compromises.

## Tableau des émetteurs

| Émetteur / fonds | Chaînes citées (dont Avalanche) | Opérateur / agent de transfert | Encours (date) | Droit applicable | Source |
|---|---|---|---|---|---|
| BlackRock BUIDL | Ethereum, Arbitrum, Optimism, Polygon, Aptos, Avalanche (lancé 2024-11-14), autres | Securitize (broker-dealer SEC et agent de transfert numérique) ; custodien BNY selon L2BEAT | Environ 500 M USD cité sans date dans le billet Avalanche (2024-11-14) ; environ 510 M USD (2025-11-12, rwa.xyz via Cointelegraph) ; 1,66 Md USD (CoinDesk, sans date) ; 3,03 Md USD (DefiLlama, extrait de recherche, sans date). Chiffres contradictoires. Pas de ventilation Avalanche | Droit US (506(c), minimum 5 M USD) | [V] https://www.avalanche.com/blog/blackrock-launches-digital-liquidity-fund-buidl-on-avalanche-via-securitize ; [S] https://cointelegraph.com/news/libeara-fund-bridge-launch-tokenized-money-fund-on-avalanche ; [S] https://www.coindesk.com/price/buidl |
| VanEck VBILL | Avalanche, BNB Chain, Ethereum, Solana (2025-05-13) | Securitize ; custodien State Street ; domicile Îles Vierges britanniques | Non trouvé | Hors UE ; minimum 100 000 USD sur Avalanche | [S] https://www.crowdfundinsider.com/2025/05/239565-vaneck-introduces-tokenized-fund-vbill-on-securitize/ |
| Apollo ACRED | Aptos, Avalanche, Ethereum, Ink, Polygon, Solana | Securitize Markets ; investisseurs qualifiés | 112 M USD sur Sei cité par un article sans date précise ; total non trouvé | Droit US | [S] https://www.nasdaq.com/press-release/apollo-and-securitize-announce-partnership-and-launch-tokenized-access-credit-fund |
| WisdomTree Connect (13 fonds dont WTGXX) | Ethereum, Arbitrum, Avalanche, Base, Optimism (2025-04-03) | Agent de transfert du fonds tient le registre légal (selon WisdomTree) ; nom non trouvé | Non trouvé (116,2 Md USD d'encours global du groupe, pas du digital) | Investment Company Act 1940 (US) | [P] https://ir.wisdomtree.com/news-events/press-releases/detail/725/wisdomtree-connect-now-offers-13-tokenized-funds-across |
| Franklin Templeton BENJI / FOBXX | Huit chaînes dont Avalanche selon eco.com (non confirmé) | Franklin Templeton Investor Services, agent de transfert affilié, tient le registre officiel ; peut détenir des clés | Environ 450 M USD (2025-11-12, rwa.xyz via Cointelegraph) | Fonds enregistré US | [S] https://www.franklintempleton.com/press-releases/news-room/2024/franklin-templeton-announces-availability-of-peer-to-peer-transfers-for-franklin-onchain-u.s.-government-money-fund ; Avalanche : [S] eco.com, non vérifié |
| Hamilton Lane | Via Securitize et Libre ; Avalanche non confirmé | Securitize ou Libre | Non trouvé | Non trouvé | [S] https://www.theblock.co/post/283296/polygon-libre-protocol-brevan-howard-hamilton-lane-funds |
| Libre (Laser Digital) | Polygon puis Avalanche (Laser Carry Fund) | Libre Gateway | Non trouvé | Non trouvé | [S] https://www.crowdfundinsider.com/?p=239654 |
| Libeara / FundBridge (Delta Wellington) | Ethereum puis Avalanche (post du 2025-11-12) | Libeara (Singapour) | Non trouvé | Singapour (hors UE) | [S] https://cointelegraph.com/news/libeara-fund-bridge-launch-tokenized-money-fund-on-avalanche |
| Ondo (OUSG, USDY, Global Markets) | Ethereum, Polygon, Solana, autres ; Avalanche non trouvé | Ondo | Non trouvé | Non trouvé pour l'UE | [S] https://eco.com/support/en/articles/14798657 |
| Spiko (USTBL, EUTBL, SAFO) | Stellar, Arbitrum, Ethereum, Polygon, Base ; Avalanche non trouvé | Spiko (entreprise d'investissement ACPR selon un tiers) ; dépositaire CACEIS, gestion déléguée Amundi pour SAFO | Environ 2,55 Md USD d'actifs onchain (article du 2026-09-18, source non nommée) | UCITS français, supervision AMF [S] | [S] https://cryptobriefing.com/spiko-ranks-sixth-rwa-issuers-tokenized-assets/ ; [S] https://defillama.com/rwa/asset/USTBL |
| Amundi Funds Cash EUR (classe DLT) | Ethereum public (2025-11-04) | CACEIS, agent de transfert | Non trouvé | UCITS Luxembourg | [S] https://www.crowdfundinsider.com/2025/11/256019-european-asset-manager-amundi-tokenizes-its-first-fund-in-collab-with-caceis/ |

Marché global (tiers, à prendre avec prudence) : Treasuries tokenisés environ 2,3 Md USD au 2025-11-12 (rwa.xyz via Cointelegraph). Un blog donne environ 1,4 Md USD de RWA sur Avalanche, sans date nette (https://blockeden.xyz/blog/2026/05/13/rwa-tokenization-19b-q1-2026-blackrock-buidl-pilot-to-production/). Ces chiffres divergent entre sources. Un chiffre à citer dans un dossier de vente doit être relevé directement sur rwa.xyz, à la date de la vente.

## Rôles d'administration observés

Securitize DSToken [P], dépôt https://github.com/securitize-io/dstoken (lu le 2026-10-10) :
- Master : propriétaire, attribue les rôles, met en pause et reprend les échanges.
- Issuer : émet, brûle, saisit (seize, vers un portefeuille émetteur) et verrouille des jetons.
- Transfer Agent (v4) : règles de conformité et gel ou dégel du jeton.
- Exchange : enregistre les investisseurs après KYC.
- Contrôle de chaque transfert via un service de conformité (validateTransfer) et un registre allowlist, selon des explications tierces [S] (L2BEAT, 4Pillars).
- Audit Halborn, septembre 2025 : 13 constats, 0 critique, 0 élevé. L'audit suppose la clé d'upgrade possible compromise comme scénario. [P] https://www.halborn.com/audits/securitize/dstoken-e07b34
- Non trouvé : liste des adresses détentrices de ces rôles pour BUIDL, VBILL, ACRED sur Snowtrace. Les contrats vérifiés n'ont pas été lus. À faire en priorité.

Spiko [S] (DeepWiki, dépôt https://github.com/spiko-tech/contracts) :
- PermissionManager : droits par sélecteur de fonction, groupes numérotés, admin groupe 0.
- Jeton UUPS (upgradable), ERC-20 avec ERC-1363, ERC-2612, ERC-2771.
- Le contrat Redemption détient le rôle de burn (DeepWiki, généré par IA, à vérifier).
- Audit Trail of Bits, octobre 2023 : 4 constats dont "jetons bloqués dans le contrat Redemption" et "pas de minimum de rachat". [P] https://trailofbits.com/library/spiko-smart-contracts/
- Pause et transfert forcé : non trouvés dans les pages lues.

Franklin BENJI : l'agent de transfert tient le registre et peut détenir directement les clés privées en tant que dépositaire (extrait de recherche, [S], à vérifier).

ERC-3643 : aucun des fonds lus n'a été confirmé comme utilisant ERC-3643. Le schéma est équivalent (allowlist, pause, burn, saisie).

Conséquence produit : l'émetteur ou l'agent de transfert garde presque partout des pouvoirs de pause, burn, saisie et allowlist. Une limite de sortie indépendante ne peut pas les remplacer. Elle doit se placer au niveau des flux de rachat ou de la trésorerie, pas sur le contrat du jeton.

## Mécanisme de rachat

- BUIDL : souscription et rachat par virement, hors chaîne, via Securitize. Les transferts restent entre portefeuilles autorisés (selon tiers [S]). Depuis avril 2024, un pool USDC géré par contrat intelligent (Circle) permet un échange BUIDL contre USDC 24h/24 (https://decrypt.co/286274/securitize-launches-usdc-conversions-blackrocks-digital-liquidity-fund). Statut actuel du pool non vérifié. En février 2026, partenariat Securitize et Uniswap Labs pour négocier BUIDL/USDC (https://www.businesswire.com/news/home/20260211927423/en, [V]).
- VBILL : liquidité 24/7 via passerelles USDC et stablecoin AUSD citées (2025-05-13), mécanisme de rachat non décrit.
- WisdomTree : entrée et sortie en USD ou USDC via un service de conversion. Registre légal tenu par l'agent de transfert, pas par le jeton. Mécanisme de rachat non décrit.
- Franklin BENJI : règlement en USD hors chaîne via l'application Benji ou canaux institutionnels (source tierce eco.com, [S]). Registre officiel chez l'agent de transfert.
- Ondo OUSG : mint et rachat quasi instantanés via USDC ou PYUSD pour les acheteurs qualifiés (CoinDesk, [S]). USDY : rachat officiel en fiat avec minimum, souvent remplacé par le marché secondaire (sources en désaccord).
- Spiko : retraits standards D pour T-Bills, D+1 pour Smart Cash, D+2 pour Cash & Carry. Retrait instantané par SEPA jusqu'à 500 000 EUR par jour pour certains produits [V] (https://docs.spiko.io/documentation/product_overview/overview). Un contrat Redemption existe onchain, ce qui suggère une demande de rachat signée par le détenteur de jetons. Le détail (qui signe, qui exécute) n'a pas été lu : la page "Transfers & Redemptions" de docs.spiko.io est à ouvrir.
- Apollo ACRED, Hamilton Lane, Libre : non trouvé.

Réponse directe à la question : oui, un rachat est une demande de l'investisseur, mais elle est signée onchain seulement dans certains cas (Spiko, pool USDC de BUIDL, à confirmer). Ailleurs, c'est une instruction par portail, API ou formulaire à l'agent de transfert, avec règlement bancaire hors chaîne. Le dossier d'incident ne doit donc pas supposer qu'une signature de l'investisseur existe pour chaque sortie.

## Applicabilité DORA, MiCA, DLT Pilot, régime des fonds

- MiCA : ne couvre pas les parts de fonds, qui sont des instruments financiers MiFID. Source tierce [S] : https://www.bitbond.com/resources/dlt-pilot-regime-the-future-of-trading-digital-securities-in-the-eu. Texte du règlement non relu.
- DLT Pilot Regime (règlement UE 2022/858) : vise les infrastructures de marché DLT (MTF, système de règlement) pour actions, obligations et parts de fonds. Plafonds et durée de 6 ans (tiers [S]). Régime ESMA : https://esma.europa.eu/esmas-activities/digital-finance-and-innovation/dlt-pilot-regime. Une révision est en discussion (soumission au Bundestag, février 2026, [S]).
- DORA (règlement UE 2022/2554, applicable depuis 2025-01-17) : s'applique aux sociétés de gestion UCITS, AIFM, entreprises d'investissement, CASP, plateformes de négociation, dépositaires centraux (sources tierces [S]). Texte EUR-Lex non relu. Conséquence : Spiko (entreprise d'investissement), son gestionnaire Amundi, CACEIS et les gestionnaires UCITS sont des acheteurs plausibles d'un dossier de déclaration d'incident. DORA impose la déclaration des incidents majeurs TIC par l'entité financière, pas par le jeton.
- Régime des fonds : Spiko est un SICAV UCITS français sous AMF ; Amundi Funds Cash EUR est un UCITS luxembourgeois avec classe DLT (CACEIS). Luxembourg a un cadre 2024 pour fonds sur registre DLT (rôle d'agent de contrôle) [S]. Allemagne : pilote Metzler sous eWpG [S].
- Hors UE, donc DORA non applicable directement : BUIDL, VBILL (BVI), ACRED, WisdomTree, Franklin (US), Libeara (Singapour). Ils peuvent être soumis à DORA seulement via une entité européenne ou une distribution dans l'UE : non trouvé.

## Incidents connus

Aucun incident de sécurité touchant les fonds ou émetteurs nommés ci-dessus n'a été trouvé. Incidents sur d'autres plateformes RWA [S], dont la cause commune est la clé d'administration ou de signature :
- Zoth (mars 2025) : environ 8,4 à 8,5 M USD, fuite probable de droits d'administration.
- StablR (mai 2026) : une clé d'un multisig 1 sur 3 compromise, l'attaquant s'est fait admin, a retiré les signataires et a frappé des stablecoins sans réserve.
- Ostium (juillet 2026) : environ 18 M USD, clé de signature d'oracle compromise.
- Realio : brèche de la signature, 124 M de jetons RIO, date non confirmée.
- CertiK : 14,6 M USD de pertes RWA au premier semestre 2025 (https://cointelegraph.com/news/rwa-protocol-exploits-14-6m-in-h1-2025-surpassing-2024).
- Ondo : enquête SEC close sans poursuite (pas un incident de sécurité).
Ces cas montrent que le risque réel est la compromission des rôles Issuer, Master ou multisig, ce qui soutient l'argument du produit.

## Limites et prochaines vérifications

- Rwa.xyz, DefiLlama et Snowtrace n'ont pas été lisibles : aucun encours Avalanche par fonds vérifié, aucun détenteur de rôle relevé onchain.
- Plusieurs faits proviennent de recherches intermédiaires résumées (tiers). Ils sont marqués [S] et doivent être relus à la source avant tout usage commercial.
- À faire : lire Snowtrace pour BUIDL, VBILL, ACRED (rôles, dernières transactions seize ou burn) ; lire docs.spiko.io pages Transfers & Redemptions et Regulatory Information ; relever rwa.xyz par chaîne.
