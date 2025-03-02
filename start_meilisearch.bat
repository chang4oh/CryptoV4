@echo off 
echo Starting MeiliSearch Server... 
 
REM Check if MeiliSearch is already downloaded 
if not exist "meilisearch.exe" ( 
  echo Downloading MeiliSearch... 
  powershell -Command "Invoke-WebRequest -Uri 'https://github.com/meilisearch/meilisearch/releases/download/v1.1.1/meilisearch-windows-amd64.exe' -OutFile 'meilisearch.exe'" 
  if not exist "meilisearch.exe" ( 
    echo Failed to download MeiliSearch! 
    exit /b 1 
  ) 
  echo MeiliSearch downloaded successfully. 
) else ( 
  echo MeiliSearch already downloaded. 
) 
 
start /b meilisearch.exe --http-addr 127.0.0.1:7700 --master-key masterKey 
echo MeiliSearch is running at http://localhost:7700 
echo Master Key: masterKey 
pause 
