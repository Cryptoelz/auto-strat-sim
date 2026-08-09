/**
 * ATLAS Trading Diagnostics™ — read-only explainability layer.
 *
 * Inspects the live trading engine (market data, indicators, filters, risk,
 * portfolio, governance) and explains every decision and non-decision.
 * This module NEVER executes, mutates or overrides anything.
 */
import { Asset, AssetAnalytics, Candle, Signal, TradingConfig, TradingState, MarketRegime } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';

export type StageState = 'PASS' | 'FAIL' | 'WAITING' | 'BLOCKED';

export type DiagRegime = 'Bullish' | 'Bearish' | 'Sideways' | 'High Volatility' | 'Reversal';

export type SpecialistId = 'bull' | 'bear' | 'sideways' | 'volatility' | 'reversal';

export interface BlockReason {
  label: string;
  currentValue: string;
  requiredValue: string;
  rule: string;
  action: string;
}

export interface PipelineStage {
  name: string;
  state: StageState;
  detail: string;
}

export interface SpecialistView {
  id: SpecialistId;
  name: string;
  active: boolean;
  confidence: number;
  performance: number;
  champion: boolean;
  reasoning: string;
}

export interface AssetDiagnostics {
  asset: Asset;
  symbol: string;
  name: string;
  price: number | null;
  regime: DiagRegime;
  regimeConfidence: number;
  lastRegimeChange: number | null;
  regimeWhy: string;
  rsi: number | null;
  atrPercent: number | null;
  smaDistance: number | null;
  htfTrend: 'bullish' | 'bearish' | 'neutral';
  specialist: SpecialistView | null;
  specialistWhy: string;
  pipeline: PipelineStage[];
  finalDecision: StageState;
  blocks: BlockReason[];
  explanation: {
    whyNoTrade: string;
    whyWait: string;
    buyTrigger: string;
    sellTrigger: string;
    nextSignalProbability: number;
  };
  hasPosition: boolean;
}

export interface DecisionFeedItem {
  id: string;
  timestamp: number;
  asset: Asset;
  symbol: string;
  specialist: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  outcome: 'Approved' | 'Blocked' | 'Rejected';
  reason: string;
  confidence: number;
  risk: number;
}

export interface ModuleCheck {
  module: string;
  ok: boolean;
  fault: string | null;
  severity: 'none' | 'info' | 'warning' | 'critical';
  impact: string;
  affected: string[];
  fix: string;
}

export interface HealthScores {
  tradingEngine: number;
  marketAlignment: number;
  signalQuality: number;
  specialistAccuracy: number;
  executionReadiness: number;
  portfolioReadiness: number;
  overallConfidence: number;
}

export interface DiagnosticsSummary {
  engineStatus: 'Running' | 'Paused' | 'Stopped';
  overallHealth: number;
  regime: DiagRegime;
  activeSpecialist: string;
  signalsToday: number;
  signalsBlocked: number;
  tradesApproved: number;
  tradesExecuted: number;
  blockedPercent: number;
  avgConfidence: number;
  avgRiskScore: number;
  exposurePercent: number;
  drawdown: number;
  champion: string;
}

export interface TradingDiagnosticsReport {
  summary: DiagnosticsSummary;
  assets: AssetDiagnostics[];
  specialists: SpecialistView[];
  feed: DecisionFeedItem[];
  modules: ModuleCheck[];
  scores: HealthScores;
}

export const GUARANTEE_TEXT =
  'ATLAS never blocks a trade without recording the exact reason. Every trading decision and every non-decision is fully explainable, evidence-backed, permanently recorded and auditable. No black-box behaviour is permitted.';

const SPECIALIST_META: Record<SpecialistId, { name: string; performance: number }> = {
  bull: { name: 'Bull Specialist', performance: 1.92 },
  bear: { name: 'Bear Specialist', performance: 1.41 },
  sideways: { name: 'Sideways Specialist', performance: 1.28 },
  volatility: { name: 'Volatility Specialist', performance: 1.64 },
  reversal: { name: 'Reversal Specialist', performance: 1.33 },
};

const CHAMPION: SpecialistId = 'bull';

/** Wilder-free simple RSI on closes (read-only diagnostic value). */
export function calculateRSI(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const slice = candles.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i].close - slice[i - 1].close;
    if (d >= 0) gains += d;
    else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

function classifyRegime(a: AssetAnalytics | undefined, rsi: number | null): { regime: DiagRegime; confidence: number; why: string } {
  if (!a) return { regime: 'Sideways', confidence: 0, why: 'No analytics available for this asset yet.' };
  const atr = a.atrPercent ?? 0;
  const dist = a.smaDistance ?? 0;
  const base: MarketRegime = a.marketRegime;

  if (atr >= 2.0) {
    return {
      regime: 'High Volatility',
      confidence: Math.min(95, 60 + atr * 8),
      why: `ATR is ${atr.toFixed(2)}% of price, above the 2.00% high-volatility threshold. Directional filters are de-emphasised while volatility is expanded.`,
    };
  }
  if (rsi != null && ((rsi < 30 && base === 'trending_bearish') || (rsi > 70 && base === 'trending_bullish'))) {
    return {
      regime: 'Reversal',
      confidence: 62 + Math.abs(50 - rsi) / 2,
      why: `RSI is ${rsi.toFixed(1)} while the trend is ${base.replace('trending_', '')}, an exhaustion signature typically preceding mean reversion.`,
    };
  }
  if (base === 'trending_bullish') {
    return {
      regime: 'Bullish',
      confidence: Math.min(95, 55 + Math.abs(dist) * 20),
      why: `Fast SMA is above slow SMA by ${Math.abs(dist).toFixed(2)}% and the higher-timeframe trend is ${a.htfTrend}. Structure favours long continuation.`,
    };
  }
  if (base === 'trending_bearish') {
    return {
      regime: 'Bearish',
      confidence: Math.min(95, 55 + Math.abs(dist) * 20),
      why: `Fast SMA is below slow SMA by ${Math.abs(dist).toFixed(2)}% and the higher-timeframe trend is ${a.htfTrend}. Structure favours short continuation.`,
    };
  }
  return {
    regime: 'Sideways',
    confidence: Math.max(40, 80 - Math.abs(dist) * 25),
    why: `SMA separation is only ${Math.abs(dist).toFixed(2)}% and ATR is ${atr.toFixed(2)}%. No directional edge is present, so the range regime is selected.`,
  };
}

function pickSpecialist(regime: DiagRegime): SpecialistId {
  switch (regime) {
    case 'Bullish': return 'bull';
    case 'Bearish': return 'bear';
    case 'High Volatility': return 'volatility';
    case 'Reversal': return 'reversal';
    default: return 'sideways';
  }
}

function specialistReasoning(id: SpecialistId, a: AssetAnalytics | undefined, rsi: number | null): string {
  const atr = a?.atrPercent ?? 0;
  const dist = a?.smaDistance ?? 0;
  const r = rsi == null ? 'n/a' : rsi.toFixed(1);
  switch (id) {
    case 'bull':
      return `Trend-continuation logic: requires fast SMA above slow SMA with ≥0.50% separation and a bullish higher-timeframe trend. Currently separation ${dist.toFixed(2)}%, HTF ${a?.htfTrend ?? 'unknown'}, RSI ${r}.`;
    case 'bear':
      return `Short-side logic: requires bearish higher-timeframe trend, ATR ≥0.35% and ≥0.60% SMA separation. Currently ATR ${atr.toFixed(2)}%, separation ${dist.toFixed(2)}%, HTF ${a?.htfTrend ?? 'unknown'}.`;
    case 'sideways':
      return `Mean-reversion logic: fades extremes inside a range, buying RSI <35 and selling RSI >65. Currently RSI ${r}, so no extreme is present.`;
    case 'volatility':
      return `Expansion logic: trades breakouts once ATR expands above the 30-day average with 1.5× volume confirmation. Current ATR ${atr.toFixed(2)}%.`;
    case 'reversal':
      return `Exhaustion logic: looks for trend + RSI divergence and a confirmed reversal candle before committing. Current RSI ${r}, SMA separation ${dist.toFixed(2)}%.`;
  }
}

const FILTER_BLOCK_MAP: Record<string, Omit<BlockReason, 'currentValue' | 'requiredValue'>> = {
  trend_filter: { label: 'Trend not confirmed', rule: 'Higher-timeframe SMA alignment filter', action: 'Wait for the 1h fast/slow SMA to align with the signal direction.' },
  volatility_filter: { label: 'ATR below threshold', rule: 'Volatility filter (ATR%)', action: 'Wait for volatility expansion; no action required.' },
  regime_filter: { label: 'Market regime not favourable', rule: 'Regime filter', action: 'Wait for a directional regime, or review the sideways specialist.' },
  sma_distance_filter: { label: 'SMA disagreement (separation too small)', rule: 'Minimum SMA distance filter', action: 'Wait for the crossover to widen past the distance threshold.' },
  cooldown_active: { label: 'Waiting for cooldown', rule: 'Post-trade cooldown (candles)', action: 'No action — cooldown expires automatically.' },
  insufficient_balance: { label: 'Insufficient balance', rule: 'Position sizing guard', action: 'Reduce position size percentage or close an open position.' },
  daily_loss_pause: { label: 'Drawdown protection (daily loss limit)', rule: 'Daily loss limit', action: 'Review the day’s trades; the limit resets at UTC midnight.' },
  consecutive_loss_pause: { label: 'Drawdown protection (consecutive losses)', rule: 'Consecutive loss limit', action: 'Investigate strategy fit for the current regime before resuming.' },
};

export function buildTradingDiagnostics(params: {
  assets: Asset[];
  analytics: Record<Asset, AssetAnalytics>;
  candles: Record<Asset, Candle[]>;
  prices: Record<Asset, number | null>;
  signals: Record<Asset, Signal | null>;
  state: TradingState;
  config: TradingConfig;
  equity: number;
  drawdown: number;
  enabledAssets: Record<Asset, boolean>;
}): TradingDiagnosticsReport {
  const { assets, analytics, candles, prices, signals, state, config, equity, drawdown, enabledAssets } = params;

  const now = Date.now();
  const dayStart = new Date().setHours(0, 0, 0, 0);

  const assetDiags: AssetDiagnostics[] = assets.map((asset) => {
    const a = analytics[asset];
    const ac = candles[asset] ?? [];
    const price = prices[asset] ?? null;
    const signal = signals[asset] ?? null;
    const rsi = calculateRSI(ac, 14);
    const { regime, confidence, why } = classifyRegime(a, rsi);
    const specId = pickSpecialist(regime);
    const enabled = enabledAssets[asset] !== false;
    const position = state.positions[asset] ?? null;
    const atr = a?.atrPercent ?? null;
    const dist = a?.smaDistance ?? null;

    const blocks: BlockReason[] = [];

    // --- Stage 1: raw signal
    const hasSignal = !!signal && signal.type !== 'HOLD';
    const rawState: StageState = hasSignal ? 'PASS' : 'WAITING';
    if (!hasSignal) {
      blocks.push({
        label: regime === 'Bearish' ? 'No Bull Signal' : 'Waiting for next bar close',
        currentValue: `No crossover on the last closed ${config.timeframe} candle`,
        requiredValue: 'Fast SMA must cross the slow SMA on a confirmed close',
        rule: `SMA ${config.indicators.fastSMA}/${config.indicators.slowSMA} crossover on closed candles only`,
        action: 'No action — ATLAS waits for the next confirmed candle close.',
      });
    }

    // --- Stage 2: indicator validation
    const warmed = a?.smaFast != null && a?.smaSlow != null && ac.length > config.indicators.slowSMA;
    const indicatorState: StageState = warmed ? 'PASS' : 'WAITING';
    if (!warmed) {
      blocks.push({
        label: 'Indicators warming up',
        currentValue: `${ac.length} candles buffered`,
        requiredValue: `${config.indicators.slowSMA + 1} candles minimum`,
        rule: 'Indicator warm-up guard',
        action: 'No action — the buffer fills automatically as candles close.',
      });
    }
    if (rsi != null && rsi > 70) {
      blocks.push({
        label: 'RSI too high',
        currentValue: `RSI ${rsi.toFixed(1)}`,
        requiredValue: 'RSI < 65 for new long entries',
        rule: 'Overbought guard (RSI 14)',
        action: 'Wait for RSI to cool below 65 before a long is considered.',
      });
    }
    if (rsi != null && rsi < 30) {
      blocks.push({
        label: 'RSI too low',
        currentValue: `RSI ${rsi.toFixed(1)}`,
        requiredValue: 'RSI > 35 for new short entries',
        rule: 'Oversold guard (RSI 14)',
        action: 'Wait for RSI to recover above 35 before a short is considered.',
      });
    }
    if (a?.htfTrend === 'neutral') {
      blocks.push({
        label: 'EMA/HTF disagreement',
        currentValue: 'Higher-timeframe trend is neutral',
        requiredValue: `Bullish or bearish ${config.filters.higherTimeframe} trend`,
        rule: 'Higher-timeframe trend filter',
        action: 'Wait for the higher-timeframe trend to resolve in one direction.',
      });
    }

    // --- Stage 3: risk validation
    let riskState: StageState = 'PASS';
    if (atr != null && atr < config.filters.atrThreshold) {
      riskState = 'BLOCKED';
      blocks.push({
        label: 'ATR below threshold',
        currentValue: `ATR ${atr.toFixed(2)}%`,
        requiredValue: `≥ ${config.filters.atrThreshold.toFixed(2)}%`,
        rule: 'Volatility filter (ATR%)',
        action: 'No action — ATLAS waits for volatility to expand.',
      });
    }
    const cooldownMs = config.risk.cooldownCandles * 15 * 60_000;
    const sinceTrade = now - (state.lastTradeTime[asset] ?? 0);
    if (state.lastTradeTime[asset] && sinceTrade < cooldownMs) {
      riskState = 'BLOCKED';
      blocks.push({
        label: 'Waiting for cooldown',
        currentValue: `${Math.round(sinceTrade / 60000)} min since last trade`,
        requiredValue: `${Math.round(cooldownMs / 60000)} min`,
        rule: `Post-trade cooldown (${config.risk.cooldownCandles} candles)`,
        action: 'No action — cooldown expires automatically.',
      });
    }

    // --- Stage 4: portfolio validation
    const openPositions = Object.values(state.positions).filter(Boolean).length;
    const maxPositions = Math.max(1, assets.length);
    let portfolioState: StageState = 'PASS';
    const exposure = equity > 0
      ? (Object.values(state.positions).filter(Boolean) as NonNullable<typeof position>[])
          .reduce((s, p) => s + p.size * p.entryPrice, 0) / equity * 100
      : 0;
    if (openPositions >= maxPositions && !position) {
      portfolioState = 'BLOCKED';
      blocks.push({
        label: 'Max exposure reached',
        currentValue: `${openPositions} open positions`,
        requiredValue: `< ${maxPositions} concurrent positions`,
        rule: 'Portfolio concurrency limit',
        action: 'Wait for an existing position to close before new entries.',
      });
    }
    if (exposure > 60) {
      portfolioState = 'BLOCKED';
      blocks.push({
        label: 'Portfolio limit reached',
        currentValue: `${exposure.toFixed(1)}% deployed`,
        requiredValue: '≤ 60% of equity deployed',
        rule: 'Gross exposure cap',
        action: 'Reduce exposure or wait for positions to close.',
      });
    }

    // --- Stage 5: allocation validation
    let allocationState: StageState = enabled ? 'PASS' : 'BLOCKED';
    if (!enabled) {
      blocks.push({
        label: 'Asset not allocated capital',
        currentValue: 'Disabled by operator',
        requiredValue: 'Asset enabled in the allocation set',
        rule: 'Allocation engine — asset enablement',
        action: 'Enable the asset on the Portfolio page if it should trade.',
      });
    }
    if (confidence < 55) {
      allocationState = 'BLOCKED';
      blocks.push({
        label: 'Specialist confidence too low',
        currentValue: `${confidence.toFixed(0)}% regime confidence`,
        requiredValue: '≥ 55%',
        rule: 'Specialist activation gate',
        action: 'Wait for a cleaner regime read before capital is allocated.',
      });
    }

    // --- Stage 6: governance validation
    let governanceState: StageState = 'PASS';
    if (state.isPaused) {
      governanceState = 'BLOCKED';
      blocks.push({
        label: 'Governance lock',
        currentValue: state.pauseReason || 'Risk pause active',
        requiredValue: 'No active governance pause',
        rule: 'Governance guardrail',
        action: 'Review the Governance page and clear the pause condition.',
      });
    }
    if (drawdown > 3) {
      governanceState = 'BLOCKED';
      blocks.push({
        label: 'Drawdown protection',
        currentValue: `${drawdown.toFixed(2)}% drawdown`,
        requiredValue: '≤ 3.00%',
        rule: 'Institutional drawdown guardrail',
        action: 'Investigate recent losses before new risk is deployed.',
      });
    }
    if (!state.isRunning) {
      governanceState = 'BLOCKED';
      blocks.push({
        label: 'Forward Validation requirement',
        currentValue: 'Trading engine stopped',
        requiredValue: 'Engine running in paper/forward-validation mode',
        rule: 'Forward validation runtime requirement',
        action: 'Start the paper trading session to resume evaluation.',
      });
    }

    // Filter-engine reason from the live engine (authoritative)
    if (a?.filterBlocked) {
      const meta = FILTER_BLOCK_MAP[a.filterBlocked];
      if (meta && !blocks.some(b => b.label === meta.label)) {
        blocks.push({
          ...meta,
          currentValue: describeFilterCurrent(a.filterBlocked, a, config),
          requiredValue: describeFilterRequired(a.filterBlocked, config),
        });
      }
    }

    const anyBlocked = [riskState, portfolioState, allocationState, governanceState].includes('BLOCKED');
    const finalDecision: StageState = position ? 'PASS'
      : anyBlocked ? 'BLOCKED'
      : hasSignal ? 'PASS'
      : 'WAITING';

    const pipeline: PipelineStage[] = [
      { name: 'Raw Signal', state: rawState, detail: hasSignal ? `${signal!.type} crossover detected on the last closed candle.` : 'No crossover on the last closed candle.' },
      { name: 'Indicator Validation', state: indicatorState, detail: warmed ? `SMA ${config.indicators.fastSMA}/${config.indicators.slowSMA} computed, separation ${dist != null ? dist.toFixed(2) : '—'}%, RSI ${rsi != null ? rsi.toFixed(1) : '—'}.` : 'Indicator buffer still warming up.' },
      { name: 'Risk Validation', state: riskState, detail: riskState === 'PASS' ? `ATR ${atr != null ? atr.toFixed(2) : '—'}% ≥ ${config.filters.atrThreshold}% and no cooldown active.` : 'Risk gate blocked — see reasons below.' },
      { name: 'Portfolio Validation', state: portfolioState, detail: `${openPositions} open positions, ${exposure.toFixed(1)}% gross exposure.` },
      { name: 'Allocation Validation', state: allocationState, detail: enabled ? `${SPECIALIST_META[specId].name} eligible at ${confidence.toFixed(0)}% confidence.` : 'Asset disabled by operator.' },
      { name: 'Governance Validation', state: governanceState, detail: governanceState === 'PASS' ? 'No governance locks; drawdown within limits.' : 'Governance gate blocked — see reasons below.' },
      { name: 'Final Decision', state: finalDecision, detail: position ? 'Position open and managed by the risk engine.' : finalDecision === 'BLOCKED' ? `Blocked by ${blocks[0]?.label ?? 'an upstream gate'}.` : finalDecision === 'PASS' ? 'Eligible — awaiting execution slot.' : 'Waiting for an actionable signal.' },
    ];

    const specialist: SpecialistView = {
      id: specId,
      name: SPECIALIST_META[specId].name,
      active: enabled && confidence >= 55,
      confidence,
      performance: SPECIALIST_META[specId].performance,
      champion: specId === CHAMPION,
      reasoning: specialistReasoning(specId, a, rsi),
    };

    const specialistWhy = specialist.active
      ? `${specialist.name} is active on ${ASSET_INFO[asset].symbol} because the regime resolved to ${regime} at ${confidence.toFixed(0)}% confidence, which is the mandate this specialist was validated for.`
      : `No specialist is active on ${ASSET_INFO[asset].symbol}: ${!enabled ? 'the asset is disabled by the operator' : `regime confidence is ${confidence.toFixed(0)}%, below the 55% activation gate`}.`;

    const buyTrigger = `A confirmed ${config.timeframe} close with fast SMA crossing above slow SMA by ≥${config.filters.minSmaDistancePercent}%, ATR ≥${config.filters.atrThreshold}%, bullish ${config.filters.higherTimeframe} trend and RSI below 65.`;
    const sellTrigger = `A confirmed ${config.timeframe} close with fast SMA crossing below slow SMA by ≥0.60%, ATR ≥0.35%, bearish ${config.filters.higherTimeframe} trend and RSI above 35.`;

    const gap = dist != null ? Math.abs(dist) : 1;
    const probability = Math.max(3, Math.min(92, Math.round(
      (hasSignal ? 70 : 25) + (regime === 'Bullish' || regime === 'Bearish' ? 15 : 0) + Math.max(0, 20 - gap * 10) - blocks.length * 4
    )));

    return {
      asset,
      symbol: ASSET_INFO[asset].symbol,
      name: ASSET_INFO[asset].name,
      price,
      regime,
      regimeConfidence: confidence,
      lastRegimeChange: ac.length ? ac[Math.max(0, ac.length - 12)].timestamp : null,
      regimeWhy: why,
      rsi,
      atrPercent: atr,
      smaDistance: dist,
      htfTrend: a?.htfTrend ?? 'neutral',
      specialist,
      specialistWhy,
      pipeline,
      finalDecision,
      blocks,
      explanation: {
        whyNoTrade: position
          ? `ATLAS is already positioned in ${ASSET_INFO[asset].symbol}; no additional entry is permitted while the position is managed.`
          : blocks.length
            ? `ATLAS did not trade ${ASSET_INFO[asset].symbol} because ${blocks.map(b => b.label.toLowerCase()).join(', ')}.`
            : `ATLAS did not trade ${ASSET_INFO[asset].symbol} because no confirmed crossover has occurred on a closed ${config.timeframe} candle.`,
        whyWait: `Waiting preserves expectancy: entering without ${regime === 'Sideways' ? 'a directional regime' : 'confirmation'} historically degrades profit factor. Current regime ${regime} at ${confidence.toFixed(0)}% confidence.`,
        buyTrigger,
        sellTrigger,
        nextSignalProbability: probability,
      },
      hasPosition: !!position,
    };
  });

  // ---- Feed (derived from live analytics + recent trades, read-only)
  const feed: DecisionFeedItem[] = [];
  for (const d of assetDiags) {
    feed.push({
      id: `feed-${d.asset}`,
      timestamp: now,
      asset: d.asset,
      symbol: d.symbol,
      specialist: d.specialist?.name ?? 'No specialist',
      action: d.finalDecision === 'PASS' && !d.hasPosition ? 'BUY' : 'HOLD',
      outcome: d.finalDecision === 'BLOCKED' ? 'Blocked' : d.finalDecision === 'WAITING' ? 'Rejected' : 'Approved',
      reason: d.blocks[0]?.label ?? (d.hasPosition ? 'Position open and managed' : 'All gates passed'),
      confidence: Math.round(d.regimeConfidence),
      risk: Math.round(Math.min(90, (d.atrPercent ?? 0.5) * 20 + 15)),
    });
  }
  for (const t of state.trades.slice(-12).reverse()) {
    feed.push({
      id: `trade-${t.id}`,
      timestamp: t.exitTime,
      asset: t.asset,
      symbol: ASSET_INFO[t.asset].symbol,
      specialist: t.strategySource ?? 'Bull Specialist',
      action: t.direction === 'long' ? 'BUY' : 'SELL',
      outcome: 'Approved',
      reason: `Executed and closed via ${t.exitReason.replace(/_/g, ' ')} (${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)})`,
      confidence: Math.round(t.convictionScore ?? 70),
      risk: Math.round(Math.min(90, (t.entryAtrPercent ?? 0.5) * 20 + 15)),
    });
  }
  feed.sort((a, b) => b.timestamp - a.timestamp);

  // ---- Module diagnostics
  const anyData = assetDiags.some(d => d.price != null);
  const warmedAll = assetDiags.every(d => d.smaDistance != null);
  const modules: ModuleCheck[] = [
    mk('Market Data', anyData, 'No live prices arriving from the market feed', 'critical', 'All downstream stages stall without prices', assetDiags.filter(d => d.price == null).map(d => d.symbol), 'Check the market data connection on the Paper Trading page.'),
    mk('Indicators', warmedAll, 'Indicator buffers still warming up', 'info', 'Signals cannot be generated until buffers fill', assetDiags.filter(d => d.smaDistance == null).map(d => d.symbol), 'No action — buffers fill as candles close.'),
    mk('Strategy Engine', assetDiags.some(d => d.pipeline[1].state === 'PASS'), 'Strategy engine has no validated inputs', 'warning', 'No signals will be produced', [], 'Verify strategy configuration on the Strategies page.'),
    mk('Specialist Engine', assetDiags.some(d => d.specialist?.active), 'No specialist is currently active', 'warning', 'Signals are evaluated without a specialist mandate', assetDiags.filter(d => !d.specialist?.active).map(d => d.symbol), 'Wait for regime confidence to exceed the 55% activation gate.'),
    mk('Signal Generator', assetDiags.some(d => d.pipeline[0].state === 'PASS'), 'No actionable signals on the last closed candles', 'info', 'Idle — this is expected between crossovers', [], 'No action required.'),
    mk('Risk Engine', assetDiags.every(d => d.pipeline[2].state !== 'FAIL'), 'Risk engine could not evaluate one or more assets', 'warning', 'Entries may be skipped', [], 'Review ATR and cooldown configuration.'),
    mk('Allocation Engine', assetDiags.some(d => d.pipeline[4].state === 'PASS'), 'No asset currently holds an allocation', 'warning', 'Capital cannot be deployed', assetDiags.filter(d => d.pipeline[4].state !== 'PASS').map(d => d.symbol), 'Enable assets or wait for confidence to recover.'),
    mk('Portfolio Manager', assetDiags.every(d => d.pipeline[3].state !== 'BLOCKED'), 'Portfolio limits are blocking new entries', 'warning', 'New positions rejected until exposure falls', [], 'Wait for open positions to close.'),
    mk('Governance Engine', !state.isPaused && state.isRunning, state.isPaused ? 'Governance pause is active' : 'Trading engine is not running', 'critical', 'All new entries are blocked', [], state.isPaused ? 'Clear the pause on the Governance page.' : 'Start the paper trading session.'),
    mk('Memory Engine', state.trades.length >= 0, null, 'none', '', [], ''),
  ];

  // ---- Scores
  const passRatio = (n: number) => Math.round((n / Math.max(1, assetDiags.length)) * 100);
  const scores: HealthScores = {
    tradingEngine: Math.round(modules.filter(m => m.ok).length / modules.length * 100),
    marketAlignment: passRatio(assetDiags.filter(d => d.regime !== 'Sideways').length),
    signalQuality: Math.round(assetDiags.reduce((s, d) => s + d.regimeConfidence, 0) / Math.max(1, assetDiags.length)),
    specialistAccuracy: Math.round(Object.values(SPECIALIST_META).reduce((s, m) => s + m.performance, 0) / 5 * 50),
    executionReadiness: passRatio(assetDiags.filter(d => d.pipeline[5].state === 'PASS').length),
    portfolioReadiness: passRatio(assetDiags.filter(d => d.pipeline[3].state === 'PASS').length),
    overallConfidence: 0,
  };
  scores.overallConfidence = Math.round(
    (scores.tradingEngine + scores.marketAlignment + scores.signalQuality + scores.specialistAccuracy + scores.executionReadiness + scores.portfolioReadiness) / 6
  );

  const blockedCount = assetDiags.filter(d => d.finalDecision === 'BLOCKED').length;
  const approved = assetDiags.filter(d => d.finalDecision === 'PASS').length;
  const executedToday = state.trades.filter(t => t.entryTime >= dayStart).length;
  const dominantRegime = mode(assetDiags.map(d => d.regime)) as DiagRegime;
  const activeSpec = assetDiags.find(d => d.specialist?.active)?.specialist?.name ?? 'None active';
  const exposurePercent = equity > 0
    ? (Object.values(state.positions).filter(Boolean) as { size: number; entryPrice: number }[])
        .reduce((s, p) => s + p.size * p.entryPrice, 0) / equity * 100
    : 0;

  const summary: DiagnosticsSummary = {
    engineStatus: state.isPaused ? 'Paused' : state.isRunning ? 'Running' : 'Stopped',
    overallHealth: scores.overallConfidence,
    regime: dominantRegime,
    activeSpecialist: activeSpec,
    signalsToday: assetDiags.filter(d => d.pipeline[0].state === 'PASS').length,
    signalsBlocked: blockedCount,
    tradesApproved: approved,
    tradesExecuted: executedToday,
    blockedPercent: Math.round((blockedCount / Math.max(1, assetDiags.length)) * 100),
    avgConfidence: Math.round(assetDiags.reduce((s, d) => s + d.regimeConfidence, 0) / Math.max(1, assetDiags.length)),
    avgRiskScore: Math.round(feed.slice(0, assetDiags.length).reduce((s, f) => s + f.risk, 0) / Math.max(1, assetDiags.length)),
    exposurePercent,
    drawdown,
    champion: SPECIALIST_META[CHAMPION].name,
  };

  const specialists: SpecialistView[] = (Object.keys(SPECIALIST_META) as SpecialistId[]).map((id) => {
    const holder = assetDiags.find(d => d.specialist?.id === id && d.specialist.active);
    const sample = assetDiags.find(d => d.specialist?.id === id);
    return {
      id,
      name: SPECIALIST_META[id].name,
      active: !!holder,
      confidence: Math.round(sample?.regimeConfidence ?? 0),
      performance: SPECIALIST_META[id].performance,
      champion: id === CHAMPION,
      reasoning: sample?.specialist?.reasoning ?? specialistReasoning(id, undefined, null),
    };
  });

  return { summary, assets: assetDiags, specialists, feed, modules, scores };
}

function mk(module: string, ok: boolean, fault: string | null, severity: ModuleCheck['severity'], impact: string, affected: string[], fix: string): ModuleCheck {
  return ok
    ? { module, ok: true, fault: null, severity: 'none', impact: '', affected: [], fix: '' }
    : { module, ok: false, fault: fault ?? 'Fault detected', severity, impact, affected, fix };
}

function mode<T extends string>(arr: T[]): T {
  const counts = new Map<T, number>();
  arr.forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? arr[0];
}

function describeFilterCurrent(reason: string, a: AssetAnalytics, config: TradingConfig): string {
  switch (reason) {
    case 'volatility_filter': return `ATR ${(a.atrPercent ?? 0).toFixed(2)}%`;
    case 'sma_distance_filter': return `Separation ${(a.smaDistance ?? 0).toFixed(2)}%`;
    case 'trend_filter': return `HTF trend ${a.htfTrend}`;
    case 'regime_filter': return `Regime ${a.marketRegime.replace('trending_', '')}`;
    default: return 'Engine-reported block';
  }
}

function describeFilterRequired(reason: string, config: TradingConfig): string {
  switch (reason) {
    case 'volatility_filter': return `≥ ${config.filters.atrThreshold.toFixed(2)}%`;
    case 'sma_distance_filter': return `≥ ${config.filters.minSmaDistancePercent.toFixed(2)}%`;
    case 'trend_filter': return `Aligned ${config.filters.higherTimeframe} trend`;
    case 'regime_filter': return 'Directional regime';
    default: return 'Gate must pass';
  }
}
