@echo off
setlocal

echo ===================================
echo CryptoV4 Full Application Starter
echo ===================================
echo.

REM Check if running from repository root
if not exist "app\frontend" (
  echo Error: Please run this script from the root of the CryptoV4 project
  exit /b 1
)

if not exist "app\backend" (
  echo Error: Please run this script from the root of the CryptoV4 project
  exit /b 1
)

REM Create a temporary startup script for MeiliSearch
echo @echo off > start_meilisearch.bat
echo echo Starting MeiliSearch Server... >> start_meilisearch.bat
echo. >> start_meilisearch.bat
echo REM Check if MeiliSearch is already downloaded >> start_meilisearch.bat
echo if not exist "meilisearch.exe" ( >> start_meilisearch.bat
echo   echo Downloading MeiliSearch... >> start_meilisearch.bat
echo   powershell -Command "Invoke-WebRequest -Uri 'https://github.com/meilisearch/meilisearch/releases/download/v1.1.1/meilisearch-windows-amd64.exe' -OutFile 'meilisearch.exe'" >> start_meilisearch.bat
echo   if not exist "meilisearch.exe" ( >> start_meilisearch.bat
echo     echo Failed to download MeiliSearch! >> start_meilisearch.bat
echo     exit /b 1 >> start_meilisearch.bat
echo   ) >> start_meilisearch.bat
echo   echo MeiliSearch downloaded successfully. >> start_meilisearch.bat
echo ) else ( >> start_meilisearch.bat
echo   echo MeiliSearch already downloaded. >> start_meilisearch.bat
echo ) >> start_meilisearch.bat
echo. >> start_meilisearch.bat
echo start /b meilisearch.exe --http-addr 127.0.0.1:7700 --master-key masterKey >> start_meilisearch.bat
echo echo MeiliSearch is running at http://localhost:7700 >> start_meilisearch.bat
echo echo Master Key: masterKey >> start_meilisearch.bat
echo pause >> start_meilisearch.bat

REM Create a temporary startup script for the backend
echo @echo off > start_backend.bat
echo cd %CD% >> start_backend.bat
echo echo Starting CryptoV4 Backend... >> start_backend.bat
echo echo Installing required packages... >> start_backend.bat
echo python -m pip install requests python-dotenv pymongo pandas flask flask-cors textblob langchain huggingface_hub python-binance >> start_backend.bat
echo echo Required packages installed. >> start_backend.bat
echo python main.py >> start_backend.bat
echo pause >> start_backend.bat

REM Create a temporary startup script for the frontend
echo @echo off > start_frontend.bat
echo cd app\frontend >> start_frontend.bat
echo echo Starting CryptoV4 Frontend... >> start_frontend.bat
echo echo Installing required packages... >> start_frontend.bat
echo call npm install meilisearch dotenv >> start_frontend.bat
echo echo Required packages installed. >> start_frontend.bat
echo call npm run dev >> start_frontend.bat
echo pause >> start_frontend.bat

echo Starting CryptoV4 Components...
echo.
echo A new window will open for each component.
echo Close the windows when you're done testing.
echo.
echo Press any key to continue...
pause > nul

REM Start all services in separate windows
start "MeiliSearch Server" cmd /c start_meilisearch.bat
echo MeiliSearch server starting...
timeout /t 3 > nul
start "CryptoV4 Backend" cmd /c start_backend.bat
start "CryptoV4 Frontend" cmd /c start_frontend.bat

echo.
echo Application components are starting up in separate windows.
echo.
echo * MeiliSearch should be available at: http://localhost:7700
echo * Backend should be available at: http://localhost:5000
echo * Frontend should be available at: http://localhost:5173
echo.
echo You can run tests by opening http://localhost:5173 in your browser.
echo.
echo Press any key to shut down and clean up...
pause > nul

REM Cleanup temporary files
del start_meilisearch.bat
del start_backend.bat
del start_frontend.bat

echo Cleaned up temporary files.
echo Done.

endlocal 