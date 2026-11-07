@echo off
set "PATH=%~dp0.tools\nodejs;%PATH%"
echo ==========================================
echo   Menjalankan ATLAX (Tax Web Application)
echo   Tagline: Make Tax Reporting Simpler
echo ==========================================
echo.
npm run dev
pause
