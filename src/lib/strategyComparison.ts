import { Asset, Trade, MarketRegime, Candle } from '@/types/trading';
import {
  StrategyId, StrategyPerformance, StrategyComparison,
  StrategySignal, MultiStrategyConfig, StrategySwitchRule,
} from '@/types/strategy';
import { ASSET_INFO } from '@/config/trading';
import { detectMarketRegime } from './indicators';
import { getStrategyDefinition } from './strategyEngine';

// ─── Performance Calculation ─────────────────────────────────────────

export function calculateStrategyPerformance(
  strategyId: StrategyId,
  asset: Asset,
  trades: Trade[],
  regimeAtTrade?: MarketRegime[],
): StrategyPerformance {
  const wins = trades.filter(t => t.type === 'win');
  const losses = trades.filter(t => t.type === 'loss');
  const longs = trades.filter(t => t.direction === 'long');
  const shorts = trades.filter(t => t.direction === 'short');
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const avgTrade = trades.length > 0 ? netPnl / trades.length : 0;

  // Max drawdown
  let peak = 0;
  let maxDD = 0;
  let running = 0;
  for (const t of trades) {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }

  // By regime
  const byRegime: StrategyPerformance['byRegime'] = {
    trending_bullish: { trades: 0, pnl: 0, winRate: 0 },
    trending_bearish: { trades: 0, pnl: 0, winRate: 0 },
    sideways: { trades: 0, pnl: 0, winRate: 0 },
  };

  if (regimeAtTrade && regimeAtTrade.length === trades.length) {
    const regimeWins: Record<MarketRegime, number> = { trending_bullish: 0, trending_bearish: 0, sideways: 0 };
    trades.forEach((t, i) => {
      const r = regimeAtTrade[i];
      byRegime[r].trades++;
      byRegime[r].pnl += t.pnl;
      if (t.type === 'win') regimeWins[r]++;
    });
    for (const r of Object.keys(byRegime) as MarketRegime[]) {
      byRegime[r].winRate = byRegime[r].trades > 0
        ? (regimeWins[r] / byRegime[r].trades) * 100 : 0;
    }
  }

  return {
    strategyId, asset, netPnl, winRate, profitFactor,
    maxDrawdown: maxDD, tradeCount: trades.length, avgTrade,
    longCount: longs.length, shortCount: shorts.length, byRegime,
  };
}

// ─── Strategy Comparison ─────────────────────────────────────────────

export function compareStrategies(
  asset: Asset,
  performances: StrategyPerformance[],
): StrategyComparison {
  if (performances.length === 0) {
    return {
      asset, strategies: [], bestOverall: 'sma_crossover',
      bestByRegime: { trending_bullish: 'sma_crossover', trending_bearish: 'sma_crossover', sideways: 'sma_crossover' },
      bestLowDrawdown: 'sma_crossover', bestHighWinRate: 'sma_crossover',
      explanation: 'No strategy data available.',
    };
  }

  const sorted = [...performances].sort((a, b) => b.netPnl - a.netPnl);
  const bestOverall = sorted[0].strategyId;

  const bestByRegime: Record<MarketRegime, StrategyId> = {
    trending_bullish: 'sma_crossover',
    trending_bearish: 'sma_crossover',
    sideways: 'sma_crossover',
  };
  for (const regime of ['trending_bullish', 'trending_bearish', 'sideways'] as MarketRegime[]) {
    const best = [...performances].sort((a, b) => b.byRegime[regime].pnl - a.byRegime[regime].pnl)[0];
    if (best) bestByRegime[regime] = best.strategyId;
  }

  const bestLowDrawdown = [...performances].sort((a, b) => a.maxDrawdown - b.maxDrawdown)[0]?.strategyId || 'sma_crossover';
  const bestHighWinRate = [...performances].sort((a, b) => b.winRate - a.winRate)[0]?.strategyId || 'sma_crossover';

  const explanation = generateComparisonExplanation(asset, performances, bestOverall, bestByRegime);

  return {
    asset, strategies: performances, bestOverall,
    bestByRegime, bestLowDrawdown, bestHighWinRate, explanation,
  };
}

function generateComparisonExplanation(
  asset: Asset,
  performances: StrategyPerformance[],
  bestOverall: StrategyId,
  bestByRegime: Record<MarketRegime, StrategyId>,
): string {
  const symbol = ASSET_INFO[asset]?.symbol || asset;
  const bestDef = getStrategyDefinition(bestOverall);
  const parts: string[] = [];

  const bestPerf = performances.find(p => p.strategyId === bestOverall);
  if (bestPerf) {
    parts.push(`${bestDef.name} is the top performer on ${symbol} with $${bestPerf.netPnl.toFixed(2)} net PnL and ${bestPerf.winRate.toFixed(0)}% win rate.`);
  }

  // Regime insights
  const regimeNames: Record<MarketRegime, string> = {
    trending_bullish: 'bullish', trending_bearish: 'bearish', sideways: 'sideways',
  };
  for (const regime of Object.keys(bestByRegime) as MarketRegime[]) {
    if (bestByRegime[regime] !== bestOverall) {
      const def = getStrategyDefinition(bestByRegime[regime]);
      parts.push(`${def.name} outperforms during ${regimeNames[regime]} conditions.`);
    }
  }

  if (parts.length === 1) {
    parts.push(`It maintains consistent performance across all market regimes.`);
  }

  return parts.join(' ');
}

// ─── Strategy Selection / Switching ──────────────────────────────────

export function selectStrategy(
  asset: Asset,
  config: MultiStrategyConfig,
  performances: StrategyPerformance[],
  currentRegime: MarketRegime,
  candlesSinceLastSwitch: number,
): { strategyId: StrategyId; reason: string } {
  // Anti-churn guard
  if (candlesSinceLastSwitch < config.minCandlesBeforeSwitch) {
    const current = config.activeStrategyPerAsset[asset];
    return { strategyId: current, reason: `Maintaining ${getStrategyDefinition(current).name} — minimum period before switching not reached.` };
  }

  switch (config.switchRule) {
    case 'fixed':
      return {
        strategyId: config.activeStrategyPerAsset[asset],
        reason: `Fixed strategy assignment for ${ASSET_INFO[asset]?.symbol}.`,
      };

    case 'best_recent': {
      const assetPerf = performances.filter(p => p.asset === asset);
      if (assetPerf.length === 0) return { strategyId: config.activeStrategyPerAsset[asset], reason: 'No performance data yet.' };
      const best = [...assetPerf].sort((a, b) => b.netPnl - a.netPnl)[0];
      return {
        strategyId: best.strategyId,
        reason: `${getStrategyDefinition(best.strategyId).name} has the best recent PnL ($${best.netPnl.toFixed(2)}) on ${ASSET_INFO[asset]?.symbol}.`,
      };
    }

    case 'by_regime': {
      const comparison = compareStrategies(asset, performances.filter(p => p.asset === asset));
      const chosen = comparison.bestByRegime[currentRegime];
      const regimeLabel = currentRegime === 'trending_bullish' ? 'bullish' : currentRegime === 'trending_bearish' ? 'bearish' : 'sideways';
      return {
        strategyId: chosen,
        reason: `${getStrategyDefinition(chosen).name} selected for ${regimeLabel} regime on ${ASSET_INFO[asset]?.symbol}.`,
      };
    }

    case 'rolling_perf': {
      const assetPerf = performances.filter(p => p.asset === asset);
      if (assetPerf.length === 0) return { strategyId: config.activeStrategyPerAsset[asset], reason: 'No rolling data yet.' };
      // Score: 40% PnL + 30% winRate + 30% (1/drawdown)
      const scored = assetPerf.map(p => ({
        ...p,
        score: (p.netPnl > 0 ? 40 : 0) + (p.winRate * 0.3) + (p.maxDrawdown > 0 ? 30 / p.maxDrawdown : 30),
      })).sort((a, b) => b.score - a.score);
      return {
        strategyId: scored[0].strategyId,
        reason: `${getStrategyDefinition(scored[0].strategyId).name} has the best rolling score on ${ASSET_INFO[asset]?.symbol}.`,
      };
    }

    default:
      return { strategyId: config.activeStrategyPerAsset[asset], reason: 'Default strategy.' };
  }
}

// ─── Explainability ──────────────────────────────────────────────────

export function explainStrategyDecision(
  signal: StrategySignal,
  isActive: boolean,
  skipReason?: string,
): string {
  const def = getStrategyDefinition(signal.strategyId);
  const symbol = ASSET_INFO[signal.asset]?.symbol || signal.asset;

  if (!isActive) {
    return `${def.name} was skipped on ${symbol}${skipReason ? ` because ${skipReason}` : ''}.`;
  }

  if (signal.type === 'HOLD') {
    return `${def.name} holds on ${symbol} — no actionable signal.`;
  }

  const dir = signal.type === 'BUY' ? 'LONG' : 'SHORT';
  return `${def.name} signals ${dir} on ${symbol} at $${signal.price.toFixed(2)} (confidence: ${signal.confidence}%).`;
}
