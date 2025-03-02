import { Card, Row, Col, Badge } from 'react-bootstrap';
import { FaWallet, FaBitcoin, FaDollarSign } from 'react-icons/fa';

const AccountStatus = ({ accountInfo, isLoading }) => {
  // Default/placeholder values
  const data = accountInfo || {
    base_asset: 'USDT',
    base_balance: 0,
    quote_asset: 'BTC',
    quote_balance: 0,
    total_value_usd: 0,
    status: 'unknown'
  };

  // Format numbers with commas and proper decimals
  const formatCurrency = (value, decimals = 2) => {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Determine status badge color
  const getBadgeColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'warning';
      case 'error': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="account-status">
      {isLoading ? (
        <p className="text-center">Loading account data...</p>
      ) : (
        <>
          <Row className="account-info mb-3">
            <Col xs={12} className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Trading Status</h5>
              </div>
              <Badge bg={getBadgeColor(data.status)}>
                {data.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </Col>
          </Row>

          <Row className="account-balances">
            <Col xs={12} md={6} className="mb-3">
              <div className="d-flex align-items-center">
                <div className="icon-container me-2">
                  <FaDollarSign size={18} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">{data.base_asset} Balance</h6>
                  <h4 className="mb-0">{formatCurrency(data.base_balance, 2)}</h4>
                </div>
              </div>
            </Col>
            
            <Col xs={12} md={6} className="mb-3">
              <div className="d-flex align-items-center">
                <div className="icon-container me-2">
                  <FaBitcoin size={18} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">{data.quote_asset} Balance</h6>
                  <h4 className="mb-0">{formatCurrency(data.quote_balance, 8)}</h4>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <div className="d-flex align-items-center">
                <div className="icon-container me-2">
                  <FaWallet size={18} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Total Value (USD)</h6>
                  <h3 className="mb-0">${formatCurrency(data.total_value_usd)}</h3>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AccountStatus; 