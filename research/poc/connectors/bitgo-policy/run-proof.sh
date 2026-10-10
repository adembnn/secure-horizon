#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
node mkfixtures.mjs
node proof.mjs
PORT=8787 node server.mjs &
SP=$!
sleep 1
echo "== D. curl against standalone server"
for f in approve deny-unknown-dest deny-over-cap; do
  printf '%s -> HTTP ' "$f"
  curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' --data @fixtures/$f.json http://127.0.0.1:8787/
done
kill $SP
