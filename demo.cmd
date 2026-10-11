@echo off
rem Hold up : la demo jouee a la main. Double-clic, ou : demo.cmd --sans-holdup
cd /d "%~dp0"
node research\demo_reelle\demo_main\lancer.mjs %*
pause
