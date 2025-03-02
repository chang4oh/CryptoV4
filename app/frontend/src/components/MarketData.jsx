import { Row, Col } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const MarketData = ({ tradingStatus, isLoading }) => {
  // Default/placeholder values
  const data = tradingStatus?.market_data || {
    symbol: 'BTCUSDT',
    current_price: 0,
    price_change_24h: 0,
    price_change_pct: 0,
    high_24h: 0,
    low_24h: 0,
    volume_24h: 0
  };

  // Format currency with commas and proper decimals
  const formatCurrency = (value, decimals = 2) => {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${(Number(value) * 100).toFixed(2)}%`;
  };

  // Format large numbers (for volume)
  const formatVolume = (volume) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  // Determine if price change is positive
  const isPriceUp = data.price_change_pct >= 0;
  
  // CSS classes based on price change direction
  const changeClass = isPriceUp ? 'text-success' : 'text-danger';
  const ChangeIcon = isPriceUp ? FaArrowUp : FaArrowDown;

  return (
    <div className="market-data">
      {isLoading ? (
        <p className="text-center">Loading market data...</p>
      ) : (
        <>
          <div className="current-price mb-4">
            <h5 className="text-muted mb-1">{data.symbol} Price</h5>
            <h2 className="mb-0">${formatCurrency(data.current_price)}</h2>
            
            <div className={`d-flex align-items-center mt-2 ${changeClass}`}>
              <ChangeIcon className="me-1" />
              <span className="me-2">{formatCurrency(data.price_change_24h)}</span>
              <span>({formatPercent(data.price_change_pct)})</span>
            </div>
          </div>
          
          <Row className="market-stats">
            <Col xs={6} className="mb-3">
              <div className="stat-item">
                <h6 className="text-muted mb-1">24h High</h6>
                <h5 className="mb-0">${formatCurrency(data.high_24h)}</h5>
              </div>
            </Col>
            
            <Col xs={6} className="mb-3">
              <div className="stat-item">
                <h6 className="text-muted mb-1">24h Low</h6>
                <h5 className="mb-0">${formatCurrency(data.low_24h)}</h5>
              </div>
            </Col>
            
            <Col xs={12}>
              <div className="stat-item">
                <h6 className="text-muted mb-1">24h Volume</h6>
                <h5 className="mb-0">${formatVolume(data.volume_24h)}</h5>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default MarketData; 