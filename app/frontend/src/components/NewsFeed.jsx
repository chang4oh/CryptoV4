import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Badge, Spinner, Form, InputGroup, Button, ListGroup, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaAngleRight } from 'react-icons/fa';
import SearchBox from './SearchBox';
import { api } from '../services/api';

const NewsFeed = () => {
  // State variables
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshTimerRef = useRef(null);

  // Fetch news data from the API
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const newsData = await api.getSentimentData();
      
      if (Array.isArray(newsData)) {
        // Sort news by date (newest first)
        const sortedNews = newsData.sort((a, b) => {
          return new Date(b.published_at) - new Date(a.published_at);
        });
        
        setNews(sortedNews);
        setFilteredNews(sortedNews);
        setLastUpdated(new Date());
      } else {
        setError('Invalid news data format');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with data and set up auto-refresh
  useEffect(() => {
    fetchNews();
    
    // Set up auto-refresh timer
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchNews();
      }, 5 * 60 * 1000); // Refresh every 5 minutes
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, fetchNews]);

  // Filter news by search term and tab
  useEffect(() => {
    if (!news.length) return;
    
    let filtered = [...news];
    
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.description?.toLowerCase().includes(term) ||
        item.source?.toLowerCase().includes(term)
      );
    }
    
    // Apply sentiment filter based on active tab
    if (activeTab === 'positive') {
      filtered = filtered.filter(item => item.sentiment_score > 0.2);
    } else if (activeTab === 'negative') {
      filtered = filtered.filter(item => item.sentiment_score < -0.2);
    } else if (activeTab === 'neutral') {
      filtered = filtered.filter(item => 
        item.sentiment_score >= -0.2 && item.sentiment_score <= 0.2
      );
    }
    
    setFilteredNews(filtered);
  }, [news, searchTerm, activeTab]);

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Get appropriate sentiment badge
  const getSentimentBadge = (score) => {
    if (!score && score !== 0) return null;
    
    let variant, text;
    
    if (score > 0.5) {
      variant = 'success';
      text = 'Very Positive';
    } else if (score > 0.2) {
      variant = 'success';
      text = 'Positive';
    } else if (score > -0.2) {
      variant = 'secondary';
      text = 'Neutral';
    } else if (score > -0.5) {
      variant = 'danger';
      text = 'Negative';
    } else {
      variant = 'danger';
      text = 'Very Negative';
    }
    
    return (
      <Badge bg={variant} className="ms-2">
        {text} ({score.toFixed(2)})
      </Badge>
    );
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search term
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Render individual news item
  const renderNewsItem = (item) => {
    return (
      <ListGroup.Item key={item.id || item.url} className="news-item">
        <div className="d-flex justify-content-between align-items-start">
          <h6 className="mb-1">
            {item.title}
            {getSentimentBadge(item.sentiment_score)}
          </h6>
        </div>
        
        <p className="mb-1 text-muted small">
          {item.source} • {formatDate(item.published_at)}
        </p>
        
        {item.description && (
          <p className="mb-2 news-description">{item.description}</p>
        )}
        
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {item.keywords && item.keywords.length > 0 && (
              <div className="keywords">
                {item.keywords.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    bg="light" 
                    text="dark" 
                    className="me-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-sm btn-outline-primary"
          >
            Read More
          </a>
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Crypto News & Sentiment</h5>
        <div className="d-flex align-items-center">
          <Form.Check
            type="switch"
            id="news-auto-refresh"
            label="Auto-refresh"
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
            className="me-2"
          />
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={fetchNews}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Search bar */}
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Search news..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <Button 
              variant="outline-secondary" 
              onClick={handleClearSearch}
            >
              Clear
            </Button>
          )}
        </InputGroup>
        
        {/* Sentiment filter tabs */}
        <Tabs
          activeKey={activeTab}
          onSelect={setActiveTab}
          className="mb-3"
        >
          <Tab eventKey="all" title="All News" />
          <Tab 
            eventKey="positive" 
            title={
              <span>
                Positive <Badge bg="success" className="ms-1">{news.filter(n => n.sentiment_score > 0.2).length}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="neutral" 
            title={
              <span>
                Neutral <Badge bg="secondary" className="ms-1">{news.filter(n => n.sentiment_score >= -0.2 && n.sentiment_score <= 0.2).length}</Badge>
              </span>
            }
          />
          <Tab 
            eventKey="negative" 
            title={
              <span>
                Negative <Badge bg="danger" className="ms-1">{news.filter(n => n.sentiment_score < -0.2).length}</Badge>
              </span>
            }
          />
        </Tabs>
        
        {/* News items */}
        {error ? (
          <Alert variant="danger">{error}</Alert>
        ) : loading && news.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading news...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <Alert variant="info">
            {searchTerm ? 'No news found matching your search.' : 'No news available.'}
          </Alert>
        ) : (
          <>
            <ListGroup variant="flush">
              {filteredNews.map(renderNewsItem)}
            </ListGroup>
            
            {/* Last updated info */}
            {lastUpdated && (
              <div className="text-muted small text-end mt-2">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default NewsFeed; 