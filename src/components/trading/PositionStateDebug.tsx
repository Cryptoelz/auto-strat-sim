/**
 * Position State Debug Panel
 *
 * Surfaces the three potential sources of "position" truth so we can prove
 * the engine, the React/UI render, and the persisted localStorage state are
 * in agreement — and explain the dreaded "skipped_same_direction" no-op
 * when a confirmed signal arrives while the engine already holds a same-side
 * position.
 *
 * Columns:
 *   - Engine positions  → live `state.positions` from the unified engine
 *   - UI positions      → the same object as rendered to the page (same ref)
 *   - localStorage      → the persisted snapshot under STORAGE_KEY
 *   - Active direction  → quick per-asset summary
 *
 * If the engine and localStorage disagree on a position, restore happens at
 * mount and the engine truth wins (engine writes to localStorage on every
 * cycle). Mismatches here usually mean a stale tab restored an old session.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, RefreshCw } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import { STORAGE_KEY } from '@/lib/stateManager';
import { Asset, Position } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';

function readLocalStoragePositions(): Record<string, Position | null> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.positions ?? null;
  } catch {
    return null;
  }
}

function dirBadge(dir: 'long' | 'short' | null) {
  if (!dir) return <Badge variant="outline" className="text-muted-foreground">flat</Badge>;
  return (
    <Badge
      className={
        dir === 'long'
          ? 'bg-trading-profit/15 text-trading-profit border border-trading-profit/30'
          : 'bg-trading-loss/15 text-trading-loss border border-trading-loss/30'
      }
    >
      {dir.toUpperCase()}
    </Badge>
  );
}

export function PositionStateDebug() {
  const { state, config, pendingCrossovers } = useTradingContext();
  const [lsPositions, setLsPositions] = useState<Record<string, Position | null> | null>(
    () => readLocalStoragePositions(),
  );
  const [bump, setBump] = useState(0);

  useEffect(() => {
    setLsPositions(readLocalStoragePositions());
  }, [state.positions, bump]);

  const assets: Asset[] = config.assets;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-trading-warning" />
            Position State Debug
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1"
            onClick={() => setBump((n) => n + 1)}
          >
            <RefreshCw className="h-3 w-3" />
            Re-read
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Source of truth for the live engine is <code className="rounded bg-muted px-1">state.positions</code>;
          UI components read the same object. localStorage shows the most-recently
          persisted snapshot under key <code className="rounded bg-muted px-1">{STORAGE_KEY}</code>.
          Any divergence between engine and localStorage means a stale session
          was restored — hit <em>Reset</em> on the paper engine to wipe it.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Asset</th>
                <th className="py-2 pr-3">Engine (state)</th>
                <th className="py-2 pr-3">UI render</th>
                <th className="py-2 pr-3">localStorage</th>
                <th className="py-2 pr-3">Active dir</th>
                <th className="py-2 pr-3">Pending cross</th>
                <th className="py-2 pr-3">Mismatch?</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const engine = state.positions[asset];
                const ls = lsPositions?.[asset] ?? null;
                const pending = pendingCrossovers[asset];
                const engineDir = engine?.direction ?? null;
                const lsDir = ls?.direction ?? null;
                const mismatch =
                  engineDir !== lsDir ||
                  (engine && ls && engine.entryPrice !== ls.entryPrice);
                return (
                  <tr key={asset} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">{ASSET_INFO[asset].symbol}</td>
                    <td className="py-2 pr-3">
                      {engine
                        ? `${engine.direction} @ $${engine.entryPrice.toFixed(2)} · ${engine.size.toFixed(6)}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-3">{dirBadge(engineDir)}</td>
                    <td className="py-2 pr-3">
                      {ls
                        ? `${ls.direction} @ $${(ls.entryPrice ?? 0).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-3">{dirBadge(engineDir)}</td>
                    <td className="py-2 pr-3">
                      {pending
                        ? `${pending.direction.toUpperCase()} · age ${pending.ageCandles}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-3">
                      {mismatch ? (
                        <Badge className="bg-destructive/15 text-destructive border border-destructive/30">
                          MISMATCH
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">ok</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
