#!/usr/bin/env bash
# Replays the proof: local Hardhat chain, then a Hardhat fork of Fuji (Safe singleton factory). No funds, no signed Fuji tx.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --legacy-peer-deps
npx hardhat compile
echo "=== LOCAL ==="; npx hardhat test
echo "=== FUJI FORK ==="; FORK=1 npx hardhat test
