import { Asset } from '@/types/trading';

// ─── Scenario Types ──────────────────────────────────────────────────

export type ScenarioCategory =
  | 'strong_bullish_trend'
  | 'strong_bearish_trend'
  | 'sideways_choppy'
  | 'low_volatility_compression'
  | 'high_volatility_breakout'
  | 'sudden_crash'
  | 'sudden_pump'
  | 'reversal_heavy'
  | 'fake_breakout'
  | 'whipsaw_crossover'
  | 'gap_missing_data'
  | 'delayed_candle';

export type StressCategory =
  | 'execution_stress'
  | 'portfolio_stress'
  | 'adaptation_stress';

export interface ScenarioConfig {
  slippageMultiplier: number;
  feeMultiplier: number;
  volatilityMultiplier: number;
  gapFrequency: number;
  reconnectFrequency: number;
  trendStrength: number;
  chopIntensity: number;
  reversalFrequency: number;
}

export const DEFAULT_SCENARIO_CONFIG: ScenarioConfig = {
  slippageMultiplier: 1.0,
  feeMultiplier: 1.0,
  volatilityMultiplier: 1.0,
  gapFrequency: 0,
  reconnectFrequency: 0,
  trendStrength: 1.0,
  chopIntensity: 0.5,
  reversalFrequency: 0.1,
};

export interface ScenarioDefinition {
  id: string;
  name: string;
  category: ScenarioCategory;
  description: string;
  candleCount: number;
  config: Partial<ScenarioConfig>;
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  category: ScenarioCategory;
  asset: Asset;
  totalTrades: number;
  longTrades: number;
  shortTrades: number;
  winRate: number;
  netPnl: number;
  maxDrawdown: number;
  profitFactor: number;
  blockedSetups: number;
  flipTrades: number;
  averageTrade: number;
  largestWin: number;
  largestLoss: number;
  explanation: string;
}

export interface RobustnessScore {
  asset: Asset;
  strategy: string;
  overallScore: number;
  consistencyScore: number;
  drawdownControl: number;
  returnStability: number;
  whipsawResistance: number;
  volatilityHandling: number;
  crashSurvival: number;
  scenarioBreakdown: Record<string, number>;
}

export interface FailurePoint {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  scenario: string;
  metric: string;
  value: number;
  threshold: number;
  recommendation: string;
}

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  basedOn: string[];
}

export interface ScenarioTestSuite {
  id: string;
  runAt: number;
  scenarios: ScenarioResult[];
  robustnessScores: RobustnessScore[];
  failurePoints: FailurePoint[];
  recommendations: Recommendation[];
  config: ScenarioConfig;
  duration: number;
}
