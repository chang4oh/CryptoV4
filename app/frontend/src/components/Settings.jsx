import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { FaSave, FaUndo, FaCog } from 'react-icons/fa';

const Settings = ({ onSaveSettings, onRestoreDefaults, isLoading, initialSettings }) => {
  // Default settings
  const defaultSettings = {
    // Trading parameters
    trading: {
      stop_loss_percentage: 5,
      take_profit_percentage: 10,
      max_trade_size_percentage: 20,
      sentiment_threshold_buy: 0.2,
      sentiment_threshold_sell: -0.2,
      enable_auto_trading: false
    },
    // Dashboard preferences
    dashboard: {
      refresh_interval_seconds: 30,
      dark_mode: false,
      show_notifications: true,
      chart_timespan_days: 30
    }
  };
  
  // State for settings
  const [settings, setSettings] = useState({ ...defaultSettings });
  const [saveStatus, setSaveStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('trading');
  
  // Apply initialSettings from props when available
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);
  
  // Handle input change
  const handleInputChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
  };
  
  // Handle number input change with validation
  const handleNumberInputChange = (section, field, value, min, max) => {
    let parsedValue = parseFloat(value);
    
    // Ensure it's a valid number and within range
    if (!isNaN(parsedValue)) {
      if (min !== undefined && parsedValue < min) parsedValue = min;
      if (max !== undefined && parsedValue > max) parsedValue = max;
      
      handleInputChange(section, field, parsedValue);
    } else if (value === '') {
      // Allow empty string for user typing
      handleInputChange(section, field, value);
    }
  };
  
  // Handle save settings
  const handleSaveSettings = async () => {
    setSaveStatus({ saving: true });
    
    try {
      // Call the onSaveSettings prop
      if (onSaveSettings) {
        await onSaveSettings(settings);
      }
      
      setSaveStatus({ success: true, message: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      setSaveStatus({ error: true, message: `Failed to save settings: ${error.message}` });
    }
  };
  
  // Handle restore defaults
  const handleRestoreDefaults = async () => {
    try {
      // Call the onRestoreDefaults prop
      if (onRestoreDefaults) {
        const defaultSettings = await onRestoreDefaults();
        if (defaultSettings) {
          setSettings(defaultSettings);
        } else {
          setSettings({ ...defaultSettings });
        }
      } else {
        setSettings({ ...defaultSettings });
      }
      
      setSaveStatus({ success: true, message: 'Default settings restored!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      setSaveStatus({ error: true, message: `Failed to restore defaults: ${error.message}` });
    }
  };

  return (
    <div className="settings">
      <div className="d-flex align-items-center mb-3">
        <FaCog className="me-2" />
        <h4 className="mb-0">Trading Bot Settings</h4>
      </div>
      
      {saveStatus?.saving ? (
        <Alert variant="info">
          <Spinner animation="border" size="sm" className="me-2" />
          Saving settings...
        </Alert>
      ) : saveStatus?.success ? (
        <Alert variant="success">
          {saveStatus.message}
        </Alert>
      ) : saveStatus?.error ? (
        <Alert variant="danger">
          {saveStatus.message}
        </Alert>
      ) : null}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="trading" title="Trading Parameters">
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Risk Management</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Stop Loss Percentage</Form.Label>
                    <Form.Control
                      type="number"
                      min={0.1}
                      max={50}
                      step={0.1}
                      value={settings.trading.stop_loss_percentage}
                      onChange={(e) => handleNumberInputChange('trading', 'stop_loss_percentage', e.target.value, 0.1, 50)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      Maximum loss before selling (0.1-50%)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Take Profit Percentage</Form.Label>
                    <Form.Control
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.1}
                      value={settings.trading.take_profit_percentage}
                      onChange={(e) => handleNumberInputChange('trading', 'take_profit_percentage', e.target.value, 0.1, 100)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      Target profit before selling (0.1-100%)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Max Trade Size (%)</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={settings.trading.max_trade_size_percentage}
                      onChange={(e) => handleNumberInputChange('trading', 'max_trade_size_percentage', e.target.value, 1, 100)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      Maximum percentage of portfolio per trade
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <h5 className="mb-3 mt-4">Signal Parameters</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Buy Sentiment Threshold</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.trading.sentiment_threshold_buy}
                      onChange={(e) => handleNumberInputChange('trading', 'sentiment_threshold_buy', e.target.value, 0, 1)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      Minimum sentiment score for BUY signals (0-1)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Sell Sentiment Threshold</Form.Label>
                    <Form.Control
                      type="number"
                      min={-1}
                      max={0}
                      step={0.05}
                      value={settings.trading.sentiment_threshold_sell}
                      onChange={(e) => handleNumberInputChange('trading', 'sentiment_threshold_sell', e.target.value, -1, 0)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      Maximum sentiment score for SELL signals (-1-0)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="auto-trading-switch"
                  label="Enable Automated Trading"
                  checked={settings.trading.enable_auto_trading}
                  onChange={(e) => handleInputChange('trading', 'enable_auto_trading', e.target.checked)}
                  disabled={isLoading}
                />
                <Form.Text className="text-muted">
                  When enabled, the bot will automatically place orders based on signals
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="dashboard" title="Dashboard Preferences">
          <Card className="mb-4">
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Refresh Interval (seconds)</Form.Label>
                    <Form.Control
                      type="number"
                      min={5}
                      max={300}
                      step={5}
                      value={settings.dashboard.refresh_interval_seconds}
                      onChange={(e) => handleNumberInputChange('dashboard', 'refresh_interval_seconds', e.target.value, 5, 300)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      How often to refresh dashboard data (5-300 seconds)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Chart Timespan (days)</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={365}
                      step={1}
                      value={settings.dashboard.chart_timespan_days}
                      onChange={(e) => handleNumberInputChange('dashboard', 'chart_timespan_days', e.target.value, 1, 365)}
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                      Number of days to display in performance charts
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="dark-mode-switch"
                  label="Dark Mode"
                  checked={settings.dashboard.dark_mode}
                  onChange={(e) => handleInputChange('dashboard', 'dark_mode', e.target.checked)}
                  disabled={isLoading}
                />
                <Form.Text className="text-muted">
                  Enable dark mode for the dashboard
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="notifications-switch"
                  label="Show Notifications"
                  checked={settings.dashboard.show_notifications}
                  onChange={(e) => handleInputChange('dashboard', 'show_notifications', e.target.checked)}
                  disabled={isLoading}
                />
                <Form.Text className="text-muted">
                  Show browser notifications for important events
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      <div className="d-flex justify-content-between">
        <Button
          variant="outline-secondary"
          onClick={handleRestoreDefaults}
          disabled={isLoading}
        >
          <FaUndo className="me-2" />
          Restore Defaults
        </Button>
        
        <Button
          variant="primary"
          onClick={handleSaveSettings}
          disabled={isLoading || saveStatus?.saving}
        >
          {saveStatus?.saving ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <FaSave className="me-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Settings; 