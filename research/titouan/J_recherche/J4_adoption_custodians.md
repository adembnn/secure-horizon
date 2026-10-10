# J4 : adoption d'un garde-fou de sortie tiers chez les custodians MPC (10 oct. 2026)

Étiquettes : [P] doc officielle ouverte et lue aujourd'hui. [S] secondaire (moteur de recherche, site non officiel, marketing). [V] vérifié par test direct (aucun test fait ici). "Non trouvé" quand rien n'est établi.
Méthode : environ 37 appels web. Le contenu web est traité comme donnée. Aucune clé utilisée. Les analyses de ma part sont marquées [analyse].

## Résumé en 8 lignes

1. Fireblocks et Cobo offrent un vrai point de veto avant signature : callback du Co-Signer (Fireblocks), callback WaaS 2.0 ok/deny (Cobo). BitGo offre une règle de politique de type webhook (non-200 = blocage). [P]
2. Pour Copper, Ledger Enterprise, Coinbase Prime et Anchorage : aucun point de veto tiers documenté trouvé. [P/S]
3. Chemin le plus court pour un exchange sur Fireblocks : appairer un utilisateur API au Co-Signer, héberger un handler HTTPS, créer une règle de politique qui désigne cet utilisateur API comme signataire ou approbateur. Aucun changement de fonds. [P]
4. Le tiers n'a pas besoin d'être "fournisseur de politique" : il héberge le handler (ou le client l'héberge et appelle le tiers). Aucun programme de "fournisseur de politique" trouvé chez aucun custodian. [P]
5. Fireblocks : timeout 30 s, échec fermé (fail-closed) si pas de réponse ; `RETRY` = 20 tentatives toutes les 3 min (60 min), réglable par le support. Cela résout la contradiction du fichier T1_P4. [P]
6. Sans handler configuré, le Co-Signer signe tout : le handler devient la seule barrière. Cobo : sans endpoint, retraits approuvés par défaut. [P]
7. Les AML (Chainalysis, Elliptic, TRM) s'intègrent chez Fireblocks par un add-on natif, pas par le callback. Un seul fournisseur AML par espace de travail. [P]
8. Obstacle principal : DORA. Le tiers sur le chemin de signature sera probablement classé fonction critique ou importante par l'exchange, donc contrat art. 30(2)+30(3), droit d'audit, TLPT, stratégie de sortie. Pas "prestataire critique" au sens art. 31 sauf désignation par les AES. [P pour le texte, analyse pour la qualification]

## Tableau par custodian

| Custodian | Point d'insertion tiers | Activation et prérequis | Limites (timeout, retry, mode de panne) | Prix | Qui l'utilise publiquement | Partenaires / marketplace |
|---|---|---|---|---|---|---|
| Fireblocks | Callback Handler de l'API Co-Signer, par utilisateur API appairé. Réponses APPROVE, REJECT, RETRY, IGNORE [P] https://developers.fireblocks.com/reference/response-object | Utilisateur API appairé au Co-Signer, serveur HTTPS avec certificat d'une CA de confiance, authentification clé publique, certificat ou hybride, règle de politique qui désigne l'utilisateur API comme signataire ou approbateur. Boilerplate "Plugin-based Callback Handler" cité par la doc [P] https://developers.fireblocks.com/docs/create-api-co-signer-callback-handler. Co-signer et handler sur serveurs séparés [P] https://developers.fireblocks.com/reference/api-cosigner-setup-callback-handler. Exigence de licence : non précisée sur ces pages. | 30 s puis échec. RETRY : 20 fois, toutes les 3 min, 60 min au total ; support peut régler de 30 s à 1 h et jusqu'à 48 h. REJECT sur signature = échec définitif [P] https://developers.fireblocks.com/reference/response-object. Sans handler : le Co-Signer signe tout [P] https://developers.fireblocks.com/docs/cosigner-architecture-overview. Testnet : Co-Signer communal de test, interdit pour tests de performance [S] (moteur) https://developers.fireblocks.com/reference/api-cosigner-setup-callback-handler | Co-Signer et moteur de politique inclus dans Essentials (999 USD par mois, 6 mois max) et plans Custom (à partir de 36 000 USD par an) selon le tableau comparatif [P] https://www.fireblocks.com/price-edition/starter. Add-on AML : "premium", activé par le support [P] https://developers.fireblocks.com/docs/integrating-third-party-aml-providers | Hypernative annonce une intégration par API avec Fireblocks, Utila, Copper (marketing, mécanisme exact non détaillé) [S] https://www.hypernative.io/product/transaction-guard. Cas clients nommés du callback : non trouvé. | Page partenaires : pistes "Technology Partners" et intégrateurs, bouton "Become a partner", aucun critère, aucune marketplace décrite [P] https://www.fireblocks.com/partners/. Logos Chainalysis, Elliptic (catégorie non indiquée). AML natifs : Chainalysis, Elliptic, TRM Labs (accès anticipé) [P] https://developers.fireblocks.com/docs/integrating-third-party-aml-providers |
| BitGo | Règle de politique de type webhook, sur un portefeuille. `deny` : non-200 = transaction bloquée. `getApproval` : non-200 = en attente d'approbation [P] https://developers.bitgo.com/cookbooks/policies-webhook | Créer la règle via `POST /api/v2/$COIN/wallet/$WALLET_ID/policy/rule` avec `type: webhook` et l'URL. Prérequis : identifiant d'actif, de portefeuille, jeton d'accès. Plan ou édition requis : non précisé [P] https://developers.bitgo.com/docs/policies-overview | Timeout de la requête de politique : non trouvé. Les webhooks génériques : 7 nouvelles tentatives (1, 5, 10, 30, 60, 120, 240 min), suspension après 100 échecs par semaine ou 500 au total, signature HMAC `x-signature-sha256`. Cette page ne couvre pas les webhooks de politique, ne pas extrapoler [P] https://developers.bitgo.com/docs/webhooks-overview. Récupération par clé utilisateur + clé de secours contourne toutes les politiques [P] https://developers.bitgo.com/docs/policies-overview | Non publié ; "contacter BitGo" [S] (moteur) | Cas clients de la règle webhook : non trouvé. | Pistes : distribution, technologie, staking, financier ; bouton "Partner With Us", formulaire non chargé [P] https://bitgo.com/company/partnerships/. Intégration AML native BitGo : non trouvée. |
| Cobo (WaaS 2.0) | Callback : retraits et appels de contrat attendent la réponse `ok` ou `deny` [S] https://manuals.cobo.com/en/portal/developer-console/callbacks-intro, [P] https://cobo.com/developers/v2/guides/webhooks-callbacks/set-up-endpoint | Enregistrer un endpoint de callback pour la clé API. Réponse 200 ou 201, corps exactement `ok` ou `deny`. Requêtes signées. Prérequis de plan : non trouvé. | Retries jusqu'à 30 fois puis statut `Failed` ; timeout du callback non précisé ; sans endpoint, aucun contrôle et retraits approuvés par défaut [P] https://cobo.com/developers/v2/guides/webhooks-callbacks/set-up-endpoint, [S] https://manuals.cobo.com/en/portal/developer-console/callbacks-intro | Non trouvé | Plugin HollaEx qui n'approuve que les retraits émis par lui (exemple d'usage, pas un tiers de sécurité) [S] (moteur) https://docs.hollaex.com/plugins/use-plugins/cobo-wallet-custody-integration-waas-2.0 | Non trouvé |
| Copper | Aucun point de veto tiers trouvé. Existent : webhooks d'événements (réponse 200, signature `X-Signature`) et co-signature d'ordre par API (`PATCH /orders/{id}`), approbateurs décrits comme des utilisateurs [P] https://developer.copper.co/guides/funds-transfers/approve-transfer-order.md | Non applicable. Une page sur la politique ou un hook tiers : non trouvée dans l'index [P] https://developer.copper.co/llms.txt | Non trouvé | Non trouvé | Hypernative cite Copper en intégration par API (marketing) [S] https://www.hypernative.io/product/transaction-guard | Non trouvé |
| Ledger Enterprise | Aucun approbateur externe documenté trouvé. Existent : approbation par utilisateurs API (défi signé localement) et événements par webhook [S] (moteur) https://help.enterprise.ledger.com/api-documentation/tutorials/api-functionalities | Non applicable. À confirmer avec le support Ledger. | Non trouvé | Non trouvé | Non trouvé | Non trouvé |
| Coinbase Prime | Aucun hook de veto tiers trouvé. Approbation par consensus dans l'interface Prime ; carnet d'adresses ; règles par clé API configurées par l'équipe Coinbase (libre-service "à venir") [S] (moteur) https://docs.cdp.coinbase.com/custom-stablecoins/prime-withdrawals | Non applicable | Changement de politique de transfert : appel vidéo avec Prime Operations dans certains cas [S] (moteur) https://help.coinbase.com/en/prime/securing-your-account/reviews | Non trouvé | Non trouvé | Non trouvé |
| Anchorage | Aucun hook tiers trouvé. Retraits par quorum puis revue de risque par Anchorage ; webhooks d'événements ; destinations de confiance [S] (moteur) https://developers.anchorage.com/docs/quorum-approvals | Non applicable. Anchorage fait lui-même la revue finale, ce qui laisse peu de place à un veto tiers [analyse]. | Non trouvé | Non trouvé | Non trouvé | Non trouvé |

Note de comparaison : Fordefi (custom API approver) et Dfns (webhook sur `policy.approval.pending`) offrent un mécanisme équivalent selon le moteur de recherche, hors liste demandée [S] https://docs.fordefi.com/developers/transaction-types/build-custom-api-approver.md ; https://docs.dfns.co/solutions/automate-approvals.

## Réponse sur les AML (Chainalysis, Elliptic, TRM)

- Fireblocks : intégrations directes, un seul fournisseur par espace de travail, changement par le support, add-on "premium". Les politiques d'écran (dont Autofreeze) ne s'appliquent qu'aux intégrations directes. Ce n'est pas le callback [P] https://developers.fireblocks.com/docs/integrating-third-party-aml-providers.
- Conséquence [analyse] : un fournisseur de garde-fou ne peut pas "s'installer" comme AML Fireblocks. Il passe par le callback, ou par un partenariat technologique dont les termes ne sont pas publics.
- Les parties de transferts non filtrées par l'AML (coffre vers coffre, etc.) sont dans la même page [P].

## Chemin d'adoption le plus court pour un exchange

Fireblocks, sans migrer les fonds [analyse fondée sur P] :
1. Vérifier avec Fireblocks que le Co-Signer API et le plan en cours permettent un handler (la doc ne cite aucune exigence de licence, à confirmer par écrit).
2. Déployer un Co-Signer API et appairer un utilisateur API (ou utiliser celui existant).
3. Héberger le handler HTTPS (chez l'exchange ou chez le tiers), échanger les clés publiques (RSA 2048 pour le mode JWT selon la doc).
4. Écrire la règle de politique qui envoie les retraits à cet utilisateur API.
5. Tester sur un espace de travail testnet avec le Co-Signer communal.
6. Choisir le mode de panne : réponse sous 30 s, sinon échec (fermé). RETRY pour un traitement asynchrone (jusqu'à 60 min par défaut).
7. Contrat DORA art. 30 et inscription au registre art. 28(3).

Délai d'intégration technique : non trouvé dans les sources. Mon PoC de format (0,5 jour, côté serveur seulement, sans compte réel) est une estimation interne, pas une mesure chez Fireblocks (voir T1_P4_connecteurs_implementes.md).

Alternatives proches : BitGo (une règle webhook par portefeuille, mêmes étapes réduites) ; Cobo (un endpoint de callback par clé API). Pour Copper, Ledger, Prime, Anchorage, le chemin passe par une demande commerciale au custodian : rien de public.

## Texte DORA (règlement UE 2022/2554 ; texte lu sur un site non officiel, EUR-Lex n'a rien rendu) [S]

Source : https://www.digital-operational-resilience-act.com/Article_28.html, /Article_30.html, /Article_31.html. À rouvrir sur EUR-Lex 32022R2554 avant citation officielle.

- Art. 28(1)(a) : les entités financières "shall, at all times, remain fully responsible for compliance with" leurs obligations. Le tiers ne porte pas la responsabilité.
- Art. 28(3) : registre d'information, "distinguishing between those that cover ICT services supporting critical or important functions and those that do not."
- Art. 28(4)(a) : l'entité doit "assess whether the contractual arrangement covers the use of ICT services supporting a critical or important function". Décision de l'exchange, pas du tiers.
- Art. 28(4)(c)(d) : évaluer les risques et faire la due diligence sur le prestataire.
- Art. 28(8) : "exit strategies" pour les fonctions critiques ou importantes.
- Art. 30(2) : le contrat contient au moins description des services, lieux de traitement, protection des données, accès et restitution, niveaux de service, assistance en cas d'incident, coopération avec les autorités, droits de résiliation, participation aux programmes de sensibilisation.
- Art. 30(3), si fonction critique ou importante : niveaux de service chiffrés, préavis et obligations de rapport, plans de continuité testés, participation au TLPT, droits d'accès, d'inspection et d'audit sans restriction, stratégie de sortie avec période de transition.
- Art. 31(2) : critères de désignation du prestataire critique : impact systémique, caractère systémique des entités clientes (G-SII, O-SII), recours pour fonctions critiques, substituabilité.
- Art. 31(8) : exclusions, dont les entités financières qui fournissent des services TIC à d'autres entités financières, les prestataires intra-groupe, et ceux qui servent un seul État membre.

Qualification [analyse] :
- Un veto dans le chemin de signature de garde sera probablement classé fonction critique ou importante par l'exchange, donc art. 30(3) complet.
- "Prestataire critique" (art. 31) : seulement par désignation des autorités européennes de surveillance. Une jeune pousse sans grande base de clients est peu susceptible d'être désignée. Pas d'élément trouvé qui l'affirme ou l'infirme.
- Fireblocks se considère lui-même fournisseur TIC d'une fonction critique ou importante dans la plupart des cas, avec un addendum DORA prêt à signer (paquet COR) [S] https://www.fireblocks.com/blog/fireblocks-cor-compliance-package-stay-ahead-of-dora-regulations ; https://support.fireblocks.io/hc/en-us/articles/19581715268764-Cyber-and-Operational-Resilience-Compliance-Package. Cela indique que le tiers doit prévoir son propre addendum, car le contrat du custodian ne couvre pas notre rôle.

## Obstacles

1. Réglementaire : DORA art. 28 et 30. L'exchange doit évaluer, inscrire au registre, contractualiser (SLA chiffrés, audit, TLPT, sortie). Le délai de contrat est probablement plus long que l'intégration technique [analyse].
2. Contractuel : le contrat du custodian reste inchangé, mais le handler doit être couvert par la politique de garde de l'exchange (MiCA art. 75(3), cité dans T1_P4_deploiement_reglementaire.md).
3. Mode de panne : en fail-closed, la panne du tiers bloque les retraits de l'exchange, ce qui devient un incident de l'exchange. Proposer plafond ou temporisation plutôt que blocage total [analyse].
4. Pas de rôle "fournisseur de politique" : aucun programme public de ce type trouvé. L'exchange reste le propriétaire du handler ; le tiers est un sous-traitant ou un fournisseur de service hébergé.
5. Licence : aucune exigence trouvée dans la doc Fireblocks, BitGo, Cobo. À confirmer par écrit avant promesse.
6. Fireblocks : un seul fournisseur AML natif par espace de travail ; le callback n'est pas bloqué par cette limite mais ne remplace pas l'AML natif.
7. BitGo : timeout non documenté pour la règle webhook ; la récupération par clés utilisateur + secours contourne tout garde-fou.
8. Chez les autres custodians, rien de public : chemin = négociation commerciale.

## Non trouvé

- Cas clients nommés utilisant le callback Fireblocks ou la règle webhook BitGo.
- Délai d'intégration mesuré chez un custodian.
- Exigence de plan pour le callback (Fireblocks, BitGo, Cobo).
- Timeout de la règle webhook BitGo.
- Marketplace ou programme "fournisseur de politique" chez les sept custodians.
- Position officielle (ESMA, AMF, ACPR) sur la qualification d'un veto tiers.
- Texte DORA sur EUR-Lex (la page n'a rien rendu aujourd'hui).
