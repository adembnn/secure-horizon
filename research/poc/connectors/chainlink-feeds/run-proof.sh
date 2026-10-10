#!/usr/bin/env bash
# Replays the proof. Requires node>=20, npm, internet access to the public Fuji RPC. No keys, no tx on Fuji.
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --no-audit --no-fund
npx hardhat compile
rm -f mock-address.txt
npx hardhat node --hostname 127.0.0.1 --port 8545 > node.log 2>&1 &
NODE_PID=$!
trap 'kill $NODE_PID 2>/dev/null || true' EXIT
for i in $(seq 1 30); do
  curl -s -m 2 -X POST -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' http://127.0.0.1:8545 | grep -q result && break
  sleep 1
done
node scripts/deploy-mock.js
node scripts/client.js
