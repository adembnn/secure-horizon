# R. Cas complexes : synthèse du quadrillage (Claude-Titouan, 11/10/2026)

Statut : synthèse de R1 à R8 (même dossier). Beaucoup de structures techniques sont données de mémoire par les agents ([V]) : régénérer sélecteurs et types EIP-712 depuis les dépôts officiels avant tout codage. Chiffres de pertes : sources secondaires, non comparables entre elles.

## 1. Idée directrice
Le cas simple (« envoyer 10 ETH à X ») n'est qu'une famille sur douze. L'essentiel du danger est dans le CONTRÔLE (propriétaire, modules, mise à jour), les DROITS DIFFÉRÉS (approbations, permits), l'EXÉCUTION INDIRECTE (appels groupés, appel délégué), et les parcours où chaque transaction est légitime isolément. Le décodeur doit donc reconstruire l'effet réel indépendamment de l'interface (leçon de Bybit, Radiant).

## 2. Matrice des familles, de ce que l'outil peut faire, et de la preuve disponible
| Famille | Exemples | Ce que fait l'outil (honnête) | Signal indépendant de l'intention | Mesuré chez nous |
|---|---|---|---|---|
| 1. Droits de dépense directs | approve, increaseAllowance, setApprovalForAll | décode, avertit, friction | droit illimité, spender externe/neuf | OUI : R3 80 % rappel/0,23 % FP (Ethereum) |
| 2. Signatures hors chaîne | permit, DAI permit, Permit2 (single/batch/SignatureTransfer), Seaport, CoW/UniswapX | décode le typed data, calcule le pire cas | spender neuf, montant, durée, destinataire choisi par le dépensier | NON (aucun jeu réel obtenu) |
| 3. Contrôle et rôles | transferOwnership, grantRole, Safe addOwner/swapOwner/changeThreshold/enableModule/setGuard, delegatecall, upgrade de proxy, setOwner (Maker), ERC-4337, EIP-7702, ENS | critical dès changement durable de contrôle | sélecteur rare, appel délégué, cible proxy | NON ; 7702 = 0,56 % du trafic Ethereum |
| 4. Exécution indirecte | Multicall3, routeurs, MultiSend, claim/airdrop, CREATE2, hooks, flash loans, bridges | décodage récursif + trace | appel imbriqué qui accorde un droit | NON ; 34 % des tx légitimes Ethereum invisibles au premier niveau |
| 5. Évasion de la simulation | détection de fork, timestamp, gaz, état différé, MEV, droit accordé aujourd'hui/drain dans 400 jours | simulations multiples (contextes et horizons), divergence = signal, échec = inconnu | capacité accordée, pas effet immédiat | NON |
| 6. Contrepartie | empoisonnement d'adresse (≥3 préfixe/≥4 suffixe, fenêtre ~20 min), ENS sosie, homoglyphes, adresse de dépôt/mémo/réseau | règles déterministes, ne jamais copier depuis l'historique | similarité, première utilisation, dust entrant | NON |
| 7. Tokens | faux tokens, honeypot, taxe, blacklist USDT/USDC, tokens frais | adresse du contrat jamais le symbole ; simulation de vente | delta de solde, liquidité | NON |
| 8. Swaps et ponts | recipient ≠ soi, slippage, chaîne de destination | décode recipient, minOut | recipient ≠ soi | NON |
| 9. Faux front-end / chaîne d'approvisionnement | Bybit, Radiant, npm | le miroir (affiché contre exécuté) ne fonctionne que si l'intention est saisie hors de la page | calldata réel | NON |
| 10. Hors transaction | phrase secrète saisie, extensions piégées, malware, clipper, wrench | rien (ne passe pas par la signature) | — | — |
| 11. Parcours « conformes » | pig butchering, faux conseiller, romance, recrutement | rien par l'intention ; seuls destinataire neuf, ratio de solde, délai | destinataire neuf, ratio de solde | NON |
| 12. L'outil lui-même | faux Snaps de sécurité, extension compromise | build reproductible, version épinglée, pas de réseau sortant | — | — |

## 3. Constats qui changent le plan
1. Où l'outil est le plus utile est la plus petite catégorie en valeur : signatures malveillantes analysables (~84 M$ Scam Sniffer 2025) contre portefeuilles personnels compromis (713 M$) et scams par transferts conformes (≥14 Md$, projection >17). À dire tel quel.
2. Clef et Jev ne génèrent pas de texte : les explications viennent du code. Un modèle qui ne peut qu'aggraver ne réduit jamais les faux positifs : son seul gain possible est du rappel supplémentaire à FP égaux, à prouver face à une régression logistique (+5 points, 300-400 positifs). Pronostic de l'agent : la régression gagne probablement le triage.
3. Les cinq usages de modèle qui valent le coup : message collé, domaine sosie, triage d'opacité, intention libre en mode resserrant, hygiène injection/désaccord. Abandon : explication, génération d'attaques, jugement d'avertissement, notation de contrepartie par modèle, calibrage de seuils.
4. La notation de contrepartie est un travail de CODE (âge, financement, nombre d'approbateurs, bytecode). La littérature de détection par graphe s'effondre quand la prévalence baisse (DRAINCLoG, précision 0,99 à 0,45 de 1:10 à 1:1000) : l'objectif ≤1/1000 FP critical est très dur. Notre banc : le signal « contrat jeune » ne sépare pas (négatif), le nonce non plus (négatif), seul « droit à un compte externe » tient.
5. Pièges de décodage : DAI permit sans montant (illimité), Permit2 avec le token dans `details`, SignatureTransfer où le dépensier choisit le destinataire, Seaport = bilan net offer/consideration, permissions récurrentes = montant × périodes, USDT sans retour booléen.
6. Gravité : critical dès qu'il y a changement durable de contrôle (propriétaire, seuil, module, upgrade, délégation, approbation de collection). Un échec ou un délai de simulation = « inconnu », jamais un feu vert.
7. Grilling léger (R8) : déclenché seulement sur risque, 2 à 4 questions à choix, les réponses ne font que MONTER le niveau, jamais sous le plancher objectif du moteur ; intention vague = UNKNOWN avec attentes strictes ; friction forcée avec sortie « Annuler » toujours visible ; mesure en 4 bras avec faux conseiller scripté (petit n, résultats illustratifs).

## 4. Réponses honnêtes aux deux questions pièges
- Contrat qui détecte la simulation : les droits sont lus dans les données signées ; plusieurs simulations avec contextes et horizons différents ; divergence entre exécutions = signal ; signaux statiques ajoutés ; le cas non détecté est assumé.
- Phrase vague ou erronée : intention UNKNOWN, attentes les plus strictes, écart ambre corrigeable ; compté comme faux positif dû au design.

## 5. Trous restants (à creuser)
Pont entre chaînes (ERC-7683, Across, LayerZero) peu creusé ; couverture exacte du typed data par MetaMask/Blockaid ; jeu de permits réels ; effet mesuré des questions de finalité bancaires ; calibration et résistance à l'injection de Clef/Jev (non trouvées) ; test de l'extension MV3 sur 30 dApps (angle mort : envois lancés depuis l'interface du wallet, mobile).
