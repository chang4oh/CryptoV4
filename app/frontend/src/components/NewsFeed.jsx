import { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FaAngleRight } from 'react-icons/fa';
import SearchBox from './SearchBox';
import { searchNews } from '../services/searchService';

const NewsFeed = ({ sentimentData, isLoading }) => {
  // State for search results
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize with provided data
  useEffect(() => {
    if (sentimentData && !searchPerformed) {
      setSearchResults(sentimentData);
    }
  }, [sentimentData, searchPerformed]);

  // Update the search results only when actually needed
  useEffect(() => {
    // If we're not searching or if search query is empty, use all news
    if (!isSearching && (!searchQuery || searchQuery === '')) {
      setFilteredNews(sentimentData || []);
      return;
    }

    // Only update filtered results when search is complete
    if (!isSearching && searchQuery) {
      const results = performSearch(sentimentData || [], searchQuery);
      setFilteredNews(results);
    }
  }, [sentimentData, searchQuery, isSearching]);

  // Debounced search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    // The SearchBox component now handles the isSearching state internally
  };

  // Keep the original news array intact and only filter a copy
  const performSearch = (newsArray, query) => {
    if (!query) return newsArray;
    
    const lowerQuery = query.toLowerCase();
    return newsArray.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.body.toLowerCase().includes(lowerQuery) ||
      item.source.toLowerCase().includes(lowerQuery)
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Unknown';
    }
  };

  // Get sentiment badge color based on score
  const getSentimentColor = (score) => {
    const numScore = Number(score);
    if (numScore > 0.2) return 'success';
    if (numScore > -0.2) return 'warning';
    return 'danger';
  };

  // Get sentiment text based on score
  const getSentimentText = (score) => {
    const numScore = Number(score);
    if (numScore > 0.5) return 'Very Positive';
    if (numScore > 0.2) return 'Positive';
    if (numScore > -0.2) return 'Neutral';
    if (numScore > -0.5) return 'Negative';
    return 'Very Negative';
  };

  // Truncate text
  const truncateText = (text, maxLength = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Render the news items with stable keys to prevent re-rendering
  const renderNewsItems = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="my-3">
          {error}
        </Alert>
      );
    }

    if (filteredNews.length === 0) {
      return (
        <div className="search-no-results">
          <p>No news matching your search criteria.</p>
          <Button variant="link" onClick={() => handleSearch('')}>
            Clear search
          </Button>
        </div>
      );
    }

    // Use stable IDs for list items to prevent unnecessary re-rendering
    return filteredNews.map((item) => (
      <Card key={item.id} className="mb-3 news-item">
        <Card.Body>
          <div className="d-flex justify-content-between mb-2">
            <div className="news-source">
              <Badge bg="info">{item.source || 'Unknown'}</Badge>
            </div>
            <small className="text-muted">
              {formatTimestamp(item.timestamp)}
            </small>
          </div>
          <Card.Title>{highlightSearchTerm(item.title, searchQuery)}</Card.Title>
          <Card.Text>{highlightSearchTerm(item.body, searchQuery)}</Card.Text>
          <div className="d-flex justify-content-between align-items-center">
            <Badge bg={getSentimentColor(item.sentiment_score)}>
              {getSentimentText(item.sentiment_score)}
            </Badge>
            
            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="d-flex align-items-center text-primary"
              >
                Read more <FaAngleRight className="ms-1" />
              </a>
            )}
          </div>
        </Card.Body>
      </Card>
    ));
  };

  // Highlight search terms without causing re-renders
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || searchTerm === '') return text;
    
    // Create a memoized version to avoid re-renders
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.split(regex).map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <span className="search-highlight" key={index}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="news-feed">
      <div className="mb-3">
        <SearchBox 
          onSearch={handleSearch}
          placeholder="Search news by title, source, or content..."
        />
      </div>
      
      {renderNewsItems()}
    </div>
  );
};

export default NewsFeed; 