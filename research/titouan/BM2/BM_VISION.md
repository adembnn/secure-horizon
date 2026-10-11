# Hold up : vision prospective pour le business model

Date de rédaction : 11 octobre 2026. Lectures web faites ce jour, en lecture seule, sauf mention « repris d'un dossier interne ».

Promesse de départ : « cesser de donner plus que nécessaire, car on s'expose en le faisant ». En pratique : le droit accordé est borné par l'intention écrite.

## Comment lire ce document

Chaque affirmation porte un statut.

- **FAIT SOURCÉ** : constaté dans une source lue, avec son URL. Niveau de la source entre crochets : [A] norme, documentation officielle, avis officiel ; [B] page d'un acteur intéressé ; [C] presse ou résumé de recherche, non vérifié à la source primaire.
- **TENDANCE SOURCÉE** : un mouvement visible dans plusieurs sources (versions, groupes de travail, produits lancés). Ce n'est pas une prédiction de chiffres.
- **HYPOTHÈSE À TESTER** : notre lecture. Elle n'est prouvée par rien tant qu'on ne l'a pas mesurée.

Règles tenues dans tout le texte :
- pas de formule générale sur l'IA sans source ;
- pas de hausse des pertes annoncée : la série Revoke.cash est en dents de scie (2021 : 208,8 M$ ; 2025 : 7,4 M$ ; 2026 à ce jour : 24,1 M$) et aucun vol réel n'est attribué à l'IA avec preuve. Seule la capacité en simulation est prouvée. Voir `research/demo_reelle/RECHERCHE_these_moindre_privilege.md` ;
- les chiffres du marché des agents sont donnés tels quels, petits compris.

---

## TL;DR

1. **Le principe devient une infrastructure, pas encore une catégorie de produit.** Les briques pour borner un droit existent et sont livrées : permissions avancées dans MetaMask en production, mandats d'AP2 confiés à la FIDO Alliance, plafonds de session chez Coinbase, politiques de transaction sur Safe. FAIT SOURCÉ (sections 1 à 3).
2. **Ce qui manque est en amont du droit.** Toutes ces briques supposent qu'un développeur ou une application écrit la règle. Aucune ne part de la phrase de l'humain pour fabriquer la borne, puis ne vérifie chaque demande contre cette phrase, de façon indépendante du site ou de l'agent. HYPOTHÈSE À TESTER, avec une réserve : des projets naissent sur ce créneau (Sardis, allowance.eth). FAIT SOURCÉ.
3. **Les agents sont le terrain le plus clair, mais le plus petit aujourd'hui.** TRM estime que 0,6 à 7,5 % du commerce x402 filtré ressemble à de vrais agents, soit 5 000 à 11 000 $ par mois. FAIT SOURCÉ. Des pertes réelles existent (Grok et Bankr, mai 2026, environ 150 000 à 200 000 $). FAIT SOURCÉ [C].
4. **L'assurance liée aux droits bornés n'a pas de précédent trouvé.** Les précédents voisins existent : garantie de Coincover sur les transactions qu'il valide, rabais d'assurance cyber liés à un contrôle installé, certification AIUC-1 qui ouvre une police pour agents. FAIT SOURCÉ.
5. **La vision défendable** : Hold up devient le « traducteur et contrôleur de mandat », une couche neutre qui transforme une intention écrite en droit borné (ERC-7715, mandat AP2, politique Safe) et vérifie chaque demande contre elle. Particulier aujourd'hui, agents et équipes ensuite. HYPOTHÈSE À TESTER.

---

## 1. Standards et mouvements qui poussent vers des droits bornés

### 1.1 Tableau d'état

| Brique | Ce qu'elle fait | État au 11 oct. 2026 | Statut | Source |
|---|---|---|---|---|
| ERC-7715, permissions demandées au portefeuille | Le site demande un droit d'exécution (montant, expiration). Le portefeuille peut le réduire si le site l'autorise (`isAdjustmentAllowed`). Méthode `wallet_requestExecutionPermissions` | Norme en « Draft », créée le 24 mai 2024. Seule règle définie dans le texte : l'expiration | FAIT SOURCÉ [A] | https://eips.ethereum.org/EIPS/eip-7715 |
| ERC-7710, délégation | Un compte intelligent délègue une capacité bornée et réutilisable à un autre compte, en une signature | « Draft », créée le 20 mai 2024 | FAIT SOURCÉ [A] | https://eips.ethereum.org/EIPS/eip-7710 |
| MetaMask Advanced Permissions (Smart Accounts Kit) | Implémentation d'ERC-7715. Types : périodique et flux pour ERC-20 et jeton natif depuis la version de production 13.23.0 ; plafond simple (« allowance ») ERC-20 et natif depuis 13.32.1 | En production. Exige un compte intelligent MetaMask, activé par défaut selon l'aide | FAIT SOURCÉ [B] | https://docs.metamask.io/smart-accounts-kit/get-started/supported-advanced-permissions/ ; https://support.metamask.io/more-web3/dapps/advanced-permissions/ |
| Ce que MetaMask dit à l'utilisateur | « limited, time-bound, and condition-based access to your tokens ». Notion d'« exposition totale ». Révocation dans « Dapp connections ». « only appear in some dapps that support ERC-7715 » | Adoption côté sites non chiffrée | FAIT SOURCÉ [B] | https://support.metamask.io/more-web3/dapps/advanced-permissions/ |
| EIP-7702 | Un compte classique prend le comportement d'un compte intelligent, à la même adresse | Actif depuis la mise à jour Pectra (mai 2025). Aucun chiffre d'adoption 2026 trouvé | FAIT SOURCÉ pour l'existence ; adoption non retrouvée | https://docs.zerodev.app/blog/7702-adoption [B] |
| EIP-7702, usage malveillant | Selon Wintermute, plus de 80 % puis jusqu'à 97 % des délégations 7702 pointaient vers du code de vidage copié (« CrimeEnjoyor »). Une étude USENIX citée : 63 % des délégations observées vers des contrats malveillants, 2,36 M$ de pertes confirmées | Mesures de 2025, dénominateurs différents | FAIT SOURCÉ [C] | https://www.theblock.co/post/356481/wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks ; https://cointelegraph.com/news/wintermute-crimeenjoyor-flags-malicious-ethereum-contracts ; https://eprint.iacr.org/2026/2060.pdf |
| ERC-4337, comptes intelligents | BundleBear, relevé mi-2026 : environ 1,22 Md d'opérations et 62,9 M d'adresses ayant exécuté au moins une opération. 90 à 99 % des opérations sponsorisées. « little evidence of mass migration from established EOAs » | En production, mais pas de bascule massive des portefeuilles principaux | FAIT SOURCÉ [B] | https://www.zerodev.app/blogs/erc-4337-final-not-finished (12 août 2026) |
| Session keys (Smart Sessions, ERC-7579) | Rhinestone et Biconomy : droits bornés par action pour applications et agents | En usage selon des sources secondaires. Interopérabilité entre SDK « still limited » | FAIT SOURCÉ [C] | https://www.spark.money/glossary/session-key ; https://www.alchemy.com/dapps/rhinestone |
| Permit2 (Uniswap) | Signature à usage unique ou allocation avec montant et expiration. Mais l'approbation de départ à Permit2 est « commonly » au maximum | En production | FAIT SOURCÉ [B], repris d'un dossier interne | http://developers.uniswap.org/llms.mdx/docs/protocols/permit2/overview |
| ERC-7674, approbation temporaire | Le droit disparaît à la fin de la transaction | « Review ». Adoption non retrouvée | FAIT SOURCÉ [A], repris d'un dossier interne | https://eips.ethereum.org/EIPS/eip-7674 |
| Intents d'échange (CoW, UniswapX) | L'utilisateur signe le résultat voulu, un tiers exécute | CoW : plus de 200 Md$ de volume cumulé fin T2 2026 (rapport relayé). Part de marché 2026 face à UniswapX non trouvée | FAIT SOURCÉ [C] | https://www.binance.com/ar/square/post/350386375847697 ; https://hackmd.io/@CrystalCoW/r1Ny7aDOT |
| Intents, limite connue | Le faux site de CoW Swap (14 avril 2026, environ 1,2 M$) a fait signer de nouvelles approbations vers l'attaquant. L'intent ne protège pas d'une interface détournée | | FAIT SOURCÉ [B], repris d'un dossier interne | https://revoke.cash/exploits |

### 1.2 Lecture

- **TENDANCE SOURCÉE.** Le vocabulaire du droit borné (plafond, période, expiration, révocation) passe des normes vers des écrans grand public. MetaMask a ajouté deux familles de types en deux versions de production (13.23.0 puis 13.32.1). Source : tableau de versions ci-dessus.
- **FAIT SOURCÉ.** Les normes clés restent des brouillons (7715 et 7710 en « Draft »). Le sol bouge encore.
- **FAIT SOURCÉ.** Un pouvoir plus fort crée aussi une exposition plus forte : les délégations 7702 ont été massivement détournées vers du code de vidage (Wintermute, étude USENIX). Le moindre privilège ne concerne donc pas seulement les approbations ERC-20, mais aussi les délégations de compte.
- **HYPOTHÈSE À TESTER.** Ces briques déplacent la question. Avant : « faut-il un droit illimité ? ». Après : « qui écrit la borne, et à partir de quoi ? ». Aujourd'hui c'est le site qui propose la borne (ERC-7715 : le site demande, le portefeuille peut réduire si le site le permet). Personne ne part de ce que l'humain a écrit. C'est la place de Hold up.
- **HYPOTHÈSE À TESTER.** Hold up peut parler ces formats au lieu d'en inventer un : sortir la borne en permission ERC-7715, en politique de session, ou en alerte quand le site demande plus. À prototyper : nous n'avons rien branché sur ERC-7715.

---

## 2. Agents IA qui dépensent

### 2.1 Ce qui existe réellement en 2026

| Élément | Fait | Statut | Source |
|---|---|---|---|
| x402 (Coinbase), volumes mesurés par un tiers | Environ 52,7 M$ et 198,9 M de règlements depuis mai 2025. Après filtres, 25,6 M$. Part qui ressemble à des agents : 0,6 à 7,5 %. Volume « agent » : environ 5 000 à 11 000 $ par mois | FAIT SOURCÉ [B] (TRM vend de l'analyse) | https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain (9 sept. 2026) |
| x402 Foundation | Fondation sous la Linux Foundation, environ 40 membres dont Visa, Mastercard, Stripe, Google, AWS. Dates divergentes : annonce en avril, lancement opérationnel le 14 juillet 2026. Environ 24 M$ et 75 M de transactions sur 30 jours avant le lancement, 0,32 $ en moyenne | FAIT SOURCÉ [C] | https://www.paymentsjournal.com/industry-backed-x402-foundation-is-aimed-at-agentic-commerce-gaps/ ; https://forkast.news/?p=127763 |
| Qualité du volume x402 | Une part des transactions vient d'un mécanisme de frappe payante d'un jeton mème (PING) fin 2025 | FAIT SOURCÉ [C] | https://forkast.news/?p=127763 |
| AP2 (Google) et FIDO Alliance | Le 28 avril 2026, la FIDO Alliance crée un groupe « Agentic Authentication » (présidé par CVS Health, Google, OpenAI) et un groupe « Payments » (présidé par Mastercard et Visa). Google apporte AP2, Mastercard apporte « Verifiable Intent ». Objectif : des transactions d'agents « within user-controlled boundaries » | FAIT SOURCÉ [A] | https://www.fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/ |
| Ce qu'est un mandat AP2 | Artefact signé qui lie l'agent à un périmètre de dépense. La v0.2 ajoute le paiement « Human Not Present » | FAIT SOURCÉ [C] | https://www.spark.money/research/google-ap2-agent-payment-protocol |
| Coinbase Agentic Wallets | Lancés le 11 février 2026. Portefeuille MPC, plafonds par session et par transaction, la clé ne passe jamais dans le modèle. Installation par CLI ou serveur MCP | FAIT SOURCÉ [C] | https://forklog.com/en/coinbase-unveils-wallet-infrastructure-for-ai-agents/ ; https://www.paymentsjournal.com/coinbase-unveils-agentic-wallets-to-power-autonomous-ai-spending-and-investing |
| Fireblocks, contrôles de dépense x402 | Plafond par transaction, vélocité, listes blanches, approbation mobile, un coffre par agent | FAIT SOURCÉ [B], repris d'un dossier interne | https://developers.fireblocks.com/docs/x402-agent-spending-controls |
| Politiques en langage naturel déjà proposées | Sardis : portefeuilles MPC « with natural language spending policies », vérification de mandats AP2 annoncée. allowance.eth (ETHGlobal New York 2026) : règles en anglais traduites en JSON par un modèle, appliquées par un contrat | FAIT SOURCÉ [B] (autodescriptions) | https://pypi.org/project/sardis/ ; https://ethglobal.com/showcase/allowance-eth-ejosk |

### 2.2 Incidents documentés

| Date | Incident | Ce que ça montre | Statut | Source |
|---|---|---|---|---|
| 4 mai 2026 | Grok et Bankr : instruction cachée en morse, 3 Md de DRB transférés (environ 150 000 à 200 000 $). Un NFT envoyé avant aurait élargi les droits de l'agent. Environ 80 % rendus | Le droit de l'agent a été élargi par un objet reçu, pas par l'humain. Exactement l'inverse d'un droit borné par l'intention | FAIT SOURCÉ [C] | https://oecd.ai/en/incidents/2026-05-04-4a73 ; https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet |
| fév. 2026 | Lobstar Wilde : un agent envoie environ 52 M de jetons après une requête « blague », probable erreur de décimales | Pas une attaque. Un plafond lié au mandat aurait borné l'erreur | FAIT SOURCÉ [C], repris d'un dossier interne | https://cointelegraph.com/news/openai-employee-s-ai-agent-accidentally-sent-442k-to-beggar |
| mars 2025 | AIXBT : console compromise, 55,5 ETH | L'autorité venait d'un canal, pas d'un humain | FAIT SOURCÉ [C], repris d'un dossier interne | https://www.theblock.co/news/regulation/2025-03-18-ai-crypto-bot-aixbt-lost-eth-hack-unauthorized-dashboard-access-346911 |
| 6 juil. 2026 | Zscaler : 26 modèles testés en bac à sable, 4 ont payé sur un contenu web hostile | Laboratoire, pas un vol | FAIT SOURCÉ [C], repris d'un dossier interne | https://securityaffairs.com/194822/ai/hidden-web-prompts-trick-ai-agents-into-sending-money.html |
| avr. 2026 | « Your Agent Is Mine » : 9 routeurs de modèles sur 428 injectent du code dans les appels d'outils, un a transféré de l'ETH depuis une clé de test | Une couche intermédiaire peut réécrire l'ordre. Il faut vérifier après le modèle, au point d'exécution | FAIT SOURCÉ [C], repris d'un dossier interne | https://www.helpnetsecurity.com/2026/04/16/llm-router-security-risk-agent-commands/ |

Ce qu'on n'a **pas** trouvé : un vol d'agent de paiement en entreprise (comptes fournisseurs, facture piégée) avec perte réelle publiée. Repris de `research/tracks/T1_P3_agents_financiers_v2.md`.

### 2.3 « Hold up pour agents » : à quoi ça ressemblerait

Schéma en quatre temps. HYPOTHÈSE À TESTER pour tout le bloc.

1. **L'humain écrit un mandat.** Exemple : « Paie mes appels d'API météo, 5 $ par jour au plus, seulement à ces deux fournisseurs, jusqu'au 30 novembre. »
2. **Le moteur le traduit en borne.** Montant, période, destinataires, expiration. Sortie dans un format existant : permission ERC-7715 (périodique), mandat AP2, politique Coinbase ou Fireblocks, garde Safe.
3. **Chaque demande de l'agent est comparée au mandat.** Du code lit la transaction réelle, pas le résumé de l'agent. Hors mandat : refus ou question à l'humain.
4. **L'agent ne peut pas élargir sa propre borne.** Toute extension repasse par l'humain. C'est la leçon Grok et Bankr.

Ce qui serait propre à Hold up, par rapport aux briques du 2.1 :
- la borne vient de la phrase de l'humain, pas d'une configuration écrite par le développeur de l'agent ;
- la vérification se fait hors de l'agent et hors du site, sur l'effet réel ;
- le même moteur sert au particulier (extension) et à l'agent (API), donc une seule méthode de mesure, publique et rejouable.

Ce qui ne serait pas propre à Hold up : les plafonds, listes blanches et expirations. Coinbase, Fireblocks, MetaMask les ont. FAIT SOURCÉ (2.1).

### 2.4 Est-ce un vrai besoin aujourd'hui ?

- **Oui, au sens du risque.** Les pertes réelles sur des portefeuilles d'agents existent (2.2). FAIT SOURCÉ.
- **Non, au sens du marché.** Le volume « agent » mesuré par TRM est de 5 000 à 11 000 $ par mois. FAIT SOURCÉ. Personne ne paie cher pour protéger ce volume.
- **Le payeur probable** n'est pas l'humain qui a un agent, mais celui qui fournit le portefeuille ou le rail à l'agent (Coinbase, Fireblocks, Crossmint, une plateforme d'agents) et qui veut prouver que l'agent est resté dans le mandat. HYPOTHÈSE À TESTER.
- **Signal institutionnel.** Les grands réseaux de paiement ont confié à la FIDO Alliance un chantier sur « verifiable user instructions » et sur la délégation bornée. FAIT SOURCÉ [A]. Cela indique où se fixera la norme. Cela ne dit rien du volume futur.
- **Verdict honnête.** Besoin réel, marché minuscule aujourd'hui. Hold up pour agents est une extension de la méthode, pas un premier marché.

---

## 3. Entreprises : trésoreries DAO et Safe

### 3.1 Bybit, ce qui est établi

| Fait | Statut | Source |
|---|---|---|
| Vol d'environ 1,5 Md$ le 21 février 2025, attribué par le FBI à l'activité nord-coréenne « TraderTraitor » | FAIT SOURCÉ [A] | https://ic3.gov/PSA/2025/PSA250226 (avis I-022625-PSA, 26 fév. 2025) |
| Point d'entrée : poste d'un développeur de Safe{Wallet} compromis. Code JavaScript modifié servi depuis le stockage de Safe, actif seulement pour la cible. Les signataires ont vu une interface normale | FAIT SOURCÉ [C] | https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/ ; https://cointelegraph.com/news/safe-wallet-releases-bybit-hack-post-mortem |
| Safe : aucune faille trouvée dans ses contrats ni dans le code source de son interface ; infrastructure reconstruite, identifiants changés | FAIT SOURCÉ [C] (déclaration de Safe relayée) | https://cointelegraph.com/news/safe-releases-post-mortem-update-cz-criticizes-response |

Leçon : plusieurs signataires ne valent rien s'ils lisent tous la même interface. C'est la comparaison intention contre effet, faite sur un appareil indépendant, qui aurait pu voir l'écart. HYPOTHÈSE À TESTER. Notre démo « scène deux » la rejoue en synthétique, pas sur Bybit.

### 3.2 Ce qui existe déjà pour les signataires

| Acteur | Ce qu'il fait | Statut | Source |
|---|---|---|---|
| Safe Shield Copilot | Signaux de risque dans l'écran de confirmation : Blockaid, Tenderly, Hypernative, simulation avant exécution | FAIT SOURCÉ [B] | https://help.safe.global/articles/6434169802-understanding-safe-shield-copilot |
| Safe Shield Guardian (Hypernative) | Garde de transaction : approuver, signaler ou bloquer selon des politiques (plafond, contreparties approuvées, contrats non vérifiés, plus de signataires pour les actions sensibles). Activation sur demande à Safe. Retrait avec un délai de 24 h | FAIT SOURCÉ [B] | https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative |
| Partenariat Safe et Hypernative | Annoncé le 20 nov. 2025 | FAIT SOURCÉ [B] | https://www.safe.global/blog/safe-partners-with-hypernative-to-launch-enterprise-security-integration |
| Cas client | Tydro bloque des transactions sur ses Safe avec la garde de Hypernative (août 2026) | FAIT SOURCÉ [B] (étude de cas du vendeur) | https://www.hypernative.io/insights/blog/tydro-turns-to-hypernative-to-stop-malicious-transactions-before-they-execute |

### 3.3 Ce qui manque

- **FAIT SOURCÉ.** Le marché des contrôles avant signature pour équipes n'est pas vide : Safe a intégré Blockaid, Tenderly et Hypernative (3.2).
- **HYPOTHÈSE À TESTER.** Ce qui manque est le lien avec l'intention écrite par celui qui propose. Une politique dit « plafond de 100 000 $ ». Elle ne dit pas « cette transaction est le paiement de la facture 4471, 20 000 USDC, au fournisseur X ». Le signataire n'a rien pour comparer, sinon l'interface.
- **HYPOTHÈSE À TESTER.** Produit possible : le proposeur écrit l'intention ; chaque signataire, sur son propre appareil, voit la comparaison entre cette phrase et l'effet décodé. Ça complète Guardian, ça ne le remplace pas.
- **Réserve.** Taille de ce marché non mesurée par nous. Nos notes internes (`research/titouan/J_recherche/J2_tresoreries_onchain.md`) sont à relire avant tout chiffre.

---

## 4. Assurance liée à l'usage de droits bornés

### 4.1 Précédents trouvés

| Précédent | Ce qu'il lie | Proche de nous ? | Statut | Source |
|---|---|---|---|---|
| Coincover Protect | Garantie : « every transaction that we successfully validate is backed by our full warranty ». Surveillance de chaque transaction par jeton en lecture seule | Le plus proche : une garantie liée à un contrôle avant transaction. Mais liée à leur validation, pas à un droit borné | FAIT SOURCÉ [B] | https://coincover.com/products/protect ; https://coincover.com/faq |
| Cysurance et Sophos | Rabais de 18 à 21 % (Endpoint) et 33 % (MDR) si le contrôle est installé, sans questionnaire classique | Modèle « contrôle installé = prime plus basse ». Hors crypto | FAIT SOURCÉ [B] | https://www.sophos.com/en-us/marketplace/cysurance-au |
| MFA et assurance cyber | Pas de règle universelle, mais la MFA est devenue un point standard de souscription. Ville de Hamilton : refus d'indemnisation rapporté faute de MFA complète | Un contrôle d'accès devient condition de couverture | FAIT SOURCÉ [C] | https://www.insurancebusinessmag.com/uk/news/cyber/mfa-used-to-be-a-nicetohave--now-insurers-just-say-no-without-it-585827.aspx ; https://specopssoft.com/blog/cyber-insurance-mfa-requirements/ |
| AIUC-1 | Certification d'agents IA (tests adverses), puis police d'assurance. ElevenLabs annonce la première police fondée sur AIUC-1. Limites jusqu'à 50 M$ selon AIUC | Contrôle vérifié par un tiers = assurabilité d'un agent | FAIT SOURCÉ [C] | https://www.aiuc-1.com ; https://www.insurtechinsights.com/elevenlabs-secures-ai-agent-insurance-with-aiuc-1-certification/ |
| Chainproof (Quantstamp) | Assureur régulé aux Bermudes (2022), réassuré par Munich Re, pour contrats audités | Audit = porte d'entrée vers l'assurance. Statut actuel non vérifié | FAIT SOURCÉ [B] | https://quantstamp.com/blog/chainproof |
| Exclusions IA | AIG, Great American, WR Berkley demandent à exclure les risques liés à l'IA (FT, nov. 2025) | Sans contrôle prouvé, pas de couverture | FAIT SOURCÉ [C], repris d'un dossier interne | https://the-decoder.com/major-insurers-seek-to-exclude-ai-related-risks-from-corporate-policies/ |
| Nexus Mutual | Couvre piratages de contrats, défaut de dépositaire, décrochage. Exclut la perte de clés | Pas de produit paramétrique lié aux droits trouvé | FAIT SOURCÉ [B] | https://www.nexusmutual.io/ |

### 4.2 Précédent direct : non trouvé

Assurance paramétrique dont le prix ou le déclenchement dépend de l'usage de droits bornés : **non trouvée** dans les sources lues. Formule à utiliser : « non trouvé », pas « n'existe pas ».

### 4.3 Pourquoi l'idée tient sur le papier

- **FAIT SOURCÉ.** Un droit borné limite la perte dans le portefeuille au montant écrit (LI.FI, juillet 2024 : 11,6 M$ pris aux approbations illimitées, rien aux approbations finies, selon LI.FI). https://li.fi/knowledge-hub/incident-report-16th-july/ [A], repris d'un dossier interne.
- **HYPOTHÈSE À TESTER.** Une perte bornée est plus facile à assurer qu'une perte ouverte : le plafond de sinistre est connu d'avance. Le journal de Hold up (droit demandé, droit accordé, phrase écrite) serait la pièce que l'assureur lit.
- **HYPOTHÈSE À TESTER.** Version paramétrique : « si un service listé est déclaré compromis et que vos droits envers lui étaient bornés par Hold up, vous touchez X ». Problèmes ouverts : qui déclare la compromission, comment éviter la fraude, quel volume de sinistres pour calibrer. Personne de chez nous n'a parlé à un assureur.

---

## 5. Trois scénarios sur 2 à 3 ans (fin 2028 à fin 2029)

Aucun scénario ne suppose une hausse des pertes. Ils reposent sur l'adoption des briques déjà livrées et sur nos propres mesures.

### 5.1 Prudent : « l'outil de vérification pour particuliers prudents »

- **Ce que c'est.** Hold up reste une extension gratuite. Elle compare la phrase à la demande et ramène les droits à ce qui a été écrit. Communauté de quelques milliers d'utilisateurs. Méthode de mesure publique.
- **Ce qu'il faut.** Avertissements honnêtes sous 10 % (aujourd'hui 54 % sur nos paires, 77 % sur 6 325 transactions Avalanche : voir `PITCH_V6_TITOUAN.md`). Test réel avec MetaMask terminé. Jeu aveugle publié.
- **Revenus.** Faibles. Partenaires orientés, pas d'abonnement (décision du 11 oct. 2026).
- **Signaux à surveiller.** Part des utilisateurs qui acceptent la réduction du droit. Taux de désinstallation.
- **Raisons de se tromper.** Les portefeuilles intègrent eux-mêmes la comparaison (MetaMask a déjà l'écran de plafond et les permissions avancées). Les produits grand public du secteur ont fermé ou été absorbés (Harpie, Wallet Guard : voir `research/titouan/L_harpie_postmortem.md`). FAIT SOURCÉ interne.

### 5.2 Probable : « le moteur de mandat sous licence »

- **Ce que c'est.** Le moteur (phrase vers borne, borne contre demande) est vendu ou licencié à des portefeuilles, plateformes d'échange et fournisseurs de portefeuilles d'agents. L'extension reste la vitrine et le banc de mesure.
- **Ce qu'il faut.** Une API de verdict sans état (citée dans le pitch V6, non construite). Sortie native en ERC-7715 et en politique de session. Une preuve chiffrée qu'une borne écrite réduit la perte sur des rejeux d'incidents. Un premier partenaire qui l'intègre.
- **Signaux à surveiller.** Nombre de sites qui demandent des permissions ERC-7715 (aujourd'hui « some dapps », non chiffré). Passage d'ERC-7715 de « Draft » à « Final ». Publication des spécifications FIDO sur la délégation pour agents. Volume « agent » réel mesuré par TRM ou équivalent.
- **Raisons de se tromper.** Les fournisseurs de portefeuilles d'agents ajoutent eux-mêmes des politiques en langage naturel (Sardis le revendique déjà). La traduction phrase vers borne devient une fonction banale d'un modèle. Notre avance tiendrait alors sur la mesure publique, pas sur la fonction.

### 5.3 Ambitieux : « la couche neutre du droit borné »

- **Ce que c'est.** Hold up devient l'endroit où l'on écrit, vérifie et prouve un mandat, pour un humain, une équipe ou un agent. Un mandat Hold up se traduit en permission ERC-7715, en mandat AP2, en politique Safe. Le journal sert de pièce à l'assureur et à l'auditeur.
- **Ce qu'il faut.** Interopérabilité avec AP2 et Verifiable Intent. Un partenariat d'assurance (sur le modèle Coincover ou AIUC-1). Une équipe signataire qui l'adopte sur un Safe. Un audit externe du moteur.
- **Signaux à surveiller.** Un assureur qui lie une prime ou une garantie à l'usage de droits bornés. Un incident public où le droit borné a visiblement limité la perte. Une plateforme d'agents qui exige un mandat vérifiable avant d'accorder un portefeuille.
- **Raisons de se tromper.** La norme FIDO tranche la question du mandat et les grands réseaux de paiement la fournissent eux-mêmes. Le volume agent reste minuscule. La responsabilité en cas d'erreur de traduction phrase vers borne effraie les partenaires. Aucun de ces trois points n'est réglé.

### 5.4 Tableau de synthèse

| | Prudent | Probable | Ambitieux |
|---|---|---|---|
| Client principal | Particulier | Portefeuille, plateforme, rail d'agent | Particulier, équipe, agent, assureur |
| Produit | Extension | Moteur sous licence plus extension vitrine | Couche de mandat interopérable |
| Preuve nécessaire | Avertissements sous 10 %, jeu aveugle | Rejeux d'incidents, premier intégrateur | Audit, partenaire d'assurance |
| Premier signal | Taux d'acceptation de la réduction | Sites qui demandent ERC-7715 | Assureur qui lie prime et droit borné |
| Principal risque | Le portefeuille le fait lui-même | Fonction banalisée | La norme et les réseaux nous contournent |

---

## 6. La promesse déclinée par segment

Phrase mère : « Cesser de donner plus que nécessaire, car on s'expose en le faisant. »

| Segment | Promesse | Ce qui est vrai aujourd'hui | Statut |
|---|---|---|---|
| Particulier | « Vous écrivez ce que vous voulez faire. Hold up vérifie que la demande ne prend pas plus. » | Prototype d'extension, mesuré sur 1 079 paires et 6 325 transactions Avalanche | FAIT interne (`PITCH_V6_TITOUAN.md`) |
| Plateforme (portefeuille, exchange) | « Vos utilisateurs n'accordent que ce qu'ils ont écrit. Si votre service est compromis un jour, la perte reste bornée. » | Le principe est prouvé par LI.FI. L'API de verdict n'est pas construite | FAIT SOURCÉ pour LI.FI ; HYPOTHÈSE pour le produit |
| Équipe (trésorerie, Safe) | « Chaque signataire compare la phrase du proposeur à l'effet réel, sur son propre appareil. Pas seulement à l'interface. » | Leçon Bybit établie. Démo synthétique seulement | FAIT SOURCÉ pour Bybit ; HYPOTHÈSE pour le produit |
| Agent | « L'agent ne dépense que ce que vous lui avez écrit, et ne peut pas élargir sa propre borne. » | Rails et plafonds existent chez d'autres. Rien construit chez nous | HYPOTHÈSE À TESTER |

---

## Le pitch de la vision en 60 secondes

« Quand on signe un droit, on donne souvent plus que nécessaire. Un droit illimité, une délégation de compte, un portefeuille confié à un agent. Le jour où le service est compromis, on perd ce qu'on lui a laissé prendre. Chez LI.FI en 2024, ceux qui avaient donné un droit illimité ont perdu 11,6 millions. Ceux qui avaient donné un montant fini, rien.

Le secteur construit la plomberie du droit borné. MetaMask livre des permissions à plafond et à expiration. Google et Mastercard ont confié leurs mandats d'agents à la FIDO Alliance. Safe ajoute des politiques avant signature.

Mais partout, c'est le site ou le développeur qui écrit la borne. Personne ne part de ce que l'humain a dit.

Hold up part de là. Vous écrivez ce que vous voulez. Nous le traduisons en droit borné, et nous vérifions chaque demande contre votre phrase, en lisant l'effet réel.

Aujourd'hui, c'est une extension pour particuliers, mesurée et imparfaite : trop d'avertissements, nous le publions. Demain, le même moteur pour les plateformes, les équipes signataires et les agents. Nous ne promettons pas que les pertes montent. Nous disons qu'on ne devrait jamais avoir à perdre plus que ce qu'on a écrit. »

---

## Les 5 questions de jury sur la vision, avec réponses honnêtes

**1. « MetaMask fait déjà des permissions bornées. Pourquoi vous ? »**
C'est vrai : permissions périodiques, flux et plafond, en production depuis les versions 13.23.0 et 13.32.1. Mais c'est le site qui demande la borne, et le portefeuille ne la réduit que si le site le permet (ERC-7715, `isAdjustmentAllowed`). Nous partons de la phrase de l'utilisateur et nous contrôlons aussi les sites qui demandent l'illimité. Si MetaMask fait la même chose demain, notre avance tiendra sur la mesure publique, pas sur la fonction. Ce n'est pas une barrière durable et nous le disons.

**2. « Les agents qui paient, c'est du vent. Votre vision repose dessus ? »**
Non. TRM mesure 5 000 à 11 000 $ par mois de volume qui ressemble à des agents sur x402. C'est minuscule. Les pertes réelles existent (Grok et Bankr, mai 2026) mais restent rares. Notre premier marché est le particulier, puis les plateformes. Les agents sont une extension naturelle de la même méthode, pas notre pari principal.

**3. « Qui paie, concrètement ? »**
Pas le particulier : nos chiffres internes montrent une perte attendue trop faible pour un abonnement. Le payeur plausible est celui qui porte le risque à la place de l'utilisateur : portefeuille, plateforme, fournisseur de portefeuille d'agent, et à terme un assureur. Aucun d'eux n'a signé. C'est la prochaine chose à tester.

**4. « Votre idée d'assurance liée aux droits bornés, ça existe ? »**
Pas sous cette forme, dans ce que nous avons lu. Les cousins existent : Coincover garantit les transactions qu'il valide, des assureurs cyber baissent la prime quand un contrôle est installé, AIUC-1 rend un agent assurable après tests. Nous n'avons parlé à aucun assureur. C'est une hypothèse, présentée comme telle.

**5. « Vous dites que l'IA rend tout ça urgent ? »**
Non. Ce qui est prouvé : des agents écrivent des exploits de contrats en simulation, pour quelques dollars l'essai. Ce qui n'est pas prouvé : un seul vol réel attribué à l'IA. Et les pertes par approbation ne montent pas : 7,4 M$ en 2025, l'année la plus basse de la liste Revoke.cash. Notre argument n'est pas l'urgence. C'est une règle de conception : on suppose qu'un service peut être compromis, et on borne ce qu'il peut prendre ce jour-là.

---

## Non lu ou non retrouvé

- Nombre de sites qui demandent des permissions ERC-7715 ; date exacte du lancement en production chez MetaMask (pas de communiqué trouvé, seulement le tableau de versions).
- Chiffres d'adoption d'EIP-7702 en 2026.
- Part de marché 2026 de CoW face à UniswapX.
- Page Gartner sur les « guardian agents » (403 ce jour). Le chiffre « 10 à 15 % du marché de l'IA agentique en 2030 » est une prévision d'analyste, lue dans un dossier interne (`research/tracks/T1_P3_agents_financiers_v2.md`). Ne pas la présenter comme une mesure.
- Conditions réelles de garantie de Coincover ; statut actuel de Chainproof.
- Tout précédent d'assurance paramétrique lié à des droits bornés.
- Prix de Safe Shield Guardian.
- Documentation officielle de Coinbase sur les paramètres des plafonds de session (seulement des sources secondaires).

## Sources

Normes et documentation officielle [A] :
- https://eips.ethereum.org/EIPS/eip-7715
- https://eips.ethereum.org/EIPS/eip-7710
- https://eips.ethereum.org/EIPS/eip-7674
- https://www.fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/ (28 avr. 2026)
- https://ic3.gov/PSA/2025/PSA250226 (26 fév. 2025)
- https://li.fi/knowledge-hub/incident-report-16th-july/

Acteurs intéressés [B] :
- https://docs.metamask.io/smart-accounts-kit/get-started/supported-advanced-permissions/
- https://docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions/
- https://support.metamask.io/more-web3/dapps/advanced-permissions/
- https://www.zerodev.app/blogs/erc-4337-final-not-finished (12 août 2026)
- https://docs.zerodev.app/blog/7702-adoption
- https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain (9 sept. 2026)
- https://help.safe.global/articles/6434169802-understanding-safe-shield-copilot
- https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative
- https://www.safe.global/blog/safe-partners-with-hypernative-to-launch-enterprise-security-integration
- https://www.hypernative.io/insights/blog/tydro-turns-to-hypernative-to-stop-malicious-transactions-before-they-execute
- https://developers.fireblocks.com/docs/x402-agent-spending-controls
- http://developers.uniswap.org/llms.mdx/docs/protocols/permit2/overview
- https://revoke.cash/exploits
- https://coincover.com/products/protect ; https://coincover.com/faq
- https://www.sophos.com/en-us/marketplace/cysurance-au
- https://quantstamp.com/blog/chainproof
- https://www.nexusmutual.io/
- https://www.aiuc-1.com
- https://pypi.org/project/sardis/ ; https://ethglobal.com/showcase/allowance-eth-ejosk

Presse et résumés [C] :
- https://www.theblock.co/post/356481/wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks
- https://cointelegraph.com/news/wintermute-crimeenjoyor-flags-malicious-ethereum-contracts
- https://eprint.iacr.org/2026/2060.pdf
- https://www.spark.money/glossary/session-key ; https://www.alchemy.com/dapps/rhinestone
- https://www.binance.com/ar/square/post/350386375847697 ; https://hackmd.io/@CrystalCoW/r1Ny7aDOT
- https://www.paymentsjournal.com/industry-backed-x402-foundation-is-aimed-at-agentic-commerce-gaps/ ; https://forkast.news/?p=127763
- https://www.spark.money/research/google-ap2-agent-payment-protocol
- https://forklog.com/en/coinbase-unveils-wallet-infrastructure-for-ai-agents/ ; https://www.paymentsjournal.com/coinbase-unveils-agentic-wallets-to-power-autonomous-ai-spending-and-investing
- https://oecd.ai/en/incidents/2026-05-04-4a73 ; https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet
- https://cointelegraph.com/news/openai-employee-s-ai-agent-accidentally-sent-442k-to-beggar
- https://www.theblock.co/news/regulation/2025-03-18-ai-crypto-bot-aixbt-lost-eth-hack-unauthorized-dashboard-access-346911
- https://securityaffairs.com/194822/ai/hidden-web-prompts-trick-ai-agents-into-sending-money.html
- https://www.helpnetsecurity.com/2026/04/16/llm-router-security-risk-agent-commands/
- https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/
- https://cointelegraph.com/news/safe-wallet-releases-bybit-hack-post-mortem ; https://cointelegraph.com/news/safe-releases-post-mortem-update-cz-criticizes-response
- https://www.insurancebusinessmag.com/uk/news/cyber/mfa-used-to-be-a-nicetohave--now-insurers-just-say-no-without-it-585827.aspx ; https://specopssoft.com/blog/cyber-insurance-mfa-requirements/
- https://www.insurtechinsights.com/elevenlabs-secures-ai-agent-insurance-with-aiuc-1-certification/
- https://the-decoder.com/major-insurers-seek-to-exclude-ai-related-risks-from-corporate-policies/

Réserve de méthode : l'outil de lecture résume les pages. Relire la phrase exacte à l'URL avant toute slide, surtout pour les sources [C].
