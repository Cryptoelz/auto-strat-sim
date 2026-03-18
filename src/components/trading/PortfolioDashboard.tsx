import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  PieChart, Wallet, TrendingUp, TrendingDown, Shield, Target,
  BarChart3, AlertTriangle, Zap, ArrowUpDown, DollarSign, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { PortfolioState, PortfolioConfig, AllocationMode, PortfolioTradeLog, OpportunityScore } from '@/types/portfolio';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { format } from 'date-fns';

// ─── Portfolio Overview Card ─────────────────────────────────────────

interface PortfolioDashboardProps {
  portfolioState: PortfolioState;
  portfolioConfig: PortfolioConfig;
  onConfigChange: (config: PortfolioConfig) => void;
  enabledAssets: Asset[];
}

const ALLOCATION_MODE_LABELS: Record<AllocationMode, string> = {
  equal: 'Equal Split',
  fixed: 'Fixed %',
  signal_weighted: 'Signal-Weighted',
  volatility_adjusted: 'Volatility-Adjusted',
};

export function PortfolioDashboard({
  portfolioState,
  portfolioConfig,
  onConfigChange,
  enabledAssets,
}: PortfolioDashboardProps) {
  const {
    totalEquity, cashAvailable, allocatedCapital, exposureByAsset,
    portfolioRealizedPnl, portfolioUnrealizedPnl, portfolioDrawdown,
    activeAllocationMode, scores, decisions, tradeLogs, drawdownPaused,
    drawdownPauseReason,
  } = portfolioState;

  const totalExposurePercent = totalEquity > 0
    ? (allocatedCapital / totalEquity) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Drawdown Warning */}
      {drawdownPaused && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Portfolio Drawdown Protection Active</p>
              <p className="text-xs text-muted-foreground">{drawdownPauseReason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMini
          icon={<Wallet className="h-4 w-4" />}
          label="Total Equity"
          value={formatCurrency(totalEquity)}
        />
        <StatMini
          icon={<DollarSign className="h-4 w-4" />}
          label="Cash Available"
          value={formatCurrency(cashAvailable)}
        />
        <StatMini
          icon={<TrendingUp className="h-4 w-4" />}
          label="Realized PnL"
          value={formatCurrency(portfolioRealizedPnl)}
          positive={portfolioRealizedPnl >= 0}
        />
        <StatMini
          icon={<Activity className="h-4 w-4" />}
          label="Unrealized PnL"
          value={formatCurrency(portfolioUnrealizedPnl)}
          positive={portfolioUnrealizedPnl >= 0}
        />
      </div>

      {/* Exposure + Drawdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Portfolio Exposure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Exposure</span>
              <span className="font-medium">{totalExposurePercent.toFixed(1)}% / {portfolioConfig.maxPortfolioExposurePercent}%</span>
            </div>
            <Progress
              value={Math.min(totalExposurePercent, 100)}
              className="h-2"
            />

            <Separator className="my-2" />

            {enabledAssets.map(asset => {
              const exposure = exposureByAsset[asset] || 0;
              const pct = totalEquity > 0 ? (exposure / totalEquity) * 100 : 0;
              return (
                <div key={asset} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{ASSET_INFO[asset].symbol}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(exposure)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-1.5" />
                </div>
              );
            })}

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Drawdown</span>
              <span className={cn('font-medium', portfolioDrawdown > 5 ? 'text-destructive' : 'text-muted-foreground')}>
                {portfolioDrawdown.toFixed(2)}% / {portfolioConfig.maxPortfolioDrawdownPercent}%
              </span>
            </div>
            <Progress
              value={Math.min((portfolioDrawdown / portfolioConfig.maxPortfolioDrawdownPercent) * 100, 100)}
              className="h-1.5"
            />
          </CardContent>
        </Card>

        {/* Opportunity Scores */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              Opportunity Scores
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked by composite opportunity score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scores.length === 0 && (
              <p className="text-xs text-muted-foreground">No assets evaluated yet.</p>
            )}
            {scores
              .sort((a, b) => b.total - a.total)
              .map(score => (
                <ScoreRow key={score.asset} score={score} />
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Configuration + Allocation Decisions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Config */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              Allocation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Allocation Mode</Label>
              <Select
                value={portfolioConfig.allocationMode}
                onValueChange={(v) => onConfigChange({ ...portfolioConfig, allocationMode: v as AllocationMode })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ALLOCATION_MODE_LABELS) as AllocationMode[]).map(mode => (
                    <SelectItem key={mode} value={mode} className="text-xs">
                      {ALLOCATION_MODE_LABELS[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Max Portfolio Exp %</Label>
                <Input
                  type="number" min={5} max={100} step={5}
                  value={portfolioConfig.maxPortfolioExposurePercent}
                  onChange={(e) => onConfigChange({ ...portfolioConfig, maxPortfolioExposurePercent: Number(e.target.value) || 20 })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Asset Exp %</Label>
                <Input
                  type="number" min={5} max={100} step={5}
                  value={portfolioConfig.maxAssetExposurePercent}
                  onChange={(e) => onConfigChange({ ...portfolioConfig, maxAssetExposurePercent: Number(e.target.value) || 15 })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Max Positions</Label>
                <Input
                  type="number" min={1} max={4} step={1}
                  value={portfolioConfig.maxSimultaneousPositions}
                  onChange={(e) => onConfigChange({ ...portfolioConfig, maxSimultaneousPositions: Number(e.target.value) || 2 })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Drawdown %</Label>
                <Input
                  type="number" min={1} max={50} step={1}
                  value={portfolioConfig.maxPortfolioDrawdownPercent}
                  onChange={(e) => onConfigChange({ ...portfolioConfig, maxPortfolioDrawdownPercent: Number(e.target.value) || 10 })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Correlation Exposure Cap %</Label>
              <Input
                type="number" min={5} max={50} step={5}
                value={portfolioConfig.correlationExposureCap}
                onChange={(e) => onConfigChange({ ...portfolioConfig, correlationExposureCap: Number(e.target.value) || 15 })}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Allocation Decisions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4" />
              Allocation Decisions
            </CardTitle>
            <CardDescription className="text-xs">
              Current mode: <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {ALLOCATION_MODE_LABELS[activeAllocationMode]}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {decisions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No allocation decisions pending.
              </p>
            ) : (
              <div className="space-y-2">
                {decisions.map(d => (
                  <div key={d.asset} className="rounded-md border border-border/50 p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{ASSET_INFO[d.asset].symbol}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {d.allocatedPercent.toFixed(1)}% → {formatCurrency(d.allocatedAmount)}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{d.reason}</p>
                    {d.skippedInFavorOf && (
                      <p className="text-[10px] text-amber-500">
                        ↳ {d.skippedInFavorOf} skipped in favor of this asset
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Logs */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Portfolio Trade Log
          </CardTitle>
          <CardDescription className="text-xs">
            Every allocation decision with explainability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tradeLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No portfolio trade logs yet.
            </p>
          ) : (
            <ScrollArea className="h-[240px]">
              <div className="space-y-1.5">
                {tradeLogs.slice(0, 50).map(log => (
                  <TradeLogRow key={log.id} log={log} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatMini({ icon, label, value, positive }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="flex items-center gap-3 py-3 px-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-[10px] text-muted-foreground leading-none mb-1">{label}</p>
          <p className={cn(
            'text-sm font-semibold',
            positive === true && 'text-emerald-500',
            positive === false && 'text-destructive',
          )}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreRow({ score }: { score: OpportunityScore }) {
  const info = ASSET_INFO[score.asset];
  return (
    <div className="rounded-md border border-border/30 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{info.symbol}</span>
          {score.eligible ? (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Blocked
            </Badge>
          )}
        </div>
        <span className={cn('text-sm font-bold', score.total >= 60 ? 'text-emerald-500' : score.total >= 30 ? 'text-amber-500' : 'text-muted-foreground')}>
          {score.total}
        </span>
      </div>

      {score.eligible ? (
        <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground">
          <div className="text-center">
            <div className="font-medium text-foreground">{score.crossoverStrength.toFixed(0)}</div>
            <div>Cross</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-foreground">{score.smaDistanceScore.toFixed(0)}</div>
            <div>SMA</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-foreground">{score.regimeScore.toFixed(0)}</div>
            <div>Regime</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-foreground">{score.volatilityScore.toFixed(0)}</div>
            <div>Vol</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-foreground">{score.recentPerformance.toFixed(0)}</div>
            <div>Perf</div>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">{score.disqualifyReason}</p>
      )}
    </div>
  );
}

function TradeLogRow({ log }: { log: PortfolioTradeLog }) {
  const actionColors: Record<string, string> = {
    entry: 'bg-emerald-500/20 text-emerald-500',
    exit: 'bg-blue-500/20 text-blue-500',
    skip: 'bg-amber-500/20 text-amber-500',
    blocked: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="rounded border border-border/30 p-2 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-[10px] px-1.5 py-0 border-0', actionColors[log.action])}>
            {log.action.toUpperCase()}
          </Badge>
          <span className="font-medium">{ASSET_INFO[log.asset]?.symbol || log.asset}</span>
          {log.positionSide && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {log.positionSide.toUpperCase()}
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(log.timestamp), 'HH:mm:ss')}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{log.explanation}</p>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>Score: {log.score}</span>
        <span>Alloc: {formatCurrency(log.allocationAmount)}</span>
        {log.pnl !== null && (
          <span className={log.pnl >= 0 ? 'text-emerald-500' : 'text-destructive'}>
            PnL: {formatCurrency(log.pnl)}
          </span>
        )}
        {log.skippedAsset && <span className="text-amber-500">Skipped: {log.skippedAsset}</span>}
      </div>
    </div>
  );
}
