import { useState, useMemo, useCallback, memo } from 'react';
import { useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Bell, BellOff, AlertTriangle, Info, AlertCircle, Shield, Filter,
  Download, FileText, FileJson, Clock, TrendingUp, TrendingDown,
  Activity, Target, BarChart3, Zap, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { ASSET_INFO } from '@/config/trading';
import { Asset, TradingState, TradingConfig } from '@/types/trading';
import { PortfolioConfig } from '@/types/portfolio';
import {
  TradingAlert, NotificationPreferences, AlertSeverity, AlertCategory,
  getAlerts, subscribeToAlerts, clearAlerts,
  loadNotificationPrefs, saveNotificationPrefs, shouldShowAlert,
} from '@/lib/alerts';
import { DailySummary, SessionSummary, generateDailySummary, generateSessionSummary } from '@/lib/dailySummary';
import { getLogEntries, subscribeToLog } from '@/lib/logger';
import {
  exportTradesToCSV, exportAlertsToCSV, exportDailySummaryToCSV,
  exportSessionJSON, downloadFile,
} from '@/lib/exportManager';

// ─── Main Component ──────────────────────────────────────────────────

interface AlertsAndReportsProps {
  state: TradingState;
  config: TradingConfig;
  portfolioConfig: PortfolioConfig;
  unrealizedPnl: number;
  maxDrawdown: number;
  sessionStartTime: number;
}

export function AlertsAndReports({
  state, config, portfolioConfig, unrealizedPnl, maxDrawdown, sessionStartTime,
}: AlertsAndReportsProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(loadNotificationPrefs);
  const [showPrefs, setShowPrefs] = useState(false);

  const alerts = useSyncExternalStore(subscribeToAlerts, getAlerts);
  const decisionLog = useSyncExternalStore(subscribeToLog, getLogEntries);
  const blockedEntries = useMemo(() => decisionLog.filter(e => e.action === 'blocked'), [decisionLog]);

  const filteredAlerts = useMemo(() =>
    alerts.filter(a => shouldShowAlert(a, prefs)),
    [alerts, prefs],
  );

  const updatePrefs = useCallback((update: Partial<NotificationPreferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...update };
      saveNotificationPrefs(next);
      return next;
    });
  }, []);

  const summary = useMemo(() =>
    generateDailySummary(state, blockedEntries, unrealizedPnl, maxDrawdown),
    [state, blockedEntries, unrealizedPnl, maxDrawdown],
  );

  const sessionSummary = useMemo(() =>
    generateSessionSummary(state, sessionStartTime, alerts.length, unrealizedPnl),
    [state, sessionStartTime, alerts.length, unrealizedPnl],
  );

  const handleExportTradesCSV = useCallback(() => {
    downloadFile(exportTradesToCSV(state.trades), `trades-${summary.date}.csv`, 'text/csv');
  }, [state.trades, summary.date]);

  const handleExportAlertsCSV = useCallback(() => {
    downloadFile(exportAlertsToCSV(alerts), `alerts-${summary.date}.csv`, 'text/csv');
  }, [alerts, summary.date]);

  const handleExportJSON = useCallback(() => {
    downloadFile(
      exportSessionJSON(state, config, portfolioConfig, alerts, [summary]),
      `session-${summary.date}.json`,
      'application/json',
    );
  }, [state, config, portfolioConfig, alerts, summary]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts" className="text-xs gap-1">
            <Bell className="h-3 w-3" />Alerts
            {filteredAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filteredAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs gap-1">
            <BarChart3 className="h-3 w-3" />Daily
          </TabsTrigger>
          <TabsTrigger value="session" className="text-xs gap-1">
            <Activity className="h-3 w-3" />Session
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs gap-1">
            <Download className="h-3 w-3" />Export
          </TabsTrigger>
        </TabsList>

        {/* ─── Alerts Tab ───────────────────────────────── */}
        <TabsContent value="alerts" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4" />
                  Alert Center
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowPrefs(!showPrefs)}>
                    <Filter className="h-3 w-3 mr-1" />Filters
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAlerts}>
                    <X className="h-3 w-3 mr-1" />Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPrefs && (
                <div className="mb-3 rounded-md border border-border/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Notification Preferences</p>
                  {([
                    ['tradeAlerts', 'Trade Alerts', 'Entry/exit/flip notifications'],
                    ['blockedTradeAlerts', 'Blocked Trades', 'Filtered opportunity alerts'],
                    ['riskAlerts', 'Risk Alerts', 'Daily loss, drawdown, consecutive losses'],
                    ['systemAlerts', 'System Alerts', 'Reconnections, data gaps, pause/resume'],
                    ['dailySummaryAlerts', 'Daily Summary', 'End-of-day performance summary'],
                  ] as const).map(([key, label, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs">{label}</Label>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={prefs[key]}
                        onCheckedChange={(v) => updatePrefs({ [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              )}

              <ScrollArea className="h-[280px]">
                {filteredAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <BellOff className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">No alerts yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAlerts.slice(0, 100).map(alert => (
                      <AlertRow key={alert.id} alert={alert} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Daily Summary Tab ────────────────────────── */}
        <TabsContent value="summary" className="mt-3">
          <DailySummaryPanel summary={summary} />
        </TabsContent>

        {/* ─── Session Tab ──────────────────────────────── */}
        <TabsContent value="session" className="mt-3">
          <SessionPanel session={sessionSummary} />
        </TabsContent>

        {/* ─── Export Tab ───────────────────────────────── */}
        <TabsContent value="export" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                Export Reports
              </CardTitle>
              <CardDescription className="text-xs">
                Download trade logs, alerts, and session data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportTradesCSV}>
                  <FileText className="h-3.5 w-3.5" />
                  Trades CSV
                  <Badge variant="secondary" className="text-[10px] px-1">{state.trades.length}</Badge>
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportAlertsCSV}>
                  <FileText className="h-3.5 w-3.5" />
                  Alerts CSV
                  <Badge variant="secondary" className="text-[10px] px-1">{alerts.length}</Badge>
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportJSON}>
                  <FileJson className="h-3.5 w-3.5" />
                  Full Session JSON
                </Button>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>CSV exports</strong> include trade history, alerts, and daily summaries.</p>
                <p><strong>JSON export</strong> includes full session state, config, portfolio settings, trades, alerts, metrics, and daily summaries.</p>
                <p className="text-[10px]">⚠️ Simulation data only — no real trading records.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Alert Row ───────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: TradingAlert }) {
  const severityConfig: Record<AlertSeverity, { icon: React.ReactNode; color: string }> = {
    info: { icon: <Info className="h-3 w-3" />, color: 'text-primary' },
    warning: { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-amber-500' },
    critical: { icon: <AlertCircle className="h-3 w-3" />, color: 'text-destructive' },
  };

  const { icon, color } = severityConfig[alert.severity];

  return (
    <div className="flex items-start gap-2 rounded-md border border-border/20 px-2 py-1.5 text-xs">
      <span className={cn('mt-0.5 shrink-0', color)}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0">
            {alert.eventType}
          </Badge>
          {alert.asset && (
            <span className="text-[10px] text-muted-foreground">
              {ASSET_INFO[alert.asset]?.symbol || alert.asset}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {format(new Date(alert.timestamp), 'HH:mm:ss')}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{alert.explanation}</p>
      </div>
      {!alert.actionTaken && (
        <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">NO ACTION</Badge>
      )}
    </div>
  );
}

// ─── Daily Summary Panel ─────────────────────────────────────────────

function DailySummaryPanel({ summary }: { summary: DailySummary }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Daily Summary — {summary.date}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Trades" value={summary.totalTrades.toString()} sub={`${summary.longTrades}L / ${summary.shortTrades}S`} />
          <MiniStat label="Win/Loss" value={`${summary.wins}/${summary.losses}`} sub={summary.totalTrades > 0 ? `${((summary.wins / summary.totalTrades) * 100).toFixed(0)}% WR` : '-'} />
          <MiniStat
            label="Realized PnL"
            value={formatCurrency(summary.realizedPnl)}
            positive={summary.realizedPnl >= 0}
          />
          <MiniStat
            label="Daily Return"
            value={formatPercent(summary.dailyReturnPercent)}
            positive={summary.dailyReturnPercent >= 0}
          />
        </div>

        <Separator />

        {/* Best/Worst trades */}
        <div className="grid grid-cols-2 gap-2">
          {summary.bestTrade && (
            <div className="rounded-md border border-border/30 p-2">
              <p className="text-[10px] text-muted-foreground">Best Trade</p>
              <p className="text-xs font-medium text-emerald-500">
                {ASSET_INFO[summary.bestTrade.asset]?.symbol}: {formatCurrency(summary.bestTrade.pnl)}
              </p>
            </div>
          )}
          {summary.worstTrade && (
            <div className="rounded-md border border-border/30 p-2">
              <p className="text-[10px] text-muted-foreground">Worst Trade</p>
              <p className="text-xs font-medium text-destructive">
                {ASSET_INFO[summary.worstTrade.asset]?.symbol}: {formatCurrency(summary.worstTrade.pnl)}
              </p>
            </div>
          )}
        </div>

        {/* Blocked setups */}
        {summary.blockedSetups > 0 && (
          <div className="rounded-md border border-border/30 p-2">
            <p className="text-[10px] text-muted-foreground mb-1">Blocked Setups: {summary.blockedSetups}</p>
            <div className="flex flex-wrap gap-1">
              {summary.topBlockReasons.map(r => (
                <Badge key={r.reason} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {r.reason}: {r.count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Commentary */}
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">📝 Strategy Commentary</p>
          <p className="text-xs leading-relaxed">{summary.commentary}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Session Panel ───────────────────────────────────────────────────

function SessionPanel({ session }: { session: SessionSummary }) {
  const durationHours = (session.durationMs / 3600000).toFixed(1);

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-500',
    paused: 'text-amber-500 bg-amber-500/20',
    risk_locked: 'text-destructive bg-destructive/20',
    stopped: 'text-muted-foreground bg-muted',
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Session Summary
        </CardTitle>
        <CardDescription className="text-xs">
          Started {format(new Date(session.sessionStartTime), 'MMM dd, HH:mm')} • {durationHours}h
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Status">
            <Badge className={cn('text-[10px] px-1.5 py-0 border-0', statusColors[session.tradingStatus])}>
              {session.tradingStatus.toUpperCase().replace('_', ' ')}
            </Badge>
          </MiniStat>
          <MiniStat label="Equity" value={formatCurrency(session.portfolioEquity)} />
          <MiniStat label="Net PnL" value={formatCurrency(session.netPnl)} positive={session.netPnl >= 0} />
          <MiniStat label="Unrealized" value={formatCurrency(session.unrealizedPnl)} positive={session.unrealizedPnl >= 0} />
          <MiniStat label="Total Trades" value={session.totalTrades.toString()} />
          <MiniStat label="Total Alerts" value={session.totalAlerts.toString()} />
          {session.bestAsset && (
            <MiniStat label="Best Asset" value={ASSET_INFO[session.bestAsset.asset]?.symbol || '-'} sub={formatCurrency(session.bestAsset.pnl)} />
          )}
          {session.worstAsset && (
            <MiniStat label="Worst Asset" value={ASSET_INFO[session.worstAsset.asset]?.symbol || '-'} sub={formatCurrency(session.worstAsset.pnl)} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mini Stat ───────────────────────────────────────────────────────

function MiniStat({ label, value, sub, positive, children }: {
  label: string;
  value?: string;
  sub?: string;
  positive?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/30 p-2">
      <p className="text-[10px] text-muted-foreground leading-none mb-1">{label}</p>
      {children || (
        <>
          <p className={cn('text-xs font-semibold',
            positive === true && 'text-emerald-500',
            positive === false && 'text-destructive',
          )}>
            {value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </>
      )}
    </div>
  );
}
