import React, { Component } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { FaBug } from 'react-icons/fa';

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  // Update state when an error occurs
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log error details
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  // Reset the error state
  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container fluid className="error-boundary-container">
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col xs={12} sm={10} md={8} lg={6} className="text-center">
              <div className="error-content p-4 p-md-5 bg-light rounded shadow">
                <FaBug className="text-danger mb-4" size={60} />
                <h2 className="mb-3">Something Went Wrong</h2>
                
                <Alert variant="danger" className="text-start mb-4">
                  <p className="fw-bold mb-1">Error:</p>
                  <p className="mb-0">{this.state.error?.toString() || 'Unknown error'}</p>
                </Alert>
                
                {this.props.showDetails && this.state.errorInfo && (
                  <div className="text-start mb-4">
                    <p className="fw-bold">Component Stack:</p>
                    <pre className="bg-dark text-light p-3 rounded small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                
                <p className="mb-4">
                  Try refreshing the page or returning to the dashboard.
                </p>
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                    className="px-4 me-md-2"
                  >
                    Refresh Page
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={this.handleReset}
                    className="px-4"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 