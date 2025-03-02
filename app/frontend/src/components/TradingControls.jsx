import { useState } from 'react';
import { Form, Button, InputGroup, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaPlay, FaPause, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const TradingControls = ({ accountInfo, tradingStatus, onPlaceOrder, isLoading }) => {
  // Local state for form and confirmation
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('BUY');
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderInProgress, setOrderInProgress] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  
  // Format currency with commas and proper decimals
  const formatCurrency = (value, decimals = 2) => {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Calculate estimated total
  const calculateTotal = () => {
    if (!amount || !tradingStatus?.market_data?.current_price) return 0;
    return parseFloat(amount) * tradingStatus.market_data.current_price;
  };
  
  // Check if the balance is sufficient for the order
  const isSufficientBalance = () => {
    if (!accountInfo) return false;
    
    if (orderType === 'BUY') {
      // Check if user has enough USDT
      return calculateTotal() <= (accountInfo.base_balance || 0);
    } else {
      // Check if user has enough BTC
      return parseFloat(amount || 0) <= (accountInfo.quote_balance || 0);
    }
  };
  
  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };
  
  // Handle order submission
  const handleSubmitOrder = () => {
    setShowConfirmation(true);
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    setShowConfirmation(false);
    setOrderInProgress(true);
    
    try {
      // Place the order
      const result = await onPlaceOrder({
        type: orderType,
        amount: parseFloat(amount),
        price: tradingStatus?.market_data?.current_price
      });
      
      // Set the result
      setOrderResult({
        success: true,
        message: `Successfully placed ${orderType} order for ${amount} BTC at $${formatCurrency(tradingStatus?.market_data?.current_price)}`
      });
      
      // Reset form
      setAmount('');
    } catch (error) {
      setOrderResult({
        success: false,
        message: `Failed to place order: ${error.message}`
      });
    } finally {
      setOrderInProgress(false);
    }
  };
  
  // Handle toggle auto trading
  const handleToggleAutoTrading = () => {
    setIsAutoTradingEnabled(!isAutoTradingEnabled);
    // Here you would integrate with your backend to enable/disable auto trading
  };
  
  // Clear order result
  const handleClearOrderResult = () => {
    setOrderResult(null);
  };

  return (
    <div className="trading-controls">
      {/* Auto Trading Toggle */}
      <div className="mb-4">
        <h5 className="mb-3">Automated Trading</h5>
        <div className="d-flex align-items-center">
          <Form.Check
            type="switch"
            id="auto-trading-switch"
            label=""
            checked={isAutoTradingEnabled}
            onChange={handleToggleAutoTrading}
            className="me-2"
          />
          <span className={`ms-2 ${isAutoTradingEnabled ? 'text-success' : 'text-danger'}`}>
            {isAutoTradingEnabled ? (
              <>
                <FaPlay className="me-1" /> Auto-trading Enabled
              </>
            ) : (
              <>
                <FaPause className="me-1" /> Auto-trading Paused
              </>
            )}
          </span>
        </div>
      </div>
      
      {/* Manual Order Form */}
      <h5 className="mb-3">Manual Trading</h5>
      
      {orderResult && (
        <Alert 
          variant={orderResult.success ? 'success' : 'danger'} 
          dismissible
          onClose={handleClearOrderResult}
          className="mb-3"
        >
          {orderResult.success ? <FaCheck className="me-2" /> : <FaTimes className="me-2" />}
          {orderResult.message}
        </Alert>
      )}
      
      <Form>
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Order Type</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  name="orderType"
                  id="buy-radio"
                  label="Buy"
                  value="BUY"
                  checked={orderType === 'BUY'}
                  onChange={(e) => setOrderType(e.target.value)}
                />
                <Form.Check
                  inline
                  type="radio"
                  name="orderType"
                  id="sell-radio"
                  label="Sell"
                  value="SELL"
                  checked={orderType === 'SELL'}
                  onChange={(e) => setOrderType(e.target.value)}
                />
              </div>
            </Form.Group>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Amount (BTC)</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.0"
                  disabled={isLoading || !tradingStatus}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => {
                    if (orderType === 'BUY') {
                      // Calculate max amount that can be bought with available USDT
                      const maxAmount = (accountInfo?.base_balance || 0) / (tradingStatus?.market_data?.current_price || 1);
                      setAmount(maxAmount.toFixed(8));
                    } else {
                      // Use all available BTC
                      setAmount((accountInfo?.quote_balance || 0).toString());
                    }
                  }}
                >
                  Max
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Available: {orderType === 'BUY' 
                  ? `$${formatCurrency(accountInfo?.base_balance || 0)}`
                  : `${formatCurrency(accountInfo?.quote_balance || 0, 8)} BTC`}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Estimated {orderType === 'BUY' ? 'Cost' : 'Proceeds'}</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="text"
                  value={formatCurrency(calculateTotal())}
                  disabled
                />
              </InputGroup>
              <Form.Text className="text-muted">
                Market Price: ${formatCurrency(tradingStatus?.market_data?.current_price || 0)}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <Button
          variant={orderType === 'BUY' ? 'success' : 'danger'}
          onClick={handleSubmitOrder}
          disabled={
            isLoading || 
            !amount || 
            parseFloat(amount) <= 0 || 
            !tradingStatus || 
            !isSufficientBalance() || 
            orderInProgress
          }
          className="w-100"
        >
          {orderInProgress ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            `${orderType} BTC`
          )}
        </Button>
        
        {amount && parseFloat(amount) > 0 && !isSufficientBalance() && (
          <Alert variant="warning" className="mt-3">
            <FaExclamationTriangle className="me-2" />
            Insufficient balance for this order
          </Alert>
        )}
      </Form>
      
      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please confirm your order details:</p>
          <ul>
            <li><strong>Type:</strong> {orderType}</li>
            <li><strong>Amount:</strong> {amount} BTC</li>
            <li><strong>Price:</strong> ${formatCurrency(tradingStatus?.market_data?.current_price || 0)}</li>
            <li><strong>Total:</strong> ${formatCurrency(calculateTotal())}</li>
          </ul>
          <p className="mb-0">Are you sure you want to proceed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Cancel
          </Button>
          <Button 
            variant={orderType === 'BUY' ? 'success' : 'danger'}
            onClick={handleConfirmOrder}
          >
            Confirm {orderType}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TradingControls; 