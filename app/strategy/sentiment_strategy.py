"""
Sentiment-based trading strategy for cryptocurrency markets.
Combines technical indicators with sentiment analysis to generate trading signals.
"""

import logging
import sys
import os
import traceback
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
import json
from typing import Dict, List, Union, Optional, Tuple

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

# Import project modules
from config import MONGODB_CONFIG, STRATEGY_CONFIG, LOGGING_CONFIG
from app.data.market_data import MarketDataCollector
from app.analysis.sentiment_analyzer import SentimentAnalyzer

# Load environment variables
load_dotenv()

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

class SentimentStrategy:
    def __init__(self):
        """Initialize the SentimentStrategy with data collectors and database connection."""
        try:
            # Initialize MongoDB connection
            self.mongo_client = MongoClient(MONGODB_CONFIG['uri'])
            self.db = self.mongo_client[MONGODB_CONFIG['db_name']]
            
            # Initialize data collectors
            self.market_data = MarketDataCollector()
            self.sentiment_analyzer = SentimentAnalyzer()
            
            # Load strategy configuration
            self.config = STRATEGY_CONFIG
            
            # Create collections if they don't exist
            if 'signals' not in self.db.list_collection_names():
                self.db.create_collection('signals')
                self.db.signals.create_index([("symbol", 1), ("timestamp", -1)])
                logger.info("Created signals collection with indexes")
                
            if 'trades' not in self.db.list_collection_names():
                self.db.create_collection('trades')
                self.db.trades.create_index([("symbol", 1), ("timestamp", -1)])
                self.db.trades.create_index([("status", 1)])
                logger.info("Created trades collection with indexes")
            
            logger.info("SentimentStrategy initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing SentimentStrategy: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    def get_market_sentiment_data(self, symbol: str) -> Tuple[pd.DataFrame, Dict]:
        """
        Get market and sentiment data for a symbol.
        
        Args:
            symbol: Cryptocurrency symbol
            
        Returns:
            Tuple of market data dataframe and sentiment summary
        """
        try:
            # Get market data from collector
            market_data = self.market_data.get_historical_data(
                symbol=symbol,
                interval=self.config.get('market_data_interval', '1h'),
                limit=self.config.get('market_data_lookback', 100)
            )
            
            # Calculate technical indicators
            market_df = self.market_data.calculate_technical_indicators(market_data)
            
            # Get sentiment summary
            sentiment_hours = self.config.get('sentiment_lookback_hours', 24)
            sentiment_summary = self.sentiment_analyzer.get_sentiment_summary(symbol, hours=sentiment_hours)
            
            return market_df, sentiment_summary
        
        except Exception as e:
            logger.error(f"Error getting market and sentiment data: {str(e)}")
            logger.error(traceback.format_exc())
            return pd.DataFrame(), {}
    
    def generate_signal(self, symbol: str) -> Dict:
        """
        Generate a trading signal for a symbol based on market data and sentiment.
        
        Args:
            symbol: Cryptocurrency symbol
            
        Returns:
            Signal dictionary with trade recommendation
        """
        try:
            # Get market and sentiment data
            market_df, sentiment_summary = self.get_market_sentiment_data(symbol)
            
            if market_df.empty or not sentiment_summary:
                logger.warning(f"Insufficient data to generate signal for {symbol}")
                return {
                    'symbol': symbol,
                    'signal': 'NEUTRAL',
                    'confidence': 0.0,
                    'timestamp': datetime.now().isoformat(),
                    'error': 'Insufficient data'
                }
            
            # Extract sentiment score
            sentiment_score = sentiment_summary.get('average_score', 0.0)
            
            # Check if market data has required technical indicators
            required_indicators = ['rsi_14', 'ma_50', 'ma_200']
            if not all(indicator in market_df.columns for indicator in required_indicators):
                logger.warning(f"Missing technical indicators for {symbol}")
                return {
                    'symbol': symbol,
                    'signal': 'NEUTRAL',
                    'confidence': 0.0,
                    'timestamp': datetime.now().isoformat(),
                    'error': 'Missing technical indicators'
                }
            
            # Get latest market data
            latest_data = market_df.iloc[-1]
            
            # Calculate technical factors
            rsi = latest_data['rsi_14']
            ma_50 = latest_data['ma_50']
            ma_200 = latest_data['ma_200']
            close_price = latest_data['close']
            
            # Define technical conditions
            is_oversold = rsi < 30
            is_overbought = rsi > 70
            is_uptrend = close_price > ma_50 > ma_200
            is_downtrend = close_price < ma_50 < ma_200
            
            # Initialize signal strength factors
            technical_score = 0.0
            
            # Calculate technical score (-1.0 to 1.0)
            if is_uptrend:
                technical_score += 0.5
            elif is_downtrend:
                technical_score -= 0.5
                
            if is_oversold:
                technical_score += 0.3
            elif is_overbought:
                technical_score -= 0.3
            
            # Add more nuanced technical analysis
            if 'macd' in market_df.columns and 'macd_signal' in market_df.columns:
                macd = latest_data['macd']
                macd_signal = latest_data['macd_signal']
                
                if macd > macd_signal:
                    technical_score += 0.2
                elif macd < macd_signal:
                    technical_score -= 0.2
            
            # Ensure technical_score is within -1.0 to 1.0
            technical_score = max(-1.0, min(1.0, technical_score))
            
            # Combine technical and sentiment scores
            tech_weight = self.config.get('technical_weight', 0.6)
            sentiment_weight = self.config.get('sentiment_weight', 0.4)
            
            # Calculate combined score (-1.0 to 1.0)
            combined_score = (technical_score * tech_weight) + (sentiment_score * sentiment_weight)
            
            # Determine signal based on combined score
            signal = 'NEUTRAL'
            if combined_score >= 0.5:
                signal = 'BUY'
            elif combined_score <= -0.5:
                signal = 'SELL'
            
            # Calculate confidence (0.0 to 1.0)
            confidence = abs(combined_score)
            
            # Create signal object
            signal_data = {
                'symbol': symbol,
                'signal': signal,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat(),
                'price': close_price,
                'factors': {
                    'technical_score': technical_score,
                    'sentiment_score': sentiment_score,
                    'rsi': rsi,
                    'is_uptrend': bool(is_uptrend),
                    'is_downtrend': bool(is_downtrend),
                    'sentiment_label': sentiment_summary.get('sentiment_label', 'neutral'),
                    'sentiment_count': sentiment_summary.get('sentiment_count', 0)
                }
            }
            
            # Store signal in database
            self.db.signals.insert_one(signal_data)
            
            logger.info(f"Generated {signal} signal for {symbol} with confidence {confidence:.2f}")
            return signal_data
        
        except Exception as e:
            logger.error(f"Error generating signal for {symbol}: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'symbol': symbol,
                'signal': 'NEUTRAL',
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def generate_signals_for_symbols(self, symbols: List[str]) -> List[Dict]:
        """
        Generate signals for multiple symbols.
        
        Args:
            symbols: List of cryptocurrency symbols
            
        Returns:
            List of signal dictionaries
        """
        signals = []
        for symbol in symbols:
            try:
                signal = self.generate_signal(symbol)
                signals.append(signal)
            except Exception as e:
                logger.error(f"Error generating signal for {symbol}: {str(e)}")
                logger.error(traceback.format_exc())
        
        return signals
    
    def execute_trade(self, signal: Dict) -> Dict:
        """
        Execute a trade based on a signal.
        In a real implementation, this would connect to an exchange API.
        
        Args:
            signal: Signal dictionary
            
        Returns:
            Trade dictionary with execution details
        """
        try:
            if signal['signal'] == 'NEUTRAL' or signal.get('confidence', 0) < self.config.get('min_confidence', 0.7):
                logger.info(f"Signal for {signal['symbol']} doesn't meet confidence threshold, not executing trade")
                return None
            
            # Get position sizing from config
            position_size = self.config.get('position_size', 0.1)  # Default to 10% of available capital
            
            # In a real implementation, get account balance from exchange
            available_capital = 10000.0  # Placeholder
            
            # Calculate trade size
            trade_amount = available_capital * position_size
            
            # Create trade object
            trade = {
                'symbol': signal['symbol'],
                'signal': signal['signal'],
                'confidence': signal.get('confidence', 0),
                'timestamp': datetime.now().isoformat(),
                'price': signal.get('price', 0),
                'amount': trade_amount,
                'status': 'PENDING',
                'signal_id': str(signal.get('_id', '')),
                'execution_details': {
                    'strategy': 'sentiment_based',
                    'account': 'main',
                    'position_size': position_size
                }
            }
            
            # In a real implementation, send order to exchange
            # For simulation, just update the status
            trade['status'] = 'EXECUTED'
            
            # Store trade in database
            self.db.trades.insert_one(trade)
            
            logger.info(f"Executed {trade['signal']} trade for {trade['symbol']} at {trade['price']}")
            
            # Convert ObjectId to string for JSON serialization
            if '_id' in trade:
                trade['_id'] = str(trade['_id'])
            
            return trade
        
        except Exception as e:
            logger.error(f"Error executing trade for {signal['symbol']}: {str(e)}")
            logger.error(traceback.format_exc())
            return None
    
    def execute_trades_for_signals(self, signals: List[Dict]) -> List[Dict]:
        """
        Execute trades for multiple signals.
        
        Args:
            signals: List of signal dictionaries
            
        Returns:
            List of trade dictionaries
        """
        trades = []
        for signal in signals:
            try:
                trade = self.execute_trade(signal)
                if trade:
                    trades.append(trade)
            except Exception as e:
                logger.error(f"Error executing trade for {signal['symbol']}: {str(e)}")
                logger.error(traceback.format_exc())
        
        return trades
    
    def get_recent_signals(self, symbol: str = None, limit: int = 20) -> List[Dict]:
        """
        Get recent signals from the database.
        
        Args:
            symbol: Cryptocurrency symbol (optional)
            limit: Maximum number of signals to retrieve
            
        Returns:
            List of signal dictionaries
        """
        try:
            query = {}
            if symbol:
                query['symbol'] = symbol
            
            signals = list(self.db.signals.find(query).sort('timestamp', -1).limit(limit))
            
            # Convert ObjectId to string for JSON serialization
            for signal in signals:
                if '_id' in signal:
                    signal['_id'] = str(signal['_id'])
            
            return signals
        except Exception as e:
            logger.error(f"Error getting recent signals: {str(e)}")
            logger.error(traceback.format_exc())
            return []
    
    def get_recent_trades(self, symbol: str = None, limit: int = 20) -> List[Dict]:
        """
        Get recent trades from the database.
        
        Args:
            symbol: Cryptocurrency symbol (optional)
            limit: Maximum number of trades to retrieve
            
        Returns:
            List of trade dictionaries
        """
        try:
            query = {}
            if symbol:
                query['symbol'] = symbol
            
            trades = list(self.db.trades.find(query).sort('timestamp', -1).limit(limit))
            
            # Convert ObjectId to string for JSON serialization
            for trade in trades:
                if '_id' in trade:
                    trade['_id'] = str(trade['_id'])
            
            return trades
        except Exception as e:
            logger.error(f"Error getting recent trades: {str(e)}")
            logger.error(traceback.format_exc())
            return []
    
    def get_strategy_performance(self, days: int = 30) -> Dict:
        """
        Calculate strategy performance over a time period.
        
        Args:
            days: Number of days to look back
            
        Returns:
            Dictionary with performance metrics
        """
        try:
            since = datetime.now() - timedelta(days=days)
            
            # Get trades in the period
            trades = list(self.db.trades.find({
                'timestamp': {'$gte': since.isoformat()}
            }))
            
            if not trades:
                return {
                    'period_days': days,
                    'total_trades': 0,
                    'win_rate': 0.0,
                    'avg_profit': 0.0,
                    'total_profit': 0.0,
                    'timestamp': datetime.now().isoformat()
                }
            
            # In a real implementation, this would calculate actual trade P&L
            # For simulation, we'll use mock data
            
            # Simulate trade results
            for trade in trades:
                # Assign random P&L to each trade (for simulation only)
                if trade['signal'] == 'BUY':
                    trade['profit_pct'] = np.random.normal(0.05, 0.1)  # Mean 5%, std 10%
                else:  # SELL
                    trade['profit_pct'] = np.random.normal(0.03, 0.08)  # Mean 3%, std 8%
                
                trade['profit_amount'] = trade['amount'] * trade['profit_pct']
            
            # Calculate performance metrics
            total_trades = len(trades)
            profitable_trades = sum(1 for t in trades if t.get('profit_pct', 0) > 0)
            win_rate = profitable_trades / total_trades if total_trades > 0 else 0
            
            total_profit = sum(t.get('profit_amount', 0) for t in trades)
            avg_profit = total_profit / total_trades if total_trades > 0 else 0
            
            # Calculate metrics by signal type
            buy_trades = [t for t in trades if t['signal'] == 'BUY']
            sell_trades = [t for t in trades if t['signal'] == 'SELL']
            
            buy_profit = sum(t.get('profit_amount', 0) for t in buy_trades)
            sell_profit = sum(t.get('profit_amount', 0) for t in sell_trades)
            
            performance = {
                'period_days': days,
                'total_trades': total_trades,
                'win_rate': win_rate,
                'avg_profit': avg_profit,
                'total_profit': total_profit,
                'by_signal': {
                    'BUY': {
                        'count': len(buy_trades),
                        'profit': buy_profit
                    },
                    'SELL': {
                        'count': len(sell_trades),
                        'profit': sell_profit
                    }
                },
                'timestamp': datetime.now().isoformat()
            }
            
            return performance
        
        except Exception as e:
            logger.error(f"Error calculating strategy performance: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'period_days': days,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Main execution for testing
if __name__ == "__main__":
    strategy = SentimentStrategy()
    
    # Test generating signals
    symbols = ['BTCUSDT', 'ETHUSDT']
    signals = strategy.generate_signals_for_symbols(symbols)
    
    if signals:
        print(f"Generated {len(signals)} signals:")
        for signal in signals:
            print(f"- {signal['symbol']}: {signal['signal']} (Confidence: {signal['confidence']:.2f})")
            print(f"  Technical Score: {signal['factors']['technical_score']:.2f}")
            print(f"  Sentiment Score: {signal['factors']['sentiment_score']:.2f}")
            print(f"  Sentiment Label: {signal['factors']['sentiment_label']}")
            print()
    
    # Test executing trades
    trades = strategy.execute_trades_for_signals(signals)
    
    if trades:
        print(f"\nExecuted {len(trades)} trades:")
        for trade in trades:
            print(f"- {trade['symbol']}: {trade['signal']} at {trade['price']}")
            print(f"  Amount: ${trade['amount']:.2f}")
            print(f"  Status: {trade['status']}")
            print()
    
    # Test performance metrics
    performance = strategy.get_strategy_performance(days=30)
    print("\nStrategy Performance (30 days):")
    print(f"Total Trades: {performance['total_trades']}")
    print(f"Win Rate: {performance['win_rate']:.2%}")
    print(f"Average Profit: ${performance['avg_profit']:.2f}")
    print(f"Total Profit: ${performance['total_profit']:.2f}") 