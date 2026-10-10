# Sentinelle : connecteurs implémentés (preuves exécutées)

Date : 10 oct. 2026. Données synthétiques, aucune transaction signée sur Fuji, aucune clé existante lue.
Racine des PoC (appelée `$PoC` plus bas) : `C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors`
Chaque PoC a un `PROOF.md` et un `run-proof.sh` à relancer. Les efforts d'intégration sont des estimations, pas des mesures.

## Tableau

| Connecteur | Approche qui a marché | Preuve observée par le vérificateur | Tentative | Dossier du PoC | Effort d'intégration | Ce qu'on montre au jury |
|---|---|---|---|---|---|---|
| Fireblocks (co-signer) | Handler de callback réécrit en Node, format du dépôt officiel (JWT RS256 entrant, JWT signé sortant) | Rejoué : 2 500 USD vers adresse connue = APPROVE ; 250 000 USD vers adresse inconnue = REJECT avec raison ; clé inconnue / payload modifié = 403, JWT expiré = 401 ; 13 contrôles OK, vérifié aussi par `openssl` | 1 | `$PoC/fireblocks-cosigner/attempt-1` | Faible (0,5 j) : brancher `policy.mjs` sur le moteur de règles | Un retrait trop gros ou vers une adresse inconnue est refusé par Sentinelle avant signature |
| BitGo (politique webhook) | Serveur Node pur au format documenté (200 = laisse passer, sinon refus) ; mode signé JWT | Rejoué : exemple de la doc = 200 ; drain vers adresse inconnue = 403 ; plafond dépassé = 403 ; corps invalide = 400 ; mauvaise clé = 401 ; clé publique BitGo (JWKS) importée | 1 | `$PoC/bitgo-policy/attempt-1` | Faible (0,5 j), même politique que Fireblocks | Même moteur, deuxième custodien : « un seul garde, plusieurs coffres » |
| Chat compatible Slack | Mattermost en Docker, webhook entrant au format Slack, configuré par API | Rejoué sur volume vierge : webhook HTTP 200, message relu par l'API avec couleur, titre et 3 champs intacts | 1 | `$PoC/chat-slack-compatible/attempt-1` | Très faible (2 h) : un POST JSON | L'alerte rouge arrive dans le canal de l'équipe sécurité |
| SIEM (OCSF) | Événement OCSF 1.3.0 « Detection Finding » (2004), validé contre le schéma officiel puis poussé dans Grafana Loki | Rejoué : événement VALID, contrôle négatif rejeté, push HTTP 204, requête LogQL renvoie 1 ligne identique à l'original | 1 | `$PoC/siem-ocsf/attempt-1` | Faible (0,5 j) : émettre ce JSON à chaque détection | « Notre alerte se lit dans n'importe quel SIEM moderne » |
| Ticketing | Gitea auto-hébergé en Docker, ticket d'incident créé par API | Rejoué : ticket #1 créé puis relu (état ouvert, labels severity:critical et dora:major-ict-incident, liens de preuve) | 1 | `$PoC/ticketing/attempt-1` | Faible (0,5 j) ; l'API ressemble à GitHub sans être identique | Un incident DORA ouvert tout seul avec ses preuves |
| Safe 1.5.0 Module Guard | Contrats officiels Safe 1.5.0 et 1.4.1, SentinelGuard (liste blanche + plafond), Hardhat local et fork Fuji | Rejoué : 7 tests verts en local, 7 sur le fork Fuji. En 1.5.0 la sortie par module est bloquée ; en 1.4.1 elle contourne le Guard (l'attaquant est payé) | 1 | `$PoC/safe15-moduleguard/attempt-1` | Moyen (1 à 2 j) : déploiement sur Fuji, hors périmètre de cette preuve | Le coeur du produit : le contournement par module existe en 1.4.1 et est fermé en 1.5.0 |
| Zodiac Roles | Safe 1.4.1 + Roles v2 (bytecode officiel 2.1.0), rôle qui n'autorise que `tighten` | Rejoué : 9 tests verts dans 3 modes (source, bytecode officiel, fork Fuji). `tighten` passe ; `relax`, autre cible, delegatecall, envoi de valeur et non-membre sont refusés (ConditionViolation) | 1 | `$PoC/zodiac-roles/attempt-1` | Moyen (1 j) : piège connu, `scopeTarget` avant `allowFunction` | « Sentinelle peut seulement resserrer le plafond, jamais le relâcher » |
| Fork Fuji + traces | Hardhat 2 en fork de Fuji, `debug_traceTransaction`, parseur maison des CALL avec valeur | Rejoué : contrat local rejoué avec 3 transferts internes extraits ; vraie transaction Fuji rejouée avec le même hash, 99 172 structLogs, profondeur 8, transferts extraits | 1 | `$PoC/fork-traces/attempt-1` | Moyen (1 j) : le parseur est à durcir | Les sorties de fonds cachées dans des appels internes sont vues |
| Chainlink feeds | Un seul `readFeed()` en lecture seule (ethers) | Rejoué : lit le vrai flux AVAX/USD de Fuji (chaîne 43113, 10,49 USD) et un mock local (chaîne 31337) avec le même code | 1 | `$PoC/chainlink-feeds/attempt-1` | Faible (0,5 j) ; ajouter un seuil de fraîcheur | Valorisation en USD des sorties, et mock pour simuler une preuve de réserves |
| Temps réel (WebSocket) | Abonnement aux nouveaux blocs et aux logs, deux fournisseurs publics, reprise après coupure | Rejoué : 23 à 24 blocs en 60 s, 0 bloc manquant, reconnexion en moins de 1 s, nouveau bloc 7 à 11 s après la coupure | 1 | `$PoC/realtime-ws/attempt-1` | Faible (0,5 j) | Détection en quelques secondes, et le flux repart seul après une coupure |
| Formulaire AMF DORA | Gabarit officiel v1.2 téléchargé, rempli en modifiant directement le XML (`fill-xml.mjs`) | Rejoué : exactement 27 cellules modifiées, toutes voulues, relecture OK ; menus déroulants (21) et protection conservés | 1 | `$PoC/amf-xlsx/attempt-1` | Faible (0,5 j) | Le dossier DORA sort rempli, au format officiel, en un clic |
| Notification (ntfy) | Publication JSON avec priorité 5, tags et lien Snowtrace | Rejoué : message reçu dans le flux JSON sur ntfy.sh et sur un serveur ntfy local Docker | 1 | `$PoC/notif-ntfy/attempt-1` | Très faible (2 h) | Le téléphone vibre quand une sortie est bloquée |

## Échecs

Aucun : les 12 connecteurs ont réussi dès la tentative 1. Il n'y a donc pas de « meilleure piste restante » à traiter. Les points faibles ci-dessous sont à dire honnêtement, pas à cacher.

## Limites à ne pas oublier

- Fireblocks et BitGo : ce sont nos serveurs qui prouvent le format documenté. Aucun appel venu d'un vrai Fireblocks ou BitGo (il faudrait un compte). Le conteneur officiel Fireblocks (Python) n'a pas été lancé. Dire « compatible avec le format documenté », jamais « testé avec Fireblocks ».
- Safe, Zodiac, traces : tout tourne en local ou sur fork Fuji. Rien n'est déployé ni signé sur Fuji réel. Le déploiement déterministe de Roles (factory ERC-2470) reste à tester. Le build de Roles depuis la branche principale dépasse la limite de taille : prendre le bytecode publié 2.1.0.
- Les propriétaires du Safe peuvent toujours retirer le Guard (`setModuleGuard(0)`) : à présenter comme une limite connue.
- Mattermost : le nom d'expéditeur du payload n'est pas appliqué (option désactivée). Relecture par API, pas dans l'interface web.
- SIEM : validateur OCSF maison, pas l'outil officiel ; Loki n'a pas de règles de corrélation.
- AMF : seule la notification initiale est remplie, fichier non ouvert dans Excel. Le dépôt réel demande un compte, non fait.
- ntfy : réception vérifiée dans le flux, pas sur un vrai téléphone. Sur ntfy.sh le nom du sujet tient lieu de mot de passe.
- Temps réel : un seul run de 60 s par fournisseur. Sur Fuji, le filtre ERC-20 n'a rien reçu (testnet calme) ; il n'est prouvé qu'en local. La reprise des blocs manquants n'a pas été exercée en vrai.
- Chainlink : pas de flux officiel de preuve de réserves testé sur Fuji.
- Traces : Hardhat 2 n'a pas de `callTracer`, le parseur ne gère pas les CREATE avec valeur ni SELFDESTRUCT.

## PoC réutilisables par les workers de build

Tous sous `$PoC/<nom>/attempt-1/` (racine complète en haut du fichier). Relancer avec `bash run-proof.sh`. Pour Mattermost, ntfy, Loki et Gitea, Docker Desktop doit être lancé.

- Politique de garde : `fireblocks-cosigner/attempt-1/src/policy.mjs`, `src/server.mjs`, `src/jwt.mjs` ; `bitgo-policy/attempt-1/server.mjs`
- Contrats : `safe15-moduleguard/attempt-1/contracts/SentinelGuard.sol` et `test/moduleguard.test.js` ; `zodiac-roles/attempt-1` (tout le dossier)
- Détection : `fork-traces/attempt-1/scripts/proof.js` ; `realtime-ws/attempt-1/monitor.mjs` ; `chainlink-feeds/attempt-1/scripts/client.js`
- Sorties : `siem-ocsf/attempt-1/event.ocsf.json` et `validate.mjs` ; `chat-slack-compatible/attempt-1/slack-payload.json` ; `ticketing/attempt-1/run-proof.sh` ; `notif-ntfy/attempt-1/sentinelle-notify.sh`
- Dossier DORA : `amf-xlsx/attempt-1/fill-xml.mjs` (utiliser celui-là, pas `fill.mjs` : exceljs seul détruit les menus déroulants et des noms définis du gabarit)

Règle de reprise : copier le code dans la branche `t/<ID>` de la tâche concernée, ne pas travailler dans le dossier de brouillon, et ne jamais commiter de clés (les clés de test sont générées par les scripts, dans des dossiers gitignorés).
