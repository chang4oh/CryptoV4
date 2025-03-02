# CryptoV4 Trading Dashboard

A modern, responsive dashboard for monitoring cryptocurrency trading activities, built with Vite and React.

## Features

- **Real-time data** for trading status, account balances, and market information
- **Sentiment analysis visualization** from cryptocurrency news
- **Interactive charts** for performance monitoring
- **Recent trades table** showing trading history
- **Responsive design** works on desktop and mobile

## Setup

### Prerequisites

- Node.js 16+ installed
- MongoDB running
- Flask API backend running

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables (if needed):
   Create a `.env` file in the `app/frontend` directory:
   ```
   VITE_API_URL=http://localhost:5000
   ```

### Development

Run the development server:
```
npm run dev
```

The dashboard will be available at [http://localhost:5173](http://localhost:5173)

### Building for Production

Create a production build:
```
npm run build
```

The build artifacts will be in the `dist` directory.

## API Integration

The dashboard connects to the following API endpoints:

- `/api/trading_status` - Current trading status
- `/api/performance` - Trading performance metrics
- `/api/sentiment` - Latest sentiment data
- `/api/recent_trades` - Recent trading activity
- `/api/account_info` - Account balance information

## Dashboard Components

- **Account Status**: Shows USDT and BTC balances
- **Market Data**: Displays current price and 24h change
- **Trading Signals**: Shows current signal based on sentiment and price action
- **Recent Trades**: Lists recent trades with details
- **News & Sentiment**: Shows recent news items with sentiment analysis
- **Performance Chart**: Visualizes trading performance over time

## Project Structure

```
app/frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── services/      # API and service integrations
│   ├── hooks/         # Custom React hooks
│   ├── App.jsx        # Main application component
│   └── main.jsx       # Application entry point
└── package.json       # Dependencies and scripts
```

## Troubleshooting

- **API Connection Issues**: Make sure the Flask API is running on port 5000
- **MongoDB Connection**: Ensure MongoDB is running and accessible
- **Node.js Errors**: Check Node.js version (16+ recommended)

## License

MIT
