# Cree dist\hold-up-extension.zip (le dossier de l'extension SEULEMENT) et une copie propre dist\hold-up-extension\ prete pour
# "Charger l'extension non empaquetee". Exclut : tests, faux moteur, notes de compatibilite, resultats, captures, fichiers de cles.
# Usage : powershell -ExecutionPolicy Bypass -File server\package.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'extension'
$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'hold-up-extension'
$zip  = Join-Path $dist 'hold-up-extension.zip'
if (-not (Test-Path (Join-Path $src 'manifest.json'))) { throw "manifest.json introuvable dans $src" }
New-Item -ItemType Directory -Force -Path $dist | Out-Null
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
if (Test-Path $zip)   { Remove-Item -Force $zip }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

# 1. Copie des seuls fichiers utiles
$excludeDirs  = @('tests', 'node_modules', '.git', 'shots', 'out')
$excludeNames = @('mock_engine.mjs', 'COMPAT.md')
$excludeExt   = @('.txt', '.map', '.log', '.pem', '.key', '.env', '.p12', '.pfx')
Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length).TrimStart('\')
  $parts = $rel.Split('\')
  if ($parts.Length -gt 1 -and ($excludeDirs | Where-Object { $parts[0..($parts.Length - 2)] -contains $_ })) { return }
  if ($excludeNames -contains $_.Name) { return }
  if ($excludeExt -contains $_.Extension.ToLower()) { return }
  if ($_.Name -like '.env*' -or $_.Name -like '*secret*' -or $_.Name -like 'results*') { return }
  $to = Join-Path $stage $rel
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $to) | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $to
}

# 2. Garde-fou secrets : on refuse de zipper si un motif de cle apparait
$bad = Get-ChildItem -LiteralPath $stage -Recurse -File | Select-String -Pattern '-----BEGIN [A-Z ]*PRIVATE KEY-----', 'sk-[A-Za-z0-9]{20,}', 'AKIA[0-9A-Z]{16}', '0x[0-9a-fA-F]{64}\b.*(private|secret|mnemonic)' -List
if ($bad) { throw ('Motif de secret trouve dans : ' + ($bad.Path -join ', ')) }
$mf = Get-Content -Raw -LiteralPath (Join-Path $stage 'manifest.json') | ConvertFrom-Json
if (-not $mf.manifest_version) { throw 'manifest.json invalide' }

# 3. Zip (le dossier hold-up-extension\ a la racine de l'archive)
Compress-Archive -LiteralPath $stage -DestinationPath $zip -CompressionLevel Optimal
$n = (Get-ChildItem -LiteralPath $stage -Recurse -File).Count
$kb = [math]::Round((Get-Item $zip).Length / 1KB, 1)
Write-Host "OK : $zip ($n fichiers, $kb Ko, version $($mf.version))"
Write-Host "Dossier pret a charger dans Chrome : $stage"
