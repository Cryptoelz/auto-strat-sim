/**
 * Performance Research & Evaluation types.
 * Supports baseline tracking, benchmarking, rolling analysis,
 * regime breakdown, failure detection, scorecards, insights, and suggestions.
 */
import { Asset, Trade, MarketRegime } from './trading';
import { StrategyId } from './strategy';

// ─── Baseline ────────────────────────────────────────────────────────────────

export interface BaselineConfig {
  id: string;
  name: string;
  createdAt: number;
  strategyId: StrategyId;
  params: Record<string, number>;
  assets: Asset[];
  timeframe: string;
}

export interface BaselinePerformance {
  baselineId: string;
  netPnl: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  tradeCount: number;
  avgTrade: number;
  robustnessScore: number;
  consistencyScore: number;
  updatedAt: number;
}

// ─── Benchmarks ──────────────────────────────────────────────────────────────

export type BenchmarkType = 'baseline' | 'buy_and_hold' | 'random_entry';

export interface BenchmarkResult {
  type: BenchmarkType;
  label: string;
  netPnl: number;
  totalReturn: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  tradeCount: number;
}

// ─── Rolling Performance ─────────────────────────────────────────────────────

export interface RollingWindow {
  label: string;
  size: number;
  unit: 'trades' | 'candles';
}

export interface RollingPerformancePoint {
  windowEnd: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  avgTrade: number;
}

export interface RollingAnalysis {
  window: RollingWindow;
  points: RollingPerformancePoint[];
  isDegrading: boolean;
  degradationReason: string | null;
  trend: 'improving' | 'stable' | 'degrading';
}

// ─── Regime Breakdown ────────────────────────────────────────────────────────

export type VolatilityLevel = 'high' | 'low';

export interface RegimePerformance {
  regime: MarketRegime;
  volatility: VolatilityLevel;
  tradeCount: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgTrade: number;
  maxDrawdown: number;
}

// ─── Failure Patterns ────────────────────────────────────────────────────────

export type FailurePatternType =
  | 'stop_loss_cluster'
  | 'excessive_flips'
  | 'weak_shorts'
  | 'weak_sideways'
  | 'over_filtering'
  | 'under_trading';

export interface FailurePattern {
  type: FailurePatternType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: string;
  affectedTrades: number;
  suggestion: string;
}

// ─── Strategy Scorecard ──────────────────────────────────────────────────────

export interface StrategyScorecard {
  strategyId: StrategyId;
  asset: Asset | 'all';
  netPnl: number;
  maxDrawdown: number;
  profitFactor: number;
  winRate: number;
  avgTrade: number;
  tradeCount: number;
  robustnessScore: number;
  consistencyScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// ─── Insights & Suggestions ─────────────────────────────────────────────────

export type InsightCategory =
  | 'strength'
  | 'weakness'
  | 'risk'
  | 'opportunity'
  | 'neutral';

export interface ResearchInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  confidence: number; // 0-100
  relatedMetric: string;
}

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface ImprovementSuggestion {
  id: string;
  priority: SuggestionPriority;
  title: string;
  description: string;
  expectedImpact: string;
  parameter?: string;
  currentValue?: number;
  suggestedValue?: number;
}

// ─── Research Report ─────────────────────────────────────────────────────────

export interface ResearchReport {
  generatedAt: number;
  baseline: BaselinePerformance | null;
  benchmarks: BenchmarkResult[];
  rollingAnalyses: RollingAnalysis[];
  regimeBreakdown: RegimePerformance[];
  failurePatterns: FailurePattern[];
  scorecards: StrategyScorecard[];
  insights: ResearchInsight[];
  suggestions: ImprovementSuggestion[];
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  readiness: 'ready' | 'needs_work' | 'not_ready';
}
