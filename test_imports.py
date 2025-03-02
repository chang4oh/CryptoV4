import sys
import os

# Add the project root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = current_dir
sys.path.append(project_root)

print(f"Python path: {sys.path}")
print(f"Current directory: {current_dir}")
print(f"Project root: {project_root}")

try:
    print("\nTrying to import modules...")
    from app.data.news_collector import NewsCollector
    print("✅ Successfully imported NewsCollector")
except Exception as e:
    print(f"❌ Error importing NewsCollector: {str(e)}")

try:
    from app.data.market_data import MarketDataCollector
    print("✅ Successfully imported MarketDataCollector")
except Exception as e:
    print(f"❌ Error importing MarketDataCollector: {str(e)}")

try:
    from app.trading.trade_executor import TradeExecutor
    print("✅ Successfully imported TradeExecutor")
except Exception as e:
    print(f"❌ Error importing TradeExecutor: {str(e)}")

try:
    from app.trading.sentiment_trader import SentimentTrader
    print("✅ Successfully imported SentimentTrader")
except Exception as e:
    print(f"❌ Error importing SentimentTrader: {str(e)}")

print("\nTest complete!") 