import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Badge, Spinner, Tabs, Tab, Form, Button, Row, Col } from 'react-bootstrap';
import { api } from '../services/api';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MarketData = () => {
  // State variables
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [chartData, setChartData] = useState(null);
  const [marketStats, setMarketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('price');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [availableSymbols, setAvailableSymbols] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']);
  const refreshTimerRef = useRef(null);

  // Prepare theme colors for chart
  const isDarkMode = document.body.classList.contains('dark-mode');
  const chartTheme = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: isDarkMode ? '#e0e0e0' : '#666',
    line: isDarkMode ? '#8884d8' : '#3f51b5',
    fill: isDarkMode ? 'rgba(136, 132, 216, 0.2)' : 'rgba(63, 81, 181, 0.2)',
    volume: isDarkMode ? 'rgba(75, 192, 192, 0.6)' : 'rgba(53, 162, 235, 0.6)',
    green: isDarkMode ? '#4caf50' : '#00c853',
    red: isDarkMode ? '#f44336' : '#ff1744'
  };

  // Available intervals for chart
  const intervals = [
    { value: '1m', label: '1 minute' },
    { value: '5m', label: '5 minutes' },
    { value: '15m', label: '15 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '4h', label: '4 hours' },
    { value: '1d', label: '1 day' }
  ];

  // Fetch candlestick data
  const fetchCandleData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCandlestickData(symbol, interval);
      
      if (data && data.length > 0) {
        const labels = data.map(candle => {
          const date = new Date(candle.timestamp);
          // Format based on interval
          if (interval.includes('m')) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (interval.includes('h')) {
            return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
          } else {
            return date.toLocaleDateString();
          }
        });
        
        const prices = data.map(candle => candle.close);
        const volumes = data.map(candle => candle.volume);
        const opens = data.map(candle => candle.open);
        const highs = data.map(candle => candle.high);
        const lows = data.map(candle => candle.low);
        
        // Calculate price changes for color coding
        const priceChanges = prices.map((price, index) => {
          if (index === 0) return 0;
          return price - prices[index - 1];
        });
        
        // Calculate price change percentage
        const latestPrice = prices[prices.length - 1];
        const prevPrice = prices[prices.length - 2] || prices[0];
        const changePercent = ((latestPrice - prevPrice) / prevPrice) * 100;

        // Get 24h stats
        const last24h = data.slice(-24);
        const high24h = Math.max(...last24h.map(candle => candle.high));
        const low24h = Math.min(...last24h.map(candle => candle.low));
        const volume24h = last24h.reduce((sum, candle) => sum + candle.volume, 0);
        
        setChartData({
          labels,
          prices,
          volumes,
          opens,
          highs,
          lows,
          priceChanges
        });
        
        setMarketStats({
          currentPrice: latestPrice,
          changePercent,
          high24h,
          low24h,
          volume24h
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching candlestick data:', err);
      setError('Failed to load market data. Please try again later.');
      setLoading(false);
    }
  }, [symbol, interval]);

  // Set up data fetching and auto-refresh
  useEffect(() => {
    fetchCandleData();
    
    // Set up auto-refresh timer
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchCandleData();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [symbol, interval, autoRefresh, fetchCandleData]);

  // Currency formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  // Configuration for price chart
  const priceChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${symbol}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: chartTheme.grid,
        },
        ticks: {
          color: chartTheme.text,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: chartTheme.grid,
        },
        ticks: {
          color: chartTheme.text,
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // Configuration for volume chart
  const volumeChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Volume: ${formatNumber(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: chartTheme.text,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: chartTheme.grid,
        },
        ticks: {
          color: chartTheme.text,
          callback: function(value) {
            return formatNumber(value);
          }
        }
      }
    }
  };

  // Handle symbol change
  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
    setLoading(true);
  };

  // Handle interval change
  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
    setLoading(true);
  };

  // Render price change badge
  const renderPriceChange = () => {
    if (!marketStats) return null;
    
    const { changePercent } = marketStats;
    const isPositive = changePercent >= 0;
    
    return (
      <Badge bg={isPositive ? 'success' : 'danger'}>
        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
      </Badge>
    );
  };

  return (
    <Card className="mb-4 market-data-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          Market Data
          {marketStats && (
            <span className="ms-2">
              {renderPriceChange()}
            </span>
          )}
        </h5>
        <div className="d-flex align-items-center">
          <Form.Check
            type="switch"
            id="auto-refresh-switch"
            label="Auto-refresh"
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
            className="me-2"
          />
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={fetchCandleData}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Symbol</Form.Label>
              <Form.Select 
                value={symbol} 
                onChange={handleSymbolChange}
                disabled={loading}
              >
                {availableSymbols.map(sym => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Interval</Form.Label>
              <Form.Select 
                value={interval} 
                onChange={handleIntervalChange}
                disabled={loading}
              >
                {intervals.map(int => (
                  <option key={int.value} value={int.value}>{int.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        
        {error ? (
          <div className="text-center py-5">
            <p className="text-danger">{error}</p>
            <Button variant="primary" onClick={fetchCandleData}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading market data...</p>
          </div>
        ) : (
          <>
            {/* Price statistics */}
            <div className="mb-3">
              <Row>
                <Col xs={6} md={3} className="mb-2">
                  <div className="text-muted small">Current Price</div>
                  <div className="fs-5 fw-bold">
                    {formatCurrency(marketStats?.currentPrice || 0)}
                  </div>
                </Col>
                <Col xs={6} md={3} className="mb-2">
                  <div className="text-muted small">24h High</div>
                  <div className="fs-6">{formatCurrency(marketStats?.high24h || 0)}</div>
                </Col>
                <Col xs={6} md={3} className="mb-2">
                  <div className="text-muted small">24h Low</div>
                  <div className="fs-6">{formatCurrency(marketStats?.low24h || 0)}</div>
                </Col>
                <Col xs={6} md={3} className="mb-2">
                  <div className="text-muted small">24h Volume</div>
                  <div className="fs-6">{formatNumber(marketStats?.volume24h || 0)}</div>
                </Col>
              </Row>
            </div>
            
            {/* Chart tabs */}
            <Tabs
              activeKey={tab}
              onSelect={setTab}
              className="mb-3"
            >
              <Tab eventKey="price" title="Price Chart">
                <div style={{ height: '300px' }}>
                  {chartData && (
                    <Line
                      data={{
                        labels: chartData.labels,
                        datasets: [
                          {
                            label: symbol,
                            data: chartData.prices,
                            borderColor: chartTheme.line,
                            backgroundColor: chartTheme.fill,
                            tension: 0.2,
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            pointHitRadius: 20,
                            fill: true
                          }
                        ]
                      }}
                      options={priceChartConfig}
                    />
                  )}
                </div>
              </Tab>
              <Tab eventKey="volume" title="Volume">
                <div style={{ height: '300px' }}>
                  {chartData && (
                    <Bar
                      data={{
                        labels: chartData.labels,
                        datasets: [
                          {
                            label: 'Volume',
                            data: chartData.volumes,
                            backgroundColor: chartData.priceChanges.map(change => 
                              change >= 0 ? chartTheme.green : chartTheme.red
                            ),
                            borderWidth: 0
                          }
                        ]
                      }}
                      options={volumeChartConfig}
                    />
                  )}
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default MarketData; 