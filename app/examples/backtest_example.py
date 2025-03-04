#!/usr/bin/env python
"""
Backtesting Example for CryptoV4

This script demonstrates how to use the backtesting framework to test trading strategies.
"""

import sys
import os
import logging
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import project modules
from app.trading.strategy_base import create_strategy
from app.trading.backtester import Backtester

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("backtest_example")


def run_simple_backtest():
    """Run a simple backtest with the Moving Average Crossover strategy."""
    
    # Create strategy
    strategy = create_strategy(
        strategy_type='moving_average', 
        short_window=20, 
        long_window=50
    )
    
    # Create backtester (using Binance by default)
    backtester = Backtester(strategy)
    
    # Run backtest
    result = backtester.run(
        symbol='BTC/USDT',
        timeframe='1d',  # Daily timeframe
        start_date='2022-01-01',
        end_date='2023-01-01',
        initial_capital=10000.0,
        commission_pct=0.1
    )
    
    if result:
        # Print results
        result.print_summary()
        
        # Plot equity curve
        fig = result.plot_equity_curve()
        if fig:
            plt.tight_layout()
            plt.savefig("ma_equity_curve.png")
            plt.close(fig)
        
        # Plot drawdown
        fig = result.plot_drawdown()
        if fig:
            plt.tight_layout()
            plt.savefig("ma_drawdown.png")
            plt.close(fig)
        
        # Save results to files
        result.save_results("backtest_results")
    else:
        logger.error("Backtest failed.")


def run_strategy_optimization():
    """Run strategy optimization to find the best parameters."""
    
    # Create strategy
    strategy = create_strategy(strategy_type='moving_average')
    
    # Create backtester
    backtester = Backtester(strategy)
    
    # Define parameter grid
    param_grid = {
        'short_window': [10, 20, 30, 40],
        'long_window': [50, 100, 150, 200]
    }
    
    # Run optimization
    results = backtester.optimize(
        symbol='BTC/USDT',
        param_grid=param_grid,
        timeframe='1d',
        start_date='2022-01-01',
        end_date='2023-01-01',
        metric='sharpe_ratio'  # Optimize for Sharpe ratio
    )
    
    if 'error' not in results:
        print("\n" + "="*50)
        print("OPTIMIZATION RESULTS")
        print("="*50)
        print(f"Best parameters: {results['best_params']}")
        print(f"Best {results['optimization_metric']}: {results['best_metric_value']:.4f}")
        print(f"Number of combinations tested: {results['num_combinations']}")
        print("="*50)
        
        # Run backtest with optimized parameters
        for param, value in results['best_params'].items():
            setattr(strategy, param, value)
        
        # Run backtest with optimized parameters
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
            
            # Plot equity curve
            fig = result.plot_equity_curve()
            if fig:
                plt.tight_layout()
                plt.savefig("optimized_ma_equity_curve.png")
                plt.close(fig)
            
            # Save results
            result.save_results("optimized_results")
    else:
        logger.error(f"Optimization failed: {results['error']}")


def run_walk_forward_test():
    """Run walk-forward testing to validate strategy robustness."""
    
    # Create strategy
    strategy = create_strategy(strategy_type='rsi')
    
    # Create backtester
    backtester = Backtester(strategy)
    
    # Define parameter grid
    param_grid = {
        'rsi_period': [7, 14, 21],
        'oversold': [20, 30, 40],
        'overbought': [60, 70, 80]
    }
    
    # Run walk-forward test
    results = backtester.walk_forward_test(
        symbol='ETH/USDT',
        param_grid=param_grid,
        timeframe='4h',  # 4-hour timeframe
        start_date='2022-01-01',
        end_date='2023-01-01',
        window_size=60,   # 60-day training window
        step_size=30,     # 30-day step size
        metric='total_return'  # Optimize for total return
    )
    
    if 'error' not in results:
        print("\n" + "="*50)
        print("WALK-FORWARD TESTING RESULTS")
        print("="*50)
        print(f"Strategy: {results['strategy']}")
        print(f"Symbol: {results['symbol']}")
        print(f"Timeframe: {results['timeframe']}")
        print(f"Period: {results['start_date']} to {results['end_date']}")
        print(f"Number of windows: {results['num_windows']}")
        print(f"Completed windows: {results['completed_windows']}")
        print(f"Final equity: ${results['final_equity']:.2f}")
        print(f"Total return: {results['total_return_pct']:.2f}%")
        print("="*50)
        
        # Print window details
        print("\nWindow Details:")
        print("-"*100)
        print(f"{'Window':<20} {'Training Parameters':<30} {'Train Return':<15} {'Test Return':<15}")
        print("-"*100)
        
        for i, window in enumerate(results['window_results']):
            win = window['window']
            params = ", ".join(f"{k}={v}" for k, v in window['train_params'].items())
            train_return = window['train_metrics']['total_return_pct']
            test_return = window['test_metrics']['total_return_pct']
            
            print(f"{win['train_start']} - {win['test_end']:<10} {params:<30} {train_return:.2f}%{' ':>5} {test_return:.2f}%")
        
        print("-"*100)
    else:
        logger.error(f"Walk-forward testing failed: {results['error']}")


def compare_strategies():
    """Compare different strategies on the same dataset."""
    
    # Define strategies to compare
    strategies = [
        {'type': 'moving_average', 'params': {'short_window': 20, 'long_window': 50}, 'name': 'MA(20,50)'},
        {'type': 'moving_average', 'params': {'short_window': 10, 'long_window': 30}, 'name': 'MA(10,30)'},
        {'type': 'rsi', 'params': {'rsi_period': 14, 'oversold': 30, 'overbought': 70}, 'name': 'RSI(14,30,70)'},
        {'type': 'rsi', 'params': {'rsi_period': 7, 'oversold': 30, 'overbought': 70}, 'name': 'RSI(7,30,70)'}
    ]
    
    # Define backtest parameters
    symbol = 'BTC/USDT'
    timeframe = '1d'
    start_date = '2022-01-01'
    end_date = '2023-01-01'
    initial_capital = 10000.0
    commission_pct = 0.1
    
    # Run backtest for each strategy
    results = []
    
    for strategy_config in strategies:
        # Create strategy
        strategy = create_strategy(
            strategy_type=strategy_config['type'],
            **strategy_config['params']
        )
        
        # Create backtester
        backtester = Backtester(strategy)
        
        # Run backtest
        result = backtester.run(
            symbol=symbol,
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            commission_pct=commission_pct
        )
        
        if result:
            # Store results
            results.append({
                'name': strategy_config['name'],
                'metrics': result.metrics,
                'equity_curve': result.equity_curve
            })
            
            # Print summary
            print(f"\nResults for {strategy_config['name']}:")
            result.print_summary()
    
    # Compare equity curves
    if results and plt.get_backend() != 'agg':
        plt.figure(figsize=(12, 8))
        
        for result in results:
            plt.plot(result['equity_curve'].index, result['equity_curve']['equity'], label=result['name'])
        
        plt.title(f"Strategy Comparison: {symbol} ({start_date} to {end_date})")
        plt.xlabel("Date")
        plt.ylabel("Equity ($)")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.savefig("strategy_comparison.png")
        plt.close()
    
    # Compare metrics
    print("\n" + "="*100)
    print("STRATEGY COMPARISON")
    print("="*100)
    print(f"{'Strategy':<15} {'Total Return':<15} {'Ann. Return':<15} {'Sharpe':<10} {'Max DD':<10} {'Win Rate':<10} {'# Trades':<10}")
    print("-"*100)
    
    for result in results:
        m = result['metrics']
        print(f"{result['name']:<15} {m['total_return_pct']:>6.2f}%{' ':>7} {m['annualized_return']:>6.2f}%{' ':>7} {m['sharpe_ratio']:>6.2f}{' ':>3} {m['max_drawdown']:>6.2f}%{' ':>2} {m['win_rate']:>6.2f}%{' ':>2} {m['num_trades']:>7}")
    
    print("="*100)


if __name__ == "__main__":
    print("\n" + "="*50)
    print("CryptoV4 Backtesting Examples")
    print("="*50 + "\n")
    
    # Run examples
    print("\n1. Running Simple Backtest...")
    run_simple_backtest()
    
    print("\n2. Running Strategy Optimization...")
    run_strategy_optimization()
    
    print("\n3. Running Walk-Forward Testing...")
    run_walk_forward_test()
    
    print("\n4. Comparing Different Strategies...")
    compare_strategies()
    
    print("\nAll examples completed.") 