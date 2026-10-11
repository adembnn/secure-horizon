# Intention écrite lue par Clef-flash : résultats

Date de la mesure : 11 octobre 2026. Fichiers : `pipeline/intent_clef.mjs`, `pipeline/measure_intent.mjs`, `pipeline/test/intent_clef.test.mjs`.
Sorties brutes : `pipeline/intent_measure.json` (tous les chiffres ci-dessous) et `pipeline/intent_clef_cache.json` (réponses de Clef-flash, indexées par l'empreinte SHA-256 du texte ; aucun texte, aucune clé).

Pour refaire la mesure sans aucun appel : `node --env-file=.env research/titouan/T_banc_e2e/pipeline/measure_intent.mjs --no-calls` depuis la racine.

## 0. Ce qu'il faut retenir

1. Sur les arnaques que notre moteur laisse passer en vert sans intention (298 cas), **le texte libre des cas n'en arrête aucune** : 0 avec les mots-clés, 0 avec Clef-flash. L'intention structurée des mêmes cas en arrête 34.
2. La cause n'est pas le modèle. Ces 34 cas ont tous pour texte le seul mot « virement ». Le montant, le jeton et le nom du destinataire sont dans les champs structurés du cas, pas dans la phrase. Un lecteur de texte, quel qu'il soit, n'a rien à lire.
3. Quand ces détails sont écrits dans la phrase (simulation sans appel, voir 1.3), le texte arrête 34 cas avec les mots-clés et 26 avec Clef-flash.
4. Clef-flash lit mieux le genre que les mots-clés : 67,5 % d'exactitude contre 48,0 %, et deux fois moins d'intentions « non classées » (17,9 % contre 36,6 %). Le taux d'erreur franche reste proche : 14,6 % contre 15,4 %.
5. Clef-flash coûte moins cher aux utilisateurs honnêtes : 23 fausses alertes rouges contre 33 pour les mots-clés, sur 988 opérations honnêtes vertes sans intention.
6. L'invariant tient : 0 contre-exemple sur 21 893 comparaisons.

## 1. L'apport propre de l'intention écrite

### 1.1 Définition et limite

« La demande a l'air normale » = le cas est **vert** quand on appelle `evaluatePlus` **sans aucune intention** (faits de chaîne de `pipeline/measure.mjs`, mode `live` ; détecteur du message collé coupé).

**Limite à dire à chaque fois :** c'est une approximation. Nous n'avons pas fait tourner les alertes d'un portefeuille du commerce sur ces cas. « Vert sans intention dans notre moteur » ne dit pas ce qu'un autre produit affiche.

Population : les 7 779 cas qui ont un texte libre et une étiquette `malveillant` (5 321) ou `benin` (2 458). 942 cas d'autres étiquettes (`fraude_conforme`, `ambigu`) sont rejoués pour l'invariant mais pas comptés ici.

Taille du sous-ensemble : **298 arnaques** et **988 opérations honnêtes** vertes sans intention.

### 1.2 Arnaques arrêtées une fois l'intention fournie (sur 298)

« Arrêtée » = écran rouge.

| | Intention structurée du cas (référence) | Texte libre + mots-clés | Texte libre + Clef-flash |
|---|---|---|---|
| Arrêtées (rouge) | **34** (11,4 %) | **0** | **0** |
| Passées en orange | 28 | 28 | 25 |
| Intention « non classée » | sans objet | 15 | 198 |

D'où viennent ces 298 cas :

| Fichier | Arnaques vertes sans intention | Arrêtées par la référence |
|---|---|---|
| `jury_fuzz_intent.jsonl` | 180 | 34 |
| `jury_fuzz_encoding.jsonl` | 48 | 0 |
| `jury_fuzz_address.jsonl` | 41 | 0 |
| `V2_DEV.jsonl` | 10 | 0 |
| `jury_social.jsonl` | 10 | 0 |
| `jury_fuzz_control.jsonl` | 8 | 0 |
| `jury_defi.jsonl` | 1 | 0 |

Deux constats francs :

- 199 de ces 298 textes font 12 caractères au plus. 180 sont le mot « virement ». Clef-flash donne à « virement » une confiance de 0,50 : sous le seuil, donc « non classée ». Les mots-clés le classent « payer quelqu'un », ce qui est faux pour 67 de ces cas.
- Le sous-ensemble est dominé par un seul fichier de fuzzing. Il ne représente pas des phrases d'utilisateurs réels.

### 1.3 Si l'utilisateur écrit les détails (simulation, sans appel)

Pour chaque cas, on ajoute au texte le montant, le jeton et le nom du destinataire du cas, comme une personne les écrirait : « virement 1 USDC à Paul ». Le code relit ces détails. Le genre reste celui lu sur le texte d'origine : aucune phrase nouvelle n'a été envoyée à Clef-flash.

| Sur les 298 arnaques vertes sans intention | Référence | Mots-clés + détails écrits | Clef-flash + détails écrits |
|---|---|---|---|
| Arrêtées (rouge) | 34 | 34 | 26 |

Clef-flash en arrête 8 de moins parce que « virement » reste non classé : sans genre, la règle « le destinataire nommé n'est pas celui payé » ne s'applique pas. Le montant et le jeton, eux, sont vérifiés même sans genre.
Ce que cette simulation ne dit pas : le genre que Clef-flash donnerait à la phrase longue. Il serait sans doute plus sûr, mais ce n'est pas mesuré.

### 1.4 Le coût pour les opérations honnêtes (sur 988 vertes sans intention)

| Devient… | Référence | Texte + mots-clés | Texte + Clef-flash |
|---|---|---|---|
| Rouge (« ne correspond pas ») | 47 (4,8 %) | 33 (3,3 %) | **23 (2,3 %)** |
| Orange | 50 | 41 | 42 |
| « Pas pu vérifier » rendu par le moteur | 0 | 0 | 0 |
| Intention non classée | sans objet | 439 (44,4 %) | 258 (26,1 %) |
| dont « pas pu vérifier » si la règle du gardien s'applique (des fonds partent ou un droit est accordé) | sans objet | 225 | **63** |

La dernière ligne est le vrai coût d'usage : avec la règle actuelle de `extension/gatekeeper.js`, une intention non comprise affiche « Je n'ai pas pu vérifier » quand des fonds partent ou qu'un droit est accordé. Clef-flash divise ce nombre par 3,6.

### 1.5 Apport par type d'écart

Sur le sous-ensemble vert (298), nombre d'arnaques arrêtées par type d'écart. Un cas peut compter dans deux types.

| Type d'écart | Référence | Texte + mots-clés | Texte + Clef-flash | Mots-clés + détails écrits | Clef-flash + détails écrits |
|---|---|---|---|---|---|
| Montant écrit contre droit accordé (illimité ou supérieur) | 0 | 0 | 0 | 0 | 0 |
| « Sans rien dépenser / me connecter / récupérer » contre droit ou fonds | 0 | 0 | 0 | 0 | 0 |
| Destinataire écrit contre destinataire réel | 16 | 0 | 0 | 16 | 0 |
| Jeton écrit contre jeton réel | 14 | 0 | 0 | 14 | 14 |
| Montant écrit contre montant envoyé (type ajouté) | 12 | 0 | 0 | 12 | 12 |

Les deux premières lignes sont à zéro pour tout le monde. Raison : sans intention, notre moteur met déjà ces demandes en orange ou en rouge (droit accordé à un inconnu, fonds qui partent). Elles ne sont donc pas dans le sous-ensemble vert.

Pour voir ces types, voici le sous-ensemble plus large « pas rouge sans intention » (vert, orange ou non vérifié) : 920 arnaques, 1 835 opérations honnêtes.

| Sur 920 arnaques pas rouges sans intention | Référence | Texte + mots-clés | Texte + Clef-flash | Mots-clés + détails écrits | Clef-flash + détails écrits |
|---|---|---|---|---|---|
| **Arrêtées (rouge)** | **194** | **132** | **137** | 197 | 190 |
| Montant contre droit accordé | 1 | 1 | 1 | 1 | 1 |
| « Sans rien dépenser » contre droit ou fonds | 15 | 19 | 15 | 19 | 15 |
| Destinataire | 92 | 47 | 55 | 67 | 55 |
| Jeton | 38 | 2 | 2 | 38 | 38 |
| Montant contre montant envoyé | 56 | 28 | 28 | 48 | 47 |
| « On m'a demandé de le faire » | 1 | 32 | 35 | 32 | 35 |
| Paiement ou échange dit, droit accordé | 12 | 11 | 10 | 11 | 10 |
| Coût : honnêtes qui deviennent rouges (sur 1 835) | 222 | 134 | 127 | 121 | 118 |

Lecture : sur ce sous-ensemble large, le texte libre rend 68 % (mots-clés) à 71 % (Clef-flash) de l'apport de l'intention structurée, avec 40 % de fausses alertes en moins. L'écart restant vient du jeton et du montant, qui ne sont pas dans les phrases des cas. « Montant contre droit accordé » ne pèse presque rien dans ces fichiers (1 cas).

## 2. Le genre : mots-clés contre Clef-flash

2 366 textes uniques, tirés des 8 721 cas qui ont un texte libre (V2_DEV : 1 982 textes ; fichiers `jury_*` : 384). Vérité = le genre du cas. 85 textes portent plusieurs genres selon les cas (« virement », « send », « dépôt ») : la réponse est comptée juste si elle est l'un d'eux.

| | Mots-clés | Clef-flash (seuil 0,6) |
|---|---|---|
| Genre exact | 1 135 (48,0 %) | **1 597 (67,5 %)** |
| Genre faux | 365 (15,4 %) | 345 (14,6 %) |
| Non classée | 866 (36,6 %) | 424 (17,9 %) |
| Exact parmi les classées | 75,7 % | 82,2 % |
| Replis sur les mots-clés | sans objet | 0 |

Pourquoi Clef-flash ne classe pas : confiance sous le seuil (228), option « aucune » (181), texte jugé trop vague (15).

### Matrice de confusion, Clef-flash (2 281 textes à un seul genre)

Lignes = genre du cas. Colonnes = genre rendu.

| Vérité \ Rendu | payer | vers mon compte | acheter / échanger | se connecter | on m'a demandé | non classée |
|---|---|---|---|---|---|---|
| pay_someone (618) | **386** | 4 | 2 | 0 | 91 | 135 |
| send_to_my_account (365) | 1 | **229** | 22 | 0 | 54 | 59 |
| buy_or_swap (989) | 2 | 13 | **855** | 3 | 5 | 111 |
| connect_or_accept_offer (281) | 1 | 2 | 112 | **63** | 4 | 99 |
| asked_by_someone (28) | 8 | 0 | 0 | 0 | **18** | 2 |

### Matrice de confusion, mots-clés

| Vérité \ Rendu | payer | vers mon compte | acheter / échanger | se connecter | on m'a demandé | non classée |
|---|---|---|---|---|---|---|
| pay_someone (618) | **415** | 2 | 3 | 3 | 90 | 105 |
| send_to_my_account (365) | 116 | **59** | 6 | 15 | 43 | 126 |
| buy_or_swap (989) | 13 | 3 | **563** | 5 | 0 | 405 |
| connect_or_accept_offer (281) | 1 | 14 | 23 | **54** | 3 | 186 |
| asked_by_someone (28) | 8 | 0 | 0 | 0 | **13** | 7 |

Deux faiblesses de Clef-flash à connaître :

- **« se connecter » rendu « acheter / échanger » : 112 textes.** Ce sont surtout des phrases comme « autoriser tel site à lister mes NFT » ou « mettre en vente mon NFT ». Les cas les rangent dans « se connecter ou accepter une offre ». Mon critère de question range « autoriser une application » et « mettre en vente » dans « acheter / échanger ». C'est un désaccord de convention que j'ai créé en rédigeant le critère. Il va dans le sens le moins strict. Je n'ai pas pu le corriger et remesurer : il aurait fallu 2 366 nouveaux appels et le plafond ne le permet pas.
- **« payer » rendu « on m'a demandé » : 91 textes.** Ce sont des phrases du type « on m'a dit de payer… pour débloquer mon compte », que les cas étiquettent « payer ». Ici le modèle suit la règle voulue : « quelqu'un me l'a demandé » passe avant tout. Ce choix durcit le verdict.

### Effet du seuil (Clef-flash, calculé hors ligne sur les mêmes réponses)

| Seuil | Exact | Faux | Non classée |
|---|---|---|---|
| 0,4 | 68,3 % | 16,7 % | 15,0 % |
| 0,5 | 69,0 % | 16,1 % | 14,9 % |
| **0,6 (défaut)** | 67,5 % | 14,6 % | 17,9 % |
| 0,7 | 64,6 % | 13,6 % | 21,9 % |
| 0,8 | 59,6 % | 12,7 % | 27,7 % |
| 0,9 | 43,3 % | 11,3 % | 45,4 % |

Le seuil ne fait pas tomber les erreurs franches : à 0,9 il en reste 11,3 %. Le modèle se trompe avec assurance sur les conventions citées plus haut. Le seuil est réglable par `HOLDUP_INTENT_THRESHOLD`.

### Effet des deux règles ajoutées au choix du modèle

| Variante | Exact | Faux | Non classée |
|---|---|---|---|
| Règles par défaut | 67,5 % | 14,6 % | 17,9 % |
| Sans la règle « on m'a demandé passe avant » | 67,5 % | 13,5 % | 19,0 % |
| Sans la règle « trop vague = non classée » | 68,1 % | 14,6 % | 17,3 % |
| Choix du modèle seul | 68,3 % | 13,5 % | 18,2 % |

Les deux règles changent peu l'exactitude. Elles sont gardées parce qu'elles vont dans le sens strict.

## 3. Montant, jeton, adresse : lus par le code

Le modèle ne lit jamais ces champs. Le code est le même pour les deux colonnes : un seul chiffre.

| | Cas où le champ existe | Lu juste | Pas lu | Lu différent |
|---|---|---|---|---|
| Montant, tous les cas | 2 760 | 1 113 (40,3 %) | 1 588 | 59 |
| Montant, quand il est dans la phrase | 1 155 | **1 113 (96,4 %)** | 2 | 40 |
| Jeton, tous les cas | 3 107 | 1 547 (49,8 %) | 1 406 | 154 |
| Jeton, quand il est dans la phrase | 1 664 | **1 542 (92,7 %)** | 17 | 105 |

À lire avec ces réserves :

- Dans 58 % des cas, le montant du cas n'est pas dans la phrase du tout. C'est la limite principale de la voie « texte », déjà vue en 1.2.
- Les 40 montants « lus différents » sont presque tous des cas dont le champ structuré est une troncature de la phrase (« 32 » pour « Échanger 32.82 AVAX »). Le code lit 32.82. Un cas écrit « 2,500 USDC » : le code lit 2 500 (lecture la plus grande, voir limites).
- Les 105 jetons « lus différents » sont surtout des mises en vente de NFT : le cas donne le nom de la collection, le code lit le jeton du prix (ETH, AVAX).
- Sur 844 cas sans montant structuré, le code lit quand même un montant dans 153 phrases.
- Le modèle dit voir un montant que le code n'a pas su lire dans 6 textes sur 2 366.
- **Adresse : non mesurée.** Aucun texte des cas ne contient d'adresse. Le code est testé à l'unité seulement.
- Le code a été réglé en regardant ces mêmes textes. Les chiffres « dans la phrase » sont donc optimistes.

Le nom d'un contact du carnet est aussi reconnu par le code quand il est écrit en toutes lettres (sans casse ni accents). Ce n'était pas demandé ; c'est ce qui permet la vérification du destinataire.

## 4. Latence, tokens, coût

| | Clef-flash |
|---|---|
| Appels faits pour tout ce travail | **2 370** sur un plafond de 4 000 |
| Appels réussis | 2 366 sur 2 366 textes, 0 échec, 0 repli |
| Latence p50 / p95 / max | 367 ms / 1 147 ms / 5 551 ms |
| Tokens en entrée | 2 065 869, soit 873 par appel |
| Tokens en sortie | 0 |
| Coût de la mesure | 0,079 USD (tarif public 0,038 USD par million de tokens en entrée) |
| Coût pour 1 000 intentions | 0,033 USD |

Un appel pose cinq questions (un choix, quatre oui / non). La latence est mesurée depuis ce poste, 6 appels en parallèle.

## 5. Tous les cas (pour mémoire, ce n'est plus le chiffre principal)

7 779 cas étiquetés. Sans intention : 920 arnaques ratées, 623 fausses alertes.

| | Référence | Texte + mots-clés | Texte + Clef-flash |
|---|---|---|---|
| Arnaques ratées (sur 5 321) | 752 | 810 | 804 |
| Fausses alertes (sur 2 458) | 768 | 700 | **645** |
| Verdicts plus bas qu'avec aucune intention | 130 | 93 | 145 |
| dont arnaques | 49 | 27 | 26 |

Aucun échantillon : tous les cas avec texte sont rejoués, parce qu'un appel par texte unique suffit.

Une intention classée peut baisser un verdict : c'est voulu (elle explique une demande qui sinon inquiète). Mais 26 arnaques rouges sans intention ne le sont plus avec le texte lu par Clef-flash, et 49 avec l'intention structurée. C'est un défaut du comparateur et des détecteurs, pas du classement. Il est à traiter à part.

## 6. Invariant

Règle : avec une intention « non classée », le verdict n'est jamais plus bas que sans intention.

| | Comparaisons | Contre-exemples |
|---|---|---|
| Chaque cas, texte forcé en « non classée » (détails gardés) | 8 721 | 0 |
| Chaque cas, intention non classée sans aucun détail | 8 721 | 0 |
| Intentions réellement non classées par les mots-clés | 2 274 | 0 |
| Intentions réellement non classées par Clef-flash | 2 177 | 0 |
| **Total** | **21 893** | **0** |

La règle est tenue par construction : `evaluateWithIntent` garde le plus strict de (verdict sans intention, verdict avec les détails extraits). Le moteur seul, avant ce garde-fou, n'a jamais rendu plus bas non plus sur ces cas (0 sur 17 442).

## 7. Tests

`node --test research/titouan/T_banc_e2e/pipeline/test/intent_clef.test.mjs` : 13 tests, 13 réussis, aucun appel réseau (`fetchImpl` simulé).
Couverts : forme de la requête, texte seulement dans `state`, seuil et variable d'environnement, « aucune » et option inconnue, règle « on m'a demandé », repli (clés absentes, HTTP 500, délai, réseau), jeton jamais présent dans le résultat, virgule décimale, milliers, extraction, verdict qui ne peut que monter.

## 8. Ce qui n'est pas mesuré

- Aucun portefeuille du commerce n'a été lancé sur ces cas. Le sous-ensemble « vert sans intention » est celui de notre moteur.
- `V2_TEST.jsonl` n'a été ni lu ni exécuté. Tous les chiffres viennent du jeu de réglage et des fichiers `jury_*`. Les règles de décision et le code d'extraction ont été écrits en regardant ces mêmes données : ce ne sont pas des chiffres en aveugle.
- Les phrases des cas sont synthétiques. Beaucoup sont un seul mot. Aucune phrase d'utilisateur réel.
- Le genre de Clef-flash sur une phrase avec détails écrits (1.3) n'est pas mesuré.
- Le modèle Clef (le grand) n'a pas été essayé.
- L'adresse écrite dans le texte, le jeton reçu (« contre du DAI ») et les montants en toutes lettres (« mille ») ne sont pas mesurés ou pas lus.
- La latence n'est pas mesurée depuis l'extension ni sous charge.
- Le rejeu dépend de l'état du dépôt à 11 oct. : `detectors_adem/` et `extension/intent_text.js` étaient en cours de modification par d'autres pendant la mesure.

## 9. Limites connues du code

- « 1,000 » est lu 1 000 (lecture la plus grande), comme dans `detectors_adem/intent_guard.mjs`. Un Français qui écrit « 1,000 » pour 1 obtient un plafond trop haut : moins de fausses alertes, une vérification de montant plus faible.
- Un nombre seul (« wrap 1465 ») n'est pas lu comme un montant. Il l'est seulement à côté d'un jeton nommé.
- Un mot en capitales inconnu peut être pris pour un jeton quand aucun montant ne tranche.
- `classifyIntent` n'est branché nulle part : ni dans `extension/`, ni dans `server/`. C'est une bibliothèque et une mesure.
- Le repli par mots-clés charge `extension/intent_text.js` ; si ce fichier ne se charge pas, il prend `engine/vendor/providers/keyword.ts`.

## 10. Correspondance avec les référentiels

NIST CSF 2.0 : DE.AE-02 (analyse des événements), DE.CM-09. OWASP Agentic : ASI01 (détournement d'objectif : l'intention dite est vérifiée). MITRE ATLAS : AML.T0051 (le texte de l'utilisateur est une donnée, jamais une instruction). MITRE D3FEND : D3-UBA.
