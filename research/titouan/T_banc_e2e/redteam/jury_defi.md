# Jury DeFi — red team boîte noire sur Sentinelle

Juré Kryptosphère, attaque en boîte noire via `redteam/check.mjs`. Tout est synthétique :
aucune clé, aucune adresse réelle de victime, aucune action contre un système réel.

- **60 attaques** lancées, toutes `label: malveillant` / `expected_severity: critical`.
- **31 contournements** (`bypass: true` dans `jury_defi.jsonl`) : le verdict rendu est sous le seuil exigible.
  - **8 silencieux** : verdict `ok` (l'utilisateur ne voit aucune alerte).
  - **23 sous-cotés** : verdict `warn` au lieu de `critical` (noyé dans la fatigue d'alerte).
- **0 fausse alerte** sur mes cas (je n'ai pas cherché les bénins).

Rejouer : `node redteam/check.mjs redteam/jury_defi.jsonl` (dernière ligne = `{summary}`).

---

## Les familles de contournement

### A. `transferFrom` présenté comme un paiement → verdict `ok` (silencieux)
`jd-12, jd-19, jd-37, jd-38, jd-40, jd-30, jd-46, jd-54`
- L'attaque : une approbation a déjà été donnée ; on envoie un `transferFrom(victime → inconnu)` pendant que l'intention déclarée est `pay_someone`. L'effet « des fonds sortent » colle à l'intention « je paie quelqu'un », donc le comparateur intention/effets se tait.
- Verdict obtenu : `ok` (aucune raison). Même à 40 % du solde (`jd-37`), vers un sosie (`jd-12, jd-37`), ou vers une adresse empoisonnée du carnet (`jd-40`).
- Raison probable (vue de l'extérieur) : le drapeau `no_incoming` ne se déclenche que pour l'intention `buy_or_swap` (on attend un token en retour). Sous `pay_someone`, sortir des fonds est « normal » et la destination inconnue n'est pas re-challengée.

### B. Approbation illimitée noyée dans un batch (Multicall / sendCalls / aggregate) → `warn`, jamais `critical`
`jd-16, jd-17, jd-29, jd-31, jd-32, jd-33, jd-34, jd-45, jd-48`
- L'attaque : `approve(MAX)` / `increaseAllowance(MAX)` / `setApprovalForAll` enterré dans `Multicall3.aggregate3`, `aggregate`, `tryAggregate`, à toute profondeur (jusqu'à 3), sur C-Chain et Fuji.
- Verdict obtenu : `warn` (`batch_foreign_unlimited_approval`). Le même `approve(MAX)` en appel direct est `critical` (`jd-05, jd-55`).
- Raison probable : le plancher `critical` « droit illimité » n'est appliqué qu'au niveau de l'appel racine. Dès qu'un sous-appel accorde le droit, une règle dédiée le rétrograde en `warn`. La profondeur et le sélecteur du wrapper ne changent rien.

### C. Pire combinaison : `transferFrom` enterré dans un batch + intention « payer » → `ok`
`jd-30, jd-46, jd-54`
- L'attaque cumule A et B : le `transferFrom` sortant est dans un `sendCalls`/`aggregate` au milieu d'appels bénins (wrap AVAX), intention `pay_someone`.
- Verdict : `ok`, totalement silencieux.

### D. Approbation bornée vers un sosie du routeur → `warn`
`jd-02, jd-41, jd-51` (Permit2 et `approve` classique)
- L'attaque : spender = sosie du Universal Router (`0x4Dae…776dE5265` vs `0x4Dae…776d45265`), montant borné (100 USDC, 1 M USDC, 1e6…). Borné ≠ illimité, donc pas de plancher `critical`.
- Verdict : `warn` (`external_spender`). Un montant énorme mais fini suffit à vider un portefeuille modeste.
- Raison probable : le plancher `critical` cible l'illimité (MAX, ou proche de MAX — `jd-42` MAX/2 passe `critical`) ; un sosie avec montant borné ne tombe que dans `external_spender` = `warn`.

### E. `increaseAllowance` en petits pas → `warn` à chaque étape
`jd-07-0..3, jd-08`
- L'attaque : 4× `increaseAllowance(+25 USDC)` vers un inconnu/sosie ; aucun pas n'atteint le seuil illimité.
- Verdict : `warn` à chaque fois (`external_spender`). Pas de cumul d'allocation entre requêtes.

### F. Autres angles morts
- `jd-18` : `approve` dans un `Universal Router.execute` mal formé → `warn` via `decode_error` (le décodeur UR échoue au lieu de refuser par prudence).
- `jd-23` : `personal_sign` d'un blob hex ressemblant à `transferFrom` → `warn` (`blind_signature`), pas `critical`.
- `jd-49` : ordre **Blur** (`primaryType: Order`, `listingsRoot` opaque) qui cède des NFTs → `warn` (`unknown_typed_data`). Type EIP-712 inconnu = sous-coté.
- `jd-50` : token **honeypot à taxe de vente 99 %**, `approve` vers un routeur connu → `warn` seulement (pas de simulation de vente).

---

## Ce qu'un juré dirait sur scène

> « Votre barrière tient très bien l'`approve(MAX)` frontal — bravo. Mais elle raisonne sur l'appel racine
> et sur une intention déclarée *honnête*. Je l'enterre d'un cran dans un `Multicall3` et votre `critical`
> devient un `warn`. Et surtout : si je récupère une vieille allocation et que je déclare "je paie un ami",
> votre `transferFrom` qui siphonne 99 % du solde ne déclenche **rien du tout**. L'intention de l'utilisateur
> est devenue l'angle mort : l'attaquant n'a qu'à la souffler. 8 de mes 60 cas passent totalement sous le radar,
> 23 autres sont noyés dans du `warn`. »

## Les 3 pires (totalement silencieux, `ok`)
1. **`jd-46` — `transferFrom` dans un `wallet_sendCalls` + intention « payer ».** Le vol est au milieu d'appels bénins, l'intention couvre la sortie de fonds. Verdict `ok`. (Classe C — cumule les deux faiblesses structurelles.)
2. **`jd-19` / `jd-37` — `transferFrom(victime → inconnu/sosie)` sous intention `pay_someone`.** Siphonnage direct d'une allocation déjà donnée ; `ok`, aucune raison affichée. (Classe A.)
3. **`jd-40` — `transferFrom` vers une adresse empoisonnée du carnet (« mon Coinbase »), intention `send_to_my_account` détournée.** La poison-address passe pour le compte de l'utilisateur. Verdict `ok`.

## Recommandations de durcissement (côté défense)
- Appliquer le plancher `critical` « droit illimité / approval_for_all » **récursivement** à tout sous-appel de batch, quelle que soit la profondeur ou le sélecteur du wrapper.
- Ne pas laisser l'intention `pay_someone` neutraliser un `transferFrom`/sortie vers une **destination inconnue, sosie ou empoisonnée** : exiger une contrepartie connue du carnet, sinon `critical`.
- Traiter un `decode_error` / `unknown_typed_data` / `blind_signature` comme `critical` par défaut (fail-closed), pas `warn`.
- Rétrograder en `critical` une approbation bornée mais disproportionnée (montant ≫ intention déclarée) vers un spender sosie.
