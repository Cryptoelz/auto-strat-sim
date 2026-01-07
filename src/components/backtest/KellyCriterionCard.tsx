import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BacktestResult } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';
import { Calculator, Zap, Scale, Target, AlertTriangle } from 'lucide-react';

interface KellyCriterionCardProps {
  trades: BacktestResult['trades'];
}

export function KellyCriterionCard({ trades }: KellyCriterionCardProps) {
  // Calculate Expected Value and Kelly Criterion
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  
  const totalTrades = trades.length;
  const winCount = winningTrades.length;
  
  const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
  const lossRate = 1 - winRate;
  
  // Calculate average win and loss percentages
  const avgWinPercent = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length 
    : 0;
  const avgLossPercent = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / losingTrades.length)
    : 0;
  
  // Expected Value (per trade as percentage)
  const expectedValue = (winRate * avgWinPercent) - (lossRate * avgLossPercent);
  
  // Kelly Criterion: f* = (bp - q) / b
  const winLossRatio = avgLossPercent > 0 ? avgWinPercent / avgLossPercent : 0;
  const kellyPercent = avgLossPercent > 0 
    ? ((winLossRatio * winRate - lossRate) / winLossRatio) * 100
    : 0;
  
  const halfKelly = kellyPercent / 2;
  const quarterKelly = kellyPercent / 4;
  
  const getRecommendation = () => {
    if (kellyPercent <= 0) {
      return { text: 'Kelly suggests not trading this strategy', color: 'text-trading-loss' };
    } else if (kellyPercent <= 10) {
      return { text: 'Use Half-Kelly for safer position sizing', color: 'text-yellow-500' };
    } else if (kellyPercent <= 25) {
      return { text: 'Strategy has good edge, Half-Kelly recommended', color: 'text-trading-profit' };
    } else {
      return { text: 'High Kelly suggests strong edge, but use Quarter-Kelly to reduce variance', color: 'text-violet-400' };
    }
  };
  
  const recommendation = getRecommendation();
  const sampleBalance = 10000;
  const optimalPosition = (halfKelly / 100) * sampleBalance;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Expected Value & Kelly Criterion
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="ml-auto text-xs cursor-help">Position Sizing</Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[300px]">
                <p className="font-medium mb-1">Kelly Criterion</p>
                <p className="text-xs text-muted-foreground">
                  The Kelly formula determines the optimal bet size to maximize long-term growth while avoiding ruin.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Optimal position sizing based on edge and win rate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="p-3 rounded-lg border border-border/50 bg-secondary/20">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 cursor-help">
                      <Zap className="h-3 w-3" />
                      <span className="underline decoration-dotted underline-offset-2">Expected Value</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p className="text-xs">Average expected return per trade. Positive EV means profitable strategy.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <p className={cn("text-lg font-bold", expectedValue >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(2)}%
              </p>
              <p className="text-[10px] text-muted-foreground">per trade</p>
            </div>
            
            <div className="p-3 rounded-lg border border-border/50 bg-secondary/20">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 cursor-help">
                      <Scale className="h-3 w-3" />
                      <span className="underline decoration-dotted underline-offset-2">Full Kelly</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p className="text-xs">Maximum optimal position size. Very aggressive with high variance.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <p className={cn("text-lg font-bold", kellyPercent > 0 ? "text-foreground" : "text-trading-loss")}>
                {kellyPercent.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground">of portfolio</p>
            </div>
            
            <div className="p-3 rounded-lg border border-trading-profit/30 bg-trading-profit/5">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-trading-profit mb-1 cursor-help">
                      <Target className="h-3 w-3" />
                      <span className="underline decoration-dotted underline-offset-2 font-medium">Half-Kelly ★</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p className="text-xs">Industry standard. Achieves 75% of optimal growth with much lower risk.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <p className="text-lg font-bold text-trading-profit">{halfKelly > 0 ? halfKelly.toFixed(1) : '0.0'}%</p>
              <p className="text-[10px] text-muted-foreground">recommended</p>
            </div>
            
            <div className="p-3 rounded-lg border border-border/50 bg-secondary/20">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 cursor-help">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="underline decoration-dotted underline-offset-2">Quarter-Kelly</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p className="text-xs">Very conservative sizing. Slower growth but significant drawdown protection.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <p className="text-lg font-bold text-foreground">{quarterKelly > 0 ? quarterKelly.toFixed(1) : '0.0'}%</p>
              <p className="text-[10px] text-muted-foreground">conservative</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
            <div className="text-center p-2 rounded bg-secondary/30">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="font-medium">{(winRate * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 rounded bg-secondary/30">
              <p className="text-xs text-muted-foreground">Avg Win</p>
              <p className="font-medium text-trading-profit">+{avgWinPercent.toFixed(2)}%</p>
            </div>
            <div className="text-center p-2 rounded bg-secondary/30">
              <p className="text-xs text-muted-foreground">Avg Loss</p>
              <p className="font-medium text-trading-loss">-{avgLossPercent.toFixed(2)}%</p>
            </div>
            <div className="text-center p-2 rounded bg-secondary/30">
              <p className="text-xs text-muted-foreground">Win/Loss Ratio</p>
              <p className="font-medium">{winLossRatio.toFixed(2)}</p>
            </div>
          </div>
          
          {halfKelly > 0 && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Example: $10,000 Account</p>
                  <p className="text-xs text-muted-foreground">Using Half-Kelly position sizing</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatCurrency(optimalPosition)}</p>
                  <p className="text-xs text-muted-foreground">per trade</p>
                </div>
              </div>
            </div>
          )}
          
          <div className={cn("text-xs p-3 rounded-lg", kellyPercent <= 0 ? "bg-trading-loss/10 border border-trading-loss/30" : "bg-secondary/20")}>
            <p className={recommendation.color}>
              <strong>Recommendation:</strong> {recommendation.text}
            </p>
            {expectedValue > 0 && (
              <p className="text-muted-foreground mt-1">
                With {totalTrades} trades at {(winRate * 100).toFixed(0)}% win rate and {winLossRatio.toFixed(1)}x reward/risk, 
                your edge suggests {halfKelly > 0 ? `risking ${halfKelly.toFixed(1)}% per trade` : 'reducing exposure'}.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
