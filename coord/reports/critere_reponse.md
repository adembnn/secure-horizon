# Critère 2, « Qualité de la réponse » (20 %) : journal des notes

Auteur : agent du critère réponse, 11 oct. 2026. Barème utilisé, en juré strict : proportionnée /7, actionnable /7, utile à l'analyste /6. Chaque note cite sa preuve. Rien n'a été commité.

## Notes par passe

| Passe | Proportionnée | Actionnable | Analyste | Total | Preuve |
|---|---|---|---|---|---|
| 0, état trouvé | 5 | 2 | 1 | **8/20** | La friction graduée existe et tourne (`hold_core.js`, `proxy.mjs`). Après la décision : rien. Le brouillon `research/titouan/W_livrables/PLAYBOOK_REPONSE.md` écrit lui-même « ancrage non livré », « canal non construit ». Aucune pièce d'incident, aucun retrait de droits, contrat d'ancrage jamais compilé. |
| 1, matrice et fiche d'incident | 6 | 3 | 3 | **12/20** | `matrix.json` + `respond()`, durées vérifiées contre le code qui tourne. `incident.mjs` : fiche JSON et HTML depuis le vrai journal, temps calculés sur les heures du journal. 16 tests. |
| 2, retrait de droits et ancrage | 6 | 5,5 | 4,5 | **16/20** | `revoke.mjs` : 3 droits accordés, 3 détectés, 3 retirés, vol en échec ensuite ; permit EIP-2612 invalidé par consommation du nonce. `anchor_evidence.mjs` : racine ancrée sur chaîne locale, fiche vérifiée par preuve d'inclusion, 3 falsifications rejetées. 23 tests. |
| 3, démonstration, mesures, corrections | 6 | 6 | 5 | **17/20** | `demo.mjs` joue les deux branches de bout en bout, deux fiches « VERIFIED ». `--stats` pour l'analyste. Trois erreurs trouvées en relisant contre le code et corrigées (ci-dessous). Playbook aligné. 23/23 sur chainId 43113 puis 31337. |

Ce qui empêche d'aller plus haut : aucun temps humain mesuré, pas d'ancrage Fuji, aucune alerte poussée vers un tiers, pas de bouton dans l'extension (tout est en ligne de commande), appariement approximatif côté extension.

## Erreurs trouvées pendant la boucle

1. **Lecture périmée.** `scanGrants` ne voyait pas un droit accordé juste avant : ethers met en cache les lectures identiques 250 ms. Corrigé (`makeProvider`, cache coupé, borne haute `latest`). Sans le test sur chaîne, l'outil aurait répondu « rien à retirer » à tort.
2. **Matrice fausse sur deux cases.** J'avais écrit « Non vérifié : 0 s » et « Manipulation : phrase à retaper » pour l'extension. `hold_core.js` dit l'inverse : Non vérifié = phrase + 30 s, Manipulation = 10 min sans phrase. Corrigé, et un test lit maintenant `hold_core.js`.
3. **Code de sortie.** `process.exit()` juste après un `fetch` fait planter Node 25 sous Windows (assertion libuv, code 127). Corrigé dans `anchor_evidence.mjs`. Hardhat a le même défaut à la sortie de `npm run anchor:local` : `deployAnchor` juge donc sur l'adresse imprimée et enregistrée, puis vérifie qu'un contrat répond.

## Ce qui est livré

Dossier `research/demo_reelle/reponse/` (environ 1 200 lignes avec les tests) :
- `matrix.json`, `matrix.mjs` : 4 niveaux, 8 familles, 33 fiches chacune dans une seule famille.
- `incident.mjs` : `--list`, `--stats`, `--seq N --out dir [--request | --raw]`.
- `revoke.mjs` : lecture des droits actifs, transactions de retrait, permit de remplacement EIP-2612.
- `anchor_evidence.mjs` : `anchor`, `verify`. Refuse tout hôte autre que 127.0.0.1 et les ports partagés.
- `demo.mjs` : tout le circuit, sorties dans `reponse/out/` (ignoré par git).
- `test/` : 4 fichiers, 23 tests. Les 5 tests sur chaîne sont sautés, avec un message, si aucun nœud jetable ne répond sur 8549.

`livrables/PLAYBOOK_REPONSE.md` : livrable final.

## Comment tester

```
cd blockchain && HOLDUP_CHAIN_MODE=plain HOLDUP_PORT=8549 npm run chain:local     # autre terminal, nœud jetable
node --test "research/demo_reelle/reponse/test/*.test.mjs"
node research/demo_reelle/reponse/demo.mjs
```

## Validation du circuit d'ancrage de Titouan (`T_banc_e2e/anchor/`), demandée par le coordinateur

Nœud jetable local, port 8549, mode `plain`, `HOLDUP_CHAIN_ID=43113`. Clé : compte de test public n° 0 de Hardhat, lue dans la sortie du nœud, passée dans l'environnement de la seule commande `anchor_now.mjs`, jamais écrite. Aucun fichier de son dossier n'a été modifié.

| Étape | Résultat |
|---|---|
| Compilation (`npm run anchor:local`) | OK, solc 0.8.24, via `hardhat.anchor.config.js` |
| Déploiement | `EvidenceAnchor 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f (chain 43113)` sur le nœud local |
| Journal à son format | 5 entrées écrites avec sa classe `Journal`, `verify()` : `ok:true, count:5` |
| `anchor_now.mjs --dry-run` | `Intervalle [0..4] (5 entrees) \| racine 0x77dcf857…1fba82 \| ruleVersion 1`, calldata affiché, rien envoyé, code 0 |
| `anchor_now.mjs` sans clé | « FUJI_PRIVATE_KEY absente de l'environnement. Rien envoye. », code 2 |
| `anchor_now.mjs` | `Ancre : tx 0x12d79e18…64ced9`, `gas utilise : 116391`, code 0. Relance : « Rien de nouveau a ancrer. » |
| `verify_anchor.mjs` | `bloc courant 47 \| ancrages lus 1`, `#0 [0..4] bloc 47 -> identique`, `VERDICT : identique` |
| `verify_anchor.mjs`, ligne modifiée | `VERDICT : divergent (chaine du journal local rompue)` |
| `verify_anchor.mjs`, journal tronqué à 3 | `divergent : journal local trop court (3 entrees, ancrage jusqu'a 4)` |

Le circuit fonctionne. Défauts trouvés, correctifs proposés, **non appliqués** :

1. **`verify_anchor.mjs` : code de sortie 127 au lieu de 0 ou 1** (Node 25, Windows). Le verdict s'affiche juste, puis `process.exit()` déclenche `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`. Un script qui se fie au code de sortie lit « identique » comme un échec.
   Correctif, dernière ligne : remplacer `process.exit(out.verdict === 'identique' ? 0 : 1);` par `process.exitCode = out.verdict === 'identique' ? 0 : 1;`. Même remplacement pour le `process.exit(2)` de l'usage, à faire précéder d'un `else`.
2. **`anchor_now.mjs` écrit une ligne « Avalanche Fuji C-Chain (43113) » avec un lien Snowtrace pour une transaction qui n'est pas sur Fuji.** Le contrôle porte sur le chainId seul ; un nœud local réglé sur 43113 passe. Le fichier `DEPLOYMENTS_ANCHOR.md` reçoit alors une fausse preuve de déploiement public. (Le fichier créé par mon essai a été supprimé, son dossier est revenu à l'état initial.)
   Correctif : `const onFuji = url === FUJI_RPC;` puis n'appeler `recordLine(...)` et n'afficher le lien Snowtrace que si `onFuji` ; sinon afficher « chaîne locale, non consigné ».
3. **Une ligne modifiée laisse l'intervalle « identique ».** `rootOf` construit l'arbre sur le champ `hash` stocké, pas sur l'empreinte recalculée. Le verdict global est bien « divergent » grâce à `verify()`, mais la ligne `#0 … -> identique` contredit le commentaire « c'est la racine qui juge ».
   Correctif dans `journal.mjs`, `rootOf` et `proofOf` : `es.slice(from, to + 1).map((e) => entryHash(e))` au lieu de `.map((e) => e.hash)`.
4. **Double ancrage possible.** Si la transaction part mais que le reçu n'arrive pas dans le délai, `anchor_state.json` n'est pas écrit et la relance ancre le même intervalle une seconde fois. Sans gravité (le contrat accepte), à noter.
5. **Deux formats de journal, sans pont.** Son `journal.mjs` (keccak, JSON canonique, empreinte salée) n'est écrit par aucune porte. Le serveur et le RPC de garde écrivent le journal sha256 de `server.mjs`. Pour la preuve des fiches d'incident j'ai pris le journal que le produit écrit, et réutilisé son `merkle.mjs`, son `eth.mjs`, son `fetchAnchors` et son contrat. C'est dit dans le playbook. Un pont demanderait d'écrire ses entrées depuis `server.mjs` (version des règles, empreinte salée de l'effet), ce qui apporterait la version des règles, absente aujourd'hui.

## Risques

- La fiche HTML n'a été contrôlée à l'écran qu'en vue réduite : mise en page tenue sur une page, lisibilité fine non vérifiée.
- Les valeurs de temps viennent d'un script sur une machine, n = 2.
- Porte RPC : journal écrit avec le vrai `makeJournal` mais avec des entrées recopiées de `proxy.mjs`, pas par le proxy en marche.

## Besoins (fichiers hors de mon périmètre)

- `rpc_garde/proxy.mjs` : ajouter `latency_ms` à `rpc_verdict`, sinon le temps de détection de cette porte reste « à mesurer ».
- `server/server.mjs` et `extension/gatekeeper.js` : un identifiant de requête commun au verdict et à la décision, et la version des règles dans la ligne de verdict.
- Extension : un bouton « Garder une trace » et un bouton « Retirer les droits » qui appellent `incident.mjs` et `revoke.mjs`.
- Fuji : une clé de test approvisionnée pour ancrer et mesurer.
