#!/usr/bin/env bash
# Replays the proof: generate keys, start handler, run fake co-signer, independent openssl check, stop handler.
set -uo pipefail
cd "$(dirname "$0")"
export APP_LISTENING_PORT=${APP_LISTENING_PORT:-18000}
export CALLBACK_URL="http://127.0.0.1:${APP_LISTENING_PORT}/v2/tx_sign_request"
echo "node $(node --version) / $(openssl version)"
bash gen-keys.sh
node src/server.mjs > handler.log 2>&1 &
HP=$!
trap 'kill $HP 2>/dev/null' EXIT
for i in $(seq 1 30); do grep -q listening handler.log 2>/dev/null && break; sleep 0.2; done
node src/fake-cosigner.mjs; RC=$?
echo; echo "== independent check of the APPROVE response signature with the openssl CLI (not our code)"
openssl dgst -sha256 -verify keys/callback_public.pem -signature keys/_sig keys/_msg
echo; echo "== handler log"; sleep 0.3; cat handler.log
exit $RC
