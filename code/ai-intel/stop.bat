@echo off
REM 杀掉占用 3000 端口的 Node 进程
chcp 65001 >nul
title AI Intel - stopping...

echo [info] 正在关闭 AI Intel (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do (
  echo   - killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

REM 保险：兜底清掉所有 node，仅当你没有其他 node 项目时使用
REM taskkill /F /IM node.exe /T >nul 2>&1

echo [done]
timeout /t 2 >nul
exit /b 0
