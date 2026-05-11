@echo off
REM Double-click this file to create a desktop shortcut for AI Intel.
chcp 65001 >nul
title Install AI Intel shortcut

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-shortcut.ps1"
if errorlevel 1 (
  echo [err] failed to create shortcut
  pause
  exit /b 1
)

echo.
echo Done. A shortcut named "AI Intel" has been placed on your desktop.
echo.
pause
exit /b 0
