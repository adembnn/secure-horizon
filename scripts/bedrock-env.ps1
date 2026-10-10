# usage : . .\scripts\bedrock-env.ps1      (a DOT-SOURCER)
# Charge .env.bedrock (gitignore) dans l'environnement du processus, sans jamais afficher de secret.
$__eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
try { $__root = (git rev-parse --show-toplevel 2>$null) } finally { $ErrorActionPreference = $__eap }
if (-not $__root) { throw 'Pas dans un repo git' }
$__f = if ($env:BEDROCK_ENV_FILE) { $env:BEDROCK_ENV_FILE } else { Join-Path $__root.Trim() '.env.bedrock' }
if (-not (Test-Path -LiteralPath $__f)) { throw "$__f absent (copier .env.bedrock.example en .env.bedrock puis remplir)" }
foreach ($__line in (Get-Content -LiteralPath $__f -Encoding UTF8)) {
  if ($__line -cnotmatch '^\s*([A-Z][A-Z0-9_]*)=(.*)$') { continue }
  $__k = $Matches[1]; $__v = $Matches[2].Trim()
  if ($__v -eq '') { continue }
  if ($__v.Length -ge 2 -and (($__v.StartsWith('"') -and $__v.EndsWith('"')) -or ($__v.StartsWith("'") -and $__v.EndsWith("'")))) {
    $__v = $__v.Substring(1, $__v.Length - 2)
  }
  [Environment]::SetEnvironmentVariable($__k, $__v, 'Process')
}
$env:CLAUDE_ACTOR = 'worker'
$__prof = if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { '-' }
Write-Host "Bedrock env charge : region=$env:AWS_REGION profile=$__prof model=$env:ANTHROPIC_MODEL"
Remove-Variable __root, __f, __line, __k, __v, __prof, __eap -ErrorAction SilentlyContinue
