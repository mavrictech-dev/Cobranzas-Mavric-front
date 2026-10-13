@echo off
cd /d "%~dp0frontend"
if not exist "out\index.html" (
  echo Preparando la presentacion de Mavric...
  call npm.cmd run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
node scripts\serve.mjs 3000 --open
pause
