# P1 — GitHub Security Advisories : agents IA & MCP (sources primaires, relevé du 2026-10-10)

> Données brutes, pas de synthèse d'éditeur. https://github.com/advisories (type:reviewed)

## Volume
- Requête `mcp` : **476 advisories revues**. Requête `agent prompt injection` : 132.
- Rythme observé sur la seule 1re page : **25 advisories MCP/agents entre le 24 sept. et le 9 oct. 2026** (~2 par jour).

## Échantillon (25 plus récentes, requête `mcp`)
| Date | Paquet | Sév. | Mécanisme |
|---|---|---|---|
| 08/10 | praisonai | High | Transport MCP HTTP-stream sans auth par défaut → n'importe qui énumère et appelle les outils |
| 08/10 | praisonai | High | Générateur YAML → code Python non échappé |
| 08/10 | praisonai | High | Contrôle « localhost » contourné via l'en-tête Host |
| 08/10 | praisonai | Mod | Templates de commandes lisent hors workspace → fichiers injectés dans le prompt |
| 07/10 | langflow | **Crit** | Commandes arbitraires dans la config d'un serveur MCP stdio → RCE |
| 07/10 | langflow | High | Ressources MCP non cloisonnées → fichiers d'autres projets |
| 07/10 | langflow | High | X-Forwarded-For falsifié → écriture de config |
| 06/10 | @payloadcms/plugin-mcp | High | Permissions des clés API MCP non appliquées |
| 06/10 | @modelcontextprotocol/client | High | **Le SDK MCP officiel envoie les identifiants OAuth à un serveur d'autorisation choisi par le serveur MCP** |
| 06/10 | vllm | Low | Sel de cache perdu → un tenant sonde les préfixes d'un autre |
| 05/10 | langflow | **Crit** | Clé Fernet dérivée de random.seed() → chiffrement devinable |
| 02/10 | siyuan | High | Outils d'agent : SSRF par DNS rebinding (TOCTOU) |
| 02/10 | siyuan | Mod | Upload MCP lit des chemins absolus |
| 02/10 | rmcp (Rust) | Mod | Client OAuth suit une URL de métadonnées fournie par le serveur |
| 25/09 | knowns | High | Outils MCP Docs/Memory : path traversal en lecture, écriture et suppression |
| 24/09 | cline | High | WebSocket cross-origin sur le dashboard |
| 24/09 | @bytebase/dbhub | High | **Le mode « lecture seule » n'empêche pas les écritures** |
| 24/09 | @bytebase/dbhub | **Crit** | DNS rebinding depuis le navigateur → SQL sans authentification |

## Échantillon (requête `agent prompt injection`)
| Date | Paquet | Sév. | Mécanisme |
|---|---|---|---|
| 08/10 | praisonai | High | Allowlist shell contournée via `find -exec` |
| 08/10 | praisonaiagents | **Crit** | Code généré par le LLM exécuté sans sandbox, fuite de tous les secrets d'environnement |
| 07/10 | PraisonAI | High | **La défense anti-injection échoue précisément sur les menaces « HIGH »** |
| 07/10 | flowise | **Crit** | Injection de prompt → RCE + SSRF (validateur Python contourné) |
| 07/10 | praisonai | High | Webhook AgentMail sans signature → messages injectés, expéditeur usurpé |
| 02/10 | vibe-trading-ai | **Crit** | Outils appelables par le LLM : exécution de commandes, injection de code, SSRF (agent de trading !) |
| 24/09 | decepticon | **Crit** | Tokens ChatML dans du contenu web crawlé → **falsification des rôles** dans le contexte |
| 22/09 | mcp-atlassian | High | `upload_attachment` sans validation de chemin → lecture/exfiltration de fichiers locaux |
| 15/09 | @zereight/mcp-gitlab | High | Contournement du read-only et de l'allowlist, transports sans auth |
| 09/09 | functype-mcp-server | High | Alias de paquet non assaini → `pnpm install` + import dynamique → RCE |
| 04/09 | codewhale | High | `rlm_eval` **auto-approuve** du Python arbitraire en contournant la politique d'approbation |
| 04/09 | codewhale | High | Injection d'arguments dans `git_show` → écriture de fichiers sans approbation |
| 03/09 | claude-code-templates | High | Serveur « studio » non authentifié → injection de commandes OS |
| 25/08 | mcp-shell | High | Mode sécurisé désactivé par défaut ; un interpréteur shell est dans l'allowlist ; contournement via alias git |

## Ce que les données brutes disent (et que les synthèses ne disent pas)
1. **La majorité des failles d'agents ne sont PAS des « prompt injections sophistiquées »** : ce sont des failles web/OS classiques (path traversal, SSRF, DNS rebinding, transport sans auth, injection de commande) **dans les outils que le LLM appelle**. Le LLM n'est que la gâchette. Les outils MCP sont les nouveaux scripts CGI.
2. **Les promesses déclarées mentent** : « read-only » qui écrit (dbhub, mcp-gitlab), « secure mode » désactivé (mcp-shell), allowlist contournée (`find -exec`, alias git), « approval » contourné (codewhale), défense anti-injection qui rate les menaces hautes (PraisonAI).
3. **Le rythme est industriel** : ~2 advisories par jour ; aucune équipe ne peut patcher à cette vitesse.
4. Même le **SDK officiel MCP** a eu une fuite d'identifiants OAuth (06/10/2026).

→ Piste : vérifier à l'exécution que ce qu'un outil **fait réellement** (fichiers, réseau, processus, écritures) correspond à ce qu'il **déclare** (read-only, workspace, allowlist), indépendamment du LLM. Benchmark possible : rejouer de vraies advisories sur nos propres instances vulnérables.
