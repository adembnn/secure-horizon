# 08 — Idées contrarian / cross-track

> Hackathon cybersécurité ESSEC Cergy, 10-11 octobre 2026, 36h. Équipe : Adem (tech) + Titouan (business). Accès AWS Bedrock (Claude).
> Recherche web faite le 10/10/2026. Les chiffres viennent souvent de rapports d'éditeurs : la source est indiquée, et ceux à vérifier avant le pitch sont signalés par ⚠️.

## Thèses contrarian qui structurent la liste

1. **Les agents IA sont devenus des acteurs économiques** : wallet, identité, droit de payer (x402, ERC-8004, Coinbase Agentic Wallets). Le hack ne vise plus la clé privée mais le *raisonnement* de l'agent (cas Grok/Bankr, mai 2026). C'est le point de jonction exact entre track 1 et track 2.
2. **Détecter les deepfakes est une course perdue.** Mieux vaut *prouver l'authentique* (crypto, contre-appel, challenge) que traquer le faux.
3. **L'attaquant IA a une faiblesse que l'humain n'a pas : il est injectable.** On peut retourner la prompt injection contre lui (deception). Horizon3 décrit un « recognition-action gap » : le modèle voit le piège et tombe dedans quand même.
4. **La fenêtre de patch est négative** (Google M-Trends 2026 : time-to-exploit moyen de −7 jours). Seule la défense à vitesse machine tient.
5. **Le marché paie.** Check Point → Lakera, Palo Alto → Protect AI, SentinelOne → Prompt Security, Cisco → Astrix (en cours). Gartner : 51,3 Md$ de dépenses cyber-IA en 2026.

---

## Idée 1 — **Seatbelt** : la ceinture de sécurité des agents qui détiennent de l'argent
*Tracks 1 + 2 (hybride)*

**One-liner** : un co-signataire de politique qui vérifie l'*intention* avant que l'agent signe, pour qu'une prompt injection ne puisse jamais vider le wallet.

**Problème**
- Mai 2026 : un utilisateur de X envoie un message encodé en Morse à Grok, qui autorise un transfert de ~150 à 200 k$ en tokens DRB selon les sources (Giskard, OECD AI Incidents, KuCoin, MetaMask via token.im). L'attaque a combiné un NFT accordant des permissions élevées et un texte que la couche de sécurité a jugé inoffensif.
- Sherlock recense 824 skills malveillants dans l'écosystème ClawHub début 2026, souvent déguisés en bots de trading.
- Volume x402 : ~165 M de transactions d'agents, ~69 000 agents actifs en avril 2026 ⚠️ (source secondaire).

**Solution**
- Smart account (ERC-4337) sur Avalanche C-Chain. La clé de session de l'agent est bridée par trois contrôles :
  - **politique on-chain** : plafonds, allowlist, vélocité ;
  - **juge d'intention hors runtime** : Claude (Bedrock) reçoit *uniquement* le mandat utilisateur d'origine + la transaction proposée, jamais le contexte pollué, et rend « cohérent / incohérent » ;
  - **réputation ERC-8004** de la contrepartie.
- Le juge cosigne ; sans sa signature, rien ne part. Principe clé : **isolation de contexte** — le juge ne voit jamais le contenu injecté.

**Pourquoi maintenant** : l'incident Grok a 5 mois. ERC-8004 est déployé sur Avalanche mainnet + Fuji (~1 770 agents enregistrés). Fireblocks contribue une « security extension » à x402. Sujet brûlant, aucun standard ouvert côté agent.

**Démo (3 min)**
1. Un agent « trésorier » sur Fuji paie des factures en USDC de test.
2. Titouan dépose une facture PDF / un tweet avec instruction cachée. Sans Seatbelt, le wallet se vide en direct sur l'explorer.
3. On rejoue avec Seatbelt : transaction bloquée, le juge affiche « mandat = payer fournisseurs connus ; tx = 95 % du solde vers une adresse inconnue créée il y a 4 min », validation humaine sur mobile.

**Stack** : Bedrock (Claude Sonnet = juge, Haiku = pré-filtre), Bedrock Guardrails, AgentCore Runtime, Solidity + Foundry sur Fuji, viem, Next.js, registres ERC-8004 publics.

**36h vs mock** — Construit : agent, smart account avec vérif de co-signature, juge, 5 attaques d'injection. Mocké : notif mobile (page web), scoring de réputation (lecture simple du registre), USDC (token de test).

**Business model** : SDK gratuit + « policy cloud » payant (0,1–0,5 % du volume protégé ou abonnement/agent). Cibles : wallets d'agents, fintechs crypto, trésoreries de DAO.

**Concurrents** : garde-fous Coinbase Agentic Wallets (limites + TEE, propriétaires), moteur de politique Fireblocks, Turnkey/Privy (signature sans compréhension d'intention), Lakera/Check Point (LLM, pas on-chain). **Trou du marché** : vérif sémantique mandat ↔ transaction, ouverte et multi-wallet.

**Notes** — Impact 9 · Faisabilité 8 · Wow 10 · Fit jury 9 · Business 9 → **45/50**

---

## Idée 2 — **PreCrime** : audit offensif automatisé de contrats, en continu
*Tracks 1 + 2 (hybride)*

**One-liner** : chaque nouveau contrat déployé est audité par un agent Claude qui tente de prouver une faille sur un fork privé ; si la preuve passe, on alerte le déployeur et on déclenche une pause.

**Problème**
- SCONE-bench (Anthropic) : 10 modèles ont produit des exploits pour 207 contrats sur 405, soit 550,1 M$ simulés. Anthropic estime que plus de la moitié des exploits blockchain de 2025 étaient automatisables ; coût par attaque ~1,22 $ ⚠️.
- EVMbench (OpenAI + Paradigm, fév. 2026) : 117 vulnérabilités issues de 40 audits, mode « exploit » noté sur le drainage réel en sandbox Anvil.
- TRM Labs : 207 hacks au S1 2026, ~972 M$ (CertiK : 1,32 Md$).

**Solution** : un watcher de déploiements → Claude lit la source vérifiée, raisonne sur les invariants, et **tente une preuve-de-concept dans un sandbox fermé que nous contrôlons** (fork local, jamais le mainnet). Si une PoC draine des fonds de test, le déployeur reçoit un rapport et, pour les contrats équipés de notre module « pausable », un circuit-breaker se déclenche. Cadrage strictement défensif : l'outil ne sert que les contrats dont le propriétaire a opté, et ne publie jamais de PoC exploitable — seulement un rapport de remédiation.

**Pourquoi maintenant** : les benchmarks publics (Anthropic, OpenAI/Paradigm) viennent de prouver que la capacité existe. La question n'est plus « est-ce possible » mais « qui l'utilise en défense en premier ».

**Démo (3 min)** : on déploie un contrat vulnérable connu sur Fuji, PreCrime le détecte en < 60 s, produit le rapport de faille lisible, et déclenche la pause — avant qu'un second agent « attaquant » (scénarisé) ne puisse toucher les fonds.

**Stack** : Bedrock (Claude), AgentCore, Foundry/Anvil en fork, un indexeur de déploiements, dashboard Next.js.

**36h vs mock** — Construit : watcher, boucle d'audit sur 3–4 classes de failles classiques (reentrancy, access control, oracle), rapport, module pausable. Mocké : couverture exhaustive des failles, intégration multi-chain.

**Business model** : abonnement par contrat surveillé + part du « bug bounty » évité. Cibles : protocoles DeFi, launchpads, assureurs on-chain.

**Concurrents** : audits humains (Trail of Bits, OpenZeppelin), Forta (détection on-chain réactive, pas proactive), outils statiques (Slither). **Différenciateur** : audit *adversarial* continu à chaque déploiement + circuit-breaker.

**Risque** : cadrage éthique à soigner dans le pitch (outil défensif, opt-in, pas de PoC publié).

**Notes** — Impact 9 · Faisabilité 6 · Wow 9 · Fit jury 8 · Business 8 → **40/50**

---

## Idée 3 — **ProofCall** : la fin du faux conseiller bancaire
*Track 1 (fort), touche 3*

**One-liner** : un canal de vérification à sens inverse — ce n'est plus vous qui prouvez votre identité à la banque, c'est la banque qui prouve la sienne, par un secret cryptographique partagé affiché dans l'app.

**Problème**
- Banque de France / Observatoire des moyens de paiement : les escroqueries par manipulation (dont le faux conseiller) atteignent **516 M€** en 2025 (+34 % sur un an), soit > 40 % de la fraude aux moyens de paiement (fraude globale : 1,24 Md€).
- Le spoofing affiche le vrai numéro de la banque (jugements Boursorama, Lyon 13/01/2026 ; BNP Paribas, Paris 14/04/2026).
- La fuite DGFiP (août 2026, 678 000 personnes) alimente la crédibilité des escrocs (revenu fiscal, prélèvement à la source, personnes à charge).

**Solution** : à chaque appel sortant « officiel », la banque pousse dans l'app du client un code de session + le motif de l'appel + l'identité de l'agent. Le client voit « Appel en cours : Marie D., motif : vérif. virement ». Pas de code dans l'app = faux appel. Un agent IA (Claude) orchestre côté banque la génération du challenge et, côté client, peut aussi *répondre à la place du client* à un appelant suspect pour tester la fraude (callbot défensif).

**Pourquoi maintenant** : les tribunaux condamnent désormais les banques à rembourser (jurisprudence 2026) → pression réglementaire et financière directe sur les banques pour agir. Les deepfakes vocaux rendent l'authentification par la voix obsolète.

**Démo (3 min)** : Titouan appelle Adem en « spoofant » le numéro de la banque et en clonant une voix. Adem ouvre l'app : aucun challenge → fraude démasquée. Puis appel légitime simulé : le challenge apparaît, motif affiché, confiance rétablie.

**Stack** : Bedrock (Claude pour l'orchestration + le callbot défensif), un backend de challenge (HMAC/TOTP), app mobile mockée en web, intégration téléphonie (Twilio en mock).

**36h vs mock** — Construit : le protocole de challenge, l'affichage client, le callbot qui piège l'appelant. Mocké : la téléphonie réelle, l'intégration cœur bancaire.

**Business model** : licence SaaS aux banques (par compte client/an) ; argument = coût évité des remboursements imposés par la justice.

**Concurrents** : apps bancaires avec notif push (ne prouvent pas l'identité de l'appelant), Eftsure (paiements B2B), solutions anti-spoofing télécom (STIR/SHAKEN, côté réseau). **Différenciateur** : preuve d'authenticité *bidirectionnelle* orientée grand public + callbot.

**Notes** — Impact 9 · Faisabilité 8 · Wow 8 · Fit jury 9 · Business 8 → **42/50**

---

## Idée 4 — **Mirage** : le tarpit qui piège les agents attaquants
*Track 2 (fort), touche 3*

**One-liner** : un leurre qui détecte un attaquant IA parce qu'il retourne la prompt injection contre lui — un humain ne mord pas, un agent si.

**Problème**
- Incidents 2026 d'attaques menées de bout en bout par des agents autonomes (CSA : HackerBot-Claw sur GitHub Actions ; récit Taiwan juillet 2026 ⚠️ source secondaire).
- Palisade Research a déployé des honeypots qui utilisent le goal-hijacking pour distinguer agent IA et humain. Paper arXiv 2604.18248 : « canary tools » (ex. `admin_shell`) sans chemin d'appel légitime → tout appel = injection confirmée.
- Horizon3 : « recognition-action gap » — les modèles frontier voient le piège et le déclenchent quand même.

**Solution** : un faux périmètre (API, fichiers, « secrets ») truffé de canary tokens et de canary tools. Toute interaction y est, par conception, le signe d'un agent malveillant. On y injecte des instructions qui révèlent la présence et l'objectif de l'attaquant (goal-stealing), et on ralentit l'agent avec des réponses synthétiques générées par Claude. Analyse de timing pour confirmer « machine vs humain ».

**Pourquoi maintenant** : les premiers incidents d'agents attaquants autonomes sont documentés en 2026 ; la fenêtre de patch est négative (M-Trends : −7 jours), donc piéger et ralentir devient une vraie couche de défense.

**Démo (3 min)** : on lance un agent « attaquant » (scénarisé, Claude) contre un faux serveur. Mirage le détecte au premier appel de canary tool, bascule en mode leurre, lui sert de faux secrets, et affiche en direct l'objectif volé à l'attaquant + le verdict « agent IA, pas humain ».

**Stack** : Bedrock (Claude pour générer les leurres + analyser), un reverse-proxy/MCP factice, dashboard temps réel.

**36h vs mock** — Construit : le périmètre leurre, les canary tools, la détection, le goal-stealing, le dashboard. Mocké : l'intégration dans une vraie infra, l'agent attaquant (on le scénarise).

**Business model** : abonnement (déploiement par environnement/mois), add-on « agent-aware » pour les plateformes de deception existantes.

**Concurrents** : Tracebit (canaries nouvelle génération), Acalvio (deception OWASP), Thinkst Canary (classique, pas agent-aware), MIRAGE hackathon. **Différenciateur** : spécialisé *attaquant-IA*, avec goal-stealing et timing analysis.

**Notes** — Impact 7 · Faisabilité 8 · Wow 9 · Fit jury 9 (GitGuardian adore) · Business 7 → **40/50**

---

## Idée 5 — **Rootcanary** : stopper la fuite de secrets dans les commits d'agents IA
*Track 2 (fort), touche 1*

**One-liner** : un gardien à vitesse machine qui détecte et neutralise les secrets au moment où un agent IA code — avant le commit, parce que les humains ne relisent plus.

**Problème**
- GitGuardian, State of Secrets Sprawl 2026 : 28,65 M de nouveaux secrets en clair dans des commits GitHub publics en 2025 (+34 % sur un an). Les commits assistés par IA fuient ~2× plus. Claude Code : 3,2 % de taux de fuite vs 1,5 % de base ⚠️ (chiffre d'un communiqué).
- +81 % de fuites de secrets liés aux services IA. 64 % des secrets jugés valides en 2022 étaient encore exploitables en janvier 2026.
- Les laptops de dev concentrent désormais clés d'outils IA, serveurs MCP, modèles locaux, accès prod.

**Solution** : un hook sur la boucle de l'agent (pre-commit + runtime MCP) qui, à chaque write, passe le diff à un détecteur de secrets, puis à Claude pour trancher les cas ambigus (vrai secret vs exemple), **révoque/rote automatiquement** via les API des fournisseurs, et remplace le secret par une référence à un coffre. Zéro intervention humaine, car il n'y en a plus.

**Pourquoi maintenant** : le rapport GitGuardian 2026 est *le* chiffre du moment, et **GitGuardian est juré de la track 2**. Les agents codeurs généralisent le problème exactement cette année.

**Démo (3 min)** : on laisse un agent codeur (Claude) écrire du code avec une clé AWS en dur. Sans Rootcanary, elle part dans le commit. Avec : interception en direct, la clé est remplacée par une ref de coffre, et (en mock) « révoquée » — le tout en < 2 s.

**Stack** : Bedrock (Claude), un détecteur (regex + entropie + modèle), hooks git + serveur MCP, un faux coffre (type Vault), dashboard.

**36h vs mock** — Construit : le hook, la détection, l'arbitrage par Claude, le remplacement par ref, le dashboard. Mocké : la révocation réelle multi-fournisseurs (on simule 1–2 API), l'intégration CI complète.

**Business model** : freemium dev + licence équipe/entreprise (par dépôt ou par agent). Cibles : équipes utilisant des agents codeurs, plateformes DevSecOps.

**Concurrents** : GitGuardian lui-même, TruffleHog, Gitleaks (détection, remédiation souvent manuelle). **Différenciateur** : remédiation *autonome* à vitesse d'agent + arbitrage LLM des faux positifs. Attention : pitcher comme *complément* à GitGuardian, pas comme concurrent frontal (ils sont jurés).

**Notes** — Impact 8 · Faisabilité 9 · Wow 7 · Fit jury 9 · Business 8 → **41/50**

---

## Idée 6 — **AgentPassport** : identité et moindre privilège pour les agents (NHI)
*Track 2 (fort), touche 1*

**One-liner** : un « passeport » éphémère par agent — identité distincte, credentials courts, permissions scellées au mandat — pour tuer le sprawl d'identités non-humaines.

**Problème**
- Ratios machine/humain publiés en 2026 : de 45:1 (Rubrik) à 144:1 (cloud-native), KPMG > 80:1 en moyenne, identités machine ×5 (50 000 → 250 000) entre 2021 et 2025.
- CSA : 43 % utilisent encore des comptes de service partagés, 31 % font tourner les agents sous l'identité d'un humain (attribution et moindre privilège cassés). 68 % des équipes ne distinguent pas un agent légitime d'un acteur malveillant qui se fait passer pour lui (RSA 2026).

**Solution** : un broker qui émet, pour chaque tâche d'agent, un credential à durée de vie courte lié à un mandat signé (scopes dérivés du prompt utilisateur par Claude), traçable, révocable. Chaque action de l'agent porte une attestation vérifiable.

**Pourquoi maintenant** : les ratios explosent, les standards (ERC-8004 côté crypto, OWASP Top 10 for Agentic Identity) émergent tout juste. Fenêtre pour un acteur ouvert.

**Démo (3 min)** : un agent demande à accéder à 3 systèmes. AgentPassport lui délivre un passeport scopé au strict nécessaire ; quand l'agent (injecté) tente une action hors-mandat, le broker la refuse et révoque le passeport en direct.

**Stack** : Bedrock (Claude pour dériver les scopes), un broker OAuth-like, journaux signés, dashboard.

**36h vs mock** — Construit : émission/révocation de credentials scopés, dérivation de scope par Claude, log signé. Mocké : intégration IdP d'entreprise réelle.

**Business model** : plateforme par agent/mois ; add-on gouvernance (audit, conformité). Cibles : entreprises déployant des flottes d'agents.

**Concurrents** : Astrix (Cisco), Token Security, Akeyless, Oasis — le segment NHI *se consolide à grande vitesse* (beaucoup de rachats). **Risque** : marché encombré et bien financé ; se différencier sur le lien mandat→scope piloté par LLM.

**Notes** — Impact 8 · Faisabilité 7 · Wow 6 · Fit jury 8 · Business 7 → **36/50**

---

## Idée 7 — **CleanRoom** : anti-slopsquatting pour agents codeurs
*Track 2, touche 1*

**One-liner** : un garde qui vérifie chaque paquet qu'un agent codeur veut installer — parce que les agents hallucinent des noms de paquets que les attaquants enregistrent ensuite.

**Problème**
- USENIX Security 2025 : 5,2 % de noms de paquets hallucinés pour les modèles commerciaux, 21,7 % pour l'open source ; ~205 000 noms uniques hallucinés sur 576 000 échantillons. 43 % des hallucinations réapparaissent à chaque requête → prévisibles.
- Cas janvier 2026 : `react-codeshift` (jamais existé) recommandé par des outils IA, enregistré par un chercheur, répandu à 237 dépôts. Famous Chollima (RPDC) rédige des README pour faire recommander ses paquets.
- CSA : les agents suppriment le point de contrôle humain qui bloquait l'installation.

**Solution** : un proxy sur le gestionnaire de paquets. Avant toute install par l'agent, vérif existence/âge/provenance/signature + score de réputation + arbitrage Claude sur les cas douteux ; allowlist de prod. Les noms suspects probables sont « réservés » défensivement.

**Pourquoi maintenant** : les agents codeurs installent sans relecture *maintenant* ; les premiers cas réels (2026) sont là.

**Démo (3 min)** : un agent code et tente d'installer un paquet halluciné (qu'on a enregistré nous-mêmes en leurre). CleanRoom bloque, explique pourquoi, propose l'alternative réelle.

**Stack** : Bedrock (Claude), proxy npm/pip, API registres, dashboard.

**36h vs mock** — Construit : proxy, vérifs, arbitrage, blocage. Mocké : couverture multi-écosystèmes, base de réputation complète.

**Business model** : licence DevSecOps par dépôt/équipe ; intégration CI.

**Concurrents** : Endor Labs, Socket, Snyk (SCA), mais peu ciblent le *moment agent*. **Différenciateur** : au point d'install de l'agent, pas en CI a posteriori.

**Notes** — Impact 7 · Faisabilité 8 · Wow 6 · Fit jury 7 · Business 7 → **35/50**

---

## Idée 8 — **DisputeGuard** : la preuve de consentement pour le commerce agentique
*Track 1, touche 2*

**One-liner** : un reçu cryptographique qui lie chaque achat d'un agent au mandat exact de l'utilisateur — pour trancher les litiges « je n'ai pas acheté ça, c'est mon IA ».

**Problème**
- Chargebacks911 (2026) : nouveau motif de litige — l'agent exécute l'ordre « exactement » mais le client conteste. Les preuves classiques (auth, livraison) ne suffisent plus.
- Visa pousse l'agentic commerce (100+ partenaires), mais la distinction agent légitime / bot malveillant reste le problème anti-fraude central. Confort des consommateurs à laisser l'IA acheter : de 45 % à 85 % selon les sources ⚠️.
- Standard AP2 : lie les achats d'agents à un consentement vérifiable.

**Solution** : un « mandat signé » (type AP2) que l'agent doit présenter au marchand, avec limites (montant, catégorie, durée). Chaque achat produit un reçu signé liant transaction ↔ mandat ↔ utilisateur. En cas de litige, la preuve est automatique. Claude vérifie la cohérence achat/mandat au checkout.

**Pourquoi maintenant** : Visa, Stripe, Google (AP2) lancent l'agentic commerce *cette année* ; la couche litige/fraude est le trou béant.

**Démo (3 min)** : un agent achète dans le mandat → reçu vert. Puis achat hors-mandat (injecté) → bloqué, et sur un achat contesté on rejoue le reçu qui tranche en 2 s.

**Stack** : Bedrock (Claude), mandats signés (clé/HMAC), faux marchand + faux PSP, dashboard litiges.

**36h vs mock** — Construit : mandat signé, vérif au checkout, reçu, résolution de litige. Mocké : intégration PSP/réseau carte réelle.

**Business model** : par transaction protégée (quelques points de base) ou SaaS marchand. Cibles : marchands, PSP, réseaux cartes.

**Concurrents** : Visa Intelligent Commerce, Chargebacks911 (narratif litige), Stripe. **Risque** : les réseaux cartes pourraient absorber la couche ; se positionner comme brique ouverte/interopérable.

**Notes** — Impact 8 · Faisabilité 7 · Wow 7 · Fit jury 8 · Business 8 → **38/50**

---

## Idée 9 — **LiveProof** : anti-injection de caméra pour le KYC
*Track 1, touche 2*

**One-liner** : au lieu de détecter le deepfake, on prouve que le flux vidéo vient d'une vraie caméra en temps réel, via un défi physique imprévisible.

**Problème**
- WEF 2026 : des outils de face-swap temps réel menacent le KYC ; attaques par injection (flux injecté entre l'utilisateur et le service) en forte hausse.
- Entrust (via Zyphe) : +40 % d'attaques par injection en 2026, +58 % de selfies deepfake en 2025 ⚠️ ; iProov : +2 665 % de caméras virtuelles ⚠️ (chiffres à vérifier). Une attaque deepfake d'identité toutes les 5 minutes (Entrust 2024).
- Sumsub : fraude deepfake ×11 entre 2024 et 2025 ⚠️.

**Solution** : un challenge-réponse multimodal — l'écran projette une séquence lumineuse/couleur aléatoire que la peau du visage doit refléter avec la bonne latence et cohérence physique ; Claude (multimodal) vérifie la cohérence spatio-temporelle que les pipelines de deepfake injecté ne reproduisent pas en temps réel. On mesure *l'authenticité du canal*, pas l'image.

**Pourquoi maintenant** : le WEF a publié son rapport dédié en 2026 ; la détection « classique » du deepfake décroche face au temps réel.

**Démo (3 min)** : un vrai visage passe le challenge (reflets cohérents). Un deepfake injecté (vidéo pré-enregistrée) échoue car il ne peut pas refléter la séquence imprévisible.

**Stack** : Bedrock (Claude multimodal), WebRTC + accès caméra navigateur, challenge aléatoire, scoring.

**36h vs mock** — Construit : le challenge lumineux, la capture, la vérif de cohérence, le verdict. Mocké : robustesse anti-contournement poussée, intégration KYC réelle.

**Business model** : par vérification (à la Onfido/Sumsub) ou licence. Cibles : fintechs, exchanges crypto, néobanques.

**Concurrents** : iProov (déjà sur la liveness/challenge), Onfido, Sumsub, DuckDuckGoose. **Risque** : iProov fait déjà ça ; différencier par le raisonnement multimodal LLM et le coût.

**Notes** — Impact 7 · Faisabilité 6 · Wow 8 · Fit jury 7 · Business 7 → **35/50**

---

## Idée 10 — **MCPShield** : pare-feu pour serveurs MCP (tool poisoning & rug pull)
*Track 2, touche 1*

**One-liner** : un proxy qui épingle, surveille et neutralise les descriptions d'outils MCP malveillantes avant qu'elles n'atteignent le modèle.

**Problème**
- OWASP MCP Top 10 (2025) ; Invariant Labs a démontré des rug-pulls sur WhatsApp et GitHub MCP.
- ~200 000 serveurs MCP exposés ⚠️ ; Endor Labs : 82 % utilisent des opérations fichier sujettes au path traversal, 67 % exposent des API vulnérables à l'injection de code. CVE-2025-6514 (mcp-remote, CVSS 9.6), cas Postmark (BCC exfiltrant les mails) = premier cas confirmé de supply-chain MCP (OWASP).

**Solution** : un proxy entre client et serveurs MCP qui épingle le hash des descriptions d'outils (détecte les rug-pulls), scanne les instructions cachées, valide les paramètres contre un schéma, et traite toute sortie d'outil comme non fiable (filtrage avant réinjection au modèle). Claude classe les descriptions suspectes.

**Pourquoi maintenant** : explosion des serveurs MCP + CVEs en rafale en 2026. Peu de couches de protection dédiées.

**Démo (3 min)** : un serveur MCP « légitime » fait un rug-pull (change sa description pour exfiltrer). MCPShield détecte le changement de hash, bloque, et montre l'instruction cachée.

**Stack** : Bedrock (Claude), proxy MCP, store de hash, dashboard.

**36h vs mock** — Construit : proxy, épinglage de hash, détection d'instructions cachées, validation de schéma. Mocké : couverture exhaustive des CVEs.

**Business model** : licence entreprise par passerelle MCP. Cibles : entreprises déployant des agents sur MCP.

**Concurrents** : Lakera/Check Point, Invariant Labs, éditeurs de gateways MCP émergents. **Risque** : sujet connu des initiés mais encore niche ; wow moyen pour un jury business.

**Notes** — Impact 7 · Faisabilité 8 · Wow 6 · Fit jury 7 · Business 6 → **34/50**

---

## Idée 11 — **QuantumLens** : inventaire crypto + plan de migration post-quantique piloté par IA
*Track 3, touche 1*

**One-liner** : un agent qui scanne le patrimoine crypto d'une organisation, repère ce qui est « harvest-now-decrypt-later », et génère le plan de migration post-quantique priorisé.

**Problème**
- ANSSI (France Quantum, 16/06/2026) : plus de certification des produits non post-quantiques à partir de 2027 ; produits « quantum-safe » attendus d'ici 2030. Qualification = 12–18 mois.
- Roadmaps : US (dépréciation des algos classiques d'ici 2030, interdiction 2035), UE (migrations à haut risque d'ici 2030), G7 Cyber Expert Group (critique financier 2030–2032) ⚠️.
- HNDL : données bancaires longue durée stockées aujourd'hui, déchiffrées demain.

**Solution** : un agent qui ingère configs, certificats, dépendances et dépôts, identifie les usages crypto vulnérables, estime le risque HNDL (durée de vie de la donnée × sensibilité), et produit un plan de migration crypto-agile priorisé avec échéances ANSSI.

**Pourquoi maintenant** : l'annonce ANSSI 2027 a 4 mois ; les RSSI français découvrent une échéance réglementaire concrète.

**Démo (3 min)** : on pointe QuantumLens sur un dépôt + des certifs, il sort en direct une carte des risques crypto et un plan priorisé daté (2027/2030).

**Stack** : Bedrock (Claude), scanners crypto (open source), générateur de rapport, dashboard.

**36h vs mock** — Construit : scan d'un périmètre réduit, scoring HNDL, plan daté. Mocké : couverture exhaustive des algos et formats.

**Business model** : audit SaaS + conseil. Cibles : banques, assurances, secteur public (fit KPMG).

**Concurrents** : cabinets (KPMG eux-mêmes !), éditeurs PQC (QNu, Evertrust). **Risque** : perçu comme un outil de conseil plus qu'un produit ; wow faible.

**Notes** — Impact 7 · Faisabilité 7 · Wow 5 · Fit jury 7 (KPMG) · Business 7 → **33/50**

---

## Idée 12 — **SkillAudit** : contrôle de confiance pour les « skills » et plugins d'agents
*Track 2, touche 1*

**One-liner** : une passerelle qui audite et met en quarantaine les skills/plugins malveillants avant qu'un agent ne les charge.

**Problème**
- Sherlock : 824 skills malveillants dans ClawHub début 2026, souvent déguisés en outils de trading/automatisation. CrowdStrike a documenté des tentatives de drain de wallet via posts publics (Moltbook).
- Les marketplaces de skills explosent sans contrôle de provenance.

**Solution** : un scanner de skills (statique + comportemental en sandbox) qui note la confiance, détecte les instructions cachées et les capacités excessives, et bloque le chargement des skills risqués. Claude analyse le code et les descriptions.

**Pourquoi maintenant** : l'écosystème de skills (ClawHub et autres) est jeune et déjà empoisonné.

**Démo (3 min)** : un agent veut charger un skill « trading » qui cache un drain de wallet ; SkillAudit le note rouge, montre la capacité cachée, bloque.

**Stack** : Bedrock (Claude), sandbox, scanner, dashboard.

**36h vs mock** — Construit : scan statique + heuristiques + arbitrage LLM, blocage. Mocké : sandbox comportementale complète.

**Business model** : par skill scanné / licence marketplace. Cibles : plateformes d'agents, entreprises.

**Concurrents** : scanners de supply-chain généralistes, équipes sécurité des marketplaces. **Risque** : dépend de l'écosystème de skills (encore émergent).

**Notes** — Impact 6 · Faisabilité 8 · Wow 6 · Fit jury 7 · Business 6 → **33/50**

---

## Idée 13 — **SwarmSOC** : un SOC multi-agents à vitesse machine
*Track 2, touche 3*

**One-liner** : une escouade d'agents Claude qui triage, enquête et contient les incidents en secondes, parce que la fenêtre de patch est négative.

**Problème**
- Google M-Trends 2026 : time-to-exploit moyen −7 jours. CSA : médiane de patch tombée de 32 à ~5 jours. VulnCheck : 28,96 % des KEV exploitées le jour de la publication du CVE ou avant.
- CERT-In impose 12h de containment pour les systèmes critiques, en citant l'accélération IA.

**Solution** : des agents spécialisés (triage, enrichissement, confinement, rapport) orchestrés, qui traitent les alertes bout-en-bout avec validation humaine aux étapes destructrices. Claude raisonne, les actions passent par des runbooks contrôlés.

**Pourquoi maintenant** : la vitesse machine des attaquants rend le SOC humain structurellement en retard *cette année*.

**Démo (3 min)** : une alerte arrive, le swarm enquête, corrèle, propose un confinement, et un humain valide — chrono à l'appui vs process manuel.

**Stack** : Bedrock (Claude + AgentCore multi-agent), faux SIEM, runbooks, dashboard.

**36h vs mock** — Construit : l'orchestration multi-agents sur 1–2 scénarios d'incident. Mocké : intégrations SIEM/EDR réelles.

**Business model** : SaaS SOC augmenté / par siège analyste. Cibles : MSSP, ETI.

**Concurrents** : très encombré — CrowdStrike Charlotte, Microsoft Security Copilot, Dropzone, Simbian. **Risque** : difficile de se démarquer en 36h face aux géants ; faible originalité.

**Notes** — Impact 7 · Faisabilité 6 · Wow 6 · Fit jury 6 · Business 6 → **31/50**

---

## Idée 14 — **GridGhost** : détection d'interférence GNSS (GPS jamming/spoofing) par IA
*Track 3*

**One-liner** : un détecteur qui repère le brouillage et le spoofing GPS en analysant les anomalies de signal, pour la logistique, l'aviation et le maritime.

**Problème**
- Bornholm (Danemark) : 30 cas de jamming/spoofing en 2026 vs 16 en 2025. Lituanie : ×22 de spoofing en un an ⚠️ ; Estonie : 85 % des vols civils subissent des interférences ⚠️. Kaliningrad : rayon jusqu'à 450 km.
- ~978 000 événements de jamming GPS mondiaux au T1 2026 (98 % au Golfe) ⚠️.

**Solution** : un modèle qui ingère les métadonnées GNSS (SNR, écarts de position, incohérences temps/trajectoire) et classe « clair / brouillé / spoofé » en temps réel, avec repli sur navigation inertielle. Claude pour l'explication et la corrélation géopolitique des incidents.

**Pourquoi maintenant** : escalade hybride en Baltique en 2026 (drones, jamming record).

**Démo (3 min)** : on rejoue une trace GPS spoofée (dataset public), GridGhost détecte l'anomalie et alerte avant la dérive.

**Stack** : Bedrock (Claude pour corrélation/explication), modèle d'anomalie, datasets GNSS publics, carte temps réel.

**36h vs mock** — Construit : détection sur dataset rejoué. Mocké : capteur matériel réel.

**Business model** : B2B logistique/aviation/maritime/défense. Cibles : compagnies, ports, assureurs.

**Concurrents** : fournisseurs GNSS résilients (Septentrio, u-blox), défense. **Risque** : hors du cœur « IA/finance » des jurys ; démo moins spectaculaire ; besoin de données.

**Notes** — Impact 6 · Faisabilité 5 · Wow 6 · Fit jury 6 (Bpifrance/souveraineté) · Business 6 → **29/50**

---

## Idée 15 — **RedSim** : simulateur d'arnaque pour entraîner employés et modèles
*Track 2 + 1, touche 3*

**One-liner** : un générateur d'attaques IA réalistes (faux conseiller, deepfake vocal, BEC) pour entraîner les employés et durcir les défenses — en sandbox éthique.

**Problème**
- Vishing : +442 % entre S1 et S2 2024 (CrowdStrike) ; 2e vecteur d'infection initial en 2025 (Mandiant M-Trends, 11 %). Scattered Spider : appel au helpdesk comme porte d'entrée « quasi systématique ».
- FBI IC3 : > 893 M$ de pertes liées à la fraude IA en 2025. Arup : 25,6 M$ via faux appel vidéo.

**Solution** : une plateforme qui simule des campagnes d'ingénierie sociale IA (voix, mail, scénario conseiller) contre les employés d'une organisation *consentante*, mesure qui tombe, et génère une formation ciblée. Claude orchestre les scénarios et le débrief. Strictement opt-in, données internes, pas de vraie exfiltration.

**Pourquoi maintenant** : les deepfakes vocaux rendent les formations anti-phishing classiques obsolètes ; le vishing explose.

**Démo (3 min)** : RedSim lance un faux appel « conseiller » clonant une voix à un volontaire ; on montre le taux d'échec, puis le module de formation généré.

**Stack** : Bedrock (Claude), TTS/voice (clone de voix de test, consenti), mail factice, dashboard de résultats.

**36h vs mock** — Construit : un scénario vishing + un scénario mail + le scoring + le débrief. Mocké : intégration RH, campagnes à grande échelle.

**Business model** : SaaS formation sécurité (par employé/an). Cibles : banques, ETI, secteur public.

**Concurrents** : KnowBe4, Proofpoint, Hoxhunt (phishing surtout mail). **Différenciateur** : vishing + deepfake vocal réaliste. **Risque** : cadrage éthique (consentement, clonage de voix) à verrouiller dans le pitch.

**Notes** — Impact 7 · Faisabilité 7 · Wow 7 · Fit jury 7 · Business 7 → **35/50**

---

## Classement final

| Rang | Idée | Tracks | Total | Point fort |
|---|---|---|---|---|
| 1 | **Seatbelt** | 1+2 | **45** | Hybride parfait, wow max, actu Grok, fit Avalanche+KPMG+GitGuardian |
| 2 | **ProofCall** | 1 | **42** | Problème chiffré énorme (516 M€), jurisprudence 2026, démo choc |
| 3 | **Rootcanary** | 2+1 | **41** | GitGuardian est juré, chiffres frais, faisable à 100 % |
| 4 | **PreCrime** | 1+2 | **40** | Wow fort, actu benchmarks, mais risque éthique + faisabilité |
| 4 | **Mirage** | 2 | **40** | Contrarian (retourner l'injection), fit GitGuardian/MetaLab |
| 6 | DisputeGuard | 1 | 38 | Agentic commerce, timing Visa |
| 7 | AgentPassport | 2 | 36 | Bon problème mais marché saturé/consolidé |
| 8 | CleanRoom | 2 | 35 | Niche claire, démo nette |
| 8 | LiveProof | 1 | 35 | Wow visuel, mais iProov occupe déjà |
| 8 | RedSim | 2+1 | 35 | Démo humaine marquante, risque éthique |
| 11 | MCPShield | 2 | 34 | Solide mais niche pour jury business |
| 12 | QuantumLens | 3 | 33 | Fit KPMG mais faible wow |
| 12 | SkillAudit | 2 | 33 | Dépend d'un écosystème jeune |
| 14 | SwarmSOC | 2 | 31 | Marché écrasé par les géants |
| 15 | GridGhost | 3 | 29 | Hors cœur jury, dépend de données |

## Recommandation

**Visez Seatbelt (idée 1).** C'est la seule qui coche *toutes* les cases du hackathon à la fois :

- **Hybride tracks 1 + 2** : finance/actifs numériques *et* sécurisation de l'IA. Vous pouvez pitcher la même démo aux deux jurys.
- **Fit jury maximal** : Avalanche Team1 (ERC-8004 + x402 déployés sur Avalanche, c'est leur sujet exact), KPMG (gouvernance, moindre privilège des agents), et ça parle à GitGuardian/MetaLab (sécuriser l'IA). Kryptosphère adore la crypto.
- **Actualité imparable** : l'incident Grok/Bankr (mai 2026) est l'histoire parfaite pour ouvrir le pitch — « il y a 5 mois, un tweet en Morse a vidé un wallet d'agent ».
- **Démo spectaculaire** : attaque live (wallet vidé sur l'explorer) → défense live (blocage + raisonnement du juge affiché). C'est exactement le format « attaque live → défense live » que vous visez.
- **Vrai potentiel startup** : le segment agent-security se fait racheter à prix d'or (Lakera, Protect AI, Prompt Security) ; un co-signataire d'intention ouvert et multi-wallet n'existe pas encore.
- **Faisable en 36h** : le cœur (smart account + co-signature + juge à contexte isolé + 5 injections) est atteignable ; le reste se mocke proprement.

**Plan B / combinaison gagnante** : si le jury track 1 vous semble plus « business pur », **ProofCall** (idée 3) a le problème le plus gros et le plus local (516 M€, France, jurisprudence) avec une démo émotionnelle forte. Et si vous voulez séduire spécifiquement GitGuardian, **Rootcanary** (idée 5) est le choix le plus sûr côté faisabilité.

**Le pari que je ferais** : Seatbelt en principal, et garder le mécanisme du **juge à contexte isolé** comme brique conceptuelle réutilisable — c'est votre vraie innovation défendable, applicable au-delà de la crypto (paiements, actions sensibles d'agents en général).

---

### Sources principales
- Grok/Bankr : giskard.ai, oecd.ai (2026-05-04 incident), kucoin.com, support.token.im
- SCONE-bench / EVMbench : theblock.co, openai.com (evmbench), paradigm.xyz, arxiv 2603.04915
- GitGuardian Secrets Sprawl 2026 : gitguardian.com, cpomagazine.com, devops.com
- Faux conseiller France : moneyvox.fr, selectra.info, consultation.avocat.fr, economiematin.fr (Banque de France / OSMP)
- ERC-8004 / x402 Avalanche : erc-8004.quicknode.com, luma.com (Team1 Italy Uni Tour)
- NHI / identités agents : rubrik, KPMG 2026, CSA (labs.cloudsecurityalliance.org), paloaltonetworks.com
- Deception / honeypots : arxiv 2604.18248, tracebit.com, horizon3.ai, acalvio.com
- Slopsquatting : endorlabs.com, labs.cloudsecurityalliance.org, aikido (react-codeshift)
- MCP security : OWASP MCP Top 10, invariant labs, mcp.directory, endorlabs
- Patch window : M-Trends 2026 (Google/Mandiant), labs.cloudsecurityalliance.org, vulncheck
- Vishing / Scattered Spider : crowdstrike (via vendeurs), mandiant M-Trends 2026
- KYC deepfake : reports.weforum.org (2026), infosecurity-magazine.com, entrust/iProov (⚠️ à vérifier)
- Post-quantique : thequantuminsider.com (ANSSI France Quantum 2026), evertrust.io
- GNSS jamming : eurointegration.com.ua (Bornholm), err.ee, hvylya.net (⚠️)
- Agentic commerce : chargebacks911 (financialit.net), smallbiztrends.com (Visa), stellagent.ai
- M&A / funding : softwarestrategiesblog.com, crunchbase, helpnetsecurity.com, Gartner
