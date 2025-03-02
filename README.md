# CryptoV4 Trading System

A sentiment-based cryptocurrency trading system that uses news sentiment analysis and market data to generate trading signals.

## Features

- **Sentiment Analysis**: Analyzes cryptocurrency news to determine market sentiment
- **Market Data**: Collects and analyzes market data from Binance
- **Trading Logic**: Combines sentiment and market data to generate trading signals
- **Trade Execution**: Executes trades on Binance Testnet
- **MongoDB Integration**: Stores all data and trading history in MongoDB

## Requirements

- Python 3.8+
- MongoDB 4.4+
- Binance Testnet API credentials

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables in `.env` file:
   ```
   BINANCE_API_KEY=your_api_key
   BINANCE_SECRET_KEY=your_secret_key
   MONGODB_URI=mongodb://localhost:27017/
   CRYPTOCOMPARE_API_KEY=your_api_key (optional)
   ```
4. Make sure MongoDB is running

## Usage

### Quick Start

Run the trading system with default settings:
```
start_trading.bat
```

### Command Line Options

Run the trading system with custom settings:
```
python main.py --interval 600 --test
```

Options:
- `--interval`: Time between trading cycles in seconds (default: 300)
- `--test`: Run in test mode (generate signals but don't execute trades)

### Configuration

Adjust trading parameters in `config.py`:
- Trading pair
- Position size
- Stop loss percentage
- Sentiment threshold
- Price trend threshold
- Trading interval

## Components

- **NewsCollector**: Collects and analyzes news sentiment
- **MarketDataCollector**: Collects market data from Binance
- **TradeExecutor**: Executes trades on Binance
- **SentimentTrader**: Main trading logic

## Logs

Trading logs are stored in `trading_log.txt`

## License

MIT 