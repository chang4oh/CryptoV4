from typing import List, Dict, Any, Optional
import pandas as pd
from binance.client import Client
from binance.exceptions import BinanceAPIException
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class BinanceDataCollector:
    def __init__(self):
        """Initialize Binance client with API credentials."""
        self.api_key = os.getenv('BINANCE_API_KEY')
        self.api_secret = os.getenv('BINANCE_API_SECRET')
        
        if not self.api_key or not self.api_secret:
            raise ValueError("Binance API credentials not found in environment variables")
        
        # Initialize client with Testnet
        self.client = Client(self.api_key, self.api_secret, testnet=True)
        self.client.API_URL = 'https://testnet.binance.vision/api'  # Use testnet URL
        
    def get_historical_klines(
        self,
        symbol: str,
        interval: str,
        start_date: str,
        end_date: str = None
    ) -> pd.DataFrame:
        """
        Fetch historical kline (candlestick) data from Binance.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            interval: Kline interval (e.g., '1h', '4h', '1d')
            start_date: Start date in 'YYYY-MM-DD' format
            end_date: End date in 'YYYY-MM-DD' format (optional)
            
        Returns:
            DataFrame with OHLCV data
        """
        try:
            # Convert dates to timestamps
            start_ts = int(datetime.strptime(start_date, '%Y-%m-%d').timestamp() * 1000)
            if end_date:
                end_ts = int(datetime.strptime(end_date, '%Y-%m-%d').timestamp() * 1000)
            else:
                end_ts = int(datetime.now().timestamp() * 1000)
                
            # Fetch kline data
            klines = self.client.get_historical_klines(
                symbol=symbol,
                interval=interval,
                start_str=start_ts,
                end_str=end_ts
            )
            
            if not klines:
                return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            # Convert to DataFrame
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            # Convert timestamp to datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            # Convert numeric columns
            numeric_columns = ['open', 'high', 'low', 'close', 'volume']
            df[numeric_columns] = df[numeric_columns].astype(float)
            
            return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
            
        except Exception as e:
            print(f"Error fetching historical data: {str(e)}")
            return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    
    def get_current_price(self, symbol: str) -> float:
        """Get current price for a symbol."""
        try:
            ticker = self.client.get_symbol_ticker(symbol=symbol)
            return float(ticker['price'])
        except Exception as e:
            print(f"Error getting current price: {str(e)}")
            return 0.0
    
    def get_account_balance(self) -> Dict[str, float]:
        """Get account balances."""
        try:
            account = self.client.get_account()
            balances = {}
            for asset in account['balances']:
                free_amount = float(asset['free'])
                if free_amount > 0:
                    balances[asset['asset']] = free_amount
            return balances
        except Exception as e:
            print(f"Error getting account balance: {str(e)}")
            return {}

    def calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate technical indicators for the given OHLCV data.
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with additional technical indicators
        """
        if df.empty:
            return df
            
        try:
            # RSI
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['RSI'] = 100 - (100 / (1 + rs))
            
            # MACD
            exp1 = df['close'].ewm(span=12, adjust=False).mean()
            exp2 = df['close'].ewm(span=26, adjust=False).mean()
            df['MACD'] = exp1 - exp2
            df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
            
            return df
        except Exception as e:
            print(f"Error calculating technical indicators: {str(e)}")
            return df

    def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: float = None
    ) -> Dict[str, Any]:
        """
        Place an order on Binance Testnet.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            side: 'BUY' or 'SELL'
            order_type: 'LIMIT' or 'MARKET'
            quantity: Amount to buy/sell
            price: Price for limit orders (optional)
            
        Returns:
            Order response from Binance
        """
        try:
            if order_type == 'LIMIT' and price is not None:
                order = self.client.create_order(
                    symbol=symbol,
                    side=side,
                    type=order_type,
                    timeInForce='GTC',
                    quantity=quantity,
                    price=price
                )
            elif order_type == 'MARKET':
                order = self.client.create_order(
                    symbol=symbol,
                    side=side,
                    type=order_type,
                    quantity=quantity
                )
            else:
                raise ValueError("Invalid order type or missing price for LIMIT order")
                
            return order
        except Exception as e:
            print(f"Error placing order: {str(e)}")
            return {}

class BinanceClient:
    def __init__(self):
        """Initialize Binance API client with testnet credentials."""
        self.api_key = os.getenv('BINANCE_API_KEY')
        self.api_secret = os.getenv('BINANCE_SECRET_KEY')
        
        if not self.api_key or not self.api_secret:
            raise ValueError("Binance API credentials not found in environment variables")
        
        # Initialize Binance client with testnet
        self.client = Client(self.api_key, self.api_secret, testnet=True)
        logger.info("Binance Testnet client initialized successfully")

    def get_account_info(self) -> Dict:
        """Get account information."""
        try:
            account_info = self.client.get_account()
            logger.info("Retrieved account information successfully")
            return account_info
        except BinanceAPIException as e:
            logger.error(f"Error getting account info: {str(e)}")
            raise

    def get_symbol_price(self, symbol: str) -> Dict:
        """Get current price for a symbol."""
        try:
            price = self.client.get_symbol_ticker(symbol=symbol)
            logger.info(f"Retrieved price for {symbol}")
            return price
        except BinanceAPIException as e:
            logger.error(f"Error getting price for {symbol}: {str(e)}")
            raise

    def get_historical_klines(self, symbol: str, interval: str, 
                            start_time: Optional[datetime] = None,
                            limit: int = 500) -> List[Dict]:
        """
        Get historical klines/candlestick data.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            interval: Kline interval (e.g., '1h', '4h', '1d')
            start_time: Start time for historical data
            limit: Number of records to fetch (max 1000)
        """
        try:
            klines = self.client.get_klines(
                symbol=symbol,
                interval=interval,
                startTime=int(start_time.timestamp() * 1000) if start_time else None,
                limit=limit
            )
            
            # Convert klines to more readable format
            formatted_klines = []
            for k in klines:
                formatted_klines.append({
                    'timestamp': datetime.fromtimestamp(k[0] / 1000),
                    'open': float(k[1]),
                    'high': float(k[2]),
                    'low': float(k[3]),
                    'close': float(k[4]),
                    'volume': float(k[5]),
                    'close_time': datetime.fromtimestamp(k[6] / 1000),
                    'quote_volume': float(k[7]),
                    'trades': int(k[8])
                })
            
            logger.info(f"Retrieved {len(formatted_klines)} klines for {symbol}")
            return formatted_klines
        except BinanceAPIException as e:
            logger.error(f"Error getting historical data for {symbol}: {str(e)}")
            raise

    def place_test_order(self, symbol: str, side: str, quantity: float, 
                        order_type: str = 'MARKET') -> Dict:
        """
        Place a test order (doesn't actually execute).
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            side: 'BUY' or 'SELL'
            quantity: Amount to trade
            order_type: Order type (default: 'MARKET')
        """
        try:
            order = self.client.create_test_order(
                symbol=symbol,
                side=side,
                type=order_type,
                quantity=quantity
            )
            logger.info(f"Test order placed successfully: {side} {quantity} {symbol}")
            return order
        except BinanceAPIException as e:
            logger.error(f"Error placing test order: {str(e)}")
            raise

    def get_exchange_info(self, symbol: Optional[str] = None) -> Dict:
        """Get exchange information for symbol(s)."""
        try:
            if symbol:
                info = self.client.get_symbol_info(symbol)
            else:
                info = self.client.get_exchange_info()
            logger.info("Retrieved exchange information successfully")
            return info
        except BinanceAPIException as e:
            logger.error(f"Error getting exchange info: {str(e)}")
            raise

if __name__ == "__main__":
    # Example usage
    collector = BinanceDataCollector()
    
    # Test connection and get account balance
    print("Account balance:", collector.get_account_balance())
    
    # Get current BTC price
    btc_price = collector.get_current_price('BTCUSDT')
    print("Current BTC price:", btc_price)
    
    # Get historical data for BTC/USDT
    df = collector.get_historical_klines(
        symbol='BTCUSDT',
        interval='1h',
        start_date='2024-01-01'
    )
    
    # Add technical indicators
    df = collector.calculate_technical_indicators(df)
    print("\nHistorical data with indicators:")
    print(df.head()) 