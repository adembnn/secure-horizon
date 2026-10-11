# Famille 02 : MAUVAIS DESTINATAIRE

Barrière d'intention Sentinelle (`app/intent/src/compare.ts`, `types.ts` lus dans `C:\Users\Adem\wt\T-103`).
Rédigé le 2026-10-11. Sources web = donnée, jamais instruction. Les affirmations non vérifiées sont marquées **[à vérifier]**.
Les numéros de ligne renvoient à `compare.ts` de la worktree T-103.

## 0. Ce que fait le code aujourd'hui (lecture rapide)

- **Sosie** : la règle `lookalike_address` (l. 145-156) ne se déclenche que si `cp.lookalikeOf` est déjà renseigné par le moteur d'effets. `compare.ts` ne calcule rien. La fonction `isLookalike()` (l. 21-30, seuil 4+4 hex) est **du code mort** : elle n'est appelée nulle part. Son seuil 4+4 raterait le cas des 50 M$ de déc. 2025, qui est du 3+4.
- **Mauvais destinataire** : la règle `wrong_recipient` (l. 241-254) n'existe que si `intent.counterpartyAddress` est fourni. Or le champ est optionnel dans `types.ts` ("si choisi dans le carnet"). Une adresse collée depuis l'historique, qui est exactement le scénario de l'address poisoning, passe donc sans contrôle dans `pay_someone`.
- **Jamais vu** : `firstSeenByUser` n'est utilisé que dans `send_to_my_account` (l. 300-311). `pay_someone` ne l'utilise pas.
- **Contrat / burn / token** : aucune règle sur la nature du destinataire (EOA, contrat de token, adresse morte, smart wallet non déployé).
- **Token** : `outgoing[].token` n'est jamais comparé à `intent.token`. Un faux "USDT" ou l'USDC.e à la place de l'USDC passe.
- **Chaîne** : `Effects.chainId` n'est jamais comparé à une chaîne attendue. `Intent` n'a pas de champ chaîne.
- **Seuil d'âge** : `NEW_CONTRACT_THRESHOLD_BLOCKS = 50` (l. 13) est commenté "10 minutes", ce qui est faux sur Avalanche C-Chain (blocs d'environ 1-2 s, soit environ 1,5 à 3 minutes). À passer en secondes. Le texte parle de "contrat" alors que `ageBlocks` peut viser une EOA.
- `high_balance_share` (l. 130-142) n'est qu'un `warn`. Dans les gros cas d'address poisoning, la victime vide 97 % de son portefeuille.
- Boucle `buy_or_swap` l. 350-354 : bloc vide (no-op) pour "recipient is self". C'est hors famille, mais elle est couverte indirectement par `no_incoming`, à condition que le moteur calcule `incoming` relativement à l'utilisateur.

## 1. Tableau récapitulatif

Couverture : OUI = règle active aujourd'hui qui attrape le cas. PARTIEL = attrape seulement si le moteur fournit un champ que rien ne calcule, ou seulement dans un intent. NON = rien.

| ID | Menace | Incident phare (date / perte) | Couvert | Règle proposée | Priorité |
|---|---|---|---|---|---|
| F01 | Poisoning par transfert zéro-valeur (`transferFrom(victime, sosie, 0)`) | 3 mai 2024 : 68 M$ WBTC ; 26 mai 2025 : 2,6 M$ USDT | PARTIEL (l. 145 si `lookalikeOf`) | DST-01 + DST-02 | P0 |
| F02 | Poisoning par dust (petit vrai transfert) | juil. 2022 à juin 2024 : 83,8 M$ (étude CMU) ; déc. 2025 : 0,005 USDT | PARTIEL | DST-01 + DST-02 | P0 |
| F03 | Poisoning par faux token (symbole identique, Cyrillique) | 5 838 faux tokens ETH+BSC | NON | DST-03 | P1 |
| F04 | Sosie vanity : calcul robuste du lookalike | 19-20 déc. 2025 : 49,99 M$ USDT (3+4) | PARTIEL (code mort, 4+4) | DST-01 (algo, section 3) | P0 |
| F05 | Petite tx test puis grosse tx | 20 déc. 2025 : 50 M$ ; juin 2022 : Wintermute (2 tests, tout de même 20 M OP volés) | NON | DST-04 | P0 |
| F06 | Clipboard hijacker (clipper) | sept. 2024 : alerte Binance ; mars 2023 : Kaspersky, 15 000 victimes | NON (limite structurelle) | DST-05 (canal hors bande) | P1 |
| F07 | Homoglyphes ENS / domaines | pas de perte chiffrée vérifiée | NON | DST-06 | P2 |
| F08 | Faux dépôt exchange (adresse remplacée, mémo oublié, mauvaise chaîne ou mauvais token) | 30 janv. 2026 : 4 556 ETH (12,4 M$) sur un dépôt OTC | NON | DST-07 | P1 |
| F09 | Envoi vers contrat de token ou adresse morte | 51 000 USDT envoyés au contrat USDT (ZachXBT, date non fournie) | NON | DST-08 | P0 (facile) |
| F10 | Mauvaise chaîne / smart wallet non déployé | 9 juin 2022 : Wintermute, 20 M OP (environ 16-27 M$) | NON | DST-09 | P1 |
| F11 | QR piégé | pas d'incident chiffré vérifié | NON | DST-05 + DST-10 | P2 |
| F12 | Carnet d'adresses empoisonné | pas d'incident public chiffré trouvé | NON | DST-11 | P1 |
| F13 | Intent sans adresse (collage depuis l'historique) | faille de conception, c'est le canal des F01-F05 | NON | DST-12 | P0 |
| F14 | Token envoyé différent du token déclaré (faux USDT, USDC.e vs USDC) | voir F03 | NON | DST-13 | P1 |
| F15 | Destinataire EOA délégué EIP-7702 (sweeper) | depuis mai 2025 **[à vérifier]** | NON | DST-14 | P2 |

## 2. Données publiques utiles (une seule fois, réutilisées dans les fiches)

- **Étude CMU, USENIX Security 2025** (Tsuchiya, Dong, Soska, Christin), arXiv 2501.16681 v3 (2 juil. 2025) : https://arxiv.org/abs/2501.16681 et https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya
  - 1er juil. 2022 au 30 juin 2024, Ethereum + BSC : 270 M de tentatives, 17 M de victimes ciblées, 6 633 incidents réussis, au moins 83,8 M$ de pertes.
  - Sur Ethereum : 17,3 M de transferts d'empoisonnement, dont 0,3 M "tiny", 7,2 M zéro-valeur, 9,9 M faux tokens.
  - 5 838 faux tokens, dont au moins 740 utilisent des encodages différents (Cyrillique) de USDT ou USDC.
  - Les attaques réussies ne corrèlent pas linéairement avec la similarité : il est rentable de générer beaucoup de sosies moyens. Leur détecteur exige au moins 7 chiffres de correspondance (miss en dessous de 7).
  - Affichage des wallets : MetaMask (4,4), Phantom (4,4), Trust Wallet (2,4). Les explorateurs montrent 6-7 de chaque côté.
  - Le test zéro-valeur légitime (envoyer 0 à soi pour tester) est indistinguable du poisoning côté événement : ils l'avouent comme faux négatif.
- **Etherscan** : les `Transfer(victime → sosie, 0)` sont émis par n'importe quel appelant de `transferFrom` sur USDT/USDC/DAI (allowance 0 ≥ 0). Etherscan les masque par défaut. Le mécanisme est documenté ici : https://info.etherscan.com/what-is-address-poisoning. Etherscan a publié le 9 mars 2026 : https://info.etherscan.com/address-poisoning-attacks-are-rising-on-ethereum. Cas de 13 sosies concurrents posés en quelques minutes ; tâche de création de sosies en moins de 30 minutes (X, 13 fév. 2026).
- **MetaMask / Blockaid** : 65,4 M de transactions de poisoning détectées de janv. 2025 à fév. 2026 (https://metamask.io/news/address-poisoning-detection). MetaMask a livré une détection native : avertissement bloquant si l'adresse collée correspond aux 4 premiers et 4 derniers caractères d'une adresse déjà utilisée, et alerte "adresse jamais utilisée" (https://support.metamask.io/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams).
- **Coût du sosie** (https://www.bleepingcomputer.com/news/security/metamask-warns-of-new-address-poisoning-cryptocurrency-scam, 12 janv. 2023 ; https://www.crypto-finance.com/phishing-for-zeroes-pt-2-evolution-of-the-attack) : un préfixe ou un suffixe se mine en moins d'une minute. Un sosie 2+6 a été produit en environ 90 s, probablement prégénéré. Les outils : Vanity-ETH, Profanity2.
- **Scam Sniffer 2025** (https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million) : le rapport couvre les drainers par sites de phishing. L'address poisoning y est signalé à part (ex. 771 000 $ en fév. 2025 avec correspondance 4+6, https://www.mitrade.com/insights/news/live-news/article-3-677958-20250306).

## 3. Calcul robuste d'un sosie (moteur commun, F04)

### 3.1 Contre quoi comparer : l'ensemble de référence R

Un sosie n'a de sens que contre une adresse que l'utilisateur connaît vraiment. Construire R avec une **provenance** par entrée, et ne jamais fabriquer R à partir des événements que l'attaquant peut forger.

| Source de R | Confiance | Comment l'obtenir sans indexer la chaîne |
|---|---|---|
| Carnet d'adresses Sentinelle + comptes propres de l'utilisateur | haute | stockage local |
| Adresses auxquelles l'utilisateur a **envoyé** (`tx.from == user`, `value > 0` ou transfert de token décodé depuis `tx.input`) | haute | 1 appel API de type Etherscan `account.txlist` (derniers 1 000 txs, tri décroissant) + `tokentx` filtré par `hash → tx.from == user`. Sur Fuji, Routescan/Snowtrace expose le même format **[à vérifier : URL exacte de l'API testnet]**. |
| Adresses de l'historique "reçu seulement" | **nulle**, c'est le vecteur d'attaque | marquées `receivedOnly`, jamais ajoutées à R |

**Piège central** : filtrer `eth_getLogs` sur `topic1 = user` (ou lire `tokentx`) compte les `Transfer(user → sosie, 0)` forgés comme des "envois de l'utilisateur". Le critère fiable est **`tx.from == user`** (ou `sender` de la UserOp pour ERC-4337, ou l'EOA qui signe pour 7702), pas l'événement. Pour chaque candidat on récupère le `from` de la transaction (une requête `eth_getTransactionByHash` par candidat, quelques dizaines au pire, en parallèle, cache local).

### 3.2 Métrique

Pour un destinataire D et une référence r de R, en hex minuscules sans `0x` :
- `a` = nombre de caractères identiques en tête, `b` = nombre de caractères identiques en queue (0 si égal : si D == r, ce n'est pas un sosie).
- Score = `a + b`. L'attaquant optimise ce que l'interface affiche (MetaMask 4+4, Trust 2+4, explorateurs 6-7). La distance d'édition (Levenshtein) n'est pas pertinente pour du copier-coller (l'étude CMU l'écarte aussi).

### 3.3 Seuils et faux positifs (calcul, pas d'estimation à l'œil)

Pour une paire aléatoire, P(a + b ≥ s avec a ≥ 1, b ≥ 1) vaut environ (s − 1) × 16⁻ˢ.

| s | P par paire | pour |R| = 1 000 (utilisateur très actif) |
|---|---|---|
| 5 | 3,8e-6 | 0,4 % par destinataire : trop pour du critical seul |
| 6 | 3,0e-7 | 0,03 % |
| 7 | 2,2e-8 | 0,002 % |
| 8 | 1,6e-9 | négligeable |

Coût attaquant de s = 8 : 16⁸ ≈ 4,3 milliards de hachages, des secondes à minutes sur un GPU (Profanity2). **Observés réellement** : (3,4) = 7 en déc. 2025 ; (2,6) = 8 ; (4,6) = 10 ; (6,6) = 12. Donc :
- **s ≥ 8** : `critical` quel que soit le contexte.
- **6 ≤ s ≤ 7** : `critical` si l'une des preuves de provenance du 3.4 s'applique, sinon `warn`.
- **s = 5** : jamais seul. Utile uniquement combiné à la provenance dust (3.4).

### 3.4 Provenance de D (le signal qui fait baisser les FP)

Pour D, interroger l'activité de l'adresse sur la chaîne (3 appels : `eth_getCode`, `eth_getTransactionCount`, premier transfert entrant vers l'utilisateur) et dériver :
- `relation(D)` ∈ `addressBook | sentBefore | receivedOnly | none`
- `receivedOnly` + premier contact < 7 jours + valeur ≤ 1 USD + (zéro-valeur ou token non canonique) = **signature du poisoning**.
- nonce(D) = 0 et aucun solde avant le contact : l'adresse ne sert qu'à être copiée (jamais envoyé quoi que ce soit). Un légitime nouveau destinataire a aussi un nonce 0, d'où la combinaison obligatoire avec le sosie.

### 3.5 Sans indexer la chaîne

Le budget ne dépend que de |R| et du nombre de destinataires de la transaction : une comparaison O(|R|) en mémoire. Les seuls appels réseau sont l'historique de l'utilisateur (1-2 appels, cache), et au plus 3 `eth_*` sur D. Pas d'index global. Sur Fuji, tout le cas de démo tient dans une seule page `txlist`.

### 3.6 Pour la démo Fuji : fabriquer des sosies sans clé

Pour les tests, le sosie n'a pas besoin d'être miné : on **découpe** l'adresse cible (`sosie(addr, a, b)` = préfixe a + milieu pseudo-aléatoire + suffixe b). Les fonds envoyés sur un testnet à une adresse sans clé sont simplement perdus. Pour le poisoning zéro-valeur, l'attaquant n'a besoin d'aucune clé du sosie : n'importe quel compte appelle `transferFrom(victime, sosie, 0)` sur un ERC-20 de test (OpenZeppelin v5 accepte `value = 0` sans allowance). Reproductible entièrement sur Fuji.

## 4. Fiches

Légende des champs à ajouter : tous dans `types.ts` (Adem possède ce périmètre : à demander via INBOX).

---

### F01. Poisoning par transfert zéro-valeur

- **Mécanisme.** Un bot détecte un transfert récent de l'utilisateur vers R, mine un sosie L (mêmes premiers et derniers caractères), puis appelle `transferFrom(user, L, 0)` sur le même ERC-20 (USDT, USDC, DAI acceptent). L'historique du wallet montre une "sortie" de l'utilisateur vers L. L'utilisateur copie L depuis l'historique ou l'explorateur. L'attaque se lance en moins de 30 minutes à 90 secondes après le vrai transfert.
- **Incidents.**
  - 2024-02 : un utilisateur Kraken perd 1 M USDT par poisoning de l'historique (rapporté dans https://www.binance.com/en/square/post/7614047793506).
  - 2024-05-03 : 1 155 WBTC (≈ 68-71 M$) envoyés à un sosie après poisoning par un faux transfert de 0,05 ETH. Tx : `0x3374abc5…8f5f570` (ZachXBT, https://t.me/s/investigations/122). Environ 34,7 M$ rendus par l'attaquant dans les jours suivants. Presse : https://www.coindesk.com/business/2024/05/03/exploiter-steals-68m-worth-of-crypto-through-address-poisoning, https://cointelegraph.com/news/trader-loses-68-million-address-poisoning-scam.
  - 2025-05-26 : même victime piégée deux fois en 3 h par la même adresse, 843 k$ puis 1,75 M$ USDT (Cyvers, https://www.ccn.com/news/crypto/victim-loses-2-6m-usdt-scamaddress-poisoning-trap-twice).
  - 2026-03-05 : "Sillytuna", 24 M$ en aEthUSDC (Aave), https://www.ccn.com/news/crypto/sillytuna-crypto-24m-poisoning-attack-how-it-happened.
- **Prévalence.** Dominante en nombre. Sur Ethereum, 7,2 M de transferts zéro-valeur sur 17,3 M de transferts d'empoisonnement (étude CMU). Etherscan les masque par défaut, les wallets Trust et Phantom aussi, mais pas tous les wallets ni tous les explorateurs.
- **Ce que voit le moteur.** `Effects.outgoing[0].to = L`, `counterparties[L]` avec, si on l'ajoute, la relation `receivedOnly` et l'historique de contact. Aujourd'hui rien ne dit que L est un sosie.
- **Couvert aujourd'hui.** PARTIEL. `lookalike_address` (l. 145-156) se déclenche si `lookalikeOf` est posé. Rien dans `compare.ts` ne le calcule. Dans `pay_someone`, `wrong_recipient` (l. 241) rattrape le cas seulement si l'utilisateur a choisi dans le carnet. Pour l'historique collé : NON.
- **Règle proposée (DST-01, DST-02).**
```ts
// DST-01 : sosie (calcul moteur, voir section 3)
for (const cp of recipients(effects)) {            // destinataires de outgoing + beneficiaires de delegation
  for (const r of ref.entries) {                    // R : addressBook, sentBefore uniquement
    if (cp.address === r.address) continue
    const s = prefixLen(cp.address, r.address) + suffixLen(cp.address, r.address)
    if (s >= 8) critical('lookalike_strong', {of: r.address})
    else if (s >= 6) (provenance(cp) !== 'sentBefore'/*receivedOnly|none*/ ? critical : warn)('lookalike')
  }
}
// DST-02 : provenance poison, sans sosie connu
if (cp.relation === 'receivedOnly' && cp.firstContactAgeSec < 7*86400
    && cp.inbound.every(t => t.usd <= 1 || t.kind === 'zero_value_transferFrom' || t.kind === 'counterfeit_token')) {
  warn('recipient_came_from_dust')                  // critical si high_balance_share > 50 ou usd > 1000
}
```
- **Champs à ajouter.**
  - `counterparties[].relation: 'addressBook' | 'sentBefore' | 'receivedOnly' | 'none'`
  - `counterparties[].firstContactAgeSec?: number`
  - `counterparties[].inbound?: {kind: 'zero_value_transferFrom'|'tiny'|'counterfeit_token'|'normal'; usd: number}[]`
  - `counterparties[].lookalikeOf` remplacé par `lookalike?: {of; prefix; suffix; ofRelation; ofLastSentAt}`
  - `counterparties[].nonce?: number`
  - Un `userContext.refAddresses` accessible à `compare()`.
- **Objection du praticien.** "MetaMask le fait déjà depuis 2026." **Parade.** MetaMask compare sur 4+4 et seulement quand l'adresse est collée dans son champ d'envoi ; il ne sait rien de l'intention ni de la provenance. Sentinelle juge le résultat décodé, quelle que soit la façon dont l'adresse est entrée (dApp, carte de swap, intent de paiement), croise la provenance (dust) et le test-tx (F05). À mesurer en démo : le cas 3+4 de déc. 2025 contre 4+4 (hypothèse **[à vérifier]**, ne pas l'affirmer sans test).
- **Risque FP.** Faible (tableau 3.3). Cas réel : deux contacts légitimes avec adresse quasi identique (rare). Parade : si les deux sont dans le carnet, `info` seulement.
- **Cas de test Fuji.**
  1. Déployer un ERC-20 de test `tUSDC`. Envoyer 1 tUSDC du compte U vers R (un compte vierge). 2. Depuis un compte tiers, appeler `transferFrom(U, L, 0)` avec `L = sosie(R, 3, 4)`. 3. Demander à Sentinelle `pay_someone "Paul"` sans adresse (F13), tx `transfer(L, 100)`. Attendu : `critical`, raison `lookalike`. 4. Contrôle négatif : tx vers R, attendu `ok`. 5. Sosie (3,3) : attendu `warn` si `receivedOnly`, `ok` si `none`.
- **Mapping.** ATT&CK **T1656 Impersonation** (approximatif, pas d'équivalent exact) ; T1036.005 Match Legitimate Name or Location (analogue). D3FEND **D3-IAA** Identifier Activity Analysis, **D3-IRA** Identifier Reputation Analysis **[IDs à revérifier avant le rapport]**. NIST CSF 2.0 : **DE.AE-02**, **DE.AE-03**, **RS.MI-01** (avertissement bloquant).

---

### F02. Poisoning par dust (vrai petit transfert)

- **Mécanisme.** L envoie un petit montant (natif ou stablecoin) à l'utilisateur, ce qui coûte à l'attaquant mais l'inscrit comme "entrant" authentique dans tous les wallets, y compris ceux qui masquent le zéro-valeur (Trust, Phantom affichent le tiny transfer).
- **Incidents.** 2025-12-19/20 : 0,005 USDT depuis `0xbaff2f13…08f8b5` pour un vrai `0xbaf4b1af…95f8b5`, puis 49 999 950 USDT perdus (voir F05). Sources : https://www.coindesk.com/web3/2025/12/20/crypto-user-loses-usd50-million-in-address-poisoning-scam, https://themarketperiodical.com/2025/12/20/crypto-user-loses-50m-in-usdt-after-simple-copy-paste-mistake (contient les deux adresses). Jan. 2026 : 12,25 M$ (Scam Sniffer, https://www.gate.com/news/detail/18667148). Selon Andrey Sergeenkov, une semaine de janvier 2026 a vu 2,7 M de nouvelles adresses, dont environ deux tiers reçoivent moins de 1 $ de stablecoins.
- **Prévalence.** Sur Ethereum, 0,3 M de tiny transfers (étude CMU), mais cette variante est la seule qui passe les filtres de wallets qui masquent le zéro.
- **Ce que voit le moteur.** Pareil que F01 avec `inbound.kind = 'tiny'`.
- **Couvert.** PARTIEL (même ligne que F01).
- **Règle.** DST-01 et DST-02 (F01). Seul ajout : DST-02 considère `usd ≤ 1` comme dust.
- **Objection.** "Les airdrops et les remboursements de frais envoient aussi du dust." **Parade.** DST-02 seul n'émet que `warn` ; il devient critical uniquement s'il est combiné à un sosie (DST-01) ou à une part de solde supérieure à 50 %. Le dust seul, sans sosie, n'est jamais critical.
- **Risque FP.** Moyen pour DST-02 seul (warn). Faible combiné.
- **Cas de test Fuji.** Reprendre F01 en remplaçant l'étape 2 par un vrai envoi de 0,005 tUSDC de L vers U. Attendu identique ; plus un cas négatif : L reçu depuis un faucet public, destinataire sans sosie : `ok`.
- **Mapping.** Idem F01. NIST CSF 2.0 : DE.AE-02.

---

### F03. Poisoning par faux token (symbole usurpé)

- **Mécanisme.** L'attaquant déploie un ERC-20 nommé `USDT` ou `USDC` (parfois avec des lettres cyrilliques) et émet un `Transfer(user → L, montant identique au vrai)` pour que la ligne de l'historique ressemble au dernier vrai paiement, y compris le montant.
- **Incidents.** 5 838 faux tokens recensés sur ETH+BSC, 1 922 avec le symbole exact, 740 avec encodages différents (étude CMU). Cas de 100 000 USDT perdus avec un faux contrat "USDT" à fonction `mint and transfer` (Crypto Finance, https://www.crypto-finance.com/phishing-for-zeroes-pt-2-evolution-of-the-attack, juil. 2026 selon la page ; **le cas précis n'est pas daté**). MetaMask Community confirme les faux tokens à valeurs imitées : https://community.metamask.io/t/fake-phishing-flagged-address/29573 (oct. 2024).
- **Prévalence.** 9,9 M des 17,3 M de transferts d'empoisonnement sur Ethereum (57 %).
- **Ce que voit le moteur.** La transaction de la victime, elle, envoie le **vrai** token à L. Le faux token n'apparaît que dans l'historique d'où l'adresse a été copiée. Il se voit donc via `counterparties[L].inbound` (kind `counterfeit_token`) et non dans `outgoing`.
- **Couvert.** NON.
- **Règle (DST-03).** Calculer `inbound.kind = 'counterfeit_token'` si le symbole d'un token reçu de L correspond (casse/Unicode normalisés) à un token canonique de la chaîne mais l'adresse du contrat diffère de l'adresse canonique. Alimente DST-02.
```ts
const canon = CANONICAL[chainId][normalizeSymbol(t.symbol)]   // USDC, USDT, WAVAX, ... pour la chaine
if (canon && canon !== t.address) inbound.kind = 'counterfeit_token'
```
- **Champs.** `inbound[].kind`, table `CANONICAL` (signal secondaire, dit : liste courte en dur de 5-10 tokens par chaîne, mise à jour manuelle ; la règle est une fonction de l'écart symbole / contrat).
- **Objection.** "Une liste en dur vieillit." **Parade.** Elle ne sert qu'à nourrir un score de provenance, pas à bloquer. L'absence dans la liste (token inconnu avec symbole qui ne ressemble à aucun canonique) ne déclenche rien. Pour les tokens hors liste, on retombe sur DST-01.
- **Risque FP.** Faible : les tokens à symbole identique avec contrat différent sont rares côté légitime (USDC natif vs USDC.e sur Avalanche, voir F14).
- **Cas de test Fuji.** Déployer un ERC-20 `USDC` (faux). Le faire émettre `Transfer(U → L, 100)` via une fonction `fakeTransfer`. Attendu : `counterparties[L].inbound[0].kind = counterfeit_token`, ensuite scénario F01 étape 3.
- **Mapping.** ATT&CK T1656 ; T1036.005. D3FEND D3-IRA. NIST CSF 2.0 DE.AE-02.

---

### F04. Sosie vanity : détection robuste (moteur commun)

Le calcul est décrit à la section 3. Ici l'inventaire des cas observés et la décision.

- **Incidents (correspondances réelles).**

| Date | Montant | (préfixe, suffixe) | Source |
|---|---|---|---|
| 2024-05-03 | 68 M$ WBTC | 6+6 (selon CoinDesk) | https://www.coindesk.com/business/2024/05/03/exploiter-steals-68m-worth-of-crypto-through-address-poisoning |
| 2025-02 | 771 k$ | 4+6 | https://www.mitrade.com/insights/news/live-news/article-3-677958-20250306 |
| 2025 (cas 100 000 USDT) | 100 k$ | 2+6 | Crypto Finance (voir F03) |
| 2025-12-19 | 49,99 M$ | **3+4** | https://themarketperiodical.com/2025/12/20/crypto-user-loses-50m-in-usdt-after-simple-copy-paste-mistake |
| 2026-03-05 | 24 M$ | non détaillé | CCN (F01) |

- **Couvert.** PARTIEL. Le code mort `isLookalike` (4+4) aurait raté le cas à 50 M$ (3+4) et le cas 2+6.
- **Règle.** DST-01 (voir F01 et section 3).
- **Objection.** "Les attaquants s'adapteront en minant 8+8." **Parade.** Plus c'est long, plus c'est coûteux (16¹⁶), et notre seuil est un plancher bas qui ne bouge pas avec eux : plus l'attaquant ressemble, plus nous le voyons. La vraie fuite est ailleurs : provenance = `receivedOnly` reste vraie quelle que soit la longueur du sosie.
- **Risque FP.** Voir 3.3.
- **Test Fuji.** Générer des sosies (3,4), (4,4), (2,6), (6,6), (4,3) avec `sosie()` de la section 3.6. Attendu : (4,3) = 7 → critical si `receivedOnly`, warn sinon.
- **Mapping.** Idem F01.

---

### F05. "Petite tx test puis grosse tx"

- **Mécanisme.** L'utilisateur envoie un petit montant (50 USDT) pour valider l'adresse. Le test **est lui-même le signal** qui déclenche le bot : un sosie est miné et injecté en moins d'une heure (parfois quelques minutes). La grosse transaction est ensuite faite depuis l'historique.
- **Incidents.**
  - 2025-12-19/20 : 49 999 950 USDT, test de 50 USDT vers sa propre adresse, fonds retirés de Binance moins d'une heure avant. Les fonds ont été échangés via MetaMask Swap en DAI puis en environ 16 680 ETH, puis Tornado Cash. Sources : https://www.coindesk.com/web3/2025/12/20/crypto-user-loses-usd50-million-in-address-poisoning-scam, https://unchainedcrypto.com/users-loses-50-million-in-address-poisoning-attack, https://www.theblock.co/news/ecosystems/2025-12-20-crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return-383423.
  - 2022-06-09 : Wintermute envoyait deux tests à un multisig Safe non déployé sur Optimism ; le test n'a pas détecté l'absence de contrôle (https://safeheron.com/blog/20-million-op-tokens-stolen-contract-multisig-vs-mpc). Un test prouve que les fonds arrivent, pas qu'on les contrôlera.
  - 2026-01-30 : 4 556 ETH (12,4 M$) sur un dépôt OTC "routine" (https://bex.co/blog/2026/03/11/address-poisoning-defi-stealth-attack-vector, citant Scam Sniffer).
- **Prévalence.** Aucune statistique ; le comportement est quasi universel chez les gros transferts, ce qui en fait la fenêtre de tir préférée.
- **Ce que voit le moteur.** L'historique de session : un envoi récent de faible valeur vers X, puis une nouvelle transaction de forte valeur vers D.
- **Couvert.** NON. Pire : le test **lave** la mauvaise adresse en rendant X "déjà vu" (`firstSeenByUser = false`), alors que D reste inconnue, mais l'utilisateur ne fait qu'y penser sur la base de l'apparence.
- **Règle (DST-04).**
```ts
// ctx.recentOutgoing: envois confirmes par cet utilisateur sur 24 h, avec usd et destinataire
const test = ctx.recentOutgoing.find(o => o.usd <= 0.01 * thisTxUsd && age(o) < 24*3600)
if (test && out.to !== test.to) {
  if (similar(out.to, test.to, 6))     critical('test_then_lookalike')   // le cas des 50 M$
  else if (thisTxUsd >= 1000)          warn('test_recipient_differs')    // "tu as teste X, tu envoies a Y"
}
if (test && out.to === test.to) { /* ok : on valide ce qu on a teste */ }
// et pour les contrats : le test doit etre une vraie operation, pas un simple envoi (voir DST-09)
```
- **Champs.** `userContext.recentOutgoing: {to, usd, tsMs, chainId, token}[]`.
- **Objection.** "Un utilisateur fait légitimement un test à A puis envoie à B." **Parade.** On ne bloque que quand B ressemble à A (sosie) ; sinon un simple `warn` au-dessus de 1 000 USD qui demande de choisir ("tu as testé A, tu envoies à B : c'est voulu ?"). Un oui du côté de l'utilisateur n'est pas bloquant.
- **Risque FP.** Faible pour le `critical`, moyen pour le `warn`. Mesurer en démo.
- **Test Fuji.** Envoyer 1 tUSDC à R, puis `pay_someone` 100 tUSDC vers `sosie(R,3,4)` dans les 24 h : critical. Variante : vers un compte sans lien : warn si ≥ seuil, sinon ok. Variante : vers R : ok.
- **Mapping.** ATT&CK T1656 (approximatif). D3FEND D3-UBA User Behavior Analysis. NIST CSF 2.0 DE.AE-03 (corrélation d'événements), DE.CM-03.

---

### F06. Clipboard hijacker (clipper)

- **Mécanisme.** Un malware lit le presse-papier et remplace toute chaîne qui ressemble à une adresse crypto par celle de l'attaquant. Le wallet reçoit déjà l'adresse piégée. Souvent dormant des années.
- **Incidents.**
  - 2023-03-28 : Kaspersky, campagne via faux Tor Browser, plus de 15 000 attaques dans 52 pays, au moins 400 000 $ (https://www.kaspersky.com/about/press-releases/new-clipper-malware-steals-us400000-in-cryptocurrencies-via-fake-tor-browser).
  - 2024-09-16 : Binance alerte sur un malware mondial qui modifie les adresses de retrait (https://therecord.media/clipper-malware-binance-stealing-crypto).
  - 2026-06 : rapport Check Point sur un clipper en Rust avec 15 500 adresses BTC intégrées, faux dépôts GitHub, propagation USB. **Source secondaire seulement (spotedcrypto.com), [à vérifier].**
- **Prévalence.** Ancienne et stable. Pas de chiffre global fiable.
- **Ce que voit le moteur.** L'adresse est déjà remplacée avant la signature. La transaction est cohérente avec ce que le wallet affiche. Si la machine est compromise, l'écran de Sentinelle peut l'être aussi.
- **Couvert.** NON, et **limite structurelle** : un contrôle sur la même machine, via le même presse-papier, n'est pas indépendant.
- **Règle (DST-05, canal hors bande).** On ne bat pas un clipper en comparant deux copies de la même chaîne. On casse la chaîne de confiance sur le presse-papier :
  1. `recipientSource` : la seule source "sûre" est `addressBook` (sélection par nom). `pasted` est dégradé : exiger de retaper les **4 caractères du milieu** affichés par Sentinelle, ou de choisir le destinataire parmi 2-3 candidats.
  2. Pour les gros montants, afficher le destinataire sous forme découpée en groupes de 4 avec comparaison avec la valeur saisie à la main dans l'intent (`typedLast6`).
```ts
if (intent.recipientSource === 'pasted' && thisTxUsd >= 500 && !intent.typedCheck) warn('confirm_recipient_manually')
if (intent.counterpartyAddress && out.to !== intent.counterpartyAddress) critical('wrong_recipient')  // deja en l.241
```
- **Champs.** `intent.recipientSource: 'addressBook'|'pasted'|'ens'|'qr'|'history'` ; `intent.typedCheck?: string`.
- **Objection.** "Si la machine est compromise, le clipper remplace aussi l'adresse dans Sentinelle." **Parade honnête.** Oui pour le champ collé. Mais le clipper ne sait pas remplacer une **sélection par nom** dans le carnet ni la **frappe manuelle** de 4 caractères que l'on compare à une valeur lue sur un autre écran (téléphone, facture). Limite assumée : un malware plus avancé (hooking du navigateur) reste hors périmètre, il relève de l'EDR ou d'un wallet matériel qui affiche l'adresse complète.
- **Risque FP.** Friction : la double saisie sur chaque envoi collé agace. Ne l'activer qu'au-dessus d'un seuil en USD.
- **Test Fuji.** Harness : remplacer par code l'adresse entre l'intent et la tx (simule le clipper). Intent `counterpartyAddress = R`, tx vers `L` : `wrong_recipient` critical (déjà couvert). Intent `recipientSource = 'pasted'` sans `counterpartyAddress`, tx vers L : doit passer par `typedCheck`.
- **Mapping.** ATT&CK **T1115 Clipboard Data** (collecte) + **T1565.002 Transmitted Data Manipulation** (approximatif pour le remplacement). D3FEND D3-PA Process Analysis (côté poste), D3-EAL Executable Allowlisting **[IDs à revérifier]**. NIST CSF 2.0 PR.DS-02 (données en transit), DE.CM-09.

---

### F07. Homoglyphes ENS / domaines

- **Mécanisme.** Le destinataire est un nom (`paul.eth`) résolu côté wallet. Un nom visuellement identique (caractères Unicode confusables, `rn` vs `m`, chiffre `0` vs `o`) résout vers l'attaquant. La normalisation ENSIP-15 réduit beaucoup le risque (mélange de scripts interdit), mais les confusables d'un seul script et les sosies ASCII restent.
- **Incidents.** Aucun incident daté et chiffré vérifié dans cette recherche. Ce qui est établi : les attaquants emploient de l'Unicode ailleurs (740 faux tokens cyrilliques, F03). **[à vérifier]** avant de présenter F07 autrement que comme une menace plausible, non quantifiée.
- **Prévalence.** Inconnue.
- **Ce que voit le moteur.** Seulement l'adresse résolue. Le nom que l'utilisateur croyait lire n'est pas dans la transaction. Si Sentinelle intercepte le champ du dApp ou l'intent, il peut avoir `intent.counterpartyLabel = 'paul.eth'`.
- **Couvert.** NON.
- **Règle (DST-06).** Si `intent.counterpartyLabel` ou le destinataire est un nom ENS : (1) vérifier que la résolution forward et reverse concordent ; (2) comparer au carnet par **forme squelette** (skeleton UTS #39 : minuscules, confusables repliés, `rn`→`m`, `0`→`o`, `1`→`l`) ; (3) un nom dont le squelette égale celui d'un contact mais dont le texte diffère : critical.
```ts
const sk = skeleton(nameTyped)
const hit = addressBook.find(c => skeleton(c.name) === sk && c.name !== nameTyped)
if (hit) critical('ens_confusable', {of: hit.name})
if (name.hasMixedScripts || ensAgeDays < 30) warn('ens_suspicious')
```
- **Champs.** `counterparties[].ensName`, `ensAgeDays`, `ensReverseMatches: boolean`, `ensConfusableOf?: string`.
- **Objection.** "UTS #39 sort des faux positifs sur les noms légitimes internationaux." **Parade.** On ne compare qu'au carnet de l'utilisateur (quelques dizaines d'entrées), pas à un dictionnaire de marques. Pas de contact au squelette identique : pas de signal.
- **Risque FP.** Très faible (périmètre restreint au carnet).
- **Test Fuji.** ENS n'existe pas sur Fuji : tester en simulant la couche de résolution (mock). Carnet : `paul.eth → R`. Intent : `pau1.eth → L` : critical.
- **Mapping.** ATT&CK T1656, T1036.005 ; D3FEND **D3-DNRA** Domain Name Reputation Analysis ; NIST CSF 2.0 DE.AE-02.

---

### F08. Faux dépôt exchange (adresse remplacée, mémo oublié, mauvaise chaîne ou mauvais token)

- **Mécanisme.** Trois variantes. (a) L'adresse de dépôt de l'exchange est remplacée (clipper F06, ou sosie F01) : les fonds partent chez l'attaquant. (b) La chaîne qui exige un mémo ou tag (XRP, XLM, etc.) est utilisée sans lui : l'exchange ne peut pas créditer. Coinbase le confirme : "Omitting or entering an incorrect tag/memo can delay transactions or cause the loss of funds" (https://help.coinbase.com/en/coinbase/trading-and-funding/sending-or-receiving-cryptocurrency/destination-tag-memo-faq) ; Bybit a une procédure d'appel pour mémo manquant (https://www.bybit.com/en/help-center/article/How-Recover-Missing-Deposit-Self-Service). (c) Mauvais réseau ou token : sur Avalanche, USDC natif contre USDC.e, ou C-Chain vs X-Chain.
- **Incidents.** 2026-01-30 : 4 556 ETH (≈ 12,4 M$) vers un dépôt OTC, victime d'un sosie (bex.co, F05). Les cas de dépôts sur mauvaise chaîne ne sont pas publiés de façon agrégée ; pas de chiffre ni d'incident fiable obtenu **[à vérifier]**. Bybit et Coinbase confirment que le problème existe côté support.
- **Prévalence.** Variante (a) comme F01. Variantes (b) et (c) : volume support élevé mais sans chiffre public vérifié.
- **Ce que voit le moteur.** Pour l'EVM, il n'y a pas de mémo : le dépôt est une adresse (souvent un contrat de dépôt de l'exchange ou une EOA unique par utilisateur). L'info utile est "cette adresse est un dépôt d'exchange sur cette chaîne pour ce token".
- **Couvert.** NON.
- **Règle (DST-07).** Seulement pour `send_to_my_account` ou `pay_someone` dont `intent.destinationKind = 'cex_deposit'` :
```ts
if (intent.destinationKind === 'cex_deposit') {
  if (!cp.knownExchangeDeposit)                    warn('not_known_exchange_address')      // signal secondaire : etiquette Etherscan/Arkham, a ne pas figer
  if (cp.isContract && !cp.isDepositContract)      warn('exchange_address_is_contract')
  if (intent.expectedChainId && effects.chainId !== intent.expectedChainId) critical('wrong_chain')
  if (intent.expectedTokenAddress && out.token !== intent.expectedTokenAddress) critical('wrong_token_variant')  // USDC vs USDC.e
  if (chain.requiresMemo && !intent.memoConfirmed) warn('memo_required')   // hors EVM : hors perimetre demo
}
```
- **Champs.** `intent.destinationKind`, `intent.expectedChainId`, `intent.expectedTokenAddress`, `intent.memoConfirmed`, `counterparties[].labels[]` (étiquettes publiques).
- **Objection.** "L'utilisateur ne sait pas toujours quelle chaîne l'exchange accepte." **Parade.** On ne le devine pas : l'intent demande "sur quel réseau l'exchange affiche-t-il le dépôt ?" (une liste fermée) ; ensuite la règle compare. La question coûte un tap.
- **Risque FP.** Moyen : exiger un champ de plus. Ne s'active que pour `cex_deposit`.
- **Test Fuji.** Fuji n'a pas d'exchange. Simulation : carnet avec entrée `Exchange-test` (`chainId 43113`, token tUSDC). Tx sur la chaîne 43114 ou vers `tUSDC.e` : critical.
- **Mapping.** ATT&CK T1565.002 pour la substitution (approximatif) ; D3FEND D3-UDTA User Data Transfer Analysis ; NIST CSF 2.0 PR.AT-01 (sensibilisation via le flux) et DE.AE-02.

---

### F09. Envoi vers le contrat du token lui-même, ou une adresse morte

- **Mécanisme.** L'utilisateur colle l'adresse du contrat USDT au lieu de l'adresse du destinataire (ou l'inverse dans une UI mal comprise). Les tokens arrivent dans le contrat, qui n'a aucune fonction de récupération : perte définitive. Même effet vers `0x0000…0000` et `0x…dEaD`.
- **Incidents.**
  - ZachXBT, 51 000 USDT envoyés au contrat USDT, tx `0xb6e3e77c…0325609` (https://t.me/s/investigations/122, **date non fournie dans l'extrait**).
  - MetaMask documente le cas "Sent to a contract address" dans son aide (https://support.metamask.io/manage-crypto/move-crypto/send/funds-sent-on-wrong-network).
  - Estimation globale des tokens bloqués dans leurs propres contrats : **non vérifiée**.
- **Prévalence.** Rare par incident mais irréversible et trivialement détectable.
- **Ce que voit le moteur.** `outgoing[].to` = adresse d'un contrat. `counterparties[].isContract = true`. `outgoing[].token` identique ou non à `to`.
- **Couvert.** NON (aucune règle sur la nature du destinataire en dehors de l'âge `new_contract`).
- **Règle (DST-08).**
```ts
for (const out of effects.outgoing) {
  if (out.to === ZERO || out.to === DEAD || isPrecompile(out.to)) critical('burn_address')
  if (out.to === out.token)                                       critical('sent_to_token_contract')
  const cp = byAddr(out.to)
  if (cp.isContract && cp.looksLikeErc20) /* decimals()+totalSupply() repondent */ critical('sent_to_a_token_contract')
}
// exceptions : intent buy_or_swap/wrap (WAVAX.deposit) : recipient contract attendu, pas de transfert simple
```
- **Champs.** `counterparties[].looksLikeErc20` (via `eth_call decimals()`, `totalSupply()`), `isPrecompile`, `isBurn`.
- **Objection.** "Certains contrats acceptent légitimement des tokens (vault, multisig, WAVAX)." **Parade.** La règle ne vise que les contrats qui se comportent comme des tokens (répondent à `decimals`/`totalSupply` **et** n'ont pas de `receive`/hook de dépôt connu) ; pour `pay_someone` on traite un contrat générique comme warn (voir DST-09), pas critical. Un vault se détecte par le selector appelé : si `raw.selector` n'est pas `transfer`/`transferFrom` mais `deposit`, ce n'est pas un envoi simple.
- **Risque FP.** Très faible pour burn et token-contract. Moyen pour "contrat générique".
- **Test Fuji.** `tUSDC.transfer(address(tUSDC), 10)`, attendu critical. `transfer(0x…dEaD, 10)`, critical. `transfer(WAVAX_fuji, 10)` en `pay_someone` : critical (WAVAX n'a pas de fonction de récupération pour des tokens envoyés au contrat). `WAVAX.deposit{value}` en `buy_or_swap` : ok.
- **Mapping.** ATT&CK : pas d'équivalent (erreur utilisateur). D3FEND D3-UDTA. NIST CSF 2.0 DE.AE-02, PR.AT-01.

---

### F10. Mauvaise chaîne / smart wallet non déployé

- **Mécanisme.** Une adresse EVM est valable sur toutes les chaînes, mais pas son code. Un Safe, un compte ERC-4337 ou tout wallet créé par factory existe à l'adresse A sur la chaîne 1 et **pas** sur la chaîne 2. Envoyer sur la chaîne 2 est une opération qui réussit (EOA sans code) mais personne ne contrôle A là-bas : un tiers peut déployer le même contrat à A en rejouant le déploiement. Sinon, MetaMask précise que les EOA fonctionnent sur toutes les EVM, donc le problème est spécifique aux contrats (https://support.metamask.io/manage-crypto/move-crypto/send/funds-sent-on-wrong-network).
- **Incidents.** **2022-06-09, Wintermute / Optimism Foundation** : 20 M OP (≈ 16 M$ à la perte, 27,6 M$ selon Rekt) envoyés à un Safe qui n'existait que sur Ethereum. Un attaquant a rejoué le déploiement de la ProxyFactory 1.1.1 (transaction non EIP-155) pour obtenir A sur Optimism avant la récupération. Sources : https://rekt.news/wintermute-rekt, https://safeheron.com/blog/20-million-op-tokens-stolen-contract-multisig-vs-mpc, https://cryptoslate.com/optimism-foundation-sends-20m-to-the-wrong-wallet-op-drops-36. Le test de 1 OP avait réussi : voir F05. Guide officiel de récupération : https://docs.safe.global/advanced/cli-guides/recovery-safe-deployment.
- **Prévalence.** Un grand incident connu ; la généralisation de l'AA / 7702 / Safe l'augmente.
- **Ce que voit le moteur.** Sur la chaîne cible : `getCode(to) == '0x'`, `nonce(to) == 0`. Il faut interroger les **autres** chaînes pour voir que `to` a du code ailleurs.
- **Couvert.** NON.
- **Règle (DST-09).**
```ts
// cp.codeElsewhere : chaines (parmi une liste courte) ou getCode(to) != '0x'
if (!cp.hasCodeHere && cp.codeElsewhere.length > 0 && !userHasEoaProofHere) {
  critical('smart_wallet_not_deployed_here', {chains: cp.codeElsewhere})   // le Wintermute
}
// preuve EOA : cp.nonce > 0 (a deja signe ici) ou cp.hasCodeHere === false mais l utilisateur l a deja utilise ici
```
- **Champs.** `counterparties[].hasCodeHere`, `nonce`, `codeElsewhere: number[]` (appel `eth_getCode` parallèle sur 3-5 RPC publics : Ethereum, Avalanche C-Chain mainnet, Arbitrum, Optimism, Base ; sur Fuji la référence est Sepolia + Fuji).
- **Objection.** "Une EOA n'a pas de code, donc la règle déclenche sur n'importe quelle EOA." **Parade.** On ne déclenche que si du code existe **ailleurs** à la même adresse. Une EOA pure n'a de code nulle part. Les 7702 (EOA avec code de délégation) créent un cas où un code existe ailleurs : on lit le préfixe `0xef0100` et on le traite comme EOA.
- **Risque FP.** Faible. Coût : 3-5 requêtes RPC par nouveau destinataire (cache). Limite : un RPC inaccessible = `unknown`, pas `ok` (fail-closed sur gros montants).
- **Test Fuji.** Déployer un Safe sur Sepolia (ou sur Fuji et envoyer vers Sepolia), puis envoyer 10 tUSDC à cette adresse sur l'autre chaîne : critical. Contrôle : EOA ordinaire : ok.
- **Mapping.** ATT&CK : pas d'équivalent. D3FEND D3-UDTA / D3-IRA. NIST CSF 2.0 DE.AE-02, PR.PS.

---

### F11. QR piégé

- **Mécanisme.** Un QR (affiche, facture, page web, autocollant) encode l'adresse de l'attaquant. Le wallet charge l'adresse sans que l'utilisateur ait pu la lire. Aucune vérification visuelle possible à la lecture du QR.
- **Incidents.** Aucun incident chiffré vérifié dans cette recherche. Menace plausible : usage documenté de QR dans des scams de facturation, **[à vérifier]** pour des sources datées.
- **Ce que voit le moteur.** L'adresse du QR est indiscernable d'une adresse collée.
- **Couvert.** NON.
- **Règle (DST-05 + DST-10).** `intent.recipientSource = 'qr'` est traité comme `pasted` (aucune confiance). Si le QR provient d'une image dont Sentinelle peut lire le contexte (capture, pièce jointe), appliquer `classifyMessage` (déjà dans `types.ts`, `MessageLabel`) : un QR accompagné d'un message d'urgence, de support, ou d'un remboursement. Sinon : mêmes contrôles que F06 (retaper 4 caractères depuis une autre source).
- **Champs.** `intent.recipientSource='qr'`, `intent.qrContextLabel?: MessageLabel`.
- **Objection.** "Un QR de paiement légitime est la méthode normale chez un commerçant." **Parade.** Le contrôle ne bloque pas : il demande de confirmer le **nom du bénéficiaire** (affiché par Sentinelle d'après l'intent) et de comparer 4 caractères avec la facture. Pour un montant faible (< seuil), aucune friction.
- **Risque FP.** Moyen sur QR commerçant ; réduit par le seuil.
- **Test Fuji.** Harness : un QR généré avec L, `intent.counterpartyLabel='Boulangerie'`, aucune adresse dans le carnet ; attendu : `warn` `confirm_recipient_manually` au-dessus du seuil, `ok` en dessous.
- **Mapping.** ATT&CK T1656 ; D3FEND D3-IRA ; NIST CSF 2.0 PR.AT-01, DE.AE-02.

---

### F12. Carnet d'adresses empoisonné

- **Mécanisme.** Quatre voies : (a) l'utilisateur enregistre une adresse copiée depuis un historique empoisonné (F01-F03), le carnet "valide" ensuite le sosie ; (b) un malware ou une extension modifie les contacts (stockage local du wallet) ; (c) un dApp ou un partage de liste de contacts injecte une entrée ; (d) un contact légitime a changé d'adresse à son insu (compromission côté destinataire). MetaMask recommande de sauvegarder les adresses vérifiées dans Contacts (https://support.metamask.io/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams), ce qui en fait aussi une cible.
- **Incidents.** Aucun incident public chiffré trouvé **[à vérifier]**. C'est une conséquence logique de la recommandation universelle "utilise le carnet".
- **Ce que voit le moteur.** `counterparties[].relation = 'addressBook'`. Il traite la relation comme sûre.
- **Couvert.** NON : l'entrée du carnet est prise pour un fait.
- **Règle (DST-11).** Le carnet de Sentinelle est le sien, **pas** celui du wallet : il se construit à partir d'**actions confirmées** (une vérification forte à la création : retaper 4 caractères depuis une source indépendante, `verifiedAt`). Un contact créé il y a moins de 24 h ou copié sans vérification est marqué `unverified`.
```ts
if (cp.relation === 'addressBook' && cp.entry.verification === 'unverified' && thisTxUsd >= 500) warn('contact_not_verified')
if (cp.relation === 'addressBook' && cp.entry.createdAgeSec < 86400 && thisTxUsd >= 5000) warn('contact_just_added')
if (similarToAnotherContact(cp, addressBook, 6)) info('two_contacts_look_alike')
```
- **Champs.** `addressBook[].verification: 'verified'|'unverified'`, `createdAtMs`, `source: 'manual'|'imported'|'history'`.
- **Objection.** "Une vérification à la création est de la friction que personne ne fera." **Parade.** On l'impose une seule fois par contact, et on la rend facultative : pas de vérification, mais le contact reste "non vérifié" et déclenche un `warn` au-dessus d'un seuil.
- **Risque FP.** Moyen (warn au premier paiement à un nouveau contact : comportement voulu).
- **Test Fuji.** Créer un contact depuis `source: 'history'` avec L (sosie issu de F01) ; envoyer 100 tUSDC : warn `contact_not_verified`, plus critical sosie si R existe aussi.
- **Mapping.** ATT&CK **T1565.001 Stored Data Manipulation** (cas b) ; D3FEND **D3-ACH** Application Configuration Hardening **[à revérifier]** ; NIST CSF 2.0 PR.DS-01, DE.CM-09.

---

### F13. Intent sans adresse : le canal de F01-F05

- **Constat dans le code.** Dans `pay_someone`, la vérification du destinataire dépend de `intent.counterpartyAddress` (l. 241). Quand l'utilisateur colle une adresse depuis l'historique, ce champ est `undefined` et la règle n'a rien à comparer.
- **Ce que voit le moteur.** `intent.counterpartyLabel = 'Paul'` (texte libre), pas d'adresse.
- **Couvert.** NON.
- **Règle (DST-12).** Quand l'intent nomme une personne (`counterpartyLabel`) sans adresse, résoudre le nom dans le carnet : si une entrée vérifiée existe pour "Paul", `expectedAddress = entry.address` et appliquer `wrong_recipient`. Sinon traiter l'adresse comme `none` :
```ts
const expected = intent.counterpartyAddress ?? addressBook.resolve(intent.counterpartyLabel)?.address
if (expected && out.to !== expected) critical('wrong_recipient')
if (!expected) {
  const cp = byAddr(out.to)
  if (cp.relation === 'none' && thisTxUsd >= 100) warn('recipient_never_used')               // premier paiement
  if (cp.relation === 'none' && effects.shareOfBalancePct > 90) critical('all_in_to_new_recipient')
}
```
- **Champs.** `intent.recipientSource`, `addressBook.resolve(label)`.
- **Objection.** "Presque tous les destinataires sont nouveaux la première fois, donc warn partout." **Parade.** Seuils en USD, `warn` seulement, `critical` uniquement si presque tout le solde part. Mesurer le taux de warn sur le jeu de test et ajuster.
- **Risque FP.** Élevé pour le `warn` seul (premier paiement), c'est le coût de la protection. À régler par seuil.
- **Test Fuji.** `pay_someone "Paul" 10 tUSDC` vers un compte jamais utilisé : warn si ≥ seuil. Idem avec 95 % du solde : critical.
- **Mapping.** ATT&CK T1656 ; NIST CSF 2.0 DE.AE-02 ; D3FEND D3-UBA.

---

### F14. Token envoyé différent du token déclaré

- **Mécanisme.** L'intent dit "payer 100 USDC". La tx envoie un token de même symbole d'un autre contrat (faux, ou l'USDC.e bridgé alors que le destinataire attend l'USDC natif). Le montant correspond, le destinataire aussi : rien ne sonne.
- **Incidents.** Voir F03 pour les faux tokens. Pour USDC vs USDC.e sur Avalanche : problème connu des utilisateurs, aucun montant public agrégé **[à vérifier]**.
- **Ce que voit le moteur.** `outgoing[].token` (adresse) et `symbol`. `intent.token` est un symbole **ou** une adresse (`types.ts`).
- **Couvert.** NON. `checkPaySomeone` compare le montant (l. 257-273), jamais le token.
- **Règle (DST-13).**
```ts
const want = resolveToken(intent.token, effects.chainId)       // symbole ou adresse vers adresse canonique pour la chaine
for (const out of effects.outgoing)
  if (want && out.token !== want) critical('wrong_token', {said: intent.token, does: out.symbol ?? out.token})
// natif vs ERC-20 : out.token === 'native' contre want = USDC : critical
```
- **Champs.** `outgoing[].tokenCanonical: boolean`, `outgoing[].tokenAddress`, table de résolution symbole vers canonique (signal secondaire en dur, liste courte).
- **Objection.** "Les symboles sont ambigus (USDC vs USDC.e)." **Parade.** Si le symbole correspond à plusieurs contrats canoniques de la chaîne, la règle demande à l'utilisateur de choisir lors de l'intent ("USDC natif ou USDC.e ?"), puis compare à cette adresse.
- **Risque FP.** Faible si l'intent capte la variante.
- **Test Fuji.** `tUSDC` vs `tUSDC.e` : intent sur l'un, tx sur l'autre : critical.
- **Mapping.** ATT&CK T1656 ; D3FEND D3-IRA ; NIST CSF 2.0 DE.AE-02.

---

### F15. Destinataire EOA délégué EIP-7702 (sweeper)

- **Mécanisme.** Depuis Pectra (mai 2025), une EOA peut porter un code de délégation (`0xef0100 || address`). Un destinataire EOA qui a signé une délégation vers un contrat "sweeper" renvoie automatiquement tout ce qu'il reçoit vers l'attaquant. L'envoi à une EOA semble banal.
- **Incidents.** EIP-7702 : https://eips.ethereum.org/EIPS/eip-7702 (mécanisme). Les campagnes de délégation malveillante en 2025-2026 : **[à vérifier]** (aucune source primaire datée obtenue ici).
- **Ce que voit le moteur.** `eth_getCode(to)` commence par `0xef0100`.
- **Couvert.** NON (`hasDelegation` ne regarde que la délégation signée par l'utilisateur, pas celle du destinataire).
- **Règle (DST-14).**
```ts
if (cp.code?.startsWith('0xef0100')) {
  const target = '0x' + cp.code.slice(8)
  if (!trustedImplementations.has(target)) warn('recipient_is_delegated_account', {to: target})
}
```
- **Champs.** `counterparties[].delegatedTo?: 0x...`.
- **Objection.** "Les comptes 7702 légitimes (smart accounts) vont se multiplier." **Parade.** Liste blanche courte et explicite des implémentations connues, `warn` seulement ; `critical` si l'implémentation est dans une liste de sweepers connus (signal secondaire, dit).
- **Risque FP.** Croissant avec l'adoption.
- **Test Fuji.** Faire déléguer une EOA de test (compte E) vers un contrat vide ; envoyer 1 AVAX à E : `warn`.
- **Mapping.** ATT&CK : T1098 (approximatif) ; D3FEND D3-IRA ; NIST CSF 2.0 DE.AE-02.

## 5. Plan de test Fuji (checklist condensée)

Chaîne Fuji (`chainId 43113`). Pour tout ce qui concerne l'USDC de test, l'adresse publiée par Circle pour Fuji est à confirmer **[à vérifier]** ; sinon déployer un `tUSDC` OpenZeppelin v5.

| # | Scénario | Attendu |
|---|---|---|
| 1 | Zéro-valeur forgé + sosie (3,4), adresse collée | critical `lookalike` (F01) |
| 2 | Dust 0,005 + sosie (3,4) | critical (F02) |
| 3 | Faux `USDC` + sosie | critical (F03) |
| 4 | Test 1 token à R, puis 100 à sosie(R) | critical `test_then_lookalike` (F05) |
| 5 | Test à R, puis 100 à R | ok |
| 6 | Clipper simulé entre intent et tx | critical `wrong_recipient` (F06) |
| 7 | `pau1.eth` vs `paul.eth` (mock ENS) | critical (F07) |
| 8 | Dépôt `cex_deposit` sur mauvaise chaîne | critical (F08) |
| 9 | `transfer(token, 10)` / `transfer(0xdead, 10)` | critical (F09) |
| 10 | Safe sur autre chaîne, pas ici | critical (F10) |
| 11 | QR sans carnet, > seuil | warn (F11) |
| 12 | Contact créé depuis l'historique | warn (F12) |
| 13 | `pay_someone` sans adresse, destinataire nouveau | warn (F13) |
| 14 | tUSDC vs tUSDC.e | critical (F14) |
| 15 | EOA déléguée 7702 | warn (F15) |

## 6. Top 5 trous

1. **Le sosie n'est jamais calculé.** `lookalikeOf` n'est renseigné par personne, `isLookalike()` est du code mort et son seuil 4+4 rate le cas des 50 M$ de déc. 2025 (3+4). À faire : DST-01 avec la provenance de R (`tx.from == user`, jamais les événements `Transfer` forgés), seuils 6/8 de la section 3.
2. **`pay_someone` sans adresse n'a aucun contrôle de destinataire** (DST-12). C'est précisément le canal du collage depuis l'historique. Il faut résoudre le contact par nom, signaler le destinataire nouveau, et exiger un contrôle hors bande des gros envois collés (DST-05).
3. **Le test-tx ne protège pas, il arme le piège** (DST-04). Les 50 M$ de déc. 2025 sont arrivés dans l'heure qui a suivi un test à 50 USDT. Mémoriser les envois récents de l'utilisateur et alerter quand le destinataire d'un gros envoi diffère du destinataire testé, surtout s'il lui ressemble.
4. **Aucune règle sur la nature du destinataire** : contrat de token, adresse morte (DST-08), smart wallet non déployé sur la chaîne cible (DST-09, Wintermute 20 M OP), EOA déléguée (DST-14). Coût : quelques `eth_getCode`/`eth_call` ; la valeur de DST-08 est immédiate (irréversible, trivial à détecter).
5. **Le token et la chaîne ne sont pas vérifiés** (DST-13, DST-07) : faux "USDC", USDC.e à la place de l'USDC, mauvaise chaîne pour un dépôt exchange. Ajouter `intent.expectedChainId`/`expectedTokenAddress` et `outgoing[].tokenCanonical` ; la liste de tokens canoniques doit rester un signal secondaire explicite.

Autres points à signaler à Adem (hors Top 5) : seuil `NEW_CONTRACT_THRESHOLD_BLOCKS` en blocs au lieu de secondes ; `high_balance_share` ne devrait pas rester `warn` seul quand le destinataire est `receivedOnly` ou inconnu ; la boucle l. 350-354 de `buy_or_swap` est un no-op.
