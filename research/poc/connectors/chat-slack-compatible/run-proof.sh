#!/usr/bin/env bash
# Replay: Sentinelle Slack-format alert -> self-hosted Mattermost incoming webhook -> read back via API.
set -euo pipefail
cd "$(dirname "$0")"
MM=http://127.0.0.1:8065
J() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log($1)})"; }
docker compose up -d
for i in $(seq 1 60); do curl -s $MM/api/v4/system/ping | grep -q '"status":"OK"' && break; sleep 5; done
# throwaway synthetic credentials, generated now, never stored in repo
PW="Aa1!$(node -e "console.log(require('crypto').randomBytes(12).toString('hex'))")"
ADMIN=sentinelle_admin
curl -s -X POST $MM/api/v4/users -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@sentinelle.test\",\"username\":\"$ADMIN\",\"password\":\"$PW\"}" | J "'admin created: '+j.username+' '+(j.roles||j.message)"
TOKEN=$(curl -si -X POST $MM/api/v4/users/login -H 'Content-Type: application/json' \
  -d "{\"login_id\":\"$ADMIN\",\"password\":\"$PW\"}" | tr -d '\r' | awk -F': ' 'tolower($1)=="token"{print $2}')
[ -n "$TOKEN" ] || { echo "login failed (admin may already exist from a previous run: docker compose down -v first)"; exit 1; }
A="Authorization: Bearer $TOKEN"
curl -s -X PUT $MM/api/v4/config/patch -H "$A" -H 'Content-Type: application/json' \
  -d '{"ServiceSettings":{"EnableIncomingWebhooks":true,"AllowedUntrustedInternalConnections":"localhost"}}' | J "'EnableIncomingWebhooks='+j.ServiceSettings.EnableIncomingWebhooks"
TEAM=$(curl -s -X POST $MM/api/v4/teams -H "$A" -H 'Content-Type: application/json' \
  -d '{"name":"sentinelle","display_name":"Sentinelle SOC","type":"O"}' | J "j.id")
CH=$(curl -s -X POST $MM/api/v4/channels -H "$A" -H 'Content-Type: application/json' \
  -d "{\"team_id\":\"$TEAM\",\"name\":\"alertes-sorties\",\"display_name\":\"Alertes sorties de fonds\",\"type\":\"O\"}" | J "j.id")
HK=$(curl -s -X POST $MM/api/v4/hooks/incoming -H "$A" -H 'Content-Type: application/json' \
  -d "{\"channel_id\":\"$CH\",\"display_name\":\"sentinelle\",\"description\":\"Sentinelle alerts\"}" | J "j.id")
echo "team=$TEAM channel=$CH hook=$HK"
# Slack incoming-webhook payload (synthetic data only)
cat > slack-payload.json <<'JSON'
{
  "text": ":rotating_light: *Sentinelle* - sortie de fonds bloquee (SYNTHETIC)",
  "username": "Sentinelle",
  "attachments": [{
    "color": "#d00000",
    "fallback": "Transfer 1,250,000 USDC blocked by guard",
    "title": "Plafond depasse : 1 250 000 USDC vers 0xDEADbeef00000000000000000000000000000001",
    "fields": [
      {"title": "Chaine", "value": "Avalanche Fuji 43113 (local fork test)", "short": true},
      {"title": "Regle", "value": "CAP-DAILY-EXCEEDED", "short": true},
      {"title": "Action", "value": "Garde on-chain : transfert refuse, demande signee client requise", "short": false}
    ],
    "footer": "Sentinelle - NIST CSF DE.CM / RS.MA"
  }]
}
JSON
echo "webhook POST:"
curl -s -w ' HTTP %{http_code}\n' -X POST $MM/hooks/$HK -H 'Content-Type: application/json' --data @slack-payload.json
sleep 1
echo "--- read back via GET /channels/$CH/posts ---"
curl -s $MM/api/v4/channels/$CH/posts -H "$A" | tee readback.json | J "j.order.map(id=>{const p=j.posts[id];return JSON.stringify({id:p.id,message:p.message,from_webhook:p.props.from_webhook,override_username:p.props.override_username,attachments:p.props.attachments},null,2)}).join('\n')"
echo "--- assertions ---"
node -e "
const j=require('./readback.json');const p=j.posts[j.order[0]];
const a=p.props.attachments[0];
const ok=p.message.includes('Sentinelle')&&p.props.from_webhook==='true'&&a.color==='#d00000'&&a.fields.length===3&&a.title.includes('1 250 000 USDC');
console.log(ok?'PROOF OK: Slack-format message stored and read back via Mattermost API':'PROOF FAILED');process.exit(ok?0:1)"
