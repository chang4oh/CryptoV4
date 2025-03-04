import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Form, InputGroup, Row, Col, Alert, Badge, Table, Spinner } from 'react-bootstrap';
import { api } from '../services/api';

const TradingControls = () => {
  // State variables
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [orderType, setOrderType] = useState('MARKET');
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderMessage, setOrderMessage] = useState({ type: '', text: '' });
  const [testMode, setTestMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [availableSymbols, setAvailableSymbols] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']);
  const [balances, setBalances] = useState({ USDT: 0, BTC: 0, ETH: 0 });
  const [fetchingPrice, setFetchingPrice] = useState(false);

  // Get current price for the selected symbol
  const fetchCurrentPrice = useCallback(async () => {
    if (fetchingPrice) return;
    
    try {
      setFetchingPrice(true);
      const response = await api.getSymbolPrice(symbol);
      setCurrentPrice(Number(response.price));
      setPriceLoading(false);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
    } finally {
      setFetchingPrice(false);
    }
  }, [symbol, fetchingPrice]);

  // Get account balances
  const fetchBalances = useCallback(async () => {
    try {
      const accountInfo = await api.getAccountInfo();
      if (accountInfo && accountInfo.balances) {
        setBalances(accountInfo.balances);
      }
    } catch (error) {
      console.error('Error fetching account balances:', error);
    }
  }, []);

  // Get order history
  const fetchOrderHistory = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const orders = await api.getRecentTrades(10);
      setOrderHistory(orders || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Initialize component with price updates and order history
  useEffect(() => {
    fetchCurrentPrice();
    fetchBalances();
    fetchOrderHistory();
    
    // Set up price refresh interval if autoRefresh is enabled
    let priceInterval;
    if (autoRefresh) {
      priceInterval = setInterval(() => {
        fetchCurrentPrice();
      }, 5000); // Update price every 5 seconds
    }

    return () => {
      if (priceInterval) clearInterval(priceInterval);
    };
  }, [symbol, autoRefresh, fetchCurrentPrice, fetchBalances, fetchOrderHistory]);

  // Handle symbol change
  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
    setPriceLoading(true);
    setPrice('');
  };

  // Handle order type change
  const handleOrderTypeChange = (e) => {
    const newOrderType = e.target.value;
    setOrderType(newOrderType);
    
    // Reset price and stop price if switching to MARKET
    if (newOrderType === 'MARKET') {
      setPrice('');
      setStopPrice('');
    } else if (newOrderType === 'LIMIT' && currentPrice) {
      // Set default price for LIMIT orders based on current price
      setPrice(currentPrice.toFixed(2));
    }
  };

  // Format number for display
  const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  // Format currency for display
  const formatCurrency = (amount, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  };

  // Calculate order value
  const calculateOrderValue = () => {
    if (!quantity || !currentPrice) return 0;
    return parseFloat(quantity) * currentPrice;
  };

  // Validate order before submission
  const validateOrder = () => {
    if (!symbol) return 'Please select a trading pair';
    if (!quantity || parseFloat(quantity) <= 0) return 'Please enter a valid quantity';
    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) return 'Please enter a valid price for limit order';
    if (orderType === 'STOP_LIMIT' && (!stopPrice || parseFloat(stopPrice) <= 0)) return 'Please enter a valid stop price';
    
    // Check if sufficient balance for BUY orders
    if (side === 'BUY') {
      const orderValue = calculateOrderValue();
      if (orderValue > balances.USDT) {
        return `Insufficient USDT balance. Order requires ${formatCurrency(orderValue)}`;
      }
    }
    
    // Check if sufficient balance for SELL orders
    if (side === 'SELL') {
      const asset = symbol.replace('USDT', '');
      const assetBalance = balances[asset] || 0;
      if (parseFloat(quantity) > assetBalance) {
        return `Insufficient ${asset} balance. You have ${formatNumber(assetBalance, 8)} ${asset}`;
      }
    }
    
    return '';
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    const validationError = validateOrder();
    if (validationError) {
      setOrderMessage({ type: 'danger', text: validationError });
      return;
    }

    const orderData = {
      symbol,
      side,
      type: orderType,
      quantity: parseFloat(quantity)
    };

    if (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') {
      orderData.price = parseFloat(price);
    }

    if (orderType === 'STOP_LIMIT') {
      orderData.stopPrice = parseFloat(stopPrice);
    }

    try {
      const response = testMode
        ? await api.placeTestOrder(orderData)
        : await api.placeOrder(orderData);

      if (response && response.status === 'success') {
        setOrderMessage({
          type: 'success',
          text: `${testMode ? 'Test order' : 'Order'} placed successfully! Order ID: ${response.orderId}`
        });
        
        // Clear form after successful order
        setQuantity('');
        
        // Refresh balances and order history
        fetchBalances();
        fetchOrderHistory();
      } else {
        setOrderMessage({
          type: 'danger',
          text: `Order failed: ${response?.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderMessage({
        type: 'danger',
        text: `Error placing order: ${error.response?.data?.message || error.message || 'Unknown error'}`
      });
    }
  };

  // Handle quick buy with preset percentage of available balance
  const handleQuickBuy = (percent) => {
    if (!currentPrice || !balances.USDT) return;
    
    const availableValue = balances.USDT * (percent / 100);
    const calculatedQuantity = (availableValue / currentPrice).toFixed(8);
    
    setQuantity(calculatedQuantity);
    setSide('BUY');
  };

  // Handle quick sell with preset percentage of available asset
  const handleQuickSell = (percent) => {
    const asset = symbol.replace('USDT', '');
    const assetBalance = balances[asset] || 0;
    
    if (!assetBalance) return;
    
    const calculatedQuantity = (assetBalance * (percent / 100)).toFixed(8);
    setQuantity(calculatedQuantity);
    setSide('SELL');
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Trading Controls</h5>
        <Badge bg={testMode ? 'warning' : 'success'}>
          {testMode ? 'Test Mode' : 'Live Trading'}
        </Badge>
      </Card.Header>
      
      <Card.Body>
        {orderMessage.text && (
          <Alert variant={orderMessage.type} dismissible onClose={() => setOrderMessage({ type: '', text: '' })}>
            {orderMessage.text}
          </Alert>
        )}
        
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="tradingSymbol">
              <Form.Label>Trading Pair</Form.Label>
              <Form.Select 
                value={symbol} 
                onChange={handleSymbolChange}
              >
                {availableSymbols.map(sym => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="currentPrice">
              <Form.Label>Current Price</Form.Label>
              <InputGroup>
                <Form.Control
                  readOnly
                  value={priceLoading ? 'Loading...' : formatCurrency(currentPrice)}
                  className="bg-light"
                />
                <Button 
                  variant="outline-secondary"
                  onClick={fetchCurrentPrice}
                  disabled={fetchingPrice}
                >
                  {fetchingPrice ? <Spinner size="sm" animation="border" /> : 'Refresh'}
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId="orderType">
              <Form.Label>Order Type</Form.Label>
              <Form.Select
                value={orderType}
                onChange={handleOrderTypeChange}
              >
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
                <option value="STOP_LIMIT">Stop Limit</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="orderSide">
              <Form.Label>Side</Form.Label>
              <div className="d-flex">
                <Button
                  variant={side === 'BUY' ? 'success' : 'outline-success'}
                  className="w-50"
                  onClick={() => setSide('BUY')}
                >
                  Buy
                </Button>
                <Button
                  variant={side === 'SELL' ? 'danger' : 'outline-danger'}
                  className="w-50"
                  onClick={() => setSide('SELL')}
                >
                  Sell
                </Button>
              </div>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="testMode">
              <Form.Label>Trading Mode</Form.Label>
              <Form.Check
                type="switch"
                id="test-mode-switch"
                label={testMode ? "Test Mode (No real trades)" : "Live Trading (Real money)"}
                checked={testMode}
                onChange={() => setTestMode(!testMode)}
                className="mt-2"
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col md={orderType === 'STOP_LIMIT' ? 4 : 6}>
            <Form.Group controlId="quantity">
              <Form.Label>Quantity ({symbol.replace('USDT', '')})</Form.Label>
              <Form.Control
                type="number"
                step="0.00000001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </Form.Group>
          </Col>
          
          {orderType !== 'MARKET' && (
            <Col md={orderType === 'STOP_LIMIT' ? 4 : 6}>
              <Form.Group controlId="price">
                <Form.Label>Limit Price (USDT)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                />
              </Form.Group>
            </Col>
          )}
          
          {orderType === 'STOP_LIMIT' && (
            <Col md={4}>
              <Form.Group controlId="stopPrice">
                <Form.Label>Stop Price (USDT)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="Enter stop price"
                />
              </Form.Group>
            </Col>
          )}
        </Row>
        
        {/* Quick buy/sell buttons */}
        <Row className="mb-3">
          <Col md={6}>
            <div className="d-flex gap-2 flex-wrap">
              <small className="w-100 text-muted mb-1">Quick Buy (% of USDT balance)</small>
              {[10, 25, 50, 75, 100].map(percent => (
                <Button
                  key={`buy-${percent}`}
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleQuickBuy(percent)}
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </Col>
          <Col md={6}>
            <div className="d-flex gap-2 flex-wrap">
              <small className="w-100 text-muted mb-1">Quick Sell (% of {symbol.replace('USDT', '')} balance)</small>
              {[10, 25, 50, 75, 100].map(percent => (
                <Button
                  key={`sell-${percent}`}
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleQuickSell(percent)}
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </Col>
        </Row>
        
        {/* Order value summary */}
        <Row className="mb-3">
          <Col>
            <Card className="bg-light">
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between">
                  <span>Order Value:</span>
                  <strong>{formatCurrency(calculateOrderValue())}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Available Balance:</span>
                  <strong>
                    {side === 'BUY' 
                      ? `${formatCurrency(balances.USDT)} USDT`
                      : `${formatNumber(balances[symbol.replace('USDT', '')] || 0, 8)} ${symbol.replace('USDT', '')}`
                    }
                  </strong>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Button
          variant={side === 'BUY' ? 'success' : 'danger'}
          className="w-100"
          size="lg"
          onClick={handleSubmitOrder}
        >
          {side === 'BUY' ? 'Buy' : 'Sell'} {symbol}
        </Button>
      </Card.Body>
      
      {/* Order history */}
      <Card.Footer>
        <h6>Recent Orders</h6>
        {ordersLoading ? (
          <div className="text-center my-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading orders...</span>
          </div>
        ) : orderHistory.length === 0 ? (
          <p className="text-muted text-center">No recent orders</p>
        ) : (
          <div className="table-responsive">
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map((order, index) => (
                  <tr key={order.id || index}>
                    <td>{new Date(order.time).toLocaleString()}</td>
                    <td>{order.symbol}</td>
                    <td>{order.type}</td>
                    <td>
                      <Badge bg={order.side === 'BUY' ? 'success' : 'danger'}>
                        {order.side}
                      </Badge>
                    </td>
                    <td>{formatCurrency(order.price)}</td>
                    <td>{formatNumber(order.quantity, 8)}</td>
                    <td>
                      <Badge bg={order.status === 'FILLED' ? 'success' : 'warning'}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center mt-2">
          <Form.Check
            type="switch"
            id="auto-refresh-switch"
            label="Auto-refresh data"
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
          />
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => {
              fetchCurrentPrice();
              fetchBalances();
              fetchOrderHistory();
            }}
          >
            Refresh Data
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default TradingControls; 