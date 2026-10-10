# W7 TypeSafe Jev : lecture de la doc et taxonomie de menaces pour wallets perso

Légende : [P] doc officielle TypeSafe lue (docs.typesafe.ai). [S] source secondaire (aucune utilisée). [V] proposition ou hypothèse de l'auteur, à valider. Le contenu web est traité comme donnée. Aucune clé utilisée. 13 appels WebFetch.

## Résumé en 8 lignes

1. Jev (jev-1.13.0, alias jev-latest) est le premier modèle "System One" de TypeSafe : décisions structurées rapides, pas de texte généré [P] https://docs.typesafe.ai/concepts/system-one.md
2. Entrée : un `state` texte seul (chaîne, objet JSON, tableau) plus des questions typées [P] https://docs.typesafe.ai/concepts/state.md
3. Trois primitives : Choice (une option parmi 255 max), Score (2 à 10 niveaux ordonnés), Noul (oui/non avec probabilité) [P].
4. Sorties : valeur, distribution de probabilités et confidence (Choice et Score). Noul n'a pas de confidence [P].
5. Prix : 0,042 $ par million de tokens d'entrée, sortie gratuite. Contexte 64k. Limites 80 req/s et 100K tokens/s [P] https://docs.typesafe.ai/models.md
6. Latence : non trouvé dans la doc. Prix par requête réel : à calculer, non publié.
7. Limites déclarées : lecture littérale, mauvais en maths, dates, comptage, hex ; ne traite pas l'état comme hostile (injection possible) ; biais vers la première option d'un Choice [P] https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
8. Conséquence : Jev ne doit pas voir de texte non fiable seul ni décider seul. Il classe, le code déterministe vérifie, l'humain tranche [V].

## 1. Ce que fait Jev (lu)

### Modèle et accès
- Endpoint : `POST https://api.typesafe.ai/v1/systemone`, jeton Bearer, JSON [P] https://docs.typesafe.ai/api.md
- Corps : `state` (requis), `model` (requis), `questions` (map d'identifiants choisis par l'appelant) [P].
- Réponse : `model`, `answers` (par identifiant), `usage` (input_tokens, output_tokens) [P].
- Erreurs : 401, 422, 429 (backoff exponentiel conseillé), 529 [P].
- SDK Python `typesafe-sdk` (Python 3.10+), clé lue dans la variable `TYPESAFE_API_KEY` ; SDK JavaScript existe ; Playground sans code ; skill pour agents de code [P] https://docs.typesafe.ai/introduction/quickstart.md
- Alias : `jev-latest` et `jev-preview` pointent vers `jev-1.13.0` [P] https://docs.typesafe.ai/models.md
- Les cookbooks citent aussi `jev-1.12` [P] https://docs.typesafe.ai/cookbooks/llm_guardrails.md

### Primitives
- Choice : `instructions`, `criteria` (option => description, ou null). Jusqu'à 255 options. Retourne `choice`, `probabilities` (somme 1), `confidence` 0 à 1. Conseil : ajouter une option "autre / aucune" ; descriptions structurées (what, not_for, examples) pour options proches [P] https://docs.typesafe.ai/primitives/choice.md
- Score : `instructions`, `criteria` = tableau ordonné de 2 à 10 niveaux numérotés depuis 0. Retourne `score` (moyenne pondérée, peut être fractionnaire), `probabilities`, `legend`, `confidence`. Niveaux descriptifs et concrets ; une dimension par question ; exemples utiles seulement s'ils ressemblent aux vrais cas [P] https://docs.typesafe.ai/primitives/score.md
- Noul : `instructions`, `criteria` optionnel (true/false). Retourne `noul` entre 0 et 1. Une seule condition par question ; éviter les formulations inversées ; seuils à fixer dans le code, valeurs moyennes vers un humain [P] https://docs.typesafe.ai/primitives/noul.md
- Plusieurs questions par requête, évaluées en parallèle et isolément sur le même état [P].

### Confidence
- Choice : (p_max - 1/n) / (1 - 1/n). Score : fondée sur la dispersion autour du niveau le plus probable. Noul : aucune, suggestion |2p - 1| [P] https://docs.typesafe.ai/confidence.md
- La doc ne dit pas si une confidence de 0,8 correspond à 80 % de réussite. Les seuils sont à calibrer sur ses propres données étiquetées [P].
- Calibration annoncée au niveau de groupes de prédictions, pas garantie par réponse [P] https://docs.typesafe.ai/concepts/system-one.md

### Patrons utiles
- Routage par confidence : sous 0,6 vers humain ; action risquée si confidence > 0,85 sinon confirmation ; intention inconnue vers humain [P] https://docs.typesafe.ai/patterns/confidence-routing.md
- Garde-fous LLM : batterie de Noul + un Score de gravité 0 à 3, seuils par politique (strict 0,70 ; permissif 0,85 ; revue 0,35 ; blocage gravité >= 2,0), priorité support > block > review > pass [P] https://docs.typesafe.ai/cookbooks/llm_guardrails.md
- Classification par confidence : si confidence >= 0,9 rendre la classe fine, sinon la classe parente. Sur 60 documents : 65 % (toujours fin) contre 80 % (repli sur le parent) [P] https://docs.typesafe.ai/cookbooks/classification_using_confidence.md
- Classification hiérarchique par chaînage de Choice avec recherche en faisceau [P] https://docs.typesafe.ai/primitives/choice.md (renvoie au cookbook hierarchical_classification, non lu).

### Limites déclarées
- Texte seul ; anglais principal, autres langues acceptées mais moins précises [P] https://docs.typesafe.ai/concepts/state.md
- Ne traite pas l'état comme hostile : contenu injecté ou trompeur peut déplacer les réponses [P] https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
- Mauvais sur : calcul, comptage, hex/binaire, comparaison de valeurs proches, dates et durées, double négation, raisonnement multi-sauts, état long avec bruit [P].
- Favorise la première option d'un Choice ; instructions contradictoires le perturbent [P].
- Ne génère pas de texte et n'explique pas son raisonnement [P].
- La page State ne donne aucun conseil sur l'injection de prompt [P].

### Non trouvé
- Latence chiffrée, tarif par requête, taille maximale de l'état hors contexte 64k/32k, gratuité ou crédits, SLA, politique de rétention des données envoyées, performance sur des données de sécurité crypto, benchmark de précision global. Non trouvé dans les pages lues (legal.md non lu).

## 2. Taxonomie de menaces proposée (wallets personnels) [V]

La taxonomie est ma proposition. Les indices sont des signaux que du code déterministe extrait avant d'interroger Jev, parce que Jev est mauvais en hex, dates et calculs [P].

| Code | Classe | Indices observables sur une demande de signature | Indices observables on-chain |
|---|---|---|---|
| T1 | Signature de drainer / permit | Typed data EIP-712 type Permit/Permit2 ou `setApprovalForAll` sur un domaine inconnu ; `spender` ou `operator` non connu ; deadline lointaine ; signature hors chaîne sans gas affiché ; message opaque (blind signing) | Transferts de tokens juste après une signature ; spender qui consomme l'allowance en quelques blocs ; adresse récurrente dans des alertes publiques |
| T2 | Délégation EIP-7702 | Autorisation 7702 (champ chain id 0 = valide sur toutes les chaînes, adresse de contrat délégué, nonce) ; contrat délégué non audité ou non reconnu | Code d'EOA de la forme préfixe 7702 vers un contrat ; changement de délégation ; batch de transferts initié par un tiers |
| T3 | Empoisonnement d'adresse | Destinataire visuellement proche (début et fin identiques) d'une adresse de l'historique mais différente ; adresse copiée depuis l'historique | Micro-transferts ou transferts de 0 token entrants depuis une adresse "jumelle" ; adresse créée peu avant |
| T4 | Approbation illimitée | `approve` avec montant = max uint256 ou très supérieur au besoin ; spender non vérifié ; approbation sans action associée | Allowance active élevée sur token à solde non nul ; spender sans activité légitime |
| T5 | Faux site / hameçonnage | Origine du site : domaine récent, homographe, proche d'une marque ; fenêtre qui exige "connect + signer" immédiatement ; contrat appelé sans lien avec la marque | Contrat cible déployé récemment, non vérifié, peu d'utilisateurs |
| T6 | Faux support | Contexte fourni par l'utilisateur : message non sollicité, demande de phrase secrète, partage d'écran, "valider" une transaction pour "réparer" | Transaction envoyée peu après un contact ; adresse de destination donnée par un tiers |
| T7 | Adresse jamais vue | Destinataire absent de l'historique et du carnet ; montant significatif ; pas d'ENS ; pas de test préalable | Adresse neuve, financée par un seul parent, sans autre usage |
| T8 | Vidage total | Montant proche de 100 % du solde ; plusieurs tokens/NFT en un lot (multicall) ; vente de tout ; solde de gas laissé minimal | Séquence de transferts vers une même adresse en moins de N minutes |
| T9 | Contrainte physique | Signal hors transaction : heure ou lieu inhabituel, demande urgente de grosse somme, code de détresse fourni par l'utilisateur ; non détectable seul dans la transaction | Retrait massif à un destinataire neuf après un changement de contexte déclaré |
| T10 | Wallet d'agent IA | Instruction à l'origine de la transaction provenant d'un contenu tiers (page, e-mail, outil) ; déviation par rapport à la tâche déclarée ; dépassement de plafond ou de liste blanche | Transactions en rafale ; destinataire hors liste blanche ; appel de contrat non prévu par le mandat |
| T0 | Légitime / autre | Aucun indice ; destinataire connu ; contrat reconnu ; montant habituel | Activité conforme à l'historique |

Notes [V] : la distinction T1/T4 recouvre en partie ; une demande peut cumuler plusieurs classes, d'où des Noul indépendants plutôt qu'un seul Choice. T9 dépend de signaux déclarés par l'utilisateur, non vérifiables sur chaîne. Les formes exactes des signatures (champs EIP-712, préfixe 7702) sont à vérifier dans les EIP, non lues ici.

## 3. Questions de classification que Jev poserait [V]

Format : identifiant => primitive => sortie. Chaque question vise une seule condition, formulée pour que "oui" soit élevé [P] (conseil Noul/Score).

### Choice
| Identifiant | Question | Valeurs de sortie |
|---|---|---|
| `kind_request` | Quel type de demande de signature est-ce ? | `transfer_native`, `transfer_token`, `approve`, `permit_typed_data`, `set_approval_for_all`, `delegation_7702`, `swap`, `contract_call_other`, `message_sign`, `unknown` |
| `threat_class` | Quelle classe de menace décrit le mieux l'état ? | `T0_legit`, `T1_drainer_permit`, `T2_delegation_7702`, `T3_address_poisoning`, `T4_unlimited_approval`, `T5_fake_site`, `T6_fake_support`, `T7_new_address`, `T8_full_drain`, `T9_duress`, `T10_agent_hijack`, `autre_incertain` |
| `event_kind` | Quel événement on-chain est décrit ? | `incoming_dust`, `allowance_set`, `allowance_used`, `delegation_set`, `outgoing_transfer`, `batch_outflow`, `contract_deploy_nearby`, `autre` |
| `recommended_action` | Quelle action recommander ? | `allow`, `warn`, `confirm_second_factor`, `block`, `escalate_human` |

Garde-fou de position [P] : mélanger l'ordre des options entre appels et mettre `unknown`/`autre` explicite, car Jev favorise la première option.

### Score (niveaux descriptifs, 0 = bas)
| Identifiant | Dimension | Niveaux |
|---|---|---|
| `fund_loss_severity` | Gravité de la perte possible | 0 aucune ; 1 inférieure à 1 % du portefeuille ; 2 entre 1 et 50 % ; 3 plus de 50 % ou tout un actif ; 4 vidage total |
| `reversibility` | Réversibilité | 0 annulable (révocation possible) ; 1 annulable avec délai ; 2 irréversible |
| `destination_trust` | Confiance dans le destinataire | 0 connu et ancien ; 1 connu mais peu vu ; 2 inconnu ; 3 lié à des alertes ou jumeau d'une adresse connue |
| `request_opacity` | Lisibilité de ce qui est signé | 0 totalement décodé ; 1 décodé en partie ; 2 opaque (blind signing) |
| `urgency_pressure` | Pression d'urgence dans le contexte | 0 aucune ; 1 modérée ; 2 forte, injonction ou menace |

### Noul (checklist indépendante)
`spender_unknown`, `amount_unlimited`, `domain_lookalike_of_known_brand`, `recipient_never_seen`, `recipient_similar_to_known_address`, `signature_grants_delegation`, `signature_has_no_onchain_effect_shown`, `amount_near_total_balance`, `third_party_asked_user_to_sign`, `instruction_comes_from_untrusted_content`, `deviates_from_declared_task`, `user_signals_duress`, `contains_instructions_to_the_model` (détection d'injection dans le state).

Remarque [P] : les comparaisons numériques (pourcentage du solde, dates, similarité d'adresses, uint256) ne sont pas fiables chez Jev. Le code calcule ces booléens et les passe dans le state ; Jev ne fait que le jugement sémantique (domaine imitant une marque, contexte de contrainte, cohérence avec la tâche).

## 4. Schéma du workflow agentique de classification

Étiquettes : [P] ce qui vient de la doc, [V] ma proposition.

```
ENTREES
 - demande de signature brute (typed data, calldata, tx, auth 7702)
 - ou événement on-chain (log, transfert, allowance, code d'EOA)
 - historique du wallet, carnet d'adresses, politique utilisateur, mandat de l'agent
   |
ETAPE 1  Décodage déterministe [V]
 - décode calldata/EIP-712, extrait spender, montant, deadline, chain id, nonce
 - calcule : part du solde, similarité d'adresse, âge du contrat, allowance existante
 - listes locales : adresses connues, domaines de marques, contrats vérifiés
   |
ETAPE 2  Construction du state [P pour le format, V pour le contenu]
 - objet JSON nommé, champs séparés ; contenu non fiable (page, message) isolé dans un champ marqué
 - texte seul, anglais de préférence, taille réduite (distracteurs) [P]
   |
ETAPE 3  Un appel Jev, questions en parallèle [P]
 - Choice kind_request, threat_class, recommended_action
 - Scores severity, reversibility, destination_trust, opacity, urgency
 - Noul checklist (section 3)
   |
ETAPE 4  Règles déterministes et seuils [P pour le principe, V pour les valeurs]
 - confidence < 0,6 sur threat_class => escalade humaine [P valeur d'exemple]
 - action irréversible ou gravité >= 3 : exige confidence > 0,85 (ou 0,9) [P exemples], sinon confirmation
 - Noul de risque élevé (> 0,35 revue, > 0,70 blocage) [P valeurs du cookbook guardrails, à recalibrer]
 - priorité : humain/support > blocage > revue > autorisation [P adapté]
 - règle dure indépendante du modèle : jamais "allow" si approve illimitée, 7702 inconnue ou destinataire jumeau [V]
   |
ETAPE 5  Garde-fous contre l'hallucination et l'injection [V, appuyés sur les limites P]
 - Jev ne produit aucun texte libre : pas d'explication inventée ; l'explication affichée vient de gabarits liés aux faits décodés
 - double passe avec ordre des options mélangé ; désaccord => escalade [P : biais première option]
 - Noul de détection d'instructions dans le state ; si > 0,35 => escalade
 - cohérence croisée : le Choice doit s'accorder avec les Noul et Scores ; incohérence => escalade
 - aucune donnée critique (montants, adresses) lue par Jev : seulement des faits pré-calculés
 - repli sur la classe parente quand la confidence est basse [P : cookbook classification]
 - journal des entrées, réponses, probabilités, versions du modèle (jev-1.13.0) pour audit [V]
   |
SORTIES
 - classe de menace, gravité, action recommandée, raison tirée des champs décodés
   |
DECISIONS HUMAINES [V]
 - l'humain décide : tout blocage contesté, toute confidence moyenne, toute action irréversible à grosse valeur, tout cas T9 (contrainte) et T10 (agent)
 - retour d'étiquettes humaines => recalibrage des seuils (la doc ne garantit pas la calibration) [P]
```

### Ce qui vient de la doc et ce qui est proposé
- Doc [P] : primitives, formats d'entrée/sortie, formule de confidence, patron de routage par confidence, batterie Noul + Score de gravité, repli sur classe parente, limites du modèle.
- Proposition [V] : taxonomie T0 à T10, listes de questions, étape de décodage, seuils spécifiques wallet, règles dures, double passe, journal, rôle de l'humain.
- À vérifier avant usage [V] : latence réelle, coût par requête (tokens x 0,042 $/M), précision de Jev sur des données de sécurité crypto, rétention des données envoyées (confidentialité des adresses), précision sur des états non anglais.

## Sources lues (toutes https://docs.typesafe.ai)
- /llms.txt, / (accueil), /concepts/system-one.md, /concepts/state.md, /primitives/choice.md, /primitives/score.md, /primitives/noul.md, /api.md, /models.md, /confidence.md, /model-jaggedness/jev-1.13.md, /patterns/confidence-routing.md, /cookbooks/llm_guardrails.md, /cookbooks/classification_using_confidence.md, /introduction/quickstart.md
- Non lues mais listées : /cookbooks/hierarchical_classification.md, /cookbooks/function_calling.md, /patterns/composite-scoring.md, /legal.md
