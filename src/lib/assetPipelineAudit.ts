import { Asset, AssetAnalytics, Candle, TradingConfig, TradingState, Signal } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';

export type StageResult = 'PASS' | 'FAIL';

export type AssetPipelineStatus = 'active' | 'waiting' | 'blocked' | 'disabled';

export interface AssetStageChecks {
  marketData: StageResult;
  strategyEngine: StageResult;
  aiConfidence: StageResult;
  riskEngine: StageResult;
  executionEngine: StageResult;
  portfolioIncluded: StageResult;
  analyticsIncluded: StageResult;
}

export interface AssetDiagnostic {
  asset: Asset;
  name: string;
  symbol: string;
  enabled: boolean;
  status: AssetPipelineStatus;
  statusLabel: string;
  blockingReason: string | null;
  confidence: number;
  lastEvaluation: number | null;
  price: number | null;
  candleCount: number;
  trades: number;
  hasPosition: boolean;
  checks: AssetStageChecks;
  connected: boolean;
}

export interface PipelineValidationReport {
  totalEnabled: number;
  fullyConnected: number;
  currentlyTrading: number;
  waitingForSignal: number;
  blocked: number;
  disabled: number;
  missingFromPipeline: Asset[];
  inconsistencies: string[];
}

const BLOCK_LABELS: Record<string, string> = {
  trend_filter: 'HTF trend not aligned',
  volatility_filter: 'ATR below minimum',
  regime_filter: 'Market regime not favourable',
  sma_distance_filter: 'SMA distance below threshold',
  cooldown_active: 'Cooldown active',
  insufficient_balance: 'Insufficient balance',
  daily_loss_pause: 'Daily loss limit reached',
  consecutive_loss_pause: 'Consecutive loss limit reached',
};

/**
 * Infrastructure-level confidence score (0-100) derived from the same analytics
 * inputs the AI confidence engine consumes. Read-only: no strategy behaviour.
 */
export function computeAssetConfidence(a: AssetAnalytics | undefined, signal: Signal | null): number {
  if (!a) return 0;
  let score = 0;
  // Signal strength (0-30)
  if (signal && signal.type !== 'HOLD') score += 30;
  else if (a.smaFast != null && a.smaSlow != null) score += 10;
  // Trend alignment (0-25)
  if (a.htfTrend === 'bullish' || a.htfTrend === 'bearish') score += 25;
  else score += 8;
  // Volatility quality (0-20)
  const atr = a.atrPercent ?? 0;
  if (atr >= 0.5 && atr <= 2.0) score += 20;
  else if (atr > 0) score += 8;
  // Conviction from SMA distance (0-15)
  const dist = Math.abs(a.smaDistance ?? 0);
  if (dist >= 1.0) score += 15;
  else if (dist >= 0.5) score += 10;
  else if (dist >= 0.25) score += 5;
  // Filter status (0-10)
  if (!a.filterBlocked) score += 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildAssetDiagnostics(params: {
  allAssets: Asset[];
  engineAssets: Asset[];
  enabledAssets: Record<Asset, boolean>;
  analytics: Record<Asset, AssetAnalytics>;
  candles: Record<Asset, Candle[]>;
  prices: Record<Asset, number | null>;
  signals: Record<Asset, Signal | null>;
  state: TradingState;
  config: TradingConfig;
  lastUpdate: Date | null;
}): AssetDiagnostic[] {
  const {
    allAssets, engineAssets, enabledAssets, analytics, candles,
    prices, signals, state, config, lastUpdate,
  } = params;

  return allAssets.map((asset) => {
    const inEngine = engineAssets.includes(asset);
    const enabled = inEngine && enabledAssets[asset] !== false;
    const a = analytics[asset];
    const ac = candles[asset] ?? [];
    const price = prices[asset] ?? null;
    const signal = signals[asset] ?? null;
    const trades = state.trades.filter(t => t.asset === asset).length;
    const position = state.positions[asset] ?? null;
    const confidence = computeAssetConfidence(a, signal);

    const checks: AssetStageChecks = {
      marketData: price != null && ac.length > 0 ? 'PASS' : 'FAIL',
      strategyEngine: a?.smaFast != null && a?.smaSlow != null ? 'PASS' : 'FAIL',
      aiConfidence: inEngine && a ? 'PASS' : 'FAIL',
      riskEngine: inEngine && a?.atr != null ? 'PASS' : 'FAIL',
      executionEngine: inEngine && enabled ? 'PASS' : 'FAIL',
      portfolioIncluded: inEngine ? 'PASS' : 'FAIL',
      analyticsIncluded: a != null ? 'PASS' : 'FAIL',
    };

    let status: AssetPipelineStatus;
    let blockingReason: string | null = null;

    if (!inEngine) {
      status = 'disabled';
      blockingReason = 'Not registered in the execution pipeline';
    } else if (!enabled) {
      status = 'disabled';
      blockingReason = 'Asset disabled by operator';
    } else if (state.isPaused) {
      status = 'blocked';
      blockingReason = state.pauseReason || 'Risk pause active';
    } else if (checks.marketData === 'FAIL') {
      status = 'blocked';
      blockingReason = 'Market data unavailable';
    } else if (a?.filterBlocked) {
      status = 'blocked';
      blockingReason = BLOCK_LABELS[a.filterBlocked] ?? a.filterBlocked;
    } else if (
      Date.now() - (state.lastTradeTime[asset] ?? 0) <
      config.risk.cooldownCandles * 60_000
    ) {
      status = 'blocked';
      blockingReason = 'Cooldown active';
    } else if (position || (signal && signal.type !== 'HOLD')) {
      status = 'active';
    } else {
      status = 'waiting';
    }

    const statusLabel =
      status === 'active' ? (position ? 'Active — in position' : 'Active — signal eligible')
      : status === 'waiting' ? 'Waiting for signal'
      : status === 'blocked' ? 'Blocked'
      : 'Disabled';

    return {
      asset,
      name: ASSET_INFO[asset].name,
      symbol: ASSET_INFO[asset].symbol,
      enabled,
      status,
      statusLabel,
      blockingReason,
      confidence,
      lastEvaluation: lastUpdate ? lastUpdate.getTime() : null,
      price,
      candleCount: ac.length,
      trades,
      hasPosition: !!position,
      checks,
      connected: Object.values(checks).every(c => c === 'PASS') || (inEngine && checks.portfolioIncluded === 'PASS' && checks.strategyEngine === 'PASS'),
    };
  });
}

export function buildValidationReport(diags: AssetDiagnostic[]): PipelineValidationReport {
  const enabled = diags.filter(d => d.enabled);
  const inconsistencies: string[] = [];

  for (const d of diags) {
    if (d.checks.portfolioIncluded === 'FAIL') {
      inconsistencies.push(`${d.symbol} is visible in the UI but absent from the execution pipeline.`);
    } else if (d.enabled && d.checks.marketData === 'FAIL') {
      inconsistencies.push(`${d.symbol} is enabled but no live market data is arriving.`);
    } else if (d.enabled && d.checks.strategyEngine === 'FAIL') {
      inconsistencies.push(`${d.symbol} has market data but indicators are not yet warmed up.`);
    }
  }

  return {
    totalEnabled: enabled.length,
    fullyConnected: enabled.filter(d => Object.values(d.checks).every(c => c === 'PASS')).length,
    currentlyTrading: enabled.filter(d => d.hasPosition).length,
    waitingForSignal: enabled.filter(d => d.status === 'waiting').length,
    blocked: enabled.filter(d => d.status === 'blocked').length,
    disabled: diags.filter(d => !d.enabled).length,
    missingFromPipeline: diags.filter(d => d.checks.portfolioIncluded === 'FAIL').map(d => d.asset),
    inconsistencies,
  };
}
