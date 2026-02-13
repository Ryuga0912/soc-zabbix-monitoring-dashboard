@echo off
echo ========================================
echo   Zabbix Monitoring Dashboard v3.0
echo ========================================
echo.

echo [1/3] Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo [3/3] Starting Zabbix dashboard...
echo.
echo ========================================
echo  HTTP Server: http://localhost:3001
echo  WebSocket: ws://localhost:8080
echo  Login: admin / Admin@2024!
echo ========================================
echo.
node zabbix-server.js
