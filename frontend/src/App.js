import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, Badge, Container, Row, Col, Card, Button, Navbar, Nav, Form, Alert, Spinner, Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// API base URL from config
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  // State
  const [marketData, setMarketData] = useState([]);
  const [sentimentData, setSentimentData] = useState({ summary: {}, items: [] });
  const [newsItems, setNewsItems] = useState([]);
  const [signals, setSignals] = useState([]);
  const [trades, setTrades] = useState([]);
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [availableSymbols, setAvailableSymbols] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch available symbols
      const symbolsResponse = await axios.get(`${API_URL}/api/symbols`);
      if (symbolsResponse.data && symbolsResponse.data.symbols) {
        setAvailableSymbols(symbolsResponse.data.symbols);
        
        // Ensure selected symbol is in available symbols
        if (!symbolsResponse.data.symbols.includes(selectedSymbol)) {
          setSelectedSymbol(symbolsResponse.data.symbols[0]);
        }
      }
      
      // Fetch market data
      const marketResponse = await axios.get(`${API_URL}/api/market-data/${selectedSymbol}?interval=${selectedInterval}`);
      if (marketResponse.data && marketResponse.data.data) {
        setMarketData(marketResponse.data.data);
      }
      
      // Fetch news data
      const newsResponse = await axios.get(`${API_URL}/api/news/${selectedSymbol}`);
      if (newsResponse.data && newsResponse.data.news) {
        setNewsItems(newsResponse.data.news);
      }
      
      // Fetch sentiment data
      const sentimentResponse = await axios.get(`${API_URL}/api/sentiment/${selectedSymbol}`);
      if (sentimentResponse.data) {
        setSentimentData({
          summary: sentimentResponse.data.summary || {},
          items: sentimentResponse.data.items || []
        });
      }
      
      // Fetch signals
      const signalsResponse = await axios.get(`${API_URL}/api/signals?symbol=${selectedSymbol}`);
      if (signalsResponse.data && signalsResponse.data.signals) {
        setSignals(signalsResponse.data.signals);
      }
      
      // Fetch trades
      const tradesResponse = await axios.get(`${API_URL}/api/trades?symbol=${selectedSymbol}`);
      if (tradesResponse.data && tradesResponse.data.trades) {
        setTrades(tradesResponse.data.trades);
      }
      
      // Fetch performance metrics
      const performanceResponse = await axios.get(`${API_URL}/api/performance`);
      if (performanceResponse.data && performanceResponse.data.performance) {
        setPerformance(performanceResponse.data.performance);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("API fetch error:", err);
      setError(`Error fetching data: ${err.message}`);
      setLoading(false);
    }
  };

  // Generate a signal on demand
  const generateSignal = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/generate-signal`, { symbol: selectedSymbol });
      if (response.data && response.data.signal) {
        // Add the new signal to existing signals
        setSignals([response.data.signal, ...signals]);
        return response.data.signal;
      }
    } catch (err) {
      console.error("Error generating signal:", err);
      setError(`Error generating signal: ${err.message}`);
      return null;
    }
  };

  // Execute a trade based on a signal
  const executeTrade = async (signal) => {
    try {
      const response = await axios.post(`${API_URL}/api/execute-trade`, { 
        symbol: selectedSymbol,
        signal_id: signal._id
      });
      
      if (response.data && response.data.trade) {
        // Add the new trade to existing trades
        setTrades([response.data.trade, ...trades]);
        return true;
      }
    } catch (err) {
      console.error("Error executing trade:", err);
      setError(`Error executing trade: ${err.message}`);
      return false;
    }
  };

  // Generate signal and execute trade
  const handleTradeClick = async () => {
    const signal = await generateSignal();
    if (signal) {
      await executeTrade(signal);
      // Refresh data
      fetchData();
    }
  };

  // Initial data fetch and setup interval for refreshing
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchData, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [selectedSymbol, selectedInterval, refreshInterval]);

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get sentiment badge color
  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'success';
    if (sentiment === 'negative') return 'danger';
    return 'warning';
  };

  // Get signal badge color
  const getSignalColor = (signal) => {
    if (signal === 'BUY') return 'success';
    if (signal === 'SELL') return 'danger';
    return 'warning';
  };

  // Render loading spinner
  if (loading && !marketData.length) {
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">CryptoV4 Trading Dashboard</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#market">Market</Nav.Link>
              <Nav.Link href="#sentiment">Sentiment</Nav.Link>
              <Nav.Link href="#signals">Signals</Nav.Link>
              <Nav.Link href="#trades">Trades</Nav.Link>
            </Nav>
            <Form className="d-flex">
              <Form.Select 
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="me-2"
              >
                {availableSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </Form.Select>
              <Form.Select 
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(e.target.value)}
                className="me-2"
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">1 day</option>
              </Form.Select>
              <Button variant="outline-success" onClick={fetchData}>Refresh</Button>
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="mt-3">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <Card.Header as="h5">Market Price Chart - {selectedSymbol}</Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={marketData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(time) => new Date(time).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(time) => new Date(time).toLocaleString()}
                      formatter={(value) => [formatPrice(value), "Price"]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="close" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header as="h5">Technical Indicators</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={marketData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(time) => new Date(time).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="rsi_14" stroke="#ff7300" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col md={6}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={marketData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(time) => new Date(time).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ma_50" stroke="#8884d8" />
                        <Line type="monotone" dataKey="ma_200" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="mb-3">
              <Card.Header as="h5">Current Market Data</Card.Header>
              <Card.Body>
                {marketData.length > 0 && (
                  <div>
                    <h2>{formatPrice(marketData[marketData.length - 1].close)}</h2>
                    <p>
                      <strong>24h Change: </strong>
                      <span className={marketData[marketData.length - 1].close > marketData[0].close ? 'text-success' : 'text-danger'}>
                        {((marketData[marketData.length - 1].close - marketData[0].close) / marketData[0].close * 100).toFixed(2)}%
                      </span>
                    </p>
                    <p><strong>Volume: </strong>{formatPrice(marketData[marketData.length - 1].volume)}</p>
                    <p><strong>RSI (14): </strong>{marketData[marketData.length - 1].rsi_14?.toFixed(2)}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            <Card className="mb-3">
              <Card.Header as="h5">Sentiment Analysis</Card.Header>
              <Card.Body>
                {sentimentData.summary && (
                  <div>
                    <h4>
                      <Badge bg={getSentimentColor(sentimentData.summary.sentiment_label)}>
                        {sentimentData.summary.sentiment_label?.toUpperCase()}
                      </Badge>
                    </h4>
                    <p><strong>Average Score: </strong>{sentimentData.summary.average_score?.toFixed(2)}</p>
                    <p><strong>Based on: </strong>{sentimentData.summary.sentiment_count} news items</p>
                    
                    {sentimentData.summary.sentiment_distribution && (
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart
                          data={[
                            {
                              name: 'Positive',
                              value: sentimentData.summary.sentiment_distribution.positive || 0
                            },
                            {
                              name: 'Neutral',
                              value: sentimentData.summary.sentiment_distribution.neutral || 0
                            },
                            {
                              name: 'Negative',
                              value: sentimentData.summary.sentiment_distribution.negative || 0
                            }
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
            
            <Card className="mb-3">
              <Card.Header as="h5">Recent Signal</Card.Header>
              <Card.Body>
                {signals.length > 0 ? (
                  <div>
                    <h4>
                      <Badge bg={getSignalColor(signals[0].signal)}>
                        {signals[0].signal}
                      </Badge>
                      <span className="ms-2">
                        Confidence: {(signals[0].confidence * 100).toFixed(1)}%
                      </span>
                    </h4>
                    <p><strong>Price: </strong>{formatPrice(signals[0].price)}</p>
                    <p><strong>Time: </strong>{formatDate(signals[0].timestamp)}</p>
                    
                    <Button 
                      variant="primary" 
                      onClick={handleTradeClick}
                      disabled={loading}
                    >
                      Generate New Signal & Trade
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p>No signals available</p>
                    <Button 
                      variant="primary" 
                      onClick={handleTradeClick}
                      disabled={loading}
                    >
                      Generate Signal & Trade
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header as="h5">Recent News</Card.Header>
              <Card.Body>
                <div className="news-container">
                  {newsItems.length > 0 ? (
                    newsItems.slice(0, 5).map((news, index) => (
                      <div key={index} className="news-item mb-3">
                        <h6>{news.title}</h6>
                        <p className="small">
                          <strong>Source: </strong>{news.source} | 
                          <strong> Published: </strong>{formatDate(news.published_at)}
                        </p>
                        <p className="news-content">{news.content?.substring(0, 200)}...</p>
                        <a href={news.url} target="_blank" rel="noopener noreferrer">Read more</a>
                      </div>
                    ))
                  ) : (
                    <p>No news items available</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header as="h5">Recent Signals</Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Signal</th>
                      <th>Confidence</th>
                      <th>Price</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.length > 0 ? (
                      signals.slice(0, 5).map((signal, index) => (
                        <tr key={index}>
                          <td>
                            <Badge bg={getSignalColor(signal.signal)}>
                              {signal.signal}
                            </Badge>
                          </td>
                          <td>{(signal.confidence * 100).toFixed(1)}%</td>
                          <td>{formatPrice(signal.price)}</td>
                          <td>{formatDate(signal.timestamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">No signals available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
            
            <Card className="mb-3">
              <Card.Header as="h5">Recent Trades</Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.length > 0 ? (
                      trades.slice(0, 5).map((trade, index) => (
                        <tr key={index}>
                          <td>
                            <Badge bg={getSignalColor(trade.signal)}>
                              {trade.signal}
                            </Badge>
                          </td>
                          <td>{formatPrice(trade.price)}</td>
                          <td>{formatPrice(trade.amount)}</td>
                          <td>{trade.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">No trades available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md={12}>
            <Card className="mb-3">
              <Card.Header as="h5">Strategy Performance</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="performance-stat">
                      <h3>{performance.total_trades || 0}</h3>
                      <p>Total Trades</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="performance-stat">
                      <h3>{((performance.win_rate || 0) * 100).toFixed(1)}%</h3>
                      <p>Win Rate</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="performance-stat">
                      <h3>{formatPrice(performance.total_profit || 0)}</h3>
                      <p>Total Profit</p>
                    </div>
                  </Col>
                </Row>
                
                {performance.by_signal && (
                  <Row className="mt-3">
                    <Col md={12}>
                      <h5>Performance by Signal Type</h5>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Signal</th>
                            <th>Count</th>
                            <th>Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <Badge bg="success">BUY</Badge>
                            </td>
                            <td>{performance.by_signal.BUY?.count || 0}</td>
                            <td>{formatPrice(performance.by_signal.BUY?.profit || 0)}</td>
                          </tr>
                          <tr>
                            <td>
                              <Badge bg="danger">SELL</Badge>
                            </td>
                            <td>{performance.by_signal.SELL?.count || 0}</td>
                            <td>{formatPrice(performance.by_signal.SELL?.profit || 0)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <footer className="footer mt-auto py-3 bg-dark text-white">
        <Container>
          <span>CryptoV4 Trading Dashboard | Last updated: {new Date().toLocaleString()}</span>
        </Container>
      </footer>
    </div>
  );
}

export default App; 