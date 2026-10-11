# Alternatives gratuites aux connecteurs bloqués ou absents (10 oct. 2026, ~22h50)

> Complète `T1_P4_connecteurs_testes.md` (sections 3 et 4).
> **Testé** : commande exécutée par la session d'orchestration, résultat réel.
> **Doc** : documentation officielle lue par un agent, sans exécution.

## Testé en direct
| Test | Commande | Résultat |
|---|---|---|
| ntfy.sh, notification sans compte | `curl -d "Hold up : test synthetique…" ntfy.sh/<sujet aléatoire 24 hex>` | **Fonctionne** : réponse `{"event":"message",…}`. Aucun compte. Le sujet aléatoire sert de mot de passe : ne rien envoyer de sensible |
| GitHub CLI pour les tickets d'incident | `gh auth status` | **Fonctionne** : connecté (compte adembnn). `gh issue create` disponible. Aucune issue créée |
| Docker, pour un SIEM ou un chat local | `docker --version` | **Disponible** : Docker 29.6.2 |
| Déployeur déterministe d'Arachnid sur Fuji | `eth_getCode 0x4e59b44847b379578588920cA78FbF26c0B4956C` | **Présent** : bytecode non vide |
| Safe singleton factory sur Fuji | `eth_getCode 0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7` | **Présent** : bytecode non vide |
| ERC-2470 singleton factory sur Fuji | `eth_getCode 0xce0042B868300000d44A59004Da54A005ffdcf9f` | **Présent** : bytecode non vide |

Conséquence : on peut **déployer nous-mêmes Safe 1.5.0 sur Fuji**, aux adresses déterministes. Son `IModuleGuard` règle le contournement du Guard par un module, signalé par Claude-Titouan. Zodiac Roles v2 est déployable de la même façon (déduit, non testé).

## Alternatives retenues
| Bloqué ou absent | Alternative | Statut | Effort | Ce qu'on montre |
|---|---|---|---|---|
| Slack, Teams, PagerDuty | **ntfy.sh** (application téléphone gratuite) | testé | 0,5 h | Le téléphone sonne au blocage |
| Slack (format) | Webhook Discord avec suffixe `/slack` : le même payload Slack, mais un compte Discord est requis une fois. Ou **Mattermost** en Docker, compatible avec les webhooks Slack | doc | 1 à 3 h | Le payload Slack livré dans un vrai chat |
| Jira, ServiceNow | **`gh issue create`** sur un dépôt dédié à la démo, pas celui de l'équipe sans accord | testé (auth) | 1 h | Ticket d'incident avec ses preuves |
| Splunk, Sentinel | Elastic, OpenSearch ou Loki en Docker, avec ingestion du JSON OCSF brut. Splunk Free exige une inscription pour le téléchargement | doc, Docker dispo | 2 à 3 h | L'alerte arrive dans un vrai outil SIEM |
| Sandbox Fireblocks | Dépôt officiel `fireblocks/plugin-based-callback-handler` (MIT, Docker, port 8000), avec nos propres clés JWT générées en local | doc | 3 à 4 h | Refus avant signature au format Fireblocks |
| Webhooks AvaCloud | WebSocket `wss://api.avax-test.network/ext/bc/C/ws` (`newHeads`, `logs`), sans clé | testé par les sondes précédentes | 1 h | Alerte en temps réel |
| Safe 1.5.0 (ModuleGuard) | Auto-déploiement via la singleton factory présente sur Fuji (paquet `safe-smart-account`) | factory testée | 2 à 6 h | Garde qui couvre aussi les modules |
| Zodiac Roles v2 | Auto-déploiement déterministe, ou rôle OpenZeppelin dans le coffre | déduit | 2 à 6 h | Ne pas le promettre |
| Traces debug | Fork local de Fuji avec Hardhat (`debug_traceTransaction`). Éviter avalanche-cli et tmpnet sous Windows | doc | 1 h | Trace d'appel d'une transaction |
| Chainlink Proof of Reserve | `MockV3Aggregator` étiqueté « mock » | doc | 1 à 2 h | Même interface `latestRoundData` |
| API de dépôt AMF | **XLSX officiel AMF v1.2** téléchargeable sans compte : `amf-france.org/…/dora-incident-reporting-template-v1.2.xlsx`, 6 feuilles | téléchargé par un agent | 0,5 h | Le fichier officiel pré-rempli |

## Mapping, à valider
- ntfy, chat et SIEM : DE.AE, RS.CO.
- Garde et handler : PR.AA, RS.MI.
- Traces : DE.AE.
- Mock PoR : DE.CM.
- D3FEND et ATT&CK : à vérifier sur les sites MITRE.
