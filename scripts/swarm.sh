#!/usr/bin/env bash
# Lance N workers headless `claude -p` sur Bedrock, 1 tâche = 1 worktree ../wt/<ID> = 1 branche t/<ID>.
# usage : bash scripts/swarm.sh [-j 3] [-b 3] [-t 80] [-n] T-112 T-113 T-120
#   -j  parallélisme (défaut 3)   -b  budget USD par worker (défaut 3)
#   -t  max turns (défaut 80)     -n  dry-run : affiche le plan sans rien créer ni lancer
# Pré-requis : tâches poussées sur origin/main, `files:` disjoints, .env.bedrock rempli, `claude update` fait.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
J=3; BUDGET=3; MAXTURNS=80; DRY=0
while getopts "j:b:t:n" o; do
  case $o in j) J=$OPTARG ;; b) BUDGET=$OPTARG ;; t) MAXTURNS=$OPTARG ;; n) DRY=1 ;; *) exit 1 ;; esac
done
shift $((OPTIND-1))
[ $# -gt 0 ] || { echo "usage: swarm.sh [-j N] [-b USD] [-t turns] [-n] TASK_ID..." >&2; exit 1; }

ALLOWED='Read,Edit,Write,Glob,Grep,Bash(git add *),Bash(git commit *),Bash(git status*),Bash(git diff*),Bash(git push -u origin t/*),Bash(gh pr create *),Bash(npm *),Bash(npx *),Bash(node *),Bash(python *),Bash(pytest*)'

# Flags optionnels selon la version de Claude Code (anciennes versions : flag retiré plutôt que plantage).
EXTRA=()
if [ "$DRY" = 0 ]; then
  command -v claude >/dev/null 2>&1 || { echo "ERREUR: claude introuvable" >&2; exit 1; }
  HELP="$(claude --help 2>&1 || true)"
  grep -q -- '--agent' <<<"$HELP" || echo "ATTENTION: --agent inconnu de cette version (claude update)" >&2
  grep -q -- '--permission-prompts' <<<"$HELP" && EXTRA+=(--permission-prompts none)
  grep -q -- '--max-budget-usd' <<<"$HELP" && EXTRA+=(--max-budget-usd "$BUDGET") || echo "ATTENTION: --max-budget-usd absent, budget non plafonné" >&2
  # shellcheck disable=SC1091
  source scripts/bedrock-env.sh
  # SWARM_MODEL surcharge le modèle de .env.bedrock sans toucher au fichier de secrets (ex. us.anthropic.claude-sonnet-4-6)
  # Les agents déclarent `model: sonnet|opus` : on force aussi les alias, sinon ils pointent vers un modèle absent de Bedrock et le worker reste muet.
  if [ -n "${SWARM_MODEL:-}" ]; then
    export ANTHROPIC_MODEL="$SWARM_MODEL" ANTHROPIC_DEFAULT_SONNET_MODEL="$SWARM_MODEL" ANTHROPIC_DEFAULT_OPUS_MODEL="$SWARM_MODEL" ANTHROPIC_DEFAULT_HAIKU_MODEL="$SWARM_MODEL"
    echo "Modèle des workers : $ANTHROPIC_MODEL"
  fi
  git fetch -q origin main || { echo "ERREUR: git fetch origin main impossible (remote ?)" >&2; exit 1; }
fi

RUN="$(date +%Y%m%d-%H%M%S)"; LOG="$ROOT/logs/swarm/$RUN"
[ "$DRY" = 1 ] || mkdir -p "$LOG"
export ROOT LOG MAXTURNS RUN DRY ALLOWED
export EXTRA_STR="${EXTRA[*]:-}"

run_one() {
  set -uo pipefail
  local id="$1" task agent wt br prompt rc
  task=$(ls "$ROOT"/coord/tasks/"$id"-*.md 2>/dev/null | head -1 || true)
  if [ -z "$task" ]; then echo "[$id] tâche introuvable"; [ "$DRY" = 1 ] || echo "[$id] tâche introuvable" >> "$LOG/_swarm.log"; return 1; fi
  agent=$(sed -n 's/^agent: *\([a-z0-9-]*\).*/\1/p' "$task" | head -1); agent=${agent:-builder-backend}
  br="t/$id"; wt="$(cd "$ROOT/.." && pwd)/wt/$id"
  if [ "$DRY" = 1 ]; then
    echo "[$id] DRY agent=$agent branch=$br wt=$wt task=coord/tasks/$(basename "$task")"
    return 0
  fi
  if [ ! -d "$wt" ]; then
    git -C "$ROOT" worktree add -q "$wt" -b "$br" origin/main 2>/dev/null || git -C "$ROOT" worktree add -q "$wt" "$br" || {
      echo "[$id] worktree impossible" | tee -a "$LOG/_swarm.log"; return 1; }
  fi
  prompt="$LOG/$id.prompt.md"
  sed -e "s#{{TASK_FILE}}#coord/tasks/$(basename "$task")#g" -e "s#{{ID}}#$id#g" -e "s#{{BRANCH}}#$br#g" \
      "$ROOT/scripts/prompts/worker.md" > "$prompt"
  sleep $((RANDOM % 15))     # étalement anti-throttling
  echo "[$id] start agent=$agent wt=$wt" | tee -a "$LOG/_swarm.log"
  # shellcheck disable=SC2086
  ( cd "$wt" && claude -p --agent "$agent" \
      --output-format stream-json --verbose \
      --permission-mode acceptEdits $EXTRA_STR \
      --allowedTools "$ALLOWED" \
      --max-turns "$MAXTURNS" \
      < "$prompt" > "$LOG/$id.jsonl" 2> "$LOG/$id.err" )
  rc=$?
  echo "[$id] end rc=$rc" | tee -a "$LOG/_swarm.log"
}
export -f run_one

printf '%s\n' "$@" | xargs -P "$J" -I{} bash -c 'run_one "$@"' _ {} || true
if [ "$DRY" = 1 ]; then echo "(dry-run : rien n'a été lancé)"; exit 0; fi
node scripts/swarm-report.mjs "$LOG" | tee "$LOG/_report.txt"
echo "Logs : $LOG   (gitignorés — ne jamais les commiter)"
