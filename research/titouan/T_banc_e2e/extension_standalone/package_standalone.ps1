# package_standalone.ps1 - construit l'extension puis cree ..\dist\hold-up-standalone.zip (le dossier de l'extension SEULEMENT).
# Usage (depuis n'importe ou) :  powershell -ExecutionPolicy Bypass -File package_standalone.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$ext  = Join-Path $here 'extension'
$dist = Join-Path (Split-Path -Parent $here) 'dist'
$zip  = Join-Path $dist 'hold-up-standalone.zip'

# 1) construction (reproductible) puis controle statique : on ne package pas un dossier qui echoue
& node --no-warnings (Join-Path $here 'build_standalone.mjs'); if ($LASTEXITCODE -ne 0) { throw 'build_standalone.mjs a echoue' }
& node (Join-Path $here 'tests\static_check.mjs') | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'controle statique en echec : zip non cree' }

# 2) zip : dossier racine "hold-up-standalone\", separateurs "/" (compatibles avec tous les outils)
New-Item -ItemType Directory -Force $dist | Out-Null
if (Test-Path $zip) { Remove-Item $zip -Force }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
$za = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $ext -Recurse -File | Sort-Object FullName | ForEach-Object {
    $rel = $_.FullName.Substring($ext.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $_.FullName, 'hold-up-standalone/' + $rel, [System.IO.Compression.CompressionLevel]::Optimal)
  }
} finally { $za.Dispose(); $fs.Dispose() }

$h = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
$n = (Get-ChildItem $ext -Recurse -File).Count
"{0} cree : {1} fichiers, {2:N1} Ko, SHA-256 {3}" -f $zip, $n, ((Get-Item $zip).Length / 1KB), $h
