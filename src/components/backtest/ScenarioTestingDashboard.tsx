import { useState, useMemo, useCallback } from 'react';
import { Asset } from '@/types/trading';
import { ScenarioConfig, DEFAULT_SCENARIO_CONFIG, ScenarioTestSuite } from '@/types/scenario';
import { runScenarioTestSuite, PREDEFINED_SCENARIOS } from '@/lib/scenarioEngine';
import { downloadFile } from '@/lib/exportManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FlaskConical, Play, AlertTriangle, Shield, TrendingUp,
  Download, Target, BarChart3, Lightbulb, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  assets: Asset[];
  fastSMA: number;
  slowSMA: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  feePercent: number;
  initialBalance: number;
}

export function ScenarioTestingDashboard({
  assets, fastSMA, slowSMA, positionSizePercent,
  stopLossPercent, takeProfitPercent, feePercent, initialBalance,
}: Props) {
  const [config, setConfig] = useState<ScenarioConfig>(DEFAULT_SCENARIO_CONFIG);
  const [suite, setSuite] = useState<ScenarioTestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tab, setTab] = useState('results');

  const handleRun = useCallback(() => {
    setIsRunning(true);
    // Use setTimeout so UI updates before blocking computation
    setTimeout(() => {
      const result = runScenarioTestSuite(
        assets, fastSMA, slowSMA, positionSizePercent,
        stopLossPercent, takeProfitPercent, feePercent,
        initialBalance, config,
      );
      setSuite(result);
      setIsRunning(false);
    }, 50);
  }, [assets, fastSMA, slowSMA, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent, initialBalance, config]);

  const handleExport = useCallback(() => {
    if (!suite) return;
    const json = JSON.stringify({
      exportedAt: new Date().toISOString(),
      simulation: true,
      config: suite.config,
      scenarios: suite.scenarios,
      robustnessScores: suite.robustnessScores,
      failurePoints: suite.failurePoints,
      recommendations: suite.recommendations,
      duration: suite.duration,
    }, null, 2);
    downloadFile(json, `scenario-test-${Date.now()}.json`, 'application/json');
  }, [suite]);

  const scenarioCount = PREDEFINED_SCENARIOS.length * assets.length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              Scenario & Stress Testing
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Test agent robustness across {PREDEFINED_SCENARIOS.length} market scenarios — simulation only
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {suite && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs">
                <Download className="h-3 w-3" />Export
              </Button>
            )}
            <Button size="sm" onClick={handleRun} disabled={isRunning} className="gap-1">
              <Play className="h-3 w-3" />
              {isRunning ? 'Running...' : 'Run All Scenarios'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stress Config */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ConfigSlider label="Slippage ×" value={config.slippageMultiplier} min={0.5} max={5} step={0.5} onChange={v => setConfig(p => ({ ...p, slippageMultiplier: v }))} />
          <ConfigSlider label="Fee ×" value={config.feeMultiplier} min={0.5} max={5} step={0.5} onChange={v => setConfig(p => ({ ...p, feeMultiplier: v }))} />
          <ConfigSlider label="Volatility ×" value={config.volatilityMultiplier} min={0.1} max={5} step={0.1} onChange={v => setConfig(p => ({ ...p, volatilityMultiplier: v }))} />
          <ConfigSlider label="Chop Intensity" value={config.chopIntensity} min={0} max={3} step={0.1} onChange={v => setConfig(p => ({ ...p, chopIntensity: v }))} />
        </div>

        {isRunning && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Running {scenarioCount} scenario tests...</p>
            <Progress value={50} className="h-1.5" />
          </div>
        )}

        {suite && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="results" className="text-xs gap-1"><BarChart3 className="h-3 w-3" />Results</TabsTrigger>
              <TabsTrigger value="robustness" className="text-xs gap-1"><Shield className="h-3 w-3" />Robustness</TabsTrigger>
              <TabsTrigger value="failures" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Failures</TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs gap-1"><Lightbulb className="h-3 w-3" />Recs</TabsTrigger>
            </TabsList>

            {/* Results Tab */}
            <TabsContent value="results">
              <div className="text-[10px] text-muted-foreground mb-2">
                {suite.scenarios.length} tests completed in {(suite.duration / 1000).toFixed(2)}s
              </div>
              <ScrollArea className="h-[420px]">
                <div className="space-y-1">
                  {suite.scenarios.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border border-border/30 bg-muted/20 text-xs">
                      <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0 w-14 justify-center">
                        {r.asset.replace('USDT', '')}
                      </Badge>
                      <span className="font-medium w-36 shrink-0 truncate">{r.scenarioName}</span>
                      <span className="w-12 text-right">{r.totalTrades}T</span>
                      <span className={cn("w-14 text-right", r.winRate >= 50 ? "text-trading-profit" : "text-trading-loss")}>
                        {r.winRate.toFixed(0)}%
                      </span>
                      <span className={cn("w-20 text-right font-mono", r.netPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                        {r.netPnl >= 0 ? '+' : ''}{r.netPnl.toFixed(0)}
                      </span>
                      <span className="w-14 text-right text-muted-foreground">DD {r.maxDrawdown.toFixed(1)}%</span>
                      <span className="w-12 text-right text-muted-foreground">PF {r.profitFactor === Infinity ? '∞' : r.profitFactor.toFixed(1)}</span>
                      <span className="w-10 text-right text-muted-foreground">{r.flipTrades}F</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {/* Per-scenario explanations */}
              <Separator className="my-3" />
              <ScrollArea className="h-[160px]">
                <div className="space-y-2">
                  {suite.scenarios.filter(r => r.explanation).map((r, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground border-l-2 border-primary/30 pl-2">
                      <span className="font-medium text-foreground">{r.asset.replace('USDT', '')} — {r.scenarioName}:</span>{' '}
                      {r.explanation}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Robustness Tab */}
            <TabsContent value="robustness">
              <div className="space-y-4">
                {suite.robustnessScores.map((rs, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{rs.asset.replace('USDT', '')} — {rs.strategy}</span>
                      <Badge variant={rs.overallScore >= 60 ? 'default' : rs.overallScore >= 40 ? 'secondary' : 'destructive'} className="text-xs">
                        {rs.overallScore.toFixed(0)} / 100
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ScoreBar label="Consistency" value={rs.consistencyScore} />
                      <ScoreBar label="DD Control" value={rs.drawdownControl} />
                      <ScoreBar label="Return Stability" value={rs.returnStability} />
                      <ScoreBar label="Whipsaw Resist." value={rs.whipsawResistance} />
                      <ScoreBar label="Volatility" value={rs.volatilityHandling} />
                      <ScoreBar label="Crash Survival" value={rs.crashSurvival} />
                    </div>
                    {/* Scenario breakdown */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(rs.scenarioBreakdown).map(([sid, score]) => (
                        <Badge key={sid} variant="outline" className={cn("text-[9px] py-0 h-4", score >= 60 ? "border-trading-profit/40 text-trading-profit" : score >= 40 ? "border-yellow-500/40 text-yellow-500" : "border-trading-loss/40 text-trading-loss")}>
                          {sid}: {score.toFixed(0)}
                        </Badge>
                      ))}
                    </div>
                    {i < suite.robustnessScores.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Failures Tab */}
            <TabsContent value="failures">
              {suite.failurePoints.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-8 w-8 text-trading-profit mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No critical failure points detected</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {suite.failurePoints.map(fp => (
                      <div key={fp.id} className={cn("p-2.5 rounded border text-xs", fp.severity === 'critical' ? "border-destructive/50 bg-destructive/5" : fp.severity === 'high' ? "border-trading-loss/30 bg-trading-loss/5" : "border-border/50")}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={fp.severity === 'critical' ? 'destructive' : fp.severity === 'high' ? 'secondary' : 'outline'} className="text-[10px] py-0 h-4">
                            {fp.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{fp.category}</span>
                          <span className="text-muted-foreground ml-auto">{fp.scenario}</span>
                        </div>
                        <p className="text-muted-foreground">{fp.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-primary">
                          <ChevronRight className="h-3 w-3" />
                          <span>{fp.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              {suite.recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-8 w-8 text-trading-profit mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recommendations — strategy looks robust</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {suite.recommendations.map(rec => (
                      <div key={rec.id} className="p-3 rounded border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px] py-0 h-4">
                            {rec.priority}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">{rec.category}</span>
                        </div>
                        <p className="text-sm font-medium mb-1">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.basedOn.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] py-0 h-4">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!suite && !isRunning && (
          <div className="text-center py-10">
            <FlaskConical className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Click "Run All Scenarios" to stress-test your strategy across {PREDEFINED_SCENARIOS.length} market conditions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function ConfigSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label className="text-[10px]">{label}</Label>
        <span className="text-[10px] text-muted-foreground font-mono">{value.toFixed(1)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} className="h-4" />
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono", value >= 60 ? "text-trading-profit" : value >= 40 ? "text-yellow-500" : "text-trading-loss")}>
          {value.toFixed(0)}
        </span>
      </div>
      <Progress value={value} className="h-1" />
    </div>
  );
}
