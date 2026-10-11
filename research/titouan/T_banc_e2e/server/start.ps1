# Lance le serveur local Hold up (127.0.0.1:8787). Usage : powershell -File server\start.ps1  [--no-journal]
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Write-Host 'Node.js est introuvable. Installe Node 22 ou plus recent depuis https://nodejs.org puis relance.'; exit 1 }
$major = [int]((& node -p 'process.versions.node.split(".")[0]'))
if ($major -lt 22) { Write-Host "Node $major est trop ancien : il faut Node 22 ou plus recent."; exit 1 }
& node server.mjs @args
exit $LASTEXITCODE
