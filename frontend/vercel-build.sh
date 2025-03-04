#!/bin/bash

# Script for building the frontend for Vercel deployment

echo "Starting Vercel build process..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the application
echo "Building the application..."
npm run build

echo "Build completed successfully!"
exit 0 