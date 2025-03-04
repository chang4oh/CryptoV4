import React, { useState, useEffect, useCallback } from 'react';
import { Card, ButtonGroup, Button, Spinner, Row, Col, Form } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { api } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PerformanceChart = () => {
  // State variables
  const [performanceData, setPerformanceData] = useState(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState('balance'); // 'balance', 'profit', 'trades'
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [benchmark, setBenchmark] = useState('BTCUSDT');

  // Prepare theme colors for chart
  const isDarkMode = document.body.classList.contains('dark-mode');
  const chartTheme = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: isDarkMode ? '#e0e0e0' : '#666',
    line: isDarkMode ? '#8884d8' : '#3f51b5',
    fill: isDarkMode ? 'rgba(136, 132, 216, 0.2)' : 'rgba(63, 81, 181, 0.2)',
    profit: isDarkMode ? '#4caf50' : '#00c853',
    loss: isDarkMode ? '#f44336' : '#ff1744',
    benchmark: isDarkMode ? '#ff9800' : '#ff9800'
  };

  // Available timeframes
  const timeframes = [
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '1 Week' },
    { value: '1m', label: '1 Month' },
    { value: '3m', label: '3 Months' },
    { value: '1y', label: 'Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Available benchmarks
  const benchmarks = [
    { value: 'BTCUSDT', label: 'Bitcoin' },
    { value: 'ETHUSDT', label: 'Ethereum' },
    { value: 'SPY', label: 'S&P 500 (SPY)' },
    { value: 'DJI', label: 'Dow Jones' }
  ];

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch performance data
      const data = await api.getPerformanceData(timeframe);
      
      if (comparisonEnabled) {
        // Fetch comparison data
        const benchmarkData = await api.getMarketData([benchmark]);
        
        // Combine both datasets
        if (benchmarkData && benchmarkData[benchmark]) {
          data.benchmark = {
            symbol: benchmark,
            data: benchmarkData[benchmark]
          };
        }
      }
      
      setPerformanceData(data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, comparisonEnabled, benchmark]);

  // Load data and set up refresh
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Prepare chart data based on view
  const prepareChartData = () => {
    if (!performanceData) return null;
    
    const { balance_history, profit_history, trade_history, benchmark } = performanceData;
    
    switch (chartView) {
      case 'balance':
        if (!balance_history || !balance_history.timestamps) return null;
        
        return {
          labels: balance_history.timestamps.map(ts => new Date(ts).toLocaleDateString()),
          datasets: [
            {
              label: 'Account Balance (USDT)',
              data: balance_history.values,
              borderColor: chartTheme.line,
              backgroundColor: chartTheme.fill,
              tension: 0.2,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 5
            },
            ...(benchmark ? [{
              label: `${benchmark.symbol} Performance`,
              data: benchmark.data.map((point, index) => {
                // Normalize to starting balance
                const firstBalance = balance_history.values[0];
                const firstBenchmark = benchmark.data[0];
                return firstBalance * (point / firstBenchmark);
              }),
              borderColor: chartTheme.benchmark,
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.2,
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 5
            }] : [])
          ]
        };
      
      case 'profit':
        if (!profit_history || !profit_history.timestamps) return null;
        
        return {
          labels: profit_history.timestamps.map(ts => new Date(ts).toLocaleDateString()),
          datasets: [
            {
              label: 'Cumulative Profit/Loss (USDT)',
              data: profit_history.values,
              borderColor: chartTheme.line,
              backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                
                // Create gradient based on profit/loss
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, 'rgba(0, 200, 83, 0.1)');
                gradient.addColorStop(1, 'rgba(244, 67, 54, 0.1)');
                return gradient;
              },
              tension: 0.2,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 5
            }
          ]
        };
      
      case 'trades':
        if (!trade_history || !trade_history.timestamps) return null;
        
        // Group trades by day
        const tradeCounts = {};
        const profitByDay = {};
        
        trade_history.timestamps.forEach((ts, index) => {
          const date = new Date(ts).toLocaleDateString();
          tradeCounts[date] = (tradeCounts[date] || 0) + 1;
          profitByDay[date] = (profitByDay[date] || 0) + trade_history.profits[index];
        });
        
        const labels = Object.keys(tradeCounts).sort((a, b) => new Date(a) - new Date(b));
        
        return {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'Trade Count',
              data: labels.map(date => tradeCounts[date]),
              backgroundColor: chartTheme.line,
              yAxisID: 'y',
              order: 2
            },
            {
              type: 'line',
              label: 'Profit/Loss per Day',
              data: labels.map(date => profitByDay[date]),
              borderColor: (context) => {
                const index = context.dataIndex;
                const value = context.dataset.data[index];
                return value >= 0 ? chartTheme.profit : chartTheme.loss;
              },
              pointBackgroundColor: (context) => {
                const index = context.dataIndex;
                const value = context.dataset.data[index];
                return value >= 0 ? chartTheme.profit : chartTheme.loss;
              },
              yAxisID: 'y1',
              tension: 0.1,
              pointRadius: 4,
              order: 1
            }
          ]
        };
      
      default:
        return null;
    }
  };

  // Get chart options based on view
  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: chartTheme.text
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              if (value === undefined) return '';
              
              return `${context.dataset.label}: ${
                chartView === 'trades' && context.dataset.type !== 'bar'
                  ? (value >= 0 ? '+' : '') + formatCurrency(value)
                  : chartView === 'trades' ? value : formatCurrency(value)
              }`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: chartTheme.grid,
            drawBorder: false,
          },
          ticks: {
            color: chartTheme.text,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        },
        y: {
          grid: {
            color: chartTheme.grid,
            drawBorder: false,
          },
          ticks: {
            color: chartTheme.text,
            callback: function(value) {
              return chartView === 'trades' ? value : formatCurrency(value);
            }
          }
        }
      }
    };
    
    // Special configuration for trades view with dual axis
    if (chartView === 'trades') {
      baseOptions.scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: chartTheme.text,
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      };
    }
    
    return baseOptions;
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (!performanceData) return {};
    
    const { balance_history, profit_history, trade_history } = performanceData;
    
    // No data
    if (!balance_history || !profit_history || !trade_history) {
      return {
        totalProfit: 0,
        profitPercent: 0,
        winRate: 0,
        tradesCount: 0,
        avgProfit: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }
    
    // Calculate metrics
    const startBalance = balance_history.values[0] || 0;
    const currentBalance = balance_history.values[balance_history.values.length - 1] || 0;
    const totalProfit = currentBalance - startBalance;
    const profitPercent = startBalance ? (totalProfit / startBalance) * 100 : 0;
    
    // Trade metrics
    const trades = trade_history.profits || [];
    const tradesCount = trades.length;
    const winningTrades = trades.filter(profit => profit > 0).length;
    const winRate = tradesCount ? (winningTrades / tradesCount) * 100 : 0;
    const avgProfit = tradesCount ? totalProfit / tradesCount : 0;
    const bestTrade = Math.max(...trades, 0);
    const worstTrade = Math.min(...trades, 0);
    
    return {
      totalProfit,
      profitPercent,
      winRate,
      tradesCount,
      avgProfit,
      bestTrade,
      worstTrade
    };
  };

  // Render performance metrics
  const renderMetrics = () => {
    const metrics = getPerformanceMetrics();
    
    return (
      <Row className="mt-3 performance-metrics text-center">
        <Col xs={6} md={3} className="mb-3">
          <div className="metric-card p-2">
            <div className="text-muted small">Total P/L</div>
            <div className={`fs-5 fw-bold ${metrics.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(metrics.totalProfit)}
              <small className="ms-1">({metrics.profitPercent.toFixed(2)}%)</small>
            </div>
          </div>
        </Col>
        <Col xs={6} md={3} className="mb-3">
          <div className="metric-card p-2">
            <div className="text-muted small">Win Rate</div>
            <div className="fs-5 fw-bold">
              {metrics.winRate.toFixed(1)}%
              <small className="ms-1 text-muted">({metrics.tradesCount} trades)</small>
            </div>
          </div>
        </Col>
        <Col xs={6} md={3} className="mb-3">
          <div className="metric-card p-2">
            <div className="text-muted small">Best Trade</div>
            <div className="fs-5 fw-bold text-success">
              {formatCurrency(metrics.bestTrade)}
            </div>
          </div>
        </Col>
        <Col xs={6} md={3} className="mb-3">
          <div className="metric-card p-2">
            <div className="text-muted small">Worst Trade</div>
            <div className="fs-5 fw-bold text-danger">
              {formatCurrency(metrics.worstTrade)}
            </div>
          </div>
        </Col>
      </Row>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Performance</h5>
        <Button 
          variant="outline-secondary" 
          size="sm"
          onClick={fetchPerformanceData}
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
        </Button>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={5}>
            <Form.Group>
              <Form.Label>Timeframe</Form.Label>
              <Form.Select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={loading}
              >
                {timeframes.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Compare with</Form.Label>
              <Form.Select 
                value={benchmark} 
                onChange={(e) => setBenchmark(e.target.value)}
                disabled={loading || !comparisonEnabled}
              >
                {benchmarks.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className="d-flex align-items-end">
            <Form.Check
              type="switch"
              id="comparison-switch"
              label="Show comparison"
              checked={comparisonEnabled}
              onChange={() => setComparisonEnabled(!comparisonEnabled)}
              disabled={loading}
              className="mb-2"
            />
          </Col>
        </Row>
        
        <div className="chart-controls text-center mb-3">
          <ButtonGroup>
            <Button
              variant={chartView === 'balance' ? 'primary' : 'outline-primary'}
              onClick={() => setChartView('balance')}
              disabled={loading}
            >
              Balance
            </Button>
            <Button
              variant={chartView === 'profit' ? 'primary' : 'outline-primary'}
              onClick={() => setChartView('profit')}
              disabled={loading}
            >
              Profit/Loss
            </Button>
            <Button
              variant={chartView === 'trades' ? 'primary' : 'outline-primary'}
              onClick={() => setChartView('trades')}
              disabled={loading}
            >
              Trades
            </Button>
          </ButtonGroup>
        </div>
        
        {error ? (
          <div className="text-center py-5">
            <p className="text-danger">{error}</p>
            <Button variant="primary" onClick={fetchPerformanceData}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading performance data...</p>
          </div>
        ) : !performanceData ? (
          <div className="text-center py-5">
            <p>No performance data available.</p>
          </div>
        ) : (
          <>
            <div style={{ height: '300px' }}>
              {prepareChartData() && (
                <Line
                  data={prepareChartData()}
                  options={getChartOptions()}
                />
              )}
            </div>
            
            {renderMetrics()}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default PerformanceChart; 