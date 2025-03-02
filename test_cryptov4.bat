@echo off
setlocal enabledelayedexpansion

:: CryptoV4 Complete Testing Script for Windows
:: This batch file tests all components of the CryptoV4 system

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║            CryptoV4 Complete Testing Script            ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Check if we're in the right directory
if not exist "app\frontend" (
    echo Error: Please run this script from the root of the CryptoV4 project
    exit /b 1
)

if not exist "app\backend" (
    echo Error: Please run this script from the root of the CryptoV4 project
    exit /b 1
)

:: ───────── PREREQUISITES CHECK ─────────
echo.
echo ^>^> Checking Prerequisites
echo ────────────────────────────────────────

:: Check for npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed
    exit /b 1
) else (
    echo ✓ npm is installed
)

:: Check for node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do (
        echo ✓ Node.js version: %%i
    )
)

:: Check for python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Python command not found, checking for python3...
    where python3 >nul 2>&1
    if %errorlevel% neq 0 (
        echo Error: Python is not installed
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do (
        echo ✓ %%i
    )
)

:: ───────── FRONTEND TESTING ─────────
echo.
echo ^>^> Testing Frontend Components
echo ────────────────────────────────────────

:: Navigate to frontend directory
cd app\frontend

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Frontend dependencies installation FAILED
        exit /b 1
    ) else (
        echo ✓ Frontend dependencies installation PASSED
    )
) else (
    echo ✓ Frontend dependencies already installed
)

:: Setup MeiliSearch environment if .env.local doesn't exist
if not exist ".env.local" (
    echo Setting up MeiliSearch environment (interactive)...
    echo You can accept default values by pressing Enter
    call npm run meilisearch:setup-env
    if %errorlevel% neq 0 (
        echo ✗ MeiliSearch environment setup FAILED
        exit /b 1
    ) else (
        echo ✓ MeiliSearch environment setup PASSED
    )
) else (
    echo ✓ MeiliSearch environment already configured
)

:: Initialize MeiliSearch indexes
echo Initializing MeiliSearch indexes...
call npm run meilisearch:init
if %errorlevel% neq 0 (
    echo ✗ MeiliSearch index initialization FAILED
    exit /b 1
) else (
    echo ✓ MeiliSearch index initialization PASSED
)

:: Populate MeiliSearch with sample data
echo Populating MeiliSearch with sample data...
call npm run meilisearch:populate
if %errorlevel% neq 0 (
    echo ✗ MeiliSearch sample data population FAILED
    exit /b 1
) else (
    echo ✓ MeiliSearch sample data population PASSED
)

:: Check if frontend tests exist
findstr /C:"\"test\":" package.json >nul 2>&1
if %errorlevel% equ 0 (
    echo Running frontend tests...
    call npm test
    if %errorlevel% neq 0 (
        echo ✗ Frontend tests FAILED (non-critical)
    ) else (
        echo ✓ Frontend tests PASSED
    )
) else (
    echo ⚠ No frontend tests found
)

:: Check if Vite build works
echo Testing production build...
call npm run build
if %errorlevel% neq 0 (
    echo ✗ Frontend production build FAILED
    exit /b 1
) else (
    echo ✓ Frontend production build PASSED
)

:: ───────── BACKEND TESTING ─────────
echo.
echo ^>^> Testing Backend Components
echo ────────────────────────────────────────

:: Navigate to backend directory
cd ..\backend

:: Check if Python virtual environment exists
if not exist "venv" (
    if not exist "..\venv" (
        if not exist "..\..\venv" (
            echo Creating Python virtual environment...
            python -m venv venv
            if %errorlevel% neq 0 (
                echo ✗ Python virtual environment creation FAILED
                exit /b 1
            ) else (
                echo ✓ Python virtual environment creation PASSED
            )
            
            :: Activate virtual environment
            call venv\Scripts\activate
            
            :: Install dependencies
            echo Installing backend dependencies...
            pip install -r requirements.txt
            if %errorlevel% neq 0 (
                echo ✗ Backend dependencies installation FAILED
                exit /b 1
            ) else (
                echo ✓ Backend dependencies installation PASSED
            )
        ) else (
            echo ✓ Python virtual environment already exists
            call ..\..\venv\Scripts\activate
        )
    ) else (
        echo ✓ Python virtual environment already exists
        call ..\venv\Scripts\activate
    )
) else (
    echo ✓ Python virtual environment already exists
    call venv\Scripts\activate
)

:: Check if .env file exists, if not create from example
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file from example...
        copy .env.example .env
        echo ⚠ Created .env file from example. Please update with your actual credentials.
    )
) else (
    echo ✓ Backend .env file already exists
)

:: Run backend tests if available
if exist "tests" (
    echo Running backend tests...
    python -m pytest
    if %errorlevel% neq 0 (
        echo ✗ Backend tests FAILED (non-critical)
    ) else (
        echo ✓ Backend tests PASSED
    )
) else (
    if exist "..\tests" (
        echo Running backend tests...
        python -m pytest ..\tests
        if %errorlevel% neq 0 (
            echo ✗ Backend tests FAILED (non-critical)
        ) else (
            echo ✓ Backend tests PASSED
        )
    ) else (
        echo ⚠ No backend tests found
    )
)

:: ───────── INTEGRATION TESTING ─────────
echo.
echo ^>^> Running Integration Tests
echo ────────────────────────────────────────

:: Return to project root
cd ..\..

:: Check if Flask app runs
echo Checking if Flask backend starts...
python main.py --test
if %errorlevel% neq 0 (
    echo ✗ Flask backend startup test FAILED (non-critical)
) else (
    echo ✓ Flask backend startup test PASSED
)

:: ───────── MEILISEARCH VERIFICATION ─────────
echo.
echo ^>^> Verifying MeiliSearch Integration
echo ────────────────────────────────────────

:: Navigate to frontend directory
cd app\frontend

:: Create temporary script to check MeiliSearch health
echo Checking MeiliSearch health...
echo const { MeiliSearch } = require('meilisearch'); > check_meili.js
echo require('dotenv').config({ path: '.env.local' }); >> check_meili.js
echo. >> check_meili.js
echo const host = process.env.VITE_MEILISEARCH_HOST || 'http://localhost:7700'; >> check_meili.js
echo const apiKey = process.env.VITE_MEILISEARCH_API_KEY || ''; >> check_meili.js
echo. >> check_meili.js
echo const client = new MeiliSearch({ host, apiKey }); >> check_meili.js
echo. >> check_meili.js
echo client.health() >> check_meili.js
echo   .then(health => { >> check_meili.js
echo     console.log('MeiliSearch health status:', health.status); >> check_meili.js
echo     process.exit(0); >> check_meili.js
echo   }) >> check_meili.js
echo   .catch(err => { >> check_meili.js
echo     console.error('MeiliSearch health check failed:', err.message); >> check_meili.js
echo     process.exit(1); >> check_meili.js
echo   }); >> check_meili.js

node check_meili.js
if %errorlevel% neq 0 (
    echo ✗ MeiliSearch health check FAILED (non-critical)
) else (
    echo ✓ MeiliSearch health check PASSED
)

:: Clean up temporary script
del check_meili.js

:: ───────── SUMMARY ─────────
echo.
echo ^>^> Testing Summary
echo ────────────────────────────────────────

echo.
echo ✓ All critical tests completed successfully!
echo.
echo Next steps:
echo 1. Run "npm run dev" in the app\frontend directory to start the dev server
echo 2. Run "python main.py" to start the backend
echo.
echo Note: Some non-critical tests may have failed. Check the output above for details.
echo.

:: Return to project root
cd ..\..

endlocal 