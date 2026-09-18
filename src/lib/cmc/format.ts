/** CMC Hackathon — display formatting helpers (presentation only). */

export function fmtUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

export function fmtSupply(value: number | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function fmtPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function pctClass(value: number): string {
  return value > 0 ? 'text-trading-profit' : value < 0 ? 'text-destructive' : 'text-muted-foreground';
}
