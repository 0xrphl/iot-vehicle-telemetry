@echo off
title SOTA Electric Delta-Kart R3F + Leaflet Dashboard Launcher
cd /d "%~dp0"

echo ============================================================================
echo   SOTA Electric Delta-Kart (React Three Fiber + Dark Leaflet GPS + IMU)
echo   Hardware: LilyGO T-SIM7672G V1.1 + BMI160 + DS3231 + 32GB SD + 18650
echo ============================================================================
echo.
echo [1/3] Starting Serial / Wi-Fi WebSocket Bridge on ws://localhost:8081 ...
start "Kart Serial Bridge" python bridge.py

echo [2/3] Starting Vanilla Glassmorphism Server on http://localhost:8080 ...
start "Kart Vanilla Server" python server.py

echo [3/3] Starting React Three Fiber (R3F) + Leaflet Vite Dev Server on http://localhost:5173 ...
cd /d "%~dp0..\r3f_dashboard"
start "Kart R3F Vite Server" cmd /c "npm run dev"

timeout /t 3 >nul
start http://localhost:5173
echo.
echo SOTA React Three Fiber + Leaflet Dashboard opened at http://localhost:5173 !
echo Press any key to stop all background servers...
pause >nul

taskkill /FI "WINDOWTITLE eq Kart Serial Bridge" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Kart Vanilla Server" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Kart R3F Vite Server" /F >nul 2>&1
echo Done.

