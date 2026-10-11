# Intégration des détecteurs et du contexte en direct dans le produit : résultats

Date : 11 octobre 2026. Auteur : agent d'intégration (côté Adem). Tout est rejouable avec les commandes en bas de page.

## À lire d'abord

- **V2_DEV est un jeu de RÉGLAGE** : les règles ont été écrites en le regardant. Les fichiers `jury_*` ont été produits par nos propres boucles d'attaque. **Aucun jeu aveugle n'a été passé** (V2_TEST est gelé et n'a pas été touché). Ces chiffres ne sont donc pas une mesure de généralisation.
- Seuls des fichiers existants ont été rejoués. Aucun cas d'attaque ni message d'arnaque n'a été généré.
- Règle de score du banc : une arnaque est « attrapée » seulement si l'écran est rouge (`critical`) ; une fausse alerte est une opération honnête en rouge.
- Le moteur (`engine/`, `run/`, `server/`) a changé plusieurs fois pendant la mesure (autre propriétaire). Les chiffres ci-dessous sont ceux de l'état du dépôt à la fin de ce travail ; ils diffèrent de quelques unités des relevés intermédiaires.

## Ce qui est livré

| Fichier | Rôle |
|---|---|
| `pipeline/evaluate_plus.mjs` | `evaluatePlus(body, local, options)` : verdict du produit, puis contexte enrichi, puis détecteurs, puis textes cohérents. Noyau sans import Node (`makeEvaluatePlus(deps)`) pour l'extension. |
| `pipeline/known_protocols.json` | Liste publique de protocoles connus par chaîne, chaque adresse avec sa source primaire. |
| `pipeline/measure.mjs` | Rejeu des fichiers par le produit et par `evaluatePlus` (colonnes du tableau). |
| `pipeline/parity.mjs` | Compare `evaluatePlus` à `redteam/check_plus.mjs` à faits égaux. |
| `pipeline/test/evaluate_plus.test.mjs` | 13 tests (`node --test pipeline/test/*.test.mjs`), tous verts. |
| `pipeline/server_integration.diff` | Branchement de `POST /check`. **Déjà appliqué par le propriétaire du serveur** (commit 5c1df06) ; conservé pour mémoire. |
| `detectors_adem/forwarded_value.mjs` (nouveau), `detectors_adem/intent_guard.mjs` (modifié) | Voir « Changements de règles ». |

Activé par défaut : détecteurs (`HOLDUP_DETECTORS=0` pour couper), liste publique de protocoles (`knownProtocols: false` pour couper), contexte en direct **dès qu'un RPC est configuré** (`SENTINELLE_RPC_URL` ou `HOLDUP_RPC_URL` ; `SENTINELLE_LIVE=0` le coupe, `=1` l'active sur le RPC public ; budget `SENTINELLE_LIVE_BUDGET_MS`, 1500 ms). `HOLDUP_PLUS=0` rend le verdict du produit seul. Le détecteur de message collé reste éteint tant que `HOLDUP_CLASSIFIER` n'est pas défini.

Ligne d'import pour le RPC de garde et le lab :

```js
import { evaluatePlus } from '<chemin>/research/titouan/T_banc_e2e/pipeline/evaluate_plus.mjs';
const v = await evaluatePlus(body, local, { live: true /* ou les faits déjà lus, forme toEngineContext */, intent /* objet Intent complet, optionnel */ });
// v = même forme que evaluate() + v.plus { path, level, base, product, raisedBy, loweredBy, relaxedByFacts, facts, missingFacts, notVerified, errors, ms }
```

Pour l'extension (service worker) : `import { makeEvaluatePlus } from './pipeline/evaluate_plus.mjs'` puis `makeEvaluatePlus({ evaluate, E, compare, applyExtraRules, analyzeChainRequest, applyPolicy, mergeEffects, present, scenarioFiche, findPressure, buildTexts, buildSecours, fiches, SECOURS_TITRE, TITRE_NON_VERIFIE, DETECTORS, knownProtocols })`. Attention : `detectors_adem/pasted_message.mjs`, `fork_sim.mjs` et `sig_rights.mjs` utilisent `node:path`, `process.env` et `Buffer` ; ils ne tournent pas tels quels dans un service worker.

## Tableau avant / après (comptes bruts)

6 191 arnaques et 2 695 opérations honnêtes (V2_DEV + 9 fichiers `jury_*`, 9 908 cas dont 1 022 sans étiquette binaire).

Ce que reçoit le produit dans toutes les colonnes sauf la dernière : la requête, l'origine, la chaîne, le compte, le carnet et l'historique. **Pas** la liste de protocoles du cas, **pas** l'intention déclarée.

| Colonne | Arnaques ratées | Fausses alertes | Latence p50 / p95 (ms) |
|---|---|---|---|
| Produit seul (`evaluate`) | 3 643 | 440 | 0,06 / 2,2 |
| Produit + détecteurs, sans liste, sans fait de chaîne | 1 453 | 556 | 0,22 / 4,5 |
| + faits « comme en direct », sans liste | 971 | 720 | 0,33 / 4,6 |
| **evaluatePlus tel que livré** (détecteurs + faits + liste publique) | **971** | **684** | 0,32 / 4,5 |
| Hypothèse : liste de protocoles tirée des cas (borne haute, non livrable) | 1 147 | 198 | 0,35 / 4,7 |
| Banc à faits égaux (`full`, tout le contexte du cas + intention complète) | 844 | 320 | 0,33 / 4,5 |

Sur V2_DEV seul (2 930 arnaques, 1 976 honnêtes) : produit seul 901 / 265 ; **tel que livré 211 / 418** ; avec la liste tirée des cas 200 / 0 ; banc à faits égaux 21 / 20.

Par fichier, colonne « tel que livré » contre « produit seul » (ratées, puis fausses alertes) : jury_defi 34 → 18 ; jury_fuzz_control 360 → 8 ; jury_fuzz_encoding 940 → 211 ; jury_fuzz_sig 634 → 0 ; jury_social 55 → 37 ; jury_fuzz_address 299 → 140 (fausses alertes 0 → 6) ; jury_fuzz_intent 420 → 346 ; jury_fp 27 → 27 fausses alertes ; jury_fuzz_fp 143 → 228 fausses alertes.

**Chiffre à donner à un jury pour « le produit tel que montré »**, sur jeu de réglage et fichiers maison, sans jeu aveugle : rappel 84,3 % (5 220 sur 6 191), fausses alertes 25,4 % (684 sur 2 695), contre 41,2 % et 16,3 % pour le produit seul. Sur V2_DEV seul : 92,8 % et 21,2 %. Le taux de fausses alertes reste le point faible ; la borne haute avec une vraie liste de protocoles est 7,3 % (198 sur 2 695).

Latence : la colonne mesure le calcul local. Premier appel du processus : environ 2 s (chargement paresseux du comparateur par un détecteur), d'où un appel de chauffe au démarrage. Le coût réseau du contexte en direct n'a pas été mesuré par moi : `context_live/evidence/latency.json` (autre agent) donne p50 71 ms et p95 193 ms à froid sur le RPC public d'Avalanche, dans un budget de 1 500 ms ; au-delà, le verdict est rendu sur ce qui est connu et `plus.missingFacts` dit ce qui n'a pas été vérifié (testé : RPC muet, budget 80 ms, réponse en moins de 300 ms).

Faits « comme en direct » : uniquement pour les adresses que `provider.extractTargets()` irait lire (8 adresses, 4 jetons) : contrat ou non, âge, symbole et décimales, déjà payé ou non. Le solde est approché par la part du solde du cas chaque fois qu'elle est donnée, ce qui est un peu plus généreux que le fournisseur réel. `redteam/check_product.mjs` n'a pas pu être réutilisé pour ces colonnes : il reconstruit le produit à partir d'un diff qui ne s'applique plus au serveur actuel ; `pipeline/measure.mjs` suit la même convention d'entrée et retrouve ses chiffres pour le produit seul.

## Parité avec le banc

`node pipeline/parity.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl` : la référence est `check_plus.mjs` lui-même, lancé en sous-processus. À faits égaux, **9 878 verdicts identiques sur 9 908**. Les 30 écarts sont tous des opérations honnêtes où `evaluatePlus` est moins sévère, pour une cause connue :

- 14 : le produit connaît toujours 5 contrats publics (Permit2, Multicall3, CoW, Seaport 1.6, Safe MultiSend), pas le banc (12 achats Seaport, 1 ordre CoW, 1 approbation) ;
- 16 : le contrat appelé est dans la liste publique (`sAVAX`, `SwapRouter02`), que le cas de banc ne liste pas.

Aucun écart inexpliqué, aucun où `evaluatePlus` est plus faible sur une arnaque. Dérive entre la chaîne rejouée dans `pipeline/` et `evaluate()` quand aucun fait n'est ajouté : 0 cas sur 9 908.

## Changements de règles, un par un

Règle de décision demandée : garder un changement seulement si les fausses alertes baissent sans que les arnaques ratées montent. Totaux sur tous les fichiers, colonne « faits comme en direct ».

| Changement | Avant (ratées / fausses alertes) | Après | Décision |
|---|---|---|---|
| Liste publique de protocoles (7 adresses vérifiées) | 971 / 720 | 971 / 684 | **Gardé.** |
| Nouveau détecteur `forwarded_value` (valeur native qui transite par un relais) | inchangé sur les fichiers | inchangé ; lab : voir plus bas | **Gardé** (aucun effet sur les fichiers, 18 arrêts de plus sur le lab, 0 fausse alerte). |
| `kind_missing_unvouched_recipient` : de rouge à orange, et levé aussi pour un type d'intention sans destinataire | 593 / 1 127 | 971 / 720 | **Appliqué, mais ne respecte pas la règle** : voir ci-dessous. |
| Même drapeau, laissé rouge mais étendu au type sans détail (invariant seul) | 593 / 1 127 ; banc 832 / 327 | 593 / 1 127 ; avec réponse à la question 593 / 1 191 ; banc 830 / 365 | Rejeté (fausses alertes en hausse). |
| `intent_guard` : ne pas traiter comme un paiement la valeur jointe à un appel de contrat qui rend quelque chose | 593 / 1 127 | 643 / 1 081 | Rejeté et annulé (ratées en hausse). |
| Idem sans exiger de contrepartie | 593 / 1 127 | 812 / 725 | Rejeté et annulé. |
| Table de jetons de référence exposée même sans contexte en direct | 716 / 1 137 | 719 / 1 109, et 13 cas où la chaîne s'écarte du produit | Rejeté. |
| Option `intentPremise: 'warn'` (plafonne à orange les drapeaux qui supposent une intention, quand aucune n'est déclarée) | 593 / 1 127 | 1 011 / 685 | Disponible, éteinte par défaut. |

### Le drapeau `kind_missing_unvouched_recipient`

Mesuré isolément : à lui seul il faisait 422 des 1 122 fausses alertes de la chaîne livrée, et il « attrapait » 378 arnaques. Il n'existe **aucune** version qui baisse les fausses alertes sans faire monter les ratées, et ce n'est pas un défaut de réglage : ce drapeau passe au rouge tout premier envoi vers une adresse jamais payée quand aucun type d'intention n'est donné. Les arnaques qu'il attrape sont des envois simples vers une adresse neuve, **identiques octet pour octet à un premier paiement honnête**. Aucune règle de structure ne les sépare ; seule l'intention écrite ou le message collé le peut.

Il a été passé à orange par défaut pour trois raisons : c'est la première source de fausses alertes ; il disparaissait dès qu'un type d'intention était déclaré, donc **répondre à la question abaissait le verdict** (479 cas, c'est l'anomalie signalée) ; et la détection « adresse jamais vue » est déjà faite par le portefeuille (décision D-009). Le coût est écrit en clair : 378 arnaques de plus comptées ratées (elles restent signalées en orange). Retour à l'ancien comportement : `HOLDUP_IG_KM=critical` (et `HOLDUP_IG_BARE=0` pour l'ancienne condition).

## Intention écrite contre effet réel

**Invariant « ajouter de l'information d'intention n'abaisse jamais le verdict ».** Cause de l'anomalie : une seule règle, dans `detectors_adem/intent_guard.mjs` (règle 5), qui ne se déclenchait que si le type d'intention manquait. Aucun chemin du comparateur ni de la politique n'abaisse sur un type nu. Après correction : **0 cas sur 9 908** où une réponse sans détail (« je paie », « je reçois », « je me connecte », « on me l'a demandé ») abaisse le verdict, avec ou sans faits de chaîne ; test ajouté (320 cas × 4 réponses).

Une intention **détaillée** abaisse encore le verdict dans 258 cas, tous de deux sortes voulues : 180 où l'utilisateur déclare un échange et où l'effet est bien un échange (grosse part du solde vers un routeur, signature de droit pour le routeur) ; 78 où l'utilisateur nomme lui-même l'adresse payée. C'est la réponse « conforme » du produit, pas une faiblesse ; elle doit rester.

**Famille « écart d'intention » sur les fichiers existants** (`jury_fuzz_intent`, 420 arnaques ordinaires pour un portefeuille mais contraires à l'intention) : sans intention 346 ratées ; avec le type seul 346 ; **avec l'intention détaillée 282** ; banc complet 276. Motifs levés : jeton différent (`token_mismatch`), montant supérieur (`amount_exceeded_robust`), destinataire autre que le nom du carnet (`recipient_not_label`), gros envoi vers un destinataire neuf. Deux tiers restent ratés : c'est la famille à travailler en priorité.

**Côté honnête** : donner l'intention détaillée fait passer les fausses alertes de 684 à 772 au total, et de 228 à 313 sur `jury_fuzz_fp`. Des opérations honnêtes sont donc répondues « écart » à tort (virgule décimale française, approbation plafonnée d'abonnement, dépôt ou prêt que le comparateur ne sait pas nommer). Non corrigé ici.

**Non fait** : la mesure de l'analyseur par mots-clés (`extension/keyword_intent.js`, `engine/vendor/parseIntent.ts`) sur les textes libres des jeux ; le rejeu du lab avec une intention forcée par scénario.

## Lab (exécution réelle sur une copie locale d'Avalanche)

Mesuré sur un lab jetable lancé à part (ports 8580 à 8582), sans toucher à celui qui tourne. La colonne « avec détecteurs » du lab est sa propre copie de la chaîne du banc ; elle n'appelle pas encore `evaluatePlus`.

| | Catalogue (18 attaques, 15 honnêtes) : arrêtées / ratées / fausses alertes | Balayage (447 essais, 199 attaques qui marchent) : arrêtées / ratées / fausses alertes |
|---|---|---|
| Produit seul | 14 / 2 / 0 | 139 / 60 / 0 |
| Avec détecteurs, avant | 16 / 0 / 1 | 167 / 32 / 0 |
| + `forwarded_value` | 16 / 0 / 1 | 185 / 14 / 0 |
| État final (+ drapeau en orange) | 15 / 1 / 0 | 177 / 22 / 0 |

- Les 18 arrêts gagnés sont les envois d'AVAX enveloppés dans Multicall3 (profondeur 2 et 3, y compris vers le sosie d'un contact), qui ne levaient aucune alerte.
- La fausse alerte du catalogue (`wallet-send-new-merchant`) et l'arrêt de `wallet-send-support` venaient du **même** drapeau : les deux demandes sont identiques. En orange, la fausse alerte disparaît et l'attaque redevient « avertie seulement ».
- Les 22 ratés restants sont tous des envois directs vers une adresse neuve, tous avertis en orange, aucun silencieux. L'approbation du solde exact et l'échange sans minimum par un routeur inconnu sont arrêtés.
- Envoi de tout le solde vers une adresse neuve : la règle existe (`new_recipient_large_share`, plus de la moitié du solde) mais la seconde colonne du lab ne reçoit pas le solde. Avec `evaluatePlus` et le contexte en direct, le solde est lu.

## Ce qui reste

1. Liste de protocoles : 7 adresses seulement. Les routeurs LFJ / Trader Joe, Pangolin, Benqi (marchés de prêt), le pont Avalanche et Stargate manquent, faute d'avoir pu lire leur source primaire (docs.lfj.gg a répondu 403). C'est le premier levier sur les fausses alertes (684 → jusqu'à 198).
2. Les fausses alertes de structure listées au départ ne sont **pas** traitées : virgule décimale française, vrai contact signalé à cause d'une poussière, RPC officiel de Fuji, première mise en vente de NFT, fonctions `swap*AVAX` non décodées, approbations plafonnées d'abonnement, types d'intention dépôt / prêt / pont / staking.
3. Brancher le RPC de garde et le lab sur `evaluatePlus` (ligne d'import ci-dessus) ; l'extension autonome sur `makeEvaluatePlus`.
4. Mesure de l'analyseur de texte libre et rejeu du lab avec intentions forcées.
5. Un jeu aveugle.

## Rejouer

```
node --test pipeline/test/*.test.mjs
node pipeline/measure.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl --modes=product,detectors+nolist,live+nolist,live,live+details,live+known,full
node pipeline/parity.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl
node pipeline/measure.mjs <fichier> --modes=live --fails=live      # détail des ratés et fausses alertes d'une colonne
```
