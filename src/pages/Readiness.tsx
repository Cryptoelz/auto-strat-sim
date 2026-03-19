import { useTradingContext } from '@/contexts/TradingContext';
import { ReadinessDashboard } from '@/components/trading/ReadinessDashboard';

export default function Readiness() {
  const { state } = useTradingContext();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Readiness Review</h1>
        <p className="text-xs text-muted-foreground">Validate system readiness, run checks, and review promotion eligibility.</p>
      </div>
      <ReadinessDashboard state={state} />
    </div>
  );
}
