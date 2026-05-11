/**
 * Scenario Testing & Stress Testing Engine
 * Generates synthetic market data and evaluates agent robustness.
 * Simulation only — no real trading.
 */

import { Asset, Candle, PositionDirection } from '@/types/trading';
import {
  ScenarioCategory,
  ScenarioDefinition,
  ScenarioResult,
  ScenarioConfig,
  DEFAULT_SCENARIO_CONFIG,
  RobustnessScore,
  FailurePoint,
  Recommendation,
  ScenarioTestSuite,
} from '@/types/scenario';
import { calculateSMASeries, detectCrossover } from './indicators';
import { calculateStopLoss, calculateTakeProfit, calculatePnl } from './riskManager';

// ─── Predefined Scenarios ────────────────────────────────────────────

export const PREDEFINED_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'strong-bull', name: 'Strong Bullish Trend', category: 'strong_bullish_trend',
    description: 'Sustained uptrend with higher highs and higher lows.',
    candleCount: 200, config: { trendStrength: 2.0, chopIntensity: 0.1 },
  },
  {
    id: 'strong-bear', name: 'Strong Bearish Trend', category: 'strong_bearish_trend',
    description: 'Sustained downtrend with lower highs and lower lows.',
    candleCount: 200, config: { trendStrength: -2.0, chopIntensity: 0.1 },
  },
  {
    id: 'sideways', name: 'Sideways / Choppy', category: 'sideways_choppy',
    description: 'Range-bound price action with no clear direction.',
    candleCount: 200, config: { trendStrength: 0, chopIntensity: 1.5 },
  },
  {
    id: 'low-vol', name: 'Low Volatility Compression', category: 'low_volatility_compression',
    description: 'Very tight price range with minimal movement.',
    candleCount: 200, config: { volatilityMultiplier: 0.2, trendStrength: 0, chopIntensity: 0.3 },
  },
  {
    id: 'high-vol-breakout', name: 'High Volatility Breakout', category: 'high_volatility_breakout',
    description: 'Compression followed by a sharp directional move.',
    candleCount: 200, config: { volatilityMultiplier: 2.5, trendStrength: 1.5 },
  },
  {
    id: 'crash', name: 'Sudden Crash', category: 'sudden_crash',
    description: 'Sharp 20%+ drop within a few candles.',
    candleCount: 200, config: { trendStrength: -5.0, volatilityMultiplier: 3.0 },
  },
  {
    id: 'pump', name: 'Sudden Pump', category: 'sudden_pump',
    description: 'Sharp 20%+ rally within a few candles.',
    candleCount: 200, config: { trendStrength: 5.0, volatilityMultiplier: 3.0 },
  },
  {
    id: 'reversal-heavy', name: 'Reversal-Heavy Market', category: 'reversal_heavy',
    description: 'Frequent trend reversals that trap traders.',
    candleCount: 250, config: { reversalFrequency: 0.8, chopIntensity: 1.0 },
  },
  {
    id: 'fake-breakout', name: 'Fake Breakout Market', category: 'fake_breakout',
    description: 'Price breaks key levels then immediately reverses.',
    candleCount: 200, config: { reversalFrequency: 0.6, volatilityMultiplier: 1.5, chopIntensity: 1.2 },
  },
  {
    id: 'whipsaw', name: 'Whipsaw Crossover', category: 'whipsaw_crossover',
    description: 'Repeated SMA crossovers with no follow-through.',
    candleCount: 250, config: { chopIntensity: 2.0, trendStrength: 0, reversalFrequency: 0.5 },
  },
  {
    id: 'gap-data', name: 'Gap / Missing Data', category: 'gap_missing_data',
    description: 'Intermittent data gaps simulating exchange outages.',
    candleCount: 200, config: { gapFrequency: 0.05 },
  },
  {
    id: 'delayed-candle', name: 'Delayed Candle / Reconnect', category: 'delayed_candle',
    description: 'Candle delays and reconnection events.',
    candleCount: 200, config: { reconnectFrequency: 0.03 },
  },
];

// ─── Synthetic Market Generator ──────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateSyntheticCandles(
  scenario: ScenarioDefinition,
  basePrice: number,
  globalConfig: ScenarioConfig,
  seed: number = 42,
): Candle[] {
  const cfg = { ...globalConfig, ...scenario.config };
  const rand = seededRandom(seed);
  const candles: Candle[] = [];
  let price = basePrice;
  const baseVolatility = basePrice * 0.005 * cfg.volatilityMultiplier;
  const count = scenario.candleCount;
  let trendDir = cfg.trendStrength > 0 ? 1 : cfg.trendStrength < 0 ? -1 : 0;
  let nextReversalAt = Math.floor(count * 0.3 + rand() * count * 0.3);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    // Skip candles for gap scenarios
    if (cfg.gapFrequency > 0 && rand() < cfg.gapFrequency) {
      continue;
    }

    // Reversal logic
    if (cfg.reversalFrequency > 0 && i === nextReversalAt) {
      trendDir *= -1;
      nextReversalAt = i + Math.floor(15 + rand() * 30 / Math.max(cfg.reversalFrequency, 0.1));
    }

    // Trend component
    const trendMove = trendDir * Math.abs(cfg.trendStrength) * baseVolatility * 0.1;

    // Noise component
    const noise = (rand() - 0.5) * baseVolatility * cfg.chopIntensity;

    // Crash/pump spike in the middle
    let spike = 0;
    if ((scenario.category === 'sudden_crash' || scenario.category === 'sudden_pump') && i >= count * 0.4 && i <= count * 0.45) {
      spike = (scenario.category === 'sudden_crash' ? -1 : 1) * basePrice * 0.04;
    }

    const change = trendMove + noise + spike;
    const open = price;
    price = Math.max(price + change, basePrice * 0.01);
    const close = price;
    const high = Math.max(open, close) + Math.abs(noise) * rand();
    const low = Math.min(open, close) - Math.abs(noise) * rand();

    candles.push({
      timestamp: now - (count - i) * 3600000,
      open,
      high: Math.max(high, open, close),
      low: Math.max(Math.min(low, open, close), basePrice * 0.005),
      close,
      volume: 1000 + rand() * 5000,
    });
  }

  return candles;
}

// ─── Run Single Scenario ─────────────────────────────────────────────

export function runScenarioBacktest(
  candles: Candle[],
  asset: Asset,
  fastSMA: number,
  slowSMA: number,
  positionSizePercent: number,
  stopLossPercent: number,
  takeProfitPercent: number,
  feePercent: number,
  slippageMultiplier: number,
  feeMultiplier: number,
  initialBalance: number,
): Omit<ScenarioResult, 'scenarioId' | 'scenarioName' | 'category' | 'explanation'> {
  const effectiveFee = feePercent * feeMultiplier;
  const feeFraction = effectiveFee / 100;
  let balance = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let position: { direction: PositionDirection; entryPrice: number; size: number; stopLoss: number; takeProfit: number } | null = null;
  let totalTrades = 0, longTrades = 0, shortTrades = 0, wins = 0;
  let blockedSetups = 0, flipTrades = 0;
  let largestWin = 0, largestLoss = 0;
  let totalPnl = 0;

  if (candles.length < slowSMA + 2) {
    return { totalTrades: 0, longTrades: 0, shortTrades: 0, winRate: 0, netPnl: 0, maxDrawdown: 0, profitFactor: 0, blockedSetups: 0, flipTrades: 0, averageTrade: 0, largestWin: 0, largestLoss: 0, asset };
  }

  const fastVals = calculateSMASeries(candles, fastSMA);
  const slowVals = calculateSMASeries(candles, slowSMA);
  let grossProfit = 0, grossLoss = 0;

  function closePos(exitPrice: number, isFlip: boolean) {
    if (!position) return;
    const slippage = exitPrice * 0.001 * slippageMultiplier;
    const adjExit = position.direction === 'long' ? exitPrice - slippage : exitPrice + slippage;
    const rawPnl = calculatePnl(position.direction, position.entryPrice, adjExit, position.size);
    const exitFee = position.size * adjExit * feeFraction;
    const entryFee = position.size * position.entryPrice * feeFraction;
    const netPnl = rawPnl - exitFee - entryFee;

    totalTrades++;
    if (position.direction === 'long') longTrades++;
    else shortTrades++;
    if (netPnl >= 0) { wins++; grossProfit += netPnl; }
    else grossLoss += Math.abs(netPnl);
    if (netPnl > largestWin) largestWin = netPnl;
    if (netPnl < largestLoss) largestLoss = netPnl;
    if (isFlip) flipTrades++;
    totalPnl += netPnl;

    balance += rawPnl - exitFee;
    if (balance > peak) peak = balance;
    const dd = ((peak - balance) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
    position = null;
  }

  function openPos(dir: PositionDirection, price: number) {
    const posVal = balance * (positionSizePercent / 100);
    const fee = posVal * feeFraction;
    const slippage = price * 0.001 * slippageMultiplier;
    const adjPrice = dir === 'long' ? price + slippage : price - slippage;
    const size = (posVal - fee) / adjPrice;
    if (size <= 0 || posVal >= balance) { blockedSetups++; return; }
    balance -= fee;
    position = { direction: dir, entryPrice: adjPrice, size, stopLoss: calculateStopLoss(adjPrice, stopLossPercent, dir), takeProfit: calculateTakeProfit(adjPrice, takeProfitPercent, dir) };
  }

  for (let i = slowSMA + 1; i < candles.length; i++) {
    const candle = candles[i];
    const price = candle.close;

    // SL/TP check
    if (position) {
      if (position.direction === 'long') {
        if (candle.low <= position.stopLoss) { closePos(position.stopLoss, false); }
        else if (candle.high >= position.takeProfit) { closePos(position.takeProfit, false); }
      } else {
        if (candle.high >= position.stopLoss) { closePos(position.stopLoss, false); }
        else if (candle.low <= position.takeProfit) { closePos(position.takeProfit, false); }
      }
    }

    const crossover = detectCrossover(fastVals[i], slowVals[i], fastVals[i - 1], slowVals[i - 1]);

    if (position) {
      if (crossover === 1 && position.direction === 'short') {
        closePos(price, true); openPos('long', price);
      } else if (crossover === -1 && position.direction === 'long') {
        closePos(price, true); openPos('short', price);
      }
    } else if (crossover !== 0) {
      openPos(crossover === 1 ? 'long' : 'short', price);
    }
  }

  if (position && candles.length > 0) closePos(candles[candles.length - 1].close, false);

  return {
    asset,
    totalTrades,
    longTrades,
    shortTrades,
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    netPnl: totalPnl,
    maxDrawdown,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    blockedSetups,
    flipTrades,
    averageTrade: totalTrades > 0 ? totalPnl / totalTrades : 0,
    largestWin,
    largestLoss,
  };
}

// ─── Scenario Explainability ─────────────────────────────────────────

function generateExplanation(result: Omit<ScenarioResult, 'explanation'>, scenario: ScenarioDefinition): string {
  const parts: string[] = [];

  if (result.winRate >= 55) parts.push(`The agent performed well with ${result.winRate.toFixed(1)}% win rate.`);
  else if (result.winRate < 40) parts.push(`The agent struggled with only ${result.winRate.toFixed(1)}% win rate.`);

  if (result.maxDrawdown > 15) parts.push(`Drawdown reached ${result.maxDrawdown.toFixed(1)}%, indicating vulnerability in ${scenario.name} conditions.`);
  else if (result.maxDrawdown < 5) parts.push(`Drawdown was well-controlled at ${result.maxDrawdown.toFixed(1)}%.`);

  if (result.flipTrades > result.totalTrades * 0.4) parts.push(`Excessive flip trades (${result.flipTrades}/${result.totalTrades}) suggest whipsaw vulnerability.`);

  if (result.totalTrades === 0) parts.push('No trades were executed — the agent may be over-filtering.');
  else if (result.totalTrades > 50) parts.push(`High trade count (${result.totalTrades}) in ${scenario.candleCount} candles — possible churn.`);

  if (result.netPnl < 0) parts.push(`Net loss of $${Math.abs(result.netPnl).toFixed(2)} in this scenario.`);
  else parts.push(`Net profit of $${result.netPnl.toFixed(2)}.`);

  if (result.blockedSetups > 5) parts.push(`${result.blockedSetups} setups were blocked by risk controls.`);

  return parts.join(' ') || `Completed ${scenario.name} scenario with ${result.totalTrades} trades.`;
}

// ─── Robustness Analyzer ─────────────────────────────────────────────

export function calculateRobustnessScores(results: ScenarioResult[], asset: Asset): RobustnessScore {
  const assetResults = results.filter(r => r.asset === asset);
  if (assetResults.length === 0) {
    return { asset, strategy: 'SMA Crossover', overallScore: 0, consistencyScore: 0, drawdownControl: 0, returnStability: 0, whipsawResistance: 0, volatilityHandling: 0, crashSurvival: 0, scenarioBreakdown: {} };
  }

  const winRates = assetResults.map(r => r.winRate);
  const avgWinRate = winRates.reduce((s, w) => s + w, 0) / winRates.length;
  const winRateStd = Math.sqrt(winRates.reduce((s, w) => s + (w - avgWinRate) ** 2, 0) / winRates.length);
  const consistencyScore = Math.max(0, 100 - winRateStd * 2);

  const maxDD = Math.max(...assetResults.map(r => r.maxDrawdown), 0.01);
  const drawdownControl = Math.max(0, 100 - maxDD * 3);

  const pnls = assetResults.map(r => r.netPnl);
  const avgPnl = pnls.reduce((s, p) => s + p, 0) / pnls.length;
  const pnlStd = Math.sqrt(pnls.reduce((s, p) => s + (p - avgPnl) ** 2, 0) / pnls.length);
  const returnStability = avgPnl > 0 ? Math.min(100, (avgPnl / Math.max(pnlStd, 0.01)) * 30) : Math.max(0, 50 + avgPnl);

  const whipsawScenarios = assetResults.filter(r => ['whipsaw_crossover', 'fake_breakout', 'reversal_heavy'].includes(r.category));
  const whipsawResistance = whipsawScenarios.length > 0
    ? Math.max(0, Math.min(100, whipsawScenarios.reduce((s, r) => s + (r.netPnl >= 0 ? 70 : 30) + (100 - r.flipTrades * 3), 0) / whipsawScenarios.length))
    : 50;

  const volScenarios = assetResults.filter(r => ['high_volatility_breakout', 'low_volatility_compression'].includes(r.category));
  const volatilityHandling = volScenarios.length > 0
    ? Math.max(0, Math.min(100, volScenarios.reduce((s, r) => s + (r.netPnl >= 0 ? 80 : 20), 0) / volScenarios.length))
    : 50;

  const crashScenarios = assetResults.filter(r => ['sudden_crash', 'sudden_pump'].includes(r.category));
  const crashSurvival = crashScenarios.length > 0
    ? Math.max(0, Math.min(100, crashScenarios.reduce((s, r) => s + Math.max(0, 100 - r.maxDrawdown * 4), 0) / crashScenarios.length))
    : 50;

  const scenarioBreakdown: Record<string, number> = {};
  for (const r of assetResults) {
    const score = (r.winRate * 0.3) + (Math.max(0, 100 - r.maxDrawdown * 3) * 0.3) + ((r.netPnl >= 0 ? 70 : 30) * 0.2) + ((r.profitFactor >= 1 ? 80 : 30) * 0.2);
    scenarioBreakdown[r.scenarioId] = Math.min(100, Math.max(0, score));
  }

  const overallScore = Math.min(100, Math.max(0,
    consistencyScore * 0.2 + drawdownControl * 0.2 + returnStability * 0.15 +
    whipsawResistance * 0.2 + volatilityHandling * 0.1 + crashSurvival * 0.15
  ));

  return { asset, strategy: 'SMA Crossover', overallScore, consistencyScore, drawdownControl, returnStability, whipsawResistance, volatilityHandling, crashSurvival, scenarioBreakdown };
}

// ─── Failure Point Reporter ──────────────────────────────────────────

export function detectFailurePoints(results: ScenarioResult[]): FailurePoint[] {
  const failures: FailurePoint[] = [];
  let id = 0;

  for (const r of results) {
    if (r.winRate < 35) {
      failures.push({ id: `fp-${id++}`, category: 'Low Win Rate', severity: r.winRate < 25 ? 'critical' : 'high', description: `Win rate of ${r.winRate.toFixed(1)}% in ${r.scenarioName}`, scenario: r.scenarioName, metric: 'winRate', value: r.winRate, threshold: 35, recommendation: 'Tighten entry filters or increase conviction threshold.' });
    }
    if (r.maxDrawdown > 20) {
      failures.push({ id: `fp-${id++}`, category: 'Excessive Drawdown', severity: r.maxDrawdown > 30 ? 'critical' : 'high', description: `Max drawdown of ${r.maxDrawdown.toFixed(1)}% in ${r.scenarioName}`, scenario: r.scenarioName, metric: 'maxDrawdown', value: r.maxDrawdown, threshold: 20, recommendation: 'Reduce position size or tighten stop losses.' });
    }
    if (r.flipTrades > r.totalTrades * 0.5 && r.totalTrades > 5) {
      failures.push({ id: `fp-${id++}`, category: 'Excessive Flips', severity: 'high', description: `${r.flipTrades} flip trades out of ${r.totalTrades} in ${r.scenarioName}`, scenario: r.scenarioName, metric: 'flipRatio', value: r.flipTrades / r.totalTrades, threshold: 0.5, recommendation: 'Add cooldown between flips or require stronger signal confirmation.' });
    }
    if (r.totalTrades === 0 && r.blockedSetups > 3) {
      failures.push({ id: `fp-${id++}`, category: 'Over-Filtering', severity: 'medium', description: `${r.blockedSetups} blocked setups with 0 trades in ${r.scenarioName}`, scenario: r.scenarioName, metric: 'blockedSetups', value: r.blockedSetups, threshold: 3, recommendation: 'Review filter thresholds — may be too aggressive.' });
    }
    if (r.netPnl < -500) {
      failures.push({ id: `fp-${id++}`, category: 'Large Loss', severity: r.netPnl < -1000 ? 'critical' : 'high', description: `Net loss of $${Math.abs(r.netPnl).toFixed(2)} in ${r.scenarioName}`, scenario: r.scenarioName, metric: 'netPnl', value: r.netPnl, threshold: -500, recommendation: 'Review strategy suitability for this market condition.' });
    }
    if (r.profitFactor < 0.5 && r.totalTrades > 3) {
      failures.push({ id: `fp-${id++}`, category: 'Weak Profit Factor', severity: 'medium', description: `Profit factor of ${r.profitFactor === Infinity ? '∞' : r.profitFactor.toFixed(2)} in ${r.scenarioName}`, scenario: r.scenarioName, metric: 'profitFactor', value: r.profitFactor, threshold: 0.5, recommendation: 'Improve risk/reward ratio or exit timing.' });
    }
  }

  return failures.sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

// ─── Recommendations Engine ──────────────────────────────────────────

export function generateRecommendations(results: ScenarioResult[], failures: FailurePoint[], robustness: RobustnessScore[]): Recommendation[] {
  const recs: Recommendation[] = [];
  let id = 0;

  // Check sideways performance
  const sidewaysResults = results.filter(r => ['sideways_choppy', 'whipsaw_crossover'].includes(r.category));
  const sidewaysLosses = sidewaysResults.filter(r => r.netPnl < 0);
  if (sidewaysLosses.length > sidewaysResults.length * 0.5) {
    recs.push({ id: `rec-${id++}`, priority: 'high', category: 'Regime Filter', title: 'Reduce trading during sideways regimes', description: 'The agent consistently lost money in sideways and whipsaw conditions. Consider disabling trading when regime is classified as sideways or increasing the conviction threshold.', basedOn: sidewaysLosses.map(r => r.scenarioName) });
  }

  // Check flip frequency
  const highFlipResults = results.filter(r => r.flipTrades > r.totalTrades * 0.4 && r.totalTrades > 5);
  if (highFlipResults.length > 0) {
    recs.push({ id: `rec-${id++}`, priority: 'high', category: 'Churn Control', title: 'Increase cooldown after flip trades', description: 'Excessive flipping was detected across multiple scenarios. Adding a cooldown period after position flips would reduce churn and fee drag.', basedOn: highFlipResults.map(r => r.scenarioName) });
  }

  // Check drawdown
  const highDDResults = results.filter(r => r.maxDrawdown > 15);
  if (highDDResults.length > 2) {
    recs.push({ id: `rec-${id++}`, priority: 'high', category: 'Risk Management', title: 'Lower allocation in high-volatility environments', description: `${highDDResults.length} scenarios exceeded 15% drawdown. Reducing position size or tightening stop losses would improve capital preservation.`, basedOn: highDDResults.map(r => r.scenarioName) });
  }

  // Check crash survival
  const crashResults = results.filter(r => ['sudden_crash', 'sudden_pump'].includes(r.category));
  const crashBad = crashResults.filter(r => r.maxDrawdown > 20);
  if (crashBad.length > 0) {
    recs.push({ id: `rec-${id++}`, priority: 'medium', category: 'Crash Protection', title: 'Improve regime filter before aggressive allocation', description: 'The agent suffered significant drawdowns during crash/pump scenarios. Faster regime detection would help the agent exit or reduce exposure sooner.', basedOn: crashBad.map(r => r.scenarioName) });
  }

  // Check if short trades are weak
  const shortHeavy = results.filter(r => r.shortTrades > r.longTrades && r.netPnl < 0);
  if (shortHeavy.length > results.length * 0.3) {
    recs.push({ id: `rec-${id++}`, priority: 'medium', category: 'Direction Bias', title: 'Disable weak strategies in bearish-reversal conditions', description: 'Short trades underperformed in several scenarios. Consider adding directional filters or reducing short trade sizing.', basedOn: shortHeavy.map(r => r.scenarioName) });
  }

  // General conviction
  const lowWinRateScenarios = results.filter(r => r.winRate < 40 && r.totalTrades > 3);
  if (lowWinRateScenarios.length > results.length * 0.4) {
    recs.push({ id: `rec-${id++}`, priority: 'medium', category: 'Conviction', title: 'Tighten conviction threshold', description: 'Many scenarios had sub-40% win rates, suggesting the agent is entering low-quality setups. A higher conviction threshold would filter out marginal trades.', basedOn: lowWinRateScenarios.map(r => r.scenarioName) });
  }

  return recs.sort((a, b) => {
    const priOrder = { high: 0, medium: 1, low: 2 };
    return priOrder[a.priority] - priOrder[b.priority];
  });
}

// ─── Run Full Test Suite ─────────────────────────────────────────────

export function runScenarioTestSuite(
  assets: Asset[],
  fastSMA: number,
  slowSMA: number,
  positionSizePercent: number,
  stopLossPercent: number,
  takeProfitPercent: number,
  feePercent: number,
  initialBalance: number,
  config: ScenarioConfig = DEFAULT_SCENARIO_CONFIG,
  scenarios: ScenarioDefinition[] = PREDEFINED_SCENARIOS,
): ScenarioTestSuite {
  const start = performance.now();
  const allResults: ScenarioResult[] = [];

  for (const scenario of scenarios) {
    for (const asset of assets) {
      const basePrice =
        asset === 'BTCUSDT' ? 65000 :
        asset === 'ETHUSDT' ? 3500 :
        asset === 'SOLUSDT' ? 150 :
        asset === 'XRPUSDT' ? 0.55 :
        asset === 'FETUSDT' ? 2.0 : 0.15;
      const candles = generateSyntheticCandles(scenario, basePrice, config, scenario.id.length * 7 + basePrice);
      const raw = runScenarioBacktest(candles, asset, fastSMA, slowSMA, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent, config.slippageMultiplier, config.feeMultiplier, initialBalance);
      const result: ScenarioResult = { ...raw, scenarioId: scenario.id, scenarioName: scenario.name, category: scenario.category, explanation: '' };
      result.explanation = generateExplanation(result, scenario);
      allResults.push(result);
    }
  }

  const robustnessScores = assets.map(a => calculateRobustnessScores(allResults, a));
  const failurePoints = detectFailurePoints(allResults);
  const recommendations = generateRecommendations(allResults, failurePoints, robustnessScores);
  const duration = performance.now() - start;

  return {
    id: `suite-${Date.now()}`,
    runAt: Date.now(),
    scenarios: allResults,
    robustnessScores,
    failurePoints,
    recommendations,
    config,
    duration,
  };
}
