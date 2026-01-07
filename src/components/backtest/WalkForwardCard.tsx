import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BacktestResult } from '@/hooks/useBacktest';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { Layers, Trophy, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalkForwardWindow {
  id: number;
  startDate: Date;
  endDate: Date;
  trades: BacktestResult['trades'];
  pnl: number;
  pnlPercent: number;
  winRate: number;
  tradeCount: number;
}

interface WalkForwardResult {
  windows: WalkForwardWindow[];
  consistency: number;
  avgReturn: number;
  avgWinRate: number;
  bestWindow: WalkForwardWindow | null;
  worstWindow: WalkForwardWindow | null;
}

function analyzeWalkForward(trades: BacktestResult['trades'], windowCount: number = 4): WalkForwardResult {
  if (trades.length < windowCount) {
    return {
      windows: [],
      consistency: 0,
      avgReturn: 0,
      avgWinRate: 0,
      bestWindow: null,
      worstWindow: null
    };
  }

  const sortedTrades = [...trades].sort((a, b) => a.entryTime - b.entryTime);
  
  const startTime = sortedTrades[0].entryTime;
  const endTime = sortedTrades[sortedTrades.length - 1].exitTime;
  const totalDuration = endTime - startTime;
  const windowDuration = totalDuration / windowCount;

  const windows: WalkForwardWindow[] = [];

  for (let i = 0; i < windowCount; i++) {
    const windowStart = startTime + (i * windowDuration);
    const windowEnd = startTime + ((i + 1) * windowDuration);
    
    const windowTrades = sortedTrades.filter(
      t => t.entryTime >= windowStart && t.entryTime < windowEnd
    );
    
    const pnl = windowTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = windowTrades.filter(t => t.type === 'win').length;
    const winRate = windowTrades.length > 0 ? (wins / windowTrades.length) * 100 : 0;

    windows.push({
      id: i + 1,
      startDate: new Date(windowStart),
      endDate: new Date(windowEnd),
      trades: windowTrades,
      pnl,
      pnlPercent: 0,
      winRate,
      tradeCount: windowTrades.length
    });
  }

  const totalPnl = windows.reduce((sum, w) => sum + Math.abs(w.pnl), 0) || 1;
  windows.forEach(w => {
    w.pnlPercent = (w.pnl / (totalPnl / windows.length)) * 100 - 100;
  });

  const profitableWindows = windows.filter(w => w.pnl > 0).length;
  const consistency = (profitableWindows / windows.length) * 100;
  const avgReturn = windows.reduce((sum, w) => sum + w.pnl, 0) / windows.length;
  const avgWinRate = windows.reduce((sum, w) => sum + w.winRate, 0) / windows.length;

  const sortedByPnl = [...windows].sort((a, b) => b.pnl - a.pnl);

  return {
    windows,
    consistency,
    avgReturn,
    avgWinRate,
    bestWindow: sortedByPnl[0] || null,
    worstWindow: sortedByPnl[sortedByPnl.length - 1] || null
  };
}

export function WalkForwardCard({ trades }: { trades: BacktestResult['trades'] }) {
  const [windowCount, setWindowCount] = useState(4);
  const analysis = analyzeWalkForward(trades, windowCount);

  if (trades.length < 4) return null;

  const maxAbsPnl = Math.max(...analysis.windows.map(w => Math.abs(w.pnl)), 1);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-500" />
              Walk-Forward Analysis
            </CardTitle>
            <CardDescription>Strategy performance across time windows</CardDescription>
          </div>
          <Select value={windowCount.toString()} onValueChange={(v) => setWindowCount(parseInt(v))}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Windows</SelectItem>
              <SelectItem value="4">4 Windows</SelectItem>
              <SelectItem value="5">5 Windows</SelectItem>
              <SelectItem value="6">6 Windows</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {analysis.windows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Not enough trades for walk-forward analysis</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Consistency</p>
                <p className={cn(
                  "text-lg font-bold",
                  analysis.consistency >= 75 ? "text-trading-profit" : 
                  analysis.consistency >= 50 ? "text-yellow-500" : "text-trading-loss"
                )}>
                  {analysis.consistency.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">profitable windows</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Avg Return/Window</p>
                <p className={cn(
                  "text-lg font-bold",
                  analysis.avgReturn >= 0 ? "text-trading-profit" : "text-trading-loss"
                )}>
                  {analysis.avgReturn >= 0 ? '+' : ''}{formatCurrency(analysis.avgReturn)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Avg Win Rate</p>
                <p className={cn(
                  "text-lg font-bold",
                  analysis.avgWinRate >= 50 ? "text-trading-profit" : "text-trading-loss"
                )}>
                  {analysis.avgWinRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Window Performance Chart */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Performance by Window</Label>
              <div className="space-y-2">
                {analysis.windows.map((window) => {
                  const barWidth = (Math.abs(window.pnl) / maxAbsPnl) * 100;
                  const isProfit = window.pnl >= 0;
                  
                  return (
                    <div key={window.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Window {window.id}: {format(window.startDate, 'MMM dd')} - {format(window.endDate, 'MMM dd')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {window.tradeCount} trades
                          </Badge>
                          <span className={cn(
                            "font-medium",
                            isProfit ? "text-trading-profit" : "text-trading-loss"
                          )}>
                            {isProfit ? '+' : ''}{formatCurrency(window.pnl)}
                          </span>
                        </div>
                      </div>
                      <div className="h-4 bg-secondary/30 rounded overflow-hidden relative">
                        <div 
                          className={cn(
                            "h-full rounded transition-all",
                            isProfit ? "bg-trading-profit/60" : "bg-trading-loss/60"
                          )}
                          style={{ width: `${barWidth}%` }}
                        />
                        <span className="absolute right-2 top-0.5 text-[10px] text-muted-foreground">
                          WR: {window.winRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best/Worst Windows */}
            {analysis.bestWindow && analysis.worstWindow && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg border border-trading-profit/30 bg-trading-profit/5">
                  <div className="flex items-center gap-1.5 text-xs text-trading-profit mb-1">
                    <Trophy className="h-3 w-3" />
                    <span className="font-medium">Best Window</span>
                  </div>
                  <p className="text-sm font-bold text-trading-profit">
                    +{formatCurrency(analysis.bestWindow.pnl)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Window {analysis.bestWindow.id} • {analysis.bestWindow.tradeCount} trades • {analysis.bestWindow.winRate.toFixed(0)}% WR
                  </p>
                </div>
                <div className="p-2 rounded-lg border border-trading-loss/30 bg-trading-loss/5">
                  <div className="flex items-center gap-1.5 text-xs text-trading-loss mb-1">
                    <TrendingDown className="h-3 w-3" />
                    <span className="font-medium">Worst Window</span>
                  </div>
                  <p className="text-sm font-bold text-trading-loss">
                    {formatCurrency(analysis.worstWindow.pnl)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Window {analysis.worstWindow.id} • {analysis.worstWindow.tradeCount} trades • {analysis.worstWindow.winRate.toFixed(0)}% WR
                  </p>
                </div>
              </div>
            )}

            {/* Robustness Summary */}
            <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
              {analysis.consistency >= 75 ? (
                <p>
                  <strong className="text-trading-profit">Strong robustness:</strong> Strategy is profitable in {analysis.consistency.toFixed(0)}% of time windows, 
                  suggesting consistent performance across market conditions.
                </p>
              ) : analysis.consistency >= 50 ? (
                <p>
                  <strong className="text-yellow-500">Moderate robustness:</strong> Strategy shows mixed results with {analysis.consistency.toFixed(0)}% profitable windows. 
                  Consider parameter optimization or additional filters.
                </p>
              ) : (
                <p>
                  <strong className="text-trading-loss">Weak robustness:</strong> Strategy struggles with only {analysis.consistency.toFixed(0)}% profitable windows. 
                  Results may be period-dependent or overfitted.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
