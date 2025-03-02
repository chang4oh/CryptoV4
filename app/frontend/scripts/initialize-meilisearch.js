// MeiliSearch initialization script
// Run this script once to set up your indexes
// Usage: node initialize-meilisearch.js

import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = resolve(__dirname, '../.env.production');
dotenv.config({ path: envPath });

// Get configuration from environment variables
const MEILISEARCH_HOST = process.env.VITE_MEILISEARCH_HOST;

// For security, we don't hardcode the API key
const MEILISEARCH_ADMIN_KEY = process.env.VITE_MEILISEARCH_API_KEY;

if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
  console.error('❌ Missing MeiliSearch configuration in environment variables');
  console.error('Please ensure VITE_MEILISEARCH_HOST and VITE_MEILISEARCH_API_KEY are set');
  process.exit(1);
}

console.log(`Connecting to MeiliSearch at ${MEILISEARCH_HOST}`);

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_ADMIN_KEY
});

async function initializeIndexes() {
  try {
    console.log('Creating and configuring indexes...');
    
    // Create or get the news index
    console.log('Setting up news index...');
    const newsIndex = await client.index('news');
    
    // Configure news index settings
    await newsIndex.updateSettings({
      searchableAttributes: [
        'title',
        'body',
        'source'
      ],
      filterableAttributes: [
        'source',
        'sentiment_score',
        'timestamp'
      ],
      sortableAttributes: [
        'timestamp',
        'sentiment_score'
      ],
      displayedAttributes: [
        'id',
        'title',
        'body',
        'source',
        'sentiment_score',
        'timestamp',
        'url'
      ]
    });
    
    // Create or get the trades index
    console.log('Setting up trades index...');
    const tradesIndex = await client.index('trades');
    
    // Configure trades index settings
    await tradesIndex.updateSettings({
      searchableAttributes: [
        'symbol',
        'type',
        'id'
      ],
      filterableAttributes: [
        'symbol',
        'type',
        'timestamp'
      ],
      sortableAttributes: [
        'timestamp',
        'price',
        'amount',
        'total'
      ],
      displayedAttributes: [
        'id',
        'symbol',
        'type',
        'price',
        'amount',
        'total',
        'timestamp'
      ]
    });
    
    // Create or get the logs index (for future use)
    console.log('Setting up logs index...');
    const logsIndex = await client.index('logs');
    
    // Configure logs index settings
    await logsIndex.updateSettings({
      searchableAttributes: [
        'message',
        'level'
      ],
      filterableAttributes: [
        'level',
        'timestamp'
      ],
      sortableAttributes: [
        'timestamp'
      ]
    });
    
    console.log('✅ All indexes created and configured successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing indexes:', error);
  }
}

// Run the initialization
initializeIndexes(); 