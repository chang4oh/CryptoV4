# CryptoV4 Trading System

## Overview
CryptoV4 is an advanced cryptocurrency trading system that combines real-time market data from Binance with sentiment analysis to make informed trading decisions. The system uses MongoDB for data storage and implements a sophisticated trading strategy based on both technical and sentiment indicators.

## Features
- Real-time cryptocurrency price data collection from Binance
- Sentiment analysis integration
- Automated trading execution
- Historical trade tracking
- Market data storage and analysis

## Quick Start

### Prerequisites
1. Install MongoDB 8.0.5
2. Python 3.x
3. Binance API access (Testnet for development)

### Installation
1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd CryptoV4
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file with:
   ```
   MONGODB_URI=mongodb://localhost:27017/
   BINANCE_API_KEY=your_api_key
   BINANCE_SECRET_KEY=your_secret_key
   ```

5. Initialize the database:
   ```bash
   python app/models/init_db.py
   ```

### Testing
Verify the setup:
```bash
python app/models/test_connection.py
```

## Project Structure
```
CryptoV4/
├── app/
│   ├── models/           # Database models and initialization
│   ├── trading/         # Trading logic (coming soon)
│   └── sentiment/       # Sentiment analysis (coming soon)
├── docs/               # Documentation
├── tests/             # Test suite
└── README.md
```

## Documentation
Detailed documentation can be found in the `docs/` directory:
- [Setup Guide](docs/setup.md)

## Current Status
- ✅ Database setup complete
- ✅ MongoDB integration
- ⏳ Binance API integration (in progress)
- 📋 Sentiment analysis (planned)
- 📋 Trading logic (planned)

## License
[Your License]

## Contributing
[Your Contributing Guidelines] 