from datetime import datetime, timedelta
from typing import List, Optional
import logging
from pymongo import MongoClient
from pymongo.errors import BulkWriteError
import os
from dotenv import load_dotenv

from .binance_client import BinanceClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class DataCollector:
    def __init__(self):
        """Initialize DataCollector with Binance client and MongoDB connection."""
        self.binance_client = BinanceClient()
        
        # Connect to MongoDB
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client['CryptoV4']
        logger.info("DataCollector initialized successfully")

    def collect_historical_data(self, symbol: str, interval: str,
                              start_time: Optional[datetime] = None,
                              limit: int = 500) -> bool:
        """
        Collect historical market data and store in MongoDB.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            interval: Kline interval (e.g., '1h', '4h', '1d')
            start_time: Start time for historical data
            limit: Number of records to fetch
        """
        try:
            # Fetch historical data from Binance
            klines = self.binance_client.get_historical_klines(
                symbol=symbol,
                interval=interval,
                start_time=start_time,
                limit=limit
            )
            
            # Prepare documents for MongoDB
            documents = []
            for kline in klines:
                doc = {
                    'symbol': symbol,
                    'interval': interval,
                    **kline  # Include all kline data
                }
                documents.append(doc)
            
            # Store in MongoDB with ordered=False for better performance
            if documents:
                try:
                    self.db.market_data.insert_many(documents, ordered=False)
                    logger.info(f"Stored {len(documents)} records for {symbol}")
                except BulkWriteError as e:
                    # Log duplicate key errors but continue
                    logger.warning(f"Some records were duplicates: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error collecting historical data: {str(e)}")
            return False

    def collect_current_prices(self, symbols: List[str]) -> bool:
        """
        Collect current price data for multiple symbols.
        
        Args:
            symbols: List of trading pair symbols
        """
        try:
            timestamp = datetime.now()
            documents = []
            
            for symbol in symbols:
                try:
                    price_data = self.binance_client.get_symbol_price(symbol)
                    doc = {
                        'symbol': symbol,
                        'timestamp': timestamp,
                        'price': float(price_data['price']),
                        'data_type': 'current_price'
                    }
                    documents.append(doc)
                except Exception as e:
                    logger.error(f"Error getting price for {symbol}: {str(e)}")
                    continue
            
            if documents:
                self.db.market_data.insert_many(documents)
                logger.info(f"Stored current prices for {len(documents)} symbols")
            
            return True
            
        except Exception as e:
            logger.error(f"Error collecting current prices: {str(e)}")
            return False

    def start_data_collection(self, symbols: List[str], interval: str = '1h'):
        """
        Start continuous data collection for specified symbols.
        
        Args:
            symbols: List of trading pair symbols
            interval: Data collection interval
        """
        try:
            # First, collect some historical data
            start_time = datetime.now() - timedelta(days=7)  # Last 7 days
            for symbol in symbols:
                self.collect_historical_data(
                    symbol=symbol,
                    interval=interval,
                    start_time=start_time
                )
            
            # Then collect current prices
            self.collect_current_prices(symbols)
            
            logger.info("Initial data collection completed")
            
        except Exception as e:
            logger.error(f"Error in data collection: {str(e)}")

if __name__ == "__main__":
    # Example usage
    collector = DataCollector()
    symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
    collector.start_data_collection(symbols) 