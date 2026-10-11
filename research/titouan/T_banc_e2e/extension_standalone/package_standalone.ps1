# package_standalone.ps1 - construit l'extension puis cree ..\dist\hold-up-standalone.zip (le dossier de l'extension SEULEMENT).
#   Sans option : le build livre (la phrase ecrite part au relais local 127.0.0.1:8789) -> hold-up-standalone.zip
#   -NoNetwork  : le build de repli sans aucun reseau (dossier extension_sans_reseau)    -> hold-up-sans-reseau.zip
# Usage (depuis n'importe ou) :  powershell -ExecutionPolicy Bypass -File package_standalone.ps1 [-NoNetwork]
param([switch]$NoNetwork)
$ErrorActionPreference = 'Stop'
$name = if ($NoNetwork) { 'hold-up-sans-reseau' } else { 'hold-up-standalone' }
$flag = if ($NoNetwork) { @('--no-network') } else { @() }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$ext  = Join-Path $here $(if ($NoNetwork) { 'extension_sans_reseau' } else { 'extension' })
$dist = Join-Path (Split-Path -Parent $here) 'dist'
$zip  = Join-Path $dist ($name + '.zip')

# 1) construction (reproductible) puis controle statique : on ne package pas un dossier qui echoue
& node --no-warnings (Join-Path $here 'build_standalone.mjs') $flag; if ($LASTEXITCODE -ne 0) { throw 'build_standalone.mjs a echoue' }
& node (Join-Path $here 'tests\static_check.mjs') $flag | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'controle statique en echec : zip non cree' }

# 2) zip : dossier racine "hold-up-standalone\", separateurs "/" (compatibles avec tous les outils)
New-Item -ItemType Directory -Force $dist | Out-Null
if (Test-Path $zip) {
  try { Remove-Item -LiteralPath $zip -Force -ErrorAction Stop }
  catch { $tree = (Get-Content (Join-Path $ext 'BUILD_INFO.json') -Raw | ConvertFrom-Json).tree_sha256.Substring(0, 8); $zip = Join-Path $dist ($name + '-' + $tree + '.zip'); Write-Warning ('zip existant non supprimable, ecriture sous : ' + $zip); if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force } }
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
$za = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $ext -Recurse -File | Sort-Object FullName | ForEach-Object {
    $rel = $_.FullName.Substring($ext.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $_.FullName, $name + '/' + $rel, [System.IO.Compression.CompressionLevel]::Optimal)
  }
} finally { $za.Dispose(); $fs.Dispose() }

# 3) le zip EST le dossier : chaque entree est relue et comparee, octet pour octet (SHA-256), au fichier du dossier construit a l'instant.
#    Un ecart = echec, zip supprime. Puis l'empreinte du zip est ecrite PAR CE SCRIPT a cote du zip (dist<nom>.BUILD_INFO.json) avec la trace
#    du build (arbre, sorties). Aucun document ne doit recopier une empreinte a la main : il renvoie a ce fichier.
$sha = [System.Security.Cryptography.SHA256]::Create()
$hex = { param($bytes) -join ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) }
$folder = @{}
Get-ChildItem $ext -Recurse -File | ForEach-Object { $folder[$_.FullName.Substring($ext.Length + 1).Replace([char]92, [char]47)] = (& $hex ([System.IO.File]::ReadAllBytes($_.FullName))) }
$zr = [System.IO.Compression.ZipFile]::OpenRead($zip)
$inZip = @{}
try {
  foreach ($e in $zr.Entries) {
    $ms = New-Object System.IO.MemoryStream; $st = $e.Open(); $st.CopyTo($ms); $st.Dispose()
    $inZip[$e.FullName.Substring($name.Length + 1)] = (& $hex $ms.ToArray()); $ms.Dispose()
  }
} finally { $zr.Dispose() }
$diff = @(); foreach ($k in ($folder.Keys + $inZip.Keys | Sort-Object -Unique)) { if ($folder[$k] -ne $inZip[$k]) { $diff += $k } }
if ($diff.Count -gt 0) { Remove-Item -LiteralPath $zip -Force; throw ('le zip ne correspond pas au dossier construit : ' + ($diff -join ', ')) }

$h = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
$n = (Get-ChildItem $ext -Recurse -File).Count
$build = Get-Content (Join-Path $ext 'BUILD_INFO.json') -Raw | ConvertFrom-Json
$info = [ordered]@{ zip = (Split-Path -Leaf $zip); zip_sha256 = $h; zip_octets = (Get-Item $zip).Length; fichiers = $n; dossier = (Split-Path -Leaf $ext);
  identique_au_dossier = $true; tree_sha256 = $build.tree_sha256; build = $build.build; network = $build.network; extension_id = $build.extension_id; outputs = $build.outputs }
$infoPath = Join-Path $dist ($name + '.BUILD_INFO.json')
[System.IO.File]::WriteAllText($infoPath, ($info | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding($false)))
"{0} cree : {1} fichiers, {2:N1} Ko, SHA-256 {3} (identique au dossier, empreinte ecrite dans {4})" -f $zip, $n, ((Get-Item $zip).Length / 1KB), $h, $infoPath
