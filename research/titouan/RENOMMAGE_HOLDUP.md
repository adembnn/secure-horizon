# Renommage Sentinelle vers Hold up : état et occurrences restantes

11 oct. 2026. Nom du produit : Hold up. « Sentinelle » est l'ancien nom.

## 1. Ce qui a été fait

Phase 1 (textes lisibles) : 177 fichiers `.md`, `.html`, `.css` (commentaires), `.csv`, `.txt` et `docs/demo/banc/data.json`, environ 400 lignes. Script appliqué seulement sur une liste validée, puis relu au diff.
- « Sentinelle Fuji », « Sentinelle », « la Sentinelle », « notre Sentinelle » deviennent « Hold up » ; « SENTINELLE » devient « HOLD UP ».
- Jamais touché : un mot collé à un identifiant (`sentinelle_core`, `SENTINELLE_PORT`, `@sentinelle/intent`, `data-sentinelle`, `SentinelleFuji_CL`, `X-Sentinelle-Signature`), le mot entre accents graves, le mot en minuscules (nom commun ou nom de fichier), l'anglais « Sentinel » (produits tiers, rôle `SENTINEL` des contrats).
- Lignes qui parlent du nom lui-même laissées telles quelles (ex. `PRODUCT.md:5` « ex-Sentinelle », `docs/INDEX.md:3`, `pitch/JURY_ATTAQUES.md:3`).
- Fichiers bannerisés PÉRIMÉ ou OBSOLÈTE : citation historique entre « » gardée, suivie de « (ancien nom) ».
- Corrections manuelles : identifiant de sous-graphe Mermaid `subgraph HoldUp["Hold up"]` (`research/tracks/T1_P4_connecteurs_testes.md:133`, `T1_P4_integration_ecosysteme.md:435`) ; sorties de programme capturées dans `research/poc/connectors/*/PROOF.md` remises à l'original (elles doivent rester identiques au code qui les a produites).
- Exclus : `coord/INBOX.md`, `coord/DECISIONS.md`, `coord/HANDOFF_*`, `coord/reports/`, `research/titouan/HANDOFF_*`, journaux, jeux scellés, `*.jsonl`, `.env*`, copies figées.

Phase 2 (identifiants), avant la répartition MSG-075 :
- `pipeline/evaluate_plus.mjs` : `HOLDUP_RPC_URL`, `HOLDUP_LIVE`, `HOLDUP_LIVE_BUDGET_MS` lus en priorité, `SENTINELLE_*` en repli (ancien nom). Le serveur passe par ce fichier : ces trois variables marchent déjà de bout en bout.
- `detectors_adem/` : `HOLDUP_FORK_RPC` et `HOLDUP_SIM_RPC`, repli `SENTINELLE_FORK_RPC` et `SENTINELLE_RPC`.
- Commentaires et texte affiché : `app/intent/src/*.ts` (en-têtes, message console), `app/intent/package.json` (description), `redteam/check.mjs`, `redteam/fuzz_sig.mjs`, `redteam/fuzz_encoding.mjs` (titre du rapport), `server/test/server.test.mjs` (préfixe de dossier temporaire), `engine/package.json` (nom de paquet privé), `blockchain/FUJI.md:125` (`HOLDUP_RPC_URL`, ancien nom en repli).
- Vérifié : node --check sur chaque `.mjs` modifié ; `pipeline/test` 21/21 ; `server/test/server.test.mjs` et `presentation.test.mjs` verts ; `run/check_nohardcode.mjs` OK. `server/test/results.json` remis à son état d'avant les tests. `app/intent` : pas de `node_modules`, tests non lancés (commentaires et chaîne seulement).

Ce qui reste dans le périmètre d'Adem : `research/titouan/RENOMMAGE_HOLDUP_POUR_ADEM.md`.

## 2. Pas fait, à faire par Titouan plus tard

`server/server.mjs` (commit à 10:25, moins de 30 min au moment du passage) : non touché. Proposition, avec repli sur l'ancien nom :

| Ligne | Actuel | Proposé |
|---|---|---|
| 6-10 | commentaire des variables `SENTINELLE_*` | documenter `HOLDUP_*` d'abord, `SENTINELLE_*` comme ancien nom |
| 41 | `process.env.SENTINELLE_CONTEXT` | `process.env.HOLDUP_CONTEXT ?? process.env.SENTINELLE_CONTEXT` |
| 546 | `extId = process.env.SENTINELLE_EXT_ID` | `process.env.HOLDUP_EXT_ID ?? process.env.HOLDUP_EXTENSION_ID ?? process.env.SENTINELLE_EXT_ID` (`relay.mjs` lit déjà `HOLDUP_EXTENSION_ID`) |
| 617 | `SENTINELLE_JOURNAL_FILE` | `HOLDUP_JOURNAL_FILE ?? SENTINELLE_JOURNAL_FILE` |
| 619 | `SENTINELLE_JOURNAL === '0'` | `(HOLDUP_JOURNAL ?? SENTINELLE_JOURNAL) === '0'` |
| 620 | `SENTINELLE_PORT` | voir conflit ci-dessous |
| 442, 483 | `engine: 'sentinelle-local'` | `'holdup-local'`, en même temps que `pipeline/evaluate_plus.mjs` et `webdemo/engine` (parité) |
| 564 | `service: 'sentinelle'` (route `/health`) | `'holdup'` seulement si aucun client ne teste cette valeur |

**Conflit de nom** : `scripts/demo.mjs:38` utilise déjà `HOLDUP_PORT` pour le port de la chaîne locale (8545). Le serveur de vérification lit `SENTINELLE_PORT` (8787). Renommer en `HOLDUP_PORT` casserait la démo. Proposé : `HOLDUP_CHECK_PORT`, avec repli `SENTINELLE_PORT`, dans `server.mjs:620` et `scripts/demo.mjs:35, 38`.

Noms de fichiers : `sentinelle_core.js` (3 copies générées plus la source), `docs/design/page/sentinelle.css` et `sentinelle.js` (maquette périmée), `research/poc/connectors/notif-ntfy/sentinelle-notify.sh`, `SentinelGuard.sol`. Aucun renommé : imports, builds et tests en cours d'édition par d'autres, ou PoC archivées.

## 3. Occurrences restantes (`git grep -nIi sentinel`, après le passage)

Environ 6 400 lignes dans 269 fichiers, dont 5 780 dans des `.jsonl` (jeux de cas). Un fichier à plus de 15 lignes est résumé sur une ligne.

| Fichier | Ligne | Raison |
|---|---|---|
| `.claude/skills/impeccable/scripts/hook-lib.mjs` | 1728 | mot anglais generique (sentinel), pas le produit |
| `.claude/skills/impeccable/scripts/live/accept-css.mjs` | 394 | mot anglais generique (sentinel), pas le produit |
| `.claude/skills/impeccable/scripts/live/accept-css.mjs` | 395 | mot anglais generique (sentinel), pas le produit |
| `.claude/skills/impeccable/scripts/live/accept-verify.mjs` | 24 | mot anglais generique (sentinel), pas le produit |
| `PRODUCT.md` | 5 | phrase sur le nom lui-meme (historique du renommage) |
| `app/intent/.env.example` | 1 | .env exclu |
| `app/intent/README.md` | 1 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `app/intent/README.md` | 27 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `app/intent/package-lock.json` | 2 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `app/intent/package-lock.json` | 8 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `app/intent/package.json` | 2 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `app/intent/src/index.ts` | 5 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `blockchain/FUJI.md` | 125 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `blockchain/contracts/demo/DemoRouter.sol` | 9 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `blockchain/contracts/demo/FreshDrainer.sol` | 10 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `blockchain/contracts/demo/FreshDrainer.sol` | 18 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `context/notion_guide.md` | 83 | nom externe (produit tiers ou source citee) |
| `coord/DECISIONS.md` | 8 | historique (journal, handoff, rapport) |
| `coord/DECISIONS.md` | 12 | historique (journal, handoff, rapport) |
| `coord/INBOX.md` | 20 lignes (7 a 240) | historique (journal, handoff, rapport) |
| `coord/reports/critere_faisabilite.md` | 47 | historique (journal, handoff, rapport) |
| `coord/reports/critere_faisabilite.md` | 76 | historique (journal, handoff, rapport) |
| `coord/reports/critere_faisabilite.md` | 78 | historique (journal, handoff, rapport) |
| `coord/reports/critere_faisabilite.md` | 79 | historique (journal, handoff, rapport) |
| `coord/reports/testeurs/4_envois_recompenses.md` | 33 | historique (journal, handoff, rapport) |
| `coord/tasks/T-104-metamask-snap.md` | 28 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/INDEX.md` | 3 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 189 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 197 | nom de role technique (contrat), pas le produit |
| `docs/architecture.md` | 306 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 309 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 338 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `docs/architecture.md` | 353 | nom de role technique (contrat), pas le produit |
| `docs/architecture.md` | 517 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 565 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 590 | phrase sur le nom lui-meme (historique du renommage) |
| `docs/architecture.md` | 597 | nom de role technique (contrat), pas le produit |
| `docs/design/page/1-bandeau.html` | 7 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/1-bandeau.html` | 77 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/2-miroir.html` | 7 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/2-miroir.html` | 91 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/3-popup.html` | 7 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/3-popup.html` | 109 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/4-accueil.html` | 7 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/4-accueil.html` | 76 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/README.md` | 13 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `docs/design/page/README.md` | 14 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `livrables/RAPPORT_NETTOYAGE.md` | 14 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `pitch/JURY_ATTAQUES.md` | 3 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/JURY_ATTAQUES.md` | 179 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/JURY_ATTAQUES.md` | 180 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/JURY_ATTAQUES.md` | 201 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/JURY_ATTAQUES.md` | 220 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/JURY_ATTAQUES.md` | 222 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/comprendre_piste4.md` | 10 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/comprendre_piste4.md` | 34 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/comprendre_piste4.md` | 118 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 166 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 172 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 220 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 262 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 360 | phrase sur le nom lui-meme (historique du renommage) |
| `pitch/comprendre_piste4.md` | 364 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 365 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `pitch/comprendre_piste4.md` | 368 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` | 16 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` | 194 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` | 278 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `preuves/exhaustivite/essais/harnais.mjs` | 2 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `preuves/exhaustivite/essais/harnais.mjs` | 14 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `preuves/exhaustivite/essais/harnais.mjs` | 21 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/02_track1_finance.md` | 149 | nom externe (produit tiers ou source citee) |
| `research/02_track1_finance.md` | 175 | nom externe (produit tiers ou source citee) |
| `research/02_track1_finance.md` | 213 | nom externe (produit tiers ou source citee) |
| `research/03_track2_ai_security.md` | 105 | nom externe (produit tiers ou source citee) |
| `research/03_track2_ai_security.md` | 320 | nom externe (produit tiers ou source citee) |
| `research/03_track2_ai_security.md` | 327 | nom externe (produit tiers ou source citee) |
| `research/04_track3_frontiers.md` | 162 | nom externe (produit tiers ou source citee) |
| `research/04_track3_frontiers.md` | 212 | nom externe (produit tiers ou source citee) |
| `research/08_ideas_cross_track.md` | 12 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/RECHERCHE_concurrents_particuliers.md` | 13 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/RECHERCHE_concurrents_particuliers.md` | 25 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/RECHERCHE_concurrents_particuliers.md` | 26 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/RECHERCHE_demos.md` | 20 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/RECHERCHE_demos.md` | 21 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/RECHERCHE_metamask_rpc_erreur.md` | 11 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/demo_reelle/RECHERCHE_metamask_rpc_erreur.md` | 57 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/demo_reelle/RECHERCHE_surfaces.md` | 16 | nom externe (produit tiers ou source citee) |
| `research/demo_reelle/chain/README.md` | 63 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/demo_reelle/chain/lookalike.mjs` | 162 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/frontier/F5_signaux_marche.md` | 49 | nom externe (produit tiers ou source citee) |
| `research/frontier/F5_signaux_marche.md` | 112 | nom externe (produit tiers ou source citee) |
| `research/frontier/F8_analogies.md` | 197 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/frontier/F9_hackathons_monde.md` | 42 | nom externe (produit tiers ou source citee) |
| `research/frontier/F9_hackathons_monde.md` | 104 | nom externe (produit tiers ou source citee) |
| `research/loop/round-1.md` | 49 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/loop/round-1.md` | 119 | nom de role technique (contrat), pas le produit |
| `research/loop/round-1.md` | 130 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/loop/round-1.md` | 179 | phrase sur le nom lui-meme (historique du renommage) |
| `research/poc/connectors/amf-xlsx/work/incident.synthetic.json` | 4 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/amf-xlsx/work/incident.synthetic.json` | 8 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/amf-xlsx/work/incident.synthetic.json` | 13 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/amf-xlsx/work/incident.synthetic.json` | 16 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/bitgo-policy/server.mjs` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/PROOF.md` | 4 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/PROOF.md` | 17 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/PROOF.md` | 18 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/PROOF.md` | 26 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/PROOF.md` | 59 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/PROOF.md` | 67 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/docker-compose.yml` | 4 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/readback.json` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 2 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 11 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 13 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 21 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 25 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 30 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 31 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 41 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/run-proof.sh` | 54 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/slack-payload.json` | 2 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/slack-payload.json` | 3 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/chat-slack-compatible/slack-payload.json` | 13 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/fireblocks-cosigner/PROOF.md` | 38 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/fireblocks-cosigner/PROOF.md` | 41 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/fireblocks-cosigner/PROOF.md` | 59 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/fireblocks-cosigner/src/policy.mjs` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/fireblocks-cosigner/src/policy.mjs` | 16 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/PROOF.md` | 4 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/PROOF.md` | 7 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/run-proof.sh` | 6 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/run-proof.sh` | 9 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/run-proof.sh` | 16 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/sentinelle-notify.sh` | 2 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/notif-ntfy/sentinelle-notify.sh` | 9 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/safe15-moduleguard/PROOF.md` | 8 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/safe15-moduleguard/PROOF.md` | 11 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/safe15-moduleguard/contracts/SentinelGuard.sol` | 9 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/safe15-moduleguard/contracts/SentinelGuard.sol` | 22 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/safe15-moduleguard/contracts/SentinelGuard.sol` | 23 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/safe15-moduleguard/contracts/SentinelGuard.sol` | 24 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/safe15-moduleguard/test/moduleguard.test.js` | 55 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/safe15-moduleguard/test/moduleguard.test.js` | 76 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/safe15-moduleguard/test/moduleguard.test.js` | 87 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 5 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 27 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 28 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 29 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 35 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 42 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 43 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 44 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 45 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 46 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 47 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/PROOF.md` | 55 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/docker-compose.yml` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/event.ocsf.json` | 18 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/event.ocsf.json` | 22 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/push.json` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/result.json` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/run-proof.sh` | 19 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/run-proof.sh` | 23 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/siem-ocsf/run-proof.sh` | 33 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/PROOF.md` | 20 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/PROOF.md` | 22 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/PROOF.md` | 39 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/PROOF.md` | 42 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/docker-compose.yml` | 4 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 10 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 11 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 13 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 17 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 22 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 25 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/ticketing/run-proof.sh` | 29 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/PROOF.md` | 1 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/PROOF.md` | 9 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/PROOF.md` | 30 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/PROOF.md` | 31 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/PROOF.md` | 38 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/PROOF.md` | 39 | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/poc/connectors/zodiac-roles/contracts/Target.sol` | 5 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/zodiac-roles/contracts/Target.sol` | 17 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/zodiac-roles/contracts/Target.sol` | 22 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/poc/connectors/zodiac-roles/test/roles.test.js` | 17 lignes (4 a 134) | PoC archivee piste 4 : chaine de code liee aux sorties capturees dans PROOF.md |
| `research/threat_coverage/00_MATRICE.md` | 150 | nom externe (produit tiers ou source citee) |
| `research/threat_coverage/03_pieges_contrat.md` | 388 | nom de role technique (contrat), pas le produit |
| `research/threat_coverage/03_pieges_contrat.md` | 390 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/threat_coverage/05_manipulation_humaine.md` | 171 | nom externe (produit tiers ou source citee) |
| `research/threat_coverage/07_concurrents_couverture.md` | 32 | nom externe (produit tiers ou source citee) |
| `research/threat_coverage/07_concurrents_couverture.md` | 69 | nom externe (produit tiers ou source citee) |
| `research/titouan/BM2/BM_MARCHE.md` | 48 | nom externe (produit tiers ou source citee) |
| `research/titouan/HANDOFF_TITOUAN_VERS_ADEM.md` | 3 | historique (journal, handoff, rapport) |
| `research/titouan/HANDOFF_TITOUAN_VERS_ADEM.md` | 26 | historique (journal, handoff, rapport) |
| `research/titouan/HANDOFF_TITOUAN_VERS_ADEM_2.md` | 12 | historique (journal, handoff, rapport) |
| `research/titouan/J_recherche/J6_hackathons_gagnants_jurys.md` | 9 | nom externe (produit tiers ou source citee) |
| `research/titouan/J_recherche/J6_hackathons_gagnants_jurys.md` | 26 | nom externe (produit tiers ou source citee) |
| `research/titouan/J_recherche/J6_hackathons_gagnants_jurys.md` | 50 | nom externe (produit tiers ou source citee) |
| `research/titouan/J_recherche/J6_hackathons_gagnants_jurys.md` | 53 | nom externe (produit tiers ou source citee) |
| `research/titouan/J_recherche/J6_hackathons_gagnants_jurys.md` | 54 | nom externe (produit tiers ou source citee) |
| `research/titouan/J_wallets_perso/W2_concurrents_grand_public.md` | 30 | nom externe (produit tiers ou source citee) |
| `research/titouan/J_wallets_perso/W2_concurrents_grand_public.md` | 31 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L2_absorptions_fermetures.md` | 21 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L2_absorptions_fermetures.md` | 22 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L2_absorptions_fermetures.md` | 37 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L2_absorptions_fermetures.md` | 41 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L2_absorptions_fermetures.md` | 44 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L2_absorptions_fermetures.md` | 57 | nom externe (produit tiers ou source citee) |
| `research/titouan/L_harpie/L3_survivants_reponse_apres_compromission.md` | 32 | nom externe (produit tiers ou source citee) |
| `research/titouan/N_clef_jev/N2_usages_particulier.md` | 35 | nom externe (produit tiers ou source citee) |
| `research/titouan/N_clef_jev/N2_usages_particulier.md` | 136 | nom externe (produit tiers ou source citee) |
| `research/titouan/O_barriere_intention/O2_vocabulaire_victimes.md` | 58 | nom externe (produit tiers ou source citee) |
| `research/titouan/S_business_model/S1_payeurs_et_canaux.md` | 9 | nom externe (produit tiers ou source citee) |
| `research/titouan/S_business_model/S1_payeurs_et_canaux.md` | 80 | nom externe (produit tiers ou source citee) |
| `research/titouan/S_business_model/S1_payeurs_et_canaux.md` | 147 | nom externe (produit tiers ou source citee) |
| `research/titouan/S_business_model/S3_concurrence_defendabilite_these.md` | 18 | nom externe (produit tiers ou source citee) |
| `research/titouan/T_banc_e2e/anchor/contracts/EvidenceAnchor.sol` | 6 | contrat Solidity : un commentaire change le bytecode (metadonnees), contrats deployes ou testes |
| `research/titouan/T_banc_e2e/attacks/DEV.jsonl` | 12 lignes (297 a 308) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/attacks/TEST.jsonl` | 6 lignes (173 a 178) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/attacks/cases.jsonl` | 18 lignes (469 a 486) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/attacks/fam3.mjs` | 187 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/attacks_public/PUBLIC.jsonl` | 2 lignes (118 a 133) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/attacks_public/VALIDATION_PUBLIC_REPORT.txt` | 45 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/attacks_public/gen_public.mjs` | 496 | generateur de cas : changer ce texte change PUBLIC.jsonl (jeu de mesure) |
| `research/titouan/T_banc_e2e/attacks_public/gen_public.mjs` | 551 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/attacks_public/gen_public.mjs` | 553 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/attacks_public/out/MESURE_001.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/attacks_public/out/MESURE_001.md` | 1 lignes (114 a 114) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/attacks_public/out/MESURE_002.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/attacks_public/out/MESURE_002.md` | 1 lignes (113 a 113) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/BANC_REALISTE.md` | 203 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/banc_realiste/CONTEXTE_PRODUIT.md` | 3 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/banc_realiste/out/DETAIL_FAMILLES_catalogue.md` | 4 lignes (220 a 370) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/DETAIL_FAMILLES_produit.md` | 4 lignes (220 a 370) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/TABLES.md` | 2 lignes (241 a 355) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/TAB_FAMILLES_catalogue.md` | 1 lignes (72 a 72) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/TAB_FAMILLES_produit.md` | 1 lignes (72 a 72) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/cases.json` | 1 lignes (1 a 1) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/resultats_par_famille.json` | 8 lignes (33566 a 496692) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/out/versions.json` | 3 lignes (53 a 85) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/banc_realiste/run_realiste.mjs` | 21 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/banc_realiste/snapshot/engine/vendor/compare.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/banc_realiste/snapshot/engine/vendor/types.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/blind_adem/v2/BRIEF.md` | 4 | jeu scelle, exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/V2_DEV.jsonl` | 1996 lignes (1002 a 2997) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/V2_TEST.jsonl` | 874 lignes (410 a 1283) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/benign_everyday/cases.jsonl` | 1420 lignes (1 a 1420) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/benign_everyday/gen.mjs` | 14 | jeu scelle, exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/fraud_ambig/cases.jsonl` | 1450 lignes (1 a 1450) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/fraud_ambig/gen.mjs` | 140 | jeu scelle, exclu |
| `research/titouan/T_banc_e2e/blind_adem/v2/fraud_ambig/gen.mjs` | 252 | jeu scelle, exclu |
| `research/titouan/T_banc_e2e/blind_decalage/run/JOURNAL_OUVERTURE.md` | 97 | historique (journal, handoff, rapport) |
| `research/titouan/T_banc_e2e/blind_decalage/run/essai/sorties/plein/JOURNAL_OUVERTURE.md` | 97 | historique (journal, handoff, rapport) |
| `research/titouan/T_banc_e2e/blind_decalage/run/essai/sorties/quota/JOURNAL_OUVERTURE.md` | 97 | historique (journal, handoff, rapport) |
| `research/titouan/T_banc_e2e/blind_decalage/run/essai/sorties/quota/JOURNAL_OUVERTURE.md` | 247 | historique (journal, handoff, rapport) |
| `research/titouan/T_banc_e2e/boucle/out/chk.json` | 1 lignes (1 a 1) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/boucle/out/cur.json` | 1 lignes (1 a 1) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/boucle/out/essai.json` | 1 lignes (1 a 1) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/boucle/out/p06.json` | 1 lignes (1 a 1) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/boucle/out/s0.json` | 1 lignes (1 a 1) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/context_live/README.md` | 64 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/context_live/README.md` | 87 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/context_live/provider.mjs` | 91 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/context_live/server_integration.diff` | 68 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/context_live/server_integration.diff` | 85 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/context_live/server_integration.diff` | 89 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/context_live/server_integration.diff` | 97 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/context_live/server_integration.diff` | 98 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/fork_sim.mjs` | 3 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/fork_sim.mjs` | 6 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/sim_events.mjs` | 7 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/sim_events.mjs` | 35 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/test/fork_test.mjs` | 7 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/test/fork_test.mjs` | 78 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/token_guard.mjs` | 6 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/detectors_adem/token_guard.mjs` | 55 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/engine/vendor/compare.ts` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/engine/vendor/index.ts` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/engine/vendor/index.ts` | 5 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/engine/vendor/server.ts` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/engine/vendor/server.ts` | 283 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/engine/vendor/types.ts` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/essai_reel/CE_QUI_PEUT_CASSER.md` | 12 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_METAMASK.md` | 7 | phrase sur le nom lui-meme (historique du renommage) |
| `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_METAMASK.md` | 91 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/extension/RAPPORT_REVOKE_SYNC.md` | 26 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/extension/RAPPORT_SECURITE_CORRECTIFS.md` | 153 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/extension/bridge.js` | 17 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension/bridge.js` | 163 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension/inject.js` | 114 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension/tests/run_tests.mjs` | 300 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/extension/tests/unit/comportement.test.mjs` | 577 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/extension/tests/unit/decisions.test.mjs` | 19 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension/tests/unit/decisions.test.mjs` | 85 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension/tests/unit/decisions.test.mjs` | 400 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension/tests/unit/inject.test.mjs` | 29 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/extension/tests/unit/securite_page.mjs` | 27 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs` | 3 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs` | 86 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension/BUILD_INFO.json` | 91 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/extension_standalone/extension/BUILD_INFO.json` | 230 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/extension_standalone/extension/background.js` | 6 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension/bridge.js` | 17 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension/bridge.js` | 163 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension/engine/sentinelle_core.js` | 11 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension/engine/vendor/compare.js` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/extension_standalone/extension/inject.js` | 114 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/BUILD_INFO.json` | 91 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/BUILD_INFO.json` | 230 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/background.js` | 6 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/bridge.js` | 17 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/bridge.js` | 163 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/engine/sentinelle_core.js` | 11 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/engine/vendor/compare.js` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/extension_standalone/extension_sans_reseau/inject.js` | 114 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/out/ECARTS.md` | 3 lignes (3 a 12) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/extension_standalone/out/RESULTATS.json` | 1 lignes (169 a 169) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/extension_standalone/src/background.js` | 6 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/src/sentinelle_core.js` | 11 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs` | 67 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs` | 292 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs` | 293 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` | 107 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` | 135 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/intention_texte/e2e/echantillon.json` | 4234 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/parite/PARITE.md` | 4 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/parite/PARITE.md` | 51 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/parite/results.json` | 648 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/parite/run_parite.mjs` | 1 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/parite/run_parite.mjs` | 23 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/parite/run_parite.mjs` | 151 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/pipeline/RESULTATS_INTEGRATION.md` | 24 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 21 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 235 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 279 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 302 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 474 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 482 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs` | 483 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/detectors_adem/fork_sim.mjs` | 3 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/detectors_adem/fork_sim.mjs` | 6 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/detectors_adem/sim_events.mjs` | 7 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/detectors_adem/sim_events.mjs` | 35 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/detectors_adem/token_guard.mjs` | 6 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/detectors_adem/token_guard.mjs` | 55 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/package.json` | 1 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/vendor/compare.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/vendor/index.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/vendor/index.ts` | 5 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/vendor/server.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/vendor/server.ts` | 283 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/grille/snapshot/engine/vendor/types.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/pipeline/server_integration.diff` | 7 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/server_integration.diff` | 8 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/server_integration.diff` | 10 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/server_integration.diff` | 11 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/pipeline/server_integration.diff` | 21 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/redteam/LOOP_JOURNAL.md` | 28 | historique (journal, handoff, rapport) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/01_extension_securite.md` | 23 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/01_extension_securite.md` | 25 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/02_conformite_jury.md` | 25 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/03_chiffres_et_methode.md` | 120 | phrase sur le nom lui-meme (historique du renommage) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/04_ux_ui.md` | 25 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/04_ux_ui.md` | 51 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/redteam/angles_morts/04_ux_ui.md` | 83 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/redteam/check_product.mjs` | 21 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md` | 45 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md` | 49 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md` | 51 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md` | 61 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md` | 63 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/titouan/T_banc_e2e/redteam/jury_social.jsonl` | 2 lignes (11 a 17) | jeu de cas ou sortie scellee (.jsonl), exclu |
| `research/titouan/T_banc_e2e/run/out/public/MESURE_001.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/public/MESURE_001.md` | 1 lignes (114 a 114) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F21_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F22_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F23_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F24_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F25_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F26_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F27_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F28_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F29_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/F30_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/base_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f11_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f12_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f13_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f14_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f15_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f16_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f17_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f18_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f19_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/f20_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/final_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/run/out/reg/k23_public.json` | 2 lignes (66 a 73) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/README_EXPORT_FR.md` | 79 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/scenarios_export/index.json` | 335 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/index.json` | 1208 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/index.json` | 1213 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/index.json` | 1217 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/index.json` | 1269 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 298 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 299 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 300 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 301 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 302 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 303 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 304 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 305 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 306 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 307 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 308 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 309 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 504 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/scenarios.json` | 519 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/scenarios_export/titres_fr.mjs` | 324 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/security_review/tests/harness_inject.mjs` | 18 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/security_review2/REVUE.md` | 70 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/security_review2/REVUE.md` | 102 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/security_review2/REVUE.md` | 227 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `research/titouan/T_banc_e2e/security_review2/tests/r04_real_engine_value.mjs` | 2 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/security_review2/tests/r05_engine_dos.mjs` | 2 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/server/RAPPORT_TEXTES.md` | 26 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/server/server.mjs` | 6 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 7 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 9 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 10 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 41 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 442 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 483 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 546 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 564 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 617 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 619 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/server.mjs` | 620 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/sync_presentation.mjs` | 4 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/server/sync_presentation.mjs` | 29 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/ui_holdup/UI_CONTRAT.md` | 32 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/ui_holdup/UI_CONTRAT.md` | 99 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/ui_holdup/check_ui.mjs` | 156 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/.env.example` | 1 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/README.md` | 1 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/README.md` | 3 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/README.md` | 27 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/package-lock.json` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/package-lock.json` | 8 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/package.json` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/package.json` | 5 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/src/compare.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/src/index.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/src/index.ts` | 5 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/src/server.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/src/server.ts` | 283 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/vendor_t103/app/intent/src/types.ts` | 2 | copie figee (snapshot ou vendor), garder identique a la source mesuree |
| `research/titouan/T_banc_e2e/webdemo/BUILD_INFO.json` | 3 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/webdemo/BUILD_INFO.json` | 90 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/webdemo/BUILD_INFO.json` | 113 | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/webdemo/README_WEBDEMO_FR.md` | 83 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/build_webdemo.mjs` | 5 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/build_webdemo.mjs` | 71 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/build_webdemo.mjs` | 72 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/build_webdemo.mjs` | 95 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/build_webdemo.mjs` | 119 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/engine/sentinelle_core.js` | 436 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/webdemo/engine/sentinelle_core.js` | 477 | fichier en cours d'edition (commit ou modif < 30 min, ou non commite) : non touche |
| `research/titouan/T_banc_e2e/webdemo/engine/vendor/compare.js` | 2 | vendor : compare.ts entre dans le hash de code des mesures (run_loop, reg_public) |
| `research/titouan/T_banc_e2e/webdemo/js/engine_api.js` | 1 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/js/engine_api.js` | 3 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/js/engine_api.js` | 10 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/out/RESULTATS.json` | 2 lignes (24 a 775) | sortie generee (refaite par les scripts) |
| `research/titouan/T_banc_e2e/webdemo/tests/run_webdemo_tests.mjs` | 42 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/tests/run_webdemo_tests.mjs` | 44 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/T_banc_e2e/webdemo/tests/run_webdemo_tests.mjs` | 45 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/U_segment/U2_populations_et_protection.md` | 97 | nom externe (produit tiers ou source citee) |
| `research/titouan/U_segment/U5a_extensions_mobile.md` | 90 | nom externe (produit tiers ou source citee) |
| `research/titouan/U_segment/U5a_extensions_mobile.md` | 92 | nom externe (produit tiers ou source citee) |
| `research/titouan/U_segment/U5b_signature_mobile.md` | 120 | nom externe (produit tiers ou source citee) |
| `research/titouan/W_livrables/README_DRAFT.md` | 117 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/titouan/W_livrables/RESULTATS_A_JOUR.md` | 5 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tooling/OUTILLAGE.md` | 58 | nom externe (produit tiers ou source citee) |
| `research/tooling/OUTILLAGE.md` | 174 | nom externe (produit tiers ou source citee) |
| `research/tooling/OUTILLAGE.md` | 191 | nom externe (produit tiers ou source citee) |
| `research/tooling/OUTILLAGE.md` | 199 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P3_agents_financiers.md` | 39 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P3_agents_financiers_v2.md` | 109 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P3_agents_financiers_v2.md` | 134 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_alternatives_gratuites.md` | 25 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_connecteurs_implementes.md` | 16 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_connecteurs_implementes.md` | 46 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_connecteurs_implementes.md` | 48 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_connecteurs_testes.md` | 58 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_connecteurs_testes.md` | 93 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_connecteurs_testes.md` | 147 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_defi_dora.md` | 291 | phrase sur le nom lui-meme (historique du renommage) |
| `research/tracks/T1_P4_defi_dora_v2.md` | 142 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_deploiement_reglementaire.md` | 189 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_deploiement_reglementaire.md` | 203 | nom de role technique (contrat), pas le produit |
| `research/tracks/T1_P4_deploiement_reglementaire.md` | 211 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_deploiement_reglementaire.md` | 245 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 13 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 27 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 28 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 32 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 59 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 64 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 190 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 195 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_etat_de_l_art.md` | 196 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_faisabilite_particulier.md` | 16 lignes (48 a 571) | identifiant ou nom de fichier (renommage non sur, voir section 3) ; nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 41 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 58 | nom de role technique (contrat), pas le produit |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 86 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 243 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 244 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 264 | identifiant ou nom de fichier (renommage non sur, voir section 3) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 339 | phrase sur le nom lui-meme (historique du renommage) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 407 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 429 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_integration_ecosysteme.md` | 489 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_nouveaute_verdict.md` | 24 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_nouveaute_verdict.md` | 28 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_nouveaute_verdict.md` | 73 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_nouveaute_verdict.md` | 115 | nom externe (produit tiers ou source citee) |
| `research/tracks/T1_P4_nouveaute_verdict.md` | 155 | nom commun ou mot technique (sentinel value, role sentinel, une sentinelle) |
| `research/tracks/T2_P1_soc_copilot.md` | 47 | nom externe (produit tiers ou source citee) |
| `research/tracks/T2_P1_soc_copilot.md` | 184 | nom externe (produit tiers ou source citee) |
| `research/tracks/T2_P2_mcp.md` | 93 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V2_avalanche_partenaires.md` | 139 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V2_avalanche_partenaires.md` | 143 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 7 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 9 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 45 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 69 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 115 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 121 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 167 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V3_etat_art_concurrence.md` | 176 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V8_chaine_valeur_partenaires.md` | 90 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V8_chaine_valeur_partenaires.md` | 115 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V8_chaine_valeur_partenaires.md` | 186 | nom externe (produit tiers ou source citee) |
| `research/vaccin/V_SYNTHESE.md` | 9 | nom externe (produit tiers ou source citee) |
| `scripts/demo.mjs` | 35 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
| `scripts/demo.mjs` | 38 | nom de variable d'environnement (ancien nom garde en repli ou lecteur non modifiable) |
