# Preuve : alerte OCSF 2004 -> Grafana Loki -> LogQL

## Approche
1. Validation de event.ocsf.json (Detection Finding, class_uid 2004, OCSF 1.3.0) par validate.mjs contre le schéma officiel téléchargé de schema.ocsf.io (attributs requis, enums, types, objets imbriqués finding_info/metadata/product). Contrôle négatif : bad.json est rejeté.
2. Loki 3.4.2 en Docker (docker-compose.yml, projet sentinelle-siem-ocsf), push API /loki/api/v1/push, ligne de log = JSON OCSF brut, labels job/format/class_uid.
3. Relecture par LogQL (`| json | class_uid="2004" | severity_id="5" | finding_info_uid=...`) et comparaison octet-structurelle avec l'original.
Loki a été retenu au premier essai : OpenSearch/Elasticsearch non nécessaires.

## Versions
Loki 3.4.2 (rev 4fa045d3), Docker 29.6.2, Node 25.6.0, OCSF 1.3.0.

## Rejouer
bash run-proof.sh   (démarre Loki, valide, pousse, requête, puis docker compose down). Prérequis : Docker, Node 18+, accès réseau à schema.ocsf.io la 1re fois (schémas mis en cache dans schema/).

## Sortie réelle observée (proof-output.txt)
```
== 1. Validate event against official OCSF 1.3.0 schema
VALID: OCSF 1.3.0 class detection_finding (2004) - required attrs, enums, types and nested objects (finding_info, metadata, product) checked against official schema
== 1b. Negative control (invalid event must be rejected)
INVALID [
  'finding_info: missing required',
  'category_uid: missing required',
  'metadata: missing required',
  'severity_id: 42 not in enum 0,1,2,3,4,5,6,99'
]
== 2. Start Loki
 Container sentinelle-siem-ocsf-loki-1 Created 
 Container sentinelle-siem-ocsf-loki-1 Starting 
 Container sentinelle-siem-ocsf-loki-1 Started 
ready: ready
loki version: 3.4.2 4fa045d3
== 3. Push event (raw OCSF JSON as the log line)
HTTP 204
== 4. LogQL read-back
LogQL: {job="sentinelle"} | json | class_uid="2004" | severity_id="5" | finding_info_uid="sentinelle-demo-0001"
lines returned: 1
title: Abnormal outflow from custodian hot wallet | class_uid: 2004 | severity: Critical
round-trip identical to original: true
PROOF OK
== 5. Metric query (count by class)
[[1791665501.967,"1"]]
 Container sentinelle-siem-ocsf-loki-1 Stopping 
 Container sentinelle-siem-ocsf-loki-1 Stopped 
 Container sentinelle-siem-ocsf-loki-1 Removing 
 Container sentinelle-siem-ocsf-loki-1 Removed 
 Network sentinelle-siem-ocsf_default Removing 
 Network sentinelle-siem-ocsf_default Removed 
```

## Limites
- Le validateur est maison (pas ajv/ocsf-validator officiel) : couvre requis, enums, types, imbrication ; ne couvre pas les profils, les types contraints (regex, plages) ni les attributs de tableaux d'objets.
- Loki stocke du texte non indexé : le "SIEM" est un log store (pas de règles de corrélation). Les champs sont extraits à la requête via | json (les objets imbriqués sont aplatis avec _ : finding_info_uid).
- Un seul événement, pas de test de volume, pas d'authentification (Loki en auth_enabled local), pas de rétention configurée.
- OpenSearch/Elastic non testés. Aucun fonds, aucune tx, données synthétiques.
- Les conteneurs sont arrêtés (down) ; le conteneur orphelin sentinelle-gitea (autre tentative) n'a pas été touché.
