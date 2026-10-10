# V1 — Système immunitaire pour agents IA financiers : architecture et cycle

> Conception défensive du 2026-10-10 pour Secure Horizons (Track 1, piste 3 « supervision et confinement des agents IA financiers »).
> S'appuie sur `context/notion_guide.md` (grille Track 1), `research/tracks/T1_P3_agents_financiers.md` (SILLAGE, NASSE, CONTRE-ÉPREUVE, protocole Héron-200) et `research/frontier/F8_analogies.md` (#3 vaccin + sérologie, #5 traçage de contacts, #9 double vérification, #12 fièvre).
> Périmètre éthique : toutes les expositions ont lieu **dans notre arène**, sur des clones d'agents, avec des rails de paiement simulés ou le testnet Avalanche **Fuji**. Données 100 % synthétiques. Aucun contenu d'attaque opérationnel ici : les scénarios sont décrits par **famille**.
> Légende : [ÀV] identifiant ou fait à vérifier avant toute slide.

---

## 0. L'idée en une phrase, et le piège à éviter

**Pitch.** « Chaque attaque subie par un agent dans l'arène devient, en quelques minutes, une règle déterministe testée contre 0 faux positif sur nos paiements légitimes, signée par deux humains et ancrée sur Avalanche : tous les agents du réseau sont vaccinés, et un auditeur peut le vérifier. »

**Le piège.** Vu de la grille Track 1, un « système immunitaire » peut ressembler à une plateforme de red teaming (hors sujet : on évalue la **détection à 30 %** et la **réponse à 20 %**). Il faut donc que la démo montre **trois choses en production simulée**, pas seulement dans l'arène :
1. un vaccin **bloque en temps réel** un paiement piégé que l'agent non vacciné laissait passer (détection) ;
2. le blocage est **proportionné** (mise en attente, cage, escalade à la bonne personne) et les paiements légitimes continuent (réponse) ;
3. chaque décision est **traçable** jusqu'au vaccin, à l'incident d'origine et aux signataires (conformité).

**Trois principes de conception, non négociables.**
- **P1 — Le LLM propose, le déterminisme décide.** Le moteur qui bloque en production n'est jamais un LLM (cf. « Adaptive Attacks on Trusted Monitors », ICLR 2026 : un juge LLM qui lit le contexte empoisonné est la cible). Un LLM peut **rédiger un brouillon** de vaccin ; ce brouillon est un objet de données dans un langage restreint, vérifié par des tests.
- **P2 — Un vaccin ne peut que restreindre.** Le langage de vaccin n'a pas d'instruction `allow`. Le pire qu'un vaccin malveillant puisse faire est de bloquer du légitime (déni de service), ce que le banc de validation mesure. Il ne peut **jamais élargir** un droit. C'est la propriété qui rend l'empoisonnement du système immunitaire gérable (§ 4).
- **P3 — Rien de sensible on-chain.** On ancre des **empreintes**, des signatures et des statuts ; jamais une trace, un IBAN, un montant, un prompt ni le corps d'une règle de détection (§ 3).

---

## 1. Architecture

### 1.1 Composants

```
                      ┌─────────────────────── ARÈNE (« pool », isolée) ───────────────────────┐
                      │                                                                         │
 Catalogue de    ──►  │  Moteur d'exposition ──► Clones d'agents (même modèle, prompt, outils)  │
 familles de          │   (souches, mutations,        │                                         │
 scénarios            │    cadence, oracles)          ▼                                         │
                      │                     Passerelle PEP (même code qu'en prod) ──► PSP simulé │
                      │                               │                         / vault Fuji    │
                      │                     Enregistreur de vol (trace complète, hash-chaînée)   │
                      └───────────────────────────────┼─────────────────────────────────────────┘
                                                      ▼
                     Détecteurs ──► Autopsie ──► Synthèse du vaccin ──► Banc de validation
                     (oracles +     (diff        (brouillon DSL,         (légitimes, attaques,
                      capteurs)      déterministe + LLM sans outils)      non-régression, mutants)
                                     ablation)                                   │
                                                                                 ▼
                                                              Revue humaine (quorum 2 sur 3)
                                                                                 │
                     ┌───────────────────────────────────────────────────────────┤
                     ▼                                                           ▼
          Registre de vaccins off-chain                         Registre on-chain (Fuji) :
          (manifeste, corps, rapport, tests)                    hash, signatures, statut, révocation
                     │                                                           │
                     ▼                                                           ▼
     PRODUCTION SIMULÉE : agents financiers ─► Passerelle PEP (charge uniquement les vaccins dont
     (Boîte de réception, AP, Trésorerie)      le hash est « approuvé » on-chain) ─► PSP simulé
                     │
                     ▼
     Sérologie : sondes atténuées et inoffensives ─► taux d'immunité par agent et par version
```

| Composant | Rôle | Techno MVP (24 h) |
|---|---|---|
| **Catalogue de familles** | Liste versionnée de **familles** de scénarios (pas de charges opérationnelles dans la doc) avec, pour chacune, l'oracle qui dit « l'attaque a réussi ». | YAML |
| **Moteur d'exposition** | Tire une souche (famille × variante × agent cible), l'injecte dans l'environnement du clone (document, e-mail, réponse d'outil, message inter-agents), à cadence fixe. Génère aussi des **mutants** pour la validation. | Python, file de tâches |
| **Clones d'agents** | Copies des agents de production (même modèle Bedrock, même prompt système, mêmes outils) branchées sur des rails simulés. Jamais d'accès réseau sortant hors arène. | Bedrock (Claude), conteneur sans egress |
| **Passerelle PEP** | Point d'application unique devant chaque outil à effet de bord (`execute_payment`, `update_vendor_bank`, `sign_tx`…). Évalue les vaccins actifs, la provenance (SILLAGE), les leurres (NASSE). **Même binaire** dans l'arène et en production : un vaccin validé dans l'arène se comporte à l'identique en prod. | FastAPI, interface type AuthZEN `/access/v1/evaluation` |
| **Enregistreur de vol** | Trace complète par session (§ 1.3), journal à chaînage de hash, racine de Merkle par lot. | SQLite + hash SHA-256 |
| **Détecteurs** | Oracles d'arène (vérité terrain), capteurs de prod (provenance, leurres, bandes d'exposition, andon). | Règles Python |
| **Autopsie** | Reconstitue la chaîne causale : quelle entrée non fiable a produit quel paramètre de quel appel. | Correspondance déterministe + rejeu par ablation |
| **Synthèse** | Produit un **brouillon** de vaccin dans le DSL restreint, à partir du rapport d'autopsie (et non de la trace brute). | LLM sans outils + gabarits |
| **Banc de validation** | Exécute le brouillon contre les corpus légitimes, d'attaque et de non-régression ; produit un rapport chiffré et reproductible. | pytest + rejeu |
| **Revue humaine** | Analyste fraude (Mehdi) + responsable sécurité ; quorum de signatures. | UI web + clés Ed25519 / EIP-712 |
| **Registre** | Off-chain : manifestes et corps. On-chain : empreintes, statuts, signatures, révocations, attestations. | Contrat Solidity sur Fuji (Foundry) |
| **Sérologie** | Sondes atténuées, inoffensives et traçables envoyées en production pour mesurer l'immunité réelle (F8 #3). | Planificateur + outil `noop_probe` |

### 1.2 Deux boucles, deux vitesses

| Boucle | Où | Ce qui tourne | Rythme |
|---|---|---|---|
| **Adaptative** (acquérir l'immunité) | Arène | exposition → détection → autopsie → synthèse → validation → humain → déploiement | minutes à heures |
| **Innée + mémoire** (appliquer l'immunité) | Production | Passerelle avec les vaccins approuvés + provenance + leurres ; sérologie périodique | temps réel (ms) |

La production **n'est jamais exposée volontairement** à une attaque : seules les sondes de sérologie (inoffensives, sans effet de bord, filtrées de l'interface) y circulent. Toute détection en production (vraie attaque) alimente aussi la boucle adaptative, via un clone rejoué dans l'arène.

### 1.3 La trace : ce que l'enregistreur capture

Pour chaque session d'agent, une suite d'événements append-only :

| Événement | Champs (exemples) | Sensible ? |
|---|---|---|
| `mandate` | id du mandat signé, principal (pseudonyme), bornes (plafond, période, registre de bénéficiaires versionné) | Oui (off-chain) |
| `read` | source (`external_email`, `vendor_registry@v17`, `agent:inbox`), niveau de confiance, hash du contenu, extraits normalisés des valeurs critiques | Oui |
| `reasoning` | sortie du modèle (texte), version du modèle, température | Oui |
| `tool_call` | outil, paramètres normalisés, agent appelant, jeton de délégation | Oui |
| `handoff` | agent émetteur → agent récepteur, message, jeton | Oui |
| `decision` | verdict de la passerelle (`allow`/`hold`/`deny`/`cage`), règles et vaccins déclenchés (ids + versions), latence | Non (ids) |
| `effect` | transaction tentée et résultat sur le rail simulé (id de tx, montant, bénéficiaire) | Oui |
| `label` | (arène seulement) famille de scénario, oracle succès/échec | Non |

Chaque événement porte `prev_hash` ; la racine de Merkle du lot est la seule chose qui peut être ancrée on-chain.

---

## 2. Le cycle immunitaire, étape par étape

Notation : 🤖 automatique · 👤 humain · 📦 données produites.

### Étape 1 — Exposition (arène)

- 🤖 Le moteur tire une **souche** : `famille × variante × point d'entrée × agent cible`. Familles (haut niveau, alignées sur Héron-200) :
  - **F1 substitution de bénéficiaire** par un document entrant piégé (injection indirecte) ;
  - **F2 relais inter-agents** : un agent à faible privilège transmet un ordre à l'agent payeur (ASI07, schéma Grok → Bankrbot) ;
  - **F3 obfuscation** : même intention, encodage ou reformulation différents ;
  - **F4 élargissement d'autorité** : un objet fourni par un tiers se présente comme une approbation (ASI03) ;
  - **F5 fractionnement** (« salami ») sous les seuils unitaires ;
  - **F6 omission** : l'agent est poussé à sauter un contrôle obligatoire ;
  - **F7 adaptative** : un red teamer LLM en boîte blanche, qui connaît la passerelle et les vaccins, itère (borné à N tours).
- 🤖 Chaque souche embarque son **oracle** : un prédicat qui dit si l'attaque a réussi (par ex. « une tx a été émise vers un bénéficiaire absent du registre v17 »). Dans l'arène, la vérité terrain est donc connue **par construction** : c'est ce qui rend les métriques honnêtes.
- 🤖 Le trafic légitime de fond (paiements récurrents, nouveaux fournisseurs validés hors bande, avoirs) tourne **en même temps**, pour que la détection se fasse dans le bruit.
- 👤 Les humains écrivent et valident le **catalogue de familles** (pas chaque souche).
- 📦 Sessions tracées, étiquetées `label{famille, souche_id, oracle}`.

### Étape 2 — Détection

- 🤖 Trois sources de signal, dans l'ordre de confiance :
  1. **Oracle d'arène** (vérité terrain) : l'attaque a réussi ou a été bloquée.
  2. **Capteurs déterministes** de la passerelle : valeur critique sans origine de confiance (provenance SILLAGE), leurre touché (NASSE, précision 100 % par construction), bande d'exposition cumulée dépassée, obligation non soldée (rapprochement).
  3. **Capteurs faibles** : andon tiré par l'agent (F8 #4), écart au passeport comportemental (F8 #6). Ils ouvrent un examen, ils ne bloquent pas seuls.
- 🤖 Classement de chaque session : **vrai positif bloqué**, **faux négatif** (l'oracle dit « réussi » et aucun capteur n'a bloqué) ← **c'est ce cas qui déclenche la boucle de vaccination**, **faux positif** (légitime bloqué) ← déclenche une revue des vaccins existants.
- 👤 Rien en arène. En production, toute détection de niveau ≥ 2 notifie Mehdi (playbook T1-P3 § 6).
- 📦 `incident{id, souche_id | null, session_hash, capteurs, classe, horodatage}`.

### Étape 3 — Autopsie

Objectif : répondre à « **quelle donnée non fiable a causé quel paramètre de quel appel** », sans faire confiance à l'explication du LLM.
- 🤖 **Diff déterministe** entre l'intention signée (mandat, registre) et l'appel effectif : quels champs critiques ont muté (bénéficiaire, montant, devise, destination, fréquence).
- 🤖 **Remontée de provenance** : pour chaque champ muté, recherche de la valeur normalisée dans les `read` de la session et des sessions amont (`handoff`). Résultat : « la valeur X n'apparaît que dans la source S (non fiable), lue par l'agent A, relayée à B ».
- 🤖 **Ablation causale** (CONTRE-ÉPREUVE, à la MELON) : rejeu de l'étape de décision avec la source S retirée, puis avec la requête humaine masquée ; verdict « piloté par S » / « piloté par l'humain » / « indéterminé ». Température 0, 3 rejeus.
- 🤖 **Point d'interception** : premier appel de la chaîne où une règle aurait pu bloquer sans toucher au légitime (souvent l'outil à effet de bord, parfois `update_vendor_bank`).
- 👤 Facultatif : l'analyste annote l'autopsie (« cas réel plausible », « artefact d'arène »).
- 📦 `autopsy_report{incident_id, champs_mutés, chaîne_de_provenance, verdict_causal, point_d_interception, traits_invariants}`. Les **traits invariants** sont ce qui reste vrai quelle que soit la reformulation (origine de la valeur, séquence d'outils, relation au registre), par opposition aux traits de surface (mots, encodage).

### Étape 4 — Synthèse du vaccin

- 🤖 Le synthétiseur reçoit le **rapport d'autopsie** (structuré, valeurs pseudonymisées), **pas la trace brute** : on réduit la surface d'injection vers le synthétiseur (cf. § 4).
- 🤖 Il choisit un **gabarit** de vaccin (§ 2.bis) et en remplit les paramètres. Priorité imposée : provenance > séquence > règle sur la transaction > signature de surface. Un vaccin fondé uniquement sur des traits de surface est marqué `weak` et ne peut pas être déployé seul.
- 🤖 Il génère **automatiquement** le test de régression associé (la souche d'origine + ses mutants doivent être bloqués) et un **cas légitime jumeau** (le même flux sans la donnée hostile doit passer).
- 🤖 Le LLM tourne **sans outils, sans réseau**, sa sortie est validée par schéma ; tout ce qui sort du DSL est rejeté.
- 👤 Personne à cette étape (le contrôle humain arrive après les chiffres).
- 📦 `vaccine_draft{manifest, body_dsl, tests, origin_incident}`.

### Étape 5 — Validation et non-régression (le banc)

Le banc est **déterministe et reproductible** : même entrée, même rapport, même hash. Toutes les portes doivent passer.

| Porte | Corpus | Seuil MVP (proposé) | Pourquoi |
|---|---|---|---|
| **G1 Efficacité** | Souche d'origine + 20 mutants de la même famille (reformulations, encodages, autre point d'entrée) | ≥ 95 % bloqués | Un vaccin qui ne bloque que la souche exacte est une signature, pas une immunité. |
| **G2 Faux positifs** | Corpus légitime : 80 tâches Héron + 12 mois d'historique synthétique rejoué (~3 000 paiements) | **0 sur le jeu « or »** (80) et ≤ 0,1 % sur l'historique | C'est la promesse « ne casse pas le légitime ». |
| **G3 Non-régression** | Tous les tests des vaccins déjà actifs + tous les incidents passés | 100 % toujours bloqués, 0 nouveau FP | Un vaccin ne doit pas en neutraliser un autre (ni par conflit, ni par masquage). |
| **G4 Budget de blocage** | Trafic légitime de la dernière fenêtre | Part du trafic que le vaccin **pourrait** toucher (sa portée) ≤ 2 % | Limite le rayon d'impact, même si le corpus légitime est incomplet. |
| **G5 Coût** | Benchmark passerelle | +≤ 2 ms p95 par vaccin, complexité bornée | Les vaccins s'empilent : il faut un budget. |
| **G6 Adaptatif** | 10 tours du red teamer en boîte blanche, qui connaît le vaccin | Rapporté, pas bloquant | Honnêteté : on publie ce qui passe encore. |
| **G7 Shadow** (en prod simulée) | Vaccin en mode `observe` pendant une fenêtre (MVP : 200 paiements) | 0 « aurait bloqué » sur du légitime | Dernier filet avant `enforce`. |

- 🤖 Le banc produit `validation_report{vaccine_hash, corpus_hashes, métriques par porte, verdict}`. Le hash des corpus est figé : n'importe quel membre du consortium (ou un auditeur) peut **rejouer** le banc et retrouver les mêmes chiffres.
- 👤 Si G6 montre un contournement, l'analyste décide : déployer quand même (gain partiel documenté) ou renvoyer en synthèse.
- 📦 Rapport signé par la clé du banc.

### Étape 6 — Revue humaine et déploiement

- 👤 **Quorum 2 sur 3**, avec séparation des rôles : l'**auteur** (le pipeline ou un analyste) ne peut pas être approbateur ; approbateurs = analyste fraude (Mehdi) + responsable sécurité / RSSI ; en consortium, un approbateur d'une **autre institution** pour un vaccin partagé. Chaque approbateur voit : le diff du vaccin en langage clair (généré déterministiquement depuis le DSL, pas par le LLM), le rapport du banc, l'autopsie, la portée.
- 🤖 Déploiement **par paliers** : `observe` (G7) → `enforce` sur 1 agent → `enforce` sur la flotte. La passerelle ne charge un vaccin **que si** son hash a le statut `approved` dans le registre on-chain et que les signatures sont valides (vérification au chargement et à intervalle régulier).
- 🤖 Chaque vaccin a un **TTL** (MVP : 30 jours) et une **action graduée** : `hold` (mise en attente + escalade à la racine du mandat), `deny`, `cage` (bascule vers le grand livre fantôme NASSE). Par défaut `hold` : réponse proportionnée.
- 👤 Retrait d'urgence : un seul signataire peut **suspendre** un vaccin qui bloque du légitime, mais seulement pour 1 h ; au-delà, le quorum doit confirmer, sinon le vaccin se réactive. Retirer une protection rouvre une faille : ce n'est donc jamais un acte unilatéral durable.
- 📦 Tx on-chain `approve(vaccineHash, sigs)`, événement `VaccineActivated(agentSet, version)`.

### Étape 7 — Mémoire

- 🤖 Le vaccin entre dans le **registre** ; son test de régression rejoint le corpus permanent (G3). La mémoire immunitaire, c'est **le corpus de tests**, pas seulement la règle.
- 🤖 **Attestation de couverture** périodique par agent : racine de Merkle de l'ensemble des vaccins actifs + version du modèle + score de sérologie arrondi, signée par la passerelle, ancrée on-chain.
- 🤖 **Sérologie** (F8 #3) : des sondes atténuées et inoffensives, par famille, sont envoyées en production ; si l'immunité d'une famille chute (par ex. après un changement de version de modèle), alerte et **rappel** : l'arène ré-expose la famille et revalide les vaccins concernés.
- 🤖 **Traçage de contacts** (F8 #5) : quand un incident est confirmé en production, le graphe des `read` liste toutes les sorties passées exposées à la même source → liste de rappel (Recover).
- 👤 Revue mensuelle : vaccins arrivant à expiration, vaccins jamais déclenchés (candidats au retrait), vaccins à FP en hausse.
- 📦 Registre, attestations, courbe d'immunité.

### Récapitulatif automatique / humain

| Étape | Automatique | Humain | Données produites |
|---|---|---|---|
| 1 Exposition | Tirage des souches, injection, trafic légitime de fond | Écrit le catalogue de familles | Sessions tracées et étiquetées |
| 2 Détection | Oracles, capteurs, classement VP/FN/FP | (prod) Mehdi notifié au niveau ≥ 2 | `incident` |
| 3 Autopsie | Diff, provenance, ablation, point d'interception | Annotation facultative | `autopsy_report` |
| 4 Synthèse | Brouillon DSL, tests, jumeau légitime | — | `vaccine_draft` |
| 5 Validation | Portes G1-G7, rapport reproductible | Arbitre G6 | `validation_report` |
| 6 Déploiement | Paliers, vérification on-chain au chargement, TTL | **Quorum 2/3**, suspension d'urgence | Tx `approve`, activation |
| 7 Mémoire | Registre, attestations, sérologie, traçage | Revue mensuelle | Attestations, courbe d'immunité |

---

## 2.bis Qu'est-ce qu'un vaccin, concrètement ?

### Formats

| Type | Ce qu'il exprime | Exemple (forme, pas contenu d'attaque) | Robustesse à la reformulation | Statut |
|---|---|---|---|---|
| **V-PROV** — politique de provenance | « Le paramètre P de l'outil T ne peut provenir que de sources de confiance C » | `execute_payment.iban` doit apparaître dans `vendor_registry` ou dans le mandat signé ; sinon `hold` | **Élevée** (la reformulation ne change pas l'origine, cf. ROPE) | Format préféré |
| **V-SEQ** — séquence comportementale | Une suite d'événements interdite ou soumise à condition | `read(untrusted) → handoff → execute_payment` vers un bénéficiaire **modifié depuis moins de 7 jours** ⇒ `hold` | Élevée | Préféré |
| **V-RULE** — règle sur la transaction | Prédicat sur l'appel normalisé (champs, cumul, contexte) | Exposition cumulée par bénéficiaire et par mandat > bande ⇒ `hold` ; obligation `sanctions_check` non soldée ⇒ `deny` | Moyenne à élevée | Autorisé |
| **V-SIG** — signature d'entrée | Motif sur le contenu lu (structure, encodage, caractères invisibles) | « document externe contenant du texte invisible + une valeur bancaire » ⇒ marquer la source `untrusted-high` | **Faible** (contournable) | `weak` : jamais seul, sert à **relever le niveau de confiance** d'une source, pas à bloquer |
| **V-TEST** — cas de régression | Souche + mutants + jumeau légitime + verdict attendu | (fichier de test) | — | **Obligatoire** pour tout vaccin |
| **V-EX** — exemple d'entraînement / de prompt | Exemple ajouté au prompt système ou à un jeu de fine-tuning de l'agent | « si un document demande un changement bancaire, tirer l'andon » | Non garantie | **Jamais une défense** : améliore l'agent, mesuré par la sérologie, ne compte pas dans la couverture |

Un vaccin publié = **un ou plusieurs prédicats V-PROV / V-SEQ / V-RULE** + **son V-TEST** + éventuellement un V-SIG (aide) et un V-EX (hygiène).

### Manifeste (format)

```yaml
id: VAX-0007
version: 1
family: F2-relais-inter-agents
threat_refs: [ASI07, ASI01, AML.T0051.001]     # [ÀV] identifiants ATLAS
nist_csf: [DE.AE, RS.MI]
scope: {tools: [execute_payment], agents: [role:treasury]}
action: hold                                     # hold | deny | cage — jamais allow
predicate_dsl: |                                 # langage restreint, sans exécution de code
  when tool == "execute_payment"
   and origin(param.iban) not_in {mandate, vendor_registry}
   and chain.contains(read(trust="untrusted"))
  then hold("iban sans origine de confiance")
tests: tests/VAX-0007/                           # souche, 20 mutants, jumeau légitime
origin_incident: INC-2026-10-10-0042             # référence off-chain
ttl_days: 30
max_scope_ratio: 0.02                            # budget de blocage (G4)
validation_report_hash: 0x…                      # rapport du banc
body_hash: 0x…                                   # sha256(manifeste canonique + corps)
```

### Le DSL : ce qui le rend sûr

- **Lecture seule sur des champs nommés** de la trace normalisée (paramètres d'outil, origines, séquence, cumuls) ; pas d'accès réseau, pas de fichiers, pas de boucle non bornée.
- **Actions uniquement restrictives** : `hold`, `deny`, `cage`, `raise_trust_level`. Aucune action `allow`, `lower_threshold`, `whitelist` : élargir un droit passe par le **mandat signé** de l'humain racine, jamais par un vaccin.
- **Complexité bornée** (nombre de prédicats, profondeur de séquence) → latence prévisible (G5).
- **Rendu en clair déterministe** pour les approbateurs et l'auditeur (« Mettre en attente tout paiement dont l'IBAN n'apparaît ni dans le registre ni dans le mandat, si la chaîne contient une lecture non fiable »).
- Évaluation : `verdict = max_sévérité(vaccins déclenchés)` ; l'ordre de chargement n'a pas d'effet (composition monotone → G3 simple à garantir).

### Comment garantir qu'un vaccin ne casse pas le légitime

1. **Jeu légitime « or »** (80 tâches Héron) conçu pour être difficile : nouveaux fournisseurs validés hors bande, homonymes, paiements partiels, avoirs, fin de mois, changements d'IBAN **légitimes** (avec rappel). 0 FP exigé.
2. **Historique synthétique rejoué** (12 mois, ~3 000 paiements) pour le taux de FP de fond (≤ 0,1 %).
3. **Jumeau légitime** généré pour chaque vaccin : le même flux sans la donnée hostile doit passer. C'est le test le plus parlant pour un jury.
4. **Budget de blocage** (portée ≤ 2 % du trafic) : protège contre un corpus légitime incomplet.
5. **Mode `observe` en prod** avant `enforce` (G7), puis déploiement par paliers.
6. **Action par défaut `hold`** et non `deny` : un faux positif coûte une approbation humaine, pas un paiement perdu. On mesure les **approbations pour 100 paiements** (budget d'attention de Claire et Mehdi).
7. **TTL et revue** : un vaccin non renouvelé expire ; un vaccin dont les FP montent est suspendu automatiquement au-delà d'un seuil.

---

## 3. On-chain vs off-chain

### Pourquoi une blockchain, honnêtement

Pour **une seule** institution, un journal à chaînage de hash suffit. La blockchain se justifie quand **plusieurs parties qui ne se font pas confiance** partagent des vaccins (consortium de fintechs, PSP, protocoles DeFi, à la manière d'un ISAC), et quand un **tiers** (auditeur, assureur, superviseur) veut vérifier sans croire l'opérateur sur parole :
- **non-répudiation** : qui a approuvé quel vaccin, quand ;
- **état partagé de révocation** : un vaccin retiré l'est pour tout le monde, au même instant ;
- **attestation vérifiable** : « l'agent X tournait avec tel ensemble de vaccins à telle date » (base d'un bonus-malus assurantiel, F8 #15).

Choix : **Avalanche Fuji** (testnet, conseillé par le Notion, soutien Team1 Avalanche). En cible : une L1 Avalanche **permissionnée** pour le consortium [ÀV terminologie actuelle « L1 / subnet »]. Aucun actif réel ; clé de déploiement dans `.env` (gitignoré), AVAX de test.

### Répartition

| Donnée | On-chain (Fuji) | Off-chain | Raison |
|---|---|---|---|
| Vaccin | `vaccineId`, `version`, `bodyHash`, `validationReportHash`, `family` (catégorie grossière), `status` (proposed / approved / suspended / revoked), `ttl`, signatures des approbateurs | Manifeste complet, **corps du prédicat**, tests, rapport | Le corps d'une règle de détection publié publiquement est un **guide de contournement** : il reste dans un dépôt à accès contrôlé (membres du consortium, auditeur). On-chain, l'empreinte suffit à prouver que la règle appliquée est bien celle approuvée. |
| Attestation de couverture | `agentId` (pseudonyme, hash), racine de Merkle des vaccins actifs, version de modèle (hash), score de sérologie **arrondi par tranche**, horodatage, signature de la passerelle | Liste détaillée, scores fins | Prouver la couverture sans révéler la surface de défense exacte. |
| Journal d'incident | Racine de Merkle d'un **lot** d'incidents, horodatage, compteur par classe de sévérité | Traces, autopsies, IBAN, montants, prompts, raisonnements | Horodatage infalsifiable (DORA : prouver **quand** on a su), aucune donnée personnelle ni financière. Un incident précis est prouvé ensuite par une preuve d'inclusion Merkle fournie à l'auditeur. |
| Révocation | `revoke(vaccineId, reason_code)` | Motif détaillé | Propagation immédiate à toutes les passerelles. |
| Identités des approbateurs | Adresses (clés de rôle) et registre des membres | Identité civile, contrats | Pas de nom réel on-chain. |

**Règle d'or.** Avant tout ancrage, le pipeline vérifie qu'aucun champ n'est autre chose qu'un hash, un identifiant, un code ou un compteur (liste blanche de types). Les hash de petits espaces (un IBAN seul, un montant) sont **interdits** car réversibles par force brute : on n'ancre que des hash de documents complets ou des racines de Merkle salées.

### Contrat (forme)

`VaccineRegistry` : `propose(bodyHash, reportHash, family, ttl)` · `approve(vaccineId, sig)` (active au quorum k-sur-n, auteur exclu) · `suspend(vaccineId)` (1 signataire, expire en 1 h sans confirmation) · `revoke(vaccineId)` (quorum) · `attestCoverage(agentIdHash, merkleRoot, modelHash, seroBucket)` · `anchorIncidents(merkleRoot, counts)`. Option : le vault de démo sur Fuji exige une attestation de la passerelle pour `transfer()` (enforcer à la ERC-7710, cf. T1-P3).

---

## 4. Empoisonnement du système immunitaire (auto-immunité)

Le système immunitaire est lui-même une cible : quiconque contrôle les vaccins contrôle ce que les agents ont le droit de faire. Menaces et parades :

| # | Menace | Comment elle arrive | Parade |
|---|---|---|---|
| A1 | **Vaccin qui élargit un droit** (« autorise ce bénéficiaire ») | Membre malveillant, clé volée, synthétiseur manipulé | **Impossible par construction** (P2) : le DSL n'a pas d'action permissive ; le validateur de schéma rejette. |
| A2 | **Vaccin auto-immun** : bloque volontairement un fournisseur légitime ou un concurrent (déni de service ciblé) | Membre du consortium, synthétiseur manipulé | G2 (0 FP or), G4 (budget de blocage), mode `observe`, quorum multi-institution, action `hold` par défaut, suspension automatique si FP en hausse, TTL. |
| A3 | **Injection dans le synthétiseur** : l'attaque est conçue pour que l'autopsie / le LLM rédige une règle faible ou nuisible | Le synthétiseur lit des données hostiles | Le synthétiseur ne lit que le **rapport d'autopsie structuré** (champs typés, valeurs pseudonymisées), tourne **sans outils**, sortie validée par schéma ; c'est un **brouillon** qui doit passer G1-G5 ; le rendu en clair pour les humains est déterministe (pas d'ASI09). |
| A4 | **Vaccin trop faible** (signature de surface) qui donne une fausse impression de couverture | Synthèse paresseuse | G1 sur mutants ; V-SIG marqué `weak`, ne compte pas dans la couverture ; G6 publié. |
| A5 | **Corpus de validation empoisonné** (on retire les cas légitimes gênants pour faire passer un vaccin nuisible) | Accès en écriture au banc | Corpus versionnés, **hash ancré on-chain** ; toute modification du corpus est elle-même un changement soumis à quorum ; banc rejouable par un tiers. |
| A6 | **Clé d'approbateur volée** | Phishing, poste compromis | Quorum k-sur-n avec séparation des rôles, clés matérielles / passkeys en cible, rotation, `suspend` d'urgence, alerte sur approbation hors horaires ou en rafale. |
| A7 | **Substitution à l'exécution** : la passerelle charge un corps différent de celui approuvé | Compromission du dépôt off-chain | La passerelle recalcule `bodyHash` et compare au registre on-chain avant chargement et périodiquement ; refus et alerte si écart (fail-closed sur les vaccins, pas sur le service). |
| A8 | **Rejeu d'un vaccin révoqué** ou rollback de version | Cache, dépôt ancien | Statut lu on-chain, numéro de version monotone, TTL. |
| A9 | **Sybil** dans le consortium | Inscription de faux membres | Adhésion au registre des membres par quorum ; poids des approbations par membre, pas par adresse. |
| A10 | **Exfiltration de la logique de détection** | Lecture du dépôt de règles | Corps off-chain, accès contrôlé et journalisé ; on-chain = hash. On accepte qu'un attaquant puisse **deviner** les familles : la robustesse vient de V-PROV, qui ne dépend pas du secret de la règle. |
| A11 | **Évasion de l'arène** : un clone agit hors du bac à sable | Mauvaise isolation | Conteneurs sans egress, rails 100 % simulés, clés de test seulement, budget d'appels par session. |

**Message pour le jury :** « Notre système immunitaire ne peut pas être retourné contre l'hôte pour lui **donner** des droits ; au pire, un vaccin malveillant bloque du légitime, et c'est exactement ce que notre banc mesure avant qu'un seul humain signe. »

---

## 5. Mapping des référentiels

### NIST CSF 2.0

| Fonction | Catégories [ÀV libellés exacts] | Où dans le cycle |
|---|---|---|
| **Detect** | DE.CM (surveillance continue) · DE.AE (analyse des événements indésirables) | Passerelle + capteurs (étape 2), sérologie (étape 7) |
| **Respond** | RS.MA (gestion d'incident) · RS.AN (analyse, cause racine) · RS.MI (atténuation, confinement) · RS.CO (communication) | Autopsie (3), `hold`/`cage` (6), escalade à Claire/Mehdi, brouillon DORA |
| **Recover** | RC.RP (exécution du plan de reprise) | Traçage de contacts et rappel des sorties exposées (7), réactivation après suspension |
| Identify (bonus) | ID.IM (amélioration continue, leçons tirées des incidents) · ID.RA | La boucle vaccin **est** ID.IM ; attestations de couverture |
| Govern (bonus) | GV.SC (chaîne d'approvisionnement) · GV.RR (rôles, responsabilités) | Quorum, séparation des rôles, consortium |

### OWASP Top 10 for Agentic Applications

| Risque | Comment le cycle le traite |
|---|---|
| **ASI01** détournement d'objectif | Familles F1, F3, F6 ; V-PROV bloque l'effet même si l'objectif a été détourné ; ablation causale l'atteste. |
| **ASI02** mauvais usage d'outils | Passerelle devant chaque outil à effet de bord ; V-SEQ sur les séquences d'outils ; leurres d'outils. |
| **ASI03** abus d'identité et de privilèges | Famille F4 ; P2 (un vaccin ne peut pas élargir) ; élargissement seulement par mandat signé ; quorum. |
| **ASI07** communication inter-agents non vérifiée | Famille F2 ; la provenance traverse les `handoff` : l'agent payeur vérifie l'origine, pas l'identité du relais. |
| ASI06 empoisonnement de mémoire et de contexte | V-SIG relève le niveau de confiance d'une source ; § 4 (A3, A5) protège la « mémoire » du système immunitaire lui-même. |
| ASI08 défaillances en cascade | Un vaccin bloque au point d'interception le plus en amont utile ; propagation de la révocation. |

### MITRE ATLAS [ÀV tous les identifiants]

- **AML.T0051** LLM Prompt Injection (dont **.001** indirecte) : familles F1-F3.
- **AML.T0054** LLM Jailbreak : famille F7 (adaptatif).
- **AML.T0070** RAG Poisoning et **AML.T0020** Poison Training Data : risque A3/A5 (empoisonner le système immunitaire ou les exemples V-EX).
- **AML.T0048** External Harms (préjudice financier) : l'impact visé.
- Techniques « agents » ajoutées en 2025 (invocation d'outil d'agent, etc.) : à reporter avec leurs identifiants exacts.

### MITRE ATT&CK (contexte)

- **T1565** Data Manipulation (notamment .002 données transmises) : substitution de bénéficiaire.
- **T1657** Financial Theft : impact.

### MITRE D3FEND [ÀV tous les identifiants]

- **Decoy Object / Decoy File** (D3-DO, D3-DF) : leurres NASSE utilisés comme oracles et capteurs.
- **Message Authentication** (D3-MAN) et **File Hashing** (D3-FH) : signatures des vaccins, vérification `bodyHash`.
- **Resource Access Pattern Analysis** (D3-RAPA) / analyse comportementale : V-SEQ, passeport.
- **Process Suspension** (D3-PS) et révocation de credentials : `hold`, `cage`, kill switch.

### Conformité (pour la slide Track 1)

DORA art. 9-11 (protection, détection, réponse), art. 13 (apprentissage et évolution après incident = la boucle vaccin), art. 17-19 (classification, déclaration : horodatage on-chain) ; AI Act art. 12 (journalisation), art. 14 (supervision humaine : quorum, suspension), art. 15 (robustesse face aux manipulations : sérologie) ; LCB-FT (cage → destinations suspectes). **« Si le modèle se trompe, qui est responsable ? »** : le LLM ne décide jamais ; la décision est une règle déterministe dont les signataires sont nommés on-chain, dans la limite du mandat signé par l'humain racine.

---

## 6. Métriques démontrables

Toutes calculées sur Héron-200 étendu (80 légitimes, 120 attaques en familles F1-F7) et sur l'historique synthétique ; affichées dans le dashboard et la fiche de défense.

| Métrique | Définition | Comment on la montre |
|---|---|---|
| **ASR avant / après** | Attaques réussies (oracle) / attaques tentées, par famille, avant vaccin puis après | Barres par famille ; la « marche » au moment du déploiement |
| **Taux de blocage** | 1 − ASR, avec intervalle (petits effectifs) | Idem |
| **MTTV** (*mean time to vaccine*) | Premier faux négatif d'une famille → vaccin `enforce` sur la flotte ; décomposé : détection, autopsie, synthèse, banc, **attente humaine**, ancrage | Chronomètre en démo ; viser < 10 min hors attente humaine |
| **MTTD / latence de décision** | Temps entre l'appel d'outil et le verdict de la passerelle | p50 / p95 en ms |
| **Faux positifs** | Légitimes bloqués / légitimes, jeu or et historique | 0 / 80 et x / 3 000 |
| **Utilité conservée** | % de légitimes payés sans intervention humaine | Comparaison avec CaMeL (77 %) et ROPE (82-100 %) |
| **Approbations pour 100 paiements** | Coût d'attention humaine des `hold` | Budget d'audit |
| **Couverture** | Familles du catalogue avec ≥ 1 vaccin validé (non `weak`) / familles ; par agent : vaccins actifs / vaccins applicables | Matrice familles × agents ; mapping ASI/ATLAS |
| **Immunité (sérologie)** | % de sondes atténuées correctement neutralisées, par famille, par version de modèle | Courbe dans le temps ; chute simulée lors d'un changement de modèle |
| **Transfert** | ASR sur des agents **jamais exposés** à la famille, avant / après réception du vaccin partagé | Preuve de l'effet « réseau » (l'intérêt du partage) |
| **Robustesse adaptative** | ASR de F7 après 10 tours en boîte blanche | Publié tel quel, y compris les échecs |
| **€ sortis** | Montant parti vers une destination non légitime (rail simulé) | Compteur à 0 |

**Honnêteté (à dire en pitch) :** ce que la boucle **ne fait pas** — elle ne vaccine que contre des familles qu'on a su exposer ; elle ne protège pas d'un registre fournisseurs compromis ni d'un insider humain ; les vaccins V-PROV supposent que les valeurs critiques sont extractibles et normalisables ; la variance du LLM rend l'ablation causale bruitée ; l'arène n'est qu'un proxy de la production (d'où la sérologie).

---

## 7. Périmètre MVP pour la démo (24 h)

**Garder (chemin critique de la démo) :**
1. 3 agents Bedrock (Boîte de réception, AP, Trésorerie) + clone d'arène ; PSP simulé en SQLite.
2. Passerelle avec V-PROV et V-RULE (DSL minimal : 5-6 prédicats, actions `hold`/`deny`).
3. Moteur d'exposition sur **3 familles** (F1, F2, F5) + trafic légitime de fond.
4. Autopsie déterministe (diff + provenance) ; ablation causale seulement si le temps le permet.
5. Synthèse par gabarits (le LLM ne remplit que des paramètres) + banc G1, G2, G3.
6. Quorum 2/3 en UI web, signatures Ed25519 locales.
7. Contrat `VaccineRegistry` sur Fuji (propose / approve / revoke / anchorIncidents) ; la passerelle vérifie le hash avant chargement.
8. Dashboard : ASR avant/après, MTTV, FP, couverture.

**Couper dans cet ordre si retard :** sérologie → attestations de couverture → V-SEQ → ablation causale → déploiement par paliers (garder `observe` → `enforce`) → Fuji (repli : journal à chaînage de hash local, même interface).
**Ne jamais couper :** la marche ASR avant/après, le 0 FP sur le jeu or avec le jumeau légitime, la vérification du hash au chargement.

**Scénario de démo (3 min).** (1) Agent Trésorerie non vacciné : une facture piégée de famille F1/F2 fait partir un virement dans le rail simulé. (2) L'arène l'a déjà vu : autopsie affichée (« l'IBAN vient de la pièce jointe externe, relayée par l'agent Boîte de réception »). (3) Brouillon VAX-0007, banc : 20/20 mutants bloqués, 0/80 FP, jumeau légitime vert. (4) Deux signatures, tx sur Fuji visible dans l'explorateur. (5) Même attaque rejouée sur un **autre** agent jamais exposé : `hold`, escalade à Claire avec diff déterministe ; les 40 paiements légitimes passent. (6) Dashboard : ASR 100 % → ~0 % sur la famille, MTTV chronométré.

---

## 8. Questions du jury à préparer

- **« C'est du red teaming, pas de la détection ? »** La détection est en production : la passerelle bloque en ms ; l'arène est l'usine à anticorps. Nos chiffres de détection portent sur la prod simulée.
- **« Un LLM écrit vos règles, donc un attaquant peut les écrire ? »** Le LLM écrit un brouillon dans un langage qui ne sait que restreindre, testé sur 0 FP, signé par deux humains. Il ne lit pas la trace brute.
- **« Pourquoi la blockchain ? »** Pour le partage multi-institutions et la vérification par un tiers (auditeur, assureur) ; pour une seule banque, un journal hash-chaîné suffirait, et on le dit.
- **« Vous publiez vos règles de détection ? »** Non : seulement leur empreinte et leurs signatures.
- **« Et les attaques inconnues ? »** La couche innée (provenance SILLAGE, leurres NASSE) bloque par construction ce qui ne vient pas d'une source de confiance ; la boucle vaccin réduit le temps d'adaptation pour le reste ; la sérologie mesure ce qui se dégrade.
