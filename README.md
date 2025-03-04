# CryptoV4 Trading Bot

A sophisticated cryptocurrency trading bot with real-time market data analysis, sentiment tracking, and automated trading capabilities.

## Project Structure

```
CryptoV4/
├── app/
│   ├── frontend/      # React frontend for monitoring
│   ├── backend/       # Flask API for bot control
│   ├── trading/       # Trading algorithms
│   ├── data/          # Data processing
│   └── sentiment/     # Sentiment analysis
├── scripts/           # Utility scripts
├── .env               # Consolidated environment variables
├── requirements.txt   # Python dependencies
└── README.md          # This file
```

## Key Features

- **Automated Trading**: Configure strategies and let the bot execute trades
- **Real-time Data Analysis**: Monitor market data with visualization tools
- **Sentiment Analysis**: Track market sentiment from news and social media
- **Configuration UI**: Easy-to-use interface for bot configuration
- **Performance Tracking**: Detailed statistics on bot performance
- **Backtesting**: Test strategies against historical data

## Quick Start Guide

### Prerequisites

1. Make sure you have Python 3.8+ installed
2. MongoDB 4.4+ should be installed and running
3. Binance Testnet API credentials

### Setup Steps

1. **Install Dependencies**

   Open a command prompt and navigate to the project directory:
   ```bash
   cd /path/to/CryptoV4
   pip install -r requirements.txt
   ```

2. **Configure Environment**

   Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```

   Configure your environment variables in the `.env` file:
   - API keys for exchanges
   - Strategy parameters
   - Database configuration
   - UI preferences

3. **Start the Backend Server**

   ```bash
   cd /path/to/CryptoV4
   python -m app.backend.main
   ```

4. **Start the Frontend Development Server**

   ```bash
   cd /path/to/CryptoV4/app/frontend
   npm install
   npm run dev
   ```

   The application will be available at http://localhost:3000 by default.

5. **Run in Test Mode First**

   You can run the trading system in test mode to verify everything works:
   ```bash
   python main.py --test
   ```

   This will run the system without executing actual trades. You should see:
   - Status updates with account balances
   - Market data from Binance
   - Sentiment analysis results
   - Trading signals

## System Requirements & Setup Details

### MongoDB Configuration
The project uses MongoDB as its primary database with three main collections:

1. **market_data**: Stores cryptocurrency price and volume data
2. **sentiment_data**: Stores sentiment analysis results
3. **trading_history**: Records all trading actions

Each collection has appropriate indexes for optimized queries.

### Binance API Configuration
The project uses Binance API for market data and trading:
- API Key: [Configured in .env]
- Secret Key: [Configured in .env]
- Permissions: TRADE, USER_DATA, USER_STREAM

## Authentication Note

This project has been streamlined by removing the authentication system to focus on the core trading functionality. If you need user authentication, you'll need to implement it separately.

## Trading Bot Operation

The trading bot can be controlled via:

1. **Web UI**: Use the dashboard to start/stop and configure the bot
2. **API**: Use direct API calls to control bot operation
3. **Command Line**: Use utility scripts in the `scripts` directory

## Configuration Options

### Strategies

- MACD Crossover
- RSI Oversold/Overbought
- Bollinger Band Breakout
- Moving Average Cross
- Custom strategy via plugin architecture

### Risk Management

- Position sizing based on account percentage
- Stop-loss and take-profit settings
- Maximum number of concurrent positions
- Maximum drawdown protection

## Monitoring

The dashboard provides real-time monitoring of:

- Active trading bot status
- Open positions
- Recent trades
- Account balance
- Performance metrics
- Market conditions

## Deployment

### Prerequisites
- A Vercel account
- Git repository with your CryptoV4 project

### Steps for Deploying to Vercel

1. **Push your code to a Git repository**
   - GitHub, GitLab, or Bitbucket

2. **Create a new project in Vercel**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import your Git repository

3. **Configure the project**
   - Set the framework preset to "Create React App"
   - Configure environment variables
   - Set the root directory to "app/frontend" if needed

4. **Deploy**
   - Click "Deploy"
   - Wait for the build process to complete

5. **Verify the deployment**
   - Click on the generated URL
   - Test the dashboard functionality
   - Check console for any errors

6. **Set up custom domain (optional)**
   - Go to "Domains" section in your project settings
   - Add your domain
   - Configure DNS settings as instructed

7. **Monitor and maintain**
   - Set up analytics to monitor your dashboard's performance
   - Configure automatic deployments for future updates

## Troubleshooting

Common issues:

1. **Connection errors**: 
   - Check your API keys and network connection
   - Verify MongoDB is running on the correct port
   - Check for firewall issues

2. **Strategy failures**: 
   - Review logs in the `/logs` directory
   - Verify the strategy parameters in settings
   - Ensure market data is being received properly

3. **Performance issues**: 
   - Adjust the refresh intervals in settings
   - Check system resource usage
   - Consider upgrading your hosting plan if deployed

4. **MongoDB Connection Issues**: 
   - Make sure MongoDB is running on port 27017
   - Check authentication requirements
   - Verify database permissions

5. **Binance API Errors**: 
   - Verify your API keys in the `.env` file
   - Check Binance service status
   - Ensure API permissions are set correctly

6. **Import Errors**: 
   - Make sure all dependencies are installed correctly
   - Check for version conflicts
   - Verify Python/Node.js version compatibility

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please ensure your code follows the project's style guidelines and includes appropriate tests. 