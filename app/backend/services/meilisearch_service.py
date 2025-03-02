"""
MeiliSearch integration service for the CryptoV4 backend.
This service handles the synchronization of data between your MongoDB and MeiliSearch.
"""

import os
from meilisearch import Client
import logging
from datetime import datetime

# Set up logger
logger = logging.getLogger(__name__)

# MeiliSearch client
client = Client(
    os.environ.get('MEILISEARCH_URL', 'https://ms-9b64a745af4d-19359.sfo.meilisearch.io'),
    os.environ.get('MEILISEARCH_ADMIN_KEY')
)

# Check if API key is available
if not os.environ.get('MEILISEARCH_ADMIN_KEY'):
    logger.warning("⚠️ No MeiliSearch Admin API key found in environment variables!")
    logger.warning("Search functionality will be limited or unavailable")

def format_news_for_meilisearch(news_item):
    """Format news data for MeiliSearch indexing"""
    # Convert MongoDB ObjectId to string if present
    if '_id' in news_item and not isinstance(news_item['_id'], str):
        news_item['id'] = str(news_item['_id'])
    else:
        news_item['id'] = str(news_item.get('id', f"news-{datetime.now().timestamp()}"))
    
    # Create a MeiliSearch-friendly document
    return {
        'id': news_item['id'],
        'title': news_item.get('title', ''),
        'body': news_item.get('body', news_item.get('content', '')),
        'source': news_item.get('source', 'Unknown'),
        'sentiment_score': news_item.get('sentiment_score', 0),
        'timestamp': news_item.get('timestamp', datetime.now().isoformat()),
        'url': news_item.get('url', '')
    }

def format_trade_for_meilisearch(trade):
    """Format trade data for MeiliSearch indexing"""
    # Convert MongoDB ObjectId to string if present
    if '_id' in trade and not isinstance(trade['_id'], str):
        trade['id'] = str(trade['_id'])
    else:
        trade['id'] = str(trade.get('id', f"trade-{datetime.now().timestamp()}"))
    
    # Create a MeiliSearch-friendly document
    return {
        'id': trade['id'],
        'symbol': trade.get('symbol', 'Unknown'),
        'type': trade.get('type', 'unknown'),
        'price': trade.get('price', 0),
        'amount': trade.get('amount', 0),
        'total': trade.get('total', 0),
        'timestamp': trade.get('timestamp', datetime.now().isoformat())
    }

def index_news(news_item):
    """Add a single news item to MeiliSearch"""
    try:
        formatted_item = format_news_for_meilisearch(news_item)
        client.index('news').add_documents([formatted_item])
        logger.info(f"Indexed news item: {formatted_item['id']}")
        return True
    except Exception as e:
        logger.error(f"Error indexing news: {str(e)}")
        return False

def index_trade(trade):
    """Add a single trade to MeiliSearch"""
    try:
        formatted_trade = format_trade_for_meilisearch(trade)
        client.index('trades').add_documents([formatted_trade])
        logger.info(f"Indexed trade: {formatted_trade['id']}")
        return True
    except Exception as e:
        logger.error(f"Error indexing trade: {str(e)}")
        return False

def index_batch_news(news_items):
    """Add multiple news items to MeiliSearch"""
    try:
        formatted_items = [format_news_for_meilisearch(item) for item in news_items]
        client.index('news').add_documents(formatted_items)
        logger.info(f"Indexed {len(formatted_items)} news items")
        return True
    except Exception as e:
        logger.error(f"Error batch indexing news: {str(e)}")
        return False

def index_batch_trades(trades):
    """Add multiple trades to MeiliSearch"""
    try:
        formatted_trades = [format_trade_for_meilisearch(trade) for trade in trades]
        client.index('trades').add_documents(formatted_trades)
        logger.info(f"Indexed {len(formatted_trades)} trades")
        return True
    except Exception as e:
        logger.error(f"Error batch indexing trades: {str(e)}")
        return False

def delete_news(news_id):
    """Delete a news item from MeiliSearch"""
    try:
        client.index('news').delete_document(str(news_id))
        logger.info(f"Deleted news item: {news_id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting news: {str(e)}")
        return False

def delete_trade(trade_id):
    """Delete a trade from MeiliSearch"""
    try:
        client.index('trades').delete_document(str(trade_id))
        logger.info(f"Deleted trade: {trade_id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting trade: {str(e)}")
        return False

def import_all_data_from_mongodb(db):
    """Import all existing data from MongoDB to MeiliSearch"""
    try:
        # Import news/sentiment data
        news_items = list(db.sentiment_data.find({}))
        index_batch_news(news_items)
        
        # Import trade history
        trades = list(db.trading_history.find({}))
        index_batch_trades(trades)
        
        logger.info(f"Completed full import: {len(news_items)} news items, {len(trades)} trades")
        return True
    except Exception as e:
        logger.error(f"Error during full import: {str(e)}")
        return False

def check_meilisearch_health():
    """Check if MeiliSearch is available"""
    try:
        health = client.health()
        return health.get('status') == 'available'
    except Exception:
        return False 