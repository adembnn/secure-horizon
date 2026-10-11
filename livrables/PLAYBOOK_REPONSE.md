# Playbook de réponse : Hold up

Une page. État du 11 oct. 2026. Chaque ligne renvoie à du code testé dans `research/demo_reelle/reponse/` (23 tests, `node --test "research/demo_reelle/reponse/test/*.test.mjs"`) ou au produit. Ce qui n'existe pas est écrit « non fait ».

## 1. Déclencheur

Une demande de portefeuille reçoit un verdict du moteur, par l'une des deux portes : l'extension (avant signature) ou le RPC de garde (après signature, avant diffusion). Il n'y a pas de niveau « OK ». La réponse dépend du niveau et de la famille de menace : la table est une donnée, `reponse/matrix.json`, lue par `respond()` dans `matrix.mjs`. Un test vérifie que ses durées sont celles du code qui tourne.

## 2. Ce qui est automatique

| Niveau | Retenue | Ce que fait le produit seul |
|---|---|---|
| Attention | 0 s | Affiche « Tu crois » face à « En vrai ». La personne décide. |
| Non vérifié | 30 s (extension), 0 s (RPC) | N'affiche jamais de validation. Extension : phrase à retaper, puis 30 s. RPC : une transaction illisible n'est pas diffusée. |
| Danger | 30 s | Extension : phrase à retaper, puis 30 s. RPC : transaction gardée, « Continuer » refusé avant l'échéance, abandon au bout de 30 min sans décision. |
| Manipulation | 10 min | Retenue de 10 min sur les deux portes, sans phrase à retaper. La phrase de pression repérée sur la page est citée. |

Dans tous les cas : une ligne de verdict et une ligne de décision sont écrites dans un journal local chaîné par hachage (sha256).

## 3. Ce qui reste humain

- **Annuler ou passer outre.** Le produit ne bloque jamais définitivement.
- **Appeler un proche.** L'extension propose le bouton et note qu'il a été utilisé. Elle n'appelle et n'écrit à personne.
- **Demander la fiche d'incident.** Elle n'est produite que sur demande : `node reponse/incident.mjs --journal <journal> --seq <n> --out <dossier>`.
- **Signer les retraits de droits** après une signature dangereuse. `reponse/revoke.mjs` lit les droits encore actifs sur la chaîne et construit les transactions exactes (`approve 0`, `setApprovalForAll false`). Il ne signe pas et n'envoie rien.
- **Porter plainte, prévenir un assureur ou une plateforme.** Aucun envoi automatique.

## 4. Qui est alerté

La personne devant l'écran, et elle seule. Un proche, si elle l'appelle. Personne d'autre : ni éditeur, ni plateforme, ni autorité. Une plateforme qui intègre le moteur lit le journal sur sa propre machine : `incident.mjs --list` donne la file des alertes Danger et Manipulation, `--stats` donne par niveau le nombre d'alertes, d'annulations, de passages outre et les temps médians. Alerte poussée vers un tiers (webhook, courriel) : non fait.

## 5. Après la décision

**La personne a annulé.** Rien n'est parti. Sur demande, fiche d'incident en JSON et en une page HTML : ce qui a été demandé, par quel site ou quelle transaction, par quelle porte, les règles déclenchées, la chronologie, les lignes de journal et leurs empreintes. Le journal ne garde pas les paramètres de la demande. Si la personne les a encore, `--request` vérifie qu'ils correspondent à l'empreinte journalisée, puis les décode à nouveau avec le moteur. La fiche liste ce qu'elle établit et ce qu'elle n'établit pas (qui était devant l'écran, qui est derrière le site, l'heure exacte).

**La personne a signé.** Selon la famille :
- droit de dépense : retrait par `revoke.mjs`. Testé sur chaîne locale : 3 droits accordés, 3 détectés, 3 retirés, le vol échoue ensuite ;
- permit EIP-2612 : la signature ne laisse aucune trace sur la chaîne et reste valable jusqu'à son échéance. `revoke.mjs` construit un permit sans effet (soi vers soi, montant 0) qui consomme le nonce. Testé : la signature de l'attaquant devient inutilisable. C'est une course : si l'attaquant passe avant, c'est perdu ;
- envoi vers une mauvaise adresse, contrôle du compte cédé : rien ne le défait. La fiche d'incident reste la seule pièce.
Permit2, ordres Seaport : non fait.

## 6. Comment c'est documenté

- Journal local chaîné. Une ligne modifiée est détectée (test).
- Ancrage : `reponse/anchor_evidence.mjs` calcule une racine de Merkle sur les empreintes des lignes, l'inscrit dans le contrat `EvidenceAnchor`, puis vérifie une fiche d'incident contre la chaîne par preuve d'inclusion, sans le journal. Sur la chaîne vont une racine de 32 octets, deux numéros de ligne et un numéro de version. Aucune adresse, aucun nom de site, aucun texte.
- **Fait sur chaîne locale seulement.** Fuji attend une clé de test approvisionnée. Aucun ancrage périodique n'est branché.
- **Deux formats de journal coexistent, sans pont.** Le serveur et le RPC de garde écrivent un journal sha256. `T_banc_e2e/anchor/journal.mjs` définit un autre format (keccak, JSON canonique, empreinte salée de l'effet) qu'aucune porte n'écrit. Ses scripts d'ancrage et de vérification fonctionnent sur ce format (vérifié sur nœud local). La preuve des fiches d'incident utilise le journal que le produit écrit vraiment.
- La version des règles n'est pas dans le journal : l'ancrage porte `0`.

## 7. Temps

| Mesure | Valeur | Source |
|---|---|---|
| Détection (latence du moteur, extension) | médiane 25,94 ms, p95 38,73 ms, n = 400, requêtes synthétiques | `T_banc_e2e/server/test/results.json` |
| Détection, porte RPC | à mesurer : la latence n'est pas journalisée par cette porte | |
| Retenue imposée | 30 s (Danger), 10 min (Manipulation) : réglages, pas des mesures | `matrix.json` |
| Décision d'une personne réelle | à mesurer : aucun essai avec des personnes | |
| Construction du plan de retrait | 146 ms et 161 ms, n = 2, chaîne locale | `reponse/demo.mjs` |
| Construction d'une fiche d'incident | 4 ms, n = 2 | `reponse/demo.mjs` |
| Ancrage et vérification sur Fuji | à mesurer | |

Chaque fiche d'incident calcule ses propres temps de détection et de réponse à partir des heures du journal.

## 8. Limites

- Avant ancrage, le détenteur du fichier peut réécrire tout le journal. L'ancrage borne seulement la date après laquelle rien n'a changé.
- Porte extension : verdict et décision sont appariés par site, méthode et ordre, faute d'identifiant de requête. « Passer outre » ne prouve pas que la personne a signé ensuite.
- `revoke.mjs` lit les événements depuis un bloc donné. Sur un RPC public la plage est plafonnée : il faudrait un indexeur. Le retrait coûte des frais et arrive souvent après le vol.
- Les fiches et les retraits se lancent en ligne de commande. Aucun bouton dans l'extension.
- Classification DORA : laissée de côté. Une fiche fournirait l'heure de détection, la source de détection, le type et les règles. Elle ne fournit ni le nombre de clients touchés, ni les montants, ni la durée d'indisponibilité, qui sont les critères de classement et que seule la plateforme connaît. Un tableau pré-rempli sans ces champs serait de la décoration.
- Tout a été joué par un script sur une chaîne locale. Démonstration complète : `node research/demo_reelle/reponse/demo.mjs`.
