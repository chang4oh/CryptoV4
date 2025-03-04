import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useKlineStream, useTickerStream } from '../services/websocketService';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import './RealTimeComponents.css';

/**
 * RealTimeChart component for displaying live trading data
 * Uses WebSocket connections to Binance for real-time updates
 */
const RealTimeChart = ({ defaultSymbol = 'btcusdt', defaultInterval = '1m' }) => {
  // State for user selections
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [interval, setInterval] = useState(defaultInterval);
  const [pendingSymbol, setPendingSymbol] = useState(defaultSymbol);
  const [pendingInterval, setPendingInterval] = useState(defaultInterval);
  
  // Get real-time data from WebSocket
  const [klineData, klineLoading, klineError] = useKlineStream(symbol, interval);
  const [tickerData, tickerLoading, tickerError] = useTickerStream(symbol);
  
  // Chart reference
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Price data for the chart
  const [priceData, setPriceData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Price',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  });
  
  // Initialize chart
  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // Create new chart
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: priceData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 0 // Disable animation for better performance with real-time data
          },
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 10,
                maxRotation: 0,
                minRotation: 0
              },
              grid: {
                display: false
              }
            },
            y: {
              position: 'right',
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return `$${context.raw.toFixed(2)}`;
                }
              }
            },
            legend: {
              display: false
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);
  
  // Update chart with new kline data
  useEffect(() => {
    if (klineData && chartInstance.current) {
      // Extract kline data
      const k = klineData.k;
      
      if (k) {
        const time = new Date(k.t);
        const price = parseFloat(k.c);
        
        setPriceData(prevData => {
          // Create copies of previous data
          const newLabels = [...prevData.labels];
          const newPrices = [...prevData.datasets[0].data];
          
          // Add new data point
          newLabels.push(format(time, 'HH:mm:ss'));
          newPrices.push(price);
          
          // Keep only the last 100 data points
          if (newLabels.length > 100) {
            newLabels.shift();
            newPrices.shift();
          }
          
          // Update chart with new data
          if (chartInstance.current) {
            chartInstance.current.data.labels = newLabels;
            chartInstance.current.data.datasets[0].data = newPrices;
            chartInstance.current.update('none'); // Update without animation
          }
          
          return {
            labels: newLabels,
            datasets: [
              {
                ...prevData.datasets[0],
                data: newPrices
              }
            ]
          };
        });
      }
    }
  }, [klineData]);
  
  // Handle form submission to change symbol/interval
  const handleSubmit = (e) => {
    e.preventDefault();
    setSymbol(pendingSymbol.toLowerCase());
    setInterval(pendingInterval);
    
    // Reset chart data
    setPriceData({
      labels: [],
      datasets: [
        {
          ...priceData.datasets[0],
          data: []
        }
      ]
    });
  };
  
  // Format price change (positive/negative)
  const formatPriceChange = (change) => {
    const num = parseFloat(change);
    return num > 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
  };
  
  // Determine color based on price change
  const getPriceChangeColor = (change) => {
    const num = parseFloat(change);
    return num >= 0 ? 'text-success' : 'text-danger';
  };
  
  // Show error message if there is an error
  if (klineError || tickerError) {
    return (
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Real-Time Price Chart</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger">
            {klineError || tickerError}
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Real-Time Price Chart</h5>
        <div className="d-flex align-items-center">
          <span className="me-2">
            {symbol.toUpperCase()}/{interval}
          </span>
          {(klineLoading || tickerLoading) && (
            <Spinner animation="border" variant="light" size="sm" />
          )}
        </div>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <Form onSubmit={handleSubmit} className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Symbol (e.g. btcusdt)"
              value={pendingSymbol}
              onChange={(e) => setPendingSymbol(e.target.value)}
              size="sm"
              className="w-50"
            />
            <Form.Select
              value={pendingInterval}
              onChange={(e) => setPendingInterval(e.target.value)}
              size="sm"
              className="w-25"
            >
              <option value="1m">1m</option>
              <option value="3m">3m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="1h">1h</option>
              <option value="2h">2h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </Form.Select>
            <Button type="submit" variant="primary" size="sm">
              Update
            </Button>
          </Form>
        </div>
        
        {tickerData && (
          <div className="d-flex justify-content-between mb-3">
            <div className="stats">
              <div className="fw-bold">{tickerData.s}</div>
              <div className="fs-4">
                ${parseFloat(tickerData.c).toFixed(2)}
                <span className={`ms-2 fs-6 ${getPriceChangeColor(tickerData.p)}`}>
                  {formatPriceChange(tickerData.P)}
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="text-muted">24h High/Low</div>
              <div>
                ${parseFloat(tickerData.h).toFixed(2)} / ${parseFloat(tickerData.l).toFixed(2)}
              </div>
            </div>
            <div className="text-end">
              <div className="text-muted">24h Volume</div>
              <div>
                {parseFloat(tickerData.v).toFixed(2)} {symbol.substr(0, symbol.length - 4).toUpperCase()}
              </div>
            </div>
          </div>
        )}
        
        <div style={{ height: '300px' }}>
          <canvas ref={chartRef}></canvas>
        </div>
        
        {klineLoading && !klineData && (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Connecting to WebSocket...</span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RealTimeChart; 