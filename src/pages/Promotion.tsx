import { PromotionDashboard } from '@/components/trading/PromotionDashboard';

export default function Promotion() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Strategy Promotion</h1>
        <p className="text-xs text-muted-foreground">Evaluate candidates against the baseline, enforce promotion criteria, and maintain decision discipline.</p>
      </div>
      <PromotionDashboard />
    </div>
  );
}
