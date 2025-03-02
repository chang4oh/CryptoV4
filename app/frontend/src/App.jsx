import React, { useState, useEffect, Suspense } from 'react'
import { Container, Row, Col, Spinner, Nav, Button } from 'react-bootstrap'
import './App.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 text-center">
          <h3>Something went wrong</h3>
          <p>We're sorry, but there was an error loading this part of the application.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          {this.state.error && (
            <details className="mt-3 text-start">
              <summary>Error details (for developers)</summary>
              <pre className="error-stack mt-2 p-3">
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const NewsFeed = React.lazy(() => import('./components/NewsFeed'));
const RecentTrades = React.lazy(() => import('./components/RecentTrades'));
const CryptoSearch = React.lazy(() => import('./components/CryptoSearch'));
const Settings = React.lazy(() => import('./components/Settings'));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Simulate initialization process
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Check saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Render active component based on tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'news':
        return <NewsFeed />;
      case 'trades':
        return <RecentTrades />;
      case 'crypto':
        return <CryptoSearch />;
      case 'settings':
        return <Settings toggleDarkMode={toggleDarkMode} isDarkMode={darkMode} />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className={`d-flex justify-content-center align-items-center vh-100 ${darkMode ? 'dark-mode' : ''}`}>
        <Spinner animation="border" role="status" variant={darkMode ? 'light' : 'primary'}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <div className={darkMode ? 'dark-mode' : ''}>
      <Container fluid className="app-container">
        <Row>
          <Col md={2} className="sidebar">
            <div className="py-4 px-3">
              <h3 className="text-center mb-4">CryptoV4</h3>
              <Nav className="flex-column">
                <Nav.Link 
                  className={activeTab === 'dashboard' ? 'active' : ''} 
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === 'crypto' ? 'active' : ''} 
                  onClick={() => setActiveTab('crypto')}
                >
                  Crypto Trading
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === 'news' ? 'active' : ''} 
                  onClick={() => setActiveTab('news')}
                >
                  News Feed
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === 'trades' ? 'active' : ''} 
                  onClick={() => setActiveTab('trades')}
                >
                  Recent Trades
                </Nav.Link>
                <Nav.Link 
                  className={activeTab === 'settings' ? 'active' : ''} 
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </Nav.Link>
              </Nav>
              <div className="mt-auto dark-mode-toggle">
                <Button 
                  variant={darkMode ? 'light' : 'dark'} 
                  size="sm" 
                  onClick={toggleDarkMode}
                  className="w-100 mt-4"
                >
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </div>
            </div>
          </Col>
          <Col md={10} className="main-content">
            <ErrorBoundary>
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Spinner animation="border" role="status" variant={darkMode ? 'light' : 'primary'}>
                    <span className="visually-hidden">Loading component...</span>
                  </Spinner>
                </div>
              }>
                {renderActiveComponent()}
              </Suspense>
            </ErrorBoundary>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default App
