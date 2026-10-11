# Passation de la session Claude-Adem (11 oct. 2026, ~04h)

Adem n'a bientôt plus de crédit ; un autre agent prend le relais. Tout est sur `main`.

## Direction (figée)
- D-007 : barrière d'intention pour les wallets grand public, sur Avalanche (Fuji pour la démo, C-Chain pour les mesures). Voir `docs/BRIEF_direction.md`, `docs/intent-barrier.md` et `PRODUCT.md`.
- Grilling d'Adem :
  - extension navigateur MV3, pas de Snap ;
  - intention demandée seulement si l'opération donne un droit ou fait sortir des fonds ;
  - grille Manipulation 10 min / Danger (phrase à retaper + 30 s) / Attention / OK ;
  - Clef et Jev pour classer messages, domaines et pages ; les adresses sont notées en code ;
  - promesse « avertit et ralentit » ;
  - démo gérée par les humains.
- Critères Avalanche : blockchain là où elle apporte une valeur réelle. Concrètement : journal des verdicts chaîné par hash, racine ancrée sur Fuji (preuve pour la victime, l'assureur ou la police), adresses dans `blockchain/DEPLOYMENTS.md`.

## Design
- Direction choisie : Figma sobre et centrée, `docs/design/v4/R3-figma/` (artefact https://claude.ai/artifact/Kvqf32JWvFfWmP2D1TqEeh).
- Adresses affichées en grille 2×5.
- Toujours utiliser les skills de design d'Adem : `.claude/skills/impeccable`, `avoid-ai-writing`, `tour-de-design`.
- Les textes doivent être plus précis, une fiche par menace (demande faite à Titouan : `research/titouan/U_textes_utilisateur.md`).

## Code et banc (dossier `research/titouan/T_banc_e2e/`, piloté par Titouan)
- Moteur `engine/`, politique `run/policy.mjs`, boucle `run/run_loop.mjs`, extension `extension/`, couverture `COUVERTURE.md`.
- T-101 (contrats de démo) et T-103 (comparateur + API) sont fusionnés sur main.
- Chiffres :
  - R003 : simulation seule 30 %, moteur 85 %, avec intention 89 % ; 21 % de fausses alertes critiques.
  - Après 10 correctifs, sur DEV : 100 % / 0 %. C'est du réglage, pas de la robustesse.
  - Banc réel : rappel 24/33 (73 %) après correction des révocations.

## Jeux de test (dossier `blind_adem/`)
- Jeu aveugle v1 : 150 cas, SHA-256 `38ebd60c…90aa`, à passer UNE fois (MSG-048/049).
- Jeu massif v2 : 8 425 cas écrits à l'aveugle, `v2/V2_DEV.jsonl` (5 927) et `v2/V2_TEST.jsonl` (2 498, GELÉ, SHA-256 `ab2aa0b4…393c`). Le schéma de contexte diffère : passer par `redteam/normalize_v2.mjs`.

## Red team en cours (dossier `redteam/`)
- `check.mjs` : boîte noire fidèle à run_loop, 385/385 verdicts identiques.
- `BRIEF_ATTAQUANT.md` : consignes des fuzzers. `BYPASS_REGISTRY.md` : registre des contournements.
- Agents lancés, dont les livrables `jury_*.jsonl` / `.md` arrivent dans `redteam/` :
  - jurés defi, social, fp ;
  - fuzzers sig, encoding, tokens, address, intent, control, fp.
- Boucle de détection : `detectors_adem/` + `redteam/check_plus.mjs` + `redteam/LOOP_JOURNAL.md`. Priorités :
  - jetons piégés (registre officiel + simulation de revente) ;
  - exécution indirecte (décodage récursif + simulation sur fork) ;
  - fausses alertes NFT/Seaport ;
  - sosie 3+4 non branché ;
  - `classifyMessage` non branché (le message collé ne change rien).
- Constat red team intention : le `kind` déclaré décide presque tout. Avec `send_to_my_account` ou `pay_someone` vers une adresse que l'escroc a placée dans le carnet, le verdict est `ok`. Sous 50 % du solde, aucun warn.
- Interdit : générer de nouveaux messages d'escroquerie ou d'injection (un classifieur de sécurité bloque) ; réutiliser seulement les messages existants.

## Failles dangereuses pour le jury (`pitch/JURY_ATTAQUES.md`)
1. Fausses alertes : 23 % sur le seul TEST ouvert ; un listing Seaport honnête sort en critical.
2. L'extension n'a jamais tourné avec un vrai MetaMask. Le service worker MV3 peut mourir vers 5 min, ce qui casse la retenue de 10 min ; la fenêtre affichée dans la page est imitable (passer au side panel).
3. La règle sosie 3+4 n'est pas branchée.

## Actions humaines en attente
- Adem : clé Cloudflare (`CF_ACCOUNT_ID`, `CF_API_TOKEN` dans `.env`) pour Clef ; clé du wallet de test Fuji (`FUJI_PRIVATE_KEY` dans `.env`) pour déployer T-101 et l'ancrage.
- Trancher : tutoiement ou vouvoiement ; ce qui se passe après les 10 min ; les cas exacts de la barrière de 30 s.

## Tableaux de bord
- Salle de pilotage : https://claude.ai/artifact/M4wSwtvbfQFa6fxj5dD22g (`docs/dashboard/`).
- Démo du banc : https://claude.ai/artifact/Wuiz9nrAX16dRnTNvoodkh (`docs/demo/banc/`). À mettre à jour dans `data.json` quand les résultats aveugles arrivent.

## Coordination
- Messages vers Titouan : `coord/INBOX.md`, de MSG-001 à MSG-053.
- Script d'envoi : ajouter une ligne `ISO-date | adem | MSG-xxx | texte` dans INBOX, puis commit et push.
- Pas de Bedrock. Sous-agents locaux autorisés ; Adem a demandé Opus pour la red team.
