@echo off
chcp 65001 >nul
title Pro-Personal - Modo desenvolvimento
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Instale Node.js: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" call npm.cmd install
if not exist "prisma\dev.db" call npm.cmd run setup

echo.
echo  Dev server: http://127.0.0.1:3000
echo  Senha demo: demo123
echo.
start "" "http://127.0.0.1:3000"
call npm.cmd run dev
pause
