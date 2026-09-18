import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';

/** Stage 3B — the causality statement judges must see immediately. */
export function CmcExplainabilityPanel() {
  return (
    <Alert className="border-primary/40 bg-primary/5">
      <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
      <AlertTitle className="text-sm">CMC is context — never cause</AlertTitle>
      <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
        CryptoTrader decisions are generated independently by the existing simulation engine. CoinMarketCap data is
        captured afterward as external market context for research, explainability and auditing. CMC data does not
        generate, modify, approve or execute trades.
      </AlertDescription>
    </Alert>
  );
}
