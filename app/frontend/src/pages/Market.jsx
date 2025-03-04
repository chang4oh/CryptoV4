import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Spinner } from 'react-bootstrap';
import { FaSearch, FaStar, FaRegStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import apiService from '../services/api';

const Market = () => {
  const [markets, setMarkets] = useState([]);
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'volume', direction: 'desc' });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteMarkets');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState(null);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        const response = await apiService.getMarketSummary();
        setMarkets(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data. Using placeholder data.');
        // Use placeholder data when API fails
        setMarkets(placeholderMarketData);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort markets
  useEffect(() => {
    let result = [...markets];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(market => 
        market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Handle numeric values (convert from string if needed)
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle percentage strings
        if (typeof aValue === 'string' && aValue.includes('%')) {
          aValue = parseFloat(aValue.replace('%', ''));
          bValue = parseFloat(bValue.replace('%', ''));
        }
        
        // Handle price and volume (remove commas and convert to number)
        if (typeof aValue === 'string' && (aValue.includes(',') || !isNaN(aValue))) {
          aValue = parseFloat(aValue.replace(/,/g, ''));
          bValue = parseFloat(bValue.replace(/,/g, ''));
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredMarkets(result);
  }, [markets, searchTerm, sortConfig]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteMarkets', JSON.stringify(favorites));
  }, [favorites]);

  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Toggle favorite
  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(item => item !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Placeholder data when API fails
  const placeholderMarketData = [
    { symbol: 'BTC/USDT', price: '43,521.45', change: '+2.34%', volume: '1.2B', high: '44,120.00', low: '42,980.50' },
    { symbol: 'ETH/USDT', price: '3,245.67', change: '+1.56%', volume: '758M', high: '3,290.25', low: '3,210.40' },
    { symbol: 'XRP/USDT', price: '0.5678', change: '-0.78%', volume: '124M', high: '0.5720', low: '0.5650' },
    { symbol: 'ADA/USDT', price: '0.378', change: '+3.12%', volume: '89M', high: '0.385', low: '0.372' },
    { symbol: 'SOL/USDT', price: '102.45', change: '+5.67%', volume: '324M', high: '105.20', low: '98.75' },
    { symbol: 'DOT/USDT', price: '6.78', change: '-1.23%', volume: '45M', high: '6.92', low: '6.72' },
    { symbol: 'DOGE/USDT', price: '0.0823', change: '+0.45%', volume: '67M', high: '0.0830', low: '0.0815' },
    { symbol: 'AVAX/USDT', price: '34.56', change: '+2.78%', volume: '78M', high: '35.20', low: '33.90' }
  ];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">Market Overview</h2>
          
          {error && (
            <div className="alert alert-warning">
              {error}
            </div>
          )}
          
          <Card className="shadow-sm">
            <Card.Header>
              <Row className="align-items-center">
                <Col md={6}>
                  <Form.Group className="mb-0">
                    <Form.Control
                      type="text"
                      placeholder="Search markets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="text-md-end mt-3 mt-md-0">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    className="me-2"
                    onClick={() => setSearchTerm('')}
                  >
                    All Markets
                  </Button>
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={() => setFilteredMarkets(markets.filter(m => favorites.includes(m.symbol)))}
                    disabled={favorites.length === 0}
                  >
                    Favorites
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th onClick={() => requestSort('symbol')} style={{ cursor: 'pointer' }}>
                        Symbol {getSortIcon('symbol')}
                      </th>
                      <th onClick={() => requestSort('price')} style={{ cursor: 'pointer' }}>
                        Price {getSortIcon('price')}
                      </th>
                      <th onClick={() => requestSort('change')} style={{ cursor: 'pointer' }}>
                        24h Change {getSortIcon('change')}
                      </th>
                      <th onClick={() => requestSort('high')} style={{ cursor: 'pointer' }}>
                        24h High {getSortIcon('high')}
                      </th>
                      <th onClick={() => requestSort('low')} style={{ cursor: 'pointer' }}>
                        24h Low {getSortIcon('low')}
                      </th>
                      <th onClick={() => requestSort('volume')} style={{ cursor: 'pointer' }}>
                        Volume {getSortIcon('volume')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarkets.length > 0 ? (
                      filteredMarkets.map((market, index) => (
                        <tr key={index}>
                          <td>
                            <Button 
                              variant="link" 
                              className="p-0 text-warning" 
                              onClick={() => toggleFavorite(market.symbol)}
                            >
                              {favorites.includes(market.symbol) ? <FaStar /> : <FaRegStar />}
                            </Button>
                          </td>
                          <td>{market.symbol}</td>
                          <td>{market.price}</td>
                          <td className={market.change.startsWith('+') ? 'text-success' : 'text-danger'}>
                            {market.change}
                          </td>
                          <td>{market.high}</td>
                          <td>{market.low}</td>
                          <td>{market.volume}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-3">
                          No markets found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Market; 