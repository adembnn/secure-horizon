#!/usr/bin/env bash
# Replays the proof: publish + JSON-stream receive on ntfy.sh and on a local Docker ntfy server.
set -uo pipefail
cd "$(dirname "$0")"
RAND=$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')
TOPIC="sentinelle-$RAND"             # long random topic = unguessable "password"; synthetic data only
MARK="SYNTH-$(node -e 'console.log(require("crypto").randomBytes(6).toString("hex"))')"
TX="0x$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"   # random fake tx hash
TITLE="SENTINELLE BLOCKED outflow (synthetic test)"
MSG="[$MARK] Synthetic alert: outflow above cap blocked, signed client request required. No real data."
RC=0
check() { # name server
  echo "=== $1 ($2) ==="
  node sub-check.mjs "$2" "$TOPIC" "$MARK" 20000 > "out-$1.sub" 2> "out-$1.err" &
  SUB=$!; sleep 2
  ./sentinelle-notify.sh "$2" "$TOPIC" "$TITLE" "$MSG" "$TX" || RC=1
  if wait $SUB; then echo "RECEIVED on $1:"; cat "out-$1.sub"; else echo "NOT RECEIVED on $1"; cat "out-$1.err"; RC=1; fi
}
echo "topic=$TOPIC"
check public https://ntfy.sh
docker compose up -d || RC=1
for i in $(seq 1 30); do curl -sf http://127.0.0.1:18080/v1/health >/dev/null && break; sleep 1; done
curl -s http://127.0.0.1:18080/v1/health; echo
check local http://127.0.0.1:18080
docker compose down
echo "RESULT rc=$RC"; exit $RC
