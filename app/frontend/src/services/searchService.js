import { MeiliSearch } from 'meilisearch';
import * as mockData from './mockData';

// MeiliSearch client with configuration from environment
const client = new MeiliSearch({
  host: import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: import.meta.env.VITE_MEILISEARCH_API_KEY || '',
});

// Flag to control whether to use mock data
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'false' ? false : true;

// Initialize indexes
const newsIndex = client.index('news');
const tradesIndex = client.index('trades');
const logsIndex = client.index('logs');

/**
 * Initialize MeiliSearch with mock data (for demo purposes)
 * In a real application, your backend would handle indexing
 */
export const initializeMeiliSearch = async () => {
  if (!USE_MOCK_DATA) {
    // When not using mock data, just check health and return
    try {
      const health = await checkMeiliSearchHealth();
      console.log('MeiliSearch health check:', health ? 'Available' : 'Unavailable');
      return health;
    } catch (error) {
      console.error('MeiliSearch health check failed:', error);
      return false;
    }
  }

  try {
    // Get mock data for development
    const sentimentData = mockData.generateMockSentimentData(30);
    const recentTrades = mockData.generateMockTrades(50);
    
    // Add unique IDs to ensure documents have a primary key
    const newsWithIds = sentimentData.map(item => ({
      ...item,
      id: item.id.toString()
    }));
    
    const tradesWithIds = recentTrades.map(item => ({
      ...item,
      id: item.id.toString()
    }));

    // Check if documents already exist to avoid duplication
    const newsCount = await newsIndex.getStats();
    const tradesCount = await tradesIndex.getStats();
    
    // Only add documents if collections are empty
    if (newsCount.numberOfDocuments === 0) {
      await newsIndex.addDocuments(newsWithIds);
      console.log('Added mock news data to MeiliSearch');
    } else {
      console.log('News index already has data, skipping mock data');
    }
    
    if (tradesCount.numberOfDocuments === 0) {
      await tradesIndex.addDocuments(tradesWithIds);
      console.log('Added mock trades data to MeiliSearch');
    } else {
      console.log('Trades index already has data, skipping mock data');
    }
    
    console.log('MeiliSearch initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing MeiliSearch:', error);
    return false;
  }
};

/**
 * Search news/sentiment data
 */
export const searchNews = async (query, options = {}) => {
  // If using mock data and no query, return all mock data
  if (USE_MOCK_DATA && !query) {
    return { hits: mockData.generateMockSentimentData() };
  }
  
  try {
    const results = await newsIndex.search(query, {
      ...options,
      attributesToHighlight: ['title', 'body'],
      highlightPreTag: '<span class="search-highlight">',
      highlightPostTag: '</span>'
    });
    return results;
  } catch (error) {
    console.error('Error searching news:', error);
    
    // Fallback to mock data if MeiliSearch is unavailable
    if (USE_MOCK_DATA) {
      const mockResults = mockData.generateMockSentimentData();
      // Simple client-side filtering for fallback
      const filtered = query 
        ? mockResults.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.body.toLowerCase().includes(query.toLowerCase())
          )
        : mockResults;
      return { hits: filtered };
    }
    
    return { hits: [] };
  }
};

/**
 * Search trades history
 */
export const searchTrades = async (query, options = {}) => {
  // If using mock data and no query, return all mock data
  if (USE_MOCK_DATA && !query) {
    return { hits: mockData.generateMockTrades() };
  }
  
  try {
    const results = await tradesIndex.search(query, {
      ...options,
      attributesToHighlight: ['symbol', 'type'],
      highlightPreTag: '<span class="search-highlight">',
      highlightPostTag: '</span>'
    });
    return results;
  } catch (error) {
    console.error('Error searching trades:', error);
    
    // Fallback to mock data if MeiliSearch is unavailable
    if (USE_MOCK_DATA) {
      const mockResults = mockData.generateMockTrades();
      // Simple client-side filtering for fallback
      const filtered = query 
        ? mockResults.filter(item => 
            item.symbol.toLowerCase().includes(query.toLowerCase()) ||
            item.type.toLowerCase().includes(query.toLowerCase())
          )
        : mockResults;
      return { hits: filtered };
    }
    
    return { hits: [] };
  }
};

/**
 * Check if MeiliSearch is available
 */
export const checkMeiliSearchHealth = async () => {
  if (USE_MOCK_DATA) return true;
  
  try {
    const health = await client.health();
    return health.status === 'available';
  } catch (error) {
    console.error('MeiliSearch health check failed:', error);
    return false;
  }
};

export default {
  initializeMeiliSearch,
  searchNews,
  searchTrades,
  checkMeiliSearchHealth
}; 