import { MeiliSearch } from 'meilisearch'
import { mockCryptoData, mockTradingHistory } from './mockData'

// Configuration from environment variables
const MEILISEARCH_HOST = import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost:7700'
const MEILISEARCH_API_KEY = import.meta.env.VITE_MEILISEARCH_API_KEY || ''
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true

// Initialize MeiliSearch client
const searchClient = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY
})

// Initialize indexes
const cryptoIndex = searchClient.index('cryptocurrencies')

/**
 * Initialize MeiliSearch for crypto data
 */
export const initializeCryptoSearch = async () => {
  try {
    // Check if MeiliSearch is healthy
    const health = await checkMeiliSearchHealth()
    
    if (health && USE_MOCK_DATA) {
      // Only populate with mock data if using mock data and MeiliSearch is healthy
      console.log('Populating MeiliSearch with mock crypto data...')
      
      try {
        // First delete existing documents if any
        await cryptoIndex.deleteAllDocuments()
        
        // Add mock crypto data to the index
        await cryptoIndex.addDocuments(mockCryptoData)
        
        // Set up searchable attributes
        await cryptoIndex.updateSearchableAttributes([
          'name',
          'symbol',
          'category',
          'description'
        ])
        
        // Set up filterable attributes
        await cryptoIndex.updateFilterableAttributes([
          'marketCap',
          'price',
          'volume24h',
          'category',
          'trending'
        ])
        
        // Set up sortable attributes
        await cryptoIndex.updateSortableAttributes([
          'marketCap',
          'price',
          'volume24h',
          'priceChange24h'
        ])
        
        console.log('Mock crypto data added to MeiliSearch')
      } catch (error) {
        console.error('Error populating MeiliSearch with crypto data:', error)
      }
    }
    
    return health
  } catch (error) {
    console.error('Error initializing crypto search:', error)
    return false
  }
}

/**
 * Search cryptocurrencies with various filters and sorting options
 */
export const searchCryptocurrencies = async (query = '', options = {}) => {
  const { 
    sort = 'marketCap:desc',
    filter = '',
    limit = 20,
    offset = 0
  } = options
  
  try {
    // Check if MeiliSearch is available
    const health = await checkMeiliSearchHealth()
    
    if (health) {
      // Search using MeiliSearch
      const searchParams = {
        limit,
        offset,
        sort: [sort]
      }
      
      if (filter) {
        searchParams.filter = filter
      }
      
      const results = await cryptoIndex.search(query, searchParams)
      return results.hits
    } else {
      console.warn('MeiliSearch unavailable, falling back to mock data')
      // Fallback to mock data filtering
      return filterMockCryptoData(query, options)
    }
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error)
    console.warn('Falling back to mock data due to error')
    return filterMockCryptoData(query, options)
  }
}

/**
 * Get popular cryptocurrencies (higher market cap)
 */
export const getPopularCryptocurrencies = async (limit = 5) => {
  try {
    return await searchCryptocurrencies('', {
      sort: 'marketCap:desc',
      limit
    })
  } catch (error) {
    console.error('Error fetching popular cryptocurrencies:', error)
    return mockCryptoData.slice(0, limit)
  }
}

/**
 * Get trending cryptocurrencies
 */
export const getTrendingCryptocurrencies = async (limit = 5) => {
  try {
    return await searchCryptocurrencies('', {
      filter: 'trending = true',
      limit
    })
  } catch (error) {
    console.error('Error fetching trending cryptocurrencies:', error)
    return mockCryptoData.filter(crypto => crypto.trending).slice(0, limit)
  }
}

/**
 * Get cryptocurrency by ID or symbol
 */
export const getCryptoById = async (id) => {
  try {
    // Try searching by exact ID match
    const results = await searchCryptocurrencies('', {
      filter: `id = ${id} OR symbol = "${id.toUpperCase()}"`,
      limit: 1
    })
    
    if (results && results.length > 0) {
      return results[0]
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching cryptocurrency with ID ${id}:`, error)
    // Fallback to mock data
    const mockResult = mockCryptoData.find(
      crypto => crypto.id.toString() === id.toString() || 
                crypto.symbol.toLowerCase() === id.toLowerCase()
    )
    return mockResult || null
  }
}

/**
 * Get trading history for a specific cryptocurrency
 */
export const getTradingHistory = async (cryptoId, period = '24h') => {
  // In a real app, this would call an API endpoint
  // For this demo, we'll use mock data
  try {
    const mockHistory = mockTradingHistory.filter(
      trade => trade.cryptoId.toString() === cryptoId.toString()
    )
    
    // Return most recent trades first
    return mockHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  } catch (error) {
    console.error(`Error fetching trading history for ${cryptoId}:`, error)
    return []
  }
}

/**
 * Filter mock data locally as a fallback
 */
const filterMockCryptoData = (query, options) => {
  const { sort = 'marketCap:desc', limit = 20, offset = 0 } = options
  
  let filtered = [...mockCryptoData]
  
  // Apply query filtering if provided
  if (query) {
    const searchTerms = query.toLowerCase().split(' ')
    filtered = filtered.filter(crypto => {
      const searchableText = `${crypto.name} ${crypto.symbol} ${crypto.category} ${crypto.description}`.toLowerCase()
      return searchTerms.every(term => searchableText.includes(term))
    })
  }
  
  // Apply sorting
  const [sortField, sortDirection] = sort.split(':')
  filtered.sort((a, b) => {
    const aValue = a[sortField] || 0
    const bValue = b[sortField] || 0
    return sortDirection === 'desc' ? bValue - aValue : aValue - bValue
  })
  
  // Apply limit and offset
  return filtered.slice(offset, offset + limit)
}

/**
 * Trading bot functions
 */

// Exported bot status constants
export const BOT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAUSED: 'paused',
  ERROR: 'error'
};

/**
 * Get trading bot status
 * @returns {Promise<Object>} Bot status data
 */
export const getTradingBotStatus = async () => {
  try {
    if (USE_MOCK_DATA) {
      // Return mock trading bot status
      const mockBotStatus = {
        status: BOT_STATUS.ACTIVE,
        uptime: '2d 7h 14m',
        totalTrades: 143,
        successRate: 68.4,
        profitLoss: 12.7,
        lastUpdated: new Date().toISOString(),
        activeStrategies: ['Mean Reversion', 'Trend Following', 'Momentum'],
        logs: [
          { level: 'info', timestamp: new Date().toISOString(), message: 'Executed BTC buy order at $28,750' },
          { level: 'warning', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), message: 'High volatility detected on ETH' },
          { level: 'info', timestamp: new Date(Date.now() - 90 * 60000).toISOString(), message: 'Executed ETH sell order at $1,840' },
          { level: 'error', timestamp: new Date(Date.now() - 180 * 60000).toISOString(), message: 'API rate limit exceeded' },
          { level: 'info', timestamp: new Date(Date.now() - 240 * 60000).toISOString(), message: 'New strategy enabled: Momentum' }
        ]
      };
      
      return mockBotStatus;
    }
    
    // Real implementation would call the API
    const response = await apiClient.get('/api/bot/status');
    return response.data;
  } catch (error) {
    console.error('Error getting trading bot status:', error);
    throw error;
  }
};

/**
 * Start the trading bot
 * @returns {Promise<Object>} Result with bot status
 */
export const startTradingBot = async () => {
  try {
    if (USE_MOCK_DATA) {
      // Return mock response
      return {
        success: true,
        message: 'Trading bot started successfully',
        botStatus: {
          status: BOT_STATUS.ACTIVE,
          uptime: '0h 0m 5s',
          totalTrades: 0,
          successRate: 0,
          profitLoss: 0,
          lastUpdated: new Date().toISOString(),
          activeStrategies: ['Mean Reversion', 'Trend Following'],
          logs: [
            { level: 'info', timestamp: new Date().toISOString(), message: 'Trading bot initialized and running' },
            { level: 'info', timestamp: new Date(Date.now() - 2000).toISOString(), message: 'Strategies loaded: Mean Reversion, Trend Following' }
          ]
        }
      };
    }
    
    // Real implementation would call the API
    const response = await apiClient.post('/api/bot/start');
    return response.data;
  } catch (error) {
    console.error('Error starting trading bot:', error);
    throw error;
  }
};

/**
 * Stop the trading bot
 * @returns {Promise<Object>} Result with confirmation
 */
export const stopTradingBot = async () => {
  try {
    if (USE_MOCK_DATA) {
      // Return mock response
      return {
        success: true,
        message: 'Trading bot stopped successfully',
        botStatus: {
          status: BOT_STATUS.INACTIVE,
          uptime: '0h 0m 0s',
          totalTrades: 0,
          successRate: 0,
          profitLoss: 0,
          lastUpdated: new Date().toISOString(),
          activeStrategies: [],
          logs: [
            { level: 'info', timestamp: new Date().toISOString(), message: 'Trading bot stopped by user' },
            { level: 'info', timestamp: new Date(Date.now() - 1000).toISOString(), message: 'All active trades closed' }
          ]
        }
      };
    }
    
    // Real implementation would call the API
    const response = await apiClient.post('/api/bot/stop');
    return response.data;
  } catch (error) {
    console.error('Error stopping trading bot:', error);
    throw error;
  }
};

/**
 * Execute manual trade
 */
export const executeManualTrade = async (cryptoId, action, amount) => {
  // This would normally make an API call to execute a trade
  console.log(`Executing ${action} trade for ${cryptoId}, amount: ${amount}`)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    success: true,
    tradeId: `trade-${Date.now()}`,
    cryptoId,
    action,
    amount,
    price: mockCryptoData.find(c => c.id.toString() === cryptoId.toString())?.price || 0,
    timestamp: new Date().toISOString(),
    status: 'completed'
  }
}

/**
 * Check MeiliSearch health
 */
export const checkMeiliSearchHealth = async () => {
  try {
    const health = await searchClient.health()
    return health.status === 'available'
  } catch (error) {
    console.error('MeiliSearch health check failed:', error)
    return false
  }
}

// Export functions
export default {
  searchCryptocurrencies,
  getPopularCryptocurrencies,
  getTrendingCryptocurrencies,
  getCryptoById,
  getTradingHistory,
  initializeCryptoSearch,
  getTradingBotStatus,
  startTradingBot,
  stopTradingBot,
  executeManualTrade,
  BOT_STATUS
} 