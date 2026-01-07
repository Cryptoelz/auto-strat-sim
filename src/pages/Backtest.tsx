import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBacktest, BacktestConfig, BacktestResult, EquityPoint } from '@/hooks/useBacktest';
import { DurationVsProfitabilityChart } from '@/components/backtest/DurationVsProfitabilityChart';
import { RiskOfRuinCard } from '@/components/backtest/RiskOfRuinCard';
import { PnLDistributionChart } from '@/components/backtest/PnLDistributionChart';
import { RiskAdjustedReturnsCard } from '@/components/backtest/RiskAdjustedReturnsCard';
import { StreakProbabilityCard } from '@/components/backtest/StreakProbabilityCard';
import { ProfitFactorCard } from '@/components/backtest/ProfitFactorCard';
import { TradeExpectancyCard } from '@/components/backtest/TradeExpectancyCard';
import { RecoveryFactorCard } from '@/components/backtest/RecoveryFactorCard';
import { PayoffRatioCard } from '@/components/backtest/PayoffRatioCard';
import { TradeSizeAnalysisCard } from '@/components/backtest/TradeSizeAnalysisCard';
import { MarketRegimeCard } from '@/components/backtest/MarketRegimeCard';
import { VolatilityAnalysisCard } from '@/components/backtest/VolatilityAnalysisCard';
import { AssetCorrelationCard } from '@/components/backtest/AssetCorrelationCard';
import { MaeMfeAnalysisCard } from '@/components/backtest/MaeMfeAnalysisCard';
import { TradeTimingCard } from '@/components/backtest/TradeTimingCard';
import { PositionSizingCard } from '@/components/backtest/PositionSizingCard';
import { DrawdownRecoveryCard } from '@/components/backtest/DrawdownRecoveryCard';
import { StreakImpactCard } from '@/components/backtest/StreakImpactCard';
import { TradeQualityScoreCard } from '@/components/backtest/TradeQualityScoreCard';
import { OptimalTradeFilterCard } from '@/components/backtest/OptimalTradeFilterCard';
import { TradePatternClusteringCard } from '@/components/backtest/TradePatternClusteringCard';
import { StrategyOptimizer } from '@/components/backtest/StrategyOptimizer';
import { WalkForwardAnalysis } from '@/components/backtest/WalkForwardAnalysis';
import { WalkForwardCard } from '@/components/backtest/WalkForwardCard';
import { BenchmarkComparisonCard } from '@/components/backtest/BenchmarkComparisonCard';
import { ParameterSensitivityCard } from '@/components/backtest/ParameterSensitivityCard';
import { MonteCarloCard } from '@/components/backtest/MonteCarloCard';
import { StreakAnalysisCard } from '@/components/backtest/StreakAnalysisCard';
import { TradeDurationCard } from '@/components/backtest/TradeDurationCard';
import { KellyCriterionCard } from '@/components/backtest/KellyCriterionCard';
import { HourlyPerformanceCard } from '@/components/backtest/HourlyPerformanceCard';
import { DayOfWeekPerformanceCard } from '@/components/backtest/DayOfWeekPerformanceCard';
import { TradeClusteringCard } from '@/components/backtest/TradeClusteringCard';
import { StatCard } from '@/components/backtest/StatCard';
import { EquityCurveChart } from '@/components/backtest/EquityCurveChart';
import { DrawdownChart } from '@/components/backtest/DrawdownChart';
import { MonthlyReturnsHeatmap } from '@/components/backtest/MonthlyReturnsHeatmap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { format, subDays } from 'date-fns';
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  AlertTriangle,
  Trophy,
  Percent,
  DollarSign,
  Save,
  Trash2,
  GitCompare,
  X,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

const SAVED_RUNS_KEY = 'backtest-saved-runs';

interface SavedRun {
  id: string;
  name: string;
  savedAt: number;
  config: {
    assets: Asset[];
    startDate: string;
    endDate: string;
    timeframe: string;
    fastSMA: number;
    slowSMA: number;
    initialBalance: number;
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
  result: {
    finalBalance: number;
    totalPnl: number;
    totalPnlPercent: number;
    winRate: number;
    totalTrades: number;
    maxDrawdown: number;
    profitFactor: number;
    sharpeRatio: number;
  };
}

function loadSavedRuns(): SavedRun[] {
  try {
    const saved = localStorage.getItem(SAVED_RUNS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSavedRuns(runs: SavedRun[]) {
  localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(runs));
}

function exportResultToCSV(result: BacktestResult, config: { fastSMA: number; slowSMA: number; timeframe: string }) {
  const lines: string[] = [];
  
  // Summary section
  lines.push('BACKTEST SUMMARY');
  lines.push(`Strategy,SMA ${config.fastSMA}/${config.slowSMA} ${config.timeframe}`);
  lines.push(`Final Balance,${result.finalBalance.toFixed(2)}`);
  lines.push(`Total P&L,${result.totalPnl.toFixed(2)}`);
  lines.push(`Return %,${result.totalPnlPercent.toFixed(2)}`);
  lines.push(`Win Rate %,${result.winRate.toFixed(2)}`);
  lines.push(`Total Trades,${result.totalTrades}`);
  lines.push(`Max Drawdown %,${result.maxDrawdown.toFixed(2)}`);
  lines.push(`Profit Factor,${result.profitFactor === Infinity ? 'Infinity' : result.profitFactor.toFixed(2)}`);
  lines.push(`Sharpe Ratio,${result.sharpeRatio.toFixed(2)}`);
  lines.push('');
  
  // Trade history section
  lines.push('TRADE HISTORY');
  lines.push('Asset,Type,Entry Time,Exit Time,Entry Price,Exit Price,Size,P&L,P&L %,Fees,Exit Reason');
  result.trades.forEach(trade => {
    lines.push([
      trade.asset,
      trade.type,
      new Date(trade.entryTime).toISOString(),
      new Date(trade.exitTime).toISOString(),
      trade.entryPrice.toFixed(4),
      trade.exitPrice.toFixed(4),
      trade.size.toFixed(6),
      trade.pnl.toFixed(2),
      trade.pnlPercent.toFixed(2),
      trade.fees.toFixed(2),
      trade.exitReason
    ].join(','));
  });
  
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backtest-${config.fastSMA}-${config.slowSMA}-${config.timeframe}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportComparisonToCSV(runs: SavedRun[]) {
  const lines: string[] = [];
  
  lines.push('STRATEGY COMPARISON');
  lines.push('Name,Assets,Start Date,End Date,Timeframe,Fast SMA,Slow SMA,Initial Balance,Position Size %,Stop Loss %,Take Profit %,Final Balance,Total P&L,Return %,Win Rate %,Total Trades,Max Drawdown %,Profit Factor,Sharpe Ratio,Saved At');
  
  runs.forEach(run => {
    lines.push([
      `"${run.name}"`,
      `"${run.config.assets.join(', ')}"`,
      format(new Date(run.config.startDate), 'yyyy-MM-dd'),
      format(new Date(run.config.endDate), 'yyyy-MM-dd'),
      run.config.timeframe,
      run.config.fastSMA,
      run.config.slowSMA,
      run.config.initialBalance,
      run.config.positionSizePercent,
      run.config.stopLossPercent,
      run.config.takeProfitPercent,
      run.result.finalBalance.toFixed(2),
      run.result.totalPnl.toFixed(2),
      run.result.totalPnlPercent.toFixed(2),
      run.result.winRate.toFixed(2),
      run.result.totalTrades,
      run.result.maxDrawdown.toFixed(2),
      run.result.profitFactor === Infinity ? 'Infinity' : run.result.profitFactor.toFixed(2),
      run.result.sharpeRatio.toFixed(2),
      format(new Date(run.savedAt), 'yyyy-MM-dd HH:mm')
    ].join(','));
  });
  
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backtest-comparison-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


function ResultsDisplay({ result, fastSMA, slowSMA, stopLossPercent, takeProfitPercent, positionSizePercent }: { result: BacktestResult; fastSMA: number; slowSMA: number; stopLossPercent: number; takeProfitPercent: number; positionSizePercent: number }) {
  const pnlTrend = result.totalPnl >= 0 ? 'up' : 'down';
  const initialBalance = result.equityCurve.length > 0 ? result.equityCurve[0].balance : 10000;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Final Balance"
          value={formatCurrency(result.finalBalance)}
          icon={DollarSign}
          trend={pnlTrend}
        />
        <StatCard
          title="Total P&L"
          value={`${result.totalPnl >= 0 ? '+' : ''}${formatCurrency(result.totalPnl)}`}
          icon={result.totalPnl >= 0 ? TrendingUp : TrendingDown}
          trend={pnlTrend}
        />
        <StatCard
          title="Return"
          value={`${result.totalPnlPercent >= 0 ? '+' : ''}${result.totalPnlPercent.toFixed(2)}%`}
          icon={Percent}
          trend={pnlTrend}
        />
        <StatCard
          title="Win Rate"
          value={`${result.winRate.toFixed(1)}%`}
          icon={Trophy}
          trend={result.winRate >= 50 ? 'up' : 'down'}
        />
      </div>

      {/* Equity Curve & Drawdown Charts */}
      {result.equityCurve.length > 1 && (
        <div className="space-y-4">
          <EquityCurveChart data={result.equityCurve} initialBalance={initialBalance} />
          <DrawdownChart data={result.equityCurve} maxDrawdown={result.maxDrawdown} />
        </div>
      )}

      {/* Benchmark Comparison */}
      {result.trades.length >= 2 && (
        <BenchmarkComparisonCard 
          trades={result.trades} 
          equityCurve={result.equityCurve} 
          initialBalance={initialBalance} 
        />
      )}

      {/* Monthly Returns Heatmap */}
      {result.trades.length > 0 && (
        <MonthlyReturnsHeatmap trades={result.trades} />
      )}

      {/* Streak Analysis */}
      {result.trades.length > 0 && (
        <StreakAnalysisCard trades={result.trades} />
      )}

      {/* Monte Carlo Simulation */}
      {result.trades.length >= 5 && (
        <MonteCarloCard trades={result.trades} initialBalance={initialBalance} />
      )}

      {/* Trade Duration Analysis */}
      {result.trades.length > 0 && (
        <TradeDurationCard trades={result.trades} />
      )}

      {/* Walk-Forward Analysis */}
      {result.trades.length >= 4 && (
        <WalkForwardCard trades={result.trades} />
      )}

      {/* Hourly Performance */}
      {result.trades.length > 0 && (
        <HourlyPerformanceCard trades={result.trades} />
      )}

      {/* Day of Week Performance */}
      {result.trades.length > 0 && (
        <DayOfWeekPerformanceCard trades={result.trades} />
      )}

      {/* Parameter Sensitivity */}
      {result.trades.length >= 5 && (
        <ParameterSensitivityCard trades={result.trades} currentFast={fastSMA} currentSlow={slowSMA} />
      )}

      {/* Trade Clustering Analysis */}
      {result.trades.length >= 5 && (
        <TradeClusteringCard trades={result.trades} />
      )}

      {/* Kelly Criterion & Expected Value */}
      {result.trades.length >= 5 && (
        <KellyCriterionCard trades={result.trades} />
      )}

      {/* Duration vs Profitability Scatter Plot */}
      {result.trades.length >= 2 && (
        <DurationVsProfitabilityChart trades={result.trades} />
      )}

      {/* Risk of Ruin Analysis */}
      {result.trades.length >= 5 && (
        <RiskOfRuinCard trades={result.trades} />
      )}

      {/* P&L Distribution Histogram */}
      {result.trades.length >= 2 && (
        <PnLDistributionChart trades={result.trades} />
      )}

      {/* Risk-Adjusted Returns (Sharpe, Sortino, Calmar) */}
      {result.trades.length >= 5 && (
        <RiskAdjustedReturnsCard trades={result.trades} />
      )}

      {/* Streak Probability Analysis */}
      {result.trades.length >= 5 && (
        <StreakProbabilityCard trades={result.trades} />
      )}

      {/* Profit Factor */}
      {result.trades.length >= 2 && (
        <ProfitFactorCard trades={result.trades} />
      )}

      {/* Trade Expectancy */}
      {result.trades.length >= 5 && (
        <TradeExpectancyCard trades={result.trades} />
      )}

      {/* Recovery Factor */}
      {result.trades.length >= 2 && (
        <RecoveryFactorCard trades={result.trades} initialBalance={initialBalance} />
      )}

      {/* Payoff Ratio */}
      {result.trades.length >= 2 && (
        <PayoffRatioCard trades={result.trades} />
      )}

      {/* Trade Size Analysis */}
      {result.trades.length >= 5 && (
        <TradeSizeAnalysisCard trades={result.trades} />
      )}

      {/* Market Regime Analysis */}
      {result.trades.length >= 5 && (
        <MarketRegimeCard trades={result.trades} />
      )}

      {/* Volatility Analysis */}
      {result.trades.length >= 5 && (
        <VolatilityAnalysisCard trades={result.trades} />
      )}

      {/* Asset Correlation Matrix */}
      {result.trades.length >= 5 && (
        <AssetCorrelationCard trades={result.trades} />
      )}

      {/* MAE/MFE Analysis */}
      {result.trades.length >= 5 && (
        <MaeMfeAnalysisCard 
          trades={result.trades} 
          stopLossPercent={stopLossPercent} 
          takeProfitPercent={takeProfitPercent} 
        />
      )}

      {/* Trade Timing Optimization */}
      {result.trades.length >= 5 && (
        <TradeTimingCard trades={result.trades} />
      )}

      {/* Position Sizing Analysis */}
      {result.trades.length >= 5 && (
        <PositionSizingCard 
          trades={result.trades} 
          initialBalance={initialBalance} 
          currentPositionSize={positionSizePercent} 
        />
      )}

      {/* Drawdown Recovery Analysis */}
      {result.trades.length >= 5 && (
        <DrawdownRecoveryCard trades={result.trades} initialBalance={initialBalance} />
      )}

      {/* Streak Impact Analysis */}
      {result.trades.length >= 5 && (
        <StreakImpactCard trades={result.trades} initialBalance={initialBalance} />
      )}

      {/* Trade Quality Score */}
      {result.trades.length >= 5 && (
        <TradeQualityScoreCard 
          trades={result.trades} 
          stopLossPercent={stopLossPercent} 
          takeProfitPercent={takeProfitPercent} 
        />
      )}

      {/* Optimal Trade Filter Analysis */}
      {result.trades.length >= 5 && (
        <OptimalTradeFilterCard trades={result.trades} />
      )}

      {/* Trade Pattern Clustering Analysis */}
      {result.trades.length >= 10 && (
        <TradePatternClusteringCard trades={result.trades} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trade Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{result.totalTrades}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Winning Trades</span>
              <span className="font-medium text-trading-profit">{result.winningTrades}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Losing Trades</span>
              <span className="font-medium text-trading-loss">{result.losingTrades}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Win</span>
              <span className="font-medium text-trading-profit">{formatCurrency(result.averageWin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Loss</span>
              <span className="font-medium text-trading-loss">{formatCurrency(result.averageLoss)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Risk Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-trading-loss">-{result.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit Factor</span>
              <span className={cn(
                "font-medium",
                result.profitFactor >= 1 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help underline decoration-dotted underline-offset-2">Sharpe Ratio</span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="font-medium mb-1">Sharpe Ratio</p>
                    <p className="text-xs text-muted-foreground">Measures risk-adjusted return using total volatility. Higher is better.</p>
                    <p className="text-xs mt-1"><span className="text-trading-profit">≥1.0:</span> Good | <span className="text-yellow-500">0.5-1.0:</span> OK | <span className="text-trading-loss">&lt;0.5:</span> Poor</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <span className={cn(
                "font-medium",
                result.sharpeRatio >= 1 ? "text-trading-profit" : result.sharpeRatio >= 0 ? "text-foreground" : "text-trading-loss"
              )}>
                {result.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help underline decoration-dotted underline-offset-2">Sortino Ratio</span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="font-medium mb-1">Sortino Ratio</p>
                    <p className="text-xs text-muted-foreground">Like Sharpe but only penalizes downside volatility. Better for asymmetric returns.</p>
                    <p className="text-xs mt-1"><span className="text-trading-profit">≥2.0:</span> Excellent | <span className="text-trading-profit">≥1.0:</span> Good | <span className="text-trading-loss">&lt;1.0:</span> Below avg</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <span className={cn(
                "font-medium",
                result.sortinoRatio >= 1 ? "text-trading-profit" : result.sortinoRatio >= 0 ? "text-foreground" : "text-trading-loss"
              )}>
                {result.sortinoRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help underline decoration-dotted underline-offset-2">Calmar Ratio</span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="font-medium mb-1">Calmar Ratio</p>
                    <p className="text-xs text-muted-foreground">Annualized return divided by max drawdown. Shows return per unit of drawdown risk.</p>
                    <p className="text-xs mt-1"><span className="text-trading-profit">≥3.0:</span> Excellent | <span className="text-trading-profit">≥1.0:</span> Good | <span className="text-trading-loss">&lt;1.0:</span> Risky</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <span className={cn(
                "font-medium",
                result.calmarRatio >= 1 ? "text-trading-profit" : result.calmarRatio >= 0 ? "text-foreground" : "text-trading-loss"
              )}>
                {result.calmarRatio.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk/Reward</span>
              <span className="font-medium">
                {result.averageLoss !== 0 
                  ? Math.abs(result.averageWin / result.averageLoss).toFixed(2) 
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Breakdown */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance by Asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(result.assetResults).map(([asset, stats]) => {
              if (stats.trades === 0) return null;
              const info = ASSET_INFO[asset as Asset];
              return (
                <div 
                  key={asset}
                  className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{info.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stats.trades} trades
                    </Badge>
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    stats.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                  )}>
                    {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Win Rate: {stats.winRate.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trade History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trade History</CardTitle>
          <CardDescription>All {result.trades.length} trades from backtest</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {result.trades.map((trade, i) => {
                const info = ASSET_INFO[trade.asset];
                return (
                  <div 
                    key={trade.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/10 p-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-12">{info.symbol}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          trade.type === 'win'
                            ? "border-trading-profit/50 bg-trading-profit/10 text-trading-profit"
                            : "border-trading-loss/50 bg-trading-loss/10 text-trading-loss"
                        )}
                      >
                        {trade.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(trade.entryTime), 'MMM dd HH:mm')} → {format(new Date(trade.exitTime), 'MMM dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {trade.exitReason.replace('_', ' ')}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        trade.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonTable({ runs, onRemove }: { runs: SavedRun[]; onRemove: (id: string) => void }) {
  if (runs.length === 0) return null;

  const metrics = [
    { key: 'totalPnlPercent', label: 'Return', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, best: 'high' },
    { key: 'winRate', label: 'Win Rate', format: (v: number) => `${v.toFixed(1)}%`, best: 'high' },
    { key: 'totalTrades', label: 'Trades', format: (v: number) => v.toString(), best: 'neutral' },
    { key: 'maxDrawdown', label: 'Max DD', format: (v: number) => `-${v.toFixed(2)}%`, best: 'low' },
    { key: 'profitFactor', label: 'Profit Factor', format: (v: number) => v === Infinity ? '∞' : v.toFixed(2), best: 'high' },
    { key: 'sharpeRatio', label: 'Sharpe', format: (v: number) => v.toFixed(2), best: 'high' },
  ] as const;

  const getBestValue = (key: string, best: string) => {
    const values = runs.map(r => r.result[key as keyof typeof r.result] as number);
    if (best === 'high') return Math.max(...values);
    if (best === 'low') return Math.min(...values);
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          Strategy Comparison
          <Badge variant="secondary" className="ml-auto">{runs.length} runs</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Strategy</th>
                {metrics.map(m => (
                  <th key={m.key} className="text-right py-2 px-2 text-muted-foreground font-medium">{m.label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2 px-2">
                    <div>
                      <span className="font-medium">{run.name}</span>
                      <div className="text-xs text-muted-foreground">
                        SMA {run.config.fastSMA}/{run.config.slowSMA} • {run.config.timeframe}
                      </div>
                    </div>
                  </td>
                  {metrics.map(m => {
                    const value = run.result[m.key as keyof typeof run.result] as number;
                    const bestValue = getBestValue(m.key, m.best);
                    const isBest = bestValue !== null && value === bestValue && runs.length > 1;
                    return (
                      <td 
                        key={m.key} 
                        className={cn(
                          "text-right py-2 px-2",
                          isBest && m.best === 'high' && "text-trading-profit font-medium",
                          isBest && m.best === 'low' && "text-trading-profit font-medium",
                          m.key === 'totalPnlPercent' && value >= 0 && "text-trading-profit",
                          m.key === 'totalPnlPercent' && value < 0 && "text-trading-loss",
                        )}
                      >
                        {m.format(value)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(run.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Backtest() {
  const { isRunning, progress, result, error, runBacktest, reset } = useBacktest();
  
  // Config state
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '4h'>('15m');
  const [enabledAssets, setEnabledAssets] = useState<Asset[]>(['BTCUSDT', 'XRPUSDT']);
  const [fastSMA, setFastSMA] = useState(20);
  const [slowSMA, setSlowSMA] = useState(50);
  const [initialBalance, setInitialBalance] = useState(10000);
  const [positionSizePercent, setPositionSizePercent] = useState(5);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);

  // Saved runs state
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());
  const [showComparison, setShowComparison] = useState(false);

  const saveCurrentRun = () => {
    if (!result) return;
    
    const runName = `SMA ${fastSMA}/${slowSMA} ${timeframe}`;
    const newRun: SavedRun = {
      id: `run-${Date.now()}`,
      name: runName,
      savedAt: Date.now(),
      config: {
        assets: enabledAssets,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeframe,
        fastSMA,
        slowSMA,
        initialBalance,
        positionSizePercent,
        stopLossPercent,
        takeProfitPercent,
      },
      result: {
        finalBalance: result.finalBalance,
        totalPnl: result.totalPnl,
        totalPnlPercent: result.totalPnlPercent,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        maxDrawdown: result.maxDrawdown,
        profitFactor: result.profitFactor,
        sharpeRatio: result.sharpeRatio,
      },
    };

    const updatedRuns = [...savedRuns, newRun];
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  };

  const deleteRun = (id: string) => {
    const updatedRuns = savedRuns.filter(r => r.id !== id);
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  };

  const clearAllRuns = () => {
    setSavedRuns([]);
    saveSavedRuns([]);
    setShowComparison(false);
  };

  const toggleAsset = (asset: Asset) => {
    setEnabledAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleRunBacktest = () => {
    if (enabledAssets.length === 0) return;
    
    const config: BacktestConfig = {
      assets: enabledAssets,
      startDate,
      endDate,
      timeframe,
      fastSMA,
      slowSMA,
      initialBalance,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent,
      feePercent: 0.1,
    };

    runBacktest(config);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold md:text-xl">Strategy Backtester</h1>
              <p className="text-xs text-muted-foreground">Test your SMA crossover strategy on historical data</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Backtest Configuration</CardTitle>
              <CardDescription>Configure your strategy parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date > endDate || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date < startDate || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Timeframe */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timeframe</Label>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trading Pairs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]).map((asset) => (
                    <div key={asset} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                      <span className="text-sm font-medium">{ASSET_INFO[asset].symbol}</span>
                      <Switch
                        checked={enabledAssets.includes(asset)}
                        onCheckedChange={() => toggleAsset(asset)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* SMA Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">SMA Indicators</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fast SMA</Label>
                    <Input
                      type="number"
                      value={fastSMA}
                      onChange={(e) => setFastSMA(parseInt(e.target.value) || 20)}
                      min={5}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Slow SMA</Label>
                    <Input
                      type="number"
                      value={slowSMA}
                      onChange={(e) => setSlowSMA(parseInt(e.target.value) || 50)}
                      min={10}
                      max={200}
                    />
                  </div>
                </div>
              </div>

              {/* Risk Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Risk Management</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Initial Balance ($)</Label>
                    <Input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(parseInt(e.target.value) || 10000)}
                      min={1000}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Position Size (%)</Label>
                    <Input
                      type="number"
                      value={positionSizePercent}
                      onChange={(e) => setPositionSizePercent(parseInt(e.target.value) || 5)}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Stop Loss (%)</Label>
                    <Input
                      type="number"
                      value={stopLossPercent}
                      onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || 2)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Take Profit (%)</Label>
                    <Input
                      type="number"
                      value={takeProfitPercent}
                      onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value) || 4)}
                      min={0.5}
                      max={50}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleRunBacktest}
                    disabled={isRunning || enabledAssets.length === 0}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>Running...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Backtest
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {result && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={saveCurrentRun}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save for Comparison
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportResultToCSV(result, { fastSMA, slowSMA, timeframe })}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Saved Runs */}
              {savedRuns.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Saved Runs ({savedRuns.length})</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={clearAllRuns}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={showComparison ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowComparison(!showComparison)}
                      className="flex-1"
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      {showComparison ? 'Hide Comparison' : 'Compare Runs'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportComparisonToCSV(savedRuns)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Fetching historical data... {progress.toFixed(0)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategy Optimizer */}
          <StrategyOptimizer
            assets={enabledAssets}
            startDate={startDate}
            endDate={endDate}
            timeframe={timeframe}
            initialBalance={initialBalance}
            positionSizePercent={positionSizePercent}
            stopLossPercent={stopLossPercent}
            takeProfitPercent={takeProfitPercent}
            currentFastSMA={fastSMA}
            currentSlowSMA={slowSMA}
            onApplyOptimal={(fast, slow) => {
              setFastSMA(fast);
              setSlowSMA(slow);
            }}
          />

          {/* Walk-Forward Analysis */}
          <WalkForwardAnalysis
            assets={enabledAssets}
            startDate={startDate}
            endDate={endDate}
            timeframe={timeframe}
            initialBalance={initialBalance}
            positionSizePercent={positionSizePercent}
            stopLossPercent={stopLossPercent}
            takeProfitPercent={takeProfitPercent}
            fastSMARange={{ min: 5, max: 30, step: 5 }}
            slowSMARange={{ min: 20, max: 100, step: 10 }}
          />

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {!result && !isRunning && !error && !showComparison && (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Backtest</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Configure your strategy parameters and click "Run Backtest" to simulate 
                    your SMA crossover strategy on historical market data.
                  </p>
                </CardContent>
              </Card>
            )}

            {showComparison && savedRuns.length > 0 && (
              <ComparisonTable runs={savedRuns} onRemove={deleteRun} />
            )}

            {result && !showComparison && <ResultsDisplay result={result} fastSMA={fastSMA} slowSMA={slowSMA} stopLossPercent={stopLossPercent} takeProfitPercent={takeProfitPercent} positionSizePercent={positionSizePercent} />}
          </div>
        </div>
      </main>
    </div>
  );
}