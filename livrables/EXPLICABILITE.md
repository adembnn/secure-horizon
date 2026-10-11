# Explicabilité : comment un auditeur vérifie une décision de Hold up

Rédigé le 11 oct. 2026. Tout ce qui suit a été exécuté sur un journal produit en local par le serveur du produit (`research/titouan/T_banc_e2e/server/server.mjs`, données synthétiques, aucun réseau). Le script d'audit est `research/demo_reelle/audit/verify_decision.mjs` ; le journal d'exemple et les six requêtes qui l'ont produit sont dans `research/demo_reelle/audit/sample/`.

## 1. Ce que le journal garde

Une ligne par verdict, sur le disque de l'utilisateur ou de la plateforme qui intègre le moteur. Exemple réel (ligne 1, le Permit illimité derrière une fausse demande de remboursement) :

```
seq 1 | ts 2026-10-11T02:40:14.655Z | prev 000...0 | hash 264cc99b91f3ca90...
entry: type verdict | origin https://remboursement-avax-support.example | method eth_signTypedData_v4
       level manipulation | niveau critical | fiche F27
       codes [unlimited_allowance, external_spender, far_expiry] | latency_ms 13.1
       params_sha256 6f85d49e484431a6...
```

Le hachage de ligne est `sha256(prev | seq | ts | JSON(entry))`. Le journal garde le niveau, la fiche affichée, les codes de règle, la méthode, l'origine, la latence et l'empreinte des paramètres. Il ne garde pas la requête (minimisation voulue : aucune adresse ni texte libre en clair).

La porte 2 (RPC de garde, `research/demo_reelle/rpc_garde/proxy.mjs`) utilise le même mécanisme et écrit en plus le hachage de la transaction, l'expéditeur, le destinataire, l'issue (`pass`, `hold`, `refused`) et la décision de la personne (`continue`, `cancel`, `expire`, avec le temps attendu en ms).

## 2. Le parcours d'un auditeur, pour une décision

Commande (lignes 1 et 4 de l'exemple) :

```
node research/demo_reelle/audit/verify_decision.mjs --journal sample/journal.jsonl --seq 1 \
     --request sample/requests/01-permit-fake-reward.json --context sample/context.json --selftest
```

Étapes et sortie réelle (extraits, `OK` = vérification passée) :

1. Recalcul de la chaîne, avec un code indépendant de celui du serveur, puis recoupement avec `verifyJournal` du serveur.
   `OK chaine de hachage recalculee (sha256, code independant) | 6 lignes, tete 03ce4f75fc02ffc4...`
   `OK meme conclusion que verifyJournal du serveur | 6 lignes`
2. Racine de Merkle du journal et preuve d'inclusion de la ligne, même convention que `anchor/merkle.mjs`.
   `racine 0xbaef63f90cab997e4bb8c399f88d1c5e0a2e5cc29fbec483f068935330e0d5a8`
   `OK preuve d'inclusion de la ligne 1 (3 hachages freres) | recalculable sans les autres lignes`
   Avec `--anchor-root 0x...` ou `--contract 0x... [--rpc ...]`, le script compare cette racine à celle écrite sur la chaîne. Aucun ancrage n'existe encore dans le repo : le script écrit « Ancrage on-chain : non verifie » et rappelle qu'une réécriture complète reste possible.
3. Rejeu : la requête fournie est liée à la ligne, puis le moteur du produit (`evaluate`, importé sans modification) est relancé avec l'horloge réglée sur l'heure de la ligne.
   `OK sha256(params) = params_sha256 de la ligne`
   `OK determinisme : deux rejeux donnent exactement le meme verdict complet (hors latence)`
   `OK niveau rejoue = niveau journalise | manipulation/critical vs manipulation/critical`
   `OK fiche rejouee = fiche journalisee | F27 vs F27`
   `OK codes de regle rejoues = codes journalises | [unlimited_allowance,external_spender,far_expiry]`
   Même résultat pour la ligne 4 (envoi vers une adresse sosie : `lookalike_address`, fiche F13, niveau danger).
4. Quelle règle a produit quelle raison, avec le fichier source et la ligne :
   ```
   - unlimited_allowance  [critical] engine/src/rules.mjs:63   droit illimité sur 0x5425...bc65 pour 0x7777...7777
   - external_spender     [warn]     engine/src/rules.mjs:67   bénéficiaire hors liste connue
   - far_expiry           [warn]     engine/src/rules.mjs:69   échéance du droit dans plus d'un an
   - NIVEAU "manipulation": produit par findPressure() (server/server.mjs:181), citation "Reclamez votre remboursement. ..."
   ```
   Puis les quatre lignes lues par la personne (« Tu crois / En vrai / Danger / Action »), telles que le moteur les produit.
5. Auto-test sur une copie temporaire du journal (`--selftest`) :
   `OK     ligne 1 modifiee (niveau change) : detectee | ligne 1, contenu modifie`
   `OK     une ligne supprimee au milieu : detectee | ligne 2`
   `LIMITE derniere ligne supprimee : chaine seule NON detectee ; la racine de Merkle change (0xbaef63f90c... -> 0x0246f03c92...), donc un ancrage anterieur la detecterait`
   `LIMITE journal entierement recalcule apres modification : chaine VALIDE ; racine differente de l'originale : seul un ancrage externe de l'originale la distingue`
   Dernière ligne du script : `RESULTAT : toutes les verifications demandees passent.` (code de sortie 0).

Contre-épreuve. Si l'on présente à la ligne 1 la requête n° 2 (même Permit, sans le texte de page « support, urgent »), le contrôle de hachage passe (les deux requêtes ont les mêmes paramètres : `6f85d49e...`) mais le rejeu échoue :
`ECHEC niveau rejoue = niveau journalise | danger/critical vs manipulation/critical`
`ECHEC fiche rejouee = fiche journalisee | F02 vs F27` (code de sortie 1).
Le rejeu a donc découvert qu'on lui présentait une autre requête que celle jugée, ce que le hachage seul n'aurait pas montré.

## 3. Ce que l'auditeur peut et ne peut pas faire aujourd'hui

| Question de l'auditeur | Réponse aujourd'hui | Preuve |
|---|---|---|
| La ligne a-t-elle été modifiée, ou une ligne retirée au milieu ? | Oui, détecté | auto-test, lignes 1 et 2 |
| La dernière ligne a-t-elle été retirée ? Le journal a-t-il été réécrit en entier ? | Non par la chaîne seule. Oui par comparaison à une racine ancrée avant coup. Aucun ancrage Fuji n'existe encore dans le repo (`blockchain/DEPLOYMENTS.md` est vide). | auto-test, deux lignes LIMITE |
| Quelle règle a produit quel avertissement ? | Oui pour les codes, avec fichier et ligne. Non pour le niveau « manipulation », qui vient d'un test de mots-clés sur le texte de page et n'est pas un code du journal. | étape 4 |
| Le même verdict ressort-il si l'on rejoue ? | Oui, si on lui remet la requête complète, le contexte local et la même version du code. Le moteur est déterministe : deux rejeux identiques par décision, et les six décisions du journal d'exemple rejouées avec même niveau, fiche et codes (6 sur 6, neuf contrôles passés chacune). | étape 3 |
| Peut-on rejouer à partir du journal seul ? | Non. Le journal ne garde que `sha256(params)`. Il ne suffit pas à reconstituer la requête, et il ne lie pas le texte de page, l'intention, la chaîne, l'expéditeur, le contexte local, l'heure de référence ni la version des règles. | lignes 1 et 2 : mêmes `params_sha256`, deux verdicts différents |
| Quelle version des règles a jugé ? | Inconnue. L'empreinte du code de décision se calcule (`f30cf33c943ea98f...` sur 20 fichiers) mais n'est pas écrite dans la ligne. Celle de `COUVERTURE.md` (`f952f3fb298f`) ne couvre que `rules.mjs` et `compare.ts`. | sortie du script |
| Qu'a fait la personne après l'avertissement ? | Porte 2 : oui (`rpc_decision`, avec le temps attendu). Porte 1 : seulement si l'extension envoie son journal au serveur (`/log`). | `proxy.mjs` lignes 338 à 370 ; `server.mjs` lignes 517 à 521 |

Deux écarts de conception à connaître avant de dire « un auditeur vérifie » :

- Il existe deux formats de journal incompatibles. Le serveur écrit du sha256 sur `JSON.stringify` (`server.mjs`). L'outil d'ancrage (`anchor/journal.mjs`, `anchor_now.mjs`) attend un autre format : keccak sur JSON canonique, avec `rulesVersion`, `modelVersion`, `effectHash` et `decision`. `anchor_now.mjs` refuse un journal qui n'est pas dans son format. Aujourd'hui, le journal que le produit écrit ne peut donc pas être ancré tel quel par l'outil existant. Mon script calcule une racine sur les hachages de ligne du serveur avec l'arbre de `merkle.mjs`, ce qui montre que le pont est faisable sans rien ajouter au contrat.
- La date de référence du moteur est l'horloge (`Date.now`). Le script règle l'horloge sur l'heure de la ligne, qui est écrite quelques millisecondes après le jugement. Une règle sensible à la seconde pourrait différer ; aucune des règles exercées ici ne l'est.

## 4. Correctif minimal proposé (non appliqué : `server.mjs` n'est pas à moi)

Dans l'entrée de verdict de `server.mjs` (autour de la ligne 528), ajouter quatre champs et un code :

```js
const inputCanon = JSON.stringify({ method: body.method ?? null, params: body.params ?? null, origin: body.origin ?? null,
  chainId: body.chainId ?? null, from: body.from ?? null, pageText: String(body.pageText || '').slice(0, 4000),
  intent: body.intent ?? null, intent_text: String(body.intent_text || '').slice(0, 500) });
journal.append({ ...entry,
  input_sha256: sha(inputCanon),            // lie TOUT ce que le moteur lit dans la requête, pas seulement params
  ctx_sha256: sha(JSON.stringify(local)),   // carnet d'adresses et historique locaux
  rules_sha256: RULES_FP,                   // empreinte de engine/src/*.mjs, compare.ts, policy.mjs, server.mjs
  now_s: Math.floor(Date.now() / 1000),     // horloge fournie au moteur
  codes: [...codes, ...(v.level === 'manipulation' ? ['pressure_text'] : [])] }); // le niveau manipulation devient traçable
if (EVIDENCE_DIR) writeFileSync(join(EVIDENCE_DIR, input_sha256 + '.json'), inputCanon); // option, hors de la chaîne
```

Effet : avec le dossier de preuves (`EVIDENCE_DIR`, facultatif, hors du journal chaîné), un auditeur rejoue sans rien demander à personne. Sans lui, il vérifie ce qu'on lui présente. Effacer un fichier de preuves (droit d'effacement) ne casse pas la chaîne. Le journal reste sans texte libre. Dix lignes de code, aucun changement de verdict.

Pour l'ancrage : faire écrire au serveur le format de `anchor/journal.mjs`, ou ajouter à `anchor_now.mjs` une option qui construit l'arbre sur les hachages de ligne du serveur. La seconde est la plus courte.

## 5. « Si votre modèle se trompe, qui est responsable ? » (produit figé, 11 oct. 2026)

Réponse courte : le modèle ne lit que la phrase de la personne ; le reste est du code ; la personne garde le dernier geste. Réponse préparée : `livrables/QR_JURY.md`, question 2.

1. **Qui décide quoi.** Le montant, le jeton et l'adresse écrits sont extraits par du code (`written_check.js`). L'effet de la demande est décodé par le moteur. La comparaison est du code. Un modèle de langage (Clef) lit la phrase pour le type d'action. Quand la phrase est vague ou l'appel illisible, la réponse est « Je n'ai pas pu vérifier », jamais « correspond » par défaut.
2. **Deux erreurs possibles.** Fausse alerte : un clic et du temps. Alerte manquée : la personne est dans la situation où elle serait sans l'outil, avec les signaux de son portefeuille en plus. Hold up n'affiche jamais « protégé ».
3. **Répartition.** Contenu des règles et choix du modèle : l'éditeur. Réglages et déploiement : la plateforme qui intègre. Décision de signer : la personne, avec Annuler visible.
4. **Condition à tenir.** Une phrase ne doit jamais abaisser un plancher objectif ni les signaux du portefeuille. Le noyau respecte cet invariant (0 violation sur 6 442 cas). Pour la couche des détecteurs, certaines règles abaissent un verdict en s'appuyant sur l'intention (mesure : 26 arnaques rouges sans intention ne le sont plus avec le texte lu par Clef-flash, `pipeline/RESULTATS_INTENTION_CLEF.md`). Un garde-fou est en cours d'application côté pipeline ; il n'est pas vérifié à la rédaction.
5. **Ce que l'auditeur obtient.** Code de règle, fichier source, rejeu déterministe, chaîne de hachage. Le journal ne garde pas encore la phrase écrite ni la réponse du modèle : sans elles, le rejeu de la comparaison complète n'est pas possible.
6. **Mesure.** La précision de Clef sur la comparaison n'est pas mesurée par nous (pas de clé). La grille de 1 500 paires est en cours.

Ce que nous ne disons pas : que le journal prouve que les règles étaient bonnes ; qu'une réécriture complète du journal est impossible avant l'ancrage ; qu'une fraude voulue par la personne serait vue.
