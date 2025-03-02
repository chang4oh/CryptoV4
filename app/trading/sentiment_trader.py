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
    """Trading system based on sentiment analysis."""
    
    def __init__(self, config=None):
        """Initialize components."""
        self.config = config or TRADING_CONFIG
        self.news_collector = NewsCollector()
        self.market_collector = MarketDataCollector()
        self.trade_executor = TradeExecutor()
        
        # Trading parameters from config
        self.symbol = self.config['symbol']
        self.base_position_size = self.config['base_position_size']
        self.stop_loss_pct = self.config['stop_loss_pct']
        self.sentiment_threshold = self.config['sentiment_threshold']
        self.price_trend_threshold = self.config['price_trend_threshold']
        
        logger.info("Sentiment trader initialized")
    
    def get_trading_signal(self) -> Dict:
        """Generate trading signal based on sentiment and market data."""
        try:
            # Get latest sentiment
            sentiment_data = self.news_collector.fetch_and_analyze_news(limit=10)
            if not sentiment_data:
                logger.info("No sentiment data available")
                return {'signal': 'NEUTRAL', 'reason': 'No sentiment data available'}
            
            # Calculate average sentiment
            btc_sentiment = [
                item['sentiment_score'] for item in sentiment_data 
                if item['symbol'] == 'BTC'
            ]
            if not btc_sentiment:
                logger.info("No BTC sentiment data found")
                return {'signal': 'NEUTRAL', 'reason': 'No BTC sentiment data'}
            
            avg_sentiment = sum(btc_sentiment) / len(btc_sentiment)
            logger.info(f"Average BTC sentiment: {avg_sentiment:.4f} (threshold: {self.sentiment_threshold})")
            
            # Get market data
            market_data = self.market_collector.get_market_data(self.symbol)
            if not market_data:
                logger.info("No market data available")
                return {'signal': 'NEUTRAL', 'reason': 'No market data available'}
            
            logger.info(f"Current price: ${market_data['price']:,.2f}, 24h change: {market_data['price_change_pct']}%")
            
            # Check if price is trending up
            price_trending_up = self.market_collector.is_price_trending_up(
                self.symbol, 
                self.price_trend_threshold
            )
            logger.info(f"Price trending up: {price_trending_up} (threshold: {self.price_trend_threshold}%)")
            
            # Generate signal
            current_position = self.trade_executor.get_position('BTC')
            logger.info(f"Current BTC position: {current_position}")
            
            if current_position > 0:
                logger.info("Checking exit conditions (have BTC position)")
                # Check stop loss
                entry_price = self.get_position_entry_price()
                if entry_price:
                    current_price = market_data['price']
                    price_change = (current_price - entry_price) / entry_price
                    logger.info(f"Entry price: ${entry_price:,.2f}, current price: ${current_price:,.2f}, change: {price_change*100:.2f}% (stop loss: {self.stop_loss_pct*100}%)")
                    
                    if price_change < -self.stop_loss_pct:
                        logger.info("Stop loss triggered")
                        return {
                            'signal': 'SELL',
                            'reason': 'Stop loss triggered',
                            'price': current_price,
                            'position_size': current_position
                        }
                else:
                    logger.info("No entry price found for current position")
                
                # Check sentiment for exit
                if avg_sentiment < -self.sentiment_threshold:
                    logger.info("Negative sentiment triggered exit")
                    return {
                        'signal': 'SELL',
                        'reason': 'Negative sentiment',
                        'price': market_data['price'],
                        'position_size': current_position
                    }
                
                logger.info("No exit conditions met")
            else:
                logger.info("Checking entry conditions (no BTC position)")
                # Entry conditions
                if avg_sentiment > self.sentiment_threshold and price_trending_up:
                    logger.info("Entry conditions met: positive sentiment and upward trend")
                    return {
                        'signal': 'BUY',
                        'reason': 'Positive sentiment and upward trend',
                        'price': market_data['price'],
                        'position_size': self.base_position_size
                    }
                else:
                    if avg_sentiment <= self.sentiment_threshold:
                        logger.info(f"Sentiment too low for entry: {avg_sentiment:.4f} <= {self.sentiment_threshold}")
                    if not price_trending_up:
                        logger.info(f"Price not trending up enough for entry")
            
            logger.info("No trading conditions met")
            return {'signal': 'NEUTRAL', 'reason': 'No trading conditions met'}
            
        except Exception as e:
            logger.error(f"Error generating trading signal: {str(e)}")
            return {'signal': 'ERROR', 'reason': str(e)}
    
    def get_position_entry_price(self) -> float:
        """Get entry price of current position."""
        try:
            last_trade = self.trade_executor.db.trading_history.find_one(
                {'symbol': self.symbol, 'side': 'BUY'},
                sort=[('timestamp', -1)]
            )
            return float(last_trade['price']) if last_trade else None
        except Exception as e:
            logger.error(f"Error getting entry price: {str(e)}")
            return None
    
    def execute_signal(self, signal: Dict) -> Dict:
        """Execute the trading signal."""
        try:
            if signal['signal'] == 'BUY':
                return self.trade_executor.place_market_order(
                    symbol=self.symbol,
                    side='BUY',
                    quote_quantity=signal['position_size']
                )
            elif signal['signal'] == 'SELL':
                return self.trade_executor.place_market_order(
                    symbol=self.symbol,
                    side='SELL',
                    quantity=signal['position_size']
                )
            return {'status': 'NEUTRAL', 'message': 'No action taken'}
            
        except Exception as e:
            logger.error(f"Error executing signal: {str(e)}")
            return {'status': 'ERROR', 'error': str(e)}
    
    def run(self, interval: int = 300):
        """Run the trading loop."""
        logger.info(f"Starting trading loop with {interval}s interval")
        
        while True:
            try:
                # Generate and execute trading signal
                signal = self.get_trading_signal()
                logger.info(f"Signal generated: {signal}")
                
                if signal['signal'] in ['BUY', 'SELL']:
                    result = self.execute_signal(signal)
                    logger.info(f"Trade execution result: {result}")
                
                # Wait for next iteration
                time.sleep(interval)
                
            except Exception as e:
                logger.error(f"Error in trading loop: {str(e)}")
                time.sleep(60)  # Wait a minute before retrying

if __name__ == "__main__":
    # Example usage
    trader = SentimentTrader()
    
    print("\nStarting sentiment-based trader...")
    print(f"Trading {trader.symbol} with {trader.base_position_size} USDT position size")
    print(f"Stop loss: {trader.stop_loss_pct*100}%")
    print(f"Sentiment threshold: {trader.sentiment_threshold}")
    print(f"Price trend threshold: {trader.price_trend_threshold}%")
    
    # Get initial account balance
    usdt_balance = trader.trade_executor.get_account_balance('USDT')
    btc_balance = trader.trade_executor.get_account_balance('BTC')
    print(f"\nInitial balance:")
    print(f"USDT: ${usdt_balance:,.2f}")
    print(f"BTC: {btc_balance:.8f}")
    
    # Start trading
    print("\nStarting trading loop...")
    trader.run()