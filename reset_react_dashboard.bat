@echo off
echo This script will reset your React dashboard environment.
echo It will delete node_modules, package-lock.json, and other temporary files.
echo.
echo Make sure you have committed any important changes first!
echo.
pause

cd /d %~dp0

REM Navigate to the frontend directory
cd app\frontend

REM Remove build artifacts
echo Removing build artifacts...
if exist build rmdir /S /Q build
if exist .cache rmdir /S /Q .cache
if exist dist rmdir /S /Q dist
if exist coverage rmdir /S /Q coverage

REM Remove node_modules
echo Removing node_modules (this may take a while)...
if exist node_modules rmdir /S /Q node_modules

REM Remove package-lock.json
echo Removing package-lock.json...
if exist package-lock.json del package-lock.json

REM Clean npm cache
echo Cleaning npm cache...
call npm cache clean --force

echo.
echo Reset complete! You can now reinstall dependencies with:
echo npm install
echo.
echo Or run your updated start_react_simple.bat script.
echo.
pause 