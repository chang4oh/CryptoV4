/**
 * Mock data provider for CryptoV4 dashboard
 * 
 * This file contains simulated data that mimics what the real API would return.
 * It can be used for development and testing without running the actual backend.
 */

// Helper to generate a random number between min and max
const randomNumber = (min, max) => {
  return Math.random() * (max - min) + min;
};

// Helper to generate a random integer between min and max (inclusive)
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random date within the last n days
const randomDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, days));
  date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return date.toISOString();
};

// Generate an array of sequential dates for the last n days
const generateDatesArray = (days) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date.toISOString());
  }
  
  return dates;
};

// Generate a trade object
const generateTrade = (id) => {
  const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
  const price = randomNumber(60000, 68000);
  const amount = randomNumber(0.001, 0.05);
  
  return {
    id: id.toString(),
    type,
    symbol: 'BTCUSDT',
    price,
    amount,
    total: price * amount,
    timestamp: randomDate(7),
    status: 'COMPLETED'
  };
};

// Generate a sentiment data object
const generateSentimentItem = (id) => {
  const sentimentScore = randomNumber(-0.8, 0.8);
  
  return {
    id: id.toString(),
    title: `Bitcoin ${sentimentScore > 0 ? 'Bulls' : 'Bears'} Are Back: ${sentimentScore > 0 ? 'Analysts Predict New ATH' : 'Market Caution Ahead'}`,
    body: `Cryptocurrency markets are showing ${sentimentScore > 0 ? 'strong momentum' : 'signs of weakness'} as Bitcoin ${sentimentScore > 0 ? 'surges' : 'struggles'} around the $${randomInt(60, 68)}K level. ${sentimentScore > 0 ? 'Institutional investors continue to accumulate.' : 'Traders remain cautious amid regulatory concerns.'}`,
    sentiment_score: sentimentScore,
    source: ['CryptoCompare', 'CoinDesk', 'Cointelegraph'][randomInt(0, 2)],
    url: 'https://example.com/crypto-news',
    timestamp: randomDate(3)
  };
};

// Generate simulated performance data
const generatePerformanceData = (days) => {
  const dates = generateDatesArray(days);
  let initialValue = 10000; // Starting portfolio value of $10,000
  let initialBtcPrice = 60000; // Starting BTC price
  
  const portfolioValues = [];
  const roiPercentages = [];
  const tradeCounts = [];
  
  // Simulate price and portfolio value fluctuations
  for (let i = 0; i < dates.length; i++) {
    // Add some randomness but maintain a general trend
    const dayChange = randomNumber(-0.05, 0.07);
    initialValue = initialValue * (1 + dayChange);
    initialBtcPrice = initialBtcPrice * (1 + randomNumber(-0.03, 0.04));
    
    portfolioValues.push(initialValue);
    roiPercentages.push(((initialValue - 10000) / 10000) * 100);
    tradeCounts.push(randomInt(0, 5));
  }
  
  return {
    dates,
    portfolio_values: portfolioValues,
    roi_percentages: roiPercentages,
    trade_counts: tradeCounts
  };
};

// Mock data for trading status
export const mockTradingStatus = {
  trading_enabled: true,
  market_data: {
    symbol: 'BTCUSDT',
    current_price: 64789.32,
    price_change_24h: 1432.75,
    price_change_pct: 0.0226,
    high_24h: 65201.45,
    low_24h: 63105.89,
    volume_24h: 15680000000
  },
  avg_sentiment: 0.38,
  sentiment_sources: 25,
  trend_strength: 0.72,
  last_updated: new Date().toISOString(),
  signal: 'BUY'
};

// Mock data for account info
export const mockAccountInfo = {
  base_asset: 'USDT',
  base_balance: 12345.67,
  quote_asset: 'BTC',
  quote_balance: 0.08435,
  total_value_usd: 17807.92,
  status: 'active',
  pnl_24h: 256.78,
  pnl_24h_percent: 1.46
};

// Generate mock recent trades
export const generateMockTrades = (count = 10) => {
  const trades = [];
  for (let i = 0; i < count; i++) {
    trades.push(generateTrade(i + 1));
  }
  return trades;
};

// Generate mock sentiment data
export const generateMockSentimentData = (count = 10) => {
  const sentimentData = [];
  for (let i = 0; i < count; i++) {
    sentimentData.push(generateSentimentItem(i + 1));
  }
  return sentimentData;
};

// Generate mock performance data for a given number of days
export const getMockPerformanceData = (days = 30) => {
  return generatePerformanceData(days);
};

// Mock API response functions
export const getMockTradingStatus = () => {
  return { ...mockTradingStatus };
};

export const getMockAccountInfo = () => {
  return { ...mockAccountInfo };
};

export const getMockRecentTrades = (limit = 10) => {
  return generateMockTrades(limit);
};

export const getMockSentimentData = (limit = 10) => {
  return generateMockSentimentData(limit);
};

// Mock order placement
export const placeMockOrder = (orderData) => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const orderId = `ORD-${Date.now()}`;
      resolve({
        order_id: orderId,
        type: orderData.type,
        symbol: 'BTCUSDT',
        price: orderData.price,
        amount: orderData.amount,
        total: orderData.price * orderData.amount,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED'
      });
    }, 1000);
  });
};

// Mock system health check
export const getMockSystemHealth = () => {
  return {
    api_status: 'online',
    database_status: 'connected',
    exchange_api_status: 'connected',
    news_api_status: 'connected',
    auto_trading: Math.random() > 0.5,
    memory_usage: `${randomInt(300, 600)} MB`,
    cpu_usage: `${randomInt(5, 30)}%`,
    uptime_hours: randomInt(24, 720)
  };
};

// Mock system settings
export const getMockSettings = () => {
  return {
    trading: {
      stop_loss_percentage: 5,
      take_profit_percentage: 10,
      max_trade_size_percentage: 20,
      sentiment_threshold_buy: 0.2,
      sentiment_threshold_sell: -0.2,
      enable_auto_trading: Math.random() > 0.5
    },
    dashboard: {
      refresh_interval_seconds: 30,
      dark_mode: false,
      show_notifications: true,
      chart_timespan_days: 30
    }
  };
};

export default {
  getMockTradingStatus,
  getMockAccountInfo,
  getMockRecentTrades,
  getMockSentimentData,
  getMockPerformanceData,
  placeMockOrder,
  getMockSystemHealth,
  getMockSettings
}; 