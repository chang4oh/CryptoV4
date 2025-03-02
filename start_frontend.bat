@echo off 
cd app\frontend 
echo Starting CryptoV4 Frontend... 
echo Installing required packages... 
call npm install meilisearch dotenv 
echo Required packages installed. 
call npm run dev 
pause 
