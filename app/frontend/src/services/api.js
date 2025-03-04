import axios from 'axios';
import config from '../config';

// Create a standard API instance
const api = axios.create({
  baseURL: config.API.BASE_URL,
  timeout: config.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with an error status code
      return Promise.reject(error);
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.log('Network error - no response received:', error.request);
      return Promise.reject({
        message: 'Network error - could not connect to server',
        isNetworkError: true
      });
    } else {
      // Error in setting up the request
      console.log('Error setting up request:', error.message);
      return Promise.reject({
        message: 'Error setting up request',
        isConfigError: true
      });
    }
  }
);

/**
 * Trading Bot API Service
 * 
 * Provides methods for interacting with the trading bot backend
 */
const apiService = {
  // System
  getSystemStatus: async () => {
    try {
      const response = await api.get('/system/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Market data endpoints
  getMarketOverview: async () => {
    try {
      const response = await api.get('/market/overview');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getCandlestickData: async (symbol, interval = '1h', limit = 100) => {
    try {
      const response = await api.get(`/market/candles/${symbol}`, {
        params: { interval, limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getSymbolPrice: async (symbol) => {
    try {
      const response = await api.get(`/market/price/${symbol}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Trading bot endpoints
  getBotStatus: async () => {
    try {
      const response = await api.get('/bot/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  startBot: async () => {
    try {
      const response = await api.post('/bot/start');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  stopBot: async () => {
    try {
      const response = await api.post('/bot/stop');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getBotConfig: async () => {
    try {
      const response = await api.get('/bot/config');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateBotConfig: async (config) => {
    try {
      const response = await api.put('/bot/config', config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Wallet and positions
  getWalletBalance: async () => {
    try {
      const response = await api.get('/wallet/balance');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getOpenPositions: async () => {
    try {
      const response = await api.get('/positions/open');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Orders and trading
  placeOrder: async (orderData) => {
    try {
      const response = await api.post('/trading/order', orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getOrderHistory: async (limit = 20) => {
    try {
      const response = await api.get(`/trading/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Trading performance
  getPerformanceMetrics: async (timeframe = '1w') => {
    try {
      const response = await api.get(`/performance/metrics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Search functionality
  search: async (query) => {
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Bot control endpoints
  restartBot: async () => {
    try {
      const response = await api.post('/bot/restart');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Market data endpoints
  getMarketData: async (symbol) => {
    try {
      const response = await api.get(`/market/data/${symbol}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getMarketSummary: async () => {
    try {
      const response = await api.get('/market/summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getWatchlist: async () => {
    try {
      const response = await api.get('/market/watchlist');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getSymbolDetails: async (symbol) => {
    try {
      const response = await api.get(`/market/details/${symbol}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Wallet/balance endpoints
  getBalances: async () => {
    try {
      const response = await api.get('/wallet/balances');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getTransactions: async () => {
    try {
      const response = await api.get('/wallet/transactions');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Trading performance endpoints
  getTradeHistory: async () => {
    try {
      const response = await api.get('/trading/history');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Utility methods
  handleApiError: (error) => {
    const defaultMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // The request was made and the server responded with an error
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return { message: 'Authentication failed. Please log in again.', code: 'AUTH_ERROR' };
      } else if (status === 404) {
        return { message: 'Requested resource not found', code: 'NOT_FOUND' };
      } else if (data && data.message) {
        return { message: data.message, code: data.code || 'API_ERROR' };
      }
    } else if (error.isNetworkError) {
      return { message: error.message || 'Network error. Please check your connection.', code: 'NETWORK_ERROR' };
    }
    
    return { message: defaultMessage, code: 'UNKNOWN_ERROR' };
  }
};

// Export both the API instance and the API service
export { api, apiService };
export default apiService; 