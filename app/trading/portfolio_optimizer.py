"""
Portfolio Optimization Module for CryptoV4

This module implements portfolio optimization algorithms to optimize cryptocurrency allocations
based on Modern Portfolio Theory (MPT), risk management techniques, and custom constraints.
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Optional, Union, Any
import scipy.optimize as sco
from scipy.stats import norm
import json
import os
import sys
from dataclasses import dataclass

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

# Import project modules
from app.data.exchange_interface import ExchangeFactory
from app.data.market_data import MarketDataCollector
from config import LOGGING_CONFIG, PORTFOLIO_CONFIG

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

@dataclass
class AssetAllocation:
    """Asset allocation data class"""
    symbol: str
    weight: float
    expected_return: float
    risk: float
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'symbol': self.symbol,
            'weight': round(self.weight, 4),
            'allocation_percent': round(self.weight * 100, 2),
            'expected_return': round(self.expected_return, 4),
            'risk': round(self.risk, 4)
        }

@dataclass
class PortfolioAllocation:
    """Portfolio allocation data class"""
    assets: List[AssetAllocation]
    expected_return: float
    risk: float
    sharpe_ratio: float
    timestamp: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'assets': [asset.to_dict() for asset in self.assets],
            'expected_return': round(self.expected_return, 4),
            'risk': round(self.risk, 4),
            'sharpe_ratio': round(self.sharpe_ratio, 4),
            'timestamp': self.timestamp
        }

class PortfolioOptimizer:
    """
    Portfolio optimizer implementing Modern Portfolio Theory and risk management algorithms.
    """
    
    def __init__(self, exchange_id: str = 'binance'):
        """
        Initialize the portfolio optimizer.
        
        Args:
            exchange_id: Exchange ID (default: 'binance')
        """
        self.exchange_id = exchange_id
        self.exchange = ExchangeFactory.get_exchange(exchange_id)
        self.market_data = MarketDataCollector()
        
        # Load configuration
        self.risk_free_rate = PORTFOLIO_CONFIG.get('risk_free_rate', 0.02)
        self.default_lookback_days = PORTFOLIO_CONFIG.get('lookback_days', 90)
        self.default_data_interval = PORTFOLIO_CONFIG.get('data_interval', '1d')
        self.max_assets = PORTFOLIO_CONFIG.get('max_assets', 10)
        self.min_weight = PORTFOLIO_CONFIG.get('min_weight', 0.02)
        
        # For storing historical data
        self.historical_data = {}
        self.returns_data = None
        self.covariance_matrix = None
        self.mean_returns = None
        self.symbols = []
        self.efficient_frontier = []
        
        logger.info(f"Portfolio optimizer initialized with {exchange_id} exchange")
    
    def load_market_data(self, symbols: List[str], lookback_days: Optional[int] = None, 
                         interval: Optional[str] = None) -> pd.DataFrame:
        """
        Load historical market data for the given symbols.
        
        Args:
            symbols: List of trading pair symbols
            lookback_days: Number of days to look back
            interval: Data interval (e.g., '1d', '1h')
            
        Returns:
            DataFrame with close prices for each symbol
        """
        try:
            lookback_days = lookback_days or self.default_lookback_days
            interval = interval or self.default_data_interval
            
            logger.info(f"Loading market data for {len(symbols)} symbols with {lookback_days} days lookback")
            self.symbols = symbols
            
            # Calculate limit based on interval and lookback
            interval_hours = self._interval_to_hours(interval)
            limit = int((lookback_days * 24) / interval_hours) + 10  # Add buffer
            
            # Load historical data for each symbol
            close_prices = {}
            
            for symbol in symbols:
                try:
                    df = self.exchange.get_historical_data(symbol, interval, limit)
                    self.historical_data[symbol] = df
                    close_prices[symbol] = df[['time', 'close']].copy()
                    logger.debug(f"Loaded {len(df)} rows of data for {symbol}")
                except Exception as e:
                    logger.error(f"Error loading data for {symbol}: {str(e)}")
            
            # Combine close prices into a single DataFrame
            if not close_prices:
                raise ValueError("No valid historical data found for any symbols")
            
            result_df = None
            for symbol, df in close_prices.items():
                df = df.rename(columns={'close': symbol})
                if result_df is None:
                    result_df = df
                else:
                    result_df = pd.merge(result_df, df, on='time', how='outer')
            
            # Set time as index and sort
            result_df = result_df.set_index('time').sort_index()
            
            return result_df
        except Exception as e:
            logger.error(f"Error loading market data: {str(e)}")
            raise
    
    def _interval_to_hours(self, interval: str) -> float:
        """
        Convert interval string to hours.
        
        Args:
            interval: Interval string (e.g., '1h', '1d')
            
        Returns:
            Number of hours in the interval
        """
        unit = interval[-1]
        value = float(interval[:-1])
        
        if unit == 'm':
            return value / 60
        elif unit == 'h':
            return value
        elif unit == 'd':
            return value * 24
        elif unit == 'w':
            return value * 24 * 7
        else:
            raise ValueError(f"Unsupported interval unit: {unit}")
    
    def calculate_returns(self, price_data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate daily returns from price data.
        
        Args:
            price_data: DataFrame with close prices
            
        Returns:
            DataFrame with daily returns
        """
        # Calculate daily returns
        returns = price_data.pct_change().dropna()
        
        # Store for later use
        self.returns_data = returns
        self.mean_returns = returns.mean()
        self.covariance_matrix = returns.cov()
        
        return returns
    
    def portfolio_performance(self, weights: np.ndarray) -> Tuple[float, float, float]:
        """
        Calculate expected return, volatility, and Sharpe ratio for a portfolio.
        
        Args:
            weights: Portfolio weights
            
        Returns:
            Tuple of (expected return, volatility, Sharpe ratio)
        """
        if self.mean_returns is None or self.covariance_matrix is None:
            raise ValueError("Returns data not calculated. Call calculate_returns first.")
        
        # Expected portfolio return (annualized)
        expected_return = np.sum(self.mean_returns * weights) * 252
        
        # Expected portfolio volatility (annualized)
        volatility = np.sqrt(np.dot(weights.T, np.dot(self.covariance_matrix * 252, weights)))
        
        # Sharpe ratio
        sharpe = (expected_return - self.risk_free_rate) / volatility
        
        return expected_return, volatility, sharpe
    
    def negative_sharpe(self, weights: np.ndarray) -> float:
        """
        Calculate negative Sharpe ratio for optimization (minimization).
        
        Args:
            weights: Portfolio weights
            
        Returns:
            Negative Sharpe ratio
        """
        expected_return, volatility, sharpe = self.portfolio_performance(weights)
        return -sharpe
    
    def minimize_volatility(self, weights: np.ndarray) -> float:
        """
        Calculate portfolio volatility for optimization (minimization).
        
        Args:
            weights: Portfolio weights
            
        Returns:
            Portfolio volatility
        """
        expected_return, volatility, sharpe = self.portfolio_performance(weights)
        return volatility
    
    def maximize_return(self, weights: np.ndarray) -> float:
        """
        Calculate negative portfolio return for optimization (minimization).
        
        Args:
            weights: Portfolio weights
            
        Returns:
            Negative portfolio return
        """
        expected_return, volatility, sharpe = self.portfolio_performance(weights)
        return -expected_return
    
    def optimize_portfolio(self, symbols: List[str], objective: str = 'sharpe', 
                          lookback_days: Optional[int] = None,
                          interval: Optional[str] = None) -> PortfolioAllocation:
        """
        Optimize portfolio allocation using Modern Portfolio Theory.
        
        Args:
            symbols: List of trading pair symbols
            objective: Optimization objective ('sharpe', 'min_risk', 'max_return')
            lookback_days: Number of days to look back
            interval: Data interval (e.g., '1d', '1h')
            
        Returns:
            PortfolioAllocation object with optimized allocation
        """
        try:
            # Load historical price data
            price_data = self.load_market_data(symbols, lookback_days, interval)
            
            # Calculate returns
            self.calculate_returns(price_data)
            
            # Set up optimization constraints
            num_assets = len(symbols)
            
            # Initial guess (equal weighting)
            initial_weights = np.array([1.0 / num_assets] * num_assets)
            
            # Weight bounds (ensure all weights are between min_weight and 1.0)
            # If min_weight * num_assets > 1, adjust min_weight
            min_weight = min(self.min_weight, 1.0 / num_assets)
            bounds = tuple((min_weight, 1.0) for _ in range(num_assets))
            
            # Constraint: Sum of weights = 1
            constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
            
            # Choose objective function based on objective parameter
            if objective == 'sharpe':
                objective_function = self.negative_sharpe
            elif objective == 'min_risk':
                objective_function = self.minimize_volatility
            elif objective == 'max_return':
                objective_function = self.maximize_return
            else:
                raise ValueError(f"Invalid objective: {objective}. Must be 'sharpe', 'min_risk', or 'max_return'")
            
            # Run optimization
            result = sco.minimize(
                objective_function,
                initial_weights,
                method='SLSQP',
                bounds=bounds,
                constraints=constraints
            )
            
            if not result['success']:
                logger.warning(f"Optimization failed: {result['message']}")
            
            # Get optimal weights
            optimal_weights = result['x']
            
            # Calculate performance metrics
            expected_return, volatility, sharpe = self.portfolio_performance(optimal_weights)
            
            # Create asset allocations
            asset_allocations = []
            for i, symbol in enumerate(symbols):
                weight = optimal_weights[i]
                if weight > 0.0001:  # Filter out negligible weights
                    expected_asset_return = self.mean_returns[symbol] * 252
                    asset_risk = np.sqrt(self.covariance_matrix.loc[symbol, symbol] * 252)
                    asset_allocations.append(AssetAllocation(
                        symbol=symbol,
                        weight=weight,
                        expected_return=expected_asset_return,
                        risk=asset_risk
                    ))
            
            # Sort by weight, descending
            asset_allocations.sort(key=lambda x: x.weight, reverse=True)
            
            # Create portfolio allocation
            portfolio_allocation = PortfolioAllocation(
                assets=asset_allocations,
                expected_return=expected_return,
                risk=volatility,
                sharpe_ratio=sharpe,
                timestamp=datetime.now().isoformat()
            )
            
            logger.info(f"Portfolio optimized with {objective} objective. "
                       f"Expected return: {expected_return:.4f}, Risk: {volatility:.4f}, "
                       f"Sharpe: {sharpe:.4f}")
            
            return portfolio_allocation
        except Exception as e:
            logger.error(f"Error optimizing portfolio: {str(e)}")
            raise
    
    def generate_efficient_frontier(self, symbols: List[str], points: int = 50,
                                   lookback_days: Optional[int] = None,
                                   interval: Optional[str] = None) -> List[Tuple[float, float]]:
        """
        Generate the efficient frontier for a set of assets.
        
        Args:
            symbols: List of trading pair symbols
            points: Number of points on the frontier
            lookback_days: Number of days to look back
            interval: Data interval (e.g., '1d', '1h')
            
        Returns:
            List of (volatility, return) points on the efficient frontier
        """
        try:
            # Load historical price data (if not already loaded)
            if self.returns_data is None or set(symbols) != set(self.symbols):
                price_data = self.load_market_data(symbols, lookback_days, interval)
                self.calculate_returns(price_data)
            
            num_assets = len(symbols)
            frontier = []
            
            # Find the minimum volatility portfolio
            min_vol_result = self.optimize_portfolio(symbols, 'min_risk', lookback_days, interval)
            min_vol_return = min_vol_result.expected_return
            min_vol_risk = min_vol_result.risk
            
            # Find the maximum return portfolio
            max_ret_result = self.optimize_portfolio(symbols, 'max_return', lookback_days, interval)
            max_ret_return = max_ret_result.expected_return
            max_ret_risk = max_ret_result.risk
            
            # Generate points along the efficient frontier
            target_returns = np.linspace(min_vol_return, max_ret_return, points)
            
            for target_return in target_returns:
                # Set up optimization for minimum volatility at target return
                def min_vol_target_return(weights):
                    return self.minimize_volatility(weights)
                
                # Initial guess (equal weighting)
                initial_weights = np.array([1.0 / num_assets] * num_assets)
                
                # Weight bounds
                min_weight = min(self.min_weight, 1.0 / num_assets)
                bounds = tuple((min_weight, 1.0) for _ in range(num_assets))
                
                # Constraints: Sum of weights = 1, return = target_return
                constraints = (
                    {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
                    {'type': 'eq', 'fun': lambda x: self.portfolio_performance(x)[0] - target_return}
                )
                
                # Run optimization
                try:
                    result = sco.minimize(
                        min_vol_target_return,
                        initial_weights,
                        method='SLSQP',
                        bounds=bounds,
                        constraints=constraints
                    )
                    
                    if result['success']:
                        volatility = self.portfolio_performance(result['x'])[1]
                        frontier.append((volatility, target_return))
                    else:
                        logger.debug(f"Optimization failed for return {target_return}: {result['message']}")
                except Exception as e:
                    logger.debug(f"Error optimizing for return {target_return}: {str(e)}")
            
            # Sort by volatility
            frontier.sort(key=lambda x: x[0])
            
            self.efficient_frontier = frontier
            
            logger.info(f"Generated efficient frontier with {len(frontier)} points")
            
            return frontier
        except Exception as e:
            logger.error(f"Error generating efficient frontier: {str(e)}")
            raise
    
    def plot_efficient_frontier(self, symbols: List[str] = None, points: int = 50, 
                              lookback_days: Optional[int] = None,
                              interval: Optional[str] = None,
                              save_path: Optional[str] = None,
                              show_plot: bool = False) -> Optional[str]:
        """
        Plot the efficient frontier for a set of assets.
        
        Args:
            symbols: List of trading pair symbols
            points: Number of points on the frontier
            lookback_days: Number of days to look back
            interval: Data interval
            save_path: Path to save the plot (optional)
            show_plot: Whether to show the plot
            
        Returns:
            Path to the saved plot if save_path is provided, None otherwise
        """
        try:
            # Use existing frontier or generate new one
            if not self.efficient_frontier or symbols is not None:
                symbols = symbols or self.symbols
                if not symbols:
                    raise ValueError("No symbols provided")
                self.generate_efficient_frontier(symbols, points, lookback_days, interval)
            
            # Create plot
            plt.figure(figsize=(12, 8))
            
            # Plot efficient frontier
            risk = [point[0] for point in self.efficient_frontier]
            returns = [point[1] for point in self.efficient_frontier]
            plt.plot(risk, returns, 'b-', linewidth=3, label='Efficient Frontier')
            
            # Calculate and plot optimized portfolios
            if symbols:
                # Get optimal Sharpe portfolio
                sharpe_portfolio = self.optimize_portfolio(symbols, 'sharpe', lookback_days, interval)
                plt.scatter(
                    sharpe_portfolio.risk, 
                    sharpe_portfolio.expected_return, 
                    marker='*', 
                    color='red', 
                    s=200, 
                    label=f'Optimal Portfolio (Sharpe: {sharpe_portfolio.sharpe_ratio:.2f})'
                )
                
                # Get min volatility portfolio
                min_vol_portfolio = self.optimize_portfolio(symbols, 'min_risk', lookback_days, interval)
                plt.scatter(
                    min_vol_portfolio.risk, 
                    min_vol_portfolio.expected_return, 
                    marker='o', 
                    color='green', 
                    s=150, 
                    label=f'Min Volatility (Risk: {min_vol_portfolio.risk:.2f}%)'
                )
                
                # Get max return portfolio
                max_ret_portfolio = self.optimize_portfolio(symbols, 'max_return', lookback_days, interval)
                plt.scatter(
                    max_ret_portfolio.risk, 
                    max_ret_portfolio.expected_return, 
                    marker='o', 
                    color='purple', 
                    s=150, 
                    label=f'Max Return (Return: {max_ret_portfolio.expected_return:.2f}%)'
                )
                
                # Plot individual assets
                for symbol in symbols:
                    asset_return = self.mean_returns[symbol] * 252
                    asset_risk = np.sqrt(self.covariance_matrix.loc[symbol, symbol] * 252)
                    plt.scatter(
                        asset_risk, 
                        asset_return, 
                        marker='o', 
                        s=100, 
                        label=symbol
                    )
            
            # Add capital market line if we have the Sharpe portfolio
            if 'sharpe_portfolio' in locals():
                x_range = np.linspace(0, max(risk) * 1.2, 100)
                y_values = self.risk_free_rate + (sharpe_portfolio.expected_return - self.risk_free_rate) / sharpe_portfolio.risk * x_range
                plt.plot(x_range, y_values, 'g--', label='Capital Market Line')
                
                # Plot risk-free rate
                plt.scatter(0, self.risk_free_rate, marker='o', color='black', s=100, label=f'Risk-Free Rate ({self.risk_free_rate:.2%})')
            
            # Format plot
            plt.title('Efficient Frontier & Optimal Portfolio', fontsize=16)
            plt.xlabel('Expected Volatility (Standard Deviation)', fontsize=14)
            plt.ylabel('Expected Return', fontsize=14)
            plt.grid(True, linestyle='--', alpha=0.7)
            plt.legend(loc='best', fontsize=10)
            
            # Format axis as percentages
            plt.gca().xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:.1%}'))
            plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:.1%}'))
            
            # Add timestamp
            plt.figtext(
                0.01, 0.01, 
                f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}',
                ha='left', fontsize=8, color='gray'
            )
            
            plt.tight_layout()
            
            # Save or show plot
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"Efficient frontier plot saved to {save_path}")
                
            if show_plot:
                plt.show()
            
            plt.close()
            
            return save_path if save_path else None
        except Exception as e:
            logger.error(f"Error plotting efficient frontier: {str(e)}")
            plt.close()
            raise
    
    def calculate_portfolio_risk_metrics(self, allocation: PortfolioAllocation) -> Dict:
        """
        Calculate additional risk metrics for a portfolio allocation.
        
        Args:
            allocation: Portfolio allocation
            
        Returns:
            Dictionary of risk metrics
        """
        try:
            # Extract weights and symbols
            weights = [asset.weight for asset in allocation.assets]
            symbols = [asset.symbol for asset in allocation.assets]
            
            # Create weights array
            weights_array = np.zeros(len(self.symbols))
            for i, symbol in enumerate(symbols):
                idx = self.symbols.index(symbol)
                weights_array[idx] = weights[i]
            
            # Calculate metrics
            expected_return = allocation.expected_return
            volatility = allocation.risk
            
            # Calculate Value at Risk (VaR)
            var_95 = -norm.ppf(0.05) * volatility
            var_99 = -norm.ppf(0.01) * volatility
            
            # Calculate Conditional Value at Risk (CVaR) / Expected Shortfall
            cvar_95 = -volatility * norm.pdf(norm.ppf(0.05)) / 0.05
            cvar_99 = -volatility * norm.pdf(norm.ppf(0.01)) / 0.01
            
            # Calculate maximum drawdown (estimate based on volatility)
            max_drawdown_estimate = -2.5 * volatility
            
            # Calculate portfolio beta (relative to BTC if available, otherwise use equal-weighted index)
            if 'BTCUSDT' in self.symbols:
                btc_returns = self.returns_data['BTCUSDT']
                portfolio_returns = np.sum(self.returns_data[symbols].values * weights, axis=1)
                covariance = np.cov(portfolio_returns, btc_returns)[0, 1]
                btc_variance = np.var(btc_returns)
                beta = covariance / btc_variance
            else:
                beta = 1.0  # Default if BTC not available
            
            # Calculate diversification ratio
            weights_vector = np.array(weights)
            weighted_volatility = np.sum(np.sqrt(np.diag(self.covariance_matrix.loc[symbols, symbols].values)) * weights_vector)
            diversification_ratio = weighted_volatility / volatility
            
            # Calculate Sortino ratio (downside risk)
            returns = self.returns_data[symbols]
            portfolio_returns = np.sum(returns.values * weights, axis=1)
            downside_returns = portfolio_returns[portfolio_returns < 0]
            downside_risk = np.sqrt(np.mean(downside_returns**2)) * np.sqrt(252)
            sortino_ratio = (expected_return - self.risk_free_rate) / downside_risk if downside_risk > 0 else np.inf
            
            # Return metrics
            risk_metrics = {
                'var_95': round(var_95, 4),
                'var_99': round(var_99, 4),
                'cvar_95': round(cvar_95, 4),
                'cvar_99': round(cvar_99, 4),
                'max_drawdown_estimate': round(max_drawdown_estimate, 4),
                'beta': round(beta, 4),
                'diversification_ratio': round(diversification_ratio, 4),
                'sortino_ratio': round(sortino_ratio, 4),
                'sharpe_ratio': round(allocation.sharpe_ratio, 4)
            }
            
            return risk_metrics
        except Exception as e:
            logger.error(f"Error calculating portfolio risk metrics: {str(e)}")
            return {}
    
    def rebalance_portfolio(self, current_holdings: Dict[str, float], 
                           target_allocation: PortfolioAllocation,
                           min_trade_amount: float = 10.0) -> Dict:
        """
        Calculate rebalancing trades to match target allocation.
        
        Args:
            current_holdings: Dictionary of current holdings {symbol: amount}
            target_allocation: Target portfolio allocation
            min_trade_amount: Minimum trade amount in USD
            
        Returns:
            Dictionary with rebalancing information
        """
        try:
            # Get current prices
            current_prices = {}
            for symbol in current_holdings.keys():
                try:
                    ticker = self.exchange.get_ticker(symbol)
                    current_prices[symbol] = ticker['price']
                except Exception as e:
                    logger.error(f"Error getting price for {symbol}: {str(e)}")
                    return {'error': f"Couldn't get price for {symbol}"}
            
            # Calculate current portfolio value
            current_value = sum(
                amount * current_prices.get(symbol, 0)
                for symbol, amount in current_holdings.items()
            )
            
            if current_value <= 0:
                return {'error': "Current portfolio value is zero or negative"}
            
            # Calculate current allocation
            current_allocation = {
                symbol: (amount * current_prices.get(symbol, 0)) / current_value
                for symbol, amount in current_holdings.items()
            }
            
            # Get target allocation as dictionary
            target_weights = {asset.symbol: asset.weight for asset in target_allocation.assets}
            
            # Calculate trades
            trades = []
            for symbol in set(list(current_holdings.keys()) + list(target_weights.keys())):
                current_weight = current_allocation.get(symbol, 0)
                target_weight = target_weights.get(symbol, 0)
                
                # Calculate difference in value
                current_symbol_value = current_value * current_weight
                target_symbol_value = current_value * target_weight
                value_difference = target_symbol_value - current_symbol_value
                
                # Skip very small trades
                if abs(value_difference) < min_trade_amount:
                    continue
                
                # Calculate amount to trade
                price = current_prices.get(symbol, 0)
                if price <= 0:
                    logger.warning(f"Invalid price for {symbol}: {price}")
                    continue
                
                amount = value_difference / price
                side = "buy" if amount > 0 else "sell"
                
                trades.append({
                    'symbol': symbol,
                    'side': side,
                    'amount': abs(amount),
                    'price': price,
                    'value': abs(value_difference),
                    'weight_difference': target_weight - current_weight
                })
            
            # Sort trades by value (largest first)
            trades.sort(key=lambda x: x['value'], reverse=True)
            
            # Calculate metrics
            total_trade_value = sum(trade['value'] for trade in trades)
            turnover_percentage = (total_trade_value / current_value) * 100 if current_value > 0 else 0
            
            result = {
                'current_value': current_value,
                'current_allocation': [
                    {
                        'symbol': symbol,
                        'weight': weight,
                        'value': current_value * weight
                    }
                    for symbol, weight in current_allocation.items()
                ],
                'target_allocation': [
                    {
                        'symbol': asset.symbol,
                        'weight': asset.weight,
                        'value': current_value * asset.weight
                    }
                    for asset in target_allocation.assets
                ],
                'trades': trades,
                'total_trade_value': total_trade_value,
                'turnover_percentage': turnover_percentage,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Portfolio rebalance calculated: {len(trades)} trades, "
                       f"turnover: {turnover_percentage:.2f}%")
            
            return result
        except Exception as e:
            logger.error(f"Error calculating rebalance: {str(e)}")
            return {'error': str(e)}

if __name__ == "__main__":
    # Example usage
    try:
        print("Portfolio Optimization Example")
        
        # Initialize optimizer
        optimizer = PortfolioOptimizer('binance')
        
        # Define assets to include in portfolio
        symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT']
        
        # Optimize portfolio for maximum Sharpe ratio
        allocation = optimizer.optimize_portfolio(symbols, 'sharpe', lookback_days=90)
        
        # Print results
        print("\nOptimal Portfolio Allocation:")
        for asset in allocation.assets:
            print(f"{asset.symbol}: {asset.weight:.2%}")
        
        print(f"\nExpected Portfolio Return: {allocation.expected_return:.2%}")
        print(f"Expected Portfolio Risk: {allocation.risk:.2%}")
        print(f"Sharpe Ratio: {allocation.sharpe_ratio:.2f}")
        
        # Calculate risk metrics
        risk_metrics = optimizer.calculate_portfolio_risk_metrics(allocation)
        
        print("\nRisk Metrics:")
        for metric, value in risk_metrics.items():
            print(f"{metric}: {value}")
        
        # Generate and plot efficient frontier
        optimizer.plot_efficient_frontier(symbols, save_path="efficient_frontier.png")
        print("\nEfficient frontier plot saved to efficient_frontier.png")
        
    except Exception as e:
        print(f"Error: {str(e)}") 