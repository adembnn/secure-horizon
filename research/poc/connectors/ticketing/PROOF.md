# Preuve ticketing : Gitea auto-hébergé (attempt-1)

## Approche
Gitea 1.22.6 en Docker (SQLite, INSTALL_LOCK, inscription désactivée, port lié à 127.0.0.1:3300). Admin créé par `gitea admin user create` avec un mot de passe aléatoire généré à l'exécution (jamais écrit). Ensuite, uniquement par API REST : création du dépôt privé, de 3 labels (sévérité, DORA), de l'issue d'incident (titre, sévérité, liens de preuve), puis relecture GET de l'issue. Rien créé sur GitHub, aucune transaction chaîne, données synthétiques.

## Versions
Docker 29.6.2, Gitea 1.22.6 (image gitea/gitea:1.22.6), Node 25 (génération mdp / parsing JSON), Git Bash.

## Rejouer
```
bash "C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors/ticketing/attempt-1/run-proof.sh"        # KEEP_UP=1 pour garder le conteneur
```
Le script fait `docker compose down` à la fin (fichiers gardés).

## Sortie réelle observée (run-output.txt)
```
== version
{"version":"1.22.6"}

New user 'sentinelle-admin' has been successfully created!
== create repo
sentinelle-admin/incidents true
== create labels
label 1 severity:critical
label 2 severity:high
label 3 dora:major-ict-incident
== create incident issue
created issue #1
== re-read issue by API
{
 "number": 1,
 "state": "open",
 "title": "[SEV-CRITICAL] Out-of-band outflow anomaly: hot wallet 0xSYNTHETIC (synthetic)",
 "labels": [
  "dora:major-ict-incident",
  "severity:critical"
 ],
 "has_evidence_links": true,
 "html_url": "http://localhost:3300/sentinelle-admin/incidents/issues/1"
 }
```
Issue créée (#1) puis relue par GET /api/v1/repos/sentinelle-admin/incidents/issues/1 : titre, labels severity:critical + dora:major-ict-incident, liens de preuve présents, état open.

## Limites
- Chaque exécution repart d'un conteneur vierge (pas de volume) : l'état n'est pas persisté.
- Label ids 1 et 3 codés en dur (valides sur dépôt neuf). En prod, les résoudre par nom.
- Warning cosmétique à la fin : réseau compose "still in use" (un autre conteneur actif sur le réseau), sans effet sur la preuve.
- Pas de webhook ni d'auth par token testés (basic auth admin jetable). Pour la démo, créer un token API via /api/v1/users/{u}/tokens.
- API Gitea proche mais pas identique à GitHub (chemins /api/v1, labels par id).
