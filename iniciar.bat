@echo off

chcp 65001 >nul

title Pro-Personal

cd /d "%~dp0"



echo.

echo  ========================================

echo   Pro-Personal - Iniciando aplicacao

echo  ========================================

echo.



where node >nul 2>&1

if errorlevel 1 (

  echo [ERRO] Node.js nao encontrado.

  echo Instale em: https://nodejs.org/

  pause

  exit /b 1

)



if not exist "node_modules\" (

  echo Instalando dependencias...

  call npm.cmd install

  if errorlevel 1 goto :erro

)



if not exist "prisma\dev.db" (

  echo Configurando banco de dados...

  call npm.cmd run setup

  if errorlevel 1 goto :erro

)



if not exist ".next\BUILD_ID" (

  echo Compilando aplicacao (primeira vez pode demorar)...

  call npm.cmd run build

  if errorlevel 1 goto :erro

)



:: Testa se ja esta rodando

curl.exe -s -m 3 http://127.0.0.1:3000/api/health 2>nul | findstr /C:"\"ok\":true" >nul

if not errorlevel 1 (

  echo  Servidor ja esta online!

  goto :abrir

)



:: Mata processos antigos na porta 3000

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (

  taskkill /F /PID %%a >nul 2>&1

)



echo  Iniciando servidor...

start "Pro-Personal Server" cmd /k "cd /d %~dp0 && npm.cmd run start"



echo  Aguardando servidor...

set /a n=0

:wait

timeout /t 2 /nobreak >nul

curl.exe -s -m 3 http://127.0.0.1:3000/api/health 2>nul | findstr /C:"\"ok\":true" >nul

if not errorlevel 1 goto :abrir

set /a n+=1

if %n% lss 20 goto :wait



echo.

echo [ERRO] Servidor nao respondeu. Veja a janela "Pro-Personal Server".

pause

exit /b 1



:abrir

echo.

echo  ========================================

echo   Abrindo: http://127.0.0.1:3000

echo  ========================================

echo.

echo  Login demo (senha: demo123):

echo    admin@propersonal.com

echo    personal@demo.com

echo    aluno@demo.com

echo.

start "" "http://127.0.0.1:3000/login"

echo  NAO FECHE a janela "Pro-Personal Server"

echo.

pause

exit /b 0



:erro

echo.

echo [ERRO] Falha ao iniciar. Veja as mensagens acima.

pause

exit /b 1

