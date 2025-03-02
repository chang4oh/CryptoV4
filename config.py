# Trading System Configuration

# Trading parameters
TRADING_CONFIG = {
    # Trading pair
    'symbol': 'BTCUSDT',
    
    # Position sizing
    'base_position_size': 20,  # Base position size in USDT
    
    # Risk management
    'stop_loss_pct': 0.02,     # 2% stop loss
    
    # Signal generation
    'sentiment_threshold': 0.2,  # Minimum sentiment score for trading
    'price_trend_threshold': 0.5,  # Minimum 24h price change % for trend
    
    # Trading frequency
    'trading_interval': 300,  # Seconds between trading cycles (5 minutes)
    
    # Data collection
    'news_limit': 50,  # Number of news items to fetch per cycle
    'sentiment_lookback': 20,  # Number of sentiment items to average
}

# MongoDB configuration
MONGODB_CONFIG = {
    'uri': 'mongodb://localhost:27017/',
    'db_name': 'CryptoV4',
    'collections': {
        'sentiment_data': 'sentiment_data',
        'market_data': 'market_data',
        'trading_history': 'trading_history'
    }
}

# Logging configuration
LOGGING_CONFIG = {
    'log_level': 'INFO',
    'log_file': 'trading_log.txt',
    'log_format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}

# API configuration
API_CONFIG = {
    'binance_testnet': True,  # Use Binance testnet
} 