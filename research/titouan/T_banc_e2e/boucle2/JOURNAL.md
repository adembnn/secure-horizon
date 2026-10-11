# Boucle 2 : journal des tours

Date : 11 octobre 2026. Aucun commit de ma part. Aucun jeu scellé ouvert (`blind_decalage/CASES.jsonl`, `blind_adem/v2/V2_TEST.jsonl`, `attacks/TEST.jsonl`, moitié contrôle et réserve de `preuves/panel/`).
Le gel du moteur posé pour le jeu aveugle est levé : ce jeu est mesuré et clos, son résultat publié ne change pas.

## Jeux et outils

- `gen_jeux.mjs` écrit `REGLAGE.jsonl` et `CONTROLE.jsonl` : 660 paires chacun, 27 scénarios, même loi, graines différentes (20261011 et 77052026), formulations écrites à la main dans deux lots disjoints. Empreinte du contrôle scellée avant toute correction : `CONTROLE_SHA256.txt` (4576f484…78ec).
- `mesure.mjs` : décideur réel de l'extension, sources vivantes. Bras « mots » et « clef ». Le contrôle exige `--final` et pose un verrou par bras.
- `dim58.mjs` : les 58 paires de `preuves/exhaustivite/`, copiées, rejouées à chaque tour (tests permanents, ni réglage ni contrôle).
- `regress.mjs` : moitié réglage du panel `preuves/panel/` et moitié réglage de la grille, avant et après, par le même décideur.
- `mesure_banc.mjs` : le même jeu par la chaîne de banc du jeu aveugle (niveaux ok, warn, critical), pour comparer aux « 15 % de fausses alertes rouges ».
- `invariants.mjs` : phrase vague jamais « correspond » ; une phrase ne fait jamais mieux que sans phrase ; aucun texte ne dit « sûr ».
- Clef : 286 appels en tout (plafond 15 000), cache dans `out/cache_clef.json`.

## Tour 0 : mesure de départ (réglage, bras mots)

Signalés 199/414 = 48,1 %. Ratés 134/414 = 32,4 %. Écarts « pas pu vérifier » 81/414. Fausses alertes 17/240 = 7,1 %. Conformes « pas pu vérifier » 61/240. Conformes reconnus 162/240 = 67,5 %.
58 paires : 18 contrôlées, 20 non contrôlées, 7 en partie, 13 non distinguées.

## Tour 1 : la phrase est comparée à ce que la demande porte

Causes A1, A2, A3, A4, A5, A6, A7, A8, B1, B2 (voir `CAUSES.md`).
Corrections :
- `extension/intent_text.js` : montants en monnaie courante (« dollars », « $ », « usd », « balles », « bucks » : symbole `USD`, `money`), en lettres (français, anglais), séparateurs de milliers (« 1,500 » garde deux lectures, `amountAlt`), côté du montant (`side` : ce que je donne ou ce que je reçois), contrepartie écrite (`counter`), minimum écrit (`min`), NFT et son numéro (`nft`, `nftId`). Vocabulaire : vendre, mettre en vente, offre ; une phrase qui donne un droit est comprise.
- `extension/written_check.js` : lecture par code des échanges des routeurs publics (familles Uniswap V2 et V3, multicall, unwrap, sweep), des ordres de marché (forme Seaport), de `setApprovalForAll`, des échéances des droits signés ; comparaison montant, jeton donné, jeton reçu, sens, minimum, compte d'arrivée, échéance, sorties en plus, réseau, compte.
- `detectors_adem/nft_orders.mjs` : un NFT reçu n'est pas « rien ».
Avant / après (réglage) : signalés 48,1 % -> 92,3 % ; ratés 32,4 % -> 0 ; fausses alertes 7,1 % -> 0 ; conformes reconnus 67,5 % -> 100 %.
58 paires : 18 -> 37 contrôlées, 20 -> 2 non contrôlées.
Régressions trouvées par `regress.mjs` et corrigées dans le même tour :
- « Autoriser l'adresse 0x… à utiliser 300 DAI » + simple transfert : lu comme un paiement vers l'adresse nommée, donc « correspond » (25 écarts du panel). Corrigé : une adresse nommée ne fait un paiement que si la phrase ne donne pas un droit.
- Un simple envoi sous une phrase NON comprise passait en « ne correspond pas » (grille : 4 -> 37 fausses alertes). Corrigé : la règle ne vaut que pour une phrase comprise comme échange, achat, vente ou droit.
- Achat d'un NFT payé en monnaie du réseau à une place de marché connue : rendu au moteur (5 fausses alertes de la grille).
- Première mesure du panel faussée par mon harnais (horloge de 2025 contre des échéances de 2026 : 380 fausses alertes fictives). Corrigé dans `regress.mjs`, pas dans le produit.

## Tour 2 : compléments tirés des 58 paires

Prix total d'un ordre de vente (M2b), jeton intermédiaire inconnu (M11), droit sur toute une collection (D4a, régression de mon vocabulaire : « vendre mon NFT » + `setApprovalForAll` donnait « correspond »).
58 paires : 37 contrôlées, 2 non contrôlées (E1a : droit trop large corrigé par la limitation ; M4 : frais).

## Tour 3 : vocabulaire et frais

- Frais (M4) : coût maximal d'une transaction d'un demi-jeton du réseau ou plus sur ETH, AVAX, BNB : écart. 58 paires : 38 contrôlées.
- Vocabulaire, gardé : « changer », « je laisse X utiliser », « letting X spend », « autorize ». Source : conformes « pas pu vérifier » de la moitié réglage du panel. Le mot « change » figure aussi dans mes formulations de contrôle : je le signale. Panel : conformes reconnus 345 -> 368, fausses alertes inchangées.
- Vocabulaire, REJETÉ : déposer, deposit, supply, prêter, placer, « mettre … sur ». Gain : +48 conformes reconnus sur le panel. Perte : grille, ratés 34 -> 70 et surconfiance 51 -> 64, parce qu'aucune comparaison ne lit encore un dépôt : la phrase comprise fait dire « correspond » à une demande que personne n'a comparée. Bilan négatif : retiré. Copie de l'essai : `out/intent_text.p4_complet.js`.
- Adresse du routeur Trader Joe v1 : ajoutée puis retirée de la liste publique de `written_check.js`. Le dépôt a une preuve que du code existe à cette adresse, pas une source primaire qui dit que c'est Trader Joe.

## Tour 4 : décisions de produit reçues du coordinateur (pas des corrections de ma mesure)

1. Un droit BORNÉ au montant écrit vers un contrat hors liste : « correspond », sans retenue, la ligne dit « Je ne connais pas ce contrat (0x…). Il pourra prendre N, pas plus. » (champ `spender_unknown`). Jeton inconnu ET contrat inconnu : « ne correspond pas ». Service nommé dans la phrase et présent dans la liste (Uniswap, Aave, Pangolin), droit vers une adresse hors liste : « ne correspond pas ».
2. Un droit borné sans date de fin proche : plus d'alerte, la ligne le dit (champ `right_remains`).
3. Un droit plus large que le montant écrit, limitable : « ne correspond pas » avec le champ `limit` (montant écrit, montant demandé, bénéficiaire, jeton). La limitation sans geste n'est plus de mon ressort : l'interface la propose.
Justification donnée : sur un profil neuf, tout service hors liste était retenu 30 s alors que le droit était exactement le montant écrit. Le produit borne ce qu'il laisse passer, il ne prétend pas reconnaître les services.
Effet mesuré sur le réglage (bras mots), avant -> après la décision : signalés 92,3 % -> 86,5 % ; ratés 0 -> 30 (18 « durée », 12 « bénéficiaire du droit ») ; fausses alertes 0 -> 0 ; conformes reconnus 100 % -> 100 %. Sur le panel : fausses alertes 145 -> 106 sur 702, conformes reconnus 368 -> 464, ratés 15 -> 109 (écarts de durée et de bénéficiaire, étiquetés non conformes par le panel).
58 paires : 38 -> 35 contrôlées, 1 -> 7 non contrôlées (D1a, D1b, D1c, D2d, M1a, M1b, E1a), toutes par ces décisions.
Tests adaptés : `extension/tests/unit/comportement.test.mjs` (profil neuf) et `securite_written_check.test.mjs` (S2).

## Tour 5 : deux régressions signalées par une mesure indépendante (panel de réglage, build autonome), APRÈS la mesure du contrôle

1. « 25 $ contre du WAVAX » face à un droit de 20 USDT : le moteur embarqué levait `token_differs_from_intent` (F32), parce que mon extraction envoie le symbole `USD` et que F32 le lisait comme un jeton. Correction dans `run/policy.mjs` : une monnaie courante n'est pas un jeton ; les règles de détail du moteur ne lisent ni ce jeton ni ce montant (la comparaison à un jeton stable connu se fait dans `written_check.js`). Vérifié par `sonde_monnaie.mjs`. À propager au moteur embarqué par le build (`build_standalone.mjs`), que je n'ai pas relancé : un autre agent refait l'interface au même moment.
2. 17 fausses alertes sur les jumeaux conformes des attentes par défaut : ma règle « entre deux jetons stables, un minimum garanti sous la moitié est un écart » signalait des jumeaux conformes du panel (5 USDC contre au moins 0,97 USDT). Règle RETIRÉE. Restent : minimum nul ou infime, minimum écrit.
Effet (décideur du commit b42792d + mes deux fichiers) : réglage inchangé (358/414, 0/240). Panel : fausses alertes 106 -> 81 sur 702, conformes reconnus 464 -> 487, écarts signalés 1 821 -> 1 820, ratés 109 -> 109. Grille : inchangée.
Demandes NON suivies, et pourquoi : « D1 : une autorisation signée sans échéance doit changer l'issue » et « destinataire ». Elles contredisent la décision de produit du tour 4 (droit borné = « correspond », dit sur la ligne, champs `right_remains` et `spender_unknown`). Je n'ai pas inversé une décision du fondateur sur la foi d'un message de mesure. Les deux champs existent : l'interface ou `outcome.js` peut en faire une autre issue en une ligne si le fondateur tranche dans l'autre sens.
ATTENTION : le contrôle scellé avait déjà été mesuré (une fois, verrous posés) avant ce tour et avant le report du commit 2d2c259 (renommage). Il n'a pas été remesuré. Ce tour ne fait que retirer une règle d'alerte et masquer un mot au moteur : il ne peut pas ajouter d'alerte. Le réglage, rejoué après, donne exactement les mêmes chiffres qu'avant.

## Ce qui vient du coéquipier (commits f52cf27 et 2d2c259, repris à l'identique dans l'arbre de travail)

`detectors_adem/intent_guard.mjs`, `detectors_adem/nft_orders.mjs`, `engine/src/fixes.mjs` (F42, F43), `engine/src/typed.mjs`, `engine/src/util.mjs`, `run/policy.mjs`, `pipeline/test/evaluate_plus.test.mjs`, `server/server.mjs`, `engine/test/familles.test.mjs`, `engine/RAPPORT_FAMILLES.md`, `attacks_familles/`.
Même cause que mon tour 1 pour l'offre d'achat d'un NFT : j'ai retiré ma version de `nft_orders.mjs` et gardé la sienne. Ses règles F32 revue, F42, F43 agissent dans le moteur ; les miennes dans `written_check.js`. Elles ne se contredisent pas : chacune ne fait que monter un niveau.
Ses tests passent (`engine/test/familles.test.mjs` : 10 sur 10).
Attribution : les mesures « réglage » des tours 0 à 3 ont été faites AVANT ses fichiers. Les mesures finales et le contrôle ont été faits AVEC. Sur la chaîne de banc, le rappel du réglage passe de 80,9 % à 82,9 % entre les deux : ces 2 points viennent de lui.

## Vérifications finales

- Tests de l'extension : 215 réussis, 0 échec. Pipeline : 34 réussis, 0 échec (l'échec `jury-fp-089`, présent avant moi, est corrigé par le commit du coéquipier). Serveur : 2 fichiers verts. Moteur : calldata, compare, typed, rules, monotonie, familles verts ; `cchain` et `real` échouent sur des fichiers de données absents de cette machine, comme avant. `run/check_nohardcode` : OK. `run/test_policy` : OK.
- Invariants (`invariants.mjs`, 660 paires) : 0 phrase vague qui « correspond », 0 verdict baissé par la phrase, 0 texte qui dit « sûr ».
- Build autonome refait : 43 contrôles sur 44. L'échec : le bloc PRESENTATION de `server/server.mjs` (modifié par le commit f52cf27) diffère de `extension_standalone/src/sentinelle_core.js`. À faire après la fusion : `node server/sync_presentation.mjs --write`, puis refaire le build.

Note sur `patches/` : ces scripts ont servi à poser les tours 1 à 3. Les retouches des tours 4 et 5 ont été faites directement dans les fichiers. L'état qui fait foi est celui des fichiers du dépôt, pas celui des scripts.
Note sur `livrables/CHIFFRES.md` : je n'y ai rien laissé. La section datée « après boucle 2, jeu de contrôle neuf » est prête dans `boucle2/SECTION_POUR_CHIFFRES.md`, à coller par le responsable du fichier.
Au moment de rendre la main, 41 tests de `extension/tests/unit` échouent sur l'arbre de travail : ils viennent de la refonte de l'interface en cours par un autre agent (`gatekeeper.js`, `outcome.js`, `ui/`). Avec le décideur du commit b42792d et mes fichiers, les 215 tests passaient (10 h 31), et les tests propres à `written_check.js` et `intent_text.js` passent toujours (25 sur 25).

## Arrêt

Les erreurs qui restent sur le réglage ne dépendent plus d'une comparaison absente : jeton inconnu (12), jeton reçu inconnu (6), réseau ajouté (6), envoi sous une phrase de connexion (2), plus les 30 écarts que les décisions de produit acceptent en le disant. Le tour suivant demanderait soit une liste publique plus longue (données sourcées), soit de nouveaux types d'intention (dépôt, retrait, emprunt, pont) dans `gatekeeper.js` et le moteur.
