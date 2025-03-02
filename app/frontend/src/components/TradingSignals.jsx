import { Row, Col, ProgressBar, Badge } from 'react-bootstrap';
import { FaChartLine, FaNewspaper } from 'react-icons/fa';

const TradingSignals = ({ tradingStatus, tradingSignal, isLoading }) => {
  // Default/placeholder values
  const data = tradingStatus || {
    avg_sentiment: 0,
    sentiment_sources: 0,
    trend_strength: 0,
    last_updated: new Date().toISOString()
  };

  // Get signal badge color
  const getSignalColor = (signal) => {
    switch(signal?.toUpperCase()) {
      case 'BUY': return 'success';
      case 'SELL': return 'danger';
      case 'NEUTRAL': return 'warning';
      default: return 'secondary';
    }
  };

  // Format sentiment score (-1 to 1) as percentage (0 to 100)
  const sentimentPercent = () => {
    // Convert -1 to 1 scale to 0 to 100
    return Math.round((Number(data.avg_sentiment) + 1) * 50);
  };

  // Get sentiment description based on score
  const getSentimentDescription = (score) => {
    const numScore = Number(score);
    if (numScore > 0.5) return 'Very Positive';
    if (numScore > 0.2) return 'Positive';
    if (numScore > -0.2) return 'Neutral';
    if (numScore > -0.5) return 'Negative';
    return 'Very Negative';
  };

  // Get sentiment progress bar variant
  const getSentimentVariant = (score) => {
    const numScore = Number(score);
    if (numScore > 0.2) return 'success';
    if (numScore > -0.2) return 'warning';
    return 'danger';
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <div className="trading-signals">
      {isLoading ? (
        <p className="text-center">Loading trading signals...</p>
      ) : (
        <>
          <div className="signal-display mb-4 text-center">
            <h5 className="text-muted mb-2">Current Signal</h5>
            <h2>
              <Badge 
                bg={getSignalColor(tradingSignal)} 
                style={{ fontSize: '1.5rem', padding: '0.5rem 1.5rem' }}
              >
                {tradingSignal || 'UNKNOWN'}
              </Badge>
            </h2>
          </div>
          
          <Row className="signal-details">
            <Col xs={12} className="mb-3">
              <div className="d-flex align-items-center mb-1">
                <FaNewspaper className="me-2 text-primary" />
                <h6 className="mb-0">Sentiment Analysis</h6>
              </div>
              <div className="mt-2">
                <div className="d-flex justify-content-between mb-1">
                  <span>{getSentimentDescription(data.avg_sentiment)}</span>
                  <span>{data.avg_sentiment?.toFixed(2)}</span>
                </div>
                <ProgressBar 
                  variant={getSentimentVariant(data.avg_sentiment)}
                  now={sentimentPercent()} 
                  className="sentiment-bar"
                />
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">Based on {data.sentiment_sources || 0} sources</small>
                  <small className="text-muted">Updated: {formatDate(data.last_updated)}</small>
                </div>
              </div>
            </Col>
            
            <Col xs={12}>
              <div className="d-flex align-items-center mb-1">
                <FaChartLine className="me-2 text-primary" />
                <h6 className="mb-0">Trend Strength</h6>
              </div>
              <div className="mt-2">
                <div className="d-flex justify-content-between mb-1">
                  <span>Strength</span>
                  <span>{(data.trend_strength || 0).toFixed(2)}</span>
                </div>
                <ProgressBar 
                  variant="info" 
                  now={(data.trend_strength || 0) * 100} 
                  className="trend-bar"
                />
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default TradingSignals; 