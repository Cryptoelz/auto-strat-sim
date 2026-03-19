/**
 * Performance Research Engine.
 * Computes baselines, benchmarks, rolling analysis, regime breakdown,
 * failure detection, scorecards, insights, and improvement suggestions.
 */
import { Trade, Asset, MarketRegime } from '@/types/trading';
import { StrategyId } from '@/types/strategy';
import {
  BaselinePerformance, BenchmarkResult, BenchmarkType,
  RollingWindow, RollingAnalysis, RollingPerformancePoint,
  RegimePerformance, VolatilityLevel,
  FailurePattern, FailurePatternType,
  StrategyScorecard, ResearchInsight, InsightCategory,
  ImprovementSuggestion, ResearchReport, SavedBaseline,
} from '@/types/research';

// ─── Baseline Persistence ────────────────────────────────────────────────────

const BASELINE_KEY = 'research-saved-baseline';

export function saveBaseline(baseline: SavedBaseline): void {
  localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
}

export function loadBaseline(): SavedBaseline | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBaseline(): void {
  localStorage.removeItem(BASELINE_KEY);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return (trades.filter(t => t.type === 'win').length / trades.length) * 100;
}

function computeProfitFactor(trades: Trade[]): number {
  const gross = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const loss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  return loss > 0 ? gross / loss : gross > 0 ? Infinity : 0;
}

function computeMaxDrawdown(trades: Trade[]): number {
  let peak = 0, maxDD = 0, running = 0;
  for (const t of trades) {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

function computeAvgTrade(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return trades.reduce((s, t) => s + t.pnl, 0) / trades.length;
}

function computeConsistency(trades: Trade[]): number {
  if (trades.length < 10) return 50;
  // Split into 5 buckets, measure win-rate variance
  const bucketSize = Math.floor(trades.length / 5);
  const rates: number[] = [];
  for (let i = 0; i < 5; i++) {
    const bucket = trades.slice(i * bucketSize, (i + 1) * bucketSize);
    rates.push(computeWinRate(bucket));
  }
  const mean = rates.reduce((s, r) => s + r, 0) / rates.length;
  const variance = rates.reduce((s, r) => s + (r - mean) ** 2, 0) / rates.length;
  const stdDev = Math.sqrt(variance);
  // Lower stdDev = more consistent. Map to 0-100 score
  return Math.max(0, Math.min(100, 100 - stdDev * 2));
}

function computeRobustness(trades: Trade[]): number {
  const pf = computeProfitFactor(trades);
  const wr = computeWinRate(trades);
  const dd = computeMaxDrawdown(trades);
  const cons = computeConsistency(trades);
  // Weighted score
  const pfScore = Math.min(30, (pf > 1 ? (pf - 1) * 20 : 0));
  const wrScore = Math.min(25, wr > 40 ? (wr - 40) * 1.25 : 0);
  const ddScore = Math.min(25, dd < 20 ? (20 - dd) * 1.25 : 0);
  const conScore = cons * 0.2;
  return Math.min(100, pfScore + wrScore + ddScore + conScore);
}

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

// ─── Baseline Performance ────────────────────────────────────────────────────

export function computeBaselinePerformance(
  baselineId: string,
  trades: Trade[],
): BaselinePerformance {
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    baselineId,
    netPnl,
    maxDrawdown: computeMaxDrawdown(trades),
    winRate: computeWinRate(trades),
    profitFactor: computeProfitFactor(trades),
    tradeCount: trades.length,
    avgTrade: computeAvgTrade(trades),
    robustnessScore: computeRobustness(trades),
    consistencyScore: computeConsistency(trades),
    updatedAt: Date.now(),
  };
}

// ─── Benchmarks ──────────────────────────────────────────────────────────────

export function computeBuyAndHoldBenchmark(
  startPrice: number,
  endPrice: number,
  initialBalance: number,
): BenchmarkResult {
  const ret = ((endPrice - startPrice) / startPrice) * 100;
  const pnl = (ret / 100) * initialBalance;
  return {
    type: 'buy_and_hold',
    label: 'Buy & Hold',
    netPnl: pnl,
    totalReturn: ret,
    maxDrawdown: ret < 0 ? Math.abs(ret) : 0,
    winRate: ret > 0 ? 100 : 0,
    profitFactor: ret > 0 ? Infinity : 0,
    tradeCount: 1,
  };
}

export function computeRandomEntryBenchmark(trades: Trade[]): BenchmarkResult {
  // Simulate random: average of all trades gives expected value of random entry
  const avgPnl = computeAvgTrade(trades);
  const netPnl = avgPnl * trades.length;
  return {
    type: 'random_entry',
    label: 'Random Entry',
    netPnl,
    totalReturn: 0,
    maxDrawdown: computeMaxDrawdown(trades) * 1.2, // random is typically worse
    winRate: 50,
    profitFactor: 1.0,
    tradeCount: trades.length,
  };
}

export function computeLongOnlySMABenchmark(trades: Trade[], initialBalance: number): BenchmarkResult {
  const longTrades = trades.filter(t => t.direction === 'long');
  const netPnl = longTrades.reduce((s, t) => s + t.pnl, 0);
  return {
    type: 'long_only_sma',
    label: 'Long-Only SMA',
    netPnl,
    totalReturn: initialBalance > 0 ? (netPnl / initialBalance) * 100 : 0,
    maxDrawdown: computeMaxDrawdown(longTrades),
    winRate: computeWinRate(longTrades),
    profitFactor: computeProfitFactor(longTrades),
    tradeCount: longTrades.length,
  };
}

export function computeLongShortSMABenchmark(trades: Trade[], initialBalance: number): BenchmarkResult {
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    type: 'long_short_sma',
    label: 'Long/Short SMA',
    netPnl,
    totalReturn: initialBalance > 0 ? (netPnl / initialBalance) * 100 : 0,
    maxDrawdown: computeMaxDrawdown(trades),
    winRate: computeWinRate(trades),
    profitFactor: computeProfitFactor(trades),
    tradeCount: trades.length,
  };
}

export function computeStrategyBenchmark(
  trades: Trade[],
  initialBalance: number,
): BenchmarkResult {
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    type: 'baseline',
    label: 'Current Strategy',
    netPnl,
    totalReturn: initialBalance > 0 ? (netPnl / initialBalance) * 100 : 0,
    maxDrawdown: computeMaxDrawdown(trades),
    winRate: computeWinRate(trades),
    profitFactor: computeProfitFactor(trades),
    tradeCount: trades.length,
  };
}

// ─── Rolling Performance ─────────────────────────────────────────────────────

const DEFAULT_WINDOWS: RollingWindow[] = [
  { label: 'Last 20 trades', size: 20, unit: 'trades' },
  { label: 'Last 50 trades', size: 50, unit: 'trades' },
  { label: 'Last 100 trades', size: 100, unit: 'trades' },
];

export function computeRollingAnalysis(
  trades: Trade[],
  windows: RollingWindow[] = DEFAULT_WINDOWS,
): RollingAnalysis[] {
  return windows.map(window => {
    if (window.unit !== 'trades') {
      return { window, points: [], isDegrading: false, degradationReason: null, trend: 'stable' as const };
    }

    const points: RollingPerformancePoint[] = [];
    const step = Math.max(1, Math.floor(window.size / 4));

    for (let end = window.size; end <= trades.length; end += step) {
      const slice = trades.slice(end - window.size, end);
      points.push({
        windowEnd: end,
        netPnl: slice.reduce((s, t) => s + t.pnl, 0),
        winRate: computeWinRate(slice),
        profitFactor: computeProfitFactor(slice),
        maxDrawdown: computeMaxDrawdown(slice),
        avgTrade: computeAvgTrade(slice),
      });
    }

    // Detect degradation: compare last 2 points
    let isDegrading = false;
    let degradationReason: string | null = null;
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';

    if (points.length >= 2) {
      const prev = points[points.length - 2];
      const curr = points[points.length - 1];
      const pnlDelta = curr.netPnl - prev.netPnl;
      const wrDelta = curr.winRate - prev.winRate;

      if (pnlDelta < 0 && wrDelta < -5) {
        isDegrading = true;
        degradationReason = `PnL dropped ${Math.abs(pnlDelta).toFixed(2)} and win rate fell ${Math.abs(wrDelta).toFixed(1)}% over the last window.`;
        trend = 'degrading';
      } else if (pnlDelta > 0 && wrDelta > 2) {
        trend = 'improving';
      }
    }

    return { window, points, isDegrading, degradationReason, trend };
  });
}

// ─── Regime Breakdown ────────────────────────────────────────────────────────

export function computeRegimeBreakdown(
  trades: Trade[],
  regimePerTrade: MarketRegime[],
  volatilityPerTrade: VolatilityLevel[],
): RegimePerformance[] {
  const regimes: MarketRegime[] = ['trending_bullish', 'trending_bearish', 'sideways'];
  const levels: VolatilityLevel[] = ['high', 'low'];
  const results: RegimePerformance[] = [];

  for (const regime of regimes) {
    for (const vol of levels) {
      const filtered = trades.filter((_, i) =>
        regimePerTrade[i] === regime && volatilityPerTrade[i] === vol
      );
      if (filtered.length === 0) continue;
      results.push({
        regime,
        volatility: vol,
        tradeCount: filtered.length,
        netPnl: filtered.reduce((s, t) => s + t.pnl, 0),
        winRate: computeWinRate(filtered),
        profitFactor: computeProfitFactor(filtered),
        avgTrade: computeAvgTrade(filtered),
        maxDrawdown: computeMaxDrawdown(filtered),
      });
    }
  }

  return results;
}

// ─── Failure Pattern Detection ───────────────────────────────────────────────

export function detectFailurePatterns(trades: Trade[]): FailurePattern[] {
  const patterns: FailurePattern[] = [];
  if (trades.length < 5) return patterns;

  // 1. Stop-loss clusters
  const slTrades = trades.filter(t => t.exitReason === 'stop_loss');
  if (slTrades.length >= 3) {
    // Check for clustering: 3+ SL hits within 5 consecutive trades
    for (let i = 0; i <= trades.length - 5; i++) {
      const window = trades.slice(i, i + 5);
      const slCount = window.filter(t => t.exitReason === 'stop_loss').length;
      if (slCount >= 3) {
        patterns.push({
          type: 'stop_loss_cluster',
          severity: slCount >= 4 ? 'high' : 'medium',
          description: `${slCount} stop-losses hit in a cluster of 5 trades`,
          evidence: `Trades #${i + 1}-${i + 5}: ${slCount} SL exits`,
          affectedTrades: slCount,
          suggestion: 'Increase stop-loss distance or add a volatility filter to avoid entries during choppy conditions.',
        });
        break; // Report first cluster only
      }
    }
  }

  // 2. Excessive flip trades
  const flipTrades = trades.filter(t =>
    t.exitReason === 'flip_to_long' || t.exitReason === 'flip_to_short'
  );
  const flipRate = (flipTrades.length / trades.length) * 100;
  if (flipRate > 20) {
    patterns.push({
      type: 'excessive_flips',
      severity: flipRate > 40 ? 'high' : 'medium',
      description: `${flipRate.toFixed(0)}% of trades are flip trades`,
      evidence: `${flipTrades.length} flips out of ${trades.length} total trades`,
      affectedTrades: flipTrades.length,
      suggestion: 'Increase cooldown period or add a minimum hold duration to reduce whipsaw flips.',
    });
  }

  // 3. Weak short performance
  const shorts = trades.filter(t => t.direction === 'short');
  const longs = trades.filter(t => t.direction === 'long');
  if (shorts.length >= 5 && longs.length >= 5) {
    const shortWR = computeWinRate(shorts);
    const longWR = computeWinRate(longs);
    const shortPnl = shorts.reduce((s, t) => s + t.pnl, 0);
    if (shortWR < longWR - 15 || shortPnl < 0) {
      patterns.push({
        type: 'weak_shorts',
        severity: shortPnl < 0 ? 'high' : 'medium',
        description: `Short trades are underperforming (${shortWR.toFixed(0)}% WR vs ${longWR.toFixed(0)}% long WR)`,
        evidence: `Short PnL: $${shortPnl.toFixed(2)}, ${shorts.length} trades`,
        affectedTrades: shorts.length,
        suggestion: 'Consider disabling short trades or requiring stronger bearish confirmation signals.',
      });
    }
  }

  // 4. Over-filtering (too few trades)
  if (trades.length < 10) {
    patterns.push({
      type: 'over_filtering',
      severity: trades.length < 5 ? 'high' : 'medium',
      description: `Only ${trades.length} trades executed — filters may be too restrictive`,
      evidence: `Total trade count: ${trades.length}`,
      affectedTrades: 0,
      suggestion: 'Loosen ATR threshold or disable the SMA distance filter to allow more entries.',
    });
  }

  // 5. Under-trading detection via long gaps
  if (trades.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < trades.length; i++) {
      gaps.push(trades[i].entryTime - trades[i - 1].exitTime);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const maxGap = Math.max(...gaps);
    if (maxGap > avgGap * 4 && maxGap > 3600000 * 4) {
      patterns.push({
        type: 'under_trading',
        severity: 'low',
        description: 'Long idle periods between trades detected',
        evidence: `Max gap: ${(maxGap / 3600000).toFixed(1)}h, avg gap: ${(avgGap / 3600000).toFixed(1)}h`,
        affectedTrades: 0,
        suggestion: 'Review filter configuration — the strategy may be missing valid opportunities.',
      });
    }
  }

  return patterns;
}

// ─── Strategy Scorecard ──────────────────────────────────────────────────────

export function computeScorecard(
  strategyId: StrategyId,
  asset: Asset | 'all',
  trades: Trade[],
): StrategyScorecard {
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const robustness = computeRobustness(trades);
  const consistency = computeConsistency(trades);
  const composite = robustness * 0.6 + consistency * 0.4;

  return {
    strategyId,
    asset,
    netPnl,
    maxDrawdown: computeMaxDrawdown(trades),
    profitFactor: computeProfitFactor(trades),
    winRate: computeWinRate(trades),
    avgTrade: computeAvgTrade(trades),
    tradeCount: trades.length,
    robustnessScore: robustness,
    consistencyScore: consistency,
    grade: gradeFromScore(composite),
  };
}

// ─── Automatic Insights ──────────────────────────────────────────────────────

export function generateInsights(
  trades: Trade[],
  scorecard: StrategyScorecard,
  failurePatterns: FailurePattern[],
  regimeBreakdown: RegimePerformance[],
): ResearchInsight[] {
  const insights: ResearchInsight[] = [];

  // Strength insights
  if (scorecard.winRate > 55) {
    insights.push({
      id: uid(), category: 'strength',
      title: 'Strong win rate',
      description: `Win rate of ${scorecard.winRate.toFixed(1)}% indicates good signal quality.`,
      confidence: 80, relatedMetric: 'winRate',
    });
  }
  if (scorecard.profitFactor > 1.5) {
    insights.push({
      id: uid(), category: 'strength',
      title: 'Healthy profit factor',
      description: `Profit factor of ${scorecard.profitFactor.toFixed(2)} shows gains outweigh losses significantly.`,
      confidence: 85, relatedMetric: 'profitFactor',
    });
  }

  // Weakness insights
  if (scorecard.maxDrawdown > 15) {
    insights.push({
      id: uid(), category: 'risk',
      title: 'High drawdown risk',
      description: `Max drawdown of ${scorecard.maxDrawdown.toFixed(1)}% may indicate insufficient risk controls.`,
      confidence: 75, relatedMetric: 'maxDrawdown',
    });
  }

  // Regime-based insights
  const bullish = regimeBreakdown.filter(r => r.regime === 'trending_bullish');
  const sideways = regimeBreakdown.filter(r => r.regime === 'sideways');
  const bullishPnl = bullish.reduce((s, r) => s + r.netPnl, 0);
  const sidewaysPnl = sideways.reduce((s, r) => s + r.netPnl, 0);

  if (bullishPnl > 0 && sidewaysPnl < 0) {
    insights.push({
      id: uid(), category: 'weakness',
      title: 'Strategy performs well in trends but fails in sideways markets',
      description: `Bullish PnL: $${bullishPnl.toFixed(2)}, Sideways PnL: $${sidewaysPnl.toFixed(2)}. Consider adding a regime filter to pause during sideways conditions.`,
      confidence: 85, relatedMetric: 'regime',
    });
  }

  // Short trade analysis
  const shorts = trades.filter(t => t.direction === 'short');
  const shortPnl = shorts.reduce((s, t) => s + t.pnl, 0);
  const longPnl = trades.filter(t => t.direction === 'long').reduce((s, t) => s + t.pnl, 0);
  if (shortPnl < 0 && longPnl > 0 && Math.abs(shortPnl) > longPnl * 0.3) {
    insights.push({
      id: uid(), category: 'weakness',
      title: 'Short trades are reducing overall performance',
      description: `Shorts lost $${Math.abs(shortPnl).toFixed(2)} while longs gained $${longPnl.toFixed(2)}. Consider disabling shorts or requiring stronger confirmation.`,
      confidence: 80, relatedMetric: 'direction',
    });
  }

  // Failure-pattern-driven insights
  const clusterPattern = failurePatterns.find(p => p.type === 'stop_loss_cluster');
  if (clusterPattern) {
    insights.push({
      id: uid(), category: 'risk',
      title: 'Drawdowns are driven by clustered losses',
      description: clusterPattern.description + '. ' + clusterPattern.suggestion,
      confidence: 75, relatedMetric: 'drawdown',
    });
  }

  const overFilter = failurePatterns.find(p => p.type === 'over_filtering');
  if (overFilter) {
    insights.push({
      id: uid(), category: 'opportunity',
      title: 'Filters are blocking too many valid trades',
      description: overFilter.description + '. ' + overFilter.suggestion,
      confidence: 70, relatedMetric: 'tradeCount',
    });
  }

  // Consistency insight
  if (scorecard.consistencyScore < 40) {
    insights.push({
      id: uid(), category: 'weakness',
      title: 'Performance is inconsistent across time',
      description: `Consistency score of ${scorecard.consistencyScore.toFixed(0)} indicates large performance swings between periods.`,
      confidence: 70, relatedMetric: 'consistency',
    });
  }

  return insights;
}

// ─── Improvement Suggestions ─────────────────────────────────────────────────

export function generateSuggestions(
  trades: Trade[],
  scorecard: StrategyScorecard,
  failurePatterns: FailurePattern[],
  regimeBreakdown: RegimePerformance[],
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  // Drawdown-driven suggestions
  if (scorecard.maxDrawdown > 15) {
    suggestions.push({
      id: uid(), priority: 'high',
      title: 'Reduce position size',
      description: 'High drawdown suggests over-exposure. Reducing position size can limit tail risk.',
      expectedImpact: 'Reduce max drawdown by 20-40%',
      parameter: 'positionSizePercent',
      currentValue: undefined,
      suggestedValue: undefined,
    });
  }

  // Stop-loss clusters
  if (failurePatterns.some(p => p.type === 'stop_loss_cluster')) {
    suggestions.push({
      id: uid(), priority: 'high',
      title: 'Increase ATR threshold',
      description: 'Clustered stop-losses suggest entries during volatile/choppy markets. Raising the ATR threshold can avoid these.',
      expectedImpact: 'Fewer false entries during high volatility',
      parameter: 'atrThreshold',
    });
  }

  // Excessive flips
  if (failurePatterns.some(p => p.type === 'excessive_flips')) {
    suggestions.push({
      id: uid(), priority: 'medium',
      title: 'Increase cooldown period',
      description: 'Too many flip trades indicate whipsaw vulnerability. A longer cooldown prevents rapid re-entry.',
      expectedImpact: 'Reduce flip trades by 30-50%',
      parameter: 'cooldownCandles',
    });
  }

  // Weak shorts
  if (failurePatterns.some(p => p.type === 'weak_shorts')) {
    suggestions.push({
      id: uid(), priority: 'medium',
      title: 'Disable short trades in certain regimes',
      description: 'Short trades are net negative. Consider disabling shorts during bullish regimes.',
      expectedImpact: 'Improve overall PnL by removing losing short entries',
    });
  }

  // Sideways weakness
  const sideways = regimeBreakdown.filter(r => r.regime === 'sideways');
  const sidewaysPnl = sideways.reduce((s, r) => s + r.netPnl, 0);
  if (sidewaysPnl < 0) {
    suggestions.push({
      id: uid(), priority: 'medium',
      title: 'Increase SMA distance filter',
      description: 'Strategy loses in sideways markets. A stricter SMA distance filter can prevent entries when trend strength is weak.',
      expectedImpact: 'Avoid losses during range-bound conditions',
      parameter: 'minSmaDistancePercent',
    });
  }

  // Over-filtering
  if (failurePatterns.some(p => p.type === 'over_filtering')) {
    suggestions.push({
      id: uid(), priority: 'low',
      title: 'Reduce filter strictness',
      description: 'Too few trades are being taken. Loosening the ATR threshold or disabling the SMA distance filter may allow more valid entries.',
      expectedImpact: 'Increase trade count and opportunity capture',
      parameter: 'atrThreshold',
    });
  }

  return suggestions;
}

// ─── Full Research Report ────────────────────────────────────────────────────

export function generateResearchReport(
  trades: Trade[],
  strategyId: StrategyId,
  asset: Asset | 'all',
  initialBalance: number,
  startPrice?: number,
  endPrice?: number,
  regimePerTrade?: MarketRegime[],
  volatilityPerTrade?: VolatilityLevel[],
): ResearchReport {
  const scorecard = computeScorecard(strategyId, asset, trades);

  const benchmarks: BenchmarkResult[] = [
    computeStrategyBenchmark(trades, initialBalance),
    computeLongOnlySMABenchmark(trades, initialBalance),
    computeLongShortSMABenchmark(trades, initialBalance),
  ];
  if (startPrice && endPrice) {
    benchmarks.push(computeBuyAndHoldBenchmark(startPrice, endPrice, initialBalance));
  }
  benchmarks.push(computeRandomEntryBenchmark(trades));

  const rollingAnalyses = computeRollingAnalysis(trades);

  const regimeBreakdown = (regimePerTrade && volatilityPerTrade)
    ? computeRegimeBreakdown(trades, regimePerTrade, volatilityPerTrade)
    : [];

  const failurePatterns = detectFailurePatterns(trades);

  const insights = generateInsights(trades, scorecard, failurePatterns, regimeBreakdown);
  const suggestions = generateSuggestions(trades, scorecard, failurePatterns, regimeBreakdown);

  const baseline = computeBaselinePerformance('current', trades);

  const overallScore = scorecard.robustnessScore * 0.5 + scorecard.consistencyScore * 0.3
    + (failurePatterns.filter(p => p.severity === 'high').length === 0 ? 20 : 0);

  return {
    generatedAt: Date.now(),
    baseline,
    benchmarks,
    rollingAnalyses,
    regimeBreakdown,
    failurePatterns,
    scorecards: [scorecard],
    insights,
    suggestions,
    overallGrade: gradeFromScore(overallScore),
    readiness: overallScore >= 65 ? 'ready' : overallScore >= 40 ? 'needs_work' : 'not_ready',
  };
}
