import pytest
from datetime import datetime, timedelta
from app.sentiment.sentiment_analyzer import SentimentAnalyzer
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@pytest.fixture
def sentiment_analyzer():
    """Fixture to create a SentimentAnalyzer instance for tests"""
    return SentimentAnalyzer()

@pytest.fixture
def sample_texts():
    """Fixture providing sample texts for testing"""
    return [
        "Bitcoin reaches new all-time high as institutional investors pour in",  # Positive
        "Major cryptocurrency exchange hacked, millions stolen",  # Negative
        "Bitcoin price remains stable around $50,000",  # Neutral
        "Ethereum 2.0 upgrade successfully implemented, improving scalability",  # Positive
        "Regulatory concerns grow as authorities scrutinize crypto markets"  # Negative
    ]

def test_analyzer_initialization(sentiment_analyzer):
    """Test that the analyzer initializes correctly"""
    assert sentiment_analyzer is not None
    assert sentiment_analyzer.sentiment_pipeline is not None
    assert sentiment_analyzer.db is not None

def test_analyze_single_text(sentiment_analyzer):
    """Test analysis of a single text"""
    text = "Bitcoin reaches new all-time high"
    result = sentiment_analyzer.analyze_text(text)
    
    assert isinstance(result, dict)
    assert 'sentiment' in result
    assert 'sentiment_score' in result
    assert 'timestamp' in result
    assert 'text' in result
    assert isinstance(result['sentiment_score'], float)
    assert result['sentiment_score'] >= 0 and result['sentiment_score'] <= 1
    assert result['text'] == text

def test_analyze_and_store(sentiment_analyzer, sample_texts):
    """Test analyzing and storing multiple texts"""
    symbol = "BTC"
    results = sentiment_analyzer.analyze_and_store(symbol, sample_texts)
    
    assert len(results) == len(sample_texts)
    for result in results:
        assert isinstance(result, dict)
        assert result['symbol'] == symbol
        assert 'sentiment' in result
        assert 'sentiment_score' in result
        assert 'timestamp' in result
        assert 'text' in result

def test_get_aggregate_sentiment(sentiment_analyzer, sample_texts):
    """Test getting aggregate sentiment"""
    symbol = "ETH"
    # First store some test data
    sentiment_analyzer.analyze_and_store(symbol, sample_texts)
    
    # Get aggregate sentiment
    agg_result = sentiment_analyzer.get_aggregate_sentiment(symbol, hours=24)
    
    assert isinstance(agg_result, dict)
    assert agg_result['symbol'] == symbol
    assert 'sentiment' in agg_result
    assert 'average_score' in agg_result
    assert 'confidence' in agg_result
    assert 'data_points' in agg_result
    assert agg_result['data_points'] > 0

def test_error_handling_invalid_text(sentiment_analyzer):
    """Test error handling with invalid input"""
    result = sentiment_analyzer.analyze_text("")
    assert result['sentiment'] == 'NEUTRAL'
    assert result['sentiment_score'] == 0.0
    assert 'error' in result

def test_sentiment_values(sentiment_analyzer):
    """Test that sentiment values are within expected ranges"""
    texts = {
        "Massive crypto market crash wipes out billions": "NEGATIVE",
        "New technology partnership drives crypto adoption": "POSITIVE",
        "Bitcoin trading volume remains consistent": "NEUTRAL"
    }
    
    for text, expected_sentiment in texts.items():
        result = sentiment_analyzer.analyze_text(text)
        assert result['sentiment'] in ['POSITIVE', 'NEGATIVE', 'NEUTRAL']
        assert result['sentiment_score'] >= 0 and result['sentiment_score'] <= 1

def test_aggregate_sentiment_empty_data(sentiment_analyzer):
    """Test aggregate sentiment handling with no data"""
    symbol = "NONEXISTENT"
    result = sentiment_analyzer.get_aggregate_sentiment(symbol, hours=1)
    
    assert result['sentiment'] == 'NEUTRAL'
    assert result['average_score'] == 0.0
    assert result['confidence'] == 0.0
    assert result['data_points'] == 0

def test_mongodb_integration(sentiment_analyzer, sample_texts):
    """Test MongoDB integration and data persistence"""
    symbol = "TEST"
    # Clear existing test data
    sentiment_analyzer.db.sentiment_data.delete_many({'symbol': symbol})
    
    # Store new data
    sentiment_analyzer.analyze_and_store(symbol, sample_texts)
    
    # Verify data was stored
    stored_data = list(sentiment_analyzer.db.sentiment_data.find({'symbol': symbol}))
    assert len(stored_data) == len(sample_texts)
    
    # Verify data structure
    for data in stored_data:
        assert 'sentiment' in data
        assert 'sentiment_score' in data
        assert 'timestamp' in data
        assert 'text' in data
        assert data['symbol'] == symbol

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 