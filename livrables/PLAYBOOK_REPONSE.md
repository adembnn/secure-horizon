# Playbook de réponse : Hold up

Une page, produit figé, état du 11 oct. 2026. Ce qui n'existe pas est écrit « non fait ». Le code de réponse est dans `research/demo_reelle/reponse/` (23 tests, `node --test "research/demo_reelle/reponse/test/*.test.mjs"`), écrit pour l'ancien produit : il lit le journal du serveur et reste valable pour les fiches et les retraits de droits.

## 1. Déclencheur

Une demande de signature ou de transaction passe par l'extension avant d'atteindre le portefeuille. La personne a écrit ce qu'elle veut faire. Le résultat est l'un de trois : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. » Le RPC de garde n'est plus une porte du produit : il reste un prototype dans le dépôt.

## 2. Ce qui est automatique

| Résultat | Ce que fait le produit |
|---|---|
| Ça correspond | Rien. Le portefeuille s'ouvre seul après une seconde. Les signaux que le portefeuille donne déjà restent les siens. |
| Ça ne correspond pas | Alerte avec une ligne : ce que la personne a écrit, ce que la demande donne. Annuler est visible. Pour une transaction qui accorde un droit plus large que le montant écrit, la ligne dit comment le ramener à ce montant. Pour une signature, elle dit que le droit ne peut pas être limité. |
| Pas pu vérifier | Phrase trop vague après une relance, appel illisible, adresse non écrite. La fenêtre le dit. Elle n'affiche jamais « correspond » par défaut. |

Durée de retenue après une alerte : question ouverte (décision Q16 : correction sans attente de 30 s, recommandée, non tranchée à la rédaction). Ne pas citer de durée. Dans tous les cas : une ligne de verdict et une ligne de décision dans un journal local chaîné par hachage (sha256).

## 3. Ce qui reste humain

- Annuler ou continuer. Le produit n'impose pas de décision définitive.
- Demander la fiche d'incident : `node reponse/incident.mjs --journal <journal> --seq <n> --out <dossier>`. Elle liste ce qu'elle établit et ce qu'elle n'établit pas.
- Signer les retraits de droits après une signature dangereuse : `reponse/revoke.mjs` lit les droits actifs et construit les transactions (`approve 0`, `setApprovalForAll false`). Il ne signe pas et n'envoie rien.
- Porter plainte, prévenir un assureur ou une plateforme : aucun envoi automatique.

## 4. Qui est alerté

La personne devant l'écran, et elle seule. Une plateforme qui intègre Hold up lit le journal sur sa machine : `incident.mjs --list` et `--stats`. Alerte poussée vers un tiers : non fait.

## 5. Après la décision

**Annulé.** Rien n'est parti. Fiche d'incident sur demande, JSON et HTML. Le journal ne garde pas encore la phrase écrite ni les paramètres complets : non fait.
**Signé.** Droit de dépense : retrait par `revoke.mjs`, testé sur chaîne locale (3 droits retirés, le vol échoue ensuite). Permit EIP-2612 : un permit sans effet (soi vers soi, montant 0) consomme le nonce ; c'est une course, si l'attaquant passe avant, c'est perdu. Envoi vers une mauvaise adresse : rien ne le défait. Permit2 et ordres Seaport : non fait.

## 6. Comment c'est documenté

Journal local chaîné ; ancrage de la racine de Merkle par `reponse/anchor_evidence.mjs`, fait sur chaîne locale seulement. Fuji : aucune transaction dans le dépôt. Deux formats de journal coexistent sans pont (serveur en sha256, `anchor/journal.mjs` en keccak). La version des règles n'est pas dans le journal.

## 7. Temps

| Mesure | Valeur | Source |
|---|---|---|
| Verdict local | médiane 18,39 ms, p95 34,08 ms (400 requêtes, sans réseau, sans Clef) | `server/test/results.json` |
| Appel à Clef-flash | p50 369 ms, p95 1 083 ms (classifieur de messages, même modèle) | `redteam/classifier_measure.json` |
| Décision d'une personne réelle | à mesurer | |
| Plan de retrait de droits | 146 ms et 161 ms, n = 2, chaîne locale | `reponse/demo.mjs` |
| Ancrage et vérification sur Fuji | à mesurer | |

## 8. Limites

- Avant ancrage, le détenteur du fichier peut réécrire tout le journal.
- Verdict et décision sont appariés par site, méthode et ordre, faute d'identifiant de requête.
- `revoke.mjs` lit les événements depuis un bloc donné ; sur un RPC public la plage est plafonnée. Le retrait coûte des frais et arrive souvent après le vol.
- Fiches et retraits en ligne de commande, sans bouton dans l'extension.
- Classification DORA laissée de côté : les critères de classement (clients touchés, montants, durée) ne sont connus que de la plateforme.
- Tout a été joué par un script sur une chaîne locale.
