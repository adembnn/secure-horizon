#!/bin/sh
# pipeline_audit/rejouer_tout.sh : rejoue tout l'audit (un seul processus node à la fois). Depuis T_banc_e2e : sh pipeline_audit/rejouer_tout.sh
# Durée : environ 20 minutes. Sorties dans pipeline_audit/out/.
cd "$(dirname "$0")/.." || exit 1
mkdir -p pipeline_audit/out
FILES=$(cat pipeline_audit/FILES.txt)
( cd . && sha256sum pipeline/evaluate_plus.mjs pipeline/measure.mjs run/policy.mjs detectors_adem/*.mjs server/server.mjs engine/src/rules_extra.mjs engine/src/fixes.mjs pipeline/known_protocols.json 2>/dev/null ) > pipeline_audit/out/snapshot_sha256.txt
node pipeline/measure.mjs redteam/V2_DEV_norm.jsonl --modes=product,product+known,detectors,detectors+premise,detectors+known,detectors+known+premise,detectors+known+intent,detectors+known+intent+premise,live,live+known+intent+premise > pipeline_audit/out/measure_v2dev.txt 2>&1 < /dev/null
node pipeline/measure.mjs $FILES --modes=product,detectors,live > pipeline_audit/out/measure_tous.txt 2>&1 < /dev/null
node pipeline_audit/audit_lowered.mjs --modes=detectors,live,full,detectors+known+intent+premise,live+known+intent+premise --file=cases.jsonl $FILES < /dev/null
node pipeline_audit/analyse.mjs > pipeline_audit/out/analyse.txt 2>&1 < /dev/null
node pipeline_audit/analyse_fp.mjs V2_DEV_norm.jsonl > pipeline_audit/out/fp_v2dev.txt 2>&1 < /dev/null
node pipeline_audit/analyse_fp.mjs > pipeline_audit/out/fp_tous.txt 2>&1 < /dev/null
node pipeline_audit/ablate_full.mjs > pipeline_audit/out/ablate_full.txt 2>&1 < /dev/null
node pipeline_audit/ablate_extra_keys.mjs > pipeline_audit/out/ablate_extra_keys.txt 2>&1 < /dev/null
node pipeline_audit/forge_facts.mjs $FILES > pipeline_audit/out/forge_plain.txt 2>&1 < /dev/null
node pipeline_audit/forge_facts.mjs --known-intent $FILES > pipeline_audit/out/forge_ki.txt 2>&1 < /dev/null
sha256sum pipeline/evaluate_plus.mjs pipeline/measure.mjs run/policy.mjs detectors_adem/*.mjs server/server.mjs engine/src/rules_extra.mjs engine/src/fixes.mjs pipeline/known_protocols.json 2>/dev/null > pipeline_audit/out/snapshot_sha256_apres.txt
echo FINI > pipeline_audit/out/FINI
