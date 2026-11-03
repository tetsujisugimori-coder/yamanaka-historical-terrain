$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$toolDir = Join-Path $repo 'tools'
New-Item -ItemType Directory -Force -Path $toolDir | Out-Null
$version = '4.5.9'
$name = "blender-$version-windows-x64.zip"
$url = "https://download.blender.org/release/Blender4.5/$name"
$zip = Join-Path $toolDir $name
if (!(Test-Path $zip)) { Invoke-WebRequest $url -OutFile $zip }
$checksums = (Invoke-WebRequest "https://download.blender.org/release/Blender4.5/blender-$version.sha256").Content
$expected = (($checksums -split "`n" | Where-Object { $_ -match [regex]::Escape($name) }) -split '\s+')[0].ToLower()
$actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected) { throw 'Official Blender checksum mismatch' }
if (!(Test-Path (Join-Path $toolDir "blender-$version-windows-x64/blender.exe"))) { Expand-Archive -LiteralPath $zip -DestinationPath $toolDir }
@{version=$version; url=$url; sha256=$actual; bytes=(Get-Item $zip).Length; verified=$true} | ConvertTo-Json | Set-Content (Join-Path $repo 'evidence/blender-download.json') -Encoding utf8
Write-Output "Blender $version official SHA256 verified"
