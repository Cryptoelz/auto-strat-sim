import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, HelpCircle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface RiskOfRuinCardProps {
  trades: BacktestTrade[];
}

interface RiskMetrics {
  winRate: number;
  avgWinPercent: number;
  avgLossPercent: number;
  winLossRatio: number;
  riskOfRuin: number;
  expectedDrawdown: number;
  tradesUntilRuin: number;
}

function calculateRiskOfRuin(
  winRate: number,
  avgWinPercent: number,
  avgLossPercent: number,
  ruinThreshold: number,
  positionSize: number
): RiskMetrics {
  const p = winRate / 100; // Probability of win
  const q = 1 - p; // Probability of loss
  
  const avgWin = avgWinPercent * (positionSize / 100);
  const avgLoss = Math.abs(avgLossPercent) * (positionSize / 100);
  
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  // Risk of Ruin formula using the simplified approximation
  // RoR = ((1 - edge) / (1 + edge))^units
  // where edge = (p * W) - (q * L) and units = ruinThreshold / avgLoss
  
  const edge = (p * avgWin) - (q * avgLoss);
  const units = ruinThreshold / avgLoss;
  
  let riskOfRuin: number;
  let tradesUntilRuin: number;
  
  if (edge <= 0) {
    // Negative edge means eventual ruin is certain
    riskOfRuin = 100;
    tradesUntilRuin = Math.ceil(ruinThreshold / avgLoss);
  } else if (avgLoss === 0) {
    riskOfRuin = 0;
    tradesUntilRuin = Infinity;
  } else {
    // Using the more accurate formula for risk of ruin
    // Based on gambler's ruin problem
    const a = avgWin / avgLoss;
    
    if (p * a === q) {
      // Special case: edge is exactly zero
      riskOfRuin = 100 * (1 - (1 / units));
    } else {
      const ratio = q / (p * a);
      if (ratio >= 1) {
        riskOfRuin = 100;
      } else {
        riskOfRuin = Math.min(100, Math.max(0, 100 * Math.pow(ratio, units)));
      }
    }
    
    // Estimate trades until ruin (based on random walk)
    const expectedPnlPerTrade = edge;
    tradesUntilRuin = expectedPnlPerTrade > 0 
      ? Math.ceil(ruinThreshold / (avgLoss * q)) 
      : Math.ceil(ruinThreshold / avgLoss);
  }
  
  // Expected maximum drawdown approximation
  const expectedDrawdown = Math.min(ruinThreshold, (q * avgLoss * 2) / (edge > 0 ? edge : 0.01) * 100);
  
  return {
    winRate: p * 100,
    avgWinPercent: avgWin,
    avgLossPercent: avgLoss,
    winLossRatio,
    riskOfRuin: Math.min(100, Math.max(0, riskOfRuin)),
    expectedDrawdown: Math.min(100, Math.max(0, expectedDrawdown)),
    tradesUntilRuin: Math.min(10000, tradesUntilRuin),
  };
}

export function RiskOfRuinCard({ trades }: RiskOfRuinCardProps) {
  const [ruinThreshold, setRuinThreshold] = useState(50); // Default 50% loss
  const [positionSize, setPositionSize] = useState(2); // Default 2% position size

  const metrics = useMemo(() => {
    if (trades.length < 5) return null;

    const winningTrades = trades.filter(t => t.type === 'win');
    const losingTrades = trades.filter(t => t.type === 'loss');

    if (losingTrades.length === 0) return null;

    const winRate = (winningTrades.length / trades.length) * 100;

    const avgWinPercent = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => {
          const percent = (t.pnl / (t.entryPrice * t.size)) * 100;
          return sum + percent;
        }, 0) / winningTrades.length
      : 0;

    const avgLossPercent = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => {
          const percent = (t.pnl / (t.entryPrice * t.size)) * 100;
          return sum + Math.abs(percent);
        }, 0) / losingTrades.length
      : 0;

    return calculateRiskOfRuin(winRate, avgWinPercent, avgLossPercent, ruinThreshold, positionSize);
  }, [trades, ruinThreshold, positionSize]);

  if (!metrics) return null;

  const getRiskLevel = (ror: number) => {
    if (ror < 1) return { label: 'Very Low', color: 'text-green-500', bg: 'bg-green-500', icon: ShieldCheck };
    if (ror < 5) return { label: 'Low', color: 'text-green-400', bg: 'bg-green-400', icon: Shield };
    if (ror < 15) return { label: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500', icon: Shield };
    if (ror < 30) return { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500', icon: ShieldAlert };
    return { label: 'Very High', color: 'text-red-500', bg: 'bg-red-500', icon: AlertTriangle };
  };

  const riskLevel = getRiskLevel(metrics.riskOfRuin);
  const RiskIcon = riskLevel.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5" />
          Risk of Ruin Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Risk of Ruin calculates the probability of losing a specified percentage of your account based on your strategy's win rate, average win/loss, and position sizing.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parameter Controls */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm">Ruin Threshold</Label>
              <span className="text-sm font-medium">{ruinThreshold}% loss</span>
            </div>
            <Slider
              value={[ruinThreshold]}
              onValueChange={(v) => setRuinThreshold(v[0])}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Account loss level considered as "ruin"
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm">Position Size</Label>
              <span className="text-sm font-medium">{positionSize}% per trade</span>
            </div>
            <Slider
              value={[positionSize]}
              onValueChange={(v) => setPositionSize(v[0])}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Percentage of account risked per trade
            </p>
          </div>
        </div>

        {/* Risk of Ruin Display */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${riskLevel.bg}/20`}>
                <RiskIcon className={`h-6 w-6 ${riskLevel.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Probability of Ruin</p>
                <p className={`text-2xl font-bold ${riskLevel.color}`}>
                  {metrics.riskOfRuin < 0.01 ? '<0.01' : metrics.riskOfRuin.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevel.bg}/20 ${riskLevel.color}`}>
              {riskLevel.label} Risk
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk Level</span>
              <span className="font-medium">{metrics.riskOfRuin.toFixed(2)}%</span>
            </div>
            <Progress 
              value={Math.min(100, metrics.riskOfRuin)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Strategy Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Win Rate</p>
            <p className="font-semibold">{metrics.winRate.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Win/Loss Ratio</p>
            <p className="font-semibold">{metrics.winLossRatio.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Avg Win</p>
            <p className="font-semibold text-green-500">+{metrics.avgWinPercent.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Avg Loss</p>
            <p className="font-semibold text-red-500">-{metrics.avgLossPercent.toFixed(2)}%</p>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground mb-1">Expected Trades Until Ruin</p>
            <p className="text-lg font-semibold">
              {metrics.tradesUntilRuin === Infinity || metrics.tradesUntilRuin > 9999
                ? '10,000+'
                : metrics.tradesUntilRuin.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground mb-1">Edge per Trade</p>
            <p className={`text-lg font-semibold ${
              (metrics.winRate/100 * metrics.avgWinPercent) - ((1-metrics.winRate/100) * metrics.avgLossPercent) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {((metrics.winRate/100 * metrics.avgWinPercent) - ((1-metrics.winRate/100) * metrics.avgLossPercent)).toFixed(3)}%
            </p>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.riskOfRuin < 1 ? (
            <p>Excellent risk profile. With current parameters, the probability of losing {ruinThreshold}% of your account is negligible. Your edge and position sizing provide strong protection.</p>
          ) : metrics.riskOfRuin < 5 ? (
            <p>Good risk management. There's a small but real chance of significant drawdown. Consider maintaining current position sizing or reducing slightly for added safety.</p>
          ) : metrics.riskOfRuin < 15 ? (
            <p>Moderate risk level. Consider reducing position size to {Math.max(0.5, positionSize - 0.5)}% or improving win rate/ratio to lower ruin probability.</p>
          ) : metrics.riskOfRuin < 30 ? (
            <p>High risk of significant losses. Strongly recommend reducing position size and reviewing strategy parameters before live trading.</p>
          ) : (
            <p>⚠️ Very high risk of ruin. This strategy with current sizing has a significant probability of catastrophic losses. Reduce position size immediately or reconsider the strategy.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
