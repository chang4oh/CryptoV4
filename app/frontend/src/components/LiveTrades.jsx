import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useTradeStream } from '../services/websocketService';
import { formatDistance } from 'date-fns';
import './RealTimeComponents.css';

/**
 * LiveTrades component for displaying real-time trade data
 * Uses WebSocket connection to Binance for live trade updates
 */
const LiveTrades = ({ defaultSymbol = 'btcusdt' }) => {
  // State for symbol and trades
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [pendingSymbol, setPendingSymbol] = useState(defaultSymbol);
  const [trades, setTrades] = useState([]);
  
  // Get real-time trade data from WebSocket
  const [tradeData, loading, error] = useTradeStream(symbol);
  
  // Update trades when new data is received
  useEffect(() => {
    if (tradeData) {
      setTrades(prevTrades => {
        // Add new trade to the beginning of the array
        const newTrades = [
          {
            id: tradeData.t,
            time: new Date(tradeData.T),
            price: parseFloat(tradeData.p),
            quantity: parseFloat(tradeData.q),
            isBuyerMaker: tradeData.m,
          },
          ...prevTrades
        ];
        
        // Keep only the last 50 trades
        return newTrades.slice(0, 50);
      });
    }
  }, [tradeData]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (pendingSymbol && pendingSymbol.trim() !== '') {
      setSymbol(pendingSymbol.toLowerCase());
      // Clear trades when changing symbol
      setTrades([]);
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
  
  // Format timestamp as relative time (e.g., "2 seconds ago")
  const formatTime = (time) => {
    return formatDistance(time, new Date(), { addSuffix: true });
  };
  
  // Show error message if there is an error
  if (error) {
    return (
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Live Trades</h5>
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
        <h5 className="mb-0">Live Trades</h5>
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
          <Button type="submit" variant="primary" size="sm">
            Update
          </Button>
        </Form>
        
        {loading && trades.length === 0 ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Waiting for trades...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped hover size="sm" className="order-book-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Value</th>
                  <th>Side</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No trades yet</td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className={trade.isBuyerMaker ? 'trade-row-sell' : 'trade-row-buy'}>
                      <td>{formatTime(trade.time)}</td>
                      <td className={trade.isBuyerMaker ? 'text-danger' : 'text-success'}>
                        ${formatPrice(trade.price)}
                      </td>
                      <td>{trade.quantity.toFixed(6)}</td>
                      <td>${(trade.price * trade.quantity).toFixed(2)}</td>
                      <td>
                        <Badge bg={trade.isBuyerMaker ? 'danger' : 'success'}>
                          {trade.isBuyerMaker ? 'SELL' : 'BUY'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default LiveTrades; 