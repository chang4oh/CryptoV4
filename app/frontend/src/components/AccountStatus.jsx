import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Badge, Row, Col, Button, Spinner, Table, ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { api } from '../services/api';

const AccountStatus = () => {
  // State variables
  const [accountInfo, setAccountInfo] = useState(null);
  const [tradingStatus, setTradingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshTimerRef = useRef(null);

  // Fetch account info and trading status
  const fetchAccountData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both in parallel
      const [accInfo, tradStatus] = await Promise.all([
        api.getAccountInfo(),
        api.getTradingStatus()
      ]);
      
      setAccountInfo(accInfo);
      setTradingStatus(tradStatus);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError('Failed to load account information. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize component and set up auto-refresh
  useEffect(() => {
    fetchAccountData();
    
    // Set up auto-refresh timer
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchAccountData();
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, fetchAccountData]);

  // Toggle auto-trading
  const handleToggleAutoTrading = async () => {
    if (!tradingStatus) return;
    
    try {
      setLoading(true);
      const newStatus = !tradingStatus.auto_trading_enabled;
      
      await api.toggleAutoTrading(newStatus);
      
      // Update local state
      setTradingStatus({
        ...tradingStatus,
        auto_trading_enabled: newStatus
      });
      
    } catch (err) {
      console.error('Error toggling auto-trading:', err);
      setError('Failed to toggle auto-trading. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency with commas and proper decimals
  const formatCurrency = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Format crypto amount with appropriate decimals
  const formatCrypto = (value, symbol, decimals = 6) => {
    return `${parseFloat(value).toFixed(decimals)} ${symbol}`;
  };

  // Calculate asset allocation as percentage
  const calculateAllocation = (assetValue, totalValue) => {
    if (!totalValue) return 0;
    return (assetValue / totalValue) * 100;
  };

  // Get variant color for allocation bars
  const getAllocationVariant = (percentage) => {
    if (percentage > 50) return 'danger';
    if (percentage > 30) return 'warning';
    if (percentage > 10) return 'primary';
    return 'info';
  };

  // Render account assets and allocation
  const renderAssets = () => {
    if (!accountInfo || !accountInfo.balances) {
      return <p className="text-muted">No asset information available</p>;
    }
    
    const { balances, estimated_value } = accountInfo;
    const totalValue = estimated_value || 0;
    
    // Convert balances object to array for sorting
    const assetArray = Object.entries(balances)
      .map(([symbol, amount]) => {
        const usdValue = accountInfo.asset_values?.[symbol] || 0;
        return {
          symbol,
          amount,
          usdValue,
          allocation: calculateAllocation(usdValue, totalValue)
        };
      })
      // Filter out zero balances and sort by value (highest first)
      .filter(asset => asset.amount > 0)
      .sort((a, b) => b.usdValue - a.usdValue);
    
    return (
      <Table hover responsive className="asset-table mb-0">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Balance</th>
            <th>Value</th>
            <th>Allocation</th>
          </tr>
        </thead>
        <tbody>
          {assetArray.map(asset => (
            <tr key={asset.symbol}>
              <td><strong>{asset.symbol}</strong></td>
              <td>{formatCrypto(asset.amount, asset.symbol)}</td>
              <td>{formatCurrency(asset.usdValue)}</td>
              <td>
                <div className="d-flex align-items-center">
                  <div className="progress-wrapper flex-grow-1 me-2">
                    <ProgressBar 
                      now={asset.allocation} 
                      variant={getAllocationVariant(asset.allocation)}
                      className="asset-allocation"
                    />
                  </div>
                  <span className="allocation-percent">{asset.allocation.toFixed(1)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // Render trading status badge
  const renderStatusBadge = () => {
    if (!tradingStatus) return null;
    
    const { auto_trading_enabled, system_status } = tradingStatus;
    
    let variant = 'secondary';
    let text = 'Unknown';
    
    if (system_status === 'error') {
      variant = 'danger';
      text = 'System Error';
    } else if (system_status === 'warning') {
      variant = 'warning';
      text = 'Warning';
    } else if (system_status === 'maintenance') {
      variant = 'info';
      text = 'Maintenance';
    } else if (auto_trading_enabled) {
      variant = 'success';
      text = 'Trading Active';
    } else {
      variant = 'secondary';
      text = 'Trading Paused';
    }
    
    return (
      <Badge bg={variant} className="ms-2">
        {text}
      </Badge>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          Account Status
          {renderStatusBadge()}
        </h5>
        <div className="d-flex align-items-center">
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Auto-refresh data every minute</Tooltip>}
          >
            <Button
              variant={autoRefresh ? "outline-primary" : "outline-secondary"}
              size="sm"
              className="me-2"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
          </OverlayTrigger>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={fetchAccountData}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : loading && !accountInfo ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading account data...</p>
          </div>
        ) : (
          <>
            {/* Account Summary */}
            <Row className="mb-4">
              <Col md={4} className="mb-3 mb-md-0">
                <div className="account-stat">
                  <div className="text-muted small">Total Balance</div>
                  <div className="fs-4 fw-bold">
                    {formatCurrency(accountInfo?.estimated_value || 0)}
                  </div>
                </div>
              </Col>
              <Col md={4} className="mb-3 mb-md-0">
                <div className="account-stat">
                  <div className="text-muted small">Available Balance</div>
                  <div className="fs-5">
                    {formatCurrency(accountInfo?.available_balance || 0)}
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="account-stat">
                  <div className="text-muted small">Trading Mode</div>
                  <div className="d-flex align-items-center">
                    <Button
                      variant={tradingStatus?.auto_trading_enabled ? 'success' : 'outline-success'}
                      size="sm"
                      onClick={handleToggleAutoTrading}
                      disabled={loading || !tradingStatus}
                      className="mt-1"
                    >
                      {tradingStatus?.auto_trading_enabled ? 'Auto Trading On' : 'Auto Trading Off'}
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
            
            {/* Asset Allocation */}
            <h6 className="mb-3">Asset Allocation</h6>
            {renderAssets()}
            
            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-muted small text-end mt-3">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default AccountStatus; 