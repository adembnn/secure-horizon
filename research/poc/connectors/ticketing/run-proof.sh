#!/usr/bin/env bash
# Replays the Gitea incident-ticket proof. Throwaway credentials generated at runtime, never stored.
set -euo pipefail
cd "$(dirname "$0")"
B=http://127.0.0.1:3300
PW="$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')"
docker compose up -d
for i in $(seq 1 60); do curl -fsS $B/api/v1/version >/dev/null 2>&1 && break; sleep 2; done
echo "== version"; curl -fsS $B/api/v1/version; echo
docker exec -u git sentinelle-gitea gitea admin user create --admin --username sentinelle-admin --password "$PW" --email admin@sentinelle.invalid --must-change-password=false
A=(-u "sentinelle-admin:$PW" -H 'Content-Type: application/json')
echo "== create repo"
curl -fsS "${A[@]}" -X POST $B/api/v1/user/repos -d '{"name":"incidents","private":true,"description":"Sentinelle synthetic incidents","auto_init":true}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.full_name,j.private)})'
echo "== create labels"
for l in "severity:critical:d73a4a" "severity:high:e99695" "dora:major-ict-incident:0052cc"; do
  n=${l%%:*}; rest=${l#*:}; name="${n}:${rest%%:*}"; col="${rest##*:}"
  curl -fsS "${A[@]}" -X POST $B/api/v1/repos/sentinelle-admin/incidents/labels -d "{\"name\":\"$name\",\"color\":\"#$col\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log("label",JSON.parse(s).id,JSON.parse(s).name))'
done
echo "== create incident issue"
cat > /tmp/issue.$$.json <<'JSON'
{"title":"[SEV-CRITICAL] Out-of-band outflow anomaly: hot wallet 0xSYNTHETIC (synthetic)",
 "body":"## Incident SENT-2026-0001 (synthetic data)\n- Severity: **critical**\n- Detected: 2026-10-10T22:00:00Z by Sentinelle out-of-band monitor\n- Guard action: outflow cap hit, client-signed request required\n\n## Evidence links\n- Tx: https://testnet.snowtrace.io/tx/0xSYNTHETIC\n- Alert: https://sentinelle.invalid/alerts/SENT-2026-0001\n- DORA dossier: https://sentinelle.invalid/dora/SENT-2026-0001.pdf\n\nFrameworks: NIST CSF 2.0 DE.CM / RS.MA ; ATT&CK T1657",
 "labels":[1,3]}
JSON
CREATED="$(curl -fsS "${A[@]}" -X POST $B/api/v1/repos/sentinelle-admin/incidents/issues -d @/tmp/issue.$$.json)"
NUM="$(echo "$CREATED" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).number))')"
echo "created issue #$NUM"
echo "== re-read issue by API"
curl -fsS "${A[@]}" $B/api/v1/repos/sentinelle-admin/incidents/issues/$NUM | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(JSON.stringify({number:j.number,state:j.state,title:j.title,labels:j.labels.map(l=>l.name),has_evidence_links:/dora\/SENT-2026-0001\.pdf/.test(j.body)&&/snowtrace/.test(j.body),html_url:j.html_url},null,1))})'
rm -f /tmp/issue.$$.json
if [ "${KEEP_UP:-0}" != 1 ]; then docker compose down; fi
