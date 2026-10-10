#!/usr/bin/env bash
# Replays the proof. Run from this directory. Needs Node (tested v25.6.0) and internet (npm, solc download, optional Fuji fork read-only).
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --legacy-peer-deps
F='WARNING|Invalid Fragment|^$'
echo "### A. Source build (gnosisguild/zodiac-modifier-roles @820e5bc), fresh local Hardhat chain"
npx hardhat compile --force 2>&1 | grep -Ev "$F" | tail -3
npx hardhat test 2>&1 | grep -Ev "$F"
echo; echo "### B. OFFICIAL released Roles v2.1.0 bytecode, 24576-byte limit enforced"
OFFICIAL=1 npx hardhat test 2>&1 | grep -Ev "$F"
echo; echo "### C. Same test on a read-only fork of Avalanche Fuji (chainId 43113); no tx is sent to Fuji"
FORK=1 OFFICIAL=1 npx hardhat test 2>&1 | grep -Ev "$F|blockNumber"
