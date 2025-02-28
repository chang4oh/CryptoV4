import sys
import os
from datetime import datetime, timedelta
import logging

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from trading.binance_client import BinanceClient
from trading.data_collector import DataCollector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_binance_connection():
    """Test basic Binance API connectivity"""
    try:
        client = BinanceClient()
        # Test getting BTC price
        price = client.get_symbol_price("BTCUSDT")
        logger.info(f"Successfully connected to Binance! BTC Price: ${float(price['price']):,.2f}")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Binance: {str(e)}")
        return False

def test_historical_data():
    """Test fetching historical data"""
    try:
        client = BinanceClient()
        # Get last 24 hours of data
        start_time = datetime.now() - timedelta(days=1)
        klines = client.get_historical_klines(
            symbol="BTCUSDT",
            interval="1h",
            start_time=start_time,
            limit=24
        )
        logger.info(f"Successfully retrieved {len(klines)} historical data points")
        return True
    except Exception as e:
        logger.error(f"Failed to fetch historical data: {str(e)}")
        return False

def test_data_storage():
    """Test storing data in MongoDB"""
    try:
        collector = DataCollector()
        # Store some test data
        success = collector.collect_historical_data(
            symbol="BTCUSDT",
            interval="1h",
            start_time=datetime.now() - timedelta(hours=2),
            limit=2
        )
        if success:
            logger.info("Successfully stored test data in MongoDB")
        return success
    except Exception as e:
        logger.error(f"Failed to store data in MongoDB: {str(e)}")
        return False

def test_place_test_order():
    """Test placing a test order"""
    try:
        client = BinanceClient()
        # Place a test buy order
        order = client.place_test_order(
            symbol="BTCUSDT",
            side="BUY",
            quantity=0.001
        )
        logger.info("Successfully placed test order")
        return True
    except Exception as e:
        logger.error(f"Failed to place test order: {str(e)}")
        return False

def run_all_tests():
    """Run all integration tests"""
    logger.info("Starting integration tests...")
    
    tests = {
        "Binance Connection": test_binance_connection,
        "Historical Data": test_historical_data,
        "Data Storage": test_data_storage,
        "Test Order": test_place_test_order
    }
    
    results = {}
    for test_name, test_func in tests.items():
        logger.info(f"\nRunning test: {test_name}")
        try:
            result = test_func()
            results[test_name] = "✅ Passed" if result else "❌ Failed"
        except Exception as e:
            results[test_name] = f"❌ Failed with error: {str(e)}"
    
    # Print summary
    logger.info("\n=== Test Results ===")
    for test_name, result in results.items():
        logger.info(f"{test_name}: {result}")

if __name__ == "__main__":
    run_all_tests() 