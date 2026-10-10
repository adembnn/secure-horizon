# K. Délais et mécanismes des drainers : la réponse après coup a-t-elle de la valeur ? (Claude-Titouan, 10/10/2026 soir)

Statut : synthèse des 4 agents K1 à K4 (dossier K_drainers/). Étiquettes [P] primaire, [S] presse, [V] vendeur. Échantillons petits et biaisés : ne rien extrapoler. Réponse à la mission de D-006 et de MSG-022.

## 1. Réponse courte à la question d'Adem
Les données publiques montrent trois régimes, pas un seul. (a) Retrait immédiat (même transaction ou même bloc) : seule la prévention en amont compte. (b) Retrait en quelques heures : une réponse automatique après coup peut avoir de la valeur. (c) Retrait des mois plus tard sur des approbations dormantes : une expiration ou une révocation périodique a de la valeur. Il faut donc les deux, avec la prévention comme première ligne. Aucun de ces trois régimes n'a de fréquence mesurée sur le marché : l'échantillon est de 6 cas.

## 2. Délai entre l'autorisation et le retrait (K1, n = 6, biaisé)
- Même transaction : 2 cas EIP-7702 d'août 2025 (1,54 M$ et 1,0 M$), délai nul déduit du mécanisme décrit, sans hash publié.
- Heures : 55 M DAI, 20 août 2024, environ 5 h 20 entre la signature et le vol (hashs publiés par MetaSleuth [V]).
- Jours ou mois : 408 jours (329 743 $, mars 2025), 458 jours (908 551 $, août 2025), 623 jours (78 187 $, sept. 2025), chiffres Scam Sniffer relayés par la presse [S].
- Contre-cas : stETH vidé en 5 min 24 s.
- Limite : on publie surtout les délais spectaculaires. Aucun délai chiffré trouvé chez Cyvers, Beosin, Chainalysis, Check Point, Group-IB ni pour les kits Monkey, Angel, Pink. Méthode pour combler : relever sur l'explorateur l'écart entre l'événement Approval et le premier transferFrom sur les 11 cas Scam Sniffer 2025.

## 3. Part de chaque mécanisme (K2)
Aucun éditeur ne ventile toutes les pertes ; 65 à 73 % ne sont pas ventilées. Scam Sniffer ventile seulement les gros cas (plus de 1 M$).
- Gros cas 2024 (30 cas, 171 M$) : permit 56,7 %, changement de propriétaire 31,9 % (un seul cas de 55 M$), transfert 4,5 %, increaseAllowance 3,5 %.
- Gros cas 2025 (11 cas, 22,98 M$) : permit et Permit2 38 %, approve 24,5 %, transfert 21 %, EIP-7702 11 % (2,54 M$), setApprovalForAll 5 %.
- Part hors chaîne (signature que le garde d'un compte ne voit pas) : au moins 38 % des gros cas 2025, soit au moins environ 10,4 % du total 2025 (83,85 M$). Extrapoler est une hypothèse.
- 2026 : seul janvier est disponible (6,27 M$, 4 741 victimes).

## 4. Approbations dormantes (K3, 14 cas)
- 908 551 $ vidés 458 jours après la signature [S] ; BSCex/LaunchZone 2023, 7,8 M$, approbation de plus de 700 jours : cinq semaines après, 7 860 adresses avaient révoqué et 75 564 restaient exposées [S] ; contrats abandonnés vidés pendant des années (Dolomite, contrat de 2019, 1,8 M$).
- Les gros piratages de routeurs (LI.FI, Socket, Seneca, Transit Swap) ont visé des approbations illimitées, mais l'âge n'est pas publié.
- Prévalence : une seule étude (arXiv 2207.01790, données jusqu'en 2021) : 60 % d'approbations illimitées. Rien de plus récent trouvé.
- Verdict honnête : une expiration ou révocation périodique est plausible (une expiration à 180 jours aurait couvert les 3 premiers cas) mais non démontrée par des chiffres publics. Le "140 M$ évités" de Revoke.cash est un chiffre vendeur.

## 5. Ce qu'un compte intelligent peut bloquer en amont (K4, partiellement inférence)
- Un Guard Safe reçoit cible, données et opération de chaque transaction : il peut refuser une approbation émise par le compte selon une liste de spenders, à condition de décoder les envois groupés. Les appels par module passent par un garde de module séparé.
- Signatures hors chaîne : Permit2 et Seaport acceptent la validation ERC-1271 ; le gestionnaire par défaut d'un Safe ne filtre rien ; je n'ai trouvé aucun gestionnaire filtrant (inférence : à construire). USDC v2.2 a une surcharge pour comptes à contrat ; DAI et UNI n'acceptent que la signature classique, donc un compte à contrat ne peut pas les signer (inférence), ce qui le protège de ces permits par construction.
- Pas de standard de délai d'activation pour un nouveau spender : seulement des durées d'expiration (Permit2 uint48, lockdown, invalidateNonces ; spend permissions Coinbase ; ERC-7715 en brouillon). Un délai d'activation est à construire.
- Hors de portée d'un compte intelligent : la signature d'un propriétaire trompé, les clés EOA ou 7702 volées, un Safe de seuil 1, les signatures hors chaîne invisibles au Guard, les approbations antérieures à l'installation, le transferFrom lui-même.

## 6. Proposition de conception tirée des faits (à discuter, non validée)
1. **En amont** : le Guard refuse toute approbation vers un spender hors liste et traite enableModule ; un gestionnaire ERC-1271 filtrant refuse les signatures Permit2, Seaport et permit vers des spenders non listés ; nouveau spender = délai d'activation plutôt que refus sec.
2. **Hygiène** : expiration ou révocation périodique des approbations de plus de N jours (N à choisir, 180 jours cité à titre d'exemple non justifié).
3. **Après coup** : pour les cas qui ne sont pas instantanés (retraits plafonnés, seed volée, balayeurs lents), resserrer, révoquer, déplacer vers le coffre à délai, alerter.
4. **À mesurer** : l'écart Approval puis transferFrom sur les 11 cas Scam Sniffer 2025, pour donner une distribution réelle des délais.
