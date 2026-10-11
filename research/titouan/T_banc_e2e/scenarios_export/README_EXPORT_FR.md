# Export de scénarios Hold up (pour l'interface de scénarios)

6 456 scénarios SYNTHÉTIQUES, tous non scellés, dans un format unique. Aucune clé, aucune signature, aucune donnée réelle.

## Fichiers

| Fichier | Contenu |
|---|---|
| `scenarios.json` | Tableau de 6 456 objets (un par ligne, JSON compact). 26,8 Mo. |
| `gallery_120.json` | 120 scénarios choisis pour la diversité (mêmes objets + `galerie_rang`, `galerie_motif`). |
| `index.json` | Comptes par famille, source, chaîne (dont Avalanche 43114 / 43113), niveau attendu, étiquette ; résultats du moteur ; liste des cas inutilisables ; SHA-256. |
| `conversations.json` | Les 8 scénarios de conversation d'escroc (`attacks/scenarios.json`), champ `conversation` des scénarios qui y renvoient. |
| `EXPORT_SHA256.txt` | SHA-256 des 4 fichiers + empreinte de la version du moteur utilisée. |
| `build_export.mjs`, `titres_fr.mjs` | Le script qui régénère tout, et la table des titres. |

## Régénérer (à l'octet près)

```
node --no-warnings scenarios_export/build_export.mjs           # depuis T_banc_e2e/ ; écrit les 5 fichiers (environ 10 s)
node --no-warnings scenarios_export/build_export.mjs --check   # régénère en mémoire et compare aux fichiers écrits
```

Node 22 ou plus (24 testé), aucun paquet, aucun réseau, un seul processus. Graine fixe 20261011 (galerie), tri stable (catalogue, public, v2, puis ordre du fichier source), `Date.now()` figé pendant l'évaluation du moteur. Le script lit uniquement `attacks/DEV.jsonl`, `attacks_public/PUBLIC.jsonl`, `blind_adem/v2/V2_DEV.jsonl` et `attacks/scenarios.json`. Il refuse tout fichier dont le nom contient TEST ou `cases.jsonl` (= DEV + TEST, 589 = 385 + 204) et tout enregistrement marqué `split: TEST`.

Les verdicts du moteur dépendent de la version du moteur : si `engine/`, `run/policy.mjs` ou `server/server.mjs` changent, le hash `moteur.version_sha256` change et les verdicts peuvent changer. Les champs hors verdict restent identiques. Le script s'arrête si le moteur change pendant sa propre exécution.

## Schéma d'un scénario

| Champ | Sens |
|---|---|
| `id`, `source` | Identifiant d'origine, et `catalogue` (385), `public` (144) ou `v2` (5 927). Le couple (source, id) est unique. |
| `famille`, `sous_famille` | Classement d'origine (90 familles, 408 sous-familles). |
| `titre` | Une phrase en français simple (« Un faux airdrop te demande de signer un permit »). Générée par règles, voir limites. |
| `description` | La raison écrite par l'auteur du cas (tronquée à environ 320 caractères). Souvent technique. |
| `intention` | `phrase` (ce que la personne croit ou veut faire), `type`, `texte_declare` (dans la langue d'origine), `message_recu` (message d'escroc collé), `demande_par`, `jeton`, `montant`. |
| `payload` | `{ method, params }` : la requête de portefeuille telle que le moteur la reçoit. Copie fidèle. |
| `contexte` | Le champ `context` d'origine (carnet d'adresses, protocoles connus, historique, faits sur la contrepartie, solde…) ou `null`. La forme varie selon la source. |
| `etiquette`, `etiquette_code` | malveillant, bénin, ambigu, fraude conforme (`fraude_conforme` : transaction correcte envoyée par une victime manipulée). |
| `niveau_attendu`, `niveau_ideal` | `ok`, `warn` ou `critical`. |
| `chaine` | `{ id, nom, avalanche, id_dans_la_requete }`. `id` vient de `context.chainId`, sinon de la requête ; `null` si aucune (`aucune`). |
| `origine` | `{ url, genre }` : le site (ou l'interface de portefeuille) d'où vient la demande. |
| `synthetique` | Toujours `true`. |
| `approximation` | `null`, ou l'objet d'origine `{ typed_data_or_selector_from_memory, note }`. Quand `typed_data_or_selector_from_memory` vaut `true`, la structure ou le sélecteur a été écrit de mémoire et n'est pas vérifié. |
| `difficile` | Cas marqué « dur » par ses auteurs (dont les bénins difficiles : étiquette `benin` et `difficile`). |
| `signaux_attendus`, `references`, `conversation` | Signaux que le moteur devrait relever, sources citées, lien vers une conversation d'escroc (S1 à S8). |
| `rejouable`, `non_rejouable_raison` | `false` si le cas n'a pas de requête EVM (Solana, Tron, page sans requête de portefeuille). |
| `tags` | Étiquettes triées : `source:`, `famille:`, `sous_famille:`, `etiquette:`, `niveau_attendu:`, `chaine:`, `methode:`, `langue:`, `signal:`, `avalanche`, `fuji`, `difficile`, `benin_difficile`, `approximation`, `de_memoire`, `synthetique`, etc. |
| `moteur` | Verdict actuel du moteur, voir ci-dessous. |

### Le champ `moteur`

Verdict de `server/server.mjs` (`evaluate`), en « mode sans contexte du catalogue » : seul le payload, l'origine, l'expéditeur et la chaîne sont donnés ; ni carnet d'adresses, ni historique, ni intention, ni texte de page. Date figée à 1 791 720 000 000 ms.

`statut` : `ok` (verdict rendu), `non_verifiable` (méthode ou forme hors périmètre, refusée proprement, jamais lancée en exception), `exception_interne` ou `exception` (aucun cas dans cette version). `niveau` (`ok`, `warn`, `critical` ; le moteur dit `info` pour « aucun signal », converti en `ok` ; `niveau_brut` garde l'original), `affichage` (`attention`, `danger`, `manipulation`, `unknown`), `fiche` (F01 à F33), `titre_fiche`, `codes` (12 premiers), `concordance` avec `niveau_attendu` (`egal`, `plus_severe`, `moins_severe`).

## Charger

```js
import { readFileSync } from 'node:fs';
const scenes = JSON.parse(readFileSync('scenarios_export/scenarios.json', 'utf8'));
const galerie = JSON.parse(readFileSync('scenarios_export/gallery_120.json', 'utf8'));
const fuji = scenes.filter((s) => s.chaine.id === 43113);
const requete = scenes[0].payload;   // { method, params } à donner au portefeuille / au moteur
```

Dans un navigateur : `fetch('scenarios.json').then((r) => r.json())` (26,8 Mo : préférer `gallery_120.json` pour une première page, et filtrer par `tags` ou `index.json`). Pour un portefeuille de démo réel, `payload.params` contient des adresses synthétiques : remplacer `from` par le compte de test.

## Chiffres (voir `index.json`)

- 6 456 scénarios : catalogue 385, public 144, v2 5 927 ; 90 familles.
- Avalanche : 3 930 (60,9 %), soit C-Chain 43114 : 2 960 et Fuji 43113 : 970, tous dans v2. Le catalogue et le public sont sur Ethereum (chaîne 1) ou une chaîne fictive (777001, 4 cas).
- Niveau attendu : critical 3 596, ok 1 944, warn 916. Étiquettes : malveillant 3 254, bénin 2 136, fraude conforme 821, ambigu 245. Bénins difficiles : 1 621 sur 2 079 cas difficiles.
- Moteur sur les 6 456 payloads : 6 442 acceptés, 14 non vérifiables (dont 10 sans requête EVM), 0 exception levée, 0 exception interne.
- Concordance du verdict sans contexte avec le niveau attendu : égal 3 380, moteur plus sévère 975, moteur moins sévère 2 101 (version moteur `3a209ae4d9f7`, mesurée le 11 oct. après le portage de sig_rights ; ces trois nombres changent avec le moteur). L'écart « moins sévère » est attendu : beaucoup de cas ne se tranchent qu'avec le contexte (carnet, historique, âge du contrat). Ne pas lire ce chiffre comme un taux de détection.

## Galerie (120)

48 Avalanche (36 C-Chain, 12 Fuji, soit 40 %), 72 hors Avalanche, choisis par un algorithme glouton à graine fixe (niveaux, étiquettes, bénins difficiles, sous-familles nouvelles). Niveaux attendus : critical 63, ok 34, warn 23. Étiquettes : malveillant 59, bénin 39, fraude conforme 12, ambigu 10 ; 31 bénins difficiles. 79 familles sur 90 représentées. Absentes :
- hors périmètre du moteur (6) : `bitb_seed_phrase`, `evasion_interception`, `extension_clone_sentinelle`, `mise_a_jour_piegee`, `permission_7715` (méthode non gérée par le moteur), `solana_tron_autorite` ;
- faute de place (5), les moins fournies : `batch_massif_troncature`, `benin_dur_phrase_ressemblant_a_injection`, `bitb_relais_permit`, `clickjacking_overlay`, `injection_pastedMessage`.

Contrainte structurelle : seule la source v2 a des chaînes Avalanche, donc les 48 scénarios Avalanche n'ont que 7 familles ; 40 % d'Avalanche et toutes les familles ne tiennent pas ensemble dans 120 places.

## Limites, à dire au jury

1. Tout est synthétique : adresses, sites, marques et montants sont fabriqués. Rien n'a été observé sur une vraie victime.
2. Les étiquettes et niveaux attendus ont été écrits par des agents (le catalogue et le public par l'équipe de Titouan, v2 « à l'aveugle » par d'autres agents d'Adem), pas par des analystes humains. Ils peuvent se tromper, et les cas ambigus sont des jugements.
3. `approximation` : 3 876 cas portent une note d’approximation ; 1 988 ont une structure ou un sélecteur « écrit de mémoire » ; à vérifier avant d'affirmer qu'un cas reproduit une vraie attaque.
4. Les titres sont générés par règles (une règle par sous-famille). Ils décrivent la situation type, pas l'exemple précis : montants et adresses sont dans `payload` et `contexte`. Le titre peut paraître vague pour une variante rare. `description` reste dans la langue des auteurs (français sans accents).
5. Le verdict `moteur` est celui d'une version précise du moteur sans contexte ; le moteur est modifié en parallèle par un autre agent. Le contexte du catalogue (carnet, historique, solde) est dans `contexte` mais n'est pas utilisé pour ce verdict.
6. Le contexte n'a pas la même forme dans les trois sources (par exemple `origin` est un texte ou un objet `{kind, url}` ; `victim` est une adresse ou un objet). L'export ne le réécrit pas.
7. Le jeu v2 est surtout un jeu de développement : ses règles ont servi à améliorer le moteur. Ne pas le présenter comme un jeu de test indépendant. Le jeu scellé (`TEST`, `V2_TEST`) n'est pas exporté.
8. 14 cas sont inutilisables pour rejouer le moteur (liste dans `index.json`, `inutilisables`) : 10 sans requête de portefeuille EVM (Solana, Tron, surcharge de `window.ethereum`, page piège, extension clone, mise à jour piégée) et 4 en `wallet_requestExecutionPermissions` (ERC-7715), non géré par le moteur.
