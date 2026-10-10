#!/usr/bin/env bash
# Proof: OCSF Detection Finding (2004) -> Grafana Loki (Docker) -> LogQL read-back. Synthetic data only.
set -euo pipefail
cd "$(dirname "$0")"
LOKI=http://localhost:3100
trap 'docker compose down' EXIT
echo "== 1. Validate event against official OCSF 1.3.0 schema"
node validate.mjs event.ocsf.json schema
echo "== 1b. Negative control (invalid event must be rejected)"
if node validate.mjs bad.json schema; then echo "FAIL: bad event accepted"; exit 1; fi
echo "== 2. Start Loki"
docker compose up -d --quiet-pull 2>&1 | tail -3
for i in $(seq 1 60); do [ "$(curl -s $LOKI/ready)" = "ready" ] && break; sleep 3; done
echo "ready: $(curl -s $LOKI/ready)"; echo "loki version: $(curl -s $LOKI/loki/api/v1/status/buildinfo | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.version,j.revision)})')"
echo "== 3. Push event (raw OCSF JSON as the log line)"
TS_NS=$(node -e 'console.log(String(BigInt(Date.now())*1000000n))')
node -e '
const ev=require("fs").readFileSync("event.ocsf.json","utf8");
console.log(JSON.stringify({streams:[{stream:{job:"sentinelle",format:"ocsf",class_uid:"2004"},values:[[process.argv[1],JSON.stringify(JSON.parse(ev))]]}]}))' "$TS_NS" > push.json
echo "HTTP $(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' --data @push.json $LOKI/loki/api/v1/push)"
sleep 3
echo "== 4. LogQL read-back"
Q='{job="sentinelle"} | json | class_uid="2004" | severity_id="5" | finding_info_uid="sentinelle-demo-0001"'
curl -s -G $LOKI/loki/api/v1/query_range --data-urlencode "query=$Q" --data-urlencode "start=$(( $(date +%s) - 600 ))000000000" --data-urlencode "limit=5" > result.json
node -e '
const r=require("./result.json"); const orig=JSON.parse(require("fs").readFileSync("event.ocsf.json","utf8"));
const vals=r.data.result.flatMap(s=>s.values); console.log("LogQL:",process.argv[1]); console.log("lines returned:",vals.length);
if(!vals.length){console.log("FAIL");process.exit(1)}
const back=JSON.parse(vals[0][1]); console.log("title:",back.finding_info.title,"| class_uid:",back.class_uid,"| severity:",back.severity);
const same=JSON.stringify(back)===JSON.stringify(orig); console.log("round-trip identical to original:",same); if(!same)process.exit(1);
console.log("PROOF OK")' "$Q"
echo "== 5. Metric query (count by class)"
curl -s -G $LOKI/loki/api/v1/query --data-urlencode 'query=count_over_time({job="sentinelle"} | json | class_uid="2004" [15m])' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(JSON.parse(s).data.result.map(r=>r.value))))'
