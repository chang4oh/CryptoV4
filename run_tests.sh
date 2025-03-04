#!/bin/bash
# CryptoV4 Integration Test Script
# This script runs all tests for the CryptoV4 project

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  CryptoV4 Integration Test Suite        ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo

# Create a timestamp for this test run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test_results_${TIMESTAMP}"

# Create results directory
mkdir -p $RESULTS_DIR
echo -e "${YELLOW}Creating results directory: ${RESULTS_DIR}${NC}"

# Function to print section header
print_section() {
    echo
    echo -e "${GREEN}----------------------------------------${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}----------------------------------------${NC}"
    echo
}

# Function to handle command result
handle_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}[PASS] $2 passed${NC}"
    else
        echo -e "${RED}[FAIL] $2 failed${NC}"
        FAILED_TESTS+=("$2")
    fi
}

# Initialize array to track failed tests
FAILED_TESTS=()

# Run setup test
print_section "Running Setup Tests"
python test_setup.py
handle_result $? "Setup test"

# Copy logs to results directory
cp setup_test.log $RESULTS_DIR/ 2>/dev/null || echo -e "${YELLOW}No setup_test.log found${NC}"

# Check for python packages
print_section "Checking Python Dependencies"
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies from requirements.txt"
    pip install -r requirements.txt || echo -e "${RED}Warning: Some dependencies could not be installed${NC}"
else
    echo -e "${YELLOW}requirements.txt not found. Skipping dependency installation.${NC}"
fi

# Run integration tests only if the file exists
if [ -f "test_integration.py" ]; then
    print_section "Running Integration Tests"
    python test_integration.py
    handle_result $? "Integration test"
    
    # Copy logs to results directory
    cp integration_test.log $RESULTS_DIR/ 2>/dev/null || echo -e "${YELLOW}No integration_test.log found${NC}"
else
    print_section "Integration Test Information"
    echo -e "${YELLOW}test_integration.py not found. Skipping integration tests.${NC}"
    echo -e "${YELLOW}Please create this file to enable full test coverage.${NC}"
fi

# Copy any other test results
cp -R test_results/* $RESULTS_DIR/ 2>/dev/null || echo -e "${YELLOW}No test_results directory found${NC}"

# Summary
print_section "Test Summary"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
else
    echo -e "${RED}The following tests failed:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}- $test${NC}"
    done
    echo
    echo -e "${YELLOW}Please check the logs in $RESULTS_DIR for details.${NC}"
fi

echo
echo -e "${GREEN}Tests completed at $(date)${NC}"
echo -e "${GREEN}Results saved to $RESULTS_DIR${NC}"
echo

# Return error code if any tests failed
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    exit 1
else
    exit 0
fi 