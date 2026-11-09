# ShortiGo - build a signed Android release bundle (AAB) for Google Play.
# Run from Windows: double-click tools\release-android.cmd  (repo root is found automatically).
# Secrets (RevenueCat key, AdMob IDs) live ONLY in dart_defines.json on this PC - it is git-ignored.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Fail($msg) {
    Write-Host ''
    Write-Host "STOP: $msg" -ForegroundColor Red
    exit 1
}
function Info($msg)  { Write-Host $msg -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "OK  $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "WARN $msg" -ForegroundColor Yellow }
function Mask($v) {
    if ([string]::IsNullOrEmpty($v)) { return '(empty)' }
    if ($v.Length -le 10) { return '****' }
    return $v.Substring(0, 5) + '...' + $v.Substring($v.Length - 4)
}
function Write-Utf8NoBom($path, $text) {
    [System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
}

Info '=== ShortiGo release to Google Play ==='
if (-not (Test-Path 'pubspec.yaml')) { Fail 'pubspec.yaml not found. Run this from the ShortiGo repo (tools\release-android.cmd).' }
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) { Fail 'flutter was not found in PATH. Open a terminal where "flutter --version" works.' }

# ---------------------------------------------------------------- dart_defines.json
$definesPath = Join-Path $root 'dart_defines.json'
if (-not (Test-Path $definesPath)) {
    if (-not (Test-Path 'dart_defines.example.json')) { Fail 'dart_defines.example.json is missing.' }
    Copy-Item 'dart_defines.example.json' $definesPath
    Warn 'dart_defines.json did not exist - created it from dart_defines.example.json (local file, never committed).'
}
$cfg = Get-Content -Raw -Path $definesPath | ConvertFrom-Json

function Get-Def($name) {
    $p = $cfg.PSObject.Properties[$name]
    if ($null -eq $p -or $null -eq $p.Value) { return '' }
    return ([string]$p.Value).Trim()
}
function Set-Def($name, $value) {
    if ($null -eq $cfg.PSObject.Properties[$name]) {
        $cfg | Add-Member -NotePropertyName $name -NotePropertyValue $value
    } else {
        $cfg.$name = $value
    }
    Write-Utf8NoBom $definesPath (($cfg | ConvertTo-Json -Depth 5) + "`r`n")
}
function Ask-Until($name, $label, $isValid, $hint) {
    $v = Get-Def $name
    while (-not (& $isValid $v)) {
        Write-Host ''
        Warn "$name is not set correctly (now: $(Mask $v))."
        Write-Host "Paste $label  ($hint)"
        $v = (Read-Host 'Paste here (Enter on empty = cancel)').Trim()
        if ($v -eq '') { Fail "$name is required for a Play release. Nothing was built." }
        if (-not (& $isValid $v)) { Write-Host 'That does not look right, try again.' -ForegroundColor Red; continue }
        Set-Def $name $v
        Ok "$name saved to dart_defines.json (local only)."
    }
    Ok "$name = $(Mask $v)"
}

$sample = 'ca-app-pub-3940256099942544'
# RevenueCat: must be the public Android SDK key (goog_...), never test_ and never empty.
Ask-Until 'RC_API_KEY_ANDROID' 'the RevenueCat PUBLIC Android key' `
    { param($v) $v -match '^goog_[A-Za-z0-9]{10,}$' } `
    'RevenueCat > Project settings > API keys > Google Play, starts with goog_'
# AdMob: real IDs, not Google sample IDs.
Ask-Until 'ADMOB_APP_ID_ANDROID' 'your real AdMob Android APP ID' `
    { param($v) ($v -match '^ca-app-pub-\d{16}~\d{10}$') -and -not $v.StartsWith($sample) } `
    'AdMob > App settings, looks like ca-app-pub-1234567890123456~1234567890'
Ask-Until 'ADMOB_REWARDED_ANDROID' 'your real AdMob Android REWARDED ad unit ID' `
    { param($v) ($v -match '^ca-app-pub-\d{16}/\d{10}$') -and -not $v.StartsWith($sample) } `
    'AdMob > Ad units, looks like ca-app-pub-1234567890123456/1234567890'

if ((Get-Def 'ENV') -ne 'prod') { Set-Def 'ENV' 'prod'; Ok 'ENV set to prod.' }
if ((Get-Def 'SENTRY_DSN') -eq '')          { Warn 'SENTRY_DSN is empty - the release will have no crash reports.' }
if ((Get-Def 'REWARD_API_BASE_URL') -eq '') { Warn 'REWARD_API_BASE_URL is empty - rewards use the Firestore fallback.' }

# git safety: dart_defines.json must be ignored
if (Get-Command git -ErrorAction SilentlyContinue) {
    & git check-ignore -q dart_defines.json 2>$null
    if ($LASTEXITCODE -ne 0) { Fail 'dart_defines.json is NOT git-ignored. Add "dart_defines.json" to .gitignore first (git pull this branch).' }
    $global:LASTEXITCODE = 0
}

# ---------------------------------------------------------------- signing
$keyProps = Join-Path $root 'android\key.properties'
if (-not (Test-Path $keyProps)) {
    Fail 'android\key.properties is missing. Copy android\key.properties.example to android\key.properties and fill in the keystore passwords (the upload-keystore.jks file must sit in android\app\).'
}
$props = @{}
Get-Content $keyProps | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z]+)\s*=\s*(.*)$') { $props[$Matches[1]] = $Matches[2].Trim() }
}
foreach ($k in 'storePassword', 'keyPassword', 'keyAlias', 'storeFile') {
    if (-not $props.ContainsKey($k) -or $props[$k] -eq '' -or $props[$k] -like 'replace-with*') {
        Fail "android\key.properties: '$k' is missing or still the example placeholder."
    }
}
$jks = Join-Path (Join-Path $root 'android') $props['storeFile']
if (-not (Test-Path $jks)) { Fail "Keystore file not found: $jks" }
Ok 'Signing: key.properties and keystore found.'

# ---------------------------------------------------------------- build number
$pubspec = Join-Path $root 'pubspec.yaml'
$pubText = [System.IO.File]::ReadAllText($pubspec)
$m = [regex]::Match($pubText, '(?m)^version:\s*(\d+\.\d+\.\d+)\+(\d+)\s*$')
if (-not $m.Success) { Fail 'Could not find "version: x.y.z+N" in pubspec.yaml.' }
$oldBuild = [int]$m.Groups[2].Value
$newBuild = $oldBuild + 1
$newVersion = "$($m.Groups[1].Value)+$newBuild"
Write-Utf8NoBom $pubspec ($pubText.Substring(0, $m.Index) + "version: $newVersion" + $pubText.Substring($m.Index + $m.Length))
Ok "Build number: +$oldBuild -> +$newBuild (version $newVersion)"

function Restore-Pubspec { Write-Utf8NoBom $pubspec $pubText }
function Run-Step($title, [scriptblock]$cmd) {
    Info ">> $title"
    & $cmd
    if ($LASTEXITCODE -ne 0) {
        Restore-Pubspec
        Fail "'$title' failed (exit $LASTEXITCODE). Build number was put back to +$oldBuild."
    }
}

Run-Step 'flutter pub get' { flutter pub get }
$generated = Get-ChildItem -Path (Join-Path $root 'lib') -Recurse -Include '*.g.dart', '*.freezed.dart' -ErrorAction SilentlyContinue
if (-not $generated) {
    Run-Step 'build_runner (generated code missing)' { dart run build_runner build --delete-conflicting-outputs }
}
Run-Step 'flutter build appbundle --release' { flutter build appbundle --release --dart-define-from-file=dart_defines.json }

# ---------------------------------------------------------------- result
$aab = Join-Path $root 'build\app\outputs\bundle\release\app-release.aab'
if (-not (Test-Path $aab)) { Restore-Pubspec; Fail "Build finished but the AAB was not found at $aab" }
$sizeMb = [math]::Round((Get-Item $aab).Length / 1MB, 1)
Write-Host ''
Write-Host '==================================================' -ForegroundColor Green
Write-Host " DONE - version $newVersion ($sizeMb MB)" -ForegroundColor Green
Write-Host " $aab" -ForegroundColor Green
Write-Host '==================================================' -ForegroundColor Green
Write-Host 'Next: Play Console > Production > Create new release > upload this .aab > send for review.'
Write-Host "Optional: commit the version bump ($newVersion) in pubspec.yaml. Do NOT commit dart_defines.json or key.properties."
try { if ($env:OS -eq 'Windows_NT') { Start-Process explorer.exe -ArgumentList "/select,`"$aab`"" } } catch { }
exit 0
