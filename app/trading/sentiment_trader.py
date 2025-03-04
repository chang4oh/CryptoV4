import logging
import time
import sys
import os
from typing import Dict
from datetime import datetime, timedelta

# Add the project root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from app.data.news_collector import NewsCollector
from app.data.market_data import MarketDataCollector
from app.trading.trade_executor import TradeExecutor
from config import TRADING_CONFIG

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SentimentTrader:
    """
    Trading strategy that combines technical analysis with sentiment analysis.
    """
    
    def __init__(self, config=None, test_mode=True):
        """
        Initialize the sentiment-based trader.
        
        Args:
            config: Configuration dictionary (if None, uses default config)
            test_mode: If True, only simulate trades, don't execute them
        """
        self.logger = logging.getLogger(__name__)
        self.config = config or TRADING_CONFIG
        self.test_mode = test_mode
        
        # Initialize components
        self.news_collector = NewsCollector() if not os.environ.get("SKIP_SENTIMENT_ANALYSIS") else None
        self.market_data = MarketDataCollector()
        self.trade_executor = TradeExecutor(test_mode=test_mode)
        
        # Trading parameters
        self.symbol = self.config.get('symbol', 'BTCUSDT')
        self.base_position_size = self.config.get('position_size', 100.0)  # in USDT
        self.stop_loss_pct = self.config.get('stop_loss_pct', 0.02)        # 2% stop loss
        self.take_profit_pct = self.config.get('take_profit_pct', 0.05)    # 5% take profit
        self.sentiment_threshold = self.config.get('sentiment_threshold', 0.6)  # Min sentiment score to enter
        self.sentiment_lookback_hours = self.config.get('sentiment_lookback_hours', 24)
        
        logger.info(f"Sentiment trader initialized (test_mode: {self.test_mode})")
    
    def get_trading_signal(self) -> Dict:
        """
        Generate a trading signal based on sentiment and technical analysis.
        
        Returns:
            Dictionary with signal details
        """
        self.logger.info(f"Generating trading signal for {self.symbol}")
        
        # Initialize signal
        signal = {
            'symbol': self.symbol,
            'timestamp': datetime.now(),
            'action': 'HOLD',  # Default is to hold
            'confidence': 0.0,
            'price': 0.0,
            'reason': []
        }
        
        # Get current market data
        ticker = self.market_data.get_ticker(self.symbol)
        if not ticker:
            signal['reason'].append("Unable to fetch market data")
            return signal
        
        # Handle different ticker formats for different Binance API versions
        if 'lastPrice' in ticker:
            current_price = float(ticker['lastPrice'])
        elif 'last' in ticker:
            current_price = float(ticker['last'])
        elif 'price' in ticker:
            current_price = float(ticker['price'])
        else:
            self.logger.error(f"Unknown ticker format: {ticker}")
            signal['reason'].append("Unable to parse ticker data")
            return signal
            
        signal['price'] = current_price
        self.logger.info(f"Current price: {current_price}")
        
        # Get sentiment data if available
        sentiment_score = 0.5  # Neutral sentiment by default
        sentiment_signal = "NEUTRAL"
        
        if not os.environ.get("SKIP_SENTIMENT_ANALYSIS") and self.news_collector:
            try:
                # Get sentiment from news
                sentiment_data = self.news_collector.get_average_sentiment(
                    self.symbol.replace('USDT', ''), 
                    hours=self.sentiment_lookback_hours
                )
                
                if sentiment_data:
                    sentiment_score = sentiment_data.get('average_score', 0.5)
                    sentiment_signal = "BULLISH" if sentiment_score > self.sentiment_threshold else \
                                      "BEARISH" if sentiment_score < (1 - self.sentiment_threshold) else \
                                      "NEUTRAL"
                    
                    self.logger.info(f"Sentiment score: {sentiment_score:.2f} ({sentiment_signal})")
                    signal['reason'].append(f"Sentiment: {sentiment_signal} ({sentiment_score:.2f})")
                else:
                    self.logger.warning("No sentiment data available")
                    signal['reason'].append("No sentiment data available")
            except Exception as e:
                self.logger.error(f"Error getting sentiment: {str(e)}")
                signal['reason'].append(f"Sentiment error: {str(e)}")
        else:
            self.logger.info("Sentiment analysis skipped (--no-sentiment flag or news collector unavailable)")
            signal['reason'].append("Sentiment analysis skipped")
        
        # Check price trend
        price_trending_up = self.market_data.is_price_trending_up(self.symbol, 0.01)
        self.logger.info(f"Price trending up: {price_trending_up}")
        signal['reason'].append(f"Price trending up: {price_trending_up}")
        
        # Generate trading signal
        current_position = self.trade_executor.get_position('BTC')
        self.logger.info(f"Current BTC position: {current_position}")
        signal['reason'].append(f"Current BTC position: {current_position}")
        
        if current_position > 0:
            self.logger.info("Checking exit conditions (have BTC position)")
            # Check stop loss
            entry_price = self.get_position_entry_price()
            if entry_price:
                current_price = current_price
                price_change = (current_price - entry_price) / entry_price
                self.logger.info(f"Entry price: ${entry_price:,.2f}, current price: ${current_price:,.2f}, change: {price_change*100:.2f}% (stop loss: {self.stop_loss_pct*100}%)")
                
                if price_change < -self.stop_loss_pct:
                    self.logger.info("Stop loss triggered")
                    signal['action'] = 'SELL'
                    signal['confidence'] = 1.0
                    signal['reason'].append("Stop loss triggered")
                    return signal
            else:
                self.logger.info("No entry price found for current position")
            
            # Check sentiment for exit
            if sentiment_score < self.sentiment_threshold:
                self.logger.info("Negative sentiment triggered exit")
                signal['action'] = 'SELL'
                signal['confidence'] = 1.0
                signal['reason'].append("Negative sentiment")
                return signal
            
            self.logger.info("No exit conditions met")
        else:
            self.logger.info("Checking entry conditions (no BTC position)")
            # Entry conditions
            if sentiment_score > self.sentiment_threshold and price_trending_up:
                self.logger.info("Entry conditions met: positive sentiment and upward trend")
                signal['action'] = 'BUY'
                signal['confidence'] = 1.0
                signal['reason'].append("Positive sentiment and upward trend")
                return signal
            else:
                if sentiment_score <= self.sentiment_threshold:
                    self.logger.info(f"Sentiment too low for entry: {sentiment_score:.4f} <= {self.sentiment_threshold}")
                    signal['reason'].append(f"Sentiment too low for entry: {sentiment_score:.4f} <= {self.sentiment_threshold}")
                if not price_trending_up:
                    self.logger.info(f"Price not trending up enough for entry")
                    signal['reason'].append("Price not trending up enough for entry")
        
        self.logger.info("No trading conditions met")
        signal['action'] = 'HOLD'
        signal['confidence'] = 0.0
        signal['reason'].append("No trading conditions met")
        return signal
    
    def get_position_entry_price(self) -> float:
        """Get entry price of current position."""
        try:
            last_trade = self.trade_executor.db.trading_history.find_one(
                {'symbol': self.symbol, 'side': 'BUY'},
                sort=[('timestamp', -1)]
            )
            return float(last_trade['price']) if last_trade else None
        except Exception as e:
            self.logger.error(f"Error getting entry price: {str(e)}")
            return None
    
    def execute_signal(self, signal: Dict) -> Dict:
        """Execute the trading signal."""
        try:
            if signal['action'] == 'BUY':
                # Set position size if not already in the signal
                if 'position_size' not in signal:
                    signal['position_size'] = self.base_position_size
                
                return self.trade_executor.place_market_order(
                    symbol=self.symbol,
                    side='BUY',
                    quote_quantity=signal['position_size']
                )
            elif signal['action'] == 'SELL':
                # Get current BTC position if not specified
                if 'position_size' not in signal:
                    signal['position_size'] = self.trade_executor.get_position('BTC')
                
                return self.trade_executor.place_market_order(
                    symbol=self.symbol,
                    side='SELL',
                    quantity=signal['position_size']
                )
            return {'status': 'NEUTRAL', 'message': 'No action taken'}
            
        except Exception as e:
            self.logger.error(f"Error executing signal: {str(e)}")
            return {'status': 'ERROR', 'error': str(e)}
    
    def run(self, interval: int = 300):
        """Run the trading loop."""
        self.logger.info(f"Starting trading loop with {interval}s interval")
        
        while True:
            try:
                # Generate and execute trading signal
                signal = self.get_trading_signal()
                self.logger.info(f"Signal generated: {signal}")
                
                if signal['action'] in ['BUY', 'SELL']:
                    result = self.execute_signal(signal)
                    self.logger.info(f"Trade execution result: {result}")
                
                # Wait for next iteration
                time.sleep(interval)
                
            except Exception as e:
                self.logger.error(f"Error in trading loop: {str(e)}")
                time.sleep(60)  # Wait a minute before retrying

if __name__ == "__main__":
    # Example usage
    trader = SentimentTrader()
    
    print("\nStarting sentiment-based trader...")
    print(f"Trading {trader.symbol} with {trader.base_position_size} USDT position size")
    print(f"Stop loss: {trader.stop_loss_pct*100}%")
    print(f"Sentiment threshold: {trader.sentiment_threshold}")
    
    # Get initial account balance
    usdt_balance = trader.trade_executor.get_account_balance('USDT')
    btc_balance = trader.trade_executor.get_account_balance('BTC')
    print(f"\nInitial balance:")
    print(f"USDT: ${usdt_balance:,.2f}")
    print(f"BTC: {btc_balance:.8f}")
    
    # Start trading
    print("\nStarting trading loop...")
    trader.run()