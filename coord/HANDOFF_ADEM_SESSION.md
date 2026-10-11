# Passation de la session Claude-Adem (11 oct. 2026, ~04h)

Adem n'a bientôt plus de crédit ; un autre agent prend le relais. Tout est sur `main`.

## ⚠️ ALERTE DÉMO : LE SCÉNARIO HÉROS NE MARCHE PAS (fuzz_sig, 11/10 ~04h30)
Le permit EIP-2612 hors chaîne (signature d'une autorisation illimitée sur USDC vers un inconnu, avec l'intention « réclamer un airdrop ») sort TOUJOURS en warn ou ok, JAMAIS en critical (377 sur 377). C'est exactement la scène principale de la démo (drainer neuf, faux remboursement). Le moteur ne modélise pas une signature Permit comme une approbation : il ne compare ni `value` ni `spender` à l'intention.
Même problème pour :
- le DAI permit (174/174) ;
- un ordre Blur à 0 (148/148) ;
- un personal_sign dont l'hex encode un approve (193/193) ;
- un personal_sign au texte trompeur, qui sort en ok dans 70 % des cas.
Les variantes Permit2 tombent à warn si le montant est énorme sans être exactement 2^160-1.
Correction : un plancher critical pour toute signature qui accorde un droit de dépense ou cède un actif. Concrètement :
- décoder Permit et DAI permit comme des approbations ;
- considérer qu'un montant ≥ 2^128 ou supérieur au solde équivaut à illimité ;
- traiter un personal_sign dont l'hex décode en calldata comme la transaction sous-jacente.
À vérifier avec `node redteam/check.mjs redteam/jury_fuzz_sig.jsonl` (1 101 cas qui doivent passer en critical) AVANT la démo. Les Seaport et eth_sign tiennent déjà (0 contournement).

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
- JURÉ DEFI (`redteam/jury_defi.md`) : 31 contournements sur 60 attaques, 0 fausse alerte.
  Deux angles morts structurels :
  - un transferFrom sortant sous `pay_someone` passe en ok, même vers un inconnu ou un sosie, et jusqu'à 99 % du solde ;
  - un approve(MAX) dans Multicall3 (à toute profondeur) tombe de critical à warn, parce que le plancher ne s'applique qu'à la racine.
  Recommandations :
  - plancher critical récursif dans les lots ;
  - fail-closed sur decode_error, unknown_typed_data et blind_signature.
- FUZZ INTENTION (`redteam/jury_fuzz_intent.md`, avec la carte des seuils exacts) : 43 852 transferts testés, 46 % ne sortent pas en critical.
  Pires résultats :
  - `askedBy` ignoré hors du kind asked_by_someone (10 168/10 168) ;
  - kind absent ou mal formé, avec la casse ou une espace (7 836/7 836) ;
  - la part du solde ne monte jamais au-dessus de warn ; elle n'est pas recalculée ; le fractionnement passe en ok ;
  - une poussière envoyée par l'escroc blanchit son adresse (les entrées de l'historique sont comptées comme connues) ;
  - pay_someone n'est jamais critical vers une adresse jamais vue ;
  - le token n'est jamais comparé ;
  - « 1,000 » ou « 1k » sont lus comme 1.
  Ce qui tient : asked_by_someone, buy_or_swap et connect avec une sortie (15 120/15 120 en critical) ; sosie 4+4.
- FUZZ ENCODAGE (`redteam/jury_fuzz_encoding.md`) : 3 669 cas testés, 2 141 contournements, 940 représentants. Faille centrale : un approve à montant FINI mais énorme (entre 10^7 et 10^30) enfoui dans un lot sort en ok, sans raison ; le même approve envoyé en direct sort en critical. Un approve quasi illimité dans un lot plafonne à warn. Multicall3 imbriqué : 86 % de contournement.
  Ce qui tient :
  - sendCalls avec approve ;
  - calldata direct paddé ;
  - delegatecall ;
  - value avec calldata vide ;
  - aucune fausse alerte sur les lots légitimes.
  Correction : appliquer au chemin récursif la MÊME règle qu'au chemin direct, et considérer comme excessif tout montant supérieur au solde ou à N fois l'intention, pas seulement MAXU.

## Résultats finaux des derniers agents (~05h00)
- BOUCLE DE DÉTECTION (`redteam/LOOP_JOURNAL.md`, `detectors_adem/`, `redteam/check_plus.mjs`), 6 tours. Sur V2_DEV normalisé : arnaques ratées 244 → 49, fausses alertes 204 → 79, sans régression.
  Détecteurs gardés :
  - `indirect_pull`
  - `lookalike_known` (3+4)
  - `spend_rights` (permit et droits vers un spender non vérifiable)
  - `token_guard` (registre officiel et simulation de revente)
  - `sim_events` (filet de simulation sur fork)
  - `nft_orders`
  Test réel sur fork Hardhat local : honeypot ok → critical, taxe 99 % ok → critical, sélecteur drainant inconnu warn → critical, jeton sain ok.
  ⚠️ Sur les fichiers des jurés, mesurés une seule fois, le gain est partiel : fuzz_sig 1 101 → 879 contournements restants (le PERMIT N'EST DONC PAS ENTIÈREMENT RÉGLÉ : vérifier la scène héros avec check_plus avant la démo), fuzz_encoding 940 → 879, jury_defi 31 → 22, fuzz_address 299 → 273. Les fausses alertes des jurés ne bougent pas (jury_fp 22, fuzz_fp 509).
  Pas faits :
  - classifieur de message collé ;
  - seuil cumulé sur les envois fractionnés ;
  - personal_sign de calldata ;
  - carnet empoisonné.
  Ces détecteurs sont dans une COPIE de la chaîne : il faut les intégrer au moteur de Titouan.
- FUZZ FAUX POSITIFS (`redteam/jury_fuzz_fp.md`) : 32 545 opérations honnêtes, 16,2 % en critical et 57,2 % en warn. Déclarer honnêtement son intention donne 3 fois plus de fausses alertes que de ne rien déclarer (12 % contre 4 %), et une intention vague donne les mêmes verdicts qu'une intention complète.
  Pires cas :
  - vrai contact en critical après de la poussière d'un sosie (360/360) ;
  - staking sAVAX/stETH (720/800) ;
  - abonnements et paiements marchands avec autorisation (520/680).
  Fatigue à 100 % sur les agrégateurs, Aave, Benqi, CCTP et Snapshot, faute de décodage.
