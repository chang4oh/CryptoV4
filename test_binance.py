from binance.client import Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_binance_connection():
    try:
        # Initialize Binance client
        api_key = os.getenv('BINANCE_API_KEY')
        api_secret = os.getenv('BINANCE_SECRET_KEY')
        
        print("Connecting to Binance...")
        client = Client(api_key, api_secret, testnet=True)
        
        # Test connection by getting BTC price
        price = client.get_symbol_ticker(symbol="BTCUSDT")
        print(f"Connection successful! Current BTC price: ${float(price['price']):,.2f}")
        
        return True
    except Exception as e:
        print(f"Error connecting to Binance: {str(e)}")
        return False

if __name__ == "__main__":
    test_binance_connection() 