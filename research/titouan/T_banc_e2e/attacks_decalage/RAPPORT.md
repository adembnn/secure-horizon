# Comparateur : monotonie et cas de décalage

Date : 11 octobre 2026. Décision D-009 : le comparateur est le coeur. Racine : `research/titouan/T_banc_e2e`.
Aucun commit. Aucun secret. Aucun appel réseau. `V2_TEST` et `attacks/TEST.jsonl` n'ont pas été lus.

## En bref

1. **Monotonie.** Le noyau (moteur, comparateur, politique) ne baissait déjà jamais un verdict : 0 violation sur 6 442 cas. Le trou est dans la couche des détecteurs, qui lit le type d'intention. Sur la chaîne avec détecteurs, avant correction : 5 cas baissés par le type seul, 25 baissés par les détails (4 arnaques perdues par le type seul). Après la garde `monotoneGuard` : 0. Un test automatisé le garantit : `engine/test/monotonie.test.mjs`.
2. **Décalage.** 410 cas fabriqués localement (394 dans 6 familles, 16 de limites connues). Avec l'intention honnête détaillée, avant correction : 68 % des écarts signalés. Après : 100 % (228 sur 228), 0 fausse alerte rouge sur 166 jumeaux bénins. Avec le type seul : 56 %. La différence entre 56 % et 100 % est la valeur des détails (jeton, montant).
3. **Règles ajoutées** dans `run/policy.mjs` : F31 (droit plus large que le montant dit), F32 (jeton différent de celui dit), F33 (montant supérieur à celui dit pour un échange). Générales, sans adresse ni identifiant de cas. `run/check_nohardcode.mjs` passe.
4. **Tests gardés** : moteur 453 sur 453 (447 plus 6 nouveaux), serveur 33 sur 33, présentation 31 sur 31, `check_nohardcode` OK, `run/test_policy.mjs` tous OK, `pipeline/test` 13 sur 13.

## Tâche 1 : l'invariant « plus d'information ne baisse jamais un verdict »

### Définition

Pour chaque cas des jeux DEV (`attacks/DEV.jsonl`, 385), public (`attacks_public/PUBLIC.jsonl`, 130 exécutables) et V2_DEV (`redteam/V2_DEV_norm.jsonl`, 5 927), trois niveaux :

- `none` : aucune intention.
- `type` : le type d'intention seul (`{ kind, declaredAt }`), ce que l'extension envoie.
- `full` : l'intention détaillée du cas (jeton, montant, destinataire, texte).

Violation : un niveau plus bas que celui d'un bras qui a moins d'information (`none` > `type`, `type` > `full`, `none` > `full`). L'échelle est ok < warn < critical.

### Mesure (6 442 cas, 3 245 arnaques, 2 131 bénins)

Commande : `node run/mesure_monotonie.mjs [--detectors] [--guard] [--premise-cap]`. Sortie complète : `attacks_decalage/MONOTONIE_MESURE.txt`.

| Chaîne | none>type | type>full | none>full | Arnaques perdues par le type seul | Rate : none / type / full | Fausses alertes : none / type / full |
|---|---|---|---|---|---|---|
| Noyau (moteur, comparateur, politique) | 0 | 0 | 0 | 0 | 421 / 188 / 177 | 0 / 21 / 22 |
| Avec détecteurs, sans garde | 5 | 25 | 28 | 4 | 71 / 46 / 40 | 15 / 26 / 27 |
| Avec détecteurs et garde | 0 | 0 | 0 | 0 | 71 / 42 / 38 | 15 / 26 / 27 |

« Rate » = arnaques sans écran rouge. « Fausses alertes » = bénins en rouge.

### Cause

Le comparateur et la politique ne peuvent que monter : `level = worst(plancher, comparateur)`. Le défaut vient d'une couche posée après, `detectors_adem/` :

- `intent_guard` lit `intent.kind`. Sans intention il déclenche `kind_missing_unvouched_recipient` et `new_recipient_large_share` en rouge. Avec un type seul (sans destinataire ni libellé) ces drapeaux disparaissent : le cas passe de rouge à orange ou vert.
- `sig_rights` ne lève `signed_right_not_intended` que si le type n'est pas un échange. Donner « échanger » sans détail éteint donc l'alerte sur un droit signé vers un inconnu.

Donner le type sans les détails a ainsi supprimé l'alerte que « rien » aurait gardée.

### Correctif

`monotoneGuard(niveauAvecIntention, niveauSansIntention)` dans `run/policy.mjs` : le résultat n'est jamais sous le niveau sans intention. La chaîne de mesure (`run/arms.mjs`) l'applique en cascade : `type >= none`, `full >= type`. Il ne crée jamais de `ok` (`unknown` reste entre ok et warn).

Le noyau n'avait pas besoin de correction. Le trou est dans la couche posée après lui (`detectors_adem/`, `pipeline/evaluate_plus.mjs`), que je ne modifie pas. **Le patch à appliquer côté pipeline est en bas de ce rapport.**

### Test

`engine/test/monotonie.test.mjs` (6 tests, environ 35 secondes) :

1. Les jeux mesurés sont DEV, public, V2_DEV, jamais un jeu scellé.
2. Propriétés de `monotoneGuard`.
3. Noyau : 0 violation sur les trois jeux.
4. Chaîne avec détecteurs, intention absente plafonnée à orange, garde : 0 violation.
5. Chaîne avec détecteurs, intention absente en rouge, garde : 0 violation.
6. Serveur livré (`evaluate`) : sans intention <= type seul <= type plus détails, sur un échantillon de 300 cas environ.

### Écart avec le chiffre de 318

Je ne reproduis pas « 318 arnaques de plus ». Mon banc ne mesure pas le même objet : c'est la chaîne du banc (`check_plus`) avec trois bras, pas `check_product --with-intent --with-detectors`. Sur les fichiers `jury_*` seuls, la chaîne avec détecteurs donne 47 cas baissés par le type seul et 2 arnaques perdues. Je n'ai pas pu relancer la mesure produit : `context_live/server_integration.diff` ne s'applique plus à `server/server.mjs` (« patch failed at 519 »), et les détecteurs ont changé pendant mon travail (05h37 : `intent_guard`, `forwarded_value`). Le mécanisme est le même, l'ampleur exacte reste à remesurer par ton agent avec le patch ci-dessous.

## Tâche 2 : cas de décalage

### Les cas

Générateur : `attacks_decalage/gen_decalage.mjs` (graine fixe). Fichier : `attacks_decalage/DECALAGE.jsonl`. Les transactions sont encodées par l'encodeur ABI du moteur. Les messages typés (Permit, Permit2, SIWE) sont construits dans le générateur. Les adresses viennent d'un hachage. Les adresses de jetons sont les adresses publiques canoniques (Ethereum, et USDC et WAVAX d'Avalanche pour 3 variantes).

| Famille | Écarts | Jumeaux bénins | Ce que c'est |
|---|---|---|---|
| `swap_droit_illimite` | 55 | 36 | « échanger N USDC » et un droit illimité (ou 10 fois N) : vers un inconnu, vers un routeur connu, vers Permit2, par `approve`, `increaseAllowance`, Permit, Permit2, lot de deux appels |
| `swap_jeton_different` | 38 | 27 | vend un autre jeton, reçoit un autre jeton, droit sur un autre jeton, monnaie native au lieu du jeton |
| `swap_destinataire_tiers` | 31 | 24 | la sortie de l'échange va à un tiers (V2, V3, ETH, sortie exacte, lot) |
| `recevoir_sortie` | 35 | 24 | « recevoir » mais des fonds sortent ou un droit est donné |
| `connexion_droit_signe` | 31 | 24 | « me connecter » mais on signe un permit, un Permit2, un `approve` ou un `setApprovalForAll` |
| `montant_plus_grand` | 38 | 31 | paiement ou échange d'un montant plus grand que dit (virgule décimale, milliers avec espace, juste au-dessus de la tolérance) |
| `limites_connues` | 16 | 0 | à part, hors total : ce que la règle ne peut pas conclure |

Total des familles principales : 228 écarts et 166 jumeaux, soit 394 cas (plus 16 de limites). Chaque cas porte `ideal_severity` : `critical`, `warn` (banal pour un portefeuille, par exemple un droit illimité vers un routeur connu) ou `ok` (jumeau bénin).

Dans 48 cas j'ai changé de forme après avoir écrit les règles (autre réseau, `increaseAllowance`, autre écriture du montant, droit vers Permit2). Ils ne sont pas à l'abri : même auteur. J'ai aussi écarté mes propres variantes par Multicall3, qui étaient fausses : le contrat multicall est alors l'expéditeur des sous-appels, donc ce ne sont pas des effets de l'utilisateur.

### Les bras

Commande : `node attacks_decalage/mesure_decalage.mjs`.

| Bras | Contenu |
|---|---|
| `plancher` | moteur et politique, sans intention, sans détecteurs |
| `sans` | aucune intention, avec les détecteurs |
| `catalogue` | le TYPE seul (pay, receive, swap...), comme l'extension le propose, avec détecteurs et garde |
| `honnete` | l'intention honnête détaillée (type, jeton, montant, jeton reçu, destinataire), avec détecteurs et garde |
| `honnete_noyau` | idem sans détecteurs (le comparateur et la politique seuls) |

Je lis « intention du catalogue » comme le choix de type que le catalogue de l'extension offre. Si tu voulais dire autre chose, le bras `catalogue` est une ligne dans `mesure_decalage.mjs`.

Signalé = niveau orange ou rouge (c'est le « ne correspond pas »). Rouge sur gravité critique = part des cas dont la gravité idéale est critique et qui sont en rouge. Fausse alerte = jumeau bénin en rouge. Orange bénin = jumeau bénin en orange. Intervalles de Wilson à 95 % entre crochets. Les bénins n'atteignent jamais le vert par un chemin opaque : un appel illisible reste orange.

### Résultats : signalés (orange ou rouge), avant et après

| Famille | Écarts / jumeaux | plancher | sans intention | catalogue | honnête AVANT | honnête APRÈS | Fausses alertes rouges après | Oranges bénins après |
|---|---|---|---|---|---|---|---|---|
| **toutes familles** | 228 / 166 | 112/228 (49 % [43;56]) | 124/228 (54 % [48;61]) | 128/228 (56 % [50;62]) | 154/228 (68 % [61;73]) | **228/228 (100 % [98;100])** | 0/166 (0 % [0;2]) | 16/166 (10 % [6;15]) |
| swap_droit_illimite | 55 / 36 | 31/55 (56 % [43;69]) | 31/55 (56 % [43;69]) | 31/55 (56 % [43;69]) | 31/55 (56 % [43;69]) | 55/55 (100 % [93;100]) | 0/36 (0 % [0;10]) | 0/36 |
| swap_jeton_different | 38 / 27 | 0/38 (0 % [0;9]) | 0/38 | 0/38 | 0/38 (0 % [0;9]) | 38/38 (100 % [91;100]) | 0/27 (0 % [0;12]) | 0/27 |
| swap_destinataire_tiers | 31 / 24 | 31/31 (100 % [89;100]) | 31/31 | 31/31 | 31/31 | 31/31 (100 % [89;100]) | 0/24 (0 % [0;14]) | 0/24 |
| recevoir_sortie | 35 / 24 | 23/35 (66 % [49;79]) | 35/35 (100 % [90;100]) | 35/35 | 35/35 | 35/35 (100 % [90;100]) | 0/24 (0 % [0;14]) | 8/24 (33 % [18;53]) |
| connexion_droit_signe | 31 / 24 | 27/31 (87 % [71;95]) | 27/31 (87 % [71;95]) | 31/31 (100 % [89;100]) | 31/31 | 31/31 (100 % [89;100]) | 0/24 (0 % [0;14]) | 8/24 (33 % [18;53]) |
| montant_plus_grand | 38 / 31 | 0/38 (0 % [0;9]) | 0/38 | 0/38 | 26/38 (68 % [53;81]) | 38/38 (100 % [91;100]) | 0/31 (0 % [0;11]) | 0/31 |
| limites_connues (hors total) | 16 / 0 | 4/16 | 4/16 | 4/16 | 4/16 (25 % [10;49]) | 8/16 (50 % [28;72]) | n/a | n/a |

### Résultats : rouge sur les cas de gravité idéale critique

| Famille | plancher | sans | catalogue | honnête AVANT | honnête APRÈS |
|---|---|---|---|---|---|
| toutes familles | 97/192 (51 %) | 104/192 (54 %) | 116/192 (60 %) | 142/192 (74 % [67;80]) | **192/192 (100 % [98;100])** |
| swap_droit_illimite | 31/31 | 31/31 | 31/31 | 31/31 | 31/31 |
| swap_jeton_different | 0/38 | 0/38 | 0/38 | 0/38 | 38/38 (100 % [91;100]) |
| swap_destinataire_tiers | 31/31 | 31/31 | 31/31 | 31/31 | 31/31 |
| recevoir_sortie | 19/31 (61 %) | 19/31 | 31/31 (100 %) | 31/31 | 31/31 |
| connexion_droit_signe | 16/23 (70 %) | 23/23 | 23/23 | 23/23 | 23/23 |
| montant_plus_grand | 0/38 | 0/38 | 0/38 | 26/38 (68 %) | 38/38 (100 % [91;100]) |

Tableaux complets (les 5 bras, par famille) : `attacks_decalage/avant.md`, `attacks_decalage/apres.md` (et les `.json`).

### Ce qui était faible, ce qui a été corrigé

Faibles avant (bras honnête) :

- **Jeton différent : 0 sur 38.** Rien ne comparait le jeton dit au jeton engagé pour un échange.
- **Montant plus grand : 26 sur 38.** Le comparateur ne vérifie le montant que pour un paiement, pas pour un échange.
- **Droit illimité vers un routeur connu : 0 sur 24 (les cas de gravité `warn`).** La politique F16 retire ce signal pour un protocole connu, ce qui est juste sans intention, mais ne correspond plus à « échanger 50 ».
- Le type seul ne peut rien sur ces trois familles : il manque le jeton et le montant.

Correctif, une règle générale par famille, dans `run/policy.mjs`, interrupteurs F31 à F33 dans `engine/src/fixes.mjs` (liste `KEPT`) :

- **F31 `approval_exceeds_intent`.** Un droit de dépense (approve, increaseAllowance, permit, Permit2) sans limite, ou plus grand que le montant dit plus 1 %, sur le jeton dit. Bénéficiaire de la liste connue : orange. Sinon : rouge.
- **F32 `token_differs_from_intent`.** Un autre jeton est vendu ou reçoit un droit, ou le jeton reçu n'est pas celui annoncé. Un jeton reçu non identifié alors que le jeton annoncé est connu compte aussi comme écart. Un symbole inconnu côté donné ne conclut jamais. Les frais en monnaie native versés à un protocole connu ne comptent pas comme « un autre jeton ».
- **F33 `amount_exceeded` pour un échange.** Plus que le montant dit part du compte (tolérance 1 %, lecture la plus large de « 1,000 » ou « 1 000 »).

Ces règles ne lisent que des détails d'intention. Sans détail, elles ne font rien : c'est ce qui préserve la monotonie.

Première version, défaut trouvé et corrigé : sur les jeux existants, F32 a ajouté 32 fausses alertes. Cause : dans les jeux V2, pour un échange, `token` est parfois le jeton acheté et non le jeton vendu (« acheter 821 X avec Y »), et les ponts versent des frais en monnaie native. Correction : mode strict seulement si le jeton reçu est annoncé à part ; sinon on ne conclut que si tous les jetons engagés sont identifiés et que le jeton dit n'apparaît nulle part ; frais natifs vers un protocole connu ignorés.

### Régression sur les jeux existants

| Mesure | Avant F31 à F33 | Après |
|---|---|---|
| Noyau, bras honnête : arnaques ratées / fausses alertes | 181 / 21 | 177 / 22 |
| `check_plus` complet (V2_DEV, DEV, public ; 3 254 arnaques, 2 136 bénins) | 51 ratées, 26 fausses alertes, 476 bénins en orange | 49 ratées, 27 fausses alertes, 490 bénins en orange |

Bilan net : 2 arnaques de plus rattrapées, 1 fausse alerte de plus, 14 bénins de plus en orange. La fausse alerte est une donnée incohérente du jeu (intention « 0,04 AVAX » pour une phrase « Swap 1124 AVAX »). Les 14 oranges sont des échanges bénins avec droit illimité vers un routeur connu : c'est le comportement voulu par D-009 (banal pour un portefeuille, différent de « échanger 50 »).

### Limites connues (famille à part)

- Un montant écrit en lettres (« cinquante ») ne se compare pas : 0 sur 4.
- Un droit juste sous la tolérance de 1 % n'est pas signalé : 0 sur 4.
- Un droit exact vers un contrat inconnu reste orange (plancher) : 4 sur 4 en orange.
- Un jeton reçu non identifié alors qu'un jeton connu était annoncé : rattrapé après correction (4 sur 4).

## Autres modifications du serveur (`server/server.mjs`)

- `toIntent` accepte le choix `swap` (type `buy_or_swap`) et `intent_details` (jeton, montant, jeton reçu, libellé, adresse du destinataire), nettoyés et bornés. Sans détail, rien ne change.
- `REASON_FICHE` : `approval_exceeds_intent` vers F01, `token_differs_from_intent` vers un texte de secours `jeton_different` (4 lignes de 12 mots au plus).
- **Correction d'affichage.** Au niveau `info`, la fiche F01 s'affichait dès qu'un droit existait (« Un site peut dépenser tous tes jetons sans limite » pour un droit exact de 50 USDC). `present()` ignore maintenant la fiche d'alerte au niveau `info`. Les 31 tests de présentation et les 33 tests du serveur passent. À reprendre côté `extension_standalone` et `webdemo`, qui copient ce bloc.
- Aucun niveau `ok` n'est produit. Le plus bas du produit reste `info`, et un cas opaque reste `warn` (invariant existant).

## À appliquer côté pipeline, extension et détecteurs (non touchés)

1. **`pipeline/evaluate_plus.mjs`**, à la fin du calcul du niveau final, appeler la garde. Esquisse :
   ```js
   import { monotoneGuard } from '../run/policy.mjs';
   // niveau avec l'intention reçue
   let level = /* chaîne actuelle */;
   if (intent) {
     const sans = await runSansIntention(body, local, options);          // même chaîne, intention nulle
     const type = intent.rich ? await runTypeSeul(body, local, options) : sans; // même chaîne, { kind, declaredAt }
     level = monotoneGuard(monotoneGuard(level, type), sans);
   }
   ```
   C'est ce que fait `run/arms.mjs` (`runArm` avec `guard: true`).
2. **Extension** : ajouter le choix « échanger » (`swap`) et envoyer `intent_details` (jeton, montant, jeton reçu). Sans cela, le produit reste au bras `catalogue` (56 % de rappel sur ces écarts) et les règles F31 à F33 ne servent pas.
3. **`pipeline/evaluate_plus.mjs`** : son `toIntent` ne connaît pas `swap` ni les détails ; `body.intent` objet est accepté, mais pas `intent_details`.
4. **Détecteurs** : `intent_guard` et `sig_rights` lisent le type d'intention pour éteindre une alerte. Ils devraient lire l'absence d'information, pas le type.

## Rejouer

```
cd research/titouan/T_banc_e2e
node attacks_decalage/gen_decalage.mjs                         # régénère DECALAGE.jsonl (410 cas)
node attacks_decalage/mesure_decalage.mjs --md=attacks_decalage/apres.md --json=attacks_decalage/apres.json --fails
POLICY_FIXES=F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12,F13,F14,F15,F16,F17,F18,F19,F21,F22,F23,F24,F25,F26,F27,F28,F29,F30 \
  node attacks_decalage/mesure_decalage.mjs --md=attacks_decalage/avant.md --json=attacks_decalage/avant.json   # sans F31 à F33
node run/mesure_monotonie.mjs [--detectors] [--guard] [--premise-cap] [--list]
cd engine && node --test test/*.test.mjs                       # 453 tests dont monotonie.test.mjs
cd ../server && node test/server.test.mjs && node test/presentation.test.mjs
cd .. && node run/check_nohardcode.mjs && node run/test_policy.mjs
node redteam/check_plus.mjs redteam/V2_DEV_norm.jsonl attacks/DEV.jsonl attacks_public/PUBLIC.jsonl --quiet
```

## Fichiers

Créés : `run/arms.mjs`, `run/mesure_monotonie.mjs`, `engine/test/monotonie.test.mjs`, `attacks_decalage/{gen_decalage.mjs, mesure_decalage.mjs, DECALAGE.jsonl, avant.md, avant.json, apres.md, apres.json, MONOTONIE_MESURE.txt, RAPPORT.md}`.
Modifiés : `run/policy.mjs` (F31 à F33, `monotoneGuard`), `engine/src/fixes.mjs` (liste `KEPT`), `server/server.mjs` (`toIntent`, tables de textes, `present`).
Non modifiés : `engine/vendor/compare.ts` (le comparateur d'Adem reste intact, les nouvelles règles sont dans la politique), `extension/`, `extension_standalone/`, `detectors_adem/`, `blockchain/`, `pipeline/`, `redteam/`.

## Limites

- **Les cas et les règles ont le même auteur.** Le 100 % ne prouve pas la couverture. Les 48 variantes difficiles et les 16 limites connues réduisent le risque, ne le suppriment pas. Un jeu écrit par un agent aveugle reste à faire.
- **Cas fabriqués.** Aucun portefeuille réel, aucune simulation sur chaîne. Les effets sont ceux que décode le moteur.
- **Intention structurée.** Les bras `honnete` reçoivent jeton, montant et jeton reçu déjà extraits. L'extraction depuis du texte libre est une autre tâche (`intention_texte/`) : sa précision plafonne ces résultats.
- **Sens de `token` dans un échange.** Le jeu V2 mélange jeton vendu et jeton acheté. Mes règles sont prudentes dans ce cas (pas de conclusion). Un champ explicite jeton donné et jeton reçu les rendrait plus fortes.
- **Chiffres dépendants des détecteurs.** Les détecteurs ont changé à 05h37 pendant le travail. Les chiffres de la chaîne avec détecteurs valent pour cet état. La garde reste vraie quel que soit l'état, et le test le vérifie.
- **318 non reproduit** (voir plus haut).
- **Orange sur bénins** (33 % sur `recevoir_sortie` et `connexion_droit_signe`) : appels illisibles (`claim()`) et messages typés inconnus. C'est voulu (un illisible n'est jamais vert), mais c'est de la fatigue à mesurer côté produit.
- Un seul processus `node` à la fois a été lancé.
