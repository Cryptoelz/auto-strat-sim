/**
 * Live Signal Monitor
 *
 * Proves the live engine is actively detecting and evaluating new candles
 * rather than only replaying historical data. Shows the most recent
 * timestamps for each pipeline stage plus session-cumulative counters.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTradingContext } from '@/contexts/TradingContext';
import { Activity, Radio } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ExpectedSignalFrequency } from './ExpectedSignalFrequency';

function fmtTs(ts: number | null): string {
  if (!ts) return '—';
  try { return format(ts, 'HH:mm:ss'); } catch { return '—'; }
}

function fmtAgo(ts: number | null, now: number): string {
  if (!ts) return 'never';
  try { return formatDistanceToNowStrict(ts, { addSuffix: true }) + ` (${fmtTs(ts)})`; } catch { return '—'; }
}

function fmtInterval(ms: number): string {
  const min = ms / 60000;
  if (min < 1) return `${Math.round(ms / 1000)}s`;
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'}`;
  return `${(min / 60).toFixed(1)}h`;
}

export function LiveSignalMonitor() {
  const { liveActivity, connectionStatus, state } = useTradingContext();
  // Tick once per second so "x seconds ago" stays fresh
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sessionAgeMs = now - liveActivity.sessionStartTs;
  const candleFresh = liveActivity.lastCandleProcessedTs
    ? now - liveActivity.lastCandleProcessedTs < liveActivity.candleIntervalMs * 2
    : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Live Signal Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">LIVE ENGINE</Badge>
            {state.isRunning ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Running</Badge>
            ) : (
              <Badge variant="secondary">Paused</Badge>
            )}
            {connectionStatus.connected ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">WS connected</Badge>
            ) : (
              <Badge variant="destructive">WS offline</Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Engine is evaluating candles every <span className="font-medium text-foreground">{fmtInterval(liveActivity.candleIntervalMs)}</span>
          {' '}and polling REST every{' '}
          <span className="font-medium text-foreground">{fmtInterval(liveActivity.pollIntervalMs)}</span>.
          Session age: {fmtInterval(sessionAgeMs)}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Row label="Last candle processed" value={fmtAgo(liveActivity.lastCandleProcessedTs, now)} accent={candleFresh ? 'ok' : 'warn'} />
          <Row label="Last crossover detected" value={fmtAgo(liveActivity.lastCrossoverTs, now)} />
          <Row label="Last HTF-pass" value={fmtAgo(liveActivity.lastHtfPassTs, now)} />
          <Row label="Last confirmation-pass" value={fmtAgo(liveActivity.lastConfirmationPassTs, now)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Counter label="Raw signals" value={liveActivity.rawSignalCount} />
          <Counter label="Live crossovers" value={liveActivity.crossoverCount} />
          <Counter label="HTF passes" value={liveActivity.htfPassCount} />
          <Counter label="Confirmations" value={liveActivity.confirmationCount} />
        </div>

        {!candleFresh && liveActivity.lastCandleProcessedTs && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs flex items-start gap-2">
            <Activity className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              No new candle in over {fmtInterval(liveActivity.candleIntervalMs * 2)}. The engine may be idle —
              check WebSocket status or the polling cycle.
            </span>
          </div>
        )}

        <ExpectedSignalFrequency />
        {!liveActivity.lastCandleProcessedTs && (
          <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Waiting for the first candle to arrive on the live feed…
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: 'ok' | 'warn' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={
        accent === 'ok' ? 'text-emerald-600 dark:text-emerald-400 font-mono text-xs'
        : accent === 'warn' ? 'text-amber-600 dark:text-amber-400 font-mono text-xs'
        : 'font-mono text-xs'
      }>{value}</span>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">since session start</div>
    </div>
  );
}
