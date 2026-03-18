/**
 * Full parameter optimization engine.
 * Generates parameter grids, runs batch backtests, ranks results,
 * and identifies best settings per asset and category.
 */

import { Asset, Candle } from '@/types/trading';
import { runBacktestSimulation, BacktestEngineConfig } from './backtest-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParameterRanges {
  fastSMA: { min: number; max: number; step: number };
  slowSMA: { min: number; max: number; step: number };
  stopLossPercent: { min: number; max: number; step: number };
  takeProfitPercent: { min: number; max: number; step: number };
  atrPeriod: { min: number; max: number; step: number };
  minAtrPercent: { min: number; max: number; step: number };
  minSmaDistancePercent: { min: number; max: number; step: number };
  cooldownCandles: { min: number; max: number; step: number };
}

export interface ParameterSet {
  fastSMA: number;
  slowSMA: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  atrPeriod: number;
  minAtrPercent: number;
  minSmaDistancePercent: number;
  cooldownCandles: number;
}

export interface FullOptimizationResult {
  params: ParameterSet;
  asset: 'combined' | Asset;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  longTrades: number;
  shortTrades: number;
  longWins: number;
  shortWins: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgTradePnl: number;
  consistencyScore: number;
  riskAdjustedScore: number;
  overfitFlag: boolean;
}

export interface BestSettingsSummary {
  bestOverall: FullOptimizationResult | null;
  bestLowDrawdown: FullOptimizationResult | null;
  bestHighWinRate: FullOptimizationResult | null;
  bestBalanced: FullOptimizationResult | null;
}

export interface AssetComparisonResult {
  asset: Asset;
  bestParams: ParameterSet;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  longTrades: number;
  shortTrades: number;
}

// ─── Default parameter ranges ────────────────────────────────────────────────

export const DEFAULT_RANGES: ParameterRanges = {
  fastSMA: { min: 5, max: 25, step: 5 },
  slowSMA: { min: 30, max: 80, step: 10 },
  stopLossPercent: { min: 1.5, max: 3, step: 0.5 },
  takeProfitPercent: { min: 2, max: 5, step: 1 },
  atrPeriod: { min: 14, max: 14, step: 1 },
  minAtrPercent: { min: 0.3, max: 0.7, step: 0.2 },
  minSmaDistancePercent: { min: 0.05, max: 0.15, step: 0.05 },
  cooldownCandles: { min: 2, max: 4, step: 1 },
};

// ─── Grid generation ─────────────────────────────────────────────────────────

function rangeValues(r: { min: number; max: number; step: number }): number[] {
  const vals: number[] = [];
  for (let v = r.min; v <= r.max + r.step * 0.01; v += r.step) {
    vals.push(Math.round(v * 1000) / 1000);
  }
  return vals;
}

export function generateParameterGrid(ranges: ParameterRanges): ParameterSet[] {
  const grid: ParameterSet[] = [];
  for (const fast of rangeValues(ranges.fastSMA)) {
    for (const slow of rangeValues(ranges.slowSMA)) {
      if (fast >= slow) continue;
      for (const sl of rangeValues(ranges.stopLossPercent)) {
        for (const tp of rangeValues(ranges.takeProfitPercent)) {
          for (const atr of rangeValues(ranges.atrPeriod)) {
            for (const minAtr of rangeValues(ranges.minAtrPercent)) {
              for (const smaDist of rangeValues(ranges.minSmaDistancePercent)) {
                for (const cd of rangeValues(ranges.cooldownCandles)) {
                  grid.push({
                    fastSMA: fast,
                    slowSMA: slow,
                    stopLossPercent: sl,
                    takeProfitPercent: tp,
                    atrPeriod: Math.round(atr),
                    minAtrPercent: minAtr,
                    minSmaDistancePercent: smaDist,
                    cooldownCandles: Math.round(cd),
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  return grid;
}

export function countCombinations(ranges: ParameterRanges): number {
  const count = (r: { min: number; max: number; step: number }) =>
    Math.max(1, Math.floor((r.max - r.min) / r.step) + 1);
  const fastCount = count(ranges.fastSMA);
  const slowCount = count(ranges.slowSMA);
  // Rough estimate: ~half of fast×slow are valid (fast < slow)
  const validPairs = Math.max(1, Math.floor((fastCount * slowCount) / 2));
  return (
    validPairs *
    count(ranges.stopLossPercent) *
    count(ranges.takeProfitPercent) *
    count(ranges.atrPeriod) *
    count(ranges.minAtrPercent) *
    count(ranges.minSmaDistancePercent) *
    count(ranges.cooldownCandles)
  );
}

// ─── Single run ──────────────────────────────────────────────────────────────

function runSingleOptimization(
  candlesMap: Record<Asset, Candle[]>,
  assets: Asset[],
  params: ParameterSet,
  positionSizePercent: number,
  feePercent: number,
  initialBalance: number,
): FullOptimizationResult {
  const balancePerAsset = initialBalance / assets.length;
  let totalPnl = 0;
  let totalLongWins = 0, totalLongLosses = 0, totalShortWins = 0, totalShortLosses = 0;
  let worstDrawdown = 0;
  const perAssetReturns: number[] = [];

  const engineConfig: BacktestEngineConfig = {
    fastSMA: params.fastSMA,
    slowSMA: params.slowSMA,
    positionSizePercent,
    stopLossPercent: params.stopLossPercent,
    takeProfitPercent: params.takeProfitPercent,
    feePercent,
    enableFilters: true,
    atrPeriod: params.atrPeriod,
    minAtrPercent: params.minAtrPercent,
    minSmaDistancePercent: params.minSmaDistancePercent,
    cooldownCandles: params.cooldownCandles,
    maxDailyLossPercent: 5,
    maxConsecutiveLosses: 5,
  };

  for (const asset of assets) {
    const candles = candlesMap[asset];
    if (!candles || candles.length === 0) continue;

    const result = runBacktestSimulation(candles, asset, engineConfig, balancePerAsset);
    const pnl = result.finalBalance - balancePerAsset;
    totalPnl += pnl;

    // Count long/short
    for (const t of result.trades) {
      if (t.direction === 'long') {
        t.type === 'win' ? totalLongWins++ : totalLongLosses++;
      } else {
        t.type === 'win' ? totalShortWins++ : totalShortLosses++;
      }
    }

    // Track drawdown
    let peak = balancePerAsset;
    let running = balancePerAsset;
    for (const t of result.trades) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = ((peak - running) / peak) * 100;
      if (dd > worstDrawdown) worstDrawdown = dd;
    }

    perAssetReturns.push(pnl / balancePerAsset);
  }

  const totalWins = totalLongWins + totalShortWins;
  const totalLosses = totalLongLosses + totalShortLosses;
  const totalTrades = totalWins + totalLosses;
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const avgTradePnl = totalTrades > 0 ? totalPnl / totalTrades : 0;

  // Profit factor approximation
  const grossProfit = totalWins > 0 ? (totalPnl > 0 ? totalPnl * (totalWins / totalTrades) : Math.max(0, avgTradePnl * totalWins)) : 0;
  const grossLoss = totalLosses > 0 ? Math.abs(totalPnl < 0 ? totalPnl * (totalLosses / totalTrades) : Math.min(0, avgTradePnl * totalLosses)) : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : totalPnl > 0 ? 99 : 0;

  // Sharpe
  const avgReturn = perAssetReturns.length > 0 ? perAssetReturns.reduce((a, b) => a + b, 0) / perAssetReturns.length : 0;
  const stdDev = perAssetReturns.length > 1
    ? Math.sqrt(perAssetReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (perAssetReturns.length - 1))
    : 0;
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Consistency: penalize high variance across assets
  const consistencyScore = perAssetReturns.length > 1
    ? Math.max(0, 100 - (stdDev / Math.max(0.01, Math.abs(avgReturn))) * 50)
    : totalPnl > 0 ? 70 : 30;

  // Risk-adjusted score: balance return, drawdown, win rate, consistency
  const returnScore = Math.min(100, Math.max(0, (totalPnl / initialBalance) * 100 * 10 + 50));
  const ddScore = Math.max(0, 100 - worstDrawdown * 5);
  const wrScore = winRate;
  const riskAdjustedScore = returnScore * 0.35 + ddScore * 0.25 + wrScore * 0.2 + consistencyScore * 0.2;

  return {
    params,
    asset: 'combined',
    totalPnl,
    totalPnlPercent: (totalPnl / initialBalance) * 100,
    winRate,
    totalTrades,
    longTrades: totalLongWins + totalLongLosses,
    shortTrades: totalShortWins + totalShortLosses,
    longWins: totalLongWins,
    shortWins: totalShortWins,
    profitFactor: Math.min(profitFactor, 99),
    maxDrawdown: worstDrawdown,
    sharpeRatio,
    avgTradePnl,
    consistencyScore,
    riskAdjustedScore,
    overfitFlag: false,
  };
}

// ─── Per-asset run ───────────────────────────────────────────────────────────

function runPerAssetOptimization(
  candles: Candle[],
  asset: Asset,
  params: ParameterSet,
  positionSizePercent: number,
  feePercent: number,
  initialBalance: number,
): FullOptimizationResult {
  const map = { [asset]: candles } as Record<Asset, Candle[]>;
  const result = runSingleOptimization(map, [asset], params, positionSizePercent, feePercent, initialBalance);
  return { ...result, asset };
}

// ─── Batch optimization ──────────────────────────────────────────────────────

export async function runBatchOptimization(
  candlesMap: Record<Asset, Candle[]>,
  assets: Asset[],
  grid: ParameterSet[],
  positionSizePercent: number,
  feePercent: number,
  initialBalance: number,
  onProgress: (pct: number) => void,
  mode: 'combined' | 'per-asset',
): Promise<FullOptimizationResult[]> {
  const results: FullOptimizationResult[] = [];
  const total = mode === 'per-asset' ? grid.length * assets.length : grid.length;
  let done = 0;

  for (const params of grid) {
    if (mode === 'combined') {
      results.push(runSingleOptimization(candlesMap, assets, params, positionSizePercent, feePercent, initialBalance));
      done++;
    } else {
      for (const asset of assets) {
        const candles = candlesMap[asset];
        if (candles && candles.length > 0) {
          results.push(runPerAssetOptimization(candles, asset, params, positionSizePercent, feePercent, initialBalance));
        }
        done++;
      }
    }

    // Yield to UI every 20 iterations
    if (done % 20 === 0) {
      onProgress((done / total) * 100);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return results;
}

// ─── Walk-forward split optimization ─────────────────────────────────────────

export function runWalkForwardOptimization(
  candlesMap: Record<Asset, Candle[]>,
  assets: Asset[],
  grid: ParameterSet[],
  positionSizePercent: number,
  feePercent: number,
  initialBalance: number,
  inSampleRatio: number,
): FullOptimizationResult[] {
  // Split candles into in-sample / out-of-sample
  const isCandlesMap: Record<Asset, Candle[]> = {} as any;
  const oosCandlesMap: Record<Asset, Candle[]> = {} as any;

  for (const asset of assets) {
    const candles = candlesMap[asset];
    if (!candles) continue;
    const splitIdx = Math.floor(candles.length * (inSampleRatio / 100));
    isCandlesMap[asset] = candles.slice(0, splitIdx);
    oosCandlesMap[asset] = candles.slice(splitIdx);
  }

  // Run all combos on in-sample
  const isResults = grid.map(params =>
    runSingleOptimization(isCandlesMap, assets, params, positionSizePercent, feePercent, initialBalance)
  );

  // Sort by PnL, take top 10
  isResults.sort((a, b) => b.totalPnl - a.totalPnl);
  const topIS = isResults.slice(0, 10);

  // Validate top params on out-of-sample
  const validated: FullOptimizationResult[] = topIS.map(isResult => {
    const oosResult = runSingleOptimization(oosCandlesMap, assets, isResult.params, positionSizePercent, feePercent, initialBalance);
    const degradation = isResult.totalPnlPercent > 0
      ? 1 - (oosResult.totalPnlPercent / isResult.totalPnlPercent)
      : 0;
    return {
      ...oosResult,
      overfitFlag: degradation > 0.7 || (isResult.totalPnl > 0 && oosResult.totalPnl < 0),
    };
  });

  return validated;
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

export type SortField = 'totalPnl' | 'winRate' | 'profitFactor' | 'maxDrawdown' | 'sharpeRatio' | 'avgTradePnl' | 'consistencyScore' | 'riskAdjustedScore';

export function rankResults(results: FullOptimizationResult[], sortBy: SortField): FullOptimizationResult[] {
  return [...results].sort((a, b) => {
    if (sortBy === 'maxDrawdown') return a.maxDrawdown - b.maxDrawdown; // lower is better
    return (b[sortBy] as number) - (a[sortBy] as number);
  });
}

// ─── Best settings finder ────────────────────────────────────────────────────

export function findBestSettings(results: FullOptimizationResult[]): BestSettingsSummary {
  if (results.length === 0) return { bestOverall: null, bestLowDrawdown: null, bestHighWinRate: null, bestBalanced: null };

  const withTrades = results.filter(r => r.totalTrades >= 3);
  if (withTrades.length === 0) return { bestOverall: null, bestLowDrawdown: null, bestHighWinRate: null, bestBalanced: null };

  const byPnl = [...withTrades].sort((a, b) => b.totalPnl - a.totalPnl);
  const byDD = [...withTrades].sort((a, b) => a.maxDrawdown - b.maxDrawdown);
  const byWR = [...withTrades].sort((a, b) => b.winRate - a.winRate);
  const byBalanced = [...withTrades].sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore);

  return {
    bestOverall: byPnl[0],
    bestLowDrawdown: byDD[0],
    bestHighWinRate: byWR[0],
    bestBalanced: byBalanced[0],
  };
}

// ─── Asset comparison ────────────────────────────────────────────────────────

export function buildAssetComparison(
  perAssetResults: FullOptimizationResult[],
  assets: Asset[],
): AssetComparisonResult[] {
  return assets.map(asset => {
    const assetResults = perAssetResults.filter(r => r.asset === asset && r.totalTrades >= 3);
    if (assetResults.length === 0) {
      return {
        asset,
        bestParams: DEFAULT_RANGES as unknown as ParameterSet,
        totalPnl: 0, totalPnlPercent: 0, winRate: 0, totalTrades: 0,
        maxDrawdown: 0, profitFactor: 0, sharpeRatio: 0,
        longTrades: 0, shortTrades: 0,
      };
    }
    const best = assetResults.sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore)[0];
    return {
      asset,
      bestParams: best.params,
      totalPnl: best.totalPnl,
      totalPnlPercent: best.totalPnlPercent,
      winRate: best.winRate,
      totalTrades: best.totalTrades,
      maxDrawdown: best.maxDrawdown,
      profitFactor: best.profitFactor,
      sharpeRatio: best.sharpeRatio,
      longTrades: best.longTrades,
      shortTrades: best.shortTrades,
    };
  });
}
