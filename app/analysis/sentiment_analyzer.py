"""
Sentiment analyzer for cryptocurrency news using NLP techniques.
Analyzes textual news data to determine sentiment scores for trading decisions.
"""

import logging
import sys
import os
import traceback
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pymongo import MongoClient
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from dotenv import load_dotenv
import re
import threading
from typing import List, Dict, Union, Tuple, Optional

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

# Import project modules
from config import MONGODB_CONFIG, SENTIMENT_CONFIG, LOGGING_CONFIG
from app.data.news_collector import NewsCollector

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['log_level']),
    format=LOGGING_CONFIG['log_format'],
    handlers=[
        logging.FileHandler(LOGGING_CONFIG['log_file']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        """Initialize the SentimentAnalyzer with NLP models and database connection."""
        try:
            # Initialize MongoDB connection
            self.mongo_client = MongoClient(MONGODB_CONFIG['uri'])
            self.db = self.mongo_client[MONGODB_CONFIG['db_name']]
            
            # Initialize the news collector
            self.news_collector = NewsCollector()
            
            # Initialize NLP models based on configuration
            self.nlp_models = {}
            self.initialize_nlp_models()
            
            # Configure threading for model processing
            self.max_threads = SENTIMENT_CONFIG.get('max_threads', 2)
            
            logger.info("SentimentAnalyzer initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing SentimentAnalyzer: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    def initialize_nlp_models(self):
        """Initialize the NLP models specified in the configuration."""
        try:
            # Initialize VADER sentiment analyzer
            if SENTIMENT_CONFIG.get('use_vader', True):
                self.nlp_models['vader'] = SentimentIntensityAnalyzer()
                logger.info("VADER sentiment analyzer initialized")
            
            # Initialize FinBERT model if specified
            if SENTIMENT_CONFIG.get('use_finbert', True):
                try:
                    # Load FinBERT model and tokenizer
                    model_name = "ProsusAI/finbert"
                    self.nlp_models['finbert_tokenizer'] = AutoTokenizer.from_pretrained(model_name)
                    self.nlp_models['finbert_model'] = AutoModelForSequenceClassification.from_pretrained(model_name)
                    
                    # Use GPU if available
                    if torch.cuda.is_available():
                        self.nlp_models['finbert_model'].to('cuda')
                        logger.info("FinBERT model initialized with GPU acceleration")
                    else:
                        logger.info("FinBERT model initialized (CPU mode)")
                except Exception as e:
                    logger.error(f"Error loading FinBERT model: {str(e)}")
                    logger.error("Continuing without FinBERT model")
                    
        except Exception as e:
            logger.error(f"Error initializing NLP models: {str(e)}")
            logger.error(traceback.format_exc())
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for sentiment analysis.
        
        Args:
            text: Raw text to preprocess
            
        Returns:
            Preprocessed text
        """
        if not text:
            return ""
            
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        
        # Remove HTML tags
        text = re.sub(r'<.*?>', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def analyze_with_vader(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using VADER.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment scores
        """
        if not text or 'vader' not in self.nlp_models:
            return {'compound': 0.0, 'neg': 0.0, 'neu': 0.0, 'pos': 0.0}
            
        preprocessed_text = self.preprocess_text(text)
        
        if not preprocessed_text:
            return {'compound': 0.0, 'neg': 0.0, 'neu': 0.0, 'pos': 0.0}
            
        scores = self.nlp_models['vader'].polarity_scores(preprocessed_text)
        return scores
    
    def analyze_with_finbert(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using FinBERT.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment scores
        """
        if (not text or 'finbert_model' not in self.nlp_models or 
            'finbert_tokenizer' not in self.nlp_models):
            return {'positive': 0.0, 'negative': 0.0, 'neutral': 0.0}
            
        try:
            preprocessed_text = self.preprocess_text(text)
            
            if not preprocessed_text:
                return {'positive': 0.0, 'negative': 0.0, 'neutral': 0.0}
                
            # Tokenize text
            tokenizer = self.nlp_models['finbert_tokenizer']
            model = self.nlp_models['finbert_model']
            
            # Truncate text if necessary (FinBERT has a token limit)
            max_length = tokenizer.model_max_length
            inputs = tokenizer(preprocessed_text, return_tensors='pt', truncation=True, max_length=max_length)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                inputs = {k: v.to('cuda') for k, v in inputs.items()}
            
            # Get prediction
            with torch.no_grad():
                outputs = model(**inputs)
                scores = torch.nn.functional.softmax(outputs.logits, dim=1).squeeze().tolist()
            
            # FinBERT outputs: [positive, negative, neutral]
            if isinstance(scores, float):  # Handle single score case
                scores = [scores]
                
            return {
                'positive': scores[0],
                'negative': scores[1],
                'neutral': scores[2]
            }
        except Exception as e:
            logger.error(f"Error in FinBERT analysis: {str(e)}")
            logger.error(traceback.format_exc())
            return {'positive': 0.0, 'negative': 0.0, 'neutral': 0.0}
    
    def combine_sentiment_scores(self, vader_scores: Dict[str, float], 
                                finbert_scores: Dict[str, float]) -> float:
        """
        Combine sentiment scores from different models.
        
        Args:
            vader_scores: VADER sentiment scores
            finbert_scores: FinBERT sentiment scores
            
        Returns:
            Combined sentiment score between -1.0 and 1.0
        """
        # Get compound score from VADER (between -1.0 and 1.0)
        vader_compound = vader_scores.get('compound', 0.0)
        
        # Calculate FinBERT score (positive - negative, between -1.0 and 1.0)
        finbert_score = finbert_scores.get('positive', 0.0) - finbert_scores.get('negative', 0.0)
        
        # Combine scores with weights from config
        vader_weight = SENTIMENT_CONFIG.get('vader_weight', 0.5)
        finbert_weight = SENTIMENT_CONFIG.get('finbert_weight', 0.5)
        
        # Normalize weights
        total_weight = vader_weight + finbert_weight
        if total_weight == 0:
            return 0.0
            
        vader_weight = vader_weight / total_weight
        finbert_weight = finbert_weight / total_weight
        
        # Calculate weighted score
        combined_score = (vader_compound * vader_weight) + (finbert_score * finbert_weight)
        
        # Ensure score is between -1.0 and 1.0
        return max(-1.0, min(1.0, combined_score))
    
    def analyze_single_text(self, text_item: Dict) -> Dict:
        """
        Analyze sentiment for a single text item.
        
        Args:
            text_item: Dictionary containing text and metadata
            
        Returns:
            Dictionary with sentiment analysis results
        """
        try:
            text = text_item.get('text', '')
            
            # Skip empty text
            if not text:
                logger.warning(f"Empty text for news_id {text_item.get('news_id')}, skipping")
                return None
                
            # Analyze with different models
            vader_scores = self.analyze_with_vader(text)
            finbert_scores = self.analyze_with_finbert(text)
            
            # Combine scores
            combined_score = self.combine_sentiment_scores(vader_scores, finbert_scores)
            
            # Determine sentiment label
            sentiment_label = 'neutral'
            if combined_score >= 0.2:
                sentiment_label = 'positive'
            elif combined_score <= -0.2:
                sentiment_label = 'negative'
            
            # Create result dictionary
            result = {
                'news_id': text_item.get('news_id'),
                'symbol': text_item.get('symbol'),
                'sentiment_score': combined_score,
                'sentiment_label': sentiment_label,
                'model_scores': {
                    'vader': vader_scores,
                    'finbert': finbert_scores
                },
                'source': text_item.get('source'),
                'timestamp': datetime.now(),
                'published_at': text_item.get('published_at'),
                'url': text_item.get('url')
            }
            
            # Store result in database
            self.db.sentiment_data.update_one(
                {'news_id': result['news_id']},
                {'$set': result},
                upsert=True
            )
            
            return result
        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
            logger.error(traceback.format_exc())
            return None
    
    def analyze_texts_batch(self, text_items: List[Dict]) -> List[Dict]:
        """
        Analyze sentiment for a batch of text items.
        
        Args:
            text_items: List of dictionaries containing text and metadata
            
        Returns:
            List of dictionaries with sentiment analysis results
        """
        if not text_items:
            return []
        
        results = []
        threads = []
        
        # Use threading for parallel processing
        def process_item(item):
            result = self.analyze_single_text(item)
            if result:
                results.append(result)
        
        # Create and start threads
        for item in text_items:
            if len(threads) >= self.max_threads:
                # Wait for a thread to complete before starting a new one
                for thread in threads:
                    thread.join()
                threads = []
            
            thread = threading.Thread(target=process_item, args=(item,))
            thread.start()
            threads.append(thread)
        
        # Wait for remaining threads to complete
        for thread in threads:
            thread.join()
        
        return results
    
    def analyze_news_for_symbol(self, symbol: str, limit: int = 20) -> List[Dict]:
        """
        Analyze sentiment for news related to a specific symbol.
        
        Args:
            symbol: Cryptocurrency symbol
            limit: Maximum number of news items to analyze
            
        Returns:
            List of sentiment analysis results
        """
        try:
            # Collect news
            news_items = self.news_collector.collect_news(symbol, limit=limit)
            
            # Check if we already have sentiment for these news items
            news_ids = [item.get('source_info', {}).get('news_id') for item in news_items if 'source_info' in item]
            existing_sentiment = list(self.db.sentiment_data.find({'news_id': {'$in': news_ids}}))
            existing_news_ids = set(item['news_id'] for item in existing_sentiment)
            
            # Filter out news items that already have sentiment analysis
            new_items = [
                item for item in news_items 
                if item.get('source_info', {}).get('news_id') not in existing_news_ids
            ]
            
            # Prepare news items for sentiment analysis
            texts_to_analyze = self.news_collector.prepare_for_sentiment_analysis(new_items)
            
            # Analyze sentiment for new items
            new_sentiment_results = self.analyze_texts_batch(texts_to_analyze)
            
            # Combine new and existing sentiment results
            all_results = existing_sentiment + new_sentiment_results
            
            # Convert ObjectId to string for JSON serialization
            for item in all_results:
                if '_id' in item:
                    item['_id'] = str(item['_id'])
                if 'timestamp' in item and isinstance(item['timestamp'], datetime):
                    item['timestamp'] = item['timestamp'].isoformat()
                if 'published_at' in item and isinstance(item['published_at'], datetime):
                    item['published_at'] = item['published_at'].isoformat()
            
            # Sort by timestamp
            all_results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            logger.info(f"Analyzed sentiment for {len(new_sentiment_results)} new items for {symbol}")
            return all_results[:limit]
        
        except Exception as e:
            logger.error(f"Error analyzing news for {symbol}: {str(e)}")
            logger.error(traceback.format_exc())
            return []
    
    def get_sentiment_summary(self, symbol: str, hours: int = 24) -> Dict:
        """
        Get a summary of sentiment for a symbol over a time period.
        
        Args:
            symbol: Cryptocurrency symbol
            hours: Number of hours to look back
            
        Returns:
            Dictionary with sentiment summary
        """
        try:
            since = datetime.now() - timedelta(hours=hours)
            
            # Query database for sentiment data
            sentiment_data = list(self.db.sentiment_data.find({
                'symbol': symbol,
                'timestamp': {'$gte': since}
            }))
            
            if not sentiment_data:
                return {
                    'symbol': symbol,
                    'period_hours': hours,
                    'average_score': 0.0,
                    'sentiment_label': 'neutral',
                    'sentiment_distribution': {
                        'positive': 0,
                        'neutral': 0,
                        'negative': 0
                    },
                    'sentiment_count': 0,
                    'timestamp': datetime.now().isoformat()
                }
            
            # Calculate average sentiment
            total_sentiment = sum(item['sentiment_score'] for item in sentiment_data)
            average_sentiment = total_sentiment / len(sentiment_data)
            
            # Count sentiment labels
            sentiment_counts = {
                'positive': 0,
                'neutral': 0,
                'negative': 0
            }
            
            for item in sentiment_data:
                label = item.get('sentiment_label', 'neutral')
                sentiment_counts[label] = sentiment_counts.get(label, 0) + 1
            
            # Determine overall sentiment label
            overall_label = 'neutral'
            if average_sentiment >= 0.2:
                overall_label = 'positive'
            elif average_sentiment <= -0.2:
                overall_label = 'negative'
            
            summary = {
                'symbol': symbol,
                'period_hours': hours,
                'average_score': average_sentiment,
                'sentiment_label': overall_label,
                'sentiment_distribution': sentiment_counts,
                'sentiment_count': len(sentiment_data),
                'timestamp': datetime.now().isoformat()
            }
            
            return summary
        
        except Exception as e:
            logger.error(f"Error getting sentiment summary for {symbol}: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'symbol': symbol,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Main execution for testing
if __name__ == "__main__":
    analyzer = SentimentAnalyzer()
    
    # Test sentiment analysis for BTC
    results = analyzer.analyze_news_for_symbol('BTC', limit=3)
    
    if results:
        print(f"Analyzed sentiment for {len(results)} news items about BTC:")
        for item in results:
            print(f"- Score: {item['sentiment_score']:.2f} ({item['sentiment_label']})")
            print(f"  News ID: {item['news_id']}")
            print(f"  Source: {item.get('source')}")
            print(f"  Timestamp: {item.get('timestamp')}")
            print()
    
    # Test sentiment summary
    summary = analyzer.get_sentiment_summary('BTC', hours=24)
    print("\nSentiment Summary for BTC:")
    print(f"Average score: {summary['average_score']:.2f} ({summary['sentiment_label']})")
    print(f"Distribution: {summary['sentiment_distribution']}")
    print(f"Count: {summary['sentiment_count']} items") 