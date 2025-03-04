#!/bin/bash

# Exit on error
set -e

echo "🔧 Starting Vercel build process for CryptoV4..."

# Install dependencies with fallback
echo "📦 Installing dependencies..."
npm install || yarn install

# Run optional audit fix (but continue if it fails)
echo "🔍 Running security audit fix..."
npm audit fix --force || echo "⚠️ Audit fix had warnings but continuing build..."

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!" 