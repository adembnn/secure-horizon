#!/bin/bash
# Replays the whole proof. Usage: bash run-proof.sh   (from anywhere). Needs: node >= 18, npm, curl, unzip. No secrets, no account.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/work"
URL="https://www.amf-france.org/sites/institutionnel/files/private/2025-02/dora-incident-reporting-template-v1.2.xlsx"
TPL="$HERE/dl/dora-incident-reporting-template-v1.2.xlsx"; mkdir -p "$HERE/dl" "$HERE/out"
echo "### 1. download official AMF template"
curl -sSL -A "Mozilla/5.0" -o "$TPL" -w "HTTP %{http_code}, %{size_download} bytes\n" "$URL"
sha256sum "$TPL"
echo "### 2. deps"; [ -d node_modules/exceljs ] || npm i --silent exceljs@4.4.0
node -v; npm ls exceljs jszip | grep -E "exceljs|jszip"
echo "### 3. sheets / columns (rows 1-3 of each sheet)"; node inspect.mjs "$TPL" 3 | cut -c1-260
echo "### 4a. fill with exceljs (round-trip)"; node fill.mjs "$TPL" incident.synthetic.json "$HERE/out/dora-initial-notification-FILLED.xlsx"
echo "### 4b. fill lossless (direct XML patch)"; node fill-xml.mjs "$TPL" incident.synthetic.json "$HERE/out/dora-initial-notification-FILLED-lossless.xlsx"
echo "### 5. read back (lossless file)"; node readback.mjs "$TPL" "$HERE/out/dora-initial-notification-FILLED-lossless.xlsx" incident.synthetic.json | cut -c1-170
echo "### 5b. read back (exceljs file) - summary only"; node readback.mjs "$TPL" "$HERE/out/dora-initial-notification-FILLED.xlsx" incident.synthetic.json | grep -E "^cells that differ|^READBACK"
echo "### 6. fidelity vs official template (dropdowns, protection, names)"
./fidelity.sh "$TPL" "$HERE/out/dora-initial-notification-FILLED.xlsx"
./fidelity.sh "$TPL" "$HERE/out/dora-initial-notification-FILLED-lossless.xlsx" | tail -6
echo "### DONE"
