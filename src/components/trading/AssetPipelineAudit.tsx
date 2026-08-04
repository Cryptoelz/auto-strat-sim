import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTradingContext } from '@/contexts/TradingContext';
import { ALL_ASSETS } from '@/config/trading';
import { buildAssetDiagnostics, buildValidationReport, AssetDiagnostic, StageResult } from '@/lib/assetPipelineAudit';
import { Activity, CheckCircle2, XCircle, ShieldAlert, Clock } from 'lucide-react';

const STATUS_STYLES: Record<AssetDiagnostic['status'], string> = {
  active: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  waiting: 'border-trading-neutral/50 bg-trading-neutral/10 text-trading-neutral',
  blocked: 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss',
  disabled: 'border-border bg-muted/40 text-muted-foreground',
};

const STATUS_DOT: Record<AssetDiagnostic['status'], string> = {
  active: 'bg-trading-profit',
  waiting: 'bg-trading-neutral',
  blocked: 'bg-trading-loss',
  disabled: 'bg-muted-foreground',
};

function Stage({ label, value }: { label: string; value: StageResult }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/40 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1 font-medium ${value === 'PASS' ? 'text-trading-profit' : 'text-trading-loss'}`}>
        {value === 'PASS' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {value}
      </span>
    </div>
  );
}

export function AssetPipelineAudit() {
  const {
    analytics, candles, prices, signals, state, config, lastUpdate,
    enabledAssets, strategyConfig,
  } = useTradingContext();

  const diagnostics = useMemo(() => buildAssetDiagnostics({
    allAssets: ALL_ASSETS,
    engineAssets: strategyConfig.enabledAssets,
    enabledAssets,
    analytics, candles, prices, signals, state, config, lastUpdate,
  }), [analytics, candles, prices, signals, state, config, lastUpdate, enabledAssets, strategyConfig.enabledAssets]);

  const report = useMemo(() => buildValidationReport(diagnostics), [diagnostics]);

  return (
    <div className="space-y-4">
      {/* Live asset status strip */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" /> Asset Engine Status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {diagnostics.map((d) => (
            <div key={d.asset} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[d.status]}`} />
                  {d.symbol}
                </span>
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[d.status]}`}>
                  {d.statusLabel}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Confidence</span>
                  <span className="font-medium text-foreground">{d.confidence}/100</span>
                </div>
                <Progress value={d.confidence} className="h-1" />
                {d.blockingReason && (
                  <p className="flex items-start gap-1 pt-1 text-trading-loss">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" /> {d.blockingReason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Per-asset diagnostics */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Asset Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {diagnostics.map((d) => (
            <div key={d.asset} className="rounded-lg border border-border/50 p-3 text-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{d.name} <span className="text-muted-foreground">({d.symbol})</span></span>
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[d.status]}`}>{d.statusLabel}</Badge>
              </div>
              <Stage label="Market Data" value={d.checks.marketData} />
              <Stage label="Strategy Engine" value={d.checks.strategyEngine} />
              <Stage label="AI Confidence" value={d.checks.aiConfidence} />
              <Stage label="Risk Engine" value={d.checks.riskEngine} />
              <Stage label="Execution Engine" value={d.checks.executionEngine} />
              <Stage label="Portfolio Included" value={d.checks.portfolioIncluded} />
              <Stage label="Analytics Included" value={d.checks.analyticsIncluded} />
              <div className="mt-2 space-y-0.5 text-muted-foreground">
                <p>Blocking reason: <span className="text-foreground">{d.blockingReason ?? 'None'}</span></p>
                <p>Confidence score: <span className="text-foreground">{d.confidence}/100</span></p>
                <p>Candles loaded: <span className="text-foreground">{d.candleCount}</span></p>
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Last evaluation:{' '}
                  <span className="text-foreground">
                    {d.lastEvaluation ? new Date(d.lastEvaluation).toLocaleTimeString() : '—'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation report */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pipeline Validation Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {[
              ['Enabled assets', report.totalEnabled],
              ['Fully connected', report.fullyConnected],
              ['Currently trading', report.currentlyTrading],
              ['Waiting for signal', report.waitingForSignal],
              ['Blocked', report.blocked],
              ['Disabled', report.disabled],
              ['Missing from pipeline', report.missingFromPipeline.length],
              ['Inconsistencies', report.inconsistencies.length],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-md bg-secondary/30 p-2">
                <p className="text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs">
            {report.inconsistencies.length === 0 ? (
              <p className="flex items-center gap-1 text-trading-profit">
                <CheckCircle2 className="h-3.5 w-3.5" /> No inconsistencies between the UI and the trading engine.
              </p>
            ) : (
              report.inconsistencies.map((i) => (
                <p key={i} className="flex items-start gap-1 text-trading-warning">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {i}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
