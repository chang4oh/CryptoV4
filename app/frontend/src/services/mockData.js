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

/**
 * Mock cryptocurrency data for development and testing
 */
export const mockCryptoData = [
  {
    id: 1,
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    price: 64352.87,
    marketCap: 1253745678901,
    volume24h: 28764539872,
    priceChange24h: 2.34,
    priceChange7d: 5.67,
    category: 'Currency',
    description: 'Bitcoin is a decentralized digital currency, without a central bank or single administrator.',
    trending: true
  },
  {
    id: 2,
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 3256.42,
    marketCap: 389754321098,
    volume24h: 15679432876,
    priceChange24h: 1.28,
    priceChange7d: -2.15,
    category: 'Smart Contract Platform',
    description: 'Ethereum is an open-source, blockchain-based platform that enables developers to build and deploy smart contracts.',
    trending: true
  },
  {
    id: 3,
    name: 'Cardano',
    symbol: 'ADA',
    logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    price: 0.43,
    marketCap: 15078653421,
    volume24h: 567891234,
    priceChange24h: -1.23,
    priceChange7d: 3.45,
    category: 'Smart Contract Platform',
    description: 'Cardano is a proof-of-stake blockchain platform that says its goal is to allow changemakers, innovators and visionaries to bring about positive global change.',
    trending: false
  },
  {
    id: 4,
    name: 'Solana',
    symbol: 'SOL',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    price: 128.67,
    marketCap: 52765432198,
    volume24h: 3456789012,
    priceChange24h: 4.56,
    priceChange7d: 12.34,
    category: 'Smart Contract Platform',
    description: 'Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale.',
    trending: true
  },
  {
    id: 5,
    name: 'Ripple',
    symbol: 'XRP',
    logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
    price: 0.58,
    marketCap: 31452678903,
    volume24h: 1234567890,
    priceChange24h: 0.78,
    priceChange7d: -1.23,
    category: 'Payment',
    description: 'Ripple is a real-time gross settlement system, currency exchange and remittance network created by Ripple Labs Inc.',
    trending: false
  },
  {
    id: 6,
    name: 'Dogecoin',
    symbol: 'DOGE',
    logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    price: 0.12,
    marketCap: 16543219876,
    volume24h: 987654321,
    priceChange24h: -2.34,
    priceChange7d: -5.67,
    category: 'Meme',
    description: 'Dogecoin is a cryptocurrency created by software engineers Billy Markus and Jackson Palmer as a "joke".',
    trending: false
  },
  {
    id: 7,
    name: 'Polkadot',
    symbol: 'DOT',
    logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
    price: 6.24,
    marketCap: 7891234567,
    volume24h: 345678901,
    priceChange24h: 1.23,
    priceChange7d: 4.56,
    category: 'Interoperability',
    description: 'Polkadot is a sharded multichain network that connects different specialized blockchains into a single network.',
    trending: false
  },
  {
    id: 8,
    name: 'Chainlink',
    symbol: 'LINK',
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    price: 14.65,
    marketCap: 7654321098,
    volume24h: 234567890,
    priceChange24h: 3.45,
    priceChange7d: 7.89,
    category: 'Oracle',
    description: 'Chainlink is a decentralized oracle network that enables smart contracts to securely connect to external data sources, APIs, and payment systems.',
    trending: true
  },
  {
    id: 9,
    name: 'Uniswap',
    symbol: 'UNI',
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    price: 5.78,
    marketCap: 5678901234,
    volume24h: 123456789,
    priceChange24h: -0.67,
    priceChange7d: 2.34,
    category: 'DeFi',
    description: 'Uniswap is a decentralized trading protocol, known for its role in facilitating automated trading of decentralized finance tokens.',
    trending: false
  },
  {
    id: 10,
    name: 'Polygon',
    symbol: 'MATIC',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    price: 0.56,
    marketCap: 4567890123,
    volume24h: 98765432,
    priceChange24h: 2.67,
    priceChange7d: 6.78,
    category: 'Layer 2',
    description: 'Polygon is a protocol and a framework for building and connecting Ethereum-compatible blockchain networks.',
    trending: true
  }
];

/**
 * Mock trading history data for development and testing
 */
export const mockTradingHistory = [
  {
    id: 1,
    cryptoId: 1, // Bitcoin
    action: 'BUY',
    amount: 0.05,
    price: 63245.67,
    total: 3162.28,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 2,
    cryptoId: 1, // Bitcoin
    action: 'SELL',
    amount: 0.02,
    price: 64100.89,
    total: 1282.02,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 3,
    cryptoId: 2, // Ethereum
    action: 'BUY',
    amount: 1.5,
    price: 3245.67,
    total: 4868.51,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 4,
    cryptoId: 4, // Solana
    action: 'BUY',
    amount: 10,
    price: 126.43,
    total: 1264.30,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 5,
    cryptoId: 2, // Ethereum
    action: 'SELL',
    amount: 0.5,
    price: 3256.89,
    total: 1628.45,
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 6,
    cryptoId: 8, // Chainlink
    action: 'BUY',
    amount: 20,
    price: 14.32,
    total: 286.40,
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 7,
    cryptoId: 1, // Bitcoin
    action: 'BUY',
    amount: 0.01,
    price: 64289.53,
    total: 642.90,
    timestamp: new Date(Date.now() - 25200000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 8,
    cryptoId: 10, // Polygon
    action: 'BUY',
    amount: 100,
    price: 0.54,
    total: 54.00,
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 9,
    cryptoId: 4, // Solana
    action: 'SELL',
    amount: 5,
    price: 128.76,
    total: 643.80,
    timestamp: new Date(Date.now() - 32400000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 10,
    cryptoId: 3, // Cardano
    action: 'BUY',
    amount: 500,
    price: 0.43,
    total: 215.00,
    timestamp: new Date(Date.now() - 36000000).toISOString(),
    status: 'COMPLETED'
  }
];

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