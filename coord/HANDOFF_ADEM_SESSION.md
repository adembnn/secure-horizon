# Passation de la session Claude-Adem (11 oct. 2026, ~04h)

Adem n'a bientôt plus de crédit ; un autre agent prend le relais. Tout est sur `main`.

## PRIORITÉ N°1 : BRANCHER JEV OU CLEF POUR DE VRAI (exigence d'Adem, le jury en a parlé)
Constat (11/10 ~04h20) : ni Jev ni Clef ne sont appelés. Aucune clé n'est présente dans l'environnement (CF_ACCOUNT_ID, CF_API_TOKEN, JEV_API_KEY sont absentes). De plus, la classification du message collé n'est pas branchée dans la chaîne du banc : le juré social montre qu'un faux support classique passe en `ok`.
1. HUMAIN (Adem ou Titouan), environ 5 min, puisqu'un agent n'a pas le droit de créer de compte ni de saisir de clé :
   - Clef : créer un compte Cloudflare gratuit, puis un token API avec la permission Workers AI, et mettre CF_ACCOUNT_ID et CF_API_TOKEN dans `.env` (gitignoré).
   - Jev : créer un compte TypeSafe (docs.typesafe.ai) et mettre JEV_API_KEY dans `.env`.
2. AGENT : utiliser le skill `typesafe-ai` (~/.claude/skills/typesafe-ai), qui renvoie vers les docs à jour (https://docs.typesafe.ai/llms.txt, puis api.md, primitives.md, confidence.md). Corriger l'adaptateur de `app/intent/src/providers/` d'après le contrat d'API réel, sans rien inventer de mémoire.
3. AGENT : brancher `classifyMessage` (et `parseIntent` pour le texte libre) dans la chaîne (`redteam/check_plus.mjs`, puis la politique de Titouan). Un message classé fake_support, seed_phishing, fake_refund ou fake_job, ou un texte libre du type « le monsieur au téléphone m'a dit », fait MONTER le verdict au niveau Manipulation ; il ne peut jamais le faire baisser. Le texte collé est traité comme une DONNÉE délimitée (anti-injection). Sans clé, on passe sur le repli par mots-clés et on l'indique.
4. MESURER : comparer Jev, Clef et mots-clés sur les 546 messages collés de `blind_adem/v2/fraud_ambig` et sur `redteam/jury_social.jsonl`, avec rappel, fausses alertes, latence et coût. Le modèle n'apparaît dans le pitch que s'il fait mieux que les mots-clés, avec le chiffre.

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

## Mise à jour finale (~04h10)
- Deux fuzzers (social, tokens) ont été arrêtés par un classifieur de sécurité au moment de générer en masse des messages d'escroquerie et des transactions d'arnaque visant de vrais contrats. Ne pas contourner. Travailler à partir des échecs existants : sur les 1 053 cas token/swap/pont de V2_DEV, on compte 61 arnaques ratées (surtout swap au destinataire tiers et amountOutMin=0) et 20 fausses alertes DeFi.
- La relance automatique des vagues (cron) est arrêtée, car elle se perdait à la fin de la session et coûtait des crédits. À relancer seulement si besoin, par surface, sur les champs structurés.
- `redteam/V2_DEV_norm.jsonl` (> 20 Mo) n'est pas commité : le régénérer avec `node redteam/normalize_v2.mjs`.
- Des agents lancés juste avant la passation (jurés, fuzzers sig/encoding/address/intent/control/fp, boucle de détection) peuvent encore écrire dans `redteam/` et `detectors_adem/` : commiter ce qu'ils déposent.
- JURÉ FAUX POSITIFS (`redteam/jury_fp.md`) : sur 123 opérations honnêtes sur Avalanche, 22 sortent en critical (17,9 %) et 63 en warn. À corriger en priorité :
  - le séparateur décimal français (« 10,5 AVAX » vu comme un montant supérieur à celui annoncé) ;
  - un vrai contact passe en critical dès qu'un sosie a envoyé de la poussière ;
  - il manque un type d'intention « déposer/prêter/bridger » (Aave, Benqi, CCTP en critical) ;
  - le staking sAVAX ;
  - l'ajout de Fuji avec son RPC officiel ;
  - la première mise en vente OpenSea ;
  - les fonctions swap*AVAX de LFJ/Pangolin, non décodées.
- JURÉ SOCIAL (`redteam/jury_social.md`) : 42 contournements sur 74 attaques, dont 30 en `ok`. Priorités :
  - brancher la classification du message collé : il n'est jamais lu, donc un faux support classique passe en ok ;
  - intention dictée par l'escroc : 45 % du solde passe en ok ;
  - le carnet empoisonné l'emporte sur l'historique ;
  - sosies 4+3 et 2+5 ;
  - écart de token (dit USDC, envoie AVAX ou USDT) non vérifié ;
  - personal_sign et statement SIWE non analysés ;
  - texte libre non lu ;
  - pig butchering, étape 2.
- FUZZ ADRESSES (`redteam/jury_fuzz_address.md`) : 8 360 cas testés, 3 466 contournements (381 représentants).
  Ce qui tient :
  - sosie fort (préfixe ≥ 3 et suffixe ≥ 4) : 1403/1403 ;
  - adresse choisie dans le carnet : 1014/1014 ;
  - aucune fausse alerte sur les vrais contacts qui partagent 1 à 3 caractères.
  Trous :
  - M1 « Payer Paul » sans counterpartyAddress : le label n'est jamais cherché dans le carnet, n'importe quelle adresse passe ;
  - F1 : la poussière reçue est comptée comme une adresse connue, donc le vrai contact passe en critical (258/258) ; il faut tenir compte du sens des transactions ;
  - M4 : la liste blanche des routeurs s'applique à un simple envoi de fonds ;
  - M5 : « Payer mon Binance » contourne la règle « adresse jamais vue ».
