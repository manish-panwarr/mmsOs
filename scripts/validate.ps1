# PowerShell Build & Lint Validator
$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot

Write-Host "--- Running macOS SPA Portfolio Validation (PowerShell) ---" -ForegroundColor Cyan

$requiredWindows = @('home', 'resume', 'services', 'projects', 'certificates', 'education', 'skills', 'contact')
$htmlPath = Join-Path $rootDir "index.html"
$errors = 0

if (-not (Test-Path $htmlPath)) {
    Write-Host "[ERROR] index.html missing!" -ForegroundColor Red
    $errors++
} else {
    $html = Get-Content -Raw -Path $htmlPath
    foreach ($win in $requiredWindows) {
        if ($html -match "id=`"win-$win`"") {
            Write-Host "[PASS] Window '#win-$win' verified." -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Missing window '#win-$win'!" -ForegroundColor Red
            $errors++
        }
    }

    $forbidden = @('tahoe-music-player', 'cc-music-title', 'tahoe-calendar-card', 'weather-forecast')
    foreach ($f in $forbidden) {
        if ($html -match $f) {
            Write-Host "[ERROR] Found removed feature: $f" -ForegroundColor Red
            $errors++
        }
    }
}

$jsFiles = @('script.js', 'macos-enhancements.js', 'dashboard.js', 'portfolio-data.js', 'terminal.js')
foreach ($f in $jsFiles) {
    $p = Join-Path $rootDir $f
    if (Test-Path $p) {
        Write-Host "[PASS] JS File $f present." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] JS File $f missing!" -ForegroundColor Red
        $errors++
    }
}

$cssFiles = @('style.css', 'dashboard.css', 'macos-enhancements.css')
foreach ($f in $cssFiles) {
    $p = Join-Path $rootDir $f
    if (Test-Path $p) {
        Write-Host "[PASS] CSS File $f present." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] CSS File $f missing!" -ForegroundColor Red
        $errors++
    }
}

if ($errors -gt 0) {
    Write-Host "Validation FAILED with $errors errors." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Validation PASSED with 0 errors. Ready for deployment." -ForegroundColor Green
    exit 0
}
