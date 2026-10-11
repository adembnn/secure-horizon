# CONTEXTE_PRODUIT : ce que le banc fournit aux règles, et ce que le produit voit vraiment

Établi par lecture seule de `run/run_loop.mjs` (`buildCtx`), `server/server.mjs` (`loadLocalContext`, `buildCtx`, `evaluate`), `extension_standalone/src/sentinelle_core.js` (même `buildCtx`, CSP `connect-src 'none'`) et des champs que lisent réellement `engine/src/*.mjs` (version mesurée : voir `out/versions.json`, copie dans `snapshot/`). Les trois niveaux de `run_realiste.mjs` s'appuient sur ce tableau.

Légende des colonnes « produit » : OUI = fourni sans rien configurer ; OPTIONS = seulement si l'utilisateur le saisit dans les options (`context.local.json` côté serveur, `chrome.storage.local.contexte` côté extension autonome) ; NON = aucune source dans le produit ; RPC = ne peut être obtenu qu'avec le réseau.

## 1. Champs de contexte lus par le moteur

| champ de contexte (ce que lit le moteur) | règles qui en dépendent | vu par le BANC (`buildCtx`) | vu par le PRODUIT (serveur local = extension autonome) | niveau A / B / C | lecture réseau minimale qui le rétablirait |
|---|---|---|---|---|---|
| `chainId` | `domain_chain_mismatch`, `siwe_chain_mismatch`, `domain_without_chainid`, changement de réseau | `context.chainId` du cas | OUI : chaîne du portefeuille ou `params[0].chainId` | A oui (dans la requête) / B oui / C oui | aucune |
| `from` | presque toutes (sortie, acteur, soi-même) | `context.victim` | OUI : `body.from` ou `params[0].from` | oui partout | aucune |
| `now` | `far_expiry`, ancienneté des entrées d'historique, sosies | `intent.declaredAt` (date figée) | OUI : `Date.now()` | oui | aucune |
| `origin` | `siwe_domain_mismatch`, `verifier_not_expected_for_origin`, `origin_non_ascii` | `context.origin` brut | OUI : origine de la page (URL), passée en nom d'hôte Unicode dans `_k.origin` | A non / B oui / C oui | aucune |
| `claimed_site` | `site_origin_mismatch` (sosie de domaine, faux frontend) | `context.claimed_site` : ce que la victime croit visiter | NON : rien dans le produit ne sait quel site l'utilisateur pense visiter | A, B, C non | pas une lecture réseau : demande utilisateur (liste de ses sites habituels) |
| `ens` (`typed_name`, `intended_name`) | `ens_name_lookalike` | `context.ens` | NON | non | résolution ENS possible par RPC, mais le « nom voulu » ne vient que de l'utilisateur |
| `knownSpenders`, `knownVerifiers` (protocoles connus) | gravité de `unlimited_allowance`, `external_spender`, `approval_for_all` ; F1, F2, F3, F4, F13, F15, F16 de la politique ; décodage des appels de protocoles (`libraryCalls`) ; `swap_recipient_not_self` | `context.known_protocols` : 17 entrées (5 réelles + 12 synthétiques « S ») en DEV, jusqu'à 19 adresses réelles Avalanche en V2 | 5 adresses canoniques codées en dur (Permit2, Multicall3, CoW, Seaport 1.6, Safe MultiSendCallOnly) + `knownSpenders` saisis | A aucun / B 5 / C 5 (+ rien) | aucune : c'est une liste statique à livrer avec le produit (niveau D de la mesure) |
| `contacts` | `lookalike_address`, `address_poisoning`, `first_seen_recipient`, `service_beneficiary_not_self` | `context.address_book` | OPTIONS (vide par défaut) | A non / B vide / C oui | aucune (mais voir « historique local automatique » en conclusion) |
| `history` | `firstSeenByUser`, `address_poisoning` (adresse déjà payée), F15, F22, F23 | `context.history` (sorties ET poussière entrante) | OPTIONS ; le produit n'enregistre rien lui-même (aucun code n'écrit d'historique, seul un journal de verdicts existe) | A non / B vide / C sorties du catalogue | l'historique entrant (poussière) demande un indexeur ou `eth_getLogs` : hors lecture minimale |
| `protected` (autres adresses de l'utilisateur) | acteurs : une destination « soi-même » n'est pas une contrepartie | non fourni par le banc | OPTIONS | non | aucune |
| `tokenMeta` (symbole, décimales) | montants affichés, seuil « négligeable » 1e-4 unité, `order_min_out_absurd` | `token_registry` + `token_info` du cas | 4 jetons Ethereum (USDC, USDT, DAI, WETH) + les jetons par défaut du moteur (8 plus la monnaie native, dont USDC, USDt, WAVAX d’Avalanche) ; tout autre jeton : symbole inconnu, décimales 18 par défaut | A défaut du moteur / B 4 jetons / C idem | `symbol()` et `decimals()` : 2 `eth_call` par jeton inconnu |
| `codeOf` (contrat ou compte externe) | `approval_to_eoa` (critical), mention « nature inconnue », `isContractKnown` | `counterparty_facts.isContract` + tout ce qui est dans les listes du catalogue | vrai pour les adresses connues et les 4 jetons, `undefined` pour le reste ; jamais `false`, donc `approval_to_eoa` ne peut pas se déclencher | A/B/C : `undefined` | `eth_getCode(adresse)` : 1 appel par contrepartie |
| `ageBlocks` | `new_contract` (warn), `permit_new_contract` | `counterparty_facts.ageBlocks`, `token_info.ageBlocks` | NON : `{}` toujours | A/B/C absent | pas une lecture simple : `eth_getCode` à un bloc ancien (nœud archive) = 1 sonde, 20 à 25 appels pour la date exacte, ou API d'explorateur |
| solde (`balances`, `share_of_balance_pct`) | `high_balance_share` (plancher et comparateur), F15 | `context.share_of_balance_pct` | NON | absent | `eth_getBalance(utilisateur)` ou `balanceOf(utilisateur)` : 1 appel par monnaie sortante, et l'adresse de l'utilisateur sort de la machine |
| `expectedOut` (cotation) | `slippage_high` | `context.quote.expected_out_units` | NON | absent | `eth_call` au quoter du DEX : spécifique à chaque routeur, pas minimal |
| `_k.token_info` : `sell_simulation`, `buy_tax_pct`, `sell_tax_pct`, `liquidityUsd` | `token_unsellable`, `token_sell_tax_extreme`, `token_tax_high` | `context.token_info` | NON | absent | simulation de vente (`eth_call` avec surcharge d'état, ou service tiers) : plusieurs appels, pas une lecture simple |
| `_k.token_registry` (référence symbole -> adresse canonique) | `token_symbol_impersonation`, cible de confiance de `libraryCalls` | `context.token_registry` | NON | absent | liste statique livrée + `symbol()` du jeton rencontré |
| `_facts[adresse].lookalikeOf` (signalement de sosie par un fournisseur) | `lookalike_reported` (F21, règle récente du moteur) | `counterparty_facts.lookalikeOf` (897 cas V2 le portent) | NON : `_facts` toujours vide | absent | pas du RPC : surveillance du presse-papiers ou indexeur |
| `expectedSafe`, `originAllowlist`, `legacySafe`, `receipt` | Safe attendu, liste d'origines, reçu | jamais fournis | jamais fournis | absents | sans objet |

Champs du catalogue **ignorés par le moteur** (présents dans les cas, aucune règle ne les lit) : `native_balance_eth`, `victim.persona`, `origin_kind`, `nft_holdings`, `permit2_prior_approvals`, `domain_facts`, `preceding_requests`, `balances_hint`, `chain_known_to_wallet`, `typed_data_expected_contract`, `decoded_message`, `page_dom_excerpt`, etc. (vérifié par recherche textuelle dans `engine/src` et `run/policy.mjs`).

## 2. Intention : ce que le produit sait exprimer

| | banc (`intention_mensongere`) | produit (`server.mjs toIntent`) |
|---|---|---|
| nature | 5 `kind` : `pay_someone`, `connect_or_accept_offer`, `buy_or_swap`, `send_to_my_account`, `asked_by_someone` | 3 `kind` : `pay` -> `pay_someone` ; `receive` / `login` -> `connect_or_accept_offer` ; `asked` -> `asked_by_someone` ; `other` ou rien -> aucune intention (plancher seul) |
| précisions | jeton, montant, destinataire, libellé, message collé | aucune (seulement un texte libre facultatif) |

Conséquence : `buy_or_swap` et `send_to_my_account` n'existent pas dans le produit. Le bras `intention_produit` de `run_realiste.mjs` réduit l'intention du catalogue à ce que le produit peut dire, et c'est lui qui représente le mieux les conditions réelles.

## 3. Ce que le banc ne mesure pas du tout (propres au produit)

- Détection de pression sur le texte de la page (`findPressure`, bascule en « manipulation » critical) : le banc n'a pas de texte de page (le `pastedMessage` du catalogue est un message de messagerie que l'extension ne voit pas).
- Règle propre au serveur `seaportCrit` (ordre Seaport à prix quasi nul), ajoutée à `server.evaluate` et absente du pipeline du banc.
- Règle de l'extension « intention vague => danger » (`background.js`).
- Présentation (fiches, textes) et friction.

## 4. Les niveaux de contexte de `run_realiste.mjs`

| niveau | contenu |
|---|---|
| FULL | banc complet : tout le champ `context` du catalogue |
| A | aucun contexte (ni origine, ni liste connue, ni carnet) ; il reste `from` et la chaîne, qui sont dans la requête |
| B | produit, configuration par défaut : origine, chaîne, 5 adresses canoniques, 4 jetons, carnet et historique vides |
| C | B + carnet d'adresses et historique SORTANT du catalogue saisis dans les options |
| C_hist | C + historique entrant (poussière) : sensibilité, l'utilisateur ne peut pas le saisir sans l'avoir vu |
| D | C + liste statique livrée (protocoles connus et jetons de référence du catalogue) : borne haute |
| S_code, S_age, S_tok, S_bal, S_look, S_site, S_sim, S_quote | C + un seul champ de plus (ablation) |
| O1 à O4 | C + lectures en ligne cumulées : `eth_getCode`, puis âge, puis `symbol/decimals`, puis soldes |
| D_O4 | D + O4 |
| ALL | tout reconstruit par le chemin « produit » : auto-contrôle, égal à FULL sur 6456 cas sur 6456 |
