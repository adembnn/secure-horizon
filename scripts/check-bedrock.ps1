# usage : .\scripts\check-bedrock.ps1
# Verifie : identite AWS, inference profiles Anthropic disponibles, ping des modeles via Claude Code.
$root = (git rev-parse --show-toplevel).Trim()
. (Join-Path $root 'scripts\bedrock-env.ps1')
$fail = $false

Write-Host '1) Identite AWS'
if (Get-Command aws -ErrorAction SilentlyContinue) {
  aws sts get-caller-identity --query Arn --output text | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host '  [OK] sts' } else { Write-Host '  [KO] sts (cles/expiration ?)'; $fail = $true }
  Write-Host "2) Inference profiles Anthropic ($env:AWS_REGION) - CETTE LISTE FAIT FOI pour les IDs"
  $region = if ($env:AWS_REGION) { $env:AWS_REGION } else { 'us-east-1' }
  aws bedrock list-inference-profiles --region $region `
    --query "inferenceProfileSummaries[?contains(inferenceProfileId,'anthropic')].inferenceProfileId" --output text
  if ($LASTEXITCODE -ne 0) { Write-Host '     list-inference-profiles refuse (IAM ?) - sans gravite si le ping passe' }
} else {
  Write-Host '  (aws CLI absente - etapes 1-2 sautees)'
}

Write-Host '3) Ping modele via Claude Code'
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Host '  [KO] claude introuvable'; exit 1 }
foreach ($m in @($env:ANTHROPIC_MODEL, $env:ANTHROPIC_DEFAULT_OPUS_MODEL) | Where-Object { $_ }) {
  $raw = & claude -p "Reply with exactly: PONG" --model $m --output-format json --max-turns 1 2>&1 | Out-String
  try {
    $last = ($raw.Trim() -split "`r?`n" | Select-Object -Last 1)
    $j = $last | ConvertFrom-Json
    if ($j.is_error -or ([string]$j.result -notmatch 'PONG')) { Write-Host "  [KO] $m : $($j.result)"; $fail = $true }
    else { Write-Host "  [OK] $m (cout $($j.total_cost_usd) USD)" }
  } catch {
    $short = if ($raw.Length -gt 300) { $raw.Substring(0, 300) } else { $raw }
    Write-Host "  [KO] $m : sortie non JSON : $short"; $fail = $true
  }
}
if ($fail) { Write-Host '=> PROBLEME'; exit 1 } else { Write-Host '=> Bedrock pret' }
