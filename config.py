"""
Configuration settings for the CryptoV4 trading system.
Contains database settings, API credentials, and trading parameters.
"""

import os
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Trading parameters
TRADING_CONFIG = {
    # Trading pair
    'symbol': 'BTCUSDT',
    'symbols': ['BTCUSDT', 'ETHUSDT'],  # Supported symbols
    
    # Position sizing
    'base_position_size': float(os.getenv('BASE_POSITION_SIZE', '20')),  # Base position size in USDT
    
    # Risk management
    'stop_loss_pct': 0.02,     # 2% stop loss
    'take_profit_pct': 0.05,   # 5% take profit
    
    # Signal generation
    'sentiment_threshold': 0.2,  # Minimum sentiment score for trading
    'price_trend_threshold': 0.5,  # Minimum 24h price change % for trend
    
    # Trading frequency
    'trading_interval': 300,  # Seconds between trading cycles (5 minutes)
    
    # Data collection
    'news_limit': 50,  # Number of news items to fetch per cycle
    'sentiment_lookback': 20,  # Number of sentiment items to average

    # Trading mode
    'live_trading': os.getenv('LIVE_TRADING', 'false').lower() == 'true',  # Default to test mode
    'active': os.getenv('TRADING_ACTIVE', 'false').lower() == 'true',  # Trading active flag
    
    # Default quantity for trades
    'quantity': {
        'BTCUSDT': float(os.getenv('BTC_QUANTITY', '0.001')),
        'ETHUSDT': float(os.getenv('ETH_QUANTITY', '0.01'))
    }
}

# MongoDB Configuration
MONGODB_CONFIG = {
    'uri': os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'),
    'db_name': os.getenv('MONGODB_DB', 'CryptoV4'),
    'collections': {
        'market_data': 'market_data',
        'news_data': 'news_data',
        'sentiment_data': 'sentiment_data',
        'signals': 'signals',
        'trades': 'trades'
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    'log_level': os.getenv('LOG_LEVEL', 'INFO'),
    'log_format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'log_file': os.getenv('LOG_FILE', f'logs/cryptov4_{datetime.now().strftime("%Y%m%d")}.log')
}

# Ensure log directory exists
os.makedirs(os.path.dirname(LOGGING_CONFIG['log_file']), exist_ok=True)

# Binance API Configuration
BINANCE_CONFIG = {
    'api_key': os.getenv('BINANCE_API_KEY', ''),
    'api_secret': os.getenv('BINANCE_API_SECRET', ''),
    'testnet': os.getenv('USE_TESTNET', 'True').lower() == 'true',
    'recv_window': int(os.getenv('RECV_WINDOW', '5000')),
    'symbols': ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT']
}

# News API Configuration
NEWS_API_CONFIG = {
    'api_key': os.getenv('NEWS_API_KEY', ''),
    'cryptocompare_api_key': os.getenv('CRYPTOCOMPARE_API_KEY', ''),
    'symbols': ['BTC', 'ETH', 'SOL', 'ADA', 'XRP']
}

# Sentiment Analysis Configuration
SENTIMENT_CONFIG = {
    'use_vader': True,
    'use_finbert': True,
    'vader_weight': 0.4,
    'finbert_weight': 0.6,
    'max_threads': int(os.getenv('SENTIMENT_MAX_THREADS', '2')),
    'update_interval_minutes': int(os.getenv('SENTIMENT_UPDATE_INTERVAL', '60'))
}

# Trading Strategy Configuration
STRATEGY_CONFIG = {
    'market_data_interval': '1h',
    'market_data_lookback': 100,
    'sentiment_lookback_hours': 24,
    'technical_weight': 0.6,
    'sentiment_weight': 0.4,
    'min_confidence': 0.7,
    'position_size': 0.1,  # 10% of available capital per trade
    'symbols': ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    'update_interval_minutes': int(os.getenv('STRATEGY_UPDATE_INTERVAL', '30'))
}

# API Server Configuration
API_CONFIG = {
    'host': os.getenv('API_HOST', '0.0.0.0'),
    'port': int(os.getenv('API_PORT', '5000')),
    'debug': os.getenv('API_DEBUG', 'False').lower() in ('true', '1', 't'),
    'secret_key': os.getenv('API_SECRET_KEY', 'crypto_v4_secret_key'),
    'cors_origins': os.getenv('CORS_ORIGINS', '*').split(',')
}

# Frontend Configuration
FRONTEND_CONFIG = {
    'api_url': os.getenv('API_URL', 'http://localhost:5000'),
    'refresh_interval_seconds': int(os.getenv('REFRESH_INTERVAL', '60')),
    'charts_lookback_days': int(os.getenv('CHARTS_LOOKBACK', '30')),
    'use_demo_data': os.getenv('USE_DEMO_DATA', 'False').lower() in ('true', '1', 't')
}

# Test Configuration
TEST_CONFIG = {
    'use_mock_apis': os.getenv('USE_MOCK_APIS', 'True').lower() in ('true', '1', 't'),
    'demo_data_path': os.path.join(os.path.dirname(__file__), 'tests/fixtures')
}

# Function to validate configuration
def validate_config():
    """Validate the configuration and log warnings for missing critical items."""
    warnings = []
    
    # Check for critical API keys
    if not BINANCE_CONFIG['api_key'] or not BINANCE_CONFIG['api_secret']:
        warnings.append("Binance API credentials are missing. Live trading will not be available.")
    
    if not NEWS_API_CONFIG['api_key']:
        warnings.append("NewsAPI key is missing. This news source will not be available.")
    
    if not NEWS_API_CONFIG['cryptocompare_api_key']:
        warnings.append("CryptoCompare API key is missing. This news source will not be available.")
    
    # Log warnings
    for warning in warnings:
        logging.warning(warning)
    
    return len(warnings) == 0

# Validate configuration when module is imported
validate_config() 