import React, { useState, useEffect, useCallback } from 'react';

/**
 * WebSocket service for connecting to Binance WebSocket streams
 */
class WebSocketService {
  constructor() {
    this.connections = {};
    this.callbacks = {};
    this.reconnectAttempts = {};
    this.maxReconnectAttempts = 5;
    
    // Get base URL from environment variables or use default testnet URL
    this.baseUrl = import.meta.env.VITE_WS_BASE_URL || 
                  (import.meta.env.VITE_USE_TESTNET ? 'wss://testnet.binance.vision/ws/' : 'wss://stream.binance.com:9443/ws/');
    
    console.log('WebSocket base URL:', this.baseUrl);
  }

  /**
   * Connect to a specific WebSocket stream
   * @param {string} streamName - The name of the stream to connect to
   * @returns {WebSocket} - The WebSocket connection
   */
  connect(streamName) {
    if (this.connections[streamName]) {
      console.log(`Already connected to ${streamName}`);
      return;
    }

    try {
      console.log(`Connecting to ${streamName}...`);
      const ws = new WebSocket(`${this.baseUrl}${streamName}`);
      
      ws.onopen = () => {
        console.log(`Connected to ${streamName}`);
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts[streamName] = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.callbacks[streamName]) {
            this.callbacks[streamName].forEach(callback => {
              try {
                callback(data);
              } catch (callbackError) {
                console.error(`Error in WebSocket callback for ${streamName}:`, callbackError);
              }
            });
          }
        } catch (parseError) {
          console.error(`Error parsing WebSocket message from ${streamName}:`, parseError);
        }
      };
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for ${streamName}:`, error);
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket connection closed for ${streamName}:`, event.code, event.reason);
        
        // Clean up the closed connection
        if (this.connections[streamName] === ws) {
          delete this.connections[streamName];
        }
        
        // Attempt to reconnect if there are still callbacks registered
        if (this.callbacks[streamName] && this.callbacks[streamName].length > 0) {
          this.reconnect(streamName);
        }
      };
      
      this.connections[streamName] = ws;
    } catch (error) {
      console.error(`Error connecting to WebSocket stream ${streamName}:`, error);
      this.reconnect(streamName);
    }
  }
  
  /**
   * Reconnect to a WebSocket stream after a connection failure
   * @param {string} streamName - The name of the stream to reconnect to
   */
  reconnect(streamName) {
    // Initialize reconnect attempts counter if it doesn't exist
    if (this.reconnectAttempts[streamName] === undefined) {
      this.reconnectAttempts[streamName] = 0;
    }
    
    // Check if we've reached max attempts
    if (this.reconnectAttempts[streamName] >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${streamName}`);
      return;
    }
    
    // Increment attempt counter
    this.reconnectAttempts[streamName]++;
    
    // Calculate backoff time: 2^attempt * 1000ms, capped at 30 seconds
    const backoff = Math.min(30000, Math.pow(2, this.reconnectAttempts[streamName]) * 1000);
    
    console.log(`Attempting to reconnect to ${streamName} in ${backoff}ms (attempt ${this.reconnectAttempts[streamName]})`);
    
    setTimeout(() => {
      if (this.callbacks[streamName] && this.callbacks[streamName].length > 0) {
        this.connect(streamName);
      }
    }, backoff);
  }
  
  /**
   * Subscribe to a WebSocket stream
   * @param {string} streamName - The name of the stream to subscribe to
   * @param {function} callback - The callback to be called when a message is received
   */
  subscribe(streamName, callback) {
    // Initialize callbacks array if it doesn't exist
    if (!this.callbacks[streamName]) {
      this.callbacks[streamName] = [];
    }
    
    // Add callback if it's not already registered
    if (!this.callbacks[streamName].includes(callback)) {
      this.callbacks[streamName].push(callback);
    }
    
    // Connect if not already connected
    if (!this.connections[streamName]) {
      this.connect(streamName);
    }
    
    return () => this.unsubscribe(streamName, callback);
  }
  
  /**
   * Unsubscribe from a WebSocket stream
   * @param {string} streamName - The name of the stream to unsubscribe from
   * @param {function} callback - The callback to remove
   */
  unsubscribe(streamName, callback) {
    if (this.callbacks[streamName]) {
      // Remove the specific callback
      this.callbacks[streamName] = this.callbacks[streamName].filter(cb => cb !== callback);
      
      // If no callbacks remain, disconnect
      if (this.callbacks[streamName].length === 0) {
        this.disconnect(streamName);
        delete this.callbacks[streamName];
      }
    }
  }
  
  /**
   * Disconnect from a WebSocket stream
   * @param {string} streamName - The name of the stream to disconnect from
   */
  disconnect(streamName) {
    if (this.connections[streamName]) {
      console.log(`Disconnecting from ${streamName}`);
      this.connections[streamName].close();
      delete this.connections[streamName];
    }
  }
  
  /**
   * Disconnect from all WebSocket streams
   */
  disconnectAll() {
    Object.keys(this.connections).forEach(streamName => {
      this.disconnect(streamName);
    });
    
    // Clear all callbacks
    this.callbacks = {};
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

/**
 * Custom hook to use a WebSocket stream
 * @param {string} streamName - The name of the stream to use
 * @returns {Object} - Data, loading state, and error from the WebSocket stream
 */
export const useWebSocketStream = (streamName) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      // Define callback to update state when messages are received
      const callback = (newData) => {
        setData(newData);
        setLoading(false);
      };
      
      // Subscribe to the stream
      const unsubscribe = websocketService.subscribe(streamName, callback);
      
      // Cleanup function to unsubscribe when component unmounts
      return unsubscribe;
    } catch (err) {
      console.error(`Error in useWebSocketStream for ${streamName}:`, err);
      setError(err.message || 'An error occurred connecting to the WebSocket');
      setLoading(false);
      return () => {};
    }
  }, [streamName]);

  return [data, loading, error];
};

/**
 * Custom hook to use a kline/candlestick WebSocket stream
 * @param {string} symbol - The trading symbol (e.g., 'btcusdt')
 * @param {string} interval - The candlestick interval (e.g., '1m', '1h')
 * @returns {Object} - Kline data, loading state, and error
 */
export const useKlineStream = (symbol, interval) => {
  const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
  return useWebSocketStream(streamName);
};

/**
 * Custom hook to use a ticker WebSocket stream
 * @param {string} symbol - The trading symbol (e.g., 'btcusdt')
 * @returns {Object} - Ticker data, loading state, and error
 */
export const useTickerStream = (symbol) => {
  const streamName = `${symbol.toLowerCase()}@ticker`;
  return useWebSocketStream(streamName);
};

/**
 * Custom hook to use a trade WebSocket stream
 * @param {string} symbol - The trading symbol (e.g., 'btcusdt')
 * @returns {Object} - Trade data, loading state, and error
 */
export const useTradeStream = (symbol) => {
  const streamName = `${symbol.toLowerCase()}@trade`;
  return useWebSocketStream(streamName);
};

/**
 * Custom hook to use a depth (order book) WebSocket stream
 * @param {string} symbol - The trading symbol (e.g., 'btcusdt')
 * @param {number} level - The number of depth levels (5, 10, 20)
 * @param {string} updateSpeed - The update speed ('1000ms' or '100ms')
 * @returns {Object} - Depth data, loading state, and error
 */
export const useDepthStream = (symbol, level = 10, updateSpeed = '1000ms') => {
  const streamName = `${symbol.toLowerCase()}@depth${level}@${updateSpeed}`;
  return useWebSocketStream(streamName);
};

/**
 * Custom hook to use multiple WebSocket streams at once
 * @param {Array} streamNames - Array of stream names to subscribe to
 * @returns {Object} - Combined data, loading state, and error
 */
export const useCombinedStreams = (streamNames) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribes = [];
    
    try {
      // Subscribe to each stream
      streamNames.forEach(streamName => {
        const callback = (newData) => {
          setData(prevData => ({
            ...prevData,
            [streamName]: newData
          }));
          setLoading(false);
        };
        
        const unsubscribe = websocketService.subscribe(streamName, callback);
        unsubscribes.push(unsubscribe);
      });
    } catch (err) {
      console.error('Error in useCombinedStreams:', err);
      setError(err.message || 'An error occurred connecting to the WebSockets');
      setLoading(false);
    }
    
    // Cleanup function to unsubscribe from all streams
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [JSON.stringify(streamNames)]); // Stringify array to avoid unnecessary re-renders

  return [data, loading, error];
};

export default websocketService; 