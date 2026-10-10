#!/usr/bin/env bash
# Replays the proof: Hardhat 2 fork of Avalanche Fuji, debug_traceTransaction, internal value transfers.
# No key, no signed tx of ours, nothing written to Fuji. Real tx is read via public RPC and replayed locally.
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci --no-audit --no-fund
npx hardhat compile --quiet 2>&1 | grep -vi warning || true
node scripts/find-tx.js
export FORK_BLOCK=$(( $(node -p "require('./real-tx.json').block") - 1 ))
echo "forking Fuji at block $FORK_BLOCK"
npx hardhat run scripts/proof.js 2>&1 | grep -vi "warning" | grep -v '^$'
