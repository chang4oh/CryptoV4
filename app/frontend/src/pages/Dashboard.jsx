import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsArrowUp, BsArrowDown, BsPlay, BsPause, BsGear, BsCurrencyBitcoin, BsWallet2, BsGraphUp } from 'react-icons/bs';
import apiService from '../services/api';
import config from '../config';

// Components
const BotStatusCard = ({ status }) => {
  const isRunning = status === 'RUNNING';
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Trading Bot Status</h5>
        <Badge bg={isRunning ? 'success' : 'secondary'}>
          {status}
        </Badge>
      </Card.Header>
      <Card.Body>
        <div className="d-flex justify-content-between mb-3">
          <div>
            <h6>Current Strategy</h6>
            <p className="text-primary mb-0">
              {config.TRADING.DEFAULT_STRATEGY} ({config.TRADING.DEFAULT_RISK_LEVEL})
            </p>
          </div>
          <div>
            <h6>Active Since</h6>
            <p className="mb-0">{isRunning ? '2 hours ago' : 'Not active'}</p>
          </div>
        </div>
        <div className="d-grid gap-2">
          <Button 
            variant={isRunning ? 'outline-danger' : 'outline-success'} 
            size="sm"
          >
            {isRunning ? <><BsPause /> Stop Bot</> : <><BsPlay /> Start Bot</>}
          </Button>
          <Button 
            as={Link} 
            to="/settings" 
            variant="outline-primary" 
            size="sm"
          >
            <BsGear /> Configure
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const PerformanceCard = ({ performance }) => {
  const isPositive = performance.daily_change >= 0;
  
        return (
    <Card className="mb-4 shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Performance</h5>
      </Card.Header>
      <Card.Body>
            <Row>
          <Col xs={6} className="text-center border-end">
            <h6 className="text-muted">Today</h6>
            <h4 className={isPositive ? 'text-success' : 'text-danger'}>
              {isPositive ? '+' : ''}{performance.daily_change.toFixed(2)}%
              {isPositive ? <BsArrowUp className="ms-1" /> : <BsArrowDown className="ms-1" />}
            </h4>
              </Col>
          <Col xs={6} className="text-center">
            <h6 className="text-muted">This Month</h6>
            <h4 className={performance.monthly_change >= 0 ? 'text-success' : 'text-danger'}>
              {performance.monthly_change >= 0 ? '+' : ''}{performance.monthly_change.toFixed(2)}%
              {performance.monthly_change >= 0 ? <BsArrowUp className="ms-1" /> : <BsArrowDown className="ms-1" />}
            </h4>
              </Col>
            </Row>
        <hr />
        <div className="d-grid">
          <Button 
            as={Link} 
            to="/performance" 
            variant="outline-primary" 
            size="sm"
          >
            <BsGraphUp /> View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const AssetSummaryCard = ({ assets }) => {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Top Assets</h5>
      </Card.Header>
      <ListGroup variant="flush">
        {assets.map((asset, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <BsCurrencyBitcoin className="me-2 text-warning" />
              <span>{asset.symbol}</span>
            </div>
            <div className="text-end">
              <div>{asset.amount.toFixed(6)} {asset.symbol}</div>
              <small className="text-muted">${asset.value.toFixed(2)} USD</small>
          </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Card.Footer className="text-center">
        <Button 
          as={Link} 
          to="/wallet" 
          variant="outline-primary" 
          size="sm"
        >
          <BsWallet2 /> View All Assets
        </Button>
      </Card.Footer>
    </Card>
  );
};

const RecentTradesCard = ({ trades }) => {
        return (
    <Card className="shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Recent Trades</h5>
      </Card.Header>
      <ListGroup variant="flush">
        {trades.length > 0 ? (
          trades.map((trade, index) => (
            <ListGroup.Item key={index}>
              <div className="d-flex justify-content-between">
                <span>
                  <Badge bg={trade.side === 'BUY' ? 'success' : 'danger'}>
                    {trade.side}
                  </Badge>
                  <span className="ms-2">{trade.symbol}</span>
                </span>
                <small className="text-muted">{trade.time}</small>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <small>
                  Price: ${trade.price.toFixed(2)}
                </small>
                <small>
                  Amount: {trade.amount.toFixed(6)}
                </small>
              </div>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="text-center py-3">
            No recent trades
          </ListGroup.Item>
        )}
      </ListGroup>
      <Card.Footer className="text-center">
        <Button 
          as={Link} 
          to="/trading-history" 
          variant="outline-primary" 
          size="sm"
        >
          <BsGraphUp /> View Trading History
        </Button>
      </Card.Footer>
    </Card>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    botStatus: 'STOPPED',
    performance: {
      daily_change: 0,
      monthly_change: 0
    },
    assets: [],
    trades: []
  });

  // Mock data loading
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In a real scenario, we would call the API
        // const response = await apiService.getDashboardData();
        
        // For now, use mock data
        setTimeout(() => {
          const mockData = {
            botStatus: 'STOPPED',
            performance: {
              daily_change: 2.35,
              monthly_change: -1.42
            },
            assets: [
              { symbol: 'BTC', amount: 0.023456, value: 1234.56 },
              { symbol: 'ETH', amount: 0.512345, value: 987.65 },
              { symbol: 'DOT', amount: 15.234567, value: 456.78 },
              { symbol: 'ADA', amount: 120.123456, value: 234.56 }
            ],
            trades: [
              { side: 'BUY', symbol: 'BTC/USDT', price: 52345.67, amount: 0.002345, time: '10:23 AM' },
              { side: 'SELL', symbol: 'ETH/USDT', price: 2876.54, amount: 0.123456, time: 'Yesterday' },
              { side: 'BUY', symbol: 'DOT/USDT', price: 23.45, amount: 5.123456, time: 'Yesterday' }
            ]
          };
          
          setData(mockData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
        <Container>
      <h1 className="mb-4">Dashboard</h1>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="loading-spinner mb-3"></div>
          <p>Loading dashboard data...</p>
          </div>
      ) : (
        <Row>
          <Col lg={4} md={6}>
            <BotStatusCard status={data.botStatus} />
            <PerformanceCard performance={data.performance} />
          </Col>
          <Col lg={4} md={6}>
            <AssetSummaryCard assets={data.assets} />
          </Col>
          <Col lg={4} md={12}>
            <RecentTradesCard trades={data.trades} />
          </Col>
        </Row>
      )}
      </Container>
  );
};

export default Dashboard; 