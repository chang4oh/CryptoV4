from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Union
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class SentimentAnalyzer:
    def __init__(self):
        """Initialize the sentiment analyzer with FinBERT model."""
        try:
            # Load FinBERT model specifically trained for financial sentiment
            self.tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
            self.model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
            
            # Create sentiment pipeline
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=self.model,
                tokenizer=self.tokenizer
            )
            
            # Connect to MongoDB
            self.mongo_client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
            self.db = self.mongo_client['CryptoV4']
            
            logger.info("Sentiment analyzer initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing sentiment analyzer: {str(e)}")
            raise

    def analyze_text(self, text: str) -> Dict[str, Union[str, float]]:
        """
        Analyze the sentiment of a given text.
        
        Args:
            text: The text to analyze
            
        Returns:
            Dictionary containing sentiment label and score
        """
        try:
            if not text.strip():
                return {
                    'sentiment': 'NEUTRAL',
                    'sentiment_score': 0.0,
                    'timestamp': datetime.now(),
                    'text': text,
                    'source': 'direct_input',
                    'error': 'Empty text input'
                }

            # Get sentiment prediction
            result = self.sentiment_pipeline(text)[0]
            
            # Convert sentiment to uppercase
            sentiment = result['label'].upper()
            
            return {
                'sentiment': sentiment,
                'sentiment_score': float(result['score']),
                'timestamp': datetime.now(),
                'text': text,
                'source': 'direct_input'
            }
        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
            return {
                'sentiment': 'NEUTRAL',
                'sentiment_score': 0.0,
                'timestamp': datetime.now(),
                'text': text,
                'source': 'direct_input',
                'error': str(e)
            }

    def analyze_and_store(self, symbol: str, texts: List[str]) -> List[Dict]:
        """
        Analyze multiple texts and store results in MongoDB.
        
        Args:
            symbol: The cryptocurrency symbol these texts are about
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        try:
            results = []
            for text in texts:
                # Analyze sentiment
                sentiment_result = self.analyze_text(text)
                
                # Add symbol
                sentiment_result['symbol'] = symbol
                
                # Store in MongoDB
                self.db.sentiment_data.insert_one(sentiment_result)
                
                results.append(sentiment_result)
            
            logger.info(f"Analyzed and stored {len(results)} sentiment results for {symbol}")
            return results
            
        except Exception as e:
            logger.error(f"Error in analyze_and_store: {str(e)}")
            return []

    def get_aggregate_sentiment(self, symbol: str, hours: int = 24) -> Dict[str, Union[str, float]]:
        """
        Get aggregate sentiment for a symbol over the last n hours.
        
        Args:
            symbol: The cryptocurrency symbol
            hours: Number of hours to look back
            
        Returns:
            Dictionary containing aggregate sentiment information
        """
        try:
            # Get recent sentiment data
            cutoff_time = datetime.now() - timedelta(hours=hours)
            sentiment_data = list(self.db.sentiment_data.find({
                'symbol': symbol,
                'timestamp': {'$gte': cutoff_time}
            }))
            
            if not sentiment_data:
                return {
                    'symbol': symbol,
                    'sentiment': 'NEUTRAL',
                    'average_score': 0.0,
                    'confidence': 0.0,
                    'data_points': 0
                }
            
            # Calculate aggregate metrics
            sentiments = [data['sentiment'] for data in sentiment_data]
            scores = [data['sentiment_score'] for data in sentiment_data]
            
            # Get dominant sentiment
            sentiment_counts = {
                'POSITIVE': sentiments.count('POSITIVE'),
                'NEGATIVE': sentiments.count('NEGATIVE'),
                'NEUTRAL': sentiments.count('NEUTRAL')
            }
            dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)
            
            # Calculate metrics
            average_score = sum(scores) / len(scores)
            confidence = sentiment_counts[dominant_sentiment] / len(sentiments)
            
            return {
                'symbol': symbol,
                'sentiment': dominant_sentiment,
                'average_score': average_score,
                'confidence': confidence,
                'data_points': len(sentiment_data)
            }
            
        except Exception as e:
            logger.error(f"Error getting aggregate sentiment: {str(e)}")
            return {
                'symbol': symbol,
                'sentiment': 'NEUTRAL',
                'average_score': 0.0,
                'confidence': 0.0,
                'data_points': 0,
                'error': str(e)
            }

if __name__ == "__main__":
    # Example usage
    analyzer = SentimentAnalyzer()
    
    # Test with some example texts
    texts = [
        "Bitcoin surges to new all-time high as institutional adoption grows",
        "Major cryptocurrency exchange faces regulatory challenges",
        "Market analysts predict stable growth for Ethereum"
    ]
    
    # Analyze and store results
    results = analyzer.analyze_and_store("BTC", texts)
    
    # Get aggregate sentiment
    agg_sentiment = analyzer.get_aggregate_sentiment("BTC", hours=24)
    
    print("\nAggregate Sentiment:")
    print(f"Symbol: {agg_sentiment['symbol']}")
    print(f"Dominant Sentiment: {agg_sentiment['sentiment']}")
    print(f"Average Score: {agg_sentiment['average_score']:.2f}")
    print(f"Confidence: {agg_sentiment['confidence']:.2f}")
    print(f"Data Points: {agg_sentiment['data_points']}") 