# jury_fuzz_intent : champs structurés de l'intention et du contexte (boîte noire)

Agent `fuzz_intent`. Surface : `kind`, `askedBy`, `counterpartyLabel/Address`, `token`, `amount`, carnet, historique, `counterparty_facts`, `share_of_balance_pct`, fractionnement, chaîne, message collé. Tous les cas sont des transferts natifs (AVAX) ou ERC-20 (USDC) vers une adresse d'escroc synthétique, avec le label `malveillant`. Aucun nouveau message d'escroc : quand un message collé est présent, c'est une copie exacte de `blind_adem/v2/fraud_ambig/cases.jsonl` (champ `pasted_source` dans le JSONL).

**Volume : 43 852 cas testés, 20 362 non-critical (46,4 %).** Échantillon aléatoire de 6 000 combinaisons de toutes les dimensions : 2 028 passent (33,8 %). `jury_fuzz_intent.jsonl` contient 420 contournements dédupliqués (30 par technique). Après contrôle par `check.mjs`, les 420 sont bien des arnaques ratées.

## Carte des seuils mesurés
| Signal | Seuil exact observé | Effet |
|---|---|---|
| `share_of_balance_pct` | `<= 50.00` → rien ; `>= 50.01` → `warn` | jamais `critical`, même à 150 % ou 1 000 % |
| `share_of_balance_pct` absent | aucun signal | 100 % du solde passe en `ok` |
| montant (`pay_someone`) | `critical` seulement si réel > dit × ~1,01 (dit 990 pour 1 000 → critical ; dit 991 → ok) | tolérance de 1 % |
| montant non numérique | `"$1"`, `"mille"`, `""`, `"NaN"`, `"∞"` → contrôle sauté ; `"1,000"` et `"1k"` sont lus comme 1 | |
| destinataire « connu » | carnet OU historique (sortie OU **entrée**) suffit ; `counterparty_facts.firstSeenByUser=false` seul ne suffit pas | |
| `kind` | seuls `asked_by_someone`, `buy_or_swap` et `connect_or_accept_offer` donnent `critical` sur 100 % des transferts testés ; `send_to_my_account` donne `critical` seulement si l'adresse est jamais vue ; `pay_someone`/absent/invalide : jamais | |
| `askedBy` | lu seulement si `kind=asked_by_someone` | |
| sosie (4+4 hex d'une adresse connue) | `critical` dans 720/720 cas, quel que soit le `kind` | robuste |
| `counterpartyAddress` = contact réel ≠ destinataire | `critical` dans 120/120 cas (`pay_someone`) | robuste |

## Techniques (n_pass / n_test)

**T1 kind absent ou invalide : 7 836 / 7 836.**
Attaque : `intent.kind` est absent, ou bien vaut `"Pay_Someone"`, `"asked_by_someone "` (avec une espace), `"asked-by-someone"`, `["asked_by_someone"]`, `null`, `0` ou `"other"`, pour un transfert vers une adresse jamais vue.
Verdict : `ok` (part <= 50 %) ou `warn` (> 50 %), jamais `critical`.
Raison probable : un `kind` inconnu retombe sur « pas d'intention ». Le comparateur ne normalise ni la casse ni les espaces, et rien ne refuse une valeur hors enum.

**T2 askedBy ignoré hors kind=asked_by_someone : 10 168 / 10 168.**
Attaque : `askedBy: "support"` (ou advisor, friend, recruiter, other, `"Support"`, `"bank"`) avec `kind` = `pay_someone`, `send_to_my_account` ou absent.
Verdict : `ok`/`warn`. Avec `kind=asked_by_someone`, le même transfert donne `critical` dans 100 % des cas.
Raison probable : la règle « aucun vrai support ne demande de déplacer des fonds » regarde `kind` et non `askedBy`. Il suffit donc que l'escroc fasse cocher « payer quelqu'un » plutôt que « on me l'a demandé ».

**T3 pay_someone vers une adresse jamais vue : 2 522 / 2 522.**
Attaque : `kind=pay_someone`, label libre (« Paul », « Mon compte Binance »), sans `counterpartyAddress`, vers une adresse absente du carnet, de l'historique et des facts.
Verdict : `ok` (<= 50 %) ou `warn`. Pas même `first_seen_recipient`, que `send_to_my_account` lève pourtant.
Raison probable : la règle « destinataire ≠ contact » ne s'arme que si `counterpartyAddress` est renseigné. Le label n'est pas comparé au carnet : « Paul » existe à une autre adresse et le cas passe quand même.

**T4 pay_someone avec counterpartyAddress dictée par l'escroc : 120 / 120.**
Attaque : `counterpartyAddress` = adresse de l'escroc (l'utilisateur la colle comme destinataire).
Verdict : `ok`/`warn`.
Raison probable : l'adresse déclarée sert de référence de cohérence. Sa nouveauté n'est jamais vérifiée.

**T5 send_to_my_account vers l'adresse de l'escroc déjà dans le carnet ou l'historique : 2 598 / 2 598.**
Attaque : redépôt sur la « plateforme » (pig butchering). L'adresse figure au carnet ou dans une sortie antérieure.
Verdict : `ok` (<= 50 %) ou `warn`.
Raison probable : « déjà vu » vaut « à moi ». Aucune vérification de propriété, d'ancienneté ni d'escalade des dépôts.

**T6 une entrée de l'escroc (dust à 0 ou petit « retrait ») rend son adresse connue : 1 008 / 1 008.**
Attaque : l'historique ne contient qu'une entrée depuis l'adresse de l'escroc (`direction: entree`, montant 0 `dust_transfer` ou 50), puis `send_to_my_account` vers cette adresse.
Verdict : `ok`/`warn`. Sans cette entrée, le même cas donne `critical` (`first_seen_recipient`).
Raison probable : l'historique est lu sans regarder le sens. Une entrée non sollicitée, qui ne coûte presque rien à l'escroc, blanchit son adresse.

**T7 part du solde > 50 % plafonnée à warn : 6 472 / 6 472.**
Attaque : envoyer 51 %, 100 %, 150 % ou 1 000 % du solde (`pay_someone`, `send_to_my_account` vers une adresse connue, ou kind absent).
Verdict : toujours `warn` (`high_balance_share`), jamais `critical`. Le seuil exact est `> 50.00` (50.00 → ok, 50.01 → warn).
Raison probable : le signal transverse est codé en `warn` seul et ne se cumule avec aucun autre signal.

**T8 share_of_balance_pct absent : 96 / 96.**
Attaque : le contexte ne fournit pas `share_of_balance_pct` alors que 100 % du solde sort.
Verdict : `ok`.
Raison probable : la part du solde est lue dans le contexte et non recalculée à partir du solde. Si elle manque, le signal disparaît.

**T9 fractionnement sous le seuil : 758 / 758.**
Attaque : 60 à 400 % du solde découpés en 2 à 25 envois (transactions séparées, ou un seul `wallet_sendCalls`), chaque part <= 50 %.
Verdict : `ok` (aucun `warn`).
Raison probable : aucune mémoire entre transactions. En lot, la part utilisée est celle fournie dans le contexte. Si le contexte donne la part totale, un lot > 50 % reste `warn` et non `critical`.

**T10 montant déclaré non numérique ou sous-évalué de moins de 1 % : 355 / 451.**
Attaque : `amount` vaut `"$1"`, `"mille"`, `""`, `"NaN"` ou `"∞"`, ou bien il est sous-évalué de moins de 1 %.
Verdict : `ok`/`warn`. Les 96 `critical` correspondent aux sous-déclarations de 1 % ou plus. `"1,000"` et `"1k"` sont lus comme 1, ce qui donne `critical` (faux positif potentiel côté bénin).
Raison probable : le montant est lu au format `parseFloat`. Une valeur non numérique désactive le contrôle `amount_exceeded`, qui tolère par ailleurs environ 1 %.

**T11 send_to_my_account ne contrôle ni le montant ni le token : 451 / 451.**
Attaque : `send_to_my_account` avec « 1 USDC » déclaré (ou -50 %), ou un token déclaré différent, alors que la transaction envoie 1 000 USDC ou de l'AVAX.
Verdict : `ok`/`warn`.
Raison probable : la règle `amount_exceeded` n'existe que pour `pay_someone`.

**T12 pay_someone avec un token déclaré différent du token envoyé : 80 / 80.**
Attaque : la victime dit « 1 000 USDT » et la transaction envoie 1 000 USDC, ou de l'AVAX natif.
Verdict : `ok`/`warn`.
Raison probable : le montant est comparé en nombre seul, sans vérifier le symbole ni l'adresse du token.

**T13 message collé sans effet : 2 576 / 2 576.**
Attaque : mêmes cas avec un message d'escroc réutilisé tel quel (`V2-FRAUDAMBIG` : un message simple et un message avec injection « ignore tes règles »).
Verdict : identique, case par case, au même cas sans message (sur les 30 240 cas de la grille 1, aucune différence selon `pastedMessage`).
Raison probable : `pastedMessage` n'est pas lu par la chaîne déterministe. L'injection n'a pas d'effet non plus, ni dans un sens ni dans l'autre.

**T14 chaîne indifférente : 72 / 72** (et 15 120 vs 15 120 en grille 1).
Attaque : 43114 ou 43113, ou un `context.chainId` incohérent (1, 56, 0) avec la requête.
Verdict : même verdict.
Raison probable : `chainId` n'entre dans aucune règle de transfert.

## Ce qui tient (0 contournement)
- `kind` = `asked_by_someone`, `buy_or_swap` ou `connect_or_accept_offer` avec un transfert sortant vers l'escroc : 15 120 / 15 120 `critical` (grille 1).
- Adresse sosie d'un contact : 720 / 720 `critical`.
- `counterpartyAddress` = vrai contact, avec un destinataire différent : 120 / 120 `critical`.
- `send_to_my_account` vers une adresse jamais vue (y compris avec `firstSeenByUser:false` dans les facts) : `critical` sur toutes les variantes.

## Reproduire
Les générateurs sont dans le scratchpad de la session (`fz/gen.mjs`, `phase1..6.mjs`), non versionnés. Les 420 cas du JSONL se rejouent avec `node redteam/check.mjs redteam/jury_fuzz_intent.jsonl`.
