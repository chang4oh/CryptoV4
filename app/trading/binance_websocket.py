import json
import logging
import threading
import time
import websocket
import requests
from urllib.parse import urljoin
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class BinanceWebSocketClient:
    """
    Client for Binance WebSocket API that handles both user data streams and market data streams.
    
    This client can:
    1. Connect to user data streams using a listenKey
    2. Connect to market data streams for real-time market updates
    3. Handle reconnection logic and keep-alive pings
    4. Process various message types and dispatch to appropriate handlers
    """
    
    def __init__(self, api_key=None, api_secret=None, use_testnet=True, callback=None):
        """
        Initialize the WebSocket client.
        
        Args:
            api_key (str): Binance API key for authenticated endpoints
            api_secret (str): Binance API secret for authenticated endpoints
            use_testnet (bool): Whether to use the testnet environment
            callback (callable): Callback function for processing messages
        """
        self.api_key = api_key or os.getenv('BINANCE_API_KEY')
        self.api_secret = api_secret or os.getenv('BINANCE_API_SECRET')
        self.use_testnet = use_testnet if use_testnet is not None else os.getenv('USE_TESTNET', 'true').lower() == 'true'
        
        # Base URLs
        if self.use_testnet:
            self.rest_api_url = "https://testnet.binance.vision/api/v3/"
            self.ws_api_url = "wss://testnet.binance.vision/ws-api/v3"
            self.ws_stream_url = "wss://testnet.binance.vision/ws/"
        else:
            self.rest_api_url = "https://api.binance.com/api/v3/"
            self.ws_api_url = "wss://ws-api.binance.com:443/ws-api/v3"
            self.ws_stream_url = "wss://stream.binance.com:9443/ws/"
        
        # WebSocket connections
        self.user_ws = None
        self.market_ws = None
        self.user_ws_thread = None
        self.market_ws_thread = None
        
        # User data stream
        self.listen_key = None
        self.listen_key_created = 0
        self.listen_key_keepalive_timer = None
        
        # Callback for processing messages
        self.callback = callback
        
        # Market data subscriptions
        self.market_subscriptions = set()
        
        # Connection status
        self.is_user_ws_connected = False
        self.is_market_ws_connected = False
        
        # Reconnection settings
        self.reconnect_delay = 5  # seconds
        self.max_reconnect_attempts = 5
        self.user_reconnect_attempts = 0
        self.market_reconnect_attempts = 0
        
    def _headers(self):
        """Return headers for REST API requests."""
        return {
            'X-MBX-APIKEY': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def create_listen_key(self):
        """Create a listen key for user data stream."""
        try:
            url = urljoin(self.rest_api_url, 'userDataStream')
            response = requests.post(url, headers=self._headers())
            response.raise_for_status()
            data = response.json()
            self.listen_key = data['listenKey']
            self.listen_key_created = time.time()
            logger.info(f"Created listen key: {self.listen_key}")
            return self.listen_key
        except Exception as e:
            logger.error(f"Error creating listen key: {str(e)}")
            return None
    
    def keep_alive_listen_key(self):
        """Keep the listen key alive by sending a ping."""
        if not self.listen_key:
            logger.warning("No listen key to keep alive")
            return False
        
        try:
            url = urljoin(self.rest_api_url, 'userDataStream')
            params = {'listenKey': self.listen_key}
            response = requests.put(url, headers=self._headers(), params=params)
            response.raise_for_status()
            logger.debug(f"Successfully kept listen key alive: {self.listen_key}")
            return True
        except Exception as e:
            logger.error(f"Error keeping listen key alive: {str(e)}")
            return False
    
    def close_listen_key(self):
        """Close the listen key."""
        if not self.listen_key:
            return
        
        try:
            url = urljoin(self.rest_api_url, 'userDataStream')
            params = {'listenKey': self.listen_key}
            response = requests.delete(url, headers=self._headers(), params=params)
            response.raise_for_status()
            logger.info(f"Closed listen key: {self.listen_key}")
            self.listen_key = None
        except Exception as e:
            logger.error(f"Error closing listen key: {str(e)}")
    
    def _start_listen_key_keepalive(self):
        """Start a timer to keep the listen key alive."""
        def keepalive_task():
            while self.listen_key and self.is_user_ws_connected:
                self.keep_alive_listen_key()
                time.sleep(30 * 60)  # Keep alive every 30 minutes
        
        self.listen_key_keepalive_timer = threading.Thread(target=keepalive_task)
        self.listen_key_keepalive_timer.daemon = True
        self.listen_key_keepalive_timer.start()
    
    def _on_user_message(self, ws, message):
        """Handle messages from the user data stream."""
        try:
            data = json.loads(message)
            logger.debug(f"Received user data: {data}")
            
            # Process different event types
            if 'e' in data:
                event_type = data['e']
                
                if event_type == 'outboundAccountPosition':
                    self._handle_account_update(data)
                elif event_type == 'balanceUpdate':
                    self._handle_balance_update(data)
                elif event_type == 'executionReport':
                    self._handle_order_update(data)
                else:
                    logger.warning(f"Unknown event type: {event_type}")
            
            # Forward to callback if provided
            if self.callback:
                self.callback('user_data', data)
        except Exception as e:
            logger.error(f"Error processing user data message: {str(e)}")
    
    def _on_market_message(self, ws, message):
        """Handle messages from the market data stream."""
        try:
            data = json.loads(message)
            logger.debug(f"Received market data: {data}")
            
            # Forward to callback if provided
            if self.callback:
                self.callback('market_data', data)
        except Exception as e:
            logger.error(f"Error processing market data message: {str(e)}")
    
    def _on_error(self, ws, error):
        """Handle WebSocket errors."""
        if ws == self.user_ws:
            logger.error(f"User WebSocket error: {str(error)}")
            self.is_user_ws_connected = False
            self._reconnect_user_ws()
        elif ws == self.market_ws:
            logger.error(f"Market WebSocket error: {str(error)}")
            self.is_market_ws_connected = False
            self._reconnect_market_ws()
    
    def _on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket connection close."""
        if ws == self.user_ws:
            logger.info(f"User WebSocket closed: {close_status_code} - {close_msg}")
            self.is_user_ws_connected = False
            self._reconnect_user_ws()
        elif ws == self.market_ws:
            logger.info(f"Market WebSocket closed: {close_status_code} - {close_msg}")
            self.is_market_ws_connected = False
            self._reconnect_market_ws()
    
    def _on_open(self, ws):
        """Handle WebSocket connection open."""
        if ws == self.user_ws:
            logger.info("User WebSocket connected")
            self.is_user_ws_connected = True
            self.user_reconnect_attempts = 0
        elif ws == self.market_ws:
            logger.info("Market WebSocket connected")
            self.is_market_ws_connected = True
            self.market_reconnect_attempts = 0
            
            # Resubscribe to all streams
            if self.market_subscriptions:
                self._subscribe_to_streams()
    
    def _on_ping(self, ws, message):
        """Handle ping from server."""
        ws.send(message, websocket.ABNF.OPCODE_PONG)
    
    def _reconnect_user_ws(self):
        """Reconnect to the user data stream."""
        if self.user_reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnection attempts reached for user WebSocket")
            return
        
        self.user_reconnect_attempts += 1
        logger.info(f"Attempting to reconnect user WebSocket (attempt {self.user_reconnect_attempts})")
        time.sleep(self.reconnect_delay)
        
        # Create a new listen key if needed
        if time.time() - self.listen_key_created > 23 * 60 * 60:  # 23 hours
            self.create_listen_key()
        
        self.connect_user_data_stream()
    
    def _reconnect_market_ws(self):
        """Reconnect to the market data stream."""
        if self.market_reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnection attempts reached for market WebSocket")
            return
        
        self.market_reconnect_attempts += 1
        logger.info(f"Attempting to reconnect market WebSocket (attempt {self.market_reconnect_attempts})")
        time.sleep(self.reconnect_delay)
        self.connect_market_data_stream()
    
    def connect_user_data_stream(self):
        """Connect to the user data stream."""
        if not self.listen_key:
            self.create_listen_key()
            if not self.listen_key:
                logger.error("Failed to create listen key, cannot connect to user data stream")
                return False
        
        try:
            ws_url = f"{self.ws_stream_url}{self.listen_key}"
            self.user_ws = websocket.WebSocketApp(
                ws_url,
                on_message=self._on_user_message,
                on_error=self._on_error,
                on_close=self._on_close,
                on_open=lambda ws: self._on_open(ws),
                on_ping=self._on_ping
            )
            
            self.user_ws_thread = threading.Thread(target=self.user_ws.run_forever)
            self.user_ws_thread.daemon = True
            self.user_ws_thread.start()
            
            # Start keepalive timer
            self._start_listen_key_keepalive()
            
            return True
        except Exception as e:
            logger.error(f"Error connecting to user data stream: {str(e)}")
            return False
    
    def connect_market_data_stream(self):
        """Connect to the market data stream."""
        try:
            self.market_ws = websocket.WebSocketApp(
                self.ws_stream_url,
                on_message=self._on_market_message,
                on_error=self._on_error,
                on_close=self._on_close,
                on_open=lambda ws: self._on_open(ws),
                on_ping=self._on_ping
            )
            
            self.market_ws_thread = threading.Thread(target=self.market_ws.run_forever)
            self.market_ws_thread.daemon = True
            self.market_ws_thread.start()
            
            return True
        except Exception as e:
            logger.error(f"Error connecting to market data stream: {str(e)}")
            return False
    
    def subscribe_to_kline_stream(self, symbol, interval):
        """
        Subscribe to kline/candlestick stream for a symbol.
        
        Args:
            symbol (str): Symbol to subscribe to (e.g., 'btcusdt')
            interval (str): Kline interval (e.g., '1m', '5m', '1h')
        """
        stream_name = f"{symbol.lower()}@kline_{interval}"
        self._subscribe_to_stream(stream_name)
    
    def subscribe_to_ticker_stream(self, symbol=None):
        """
        Subscribe to ticker stream for a symbol or all symbols.
        
        Args:
            symbol (str, optional): Symbol to subscribe to. If None, subscribes to all symbols.
        """
        if symbol:
            stream_name = f"{symbol.lower()}@ticker"
        else:
            stream_name = "!ticker@arr"
        self._subscribe_to_stream(stream_name)
    
    def subscribe_to_trade_stream(self, symbol):
        """
        Subscribe to trade stream for a symbol.
        
        Args:
            symbol (str): Symbol to subscribe to
        """
        stream_name = f"{symbol.lower()}@trade"
        self._subscribe_to_stream(stream_name)
    
    def subscribe_to_depth_stream(self, symbol, level=20, update_speed='1000ms'):
        """
        Subscribe to depth stream for a symbol.
        
        Args:
            symbol (str): Symbol to subscribe to
            level (int): Depth level (5, 10, 20)
            update_speed (str): Update speed ('100ms', '1000ms')
        """
        stream_name = f"{symbol.lower()}@depth{level}@{update_speed}"
        self._subscribe_to_stream(stream_name)
    
    def _subscribe_to_stream(self, stream_name):
        """Subscribe to a single stream."""
        self.market_subscriptions.add(stream_name)
        
        if self.is_market_ws_connected:
            self._subscribe_to_streams()
        else:
            self.connect_market_data_stream()
    
    def _subscribe_to_streams(self):
        """Subscribe to all streams in the subscription set."""
        if not self.market_subscriptions:
            return
        
        streams = list(self.market_subscriptions)
        subscribe_msg = {
            "method": "SUBSCRIBE",
            "params": streams,
            "id": int(time.time() * 1000)
        }
        
        try:
            self.market_ws.send(json.dumps(subscribe_msg))
            logger.info(f"Subscribed to streams: {streams}")
        except Exception as e:
            logger.error(f"Error subscribing to streams: {str(e)}")
    
    def unsubscribe_from_stream(self, stream_name):
        """Unsubscribe from a stream."""
        if stream_name in self.market_subscriptions:
            self.market_subscriptions.remove(stream_name)
            
            if self.is_market_ws_connected:
                unsubscribe_msg = {
                    "method": "UNSUBSCRIBE",
                    "params": [stream_name],
                    "id": int(time.time() * 1000)
                }
                
                try:
                    self.market_ws.send(json.dumps(unsubscribe_msg))
                    logger.info(f"Unsubscribed from stream: {stream_name}")
                except Exception as e:
                    logger.error(f"Error unsubscribing from stream: {str(e)}")
    
    def _handle_account_update(self, data):
        """Handle account update events."""
        logger.info(f"Account update received: {len(data['B'])} balance updates")
        # Process account position update
        # This includes free and locked balances for each asset
    
    def _handle_balance_update(self, data):
        """Handle balance update events."""
        logger.info(f"Balance update received for asset {data['a']}: {data['d']}")
        # Process balance update
        # This is for a single asset balance change
    
    def _handle_order_update(self, data):
        """Handle order update events."""
        logger.info(f"Order update received: {data['s']} {data['S']} {data['o']} - Status: {data['X']}")
        # Process order execution report
        # This includes order status changes, fills, etc.
    
    def disconnect(self):
        """Disconnect from all WebSocket connections and clean up resources."""
        logger.info("Disconnecting from Binance WebSockets")
        
        # Close listen key
        self.close_listen_key()
        
        # Close WebSocket connections
        if self.user_ws:
            self.user_ws.close()
            self.is_user_ws_connected = False
        
        if self.market_ws:
            self.market_ws.close()
            self.is_market_ws_connected = False
        
        # Wait for threads to finish
        if self.user_ws_thread and self.user_ws_thread.is_alive():
            self.user_ws_thread.join(timeout=1)
        
        if self.market_ws_thread and self.market_ws_thread.is_alive():
            self.market_ws_thread.join(timeout=1)
        
        logger.info("Disconnected from Binance WebSockets")


# Example usage
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Define a callback function to process messages
    def message_handler(stream_type, data):
        print(f"Received {stream_type} message: {data}")
    
    # Create WebSocket client
    client = BinanceWebSocketClient(callback=message_handler)
    
    try:
        # Connect to user data stream
        client.connect_user_data_stream()
        
        # Connect to market data stream and subscribe to some streams
        client.connect_market_data_stream()
        client.subscribe_to_kline_stream("btcusdt", "1m")
        client.subscribe_to_ticker_stream("btcusdt")
        
        # Keep the main thread running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        client.disconnect() 