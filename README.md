# CryptoV4 Trading System

A cryptocurrency trading system that combines real-time market data with sentiment analysis to generate trading signals.

## Features

- **Sentiment Analysis**
  - Real-time news collection from CryptoCompare
  - Sentiment analysis using TextBlob (extensible to VADER or LLM models)
  - Support for major cryptocurrencies (BTC, ETH, BNB, XRP, ADA, SOL, DOT)
  - Automated cryptocurrency symbol detection from news

- **Data Storage**
  - MongoDB integration with schema validation
  - Three main collections:
    - `sentiment_data`: News and sentiment analysis
    - `market_data`: Cryptocurrency price data
    - `trading_history`: Trading records
  - Efficient indexing for quick data retrieval

- **Trading System**
  - Sentiment-based trading signals
  - Risk management with position sizing
  - Stop-loss implementation
  - Binance Testnet integration

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CryptoV4.git
cd CryptoV4
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```env
# Binance API Keys (Testnet)
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key

# CryptoCompare API Key
CRYPTOCOMPARE_API_KEY=your_api_key

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
```

4. Install and start MongoDB:
```bash
# Windows (using winget)
winget install MongoDB.Server
net start MongoDB
```

## Project Structure

```
CryptoV4/
├── app/
│   ├── data/
│   │   ├── news_collector.py   # News and sentiment collection
│   │   └── market_data.py      # Price data collection
│   ├── trading/
│   │   ├── sentiment_trader.py # Trading logic
│   │   └── risk_manager.py     # Risk management
│   └── models/
│       └── init_db.py          # Database initialization
├── tests/
│   └── test_trading_system.py  # System tests
├── .env                        # Environment variables
└── README.md                   # This file
```

## Usage

1. Initialize the database:
```bash
python app/models/init_db.py
```

2. Collect and analyze news:
```bash
python app/data/news_collector.py
```

3. Start the trading system:
```bash
python app/trading/sentiment_trader.py
```

## Sentiment Analysis

The `sentiment_trader.py` script leverages the `NewsCollector` class (from `/app/data/news_collector.py`) to perform sentiment analysis on cryptocurrency news. Currently, it uses the TextBlob model for basic sentiment analysis, providing polarity scores (-1 to 1) and subjectivity measures (0 to 1). The modular design allows for easy replacement with more sophisticated models like VADER (Valence Aware Dictionary and sEntiment Reasoner) or advanced LLM models for improved sentiment accuracy.

## Database Schema

### Sentiment Data Collection
- `symbol`: Cryptocurrency symbol (e.g., BTC, ETH)
- `timestamp`: News publication time
- `sentiment_score`: Sentiment analysis score (-1 to 1)
- `source`: News source
- `title`: News title
- Additional fields: body, URL, categories, tags

### Market Data Collection
- `symbol`: Cryptocurrency symbol
- `timestamp`: Data timestamp
- `price`: Current price
- `volume`: Trading volume
- Additional market metrics

### Trading History Collection
- `symbol`: Cryptocurrency symbol
- `timestamp`: Trade timestamp
- `type`: Order type (buy/sell)
- `price`: Execution price
- `size`: Position size
- `status`: Order status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- CryptoCompare API for real-time news data
- Binance Testnet for trading functionality
- TextBlob for sentiment analysis 