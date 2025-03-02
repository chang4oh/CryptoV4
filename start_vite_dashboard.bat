@echo off
echo Starting CryptoV4 Vite React Dashboard...
cd /d %~dp0

REM Check if Node.js is installed
where node > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Flask API is running
echo Checking if Flask API is running...
curl -s http://localhost:5000/api/trading_status > nul 2>&1
if %errorlevel% neq 0 (
    echo Flask API is not running! Starting Flask API...
    start cmd /c "python app/dashboard.py"
    echo Waiting for Flask API to start...
    timeout /t 5 /nobreak > nul
)

REM Navigate to React app directory
cd app\frontend

REM Check if node_modules exists, if not run npm install
if not exist node_modules (
    echo Installing React dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Start the Vite React app
echo Starting Vite React dashboard...
call npm run dev

pause 