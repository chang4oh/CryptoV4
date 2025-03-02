@echo off
echo Installing dependencies for the CryptoV4 dashboard...

cd /d %~dp0\app\frontend

echo Running npm install...
call npm install

echo.
echo Installing additional dependencies...
call npm install axios bootstrap react-bootstrap chart.js react-chartjs-2 react-icons

echo.
echo Dependencies installed successfully!
echo.
echo To start the app:
echo cd app\frontend
echo npm run dev
echo.
pause 