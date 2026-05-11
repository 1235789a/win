# Create desktop shortcut "AI Intel.lnk" -> start.bat
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\install-shortcut.ps1
# (script is pure ASCII to avoid Windows PowerShell 5.1 codepage issues)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $projectRoot "start.bat"

if (-not (Test-Path $target)) {
  Write-Error "start.bat not found: $target"
  exit 1
}

$desktop = [Environment]::GetFolderPath("Desktop")
$lnkPath = Join-Path $desktop "AI Intel.lnk"

$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($lnkPath)
$lnk.TargetPath       = $target
$lnk.WorkingDirectory = $projectRoot
$lnk.WindowStyle      = 1
$lnk.IconLocation     = "$env:SystemRoot\System32\shell32.dll,13"
$lnk.Description      = "AI Intel - pain-point harvester + AI opportunity scorer"
$lnk.Save()

Write-Host ""
Write-Host "[ok] Shortcut created:" -ForegroundColor Green
Write-Host "     $lnkPath"
Write-Host ""
Write-Host "Double-click the desktop icon to launch." -ForegroundColor Cyan
Write-Host ""
