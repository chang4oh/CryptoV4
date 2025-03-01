from pymongo import MongoClient
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_mongodb():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['CryptoV4']
        
        # Get all database names
        databases = client.list_database_names()
        print("\nAvailable databases:", databases)
        
        # Get all collections in CryptoV4
        collections = db.list_collection_names()
        print("\nCollections in CryptoV4:", collections)
        
        # Check sentiment_data collection
        if 'sentiment_data' in collections:
            # Count total documents
            total_count = db.sentiment_data.count_documents({})
            print(f"\nTotal sentiment documents: {total_count}")
            
            # Count recent documents (last hour)
            recent_count = db.sentiment_data.count_documents({
                'collected_at': {'$gte': datetime.now() - timedelta(hours=1)}
            })
            print(f"Sentiment documents from last hour: {recent_count}")
            
            # Get the most recent document
            latest_doc = db.sentiment_data.find_one(
                sort=[('collected_at', -1)]
            )
            if latest_doc:
                print("\nMost recent sentiment document:")
                print(f"Title: {latest_doc.get('title')}")
                print(f"Published at: {latest_doc.get('published_at')}")
                print(f"Collected at: {latest_doc.get('collected_at')}")
                print(f"Sentiment score: {latest_doc.get('sentiment_score')}")
            
            # Get sentiment distribution
            positive = db.sentiment_data.count_documents({'sentiment_score': {'$gt': 0}})
            negative = db.sentiment_data.count_documents({'sentiment_score': {'$lt': 0}})
            neutral = db.sentiment_data.count_documents({'sentiment_score': 0})
            
            print(f"\nSentiment distribution:")
            print(f"Positive: {positive}")
            print(f"Negative: {negative}")
            print(f"Neutral: {neutral}")
        
        # Check market_data collection
        if 'market_data' in collections:
            market_count = db.market_data.count_documents({})
            print(f"\nTotal market data documents: {market_count}")
            
            latest_market = db.market_data.find_one(
                sort=[('timestamp', -1)]
            )
            if latest_market:
                print("\nLatest market data:")
                print(f"Symbol: {latest_market.get('symbol')}")
                print(f"Timestamp: {latest_market.get('timestamp')}")
        
        # Check trading_history collection
        if 'trading_history' in collections:
            trades_count = db.trading_history.count_documents({})
            print(f"\nTotal trading history documents: {trades_count}")
            
            latest_trade = db.trading_history.find_one(
                sort=[('timestamp', -1)]
            )
            if latest_trade:
                print("\nLatest trade:")
                print(f"Symbol: {latest_trade.get('symbol')}")
                print(f"Timestamp: {latest_trade.get('timestamp')}")
                print(f"Type: {latest_trade.get('type')}")
                print(f"Price: {latest_trade.get('price')}")
            
    except Exception as e:
        logger.error(f"Error verifying MongoDB: {str(e)}")

if __name__ == "__main__":
    verify_mongodb() 