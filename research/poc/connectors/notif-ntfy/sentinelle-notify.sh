#!/usr/bin/env bash
# Usage: sentinelle-notify.sh <server_url> <topic> <title> <message> <tx_hash_or_address_url_path>
# Publishes an urgent ntfy alert (JSON publish API: title, priority 5, tags, click link, view action).
set -euo pipefail
SERVER="$1"; TOPIC="$2"; TITLE="$3"; MSG="$4"; TX="${5:-0x0000000000000000000000000000000000000000000000000000000000000000}"
URL="https://testnet.snowtrace.io/tx/${TX}"
node -e '
const [server,topic,title,msg,url]=process.argv.slice(1);
const body={topic,title,message:msg,priority:5,tags:["rotating_light","sentinelle","no_entry"],click:url,
  actions:[{action:"view",label:"Open in Snowtrace",url}]};
fetch(server,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
 .then(async r=>{const t=await r.text();console.log(r.status,t);if(!r.ok)process.exit(1)})
 .catch(e=>{console.error(e);process.exit(1)});
' "$SERVER" "$TOPIC" "$TITLE" "$MSG" "$URL"
