#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}CryptoV4 Full Application Starter${NC}"
echo -e "${BLUE}===================================${NC}"
echo

# Check if running from repository root
if [ ! -d "app/frontend" ]; then
  echo -e "${RED}Error: Please run this script from the root of the CryptoV4 project${NC}"
  exit 1
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists python && ! command_exists python3; then
  echo -e "${RED}Error: Python is not installed${NC}"
  exit 1
fi

if ! command_exists npm; then
  echo -e "${RED}Error: npm is not installed${NC}"
  exit 1
fi

echo -e "${GREEN}Starting CryptoV4 Backend and Frontend...${NC}"
echo
echo -e "${YELLOW}This script will start both the backend and frontend servers.${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers when you're done testing.${NC}"
echo

# Use trap to ensure cleanup on exit
trap cleanup EXIT INT TERM
cleanup() {
  echo
  echo -e "${GREEN}Shutting down all servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Create a function to start the backend
start_backend() {
  echo -e "${BLUE}Starting CryptoV4 Backend...${NC}"
  
  # Check if we need to activate a virtual environment
  if [ -d "venv" ]; then
    source venv/bin/activate || source venv/Scripts/activate
  fi
  
  # Start the backend server
  python main.py || python3 main.py &
  BACKEND_PID=$!
  
  echo -e "${GREEN}Backend server started with PID ${BACKEND_PID}${NC}"
  echo -e "${GREEN}Backend should be available at: http://localhost:5000${NC}"
}

# Create a function to start the frontend
start_frontend() {
  echo -e "${BLUE}Starting CryptoV4 Frontend...${NC}"
  cd app/frontend
  
  # Start the frontend server
  npm run dev &
  FRONTEND_PID=$!
  cd ../../
  
  echo -e "${GREEN}Frontend server started with PID ${FRONTEND_PID}${NC}"
  echo -e "${GREEN}Frontend should be available at: http://localhost:5173${NC}"
}

# Start both servers
start_backend
start_frontend

echo
echo -e "${GREEN}All components started successfully!${NC}"
echo 
echo -e "${YELLOW}You can run tests by opening http://localhost:5173 in your browser.${NC}"
echo
echo -e "${BLUE}Press Ctrl+C to shut down all servers when done.${NC}"

# Keep the script running until user terminates it
wait 