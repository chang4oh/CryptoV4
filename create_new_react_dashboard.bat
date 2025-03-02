@echo off
echo This script will create a brand new React dashboard using create-react-app.
echo.
echo WARNING: This will replace your existing frontend if you choose the same location!
echo.
echo Default location: app\frontend
echo.
set /p confirm=Do you want to continue? (y/n): 

if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b
)

cd /d %~dp0

echo.
set /p location=Enter location for the new React app [app\frontend]: 
if "%location%"=="" set location=app\frontend

REM Check if the directory exists and remove it if confirmed
if exist %location% (
    echo.
    echo WARNING: %location% already exists!
    set /p deleteConfirm=Delete existing directory? (y/n): 
    
    if /i not "%deleteConfirm%"=="y" (
        echo Operation cancelled.
        pause
        exit /b
    )
    
    echo Removing existing directory...
    rmdir /S /Q %location%
)

REM Create parent directory if it doesn't exist
for %%I in (%location%\..) do (
    if not exist %%I mkdir %%I
)

echo.
echo Creating a new React app with create-react-app...
echo This may take several minutes...
echo.

REM Use npx to run create-react-app
call npx create-react-app %location%

echo.
echo React app created at: %location%
echo.
echo You can start your new React app with:
echo cd %location% ^& npm start
echo.
pause 