# F3 — Frontière de la sécurité financière 2025-2026

> [V] vérifié sur la page citée · [ÀV] à vérifier. Chiffres des sites éditeurs = déclarations commerciales. WebSearch indisponible pour cet agent ; plusieurs pages en 403/404 (ERC-7265, Mastercard Agent Pay, BIS Aurora/Mandala, iProov).

## TL;DR
1. Le commerce agentique a ses protocoles d'autorisation (AP2, ACP, Visa TAP, x402, ERC-8004), mais **la responsabilité en cas de litige n'est écrite nulle part** — AP2 le reconnaît.
2. Arnaques APP : régulation rapide (remboursement obligatoire UK ; accord PSD3/PSR UE le 27/11/2025). Le maillon manquant : **le signal temps réel « le client est manipulé en ce moment »**.
3. Crypto : leçon Bybit = **la signature ne prouve pas l'intention**. Terrain porteur : simulation + vérification d'intention + réponse automatique.
4. DORA appliqué depuis le 17/01/2025 : registre des tiers et classification d'incidents mal outillés.
5. Angle Track 1 recommandé par l'agent : **contrôleur de chaîne d'autorité et d'intention** pour agents financiers (ordre qui descend d'un mandat humain signé et borné).

## 1. Commerce agentique
Il faut prouver l'identité de l'agent, l'autorisation de l'humain, l'identité du marchand, et savoir qui paie en cas d'erreur.
- **Google AP2** [V] : mandats signés chaînés (Verifiable Digital Credentials). *Checkout Mandate* (marchand ; ouvert = contraintes, fermé = panier) et *Payment Mandate* (émetteur/réseau ; ouvert = budget et instruments, fermé = montant lié au panier). Humain présent / absent. v1 = paiements « pull » (cartes) ; virements instantanés et wallets sur la feuille de route. Normalisation à la FIDO Alliance. https://ap2-protocol.org/ · https://github.com/google-agentic-commerce/AP2
- **Visa Trusted Agent Protocol** [V] : signatures spécifiques au marchand et à la finalité, limitées dans le temps, non rejouables. Ne traite ni fraude ni litiges. https://developer.visa.com/capabilities/trusted-agent-protocol/overview
- **Stripe/OpenAI ACP** [V] : Shared Payment Token, identifiants non exposés à l'agent, marchand de référence ; ChatGPT premier implémenteur. Rien sur les litiges. https://www.agenticcommerce.dev/
- **Coinbase x402** [V] : HTTP 402 + paiement en stablecoin. Au 25/08/2026 sur 30 jours : 75,41 M transactions, 24,24 M$, 94 k acheteurs, 22 k vendeurs (≈ 0,32 $/tx : micro-paiements). Aucun modèle de menace ni remboursement décrit. https://www.x402.org/
- **ERC-8004 Trustless Agents** [V, brouillon] : registres identité (NFT par agent, `agentWallet`), réputation (retours signés), validation (score 0-100). Limites reconnues : Sybil, aucune garantie que l'agent fasse ce qu'il annonce. https://eips.ethereum.org/EIPS/eip-8004
- Mastercard Agent Pay, « Know Your Agent » : [ÀV], terme de marché, pas une norme.

**Angles morts** : responsabilité non tranchée (AP2 liste 6 candidats sans répondre) · **le mandat prouve ce que l'humain a signé, pas ce que l'agent a compris** (un agent piégé reste dans un mandat ouvert large) · **aucun protocole ne vérifie la chaîne agent → sous-agent (ASI07)** · réputation Sybil-able.
**Levier sans friction** : mandat court, borné, révocable, quasi invisible ; vérificateur qui rejette tout paiement ne descendant pas d'un mandat valide ; confirmation seulement hors périmètre habituel.

## 2. Fraude APP et arnaques en temps réel
Le client autorise lui-même le paiement : l'authentification forte ne sert à rien.
- **UK PSR** [V] : remboursement obligatoire depuis le 7/10/2024, jusqu'à 85 000 £, coût partagé 50/50 entre banques émettrice et destinataire. Effet : la banque destinataire est incitée à détecter les mules.
- **UE PSD3/PSR** [V] : accord provisoire 27/11/2025 ; remboursement intégral des victimes d'usurpation, prévention obligatoire, vérification du nom du bénéficiaire. Adoption formelle encore en attente fin mai 2026.
- **Verification of Payee** [ÀV] : obligatoire zone euro depuis le 9/10/2025. Vérifie le nom du bénéficiaire, **pas l'intention de l'émetteur** — un compte réel de fraudeur au bon nom passe.
- Starling (IA anti-arnaques, juin 2026) [V partiel] ; signal « appel en cours », Monzo, O2 Daisy [ÀV].
**Angles morts** : pas de standard interbancaire pour le signal d'appel ; partage de données limité (RGPD, secret bancaire) ; les mules changent de banque.
**Levier** : **score de coercition** sur signaux passifs (appel actif pendant l'ouverture de l'appli, navigation hésitante, bénéficiaire nouveau, montant ou heure inhabituels). Friction seulement en zone grise : pause de 10 min + question de contexte, jamais de blocage sec.

## 3. Biométrie comportementale, deepfake KYC, identité numérique
- Attaques par injection de caméra virtuelle : la vivacité sur l'image seule ne suffit plus [ÀV].
- **EUDI Wallet** [V] : 4 grands pilotes, 350+ entités, 26 États ; NOBID teste l'autorisation de paiement, POTENTIAL l'ouverture de compte ; divulgation sélective ; Business Wallets proposés en nov. 2025. https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet-implementation
- Détection de coercition par signaux de stress : surtout recherche ; ambiguë (pressé ≠ manipulé), risques d'équité.
**Levier** : contrôle d'intégrité de session (flux vidéo, appareil, horloge) + identifiant vérifiable.

## 4. Crypto
- **Bybit, 21/02/2025** [V] : ~1,46 Md$ via l'infrastructure compromise de Safe{Wallet} ; Lazarus ; blanchiment en 2 h vers 50 wallets. L'interface montrait une transaction légitime, la signature portait autre chose [ÀV]. https://www.elliptic.co/blog/bybit-hack-largest-in-history
- **Hypernative** [V, éditeur] : simulation indépendante de l'interface, « signature = intention autorisée », pause automatique ; détections 7 min avant un exploit (Numa), 2 min (Venus), drainer 2 h avant sa première victime (Curve). https://www.hypernative.io/
- ERC-7265 (circuit breaker on-chain), Forta, ERC-4337/EIP-7702, address poisoning : [ÀV].
**Angles morts** : contrats évolutifs, supply chain du front-end ; une pause automatique est elle-même un risque (faux positif, cible).
**Levier** : comparateur **intention affichée vs effet simulé** ; aucune friction sur une transaction normale. Colle à Track 1 piste 4 (Fuji + DORA).

## 5. DORA en pratique
- [V] Applicable depuis le 17/01/2025 ; registre d'informations sur gabarits ITS ; désignation des prestataires critiques (rapport ESAs 17/12/2025) ; rapport 2025 sur les incidents majeurs (3/06/2026) ; déclaration ESAs sur l'IA de frontière et le risque TIC (31/07/2026). https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/digital-operational-resilience-act-dora
- [ÀV] Délais : 4 h après classification, 24 h, 72 h, 1 mois. Ce qui coince : qualité du registre (sous-traitance en chaîne), classification dans les premières heures, déclarations multiples (DORA, NIS2, RGPD).
- **Levier** : classificateur automatique d'incident selon les critères DORA alimenté par la télémétrie, brouillon de déclaration pré-rempli et sourcé.

## 6. Pilotes BIS
- **Project Agorá** [V] : 8 banques centrales (dont Banque de France), 40+ institutions ; ~30 transactions sur 17 scénarios (~800 000 CHF), règlement moyen 80 s ; rapport 27/05/2026. https://www.bis.org/about/bisih/topics/fmis/agora.htm
- Aurora (AML en réseau préservant la vie privée), Mandala (conformité programmable) : [ÀV].

## Positionnements Track 1 suggérés
1. **Vérificateur de chaîne d'autorité pour agents payeurs** : un ordre doit descendre d'un mandat humain signé, borné et court (inspiré d'AP2) ; refus sinon ; journal de chaque décision. Ce qu'aucun protocole actuel ne fait sur agent → sous-agent.
2. **Comparateur intention/effet** sur contrat Fuji + pause + déclaration DORA pré-remplie.
3. **Score de coercition à réponse graduée** sur un scénario APP synthétique.
Réponse à « qui est responsable ? » : l'humain signataire dans la limite du mandat ; au-delà, l'opérateur du contrôleur — d'où le journal infalsifiable.
