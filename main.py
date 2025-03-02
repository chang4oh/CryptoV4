import sys
import os
import time
import logging
import argparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("trading_log.txt"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("main")

# Add the project root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

def print_header():
    """Print header with ASCII art."""
    header = """
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   CryptoV4 - Sentiment-Based Trading System       ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    """
    print(header)

def print_status(trader, signal=None):
    """Print current status of the trading system."""
    print("\n" + "="*60)
    print(f"STATUS UPDATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Account balances
    usdt_balance = trader.trade_executor.get_account_balance('USDT')
    btc_balance = trader.trade_executor.get_account_balance('BTC')
    print(f"\nAccount Balance:")
    print(f"USDT: ${usdt_balance:,.2f}")
    print(f"BTC: {btc_balance:.8f}")
    
    # Latest signal
    if signal:
        print(f"\nLatest Signal: {signal['signal']}")
        print(f"Reason: {signal['reason']}")
        if 'price' in signal:
            print(f"Price: ${signal['price']:,.2f}")
        if 'position_size' in signal:
            print(f"Position Size: {signal['position_size']}")
    
    # Market data
    try:
        market_data = trader.market_collector.get_market_data(trader.symbol)
        if market_data:
            print(f"\nMarket Data ({trader.symbol}):")
            print(f"Price: ${market_data['price']:,.2f}")
            print(f"24h Change: {market_data['price_change_pct']}%")
    except Exception as e:
        logger.error(f"Error getting market data: {str(e)}")
    
    # Sentiment data
    try:
        sentiment_data = trader.news_collector.db.sentiment_data.find(
            {"symbol": "BTC"}, 
            {"sentiment_score": 1}
        ).sort("timestamp", -1).limit(20)
        
        sentiment_scores = [item["sentiment_score"] for item in sentiment_data]
        if sentiment_scores:
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            print(f"\nAverage BTC Sentiment (20 latest): {avg_sentiment:.4f}")
    except Exception as e:
        logger.error(f"Error getting sentiment data: {str(e)}")
    
    print("\n" + "="*60)

def run_trading_system(interval=300, test_mode=False):
    """
    Run the trading system continuously.
    
    Args:
        interval: Time between trading cycles in seconds (default: 300)
        test_mode: If True, only generate signals but don't execute trades
    """
    try:
        from app.trading.sentiment_trader import SentimentTrader
        
        print_header()
        logger.info(f"Starting trading system (interval: {interval}s, test_mode: {test_mode})")
        
        # Initialize trader
        trader = SentimentTrader()
        logger.info(f"Trading {trader.symbol} with {trader.base_position_size} USDT position size")
        logger.info(f"Stop loss: {trader.stop_loss_pct*100}%, Sentiment threshold: {trader.sentiment_threshold}")
        
        # Initial status
        print_status(trader)
        
        # Trading loop
        cycle_count = 0
        while True:
            cycle_count += 1
            logger.info(f"Starting trading cycle #{cycle_count}")
            
            try:
                # Generate trading signal
                signal = trader.get_trading_signal()
                logger.info(f"Signal generated: {signal}")
                
                # Execute signal if not in test mode
                if signal['signal'] in ['BUY', 'SELL'] and not test_mode:
                    result = trader.execute_signal(signal)
                    logger.info(f"Trade execution result: {result}")
                elif signal['signal'] in ['BUY', 'SELL'] and test_mode:
                    logger.info(f"Test mode: Would execute {signal['signal']} signal")
                
                # Print status update
                print_status(trader, signal)
                
            except Exception as e:
                logger.error(f"Error in trading cycle: {str(e)}")
            
            # Wait for next cycle
            logger.info(f"Waiting {interval} seconds until next cycle...")
            time.sleep(interval)
            
    except KeyboardInterrupt:
        logger.info("Trading system stopped by user")
    except Exception as e:
        logger.error(f"Critical error in trading system: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="CryptoV4 Trading System")
    parser.add_argument("--interval", type=int, default=300, 
                        help="Time between trading cycles in seconds (default: 300)")
    parser.add_argument("--test", action="store_true", 
                        help="Run in test mode (generate signals but don't execute trades)")
    args = parser.parse_args()
    
    # Run trading system
    run_trading_system(interval=args.interval, test_mode=args.test) 