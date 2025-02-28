import pytest
from datetime import datetime, timedelta
from app.trading.binance_client import BinanceClient
from app.trading.data_collector import DataCollector

@pytest.fixture
def binance_client():
    """Create a Binance client instance for testing."""
    return BinanceClient()

@pytest.fixture
def data_collector():
    """Create a DataCollector instance for testing."""
    return DataCollector()

def test_binance_client_initialization(binance_client):
    """Test that Binance client initializes correctly."""
    assert binance_client is not None
    assert binance_client.client is not None

def test_get_symbol_price(binance_client):
    """Test getting current price for a symbol."""
    symbol = 'BTCUSDT'
    price_data = binance_client.get_symbol_price(symbol)
    
    assert price_data is not None
    assert 'price' in price_data
    assert float(price_data['price']) > 0

def test_get_historical_klines(binance_client):
    """Test getting historical kline data."""
    symbol = 'BTCUSDT'
    interval = '1h'
    start_time = datetime.now() - timedelta(days=1)
    
    klines = binance_client.get_historical_klines(
        symbol=symbol,
        interval=interval,
        start_time=start_time,
        limit=10
    )
    
    assert len(klines) > 0
    assert all(
        key in klines[0] 
        for key in ['timestamp', 'open', 'high', 'low', 'close', 'volume']
    )

def test_place_test_order(binance_client):
    """Test placing a test order."""
    symbol = 'BTCUSDT'
    side = 'BUY'
    quantity = 0.001
    
    order = binance_client.place_test_order(
        symbol=symbol,
        side=side,
        quantity=quantity
    )
    
    assert order is not None

def test_get_exchange_info(binance_client):
    """Test getting exchange information."""
    symbol = 'BTCUSDT'
    info = binance_client.get_exchange_info(symbol)
    
    assert info is not None
    assert 'symbol' in info

def test_data_collector_initialization(data_collector):
    """Test that DataCollector initializes correctly."""
    assert data_collector is not None
    assert data_collector.binance_client is not None
    assert data_collector.db is not None

def test_collect_historical_data(data_collector):
    """Test collecting and storing historical data."""
    symbol = 'BTCUSDT'
    interval = '1h'
    start_time = datetime.now() - timedelta(hours=2)
    
    success = data_collector.collect_historical_data(
        symbol=symbol,
        interval=interval,
        start_time=start_time,
        limit=10
    )
    
    assert success is True
    
    # Verify data in MongoDB
    data = list(data_collector.db.market_data.find({'symbol': symbol}).limit(1))
    assert len(data) > 0

def test_collect_current_prices(data_collector):
    """Test collecting current prices for multiple symbols."""
    symbols = ['BTCUSDT', 'ETHUSDT']
    
    success = data_collector.collect_current_prices(symbols)
    
    assert success is True
    
    # Verify data in MongoDB
    data = list(data_collector.db.market_data.find({
        'symbol': {'$in': symbols},
        'data_type': 'current_price'
    }).limit(2))
    assert len(data) > 0

if __name__ == "__main__":
    pytest.main([__file__, '-v']) 