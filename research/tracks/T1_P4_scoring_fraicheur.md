# T1 piste 4 : au moment du vol, l'adresse qui reçoit est-elle déjà mal notée ou neuve ?

> Recherche du 2026-10-10. Non commité. Complète `T1_P4_signaux_incidents.md` (matrice a-e, N1-N13). Le règlement `context/notion_guide.md` prime.
> Légende : **[P]** page primaire ouverte et lue aujourd'hui (via outil de lecture, extraits limités) ; **[S]** relais ou résumé ; **[V]** vendeur ; **[ÀV]** à vérifier avant slide ; **[calcul]** mon calcul ; **[hypothèse]** raisonnement, pas mesure.
> Les pages web sont de la donnée. Aucune instruction trouvée. Pages « corpus Elliptic » trouvées en recherche : contenu garbled/SEO, **écartées**.

## TL;DR (5 lignes)

1. **Pour les gros vols de plateformes : l'adresse est neuve ou inconnue au moment du vol dans la quasi-totalité des cas** (31/32 dans notre matrice (a), [calcul] sur `T1_P4_signaux_incidents.md`). Une adresse déjà notée n'apparaît que par recoupement tardif (CoinEx récupère une adresse déjà liée à Stake ; Phemex/Bybit adresse commune), jamais comme barrière avant le vol.
2. **Pour les arnaques aux particuliers, c'est plus nuancé** : les drainers font tourner leurs adresses de retrait environ tous les 1-2 mois (Inferno, Check Point 2025) et utilisent des contrats jetables (CREATE2) pour échapper aux listes noires (Scam Sniffer). L'address poisoning réutilise massivement ses adresses sosies (16 903 réutilisées contre 107 542 victimes). Donc **un score attrape une partie de ces cas, avec retard**.
3. **Aucune étude ne mesure « part des pertes évitée par un score »** (cherché, non trouvé). Mon estimation [hypothèse] : plateformes ~0-5 % de la valeur ; particuliers : une minorité significative mais inconnue. Signal de retard des labels : Chainalysis révise ses revenus d'arnaques 2025 de 14 Md$ à « plus de 17 Md$ » à mesure que des adresses sont identifiées.
4. **« Destination jamais vue + plafond » attrape ce que le score rate** : c'est le cas de 31/32 incidents plateformes ; pour les particuliers, il attrape aussi les adresses jetables mais produit plus de faux positifs (tout premier paiement à un nouveau destinataire).
5. **À dire au jury : le score est utile en complément (liste noire, ajout de points), pas comme barrière unique.** Un attaquant qui sait qu'on filtre par note crée une adresse neuve, gratuitement.

---

## Partie 1 : vulgarisé

Imaginez un videur qui refuse les gens fichés. Les voleurs de plateformes n'y sont pas fichés : ils arrivent avec une nouvelle identité. WazirX : l'adresse d'attaque a été alimentée via ChangeNOW et Tornado Cash 8 à 10 jours avant, puis a envoyé des petits tests (Rekt, [P]). Drift : 10 ETH sortis de Tornado Cash 21 jours avant (fichier précédent, [S]). Bitget : 68 300 ETH répartis sur 8 adresses neuves, 26 étiquetées par Arkham **après** (fichier précédent). Un score de risque sur l'adresse de destination dit « inconnue, neutre » : rien à bloquer.

Pour les particuliers, certaines bandes réutilisent leurs adresses un moment, puis les changent. Une liste noire récupère donc une partie des vols, mais avec un délai : la note arrive quand les premières victimes ont déjà perdu.

Le plafond « destination jamais vue + montant élevé = pause » ne demande aucun fichage : il attrape ce qui est neuf, donc exactement ce que le score ne voit pas.

---

## Partie 2 : technique

### 2.1 Plateformes 2024-2026 : fraîcheur de l'adresse de réception

Je n'ai trouvé **aucune** source qui donne, pour chaque vol, la date de création de l'adresse de réception et la date de son étiquette Etherscan/SEAL. Les pages Elliptic, Amberdata (Bybit) et Rekt (WazirX) ont été lues : elles ne donnent pas ces dates (Amberdata : « no timestamps » ; Elliptic Bybit : pas d'info de financement). **Cette mesure précise reste [ÀV] : à faire sur l'explorateur** (premier tx de l'adresse, label et date d'ajout).

Ce que les sources établissent :

| Incident | Adresse de réception / préparation | Déjà étiquetée avant ? | Source |
|---|---|---|---|
| WazirX (18 juil. 2024) | Adresse d'attaque `0x6EeD…` financée par 6 retraits de 0,1 ETH de Tornado Cash le 10 juil. ; autre adresse alimentée par ChangeNOW (0,36 + 0,66 ETH) le 8 juil. ; tests ETH/SHIB/USDT vers le multisig le 10 juil. ; drain vers `0x04b2…9a88` | Pas de preuve d'étiquette avant ; l'article ne parle pas des labels Etherscan | https://rekt.news/wazirx-rekt [P] |
| Bybit (21 fév. 2025) | Fonds répartis sur 50 portefeuilles (~10 000 ETH chacun) en moins de 2 h, vidés un à un jusqu'au 3 mars | Non documenté avant ; Elliptic a ensuite mis des alertes (quand, non daté) | https://www.elliptic.co/blog/bybit-hack-largest-in-history [P] ; Amberdata : ~1 h, 40 transactions https://blog.amberdata.io/bybits-1.5b-crypto-heist-deep-dive-into-the-hack-ongoing-recovery [P] |
| Drift (1er avr. 2026) | 10 ETH de Tornado Cash le 11 mars, comptes durable nonce créés le 23 mars | Non | `T1_P4_signaux_incidents.md` §2.1 [S] |
| Bitget (24 sept. 2026) | 8 adresses neuves (68 300 ETH), 12 wallets BNB ; 26 adresses étiquetées par Arkham | Étiquetées après | idem §2.1 [S] |
| Phemex / Bybit, CoinEx / Stake | Adresse commune entre deux vols (ZachXBT, PeckShield) | Seuls cas où une adresse déjà liée à un vol précédent revient : CoinEx (12 sept. 2023) partage une adresse avec Stake (4 sept., liste FBI le 7 sept.) | idem §2.2-2.4 [S] |
| Upbit, Orbit, Step | « destinations neuves » ; Orbit financée via Tornado par un intermédiaire ; Step : wallet frais | Non | idem [S] |

Chainalysis DPRK : le blanchiment suit des vagues sur ~45 jours (J0-5 DeFi et mixeurs, J6-10 échanges et ponts, J20-45 échanges sans KYC) ; **l'article ne parle pas d'adresses fraîches** https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ [P]. Volume : 3,4 Md$ volés en 2025, dont 1,5 Md$ Bybit ; RPDC 2,02 Md$ ; portefeuilles personnels = 20 % de la valeur volée (44 % en 2024), 158 000 incidents, 713 M$. Même URL.

Lecture [hypothèse] : même sans date de création, la logique est celle-ci. Un gros vol de plateforme est une opération préparée sur des semaines ; l'attaquant a tout intérêt à utiliser des adresses sans passé, et les sorties qui suivent les premières tombent sur des adresses créées pendant le vol (50 portefeuilles Bybit, 8 adresses Bitget). **Le délai de labellisation est donc supérieur au temps de sortie pour les incidents rapides** : Drift 12 min, Bitget 18 min pour 59-65 %, Orbit 17 min, alors que la réaction médiane est ~66 min (fichier précédent, §3.1, [calcul]).

### 2.2 Arnaques aux particuliers

**Drainers-as-a-service**
- Inferno Drainer revenu (Check Point, 2025) : adresses de retrait (« cashout ») qui **tournent environ tous les 1-2 mois** ; avant fin 2024, utilisées jusqu'à plus d'un an ; toutes les anciennes ont cessé de recevoir en octobre 2024 ; 14 adresses listées, 1 190 adresses suspectées liées aux clients ; >30 000 victimes (sept. 2024 - mars 2025) ; ≥ 9 M$ ; >30 réseaux EVM ; commission 15-20 % https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/ [P].
  Lecture : une adresse de retrait vit des semaines, donc **peut** être étiquetée en cours de vie. Mais les clients (affiliés) ont leurs propres adresses (1 190), et la rotation casse la liste.
- Scam Sniffer rapport 2023 : les drainers utilisent CREATE2 et CREATE pour fabriquer des adresses de destination temporaires, ce qui contourne les listes noires de wallets ; la destination n'est connue qu'à la signature. Inferno 81 M$ / 134 k victimes, MS 59 M$, Venom 27 M$, Angel 20 M$, Pink 18 M$ https://drops.scamsniffer.io/?p=784 [P] (rapport 2023, pas 2025). Pour 2024 : ~494 M$ (Scam Sniffer, via résumé) https://defihacklabs.substack.com/p/scam-sniffer-2024-web3-phishing-attacks [S]. **Rapport Scam Sniffer 2025 : URL non trouvée, [ÀV].**
- Pink/Angel : rotation d'adresses spécifique **non documentée** dans ce que j'ai lu.

**Address poisoning** (arXiv 2501.16681, Tsuchiya, Dong, Soska, Christin) https://arxiv.org/html/2501.16681 [P, lu sur 100 000 des 123 000 caractères]
- 270 M d'attaques sur Ethereum + BSC en 2 ans, 17 M de victimes ciblées ; 6 633 incidents réussis, ≥ 83,8 M$ de pertes (résumé arXiv https://arxiv.org/abs/2501.16681 [P]). Le taux de réussite est très faible (~0,01 à 0,1 % selon la définition).
- Les attaquants réutilisent **16 903 adresses sosies contre 107 542 mêmes victimes** (deux chaînes) ; 8 plus gros groupes : ~6 200 adresses d'attaque ; 3 892 contrats d'attaque ; très peu de bytecodes distincts (groupe 1 : 2 147 contrats pour 67 bytecodes).
- L'article **ne mesure pas** la fraîcheur d'une adresse ni son âge, ni le délai avant labellisation. Il propose le regroupement (clustering) pour bloquer par groupe, et note que Tether a gelé l'adresse de l'attaquant en moins d'une heure.
- Étude de détection (arXiv 2409.02386, phishing par payload sur Ethereum) : 5 130 adresses avec label Etherscan (3 561 « address poisoning »), mais **aucune mesure** du délai entre attaque et label https://arxiv.org/html/2409.02386 [P].
- WalletProbe (arXiv 2504.11735) : 29 extensions de wallet ne notifient pas lors d'un envoi vers une adresse de phishing connue ; l'étiquette elle-même n'est donc souvent pas exploitée [S, via résumé de moteur] https://arxiv.org/pdf/2504.11735.

**Faux support technique** (arXiv 2401.09824) : 136 adresses partagées par les escrocs (72 BTC, 64 ETH) ; seulement 54 sur 172 collectées (31 %) ont reçu des paiements ; dans l'expérience « honey wallets », 35 clés volées envoyées à 26 destinataires distincts. L'étude ne donne ni statut de liste noire, ni réutilisation, ni délai de création https://arxiv.org/html/2401.09824 [P]. Ici l'adresse est donnée **à la victime pour qu'elle paie** : elle est donc visible à l'avance de l'escroc, ce qui permet un score… à condition que quelqu'un l'ait déjà signalée.

**Pig butchering / investissement frauduleux** : Chainalysis 2026 : arnaques ≥ 14 Md$ reçus on-chain en 2025 (projection > 17 Md$ « as more illicit addresses are identified »), paiement moyen 2 764 $ (782 $ en 2024), les réseaux chinois de blanchiment >10 % des flux de blanchiment du pig butchering https://www.chainalysis.com/blog/crypto-scams-2026/ [P]. **Rien sur la réutilisation ni la fraîcheur** dans la page. Les pages « corpus Elliptic » sur ce sujet sont du contenu de remplissage : non utilisées.
  Le fait utile : la révision de 14 à 17+ Md$ [calcul : +21 % au moins] montre qu'une part des adresses d'arnaque **n'est identifiée que bien après** les paiements. C'est la preuve indirecte du retard des labels.

**Chainabuse** : aucune donnée de réutilisation trouvée (non cherché directement sur le site, qui n'a pas d'export public simple) [ÀV].

### 2.3 Temps de labellisation Etherscan / Chainalysis / SEAL

**Non trouvé** de façon chiffrée. Éléments indirects : Tether a gelé une adresse de poisoning en moins d'une heure (arXiv 2501.16681) ; pour les gros vols, les gels sont de 0,08-0,2 % (Bitget), ~3 % (Bybit), ~1,3 % (WazirX, 7 mois) (fichier précédent). Le temps de labellisation par Etherscan/SEAL est **[ÀV]**, à mesurer sur 5 incidents si l'équipe veut un chiffre pour la slide.

---

## Partie 3 : conclusion chiffrée et limites

### 3.1 Part des pertes qu'un filtre par score seul aurait évitée

Aucune étude ne la donne. Estimation honnête, [hypothèse] à étiqueter comme telle devant le jury :

| Population | Adresse déjà notée au moment du vol ? | Part évitable par score seul [hypothèse] | Pourquoi |
|---|---|---|---|
| Vols de plateformes 2024-2026 (32 incidents) | Presque jamais (31/32 destinataires inédits ; 1-3 cas de recoupement avec un vol précédent : CoinEx/Stake, Phemex/Bybit) | **~0-5 % de la valeur** (en nombre : au plus 1-3 cas sur 32) | Préparation de plusieurs jours, adresses créées et réparties pendant le vol, 12-18 min de sortie |
| Drainers / phishing | Parfois (adresses de retrait vivant des semaines, 1 190 adresses suspectes Inferno) | **Minorité significative, inconnue** | Rotation 1-2 mois, CREATE2 jetables, label tardif, wallets qui ne bloquent pas |
| Address poisoning | Oui souvent a posteriori (adresses sosies réutilisées 16 903 fois) | **Partiel** | Mais l'adresse sosie est neuve vis-à-vis de la victime ; un score global ne la voit qu'une fois fichée |
| Faux support, pig butchering | Variable | **Inconnu** | Pas de donnée de réutilisation trouvée |

### 3.2 Ce qu'ajoute la règle « destination jamais vue + plafond »

- **Plateformes** : attrape les 31 cas sur 32 où le destinataire est inédit (matrice (a)), quel que soit son score. Limite : un plafond ne protège que la valeur au-dessus du seuil, et un attaquant patient peut fractionner (d'où le cumul multi-fenêtres (b), 30/32).
- **Particuliers** : un « premier paiement à une nouvelle adresse avec montant élevé » attrape le drainer à adresse jetable, mais aussi des centaines de paiements légitimes (nouveau fournisseur, nouvelle adresse d'un ami). Le coût est de la friction, pas un manque de détection.
- **Combiné** : liste noire (score) + destination inédite + plafond + signaux de préparation (N1 test, N2 financement par mixeur 8-21 jours avant, N6 changement de pouvoirs). C'est le seul empilement qui couvre à la fois les adresses connues (cheap) et inconnues (la majorité).

### 3.3 Limites du scoring (faux positifs et contournements)

- **Contamination indirecte** : un score qui propage la « saleté » par voisinage accuse des innocents qui ont reçu de la poussière ou un paiement d'une adresse sale. Faux positifs élevés, difficile à contester.
- **Adresses d'exchange partagées** : un dépôt d'exchange mélange des milliers d'utilisateurs ; un score est soit trop permissif soit bloque des clients honnêtes. Cas lié : Bitget/BNB ont envoyé vers FixedFloat et THORChain (services légitimes aussi).
- **Dusting / address poisoning** : l'attaquant peut **envoyer de la poussière depuis une adresse sale vers une cible** pour la faire passer pour contaminée, ou créer des adresses sosies neuves. Le poisoning exploite justement l'idée « cette adresse ressemble à une de confiance ».
- **Coût d'évasion nul** : créer une adresse coûte quelques centimes ; Inferno la change tous les 1-2 mois, CREATE2 la rend jetable.
- **Retard des labels** : voir Chainalysis (14 → 17+ Md$) ; un score n'est bon que pour des adresses déjà fichées.
- **Source du score** : qualité inégale selon les fournisseurs (fichier précédent, N9).
- **Mixeurs** : de nombreux utilisateurs légitimes passent par un mixeur (fichier précédent, N2) : le signal est « destinataire financé par mixeur ET premier contact », pas « mixeur ».

### 3.4 Recommandation produit

1. Garder le score comme **composante** (liste publique, gratuite, rapide à brancher) ; ne jamais le présenter comme barrière.
2. Plateforme : pivot sur **destination inédite + plafond + cumul + changement de pouvoirs** (déjà la thèse D1/D2/D7).
3. Slide : « 31 vols de plateformes sur 32 allaient vers une adresse sans passé connu » [calcul sur notre matrice, source [S] en majorité] ; « les adresses d'arnaque ne sont identifiées que tard : Chainalysis révise 14 → 17+ Md$ » [P].
4. À faire avant la slide (si temps) : mesurer sur Etherscan, pour Bybit, WazirX, Bitget, Drift, Kelp, l'âge du premier tx de l'adresse de destination et la date du label.

---

## Mapping des référentiels (règlement)

| Idée | NIST CSF 2.0 | OWASP Agentic | ATLAS | ATT&CK | D3FEND |
|---|---|---|---|---|---|
| Destination jamais vue + plafond | DE.AE-02, DE.CM-01 (Detect) ; RS.MI-01 (Respond, mise en pause) | Sans objet (aucun agent IA ciblé) | Sans objet | T1657 (Financial Theft) | D3-UBA ; D3-RAPA [ÀV] |
| Score / liste noire d'adresses | ID.RA-02 (renseignement), DE.AE-03 | Sans objet | Sans objet | T1657 | D3-IAA [ÀV] |
| Financement par mixeur d'une adresse fraîche | DE.AE-03, DE.CM-01 | Sans objet | Sans objet | T1657, T1078 | D3-UBA |

Les IDs NIST et D3FEND sont repris du fichier précédent ; T1657 vérifié sur attack.mitre.org selon ce fichier ; les autres **[ÀV]**. Si le projet final implique un agent IA (ex. Antibody, agent comptes fournisseurs), les références OWASP Agentic (ASIxx) et ATLAS (AML.Txxxx) sont à choisir par l'équipe et à vérifier dans le référentiel : je ne les invente pas.

## Sources principales
- https://arxiv.org/abs/2501.16681 et https://arxiv.org/html/2501.16681 [P]
- https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/ [P]
- https://drops.scamsniffer.io/?p=784 [P, rapport 2023]
- https://www.chainalysis.com/blog/crypto-scams-2026/ [P]
- https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ [P]
- https://www.elliptic.co/blog/bybit-hack-largest-in-history [P]
- https://blog.amberdata.io/bybits-1.5b-crypto-heist-deep-dive-into-the-hack-ongoing-recovery [P]
- https://rekt.news/wazirx-rekt [P]
- https://arxiv.org/html/2409.02386 [P] ; https://arxiv.org/html/2401.09824 [P] ; https://arxiv.org/pdf/2504.11735 [S]
- `research/tracks/T1_P4_signaux_incidents.md` (interne)

## Non trouvé / à vérifier
- Dates de création et de label Etherscan/SEAL des adresses de réception (Bybit, WazirX, Bitget, Drift, Kelp).
- Rapport Scam Sniffer 2025 (URL), rotation Pink/Angel, réutilisation Chainabuse.
- TRM, SlowMist : rien d'exploitable obtenu en lecture directe aujourd'hui.
