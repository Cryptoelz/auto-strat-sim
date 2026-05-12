import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTradingContext } from '@/contexts/TradingContext';
import {
  computeParticipation,
  deriveInputsFromTrades,
  ParticipationInputs,
  RiskMode,
  MPC_VERSION,
  MPC_PROMOTED_AT,
} from '@/lib/participationController';

const MODE_VARIANT: Record<RiskMode, string> = {
  aggressive: 'bg-primary/15 text-primary border-primary/30',
  balanced: 'bg-muted text-foreground border-border',
  defensive: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  preservation: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function ParticipationController() {
  const { state, drawdown, decisionLog } = useTradingContext();

  const blocked = decisionLog.filter(e => e.action === 'blocked').length;
  const considered = Math.max(decisionLog.length, blocked + state.trades.length);

  const derived = useMemo(() =>
    deriveInputsFromTrades(state.trades, {
      drawdownPercent: drawdown,
      drawdownLimitPercent: 10,
      signalsConsidered: considered,
      signalsBlocked: blocked,
    }),
    [state.trades, drawdown, considered, blocked],
  );

  const [inputs, setInputs] = useState<ParticipationInputs>(derived);
  const [overrideMode, setOverrideMode] = useState(false);

  const effective = overrideMode ? inputs : derived;
  const result = useMemo(() => computeParticipation(effective), [effective]);

  const setInput = <K extends keyof ParticipationInputs>(k: K, v: number) =>
    setInputs(prev => ({ ...prev, [k]: v }));

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">Market Participation Controller</h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Controls how active the system should be based on current market quality.
            Avoid forcing trades in poor conditions; lean in when the regime is favorable.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={overrideMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setOverrideMode(v => !v); setInputs(derived); }}
          >
            {overrideMode ? 'Using Manual Inputs' : 'Use Live Inputs'}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Opportunity Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result.opportunityScore}</div>
            <Progress value={result.opportunityScore} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Risk Mode</CardTitle></CardHeader>
          <CardContent>
            <Badge className={`text-sm uppercase ${MODE_VARIANT[result.riskMode]}`}>{result.riskMode}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Participation Multiplier</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{result.participationMultiplier.toFixed(2)}×</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Position Size Scale</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{result.positionSizeScale.toFixed(2)}×</div></CardContent>
        </Card>
      </div>

      {/* Inputs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Quality Inputs {overrideMode && <span className="text-xs text-muted-foreground">(manual)</span>}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {([
            ['rollingProfitFactor', 'Rolling Profit Factor', 0, 3, 0.05],
            ['regimeStability', 'Regime Stability', 0, 100, 1],
            ['volatilityQuality', 'Volatility Quality', 0, 100, 1],
            ['signalRejectionRate', 'Signal Rejection Rate', 0, 1, 0.01],
            ['tradeQuality', 'Trade Quality', 0, 100, 1],
            ['drawdownPressure', 'Drawdown Pressure', 0, 100, 1],
            ['convictionAverage', 'Conviction Average', 0, 100, 1],
          ] as const).map(([key, label, min, max, step]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono">{effective[key].toFixed(key === 'rollingProfitFactor' || key === 'signalRejectionRate' ? 2 : 0)}</span>
              </div>
              <Slider
                disabled={!overrideMode}
                value={[effective[key]]}
                min={min}
                max={max}
                step={step}
                onValueChange={([v]) => setInput(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Status flags */}
      <div className="flex flex-wrap gap-2">
        {result.regimeOverrideActive && <Badge className="bg-primary/15 text-primary border-primary/30">Regime Override Active</Badge>}
        {result.neutralStartup && <Badge variant="outline">Neutral Startup (PF→{result.effectiveProfitFactor.toFixed(2)})</Badge>}
        {result.trendBiasActive && <Badge className="bg-primary/15 text-primary border-primary/30">Trend Bias Active</Badge>}
      </div>

      {/* Reasoning */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Reasoning</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-muted-foreground">›</span><span>{r}</span></li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Strategy recs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Strategy Recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {result.strategyRecommendations.map(rec => (
            <div key={rec.strategyId} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium capitalize">{rec.strategyId.replace(/_/g, ' ')}</div>
                <div className="text-xs text-muted-foreground">{rec.reason}</div>
              </div>
              <Badge variant={rec.enabled ? 'default' : 'outline'} className="shrink-0">
                {rec.enabled ? 'Enabled' : 'Paused'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
