# Critère n° 4 : Conformité et explicabilité (15 %) : boucle de notation

Rédigé le 11 oct. 2026. Livrables : `livrables/FICHE_DEFENSE.md`, `livrables/SLIDE_CONFORMITE.md`, `livrables/MAPPING_REFERENTIELS.md`, `livrables/EXPLICABILITE.md`, `research/demo_reelle/audit/` (`verify_decision.mjs`, `make_sample_journal.mjs`, `sample/`).

## Grille (juré de type KPMG, 100 points)

| Axe | Points | Ce que je cherche comme preuve |
|---|---|---|
| A. Traçabilité d'une décision | 20 | une ligne par décision, intégrité vérifiable, ancrage externe |
| B. Rejouabilité | 15 | rejouer la décision et obtenir le même verdict, depuis ce que le journal garde |
| C. Référentiels | 15 | identifiants vérifiés à la source, rapprochements défendables |
| D. Positionnement réglementaire | 15 | qui est assujetti, ce que le produit apporte, ce qu'il ne prétend pas, article cité |
| E. Honnêteté des chiffres | 15 | jeu de réglage contre jeu aveugle, warn compté ou non, fausses alertes en comptes |
| F. Responsabilité | 10 | réponse vraie à « si votre modèle se trompe » |
| G. Forme | 10 | une page, lisible, sans mention « à vérifier » |

## Passe 0 : état du repo avant mon travail (44/100)

A 12 : chaîne de hachage locale, mais non ancrée et ignorée des brouillons. B 3 : « rejeu » désignait le rejeu du banc, rien pour une décision. C 3 : « identifiants à vérifier », D3FEND absent. D 6 : brouillon de slide sans article cité. E 10 : honnête mais sans la paire (critical seul, warn compté). F 4 : « le modèle ne peut qu'aggraver » dit sans condition. G 6 : fiche avec trois « à vérifier ».

## Passe 1 : premiers livrables (79/100)

A 15, B 11, C 13, D 12, E 12, F 8, G 8. Constats du juré en relisant mes propres documents, avec la correction :

| # | Constat | Preuve | Correction |
|---|---|---|---|
| 1 | La slide écrit « un modèle ne peut qu'aggraver » sans condition, alors que des règles abaissent un verdict à partir de l'intention déclarée | `nft_orders.mjs`, `intent_guard.mjs` (commentaires LOWER) | formulation limitée au classifieur de message ; condition « l'intention reste un choix de la personne » écrite dans la slide et dans EXPLICABILITE §5 |
| 2 | EXPLICABILITE annonçait « trois décisions rejouées » alors que j'en avais rejoué deux | exécution | les six lignes rejouées : 6 sur 6, 9 contrôles passés chacune |
| 3 | Le script ne dit rien d'une ligne `rpc_verdict` (porte 2) | `proxy.mjs` | message explicite : la transaction brute n'est pas gardée, on la retrouve par son hachage si elle a été diffusée |
| 4 | La slide cite DORA art. 10 sans l'utiliser | relecture | retiré de la liste des passages |
| 5 | La fiche donnait une latence qui ne correspond plus au fichier | `server/test/results.json` régénéré (médiane 1,26 ms au lieu de 32,38 ms) | chiffres du fichier actuel, variation entre exécutions écrite, repère « moins de 50 ms » |
| 6 | La fiche mélangeait 60,7 % (V2_DEV avant correctifs) et 20,9 % (après, réglé sur le même jeu) | `MESURE_BASE.md`, `MESURE_reg_F27.md` | les deux chiffres, avec leur statut, dans la phrase de limite |

## Passe 2 : après correction (86/100)

A 16, B 12, C 14, D 13, E 13, F 9, G 9. Reste non réglé : A (aucun ancrage Fuji dans le repo), B (le journal ne garde pas la requête entière : correctif proposé, non appliqué), E (aucun chiffre sur le pipeline livré, aucun jeu aveugle ouvert), D (aucun avis de juriste).

## Passe 3 : sources produites pendant ce travail, relues (88/100)

Relu à la fin : `server/test/results.json` (chiffres repris, voir passe 1), `pipeline/` (trois fichiers de code : `evaluate_plus.mjs`, `measure.mjs`, `parity.mjs`, mais ni `RESULTATS_INTEGRATION.md` ni `PRODUIT_VS_BANC.md` à l'heure de la relecture), `research/demo_reelle/lab/` (interface et scénarios, aucun fichier de synthèse « run-all »), `blockchain/DEPLOYMENTS.md` (vide), grep de `detectors_adem` dans `server.mjs` et `proxy.mjs` (0). La fiche, mise en page à 9 à 10,5 pt (A4, marges de 10 mm), tient sur une page. A 17, B 12, C 14, D 14, E 13, F 9, G 9.

Pour monter encore : ancrer une racine sur Fuji et lancer `verify_decision.mjs --contract` ; appliquer le correctif d'EXPLICABILITE §4 ; remplacer les lignes du tableau de la fiche par les chiffres du pipeline livré quand `RESULTATS_INTEGRATION.md` existera.

## Identifiants retirés ou corrigés (détail dans `MAPPING_REFERENTIELS.md` §4)

D3-MAN (nom faux : Message Authentication, pas Message Analysis) ; D3-OTF, D3-PSA, D3-UAP (définition sans rapport avec la fonction) ; T1068, T1115, T1548 ; PR.AA-05 ; ASI09 sur trois détecteurs ; T1656 (remplacé par T1684.001, révocation inférée) ; codes CSF sans numéro (RS.MI, RS.AN, ID.RA).

## Métriques « à mesurer » (écrites ainsi dans la fiche)

1. rappel et fausses alertes du pipeline livré en conditions réelles (`check_product.mjs`, `pipeline/measure.mjs` : pas de résultats publiés) ;
2. jeu aveugle V2_TEST (2 498 cas, jamais ouvert) ;
3. latence de la porte RPC ;
4. temps de décision de personnes réelles ;
5. détection et réponse sur Fuji ;
6. tenue de la retenue de 10 min (testée avec 2 s seulement).

## Anomalies relevées en passant

- Deux formats de journal incompatibles (serveur : sha256 ; `anchor/journal.mjs` : keccak, canonique). `anchor_now.mjs` refuse le journal que le produit écrit.
- Un fichier `anchor/DEPLOYMENTS_ANCHOR.md` est apparu un instant avec une ligne « ancrage [0..4] » dont la transaction n'existe pas sur Fuji (reçu nul sur le RPC public), puis a disparu : ne pas le citer.
- L'empreinte de règles de `COUVERTURE.md` (`f952f3fb298f`) ne couvre que `rules.mjs` et `compare.ts`.

## Ce que le script d'audit a prouvé

Sur le journal d'exemple de six décisions : chaîne recalculée et recoupée avec `verifyJournal` ; racine de Merkle et preuve d'inclusion ; rejeu déterministe, 6 décisions sur 6 ; règle à l'origine de chaque raison avec fichier et ligne ; ligne modifiée et ligne retirée au milieu détectées ; dernière ligne retirée et réécriture complète non détectées sans ancrage ; contre-épreuve où une requête voisine passe le contrôle de hachage et échoue au rejeu.
