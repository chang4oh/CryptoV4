@echo off
echo Creating a new React app with Vite in app\frontend...
echo This is faster than create-react-app and has fewer dependencies.

cd /d %~dp0

REM Remove existing directory if it exists
if exist app\frontend (
    echo Removing existing app\frontend directory...
    rmdir /s /q app\frontend
)

REM Create app directory if it doesn't exist
if not exist app (
    echo Creating app directory...
    mkdir app
)

echo Running Vite to create React app...
cd app
npx --yes create-vite frontend --template react

echo.
echo React app created successfully with Vite!
echo.
echo To start the app:
echo cd app\frontend
echo npm install
echo npm run dev
echo.
pause 