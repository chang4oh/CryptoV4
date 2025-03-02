# CryptoV4 Testing Guide

This document provides detailed instructions for testing all components of the CryptoV4 system, including the recently added MeiliSearch integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Testing Steps](#manual-testing-steps)
   - [Frontend Testing](#frontend-testing)
   - [Backend Testing](#backend-testing)
   - [MeiliSearch Testing](#meilisearch-testing)
4. [Component-specific Tests](#component-specific-tests)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

Before running the tests, ensure you have:

- **Node.js and npm**: Required for frontend development
- **Python 3.8+**: Required for backend development
- **MeiliSearch instance**: Either local or cloud-hosted
- **MongoDB**: For backend data storage

## Quick Start

For a comprehensive test of all system components, simply run one of the provided test scripts:

### On Windows:

```bash
.\test_cryptov4.bat
```

### On Linux/macOS:

```bash
# Make script executable
chmod +x test_cryptov4.sh

# Run the script
./test_cryptov4.sh
```

These scripts will:
1. Check prerequisites
2. Test frontend components
3. Test backend components
4. Verify MeiliSearch integration
5. Provide a summary of results

## Manual Testing Steps

If you prefer to test components individually, follow these steps:

### Frontend Testing

#### 1. Setup MeiliSearch Environment

```bash
# Navigate to frontend directory
cd app/frontend

# Set up MeiliSearch environment variables
npm run meilisearch:setup-env

# Initialize MeiliSearch indexes
npm run meilisearch:init

# Populate with sample data
npm run meilisearch:populate
```

#### 2. Test Frontend Components

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### 3. Test Frontend Components Manually

Once the development server is running:

- Navigate to `http://localhost:5173/` (or the port shown in the console)
- Test the search functionality:
  - Use the search box to search for news items
  - Use the advanced search features
  - Verify that search results are highlighted
- Test dark mode toggle
- Test dashboard filters and settings

### Backend Testing

#### 1. Setup Environment

```bash
# Navigate to backend directory
cd app/backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example (if not exists)
cp .env.example .env
```

#### 2. Run Backend Tests

```bash
# Run tests
python -m pytest
```

#### 3. Start Backend Server

```bash
# Start Flask server
python app.py
```

### MeiliSearch Testing

#### 1. Verify MeiliSearch Connection

```bash
# Navigate to frontend directory
cd app/frontend

# Create a test script
cat << EOF > test_meili.js
const { MeiliSearch } = require('meilisearch');
require('dotenv').config({ path: '.env.local' });

const host = process.env.VITE_MEILISEARCH_HOST;
const apiKey = process.env.VITE_MEILISEARCH_API_KEY;

const client = new MeiliSearch({ host, apiKey });

client.health()
  .then(health => {
    console.log('MeiliSearch health status:', health.status);
    return client.getIndexes();
  })
  .then(indexes => {
    console.log('Available indexes:', indexes.map(index => index.uid));
    process.exit(0);
  })
  .catch(err => {
    console.error('MeiliSearch error:', err.message);
    process.exit(1);
  });
EOF

# Run the test script
node test_meili.js
```

#### 2. Test Search Functionality

Test the following search features:

- Basic search
- Advanced search with filters
- Sorting results
- Faceted search
- Highlight functionality

## Component-specific Tests

### News Feed Search

1. Use the search box to find specific news items
2. Filter by source
3. Sort by date or sentiment score
4. Verify highlighting of search terms

### Trade History Search

1. Search for specific trades
2. Filter by trade type (buy/sell)
3. Filter by cryptocurrency
4. Sort by price or amount

### Dashboard Settings

1. Toggle dark mode
2. Change refresh interval
3. Adjust chart timespan
4. Toggle notifications
5. Verify settings are saved between sessions

## Troubleshooting

### MeiliSearch Connection Issues

If you encounter connection issues with MeiliSearch:

1. Verify that the MeiliSearch server is running
2. Check that the correct host and API keys are in `.env.local`
3. Ensure that your API key has the necessary permissions
4. Check network connectivity to the MeiliSearch instance

#### Common Errors

- **CORS Issues**: If you're using a cloud-hosted MeiliSearch instance, ensure CORS is properly configured
- **Authentication Failed**: Verify that you're using the correct API key
- **Index Not Found**: Ensure that you've run the initialization script to create required indexes

### Frontend Build Failures

If the frontend build fails:

1. Check for ESLint errors: `npm run lint`
2. Verify all dependencies are installed: `npm install`
3. Clear the cache: `npm cache clean --force`
4. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Backend Start Failures

If the backend fails to start:

1. Verify that MongoDB is running and accessible
2. Check that all required environment variables are set in `.env`
3. Ensure all Python dependencies are installed
4. Check for syntax errors in recently modified files

## Integration Test Checklist

When testing the entire system, verify the following workflows:

- [ ] Frontend loads without errors
- [ ] MeiliSearch indexes are properly initialized
- [ ] Search functionality returns relevant results
- [ ] Dark mode toggle works correctly
- [ ] Settings are saved and applied
- [ ] Backend API endpoints respond correctly
- [ ] MongoDB data is properly reflected in the UI
- [ ] Trade signals are properly displayed
- [ ] News sentiment analysis affects trading signals 