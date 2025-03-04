import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useDepthStream } from '../services/websocketService';
import './RealTimeComponents.css';

/**
 * OrderBook component for displaying the order book
 * Uses WebSocket connection to Binance for real-time order book updates
 */
const OrderBook = ({ defaultSymbol = 'btcusdt', defaultDepth = 10 }) => {
  // State for symbol and depth
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [depth, setDepth] = useState(defaultDepth);
  const [pendingSymbol, setPendingSymbol] = useState(defaultSymbol);
  const [pendingDepth, setPendingDepth] = useState(defaultDepth);
  
  // Get real-time depth data from WebSocket
  const [depthData, loading, error] = useDepthStream(symbol, depth);
  
  // Process depth data
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [spread, setSpread] = useState(null);
  
  // Update order book when new data is received
  useEffect(() => {
    if (depthData) {
      // Process bids (buy orders)
      const processedBids = Array.isArray(depthData.bids) 
        ? depthData.bids.map((bid, index) => {
            const price = parseFloat(bid[0]);
            const quantity = parseFloat(bid[1]);
            const total = index === 0 ? quantity : quantity + processedBids[index - 1].total;
            
            return {
              price,
              quantity,
              total,
              value: price * quantity,
            };
          }) 
        : [];

      // Process asks (sell orders)
      const processedAsks = Array.isArray(depthData.asks) 
        ? depthData.asks.map((ask, index) => {
            const price = parseFloat(ask[0]);
            const quantity = parseFloat(ask[1]);
            const total = index === 0 ? quantity : quantity + processedAsks[index - 1].total;
            
            return {
              price,
              quantity,
              total,
              value: price * quantity,
            };
          })
        : [];
      
      // Set bids and asks
      setBids(processedBids);
      setAsks(processedAsks);
      
      // Calculate spread
      if (processedBids.length > 0 && processedAsks.length > 0) {
        const highestBid = processedBids[0].price;
        const lowestAsk = processedAsks[0].price;
        const spreadValue = lowestAsk - highestBid;
        const spreadPercentage = (spreadValue / lowestAsk) * 100;
        
        setSpread({
          value: spreadValue,
          percentage: spreadPercentage,
        });
      }
    }
  }, [depthData]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (pendingSymbol && pendingSymbol.trim() !== '') {
      setSymbol(pendingSymbol.toLowerCase());
      setDepth(parseInt(pendingDepth));
      
      // Reset bids and asks
      setBids([]);
      setAsks([]);
      setSpread(null);
    }
  };
  
  // Format price with appropriate precision
  const formatPrice = (price) => {
    return price < 10 
      ? price.toFixed(6) 
      : price < 1000 
        ? price.toFixed(2) 
        : price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  
  // Format quantity
  const formatQuantity = (quantity) => {
    return quantity < 1 
      ? quantity.toFixed(6) 
      : quantity.toFixed(4);
  };
  
  // Calculate percentage for depth visualization
  const getDepthPercentage = (total, maxTotal) => {
    return Math.min(100, (total / maxTotal) * 100);
  };
  
  // Get the maximum total for visualization scaling
  const maxBidTotal = bids.length > 0 ? bids[bids.length - 1].total : 0;
  const maxAskTotal = asks.length > 0 ? asks[asks.length - 1].total : 0;
  
  // Show error message if there is an error
  if (error) {
    return (
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Order Book</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger">
            {error}
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Order Book</h5>
        <div className="d-flex align-items-center">
          <span className="me-2">{symbol.toUpperCase()}</span>
          {loading && <Spinner animation="border" variant="light" size="sm" />}
        </div>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit} className="mb-3 d-flex">
          <Form.Control
            type="text"
            placeholder="Symbol (e.g. btcusdt)"
            value={pendingSymbol}
            onChange={(e) => setPendingSymbol(e.target.value)}
            className="me-2"
            size="sm"
          />
          <Form.Select
            value={pendingDepth}
            onChange={(e) => setPendingDepth(e.target.value)}
            className="me-2"
            size="sm"
            style={{ width: '100px' }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </Form.Select>
          <Button type="submit" variant="primary" size="sm">
            Update
          </Button>
        </Form>
        
        {spread && (
          <div className="text-center mb-2">
            <small className="text-muted">
              Spread: ${formatPrice(spread.value)} ({spread.percentage.toFixed(4)}%)
            </small>
          </div>
        )}
        
        {loading && bids.length === 0 && asks.length === 0 ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading order book...</span>
          </div>
        ) : (
          <div className="order-book">
            {/* Asks (Sell Orders) */}
            <div className="mb-2">
              <Table size="sm" bordered className="mb-0 order-book-table">
                <thead>
                  <tr>
                    <th>Price (USD)</th>
                    <th>Amount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {asks.slice(0, depth).map((ask, index) => (
                    <tr key={`ask-${index}`}>
                      <td className="text-danger">
                        <div className="position-relative">
                          <div
                            className="depth-viz depth-viz-ask"
                            style={{
                              width: `${getDepthPercentage(ask.total, maxAskTotal)}%`,
                            }}
                          ></div>
                          <span className="position-relative">${formatPrice(ask.price)}</span>
                        </div>
                      </td>
                      <td>{formatQuantity(ask.quantity)}</td>
                      <td>{formatQuantity(ask.total)}</td>
                    </tr>
                  ))}
                  {asks.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center">No ask orders</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            
            {/* Bids (Buy Orders) */}
            <div>
              <Table size="sm" bordered className="mb-0 order-book-table">
                <thead>
                  <tr>
                    <th>Price (USD)</th>
                    <th>Amount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.slice(0, depth).map((bid, index) => (
                    <tr key={`bid-${index}`}>
                      <td className="text-success">
                        <div className="position-relative">
                          <div
                            className="depth-viz depth-viz-bid"
                            style={{
                              width: `${getDepthPercentage(bid.total, maxBidTotal)}%`,
                            }}
                          ></div>
                          <span className="position-relative">${formatPrice(bid.price)}</span>
                        </div>
                      </td>
                      <td>{formatQuantity(bid.quantity)}</td>
                      <td>{formatQuantity(bid.total)}</td>
                    </tr>
                  ))}
                  {bids.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center">No bid orders</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrderBook; 