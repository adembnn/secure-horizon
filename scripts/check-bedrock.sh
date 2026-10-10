#!/usr/bin/env bash
# usage : bash scripts/check-bedrock.sh
# Vérifie : identité AWS, inference profiles Anthropic disponibles, ping des modèles via Claude Code.
# Coût : 1 à 2 petits appels modèle (quelques centimes).
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel)" || exit 1
# shellcheck disable=SC1091
source "$ROOT/scripts/bedrock-env.sh" || exit 1
FAIL=0
ok(){ printf '  [OK] %s\n' "$1"; }
ko(){ printf '  [KO] %s\n' "$1"; FAIL=1; }

echo "1) Identité AWS"
if command -v aws >/dev/null 2>&1; then
  if aws sts get-caller-identity --query Arn --output text >/dev/null 2>&1; then ok "sts OK"; else ko "sts KO (clés/expiration ?)"; fi
  echo "2) Inference profiles Anthropic disponibles (${AWS_REGION:-?}) — CETTE LISTE FAIT FOI pour les IDs"
  if ! aws bedrock list-inference-profiles --region "${AWS_REGION:-us-east-1}" \
      --query "inferenceProfileSummaries[?contains(inferenceProfileId,'anthropic')].inferenceProfileId" --output text \
      | tr '\t' '\n' | sort | sed 's/^/     /'; then
    echo "     list-inference-profiles refusé (IAM ?) — sans gravité si le ping passe"
  fi
else
  echo "  (aws CLI absente — étapes 1-2 sautées ; installer awscli pour lister les IDs)"
fi

echo "3) Ping modèle via Claude Code"
command -v claude >/dev/null 2>&1 || { ko "claude introuvable dans le PATH"; exit 1; }
for M in "${ANTHROPIC_MODEL:-}" "${ANTHROPIC_DEFAULT_OPUS_MODEL:-}"; do
  [ -z "$M" ] && continue
  OUT=$(claude -p "Reply with exactly: PONG" --model "$M" --output-format json --max-turns 1 2>&1)
  if printf '%s' "$OUT" | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const j=JSON.parse(s.trim().split("\n").pop());
        console.log(`     ${process.argv[1]} -> ${j.is_error?"ERREUR":"ok"} | ${String(j.result).slice(0,80)} | $${j.total_cost_usd}`);
        process.exit(j.is_error || !/PONG/.test(String(j.result)) ? 1 : 0);
      } catch(e) { console.log("     sortie non JSON: " + s.slice(0,300)); process.exit(1); } });' "$M"
  then ok "$M"; else ko "$M"; fi
done

if [ "$FAIL" = 0 ]; then echo "=> Bedrock prêt"; else echo "=> PROBLÈME (voir ci-dessus)"; exit 1; fi
