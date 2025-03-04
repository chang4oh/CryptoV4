"""
Strategy Base Class for CryptoV4

This module provides the base class for all trading strategies.
Each strategy should inherit from this class and implement its methods.
"""

import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union


class Strategy(ABC):
    """Base class for all trading strategies"""
    
    def __init__(self, name: str):
        """
        Initialize strategy.
        
        Args:
            name: Name of the strategy
        """
        self.name = name
        self.min_required_candles = 1  # Minimum number of candles required for the strategy to work
        self.parameters = {}  # Dictionary to store strategy parameters
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        """
        Set strategy parameters.
        
        Args:
            parameters: Dictionary of parameter name/value pairs
        """
        self.parameters = parameters.copy()
        
        # Update instance attributes for parameters
        for key, value in parameters.items():
            setattr(self, key, value)
    
    def get_parameters(self) -> Dict[str, Any]:
        """
        Get current strategy parameters.
        
        Returns:
            Dictionary of current parameters
        """
        return self.parameters.copy()
    
    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for strategy (e.g., calculate indicators).
        Should be implemented by concrete strategy classes.
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            DataFrame with added columns for indicators
        """
        return data
    
    @abstractmethod
    def generate_signal(self, data: pd.DataFrame) -> int:
        """
        Generate trading signal based on data.
        Must be implemented by concrete strategy classes.
        
        Args:
            data: DataFrame with OHLCV data and indicators
            
        Returns:
            Signal: 1 for buy, -1 for sell, 0 for no action
        """
        pass
    
    def generate_risk_adjustment(self, data: pd.DataFrame) -> float:
        """
        Generate risk adjustment factor (e.g., position size multiplier).
        Optional method that can be overridden by concrete strategy classes.
        
        Args:
            data: DataFrame with OHLCV data and indicators
            
        Returns:
            Risk adjustment factor (1.0 = normal size, 0.5 = half size, etc.)
        """
        return 1.0
    
    def should_update_stop_loss(self, data: pd.DataFrame, current_stop: float) -> Optional[float]:
        """
        Determine if stop loss should be updated (e.g., for trailing stops).
        Optional method that can be overridden by concrete strategy classes.
        
        Args:
            data: DataFrame with OHLCV data and indicators
            current_stop: Current stop loss price
            
        Returns:
            New stop loss price or None if no update
        """
        return None
    
    def validate(self) -> bool:
        """
        Validate strategy parameters and settings.
        Optional method that can be overridden by concrete strategy classes.
        
        Returns:
            True if valid, False otherwise
        """
        return True
    
    def __str__(self) -> str:
        """String representation of the strategy."""
        params = ", ".join(f"{k}={v}" for k, v in self.parameters.items())
        return f"{self.name} Strategy ({params})"


class MovingAverageStrategy(Strategy):
    """
    Example implementation of a moving average crossover strategy.
    This serves as a template for implementing actual strategies.
    """
    
    def __init__(self, short_window: int = 20, long_window: int = 50):
        """
        Initialize moving average strategy.
        
        Args:
            short_window: Short moving average window
            long_window: Long moving average window
        """
        super().__init__("Moving Average Crossover")
        self.short_window = short_window
        self.long_window = long_window
        self.min_required_candles = long_window
        
        # Store parameters
        self.parameters = {
            'short_window': short_window,
            'long_window': long_window
        }
    
    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate moving averages.
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            DataFrame with added moving average columns
        """
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Calculate moving averages
        df['short_ma'] = df['close'].rolling(window=self.short_window).mean()
        df['long_ma'] = df['close'].rolling(window=self.long_window).mean()
        
        return df
    
    def generate_signal(self, data: pd.DataFrame) -> int:
        """
        Generate trading signal based on moving average crossover.
        
        Args:
            data: DataFrame with OHLCV data and indicators
            
        Returns:
            Signal: 1 for buy, -1 for sell, 0 for no action
        """
        if len(data) < self.min_required_candles:
            return 0
        
        # Get latest values
        current_short_ma = data['short_ma'].iloc[-1]
        current_long_ma = data['long_ma'].iloc[-1]
        
        if pd.isna(current_short_ma) or pd.isna(current_long_ma):
            return 0
        
        # Get previous values (for crossover detection)
        if len(data) > 1:
            prev_short_ma = data['short_ma'].iloc[-2]
            prev_long_ma = data['long_ma'].iloc[-2]
            
            # Check for crossover
            if prev_short_ma <= prev_long_ma and current_short_ma > current_long_ma:
                return 1  # Buy signal (short MA crosses above long MA)
            elif prev_short_ma >= prev_long_ma and current_short_ma < current_long_ma:
                return -1  # Sell signal (short MA crosses below long MA)
        
        return 0  # No signal


class RSIStrategy(Strategy):
    """
    Example implementation of an RSI strategy.
    This serves as a template for implementing actual strategies.
    """
    
    def __init__(self, rsi_period: int = 14, oversold: int = 30, overbought: int = 70):
        """
        Initialize RSI strategy.
        
        Args:
            rsi_period: RSI calculation period
            oversold: RSI oversold threshold
            overbought: RSI overbought threshold
        """
        super().__init__("RSI")
        self.rsi_period = rsi_period
        self.oversold = oversold
        self.overbought = overbought
        self.min_required_candles = rsi_period + 1
        
        # Store parameters
        self.parameters = {
            'rsi_period': rsi_period,
            'oversold': oversold,
            'overbought': overbought
        }
    
    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate RSI.
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            DataFrame with added RSI column
        """
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Calculate RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_period).mean()
        
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        return df
    
    def generate_signal(self, data: pd.DataFrame) -> int:
        """
        Generate trading signal based on RSI.
        
        Args:
            data: DataFrame with OHLCV data and indicators
            
        Returns:
            Signal: 1 for buy, -1 for sell, 0 for no action
        """
        if len(data) < self.min_required_candles:
            return 0
        
        # Get latest RSI value
        current_rsi = data['rsi'].iloc[-1]
        
        if pd.isna(current_rsi):
            return 0
        
        # Get previous RSI value
        if len(data) > 1:
            prev_rsi = data['rsi'].iloc[-2]
            
            # Generate signals
            if prev_rsi <= self.oversold and current_rsi > self.oversold:
                return 1  # Buy signal (RSI crosses above oversold)
            elif prev_rsi >= self.overbought and current_rsi < self.overbought:
                return -1  # Sell signal (RSI crosses below overbought)
        
        return 0  # No signal


# Factory function to create strategy instances
def create_strategy(strategy_type: str, **kwargs) -> Strategy:
    """
    Factory function to create strategy instances.
    
    Args:
        strategy_type: Type of strategy to create
        **kwargs: Strategy-specific parameters
        
    Returns:
        Strategy instance
        
    Raises:
        ValueError: If strategy_type is not recognized
    """
    strategies = {
        'moving_average': MovingAverageStrategy,
        'rsi': RSIStrategy,
        # Add more strategies here
    }
    
    if strategy_type not in strategies:
        raise ValueError(f"Unknown strategy type: {strategy_type}. Available types: {list(strategies.keys())}")
    
    return strategies[strategy_type](**kwargs) 