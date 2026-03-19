import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target,
  BarChart3, Activity, Shield, ArrowUpRight, ArrowDownRight,
  Minus, CheckCircle2, XCircle, Info, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradingContext } from '@/contexts/TradingContext';
import { generateResearchReport } from '@/lib/researchEngine';
import {
  ResearchReport, BenchmarkResult, RollingAnalysis,
  RegimePerformance, FailurePattern, StrategyScorecard,
  ResearchInsight, ImprovementSuggestion, InsightCategory,
} from '@/types/research';

// ─── Grade Badge ─────────────────────────────────────────────────────────────

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  D: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  F: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function GradeBadge({ grade, size = 'md' }: { grade: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-3xl px-4 py-2' : size === 'md' ? 'text-lg px-3 py-1' : 'text-xs px-2 py-0.5';
  return (
    <span className={cn('inline-flex items-center rounded-md border font-bold', GRADE_STYLES[grade] || GRADE_STYLES.C, sizeClass)}>
      {grade}
    </span>
  );
}

// ─── Insight Icon ────────────────────────────────────────────────────────────

const INSIGHT_ICONS: Record<InsightCategory, typeof TrendingUp> = {
  strength: CheckCircle2,
  weakness: AlertTriangle,
  risk: Shield,
  opportunity: Lightbulb,
  neutral: Info,
};

const INSIGHT_COLORS: Record<InsightCategory, string> = {
  strength: 'text-emerald-400',
  weakness: 'text-orange-400',
  risk: 'text-red-400',
  opportunity: 'text-blue-400',
  neutral: 'text-muted-foreground',
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function PerformanceResearchDashboard() {
  const { state } = useTradingContext();
  const trades = state.trades;

  const report = useMemo<ResearchReport>(() => {
    if (trades.length === 0) {
      return {
        generatedAt: Date.now(),
        baseline: null,
        benchmarks: [],
        rollingAnalyses: [],
        regimeBreakdown: [],
        failurePatterns: [],
        scorecards: [],
        insights: [],
        suggestions: [],
        overallGrade: 'C',
        readiness: 'not_ready',
      };
    }
    return generateResearchReport(
      trades,
      'sma_crossover',
      'all',
      state.initialBalance,
    );
  }, [trades, state.initialBalance]);

  if (trades.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium text-muted-foreground">No trade data available</h3>
          <p className="text-xs text-muted-foreground/70 mt-1">Run a backtest or paper trading session to generate research data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
        <TabsTrigger value="benchmarks" className="text-xs">Benchmarks</TabsTrigger>
        <TabsTrigger value="rolling" className="text-xs">Rolling</TabsTrigger>
        <TabsTrigger value="regimes" className="text-xs">Regimes</TabsTrigger>
        <TabsTrigger value="failures" className="text-xs">Failures</TabsTrigger>
        <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
        <TabsTrigger value="suggestions" className="text-xs">Suggestions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><OverviewTab report={report} /></TabsContent>
      <TabsContent value="benchmarks"><BenchmarksTab benchmarks={report.benchmarks} /></TabsContent>
      <TabsContent value="rolling"><RollingTab analyses={report.rollingAnalyses} /></TabsContent>
      <TabsContent value="regimes"><RegimesTab breakdown={report.regimeBreakdown} /></TabsContent>
      <TabsContent value="failures"><FailuresTab patterns={report.failurePatterns} /></TabsContent>
      <TabsContent value="insights"><InsightsTab insights={report.insights} /></TabsContent>
      <TabsContent value="suggestions"><SuggestionsTab suggestions={report.suggestions} /></TabsContent>
    </Tabs>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: ResearchReport }) {
  const scorecard = report.scorecards[0];
  if (!scorecard) return null;

  const readinessLabel = report.readiness === 'ready' ? 'Ready' : report.readiness === 'needs_work' ? 'Needs Work' : 'Not Ready';
  const readinessColor = report.readiness === 'ready' ? 'text-emerald-400' : report.readiness === 'needs_work' ? 'text-trading-warning' : 'text-destructive';

  return (
    <div className="space-y-4">
      {/* Top summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Overall Grade</p>
            <GradeBadge grade={report.overallGrade} size="lg" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Readiness</p>
            <p className={cn('text-lg font-bold', readinessColor)}>{readinessLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Robustness</p>
            <p className="text-lg font-bold text-foreground">{scorecard.robustnessScore.toFixed(0)}</p>
            <Progress value={scorecard.robustnessScore} className="h-1 mt-1" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Consistency</p>
            <p className="text-lg font-bold text-foreground">{scorecard.consistencyScore.toFixed(0)}</p>
            <Progress value={scorecard.consistencyScore} className="h-1 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Scorecard */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Strategy Scorecard
            <GradeBadge grade={scorecard.grade} size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <MetricCell label="Net PnL" value={`$${scorecard.netPnl.toFixed(2)}`} positive={scorecard.netPnl > 0} />
            <MetricCell label="Win Rate" value={`${scorecard.winRate.toFixed(1)}%`} positive={scorecard.winRate > 50} />
            <MetricCell label="Profit Factor" value={scorecard.profitFactor === Infinity ? '∞' : scorecard.profitFactor.toFixed(2)} positive={scorecard.profitFactor > 1} />
            <MetricCell label="Max Drawdown" value={`${scorecard.maxDrawdown.toFixed(1)}%`} positive={scorecard.maxDrawdown < 10} />
            <MetricCell label="Avg Trade" value={`$${scorecard.avgTrade.toFixed(2)}`} positive={scorecard.avgTrade > 0} />
            <MetricCell label="Trade Count" value={String(scorecard.tradeCount)} />
            <MetricCell label="Robustness" value={scorecard.robustnessScore.toFixed(0)} positive={scorecard.robustnessScore > 50} />
            <MetricCell label="Consistency" value={scorecard.consistencyScore.toFixed(0)} positive={scorecard.consistencyScore > 50} />
          </div>
        </CardContent>
      </Card>

      {/* Quick insights */}
      {report.insights.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Key Insights ({report.insights.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.insights.slice(0, 4).map(insight => {
              const Icon = INSIGHT_ICONS[insight.category];
              return (
                <div key={insight.id} className="flex items-start gap-2 text-xs">
                  <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', INSIGHT_COLORS[insight.category])} />
                  <div>
                    <p className="font-medium text-foreground">{insight.title}</p>
                    <p className="text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Failure count */}
      {report.failurePatterns.length > 0 && (
        <Card className="border-border/50 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {report.failurePatterns.length} failure pattern{report.failurePatterns.length > 1 ? 's' : ''} detected
              </p>
              <p className="text-xs text-muted-foreground">
                {report.failurePatterns.filter(p => p.severity === 'high').length} high severity — review the Failures tab for details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Benchmarks Tab ──────────────────────────────────────────────────────────

function BenchmarksTab({ benchmarks }: { benchmarks: BenchmarkResult[] }) {
  if (benchmarks.length === 0) return <EmptySection text="No benchmark data available." />;

  return (
    <div className="grid gap-3">
      {benchmarks.map(b => (
        <Card key={b.type} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">{b.label}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{b.type.replace('_', ' ')}</Badge>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <MetricCell label="Net PnL" value={`$${b.netPnl.toFixed(2)}`} positive={b.netPnl > 0} />
              <MetricCell label="Return" value={`${b.totalReturn.toFixed(1)}%`} positive={b.totalReturn > 0} />
              <MetricCell label="Max DD" value={`${b.maxDrawdown.toFixed(1)}%`} positive={b.maxDrawdown < 10} />
              <MetricCell label="Win Rate" value={`${b.winRate.toFixed(0)}%`} positive={b.winRate > 50} />
              <MetricCell label="PF" value={b.profitFactor === Infinity ? '∞' : b.profitFactor.toFixed(2)} positive={b.profitFactor > 1} />
              <MetricCell label="Trades" value={String(b.tradeCount)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Rolling Tab ─────────────────────────────────────────────────────────────

function RollingTab({ analyses }: { analyses: RollingAnalysis[] }) {
  if (analyses.length === 0) return <EmptySection text="Not enough trades for rolling analysis." />;

  return (
    <div className="space-y-3">
      {analyses.map(a => (
        <Card key={a.window.label} className={cn('border-border/50', a.isDegrading && 'border-destructive/30')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{a.window.label}</CardTitle>
              <TrendBadge trend={a.trend} />
            </div>
          </CardHeader>
          <CardContent>
            {a.points.length === 0 ? (
              <p className="text-xs text-muted-foreground">Insufficient data for this window.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  {a.points.slice(-1).map(p => (
                    <>
                      <MetricCell key={`pnl-${p.windowEnd}`} label="Net PnL" value={`$${p.netPnl.toFixed(2)}`} positive={p.netPnl > 0} />
                      <MetricCell key={`wr-${p.windowEnd}`} label="Win Rate" value={`${p.winRate.toFixed(1)}%`} positive={p.winRate > 50} />
                      <MetricCell key={`pf-${p.windowEnd}`} label="PF" value={p.profitFactor === Infinity ? '∞' : p.profitFactor.toFixed(2)} positive={p.profitFactor > 1} />
                      <MetricCell key={`dd-${p.windowEnd}`} label="Max DD" value={`${p.maxDrawdown.toFixed(1)}%`} positive={p.maxDrawdown < 10} />
                      <MetricCell key={`avg-${p.windowEnd}`} label="Avg Trade" value={`$${p.avgTrade.toFixed(2)}`} positive={p.avgTrade > 0} />
                    </>
                  ))}
                </div>
                {a.isDegrading && a.degradationReason && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>{a.degradationReason}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Regimes Tab ─────────────────────────────────────────────────────────────

function RegimesTab({ breakdown }: { breakdown: RegimePerformance[] }) {
  if (breakdown.length === 0) return <EmptySection text="No regime data available. Regime tracking requires annotated trade data." />;

  const regimeLabels: Record<string, string> = {
    trending_bullish: 'Bullish',
    trending_bearish: 'Bearish',
    sideways: 'Sideways',
  };

  return (
    <div className="grid gap-3">
      {breakdown.map((r, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px]">{regimeLabels[r.regime] || r.regime}</Badge>
              <Badge variant="outline" className="text-[10px]">{r.volatility} vol</Badge>
              <span className="text-[10px] text-muted-foreground ml-auto">{r.tradeCount} trades</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <MetricCell label="Net PnL" value={`$${r.netPnl.toFixed(2)}`} positive={r.netPnl > 0} />
              <MetricCell label="Win Rate" value={`${r.winRate.toFixed(1)}%`} positive={r.winRate > 50} />
              <MetricCell label="PF" value={r.profitFactor === Infinity ? '∞' : r.profitFactor.toFixed(2)} positive={r.profitFactor > 1} />
              <MetricCell label="Avg Trade" value={`$${r.avgTrade.toFixed(2)}`} positive={r.avgTrade > 0} />
              <MetricCell label="Max DD" value={`${r.maxDrawdown.toFixed(1)}%`} positive={r.maxDrawdown < 10} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Failures Tab ────────────────────────────────────────────────────────────

function FailuresTab({ patterns }: { patterns: FailurePattern[] }) {
  if (patterns.length === 0) {
    return (
      <Card className="border-border/50 border-emerald-500/20">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-foreground">No failure patterns detected</p>
            <p className="text-xs text-muted-foreground">The current strategy configuration shows no significant failure patterns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const severityColors: Record<string, string> = {
    high: 'border-destructive/30 bg-destructive/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    low: 'border-muted-foreground/20',
  };

  return (
    <div className="space-y-3">
      {patterns.map((p, i) => (
        <Card key={i} className={cn('border-border/50', severityColors[p.severity])}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn('h-4 w-4', p.severity === 'high' ? 'text-destructive' : p.severity === 'medium' ? 'text-orange-400' : 'text-muted-foreground')} />
                <p className="text-sm font-medium text-foreground">{p.type.replace(/_/g, ' ')}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{p.severity}</Badge>
            </div>
            <p className="text-xs text-foreground mb-1">{p.description}</p>
            <p className="text-[10px] text-muted-foreground mb-2">{p.evidence}</p>
            <Separator className="my-2" />
            <div className="flex items-start gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-muted-foreground">{p.suggestion}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Insights Tab ────────────────────────────────────────────────────────────

function InsightsTab({ insights }: { insights: ResearchInsight[] }) {
  if (insights.length === 0) return <EmptySection text="No insights generated yet." />;

  return (
    <div className="space-y-3">
      {insights.map(insight => {
        const Icon = INSIGHT_ICONS[insight.category];
        return (
          <Card key={insight.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', INSIGHT_COLORS[insight.category])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">{insight.confidence}% conf</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Suggestions Tab ─────────────────────────────────────────────────────────

function SuggestionsTab({ suggestions }: { suggestions: ImprovementSuggestion[] }) {
  if (suggestions.length === 0) return <EmptySection text="No improvement suggestions at this time." />;

  const priorityColors: Record<string, string> = {
    high: 'border-l-destructive',
    medium: 'border-l-orange-400',
    low: 'border-l-muted-foreground',
  };

  return (
    <div className="space-y-3">
      {suggestions.map(s => (
        <Card key={s.id} className={cn('border-border/50 border-l-2', priorityColors[s.priority])}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <Badge variant="outline" className="text-[10px]">{s.priority}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpRight className="h-3 w-3 text-primary" />
              <span className="text-primary">{s.expectedImpact}</span>
            </div>
            {s.parameter && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Parameter: <span className="font-mono text-foreground">{s.parameter}</span>
                {s.currentValue !== undefined && s.suggestedValue !== undefined && (
                  <> ({s.currentValue} → {s.suggestedValue})</>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function MetricCell({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn(
        'font-medium text-sm',
        positive === true ? 'text-emerald-400' : positive === false ? 'text-destructive' : 'text-foreground',
      )}>{value}</p>
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'degrading' }) {
  const config = {
    improving: { icon: TrendingUp, color: 'text-emerald-400', label: 'Improving' },
    stable: { icon: Minus, color: 'text-muted-foreground', label: 'Stable' },
    degrading: { icon: TrendingDown, color: 'text-destructive', label: 'Degrading' },
  }[trend];
  const Icon = config.icon;
  return (
    <div className={cn('flex items-center gap-1 text-[10px]', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-8 text-center">
        <p className="text-xs text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
