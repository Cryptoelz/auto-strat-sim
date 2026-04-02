import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  FlaskConical, Loader2, Trophy, AlertTriangle, Shield, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  PREDEFINED_SCENARIOS, generateSyntheticCandles, runScenarioBacktest,
} from '@/lib/scenarioEngine';
import { DEFAULT_SCENARIO_CONFIG, ScenarioDefinition } from '@/types/scenario';

// ─── Config Definitions ──────────────────────────────────────────────────────

interface CandidateConfig {
  name: string;
  shortName: string;
  fastSMA: number;
  slowSMA: number;
  stopLoss: number;
  takeProfit: number;
  cooldown: number;
  isBaseline: boolean;
}

const CANDIDATES: CandidateConfig[] = [
  { name: 'Baseline v7 — Trailing Stop', shortName: 'Baseline v7', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: true },
  { name: 'Baseline v6 — Asset Optimized Risk (Archived)', shortName: 'Baseline v6 (Archived)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Baseline v5 — Tighter Stop Loss (Archived)', shortName: 'Baseline v5 (Archived)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Baseline v4 — Entry Confirmation (Archived)', shortName: 'Baseline v4 (Archived)', fastSMA: 10, slowSMA: 30, stopLoss: 2, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Baseline v3 — Strong Sideways Filter (Archived)', shortName: 'Baseline v3 (Archived)', fastSMA: 10, slowSMA: 30, stopLoss: 2, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Baseline v2 — Faster SMA 10/30 (Archived)', shortName: 'Baseline v2 (Archived)', fastSMA: 10, slowSMA: 30, stopLoss: 2, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Baseline v1 — SMA 20/50 (Archived)', shortName: 'Baseline v1 (Archived)', fastSMA: 20, slowSMA: 50, stopLoss: 2, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 2 — Higher Cooldown (5)', shortName: 'Cand. 2 (CD=5)', fastSMA: 20, slowSMA: 50, stopLoss: 2, takeProfit: 4, cooldown: 5, isBaseline: false },
  { name: 'Candidate 3 — Lower Cooldown (1)', shortName: 'Cand. 3 (CD=1)', fastSMA: 20, slowSMA: 50, stopLoss: 2, takeProfit: 4, cooldown: 1, isBaseline: false },
  { name: 'Candidate 4 — Sideways Filter', shortName: 'Cand. 4 (SW Filter)', fastSMA: 10, slowSMA: 30, stopLoss: 2, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 6 — Stronger Filter', shortName: 'Cand. 6 (1.3%)', fastSMA: 10, slowSMA: 30, stopLoss: 2, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 13 — Adaptive Position Sizing', shortName: 'Cand. 13 (Adaptive)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Mean Reversion — RSI + Trend Filter', shortName: 'Mean Rev (RSI)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 15 — Multi-Strategy Portfolio', shortName: 'Cand. 15 (Multi)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 16 — Weighted Multi-Strategy Portfolio', shortName: 'Cand. 16 (70/30)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 17 — Adaptive Allocation', shortName: 'Cand. 17 (Adaptive)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 18 — Real World Conditions', shortName: 'Cand. 18 (Real)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 19 — Relaxed Filter', shortName: 'Cand. 19 (0.7%)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 20 — Balanced Filter', shortName: 'Cand. 20 (0.5%)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Candidate 22 — Long + Short Strategy (Archived)', shortName: 'Cand. 22 (Archived)', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: false },
  { name: 'Baseline v11 — Smarter Shorts', shortName: 'Baseline v11', fastSMA: 10, slowSMA: 30, stopLoss: 1.5, takeProfit: 4, cooldown: 3, isBaseline: true },
];

const SCENARIO_IDS = ['strong-bull', 'strong-bear', 'sideways', 'high-vol-breakout', 'reversal-heavy'];

interface CellResult {
  netPnl: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

type ResultMatrix = Record<string, Record<string, CellResult>>; // [candidateIdx][scenarioId]

// ─── Component ───────────────────────────────────────────────────────────────

export function ScenarioComparisonTable() {
  const [results, setResults] = useState<ResultMatrix | null>(null);
  const [running, setRunning] = useState(false);

  const scenarios = PREDEFINED_SCENARIOS.filter(s => SCENARIO_IDS.includes(s.id));

  const runAll = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const matrix: ResultMatrix = {};
      CANDIDATES.forEach((cand, ci) => {
        const key = String(ci);
        matrix[key] = {};
        scenarios.forEach(sc => {
          const candles = generateSyntheticCandles(sc, 40000, DEFAULT_SCENARIO_CONFIG, 42);
          const r = runScenarioBacktest(candles, 'BTCUSDT', cand.fastSMA, cand.slowSMA, 5, cand.stopLoss, cand.takeProfit, 0.1, 1, 1, 10000);
          matrix[key][sc.id] = {
            netPnl: r.netPnl,
            maxDrawdown: r.maxDrawdown,
            winRate: r.winRate,
            totalTrades: r.totalTrades,
            profitFactor: r.profitFactor,
          };
        });
      });
      setResults(matrix);
      setRunning(false);
    }, 100);
  }, [scenarios]);

  // ─── Summary computation ───────────────────────────────────────────
  const summary = results ? computeSummary(results, scenarios) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4 text-primary" />
            Scenario Test Comparison
          </CardTitle>
          <Button size="sm" onClick={runAll} disabled={running}>
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <FlaskConical className="h-3.5 w-3.5 mr-1" />}
            {running ? 'Running…' : results ? 'Re-run' : 'Run Scenarios'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          5 market scenarios × 4 configurations. Net P&L shown per cell.
        </p>
      </CardHeader>
      <CardContent>
        {!results ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Click <strong>Run Scenarios</strong> to execute all tests.
          </div>
        ) : (
          <>
            {/* ── Matrix Table ── */}
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Configuration</TableHead>
                    {scenarios.map(sc => (
                      <TableHead key={sc.id} className="text-center min-w-[110px] text-xs">{sc.name}</TableHead>
                    ))}
                    <TableHead className="text-center min-w-[80px]">Avg P&L</TableHead>
                    <TableHead className="text-center min-w-[80px]">Worst DD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CANDIDATES.map((cand, ci) => {
                    const row = results[String(ci)];
                    const avgPnl = scenarios.reduce((s, sc) => s + row[sc.id].netPnl, 0) / scenarios.length;
                    const worstDD = Math.max(...scenarios.map(sc => row[sc.id].maxDrawdown));
                    return (
                      <TableRow key={ci}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {cand.isBaseline && <Shield className="h-3.5 w-3.5 text-primary" />}
                            <span className="text-xs font-medium text-foreground">{cand.shortName}</span>
                            {cand.isBaseline && (
                              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 px-1">BASE</Badge>
                            )}
                          </div>
                        </TableCell>
                        {scenarios.map(sc => {
                          const cell = row[sc.id];
                          const best = isBestInScenario(results, sc.id, 'netPnl', true);
                          const worst = isBestInScenario(results, sc.id, 'netPnl', false);
                          return (
                            <TableCell key={sc.id} className="text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={cn(
                                  'text-xs font-mono font-medium',
                                  cell.netPnl === best ? 'text-primary' : cell.netPnl === worst ? 'text-destructive' : 'text-foreground',
                                )}>
                                  ${cell.netPnl.toFixed(0)}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  WR {cell.winRate.toFixed(0)}% · {cell.totalTrades}t
                                </span>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <span className={cn('text-xs font-mono font-medium', avgPnl >= 0 ? 'text-primary' : 'text-destructive')}>
                            ${avgPnl.toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-mono text-destructive">{worstDD.toFixed(1)}%</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* ── Summary ── */}
            {summary && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">Summary</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SummaryCard
                      icon={<Trophy className="h-4 w-4 text-primary" />}
                      label="Best Overall"
                      value={summary.best.name}
                      detail={summary.best.reason}
                    />
                    <SummaryCard
                      icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
                      label="Worst Overall"
                      value={summary.worst.name}
                      detail={summary.worst.reason}
                    />
                    <SummaryCard
                      icon={<Shield className="h-4 w-4 text-primary" />}
                      label="Most Stable"
                      value={summary.stable.name}
                      detail={summary.stable.reason}
                    />
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 border border-border">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{summary.narrative}</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isBestInScenario(matrix: ResultMatrix, scenarioId: string, key: keyof CellResult, highest: boolean): number {
  const vals = Object.keys(matrix).map(ci => matrix[ci][scenarioId][key]);
  return highest ? Math.max(...vals) : Math.min(...vals);
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="p-3 rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
    </div>
  );
}

interface SummaryInfo { name: string; reason: string }

function computeSummary(
  matrix: ResultMatrix,
  scenarios: ScenarioDefinition[],
): { best: SummaryInfo; worst: SummaryInfo; stable: SummaryInfo; narrative: string } {
  const scores = CANDIDATES.map((cand, ci) => {
    const row = matrix[String(ci)];
    const pnls = scenarios.map(sc => row[sc.id].netPnl);
    const dds = scenarios.map(sc => row[sc.id].maxDrawdown);
    const avgPnl = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const worstDD = Math.max(...dds);
    const pnlStdDev = Math.sqrt(pnls.reduce((s, v) => s + (v - avgPnl) ** 2, 0) / pnls.length);
    const stability = pnlStdDev === 0 ? 100 : avgPnl / pnlStdDev; // Sharpe-like
    return { cand, avgPnl, worstDD, stability, pnlStdDev };
  });

  const bestIdx = scores.reduce((b, s, i) => s.avgPnl > scores[b].avgPnl ? i : b, 0);
  const worstIdx = scores.reduce((b, s, i) => s.avgPnl < scores[b].avgPnl ? i : b, 0);
  const stableIdx = scores.reduce((b, s, i) => s.stability > scores[b].stability ? i : b, 0);

  const best: SummaryInfo = {
    name: scores[bestIdx].cand.shortName,
    reason: `Highest avg P&L ($${scores[bestIdx].avgPnl.toFixed(0)}) across all scenarios.`,
  };
  const worst: SummaryInfo = {
    name: scores[worstIdx].cand.shortName,
    reason: `Lowest avg P&L ($${scores[worstIdx].avgPnl.toFixed(0)}) with ${scores[worstIdx].worstDD.toFixed(1)}% worst drawdown.`,
  };
  const stable: SummaryInfo = {
    name: scores[stableIdx].cand.shortName,
    reason: `Most consistent returns across scenarios (lowest P&L variance, σ=$${scores[stableIdx].pnlStdDev.toFixed(0)}).`,
  };

  const narrative = `Across 5 market scenarios, ${best.name} produced the highest average return but ${scores[bestIdx].worstDD.toFixed(1)}% worst-case drawdown. ${stable.name} showed the most stable performance with the least variance between scenarios. ${worst.name} struggled the most, indicating sensitivity to certain market conditions. No candidate has been promoted.`;

  return { best, worst, stable, narrative };
}
