import sys
import os
import logging

# Configure logging to show more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add the project root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = current_dir
sys.path.append(project_root)

print("Starting sentiment trader...")

try:
    from app.trading.sentiment_trader import SentimentTrader
    
    # Create and run the trader
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
    
    # Generate a trading signal
    print("\nGenerating trading signal...")
    signal = trader.get_trading_signal()
    print(f"Signal: {signal}")
    
    # Show detailed sentiment data
    print("\nDetailed Sentiment Analysis:")
    sentiment_data = trader.news_collector.db.sentiment_data.find(
        {"symbol": "BTC"}, 
        {"title": 1, "sentiment_score": 1, "published_at": 1}
    ).sort("published_at", -1).limit(5)
    
    print("\nLatest BTC News Sentiment:")
    for item in sentiment_data:
        sentiment_str = "Positive" if item["sentiment_score"] > 0 else "Negative" if item["sentiment_score"] < 0 else "Neutral"
        print(f"- {item['published_at'].strftime('%Y-%m-%d %H:%M')}: {item['title'][:60]}... ({sentiment_str}: {item['sentiment_score']:.2f})")
    
    # Show market data
    market_data = trader.market_collector.get_market_data(trader.symbol)
    if market_data:
        print("\nCurrent Market Data:")
        print(f"Price: ${market_data['price']:,.2f}")
        print(f"24h Change: {market_data['price_change_pct']}%")
        print(f"24h Volume: {market_data['volume_24h']:,.2f}")
        print(f"24h High: ${market_data['high_24h']:,.2f}")
        print(f"24h Low: ${market_data['low_24h']:,.2f}")
    
    print("\nTrader initialized successfully!")
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc() 