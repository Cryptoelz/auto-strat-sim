import {
  Asset,
  Candle,
  TradingState,
  TradingConfig,
  AssetAnalytics,
  Signal,
  Trade,
  MarketRegime,
} from '@/types/trading';
import {
  PortfolioConfig,
  OpportunityScore,
  AllocationDecision,
  PortfolioTradeLog,
  PortfolioState,
  DEFAULT_PORTFOLIO_CONFIG,
} from '@/types/portfolio';

// ─── Opportunity Scoring ─────────────────────────────────────────────

function scoreCrossoverStrength(analytics: AssetAnalytics): number {
  // Based on SMA distance — larger = stronger crossover
  const dist = analytics.smaDistance ?? 0;
  return Math.min(dist * 50, 25); // cap at 25
}

function scoreSmaDistance(analytics: AssetAnalytics): number {
  const dist = analytics.smaDistance ?? 0;
  if (dist >= 1.0) return 20;
  if (dist >= 0.5) return 15;
  if (dist >= 0.2) return 10;
  return 5;
}

function scoreRegime(analytics: AssetAnalytics, signalType: 'BUY' | 'SELL'): number {
  const regime = analytics.marketRegime;
  if (signalType === 'BUY' && regime === 'trending_bullish') return 20;
  if (signalType === 'SELL' && regime === 'trending_bearish') return 20;
  if (regime === 'sideways') return 5;
  return 10; // wrong regime but not blocked
}

function scoreVolatility(analytics: AssetAnalytics): number {
  const atr = analytics.atrPercent ?? 0;
  if (atr >= 2.0) return 20;
  if (atr >= 1.0) return 15;
  if (atr >= 0.5) return 10;
  return 5;
}

function scoreRecentPerformance(trades: Trade[], asset: Asset): number {
  const assetTrades = trades.filter(t => t.asset === asset).slice(-10);
  if (assetTrades.length === 0) return 10; // neutral
  const wins = assetTrades.filter(t => t.type === 'win').length;
  const winRate = wins / assetTrades.length;
  return Math.round(winRate * 15);
}

export function calculateOpportunityScore(
  asset: Asset,
  analytics: AssetAnalytics,
  signal: Signal | null,
  trades: Trade[],
  state: TradingState,
  portfolioConfig: PortfolioConfig,
  currentExposure: Record<Asset, number>,
  totalExposurePercent: number,
  portfolioDrawdown: number,
): OpportunityScore {
  const base: OpportunityScore = {
    asset,
    total: 0,
    crossoverStrength: 0,
    smaDistanceScore: 0,
    regimeScore: 0,
    volatilityScore: 0,
    recentPerformance: 0,
    eligible: false,
    disqualifyReason: null,
  };

  // No actionable signal
  if (!signal || signal.type === 'HOLD') {
    return { ...base, disqualifyReason: 'No actionable signal' };
  }

  // Filter blocked
  if (analytics.filterBlocked) {
    return { ...base, disqualifyReason: `Filter blocked: ${analytics.filterBlocked}` };
  }

  // Portfolio drawdown lock
  if (portfolioDrawdown >= portfolioConfig.maxPortfolioDrawdownPercent) {
    return { ...base, disqualifyReason: 'Portfolio drawdown protection active' };
  }

  // Max exposure
  if (totalExposurePercent >= portfolioConfig.maxPortfolioExposurePercent) {
    return { ...base, disqualifyReason: 'Max portfolio exposure reached' };
  }

  // Per-asset exposure
  const assetExposure = ((currentExposure[asset] || 0) / Math.max(state.balance, 1)) * 100;
  if (assetExposure >= portfolioConfig.maxAssetExposurePercent) {
    return { ...base, disqualifyReason: 'Max asset exposure reached' };
  }

  // Already has position (skip if not flip scenario)
  if (state.positions[asset]) {
    const pos = state.positions[asset]!;
    const isFlip = (signal.type === 'BUY' && pos.direction === 'short') ||
                   (signal.type === 'SELL' && pos.direction === 'long');
    if (!isFlip) {
      return { ...base, disqualifyReason: 'Position already aligned with signal' };
    }
  }

  // Risk paused
  if (state.isPaused) {
    return { ...base, disqualifyReason: 'Risk pause active' };
  }

  const crossoverStrength = scoreCrossoverStrength(analytics);
  const smaDistanceScore = scoreSmaDistance(analytics);
  const regimeScore = scoreRegime(analytics, signal.type);
  const volatilityScore = scoreVolatility(analytics);
  const recentPerformance = scoreRecentPerformance(trades, asset);

  const total = crossoverStrength + smaDistanceScore + regimeScore + volatilityScore + recentPerformance;

  return {
    asset,
    total,
    crossoverStrength,
    smaDistanceScore,
    regimeScore,
    volatilityScore,
    recentPerformance,
    eligible: true,
    disqualifyReason: null,
  };
}

// ─── Allocation Logic ────────────────────────────────────────────────

export function calculateAllocations(
  scores: OpportunityScore[],
  state: TradingState,
  portfolioConfig: PortfolioConfig,
  analytics: Record<Asset, AssetAnalytics>,
): AllocationDecision[] {
  const eligible = scores.filter(s => s.eligible).sort((a, b) => b.total - a.total);

  if (eligible.length === 0) return [];

  // Respect max simultaneous positions
  const currentPositionCount = Object.values(state.positions).filter(p => p !== null).length;
  const slotsAvailable = Math.max(0, portfolioConfig.maxSimultaneousPositions - currentPositionCount);

  // Account for flips (they don't need new slots)
  const candidates = eligible.slice(0, Math.max(slotsAvailable, eligible.length));
  const toAllocate = candidates.filter(s => {
    const pos = state.positions[s.asset];
    if (pos) return true; // flip — doesn't consume a slot
    return slotsAvailable > 0;
  });

  if (toAllocate.length === 0) return [];

  const maxExposure = (portfolioConfig.maxPortfolioExposurePercent / 100) * state.balance;
  const currentExposure = Object.entries(state.positions).reduce((sum, [_, pos]) => {
    return sum + (pos ? pos.size * pos.entryPrice : 0);
  }, 0);
  const availableForAllocation = Math.max(0, maxExposure - currentExposure);

  const decisions: AllocationDecision[] = [];
  const { allocationMode } = portfolioConfig;

  for (const score of toAllocate) {
    let allocPercent = 0;
    let reason = '';

    switch (allocationMode) {
      case 'equal': {
        allocPercent = Math.min(
          portfolioConfig.maxAssetExposurePercent,
          portfolioConfig.maxPortfolioExposurePercent / toAllocate.length,
        );
        reason = `Equal allocation across ${toAllocate.length} eligible asset(s)`;
        break;
      }
      case 'fixed': {
        allocPercent = Math.min(
          portfolioConfig.fixedAllocations[score.asset] || 0,
          portfolioConfig.maxAssetExposurePercent,
        );
        reason = `Fixed allocation of ${portfolioConfig.fixedAllocations[score.asset]}% for ${score.asset}`;
        break;
      }
      case 'signal_weighted': {
        const totalScore = toAllocate.reduce((s, sc) => s + sc.total, 0);
        const weight = totalScore > 0 ? score.total / totalScore : 1 / toAllocate.length;
        allocPercent = Math.min(
          weight * portfolioConfig.maxPortfolioExposurePercent,
          portfolioConfig.maxAssetExposurePercent,
        );
        reason = `Signal-weighted: score ${score.total}/100, weight ${(weight * 100).toFixed(1)}%`;
        break;
      }
      case 'volatility_adjusted': {
        const atr = analytics[score.asset]?.atrPercent ?? 1;
        const inverseVol = 1 / Math.max(atr, 0.1);
        const totalInvVol = toAllocate.reduce((s, sc) => {
          const a = analytics[sc.asset]?.atrPercent ?? 1;
          return s + 1 / Math.max(a, 0.1);
        }, 0);
        const weight = totalInvVol > 0 ? inverseVol / totalInvVol : 1 / toAllocate.length;
        allocPercent = Math.min(
          weight * portfolioConfig.maxPortfolioExposurePercent,
          portfolioConfig.maxAssetExposurePercent,
        );
        reason = `Volatility-adjusted: ATR ${atr.toFixed(2)}%, weight ${(weight * 100).toFixed(1)}%`;
        break;
      }
    }

    const allocAmount = Math.min(
      (allocPercent / 100) * state.balance,
      availableForAllocation / toAllocate.length,
      state.balance,
    );

    // Determine if another asset was skipped
    const skipped = eligible.find(s => !toAllocate.includes(s));

    decisions.push({
      asset: score.asset,
      allocatedPercent: allocPercent,
      allocatedAmount: allocAmount,
      reason,
      score,
      skippedInFavorOf: skipped?.asset ?? null,
    });
  }

  return decisions;
}

// ─── Portfolio State Computation ─────────────────────────────────────

export function computePortfolioState(
  state: TradingState,
  prices: Record<Asset, number | null>,
  analytics: Record<Asset, AssetAnalytics>,
  signals: Record<Asset, Signal | null>,
  enabledAssets: Asset[],
  portfolioConfig: PortfolioConfig,
  prevPeakEquity: number,
  existingLogs: PortfolioTradeLog[],
): PortfolioState {
  // Compute exposure per asset
  const exposureByAsset: Record<Asset, number> = {
    BTCUSDT: 0, XRPUSDT: 0, FETUSDT: 0, XLMUSDT: 0, ETHUSDT: 0, SOLUSDT: 0,
  };
  let portfolioUnrealizedPnl = 0;
  let allocatedCapital = 0;

  for (const asset of enabledAssets) {
    const pos = state.positions[asset];
    const price = prices[asset];
    if (pos && price) {
      const value = pos.size * price;
      exposureByAsset[asset] = value;
      allocatedCapital += pos.size * pos.entryPrice;
      const uPnl = pos.direction === 'long'
        ? (price - pos.entryPrice) * pos.size
        : (pos.entryPrice - pos.entryPrice) * pos.size;
      portfolioUnrealizedPnl += (pos.direction === 'long'
        ? (price - pos.entryPrice) * pos.size
        : (pos.entryPrice - price) * pos.size);
    }
  }

  const totalEquity = state.balance + portfolioUnrealizedPnl + allocatedCapital;
  const cashAvailable = state.balance;
  const portfolioRealizedPnl = state.trades.reduce((s, t) => s + t.pnl, 0);
  const peakEquity = Math.max(prevPeakEquity, totalEquity);
  const portfolioDrawdown = peakEquity > 0
    ? ((peakEquity - totalEquity) / peakEquity) * 100
    : 0;

  const totalExposurePercent = totalEquity > 0
    ? (allocatedCapital / totalEquity) * 100
    : 0;

  // Score each asset
  const scores: OpportunityScore[] = enabledAssets.map(asset =>
    calculateOpportunityScore(
      asset,
      analytics[asset],
      signals[asset],
      state.trades,
      state,
      portfolioConfig,
      exposureByAsset,
      totalExposurePercent,
      portfolioDrawdown,
    ),
  );

  // Compute allocation decisions
  const decisions = calculateAllocations(scores, state, portfolioConfig, analytics);

  const drawdownPaused = portfolioDrawdown >= portfolioConfig.maxPortfolioDrawdownPercent;
  const drawdownPauseReason = drawdownPaused
    ? `Portfolio drawdown of ${portfolioDrawdown.toFixed(1)}% exceeds limit of ${portfolioConfig.maxPortfolioDrawdownPercent}%`
    : null;

  return {
    totalEquity,
    cashAvailable,
    allocatedCapital,
    exposureByAsset,
    portfolioRealizedPnl,
    portfolioUnrealizedPnl,
    portfolioDrawdown,
    peakEquity,
    activeAllocationMode: portfolioConfig.allocationMode,
    scores,
    decisions,
    tradeLogs: existingLogs,
    drawdownPaused,
    drawdownPauseReason,
  };
}

// ─── Explainability ──────────────────────────────────────────────────

export function explainAllocationDecision(decision: AllocationDecision): string {
  const { asset, score, allocatedPercent, skippedInFavorOf, reason } = decision;
  let explanation = `${asset} received ${allocatedPercent.toFixed(1)}% allocation. ${reason}.`;

  if (score.total >= 70) {
    explanation += ` Strong opportunity (score: ${score.total}/100).`;
  } else if (score.total >= 40) {
    explanation += ` Moderate opportunity (score: ${score.total}/100).`;
  } else {
    explanation += ` Weak opportunity (score: ${score.total}/100).`;
  }

  if (skippedInFavorOf) {
    explanation += ` ${skippedInFavorOf} was skipped in favor of this asset.`;
  }

  return explanation;
}

export function explainNoTrade(scores: OpportunityScore[]): string {
  if (scores.length === 0) return 'No assets available for evaluation.';

  const reasons = scores
    .filter(s => !s.eligible && s.disqualifyReason)
    .map(s => `${s.asset}: ${s.disqualifyReason}`);

  if (reasons.length > 0) {
    return `No assets traded. ${reasons.join('. ')}.`;
  }

  return 'No assets met the criteria for capital allocation.';
}

export function createPortfolioTradeLog(
  asset: Asset,
  decision: AllocationDecision | null,
  action: PortfolioTradeLog['action'],
  side: 'long' | 'short' | null,
  pnl: number | null,
  skippedAsset: Asset | null,
  explanation: string,
): PortfolioTradeLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    asset,
    score: decision?.score.total ?? 0,
    allocationAmount: decision?.allocatedAmount ?? 0,
    allocationReason: decision?.reason ?? 'N/A',
    positionSide: side,
    action,
    pnl,
    skippedAsset,
    explanation,
  };
}
