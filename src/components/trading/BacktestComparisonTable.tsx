import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { loadExperimentStore } from '@/lib/experimentEngine';
import { ExperimentRun } from '@/types/experiment';
import { Trophy, TrendingUp, TrendingDown, Shield } from 'lucide-react';

interface MetricDef {
  key: keyof ExperimentRun['result'];
  label: string;
  format: (v: number) => string;
  higherBetter: boolean;
}

const METRICS: MetricDef[] = [
  { key: 'netPnl', label: 'Net P&L', format: v => `$${v.toFixed(0)}`, higherBetter: true },
  { key: 'maxDrawdown', label: 'Max Drawdown', format: v => `${v.toFixed(1)}%`, higherBetter: false },
  { key: 'tradeCount', label: 'Total Trades', format: v => String(v), higherBetter: true },
  { key: 'winRate', label: 'Win Rate', format: v => `${v.toFixed(1)}%`, higherBetter: true },
  { key: 'profitFactor', label: 'Profit Factor', format: v => v.toFixed(2), higherBetter: true },
];

function bestValue(runs: ExperimentRun[], key: keyof ExperimentRun['result'], higherBetter: boolean): number {
  const values = runs.map(r => r.result[key] as number);
  return higherBetter ? Math.max(...values) : Math.min(...values);
}

export function BacktestComparisonTable() {
  const runs = useMemo(() => {
    const store = loadExperimentStore();
    const names = ['Baseline v9', 'Baseline v8', 'Baseline v7', 'Baseline v6', 'Baseline v5', 'Baseline v4', 'Baseline v3', 'Baseline v2', 'Baseline v1', 'Candidate 2', 'Candidate 3', 'Candidate 4', 'Candidate 6', 'Candidate 13', 'Mean Reversion', 'Candidate 15', 'Candidate 16', 'Candidate 18', 'Candidate 19', 'Candidate 20'];
    return store.runs
      .filter(r => names.some(n => r.name.includes(n)))
      .sort((a, b) => {
        const ia = names.findIndex(n => a.name.includes(n));
        const ib = names.findIndex(n => b.name.includes(n));
        return ia - ib;
      });
  }, []);

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No experiment runs found. Navigate to Promotion to seed configurations.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" />
          Backtest Comparison
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Side-by-side results for all configurations. Best value per metric highlighted.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Configuration</TableHead>
                {METRICS.map(m => (
                  <TableHead key={m.key} className="text-right min-w-[100px]">{m.label}</TableHead>
                ))}
                <TableHead className="min-w-[200px]">Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => (
                <TableRow key={run.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {run.isBaseline && <Shield className="h-3.5 w-3.5 text-primary" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">{run.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {Object.entries(run.config.strategyParams.sma_crossover || {})
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      </div>
                      {run.isBaseline && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                          BASELINE
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {METRICS.map(m => {
                    const val = run.result[m.key] as number;
                    const best = bestValue(runs, m.key, m.higherBetter);
                    const isBest = val === best;
                    const baselineRun = runs.find(r => r.isBaseline);
                    const baselineVal = baselineRun ? baselineRun.result[m.key] as number : val;
                    const diff = val - baselineVal;
                    const improved = m.higherBetter ? diff > 0 : diff < 0;
                    const isBaseline = run.isBaseline;

                    return (
                      <TableCell key={m.key} className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={cn(
                            'text-sm font-mono font-medium',
                            isBest ? 'text-primary' : 'text-foreground',
                          )}>
                            {m.format(val)}
                            {isBest && ' ★'}
                          </span>
                          {!isBaseline && diff !== 0 && (
                            <span className={cn(
                              'text-[10px] flex items-center gap-0.5',
                              improved ? 'text-primary' : 'text-destructive',
                            )}>
                              {improved
                                ? <TrendingUp className="h-2.5 w-2.5" />
                                : <TrendingDown className="h-2.5 w-2.5" />}
                              {diff > 0 ? '+' : ''}{m.key === 'netPnl' ? `$${diff.toFixed(0)}` : `${diff.toFixed(1)}`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <p className="text-[11px] text-muted-foreground leading-tight max-w-[220px]">
                      {run.result.summaryCommentary.slice(0, 120)}
                      {run.result.summaryCommentary.length > 120 ? '…' : ''}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-3 rounded-md bg-muted/50 border border-border">
          <p className="text-xs font-medium text-foreground mb-1">Key Observations</p>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
            <li>★ marks the best value per metric across all configurations.</li>
            <li>Deltas shown relative to Baseline v1.</li>
            <li>No candidate has been promoted — all remain under evaluation.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
