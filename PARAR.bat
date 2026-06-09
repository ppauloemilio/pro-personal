@echo off
title Pro-Personal - Parar servidor
echo Parando processos na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Encerrando PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
echo Pronto. Pode fechar esta janela.
pause
