/**
 * CryptoV4 Trading Bot - Configuration File
 * Centralized configuration settings for the application
 */

const config = {
  // API Configuration
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    REFRESH_INTERVALS: {
      MARKET_DATA: 30000, // 30 seconds
      WALLET_DATA: 60000,  // 1 minute
      BOT_STATUS: 15000,   // 15 seconds
      PERFORMANCE: 300000  // 5 minutes
    }
  },

  // Trading Bot Configuration
  TRADING: {
    DEFAULT_STRATEGY: 'GRID',
    AVAILABLE_STRATEGIES: ['GRID', 'MOMENTUM', 'MEAN_REVERSION', 'ARBITRAGE', 'SENTIMENT_BASED'],
    RISK_LEVELS: ['LOW', 'MEDIUM', 'HIGH'],
    DEFAULT_RISK_LEVEL: 'MEDIUM',
    STOP_LOSS_PERCENTAGE: 5,
    TAKE_PROFIT_PERCENTAGE: 10,
    MAX_TRADES_PER_DAY: 20
  },

  // UI Configuration
  UI: {
    THEME: {
      LIGHT: {
        PRIMARY: '#3498DB',
        SECONDARY: '#2C3E50',
        BACKGROUND: '#ECF0F1',
        CARD_BG: '#FFFFFF',
        TEXT: '#2C3E50',
        SUCCESS: '#2ECC71',
        DANGER: '#E74C3C',
        WARNING: '#F39C12',
        INFO: '#1ABC9C'
      },
      DARK: {
        PRIMARY: '#3498DB',
        SECONDARY: '#1ABC9C',
        BACKGROUND: '#212529',
        CARD_BG: '#343A40',
        TEXT: '#ECF0F1',
        SUCCESS: '#2ECC71',
        DANGER: '#E74C3C',
        WARNING: '#F39C12',
        INFO: '#1ABC9C'
      }
    },
    DEFAULT_THEME: 'LIGHT',
    CHART_COLORS: [
      '#3498DB', '#2ECC71', '#E74C3C', '#F39C12', 
      '#9B59B6', '#1ABC9C', '#F1C40F', '#34495E'
    ],
    ANIMATIONS_ENABLED: true,
    TABLE_ROWS_PER_PAGE: 15,
    NOTIFICATIONS_DURATION: 5000 // 5 seconds
  },

  // Supported cryptocurrencies
  SUPPORTED_ASSETS: [
    'BTC', 'ETH', 'XRP', 'LTC', 'BCH', 
    'ADA', 'DOT', 'LINK', 'XLM', 'UNI',
    'DOGE', 'SOL', 'AVAX', 'MATIC'
  ],

  // Supported exchanges
  SUPPORTED_EXCHANGES: [
    'BINANCE', 'COINBASE', 'KRAKEN', 'BITFINEX', 'KUCOIN'
  ],

  // Application version
  VERSION: '4.0.0'
};

export default config; 