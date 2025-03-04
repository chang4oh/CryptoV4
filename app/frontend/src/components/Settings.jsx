import React, { useState, useEffect, useCallback } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, Tabs, Tab, Spinner, Table, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { api } from '../services/api';

const Settings = ({ toggleDarkMode, isDarkMode }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [strategies, setStrategies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [settingsData, strategiesData] = await Promise.all([
        api.getSettings(),
        api.getStrategies()
      ]);
      
      setSettings(settingsData);
      setStrategies(strategiesData || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleStrategyChange = (strategyId) => {
    setSettings(prev => ({
      ...prev,
      trading: {
        ...prev.trading,
        active_strategy: strategyId
      }
    }));
  };

  const handleNumericChange = (section, field, value, min, max) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    let validValue = numValue;
    if (min !== undefined && numValue < min) validValue = min;
    if (max !== undefined && numValue > max) validValue = max;
    
    handleSettingChange(section, field, validValue);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.updateSettings(settings);
      
      if (settings.trading && settings.trading.active_strategy) {
        await api.setActiveStrategy(settings.trading.active_strategy);
      }
      
      addNotification('Settings saved', 'Your settings have been successfully updated.', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const defaultSettings = await api.getSettings({ defaults: true });
      setSettings(defaultSettings);
      
      await api.updateSettings(defaultSettings);
      
      setConfirmReset(false);
      addNotification('Settings reset', 'Settings have been reset to default values.', 'info');
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const addNotification = (title, message, variant = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, variant }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const renderGeneralSettings = () => {
    if (!settings || !settings.general) return null;
    
    const { general } = settings;
    
    return (
      <>
        <h5 className="mb-3">General Settings</h5>
        <Form.Group className="mb-3">
          <Form.Label>Update Interval (seconds)</Form.Label>
          <Form.Control
            type="number"
            value={general.update_interval}
            onChange={(e) => handleNumericChange('general', 'update_interval', e.target.value, 5, 3600)}
          />
          <Form.Text className="text-muted">
            How frequently the system checks for updates (minimum 5 seconds)
          </Form.Text>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Data Retention Period (days)</Form.Label>
          <Form.Control
            type="number"
            value={general.data_retention_days}
            onChange={(e) => handleNumericChange('general', 'data_retention_days', e.target.value, 1, 365)}
          />
          <Form.Text className="text-muted">
            How long to keep historical data before purging
          </Form.Text>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="enable_logs"
            label="Enable Detailed Logging"
            checked={general.enable_detailed_logs}
            onChange={(e) => handleSettingChange('general', 'enable_detailed_logs', e.target.checked)}
          />
          <Form.Text className="text-muted">
            Enables verbose logging for debugging (may affect performance)
          </Form.Text>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="enable_notifications"
            label="Enable Notifications"
            checked={general.enable_notifications}
            onChange={(e) => handleSettingChange('general', 'enable_notifications', e.target.checked)}
          />
          <Form.Text className="text-muted">
            Send notifications for important events (trades, errors, etc.)
          </Form.Text>
        </Form.Group>
      </>
    );
  };

  const renderTradingSettings = () => {
    if (!settings || !settings.trading) return null;
    
    const { trading } = settings;
    
    return (
      <>
        <h5 className="mb-3">Trading Settings</h5>
        
        <Form.Group className="mb-4">
          <Form.Label>Active Trading Strategy</Form.Label>
          <Form.Select
            value={trading.active_strategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
          >
            {strategies.map(strategy => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            Select the trading strategy to use for automated trading
          </Form.Text>
        </Form.Group>
        
        <h6 className="mb-3">Strategy Parameters</h6>
        
        {strategies.find(s => s.id === trading.active_strategy)?.parameters && (
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(trading.strategy_parameters || {}).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <Form.Control
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newParams = { ...trading.strategy_parameters, [key]: e.target.value };
                        handleSettingChange('trading', 'strategy_parameters', newParams);
                      }}
                    />
                  </td>
                  <td>
                    <small className="text-muted">
                      {strategies.find(s => s.id === trading.active_strategy)?.parameters?.[key]?.description || ''}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Trading Mode</Form.Label>
              <Form.Select
                value={trading.mode}
                onChange={(e) => handleSettingChange('trading', 'mode', e.target.value)}
              >
                <option value="backtest">Backtest Only</option>
                <option value="paper">Paper Trading</option>
                <option value="live">Live Trading</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {trading.mode === 'live' ? 
                  'Live trading with real money' : 
                  trading.mode === 'paper' ? 
                    'Simulated trading with real market data' : 
                    'Backtesting against historical data'
                }
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Order Type</Form.Label>
              <Form.Select
                value={trading.order_type}
                onChange={(e) => handleSettingChange('trading', 'order_type', e.target.value)}
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {trading.order_type === 'market' ? 
                  'Market orders execute immediately at current price' : 
                  'Limit orders execute only at specified price or better'
                }
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <h6 className="mb-3">Trading Schedule</h6>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="enable_trading_schedule"
            label="Enable Trading Schedule"
            checked={trading.schedule_enabled}
            onChange={(e) => handleSettingChange('trading', 'schedule_enabled', e.target.checked)}
          />
          <Form.Text className="text-muted">
            Restrict trading to specific hours
          </Form.Text>
        </Form.Group>
        
        {trading.schedule_enabled && (
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Trading Start Time (UTC)</Form.Label>
                <Form.Control
                  type="time"
                  value={trading.trading_start_time}
                  onChange={(e) => handleSettingChange('trading', 'trading_start_time', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Trading End Time (UTC)</Form.Label>
                <Form.Control
                  type="time"
                  value={trading.trading_end_time}
                  onChange={(e) => handleSettingChange('trading', 'trading_end_time', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        )}
      </>
    );
  };

  const renderRiskSettings = () => {
    if (!settings || !settings.risk) return null;
    
    const { risk } = settings;
    
    return (
      <>
        <h5 className="mb-3">Risk Management</h5>
        
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Max Position Size (% of portfolio)</Form.Label>
              <Form.Control
                type="number"
                value={risk.max_position_size}
                onChange={(e) => handleNumericChange('risk', 'max_position_size', e.target.value, 1, 100)}
              />
              <Form.Text className="text-muted">
                Maximum percentage of portfolio to allocate to a single position
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Stop Loss Percentage (%)</Form.Label>
              <Form.Control
                type="number"
                value={risk.stop_loss_percentage}
                onChange={(e) => handleNumericChange('risk', 'stop_loss_percentage', e.target.value, 0.1, 50)}
              />
              <Form.Text className="text-muted">
                Percentage drop from purchase price that triggers a stop loss
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Take Profit Percentage (%)</Form.Label>
              <Form.Control
                type="number"
                value={risk.take_profit_percentage}
                onChange={(e) => handleNumericChange('risk', 'take_profit_percentage', e.target.value, 0.1, 1000)}
              />
              <Form.Text className="text-muted">
                Percentage gain from purchase price that triggers profit taking
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Max Daily Drawdown (%)</Form.Label>
              <Form.Control
                type="number"
                value={risk.max_daily_drawdown}
                onChange={(e) => handleNumericChange('risk', 'max_daily_drawdown', e.target.value, 0.1, 100)}
              />
              <Form.Text className="text-muted">
                Maximum daily portfolio loss before halting trading
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="enable_trailing_stop"
            label="Enable Trailing Stop Loss"
            checked={risk.enable_trailing_stop}
            onChange={(e) => handleSettingChange('risk', 'enable_trailing_stop', e.target.checked)}
          />
          <Form.Text className="text-muted">
            Automatically adjust stop loss as price increases
          </Form.Text>
        </Form.Group>
        
        {risk.enable_trailing_stop && (
          <Form.Group className="mb-3">
            <Form.Label>Trailing Stop Distance (%)</Form.Label>
            <Form.Control
              type="number"
              value={risk.trailing_stop_distance}
              onChange={(e) => handleNumericChange('risk', 'trailing_stop_distance', e.target.value, 0.1, 20)}
            />
            <Form.Text className="text-muted">
              Distance between current price and trailing stop (percentage)
            </Form.Text>
          </Form.Group>
        )}
      </>
    );
  };

  const renderApiSettings = () => {
    if (!settings || !settings.api) return null;
    
    const { api: apiSettings } = settings;
    
    return (
      <>
        <h5 className="mb-3">API Configuration</h5>
        
        <div className="mb-4">
          <h6>Exchange API</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Exchange</Form.Label>
                <Form.Select
                  value={apiSettings.exchange}
                  onChange={(e) => handleSettingChange('api', 'exchange', e.target.value)}
                >
                  <option value="binance">Binance</option>
                  <option value="binance_us">Binance US</option>
                  <option value="coinbase">Coinbase Pro</option>
                  <option value="kucoin">KuCoin</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Environment</Form.Label>
                <Form.Select
                  value={apiSettings.environment}
                  onChange={(e) => handleSettingChange('api', 'environment', e.target.value)}
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {apiSettings.environment === 'testnet' ? 
                    'Testnet (safe for testing, no real money)' : 
                    'Mainnet (real trading with actual funds)'
                  }
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>API Key</Form.Label>
            <Form.Control
              type="password"
              value={apiSettings.api_key}
              onChange={(e) => handleSettingChange('api', 'api_key', e.target.value)}
              placeholder="Enter API key"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>API Secret</Form.Label>
            <Form.Control
              type="password"
              value={apiSettings.api_secret}
              onChange={(e) => handleSettingChange('api', 'api_secret', e.target.value)}
              placeholder="Enter API secret"
            />
          </Form.Group>
        </div>
        
        <div className="mb-4">
          <h6>News API</h6>
          <Form.Group className="mb-3">
            <Form.Label>NewsAPI Key</Form.Label>
            <Form.Control
              type="password"
              value={apiSettings.news_api_key}
              onChange={(e) => handleSettingChange('api', 'news_api_key', e.target.value)}
              placeholder="Enter NewsAPI key"
            />
          </Form.Group>
        </div>
        
        <Alert variant="info">
          <Alert.Heading>API Security Warning</Alert.Heading>
          <p>
            Never share your API keys or secrets with anyone. For maximum security, use API keys with 
            restricted permissions (read-only or trading-only) and enable IP restrictions where possible.
          </p>
        </Alert>
      </>
    );
  };

  if (loading && !settings) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Settings</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading settings...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Container className="settings-page py-4">
      <h4 className="mb-4">Settings</h4>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Form onSubmit={saveSettings}>
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
                    onChange={(e) => handleSettingChange('darkMode', 'darkMode', e.target.checked)}
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
                    onChange={(e) => handleSettingChange('notifications', 'notifications', e.target.checked)}
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
                    onChange={(e) => handleSettingChange('autoRefresh', 'autoRefresh', e.target.checked)}
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
                    onChange={(e) => handleNumericChange('refreshInterval', 'refreshInterval', e.target.value, 10, 300)}
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
                    onChange={(e) => handleSettingChange('tradingBotEnabled', 'tradingBotEnabled', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Allow the trading bot to execute trades automatically
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Risk Level</Form.Label>
                  <Form.Select 
                    value={settings.riskLevel}
                    onChange={(e) => handleSettingChange('riskLevel', 'riskLevel', e.target.value)}
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
                    onChange={(e) => handleSettingChange('apiKey', 'apiKey', e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>API Secret</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter your API secret"
                    value={settings.apiSecret}
                    onChange={(e) => handleSettingChange('apiSecret', 'apiSecret', e.target.value)}
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
          <Button variant="outline-danger" onClick={() => setConfirmReset(true)} disabled={saving}>
            Reset to Defaults
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : 'Save Settings'}
          </Button>
        </div>
      </Form>
      
      {confirmReset && (
        <Alert variant="warning" className="mt-4">
          <Alert.Heading>Confirm Reset</Alert.Heading>
          <p>
            Are you sure you want to reset all settings to their default values? 
            This action cannot be undone.
          </p>
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={resetToDefaults}
            >
              Reset All Settings
            </Button>
          </div>
        </Alert>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={setActiveTab}
        className="mt-4"
      >
        <Tab eventKey="general" title="General">
          {renderGeneralSettings()}
        </Tab>
        <Tab eventKey="trading" title="Trading Strategy">
          {renderTradingSettings()}
        </Tab>
        <Tab eventKey="risk" title="Risk Management">
          {renderRiskSettings()}
        </Tab>
        <Tab eventKey="api" title="API Configuration">
          {renderApiSettings()}
        </Tab>
      </Tabs>
      
      {/* Strategies Overview */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Available Strategies</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map(strategy => (
                <tr key={strategy.id}>
                  <td>
                    <strong>{strategy.name}</strong>
                    {settings?.trading?.active_strategy === strategy.id && (
                      <Badge bg="success" className="ms-2">Active</Badge>
                    )}
                  </td>
                  <td>{strategy.type}</td>
                  <td>{strategy.description}</td>
                  <td>
                    <Badge bg={strategy.enabled ? 'success' : 'secondary'}>
                      {strategy.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Toast notifications */}
      <ToastContainer position="top-end" className="p-3">
        {notifications.map(notification => (
          <Toast 
            key={notification.id} 
            bg={notification.variant}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            <Toast.Header>
              <strong className="me-auto">{notification.title}</strong>
            </Toast.Header>
            <Toast.Body className={notification.variant === 'dark' ? 'text-white' : ''}>
              {notification.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
};

export default Settings; 