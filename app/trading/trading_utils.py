"""
Trading Utilities for CryptoV4

This module provides utility functions for trading calculations such as
drawdown, Sharpe ratio, and other performance metrics.
"""

import numpy as np
import pandas as pd
from typing import Union, List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta


def calculate_drawdown(equity_series: pd.Series) -> float:
    """
    Calculate the maximum drawdown of an equity curve.
    
    Args:
        equity_series: Pandas Series containing equity values
        
    Returns:
        Maximum drawdown as a decimal (e.g., 0.2 for 20% drawdown)
    """
    if equity_series.empty:
        return 0.0
    
    # Calculate the running maximum
    running_max = equity_series.cummax()
    
    # Calculate drawdown in percentage terms
    drawdown = (equity_series - running_max) / running_max
    
    # Return the maximum drawdown
    return abs(drawdown.min()) if not np.isnan(drawdown.min()) else 0.0


def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0, periods_per_year: int = 252) -> float:
    """
    Calculate the Sharpe ratio of a returns series.
    
    Args:
        returns: Pandas Series containing period returns
        risk_free_rate: Annualized risk-free rate (default: 0)
        periods_per_year: Number of periods in a year (default: 252 for daily returns)
        
    Returns:
        Sharpe ratio
    """
    if returns.empty or len(returns) < 2:
        return 0.0
    
    # Convert annual risk-free rate to per-period rate
    rf_per_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
    
    # Calculate excess returns
    excess_returns = returns - rf_per_period
    
    # Calculate annualized Sharpe ratio
    sharpe_ratio = (excess_returns.mean() / excess_returns.std()) * np.sqrt(periods_per_year)
    
    return sharpe_ratio if not np.isnan(sharpe_ratio) else 0.0


def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.0, periods_per_year: int = 252) -> float:
    """
    Calculate the Sortino ratio of a returns series.
    
    Args:
        returns: Pandas Series containing period returns
        risk_free_rate: Annualized risk-free rate (default: 0)
        periods_per_year: Number of periods in a year (default: 252 for daily returns)
        
    Returns:
        Sortino ratio
    """
    if returns.empty or len(returns) < 2:
        return 0.0
    
    # Convert annual risk-free rate to per-period rate
    rf_per_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
    
    # Calculate excess returns
    excess_returns = returns - rf_per_period
    
    # Calculate downside deviation (only negative returns)
    downside_returns = excess_returns[excess_returns < 0]
    downside_deviation = downside_returns.std() * np.sqrt(periods_per_year)
    
    if downside_deviation == 0 or np.isnan(downside_deviation):
        return 0.0
    
    # Calculate annualized Sortino ratio
    sortino_ratio = (excess_returns.mean() * periods_per_year) / downside_deviation
    
    return sortino_ratio if not np.isnan(sortino_ratio) else 0.0


def calculate_max_consecutive_losses(trades: List[Dict[str, Any]]) -> int:
    """
    Calculate the maximum number of consecutive losing trades.
    
    Args:
        trades: List of trade dictionaries with 'profit' key
        
    Returns:
        Maximum number of consecutive losses
    """
    if not trades:
        return 0
    
    max_consecutive = 0
    current_consecutive = 0
    
    for trade in trades:
        if trade.get('profit', 0) < 0:
            current_consecutive += 1
            max_consecutive = max(max_consecutive, current_consecutive)
        else:
            current_consecutive = 0
    
    return max_consecutive


def calculate_profit_factor(trades: List[Dict[str, Any]]) -> float:
    """
    Calculate the profit factor (gross profit / gross loss).
    
    Args:
        trades: List of trade dictionaries with 'profit' key
        
    Returns:
        Profit factor (> 1 is profitable)
    """
    if not trades:
        return 0.0
    
    gross_profit = sum(trade.get('profit', 0) for trade in trades if trade.get('profit', 0) > 0)
    gross_loss = abs(sum(trade.get('profit', 0) for trade in trades if trade.get('profit', 0) < 0))
    
    if gross_loss == 0:
        return float('inf') if gross_profit > 0 else 0.0
    
    return gross_profit / gross_loss


def calculate_recovery_factor(equity_series: pd.Series) -> float:
    """
    Calculate the recovery factor (net profit / maximum drawdown).
    
    Args:
        equity_series: Pandas Series containing equity values
        
    Returns:
        Recovery factor
    """
    if equity_series.empty or len(equity_series) < 2:
        return 0.0
    
    net_profit = equity_series.iloc[-1] - equity_series.iloc[0]
    max_drawdown = calculate_drawdown(equity_series) * equity_series.iloc[0]
    
    if max_drawdown == 0:
        return float('inf') if net_profit > 0 else 0.0
    
    return net_profit / max_drawdown


def calculate_win_rate(trades: List[Dict[str, Any]]) -> float:
    """
    Calculate the win rate (percentage of winning trades).
    
    Args:
        trades: List of trade dictionaries with 'profit' key
        
    Returns:
        Win rate as a decimal (e.g., 0.65 for 65%)
    """
    if not trades:
        return 0.0
    
    winning_trades = sum(1 for trade in trades if trade.get('profit', 0) > 0)
    return winning_trades / len(trades)


def calculate_average_trade(trades: List[Dict[str, Any]]) -> Tuple[float, float]:
    """
    Calculate the average profit per trade in currency and percentage terms.
    
    Args:
        trades: List of trade dictionaries with 'profit' and 'profit_pct' keys
        
    Returns:
        Tuple of (average profit, average profit percentage)
    """
    if not trades:
        return (0.0, 0.0)
    
    avg_profit = sum(trade.get('profit', 0) for trade in trades) / len(trades)
    
    # If profit_pct is available for all trades, calculate average
    if all('profit_pct' in trade for trade in trades):
        avg_profit_pct = sum(trade.get('profit_pct', 0) for trade in trades) / len(trades)
    else:
        avg_profit_pct = 0.0
    
    return (avg_profit, avg_profit_pct)


def calculate_expectancy(trades: List[Dict[str, Any]]) -> float:
    """
    Calculate the system expectancy (average profit per trade / average loss per trade).
    
    Args:
        trades: List of trade dictionaries with 'profit' key
        
    Returns:
        System expectancy
    """
    if not trades:
        return 0.0
    
    winning_trades = [trade for trade in trades if trade.get('profit', 0) > 0]
    losing_trades = [trade for trade in trades if trade.get('profit', 0) < 0]
    
    if not winning_trades or not losing_trades:
        return 0.0
    
    avg_win = sum(trade.get('profit', 0) for trade in winning_trades) / len(winning_trades)
    avg_loss = abs(sum(trade.get('profit', 0) for trade in losing_trades) / len(losing_trades))
    
    win_rate = len(winning_trades) / len(trades)
    
    if avg_loss == 0:
        return float('inf') if win_rate > 0 else 0.0
    
    return (win_rate * avg_win / avg_loss) - ((1 - win_rate) * 1)


def calculate_annualized_return(equity_series: pd.Series, days_in_year: int = 365) -> float:
    """
    Calculate the annualized return of an equity curve.
    
    Args:
        equity_series: Pandas Series containing equity values with datetime index
        days_in_year: Number of days in a year (default: 365)
        
    Returns:
        Annualized return as a decimal (e.g., 0.15 for 15%)
    """
    if equity_series.empty or len(equity_series) < 2:
        return 0.0
    
    start_value = equity_series.iloc[0]
    end_value = equity_series.iloc[-1]
    
    # Calculate total return
    total_return = end_value / start_value - 1
    
    # Calculate duration in days
    if isinstance(equity_series.index, pd.DatetimeIndex):
        start_date = equity_series.index[0]
        end_date = equity_series.index[-1]
        duration_days = (end_date - start_date).days
    else:
        # If index is not datetime, assume daily data
        duration_days = len(equity_series) - 1
    
    if duration_days <= 0:
        return total_return  # Return total return for very short periods
    
    # Annualize the return
    years = duration_days / days_in_year
    annualized_return = (1 + total_return) ** (1 / years) - 1
    
    return annualized_return


def calculate_volatility(returns: pd.Series, periods_per_year: int = 252) -> float:
    """
    Calculate the annualized volatility of returns.
    
    Args:
        returns: Pandas Series containing period returns
        periods_per_year: Number of periods in a year (default: 252 for daily returns)
        
    Returns:
        Annualized volatility as a decimal
    """
    if returns.empty or len(returns) < 2:
        return 0.0
    
    volatility = returns.std() * np.sqrt(periods_per_year)
    
    return volatility if not np.isnan(volatility) else 0.0


def calculate_calmar_ratio(equity_series: pd.Series, periods_per_year: int = 252) -> float:
    """
    Calculate the Calmar ratio (annualized return / maximum drawdown).
    
    Args:
        equity_series: Pandas Series containing equity values with datetime index
        periods_per_year: Number of periods in a year (default: 252 for daily returns)
        
    Returns:
        Calmar ratio
    """
    if equity_series.empty or len(equity_series) < 2:
        return 0.0
    
    # Calculate annualized return
    ann_return = calculate_annualized_return(equity_series)
    
    # Calculate maximum drawdown
    max_dd = calculate_drawdown(equity_series)
    
    if max_dd == 0:
        return float('inf') if ann_return > 0 else 0.0
    
    return ann_return / max_dd


def calculate_trade_statistics(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate comprehensive statistics for a list of trades.
    
    Args:
        trades: List of trade dictionaries
        
    Returns:
        Dictionary with trade statistics
    """
    if not trades:
        return {
            'num_trades': 0,
            'win_rate': 0.0,
            'avg_profit': 0.0,
            'avg_profit_pct': 0.0,
            'profit_factor': 0.0,
            'expectancy': 0.0,
            'max_consecutive_losses': 0,
            'avg_trade_duration': timedelta(0),
            'best_trade': 0.0,
            'worst_trade': 0.0
        }
    
    # Basic trade statistics
    num_trades = len(trades)
    win_rate = calculate_win_rate(trades)
    avg_profit, avg_profit_pct = calculate_average_trade(trades)
    profit_factor = calculate_profit_factor(trades)
    expectancy = calculate_expectancy(trades)
    max_consecutive_losses = calculate_max_consecutive_losses(trades)
    
    # Calculate average trade duration
    durations = []
    for trade in trades:
        if 'entry_time' in trade and 'exit_time' in trade:
            try:
                # For datetime objects
                if isinstance(trade['entry_time'], datetime) and isinstance(trade['exit_time'], datetime):
                    durations.append(trade['exit_time'] - trade['entry_time'])
                # For strings, try to parse them
                elif isinstance(trade['entry_time'], str) and isinstance(trade['exit_time'], str):
                    entry = pd.to_datetime(trade['entry_time'])
                    exit = pd.to_datetime(trade['exit_time'])
                    durations.append(exit - entry)
            except (ValueError, TypeError):
                pass
    
    avg_duration = sum(durations, timedelta(0)) / len(durations) if durations else timedelta(0)
    
    # Best and worst trades
    profits = [trade.get('profit', 0) for trade in trades]
    best_trade = max(profits) if profits else 0.0
    worst_trade = min(profits) if profits else 0.0
    
    return {
        'num_trades': num_trades,
        'win_rate': win_rate,
        'avg_profit': avg_profit,
        'avg_profit_pct': avg_profit_pct,
        'profit_factor': profit_factor,
        'expectancy': expectancy,
        'max_consecutive_losses': max_consecutive_losses,
        'avg_trade_duration': avg_duration,
        'best_trade': best_trade,
        'worst_trade': worst_trade
    }


def calculate_equity_statistics(equity_series: pd.Series, risk_free_rate: float = 0.0) -> Dict[str, Any]:
    """
    Calculate comprehensive statistics for an equity curve.
    
    Args:
        equity_series: Pandas Series containing equity values with datetime index
        risk_free_rate: Annualized risk-free rate (default: 0)
        
    Returns:
        Dictionary with equity statistics
    """
    if equity_series.empty or len(equity_series) < 2:
        return {
            'total_return': 0.0,
            'total_return_pct': 0.0,
            'annualized_return': 0.0,
            'max_drawdown': 0.0,
            'sharpe_ratio': 0.0,
            'sortino_ratio': 0.0,
            'calmar_ratio': 0.0,
            'volatility': 0.0,
            'recovery_factor': 0.0
        }
    
    # Calculate returns
    returns = equity_series.pct_change().dropna()
    
    # Basic equity statistics
    total_return = equity_series.iloc[-1] - equity_series.iloc[0]
    total_return_pct = (total_return / equity_series.iloc[0]) * 100
    annualized_return = calculate_annualized_return(equity_series) * 100  # to percentage
    max_drawdown = calculate_drawdown(equity_series) * 100  # to percentage
    
    # Risk metrics
    sharpe_ratio = calculate_sharpe_ratio(returns, risk_free_rate)
    sortino_ratio = calculate_sortino_ratio(returns, risk_free_rate)
    calmar_ratio = calculate_calmar_ratio(equity_series)
    volatility = calculate_volatility(returns) * 100  # to percentage
    recovery_factor = calculate_recovery_factor(equity_series)
    
    return {
        'total_return': total_return,
        'total_return_pct': total_return_pct,
        'annualized_return': annualized_return,
        'max_drawdown': max_drawdown,
        'sharpe_ratio': sharpe_ratio,
        'sortino_ratio': sortino_ratio,
        'calmar_ratio': calmar_ratio,
        'volatility': volatility,
        'recovery_factor': recovery_factor
    } 