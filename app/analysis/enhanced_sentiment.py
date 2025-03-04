"""
Enhanced Sentiment Analysis Module for CryptoV4

This module extends the basic sentiment analysis functionality with
advanced NLP capabilities including:
- Entity recognition
- Multi-model sentiment analysis
- Text summarization
- Multi-language support
"""

import logging
import os
import re
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
import time

# Base imports that should always work
import pandas as pd
import numpy as np
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Try to import transformers - will be used if available
TRANSFORMERS_AVAILABLE = False
try:
    from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
    logger.info("Transformers library available, using advanced NLP capabilities")
except ImportError:
    logger.warning("Transformers library not available, using basic sentiment analysis only")


class EnhancedSentimentAnalyzer:
    """
    Enhanced sentiment analyzer that combines multiple NLP models
    to provide more accurate sentiment analysis for cryptocurrency news.
    """

    def __init__(self, use_advanced_models=True):
        """
        Initialize the enhanced sentiment analyzer.
        
        Args:
            use_advanced_models: Whether to use advanced models (if available)
        """
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.use_advanced_models = use_advanced_models and TRANSFORMERS_AVAILABLE
        
        # Only initialize these if transformers is available
        self.finbert_model = None
        self.roberta_model = None
        self.ner_model = None
        self.summarizer = None
        self.multilingual_model = None
        
        if self.use_advanced_models:
            try:
                logger.info("Loading NLP models...")
                # Initialize FinBERT for financial sentiment
                self.finbert_model = pipeline(
                    "sentiment-analysis",
                    model="ProsusAI/finbert",
                    return_all_scores=True
                )
                
                # Initialize RoBERTa for general sentiment
                self.roberta_model = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    return_all_scores=True
                )
                
                # Initialize named entity recognition
                self.ner_model = pipeline(
                    "ner",
                    model="dbmdz/bert-large-cased-finetuned-conll03-english"
                )
                
                # Initialize text summarization
                self.summarizer = pipeline(
                    "summarization",
                    model="facebook/bart-large-cnn"
                )
                
                # Initialize multilingual model
                self.multilingual_model = pipeline(
                    "sentiment-analysis",
                    model="nlptown/bert-base-multilingual-uncased-sentiment"
                )
                
                logger.info("All NLP models loaded successfully")
            except Exception as e:
                logger.error(f"Error initializing advanced NLP models: {str(e)}")
                self.use_advanced_models = False
    
    def detect_language(self, text: str) -> str:
        """
        Detect the language of a text.
        Very simplified implementation for demonstration.
        
        Args:
            text: The text to detect language for
        
        Returns:
            Language code (en, es, etc.)
        """
        # This is a very simplified language detection
        # In production, you'd use a proper language detection library
        # such as langdetect or fastText
        
        # Check for common non-English characters
        if not self.use_advanced_models:
            return "en"  # Default to English without advanced models
            
        # Very simplified language detection
        non_english_patterns = {
            "es": r'[áéíóúüñ¿¡]',  # Spanish
            "fr": r'[éèêëàâçîïôùû]',  # French
            "de": r'[äöüß]',  # German
            "zh": r'[\u4e00-\u9fff]',  # Chinese
            "ja": r'[\u3040-\u309f\u30a0-\u30ff]',  # Japanese
            "ko": r'[\uac00-\ud7af]',  # Korean
            "ru": r'[а-яА-Я]',  # Russian
        }
        
        for lang, pattern in non_english_patterns.items():
            if re.search(pattern, text):
                return lang
        
        return "en"  # Default to English
    
    def summarize_text(self, text: str, max_length: int = 150) -> str:
        """
        Summarize a long text to extract the most important points.
        
        Args:
            text: The text to summarize
            max_length: Maximum length of summary
            
        Returns:
            Summarized text
        """
        if not self.use_advanced_models or len(text) < 100:
            # If text is already short or we don't have advanced models, 
            # just return the first few sentences
            sentences = text.split('.')
            short_summary = '.'.join(sentences[:2]) + '.'
            return short_summary[:max_length]
        
        try:
            # Calculate appropriate min and max length based on input
            text_len = len(text)
            min_length = min(30, max(10, text_len // 10))  
            max_length = min(max_length, max(min_length + 10, text_len // 3))
            
            summary = self.summarizer(
                text, 
                max_length=max_length, 
                min_length=min_length, 
                do_sample=False
            )
            return summary[0]['summary_text']
        except Exception as e:
            logger.error(f"Error summarizing text: {str(e)}")
            # Fallback to basic summarization
            sentences = text.split('.')
            short_summary = '.'.join(sentences[:2]) + '.'
            return short_summary[:max_length]
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract named entities from text, with special focus on crypto-related entities.
        
        Args:
            text: The text to extract entities from
            
        Returns:
            Dictionary of entity types and their mentions
        """
        entities = {
            "cryptocurrency": [],
            "person": [],
            "organization": [], 
            "location": [],
            "misc": []
        }
        
        # Basic regex-based crypto detection that works without advanced models
        crypto_patterns = {
            "Bitcoin": r'\b[Bb]itcoin\b|\bBTC\b',
            "Ethereum": r'\b[Ee]thereum\b|\bETH\b',
            "Binance Coin": r'\b[Bb]inance\s[Cc]oin\b|\bBNB\b',
            "Solana": r'\b[Ss]olana\b|\bSOL\b',
            "Cardano": r'\b[Cc]ardano\b|\bADA\b',
            "XRP": r'\bXRP\b|\b[Rr]ipple\b',
            "Polkadot": r'\b[Pp]olkadot\b|\bDOT\b',
            "Dogecoin": r'\b[Dd]ogecoin\b|\bDOGE\b',
            "Avalanche": r'\b[Aa]valanche\b|\bAVAX\b',
            "Polygon": r'\b[Pp]olygon\b|\bMATIC\b'
        }
        
        # Extract cryptocurrencies using regex
        for crypto, pattern in crypto_patterns.items():
            if re.search(pattern, text):
                if crypto not in entities["cryptocurrency"]:
                    entities["cryptocurrency"].append(crypto)
        
        # Extract companies/orgs with basic regex
        org_patterns = {
            "Binance": r'\b[Bb]inance\b',
            "Coinbase": r'\b[Cc]oinbase\b', 
            "FTX": r'\bFTX\b',
            "Kraken": r'\b[Kk]raken\b',
            "SEC": r'\bSEC\b|\b[Ss]ecurities\s[Aa]nd\s[Ee]xchange\s[Cc]ommission\b',
            "Federal Reserve": r'\b[Ff]ederal\s[Rr]eserve\b|\bFed\b',
            "Tesla": r'\b[Tt]esla\b',
            "MicroStrategy": r'\b[Mm]icro[Ss]trategy\b'
        }
        
        for org, pattern in org_patterns.items():
            if re.search(pattern, text):
                if org not in entities["organization"]:
                    entities["organization"].append(org)
        
        # If advanced models are available, use NER
        if self.use_advanced_models:
            try:
                # Maximum length for NER
                if len(text) > 1000:
                    # Process in chunks if text is too long
                    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
                    ner_results = []
                    for chunk in chunks:
                        ner_results.extend(self.ner_model(chunk))
                else:
                    ner_results = self.ner_model(text)
                
                # Process and group NER results
                current_entity = {"word": "", "entity": "", "score": 0}
                
                for item in ner_results:
                    # New entity or continuation
                    if item.get('entity', '').startswith('B-'):
                        # Save previous entity if exists
                        if current_entity["word"]:
                            entity_type = self._map_entity_type(current_entity["entity"])
                            if current_entity["word"] not in entities[entity_type]:
                                entities[entity_type].append(current_entity["word"])
                        
                        # Start new entity
                        current_entity = {
                            "word": item['word'].replace('##', ''),
                            "entity": item['entity'][2:],  # Remove B-
                            "score": item['score']
                        }
                    elif item.get('entity', '').startswith('I-') and item['entity'][2:] == current_entity["entity"]:
                        # Continue current entity
                        current_entity["word"] += item['word'].replace('##', '')
                
                # Add the last entity
                if current_entity["word"]:
                    entity_type = self._map_entity_type(current_entity["entity"])
                    if current_entity["word"] not in entities[entity_type]:
                        entities[entity_type].append(current_entity["word"])
            
            except Exception as e:
                logger.error(f"Error in entity extraction: {str(e)}")
        
        return entities
    
    def _map_entity_type(self, ner_type: str) -> str:
        """Map NER entity types to our categories"""
        mapping = {
            "PER": "person",
            "PERSON": "person",
            "ORG": "organization", 
            "ORGANIZATION": "organization",
            "LOC": "location",
            "LOCATION": "location",
            "GPE": "location",
            "MISC": "misc",
            "PRODUCT": "misc"
        }
        return mapping.get(ner_type.upper(), "misc")
    
    def analyze_single_text(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the sentiment of a single news article.
        
        Args:
            article: Dictionary containing article data with 'title' and 'content' keys
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # Extract text from article
        title = article.get('title', '')
        content = article.get('content', '')
        
        # Combine title and content, giving more weight to the title
        full_text = f"{title}. {title}. {content}"
        
        # Detect language
        language = self.detect_language(full_text)
        
        # Basic VADER sentiment analysis (always available)
        vader_scores = self.vader_analyzer.polarity_scores(full_text)
        
        # Initialize results with VADER scores
        result = {
            'article_id': article.get('id', ''),
            'language': language,
            'vader_scores': vader_scores,
            'sentiment_score': vader_scores['compound'],  # Default to VADER
            'sentiment_label': self._get_sentiment_label(vader_scores['compound']),
            'finbert_scores': None,
            'roberta_scores': None,
            'multilingual_scores': None,
            'entities': None,
            'summary': None,
            'analyzed_at': datetime.now().isoformat()
        }
        
        # Extract entities with basic method
        result['entities'] = self.extract_entities(full_text)
        
        # Create a simple summary
        result['summary'] = self.summarize_text(content)
        
        # If advanced models are available, enhance the analysis
        if self.use_advanced_models:
            try:
                # Add FinBERT scores for English financial text
                if language == 'en':
                    finbert_output = self.finbert_model(full_text)
                    result['finbert_scores'] = {
                        item['label']: item['score'] 
                        for item in finbert_output[0]
                    }
                    
                    # Add RoBERTa scores for general sentiment
                    roberta_output = self.roberta_model(full_text)
                    result['roberta_scores'] = {
                        item['label']: item['score'] 
                        for item in roberta_output[0]
                    }
                
                # Add multilingual model scores for non-English
                if language != 'en':
                    multi_output = self.multilingual_model(full_text)
                    # Convert 1-5 scale to sentiment score
                    label = multi_output[0]['label']  # e.g. '5 stars'
                    stars = int(label[0])  # Extract the number
                    normalized_score = (stars - 3) / 2  # Convert 1-5 to -1 to 1
                    
                    result['multilingual_scores'] = {
                        'score': multi_output[0]['score'],
                        'label': label,
                        'normalized_score': normalized_score
                    }
                
                # Combined score calculation
                result['sentiment_score'] = self._calculate_combined_score(result)
                result['sentiment_label'] = self._get_sentiment_label(result['sentiment_score'])
                
            except Exception as e:
                logger.error(f"Error in advanced sentiment analysis: {str(e)}")
                # Keep the VADER scores as fallback
        
        return result
    
    def _calculate_combined_score(self, result: Dict[str, Any]) -> float:
        """
        Calculate a combined sentiment score using all available models.
        
        Args:
            result: The result dictionary with various model scores
            
        Returns:
            Combined sentiment score between -1 and 1
        """
        # Start with VADER score
        scores = [result['vader_scores']['compound']]
        
        # Add FinBERT score if available
        if result['finbert_scores']:
            # Convert FinBERT scores to -1 to 1 scale
            finbert_score = result['finbert_scores'].get('positive', 0) - \
                           result['finbert_scores'].get('negative', 0)
            scores.append(finbert_score)
        
        # Add RoBERTa score if available
        if result['roberta_scores']:
            # Convert RoBERTa scores to -1 to 1 scale
            roberta_score = result['roberta_scores'].get('positive', 0) - \
                           result['roberta_scores'].get('negative', 0)
            scores.append(roberta_score)
        
        # Add multilingual score if available
        if result['multilingual_scores']:
            scores.append(result['multilingual_scores']['normalized_score'])
        
        # Calculate weighted average
        # Give more weight to financial models for crypto news
        if result['finbert_scores']:
            # If FinBERT is available, give it extra weight
            weights = [0.3, 0.5, 0.2, 0.0][:len(scores)]  # VADER, FinBERT, RoBERTa, Multi
        else:
            weights = [1.0] + [0.0] * (len(scores) - 1)  # Only use VADER
            
        # Normalize weights
        weights = [w / sum(weights) for w in weights]
        
        # Calculate weighted average
        combined_score = sum(s * w for s, w in zip(scores, weights))
        
        return combined_score
    
    def _get_sentiment_label(self, score: float) -> str:
        """
        Convert a sentiment score to a label.
        
        Args:
            score: Sentiment score between -1 and 1
            
        Returns:
            Sentiment label: positive, negative, or neutral
        """
        if score >= 0.05:
            return "positive"
        elif score <= -0.05:
            return "negative"
        else:
            return "neutral"
    
    def analyze_crypto_specific_sentiment(self, text: str, crypto_symbol: str) -> Dict[str, Any]:
        """
        Analyze sentiment specifically for a particular cryptocurrency.
        
        Args:
            text: The text to analyze
            crypto_symbol: The cryptocurrency symbol (e.g., 'BTC', 'ETH')
            
        Returns:
            Crypto-specific sentiment scores
        """
        # Get general sentiment
        # Create dummy article structure
        article = {
            'id': 'crypto_specific',
            'title': '',
            'content': text
        }
        general_sentiment = self.analyze_single_text(article)
        
        # Look for specific mentions of the cryptocurrency
        crypto_patterns = {
            "BTC": r'\b[Bb]itcoin\b|\bBTC\b',
            "ETH": r'\b[Ee]thereum\b|\bETH\b',
            "BNB": r'\b[Bb]inance\s[Cc]oin\b|\bBNB\b',
            "SOL": r'\b[Ss]olana\b|\bSOL\b',
            "ADA": r'\b[Cc]ardano\b|\bADA\b',
            "XRP": r'\bXRP\b|\b[Rr]ipple\b',
            "DOT": r'\b[Pp]olkadot\b|\bDOT\b',
            "DOGE": r'\b[Dd]ogecoin\b|\bDOGE\b',
        }
        
        pattern = crypto_patterns.get(crypto_symbol, rf'\b{crypto_symbol}\b')
        
        # Find sentences mentioning the cryptocurrency
        sentences = re.split(r'[.!?]+', text)
        crypto_sentences = [s for s in sentences if re.search(pattern, s)]
        
        if not crypto_sentences:
            # No specific mentions, return general sentiment
            return {
                'crypto': crypto_symbol,
                'mentioned': False,
                'sentiment_score': general_sentiment['sentiment_score'],
                'sentiment_label': general_sentiment['sentiment_label'],
                'relevance': 0.0
            }
        
        # Analyze sentiment of sentences mentioning the crypto
        crypto_text = '. '.join(crypto_sentences)
        
        # Create dummy article for the crypto-specific text
        crypto_article = {
            'id': f'crypto_{crypto_symbol}',
            'title': '',
            'content': crypto_text
        }
        
        crypto_sentiment = self.analyze_single_text(crypto_article)
        
        # Calculate relevance (how much of the text is about this crypto)
        crypto_chars = len(crypto_text)
        total_chars = len(text)
        relevance = crypto_chars / total_chars if total_chars > 0 else 0
        
        return {
            'crypto': crypto_symbol,
            'mentioned': True,
            'sentiment_score': crypto_sentiment['sentiment_score'],
            'sentiment_label': crypto_sentiment['sentiment_label'],
            'general_sentiment_score': general_sentiment['sentiment_score'],
            'relevance': relevance,
            'mention_count': len(crypto_sentences),
            'crypto_sentences': crypto_sentences[:5]  # Return up to 5 example sentences
        }
    
    def batch_analyze(self, articles: List[Dict[str, Any]], batch_size: int = 10) -> List[Dict[str, Any]]:
        """
        Analyze a batch of articles.
        
        Args:
            articles: List of article dictionaries
            batch_size: Number of articles to process in parallel
            
        Returns:
            List of sentiment analysis results
        """
        results = []
        
        # Process in batches
        for i in range(0, len(articles), batch_size):
            batch = articles[i:i+batch_size]
            batch_results = []
            
            # Process each article in the batch
            for article in batch:
                try:
                    result = self.analyze_single_text(article)
                    batch_results.append(result)
                except Exception as e:
                    logger.error(f"Error analyzing article {article.get('id', '')}: {str(e)}")
                    batch_results.append({
                        'article_id': article.get('id', ''),
                        'error': str(e),
                        'analyzed_at': datetime.now().isoformat()
                    })
            
            results.extend(batch_results)
        
        return results


# For testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Create instance
    analyzer = EnhancedSentimentAnalyzer()
    
    # Test text
    test_article = {
        'id': 'test_article',
        'title': 'Bitcoin surges past $50,000 as institutional adoption increases',
        'content': 'Bitcoin has reached a new milestone, surpassing $50,000 for the first time. '
                   'The surge comes as major financial institutions like BlackRock and Goldman Sachs '
                   'show increased interest in cryptocurrency markets. '
                   'Analysts at JPMorgan predict further growth, while Tesla CEO Elon Musk '
                   'tweeted support for the cryptocurrency.'
    }
    
    # Test sentiment analysis
    result = analyzer.analyze_single_text(test_article)
    
    # Print results
    print("\nSentiment Analysis Results:")
    print(f"Score: {result['sentiment_score']:.2f}")
    print(f"Label: {result['sentiment_label']}")
    
    print("\nEntities Extracted:")
    for entity_type, entities in result['entities'].items():
        print(f"{entity_type}: {', '.join(entities)}")
    
    print("\nSummary:")
    print(result['summary'])
    
    # Test crypto-specific sentiment
    btc_result = analyzer.analyze_crypto_specific_sentiment(test_article['content'], 'BTC')
    print("\nBitcoin-Specific Sentiment:")
    print(f"Score: {btc_result['sentiment_score']:.2f}")
    print(f"Relevance: {btc_result['relevance']:.2f}")
    if btc_result.get('crypto_sentences'):
        print("Example sentence:", btc_result['crypto_sentences'][0]) 