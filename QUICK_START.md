# CryptoV4 Quick Start Guide

This guide will help you get the CryptoV4 trading system up and running quickly.

## Prerequisites

1. Make sure you have Python 3.8+ installed
2. MongoDB 4.4+ should be installed and running
3. Binance Testnet API credentials (included in the `.env` file)

## Setup Steps

1. **Install Dependencies**

   Open a command prompt and navigate to the project directory:
   ```
   cd C:\Users\PC\Documents\github\CryptoV4
   ```

   Install the required packages:
   ```
   pip install -r requirements.txt
   ```

2. **Verify MongoDB**

   Make sure MongoDB is running. You can start it with:
   ```
   mongod
   ```

3. **Start the Trading System**

   Run the trading system in test mode first to verify everything works:
   ```
   python main.py --test
   ```

   This will run the system without executing actual trades. You should see:
   - Status updates with account balances
   - Market data from Binance
   - Sentiment analysis results
   - Trading signals

4. **Start the Dashboard**

   In a separate command prompt, start the web dashboard:
   ```
   python app/dashboard.py
   ```

   Then open your browser and go to:
   ```
   http://localhost:5000
   ```

   The dashboard will show:
   - Current account status
   - Market data and sentiment
   - Recent trades and news
   - Performance charts

5. **Run in Production Mode**

   When you're ready to execute real trades (on Testnet), run:
   ```
   python main.py
   ```

   Or simply double-click the `start_trading.bat` file.

## Troubleshooting

- **MongoDB Connection Issues**: Make sure MongoDB is running on port 27017
- **Binance API Errors**: Verify your API keys in the `.env` file
- **Import Errors**: Make sure all dependencies are installed correctly

## Next Steps

- Adjust trading parameters in `config.py`
- Monitor the system performance through the dashboard
- Check logs in `trading_log.txt` for detailed information

For more detailed information, refer to the full `README.md`. 