import { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Spinner, Alert } from 'react-bootstrap';
import { FaSyncAlt, FaBitcoin, FaCog, FaChartLine, FaExchangeAlt } from 'react-icons/fa';
import '../App.css';

// Import all components
import AccountStatus from '../components/AccountStatus';
import MarketData from '../components/MarketData';
import TradingSignals from '../components/TradingSignals';
import RecentTrades from '../components/RecentTrades';
import NewsFeed from '../components/NewsFeed';
import PerformanceChart from '../components/PerformanceChart';
import TradingControls from '../components/TradingControls';
import Settings from '../components/Settings';

// Import custom dashboard data hook
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = () => {
  // Active view state
  const [activeView, setActiveView] = useState('dashboard');
  
  // Use the dashboard data hook for state management
  const {
    tradingStatus,
    performance,
    sentimentData,
    recentTrades,
    accountInfo,
    settings,
    isLoading,
    error,
    lastUpdated,
    fetchAllData,
    placeTestOrder,
    saveSettings,
    restoreDefaultSettings,
    tradingSignal
  } = useDashboardData();

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAllData();
  };
  
  // Handle save settings
  const handleSaveSettings = async (newSettings) => {
    try {
      await saveSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };
  
  // Handle restore settings
  const handleRestoreSettings = async () => {
    try {
      await restoreDefaultSettings();
      return true;
    } catch (error) {
      console.error('Error restoring settings:', error);
      return false;
    }
  };
  
  // Function to show browser notifications
  const showNotification = (title, message) => {
    if (!settings?.dashboard?.show_notifications) return;
    
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/favicon.svg' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.svg' });
          }
        });
      }
    }
  };
  
  // Show notification for trading signal changes
  useEffect(() => {
    if (tradingSignal && tradingStatus && settings?.dashboard?.show_notifications) {
      if (tradingSignal === 'BUY') {
        showNotification('BUY Signal Generated', 'Positive sentiment detected. Consider buying.');
      } else if (tradingSignal === 'SELL') {
        showNotification('SELL Signal Generated', 'Negative sentiment detected. Consider selling.');
      }
    }
  }, [tradingSignal, tradingStatus, settings]);

  // Render the active view
  const renderActiveView = () => {
    switch (activeView) {
      case 'trading':
        return (
          <div className="p-3">
            <h3 className="mb-4">Trading Controls</h3>
            <Row>
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Market Data
                  </div>
                  <div className="card-body">
                    <MarketData tradingStatus={tradingStatus} isLoading={isLoading} />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Trading Controls
                  </div>
                  <div className="card-body">
                    <TradingControls
                      accountInfo={accountInfo}
                      tradingStatus={tradingStatus}
                      onPlaceOrder={placeTestOrder}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        );
        
      case 'settings':
        return (
          <div className="p-3">
            <div className="card shadow-sm">
              <div className="card-header bg-dark text-white">
                Dashboard Settings
              </div>
              <div className="card-body">
                <Settings
                  onSaveSettings={handleSaveSettings}
                  onRestoreDefaults={handleRestoreSettings}
                  isLoading={isLoading}
                  initialSettings={settings}
                />
              </div>
            </div>
          </div>
        );
        
      case 'dashboard':
      default:
        return (
          <>
            {/* Account Status and Market Data */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Account Status
                  </div>
                  <div className="card-body">
                    <AccountStatus accountInfo={accountInfo} isLoading={isLoading} />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Market Data
                  </div>
                  <div className="card-body">
                    <MarketData tradingStatus={tradingStatus} isLoading={isLoading} />
                  </div>
                </div>
              </Col>
            </Row>

            {/* Trading Signals and Recent Trades */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Trading Signals
                  </div>
                  <div className="card-body">
                    <TradingSignals 
                      tradingStatus={tradingStatus} 
                      tradingSignal={tradingSignal}
                      isLoading={isLoading} 
                    />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Recent Trades
                  </div>
                  <div className="card-body">
                    <RecentTrades recentTrades={recentTrades} isLoading={isLoading} />
                  </div>
                </div>
              </Col>
            </Row>

            {/* News Feed and Performance Chart */}
            <Row>
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    News & Sentiment
                  </div>
                  <div className="card-body">
                    <NewsFeed sentimentData={sentimentData} isLoading={isLoading} />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">
                    Performance Chart
                  </div>
                  <div className="card-body">
                    <PerformanceChart performance={performance} isLoading={isLoading} />
                  </div>
                </div>
              </Col>
            </Row>
          </>
        );
    }
  };

  return (
    <div className="dashboard">
      <Navbar bg="dark" variant="dark" className="mb-0">
        <Container>
          <Navbar.Brand>
            <FaBitcoin className="me-2" />
            CryptoV4 Trading Dashboard
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link 
              onClick={() => setActiveView('dashboard')} 
              active={activeView === 'dashboard'}
              className="d-flex align-items-center"
            >
              <FaChartLine className="me-1" /> Dashboard
            </Nav.Link>
            <Nav.Link 
              onClick={() => setActiveView('trading')} 
              active={activeView === 'trading'}
              className="d-flex align-items-center"
            >
              <FaExchangeAlt className="me-1" /> Trading
            </Nav.Link>
            <Nav.Link 
              onClick={() => setActiveView('settings')} 
              active={activeView === 'settings'}
              className="d-flex align-items-center"
            >
              <FaCog className="me-1" /> Settings
            </Nav.Link>
          </Nav>
          <Navbar.Text className="text-light d-none d-md-block">
            Last updated: {lastUpdated}
          </Navbar.Text>
        </Container>
      </Navbar>
      
      <div className="dashboard-status-bar bg-light border-bottom py-2">
        <Container className="d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">Status:</small> 
            <span className="ms-1 badge bg-success">Connected</span>
          </div>
          <div className="d-flex align-items-center">
            <small className="text-muted me-2">Current Signal:</small>
            <span className={`badge ${tradingSignal === 'BUY' ? 'bg-success' : tradingSignal === 'SELL' ? 'bg-danger' : 'bg-warning'}`}>
              {tradingSignal || 'NEUTRAL'}
            </span>
          </div>
          <div className="d-md-none">
            <small className="text-muted">Updated:</small> 
            <span className="ms-1">{lastUpdated}</span>
          </div>
          <Button 
            variant="outline-primary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 
              <Spinner animation="border" size="sm" /> : 
              <FaSyncAlt />
            }
          </Button>
        </Container>
      </div>

      <Container className="py-4">
        {isLoading && !tradingStatus ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="mb-4">
            Error loading data: {error}
          </Alert>
        ) : renderActiveView()}
      </Container>
    </div>
  );
};

export default Dashboard; 