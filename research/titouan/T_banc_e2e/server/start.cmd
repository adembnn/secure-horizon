@echo off
rem Lance le serveur local Sentinelle (127.0.0.1:8787). Double-clic possible. Ctrl+C pour arreter.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable. Installe Node 22 ou plus recent depuis https://nodejs.org puis relance.
  pause
  exit /b 1
)
node server.mjs %*
if errorlevel 1 pause
