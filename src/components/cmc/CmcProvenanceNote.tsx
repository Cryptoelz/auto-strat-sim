import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

const RULES = [
  'Source: CoinMarketCap public API.',
  'Retrieved through a secure server-side proxy — the API key never reaches the browser.',
  'CMC data is read-only enrichment for research and observation.',
  'Binance remains the separate and only market feed for trading and simulation.',
  'CMC values do not affect signals, specialists, risk, allocation, execution or backtests.',
  'Seeded / research data is never silently mixed with live CMC data; every panel is labelled.',
  'When a refresh fails, the last known good CMC snapshot is kept and marked STALE — no simulated substitutes.',
];

export function CmcProvenanceNote() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Data Provenance & Methodology
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
