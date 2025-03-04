import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import { FaCog, FaSave, FaUndo, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import apiService from '../services/api';
import { useTheme } from '../hooks/useTheme';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    general: {
      botName: 'CryptoV4 Bot',
      autoStart: false,
      refreshInterval: 60,
      notificationsEnabled: true,
      soundAlertsEnabled: false
    },
    trading: {
      strategy: 'MACD_CROSSOVER',
      riskLevel: 'medium',
      maxOpenPositions: 5,
      stopLossPercentage: 2.5,
      takeProfitPercentage: 5.0,
      trailingStopEnabled: true,
      trailingStopPercentage: 1.0
    },
    api: {
      apiKeyConfigured: false,
      testnetEnabled: true,
      exchangeType: 'binance'
    },
    ui: {
      defaultView: 'dashboard',
      chartInterval: '1h',
      chartType: 'candlestick',
      showVolume: true,
      darkMode: theme === 'dark'
    }
  });
  
  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await apiService.getBotConfig();
        if (response && response.data) {
          // Update with received settings, keeping default values for any missing fields
          setSettings(prevSettings => ({
            general: { ...prevSettings.general, ...response.data.general },
            trading: { ...prevSettings.trading, ...response.data.trading },
            api: { ...prevSettings.api, ...response.data.api },
            ui: { 
              ...prevSettings.ui, 
              ...response.data.ui,
              darkMode: theme === 'dark' // Ensure UI theme matches the current theme
            }
          }));
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Using default configuration.');
        // We'll continue using the default settings defined in state
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [theme]);
  
  // Handle input change
  const handleSettingChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
    
    // Special handling for darkMode setting
    if (section === 'ui' && field === 'darkMode') {
      if (theme === 'dark' && !value) {
        toggleTheme();
      } else if (theme === 'light' && value) {
        toggleTheme();
      }
    }
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);
    
    try {
      await apiService.updateBotConfig(settings);
      setSuccess('Settings saved successfully!');
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings({
        general: {
          botName: 'CryptoV4 Bot',
          autoStart: false,
          refreshInterval: 60,
          notificationsEnabled: true,
          soundAlertsEnabled: false
        },
        trading: {
          strategy: 'MACD_CROSSOVER',
          riskLevel: 'medium',
          maxOpenPositions: 5,
          stopLossPercentage: 2.5,
          takeProfitPercentage: 5.0,
          trailingStopEnabled: true,
          trailingStopPercentage: 1.0
        },
        api: {
          apiKeyConfigured: false,
          testnetEnabled: true,
          exchangeType: 'binance'
        },
        ui: {
          defaultView: 'dashboard',
          chartInterval: '1h',
          chartType: 'candlestick',
          showVolume: true,
          darkMode: theme === 'dark'
        }
      });
      setSuccess('Settings reset to defaults.');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><FaCog className="me-2" /> Settings</h2>
            <div>
              <Button 
                variant="outline-secondary" 
                className="me-2" 
                onClick={handleResetDefaults}
                disabled={loading || saving}
              >
                <FaUndo className="me-1" /> Reset Defaults
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveSettings}
                disabled={loading || saving}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-1" /> Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="danger" className="mb-4">
              <FaExclamationTriangle className="me-2" /> {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-4">
              {success}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading settings...</span>
              </Spinner>
              <p className="mt-2">Loading settings...</p>
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              {/* General Settings */}
              <Tab eventKey="general" title="General">
                <Card className="shadow-sm">
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Bot Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={settings.general.botName}
                          onChange={(e) => handleSettingChange('general', 'botName', e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Customize the name of your trading bot
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="auto-start"
                          label="Auto-start trading bot on system startup"
                          checked={settings.general.autoStart}
                          onChange={(e) => handleSettingChange('general', 'autoStart', e.target.checked)}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Data Refresh Interval (seconds)</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="10" 
                          max="3600"
                          value={settings.general.refreshInterval}
                          onChange={(e) => handleSettingChange('general', 'refreshInterval', parseInt(e.target.value))}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="notifications-enabled"
                          label="Enable desktop notifications"
                          checked={settings.general.notificationsEnabled}
                          onChange={(e) => handleSettingChange('general', 'notificationsEnabled', e.target.checked)}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="sound-alerts"
                          label="Enable sound alerts for important events"
                          checked={settings.general.soundAlertsEnabled}
                          onChange={(e) => handleSettingChange('general', 'soundAlertsEnabled', e.target.checked)}
                        />
                      </Form.Group>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>
              
              {/* Trading Settings */}
              <Tab eventKey="trading" title="Trading">
                <Card className="shadow-sm">
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Trading Strategy</Form.Label>
                        <Form.Select 
                          value={settings.trading.strategy}
                          onChange={(e) => handleSettingChange('trading', 'strategy', e.target.value)}
                        >
                          <option value="MACD_CROSSOVER">MACD Crossover</option>
                          <option value="RSI_OVERSOLD">RSI Oversold/Overbought</option>
                          <option value="BOLLINGER_BANDS">Bollinger Bands</option>
                          <option value="TREND_FOLLOWING">Trend Following</option>
                          <option value="SENTIMENT_BASED">Sentiment Based</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Risk Level</Form.Label>
                        <Form.Select 
                          value={settings.trading.riskLevel}
                          onChange={(e) => handleSettingChange('trading', 'riskLevel', e.target.value)}
                        >
                          <option value="low">Low Risk (Conservative)</option>
                          <option value="medium">Medium Risk (Balanced)</option>
                          <option value="high">High Risk (Aggressive)</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Determines position sizing and trading frequency
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Maximum Open Positions</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="1" 
                          max="20"
                          value={settings.trading.maxOpenPositions}
                          onChange={(e) => handleSettingChange('trading', 'maxOpenPositions', parseInt(e.target.value))}
                        />
                      </Form.Group>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Stop Loss (%)</Form.Label>
                            <Form.Control 
                              type="number" 
                              step="0.1"
                              min="0.5" 
                              max="20"
                              value={settings.trading.stopLossPercentage}
                              onChange={(e) => handleSettingChange('trading', 'stopLossPercentage', parseFloat(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Take Profit (%)</Form.Label>
                            <Form.Control 
                              type="number" 
                              step="0.1"
                              min="0.5" 
                              max="50"
                              value={settings.trading.takeProfitPercentage}
                              onChange={(e) => handleSettingChange('trading', 'takeProfitPercentage', parseFloat(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="trailing-stop"
                          label="Enable Trailing Stop"
                          checked={settings.trading.trailingStopEnabled}
                          onChange={(e) => handleSettingChange('trading', 'trailingStopEnabled', e.target.checked)}
                        />
                      </Form.Group>
                      
                      {settings.trading.trailingStopEnabled && (
                        <Form.Group className="mb-3">
                          <Form.Label>Trailing Stop Distance (%)</Form.Label>
                          <Form.Control 
                            type="number" 
                            step="0.1"
                            min="0.1" 
                            max="10"
                            value={settings.trading.trailingStopPercentage}
                            onChange={(e) => handleSettingChange('trading', 'trailingStopPercentage', parseFloat(e.target.value))}
                          />
                        </Form.Group>
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>
              
              {/* API Settings */}
              <Tab eventKey="api" title="API">
                <Card className="shadow-sm">
                  <Card.Body>
                    <Alert variant="info" className="mb-4">
                      <FaLock className="me-2" /> API keys are stored securely and never exposed to the frontend.
                    </Alert>
                    
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Exchange</Form.Label>
                        <Form.Select 
                          value={settings.api.exchangeType}
                          onChange={(e) => handleSettingChange('api', 'exchangeType', e.target.value)}
                        >
                          <option value="binance">Binance</option>
                          <option value="coinbase">Coinbase Pro</option>
                          <option value="kucoin">KuCoin</option>
                          <option value="ftx">FTX</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="testnet-enabled"
                          label="Use Testnet (Paper Trading)"
                          checked={settings.api.testnetEnabled}
                          onChange={(e) => handleSettingChange('api', 'testnetEnabled', e.target.checked)}
                        />
                        <Form.Text className="text-muted">
                          Use test networks for safe practice without real funds
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>API Key</Form.Label>
                        <Form.Control 
                          type="password" 
                          placeholder={settings.api.apiKeyConfigured ? "••••••••••••••••" : "Enter API Key"}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>API Secret</Form.Label>
                        <Form.Control 
                          type="password" 
                          placeholder={settings.api.apiKeyConfigured ? "••••••••••••••••" : "Enter API Secret"}
                        />
                      </Form.Group>
                      
                      <Button variant="primary">Save API Keys</Button>
                      
                      {settings.api.apiKeyConfigured && (
                        <Button variant="danger" className="ms-2">
                          Remove API Keys
                        </Button>
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>
              
              {/* UI Settings */}
              <Tab eventKey="ui" title="UI">
                <Card className="shadow-sm">
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Default View</Form.Label>
                        <Form.Select 
                          value={settings.ui.defaultView}
                          onChange={(e) => handleSettingChange('ui', 'defaultView', e.target.value)}
                        >
                          <option value="dashboard">Dashboard</option>
                          <option value="market">Market</option>
                          <option value="wallet">Wallet</option>
                          <option value="trades">Trades</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Default Chart Interval</Form.Label>
                        <Form.Select 
                          value={settings.ui.chartInterval}
                          onChange={(e) => handleSettingChange('ui', 'chartInterval', e.target.value)}
                        >
                          <option value="1m">1 Minute</option>
                          <option value="5m">5 Minutes</option>
                          <option value="15m">15 Minutes</option>
                          <option value="1h">1 Hour</option>
                          <option value="4h">4 Hours</option>
                          <option value="1d">1 Day</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Chart Type</Form.Label>
                        <Form.Select 
                          value={settings.ui.chartType}
                          onChange={(e) => handleSettingChange('ui', 'chartType', e.target.value)}
                        >
                          <option value="candlestick">Candlestick</option>
                          <option value="line">Line</option>
                          <option value="bar">Bar</option>
                          <option value="area">Area</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="show-volume"
                          label="Show Volume in Charts"
                          checked={settings.ui.showVolume}
                          onChange={(e) => handleSettingChange('ui', 'showVolume', e.target.checked)}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="dark-mode"
                          label="Dark Mode"
                          checked={settings.ui.darkMode}
                          onChange={(e) => handleSettingChange('ui', 'darkMode', e.target.checked)}
                        />
                      </Form.Group>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Settings; 