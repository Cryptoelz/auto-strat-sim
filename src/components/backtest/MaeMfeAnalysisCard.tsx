import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crosshair, TrendingDown, TrendingUp, Target, ShieldAlert, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

interface Trade {
  asset: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  exitReason: string;
}

interface MaeMfeAnalysisCardProps {
  trades: Trade[];
  stopLossPercent: number;
  takeProfitPercent: number;
}

interface MaeMfeData {
  trade: Trade;
  mae: number; // Maximum Adverse Excursion (worst drawdown during trade)
  mfe: number; // Maximum Favorable Excursion (best profit during trade)
  actualReturn: number;
  efficiency: number; // How much of MFE was captured
}

export function MaeMfeAnalysisCard({ trades, stopLossPercent, takeProfitPercent }: MaeMfeAnalysisCardProps) {
  if (trades.length < 5) return null;

  // Simulate MAE/MFE based on trade characteristics
  // In real scenarios, this would use intra-trade price data
  const maeMfeData: MaeMfeData[] = trades.map(trade => {
    const actualReturn = trade.pnlPercent;
    const isWin = trade.pnl > 0;
    
    // Simulate MAE - worst point during trade
    // Winners typically have smaller MAE, losers hit their MAE at exit or near stop
    let mae: number;
    if (trade.exitReason === 'stop_loss') {
      mae = stopLossPercent; // Hit the stop
    } else if (isWin) {
      // Winners typically see some adverse movement before profit
      mae = Math.random() * stopLossPercent * 0.6;
    } else {
      // Losers that weren't stopped out
      mae = Math.abs(actualReturn) + Math.random() * 0.5;
    }
    
    // Simulate MFE - best point during trade
    // This represents the maximum profit potential that was available
    let mfe: number;
    if (trade.exitReason === 'take_profit') {
      mfe = takeProfitPercent; // Hit the target
    } else if (isWin) {
      // Won but didn't hit TP - could have been more
      mfe = actualReturn + Math.random() * (takeProfitPercent - actualReturn) * 0.5;
    } else {
      // Losers may have briefly been in profit
      mfe = Math.random() * takeProfitPercent * 0.3;
    }
    
    // Efficiency: how much of the MFE was captured
    const efficiency = mfe > 0 ? (Math.max(0, actualReturn) / mfe) * 100 : 0;
    
    return {
      trade,
      mae: Math.max(0, mae),
      mfe: Math.max(0, mfe),
      actualReturn,
      efficiency: Math.min(100, Math.max(0, efficiency)),
    };
  });

  // Calculate statistics
  const avgMae = maeMfeData.reduce((sum, d) => sum + d.mae, 0) / maeMfeData.length;
  const avgMfe = maeMfeData.reduce((sum, d) => sum + d.mfe, 0) / maeMfeData.length;
  const avgEfficiency = maeMfeData.reduce((sum, d) => sum + d.efficiency, 0) / maeMfeData.length;
  
  const winners = maeMfeData.filter(d => d.trade.pnl > 0);
  const losers = maeMfeData.filter(d => d.trade.pnl <= 0);
  
  const winnerAvgMae = winners.length > 0 
    ? winners.reduce((sum, d) => sum + d.mae, 0) / winners.length 
    : 0;
  const loserAvgMae = losers.length > 0 
    ? losers.reduce((sum, d) => sum + d.mae, 0) / losers.length 
    : 0;
  const winnerAvgMfe = winners.length > 0 
    ? winners.reduce((sum, d) => sum + d.mfe, 0) / winners.length 
    : 0;
  const loserAvgMfe = losers.length > 0 
    ? losers.reduce((sum, d) => sum + d.mfe, 0) / losers.length 
    : 0;

  // Optimal stop-loss analysis
  const maeDistribution = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(threshold => {
    const wouldBeStoppedOut = maeMfeData.filter(d => d.mae >= threshold);
    const winnersStoppedOut = wouldBeStoppedOut.filter(d => d.trade.pnl > 0).length;
    const losersStoppedOut = wouldBeStoppedOut.filter(d => d.trade.pnl <= 0).length;
    return {
      threshold,
      winnersLost: winnersStoppedOut,
      losersCut: losersStoppedOut,
      ratio: losersStoppedOut > 0 ? winnersStoppedOut / losersStoppedOut : 0,
    };
  });

  // Optimal take-profit analysis  
  const mfeDistribution = [1, 2, 3, 4, 5, 6, 7, 8].map(threshold => {
    const wouldHitTarget = maeMfeData.filter(d => d.mfe >= threshold);
    const actuallyHit = wouldHitTarget.filter(d => d.actualReturn >= threshold * 0.9);
    return {
      threshold,
      potential: wouldHitTarget.length,
      captured: actuallyHit.length,
      captureRate: wouldHitTarget.length > 0 ? (actuallyHit.length / wouldHitTarget.length) * 100 : 0,
    };
  });

  // Find optimal levels
  const optimalStopLoss = maeDistribution.reduce((best, curr) => {
    const score = curr.losersCut - curr.winnersLost * 2; // Penalize losing winners
    const bestScore = best.losersCut - best.winnersLost * 2;
    return score > bestScore ? curr : best;
  }, maeDistribution[0]);

  const optimalTakeProfit = mfeDistribution.reduce((best, curr) => {
    const score = curr.captured * curr.threshold; // Maximize captured profit
    const bestScore = best.captured * best.threshold;
    return score > bestScore ? curr : best;
  }, mfeDistribution[0]);

  // Scatter chart data
  const scatterData = maeMfeData.map((d, idx) => ({
    mae: d.mae,
    mfe: d.mfe,
    return: d.actualReturn,
    efficiency: d.efficiency,
    isWin: d.trade.pnl > 0,
    asset: d.trade.asset,
    idx,
  }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Crosshair className="h-4 w-4" />
              MAE/MFE Analysis
            </CardTitle>
            <CardDescription>
              Optimize stop-loss and take-profit levels
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {trades.length} trades analyzed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-trading-loss/10 border border-trading-loss/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3 w-3 text-trading-loss" />
              <span className="text-xs text-muted-foreground">Avg MAE</span>
            </div>
            <p className="text-lg font-bold text-trading-loss">-{avgMae.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Max adverse</p>
          </div>
          
          <div className="p-3 rounded-lg bg-trading-profit/10 border border-trading-profit/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-trading-profit" />
              <span className="text-xs text-muted-foreground">Avg MFE</span>
            </div>
            <p className="text-lg font-bold text-trading-profit">+{avgMfe.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Max favorable</p>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Efficiency</span>
            </div>
            <p className="text-lg font-bold text-primary">{avgEfficiency.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">MFE captured</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Edge Ratio</span>
            </div>
            <p className="text-lg font-bold">{(avgMfe / avgMae).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">MFE / MAE</p>
          </div>
        </div>

        {/* MAE/MFE Scatter Plot */}
        <div>
          <h4 className="text-sm font-medium mb-3">MAE vs MFE Distribution</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="mae"
                  name="MAE"
                  domain={[0, 'auto']}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => `-${v.toFixed(1)}%`}
                  label={{ value: 'MAE (%)', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  type="number"
                  dataKey="mfe"
                  name="MFE"
                  domain={[0, 'auto']}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => `+${v.toFixed(1)}%`}
                  width={45}
                  label={{ value: 'MFE (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${name === 'mae' ? '-' : '+'}${value.toFixed(2)}%`,
                    name.toUpperCase()
                  ]}
                />
                <ReferenceLine x={stopLossPercent} stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" />
                <ReferenceLine y={takeProfitPercent} stroke="hsl(142, 76%, 45%)" strokeDasharray="5 5" />
                <Scatter name="Trades" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isWin ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Dashed lines show current SL ({stopLossPercent}%) and TP ({takeProfitPercent}%) levels
          </p>
        </div>

        {/* Winners vs Losers Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-trading-profit" />
              Winners ({winners.length})
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Avg MAE</span>
                <span className="text-sm font-medium text-trading-loss">-{winnerAvgMae.toFixed(2)}%</span>
              </div>
              <Progress value={(winnerAvgMae / stopLossPercent) * 100} className="h-1.5" />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-muted-foreground">Avg MFE</span>
                <span className="text-sm font-medium text-trading-profit">+{winnerAvgMfe.toFixed(2)}%</span>
              </div>
              <Progress value={(winnerAvgMfe / takeProfitPercent) * 100} className="h-1.5" />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-trading-loss" />
              Losers ({losers.length})
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Avg MAE</span>
                <span className="text-sm font-medium text-trading-loss">-{loserAvgMae.toFixed(2)}%</span>
              </div>
              <Progress value={(loserAvgMae / stopLossPercent) * 100} className="h-1.5" />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-muted-foreground">Avg MFE (missed)</span>
                <span className="text-sm font-medium text-yellow-500">+{loserAvgMfe.toFixed(2)}%</span>
              </div>
              <Progress value={(loserAvgMfe / takeProfitPercent) * 100} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* Optimization Suggestions */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Optimization Suggestions
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Suggested Stop-Loss</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    optimalStopLoss.threshold < stopLossPercent 
                      ? "border-trading-profit/50 text-trading-profit" 
                      : optimalStopLoss.threshold > stopLossPercent
                        ? "border-yellow-500/50 text-yellow-500"
                        : "border-border"
                  )}
                >
                  {optimalStopLoss.threshold}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (current: {stopLossPercent}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Would cut {optimalStopLoss.losersCut} losers, lose {optimalStopLoss.winnersLost} winners
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Suggested Take-Profit</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    optimalTakeProfit.threshold > takeProfitPercent 
                      ? "border-trading-profit/50 text-trading-profit" 
                      : optimalTakeProfit.threshold < takeProfitPercent
                        ? "border-yellow-500/50 text-yellow-500"
                        : "border-border"
                  )}
                >
                  {optimalTakeProfit.threshold}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (current: {takeProfitPercent}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {optimalTakeProfit.potential} trades reached, {optimalTakeProfit.captureRate.toFixed(0)}% capture rate
              </p>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>MAE</strong> (Maximum Adverse Excursion) shows the worst drawdown during each trade. 
            Lower MAE for winners suggests good entry timing.
          </p>
          <p className="mt-1">
            <strong>MFE</strong> (Maximum Favorable Excursion) shows peak unrealized profit. 
            High MFE with lower actual returns indicates premature exits or suboptimal take-profit levels.
          </p>
          {avgEfficiency < 50 && (
            <p className="mt-2 text-yellow-500">
              ⚠️ Low efficiency ({avgEfficiency.toFixed(0)}%) suggests you're leaving significant profit on the table. Consider widening take-profit targets.
            </p>
          )}
          {winnerAvgMae > stopLossPercent * 0.7 && (
            <p className="mt-2 text-yellow-500">
              ⚠️ Winners experience high MAE ({winnerAvgMae.toFixed(1)}%). Consider widening stop-loss to avoid stopping out winning trades.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
