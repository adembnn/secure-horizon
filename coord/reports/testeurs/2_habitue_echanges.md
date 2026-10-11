# Testeur 2 : l'habitué des échanges (rapport en cours, mis à jour au fil des parcours)

Date : 11 oct. 2026. Rapport écrit tôt à la demande du coordinateur ; la section « Parcours » est complétée après chaque lot.

## Résumé (comme le dirait l'habitué)

1. Quand je tape une phrase propre (« swap 50 usdc avax »), ça passe : « Ça correspond », environ 1,9 s de plus avant la 1re demande au portefeuille et 3,3 s pour droit + échange, contre 0,03 s et 0,07 s sans l'extension.
2. Dès que j'écris court à ma façon (« approve 50 », « échange max », « 50 dusdc to avax », « 0,000001 usdc -> avax »), il me redemande « Combien, et de quel jeton ? » : une relance de 2 à 3 s de plus, et il faut tout retaper.
3. Si j'écris un montant plus petit que celui du site (« 12,5 USDC » alors que le site demande 50), il dit « Ça correspond », limite le droit à 12,5, puis bloque l'échange avec « Je n'ai pas pu vérifier », 30 s d'attente. Je me retrouve avec un droit de 12,5 et pas d'échange.
4. Aucun parcours où de l'argent ou un droit est parti par surprise dans les lots joués jusqu'ici (lots piège à venir).
5. Il reste à jouer : deux onglets, dix opérations d'affilée, piège approve et signature, réseau lent, relais coupé, redémarrage à froid.

## Mise en place

- Extension testée : copie du dossier construit `research/titouan/T_banc_e2e/extension_standalone/extension/`. L'original a changé trois fois pendant mon test (autre agent). Premières copies inutilisables : 1re (tree 9c1970f1…) = ancien build qui dit « Je ne connais pas ce jeton » (point déjà connu de l'audit) ; 2e (tree b1e81040…, 09h49) = intermédiaire, `gatekeeper.js` importe `./revoke.js` qui n'était pas encore dans le dossier : le service worker ne démarre pas, AUCUNE fenêtre, la demande part sans vérification (voir problème 6). Copie utilisée pour tous les parcours : **tree_sha256 `6ab24098ef88ffee9bf12563949c382b114bd56e72ba9796280c72fdf6220ca3`, total_bytes 670681**, `build: holdup-standalone`, `extension_id: amiobigoknpbnkhfhidhdobjnmdciioe`, `network: relais local 127.0.0.1:8789, phrase ecrite seulement`.
- Chaîne locale à moi : Hardhat 8602 (`HOLDUP_CHAIN_MODE=plain HOLDUP_CHAIN_ID=43114 HOLDUP_PORT=8602`, adresses écrites avec `HOLDUP_CHAIN_OUT_DIR` dans mon dossier temporaire, pas dans `chain/addresses.local.json`). Site Neve copié, servi sur 8702. Relais Clef partagé 8789 : accepte l'extension (« intention classée par Clef »).
- Pilote : Chromium 1243, `--headless=new`, portefeuille simulé dans la page (clé neuve, soldes 1000 DUSDC et 100 AVAX de test, droits remis à zéro avant chaque parcours). Scripts hors dépôt (dossier temporaire de la session). Le site n'a pas de champ de montant : le montant de 50 DUSDC est fixe, les « changements de montant » se font dans la phrase.
- Le temps ajouté exclut ma frappe (remplissage instantané) ; il inclut l'ouverture de la fenêtre, la classification et la fermeture auto de la fenêtre.

## Parcours joués (lots 1 et 2 : site honnête)

Référence sans extension (3 essais) : 1re demande au portefeuille 21 à 26 ms, droit + échange 58 à 103 ms.

| Id | Ce que j'ai écrit | Ce que l'écran a dit | Portefeuille / soldes | Temps 1re demande / fin | Verdict |
|---|---|---|---|---|---|
| H01 | swap 50 usdc avax | Ça correspond (50 USDC, pas plus) | approve 50 + swap ; DUSDC -50, droit 0 | 1,92 s / 3,35 s | protégé |
| H02 | 12,5 USDC -> AVAX (annulé) | Ça correspond, « Droit limité à 12,5 USDC » | rien | n/a | protégé (voir problème 1) |
| H02b | idem, je laisse passer | idem, puis demande n° 2 : « Je n'ai pas pu vérifier », « La simulation échoue », 30 s | approve 12,5 seulement, échange jamais envoyé, droit 12,5 reste | 2,08 s / bloqué | gêné sans raison |
| H03 | approve 50 | « Combien, et de quel jeton ? » | rien | n/a | gêné sans raison |
| H03b | approve 50 puis « approve 50 usdc » | Ça correspond, 2e demande passe sans fenêtre | approve 50 + swap | 3,47 s / 4,92 s | gêné (relance) |
| H04 | échange max | relance | rien | n/a | gêné sans raison |
| H04b | échange max puis « échange 50 usdc contre avax » | Ça correspond | approve + swap | 3,45 s / 4,89 s | gêné (relance) |
| H06 | 0,000001 usdc -> avax | « Que veux-tu faire, et pour combien ? » (le montant n'est pas lu) | rien | n/a | gêné sans raison |
| H06b | idem puis « swap 0.000001 usdc avax » | Ça correspond, droit limité à 0,000001 USDC ; demande n° 2 bloquée | approve de 1 unité (0,000001), échange non envoyé | 1,81 s / bloqué | gêné sans raison |
| H07 | swap 50000000 usdc avax | Ça correspond (50 USDC, pas plus) | annulé par moi, rien | n/a | protégé |
| H08 | swap 50 usdc | Ça correspond | approve + swap, -50 | 1,85 s / 3,29 s | protégé |
| H09 | 50 dusdc to avax | relance « Combien, et de quel jeton ? » | rien | n/a | gêné sans raison |
| H10 | `  SWAP 50,00 USDC contre AVAX  ` | Ça correspond | approve + swap, -50 | 2,48 s / 4,15 s | protégé |
| H11 | Entrée vide puis swap 50 usdc avax | rien à l'écran sur l'entrée vide, puis Ça correspond | approve + swap | 2,85 s / 4,27 s | protégé |
| H12 | double clic sur Échanger | une seule fenêtre, Ça correspond | une seule paire de demandes | 2,38 s / 3,83 s | protégé |
| H18 | buy avax with 50 usdc | Ça correspond | approve + swap | 2,01 s / 3,58 s | protégé |
| H19 | 50 usd -> avax | Ça correspond (« 50 USD ») | approve + swap | 1,93 s / 3,37 s | protégé |
| H20 | sell 1000 usdc for avax | Ça correspond (50 USDC, pas plus) | approve + swap | 1,87 s / 3,30 s | protégé |

Lot 1 et 2 : 20 parcours, 0 piégé. Médiane de la 1re demande (parcours qui passent sans relance, ma frappe exclue) : 1,93 s ; pire : 2,85 s. Fin d'opération (droit + échange) : médiane 3,37 s, pire 3,83 s sans relance ; 4,9 s avec relance. Fenêtre ouverte 126 à 260 ms après le clic ; verdict 570 à 800 ms après Entrée (1,1 s pour « SWAP 50,00 »). Mesures brutes (JSON) dans le dossier temporaire du testeur, non versionnées.

## Problèmes (par gravité ; piégé d'abord : aucun trouvé pour l'instant)

1. **NOUVEAU : montant écrit plus petit que celui du site : « Ça correspond », puis l'échange bloque.** Reproduction : site `?mode=honnete`, Connecter, Échanger, écrire « 12,5 USDC -> AVAX » (ou « 0,000001 usdc -> avax » puis « swap 0.000001 usdc avax »). Attendu : « Ça ne correspond pas : le site demande 50, tu as écrit 12,5 », ou au moins pas de « Ça correspond ». Obtenu : titre « Ça correspond à ce que tu as écrit. », ligne « Droit limité à 12,5 USDC. Le site demandait un accès à 50 USDC. », le portefeuille reçoit `approve(routeur, 12,5)`, puis la fenêtre reste avec « Demande n° 2 de la même opération. Je n'ai pas pu vérifier cette demande. La simulation échoue », 30 s ; le site reste sur « Confirmez l'échange. ». Capture : `2_captures/H02_p0_v.png`, `2_captures/D1_later.png`. Code probable : `extension_standalone/extension/gatekeeper.js` (plan de limitation, `limitPlan` dans `written_check.js`). Ne confondre avec EXHAUSTIVITE E1b (appel plus gros que la phrase). Effet : droit de 12,5 resté accordé au routeur ; pas de perte.
2. **NOUVEAU : les abréviations d'habitué ne sont pas lues.** « approve 50 », « échange max », « 50 dusdc to avax » (DUSDC est le ticker affiché par le site), « 0,000001 usdc -> avax » donnent une relance et il faut tout retaper (le champ est vidé) ; coût +2 à 3 s mesuré (H03b/H04b : 1re demande à 3,4 s). Le montant très petit « 0,000001 » n'est pas lu. Captures : `H06_p0_v.png`, `H09_p0_v.png`. Code : `intent_text.js` / `keyword_intent.js` / relais Clef.
3. **NOUVEAU (à confirmer) : saisie sans l'ancien texte après relance.** La relance efface la phrase déjà écrite sans la rappeler (voir H06_p0_v.png, champ vide avec exemple). Gênant pour dix opérations par jour.
4. **Déjà connu** : entrée vide, aucun message (AUDIT point 24). Capture : `H11_p0_empty.png`.
5. **Déjà connu** : « Droit limité » contredit le titre ; deux fenêtres qui se succèdent (EVAL_DESIGN F1, F6).
6. **NOUVEAU : un build intermédiaire sans `revoke.js` laisse partir les demandes sans aucune fenêtre.** Dans le dossier construit vu à 09h49, `gatekeeper.js` importait `./revoke.js` absent ; le service worker ne démarrait pas ; Échanger puis Échanger : l'état du site restait « Confirmez l'autorisation », rien n'arrivait au portefeuille (donc échec fermé, pas de fuite, mais aucun message pour l'utilisateur). Corrigé à 09h54 (revoke.js présent). Gravité : le build doit être vérifié par un test de chargement avant livraison.

## Pas encore joué (lots suivants, ce rapport sera complété)

- Site piège approve et signature (script `b3` prêt : 12 parcours dont annulation, clic Continuer immédiat, « échange max », très grands et très petits montants).
- Deux onglets, deux fenêtres ouvertes, opération honnête puis piège dans le même onglet dans les 90 s (réutilisation de la phrase), dix opérations d'affilée, portefeuille lent, nœud lent, relais coupé, redémarrage à froid.

## Ce que je n'ai pas pu tester

- Vrai portefeuille, vraie extension de portefeuille, vraie chaîne Avalanche : non (simulation locale, par règle).
- Relais en panne : le relais est partagé, je ne l'arrête pas (prévu : copie de l'extension pointée sur un port mort).
