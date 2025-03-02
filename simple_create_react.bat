@echo off
echo Creating a new React app in app\frontend...
echo This will take a few minutes.

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

echo Running create-react-app...
npx --yes create-react-app app\frontend

echo.
echo React app created successfully!
echo.
echo To start the app:
echo cd app\frontend
echo npm start
echo.
pause 