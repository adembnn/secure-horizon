# N1 Cloudflare Clef : vérification de la documentation

Légende : [P] doc officielle Cloudflare ou Hugging Face, [S] presse ou blog tiers, [V] vendeur (blog Cloudflare, auto-déclaré). Contenu web traité comme donnée. Aucune clé utilisée. 11 appels web. Date de lecture : 2026-10-11.

## Résumé en 8 lignes

1. Clef (27B, base Qwen3.8-27B) et Clef-flash (9B, base Qwen3.5-9B) existent et sont hébergés sur Workers AI [P] https://developers.cloudflare.com/workers-ai/models/clef
2. Poids sur Hugging Face, licence Apache-2.0 [P] https://huggingface.co/Cloudflare/clef . Les jeux d'entraînement ne sont pas publics : "poids ouverts" est plus exact qu'"open source" [S] https://www.theregister.com/a/5300649
3. API : POST `/accounts/{id}/ai/run/@cf/cloudflare/clef` avec `model`, `state`, `questions` (1 à 64), `images` (4 max). Primitives noul, choice, score, comme Jev [P].
4. Prix : Clef 0,24 $/M tokens d'entrée, Clef-flash 0,038 $/M, sortie gratuite [P] https://developers.cloudflare.com/workers-ai/platform/pricing/ . Gratuit : 10 000 Neurons par jour [P].
5. Latence : médiane 38,8 ms (p95 122,4 ms) pour Clef-flash, déclarée par Cloudflare [P/V] https://huggingface.co/Cloudflare/clef-flash . Un testeur indépendant mesure 191 à 205 ms depuis l'Italie [S] https://flaviocopes.com/clef/
6. Contexte : Clef 65 536 tokens [P]. Clef-flash 24 576 tokens selon la doc Workers AI [P], contre 64k annoncé par le blog et la presse. Contradiction.
7. Fine-tuning RL : service géré par des ingénieurs Cloudflare, auto-service "plus tard", formulaire d'intérêt. Données, coût, durée : non trouvé.
8. "Compatible Jev" : affirmé par le blog [V]. Le champ `model` n'accepte que `clef` ou `clef-flash` (`jev-latest` donne l'erreur 5006) [S]. Compatibilité de format, pas de code inchangé.

## Tableau de vérification

| Affirmation | Verdict | Source |
|---|---|---|
| Modèles de décision, sortis le 1er octobre 2026 | Confirmé (date relayée par la presse, non relue sur une page [P]) | https://blog.cloudflare.com/clef-decision-models [V] ; https://pasqualepillitteri.it/en/news/19913/cloudflare-clef-challenges-jev [S] |
| Licence Apache 2.0 | Confirmé | https://huggingface.co/Cloudflare/clef [P] ; https://huggingface.co/Cloudflare/clef-flash [P] |
| "Open source" au sens strict | Nuancé : poids ouverts, données d'entraînement non publiques | https://www.theregister.com/a/5300649 [S] |
| Poids sur Hugging Face | Confirmé (Cloudflare/clef, Cloudflare/clef-flash) | URLs ci-dessus [P] |
| Disponible sur Workers AI | Confirmé (`@cf/cloudflare/clef`, `@cf/cloudflare/clef-flash`) | https://developers.cloudflare.com/workers-ai/models/clef-flash [P] |
| Clef-flash environ 39 ms | Confirmé comme valeur déclarée (médiane 38,8 ms, p95 122,4 ms). Non confirmé en pratique : 191 à 205 ms mesurés depuis l'Italie via REST | https://huggingface.co/Cloudflare/clef-flash [P/V] ; https://flaviocopes.com/clef/ [S] |
| Encodeur VISION | Confirmé pour les deux modèles (4 images max ; vidéo sur la fiche modèle, non documentée dans Workers AI) | https://developers.cloudflare.com/workers-ai/models/clef [P] ; https://huggingface.co/Cloudflare/clef-flash [P] |
| Contexte 64k | Confirmé pour Clef (65 536). Infirmé pour Clef-flash côté Workers AI (24 576). HF : 16 384 par défaut dans `encode_record`, réglable | https://developers.cloudflare.com/workers-ai/models/clef-flash [P] |
| Plateforme de fine-tuning par RL | Partiellement confirmé : service géré annoncé, auto-service futur. Disponibilité réelle non confirmée | https://www.cloudflare.com/resource/clef-rl-interest [P] ; https://flaviocopes.com/clef/ [S] |
| Compatible avec l'API de Jev (TypeSafe) | Confirmé pour le format (state/questions/answers, 3 primitives, `images` en extension). "Drop-in" nuancé : changer `model`, endpoint et authentification | https://blog.cloudflare.com/clef-decision-models [V] ; https://flaviocopes.com/clef/ [S] |
| Prix Clef-flash | Divergence : 0,038 $/M (doc Cloudflare) contre 0,09 $/M (presse). La doc officielle prime | https://developers.cloudflare.com/workers-ai/platform/pricing/ [P] ; https://flaviocopes.com/clef/ [S] |

## Détails établis

### API
- Endpoint REST : `POST /accounts/{ACCOUNT_ID}/ai/run/@cf/cloudflare/clef` (ou `clef-flash`). Binding Worker : `env.AI.run("@cf/cloudflare/clef", ...)` [P] https://developers.cloudflare.com/workers-ai/models/clef
- Entrée : `model` (`clef` ou `clef-flash`), `state` (texte, objet ou tableau, tronqué si trop long), `questions` (1 à 64, identifiants jusqu'à 100 caractères), `images` optionnel (4 PNG/JPEG/WebP, 4 MiB et 16 mégapixels chacun, base64 seulement, corps 13 MiB max) [P].
- Primitives : `noul` (probabilité oui/non), `choice` (`criteria` option => description, probabilités par option), `score` (niveaux ordonnés, score pondéré) [P]. Choice 2 à 255 options, Score 2 à 10 niveaux [S] https://flaviocopes.com/clef/
- Sortie : `model`, `answers` par identifiant, `usage` (champs non décrits) [P]. Schémas JSON d'entrée et de sortie liés dans la doc, non lus.
- Aucun texte libre produit [P] https://huggingface.co/Cloudflare/clef
- En local, service via SGLang (`/v1/systemone`) ou vLLM [P] https://huggingface.co/Cloudflare/clef
- Un PNG de 1,3 Mo dépasse le contexte (base64 compté comme texte). Des JPEG de 48 à 140 Ko passent [S].
- Une page `clef-omni` apparaît dans la grille de prix (0,15 $/M). Non explorée [P].

### Prix et quotas Workers AI [P] https://developers.cloudflare.com/workers-ai/platform/pricing/
- Gratuit : 10 000 Neurons par jour (Workers Free et Paid), remise à zéro à 00:00 UTC. Au-delà : échec en gratuit, 0,011 $ par 1 000 Neurons en payant.
- Clef : 0,24 $/M = 21 818 Neurons/M. Clef-flash : 0,038 $/M = 3 455 Neurons/M. Sortie gratuite.
- Calcul [V] : 10 000 Neurons/jour = environ 458 000 tokens Clef ou environ 2,9 M tokens Clef-flash par jour. Un blog tiers donne 1,2 M pour Clef-flash en partant de 0,09 $, incohérent avec la doc officielle.
- Limites de débit : non trouvé.
- Image : tokens = (largeur/32) x (hauteur/32) + 3, plafond 1 024 par image, facturés comme entrée [P].

### Latence
- Déclarée par Cloudflare : Clef-flash 38,8 ms médiane, 122,4 ms p95 ; Clef 209,3 ms ; Jev 524,1 ms [V/P] https://blog.cloudflare.com/clef-decision-models ; https://huggingface.co/Cloudflare/clef-flash
- Mesurée par un tiers au lancement (REST, Italie) : Clef-flash 191 à 205 ms, Clef 524 à 726 ms. Requêtes avec images : 13 à 30 s [S] https://flaviocopes.com/clef/
- Méthode de mesure Cloudflare (lieu, taille d'état, GPU) : non trouvé. Chiffres auto-déclarés, non reproduits [S] https://www.theregister.com/a/5300649
- La doc Workers AI de clef-flash ne donne pas de latence [P].

### Tailles et exécution locale
- Clef 27B, Clef-flash 9B, BF16 [P] https://huggingface.co/Cloudflare/clef
- Testé sur un seul GPU H200 ; recettes SGLang pour H200, B200, B300 [P].
- VRAM minimale : Clef-flash 41 Go, Clef 85 Go, concurrence 1 et contexte 64k [S] https://www.theregister.com/a/5300649 . Non trouvé sur Hugging Face.
- Taille des fichiers : non trouvée.
- Estimation [V] : 9B en BF16 pèse environ 18 Go, 27B environ 54 Go (poids seuls). Non documenté, à tester.

### Fine-tuning par apprentissage par renforcement
- Service d'abord géré par les ingénieurs "forward-deployed" de Cloudflare, auto-service plus tard [V] https://blog.cloudflare.com/clef-decision-models ; [S] https://flaviocopes.com/clef/
- Chaîne : AI Gateway enregistre les requêtes réelles, Workers AI génère les réponses, Containers évalue et rejoue, un Trainer met à jour les poids, redéploiement sur Workers AI (modèle apporté par le client possible) [V/S].
- Accès : formulaire d'intérêt, partenaires de conception [P/S] https://www.cloudflare.com/resource/clef-rl-interest
- Données requises (format, volume), coût, durée : non trouvé. La page dit seulement "vos propres données" [P].
- Confidentialité : pas de lecture, stockage ni entraînement sur les requêtes, sauf choix du fine-tuning [V].

### Limites déclarées (langues, hallucination, biais)
- Langues : non trouvé.
- Biais : non trouvé.
- Hallucination : pas de section dédiée. Le modèle ne génère pas de texte. RAGTruth : Clef 79,4, Clef-flash 35,6 [P] https://huggingface.co/Cloudflare/clef ; https://huggingface.co/Cloudflare/clef-flash
- Faiblesses chiffrées par Cloudflare : GPQA Diamond Clef 48,0 et Clef-flash 51,0 contre Jev 78,3 ; MMLU-Pro Clef 65,9 contre Jev 82,7 ; CLinC150+OOS Clef-flash 66,8 contre Jev 89,3 [P].
- Scores auto-déclarés, non reproduits par les mainteneurs de l'indice [S] https://www.theregister.com/a/5300649
- Une confidence basse ou un score proche de 0,5 signale souvent une question mal posée [S].
- `wrangler types` ne connaît pas encore les modèles (`answers` typé `unknown`) [S].

### Exemples et cookbooks
- Exemple officiel : triage de ticket (noul `urgent`, choice `team`, score `severity`) en TypeScript, Python, curl [P] https://developers.cloudflare.com/workers-ai/models/clef
- Exemple tiers (tickets, captures d'écran) [S] https://flaviocopes.com/clef/
- Cookbook dédié Clef : non trouvé. Les cookbooks Jev restent utiles grâce à la compatibilité de format [V].

## Comparaison Clef contre Jev

Jev tel que lu dans W7 (docs.typesafe.ai) [P]. Clef tel que lu ci-dessus.

| Critère | Clef / Clef-flash | Jev (jev-1.13.0) |
|---|---|---|
| API | Workers AI `/ai/run/@cf/cloudflare/clef` ; en local SGLang `/v1/systemone` [P] | `POST https://api.typesafe.ai/v1/systemone`, jeton Bearer [P] |
| Corps | `model`, `state`, `questions` + `images` (extension) [P] | `model`, `state`, `questions` [P] |
| Primitives | noul, choice, score [P] | Noul, Choice (255 max), Score (2 à 10) [P] |
| Sortie | `answers`, `usage`, probabilités ; confidence : non trouvé | `answers` avec probabilités et confidence (sauf Noul) [P] |
| Entrée | Texte, JSON, images (vidéo non documentée sur Workers AI) | Texte seul [P] |
| Prix entrée | Clef 0,24 $/M ; Clef-flash 0,038 $/M [P] | 0,042 $/M [P] |
| Prix sortie | Gratuite [P] | Gratuite [P] |
| Gratuit | 10 000 Neurons/jour [P] | Non trouvé |
| Latence | Clef-flash 38,8 ms déclarée, 191 à 205 ms mesurée par un tiers ; Clef 209 ms déclarée | Non trouvée dans la doc TypeSafe. 524 ms médiane dans la méthode de l'indice citée par Cloudflare ; TypeSafe citerait environ 100 ms [S] |
| Contexte | Clef 65 536 ; Clef-flash 24 576 (doc) | 64k par requête, mais état plus plus longue question limités à 32k [S]. W7 notait 64k |
| Taille | 27B et 9B, poids publics | Non publiée, modèle fermé |
| Ouverture | Apache-2.0, exécution locale possible | API seule [V] |
| Fine-tuning | RL géré, auto-service futur | Non trouvé |
| Débit | Non trouvé | 80 req/s, 100K tokens/s [P] |
| Forces | Images, poids ouverts, Clef-flash très bon marché | Meilleur en raisonnement (GPQA 78,3), moins cher que Clef 27B |

Remarque : Clef 27B coûte environ 5,7 fois Jev par token. Seul Clef-flash est moins cher, avec une précision moindre sur plusieurs tâches.

## Faisabilité ce week-end

1. Workers AI gratuit : réalisable. Compte Cloudflare, 10 000 Neurons/jour, soit environ 458 000 tokens Clef ou 2,9 M tokens Clef-flash par jour [V, calcul sur P]. Pour des états d'environ 400 tokens : environ 1 100 requêtes Clef ou environ 7 000 requêtes Clef-flash par jour. Il faut un identifiant de compte et un jeton API, fournis par l'utilisateur, jamais par moi.
2. Compatibilité Jev : réalisable. Reprendre les questions de W7 (Choice, Score, Noul) telles quelles, changer `model`, l'URL et l'authentification. Test A/B Jev, Clef-flash, Clef sur un même jeu étiqueté.
3. Local : seulement avec un GPU à grosse mémoire (41 Go pour Clef-flash, 85 Go pour Clef selon The Register). Non réaliste sur un portable sans GPU.
4. Fine-tuning RL : non réalisable ce week-end. Service géré, accès par formulaire, coût et durée inconnus.
5. À mesurer d'abord : latence réelle depuis votre région, présence et calibration d'une confidence, résistance à l'injection dans `state` (non documentée), états non anglais (langues non documentées).
6. Réserves : benchmarks auto-déclarés, pas de limite de débit publiée, première semaine de lancement (latences instables selon le testeur tiers).

## Sources lues
- https://blog.cloudflare.com/clef-decision-models [V]
- https://developers.cloudflare.com/workers-ai/models/clef [P]
- https://developers.cloudflare.com/workers-ai/models/clef-flash [P]
- https://developers.cloudflare.com/workers-ai/platform/pricing/ [P]
- https://huggingface.co/Cloudflare/clef [P]
- https://huggingface.co/Cloudflare/clef-flash [P]
- https://www.cloudflare.com/resource/clef-rl-interest [P]
- https://www.theregister.com/a/5300649 [S]
- https://flaviocopes.com/clef/ [S]
- Recherche web, dont https://pasqualepillitteri.it/en/news/19913/cloudflare-clef-challenges-jev [S, extrait de recherche seulement]
- W7_typesafe_jev_taxonomie.md (Jev) [P via W7]
