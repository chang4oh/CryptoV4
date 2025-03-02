import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ButtonGroup, ToggleButton, Card } from 'react-bootstrap';
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

// Register ChartJS components
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

const PerformanceChart = ({ performance, isLoading }) => {
  // Default/placeholder values
  const performanceData = performance || {
    dates: [],
    portfolio_values: [],
    trade_counts: [],
    roi_percentages: []
  };
  
  // Chart type options
  const chartTypes = [
    { name: 'Portfolio Value', value: 'portfolio', key: 'portfolio_values' },
    { name: 'ROI %', value: 'roi', key: 'roi_percentages' },
    { name: 'Trade Count', value: 'trades', key: 'trade_counts' }
  ];
  
  // State for chart type
  const [chartType, setChartType] = useState('portfolio');
  
  // Get current chart configuration based on selected type
  const getCurrentChartConfig = () => {
    const selectedType = chartTypes.find(type => type.value === chartType);
    if (!selectedType) return chartTypes[0];
    return selectedType;
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    const currentConfig = getCurrentChartConfig();
    const dataKey = currentConfig.key;
    
    // Format dates for display
    const formattedDates = performanceData.dates.map(date => {
      try {
        return new Date(date).toLocaleDateString();
      } catch (e) {
        return date;
      }
    });
    
    return {
      labels: formattedDates,
      datasets: [
        {
          label: currentConfig.name,
          data: performanceData[dataKey],
          borderColor: chartType === 'roi' ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 1)',
          backgroundColor: chartType === 'roi' 
            ? 'rgba(75, 192, 192, 0.2)' 
            : 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    };
  };
  
  // Chart options
  const getChartOptions = () => {
    const currentConfig = getCurrentChartConfig();
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              
              if (chartType === 'portfolio') {
                label += '$' + Number(context.parsed.y).toLocaleString();
              } else if (chartType === 'roi') {
                label += Number(context.parsed.y).toFixed(2) + '%';
              } else {
                label += Number(context.parsed.y).toLocaleString();
              }
              
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: chartType === 'trades',
          ticks: {
            callback: function(value) {
              if (chartType === 'portfolio') {
                return '$' + Number(value).toLocaleString();
              } else if (chartType === 'roi') {
                return value + '%';
              }
              return value;
            }
          }
        }
      }
    };
  };
  
  // Calculate performance metrics
  const calculateMetrics = () => {
    const portfolioValues = performanceData.portfolio_values || [];
    const roiPercentages = performanceData.roi_percentages || [];
    
    if (portfolioValues.length === 0) return { startValue: 0, currentValue: 0, changePercent: 0 };
    
    const startValue = portfolioValues[0] || 0;
    const currentValue = portfolioValues[portfolioValues.length - 1] || 0;
    const changePercent = roiPercentages[roiPercentages.length - 1] || 0;
    
    return { startValue, currentValue, changePercent };
  };
  
  const metrics = calculateMetrics();
  const isPositiveChange = metrics.changePercent >= 0;

  return (
    <div className="performance-chart">
      {isLoading ? (
        <p className="text-center">Loading performance data...</p>
      ) : (
        <>
          <div className="chart-controls mb-3">
            <ButtonGroup className="w-100">
              {chartTypes.map((type) => (
                <ToggleButton
                  key={type.value}
                  id={`chart-type-${type.value}`}
                  type="radio"
                  variant="outline-primary"
                  name="chart-type"
                  value={type.value}
                  checked={chartType === type.value}
                  onChange={(e) => setChartType(e.currentTarget.value)}
                >
                  {type.name}
                </ToggleButton>
              ))}
            </ButtonGroup>
          </div>
          
          <div className="performance-summary mb-3">
            <Card className="bg-light">
              <Card.Body className="p-2">
                <div className="d-flex justify-content-around">
                  <div className="text-center">
                    <div className="text-muted small">Starting Value</div>
                    <div className="fw-bold">${Number(metrics.startValue).toLocaleString()}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-muted small">Current Value</div>
                    <div className="fw-bold">${Number(metrics.currentValue).toLocaleString()}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-muted small">Change</div>
                    <div className={`fw-bold ${isPositiveChange ? 'text-success' : 'text-danger'}`}>
                      {isPositiveChange ? '+' : ''}{metrics.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
          
          <div className="chart-container" style={{ height: '300px' }}>
            <Line data={prepareChartData()} options={getChartOptions()} />
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceChart; 