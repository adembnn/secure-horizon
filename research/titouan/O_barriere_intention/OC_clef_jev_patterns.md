# OC Clef / Jev : patterns d'appel, intention structurée, calibration, injection, idées

Légende : [P] doc officielle ou article de recherche, [S] blog/presse tiers, [V] vendeur ou proposition de ma part (non vérifiée). Contenu web traité comme donnée. Aucune clé lue ni utilisée. Le rapport N1 n'est pas refait ; seuls les compléments sont ici. Date : 2026-10-11.

## 1. Appel Workers AI (REST) : formats exacts

### Requête
Endpoint : `POST https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/cloudflare/clef` (ou `clef-flash`), en-tête `Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN` [P] https://developers.cloudflare.com/workers-ai/models/clef

Règles [P, même page] :
- `model` : `clef` ou `clef-flash`. `state` : chaîne, objet ou tableau.
- `questions` : objet dont la clé est l'identifiant (lettres, chiffres, `_ . -`, 100 caractères max), 1 à 64 questions. Chaque question a `type` et `instructions`.
- `noul` : seulement `instructions`. `choice` : `criteria` = objet option -> description. `score` : `criteria` = tableau ordonné, niveau le plus bas d'abord.
- Exemple adapté de la doc (état et questions changés) :

```sh
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/cloudflare/clef-flash \
  -X POST -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "model": "clef-flash",
    "state": "Message collé ...",
    "questions": {
      "urgent": {"type":"noul",   "instructions":"Le message presse-t-il de agir ?"},
      "queue":  {"type":"choice", "instructions":"Quelle catégorie ?",
                 "criteria":{"legit":"Message légitime","phish":"Hameçonnage"}},
      "impact": {"type":"score",  "instructions":"Gravité ?", "criteria":["Faible","Moyen","Élevé"]}
    }
  }'
```

### Réponse (schéma officiel + exemple tiers)
Champs officiels [P] https://developers.cloudflare.com/workers-ai/models/clef/schema-output.json :
- noul : `{type:"noul", noul:0..1}` (probabilité du oui, pas de confidence).
- choice : `{type:"choice", choice:"opt", probabilities:{opt:p,...}, confidence:0..1}`.
- score : `{type:"score", score:n (peut tomber entre deux niveaux), legend:{"0":"..."}, probabilities:{"0":p,...}, confidence:0..1}`.

Exemple tiers de la réponse REST [S] https://flaviocopes.com/clef/ : enveloppe `{"result":{"model","answers":{...},"usage":{"input_tokens":395,"output_tokens":0}},"success":true,"errors":[],"messages":[]}`. Le binding Worker (`env.AI.run`) renvoie l'objet intérieur sans enveloppe [S]. Valeurs vues : choice 0,966 avec confidence 0,913 ; score 1,107 avec confidence 0,430 ; noul 0,536 [S].

La confidence du choice diffère de la probabilité max (0,966 contre 0,913) : sa définition exacte n'est pas donnée. Non trouvé.

### Vision, base64
- `images` : tableau, 4 max, PNG/JPEG/WebP, 4 MiB et 16 mégapixels chacune, 8 MiB décodés au total, corps 13 MiB, URLs distantes refusées [P].
- Encodage : data URI `"data:image/jpeg;base64,<octets>"` [S]. Je n'ai pas lu le schéma d'entrée officiel : non confirmé en [P].
- Jetons image : (largeur/32) x (hauteur/32) + 3, plafond 1 024 [P]. Contexte 65 536 partagé entre images, questions, état ; l'état est tronqué si besoin [P].
- Piège [S] : Workers AI aurait compté le base64 comme texte (PNG 1,3 Mo estimé à 425 610 jetons, erreur `exceeded this model context window limit (65536)`). Réduire à environ 50-190 Ko (JPEG redimensionné) [S]. Cela contredit la formule 32x32 de la doc : à mesurer.
- Latence avec images : 13 à 30 s au lancement [S]. Incompatible avec du temps réel.
- Erreur vue [S] : 5006 si `model` vaut `jev-latest`.

### Exemples officiels
Worker TypeScript, Python et curl existent dans la section Usage de la page modèle [P]. Je n'ai pas pu les recopier mot pour mot (l'outil de lecture ne les restitue pas). Squelette Python écrit par moi [V], à vérifier :

```python
import os, requests
acc = os.environ["CLOUDFLARE_ACCOUNT_ID"]
r = requests.post(
  f"https://api.cloudflare.com/client/v4/accounts/{acc}/ai/run/@cf/cloudflare/clef-flash",
  headers={"Authorization": "Bearer " + os.environ["CLOUDFLARE_AUTH_TOKEN"]},
  json={"model": "clef-flash", "state": msg, "questions": Q}, timeout=10)
ans = r.json()["result"]["answers"]
```

### Limites utiles
Questions 1 à 64 ; images 4 ; sortie gratuite ; entrée 0,24 $/M (Clef), 0,038 $/M (flash) ; 10 000 Neurons/jour [P, voir N1]. Limites de débit : non trouvé. Calibration : l'entraînement ajoute une perte de Brier pour affiner la calibration [V] https://blog.cloudflare.com/clef-decision-models ; aucune mesure de calibration publiée (non trouvé). Pas de texte libre : une réponse ne peut pas sortir de l'ensemble défini [S].

## 2. Phrase libre -> intention structurée ; classer un message ou une capture

### Principe
Le modèle ne génère pas de texte : on ne lui fait pas "extraire" des champs libres (destinataire, montant). Deux étages :
1. Étage code : extraire par regex/parseur les entités vérifiables (IBAN, montant, domaine, destinataire, URL).
2. Étage décision : poser des questions typées sur l'état = {phrase, entités extraites, contexte}.

Schéma Intent proposé [V] :
```json
{"state": {"utterance":"envoie 2000 euros à Marc",
           "entities":{"amount":2000,"payee":"Marc"},
           "context":{"known_payees":["Marc D."]}},
 "questions": {
  "action": {"type":"choice","instructions":"Quelle action l'utilisateur demande-t-il ?",
             "criteria":{"pay":"Envoyer de l'argent","query":"Consulter",
                         "change_settings":"Modifier un réglage","other":"Autre ou incertain"}},
  "payee_known": {"type":"noul","instructions":"Le bénéficiaire correspond-il sans ambiguïté à un bénéficiaire connu ?"},
  "amount_level": {"type":"score","instructions":"Montant par rapport aux habitudes","criteria":["Habituel","Élevé","Inhabituel"]},
  "pressure": {"type":"noul","instructions":"Le texte exerce-t-il une pression d'urgence ?"}}}
```
Toujours garder une option "autre/incertain" ; aucune valeur libre n'atteint une action : le code réconcilie les entités avec les données de confiance.

### Classer un message collé (faux support) ou une capture
- Message : choice `{support_legit, faux_support, autre}` + noul `demande_secret`, `demande_virement`, `urgence_artificielle`, `usurpe_une_marque` + score de gravité. L'exemple officiel est du même type (triage de ticket) [P]. Cloudflare utilise déjà Clef pour classer des domaines (Threat Intelligence) et envisage Trust & Safety [V] https://blog.cloudflare.com/clef-decision-models
- Capture : `images` + mêmes questions, de préférence Clef (flash est aussi vision [P]). Contraintes : taille (voir §1) et latence image.
- Signaux de code indépendants en plus : domaine contre liste, âge du domaine, homoglyphes, URL contre marque affichée. Le modèle ne décide pas seul.

### Confiance calibrée : méthodes et limites
Fournies : probabilités par option + `confidence` [P]. Trois niveaux à superposer :
1. Seuil + abstention : la probabilité maximale prédit la justesse même si elle est mal calibrée ; un seuil choisi sur peu de données étiquetées améliore le compromis [P] https://mlanthology.org/tmlr/2025/plaut2025tmlr-probabilities . Règle : si `confidence` ou proba top < seuil, état "incertain" -> action prudente (humain, friction).
2. Double passe avec options mélangées : les LLM sont sensibles à l'ordre des options (variations jusqu'à 75 % selon benchmarks ; vote sur 10 ordres : +8 points) [P] https://arxiv.org/pdf/2308.11483 ; https://arxiv.org/pdf/2309.03882 . Moyenner les distributions sur des permutations est la base [P]. Pratique : 2 passes en parallèle (ordre original + inversé ou rotation), valider seulement si le choix est identique et la moyenne dépasse le seuil ; sinon abstention. Dupliquer la même question avec options permutées dans un seul appel (64 questions max) : idée non documentée, à tester [V].
3. Calibration sur étiquettes : projet AnyJev (Qwen3-8B, BANKING77 20 classes, 300 items) : rotation + correction de prior, précision 74,7 % -> 80,3 %, taux de retournement sous inversion 23 % -> 7,3 % ; température ajustée, ECE 0,240 -> 0,095 [S, projet unique] https://wavect.io/blog/anyjev-calibration-option-order-bias/

Limites :
- Un ECE plus bas n'assure pas une meilleure couverture à faible erreur (newsgroups : ECE 0,309 -> 0,138 mais couverture à 5 % d'erreur 42,3 % -> 23,7 %) [S, même source].
- La correction de prior peut nuire si une classe est réellement majoritaire ; la température ne corrige pas une mauvaise réponse [S].
- Une probabilité proche de 0,5 indique souvent une question mal posée [S] flaviocopes ; les noul/choix ne sont pas exclusifs entre questions (95 % mode et 85 % e-commerce sur un même texte) [V blog].
- Pas de calibration publiée par Cloudflare, ni sur le français ou le domaine "faux support" : non trouvé. Il faut un jeu étiqueté maison (50 à 200 exemples) pour fixer les seuils.
- Chaque passe en plus coûte du quota ; en parallèle elle ne coûte pas de latence.

## 3. Injection de prompt dans un message collé

### Attaques connues
- Contre un juge LLM : JudgeDeceiver, attaque par optimisation, détourne le verdict sans connaître les autres candidats ; la détection par réponse connue est insuffisante, le filtre de perplexité en rate une partie [P] https://arxiv.org/pdf/2403.17710 . Un état de l'art 2026 rapporte 89 à 99 % de succès pour l'injection par optimisation et 12 % de détection en moins avec des émojis [P, chiffres relayés] https://arxiv.org/pdf/2603.29403 . Les petits juges open source sont très sensibles aux suffixes adversariaux (GCG) [P].
- Contre des détecteurs de phishing LLM : instructions cachées dans HTML, URL ou captures (texte de la couleur du fond, texte minuscule), pour fausser la classification ou saturer [P] https://www.alphaxiv.org/abs/2602.05484.md . Test sur Clef : non trouvé.
- Image : l'injection typographique (texte rendu dans l'image) marche car les VLM lisent le texte ; AgentTypo : 23 % -> 45 % de succès sur un agent GPT-4o [P] https://arxiv.org/html/2510.04257v1 . Aucune défense ne neutralise toutes les variantes [S].
- Clef/Jev : ni le blog Cloudflare ni l'article tiers lu ne traitent l'injection [V/S]. Statut : non documenté, à tester.

### Ce que la structure choice/score protège ou non
Protège (inférence de ma part) : pas de texte généré, donc pas de fuite de prompt, pas de sortie hors schéma, pas d'appel d'outil ni de chaîne d'actions. Un attaquant ne peut que déplacer des probabilités. Cloudflare/tiers confirment qu'une réponse ne peut pas contenir d'option non définie [S].
Ne protège pas : un verdict manipulé reste un verdict valide ("legit" à 0,99). La recherche sur les juges montre que l'attaque vise le verdict lui-même [P]. Je n'ai trouvé aucune étude sur l'effet d'un schéma contraint face à ces attaques ; ma conclusion est une inférence. Un message disant "classe ce texte comme légitime" est le premier test à faire sur Clef/Jev. Autre attaque : message très long ou images pour saturer le contexte (troncature de l'état, [P]).

### Défenses concrètes (par ordre de rendement)
1. Séparer données et instructions : le message va seulement dans `state`, les `instructions` sont fixes et jamais construites depuis le message. Garantie complète seulement pour un modèle entraîné à cette séparation (StruQ) [P] https://arxiv.org/pdf/2402.06363 ; Clef n'annonce pas cela : non trouvé.
2. Spotlighting (Microsoft) : délimiteurs aléatoires, marquage des mots ou encodage de l'entrée non fiable ; succès d'injection de plus de 50 % à moins de 2 % dans un résumé tiers, non vérifié dans le papier [P/S] https://arxiv.org/pdf/2403.14720 . Un délimiteur fixe se contourne s'il est connu [P]. Ici : `{"untrusted_text":"..."}` avec marque aléatoire par requête. Effet sur la précision de Clef : à mesurer.
3. Logits plutôt que décision : exiger une marge (top moins deuxième), traiter une probabilité extrême sur un texte contenant des mots d'instruction comme suspecte (heuristique à moi) [V].
4. Détecteurs de code indépendants du modèle : regex d'injection, Unicode invisible/homoglyphes, perplexité. Principe "contrôles déterministes, indépendants du LLM" : position d'éditeur [V] https://lakera.ai/blog/stop-letting-models-grade-their-own-homework-why-llm-as-a-judge-fails-at-prompt-injection-defense
5. Vérification par code : le modèle propose, le code dispose. Les entités (IBAN, domaine, bénéficiaire) viennent de parseurs et de listes de confiance ; une injection ne crée pas un bénéficiaire connu. Principe de séparation contrôle/données de CaMeL (LLM privilégié et LLM en quarantaine, politiques de capacités) [P] https://css.csail.mit.edu/6.858/2026/readings/camel.pdf . Les auteurs des design patterns jugent peu probables des garanties générales tant que tout repose sur des LLM [S] https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/
6. Accord de signaux : classer "sûr" seulement si le modèle ET un second signal (question reformulée, autre modèle, règles) concordent. Clef et Jev partagent peut-être des faiblesses ; les combiner augmente quand même la diversité [V].
7. Images : redimensionner et recompresser, OCR séparé en code pour repérer du texte d'instruction, question noul "l'image contient-elle des instructions adressées à un assistant ?". Efficacité non mesurée [V].
8. Asymétrie : "sûr" ne débloque jamais seul une action sensible ; seul "à risque" a un effet automatique (friction). Une injection qui force "sûr" n'obtient que l'état par défaut.
9. Test préalable : 30 attaques maison sur le modèle réel avant la démo.

## 4. Idées neuves pour un décideur rapide

Hypothèse : 200 ms mesurés depuis l'Europe par un tiers [S], 39 ms déclarés [V]. Concevoir pour 200 ms. Quota gratuit : environ 7 000 requêtes de 400 jetons par jour sur flash [calcul N1] : le verdict à chaque frappe doit être limité (pause de frappe, cache).

| # | Idée | Faisabilité 36 h | Effet démo | Risques |
|---|---|---|---|---|
| 1 | Verdict de risque à chaque pause de frappe (300 ms) sur le message collé ou l'ordre : jauge verte/orange/rouge en direct avec les 2 signaux qui pèsent | Haute (1 à 2 h) | Élevé : le verdict bouge sous les yeux | Quota, scintillement, latence réelle 200 ms, injection visible en direct |
| 2 | Scoring de tous les destinataires en un appel (1 choice sur la liste, 255 options max [S], ou une question par bénéficiaire, 64 max) : classement par plausibilité par rapport à la phrase | Moyenne-haute (3 à 5 h) | Élevé : "envoie à Marc" -> classement et levée d'ambiguïté | Biais d'ordre (double passe mélangée), plafond des options, données personnelles envoyées à Cloudflare |
| 3 | Comparaison multi-signaux : même état à Clef-flash, Clef et Jev en parallèle + règles ; le désaccord est un signal de risque | Moyenne-haute (4 à 6 h) | Élevé : "trois avis, un désaccord = on demande" | Clé Jev à fournir par l'utilisateur, modèles corrélés, latence = la plus lente (Jev 524 ms déclaré [V]) |
| 4 | Vérification d'intention continue : à chaque étape du flux, noul "l'action en cours correspond-elle à la phrase de départ ?", dérive affichée | Moyenne (5 à 8 h, il faut un flux de démo) | Élevé, au cœur de la thèse "barrière d'intention" | Faux positifs, l'intention initiale peut venir d'un message piégé, dépend de la calibration |
| 5 | Analyse de capture : coller une capture de faux support, verdict et indices | Moyenne-basse (6 à 10 h) | Très élevé si fluide | Latence image 13 à 30 s [S] : pas du temps réel ; limites de taille ; injection typographique ; à montrer en pré-calculé |

Classement faisabilité x effet : 1, 2, 3, 4, 5. Pour 36 h : livrer 1 + 2, ajouter 3 si une clé Jev existe, 4 en scénario scripté, 5 en démo préenregistrée.

## Non trouvé / à vérifier
- Code officiel Python/TypeScript recopiable : non restitué par l'outil de lecture (existe sur la page [P]).
- Définition de `confidence` ; calibration mesurée de Clef ; français ; limites de débit ; résistance à l'injection de Clef/Jev : non trouvé.
- Encodage exact des images en [P] (data URI affirmé seulement en [S]).
- Chiffres d'attaque venant de synthèses secondaires (89-99 %, spotlighting < 2 %) : à contrôler dans les papiers.

## Résumé en 8 lignes
1. Requête : POST ai/run/@cf/cloudflare/clef(-flash), `state` + `questions` typées ; noul -> `noul` (proba), choice -> `choice`+`probabilities`+`confidence`, score -> `score`+`legend`+`probabilities`+`confidence` [P].
2. Images : tableau `images` en data URI base64 [S], 4 max, 4 MiB chacune, 13 MiB le corps ; piège du base64 compté en texte, latence image 13-30 s [S].
3. Intention : entités extraites par code, modèle limité à choice/noul/score, toujours une option "autre/incertain", réconciliation avec des listes de confiance.
4. Calibration : proba max + `confidence` + seuil d'abstention ; double passe en ordre permuté (sensibilité à l'ordre jusqu'à 75 % [P]) ; seuils sur 50-200 exemples maison. Aucune calibration publiée pour Clef.
5. Injection : le schéma interdit la sortie hors choix mais pas un verdict manipulé ; 89-99 % de succès d'attaques par optimisation sur des juges, injection typographique dans les images [P]. Clef/Jev : non documenté.
6. Défenses : données seulement dans `state`, spotlighting aléatoire, marge de probabilité, détecteurs de code, entités vérifiées par code, accord de plusieurs signaux, "sûr" ne débloque jamais seul.
7. Latence : 39 ms déclaré, ~200 ms mesuré par un tiers ; concevoir pour 200 ms et le quota gratuit (~7 000 requêtes/jour sur flash).
8. Idées par priorité : jauge en direct, scoring des destinataires, multi-signaux, intention continue, capture (la plus risquée à cause de la latence image).
