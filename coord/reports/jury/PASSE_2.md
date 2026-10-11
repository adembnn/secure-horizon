# Jury d'évaluation : passe 2

Date : dimanche 11 oct. 2026, 04h53 à 04h56. Passe déclenchée par un changement majeur : `README.md` remplacé, `livrables/` rempli et en partie commité (`2f37e15`). Rien n'a été modifié hors de `coord/reports/jury/`. `V2_TEST.jsonl` ni lu ni exécuté. `BLIND_v1.jsonl` non exécuté non plus, pour ne pas le brûler à la place de l'équipe.

## 0. Correction d'une lecture de la passe 1

En passe 1, j'ai écrit que `jury_fuzz_fp` donnait « 96,7 % de bénins en critique ». C'est une mauvaise lecture. `redteam/LOOP_JOURNAL.md` et `jury_fuzz_fp.md` précisent que les fichiers `jury_*.jsonl` ne contiennent que les **survivants** d'un fuzzing : chaque ligne est un échec déjà trouvé, dédupliqué. 492/509 veut donc dire « 17 fausses alertes connues corrigées sur 509 », pas un taux. Le taux de base publié par l'équipe est 16,2 % de critiques et 57,2 % d'avertissements sur 32 545 opérations honnêtes fuzzées (`jury_fuzz_fp.md`). Même lecture pour `jury_fuzz_intent` (264 contournements encore ouverts sur 420 trouvés), `jury_fuzz_sig` (184 sur 1 101), etc. Les notes de la passe 1 n'en dépendaient pas assez pour changer.

## 1. Ce qui a été exécuté pendant et après la passe 1

| Vérification | Résultat observé |
|---|---|
| Moteur `rules_extra.mjs` | Recompile depuis 04h40. La casse a duré environ 2 minutes. |
| `engine` : `node --test test/*.test.mjs` | 288/290, mêmes 2 échecs (données ignorées par git). Le README le dit maintenant tel quel. |
| `server` : `node --test test/*.test.mjs` | `server.test.mjs` 33/33 (p50 1,81 ms, p95 5,13 ms). **`presentation.test.mjs` 30/31** : 7 codes de raison sans entrée dans la table des textes (`lookalike_reported`, `lookalike_weak`, `signed_transfer_unlimited`, `signed_right_unlimited_unknown`, `signed_calldata`, `signed_text_grants_assets`, `offchain_signaling`). |
| `rpc_garde/test/proxy.test.mjs` | 15/15 (nœud jetable 8547). |
| `extension/tests/unit/*.test.mjs` | 41/41 (Chrome factice). |
| `npx hardhat test` | 30/30 (passe 1). |
| `node scripts/demo.mjs --check` | Fonctionne, ne lance rien. Annonce « labo (serveur / interface) : absent / présent ». |
| Services | 8545, 8555, 8791, 8792 répondent. **8800 (Lab) n'a jamais répondu. 8801 répondait à 04h43, plus à 04h53. 8787 (serveur de vérification) arrêté.** |
| RPC de garde en direct | `eth_chainId` relayé (`0xa86a`). `GET /holds` montre une retenue `danger`, annulée. `--verify-journal` sur `rpc_garde/journal/decisions.jsonl` : « journal OK (2 lignes) ». |
| Scène héros, pipeline livré (`server.mjs evaluate`, permit construit depuis `8792/state`) | Permit illimité vers le drainer : `danger` (`unlimited_allowance`, `external_spender`), 2 à 9 ms. **Permit du solde exact (2 480 USDC) vers le même drainer : `attention` seulement**, donc sans attente. |
| Historique git, motifs de secrets | Aucun secret (un seul faux positif : une adresse nommée `TOKEN`). |
| `livrables/deck/holdup.pptx` | 8 slides. |
| `blockchain/DEPLOYMENTS.md` | Toujours vide. |

Mesure qui manquait : **le produit livré contre le banc**, sur le jeu de réglage `V2_DEV_norm` (2 930 malveillants, 1 976 bénins) et sur `jury_fp` (123 opérations honnêtes). Commande : `node pipeline/measure.mjs redteam/V2_DEV_norm.jsonl redteam/jury_fp.jsonl --modes=product,detectors,live` (script apparu à 04h50, il n'écrit rien) et `node redteam/check_plus.mjs`.

| Chaîne mesurée | Arnaques sans écran critique | Rappel critique | Bénins en critique (`V2_DEV`) | Bénins avertis (`V2_DEV`) | Bénins en critique (`jury_fp`) |
|---|---|---|---|---|---|
| Banc (`check_plus.mjs`, contexte riche) | 16 | 99,5 % | 79 (4,0 %) | 1 220 (61,7 %) | 18 (14,6 %) |
| **Produit livré** (`server.mjs evaluate`) | 901 | **69,2 %** | 265 (13,4 %) | 809 (40,9 %) | 27 (22,0 %) |
| Produit + détecteurs (`pipeline/evaluate_plus.mjs`) | 206 | 93,0 % | **633 (32,0 %)** | 552 (27,9 %) | 48 (39,0 %) |
| Produit + détecteurs + faits lus sur la chaîne | 84 | 97,1 % | **646 (32,7 %)** | 590 (29,9 %) | 51 (41,5 %) |

Lecture : brancher les détecteurs fait passer le rappel de 69 % à 97 %, mais un tiers des opérations honnêtes reçoit alors un écran critique. La précision des écrans critiques tombe de 88,4 % (2 029 vrais pour 265 faux) à 81,5 % (2 846 pour 646). Familles honnêtes toujours en critique dans le produit livré : `nft_listing_seaport` 75/75, `nft_setapprovalforall_marketplace` 60/60, `approve_unlimited_router` 45/59, `permit2_signature` 26/46. Tous les swaps LFJ, Pangolin, 1inch, Odos, ParaSwap et toutes les opérations Aave et Benqi reçoivent un avertissement. Familles d'arnaques les plus ratées par le produit livré : `sig/permit_eip2612` 79/169 (la scène héros), `clipboard_swap` 70/97, `approve_drainer` 56/129, `transferFrom_direct` 51/51.

## 2. Notes (0 à 10)

| Critère (poids) | Ingénieur détection SOC | Auditeur type KPMG | Ingénieur Avalanche / DeFi |
|---|---|---|---|
| Efficacité de détection (30 %) | 4,5 | 4,5 | 4,5 |
| Qualité de la réponse (20 %) | 6,5 | 6,5 | 6,5 |
| Faisabilité et intégration (20 %) | 5,5 | 5 | 4,5 |
| Conformité et explicabilité (15 %) | 6 | 6,5 | 5,5 |
| Pitch et démo (15 %) | 5,5 | 5,5 | 5 |
| **Total pondéré sur 100** | **54,8** | **54,5** | **51,3** |

**Moyenne : 53,5 / 100** (passe 1 : 45,8).

**Ingénieur détection.** Détection 4,5 : la méthode est maintenant honnête (le README dit « le produit livré voit moins que le banc », la fiche sépare critique seul et avertissement), mais le produit livré fait 69,2 % de rappel critique sur son propre jeu de réglage, et la voie d'intégration prévue triple les fausses alertes. « Vous avez un choix à faire entre 69 % avec 13 % de faux écrans rouges et 97 % avec 33 % : lequel présentez-vous ? » Réponse 6,5 : playbook livré, retenue vérifiée en direct. Faisabilité 5,5 : commande unique `node scripts/demo.mjs`, cinq suites vertes, un test rouge. Conformité 6. Pitch 5,5.

**Auditeur.** Conformité 6,5 : `livrables/EXPLICABILITE.md` répond à mes questions avant que je les pose, y compris les mauvaises réponses (« Quelle version des règles a jugé ? Inconnue », « rejouer à partir du journal seul ? Non », deux formats de journal incompatibles entre le serveur et l'ancrage). `MAPPING_REFERENTIELS.md` cite ses sources et retire les identifiants non confirmés. Ce qui manque est un correctif de code, pas un texte. « Vous décrivez exactement ce qui manque pour rejouer une décision : pourquoi n'est-ce pas écrit dans la ligne de journal ? » Pitch 5,5 : la fiche de défense fait 842 mots et un tableau, ce n'est pas une page ; la slide conformité fait 1 207 mots.

**Ingénieur Avalanche.** Faisabilité 4,5 : rien sur Fuji, aucun essai avec Core ou MetaMask, Lab absent. Le RPC de garde est une vraie idée d'intégration et ses limites sont comprises (`rpc_garde/README.md`, section Limites : transaction déjà signée, RPC de secours du portefeuille, signatures hors chaîne invisibles). « Sur un portefeuille Avalanche, chaque swap LFJ ou Pangolin déclenche votre avertissement : personne ne le gardera installé. » Pitch 5 : la vidéo est encore en trois clips, dont un que `VIDEO_SCRIPT.md` dit écarté.

## 3. Les cinq constats qui coûtent le plus

1. **Le chiffre du produit n'est dans aucun livrable.** Mesuré ici : 69,2 % de rappel critique et 13,4 % de fausses alertes critiques pour le pipeline livré, sur le jeu de réglage. La fiche donne seulement les chiffres du banc (88,3 % et 1,2 % sur `V2_DEV`) avec la mention « décrivent le banc, pas le produit ». Coût : détection (30 %).
2. **Brancher les détecteurs coûte 633 fausses alertes critiques sur 1 976 (32,0 %).** `pipeline/evaluate_plus.mjs` existe, mais dans cet état il dégrade la précision. Coût : détection, et la qualité de réponse si un écran rouge sur trois est faux.
3. **La scène héros se contourne en demandant le solde exact.** Permit de 2 480 USDC vers le drainer : `attention`, sans attente. Le produit livré ne lit pas le solde (seule la porte RPC lit des faits). Un juré DeFi posera la question.
4. **Lab absent, alors que le pitch de 5 minutes lui donne 1 minute (2:05 à 3:05) et que le deck en fait la slide 4.** `lab/server/` existe (non suivi), le port 8800 n'a jamais répondu, 8801 est retombé.
5. **Rien sur Fuji, ancrage non déployé, version des règles absente du journal.** Les trois sont avoués partout, ce qui évite l'affirmation fausse, mais plafonne conformité et faisabilité.

## 4. Corrections à faire, par priorité

### A. Éliminatoires

Levés depuis la passe 1 : README racine (E1), fiche, playbook et slide conformité dans `livrables/` (E2, E3), deck présentable (E4), moteur réparé (E7), « 447 tests » corrigé dans le README (E8 en partie).

| # | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|
| E5 | `livrables/video/` | Un seul fichier de 2 à 3 minutes. Aujourd'hui : trois clips, et `VIDEO_SCRIPT.md` dit que le clip 2 (72 s, portefeuille simulé) est écarté. Sans lui il reste 65 s. Monter les plans 4 à 10 du script ou assumer le clip 2 avec sa légende. | Livrable 2 | pitch +1 |
| E6 | `livrables/ARCHITECTURE.md`, `livrables/INSTALLATION.md`, `scripts/demo.mjs`, `package.json`, `research/demo_reelle/lab/server/`, `research/titouan/T_banc_e2e/pipeline/`, `context_live/`, `redteam/check_product.mjs` | Tous non suivis par git à 04h54, alors que le README commité y renvoie (`node scripts/demo.mjs`, `npm run test:*`). Un clone neuf n'a pas la commande de démo. À commiter. | Livrable 1, faisabilité | sans cela faisabilité −2 |
| E9 | `coord/DECISIONS.md` | D-008 dit toujours « la démo du jury se joue sur Fuji ». Le README et le pitch disent le contraire. Ajouter une ligne D-009 qui acte la démo sur copie locale, ou déployer. | Cohérence des affirmations | conformité +0,25 |
| E10 | `research/titouan/T_banc_e2e/compat/results/{A1,A2,B}/zora.json` ; `realscan/out/` | Expurger le DSN Sentry d'un site tiers (un scanner de secrets le signalera). Dire dans le README que `realscan/out/` et `compat/results/` contiennent des adresses publiques du réseau principal et des pages de sites réels chargées en lecture seule, ou sortir ces dossiers du suivi (un fichier fait 95 Mo). | Règles secrets et données | évite une pénalité |
| E11 | `livrables/FICHE_DEFENSE.md` | Le règlement dit « fiche de défense (1 page) ». 842 mots et un tableau de 5 lignes ne tiennent pas sur une page. Viser 450 mots : garder une seule ligne de tableau par jeu utile, renvoyer le reste à `MAPPING_REFERENTIELS.md`. | Livrable 4 | pitch +0,5 |

### B. Le reste, par gain attendu

| # | Propriétaire | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|---|
| 1 | Adem | `T_banc_e2e/detectors_adem/` (`nft_orders.mjs`, `spend_rights.mjs`, `sig_rights.mjs`), `pipeline/evaluate_plus.mjs` | Avant de brancher : ramener les bénins en critique de 633 à moins de 100 sur `V2_DEV_norm` en mode `detectors`, sans repasser sous 90 % de rappel. Regarder d'abord `nft_listing_seaport`, `nft_setapprovalforall_marketplace`, `approve_unlimited_router`, `permit2_signature`. Vérifier avec `node pipeline/measure.mjs … --fails=detectors`. | Détection | +1,5 |
| 2 | Titouan | `livrables/FICHE_DEFENSE.md`, `README.md` (tableau des chiffres) | Ajouter la ligne « pipeline livré » : 2 029/2 930 (69,2 %) en critique, 265/1 976 (13,4 %) de fausses alertes critiques, 809/1 976 avertis, commande `node pipeline/measure.mjs`. C'est le chiffre que le juré détection demande. | Détection, conformité | +0,5 et +0,5 |
| 3 | Titouan (mesures) | `T_banc_e2e/blind_adem/BLIND_v1.jsonl` | Le passer une fois dans `pipeline/measure.mjs --modes=product` et publier le résultat, bon ou mauvais. | Détection | +1 |
| 4 | Adem | `research/demo_reelle/lab/server/`, `lab/ui/` | Faire répondre `8800/api/health`, `/api/scenarios` (30 ou plus, moitié honnêtes), `POST /api/run-all` ; garder `8801` debout ; un test dans `lab/server/test/`. Sinon retirer le Lab du pitch (2:05 à 3:05) et de la slide 4. | Pitch, faisabilité | +1 et +1 |
| 5 | Titouan | `T_banc_e2e/server/server.mjs` (`makeJournal`), `research/demo_reelle/rpc_garde/proxy.mjs` | Écrire `rules_sha256` dans chaque ligne (le calcul existe déjà, `EXPLICABILITE.md` ligne 94) et aligner le format sur `anchor/journal.mjs`. | Conformité | +1 |
| 6 | Adem (humain, clé hors dépôt) | `blockchain/DEPLOYMENTS.md`, `T_banc_e2e/anchor/` | Déployer `EvidenceAnchor` sur Fuji, ancrer une racine, écrire adresse et hachage de transaction. | Faisabilité, conformité | +1,5 et +0,5 |
| 7 | Titouan | `T_banc_e2e/server/server.mjs` (table des textes) | Ajouter les 7 codes manquants pour que `presentation.test.mjs` repasse à 31/31. | Faisabilité | +0,25 |
| 8 | Titouan / Adem | `server.mjs` ou `context_live/` | Scène héros : un permit qui couvre tout le solde du jeton doit sortir `danger` comme l'illimité (lire le solde, ou traiter « spender inconnu + signature hors chaîne » en danger). | Détection, pitch | +0,5 |
| 9 | Titouan | `livrables/SLIDE_CONFORMITE.md` | 1 207 mots : en extraire la slide réelle (4 colonnes, 60 mots) en tête du fichier, le reste en annexe. | Pitch, conformité | +0,25 |
| 10 | Titouan | `research/titouan/bench/.gitignore` ou `engine/test/cchain.test.mjs` | Les 2 tests du moteur doivent passer sur un clone neuf. | Faisabilité | +0,25 |
| 11 | Adem | `research/demo_reelle/site/addresses.local.json`, `chain/addresses.local.json` | Adresse du `drainer` différente à trois endroits (constat passe 1, non revérifié à l'identique : à contrôler avant la démo). | Pitch | +0,25 |
