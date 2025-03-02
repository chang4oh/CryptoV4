/**
 * MeiliSearch Integration Test
 * 
 * This script tests the connection to MeiliSearch and performs
 * various operations to verify the search functionality.
 * 
 * Usage: node test_meilisearch.js
 */

import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`
${colors.blue}╔════════════════════════════════════════════════════════╗
║           MeiliSearch Integration Test Suite           ║
╚════════════════════════════════════════════════════════╝${colors.reset}
`);

// Try different paths for .env files
const envPaths = [
  resolve(__dirname, '.env.local'),
  resolve(__dirname, '.env'),
  resolve(__dirname, 'app/frontend/.env.local'),
  resolve(__dirname, 'app/frontend/.env')
];

let envPath = null;
for (const path of envPaths) {
  if (fs.existsSync(path)) {
    envPath = path;
    break;
  }
}

if (!envPath) {
  console.error(`${colors.red}No .env file found. Please run setup script first.${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.green}Using environment file: ${envPath}${colors.reset}`);
dotenv.config({ path: envPath });

// Get configuration from environment variables
const MEILISEARCH_HOST = process.env.VITE_MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.VITE_MEILISEARCH_API_KEY;

if (!MEILISEARCH_HOST) {
  console.error(`${colors.red}❌ Missing MeiliSearch host in environment variables${colors.reset}`);
  console.error(`Please ensure VITE_MEILISEARCH_HOST is set`);
  process.exit(1);
}

console.log(`${colors.cyan}Connecting to MeiliSearch at ${MEILISEARCH_HOST}${colors.reset}`);

// Create MeiliSearch client
const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY
});

// Track test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Run a test and report the result
 */
async function runTest(name, testFn) {
  results.total++;
  console.log(`\n${colors.yellow}TEST ${results.total}: ${name}${colors.reset}`);
  console.log(`${colors.yellow}${'─'.repeat(50)}${colors.reset}`);
  
  try {
    await testFn();
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    results.passed++;
  } catch (error) {
    console.error(`${colors.red}✗ FAILED: ${error.message}${colors.reset}`);
    results.failed++;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  // Test 1: Health Check
  await runTest('MeiliSearch Health Check', async () => {
    const health = await client.health();
    console.log(`MeiliSearch status: ${health.status}`);
    
    if (health.status !== 'available') {
      throw new Error(`MeiliSearch is not available: ${health.status}`);
    }
  });

  // Test 2: Check for required indexes
  await runTest('Required Indexes Check', async () => {
    const indexes = await client.getIndexes();
    const indexUids = indexes.map(index => index.uid);
    console.log(`Found indexes: ${indexUids.join(', ')}`);
    
    const requiredIndexes = ['news', 'trades', 'logs'];
    const missingIndexes = requiredIndexes.filter(index => !indexUids.includes(index));
    
    if (missingIndexes.length > 0) {
      throw new Error(`Missing required indexes: ${missingIndexes.join(', ')}`);
    }
  });

  // Test 3: Check news index configuration
  await runTest('News Index Configuration', async () => {
    const newsIndex = client.index('news');
    const settings = await newsIndex.getSettings();
    
    // Check searchable attributes
    if (!settings.searchableAttributes || 
        !settings.searchableAttributes.includes('title') || 
        !settings.searchableAttributes.includes('body')) {
      throw new Error('News index configuration is missing required searchable attributes');
    }
    
    console.log(`News index properly configured with ${settings.searchableAttributes.length} searchable attributes`);
  });

  // Test 4: Basic search functionality
  await runTest('Basic Search Functionality', async () => {
    const newsIndex = client.index('news');
    const results = await newsIndex.search('bitcoin');
    
    console.log(`Search found ${results.hits.length} results`);
    
    if (results.hits.length === 0) {
      throw new Error('Search returned no results, expected at least one match for "bitcoin"');
    }
  });

  // Test 5: Search with filters
  await runTest('Search with Filters', async () => {
    const tradesIndex = client.index('trades');
    const results = await tradesIndex.search('', {
      filter: 'type = buy'
    });
    
    console.log(`Found ${results.hits.length} buy trades`);
    
    if (results.hits.length === 0) {
      throw new Error('Filter search returned no results, expected at least one buy trade');
    }
    
    // Verify all results are buy trades
    const nonBuyTrades = results.hits.filter(trade => trade.type !== 'buy');
    if (nonBuyTrades.length > 0) {
      throw new Error(`Filter returned ${nonBuyTrades.length} non-buy trades`);
    }
  });

  // Test 6: Sort results
  await runTest('Sort Results', async () => {
    const newsIndex = client.index('news');
    const results = await newsIndex.search('', {
      sort: ['timestamp:desc']
    });
    
    console.log(`Found ${results.hits.length} sorted news items`);
    
    if (results.hits.length < 2) {
      console.log('Not enough results to verify sorting (need at least 2)');
      return; // Skip the rest of the test
    }
    
    // Verify sorting
    const firstTimestamp = new Date(results.hits[0].timestamp).getTime();
    const secondTimestamp = new Date(results.hits[1].timestamp).getTime();
    
    if (firstTimestamp < secondTimestamp) {
      throw new Error('Results not sorted correctly by timestamp:desc');
    }
  });

  // Test 7: Pagination
  await runTest('Pagination', async () => {
    const newsIndex = client.index('news');
    
    // First page
    const page1 = await newsIndex.search('', {
      limit: 5,
      offset: 0
    });
    
    // Second page
    const page2 = await newsIndex.search('', {
      limit: 5,
      offset: 5
    });
    
    console.log(`Page 1: ${page1.hits.length} results, Page 2: ${page2.hits.length} results`);
    
    if (page1.hits.length === 0) {
      throw new Error('First page returned no results');
    }
    
    // Verify different results on different pages
    if (page1.hits.length > 0 && page2.hits.length > 0) {
      if (page1.hits[0].id === page2.hits[0].id) {
        throw new Error('First item on page 1 and page 2 are the same');
      }
    }
  });

  // Test 8: Faceting (if applicable)
  await runTest('Faceting', async () => {
    const tradesIndex = client.index('trades');
    
    const results = await tradesIndex.search('', {
      facets: ['symbol', 'type']
    });
    
    console.log('Faceting results:', results.facetDistribution);
    
    if (!results.facetDistribution || 
        !results.facetDistribution.type || 
        Object.keys(results.facetDistribution.type).length === 0) {
      throw new Error('Faceting failed to return distribution for trade types');
    }
  });

  // Print final results
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗
║                     TEST RESULTS                      ║
╚════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`${colors.green}Passed: ${results.passed}/${results.total}${colors.reset}`);
  
  if (results.failed > 0) {
    console.log(`${colors.red}Failed: ${results.failed}/${results.total}${colors.reset}`);
  }
  
  // Print next steps
  console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
  console.log(`1. If all tests passed, your MeiliSearch integration is working properly`);
  console.log(`2. If some tests failed, check the error messages and troubleshoot`);
  console.log(`3. Run your frontend app to test the UI integration with MeiliSearch`);
}

// Run all tests
runTests()
  .catch(error => {
    console.error(`${colors.red}Test suite error: ${error}${colors.reset}`);
    process.exit(1);
  }); 