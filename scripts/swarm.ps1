# Lance N workers headless `claude -p` sur Bedrock (Windows PowerShell 5.1).
# 1 tache = 1 worktree ..\wt\<ID> = 1 branche t/<ID>.
# usage : .\scripts\swarm.ps1 -Tasks T-112,T-113 [-J 3] [-Budget 3] [-MaxTurns 80] [-DryRun]
# Pre-requis : taches poussees sur origin/main, `files:` disjoints, .env.bedrock rempli, `claude update` fait.
param(
  [Parameter(Mandatory = $true)][string[]]$Tasks,
  [int]$J = 3,
  [double]$Budget = 3,
  [int]$MaxTurns = 80,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$root = (git rev-parse --show-toplevel).Trim()
Set-Location -LiteralPath $root
$wtBase = Join-Path (Split-Path $root -Parent) 'wt'
$allowed = 'Read,Edit,Write,Glob,Grep,Bash(git add *),Bash(git commit *),Bash(git status*),Bash(git diff*),Bash(git push -u origin t/*),Bash(gh pr create *),Bash(npm *),Bash(npx *),Bash(node *),Bash(python *),Bash(pytest*)'

# Appel natif sans que stderr ne declenche $ErrorActionPreference=Stop (piege PS 5.1).
function Invoke-Native([scriptblock]$sb) {
  $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & $sb 2>&1 | Out-Null; return $LASTEXITCODE } finally { $ErrorActionPreference = $old }
}

$extra = @()
if (-not $DryRun) {
  $cmd = Get-Command claude -ErrorAction SilentlyContinue
  if (-not $cmd) { throw 'claude introuvable dans le PATH' }
  $claudeExe = $cmd.Source
  $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  $help = (& claude --help 2>&1 | Out-String)
  $ErrorActionPreference = $old
  if ($help -notmatch '--agent') { Write-Warning '--agent inconnu de cette version (claude update)' }
  if ($help -match '--permission-prompts') { $extra += @('--permission-prompts', 'none') }
  if ($help -match '--max-budget-usd') { $extra += @('--max-budget-usd', $Budget.ToString([Globalization.CultureInfo]::InvariantCulture)) }
  else { Write-Warning '--max-budget-usd absent : budget non plafonne' }
  . (Join-Path $root 'scripts\bedrock-env.ps1')
  if ((Invoke-Native { git fetch -q origin main }) -ne 0) { throw 'git fetch origin main impossible (remote ?)' }
}

$run = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $root "logs\swarm\$run"
if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $log | Out-Null }
$template = [IO.File]::ReadAllText((Join-Path $root 'scripts\prompts\worker.md'), [Text.Encoding]::UTF8)
$utf8 = New-Object Text.UTF8Encoding $false
$running = @()

foreach ($id in $Tasks) {
  $task = Get-ChildItem -Path (Join-Path $root 'coord\tasks') -Filter "$id-*.md" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $task) {
    Write-Host "[$id] tache introuvable"
    if (-not $DryRun) { Add-Content -LiteralPath "$log\_swarm.log" "[$id] tache introuvable" }
    continue
  }
  $agentLine = Select-String -LiteralPath $task.FullName -Pattern '^agent:\s*([a-z0-9-]+)' | Select-Object -First 1
  $agent = if ($agentLine) { $agentLine.Matches[0].Groups[1].Value } else { 'builder-backend' }
  $br = "t/$id"; $wt = Join-Path $wtBase $id
  if ($DryRun) { Write-Host "[$id] DRY agent=$agent branch=$br wt=$wt task=coord/tasks/$($task.Name)"; continue }

  while (@($running | Where-Object { -not $_.Proc.HasExited }).Count -ge $J) { Start-Sleep -Seconds 3 }
  if (-not (Test-Path -LiteralPath $wt)) {
    if ((Invoke-Native { git worktree add -q $wt -b $br origin/main }) -ne 0) {
      if ((Invoke-Native { git worktree add -q $wt $br }) -ne 0) {
        Add-Content -LiteralPath "$log\_swarm.log" "[$id] worktree impossible"; continue
      }
    }
  }
  $prompt = $template.Replace('{{TASK_FILE}}', "coord/tasks/$($task.Name)").Replace('{{ID}}', $id).Replace('{{BRANCH}}', $br)
  $promptFile = Join-Path $log "$id.prompt.md"
  [IO.File]::WriteAllText($promptFile, $prompt, $utf8)

  $cargs = @('-p', '--agent', $agent, '--output-format', 'stream-json', '--verbose',
             '--permission-mode', 'acceptEdits') + $extra +
           @('--allowedTools', "`"$allowed`"", '--max-turns', "$MaxTurns")
  # claude installe via npm = claude.cmd : Start-Process + redirections passent alors par cmd.exe.
  if ($claudeExe -match '\.(cmd|bat)$') { $file = 'cmd.exe'; $cargs = @('/c', "`"$claudeExe`"") + $cargs }
  else { $file = $claudeExe }

  Start-Sleep -Seconds (Get-Random -Minimum 0 -Maximum 15)   # etalement anti-throttling
  Add-Content -LiteralPath "$log\_swarm.log" "[$id] start agent=$agent wt=$wt"
  Write-Host "[$id] start agent=$agent"
  $p = Start-Process -FilePath $file -ArgumentList $cargs -WorkingDirectory $wt -NoNewWindow -PassThru `
        -RedirectStandardInput $promptFile -RedirectStandardOutput (Join-Path $log "$id.jsonl") -RedirectStandardError (Join-Path $log "$id.err")
  $running += [pscustomobject]@{ Id = $id; Proc = $p }
}

if ($DryRun) { Write-Host '(dry-run : rien n''a ete lance)'; return }
foreach ($r in $running) {
  $r.Proc.WaitForExit()
  Add-Content -LiteralPath "$log\_swarm.log" "[$($r.Id)] end rc=$($r.Proc.ExitCode)"
}
node (Join-Path $root 'scripts\swarm-report.mjs') $log | Tee-Object -FilePath (Join-Path $log '_report.txt')
Write-Host "Logs : $log   (gitignores - ne jamais les commiter)"
