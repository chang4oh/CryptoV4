import { Card, Badge } from 'react-bootstrap';
import { FaAngleRight } from 'react-icons/fa';

const NewsFeed = ({ sentimentData, isLoading }) => {
  // Default/placeholder values
  const newsItems = sentimentData || [];

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

  return (
    <div className="news-feed">
      {isLoading ? (
        <p className="text-center">Loading news items...</p>
      ) : newsItems.length === 0 ? (
        <p className="text-center text-muted">No news items available</p>
      ) : (
        <>
          {newsItems.map((item, index) => (
            <Card key={item.id || index} className="mb-3 news-item">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between">
                  <small className="text-muted">{formatTimestamp(item.timestamp)}</small>
                  <Badge bg={getSentimentColor(item.sentiment_score)}>
                    {getSentimentText(item.sentiment_score)}
                  </Badge>
                </div>
                
                <h5 className="mt-2">{item.title}</h5>
                
                <p className="text-muted mb-2">
                  {truncateText(item.body)}
                </p>
                
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Source: {item.source || 'Unknown'}</small>
                  
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
          ))}
        </>
      )}
    </div>
  );
};

export default NewsFeed; 