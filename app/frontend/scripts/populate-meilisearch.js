// MeiliSearch sample data population script
// Run this script to populate your indexes with sample data
// Usage: node populate-meilisearch.js

import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

// Generate sample sentiment data
function generateSampleNews(count = 30) {
  const sources = ['CryptoDaily', 'CoinDesk', 'Bloomberg', 'CNBC', 'Reuters'];
  const titles = [
    'Bitcoin Reaches New All-Time High',
    'Ethereum 2.0 Launch Imminent',
    'Regulatory Concerns Impact Crypto Markets',
    'Major Bank Adopts Blockchain Technology',
    'Institutional Interest in Crypto Grows',
    'New DeFi Protocol Launches with Record TVL',
    'NFT Market Continues to Expand',
    'Central Bank Digital Currencies Gain Traction',
    'Mining Difficulty Adjusts Following Price Surge',
    'Crypto Exchange Reports Record Trading Volume'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const sentimentScore = Math.random() * 2 - 1; // Random score between -1 and 1
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
    
    return {
      id: `news-${i + 1}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      body: `This is sample news content for testing search functionality. This article discusses the impact of recent market developments and sentiment trends in the cryptocurrency space.`,
      source: sources[Math.floor(Math.random() * sources.length)],
      sentiment_score: sentimentScore.toFixed(2),
      timestamp: date.toISOString(),
      url: 'https://example.com/crypto-news'
    };
  });
}

// Generate sample trade data
function generateSampleTrades(count = 50) {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
  const types = ['buy', 'sell'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = (Math.random() * 50000 + 1000).toFixed(2);
    const amount = (Math.random() * 2).toFixed(6);
    const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
    
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72)); // Random time in last 72 hours
    
    return {
      id: `trade-${i + 1}`,
      symbol,
      type,
      price,
      amount,
      total,
      timestamp: date.toISOString()
    };
  });
}

async function populateIndexes() {
  try {
    console.log('Generating sample data...');
    const sampleNews = generateSampleNews();
    const sampleTrades = generateSampleTrades();
    
    // Add sample news
    console.log(`Adding ${sampleNews.length} sample news items...`);
    await client.index('news').addDocuments(sampleNews);
    
    // Add sample trades
    console.log(`Adding ${sampleTrades.length} sample trades...`);
    await client.index('trades').addDocuments(sampleTrades);
    
    console.log('✅ Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run the population
populateIndexes(); 