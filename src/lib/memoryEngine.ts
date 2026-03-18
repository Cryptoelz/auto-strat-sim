import {
  Asset, MarketRegime, Trade, TradingState, AssetAnalytics,
} from '@/types/trading';
import { StrategyId } from '@/types/strategy';
import {
  MemoryConfig, DEFAULT_MEMORY_CONFIG, MarketCondition, CautionLevel,
  MarketMemory, StrategyMemoryEntry, RiskMemory, DecisionMemoryEntry,
  PortfolioMemory, AdaptationOutput, AdaptationAuditEntry, AgentMemoryState,
} from '@/types/memory';
import { ASSET_INFO } from '@/config/trading';
import { getStrategyDefinition } from './strategyEngine';

const STRATEGY_IDS: StrategyId[] = ['sma_crossover', 'ema_crossover', 'rsi_trend'];

// ─── Market Memory ──────────────────────────────────────────────────

function buildMarketMemory(
  analytics: Record<Asset, AssetAnalytics>,
  enabledAssets: Asset[],
  config: MemoryConfig,
): MarketMemory {
  const regimes: MarketRegime[] = enabledAssets.map(a => analytics[a]?.marketRegime ?? 'sideways');
  
  // Dominant regime by frequency
  const counts: Record<MarketRegime, number> = { trending_bullish: 0, trending_bearish: 0, sideways: 0 };
  regimes.forEach(r => counts[r]++);
  const dominantRegime = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'sideways') as MarketRegime;
  
  const maxCount = Math.max(...Object.values(counts));
  const regimeStability = regimes.length > 0 ? (maxCount / regimes.length) * 100 : 50;

  // Volatility
  const atrs = enabledAssets.map(a => analytics[a]?.atrPercent ?? 0).filter(v => v > 0);
  const avgVolatility = atrs.length > 0 ? atrs.reduce((s, v) => s + v, 0) / atrs.length : 0;

  // Determine conditions
  const conditions: MarketCondition[] = [];
  if (dominantRegime !== 'sideways' && regimeStability > 60) conditions.push('trend_friendly');
  if (dominantRegime === 'sideways' || regimeStability < 40) conditions.push('choppy');
  if (avgVolatility < 0.5) conditions.push('low_volatility');
  if (avgVolatility > 2.0) conditions.push('high_volatility');
  if (conditions.length === 0) conditions.push('trend_friendly');

  return {
    recentRegimes: regimes,
    dominantRegime,
    regimeStability,
    recentConditions: conditions,
    dominantCondition: conditions[0],
    avgVolatility,
    volatilityTrend: avgVolatility > 1.5 ? 'rising' : avgVolatility < 0.5 ? 'falling' : 'stable',
  };
}

// ─── Strategy Memory ─────────────────────────────────────────────────

function buildStrategyMemory(
  trades: Trade[],
  analytics: Record<Asset, AssetAnalytics>,
  enabledAssets: Asset[],
  prevStrategies: StrategyMemoryEntry[],
  config: MemoryConfig,
): StrategyMemoryEntry[] {
  const entries: StrategyMemoryEntry[] = [];

  for (const asset of enabledAssets) {
    const assetTrades = trades.filter(t => t.asset === asset);

    for (const stratId of STRATEGY_IDS) {
      const window = assetTrades.slice(-config.memoryTradeWindow);
      const wins = window.filter(t => t.type === 'win').length;
      const winRate = window.length > 0 ? (wins / window.length) * 100 : 50;
      const netPnl = window.reduce((s, t) => s + t.pnl, 0);
      const grossProfit = window.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
      const grossLoss = Math.abs(window.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

      let peak = 0, maxDD = 0, running = 0;
      for (const t of window) {
        running += t.pnl;
        if (running > peak) peak = running;
        const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
        if (dd > maxDD) maxDD = dd;
      }

      // Regime fit: does the dominant regime match what this strategy prefers?
      const regime = analytics[asset]?.marketRegime ?? 'sideways';
      let regimeFit = 50;
      if (stratId === 'sma_crossover' || stratId === 'ema_crossover') {
        regimeFit = regime !== 'sideways' ? 80 : 30;
      } else if (stratId === 'rsi_trend') {
        regimeFit = regime === 'sideways' ? 60 : 70;
      }

      // False signal rate proxy: losses / total
      const falseSignalRate = window.length > 0 ? ((window.length - wins) / window.length) * 100 : 0;
      const blockedCount = 0; // Would need decision log integration

      // Confidence: start from prior or 50, then adjust
      const prev = prevStrategies.find(s => s.strategyId === stratId && s.asset === asset);
      let priorConfidence = prev?.confidence ?? 50;
      let confidence = priorConfidence;

      if (config.adaptationEnabled && window.length >= 3) {
        // Gradual adjustment based on recent performance
        const perfDelta = (winRate - 50) * adaptenceStrengthSafe(config);
        const pnlSignal = netPnl > 0 ? 2 : netPnl < -50 ? -4 : -1;
        const regimeBonus = regimeFit > 60 ? 2 : -2;
        
        const rawAdjust = (perfDelta + pnlSignal + regimeBonus) * config.confidenceDecayRate;
        const clampedAdjust = Math.max(-config.maxConfidenceAdjustment, Math.min(config.maxConfidenceAdjustment, rawAdjust));
        confidence = Math.max(10, Math.min(95, priorConfidence + clampedAdjust));
      }

      const isOnCooldown = window.length >= 5 && winRate < 30 && netPnl < 0;

      entries.push({
        strategyId: stratId, asset, confidence, priorConfidence,
        recentWinRate: winRate, recentPnl: netPnl,
        recentProfitFactor: profitFactor, recentDrawdown: maxDD,
        regimeFit, falseSignalRate, blockedCount, isOnCooldown,
      });
    }
  }

  return entries;
}

// Helper to safely get adaptation strength
function adaptenceStrengthSafe(config: MemoryConfig): number {
  const modeMultiplier = config.adaptationMode === 'conservative' ? 0.3
    : config.adaptationMode === 'aggressive' ? 1.0
    : 0.6;
  return config.adaptationStrength * modeMultiplier;
}

// Helper to safely get adaptation strength
function adaptenceStrengthSafe(config: MemoryConfig): number {

function buildRiskMemory(
  state: TradingState,
  trades: Trade[],
  portfolioDrawdown: number,
  config: MemoryConfig,
): RiskMemory {
  const recent = trades.slice(-config.memoryTradeWindow);
  
  // Count consecutive losses from end
  let consecutiveLosses = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].type === 'loss') consecutiveLosses++;
    else break;
  }

  const stopLossExits = recent.filter(t => t.exitReason === 'stop_loss').length;
  
  // Equity curve volatility (std dev of pnl changes)
  const pnls = recent.map(t => t.pnl);
  const avgPnl = pnls.length > 0 ? pnls.reduce((s, v) => s + v, 0) / pnls.length : 0;
  const variance = pnls.length > 1
    ? pnls.reduce((s, v) => s + (v - avgPnl) ** 2, 0) / (pnls.length - 1)
    : 0;
  const equityCurveVolatility = Math.sqrt(variance);

  const blockedEntries = 0; // Would come from decision log

  // Stress level
  let stressLevel: CautionLevel = 'low';
  if (consecutiveLosses >= config.lossStreakCautionThreshold * 2 || portfolioDrawdown >= config.drawdownCautionThreshold * 2) {
    stressLevel = 'extreme';
  } else if (consecutiveLosses >= config.lossStreakCautionThreshold || portfolioDrawdown >= config.drawdownCautionThreshold) {
    stressLevel = 'high';
  } else if (consecutiveLosses >= 2 || portfolioDrawdown >= config.drawdownCautionThreshold * 0.5) {
    stressLevel = 'moderate';
  }

  return {
    consecutiveLosses,
    recentStopLossCount: stopLossExits,
    currentDrawdownPercent: portfolioDrawdown,
    peakDrawdownPercent: portfolioDrawdown, // simplified
    repeatedBlockedEntries: blockedEntries,
    equityCurveVolatility,
    stressLevel,
  };
}

// ─── Decision Memory ─────────────────────────────────────────────────

function buildDecisionMemory(
  prevDecisions: DecisionMemoryEntry[],
): DecisionMemoryEntry[] {
  // Keep last 50 entries
  return prevDecisions.slice(-50);
}

export function addNoTradeMemory(
  decisions: DecisionMemoryEntry[],
  asset: Asset,
  reason: string,
  category: DecisionMemoryEntry['category'],
): DecisionMemoryEntry[] {
  return [...decisions, {
    timestamp: Date.now(),
    asset, reason, category,
  }].slice(-50);
}

// ─── Portfolio Memory ────────────────────────────────────────────────

function buildPortfolioMemory(
  trades: Trade[],
  enabledAssets: Asset[],
  config: MemoryConfig,
): PortfolioMemory {
  const recent = trades.slice(-config.memoryTradeWindowLarge);
  const equityChanges = recent.map(t => t.pnl);
  const avgReturn = equityChanges.length > 0
    ? equityChanges.reduce((s, v) => s + v, 0) / equityChanges.length
    : 0;

  const allocationBias: Record<Asset, number> = {} as any;
  for (const asset of enabledAssets) {
    const assetTrades = recent.filter(t => t.asset === asset);
    const assetPnl = assetTrades.reduce((s, t) => s + t.pnl, 0);
    // Bias: positive = prefer, negative = reduce
    allocationBias[asset] = assetTrades.length > 0
      ? Math.max(-1, Math.min(1, assetPnl / (Math.abs(assetPnl) + 100)))
      : 0;
  }

  return {
    recentAllocations: [],
    allocationBias,
    recentEquityChanges: equityChanges,
    avgRecentReturn: avgReturn,
  };
}

// ─── Adaptation Engine ───────────────────────────────────────────────

function computeAdaptation(
  market: MarketMemory,
  strategies: StrategyMemoryEntry[],
  risk: RiskMemory,
  portfolio: PortfolioMemory,
  config: MemoryConfig,
): AdaptationOutput {
  if (!config.adaptationEnabled) {
    return {
      confidenceByAssetStrategy: strategies,
      cautionLevel: 'low',
      allocationBias: portfolio.allocationBias,
      marketSummary: 'Adaptation is disabled.',
      riskPressure: risk.stressLevel,
      isAdaptationActive: false,
      positionSizeMultiplier: 1.0,
      tradeFrequencyMultiplier: 1.0,
    };
  }

  const modeStrength = adaptenceStrengthSafe(config);

  // Caution level: combine risk stress + market choppiness
  let cautionScore = 0;
  if (risk.stressLevel === 'extreme') cautionScore += 3;
  else if (risk.stressLevel === 'high') cautionScore += 2;
  else if (risk.stressLevel === 'moderate') cautionScore += 1;

  if (market.dominantCondition === 'choppy') cautionScore += 1;
  if (market.dominantCondition === 'low_volatility') cautionScore += 1;
  if (market.regimeStability < 40) cautionScore += 1;

  const cautionLevel: CautionLevel =
    cautionScore >= 4 ? 'extreme' :
    cautionScore >= 3 ? 'high' :
    cautionScore >= 2 ? 'moderate' : 'low';

  // Position size multiplier
  let positionSizeMultiplier = 1.0;
  if (cautionLevel === 'extreme') positionSizeMultiplier = 0.5;
  else if (cautionLevel === 'high') positionSizeMultiplier = 0.7;
  else if (cautionLevel === 'moderate') positionSizeMultiplier = 0.85;

  // Interpolate with mode strength
  positionSizeMultiplier = 1.0 - (1.0 - positionSizeMultiplier) * modeStrength;

  // Trade frequency multiplier
  let tradeFrequencyMultiplier = 1.0;
  if (cautionLevel === 'extreme') tradeFrequencyMultiplier = 0.5;
  else if (cautionLevel === 'high') tradeFrequencyMultiplier = 0.7;

  tradeFrequencyMultiplier = 1.0 - (1.0 - tradeFrequencyMultiplier) * modeStrength;

  // Market summary
  const parts: string[] = [];
  parts.push(`Market is ${market.dominantCondition.replace('_', ' ')} with ${market.volatilityTrend} volatility.`);
  if (market.regimeStability > 70) parts.push('Regime is stable.');
  else if (market.regimeStability < 40) parts.push('Regime is unstable — mixed signals across assets.');
  if (risk.consecutiveLosses >= config.lossStreakCautionThreshold) {
    parts.push(`${risk.consecutiveLosses} consecutive losses detected.`);
  }
  if (cautionLevel !== 'low') {
    parts.push(`Caution level: ${cautionLevel}.`);
  }

  return {
    confidenceByAssetStrategy: strategies,
    cautionLevel,
    allocationBias: portfolio.allocationBias,
    marketSummary: parts.join(' '),
    riskPressure: risk.stressLevel,
    isAdaptationActive: true,
    positionSizeMultiplier,
    tradeFrequencyMultiplier,
  };
}

// ─── Audit Log Generation ────────────────────────────────────────────

function generateAuditEntries(
  strategies: StrategyMemoryEntry[],
  market: MarketMemory,
  risk: RiskMemory,
  adaptation: AdaptationOutput,
): AdaptationAuditEntry[] {
  return strategies
    .filter(s => Math.abs(s.confidence - s.priorConfidence) > 0.5)
    .map(s => {
      const factors: string[] = [];
      if (s.recentWinRate < 40) factors.push('low win rate');
      if (s.recentWinRate > 60) factors.push('strong win rate');
      if (s.recentPnl < 0) factors.push('negative recent PnL');
      if (s.recentPnl > 0) factors.push('positive recent PnL');
      if (s.regimeFit > 70) factors.push('good regime fit');
      if (s.regimeFit < 40) factors.push('poor regime fit');
      if (market.dominantCondition === 'choppy') factors.push('choppy market');
      if (risk.stressLevel !== 'low') factors.push(`${risk.stressLevel} risk stress`);

      const delta = s.confidence - s.priorConfidence;
      const symbol = ASSET_INFO[s.asset]?.symbol ?? s.asset;
      const stratName = getStrategyDefinition(s.strategyId).name;

      return {
        id: `${Date.now()}-${s.asset}-${s.strategyId}`,
        timestamp: Date.now(),
        asset: s.asset,
        strategyId: s.strategyId,
        priorConfidence: s.priorConfidence,
        updatedConfidence: s.confidence,
        memoryFactors: factors,
        cautionAdjustment: adaptation.cautionLevel !== 'low'
          ? `Caution ${adaptation.cautionLevel}: position size ×${adaptation.positionSizeMultiplier.toFixed(2)}`
          : 'No caution adjustment',
        allocationAdjustment: adaptation.allocationBias[s.asset] !== 0
          ? `Allocation bias: ${adaptation.allocationBias[s.asset] > 0 ? 'prefer' : 'reduce'} (${(adaptation.allocationBias[s.asset] * 100).toFixed(0)}%)`
          : 'Neutral allocation',
        explanation: `${symbol} ${stratName} confidence ${delta >= 0 ? 'raised' : 'lowered'} from ${s.priorConfidence.toFixed(0)} to ${s.confidence.toFixed(0)} due to ${factors.join(', ') || 'gradual decay'}.`,
      };
    });
}

// ─── Main Entry Point ────────────────────────────────────────────────

export function computeAgentMemory(
  state: TradingState,
  analytics: Record<Asset, AssetAnalytics>,
  enabledAssets: Asset[],
  portfolioDrawdown: number,
  config: MemoryConfig,
  prevState?: AgentMemoryState | null,
): AgentMemoryState {
  const market = buildMarketMemory(analytics, enabledAssets, config);
  const strategies = buildStrategyMemory(
    state.trades, analytics, enabledAssets,
    prevState?.strategies ?? [], config,
  );
  const risk = buildRiskMemory(state, state.trades, portfolioDrawdown, config);
  const decisions = buildDecisionMemory(prevState?.decisions ?? []);
  const portfolio = buildPortfolioMemory(state.trades, enabledAssets, config);
  const adaptation = computeAdaptation(market, strategies, risk, portfolio, config);
  const newAuditEntries = generateAuditEntries(strategies, market, risk, adaptation);

  // Merge audit log, keep last 100
  const auditLog = [
    ...newAuditEntries,
    ...(prevState?.auditLog ?? []),
  ].slice(0, 100);

  return {
    market, strategies, risk, decisions, portfolio,
    adaptation, auditLog, config,
    lastUpdated: Date.now(),
  };
}

// ─── Explainability ──────────────────────────────────────────────────

export function explainAdaptation(state: AgentMemoryState): string {
  const { adaptation, risk, market } = state;
  const parts: string[] = [];

  if (!adaptation.isAdaptationActive) {
    return 'Memory and adaptation are currently disabled.';
  }

  parts.push(adaptation.marketSummary);

  if (adaptation.cautionLevel !== 'low') {
    parts.push(`Position sizing reduced to ${(adaptation.positionSizeMultiplier * 100).toFixed(0)}% of normal.`);
  }

  const underperformers = adaptation.confidenceByAssetStrategy.filter(s => s.confidence < 40);
  if (underperformers.length > 0) {
    const names = underperformers.map(s =>
      `${ASSET_INFO[s.asset]?.symbol}/${getStrategyDefinition(s.strategyId).name} (${s.confidence.toFixed(0)})`
    );
    parts.push(`Low confidence: ${names.join(', ')}.`);
  }

  const onCooldown = adaptation.confidenceByAssetStrategy.filter(s => s.isOnCooldown);
  if (onCooldown.length > 0) {
    parts.push(`${onCooldown.length} strategy/asset pair(s) on cooldown.`);
  }

  return parts.join(' ');
}
