import { BacktestResult } from '@/types/backtest';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  Trophy,
  Percent,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const StaggeredSection = ({ children, index }: { children: React.ReactNode; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);


interface ResultsDisplayProps {
  result: BacktestResult;
  fastSMA: number;
  slowSMA: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSizePercent: number;
}

export function ResultsDisplay({ 
  result, 
  fastSMA, 
  slowSMA, 
  stopLossPercent, 
  takeProfitPercent, 
  positionSizePercent 
}: ResultsDisplayProps) {
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
    </motion.div>
  );
}
