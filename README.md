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

## Environment Setup

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in the `.env` file:
   - API keys for exchanges
   - Strategy parameters
   - Database configuration
   - UI preferences

## Authentication Note

This project has been streamlined by removing the authentication system to focus on the core trading functionality. If you need user authentication, you'll need to implement it separately.

## Starting the Application

### Backend Server

```bash
cd /path/to/CryptoV4
python -m app.backend.main
```

### Frontend Development Server

```bash
cd /path/to/CryptoV4/app/frontend
npm install
npm run dev
```

The application will be available at http://localhost:3000 by default.

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

## API Documentation

API endpoints are available at `/api/docs` when running the backend server.

## Troubleshooting

Common issues:

1. **Connection errors**: Check your API keys and network connection
2. **Strategy failures**: Review logs in the `/logs` directory
3. **Performance issues**: Adjust the refresh intervals in settings

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 