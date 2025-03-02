import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';

const Settings = ({ toggleDarkMode, isDarkMode }) => {
  const [settings, setSettings] = useState({
    darkMode: isDarkMode,
    notifications: true,
    autoRefresh: true,
    refreshInterval: 60,
    tradingBotEnabled: false,
    riskLevel: 'medium',
    apiKey: '',
    apiSecret: '******************'
  });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Update dark mode when prop changes
    setSettings(prev => ({ ...prev, darkMode: isDarkMode }));
  }, [isDarkMode]);
  
  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Handle dark mode toggle
    if (key === 'darkMode') {
      toggleDarkMode();
    }
  };
  
  const handleSave = (e) => {
    e.preventDefault();
    
    try {
      // Save settings to localStorage
      localStorage.setItem('appSettings', JSON.stringify({
        ...settings,
        apiSecret: '******************', // Don't store actual secret
      }));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    }
  };
  
  const handleReset = () => {
    const defaultSettings = {
      darkMode: false,
      notifications: true,
      autoRefresh: true,
      refreshInterval: 60,
      tradingBotEnabled: false,
      riskLevel: 'medium',
      apiKey: '',
      apiSecret: ''
    };
    
    setSettings(defaultSettings);
    
    // If dark mode changes, toggle it
    if (defaultSettings.darkMode !== isDarkMode) {
      toggleDarkMode();
    }
    
    // Clear localStorage
    localStorage.removeItem('appSettings');
  };
  
  return (
    <Container className="settings-page py-4">
      <h4 className="mb-4">Settings</h4>
      
      {showSuccess && (
        <Alert variant="success" className="success-message">
          Settings saved successfully!
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Form onSubmit={handleSave}>
        <Row>
          <Col lg={6}>
            {/* Appearance Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Appearance</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="dark-mode-switch"
                    label="Dark Mode"
                    checked={settings.darkMode}
                    onChange={(e) => handleChange('darkMode', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Enable dark mode for reduced eye strain in low-light environments
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
            
            {/* Notifications Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Notifications</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="notifications-switch"
                    label="Enable Notifications"
                    checked={settings.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Receive notifications for important events and alerts
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
            
            {/* Data Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Data & Performance</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="auto-refresh-switch"
                    label="Auto-Refresh Data"
                    checked={settings.autoRefresh}
                    onChange={(e) => handleChange('autoRefresh', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Automatically refresh market data
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Refresh Interval (seconds)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={settings.refreshInterval}
                    onChange={(e) => handleChange('refreshInterval', Number(e.target.value))}
                    disabled={!settings.autoRefresh}
                    min="10"
                    max="300"
                  />
                  <Form.Text className="text-muted">
                    How frequently to refresh market data (10-300 seconds)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={6}>
            {/* Trading Bot Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Trading Bot</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="trading-bot-switch"
                    label="Enable Automated Trading"
                    checked={settings.tradingBotEnabled}
                    onChange={(e) => handleChange('tradingBotEnabled', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Allow the trading bot to execute trades automatically
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Risk Level</Form.Label>
                  <Form.Select 
                    value={settings.riskLevel}
                    onChange={(e) => handleChange('riskLevel', e.target.value)}
                    disabled={!settings.tradingBotEnabled}
                  >
                    <option value="low">Low - Conservative trades</option>
                    <option value="medium">Medium - Balanced approach</option>
                    <option value="high">High - Aggressive strategy</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Determine how aggressively the bot will trade
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
            
            {/* API Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">API Configuration</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>API Key</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter your API key"
                    value={settings.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>API Secret</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter your API secret"
                    value={settings.apiSecret}
                    onChange={(e) => handleChange('apiSecret', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Your API secret is stored securely and never sent to our servers
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-danger" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="primary" type="submit">
            Save Settings
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default Settings; 