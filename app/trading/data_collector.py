from datetime import datetime, timedelta
import logging
from typing import List

from app.trading.binance_client import BinanceDataCollector
from app.models.database import MongoDBClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataCollector:
    def __init__(self):
        """Initialize data collector with Binance and MongoDB clients."""
        self.binance_client = BinanceDataCollector()
        self.db_client = MongoDBClient()
        
    def collect_historical_data(
        self,
        symbols: List[str],
        interval: str,
        days_back: int = 30
    ) -> None:
        """
        Collect historical data for multiple symbols and store in MongoDB.
        
        Args:
            symbols: List of trading pair symbols
            interval: Kline interval
            days_back: Number of days of historical data to collect
        """
        start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        
        for symbol in symbols:
            try:
                logger.info(f"Collecting historical data for {symbol}")
                
                # Get historical data from Binance
                df = self.binance_client.get_historical_klines(
                    symbol=symbol,
                    interval=interval,
                    start_date=start_date
                )
                
                # Calculate technical indicators
                df = self.binance_client.calculate_technical_indicators(df)
                
                # Store in MongoDB
                self.db_client.store_market_data(symbol, df)
                
                logger.info(f"Successfully stored historical data for {symbol}")
                
            except Exception as e:
                logger.error(f"Error collecting data for {symbol}: {str(e)}")
    
    def update_market_data(self, symbols: List[str], interval: str) -> None:
        """
        Update market data for multiple symbols with latest data.
        
        Args:
            symbols: List of trading pair symbols
            interval: Kline interval
        """
        for symbol in symbols:
            try:
                logger.info(f"Updating market data for {symbol}")
                
                # Get latest stored timestamp
                latest_data = self.db_client.get_market_data(
                    symbol=symbol,
                    start_date=datetime.now() - timedelta(days=1)
                )
                
                if not latest_data.empty:
                    start_date = latest_data['timestamp'].max().strftime('%Y-%m-%d')
                else:
                    start_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                
                # Get new data from Binance
                df = self.binance_client.get_historical_klines(
                    symbol=symbol,
                    interval=interval,
                    start_date=start_date
                )
                
                if not df.empty:
                    # Calculate technical indicators
                    df = self.binance_client.calculate_technical_indicators(df)
                    
                    # Store in MongoDB
                    self.db_client.store_market_data(symbol, df)
                    
                    logger.info(f"Successfully updated market data for {symbol}")
                else:
                    logger.info(f"No new data available for {symbol}")
                
            except Exception as e:
                logger.error(f"Error updating data for {symbol}: {str(e)}")

if __name__ == "__main__":
    # Example usage
    collector = DataCollector()
    
    # List of symbols to collect data for
    symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
    
    # Collect historical data
    collector.collect_historical_data(
        symbols=symbols,
        interval='1h',
        days_back=30
    )
    
    # Update with latest data
    collector.update_market_data(
        symbols=symbols,
        interval='1h'
    ) 