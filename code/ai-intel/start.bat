@echo off
REM ─────────────────────────────────────────────────────────────
REM  AI 情报系统 · 一键启动
REM  - 检测 Clash 代理（7890）
REM  - 起 Next dev（后台）
REM  - 等到端口通就自动开浏览器
REM ─────────────────────────────────────────────────────────────
setlocal ENABLEDELAYEDEXPANSION
chcp 65001 >nul
title AI Intel - starting...

cd /d "%~dp0"

echo.
echo ==========================================
echo   AI 情报系统 · 启动中
echo   目录: %CD%
echo ==========================================
echo.

REM ---- 1) 端口占用：已经在跑就直接开浏览器 ----
netstat -ano | findstr ":3000 " | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
  echo [info] 端口 3000 已在运行，直接打开浏览器...
  start "" http://localhost:3000
  timeout /t 2 >nul
  exit /b 0
)

REM ---- 2) 代理自检（只是提醒，不强制） ----
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient).Connect('127.0.0.1',7890); exit 0}catch{exit 1}" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [ok]   代理 127.0.0.1:7890 在线
) else (
  echo [warn] 代理 127.0.0.1:7890 没开，Gemini 可能调不通
  echo        请先启动 Clash / v2ray 再继续（5 秒后继续启动...）
  timeout /t 5 >nul
)

REM ---- 3) 首次运行自动 npm install ----
if not exist node_modules (
  echo [info] 首次运行，执行 npm install...
  call npm install
  if errorlevel 1 (
    echo [err]  npm install 失败
    pause
    exit /b 1
  )
)

REM ---- 4) 后台启动 dev，日志写 dev.log ----
if exist dev.log del /q dev.log
echo [info] 启动 Next dev（日志: dev.log）...
start "ai-intel dev" /MIN cmd /c "npm run dev > dev.log 2>&1"

REM ---- 5) 轮询 3000 端口，最多 60s ----
echo [info] 等待 http://localhost:3000 就绪...
set /a TRIES=0
:wait
set /a TRIES+=1
if %TRIES% GTR 30 (
  echo [err]  60 秒仍未就绪，查看 dev.log
  type dev.log
  pause
  exit /b 1
)
timeout /t 2 >nul
netstat -ano | findstr ":3000 " | findstr LISTENING >nul
if %ERRORLEVEL% NEQ 0 goto wait

echo.
echo ==========================================
echo   ✓ AI Intel is running
echo     UI:  http://localhost:3000
echo     API: http://localhost:3000/api/analyze
echo     关闭: 双击 stop.bat
echo ==========================================
echo.

start "" http://localhost:3000
exit /b 0
