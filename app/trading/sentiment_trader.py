from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.data.news_collector import NewsCollector
import logging

logger = logging.getLogger(__name__)

class SentimentTrader:
    """
    Simple trading system based on news sentiment.
    Uses weighted sentiment scores to generate trading signals.
    """
    
    def __init__(self):
        self.news_collector = NewsCollector()
        
        # Trading Parameters
        self.sentiment_threshold = 0.2  # Minimum sentiment score to trigger a signal
        self.min_news_count = 3        # Minimum news items needed for a signal
        
        # Risk Management
        self.max_position_size = 100   # Maximum position size in USD
        self.stop_loss_pct = 0.02      # 2% stop loss
        
    def get_market_sentiment(self, timeframe_minutes: int = 60) -> Dict:
        """
        Get aggregated market sentiment for the last timeframe_minutes.
        
        Args:
            timeframe_minutes: Minutes to look back
            
        Returns:
            Dictionary with sentiment metrics
        """
        try:
            # Fetch recent news
            news_items = self.news_collector.fetch_and_analyze_news(limit=50)
            
            # Filter for recent news
            cutoff_time = datetime.now() - timedelta(minutes=timeframe_minutes)
            recent_news = [
                item for item in news_items 
                if item['published_at'] >= cutoff_time
            ]
            
            if len(recent_news) < self.min_news_count:
                return {
                    'signal': 'NEUTRAL',
                    'sentiment_score': 0,
                    'confidence': 0,
                    'news_count': len(recent_news)
                }
            
            # Calculate weighted sentiment
            total_sentiment = 0
            total_weight = 0
            
            for item in recent_news:
                # More objective news gets higher weight
                objectivity = 1 - item['sentiment_subjectivity']
                weight = 1 + objectivity  # Weight range: 1-2
                
                total_sentiment += item['sentiment_score'] * weight
                total_weight += weight
            
            avg_sentiment = total_sentiment / total_weight if total_weight > 0 else 0
            
            # Generate signal
            signal = 'NEUTRAL'
            if avg_sentiment > self.sentiment_threshold:
                signal = 'BUY'
            elif avg_sentiment < -self.sentiment_threshold:
                signal = 'SELL'
            
            # Calculate confidence based on news count and sentiment strength
            confidence = min(
                (len(recent_news) / self.min_news_count) * abs(avg_sentiment),
                1.0
            )
            
            return {
                'signal': signal,
                'sentiment_score': avg_sentiment,
                'confidence': confidence,
                'news_count': len(recent_news)
            }
            
        except Exception as e:
            logger.error(f"Error getting market sentiment: {str(e)}")
            return {
                'signal': 'ERROR',
                'sentiment_score': 0,
                'confidence': 0,
                'news_count': 0
            }
    
    def calculate_position_size(self, sentiment_data: Dict) -> float:
        """
        Calculate position size based on sentiment confidence.
        
        Args:
            sentiment_data: Dictionary with sentiment metrics
            
        Returns:
            Position size in USD
        """
        if sentiment_data['signal'] not in ['BUY', 'SELL']:
            return 0
            
        # Scale position size by confidence
        position_size = self.max_position_size * sentiment_data['confidence']
        return round(position_size, 2)
    
    def get_trading_signal(self) -> Dict:
        """
        Generate trading signal with position size and risk parameters.
        
        Returns:
            Dictionary with trading signal details
        """
        # Get current market sentiment
        sentiment = self.get_market_sentiment()
        
        # Calculate position size
        position_size = self.calculate_position_size(sentiment)
        
        return {
            'timestamp': datetime.now(),
            'signal': sentiment['signal'],
            'position_size': position_size,
            'stop_loss_pct': self.stop_loss_pct,
            'sentiment_score': sentiment['sentiment_score'],
            'confidence': sentiment['confidence'],
            'news_count': sentiment['news_count']
        }

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Example usage
    trader = SentimentTrader()
    
    print("\nGetting trading signal...")
    signal = trader.get_trading_signal()
    
    print(f"\nTrading Signal:")
    print(f"Signal: {signal['signal']}")
    print(f"Position Size: ${signal['position_size']}")
    print(f"Sentiment Score: {signal['sentiment_score']:.2f}")
    print(f"Confidence: {signal['confidence']:.2f}")
    print(f"News Count: {signal['news_count']}")
    print(f"Stop Loss: {signal['stop_loss_pct']*100}%") 