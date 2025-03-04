"""
Backtesting Framework for CryptoV4

This module provides a backtesting framework for testing trading strategies
against historical data and evaluating their performance with various metrics.
"""

import os
import logging
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Callable
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
import matplotlib.dates as mdates
from functools import wraps

# Project imports
from app.data.exchange_interface import create_exchange
from app.trading.strategy_base import Strategy
from app.trading.trading_utils import calculate_drawdown, calculate_sharpe_ratio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("backtester")

# Check if matplotlib is available for plotting
PLOTTING_AVAILABLE = True
try:
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
except Exception as e:
    logger.warning(f"Matplotlib configuration error: {str(e)}. Plotting disabled.")
    PLOTTING_AVAILABLE = False

class BacktestResult:
    """Class to store and analyze backtesting results"""
    
    def __init__(self, strategy_name: str, symbol: str, timeframe: str, 
                initial_capital: float, trades: List[Dict[str, Any]], 
                equity_curve: pd.DataFrame):
        """
        Initialize backtesting results.
        
        Args:
            strategy_name: Name of the strategy
            symbol: Trading pair symbol
            timeframe: Timeframe used for backtesting
            initial_capital: Initial capital amount
            trades: List of executed trades
            equity_curve: DataFrame with equity curve data
        """
        self.strategy_name = strategy_name
        self.symbol = symbol
        self.timeframe = timeframe
        self.initial_capital = initial_capital
        self.trades = trades
        self.equity_curve = equity_curve
        self.metrics = self._calculate_metrics()
        
    def _calculate_metrics(self) -> Dict[str, Any]:
        """
        Calculate performance metrics.
        
        Returns:
            Dictionary with performance metrics
        """
        if not self.trades or len(self.trades) == 0:
            return {
                'total_return': 0.0,
                'total_return_pct': 0.0,
                'annualized_return': 0.0,
                'num_trades': 0,
                'win_rate': 0.0,
                'profit_factor': 0.0,
                'max_drawdown': 0.0,
                'sharpe_ratio': 0.0,
                'avg_trade_duration': timedelta(0),
                'avg_profit_per_trade': 0.0,
                'avg_profit_pct_per_trade': 0.0,
                'best_trade': 0.0,
                'worst_trade': 0.0
            }
        
        # Extract data from equity curve
        final_equity = self.equity_curve['equity'].iloc[-1]
        total_return = final_equity - self.initial_capital
        total_return_pct = (total_return / self.initial_capital) * 100
        
        # Calculate annualized return
        days = (self.equity_curve.index[-1] - self.equity_curve.index[0]).days
        if days > 0:
            annualized_return = ((1 + total_return_pct / 100) ** (365 / days)) - 1
        else:
            annualized_return = 0.0
        
        # Calculate trading metrics
        num_trades = len(self.trades)
        profitable_trades = [t for t in self.trades if t['profit'] > 0]
        losing_trades = [t for t in self.trades if t['profit'] <= 0]
        
        win_rate = len(profitable_trades) / num_trades if num_trades > 0 else 0
        
        total_profit = sum(t['profit'] for t in profitable_trades)
        total_loss = abs(sum(t['profit'] for t in losing_trades))
        profit_factor = total_profit / total_loss if total_loss > 0 else float('inf')
        
        # Calculate drawdown
        max_drawdown = calculate_drawdown(self.equity_curve['equity'])
        
        # Calculate Sharpe ratio
        returns = self.equity_curve['equity'].pct_change().dropna()
        sharpe_ratio = calculate_sharpe_ratio(returns)
        
        # Calculate trade statistics
        durations = [(t['exit_time'] - t['entry_time']) for t in self.trades 
                    if 'exit_time' in t and 'entry_time' in t]
        avg_duration = sum(durations, timedelta(0)) / len(durations) if durations else timedelta(0)
        
        profits = [t['profit'] for t in self.trades]
        avg_profit = sum(profits) / len(profits) if profits else 0
        
        profit_pcts = [t['profit_pct'] for t in self.trades if 'profit_pct' in t]
        avg_profit_pct = sum(profit_pcts) / len(profit_pcts) if profit_pcts else 0
        
        best_trade = max(profits) if profits else 0
        worst_trade = min(profits) if profits else 0
        
        return {
            'total_return': total_return,
            'total_return_pct': total_return_pct,
            'annualized_return': annualized_return * 100,  # Convert to percentage
            'num_trades': num_trades,
            'win_rate': win_rate * 100,  # Convert to percentage
            'profit_factor': profit_factor,
            'max_drawdown': max_drawdown * 100,  # Convert to percentage
            'sharpe_ratio': sharpe_ratio,
            'avg_trade_duration': avg_duration,
            'avg_profit_per_trade': avg_profit,
            'avg_profit_pct_per_trade': avg_profit_pct * 100,  # Convert to percentage
            'best_trade': best_trade,
            'worst_trade': worst_trade
        }
    
    def plot_equity_curve(self, save_path: Optional[str] = None) -> Optional[Figure]:
        """
        Plot equity curve.
        
        Args:
            save_path: Path to save the plot (optional)
            
        Returns:
            Matplotlib figure or None if plotting is disabled
        """
        if not PLOTTING_AVAILABLE:
            logger.warning("Plotting is disabled. Cannot generate equity curve plot.")
            return None
        
        try:
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Plot equity curve
            ax.plot(self.equity_curve.index, self.equity_curve['equity'], label='Equity')
            
            # Highlight buy and sell points
            buys = [t for t in self.trades if t['side'] == 'buy']
            sells = [t for t in self.trades if t['side'] == 'sell']
            
            buy_times = [t['entry_time'] for t in buys]
            buy_prices = [self.equity_curve['equity'].loc[t['entry_time']] for t in buys if t['entry_time'] in self.equity_curve.index]
            
            sell_times = [t['exit_time'] for t in sells if 'exit_time' in t]
            sell_prices = [self.equity_curve['equity'].loc[t['exit_time']] for t in sells if 'exit_time' in t and t['exit_time'] in self.equity_curve.index]
            
            if buy_times and buy_prices:
                ax.scatter(buy_times, buy_prices, color='green', marker='^', s=100, label='Buy')
            
            if sell_times and sell_prices:
                ax.scatter(sell_times, sell_prices, color='red', marker='v', s=100, label='Sell')
            
            # Format plot
            ax.set_title(f"{self.strategy_name} - {self.symbol} - {self.timeframe}\nTotal Return: {self.metrics['total_return_pct']:.2f}%")
            ax.set_xlabel('Date')
            ax.set_ylabel('Equity')
            ax.legend()
            ax.grid(True)
            
            # Format dates on x-axis
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
            ax.xaxis.set_major_locator(mdates.AutoDateLocator())
            fig.autofmt_xdate()
            
            if save_path:
                plt.savefig(save_path)
                logger.info(f"Equity curve saved to {save_path}")
            
            return fig
        except Exception as e:
            logger.error(f"Error plotting equity curve: {str(e)}")
            return None
    
    def plot_drawdown(self, save_path: Optional[str] = None) -> Optional[Figure]:
        """
        Plot drawdown chart.
        
        Args:
            save_path: Path to save the plot (optional)
            
        Returns:
            Matplotlib figure or None if plotting is disabled
        """
        if not PLOTTING_AVAILABLE:
            logger.warning("Plotting is disabled. Cannot generate drawdown plot.")
            return None
        
        try:
            # Calculate drawdown series
            equity = self.equity_curve['equity']
            rolling_max = equity.cummax()
            drawdown_series = (equity - rolling_max) / rolling_max * 100
            
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Plot drawdown
            ax.fill_between(drawdown_series.index, drawdown_series, 0, color='red', alpha=0.3)
            ax.plot(drawdown_series.index, drawdown_series, color='red', linewidth=1)
            
            # Format plot
            ax.set_title(f"{self.strategy_name} - {self.symbol} - {self.timeframe}\nDrawdown (Max: {self.metrics['max_drawdown']:.2f}%)")
            ax.set_xlabel('Date')
            ax.set_ylabel('Drawdown (%)')
            ax.grid(True)
            
            # Format dates on x-axis
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
            ax.xaxis.set_major_locator(mdates.AutoDateLocator())
            fig.autofmt_xdate()
            
            if save_path:
                plt.savefig(save_path)
                logger.info(f"Drawdown chart saved to {save_path}")
            
            return fig
        except Exception as e:
            logger.error(f"Error plotting drawdown: {str(e)}")
            return None
    
    def save_results(self, save_dir: str) -> bool:
        """
        Save backtesting results to files.
        
        Args:
            save_dir: Directory to save results
            
        Returns:
            Success status
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(save_dir, exist_ok=True)
            
            # Generate timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Save metrics to JSON
            metrics_file = os.path.join(save_dir, f"{self.strategy_name}_{self.symbol}_{self.timeframe}_{timestamp}_metrics.json")
            with open(metrics_file, 'w') as f:
                # Convert timedelta to string for JSON serialization
                metrics_copy = self.metrics.copy()
                if 'avg_trade_duration' in metrics_copy:
                    metrics_copy['avg_trade_duration'] = str(metrics_copy['avg_trade_duration'])
                json.dump(metrics_copy, f, indent=4)
            
            # Save trades to CSV
            trades_file = os.path.join(save_dir, f"{self.strategy_name}_{self.symbol}_{self.timeframe}_{timestamp}_trades.csv")
            trades_df = pd.DataFrame(self.trades)
            trades_df.to_csv(trades_file, index=False)
            
            # Save equity curve to CSV
            equity_file = os.path.join(save_dir, f"{self.strategy_name}_{self.symbol}_{self.timeframe}_{timestamp}_equity.csv")
            self.equity_curve.to_csv(equity_file)
            
            # Save plots if available
            if PLOTTING_AVAILABLE:
                equity_plot_file = os.path.join(save_dir, f"{self.strategy_name}_{self.symbol}_{self.timeframe}_{timestamp}_equity.png")
                drawdown_plot_file = os.path.join(save_dir, f"{self.strategy_name}_{self.symbol}_{self.timeframe}_{timestamp}_drawdown.png")
                
                self.plot_equity_curve(equity_plot_file)
                self.plot_drawdown(drawdown_plot_file)
            
            logger.info(f"Backtesting results saved to {save_dir}")
            return True
        except Exception as e:
            logger.error(f"Error saving backtesting results: {str(e)}")
            return False
    
    def print_summary(self) -> None:
        """Print a summary of backtesting results."""
        print("\n" + "="*50)
        print(f"BACKTEST SUMMARY: {self.strategy_name} - {self.symbol} - {self.timeframe}")
        print("="*50)
        print(f"Initial Capital: ${self.initial_capital:.2f}")
        print(f"Final Equity: ${self.equity_curve['equity'].iloc[-1]:.2f}")
        print(f"Total Return: ${self.metrics['total_return']:.2f} ({self.metrics['total_return_pct']:.2f}%)")
        print(f"Annualized Return: {self.metrics['annualized_return']:.2f}%")
        print("-"*50)
        print(f"Number of Trades: {self.metrics['num_trades']}")
        print(f"Win Rate: {self.metrics['win_rate']:.2f}%")
        print(f"Profit Factor: {self.metrics['profit_factor']:.2f}")
        print(f"Average Trade: ${self.metrics['avg_profit_per_trade']:.2f} ({self.metrics['avg_profit_pct_per_trade']:.2f}%)")
        print(f"Best Trade: ${self.metrics['best_trade']:.2f}")
        print(f"Worst Trade: ${self.metrics['worst_trade']:.2f}")
        print(f"Average Duration: {self.metrics['avg_trade_duration']}")
        print("-"*50)
        print(f"Maximum Drawdown: {self.metrics['max_drawdown']:.2f}%")
        print(f"Sharpe Ratio: {self.metrics['sharpe_ratio']:.2f}")
        print("="*50 + "\n")


class Backtester:
    """Class for backtesting trading strategies"""
    
    def __init__(self, strategy: Strategy, exchange_id: str = 'binance',
                exchange_params: Optional[Dict[str, Any]] = None):
        """
        Initialize the backtester.
        
        Args:
            strategy: Strategy to test
            exchange_id: ID of the exchange to use for data
            exchange_params: Parameters for the exchange
        """
        self.strategy = strategy
        self.exchange_id = exchange_id
        self.exchange_params = exchange_params or {}
        
        # Initialize exchange interface
        try:
            self.exchange = create_exchange(
                exchange_id=exchange_id,
                **self.exchange_params
            )
            logger.info(f"Initialized {exchange_id} for backtesting")
        except Exception as e:
            logger.error(f"Error initializing exchange for backtesting: {str(e)}")
            self.exchange = None
    
    def run(self, symbol: str, timeframe: str = '1h', start_date: Optional[str] = None,
           end_date: Optional[str] = None, initial_capital: float = 10000.0,
           commission_pct: float = 0.1) -> Optional[BacktestResult]:
        """
        Run backtest.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTC/USDT')
            timeframe: Timeframe for data (e.g., '1m', '1h', '1d')
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'
            initial_capital: Initial capital amount
            commission_pct: Commission percentage for trades
            
        Returns:
            BacktestResult object or None if error
        """
        if not self.exchange:
            logger.error("Exchange not initialized. Cannot run backtest.")
            return None
        
        logger.info(f"Running backtest for {self.strategy.name} on {symbol} with {timeframe} timeframe")
        
        try:
            # Calculate start and end timestamps
            if start_date:
                start_ts = int(datetime.strptime(start_date, '%Y-%m-%d').timestamp() * 1000)
            else:
                start_ts = None
            
            if end_date:
                end_ts = int(datetime.strptime(end_date, '%Y-%m-%d').timestamp() * 1000)
            else:
                end_ts = None
            
            # Fetch historical data
            data = self.exchange.fetch_ohlcv_dataframe(symbol, timeframe, since=start_ts, limit=1000)
            
            # Filter data by date range
            if start_date:
                data = data[data.index >= start_date]
            
            if end_date:
                data = data[data.index <= end_date]
            
            if data.empty:
                logger.error(f"No data available for {symbol} with the specified date range")
                return None
            
            logger.info(f"Fetched {len(data)} candles from {data.index[0]} to {data.index[-1]}")
            
            # Initialize backtest state
            state = {
                'equity': initial_capital,
                'position': 0,
                'entry_price': 0.0,
                'trades': [],
                'current_trade': None
            }
            
            # Initialize equity curve
            equity_curve = pd.DataFrame(index=data.index)
            equity_curve['equity'] = initial_capital
            
            # Prepare data for strategy
            self.strategy.prepare_data(data)
            
            # Simulate trading for each candle
            for i, (timestamp, candle) in enumerate(data.iterrows()):
                # Skip the first few candles if needed for indicators
                if i < self.strategy.min_required_candles:
                    continue
                
                # For analysis, we use all data up to current candle
                analysis_data = data.iloc[:i+1].copy()
                
                # Generate signal
                signal = self.strategy.generate_signal(analysis_data)
                
                # Execute signal
                if signal == 1 and state['position'] <= 0:  # Buy signal
                    # Calculate position size (use all available equity)
                    price = candle['close']
                    size = state['equity'] / price
                    cost = size * price
                    commission = cost * (commission_pct / 100)
                    
                    # Update state
                    state['position'] = size
                    state['entry_price'] = price
                    state['equity'] -= commission
                    
                    # Record trade
                    state['current_trade'] = {
                        'symbol': symbol,
                        'side': 'buy',
                        'entry_time': timestamp,
                        'entry_price': price,
                        'size': size,
                        'commission': commission
                    }
                    
                    logger.debug(f"BUY at {timestamp}: {size} {symbol} at {price}")
                
                elif signal == -1 and state['position'] > 0:  # Sell signal
                    # Calculate profit/loss
                    price = candle['close']
                    size = state['position']
                    value = size * price
                    commission = value * (commission_pct / 100)
                    
                    profit = value - (size * state['entry_price']) - commission
                    profit_pct = profit / (size * state['entry_price'])
                    
                    # Update state
                    state['equity'] = state['equity'] + value - commission
                    state['position'] = 0
                    
                    # Complete trade record
                    if state['current_trade']:
                        state['current_trade'].update({
                            'exit_time': timestamp,
                            'exit_price': price,
                            'profit': profit,
                            'profit_pct': profit_pct
                        })
                        state['trades'].append(state['current_trade'])
                        state['current_trade'] = None
                    
                    logger.debug(f"SELL at {timestamp}: {size} {symbol} at {price}, Profit: {profit:.2f} ({profit_pct:.2%})")
                
                # Update equity curve
                if state['position'] > 0:
                    # Mark-to-market valuation of open position
                    position_value = state['position'] * candle['close']
                    equity_curve.at[timestamp, 'equity'] = state['equity'] + position_value
                else:
                    equity_curve.at[timestamp, 'equity'] = state['equity']
            
            # Close any open position at the end
            if state['position'] > 0:
                # Calculate profit/loss
                last_price = data['close'].iloc[-1]
                size = state['position']
                value = size * last_price
                commission = value * (commission_pct / 100)
                
                profit = value - (size * state['entry_price']) - commission
                profit_pct = profit / (size * state['entry_price'])
                
                # Update state
                state['equity'] = state['equity'] + value - commission
                
                # Complete trade record
                if state['current_trade']:
                    state['current_trade'].update({
                        'exit_time': data.index[-1],
                        'exit_price': last_price,
                        'profit': profit,
                        'profit_pct': profit_pct
                    })
                    state['trades'].append(state['current_trade'])
                
                logger.info(f"Closed position at end of backtest: {size} {symbol} at {last_price}, Profit: {profit:.2f} ({profit_pct:.2%})")
            
            # Create backtest result
            result = BacktestResult(
                strategy_name=self.strategy.name,
                symbol=symbol,
                timeframe=timeframe,
                initial_capital=initial_capital,
                trades=state['trades'],
                equity_curve=equity_curve
            )
            
            logger.info(f"Backtest completed: {result.metrics['num_trades']} trades, {result.metrics['total_return_pct']:.2f}% return")
            
            return result
        
        except Exception as e:
            logger.error(f"Error running backtest: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def optimize(self, symbol: str, param_grid: Dict[str, List], timeframe: str = '1h', 
                start_date: Optional[str] = None, end_date: Optional[str] = None,
                initial_capital: float = 10000.0, commission_pct: float = 0.1, 
                metric: str = 'total_return') -> Dict[str, Any]:
        """
        Optimize strategy parameters using grid search.
        
        Args:
            symbol: Trading pair symbol
            param_grid: Dictionary of parameters to optimize
            timeframe: Timeframe for data
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'
            initial_capital: Initial capital amount
            commission_pct: Commission percentage for trades
            metric: Metric to optimize ('total_return', 'sharpe_ratio', etc.)
            
        Returns:
            Dictionary with optimization results
        """
        if not self.exchange:
            logger.error("Exchange not initialized. Cannot run optimization.")
            return {'error': 'Exchange not initialized'}
        
        logger.info(f"Optimizing {self.strategy.name} on {symbol} with {timeframe} timeframe")
        
        # Generate all parameter combinations
        import itertools
        param_names = list(param_grid.keys())
        param_values = list(param_grid.values())
        param_combinations = list(itertools.product(*param_values))
        
        logger.info(f"Testing {len(param_combinations)} parameter combinations")
        
        # Run backtest for each combination
        results = []
        best_result = None
        best_params = None
        best_metric_value = float('-inf')
        
        for i, params in enumerate(param_combinations):
            # Set parameters
            param_dict = {name: value for name, value in zip(param_names, params)}
            for name, value in param_dict.items():
                setattr(self.strategy, name, value)
            
            # Run backtest
            logger.info(f"Testing combination {i+1}/{len(param_combinations)}: {param_dict}")
            result = self.run(
                symbol=symbol,
                timeframe=timeframe,
                start_date=start_date,
                end_date=end_date,
                initial_capital=initial_capital,
                commission_pct=commission_pct
            )
            
            if result:
                # Extract metric value
                metric_value = result.metrics.get(metric, 0)
                
                # Check if this is the best result so far
                if metric_value > best_metric_value:
                    best_metric_value = metric_value
                    best_result = result
                    best_params = param_dict.copy()
                
                # Store result
                results.append({
                    'params': param_dict,
                    'metrics': result.metrics
                })
                
                logger.info(f"Combination {i+1}: {metric} = {metric_value}")
        
        # Format optimization results
        optimization_results = {
            'strategy': self.strategy.name,
            'symbol': symbol,
            'timeframe': timeframe,
            'start_date': start_date,
            'end_date': end_date,
            'optimization_metric': metric,
            'num_combinations': len(param_combinations),
            'best_params': best_params,
            'best_metric_value': best_metric_value,
            'best_result': best_result.metrics if best_result else None,
            'all_results': results
        }
        
        logger.info(f"Optimization completed. Best {metric}: {best_metric_value} with params: {best_params}")
        
        return optimization_results
    
    def walk_forward_test(self, symbol: str, param_grid: Dict[str, List] = None, 
                         timeframe: str = '1h', start_date: Optional[str] = None, 
                         end_date: Optional[str] = None, window_size: int = 90, 
                         step_size: int = 30, initial_capital: float = 10000.0,
                         commission_pct: float = 0.1, metric: str = 'total_return') -> Dict[str, Any]:
        """
        Perform walk-forward optimization and testing.
        
        Args:
            symbol: Trading pair symbol
            param_grid: Dictionary of parameters to optimize
            timeframe: Timeframe for data
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'
            window_size: Size of each training window in days
            step_size: Size of each step in days
            initial_capital: Initial capital amount
            commission_pct: Commission percentage for trades
            metric: Metric to optimize ('total_return', 'sharpe_ratio', etc.)
            
        Returns:
            Dictionary with walk-forward testing results
        """
        if not self.exchange:
            logger.error("Exchange not initialized. Cannot run walk-forward test.")
            return {'error': 'Exchange not initialized'}
        
        if not param_grid:
            logger.error("No parameter grid specified. Cannot run optimization.")
            return {'error': 'No parameter grid specified'}
        
        logger.info(f"Running walk-forward test for {self.strategy.name} on {symbol} with {timeframe} timeframe")
        
        try:
            # Calculate start and end timestamps
            if start_date:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            else:
                # Default to 1 year ago
                start_dt = datetime.now() - timedelta(days=365)
                start_date = start_dt.strftime('%Y-%m-%d')
            
            if end_date:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            else:
                end_dt = datetime.now()
                end_date = end_dt.strftime('%Y-%m-%d')
            
            # Generate windows
            windows = []
            current_start = start_dt
            
            while current_start + timedelta(days=window_size) < end_dt:
                train_start = current_start
                train_end = train_start + timedelta(days=window_size)
                test_start = train_end
                test_end = min(test_start + timedelta(days=step_size), end_dt)
                
                windows.append({
                    'train_start': train_start.strftime('%Y-%m-%d'),
                    'train_end': train_end.strftime('%Y-%m-%d'),
                    'test_start': test_start.strftime('%Y-%m-%d'),
                    'test_end': test_end.strftime('%Y-%m-%d')
                })
                
                current_start = current_start + timedelta(days=step_size)
            
            logger.info(f"Generated {len(windows)} test windows")
            
            # Run optimization and testing for each window
            window_results = []
            consolidated_trades = []
            equity_curve_data = []
            current_capital = initial_capital
            
            for i, window in enumerate(windows):
                logger.info(f"Processing window {i+1}/{len(windows)}: {window['train_start']} to {window['test_end']}")
                
                # Optimize parameters on training data
                opt_results = self.optimize(
                    symbol=symbol,
                    param_grid=param_grid,
                    timeframe=timeframe,
                    start_date=window['train_start'],
                    end_date=window['train_end'],
                    initial_capital=current_capital,
                    commission_pct=commission_pct,
                    metric=metric
                )
                
                if 'error' in opt_results or not opt_results['best_params']:
                    logger.warning(f"Optimization failed for window {i+1}. Skipping.")
                    continue
                
                # Set best parameters
                for name, value in opt_results['best_params'].items():
                    setattr(self.strategy, name, value)
                
                # Run test on out-of-sample data
                test_result = self.run(
                    symbol=symbol,
                    timeframe=timeframe,
                    start_date=window['test_start'],
                    end_date=window['test_end'],
                    initial_capital=current_capital,
                    commission_pct=commission_pct
                )
                
                if not test_result:
                    logger.warning(f"Test failed for window {i+1}. Skipping.")
                    continue
                
                # Update capital for next window
                current_capital = test_result.equity_curve['equity'].iloc[-1]
                
                # Store results
                window_result = {
                    'window': window,
                    'train_params': opt_results['best_params'],
                    'train_metrics': opt_results['best_result'],
                    'test_metrics': test_result.metrics,
                    'test_trades': test_result.trades,
                    'test_equity': test_result.equity_curve['equity'].iloc[-1]
                }
                
                window_results.append(window_result)
                consolidated_trades.extend(test_result.trades)
                equity_curve_data.append(test_result.equity_curve)
            
            # Consolidate equity curves
            if equity_curve_data:
                combined_equity = pd.concat(equity_curve_data)
                combined_equity = combined_equity[~combined_equity.index.duplicated(keep='first')]
                combined_equity = combined_equity.sort_index()
            else:
                combined_equity = pd.DataFrame(columns=['equity'])
            
            # Create consolidated result
            consolidated_result = BacktestResult(
                strategy_name=self.strategy.name,
                symbol=symbol,
                timeframe=timeframe,
                initial_capital=initial_capital,
                trades=consolidated_trades,
                equity_curve=combined_equity
            )
            
            # Format results
            wf_results = {
                'strategy': self.strategy.name,
                'symbol': symbol,
                'timeframe': timeframe,
                'start_date': start_date,
                'end_date': end_date,
                'window_size': window_size,
                'step_size': step_size,
                'num_windows': len(windows),
                'completed_windows': len(window_results),
                'window_results': window_results,
                'consolidated_metrics': consolidated_result.metrics,
                'final_equity': current_capital,
                'total_return_pct': ((current_capital - initial_capital) / initial_capital) * 100
            }
            
            logger.info(f"Walk-forward test completed. Total return: {wf_results['total_return_pct']:.2f}%")
            
            return wf_results
        
        except Exception as e:
            logger.error(f"Error running walk-forward test: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {'error': str(e)}


# Example usage
if __name__ == "__main__":
    from app.trading.strategy_base import Strategy
    
    class SimpleMovingAverageStrategy(Strategy):
        """Simple Moving Average crossover strategy"""
        
        def __init__(self, short_window=20, long_window=50):
            super().__init__("Simple Moving Average")
            self.short_window = short_window
            self.long_window = long_window
            self.min_required_candles = long_window
        
        def prepare_data(self, data):
            # Calculate moving averages
            data['short_ma'] = data['close'].rolling(window=self.short_window).mean()
            data['long_ma'] = data['close'].rolling(window=self.long_window).mean()
            return data
        
        def generate_signal(self, data):
            if len(data) < self.long_window:
                return 0
            
            # Get latest values
            short_ma = data['short_ma'].iloc[-1]
            long_ma = data['long_ma'].iloc[-1]
            prev_short_ma = data['short_ma'].iloc[-2]
            prev_long_ma = data['long_ma'].iloc[-2]
            
            # Check for crossover
            if prev_short_ma <= prev_long_ma and short_ma > long_ma:
                return 1  # Buy signal
            elif prev_short_ma >= prev_long_ma and short_ma < long_ma:
                return -1  # Sell signal
            
            return 0  # No signal
    
    # Initialize strategy
    strategy = SimpleMovingAverageStrategy(short_window=20, long_window=50)
    
    # Create backtester
    backtester = Backtester(strategy, exchange_id='binance')
    
    # Run backtest
    result = backtester.run(
        symbol='BTC/USDT',
        timeframe='1d',
        start_date='2022-01-01',
        end_date='2023-01-01',
        initial_capital=10000.0,
        commission_pct=0.1
    )
    
    if result:
        # Print results
        result.print_summary()
        
        # Save results
        result.save_results('backtest_results')
        
        # Optimize strategy
        param_grid = {
            'short_window': [10, 20, 30],
            'long_window': [40, 50, 60]
        }
        
        optimization_results = backtester.optimize(
            symbol='BTC/USDT',
            param_grid=param_grid,
            timeframe='1d',
            start_date='2022-01-01',
            end_date='2023-01-01',
            metric='sharpe_ratio'
        )
        
        print(f"Best parameters: {optimization_results['best_params']}")
        print(f"Best Sharpe ratio: {optimization_results['best_metric_value']:.2f}") 