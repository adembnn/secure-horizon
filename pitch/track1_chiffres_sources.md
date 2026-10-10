# Track 1 — les 4 sous-tracks, chiffres sourcés uniquement

> Périmètre de chaque sous-track : texte exact du guide officiel (`context/notion_guide.md`). Chiffres : extraits de `research/tracks/T1_P*_v2.md`, chaque ligne a sa source. [P] = source primaire (régulateur, police, rapport officiel). [S] = presse ou agrégateur. [V] = chiffre d'un vendeur. Ne mettre en slide que [P] ou [S] recoupé.

---

## 1. Analyste AML/CFT : réseaux de mules

**Guide :** réseaux de mules, ML sur graphe, score de risque explicable, réduction mesurée des faux positifs. (Detect, Respond)

| Chiffre | Valeur | Source |
|---|---|---|
| Déclarations de soupçon reçues par Tracfin en 2025 | 278 484 (+32 % en un an, ×6 depuis 2015) | [P] Tracfin, rapport 2025 |
| Virements suspects reçus par 13 établissements français | 457 M€ (2022) → 661 M€ (2023), +45 % | [P] ACPR, rapport « comptes rebonds », juil. 2025 |
| Délai moyen entre la 1re demande de rappel et la déclaration | 29 jours (145 jours dans un établissement) | [P] ACPR 2025 |
| Fonds suspects analysés qui partent à l'étranger | 60 % ; seulement 14 % n'ont pas bougé ; 9 % restitués | [P] ACPR 2025 |
| Argent passé sur des comptes clôturés sans être bloqué | 982 M€ | [P] ACPR 2025 |
| Comptes clôturés après rappel sans déclaration à Tracfin | 36 % | [P] ACPR 2025 |
| Comptes de mules qui font leur 1re opération dans les 15 premiers jours | 44 % | [P] ACPR 2025 |
| Comptes de mules suspectés fermés au Royaume-Uni | 238 396 en 2025 ; +164,6 % chez les établissements de monnaie électronique | [P] FCA, 23 sept. 2026 |
| Où l'argent sort | Au 2e à 5e compte de la chaîne, pic au 2e | [P] FCA 2026 |
| Faux positifs des logiciels de surveillance | 90 à 95 % | [S] PwC ~2018, jamais remesuré |
| Gain mesuré avec l'analyse de graphe | Jusqu'à 3× plus de réseaux détectés, jusqu'à −80 % de faux positifs | [P] BIS Project Aurora, 2023, données synthétiques |
| Amendes | Monzo 21,1 M£ (FCA, 2025, surveillance des transactions) ; BRED 2,5 M€ (ACPR, 2024) | [P]/[S] |

**Nouveau en France :** le FNC-RF, fichier national des IBAN suspects géré par la Banque de France, est en service depuis le 7 mai 2026 [P].

---

## 2. SOC anti-fraude face à l'IA générative

**Guide :** prise de contrôle de compte, fraude au président par voix clonée, faux KYC ; réponse graduée (authentification renforcée, mise en attente, gel, alerte client). (Detect, Respond)

| Chiffre | Valeur | Source |
|---|---|---|
| Fraude aux paiements, Espace économique européen, 2024 | 4,2 Md€, dont 2,2 Md€ sur virements ; **85 % des pertes sur virement payées par les clients** | [P] EBA-BCE, déc. 2025 |
| Fraude par manipulation, France 2025 | 516 M€ (+34 %), plus de 40 % de la fraude totale | [S] OSMP 2025 via MoneyVox |
| Faux conseiller bancaire, France | 376 M€ | [S] OSMP |
| Fraude sur virement en ligne, France | +182 % alors que l'usage n'augmente que de 13 % ; 1 457 € par cas | [S] OSMP 2025 |
| Fraude par manipulation, Royaume-Uni 2025 | 576,4 M£ (+19 %), 248 070 cas ; 61 % remboursés | [S] UK Finance 2026 |
| Fraude au président (BEC), États-Unis 2025 | ~3,05 Md$, ~123 k$ par plainte | [S] FBI IC3 via presse, PDF original à vérifier |
| Fideuram (Italie), fév. 2026 | ~95 M€ virés sur faux message du PDG et appel d'un faux avocat ; ~36 à 40 M€ perdus | [S] Reuters, OCDE AIM ; voix clonée non confirmée officiellement |
| Arup (Hong Kong), 2024 | ~25,6 M$ après une visio avec un faux DAF et de faux collègues | [S] |
| Singapour, mars 2025 | 499 k$ virés après un faux Zoom avec le PDG, retenus en 2 jours | [P] police de Singapour |
| Humains face aux voix clonées | 58 % des voix clonées jugées humaines | [S] PLOS ONE 2025 |
| Usurpation de numéro de téléphone signalée à l'Arcep | 531 (2023) → 8 500 (2024) → plus de 19 000 (2025) | [S] |
| Faux KYC | Tentatives « sophistiquées » de 10 % à 28 % ; caméras virtuelles +2 665 % | [V] Sumsub, iProov |
| Prise de contrôle de compte en Europe | **Aucun chiffre fiable de pertes trouvé** | — |

**Nouveau :** le PSR européen va rendre la banque responsable quand un fraudeur se fait passer pour elle (application vers fin 2027 ou 2028) [S]. Visa a racheté BioCatch pour 2,4 Md$ en août 2026 [S].

---

## 3. Supervision des agents IA financiers

**Guide :** journal de chaque action d'agent avec sa chaîne d'autorité, détection des transactions hors périmètre, jetons d'autorisation courts et révocables, kill switch automatique, validation humaine des actions sensibles. (Identify, Detect, Respond) Scénario écrit dans le guide : un agent de recherche piégé par un document ordonne à un agent financier d'exécuter une transaction (ASI03, ASI07).

**Qui utilise déjà des agents sur de l'argent :**

| Fait | Valeur | Source |
|---|---|---|
| Ramp Agents for AP | En production depuis oct. 2025 ; 90 000 recommandations d'approbation, 90 % acceptées | [V] Ramp |
| Brex | ~70 % des dépenses traitées entièrement par automatisation | [V] Brex |
| Coinbase Agentic Wallets | ~69 000 agents actifs, ~50 M$ de volume (avril 2026) | [V] Coinbase |
| Paiements x402 qui viennent vraiment d'agents | **0,6 à 7,5 %** seulement | [P] TRM Labs, 9 sept. 2026 |
| Projets d'IA agentique annulés d'ici fin 2027 faute de contrôle des risques | Plus de 40 % | [S] Gartner |

**Incidents réels :**

| Date | Cas | Montant | Source |
|---|---|---|---|
| Mai 2026 | Grok × Bankr : instruction cachée en morse, le wallet de l'agent transfère des tokens | ~150 à 200 k$ (~80 % rendus) | [S] OCDE AIM, Cointelegraph |
| Fév. 2026 | Lobstar Wilde : un agent envoie des tokens par erreur, sans attaquant | ~250 à 450 k$ | [S] |
| Mars 2025 | AIXBT : console de l'agent compromise | 55,5 ETH | [S] The Block |
| Juil. 2026 | Zscaler : 26 modèles testés comme agents payeurs sur un site piégé | 4 ont payé | [P] Zscaler |
| 2026 | Forcepoint : instruction invisible dans un e-mail | Le montant résumé passe de 8 750 € à 46 200 €, 10 essais sur 10 | [S] Dark Reading |

**Honnêteté :** aucun vol réel d'un agent comptable par facture piégée n'est documenté. Les seules pertes réelles concernent des agents crypto. Côté entreprises, la fraude existe déjà sans IA : BEC ~3 Md$ (FBI 2025), 76 % des entreprises américaines touchées par une fraude aux paiements en 2025 [P] AFP.

**Assureurs :** AIG, Great American et WR Berkley demandent à exclure l'IA de leurs polices (FT, nov. 2025) [S] ; avenants d'exclusion ISO en vigueur au 1er janv. 2026 [S]. KPMG est listé comme certifié AIUC-1, la norme d'assurance des agents IA [P] aiuc-1.com.

---

## 4. DeFi + DORA

**Guide :** monitoring on-chain d'un contrat déployé (ex. testnet Avalanche Fuji), playbook (pause du contrat, alertes, traçage des fonds), classification automatique selon les critères DORA, déclaration pré-remplie, cartographie des prestataires tiers critiques. (Detect, Respond, Recover)

**Pertes crypto :**

| Chiffre | Valeur | Source |
|---|---|---|
| T3 2026 | 1,26 Md$ volés sur 247 incidents ; septembre seul ~769 M$, dont 273 M$ gelés ou rendus | [S] CertiK via Cointelegraph |
| H1 2026 | Part des vols dus à des clés ou accès compromis, pas à des bugs de code | 74 % | [V] Blockaid |
| Bitget, 24 sept. 2026 | ~387,5 M$ via une faille dans deux appliances de sécurité tierces, AVAX volés | [S] BleepingComputer, Mandiant |
| Drift, avril 2026 | 285 M$ ; 31 retraits en 12 minutes | [S] |
| KelpDAO, avril 2026 | 292 M$ ; un seul vérificateur cross-chain | [S] |
| Tectonic, août 2026 | ~75 M$ sortis en **une seule transaction** | [P] TRM Labs |
| Parallel, mai 2026 | Pause automatique en quelques blocs, 1,52 M$ sauvés, 0 perdu | [V] Hypernative |
| Assurance DeFi | Nexus Mutual : 18,5 M$ payés depuis 2019 au total | [V] |

**DORA :**

| Chiffre | Valeur | Source |
|---|---|---|
| Incidents majeurs déclarés dans l'UE en 2025 | 3 383 ; ~29 % causés par un tiers ; ~10 % cyber | [P] ESAs, 3 juin 2026 |
| Incidents majeurs déclarés à l'AMF en 2025 | 33, plus de 80 % causés par un prestataire (le « 2 chez des prestataires crypto » n'est pas confirmé) | [S] AMF via Le Monde du Droit |
| Qualité des déclarations | Délais « rarement respectés », erreurs de champs et de classification | [S] retour ACPR-AMF via Forvis Mazars |
| Délais imposés | 4 h après classification (24 h max), 72 h, 1 mois | [P] RTS 2025/301 |
| Prestataires crypto agréés MiCA dans l'UE | ~216 à 321 selon la date du registre (juin-juil. 2026) | [S] KPMG, ESMA |
| Sanctions DORA | Aucune confirmée par une source primaire | — |
| Coût d'une déclaration | Aucun chiffre public | — |

**Avalanche :** Hexagate (Chainalysis) est gratuit pour les projets Avalanche depuis déc. 2025, et Hypernative surveille Avalanche [S]. Aucun outil ne surveille les L1 Avalanche ni la messagerie entre L1 (ICM).
