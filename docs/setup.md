# CryptoV4 Project Documentation

## Project Overview
CryptoV4 is a cryptocurrency trading system that integrates real-time market data from Binance with sentiment analysis to make informed trading decisions.

## System Requirements
- Python 3.x
- MongoDB 8.0.5
- Binance API access
- Required Python packages (see requirements.txt)

## Environment Setup

### MongoDB Configuration
The project uses MongoDB 8.0.5 as its primary database. The database is configured with three main collections:

1. **market_data**
   - Stores cryptocurrency price and volume data
   - Schema:
     ```json
     {
       "symbol": "string",
       "timestamp": "date",
       "open": "double",
       "high": "double",
       "low": "double",
       "close": "double",
       "volume": "double"
     }
     ```
   - Unique index on `[symbol, timestamp]`

2. **sentiment_data**
   - Stores sentiment analysis results
   - Schema:
     ```json
     {
       "symbol": "string",
       "timestamp": "date",
       "sentiment_score": "double",
       "source": "string",
       "text": "string"
     }
     ```
   - Index on `[symbol, timestamp]`

3. **trading_history**
   - Records all trading actions
   - Schema:
     ```json
     {
       "symbol": "string",
       "timestamp": "date",
       "action": ["BUY", "SELL"],
       "price": "double",
       "quantity": "double",
       "total": "double"
     }
     ```
   - Index on `[symbol, timestamp]`

### Binance API Configuration
The project uses Binance Testnet for development and testing:
- API Key: [Configured in .env]
- Secret Key: [Configured in .env]
- Permissions: TRADE, USER_DATA, USER_STREAM

## Project Structure
```
CryptoV4/
├── app/
│   ├── models/
│   │   ├── init_db.py      # Database initialization
│   │   └── test_connection.py  # Database connection testing
├── docs/
│   └── setup.md           # This documentation
├── tests/
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
└── requirements.txt       # Python dependencies
```

## Environment Variables
Required environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key
```

## Database Initialization
To initialize the database:
1. Ensure MongoDB is running
2. Run:
   ```bash
   python app/models/init_db.py
   ```

## Testing Database Connection
To verify database setup:
1. Run:
   ```bash
   python app/models/test_connection.py
   ```
2. Successful output should show:
   - Test data insertion
   - Data retrieval verification
   - List of available collections

## Next Steps
1. Implement market data collection from Binance
2. Set up sentiment analysis system
3. Develop trading logic
4. Create monitoring and reporting system 