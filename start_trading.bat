@echo off
echo Starting CryptoV4 Trading System...
cd /d %~dp0

REM Check if MongoDB is running
echo Checking MongoDB status...
mongosh --eval "db.stats()" > nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not running! Please start MongoDB first.
    echo You can start MongoDB by running: mongod
    pause
    exit /b 1
)

REM Start the trading system
echo MongoDB is running. Starting trading system...
python main.py %*

pause 