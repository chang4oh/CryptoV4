import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import SearchBox from './SearchBox';
import * as cryptoService from '../services/cryptoService';

// Add a custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * CryptoSearch component for searching cryptocurrencies and displaying their trading bot details
 */
const CryptoSearch = () => {
  // State for search and results
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  // State for selected cryptocurrency
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [tradingHistory, setTradingHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // State for trading bot
  const [botStatus, setBotStatus] = useState(null);
  const [isLoadingBotStatus, setIsLoadingBotStatus] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for trade form
  const [tradeAction, setTradeAction] = useState('BUY');
  const [tradeAmount, setTradeAmount] = useState('');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  
  // State for popular cryptocurrencies
  const [popularCryptos, setPopularCryptos] = useState([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  
  // Load popular cryptocurrencies on component mount
  useEffect(() => {
    loadPopularCryptocurrencies();
  }, []);
  
  // Fetch trading bot status when a cryptocurrency is selected
  useEffect(() => {
    if (selectedCrypto) {
      fetchTradingHistory(selectedCrypto.id);
      fetchBotStatus();
    }
  }, [selectedCrypto]);
  
  // Load popular cryptocurrencies
  const loadPopularCryptocurrencies = async () => {
    setIsLoadingPopular(true);
    try {
      const popular = await cryptoService.getPopularCryptocurrencies(5);
      setPopularCryptos(popular);
    } catch (err) {
      console.error('Error loading popular cryptocurrencies:', err);
      setError('Failed to load popular cryptocurrencies');
    } finally {
      setIsLoadingPopular(false);
    }
  };
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      try {
        const results = await cryptoService.searchCryptocurrencies(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching cryptocurrencies:', err);
        setError('Failed to search cryptocurrencies');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    debouncedSearch(query);
  };
  
  // Fetch trading history for a specific cryptocurrency
  const fetchTradingHistory = async (cryptoId) => {
    setIsLoadingHistory(true);
    try {
      const history = await cryptoService.getTradingHistory(cryptoId);
      setTradingHistory(history);
    } catch (err) {
      console.error('Error fetching trading history:', err);
      setError('Failed to fetch trading history');
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Fetch trading bot status
  const fetchBotStatus = async () => {
    setIsLoadingBotStatus(true);
    try {
      const status = await cryptoService.getTradingBotStatus();
      setBotStatus(status);
    } catch (err) {
      console.error('Error fetching bot status:', err);
      setError('Failed to fetch trading bot status');
    } finally {
      setIsLoadingBotStatus(false);
    }
  };
  
  // Handle cryptocurrency selection
  const handleSelectCrypto = (crypto) => {
    setSelectedCrypto(crypto);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Handle starting the trading bot
  const handleStartBot = async () => {
    setIsLoadingBotStatus(true);
    try {
      const result = await cryptoService.startTradingBot();
      setBotStatus(result.botStatus);
      showSuccess(result.message);
    } catch (err) {
      console.error('Error starting trading bot:', err);
      setError('Failed to start trading bot');
    } finally {
      setIsLoadingBotStatus(false);
    }
  };
  
  // Handle stopping the trading bot
  const handleStopBot = async () => {
    setIsLoadingBotStatus(true);
    try {
      const result = await cryptoService.stopTradingBot();
      setBotStatus({ ...botStatus, status: cryptoService.BOT_STATUS.INACTIVE });
      showSuccess(result.message);
    } catch (err) {
      console.error('Error stopping trading bot:', err);
      setError('Failed to stop trading bot');
    } finally {
      setIsLoadingBotStatus(false);
    }
  };
  
  // Handle executing a manual trade
  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    
    if (!selectedCrypto || !tradeAmount || isNaN(tradeAmount)) {
      setError('Please select a cryptocurrency and enter a valid amount');
      return;
    }
    
    setIsExecutingTrade(true);
    try {
      const result = await cryptoService.executeManualTrade(
        selectedCrypto.id, 
        tradeAction, 
        parseFloat(tradeAmount)
      );
      
      // Add the new trade to history
      setTradingHistory([result, ...tradingHistory]);
      showSuccess(`${tradeAction} order executed successfully`);
      
      // Reset form
      setTradeAmount('');
    } catch (err) {
      console.error('Error executing trade:', err);
      setError('Failed to execute trade');
    } finally {
      setIsExecutingTrade(false);
    }
  };
  
  // Show success message with auto-hide
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };
  
  // Render bot status indicator
  const renderBotStatusIndicator = () => {
    if (!botStatus) return null;
    
    return (
      <div className="mb-3">
        <span 
          className={`bot-status-indicator ${botStatus.status}`} 
          title={`Bot status: ${botStatus.status}`}
        />
        <span className="fw-bold text-capitalize">
          {botStatus.status}
        </span>
        {botStatus.uptime && (
          <small className="text-muted ms-2">
            Uptime: {botStatus.uptime}
          </small>
        )}
      </div>
    );
  };
  
  // Render price change with color based on value
  const renderPriceChange = (change) => {
    const isPositive = change >= 0;
    return (
      <Badge bg={isPositive ? 'success' : 'danger'}>
        {isPositive ? '+' : ''}{change}%
      </Badge>
    );
  };
  
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
  
  return (
    <Container className="crypto-search mt-4">
      <h4 className="mb-3">Cryptocurrency Trading Center</h4>
      
      {/* Search Box */}
      <SearchBox 
        placeholder="Search cryptocurrencies (e.g. Bitcoin, ETH)" 
        value={searchQuery}
        onChange={handleSearchChange}
        isLoading={isSearching}
      />
      
      {/* Error display */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Success message */}
      {showSuccessMessage && (
        <Alert variant="success" className="success-message">
          {successMessage}
        </Alert>
      )}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <Row className="mb-4">
          {searchResults.map((crypto) => (
            <Col md={4} sm={6} key={crypto.id} className="mb-3">
              <Card 
                onClick={() => handleSelectCrypto(crypto)} 
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
                    <span className="crypto-card-price">
                      {formatPrice(crypto.price)}
                    </span>
                    <span>
                      {renderPriceChange(crypto.priceChange24h)}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Popular Cryptocurrencies (when no search active) */}
      {!searchQuery && !selectedCrypto && (
        <>
          <h5 className="mb-3">Popular Cryptocurrencies</h5>
          {isLoadingPopular ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Row className="mb-4">
              {popularCryptos.map((crypto) => (
                <Col md={4} sm={6} key={crypto.id} className="mb-3">
                  <Card 
                    onClick={() => handleSelectCrypto(crypto)} 
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
                        <span className="crypto-card-price">
                          {formatPrice(crypto.price)}
                        </span>
                        <span>
                          {renderPriceChange(crypto.priceChange24h)}
                        </span>
                      </div>
                      {crypto.trending && (
                        <Badge bg="warning" text="dark" className="mt-2">Trending</Badge>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
      
      {/* Selected Cryptocurrency Details */}
      {selectedCrypto && (
        <div className="selected-crypto">
          <div className="d-flex align-items-center mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-3"
              onClick={() => setSelectedCrypto(null)}
            >
              ← Back
            </Button>
            {selectedCrypto.logo && (
              <img 
                src={selectedCrypto.logo} 
                alt={selectedCrypto.name} 
                width="40" 
                height="40" 
                className="me-2" 
              />
            )}
            <h4 className="mb-0">{selectedCrypto.name} ({selectedCrypto.symbol})</h4>
          </div>
          
          <Row>
            <Col md={7}>
              <Card className="mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <h5 className="price-display">{formatPrice(selectedCrypto.price)}</h5>
                      <div>
                        {renderPriceChange(selectedCrypto.priceChange24h)} (24h)
                        <span className="ms-2">
                          {renderPriceChange(selectedCrypto.priceChange7d)} (7d)
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-muted">Market Cap</div>
                      <div className="fw-bold">${formatNumber(selectedCrypto.marketCap)}</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">24h Volume</div>
                    <div>${formatNumber(selectedCrypto.volume24h)}</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">Category</div>
                    <Badge bg="info">{selectedCrypto.category}</Badge>
                  </div>
                  
                  <div>
                    <div className="text-muted mb-1">Description</div>
                    <p>{selectedCrypto.description}</p>
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Trading History</h5>
                </Card.Header>
                <Card.Body>
                  {isLoadingHistory ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : tradingHistory.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tradingHistory.map((trade) => (
                            <tr key={trade.id}>
                              <td>
                                {new Date(trade.timestamp).toLocaleTimeString()}
                              </td>
                              <td>
                                <Badge 
                                  bg={trade.action === 'BUY' ? 'success' : 'danger'}
                                >
                                  {trade.action}
                                </Badge>
                              </td>
                              <td>
                                {formatNumber(trade.amount)} {selectedCrypto.symbol}
                              </td>
                              <td>
                                {formatPrice(trade.price)}
                              </td>
                              <td>
                                {formatPrice(trade.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      No trading history available
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={5}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Trading Bot</h5>
                </Card.Header>
                <Card.Body>
                  {isLoadingBotStatus ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : botStatus ? (
                    <>
                      {renderBotStatusIndicator()}
                      
                      <div className="d-flex justify-content-between mb-3">
                        <div>
                          <div className="text-muted">Total Trades</div>
                          <div className="fw-bold">{botStatus.totalTrades}</div>
                        </div>
                        <div>
                          <div className="text-muted">Success Rate</div>
                          <div className="fw-bold">{botStatus.successRate}%</div>
                        </div>
                        <div>
                          <div className="text-muted">P/L</div>
                          <div className={`fw-bold ${botStatus.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                            {botStatus.profitLoss >= 0 ? '+' : ''}{botStatus.profitLoss}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <div className="text-muted">Performance</div>
                          <div className="text-muted">{botStatus.successRate}%</div>
                        </div>
                        <ProgressBar 
                          now={botStatus.successRate} 
                          variant={botStatus.successRate > 60 ? 'success' : 'warning'} 
                          className="mt-1"
                        />
                      </div>
                      
                      {botStatus.activeStrategies && (
                        <div className="mb-3">
                          <div className="text-muted mb-1">Active Strategies</div>
                          <div>
                            {botStatus.activeStrategies.map((strategy, index) => (
                              <Badge bg="secondary" className="me-1" key={index}>
                                {strategy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <div className="text-muted mb-1">Last Activity</div>
                        <div>
                          {new Date(botStatus.lastActivity).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="d-grid gap-2">
                        {botStatus.status === cryptoService.BOT_STATUS.ACTIVE ? (
                          <Button 
                            variant="danger" 
                            onClick={handleStopBot}
                            disabled={isLoadingBotStatus}
                          >
                            {isLoadingBotStatus ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              'Stop Trading Bot'
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="success" 
                            onClick={handleStartBot}
                            disabled={isLoadingBotStatus}
                          >
                            {isLoadingBotStatus ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              'Start Trading Bot'
                            )}
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      Trading bot information not available
                    </div>
                  )}
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Manual Trade</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleExecuteTrade}>
                    <Form.Group className="mb-3">
                      <Form.Label>Action</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="Buy"
                          name="tradeAction"
                          id="buy-action"
                          checked={tradeAction === 'BUY'}
                          onChange={() => setTradeAction('BUY')}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Sell"
                          name="tradeAction"
                          id="sell-action"
                          checked={tradeAction === 'SELL'}
                          onChange={() => setTradeAction('SELL')}
                        />
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Amount ({selectedCrypto.symbol})
                      </Form.Label>
                      <Form.Control
                        type="number"
                        placeholder={`Enter amount in ${selectedCrypto.symbol}`}
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        step="0.001"
                        min="0"
                      />
                    </Form.Group>
                    
                    {tradeAmount && !isNaN(tradeAmount) && (
                      <div className="mb-3">
                        <div className="text-muted">Estimated Total</div>
                        <div className="fw-bold">
                          {formatPrice(selectedCrypto.price * parseFloat(tradeAmount))}
                        </div>
                      </div>
                    )}
                    
                    <div className="d-grid">
                      <Button 
                        variant={tradeAction === 'BUY' ? 'success' : 'danger'} 
                        type="submit"
                        disabled={isExecutingTrade || !tradeAmount}
                        className="trade-action-btn"
                      >
                        {isExecutingTrade ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          tradeAction === 'BUY' ? 'Buy' : 'Sell'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </Container>
  );
};

export default CryptoSearch; 