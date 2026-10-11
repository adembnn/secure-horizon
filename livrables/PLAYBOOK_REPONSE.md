# Playbook de réponse : Hold up

Une page, produit figé, état du 11 oct. 2026. Ce qui n'existe pas est écrit « non fait ». Le code de réponse est dans `research/demo_reelle/reponse/` (23 tests, `node --test "research/demo_reelle/reponse/test/*.test.mjs"`), écrit pour l'ancien produit : il lit le journal du serveur et reste valable pour les fiches et les retraits de droits.

## 1. Déclencheur

Une demande de signature ou de transaction passe par l'extension avant d'atteindre le portefeuille. La personne a écrit ce qu'elle veut faire. Le résultat est l'un de trois : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. » Le RPC de garde n'est plus une porte du produit : il reste un prototype dans le dépôt.

## 2. Ce qui est automatique

| Résultat | Ce que fait le produit |
|---|---|
| Ça correspond | Rien. Le portefeuille s'ouvre seul après une seconde. Les signaux que le portefeuille donne déjà restent les siens. |
| Ça ne correspond pas | Alerte avec une ligne : ce que la personne a écrit, ce que la demande donne. Annuler est visible. Pour une transaction qui accorde un droit plus large que le montant écrit, Hold up remplace lui-même le droit par ce montant sous conditions (une seule somme lisible, jeton connu, rien d'autre ne sort ; ligne « Droit limité à 50 USDC », prouvé en Node, pas dans un vrai Chrome) ; sinon la ligne dit comment le ramener. Pour une signature, elle dit que le droit ne peut pas être limité. |
| Pas pu vérifier | Phrase trop vague après une relance, appel illisible, adresse non écrite. La fenêtre le dit. Elle n'affiche jamais « correspond » par défaut. |

Durée de retenue après une alerte : sur l'écart « montant écrit contre droit plus large » d'une transaction, plus d'attente de 30 s (Q16, appliqué) ; dans les autres cas, ne pas citer de durée. Dans tous les cas : une ligne de verdict et une ligne de décision dans un journal local. Version autonome et version serveur : chaînés par hachage (sha256) ; la version autonome garde 500 lignes, avec export JSON et vérification hors ligne.

## 3. Ce qui reste humain

- Annuler ou continuer. Le produit n'impose pas de décision définitive.
- Trace documentée de la version livrée : panneau latéral, bouton « Exporter le journal (JSON) », puis `node extension/tools/verify_journal.mjs export.json` (sortie 0 cohérent, 1 rompu). Une ligne modifiée, retirée ou déplacée au milieu se voit.
- Fiche d'incident (prototype pour le journal du serveur, pas encore dans l'extension) : `node reponse/incident.mjs --journal <journal> --seq <n> --out <dossier>`. Elle liste ce qu'elle établit et ce qu'elle n'établit pas.
- Signer les retraits de droits après une signature dangereuse : `reponse/revoke.mjs` lit les droits actifs et construit les transactions (`approve 0`, `setApprovalForAll false`). Il ne signe pas et n'envoie rien.
- Porter plainte, prévenir un assureur ou une plateforme : aucun envoi automatique.

## 4. Qui est alerté

Sur le moment : la personne devant l'écran, et elle seule. Alerte poussée vers un tiers : non fait.

Qui lit les alertes et l'export du journal ensuite :
- Quand une plateforme intègre Hold up (exchange, fintech, portefeuille) : **son équipe fraude**. Elle récupère l'export JSON, le vérifie avec `verify_journal.mjs`, et lit les décisions (version serveur : `incident.mjs --list` et `--stats`). Elle décide des suites : contact client, signalement, registre d'incidents.
- Pour un particulier qui l'utilise seul : **la personne elle-même**. Elle exporte le journal depuis le panneau latéral et peut le remettre à sa plateforme, à son assureur ou à la police.

## 5. Après la décision

**Annulé.** Rien n'est parti. Ligne du journal chaîné exportable et vérifiable ; fiche d'incident en prototype (journal du serveur). Le journal ne garde pas encore la phrase écrite ni les paramètres complets : non fait.
**Signé.** Droit de dépense : retrait par `revoke.mjs`, testé sur chaîne locale (3 droits retirés, le vol échoue ensuite). Permit EIP-2612 : un permit sans effet (soi vers soi, montant 0) consomme le nonce ; c'est une course, si l'attaquant passe avant, c'est perdu. Envoi vers une mauvaise adresse : rien ne le défait. Permit2 et ordres Seaport : non fait.

## 6. Comment c'est documenté

Journal chaîné par sha256 dans les deux versions : le build autonome livré (`extension_standalone/extension/journal_chain.js`, identique à `extension/journal_chain.js` ; 7 tests dans `extension/tests/unit/journal_chain.test.mjs` ; export JSON depuis le panneau latéral ; vérification hors ligne par `extension/tools/verify_journal.mjs`) et la version serveur. Pas d'ancrage sur une blockchain pour la démo ni pour le rendu (décision D-017, `coord/DECISIONS.md`) : `reponse/anchor_evidence.mjs` existe, joué sur chaîne locale seulement, aucune transaction Fuji. Champs supplémentaires du journal (qui a décidé, droit limité, règles appliquées) : en cours, ne pas les citer. Deux formats de journal coexistent sans pont (serveur en sha256, `anchor/journal.mjs` en keccak). La version des règles n'est pas dans le journal.

## 7. Temps

| Mesure | Valeur | Source |
|---|---|---|
| Verdict local | médiane 32,31 ms, p95 47,33 ms (400 requêtes, sans réseau, sans Clef ; varie d'une exécution à l'autre) | `server/test/results.json` |
| Appel à Clef-flash | p50 369 ms, p95 1 083 ms (classifieur de messages, même modèle) | `redteam/classifier_measure.json` |
| Décision d'une personne réelle | à mesurer | |
| Plan de retrait de droits | 146 ms et 161 ms, n = 2, chaîne locale | `reponse/demo.mjs` |
| Ancrage et vérification sur Fuji | à mesurer | |

## 8. Limites

- Sans ancrage externe (décision D-017), le détenteur du fichier peut réécrire tout le journal, ou retirer les dernières lignes, sans que la vérification le voie. Cela vaut pour les deux versions, toutes deux chaînées.
- Verdict et décision sont appariés par site, méthode et ordre, faute d'identifiant de requête.
- `revoke.mjs` lit les événements depuis un bloc donné ; sur un RPC public la plage est plafonnée. Le retrait coûte des frais et arrive souvent après le vol.
- Fiches et retraits en ligne de commande, sans bouton dans l'extension.
- Classification DORA laissée de côté : les critères de classement (clients touchés, montants, durée) ne sont connus que de la plateforme.
- Tout a été joué par un script sur une chaîne locale.
