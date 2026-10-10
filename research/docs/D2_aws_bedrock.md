# D2 — AWS Bedrock : ce que dit la doc officielle (lue le 2026-10-10)

[V] = lu dans la doc officielle, [I] = déduit ou incertain.

## Modèles
- [V] Profils UE : `eu.anthropic.claude-sonnet-5-5` et `eu.anthropic.claude-haiku-5-5`, depuis **eu-west-1** (le plus sûr). Pas d'inférence in-region : passer par `eu.` ou `global.`. https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5-5.html
- [V] Structured outputs non supportés sur Sonnet/Haiku 5.5 : valider les arguments d'outils nous-mêmes (zod).
- [V] Erreurs : `FTUFormNotFilled` (404, formulaire Anthropic non rempli), `ThrottlingException` (429), `overloaded_error` (529). Backoff + jitter.
- [V] Quotas par défaut élevés (Sonnet 5.5 : 6 M tokens/min), mais les quotas effectifs d'un compte neuf peuvent être plus bas : vérifier dans Service Quotas.

## Converse
- [V] Tool use : `stopReason == "tool_use"` → on exécute → `toolResult`. https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use-client-side.html
- [V] PDF en `DocumentBlock` (5 documents de 4,5 Mo par message, bloc texte obligatoire). Le champ `name` est vulnérable à l'injection : nom neutre obligatoire. https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_DocumentBlock.html

## Guardrails : le point qui valide notre thèse
- [V] « The prompt attack filter does not evaluate tool results ».
- [V] Avec Converse, les Guardrails n'évaluent **ni `toolResult`, ni les arguments `toolUse.input`**. https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-converse-api.html
- [I] Un PDF passé en `DocumentBlock` n'est probablement pas scanné.
- → La défense native d'AWS ne regarde pas la **décision de paiement**. Il faut une couche déterministe entre `toolUse` et l'exécution : c'est notre passerelle.
- [V] `ApplyGuardrail` est utilisable seul sur le texte extrait de la facture : signal d'entrée en plus, latence d'environ 240 ms dans l'exemple de la doc.

## AgentCore Policy (Cedar)
- [V] GA depuis le 2026-03-03, disponible en eu-west-1 et eu-west-3.
- [V] Intercepte chaque appel d'outil de la Gateway : refus par défaut, `forbid` prioritaire, modes `LOG_ONLY` ou `ENFORCE`. https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html
- [I] Intégration en 24 h : 3 à 6 h, et seulement si les clés donnent des droits IAM, CDK et Lambda.
- → Décision proposée : moteur de règles local avec la **même sémantique** ; AgentCore présenté comme la cible de production, en bonus si les droits sont confirmés.

## Extraction de facture
- [V] Textract AnalyzeExpense : champs normalisés, mais **pas de champ IBAN**. En synchrone : 1 page PDF. https://docs.aws.amazon.com/textract/latest/dg/invoices-receipts.html
- [I] Extracteur indépendant pour recouper le LLM : un écart entre les deux sert de signal.
