#!/usr/bin/env bash
# Replays the proof: 60 s on two public Fuji WebSockets in parallel, socket force-killed at t=25 s to test reconnection.
set -e; cd "$(dirname "$0")"
[ -d node_modules/ws ] || npm install --no-audit --no-fund ws@8.18.3
node probe.mjs
node monitor.mjs avax-official wss://api.avax-test.network/ext/bc/C/ws 60 25 > out-avax.json &
node monitor.mjs publicnode wss://avalanche-fuji-c-chain-rpc.publicnode.com 60 25 > out-publicnode.json &
wait
cat out-avax.json out-publicnode.json
