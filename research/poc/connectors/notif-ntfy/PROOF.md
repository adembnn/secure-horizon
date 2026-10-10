# Preuve ntfy (attempt-1)

## Approche
- `sentinelle-notify.sh <serveur> <sujet> <titre> <message> <txhash>` publie via l'API JSON de ntfy (POST JSON sur la racine) : titre, priorité 5 (urgent), tags `rotating_light,sentinelle,no_entry`, `click` vers `https://testnet.snowtrace.io/tx/<hash>`, et un bouton d'action "view" vers le même lien.
- `sub-check.mjs` s'abonne au flux `/<sujet>/json?since=all` et sort 0 quand un message contenant le marqueur unique arrive.
- `docker-compose.yml` : serveur auto-hébergé `binwiederhier/ntfy:latest`, lié à 127.0.0.1:18080, cache en tmpfs, aucun compte.
- `run-proof.sh` : sujet aléatoire long (`sentinelle-` + 32 hex), marqueur aléatoire, faux hash de tx aléatoire ; s'abonne puis publie sur ntfy.sh, puis sur le serveur local ; fait `docker compose down` à la fin.
- Données 100 % synthétiques. Aucun secret, aucune transaction on-chain.

## Versions
Docker 29.6.2, Node v25.6.0, curl 8.18.0, image ntfy binwiederhier/ntfy:latest (tirée le 2026-10-10 ; ntfy 2.29.0), ntfy.sh public.

## Rejouer
    cd <ce dossier> && ./run-proof.sh      # Docker Desktop doit tourner (daemon)
Code retour 0 = reçu sur les deux.

## Sortie réelle observée (run-output-clean.txt, progression de pull retirée)
- ntfy.sh : publication HTTP 200 (id 6fNFkxFZHNdZ), puis "RECEIVED on public" avec le même message dans le flux JSON (priority 5, tags, click Snowtrace, action view).
- Serveur local : /v1/health `{"healthy":true}`, publication HTTP 200 (id vL634U36AhYv), puis "RECEIVED on local" avec le même contenu.
- Fin : `RESULT rc=0`, conteneur et réseau supprimés (docker compose down).

## Limites
- La réception est vérifiée par le flux JSON, pas sur un vrai téléphone (l'appli ntfy n'a pas été testée ; elle s'abonne au même sujet).
- Le serveur local n'écoute que sur 127.0.0.1 : un téléphone ne l'atteint pas sans tunnel ou IP LAN + NTFY_BASE_URL adapté. Pas d'auth ni de HTTPS en local.
- Sur ntfy.sh, le sujet aléatoire tient lieu de mot de passe ; tout porteur du nom lit les alertes. Ne jamais y mettre de donnée sensible. Quotas anonymes ntfy.sh applicables.
- Le lien Snowtrace pointe un faux hash : la page affichera "introuvable". snowtrace.io a répondu 403 à un curl (anti-bot), lien non vérifié par navigateur.
- Docker Desktop était arrêté au départ et a démarré durant la session (lancé par un autre processus ou par ma tentative).
