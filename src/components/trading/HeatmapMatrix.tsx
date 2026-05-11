/**
 * HeatmapMatrix — simple semantic heatmap for context intelligence.
 * Cells are colored on a profit/loss gradient using semantic tokens
 * (--trading-profit / --trading-loss), opacity scaled by |pnl| vs max.
 */
import { MatrixCell } from '@/lib/contextIntelligence';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  cells: MatrixCell[];
  rowLabel?: string;
  colLabel?: string;
  metric?: 'pnl' | 'winRate' | 'avgPnl';
  className?: string;
}

function intensity(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(1, Math.abs(value) / max);
}

export function HeatmapMatrix({ cells, rowLabel, colLabel, metric = 'pnl', className }: Props) {
  if (cells.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-4 text-center">
        No archived context yet — run a paper session to populate.
      </div>
    );
  }

  const rows = Array.from(new Set(cells.map(c => c.row)));
  const cols = Array.from(new Set(cells.map(c => c.col)));
  const grid = new Map<string, MatrixCell>();
  for (const c of cells) grid.set(`${c.row}|${c.col}`, c);

  const max = Math.max(...cells.map(c => Math.abs(c[metric] ?? 0)), 1);

  return (
    <TooltipProvider>
      <div className={cn('overflow-x-auto', className)}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-muted-foreground font-medium">
                {rowLabel ?? ''}{colLabel && rowLabel ? ' \\ ' : ''}{colLabel ?? ''}
              </th>
              {cols.map(c => (
                <th key={c} className="p-2 text-center text-muted-foreground font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r}>
                <td className="p-2 font-medium text-foreground/80 whitespace-nowrap">{r}</td>
                {cols.map(c => {
                  const cell = grid.get(`${r}|${c}`);
                  if (!cell || cell.trades === 0) {
                    return (
                      <td key={c} className="p-1">
                        <div className="rounded-md border border-border/30 bg-muted/20 px-2 py-3 text-center text-muted-foreground">—</div>
                      </td>
                    );
                  }
                  const v = cell[metric] ?? 0;
                  const alpha = 0.15 + intensity(v, max) * 0.75;
                  const bg = v >= 0
                    ? `hsl(var(--trading-profit) / ${alpha.toFixed(2)})`
                    : `hsl(var(--trading-loss) / ${alpha.toFixed(2)})`;
                  return (
                    <td key={c} className="p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="rounded-md border border-border/40 px-2 py-3 text-center cursor-default"
                            style={{ background: bg }}
                          >
                            <div className={cn('font-mono font-semibold', v >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                              {metric === 'winRate' ? `${cell.winRate.toFixed(0)}%` : `${v >= 0 ? '+' : ''}$${v.toFixed(0)}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{cell.trades}t · {cell.winRate.toFixed(0)}% WR</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="font-medium">{r} → {c}</div>
                          <div>Trades: {cell.trades} ({cell.wins} wins)</div>
                          <div>PnL: ${cell.pnl.toFixed(2)} (avg ${cell.avgPnl.toFixed(2)})</div>
                          <div>Win rate: {cell.winRate.toFixed(1)}%</div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
