# Crypto SMA Trader

Lovable System Prompt

Project Name: Automated Crypto Trading Workflow – SMA Crossover (Simulation Only)

1. Purpose & Safety

You are building a fully automated crypto trading system using a Simple Moving Average (SMA) crossover strategy for Bitcoin (BTC) and Ripple (XRP) on Binance.

⚠️ Critical Safety Rules

This system must operate in SIMULATION / PAPER TRADING MODE ONLY

DO NOT place real trades

DO NOT require trading API keys

This is not financial advice

Assume no guaranteed profitability

2. Trading Universe
Assets

BTCUSDT

XRPUSDT

Market Data

Source: Binance public market data

Data type: OHLCV candlesticks

Default timeframe: 15-minute candles

Use only closed candles for all calculations and decisions

Handle missing data, reconnects, and API rate limits safely

3. Strategy Definition
Indicators

Fast SMA: 20 periods (configurable)

Slow SMA: 50 periods (configurable)

Signal Rules

BUY

Trigger only when fast SMA crosses above slow SMA

Confirm on candle close

SELL

Trigger only when fast SMA crosses below slow SMA

Confirm on candle close

HOLD

When no valid crossover occurs

Signal Constraints

Only one open position per asset

Prevent duplicate or repeated signals

Ignore signals while a position is already open

4. Trade & Risk Management (Simulation)

Trading mode: Spot only (no leverage)

Fixed position size: 5% of simulated balance

Stop-loss: 2% (configurable)

Take-profit: 4% (configurable)

Cooldown after trade close: 3 candles

Max open positions per asset: 1

Include simulated trading fees

5. Execution Logic

Simulate market orders only

Execute trades immediately after confirmed signal

Track:

Entry price

Exit price

Position size

Fees

Realized P&L

6. System Architecture (Required)

Design the system as clear, isolated modules:

Market Data Module

Fetch and validate candle data

Ensure time-ordered integrity

Indicator Module

Compute SMAs efficiently

Cache values where appropriate

Signal Engine

Detect confirmed crossovers

Output BUY / SELL / HOLD

Risk Manager

Enforce position sizing

Apply stop-loss / take-profit

Enforce cooldown rules

Execution Simulator

Simulate trades and balances

Apply fees and slippage assumptions

State Manager

Persist open positions

Track last signal and last trade time

Logger & Metrics

Full audit trail of decisions and trades

7. Logging & Analytics

Log every step of the workflow:

Candle timestamp and prices

SMA values

Signal decisions

Trade execution details

Balance updates

Performance Metrics

Total trades

Winning vs losing trades

Win rate

Net P&L

Max drawdown

Equity curve data

8. Configuration (Editable Defaults)
mode: simulation
timeframe: 15m

assets:
  - BTCUSDT
  - XRPUSDT

indicators:
  fast_sma: 20
  slow_sma: 50

risk:
  position_size_percent: 5
  stop_loss_percent: 2
  take_profit_percent: 4
  cooldown_candles: 3

9. Output Expectations

Generate:

Clean, readable, well-documented code

Deterministic behavior (same input = same output)

Clear separation of concerns

Easy extensibility for:

More assets

Additional indicators

Live trading (disabled by default)

10. Final Instruction

Prioritize correctness, clarity, safety, and extensibility over complexity.
If uncertain, choose the simplest correct implementation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://auto-strat-sim.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/15d3c0b3-6fdd-437c-8660-4e39fd717d26).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
