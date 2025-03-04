import logging
import os
from typing import Dict, Optional
from datetime import datetime
from binance.client import Client
from binance.exceptions import BinanceAPIException
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TradeExecutor:
    """Executes trades on Binance and records them in MongoDB."""
    
    def __init__(self, test_mode=True):
        """Initialize Binance client and MongoDB connection."""
        # Initialize Binance client
        api_key = os.getenv('BINANCE_API_KEY')
        api_secret = os.getenv('BINANCE_API_SECRET')
        self.test_mode = test_mode
        
        # Log API key status (hidden for security)
        logger.info(f"API Key status: {'Present' if api_key else 'Missing'}")
        logger.info(f"API Secret status: {'Present' if api_secret else 'Missing'}")
        
        if (not api_key or not api_secret) and not self.test_mode:
            logger.error("Binance API credentials not found in environment variables")
            raise ValueError("Binance API credentials not found in environment variables")
        
        # Use dummy credentials for test mode if real ones aren't available
        if (not api_key or not api_secret) and self.test_mode:
            api_key = "dummy_api_key"
            api_secret = "dummy_api_secret"
            logger.warning("Using dummy Binance API credentials in test mode")
        
        # Initialize Binance client with testnet
        self.client = Client(api_key, api_secret, testnet=True)
        
        # Verify Binance connection
        try:
            server_time = self.client.get_server_time()
            logger.info(f"Successfully connected to Binance API (server time: {server_time})")
        except Exception as e:
            logger.error(f"Failed to connect to Binance API: {str(e)}")
            
        # Connect to MongoDB
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client['CryptoV4']
        
        # Create trading_history collection if it doesn't exist
        if 'trading_history' not in self.db.list_collection_names():
            self.db.create_collection('trading_history')
        
        # Ensure index on trading_history collection
        self.db.trading_history.create_index([('timestamp', DESCENDING)])
        
        # If in test mode, ensure we have dummy balances
        if self.test_mode:
            self._ensure_test_account_balances()
        
        logger.info(f"Trade executor initialized (test_mode: {self.test_mode})")
    
    def _ensure_test_account_balances(self):
        """Ensure test account balances exist in the database"""
        try:
            # Check if account_balance collection exists
            if 'account_balance' not in self.db.list_collection_names():
                self.db.create_collection('account_balance')
            
            # Check if we have balance data
            if self.db.account_balance.count_documents({}) == 0:
                # Create test balances
                test_balances = [
                    {'asset': 'USDT', 'free': 10000.0, 'locked': 0.0, 'timestamp': datetime.now()},
                    {'asset': 'BTC', 'free': 0.5, 'locked': 0.0, 'timestamp': datetime.now()}
                ]
                self.db.account_balance.insert_many(test_balances)
                logger.info("Created test account balances")
            else:
                logger.info("Test account balances already exist")
        except Exception as e:
            logger.error(f"Error ensuring test account balances: {str(e)}")
    
    def get_account_balance(self, asset):
        """
        Get account balance for a specific asset.
        
        Args:
            asset: Asset symbol (e.g., 'BTC', 'USDT')
            
        Returns:
            Float balance or 0.0 if not found
        """
        if self.test_mode:
            # In test mode, return dummy values from our local DB
            try:
                balance_doc = self.db.account_balance.find_one({'asset': asset})
                if balance_doc:
                    return float(balance_doc['free'])
                return 0.0
            except Exception as e:
                logger.warning(f"Error getting test account balance: {str(e)}")
                return 0.0
                
        try:
            # In live mode, get actual Binance balance
            account = self.client.get_account()
            for balance in account['balances']:
                if balance['asset'] == asset:
                    return float(balance['free'])
            return 0.0
        except BinanceAPIException as e:
            logger.error(f"Binance API error getting balance: {e}")
            # If API key issue in test mode, return dummy values
            if self.test_mode and (str(e).find("API-key") >= 0 or str(e).find("API key") >= 0):
                logger.warning("Using fallback test balances due to API key error")
                return 10000.0 if asset == 'USDT' else (0.5 if asset == 'BTC' else 0.0)
            return 0.0
        except Exception as e:
            logger.error(f"Error getting account balance: {str(e)}")
            return 0.0
    
    def place_market_order(self, symbol: str, side: str, 
                          quantity: Optional[float] = None,
                          quote_quantity: Optional[float] = None) -> Dict:
        """
        Place a market order on Binance.
        
        Args:
            symbol: Trading pair symbol (e.g., BTCUSDT)
            side: Order side (BUY or SELL)
            quantity: Quantity of base asset (optional)
            quote_quantity: Quantity of quote asset (for BUY orders only, optional)
            
        Returns:
            Dictionary with order details
        """
        try:
            # Validate parameters
            if not symbol or side not in ['BUY', 'SELL']:
                return {'status': 'ERROR', 'message': 'Invalid parameters'}
            
            if not quantity and not quote_quantity:
                return {'status': 'ERROR', 'message': 'Either quantity or quote_quantity must be provided'}
            
            # Place order
            order_params = {
                'symbol': symbol,
                'side': side,
                'type': 'MARKET'
            }
            
            if side == 'BUY' and quote_quantity:
                order_params['quoteOrderQty'] = quote_quantity
            elif quantity:
                order_params['quantity'] = quantity
            
            # Execute order
            order = self.client.create_order(**order_params)
            
            # Record trade in MongoDB
            trade_record = {
                'order_id': order['orderId'],
                'symbol': symbol,
                'side': side,
                'type': 'MARKET',
                'status': order['status'],
                'price': float(order['fills'][0]['price']) if order.get('fills') else 0,
                'quantity': float(order['executedQty']),
                'quote_quantity': float(order['cummulativeQuoteQty']),
                'commission': sum(float(fill['commission']) for fill in order.get('fills', [])),
                'timestamp': datetime.now()
            }
            
            self.db.trading_history.insert_one(trade_record)
            
            logger.info(f"Placed {side} order for {symbol}: {trade_record['quantity']} @ {trade_record['price']}")
            
            return {
                'status': 'SUCCESS',
                'order_id': order['orderId'],
                'symbol': symbol,
                'side': side,
                'quantity': float(order['executedQty']),
                'price': float(order['fills'][0]['price']) if order.get('fills') else 0,
                'total': float(order['cummulativeQuoteQty'])
            }
            
        except BinanceAPIException as e:
            logger.error(f"Binance API error placing order: {str(e)}")
            return {'status': 'ERROR', 'message': str(e)}
        except Exception as e:
            logger.error(f"Error placing order: {str(e)}")
            return {'status': 'ERROR', 'message': str(e)}
    
    def get_position(self, asset: str = 'BTC') -> float:
        """
        Get current position size for an asset.
        
        Args:
            asset: Asset symbol (default: BTC)
            
        Returns:
            Float position size
        """
        try:
            return self.get_account_balance(asset)
        except Exception as e:
            logger.error(f"Error getting position: {str(e)}")
            return 0.0

if __name__ == "__main__":
    # Example usage
    executor = TradeExecutor()
    
    # Check account balance
    usdt_balance = executor.get_account_balance('USDT')
    print(f"\nUSDT Balance: ${usdt_balance:,.2f}")
    
    # Place a test buy order if we have sufficient funds
    if usdt_balance >= 20:
        print("\nPlacing test buy order...")
        result = executor.place_market_order(
            symbol='BTCUSDT',
            side='BUY',
            quote_quantity=20  # Buy $20 worth of BTC
        )
        print(f"Order result: {result}")
        
        # Check BTC balance after purchase
        btc_balance = executor.get_account_balance('BTC')
        print(f"BTC Balance after purchase: {btc_balance:.8f}")
    else:
        print(f"\nInsufficient USDT balance for test order. Need at least $20, have ${usdt_balance:,.2f}") 