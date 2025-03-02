import axios from 'axios';

// Base URL for the API
const API_URL = 'http://localhost:5000';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for handling errors
apiClient.interceptors.request.use(
  config => {
    // You can add authentication tokens here if needed
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Response Error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Trading status
  getTradingStatus: async () => {
    try {
      const response = await apiClient.get('/api/trading_status');
      return response.data;
    } catch (error) {
      console.error('Error fetching trading status:', error);
      throw error;
    }
  },

  // Performance data
  getPerformance: async (days = 30) => {
    try {
      const response = await apiClient.get(`/api/performance?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  },

  // Sentiment data
  getSentimentData: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/api/sentiment?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      throw error;
    }
  },

  // Recent trades
  getRecentTrades: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/api/recent_trades?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      throw error;
    }
  },

  // Account information
  getAccountInfo: async () => {
    try {
      const response = await apiClient.get('/api/account_info');
      return response.data;
    } catch (error) {
      console.error('Error fetching account information:', error);
      throw error;
    }
  },

  // Place a real order
  placeOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/api/place_order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },
  
  // Place a test order (simulated)
  placeTestOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/api/place_test_order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error placing test order:', error);
      throw error;
    }
  },
  
  // Toggle auto-trading
  setAutoTradingEnabled: async (enabled) => {
    try {
      const response = await apiClient.post('/api/set_auto_trading', { enabled });
      return response.data;
    } catch (error) {
      console.error('Error setting auto-trading status:', error);
      throw error;
    }
  },
  
  // Get auto-trading status
  getAutoTradingStatus: async () => {
    try {
      const response = await apiClient.get('/api/auto_trading_status');
      return response.data;
    } catch (error) {
      console.error('Error getting auto-trading status:', error);
      throw error;
    }
  },
  
  // Save trading settings
  saveSettings: async (settings) => {
    try {
      const response = await apiClient.post('/api/save_settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },
  
  // Get trading settings
  getSettings: async () => {
    try {
      const response = await apiClient.get('/api/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  },
  
  // Restore default settings
  restoreDefaultSettings: async () => {
    try {
      const response = await apiClient.post('/api/restore_default_settings');
      return response.data;
    } catch (error) {
      console.error('Error restoring default settings:', error);
      throw error;
    }
  },
  
  // Get trading system health status
  getSystemHealth: async () => {
    try {
      const response = await apiClient.get('/api/system_health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },
  
  // Get detailed system logs
  getSystemLogs: async (limit = 100) => {
    try {
      const response = await apiClient.get(`/api/system_logs?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw error;
    }
  },
  
  // Get market summary (used for multiple markets view)
  getMarketSummary: async () => {
    try {
      const response = await apiClient.get('/api/market_summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching market summary:', error);
      throw error;
    }
  }
};

export default api; 