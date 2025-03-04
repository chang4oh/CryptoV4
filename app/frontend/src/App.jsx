import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import {
  FaChartLine,
  FaWallet,
  FaCog,
  FaBars,
  FaTimes,
  FaPowerOff,
  FaPlayCircle,
  FaStopCircle,
} from "react-icons/fa";

// Components
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import Notifications from "./components/Notifications";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// Hooks and Services
import { useTheme } from "./hooks/useTheme";
import apiService from "./services/api";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log("Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5 text-center">
          <Alert variant="danger">
            <h4>Something went wrong!</h4>
            <p>
              {this.state.error && this.state.error.toString()}
            </p>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
            >
              Return to Dashboard
            </Button>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [notifications, setNotifications] = useState([]);
  const [botStatus, setBotStatus] = useState({ running: false, status: "offline" });
  const [connectionError, setConnectionError] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Add notification function
  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications([
      ...notifications,
      { id, message, type, timestamp: new Date() },
    ]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  // Check bot status periodically
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const response = await apiService.getBotStatus();
        setBotStatus(response.data);
        setConnectionError(false);
      } catch (error) {
        console.log("Failed to fetch bot status:", error);
        setConnectionError(true);
        // If there was a previous error, don't spam notifications
        if (!connectionError) {
          addNotification("Cannot connect to trading bot server", "danger");
        }
      }
    };

    checkBotStatus(); // Check immediately
    
    const interval = setInterval(checkBotStatus, 30000); // Then check every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [connectionError]);

  // Toggle bot function
  const toggleBot = async () => {
    try {
      if (botStatus.running) {
        await apiService.stopBot();
        addNotification("Trading bot stopped", "warning");
      } else {
        await apiService.startBot();
        addNotification("Trading bot started", "success");
      }
      
      // Update status after action
      const response = await apiService.getBotStatus();
      setBotStatus(response.data);
    } catch (error) {
      addNotification(`Failed to ${botStatus.running ? "stop" : "start"} trading bot`, "danger");
    }
  };

  return (
    <BrowserRouter>
      <div className={`app ${theme}`}>
        <div className="app-container">
          <ErrorBoundary>
            <Header toggleSidebar={toggleSidebar} notifications={notifications} />
            <div className="main-content">
              <Sidebar isOpen={sidebarOpen} />
              <div className={`content-area ${sidebarOpen ? "sidebar-open" : ""}`}>
                {connectionError && (
                  <Alert variant="warning" className="m-3">
                    <FaTimes className="me-2" />
                    Cannot connect to trading bot server. Some features may be unavailable.
                  </Alert>
                )}
                
                {!connectionError && (
                  <div className="bot-control-bar p-2 d-flex justify-content-between align-items-center">
                    <div>
                      <span className={`status-indicator ${botStatus.running ? "active" : "inactive"}`}></span>
                      <span className="ms-2">Bot Status: {botStatus.status}</span>
                    </div>
                    <Button
                      variant={botStatus.running ? "danger" : "success"}
                      size="sm"
                      onClick={toggleBot}
                    >
                      {botStatus.running ? (
                        <>
                          <FaStopCircle className="me-1" /> Stop Bot
                        </>
                      ) : (
                        <>
                          <FaPlayCircle className="me-1" /> Start Bot
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/market" element={<Market />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Suspense>
              </div>
            </div>
            <Notifications notifications={notifications} />
          </ErrorBoundary>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
