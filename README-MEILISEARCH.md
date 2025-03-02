# CryptoV4 with MeiliSearch on Vercel

This guide explains how to deploy the CryptoV4 Trading Dashboard with MeiliSearch integration on Vercel.

## Overview

CryptoV4 integrates with MeiliSearch to provide powerful search capabilities for news articles and trading history. This enables:

- Instant search as you type
- Typo-tolerant search
- Relevant ranking

## Setup Steps

### 1. Prepare Configuration Files

Before deploying to Vercel, update the following files:

- **app/frontend/.env.production**:
  ```
  VITE_API_BASE_URL=https://your-backend-url.com
  VITE_USE_MOCK_DATA=false
  VITE_MEILISEARCH_HOST=https://ms-9b64a745af4d-19359.sfo.meilisearch.io
  VITE_MEILISEARCH_API_KEY=your-search-api-key-here
  ```

- **app/backend/.env**:
  ```
  MEILISEARCH_URL=https://ms-9b64a745af4d-19359.sfo.meilisearch.io
  MEILISEARCH_ADMIN_KEY=your-admin-api-key-here
  ```

### 2. Initialize MeiliSearch (One-time Setup)

Run these commands to initialize your MeiliSearch instance:

```bash
cd app/frontend
npm install -D dotenv
npm run meilisearch:init    # Creates indexes with proper settings
npm run meilisearch:populate  # Optional: adds sample data
```

### 3. Deploy to Vercel

1. **Connect your repository to Vercel**:
   - Create a new Vercel project
   - Link to your GitHub repository
   - Select the frontend directory (`app/frontend`) as the root directory

2. **Add Environment Variables**:
   - VITE_MEILISEARCH_HOST: `https://ms-9b64a745af4d-19359.sfo.meilisearch.io`
   - VITE_MEILISEARCH_API_KEY: `your-search-api-key-here`
   - VITE_USE_MOCK_DATA: `false`
   - VITE_API_BASE_URL: `https://your-backend-url.com`

3. **Deploy**:
   - Trigger the deployment by pushing to your repository or manually deploying from the Vercel dashboard

### 4. Backend MeiliSearch Integration

Sync your MongoDB data with MeiliSearch using the provided `meilisearch_service.py`:

```python
# In your Flask API routes
from services.meilisearch_service import index_news, index_trade

# When adding new sentiment data
@app.route('/api/sentiment', methods=['POST'])
def add_sentiment():
    data = request.json
    # Save to MongoDB
    sentiment_id = db.sentiment_data.insert_one(data).inserted_id
    data['_id'] = sentiment_id
    
    # Sync to MeiliSearch
    index_news(data)
    
    return jsonify({'success': True, 'id': str(sentiment_id)})

# When recording trades
@app.route('/api/trades', methods=['POST'])
def add_trade():
    trade = request.json
    # Save to MongoDB
    trade_id = db.trading_history.insert_one(trade).inserted_id
    trade['_id'] = trade_id
    
    # Sync to MeiliSearch
    index_trade(trade)
    
    return jsonify({'success': True, 'id': str(trade_id)})
```

To import all existing data:

```python
from services.meilisearch_service import import_all_data_from_mongodb

# Run this once or on a periodic schedule
import_all_data_from_mongodb(db)
```

## MeiliSearch Configuration

Your MeiliSearch instance is set up with these indexes:

- **news**: For sentiment analysis and news articles
  - Searchable fields: title, body, source
  - Filterable fields: source, sentiment_score, timestamp
  - Sortable fields: timestamp, sentiment_score

- **trades**: For trading history
  - Searchable fields: symbol, type, id
  - Filterable fields: symbol, type, timestamp
  - Sortable fields: timestamp, price, amount, total

## MeiliSearch Cloud Dashboard

Access your MeiliSearch dashboard at:
[https://cloud.meilisearch.com/](https://cloud.meilisearch.com/)

From there you can:
- Monitor your search analytics
- View and edit documents
- Manage API keys
- Configure search settings

## Security Considerations

- **Frontend**: Only use the Search API Key (read-only)
- **Backend**: Use the Admin API Key for adding/updating documents
- Never expose your Admin API Key in client-side code

## Troubleshooting

If search isn't working:

1. Check your MeiliSearch Cloud dashboard to ensure it's running
2. Verify your API keys in environment variables
3. Check browser console for any connection errors
4. Ensure your indexes are created and populated
5. Test direct API calls to MeiliSearch to isolate the issue

## Resources

- [MeiliSearch Documentation](https://docs.meilisearch.com/)
- [MeiliSearch Cloud Dashboard](https://cloud.meilisearch.com/)
- [MeiliSearch JavaScript Client](https://github.com/meilisearch/meilisearch-js)
- [MeiliSearch Python Client](https://github.com/meilisearch/meilisearch-python) 