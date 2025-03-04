import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { getPopularCryptocurrencies, getTradingBotStatus, BOT_STATUS } from '../services/cryptoService';
import * as cryptoService from '../services/cryptoService';
import RealTimeChart from './RealTimeChart';
import LiveTrades from './LiveTrades';
import OrderBook from './OrderBook';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [popularCryptos, setPopularCryptos] = useState([]);
  const [botStatus, setBotStatus] = useState(null);
  const [error, setError] = useState(null);
  const [marketSummary, setMarketSummary] = useState({
    totalMarketCap: 2157652000000,
    btcDominance: 54.2,
    ethDominance: 18.7,
    dailyVolume: 94782000000,
    activeCoins: 12784,
  });
  const [activeSymbol, setActiveSymbol] = useState('btcusdt');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load popular cryptocurrencies
        const cryptos = await getPopularCryptocurrencies(4);
        setPopularCryptos(cryptos);
        
        // Get trading bot status
        const status = await getTradingBotStatus();
        setBotStatus(status);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format large numbers for display
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(num);
  };

  // Format price with appropriate decimals
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };
  
  // Format market cap in trillions/billions
  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    }
  };

  // Render price change with color
  const renderPriceChange = (change) => {
    const isPositive = change >= 0;
    return (
      <Badge bg={isPositive ? 'success' : 'danger'}>
        {isPositive ? '+' : ''}{change}%
      </Badge>
    );
  };

  // Render bot status indicator
  const renderBotStatusIndicator = () => {
    if (!botStatus) return null;
    
    return (
      <div className="d-flex align-items-center mb-2">
        <span 
          className={`bot-status-indicator ${botStatus.status}`} 
          title={`Bot status: ${botStatus.status}`}
        />
        <span className="fw-bold text-capitalize">
          {botStatus.status}
        </span>
      </div>
    );
  };

  // Handle quick action button clicks
  const handleQuickAction = (action) => {
    switch(action) {
      case 'trade':
        window.location.href = '#/crypto';
        break;
      case 'analysis':
        alert('Market Analysis feature coming soon!');
        break;
      case 'portfolio':
        alert('Portfolio Management feature coming soon!');
        break;
      case 'settings':
        window.location.href = '#/settings';
        break;
      default:
        break;
    }
  };

  // Handle bot action
  const handleBotAction = async () => {
    setLoading(true);
    try {
      if (botStatus && botStatus.status === cryptoService.BOT_STATUS.ACTIVE) {
        const result = await cryptoService.stopTradingBot();
        setBotStatus({...botStatus, status: cryptoService.BOT_STATUS.INACTIVE});
      } else {
        const result = await cryptoService.startTradingBot();
        setBotStatus(result.botStatus);
      }
    } catch (err) {
      console.error('Error toggling bot status:', err);
      setError('Failed to change bot status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle crypto selection for real-time data
  const handleCryptoSelect = (symbol) => {
    setActiveSymbol(symbol.toLowerCase());
  };

  return (
    <div className="dashboard p-3">
      <h4 className="mb-4">CryptoV4 Dashboard</h4>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Market Overview */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Market Overview</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} sm={6} className="mb-3">
              <div className="text-muted">Total Market Cap</div>
              <div className="h5">{formatMarketCap(marketSummary.totalMarketCap)}</div>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <div className="text-muted">24h Volume</div>
              <div className="h5">{formatMarketCap(marketSummary.dailyVolume)}</div>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <div className="text-muted">BTC Dominance</div>
              <div className="h5">{marketSummary.btcDominance}%</div>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <div className="text-muted">Active Cryptocurrencies</div>
              <div className="h5">{formatNumber(marketSummary.activeCoins)}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Real-Time Chart */}
      <h5 className="mb-3">Real-Time Market Data</h5>
      <Row className="mb-4">
        <Col md={8}>
          <RealTimeChart defaultSymbol={activeSymbol} defaultInterval="1m" />
        </Col>
        <Col md={4}>
          <OrderBook defaultSymbol={activeSymbol} defaultDepth={10} />
        </Col>
      </Row>
      
      {/* Top Cryptocurrencies */}
      <h5 className="mb-3">Top Cryptocurrencies</h5>
      <Row className="mb-4">
        {popularCryptos.map((crypto) => (
          <Col md={3} sm={6} key={crypto.id} className="mb-3">
            <Card 
              className={`crypto-card ${activeSymbol === crypto.symbol.toLowerCase() ? 'border-primary' : ''}`}
              onClick={() => handleCryptoSelect(crypto.symbol)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  {crypto.logo && (
                    <img 
                      src={crypto.logo} 
                      alt={crypto.name} 
                      width="32" 
                      height="32" 
                      className="me-2"
                    />
                  )}
                  <div>
                    <h5 className="mb-0">{crypto.name}</h5>
                    <small className="text-muted">{crypto.symbol}</small>
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <div className="price-display">{formatPrice(crypto.price)}</div>
                  <div>{renderPriceChange(crypto.priceChange24h)}</div>
                </div>
                <div className="mt-2 text-muted">
                  Market Cap: {formatMarketCap(crypto.marketCap)}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Live Trades */}
      <h5 className="mb-3">Live Trades</h5>
      <Row className="mb-4">
        <Col md={12}>
          <LiveTrades defaultSymbol={activeSymbol} />
        </Col>
      </Row>
      
      {/* Trading Bot Status */}
      <h5 className="mb-3">Trading Bot Status</h5>
      <Row className="mb-4">
        <Col md={7}>
          <Card>
            <Card.Body>
              {botStatus ? (
                <>
                  {renderBotStatusIndicator()}
                  
                  <Row>
                    <Col md={4} sm={6} className="mb-3">
                      <div className="text-muted">Total Trades</div>
                      <div className="h5">{botStatus.totalTrades}</div>
                    </Col>
                    <Col md={4} sm={6} className="mb-3">
                      <div className="text-muted">Success Rate</div>
                      <div className="h5">{botStatus.successRate}%</div>
                    </Col>
                    <Col md={4} sm={6} className="mb-3">
                      <div className="text-muted">Profit/Loss</div>
                      <div className={`h5 ${botStatus.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                        {botStatus.profitLoss >= 0 ? '+' : ''}{botStatus.profitLoss}%
                      </div>
                    </Col>
                    <Col md={4} sm={6} className="mb-3">
                      <div className="text-muted">Uptime</div>
                      <div className="h5">{botStatus.uptime}</div>
                    </Col>
                    <Col md={8} sm={12} className="mb-3">
                      <div className="text-muted">Active Strategies</div>
                      <div>
                        {botStatus.activeStrategies?.map((strategy, index) => (
                          <Badge bg="secondary" className="me-1 mb-1" key={index}>
                            {strategy}
                          </Badge>
                        ))}
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="mt-3">
                    <Button 
                      variant={botStatus.status === cryptoService.BOT_STATUS.ACTIVE ? 'danger' : 'success'}
                      size="sm"
                      onClick={handleBotAction}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        botStatus.status === cryptoService.BOT_STATUS.ACTIVE ? 'Stop Bot' : 'Start Bot'
                      )}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="ms-2"
                      onClick={() => window.location.href = '#/crypto'}
                    >
                      View Details
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-muted">Trading bot status unavailable</div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleBotAction}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      'Initialize Trading Bot'
                    )}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Recent Bot Activity</h6>
            </Card.Header>
            <Card.Body>
              {botStatus && botStatus.logs ? (
                <div className="bot-logs">
                  {botStatus.logs.map((log, index) => (
                    <div key={index} className="log-entry mb-2">
                      <div className="d-flex">
                        <Badge 
                          bg={log.level === 'info' ? 'info' : log.level === 'error' ? 'danger' : 'warning'} 
                          className="me-2"
                        >
                          {log.level}
                        </Badge>
                        <small className="text-muted me-2">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                      <div>{log.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  No recent activity logs available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} sm={6} className="mb-2">
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={() => handleQuickAction('trade')}
              >
                Trade Crypto
              </Button>
            </Col>
            <Col md={3} sm={6} className="mb-2">
              <Button 
                variant="outline-info" 
                className="w-100"
                onClick={() => handleQuickAction('analysis')}
              >
                Market Analysis
              </Button>
            </Col>
            <Col md={3} sm={6} className="mb-2">
              <Button 
                variant="outline-success" 
                className="w-100"
                onClick={() => handleQuickAction('portfolio')}
              >
                Portfolio
              </Button>
            </Col>
            <Col md={3} sm={6} className="mb-2">
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={() => handleQuickAction('settings')}
              >
                Settings
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;