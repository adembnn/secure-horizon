# usage : source scripts/bedrock-env.sh      (à SOURCER, pas à exécuter)
# Charge .env.bedrock (gitignoré) dans l'environnement du shell courant, sans jamais afficher de secret.
_sh_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "ERREUR: pas dans un repo git" >&2; return 1 2>/dev/null || exit 1; }
_sh_f="${BEDROCK_ENV_FILE:-$_sh_root/.env.bedrock}"   # BEDROCK_ENV_FILE permet un fichier hors repo
if [ ! -f "$_sh_f" ]; then
  echo "ERREUR: $_sh_f absent (cp .env.bedrock.example .env.bedrock puis remplir)" >&2
  unset _sh_root _sh_f
  return 1 2>/dev/null || exit 1
fi
# Lignes KEY=valeur non vides uniquement ; CR retirés ; guillemets englobants retirés ; pas d'évaluation shell.
while IFS= read -r _sh_line || [ -n "$_sh_line" ]; do
  _sh_line="${_sh_line%$'\r'}"
  case "$_sh_line" in ''|'#'*) continue ;; esac
  _sh_k="${_sh_line%%=*}"; _sh_v="${_sh_line#*=}"
  printf '%s' "$_sh_k" | grep -Eq '^[A-Z][A-Z0-9_]*$' || continue
  [ -n "$_sh_v" ] || continue
  case "$_sh_v" in \"*\") _sh_v="${_sh_v#\"}"; _sh_v="${_sh_v%\"}" ;; \'*\') _sh_v="${_sh_v#\'}"; _sh_v="${_sh_v%\'}" ;; esac
  export "$_sh_k=$_sh_v"
done < "$_sh_f"
export CLAUDE_ACTOR=worker
echo "Bedrock env chargé : region=${AWS_REGION:-?} profile=${AWS_PROFILE:--} model=${ANTHROPIC_MODEL:-default}"
unset _sh_root _sh_f _sh_line _sh_k _sh_v
