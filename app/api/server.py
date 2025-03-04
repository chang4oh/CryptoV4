"""
Flask API server for the CryptoV4 trading system.
Provides endpoints for market data, sentiment analysis, and trading signals.
"""

import logging
import sys
import os
import traceback
from datetime import datetime, timedelta
import json
from bson import json_util
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import threading
import time
from functools import wraps

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

# Import project modules
from config import API_CONFIG, LOGGING_CONFIG, STRATEGY_CONFIG
from app.data.market_data import MarketDataCollector
from app.data.news_collector import NewsCollector
from app.analysis.sentiment_analyzer import SentimentAnalyzer
from app.strategy.sentiment_strategy import SentimentStrategy

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['log_level']),
    format=LOGGING_CONFIG['log_format'],
    handlers=[
        logging.FileHandler(LOGGING_CONFIG['log_file']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = API_CONFIG['secret_key']
CORS(app, origins=API_CONFIG['cors_origins'])

# Initialize global data collectors
market_data = MarketDataCollector()
news_collector = NewsCollector()
sentiment_analyzer = SentimentAnalyzer()
strategy = SentimentStrategy()

# Background update thread
update_thread = None
should_continue = True

def parse_json(data):
    """Parse MongoDB objects to JSON."""
    return json.loads(json_util.dumps(data))

def catch_errors(f):
    """Decorator to catch and log errors, returning appropriate HTTP responses."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"API error in {f.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'error': str(e),
                'status': 'error',
                'timestamp': datetime.now().isoformat()
            }), 500
    return decorated_function

def background_update():
    """Background thread to periodically update data and generate signals."""
    global should_continue
    
    logger.info("Starting background update thread")
    
    symbols = STRATEGY_CONFIG.get('symbols', ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'])
    market_interval = STRATEGY_CONFIG.get('market_data_interval', '1h')
    strategy_update_interval = STRATEGY_CONFIG.get('update_interval_minutes', 30)
    sentiment_update_interval = STRATEGY_CONFIG.get('sentiment_update_interval_minutes', 60)
    
    last_strategy_update = datetime.now() - timedelta(minutes=strategy_update_interval)
    last_sentiment_update = datetime.now() - timedelta(minutes=sentiment_update_interval)
    
    while should_continue:
        try:
            # Update market data (always runs)
            for symbol in symbols:
                market_data.collect_and_store_market_data(symbol, interval=market_interval)
                time.sleep(1)  # Avoid rate limits
            
            # Update sentiment data (less frequently)
            now = datetime.now()
            if (now - last_sentiment_update).total_seconds() >= sentiment_update_interval * 60:
                for symbol in symbols:
                    base_symbol = symbol.replace('USDT', '')
                    sentiment_analyzer.analyze_news_for_symbol(base_symbol)
                    time.sleep(2)  # Avoid rate limits
                last_sentiment_update = now
            
            # Generate trading signals
            if (now - last_strategy_update).total_seconds() >= strategy_update_interval * 60:
                signals = strategy.generate_signals_for_symbols(symbols)
                
                # Execute trades based on signals
                strategy.execute_trades_for_signals(signals)
                
                last_strategy_update = now
                logger.info(f"Generated signals for {len(symbols)} symbols")
            
            # Sleep before next update
            time.sleep(60)  # Check every minute
            
        except Exception as e:
            logger.error(f"Error in background update thread: {str(e)}")
            logger.error(traceback.format_exc())
            time.sleep(60)  # Wait before retrying
    
    logger.info("Background update thread stopped")

def start_background_thread():
    """Start the background update thread."""
    global update_thread, should_continue
    
    if update_thread is None or not update_thread.is_alive():
        should_continue = True
        update_thread = threading.Thread(target=background_update)
        update_thread.daemon = True
        update_thread.start()
        logger.info("Background update thread started")

def stop_background_thread():
    """Stop the background update thread."""
    global should_continue
    should_continue = False
    logger.info("Background update thread stopping...")

@app.route('/api/health', methods=['GET'])
@catch_errors
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'background_thread_active': update_thread is not None and update_thread.is_alive()
    })

@app.route('/api/market-data/<symbol>', methods=['GET'])
@catch_errors
def get_market_data(symbol):
    """Get market data for a symbol."""
    interval = request.args.get('interval', '1h')
    limit = int(request.args.get('limit', 100))
    
    data = market_data.get_historical_data(symbol, interval, limit)
    
    # Calculate indicators
    if data is not None and not data.empty:
        data = market_data.calculate_technical_indicators(data)
        data_dict = data.to_dict(orient='records')
        return jsonify({
            'symbol': symbol,
            'interval': interval,
            'data': data_dict,
            'timestamp': datetime.now().isoformat()
        })
    else:
        return jsonify({
            'symbol': symbol,
            'interval': interval,
            'data': [],
            'error': 'No data available',
            'timestamp': datetime.now().isoformat()
        })

@app.route('/api/news/<symbol>', methods=['GET'])
@catch_errors
def get_news(symbol):
    """Get news for a symbol."""
    limit = int(request.args.get('limit', 20))
    
    # Convert from trading pair to base symbol if needed
    base_symbol = symbol.replace('USDT', '')
    
    news_items = news_collector.collect_news(base_symbol, limit=limit)
    
    return jsonify({
        'symbol': base_symbol,
        'count': len(news_items),
        'news': parse_json(news_items),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/sentiment/<symbol>', methods=['GET'])
@catch_errors
def get_sentiment(symbol):
    """Get sentiment analysis for a symbol."""
    hours = int(request.args.get('hours', 24))
    limit = int(request.args.get('limit', 20))
    
    # Convert from trading pair to base symbol if needed
    base_symbol = symbol.replace('USDT', '')
    
    # Get sentiment summary
    summary = sentiment_analyzer.get_sentiment_summary(base_symbol, hours=hours)
    
    # Get recent sentiment items
    items = sentiment_analyzer.analyze_news_for_symbol(base_symbol, limit=limit)
    
    return jsonify({
        'symbol': base_symbol,
        'summary': parse_json(summary),
        'items': parse_json(items),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/signals', methods=['GET'])
@catch_errors
def get_signals():
    """Get recent trading signals."""
    symbol = request.args.get('symbol', None)
    limit = int(request.args.get('limit', 20))
    
    signals = strategy.get_recent_signals(symbol, limit=limit)
    
    return jsonify({
        'count': len(signals),
        'signals': parse_json(signals),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/trades', methods=['GET'])
@catch_errors
def get_trades():
    """Get recent trades."""
    symbol = request.args.get('symbol', None)
    limit = int(request.args.get('limit', 20))
    
    trades = strategy.get_recent_trades(symbol, limit=limit)
    
    return jsonify({
        'count': len(trades),
        'trades': parse_json(trades),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/performance', methods=['GET'])
@catch_errors
def get_performance():
    """Get strategy performance metrics."""
    days = int(request.args.get('days', 30))
    
    performance = strategy.get_strategy_performance(days=days)
    
    return jsonify({
        'performance': parse_json(performance),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/generate-signal', methods=['POST'])
@catch_errors
def generate_signal():
    """Generate a trading signal on demand."""
    data = request.json
    symbol = data.get('symbol')
    
    if not symbol:
        return jsonify({
            'error': 'Symbol is required',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 400
    
    signal = strategy.generate_signal(symbol)
    
    return jsonify({
        'signal': parse_json(signal),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/execute-trade', methods=['POST'])
@catch_errors
def execute_trade():
    """Execute a trade based on a signal."""
    data = request.json
    signal_id = data.get('signal_id')
    symbol = data.get('symbol')
    
    if not symbol and not signal_id:
        return jsonify({
            'error': 'Signal ID or symbol is required',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 400
    
    # If signal_id is provided, get the signal from the database
    if signal_id:
        # This would need to be implemented in the strategy class
        signal = None  # strategy.get_signal_by_id(signal_id)
    else:
        # Generate a new signal
        signal = strategy.generate_signal(symbol)
    
    if not signal:
        return jsonify({
            'error': 'Signal not found',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 404
    
    trade = strategy.execute_trade(signal)
    
    if not trade:
        return jsonify({
            'error': 'Trade execution failed',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 400
    
    return jsonify({
        'trade': parse_json(trade),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/update/start', methods=['POST'])
@catch_errors
def start_update():
    """Start the background update thread."""
    start_background_thread()
    return jsonify({
        'status': 'started',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/update/stop', methods=['POST'])
@catch_errors
def stop_update():
    """Stop the background update thread."""
    stop_background_thread()
    return jsonify({
        'status': 'stopping',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/symbols', methods=['GET'])
@catch_errors
def get_symbols():
    """Get list of supported symbols."""
    return jsonify({
        'symbols': STRATEGY_CONFIG.get('symbols', ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']),
        'timestamp': datetime.now().isoformat()
    })

# Initialize the app
@app.before_first_request
def initialize():
    """Initialize the application before the first request."""
    try:
        logger.info("Initializing API server")
        
        # Start the background update thread
        if API_CONFIG.get('start_background_thread', True):
            start_background_thread()
        
        logger.info("API server initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing API server: {str(e)}")
        logger.error(traceback.format_exc())

# Start the server
if __name__ == '__main__':
    app.run(
        host=API_CONFIG['host'],
        port=API_CONFIG['port'],
        debug=API_CONFIG['debug']
    ) 