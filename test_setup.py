#!/usr/bin/env python
"""
CryptoV4 Test Setup Script

This script verifies the project structure and prepares the environment for testing.
It checks for required directories, creates them if needed, and verifies environment variables.

Usage:
    python test_setup.py
"""

import os
import sys
import logging
import json
from datetime import datetime
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("setup_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("setup_test")

# Required project directories
REQUIRED_DIRS = [
    "app",
    "app/data",
    "app/analysis",
    "app/trading",
    "app/frontend",
    "app/backend",
    "test_results"
]

# Required configuration files
REQUIRED_FILES = [
    ".env",
    ".env.example",
    "README.md",
    "requirements.txt"
]

def check_project_structure():
    """Check if the project structure is correctly set up."""
    logger.info("Checking project structure")
    
    # Check current directory
    current_dir = os.getcwd()
    logger.info(f"Current directory: {current_dir}")
    
    # Check required directories
    missing_dirs = []
    existing_dirs = []
    
    for directory in REQUIRED_DIRS:
        dir_path = os.path.join(current_dir, directory)
        if os.path.isdir(dir_path):
            existing_dirs.append(directory)
            logger.info(f"[PASS] Directory exists: {directory}")
        else:
            missing_dirs.append(directory)
            logger.warning(f"[FAIL] Directory missing: {directory}")
    
    # Check required files
    missing_files = []
    existing_files = []
    
    for file in REQUIRED_FILES:
        file_path = os.path.join(current_dir, file)
        if os.path.isfile(file_path):
            existing_files.append(file)
            logger.info(f"[PASS] File exists: {file}")
        else:
            missing_files.append(file)
            logger.warning(f"[FAIL] File missing: {file}")
    
    # Create missing directories if needed
    if missing_dirs:
        logger.info("Creating missing directories")
        for directory in missing_dirs:
            dir_path = os.path.join(current_dir, directory)
            try:
                os.makedirs(dir_path, exist_ok=True)
                logger.info(f"Created directory: {directory}")
            except Exception as e:
                logger.error(f"Error creating directory {directory}: {str(e)}")
    
    return {
        "existing_dirs": existing_dirs,
        "missing_dirs": missing_dirs,
        "existing_files": existing_files,
        "missing_files": missing_files
    }

def check_environment_variables():
    """Check if required environment variables are set."""
    logger.info("Checking environment variables")
    
    # Try to load .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
        logger.info("Loaded environment variables from .env")
    except ImportError:
        logger.warning("python-dotenv not installed, skipping .env loading")
    
    # Required environment variables
    required_vars = [
        "MONGODB_URI",
        "BINANCE_API_KEY",
        "BINANCE_API_SECRET",
        "NEWS_API_KEY"
    ]
    
    # Check if variables are set
    missing_vars = []
    existing_vars = []
    
    for var in required_vars:
        if var in os.environ and os.environ[var]:
            existing_vars.append(var)
            logger.info(f"[PASS] Environment variable set: {var}")
        else:
            missing_vars.append(var)
            logger.warning(f"[FAIL] Environment variable missing: {var}")
    
    return {
        "existing_vars": existing_vars,
        "missing_vars": missing_vars
    }

def check_python_packages():
    """Check if required Python packages are installed."""
    logger.info("Checking Python packages")
    
    # Required packages
    required_packages = [
        "pandas",
        "numpy",
        "matplotlib",
        "scipy",
        "requests",
        "binance",
        "pymongo",
        "ccxt"
    ]
    
    # Optional packages
    optional_packages = [
        "transformers",
        "torch",
        "ta-lib"
    ]
    
    # Check if packages are installed
    missing_packages = []
    existing_packages = []
    missing_optional = []
    existing_optional = []
    
    for package in required_packages:
        try:
            __import__(package)
            existing_packages.append(package)
            logger.info(f"[PASS] Package installed: {package}")
        except ImportError:
            missing_packages.append(package)
            logger.warning(f"[FAIL] Package missing: {package}")
    
    for package in optional_packages:
        try:
            __import__(package)
            existing_optional.append(package)
            logger.info(f"[PASS] Optional package installed: {package}")
        except ImportError:
            missing_optional.append(package)
            logger.info(f"[INFO] Optional package not found: {package}")
    
    return {
        "existing_packages": existing_packages,
        "missing_packages": missing_packages,
        "existing_optional": existing_optional,
        "missing_optional": missing_optional
    }

def create_dummy_config():
    """Create a dummy config.py file if it doesn't exist."""
    logger.info("Checking config.py")
    
    config_path = os.path.join(os.getcwd(), "config.py")
    
    if os.path.isfile(config_path):
        logger.info("[PASS] config.py exists")
        return True
    
    logger.warning("[FAIL] config.py missing, creating dummy file")
    
    try:
        with open(config_path, "w") as f:
            f.write('''"""
Configuration file for CryptoV4
This file contains configuration settings for the application.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Logging configuration
LOGGING_CONFIG = {
    'log_level': os.getenv('LOG_LEVEL', 'INFO'),
    'log_format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'log_file': os.getenv('LOG_FILE', 'crypto_v4.log')
}

# Binance API configuration
BINANCE_CONFIG = {
    'api_key': os.getenv('BINANCE_API_KEY', ''),
    'api_secret': os.getenv('BINANCE_API_SECRET', ''),
    'use_testnet': os.getenv('USE_TESTNET', 'True').lower() in ('true', '1', 't'),
    'recv_window': int(os.getenv('RECV_WINDOW', 5000))
}

# Exchange configuration for other exchanges
EXCHANGE_CONFIG = {
    'coinbasepro': {
        'api_key': os.getenv('COINBASE_API_KEY', ''),
        'api_secret': os.getenv('COINBASE_API_SECRET', ''),
        'use_sandbox': os.getenv('COINBASE_USE_SANDBOX', 'True').lower() in ('true', '1', 't')
    },
    'kraken': {
        'api_key': os.getenv('KRAKEN_API_KEY', ''),
        'api_secret': os.getenv('KRAKEN_API_SECRET', ''),
        'use_sandbox': os.getenv('KRAKEN_USE_SANDBOX', 'True').lower() in ('true', '1', 't')
    }
}

# MongoDB configuration
MONGODB_CONFIG = {
    'uri': os.getenv('MONGODB_URI', 'mongodb://localhost:27017'),
    'db_name': os.getenv('MONGODB_DB', 'crypto_v4')
}

# News API configuration
NEWS_CONFIG = {
    'news_api_key': os.getenv('NEWS_API_KEY', ''),
    'cryptocompare_api_key': os.getenv('CRYPTOCOMPARE_API_KEY', ''),
    'update_interval': int(os.getenv('NEWS_UPDATE_INTERVAL', 3600)),
    'max_news_age_days': int(os.getenv('MAX_NEWS_AGE_DAYS', 2))
}

# Sentiment analysis configuration
SENTIMENT_CONFIG = {
    'max_threads': int(os.getenv('SENTIMENT_MAX_THREADS', 4)),
    'update_interval': int(os.getenv('SENTIMENT_UPDATE_INTERVAL', 3600)),
    'threshold_positive': float(os.getenv('SENTIMENT_THRESHOLD_POSITIVE', 0.5)),
    'threshold_negative': float(os.getenv('SENTIMENT_THRESHOLD_NEGATIVE', -0.5))
}

# Portfolio configuration
PORTFOLIO_CONFIG = {
    'risk_free_rate': float(os.getenv('RISK_FREE_RATE', 0.02)),
    'lookback_days': int(os.getenv('PORTFOLIO_LOOKBACK_DAYS', 90)),
    'data_interval': os.getenv('PORTFOLIO_DATA_INTERVAL', '1d'),
    'max_assets': int(os.getenv('PORTFOLIO_MAX_ASSETS', 10)),
    'min_weight': float(os.getenv('PORTFOLIO_MIN_WEIGHT', 0.02))
}

# Trading strategy configuration
STRATEGY_CONFIG = {
    'update_interval': int(os.getenv('STRATEGY_UPDATE_INTERVAL', 3600)),
    'symbols': os.getenv('TRADING_SYMBOLS', 'BTCUSDT,ETHUSDT,BNBUSDT').split(','),
    'trade_amount_usd': float(os.getenv('TRADE_AMOUNT_USD', 100.0)),
    'max_open_trades': int(os.getenv('MAX_OPEN_TRADES', 5))
}

# API server configuration
API_CONFIG = {
    'host': os.getenv('API_HOST', '0.0.0.0'),
    'port': int(os.getenv('API_PORT', 5000)),
    'debug': os.getenv('API_DEBUG', 'False').lower() in ('true', '1', 't'),
    'secret_key': os.getenv('API_SECRET_KEY', 'your-secret-key-here'),
    'cors_origins': os.getenv('CORS_ORIGINS', '*')
}

# Test configuration
TEST_CONFIG = {
    'use_mock_apis': os.getenv('USE_MOCK_APIS', 'True').lower() in ('true', '1', 't')
}
''')
        logger.info("Created dummy config.py")
        return True
    except Exception as e:
        logger.error(f"Error creating config.py: {str(e)}")
        return False

def run_setup():
    """Run the setup process."""
    logger.info("Starting CryptoV4 setup test")
    
    # Initialize results dictionary
    results = {
        "timestamp": datetime.now().isoformat(),
        "project_structure": {},
        "environment_variables": {},
        "python_packages": {}
    }
    
    # Check project structure
    try:
        structure_results = check_project_structure()
        results["project_structure"] = structure_results
    except Exception as e:
        logger.error(f"Error checking project structure: {str(e)}")
        logger.error(traceback.format_exc())
        results["project_structure"] = {"error": str(e)}
    
    # Check environment variables
    try:
        env_results = check_environment_variables()
        results["environment_variables"] = env_results
    except Exception as e:
        logger.error(f"Error checking environment variables: {str(e)}")
        logger.error(traceback.format_exc())
        results["environment_variables"] = {"error": str(e)}
    
    # Check Python packages
    try:
        package_results = check_python_packages()
        results["python_packages"] = package_results
    except Exception as e:
        logger.error(f"Error checking Python packages: {str(e)}")
        logger.error(traceback.format_exc())
        results["python_packages"] = {"error": str(e)}
    
    # Create dummy config.py if needed
    try:
        config_created = create_dummy_config()
        results["config_created"] = config_created
    except Exception as e:
        logger.error(f"Error creating config.py: {str(e)}")
        logger.error(traceback.format_exc())
        results["config_created"] = False
    
    # Create test_results directory if it doesn't exist
    try:
        os.makedirs(os.path.join(os.getcwd(), "test_results"), exist_ok=True)
    except Exception as e:
        logger.error(f"Error creating test_results directory: {str(e)}")
    
    # Save results to JSON
    try:
        results_path = os.path.join(os.getcwd(), "test_results", "setup_results.json")
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2, default=str)
        logger.info(f"Setup results saved to {results_path}")
    except Exception as e:
        logger.error(f"Error saving results: {str(e)}")
    
    # Generate summary
    logger.info("Setup test summary:")
    logger.info(f"Directories: {len(results['project_structure'].get('existing_dirs', []))} existing, {len(results['project_structure'].get('missing_dirs', []))} created")
    logger.info(f"Files: {len(results['project_structure'].get('existing_files', []))} existing, {len(results['project_structure'].get('missing_files', []))} missing")
    logger.info(f"Environment variables: {len(results['environment_variables'].get('existing_vars', []))} set, {len(results['environment_variables'].get('missing_vars', []))} missing")
    logger.info(f"Required packages: {len(results['python_packages'].get('existing_packages', []))} installed, {len(results['python_packages'].get('missing_packages', []))} missing")
    logger.info(f"Optional packages: {len(results['python_packages'].get('existing_optional', []))} installed, {len(results['python_packages'].get('missing_optional', []))} not found")
    
    return results

if __name__ == "__main__":
    try:
        results = run_setup()
        
        # Determine exit code based on success/failure
        missing_dirs = len(results.get("project_structure", {}).get("missing_dirs", []))
        missing_files = len(results.get("project_structure", {}).get("missing_files", []))
        missing_packages = len(results.get("python_packages", {}).get("missing_packages", []))
        
        # Only consider required packages for pass/fail (not optional ones)
        sys.exit(0 if missing_packages == 0 else 1)
    except Exception as e:
        logger.error(f"Unhandled error in setup test: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1) 