# Sources de chaque chiffre et de chaque fait du pitch

Colonnes : ce qui est dit, le fichier du dépôt où je l'ai lu, la source d'origine citée par ce fichier, la réserve à connaître.
Les fichiers de recherche préviennent que leurs pages ont été lues par un outil qui résume : relire la phrase exacte à l'URL avant de la projeter.

## Deux écarts à trancher par vous

1. **Le jeu aveugle.** `livrables/CHIFFRES.md` (ligne A6) et `PRODUCT.md` disent encore « non passé ». `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md` montre qu'il a été ouvert le 11 oct. 2026 à 07:10 UTC. Le pitch cite `RESULTAT.md`. La décision D-012 demande de publier le résultat tel quel dans `CHIFFRES.md` : la ligne A6 est à mettre à jour, je n'ai pas touché ce fichier.
2. **Le NIST.** La référence SP 800-207 n'est dans aucun fichier du dépôt. Je l'ai lue moi-même dans le PDF officiel le 11 oct. 2026. Si la règle « un chiffre absent du dépôt n'est pas cité » s'applique aussi aux faits, retirez la phrase à 0:15 et gardez Aerodrome seul.

## Faits et chiffres du monde

| Ce qui est dit | Fichier du dépôt | Source d'origine | Réserve |
|---|---|---|---|
| « Agir comme si l'attaquant était déjà là », NIST 800-207 | Aucun. Vérifié hors dépôt | NIST SP 800-207, *Zero Trust Architecture*, août 2020, section 2.2, hypothèse 1 : « Assets should always act as if an attacker is present on the enterprise network ». https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf (page 8 du document) | Le texte parle du réseau d'une entreprise. Nous reprenons la posture. La même publication, section 2, parle de décisions d'accès « least privilege per-request » face à « a network viewed as compromised ». Ne pas dire que le NIST parle des portefeuilles |
| Aerodrome, novembre 2025 : adresse détournée, 81 minutes avant le signalement | `research/demo_reelle/RECHERCHE_douleurs_secondaires.md`, section C.1 | Blockaid, billet sur l'attaque DNS d'Aerodrome (21 nov. 2025 : changement DNS à 20h11 UTC, domaine signalé à 21h32) | Mesure de Blockaid sur lui-même, d'où « selon Blockaid ». Environ 700 000 $ de pertes. Aucune mesure indépendante |
| Ledger Connect Kit, décembre 2023 : plus de 100 sites (réserve, non dit dans le texte) | idem | Blockaid, rapport d'attaque ; lettre de Ledger du 14 déc. 2023 | « Plus de 100 interfaces » vient de Blockaid |
| CoW Swap, avril 2026 (réserve) | idem | Forum CoW DAO, CIP-86 ; Revoke.cash | Environ 1,2 M USDC en 4,5 heures. Le faux site demandait aussi la phrase secrète : non couvert |
| LI.FI, 16 juillet 2024 : 11,6 M$, 153 portefeuilles, seulement les droits illimités, zéro perte pour les droits finis | `livrables/CHIFFRES.md` ligne B7 ; `research/demo_reelle/RECHERCHE_these_moindre_privilege.md` section 4 | Rapport d'incident de LI.FI : https://li.fi/knowledge-hub/incident-report-16th-july/ | Rapport de l'éditeur. Les victimes avaient choisi l'illimité alors que le défaut de LI.FI était fini : à dire si on le demande |
| 47,6 % des droits illimités sur Ethereum, 34,2 % sur Avalanche | `livrables/CHIFFRES.md` ligne B1 ; `research/titouan/Z_approbations/onchain/Z4_illimite_par_plateforme.md` | Mesure interne en lecture seule : 10 420 sur 21 866 droits non nuls (800 blocs Ethereum), 7 103 sur 20 753 (40 fenêtres de 500 blocs, C-Chain), graine 20261011 | Des événements, pas des personnes. Échantillon non représentatif. Dire « des droits que nous avons mesurés ». 47,6 % n'est pas la majorité |
| 2025 : 106 106 adresses, 83,85 M$ perdus en signant sur un site piégé | `livrables/CHIFFRES.md` ligne B3 ; `research/demo_reelle/RECHERCHE_chiffres_douleur.md` A1 et A2 ; `research/titouan/Z_approbations/Z5_donnees_recentes.md` (c) | Scam Sniffer, rapport 2025, publié le 3 janv. 2026 | Éditeur qui vend de l'anti-phishing. Chaînes EVM, borne basse. Aucun chiffre propre à Avalanche. Dans le texte, l'année est citée seule |
| 2024 : 332 000 adresses, 494 M$ (questions seulement) | `RECHERCHE_chiffres_douleur.md` A1 et A2 | Scam Sniffer, rapport 2024, publié le 3 janv. 2025 | Sert à répondre « la douleur a fondu ». Jamais comme tendance |
| IA en laboratoire : 207 contrats exploités sur 405 | `RECHERCHE_these_moindre_privilege.md` section 1 | Anthropic, Frontier Red Team, « SCONE-bench », 1er déc. 2025 : https://www.anthropic.com/research/smart-contracts | Simulation sur copie de chaîne, contrats déjà piratés. Anthropic vend les modèles testés. Aucun vol réel attribué à l'IA avec preuve |
| 1,22 $ par exécution, 109 $ de gain net moyen (questions seulement) | idem | Même article, essai sur 2 849 contrats récents de BNB Chain | Autre essai que les 207 sur 405 : ne pas coller les deux chiffres |
| Vitalik Buterin, février 2026 : l'utilisateur dit d'abord ce qu'il veut, on simule, on n'agit que si ça concorde | `research/demo_reelle/RECHERCHE_concurrents_particuliers.md`, section (b), rang 1 | Cointelegraph, 23 fév. 2026, sur une publication du 22 fév. 2026 | Relais de presse. La publication d'origine sur X n'a pas été lue |
| « Un portefeuille affiche "illimité" sans alerte » (questions) | `research/demo_reelle/RECHERCHE_metamask_couverture.md`, ajout du 11 oct. 2026 | Code public de `MetaMask/metamask-extension`, branche `main`, lu le 11 oct. 2026 | Lecture de code, pas un essai à l'écran. Vaut pour une adresse que le portefeuille ne connaît pas comme malveillante |
| Talisman plafonne au solde ; Matcha et LI.FI au montant fini par défaut (questions) | `RECHERCHE_these_moindre_privilege.md` section 3 | Documentation Talisman ; Revoke.cash sur SwapNet ; rapport LI.FI | Post-mortem Matcha non lu |
| Fraude à l'investissement, 7,2 Md$ de plaintes en 2025 (questions, « ce qu'on ne couvre pas ») | `livrables/CHIFFRES.md` ligne B8 | FBI IC3, rapport 2025, p. 52 à 55 | Jamais comme taille de marché |
| Harpie et Wallet Guard fermés en mars 2025 (questions) | `RECHERCHE_concurrents_particuliers.md`, tableau (a) | The Block, 27 mars 2025 ; page d'accueil de Wallet Guard | Harpie : presse seulement |

## Nos mesures

| Ce qui est dit | Fichier du dépôt | Détail | Réserve |
|---|---|---|---|
| 250 cas d'un autre auteur, ouverts une seule fois, aucun réglage après | `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md` ; `coord/DECISIONS.md` D-012 | 150 malveillants, 100 bénins, ouverture le 11 oct. 2026 à 07:10 UTC, empreinte `ab3dcab9…ee79fd2` | Cas fabriqués. Arbre de travail modifié sur 3 fichiers au moment de la mesure. Je n'ai pas ouvert `CASES.jsonl` |
| 64,7 % sans la phrase | idem, bras (c) | 97 sur 150, intervalle 56,7 à 71,9 | « Signalé » = avertissement ou rouge |
| 87,3 % avec la phrase | idem, bras (a), code seul | 131 sur 150, intervalle 81,1 à 91,7 | Rouge seul : 76,0 %. Avec Clef, bras (b) : 88,7 % |
| 6 sur 19, puis 18 sur 19 | idem, famille `swap_droit_illimite` | bras (c) puis bras (a) | 19 cas : petit. En rouge seul, 5 sur 19 |
| 15 % de fausses alertes rouges, objectif 10 % manqué | idem | 15 sur 100, intervalle 9,3 à 23,3. Critère publié avant l'ouverture | Avertissement ou rouge : 30 sur 100. Avec Clef : 16 sur 100 |
| 11 des 15 viennent d'une famille | idem, famille `seaport_prix_quasi_nul` | 11 fausses alertes rouges sur 12 jumeaux honnêtes | Sur la famille de la démonstration : 0 sur 13 |
| Zéro cas sous le plancher (questions) | idem, section Monotonie | bras (a) et (b) | |
| Contrôlé aujourd'hui : montant d'un droit, paiement, second droit dans un lot, prise de contrôle du compte | `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` | Essais E1a, D2a, E1c, E2a, E3, D8a, D10a à D10c | Moteur serveur. Relais Clef non appelé dans ces essais |
| Pas encore : sens d'un échange, contrepartie, minimum reçu, durée | idem | E6a, E6b, E1b, E4, E5a, D1a à D1c | |
| 58 paires : 18 contrôlées, 20 non, 7 en partie, 13 non distinguées (questions) | idem, verdict (a) | | |
| Fenêtre ouverte en 325 à 345 ms ; verdict environ 400 ms, 1,1 s avec Clef (questions) | `coord/reports/AUDIT_APPLICATION_FINIE.md`, tableau (b) | Mesure du pilote, vrai Chromium, portefeuille simulé | Quelques passages, pas un banc |
| Le droit envoyé au portefeuille est ramené à 50 USDC | idem, tableau (b), ligne « Piège, avec jetons déclarés » | `approve(…, 50000000)`, droit final 50 USDC | Jetons déclarés à la main. Commit `5602248` |
| Sans Hold up, 100 vers 0 | `research/demo_reelle/site_echange/test/preuve.mjs` | Script Node, chaîne locale, compte de test neuf, entre `evm_snapshot` et `evm_revert` | Hors navigateur. Non relancé par moi |
| Contournements trouvés par la revue interne, dont un critique (questions) | `PRODUCT.md`, section Limites ; `livrables/QR_JURY.md`, question 2 | `research/titouan/T_banc_e2e/security_review2/REVUE.md` | Je n'ai pas relu la revue elle-même |
| Journal inexact sur deux points (questions) | `AUDIT_APPLICATION_FINIE.md`, point 13 | | |
| La phrase part vers Clef par un relais local (questions) | `coord/DECISIONS.md` D-015 ; `AUDIT_APPLICATION_FINIE.md`, tableau (b) | Relais sur `127.0.0.1:8789`, la clé reste dans le relais | Build livré non retesté par l'audit |
| Rien sur Fuji | `blockchain/DEPLOYMENTS.md` (en-tête seul) ; `blockchain/FUJI.md` | | |

## Mapping cité

| Élément | Fichier du dépôt | Réserve |
|---|---|---|
| NIST CSF 2.0 : DE.CM, DE.AE (l'écart), RS.MI (retenir, limiter) | `RECHERCHE_these_moindre_privilege.md`, `RECHERCHE_concurrents_particuliers.md`, sections « Mapping réglementaire » | Limiter un droit relève aussi de PR.AA-05 (Protect) : si on te le fait remarquer, c'est exact |
| ATT&CK : T1204, T1566, T1657 | idem | Identifiants à revalider dans le référentiel |
| OWASP Agentic, ATLAS | idem | Non cités dans le pitch : ils ne s'appliquent que si la demande vient d'un agent. Ne pas forcer |

## Ce que je n'ai pas utilisé, et pourquoi

- SwapNet et Radiant : vrais, mais les montants demandent chacun une réserve (défaut désactivé par les victimes, 50 M$ de fonds de pools). Trop long à dire juste.
- Le total de Revoke.cash depuis 2020 : mélange trois mécanismes.
- Le contrôle scellé de 1 079 paires (86,6 %, 1,3 %) : même auteur que les règles. Le jeu aveugle le remplace.
- Toute série par année, toute taille de marché.
