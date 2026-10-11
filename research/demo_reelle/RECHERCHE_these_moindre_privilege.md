# Thèse « ère de l'IA, service compromis, moindre privilège » : ce qui tient, ce qui tombe

Date de lecture : 2026-10-11. Toutes les URL ont été lues ce jour, sauf mention contraire.
Ce fichier complète `RECHERCHE_douleurs_secondaires.md`, `RECHERCHE_metamask_couverture.md` et `RECHERCHE_concurrents_particuliers.md`. Il ne les refait pas.

Légende :
- [A] source primaire : article évalué ou prépublication lue, post-mortem officiel, norme, documentation officielle.
- [B] page d'un éditeur ou d'un acteur intéressé, lue à la source. Conflit d'intérêt signalé.
- [C] presse spécialisée ou résultat de recherche. Non vérifié à la source primaire.
- [calcul] opération faite par moi sur des chiffres sourcés. Pas dans la source.
- Trois statuts de preuve : « prouvé », « affirmé par un vendeur ou un expert », « non retrouvé ».

Réserve de méthode : l'outil de lecture résume les pages. Relire la phrase exacte à l'URL avant toute slide. Les pages OpenAI (EVMbench), Matcha (post-mortem SwapNet), Uniswap (aide) et 0x (allowances) ont renvoyé 403, 429 ou 404.

## TL;DR
1. « À l'ère de l'IA » tient pour la capacité, pas pour les faits. Prouvé en simulation : des agents IA écrivent des exploits de contrats (Anthropic, 207 contrats sur 405 ; A1, 0,01 à 3,59 $ l'essai). Non retrouvé : un seul vol réel de contrat attribué à l'IA avec une preuve. Le directeur technique de Cyvers le dit lui-même : la preuve publique est limitée.
2. La tendance « en hausse » ne tient pas. Liste Revoke.cash recomptée : 2021 = 208,8 M$, 2022 = 15,4, 2023 = 20,4, 2024 = 79,5, 2025 = 7,4, 2026 à ce jour = 24,1. Pas de pente. Un seul incident (SwapNet) fait 56 % de 2026.
3. Le moindre privilège pour les approbations existe déjà. Matcha et LI.FI sont au montant fini par défaut. Talisman plafonne tout seul au solde. MetaMask laisse modifier. Les victimes de SwapNet avaient désactivé la protection par défaut. Non retrouvé : un outil qui met le montant exact de l'opération sans geste de l'utilisateur.
4. Le plafond exact borne la perte dans le portefeuille (LI.FI : zéro perte pour les approbations finies). Il ne protège ni les fonds déposés, ni l'opération en cours, ni la phrase secrète.
5. L'argument « ça coûte des frais » ne tient plus aujourd'hui : moins d'un centime sur Ethereum et sur Avalanche pour une approbation [calcul]. Le coût réel est un clic de plus à chaque opération.

---

## 1. L'IA accélère-t-elle la découverte et l'exploitation de failles ?

### Ce qui est prouvé (en simulation uniquement)

| Source | Date | Méthode | Chiffres | Limites dites par les auteurs | Fiab. |
|---|---|---|---|---|---|
| Anthropic, équipe Frontier Red Team, « SCONE-bench ». https://www.anthropic.com/research/smart-contracts (redirection depuis red.anthropic.com/2025/smart-contracts/) | 1er déc. 2025 | 405 contrats réellement piratés entre 2020 et 2025 (Ethereum, BNB Chain, Base). 10 modèles. Exploits rejoués sur une copie de la chaîne | 207 contrats sur 405 exploités (51,11 %), 550,1 M$ simulés. Contrats piratés après la date de coupure des modèles : 4,6 M$ simulés au maximum. Essai sur 2 849 contrats récents de BNB Chain : 2 failles nouvelles, 3 694 $ simulés, coût d'API 3 476 $ (GPT-5), 1,22 $ par exécution, 1 738 $ par contrat vulnérable trouvé, profit net moyen 109 $. « exploit revenue from stolen simulated funds roughly doubled every 1.3 months » sur un an | « We never tested exploits on live blockchains ». Deux failles font 92 % de la valeur. Risque de contamination par des exploits publics. Clés volées et ingénierie sociale exclues | A, mais Anthropic vend les modèles testés |
| Gervais et Zhou, « A1 ». https://arxiv.org/abs/2507.05558 ; texte : https://arxiv.org/html/2507.05558v3 | 8 juil. 2025 (v4 : 12 janv. 2026) | 36 contrats vulnérables réels, incidents d'avril 2021 à avril 2025. 6 modèles, 432 essais, sur copie de chaîne | 63 % de réussite sur le banc VERITE. Jusqu'à 8,59 M$ par exploit, 9,33 M$ au total (simulés). 0,01 à 3,59 $ par essai. Attaquant rentable dès 6 000 $ de butin, défenseur à partir de 60 000 $ | Preuves de concept, pas des attaques réelles. Le modèle économique est une simulation. Le papier suppose que les attaquants réels utilisent des méthodes traditionnelles | A. Les auteurs sont aussi affiliés à une société, Decentralized Intelligence AG |
| OpenAI et Paradigm, « EVMbench » | 18 fév. 2026 | Failles tirées de 40 audits. Trois modes : détecter, corriger, exploiter | Mode exploitation : 72,2 % pour GPT-5.3-Codex, contre 31,9 % pour GPT-5 six mois plus tôt. Nombre de failles : 120 selon la presse, 117 selon la page OpenAI d'après un résultat de recherche. Les deux chiffres ne concordent pas | Le banc « does not fully capture real-world security complexity » | C. Page primaire non lue (403) : https://openai.com/index/introducing-evmbench/. Relais : https://decrypt.co/358470/ai-agents-boost-ethereum-security-openai-paradigm-evmbench |
| Fang et al., « LLM Agents can Autonomously Exploit One-day Vulnerabilities ». https://arxiv.org/abs/2404.08144 | 11 avr. 2024 | 15 failles web déjà publiées (pas des contrats) | GPT-4 en exploite 87 % avec la description de la faille, 7 % sans | 15 cas seulement | A |
| Anthropic, « Claude Mythos Preview ». https://www.anthropic.com/research/mythos-preview | 7 avr. 2026 | Logiciels classiques (navigateurs, systèmes). Pas de contrats | 181 exploits fonctionnels du moteur JavaScript de Firefox 147, contre 2 pour le modèle précédent. Un exploit Linux sur faille connue : moins de 1 000 $ et une demi-journée | Les contrats intelligents ne sont pas mentionnés. Modèle non diffusé au public | A pour la date et les chiffres, B pour l'intérêt (Anthropic) |
| Mandiant (Google), délai entre publication d'une faille et exploitation. https://cloud.google.com/blog/topics/threat-intelligence/time-to-exploit-trends-2023 | 15 oct. 2024 | 138 failles exploitées, logiciels classiques | Délai moyen : 63 jours (2018-2019), 44 (2020 à début 2021), 32 (2021-2022), 5 (2023). Sans retrait de 15 valeurs extrêmes : 47 jours au lieu de 5 | Le rapport n'attribue pas cette baisse à l'IA | A pour la mesure. Ne prouve rien sur l'IA ni sur les contrats |

### Ce qui est seulement affirmé

| Qui | Date | Ce qu'il dit | Preuve donnée | Conflit d'intérêt | Source |
|---|---|---|---|---|---|
| Mitchell Amador, directeur d'Immunefi | 11 juin 2026 | Les nouveaux modèles sont « the main reason » de la reprise des piratages en 2026 (paraphrase du journaliste) | Aucune. L'incident cité dans l'article (Kelp DAO, environ 290 M$, 19 avril 2026) est attribué par LayerZero à une configuration à vérificateur unique, sans rôle de l'IA | Immunefi vend des primes aux bogues et annonce des outils d'IA | https://cointelegraph.com/news/frontier-ai-models-vulnerability-apocalypse-crypto-security-immunefi-ceo [C] |
| Manuel Aráoz, cofondateur d'OpenZeppelin (parti en 2019) | 26-27 mai 2026 | « I now consider all of DeFi unsafe. » ; « Coding agents are superhuman at finding vulnerabilities » | Aucune. OpenZeppelin répond que ces propos « do not represent OpenZeppelin's current position » | Activité actuelle non indiquée | https://www.coindesk.com/tech/2026/05/27/defi-isn-t-safe-anymore-because-ai-is-becoming-superhuman-at-hacking-onetime-openzeppelin-founder-says [C] |
| Meir Dolev, directeur technique de Cyvers | 27 mai 2026 | La preuve publique que l'IA exécute directement des exploits est limitée. « What is verified is the broader trend. » | C'est un aveu d'absence de preuve | Cyvers vend de la détection | https://cointelegraph.com/news/all-defi-unsafe-ai-security-debate [C] |
| Observatoire OCDE des incidents d'IA | 27 mai 2026 | « AI-Driven Attacks Cause Massive Losses in DeFi Sector », plus de 1,1 Md$ sur un an | Résumé automatique de 20 articles de presse sur les propos d'Aráoz. Aucun exploit nommé | — | https://oecd.ai/en/incidents/2026-05-27-04e9 [C]. Ne pas citer comme une preuve |

### Incidents réels attribués à l'IA

- Contrat intelligent ou site crypto exploité avec une preuve que l'attaquant a utilisé l'IA : **non retrouvé**. Deux recherches, dont une approfondie. Un blog affirme que le piratage de Step Finance (janvier 2026) était « assisté par IA » : aucune source primaire, à ne pas reprendre.
- Hors crypto : Anthropic décrit une campagne d'espionnage où son outil a fait 80 à 90 % du travail contre environ trente cibles (publication du 13 nov. 2025). C'est une déclaration d'éditeur sur son propre produit, sans rapport avec les contrats. https://www.anthropic.com/news/disrupting-AI-espionage [B]
- Délai entre publication d'une faille de contrat et exploitation réelle, avec ou sans IA : **non retrouvé**. Le seul chiffre trouvé est un modèle (A1 : 86 à 89 % de chances de succès en cas de détection immédiate, 6 à 21 % après une semaine).

### Verdict
- Tient : « des agents IA savent déjà écrire des exploits de contrats en simulation, pour quelques dollars l'essai, et les scores montent vite ».
- Tombe : « les failles sont trouvées et exploitées plus vite » comme fait observé. Personne ne l'a mesuré sur des vols réels.
- Tombe aussi : l'idée que l'IA explique les pertes par approbation. Dans la liste Revoke.cash 2025-2026, plusieurs causes sont des clés d'administration volées ou une prise de contrôle de la gouvernance (Moby, Orange, BarnBridge), pas des failles de code.
- Point faible à connaître : l'essai « zéro jour » d'Anthropic rapporte 109 $ nets par exploit. Un juré peut dire que ce n'est pas encore rentable.

---

## 2. Pertes par approbations, année par année

Source unique : https://revoke.cash/exploits [B]. Revoke.cash vit de la révocation. La liste est tenue à la main, 71 incidents, « Over $355M stolen since 2020 ». Addition refaite ligne par ligne ce jour [calcul].

| Année | Incidents | Total de la liste | Dont interfaces détournées et « rug pulls » | Reste : contrat ou clés du service compromis | Remarque |
|---|---|---|---|---|---|
| 2020 | 1 | 0,135 M$ | 0 | 0,135 M$ | Bancor |
| 2021 | 8 | 208,757 M$ | 138,1 M$ (BadgerDAO 111,1 ; StableMagnet 27) | 70,657 M$ | Dont bZx 55 M$ (clés d'administration, part « approbations » non vérifiée) |
| 2022 | 15 | 15,407 M$ | 1,8 M$ (Celer, Curve, PREMINT, Namecheap) | 13,607 M$ | |
| 2023 | 16 | 20,415 M$ | 1,81 M$ (Ledger, Galxe, Harvest Keeper) | 18,605 M$ | |
| 2024 | 13 | 79,512 M$ | 0 | 79,512 M$ ; 29,512 M$ si Radiant est compté pour 10 M$ ; 27,212 M$ s'il est compté pour 7,7 M$ | Radiant = 60 M$ dont 50 M$ de fonds de pools |
| 2025 | 9 | 7,446 M$ | 0,621 M$ (Fisclend, 402bridge) | 6,825 M$ | Année la plus basse depuis 2020 |
| 2026, jusqu'au 24 sept. | 9 | 24,107 M$ | 1,2 M$ (CoW Swap) | 22,907 M$ | SwapNet = 13,43 M$, soit 56 % du total de l'année |
| Total | 71 | 355,779 M$ | | | Cohérent avec « Over $355M » |

- Les deux chiffres de notre note sont confirmés : 7,4 M$ en 2025, 24,1 M$ en 2026 à ce jour.
- Le classement « interface » ou « rug pull » vient des résumés d'une ligne de la page, lus par l'outil. À relire avant usage.
- La tendance à la hausse **ne tient pas**. La série est en dents de scie. 2025 vers 2026 fait fois 3,2 [calcul], mais sur une base très basse et grâce à un seul incident. 2026 à ce jour est en dessous de 2024, même corrigé de Radiant.
- Ordre de grandeur : 7,4 M$ en 2025 contre 3,4 Md$ volés au total selon Chainalysis (chiffre vu dans un résultat de recherche, source primaire non lue [C]). Cela ferait environ 0,2 % [calcul]. À vérifier avant de le dire.
- Nombre de victimes : toujours non retrouvé, sauf LI.FI (153).
- Aucune autre série annuelle n'a été trouvée. Pas de total indépendant de Revoke.cash.

Verdict : tient comme flux régulier (9 à 16 incidents par an depuis 2022). Tombe comme « tendance en hausse » et comme « gros problème en dollars ».

---

## 3. Le moindre privilège pour les approbations existe-t-il déjà ?

Oui, sous plusieurs formes.

| Mécanisme | Ce qu'il fait | Geste de l'utilisateur | Source | Fiab. |
|---|---|---|---|---|
| Plafond modifiable dans MetaMask | Écran « spending cap », montant modifiable | Oui, il faut modifier | Voir `RECHERCHE_metamask_couverture.md` | B |
| Talisman (portefeuille) | « Talisman sets token approvals to the exact amount held in the wallet by default », au lieu de l'illimité. Modifiable | **Aucun.** Mais le plafond est le solde, pas le montant de l'opération | https://docs.talisman.xyz/talisman/wallet-features/using-talisman-with-a-website-dapp/token-approvals | B |
| Matcha (0x) | Par défaut, approbation à usage unique : « only lets an aggregator use them for a single trade ». « users who kept the default one-time approval were never at risk » | Aucun par défaut | https://revoke.cash/exploits/swapnet | B. Post-mortem Matcha non lu (429) |
| LI.FI | L'approbation finie est « the default setting » | Aucun par défaut | https://li.fi/knowledge-hub/incident-report-16th-july/ (déjà dans notre note) | A |
| Permit2 (Uniswap) | Deux modes. Signature à usage unique valable le temps d'une transaction. Ou allocation avec montant et expiration. Mais l'utilisateur approuve d'abord le contrat Permit2 par jeton, et le maximum est « commonly » choisi | Aucun pour la signature ; l'approbation de départ reste le plus souvent illimitée | http://developers.uniswap.org/llms.mdx/docs/protocols/permit2/overview ; http://developers.uniswap.org/llms.mdx/docs/trading/swapping-api/concepts/permit2 (« time-limited and (optionally) amount-limited ») | B |
| ERC-7674, approbation temporaire | `temporaryApprove` : le droit disparaît à la fin de la transaction | Aucun, si le jeton et le service l'adoptent | https://eips.ethereum.org/EIPS/eip-7674 (statut « Review », créé le 2 avril 2024) | A. Adoption non retrouvée |
| ERC-7715, permissions | Le site demande un droit avec montant et expiration ; le portefeuille peut l'ajuster | Selon le portefeuille | https://eips.ethereum.org/EIPS/eip-7715 (statut « Draft », créé le 24 mai 2024) | A |
| Rabby | Des blogs disent qu'il avertit sur l'illimité | Non vérifié à une source officielle | — | Non retrouvé |

**Outil qui remplace l'illimité par le montant exact de l'opération, sans geste de l'utilisateur : non retrouvé** (deux recherches). Le plus proche est Talisman (plafond au solde) et le défaut de Matcha (usage unique, côté service). Formule à employer : « non trouvé dans les sources lues », pas « n'existe pas ».

Recommandations officielles :
- ethereum.org, guide de révocation, page mise à jour le 6 juin 2026 : « We recommend you never allow projects unlimited access to your tokens » et « only approve what you need ». https://ethereum.org/en/guides/how-to-revoke-token-access/ [A]
- Revoke.cash : « Keeping your approvals to a minimum ». https://revoke.cash/learn/approvals/what-are-token-approvals [B]
- MetaMask : « Enter the amount that you feel comfortable being spent on your behalf » (déjà dans notre note) [B]
- Wang et al., RAID 2022 : bonne pratique suivie par 0,2 % des utilisateurs, données de 2021 (déjà dans notre note) [A]
- OWASP Smart Contract Top 10 (2025) : **ne parle pas** des approbations des utilisateurs. https://owasp.org/www-project-smart-contract-top-10/ [A]. Ne pas dire « OWASP recommande le montant exact ».
- Recommandation d'un cabinet d'audit : non cherchée à fond, non retrouvée.

Qui demande quoi par défaut :
- Montant fini ou usage unique : Matcha, LI.FI (sources ci-dessus) ; MetaMask Swaps sur les réseaux de seconde couche (notre note).
- Illimité : MetaMask Swaps sur les réseaux chers en frais (notre note) ; CoW Swap a encouragé l'illimité (« go ahead and set those infinite approvals just once », publication non datée, « 3 years ago ») https://typefully.com/CoWSwap/knG7jA0 [B] ; Uniswap : approbation de Permit2 le plus souvent au maximum (ci-dessus).
- 1inch, Curve, Aave : non vérifié à une source officielle. État actuel des interfaces : non testé.

Verdict : tient comme principe reconnu et recommandé. Tombe comme nouveauté. Ce qui reste à nous : le montant vient de ce que l'utilisateur a écrit, et le contrôle s'applique à tout site, même ceux qui demandent l'illimité.

---

## 4. Une approbation au montant exact aurait-elle protégé ?

| Incident | Verdict | Pourquoi |
|---|---|---|
| LI.FI, 16 juil. 2024, 11,6 M$ | **Oui** | Faille « limited to infinite approvals ». Rien pour les approbations finies. Mais c'était déjà le défaut de LI.FI : les 153 victimes avaient choisi l'illimité |
| SwapNet, 25 janv. 2026, 13,43 M$ | **Perte bornée** | Zéro si l'approbation exacte a été consommée par l'échange. Revoke.cash prévient : les approbations exactes jamais utilisées « can be abused too ». Les victimes avaient désactivé le défaut de Matcha |
| Radiant, 16 oct. 2024, 60 M$ | **Oui pour 7,7 à 10 M$, non pour 50 M$** | La part prise dans les portefeuilles passait par les approbations. Les 50 M$ étaient déposés dans les pools |
| CoW Swap, 14 avril 2026, environ 1,2 M$ | **Perte bornée, ou non** | Le faux site demandait de nouvelles approbations et signatures vers l'attaquant : le plafond limite la perte au montant écrit, qui est quand même perdu. Il demandait aussi la phrase secrète : aucune protection |
| Aerodrome et Velodrome, 21 nov. 2025, environ 700 000 $ | **Perte bornée, non vérifié** | Code de vidage de portefeuille servi par le faux site (Blockaid [B]). La presse parle de demandes d'approbation illimitée et de transferts [C]. Un transfert direct d'ether n'est pas une approbation : le plafond n'y fait rien. Pas de post-mortem officiel trouvé |
| BadgerDAO, 2 déc. 2021, 111,1 M$ | **Perte bornée** | Approbations illimitées vers l'attaquant ajoutées à des opérations normales. Un plafond au montant écrit aurait limité la perte |

Ce que le montant exact ne protège pas :
- les fonds déposés dans le protocole ;
- le montant de l'opération en cours, si le destinataire du droit est l'attaquant ;
- la phrase secrète saisie sur un faux site ;
- une signature Permit ou Permit2 hors chaîne : le site construit le message. Si l'extension change le montant, la signature ne correspond plus à ce que le site attend et l'opération échoue. On peut la bloquer, pas la réécrire [raisonnement, non testé] ;
- un mauvais destinataire du droit : approuver 50 USDC au mauvais contrat fait perdre 50 USDC ;
- une approbation exacte jamais consommée ;
- un transfert direct (ether natif, envoi de jetons) ;
- les droits déjà accordés avant l'installation de Hold up.

Limites pratiques à tester avant de promettre [raisonnement, non testé] : un échange « montant reçu exact » a besoin d'une marge sur le montant envoyé ; un remboursement de prêt avec intérêts aussi ; certains jetons (USDT sur Ethereum) exigent de remettre le droit à zéro avant de le changer.

Verdict : tient pour « borne la perte dans le portefeuille ». Tombe pour « protège quand le service est compromis » sans précision, et pour « perd tout » (la victime perd le solde des jetons approuvés, pas tout).

---

## 5. Coût pour l'utilisateur

| Réseau | Prix du gaz lu | Cours lu | Coût d'un transfert simple affiché | Coût d'une approbation | Source |
|---|---|---|---|---|---|
| Ethereum | 0,061 gwei | ETH 2 502,50 $ | 0,003 $ | environ 0,007 à 0,009 $ [calcul] | https://etherscan.io/gastracker, relevé du 11 oct. 2026, 04h32 UTC |
| Avalanche C-Chain | 5 nAVAX | AVAX 10,25 $ | 0,001 $ | environ 0,002 à 0,003 $ [calcul] | https://snowtrace.io/gastracker, lu le 11 oct. 2026 |

- Hypothèse du calcul : une approbation ERC-20 consomme 46 000 à 60 000 unités de gaz. C'est un ordre de grandeur usuel, **non sourcé ce jour**. À mesurer sur notre propre transaction de démo.
- Détail : 46 000 × 0,061 gwei = 2 806 gwei, soit 0,000002806 ETH, soit 0,0070 $. 46 000 × 5 nAVAX = 0,00023 AVAX, soit 0,0024 $.
- Ces frais sont un instantané. Le prix du gaz varie. À 100 gwei, la même approbation coûterait 0,0046 ETH [calcul d'illustration, pas une mesure].
- Le vrai coût aujourd'hui n'est pas l'argent. C'est une confirmation de plus et une attente de plus à chaque opération. Aucune mesure de l'abandon trouvée.
- Conséquence gênante : si l'approbation coûte moins d'un centime et que les gens gardent l'illimité, la raison est le confort, pas les frais. Un outil qui ajoute un geste va contre ce confort.

Verdict : tient (« moins d'un centime aujourd'hui, relevé du 11 oct. 2026 »). Tombe si on dit « gratuit » ou si on oublie le clic en plus.

---

## 6. Fuite de données ou vol de fonds ?

La distinction est juste, avec une correction.

- Une fuite de données d'un site ne signe aucune transaction. Elle ne vide pas un portefeuille. Aucun incident de nos listes ne vient d'une fuite de données. Elle peut servir ensuite à du hameçonnage ciblé : non sourcé dans cette passe.
- Ce qui vide un portefeuille, d'après les incidents sourcés, tient en trois mécanismes distincts :
  1. un contrat exploité qui utilise les droits **déjà accordés** (LI.FI, SwapNet, Socket) ;
  2. des clés d'administration volées, ou une mise à jour malveillante, qui retournent le contrat contre ceux qui l'ont approuvé (Radiant, Moby Trade, Orange Finance) ;
  3. une interface détournée qui fait signer des droits **nouveaux** vers l'attaquant (CoW Swap, Aerodrome, BadgerDAO, Ledger Connect Kit).
- Correction : la phrase « une interface détournée utilise les droits déjà accordés » est fausse. L'interface détournée fait signer autre chose. Seuls les cas 1 et 2 passent par les droits existants.
- Le plafond exact agit sur 1 et 2 (droit restant) et borne 3 (montant écrit). La comparaison intention contre effet reste le bon outil pour 3.

Verdict : tient, à condition de séparer les trois mécanismes.

---

## Thèse reformulée, défendable mot pour mot

1. « Des bancs d'essai publics de 2025 et 2026 montrent que des agents IA écrivent, en simulation, des exploits de contrats déjà piratés pour quelques dollars l'essai. Nous n'avons trouvé aucun vol réel attribué à l'IA avec une preuve, mais le coût de l'attaque baisse. »
2. « Quand un service honnête est compromis, ce que l'utilisateur perd dans son portefeuille dépend du droit qu'il lui a laissé : chez LI.FI en juillet 2024, 11,6 M$ ont été pris à 153 portefeuilles en approbation illimitée, et rien aux approbations finies, selon le rapport de LI.FI. »
3. « Hold up fait écrire le montant voulu, signale tout droit demandé qui le dépasse et propose de le ramener à ce montant. Cela borne la perte future dans le portefeuille, pas les fonds déposés ni l'opération en cours. »

## Phrases à ne pas dire

| Phrase | Pourquoi |
|---|---|
| « À l'ère de l'IA, les failles sont exploitées plus vite » | Aucune mesure sur des vols réels. Dire « savent le faire en simulation » |
| « L'IA a causé la hausse des piratages de 2026 » | Affirmé par un vendeur (Immunefi), sans preuve. Kelp DAO est attribué à une configuration |
| « 550 M$ volés par des IA » ou « 4,6 M$ volés » | Montants simulés sur des contrats déjà piratés |
| « Les pertes par approbation sont en hausse » | Série en dents de scie ; 2025 est l'année la plus basse |
| « 355 M$ perdus par sur-autorisation » | Mélange interfaces détournées, rug pulls et fonds de pools |
| « L'utilisateur perd tout » | Il perd le solde des jetons approuvés à ce contrat |
| « Tout service sera compromis » | C'est une posture de conception, pas un fait. Dire « on conçoit comme si » |
| « Personne ne limite les approbations » ou « mécanisme inédit » | Matcha, LI.FI, Talisman, Permit2, MetaMask, ERC-7674 |
| « OWASP recommande le montant exact » | Le Top 10 des contrats n'en parle pas |
| « Le montant exact protège contre un site détourné » | Il borne la perte ; l'opération en cours est perdue |
| « Une fuite de données vide les portefeuilles » | Faux. Voir point 6 |
| « L'approbation en plus ne coûte rien » | Moins d'un centime ce jour, plus un geste à chaque fois |

## L'objection la plus dure, et la réponse honnête

**Objection.** « Le moindre privilège sur les approbations est recommandé par ethereum.org et déjà en place : Matcha et LI.FI sont au montant fini par défaut, Talisman plafonne tout seul, MetaMask laisse modifier. Les victimes de SwapNet et de LI.FI sont précisément des gens qui ont désactivé ou refusé cette protection. L'approbation coûte moins d'un centime, donc ils ne le font pas pour économiser : ils le font pour ne pas recliquer. Pourquoi accepteraient-ils votre plafond ? Et votre "ère de l'IA" repose sur des bancs d'essai, pas sur un seul vol réel. Le tout pour 7,4 M$ de pertes en 2025. »

**Réponse honnête.**
- Oui sur tout le constat. Le principe n'est pas de nous, la douleur est petite en dollars et l'IA n'est pas prouvée sur des vols réels. Nous le disons en premier.
- Ce que nous ajoutons est étroit : le montant de référence vient de ce que l'utilisateur vient d'écrire, pas d'un réglage. Le contrôle s'applique sur tout site, y compris ceux qui demandent l'illimité, et sur un site détourné qui ajoute une approbation.
- Nous ne pouvons pas prouver que les gens garderont le plafond. C'est une mesure à faire : part des utilisateurs qui acceptent la réduction, part qui passe outre. Sans ce chiffre, c'est une opinion.
- Le plafond est une fonction secondaire. L'argument principal reste la comparaison intention contre effet sur un site détourné, où la preuve est la plus forte (voir `RECHERCHE_douleurs_secondaires.md`, douleur C).
- Sur l'IA : nous l'utilisons comme raison de concevoir en supposant la compromission, pas comme cause des pertes.

## Mapping réglementaire

| Idée | NIST CSF 2.0 | Référentiel de menace |
|---|---|---|
| Limiter le droit accordé au montant écrit | PR.AA-05 (moindre privilège). C'est du Protect : le règlement demande de viser Detect ou Respond, donc ne pas en faire l'axe principal | D3FEND : candidat D3-UAP (User Account Permissions), à valider |
| Détecter qu'un droit demandé dépasse le montant écrit | DE.CM, DE.AE | ATT&CK T1657 (Financial Theft) |
| Retenir la demande ou proposer la réduction | RS.MI | ATT&CK T1657 |
| Service compromis qui utilise les droits existants | ID.RA (risque de tiers) | ATT&CK T1199 (Trusted Relationship), T1195 (Supply Chain Compromise), T1190 (Exploit Public-Facing Application) |
| Interface détournée | DE.CM, DE.AE | ATT&CK T1584.001 et T1584.002, T1189, T1204 |
| Attaquant outillé par l'IA | ID.RA | ATT&CK T1588.007 (Obtain Capabilities: Artificial Intelligence), à valider. ATLAS : non pertinent, l'IA est l'outil de l'attaquant et non la cible |
| Droit accordé par un agent IA à la place de l'humain | PR.AA-05, DE.AE | OWASP Agentic ASI03 (abus d'identité et de privilèges), seulement dans ce cas |

Tous les identifiants ATT&CK et D3FEND sont à revalider dans les référentiels avant la fiche de défense.

## Non lu ou non retrouvé
- Page OpenAI sur EVMbench (403) : scores cités via Decrypt ; 117 ou 120 failles, non tranché.
- Post-mortem Matcha sur SwapNet (429, deuxième échec).
- Post-mortem officiel d'Aerodrome ; ce que le faux site faisait signer.
- Tout incident réel de contrat ou de site crypto attribué à l'IA avec preuve.
- Tout délai mesuré entre publication d'une faille de contrat et exploitation réelle.
- Rapports Chainalysis, CertiK et TRM Labs (totaux 2025 et premier semestre 2026) : vus en résultat de recherche seulement.
- Défauts actuels de 1inch, Curve, Aave, Rabby : non vérifiés à une source officielle.
- Consommation de gaz réelle d'une approbation ; aucune transaction mesurée.
- Adoption d'ERC-7674 ; part actuelle des approbations illimitées ; taux d'usage du plafond modifiable.
- Recommandation d'un cabinet d'audit sur le montant exact.
- Aucun produit installé ni testé. La réécriture d'une approbation par une extension n'a pas été essayée.

## Sources

Primaires [A] :
- https://www.anthropic.com/research/smart-contracts (1er déc. 2025)
- https://arxiv.org/abs/2507.05558 et https://arxiv.org/html/2507.05558v3
- https://arxiv.org/abs/2404.08144
- https://www.anthropic.com/research/mythos-preview (7 avr. 2026)
- https://cloud.google.com/blog/topics/threat-intelligence/time-to-exploit-trends-2023 (15 oct. 2024)
- https://eips.ethereum.org/EIPS/eip-7674 ; https://eips.ethereum.org/EIPS/eip-7715
- https://ethereum.org/en/guides/how-to-revoke-token-access/
- https://owasp.org/www-project-smart-contract-top-10/
- https://li.fi/knowledge-hub/incident-report-16th-july/ (repris de notre note)

Éditeurs et acteurs intéressés [B] :
- https://revoke.cash/exploits ; https://revoke.cash/exploits/swapnet ; https://revoke.cash/learn/approvals/what-are-token-approvals
- https://docs.talisman.xyz/talisman/wallet-features/using-talisman-with-a-website-dapp/token-approvals
- http://developers.uniswap.org/llms.mdx/docs/protocols/permit2/overview ; http://developers.uniswap.org/llms.mdx/docs/trading/swapping-api/concepts/permit2
- https://typefully.com/CoWSwap/knG7jA0
- https://www.anthropic.com/news/disrupting-AI-espionage (13 nov. 2025)
- https://etherscan.io/gastracker ; https://snowtrace.io/gastracker

Presse spécialisée [C] :
- https://cointelegraph.com/news/frontier-ai-models-vulnerability-apocalypse-crypto-security-immunefi-ceo (11 juin 2026)
- https://cointelegraph.com/news/all-defi-unsafe-ai-security-debate (27 mai 2026)
- https://www.coindesk.com/tech/2026/05/27/defi-isn-t-safe-anymore-because-ai-is-becoming-superhuman-at-hacking-onetime-openzeppelin-founder-says
- https://decrypt.co/358470/ai-agents-boost-ethereum-security-openai-paradigm-evmbench
- https://oecd.ai/en/incidents/2026-05-27-04e9 (résumé automatique de presse)
