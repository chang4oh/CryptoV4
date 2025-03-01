import logging
from app.trading.sentiment_trader import SentimentTrader

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Create and run trader
    trader = SentimentTrader()
    
    print("\nGetting trading signal...")
    signal = trader.get_trading_signal()
    
    print(f"\nTrading Signal:")
    print(f"Signal: {signal['signal']}")
    print(f"Position Size: ${signal['position_size']}")
    print(f"Sentiment Score: {signal['sentiment_score']:.2f}")
    print(f"Confidence: {signal['confidence']:.2f}")
    print(f"News Count: {signal['news_count']}")
    print(f"Stop Loss: {signal['stop_loss_pct']*100}%") 