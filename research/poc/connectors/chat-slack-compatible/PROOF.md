# PROOF - alerte Sentinelle au format Slack, livree dans Mattermost auto-heberge

## Approche
Docker Desktop (demarre manuellement, il etait arrete) -> image `mattermost/mattermost-preview` (Mattermost 11.11.1, build 35958890150), port 127.0.0.1:8065. Tout par API REST : creation admin (premier utilisateur, sans auth), login, `PUT /config/patch` pour activer `EnableIncomingWebhooks`, creation equipe `sentinelle`, canal `alertes-sorties`, webhook entrant, POST du payload Slack (text + attachments colores + fields), relecture par `GET /api/v4/channels/{id}/posts`. Identifiants jetables generes au runtime par le script, jamais ecrits. Donnees synthetiques. Aucun fichier .env lu, aucun service externe, aucune chaine blockchain utilisee.

## Versions
Docker 29.6.2, Mattermost 11.11.1, Node 25 (parsing JSON dans le script), Git Bash.

## Rejouer
    bash run-proof.sh      # depuis ce dossier; idempotent seulement sur volume neuf
    docker compose down -v # pour repartir de zero (admin deja cree sinon)
    docker compose down    # arret des conteneurs (fait)
Fichiers : `docker-compose.yml`, `run-proof.sh`, `slack-payload.json`, `readback.json`, `run-output.txt`.

## Sortie reelle observee (run-output.txt)
```
 Container sentinelle-mm Running 
admin created: sentinelle_admin system_admin system_user
EnableIncomingWebhooks=true
team=8qj3q4sw3iypmj8848j9smse5r channel=fwfgpfp56by9dd6s5xotb8imww hook=p1y5x5sf9ibt3bmx8r6fq5g8nh
webhook POST:
ok HTTP 200
--- read back via GET /channels/fwfgpfp56by9dd6s5xotb8imww/posts ---
{
  "id": "tiuujzykftgdiku9bzffummo4a",
  "message": ":rotating_light: *Sentinelle* - sortie de fonds bloquee (SYNTHETIC)",
  "from_webhook": "true",
  "attachments": [
    {
      "id": 0,
      "fallback": "Transfer 1,250,000 USDC blocked by guard",
      "color": "#d00000",
      "pretext": "",
      "author_name": "",
      "author_link": "",
      "author_icon": "",
      "title": "Plafond depasse : 1 250 000 USDC vers 0xDEADbeef00000000000000000000000000000001",
      "title_link": "",
      "text": "",
      "fields": [
        {
          "title": "Chaine",
          "value": "Avalanche Fuji 43113 (local fork test)",
          "short": true
        },
        {
          "title": "Regle",
          "value": "CAP-DAILY-EXCEEDED",
          "short": true
        },
        {
          "title": "Action",
          "value": "Garde on-chain : transfert refuse, demande signee client requise",
          "short": false
        }
      ],
      "image_url": "",
      "thumb_url": "",
      "footer": "Sentinelle - NIST CSF DE.CM / RS.MA",
      "footer_icon": "",
      "ts": null
    }
  ]
}
{
  "id": "jqh4ks49jtfmf8sesnoiwfqmnc",
  "message": "sentinelle_admin joined the channel."
}
--- assertions ---
PROOF OK: Slack-format message stored and read back via Mattermost API
```

## Limites
- Le webhook Mattermost accepte le format Slack (text, attachments, fields, color, footer) et le stocke tel quel dans `props.attachments`; la couleur et les champs sont conserves. `username` du payload n'est pas applique (override_username absent) car `EnablePostUsernameOverride` est desactive par defaut; le message apparait sous le nom de l'admin webhook. Non active ici.
- Image `preview` : usage demo uniquement (base embarquee, pas de persistance garantie, pas de TLS).
- `AllowedUntrustedInternalConnections=localhost` est regle, inutile pour l'entrant.
- Rendu visuel dans l'UI web non verifie (preuve par API uniquement).
- Rocket.Chat/Zulip non testes (Mattermost a reussi).
- Pas de lien avec Fuji : la livraison de l'alerte est testee avec un payload synthetique, pas depuis le moteur de detection reel.
