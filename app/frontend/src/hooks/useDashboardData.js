import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import * as mockData from '../services/mockData';

// Flag to control whether to use mock data
const USE_MOCK_DATA = true;

/**
 * Custom hook for fetching and managing dashboard data
 */
export function useDashboardData() {
  // State for all data
  const [tradingStatus, setTradingStatus] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [sentimentData, setSentimentData] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  
  // Settings state
  const [settings, setSettings] = useState(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('Never');

  // Load settings from localStorage on initial mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('cryptoV4Settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Apply dark mode if enabled
        if (parsedSettings.dashboard?.dark_mode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      } else {
        // Set default settings
        const defaultSettings = mockData.getMockSettings();
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  /**
   * Fetch all dashboard data
   */
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let results;
      
      if (USE_MOCK_DATA) {
        // Use mock data
        results = [
          { status: 'fulfilled', value: mockData.getMockTradingStatus() },
          { status: 'fulfilled', value: mockData.getMockPerformanceData(settings?.dashboard?.chart_timespan_days || 30) },
          { status: 'fulfilled', value: mockData.getMockSentimentData() },
          { status: 'fulfilled', value: mockData.getMockRecentTrades() },
          { status: 'fulfilled', value: mockData.getMockAccountInfo() }
        ];
      } else {
        // Use real API with settings
        const days = settings?.dashboard?.chart_timespan_days || 30;
        
        results = await Promise.allSettled([
          api.getTradingStatus(),
          api.getPerformance(days),
          api.getSentimentData(),
          api.getRecentTrades(),
          api.getAccountInfo()
        ]);
      }
      
      // Handle results
      if (results[0].status === 'fulfilled') {
        setTradingStatus(results[0].value);
      }
      
      if (results[1].status === 'fulfilled') {
        setPerformance(results[1].value);
      }
      
      if (results[2].status === 'fulfilled') {
        setSentimentData(results[2].value);
      }
      
      if (results[3].status === 'fulfilled') {
        setRecentTrades(results[3].value);
      }
      
      if (results[4].status === 'fulfilled') {
        setAccountInfo(results[4].value);
      }
      
      // Check if any requests failed
      const failedRequests = results.filter(r => r.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn(`${failedRequests.length} API requests failed:`, 
          failedRequests.map(r => r.reason));
        
        // Only set error if all requests failed
        if (failedRequests.length === results.length) {
          setError('Failed to fetch dashboard data. Check API server.');
        }
      }
      
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error fetching dashboard data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  // Initial data fetch and set up interval based on settings
  useEffect(() => {
    fetchAllData();
    
    // Set up automatic refresh based on settings
    const refreshInterval = settings?.dashboard?.refresh_interval_seconds || 30;
    const intervalId = setInterval(fetchAllData, refreshInterval * 1000);
    
    // Clean up interval on unmount or settings change
    return () => clearInterval(intervalId);
  }, [fetchAllData, settings]);

  /**
   * Place a test order
   */
  const placeTestOrder = async (orderData) => {
    try {
      if (USE_MOCK_DATA) {
        // Use mock order placement
        const result = await mockData.placeMockOrder(orderData);
        
        // Update data after placing an order
        setTimeout(fetchAllData, 500);
        
        return result;
      } else {
        // Use real API
        const result = await api.placeTestOrder(orderData);
        
        // Refresh data after placing an order
        fetchAllData();
        
        return result;
      }
    } catch (err) {
      console.error('Error placing test order:', err);
      throw err;
    }
  };

  /**
   * Save user settings
   */
  const saveSettings = async (newSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem('cryptoV4Settings', JSON.stringify(newSettings));
      
      // Apply dark mode if enabled
      if (newSettings.dashboard?.dark_mode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      
      // Send to API if not using mock data
      if (!USE_MOCK_DATA) {
        await api.saveSettings(newSettings);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  /**
   * Restore default settings
   */
  const restoreDefaultSettings = async () => {
    try {
      const defaultSettings = mockData.getMockSettings();
      
      // Override the random auto-trading value from mock
      defaultSettings.trading.enable_auto_trading = false;
      
      setSettings(defaultSettings);
      localStorage.setItem('cryptoV4Settings', JSON.stringify(defaultSettings));
      
      // Remove dark mode
      document.body.classList.remove('dark-mode');
      
      // Send to API if not using mock data
      if (!USE_MOCK_DATA) {
        await api.restoreDefaultSettings();
      }
      
      return defaultSettings;
    } catch (error) {
      console.error('Error restoring default settings:', error);
      throw error;
    }
  };

  // Create a derived trading signal
  const tradingSignal = useMemo(() => {
    if (!tradingStatus) return 'NEUTRAL';
    
    // If the API provides a signal directly, use it
    if (tradingStatus.signal) {
      return tradingStatus.signal;
    }
    
    // Otherwise, calculate based on sentiment and price data
    const sentiment = tradingStatus.avg_sentiment || 0;
    const priceChange = tradingStatus.market_data?.price_change_pct || 0;
    
    if (sentiment > 0.2 && priceChange > 0) {
      return 'BUY';
    } else if (sentiment < -0.2 && priceChange < 0) {
      return 'SELL';
    } else {
      return 'NEUTRAL';
    }
  }, [tradingStatus]);

  return {
    tradingStatus,
    performance,
    sentimentData,
    recentTrades,
    accountInfo,
    settings,
    isLoading,
    error,
    lastUpdated,
    fetchAllData,
    placeTestOrder,
    saveSettings,
    restoreDefaultSettings,
    tradingSignal
  };
}

export default useDashboardData; 