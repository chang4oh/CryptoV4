import os
import sys
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify
from pymongo import MongoClient
import pandas as pd

# Add the project root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from config import MONGODB_CONFIG, TRADING_CONFIG

app = Flask(__name__, 
            template_folder=os.path.join(project_root, 'app', 'templates'),
            static_folder=os.path.join(project_root, 'app', 'static'))

# Connect to MongoDB
client = MongoClient(MONGODB_CONFIG['uri'])
db = client[MONGODB_CONFIG['db_name']]

@app.route('/')
def index():
    """Main dashboard page."""
    return render_template('index.html', 
                          symbol=TRADING_CONFIG['symbol'],
                          config=TRADING_CONFIG)

@app.route('/api/trading_status')
def trading_status():
    """Get current trading status."""
    try:
        # Get latest trading history
        latest_trades = list(db.trading_history.find().sort('timestamp', -1).limit(10))
        for trade in latest_trades:
            trade['_id'] = str(trade['_id'])
            trade['timestamp'] = trade['timestamp'].isoformat()
        
        # Get latest market data
        market_data = db.market_data.find_one(
            {'symbol': TRADING_CONFIG['symbol']},
            sort=[('timestamp', -1)]
        )
        if market_data:
            market_data['_id'] = str(market_data['_id'])
            market_data['timestamp'] = market_data['timestamp'].isoformat()
        
        # Get latest sentiment data
        sentiment_data = list(db.sentiment_data.find(
            {'symbol': 'BTC'},
            sort=[('timestamp', -1)]
        ).limit(20))
        
        avg_sentiment = 0
        if sentiment_data:
            sentiment_scores = [item['sentiment_score'] for item in sentiment_data]
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            
            # Convert ObjectId to string for JSON serialization
            for item in sentiment_data:
                item['_id'] = str(item['_id'])
                item['timestamp'] = item['timestamp'].isoformat()
        
        return jsonify({
            'latest_trades': latest_trades,
            'market_data': market_data,
            'avg_sentiment': avg_sentiment,
            'sentiment_data': sentiment_data[:5]  # Just send the 5 most recent
        })
    
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/performance')
def performance():
    """Get trading performance data."""
    try:
        # Get all trades
        trades = list(db.trading_history.find().sort('timestamp', 1))
        
        if not trades:
            return jsonify({
                'total_trades': 0,
                'profit_loss': 0,
                'win_rate': 0,
                'trade_history': []
            })
        
        # Calculate performance metrics
        buy_trades = [t for t in trades if t['side'] == 'BUY']
        sell_trades = [t for t in trades if t['side'] == 'SELL']
        
        # Simple P&L calculation (very basic)
        total_bought = sum(float(t['executed_qty']) * float(t['price']) for t in buy_trades)
        total_sold = sum(float(t['executed_qty']) * float(t['price']) for t in sell_trades)
        profit_loss = total_sold - total_bought
        
        # Prepare trade history for chart
        trade_history = []
        for trade in trades:
            trade_history.append({
                'timestamp': trade['timestamp'].isoformat(),
                'side': trade['side'],
                'price': float(trade['price']),
                'quantity': float(trade['executed_qty']),
                'value': float(trade['executed_qty']) * float(trade['price'])
            })
        
        return jsonify({
            'total_trades': len(trades),
            'profit_loss': profit_loss,
            'win_rate': len(sell_trades) / len(buy_trades) if buy_trades else 0,
            'trade_history': trade_history
        })
    
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 