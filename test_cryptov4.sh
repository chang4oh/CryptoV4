#!/bin/bash

# CryptoV4 Complete Testing Script
# This script tests all components of the CryptoV4 system

# Text styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            CryptoV4 Complete Testing Script            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to display section headers
section() {
  echo
  echo -e "${YELLOW}▶ $1${NC}"
  echo -e "${YELLOW}$(printf '%.0s─' $(seq 1 50))${NC}"
}

# Function to check if a test passed/failed
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1 - PASSED${NC}"
  else
    echo -e "${RED}✗ $1 - FAILED${NC}"
    if [ "$2" != "non-critical" ]; then
      exit 1
    fi
  fi
}

# Check if we're in the right directory
if [ ! -d "app/frontend" ] || [ ! -d "app/backend" ]; then
  echo -e "${RED}Error: Please run this script from the root of the CryptoV4 project${NC}"
  exit 1
fi

# ───────── PREREQUISITES CHECK ─────────
section "Checking Prerequisites"

# Check for npm
command_exists npm || { echo -e "${RED}Error: npm is not installed${NC}"; exit 1; }
echo -e "${GREEN}✓ npm is installed${NC}"

# Check for python
command_exists python || command_exists python3 || { echo -e "${RED}Error: Python is not installed${NC}"; exit 1; }
echo -e "${GREEN}✓ Python is installed${NC}"

# Check node version
node_version=$(node -v)
echo -e "${GREEN}✓ Node.js version: $node_version${NC}"

# Check python version
python_version=$(python -V 2>&1 || python3 -V 2>&1)
echo -e "${GREEN}✓ Python version: $python_version${NC}"

# ───────── FRONTEND TESTING ─────────
section "Testing Frontend Components"

# Navigate to frontend directory
cd app/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
  check_result "Frontend dependencies installation"
else 
  echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Setup MeiliSearch environment if .env.local doesn't exist
if [ ! -f ".env.local" ]; then
  echo "Setting up MeiliSearch environment (interactive)..."
  echo "You can accept default values by pressing Enter"
  npm run meilisearch:setup-env
  check_result "MeiliSearch environment setup"
else
  echo -e "${GREEN}✓ MeiliSearch environment already configured${NC}"
fi

# Initialize MeiliSearch indexes
echo "Initializing MeiliSearch indexes..."
npm run meilisearch:init
check_result "MeiliSearch index initialization"

# Populate MeiliSearch with sample data
echo "Populating MeiliSearch with sample data..."
npm run meilisearch:populate
check_result "MeiliSearch sample data population"

# Run frontend tests if available
if [ -f "package.json" ] && grep -q "\"test\":" "package.json"; then
  echo "Running frontend tests..."
  npm test
  check_result "Frontend tests" "non-critical"
else
  echo -e "${YELLOW}⚠ No frontend tests found${NC}"
fi

# Check if Vite build works
echo "Testing production build..."
npm run build
check_result "Frontend production build"

# ───────── BACKEND TESTING ─────────
section "Testing Backend Components"

# Navigate to backend directory
cd ../backend

# Check if we have a Python virtual environment
if [ ! -d "venv" ] && [ ! -d "../venv" ] && [ ! -d "../../venv" ]; then
  echo "Creating Python virtual environment..."
  python -m venv venv || python3 -m venv venv
  check_result "Python virtual environment creation"
  
  # Activate virtual environment
  source venv/bin/activate || source venv/Scripts/activate
  
  # Install dependencies
  echo "Installing backend dependencies..."
  pip install -r requirements.txt || pip3 install -r requirements.txt
  check_result "Backend dependencies installation"
else
  echo -e "${GREEN}✓ Python virtual environment already exists${NC}"
  
  # Activate virtual environment
  if [ -d "venv" ]; then
    source venv/bin/activate || source venv/Scripts/activate
  elif [ -d "../venv" ]; then
    source ../venv/bin/activate || source ../venv/Scripts/activate
  else
    source ../../venv/bin/activate || source ../../venv/Scripts/activate
  fi
  
  echo -e "${GREEN}✓ Activated Python virtual environment${NC}"
fi

# Check if .env file exists, if not create from example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
  echo -e "${YELLOW}⚠ Created .env file from example. Please update with your actual credentials.${NC}"
else
  echo -e "${GREEN}✓ Backend .env file already exists${NC}"
fi

# Run backend tests if available
if [ -d "tests" ] || [ -d "../tests" ]; then
  echo "Running backend tests..."
  python -m pytest || python3 -m pytest
  check_result "Backend tests" "non-critical"
else
  echo -e "${YELLOW}⚠ No backend tests found${NC}"
fi

# ───────── INTEGRATION TESTING ─────────
section "Running Integration Tests"

# Return to project root
cd ../..

# Check if Flask app runs
echo "Checking if Flask backend starts..."
python main.py --test || python3 main.py --test
check_result "Flask backend startup test" "non-critical"

# ───────── MEILISEARCH VERIFICATION ─────────
section "Verifying MeiliSearch Integration"

# Navigate to frontend directory
cd app/frontend

# Verify MeiliSearch health
echo "Checking MeiliSearch health..."
node -e "
const { MeiliSearch } = require('meilisearch');
require('dotenv').config({ path: '.env.local' });

const host = process.env.VITE_MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.VITE_MEILISEARCH_API_KEY || '';

const client = new MeiliSearch({ host, apiKey });

client.health()
  .then(health => {
    console.log('MeiliSearch health status:', health.status);
    process.exit(0);
  })
  .catch(err => {
    console.error('MeiliSearch health check failed:', err.message);
    process.exit(1);
  });
"
check_result "MeiliSearch health check" "non-critical"

# ───────── SUMMARY ─────────
section "Testing Summary"

echo -e "${GREEN}✓ All critical tests completed successfully!${NC}"
echo
echo -e "Next steps:"
echo -e "1. Run ${BLUE}npm run dev${NC} in the app/frontend directory to start the dev server"
echo -e "2. Run ${BLUE}python app/backend/app.py${NC} to start the backend"
echo
echo -e "${YELLOW}Note: Some non-critical tests may have failed. Check the output above for details.${NC}"
echo 