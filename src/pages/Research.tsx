import { PerformanceResearchDashboard } from '@/components/trading/PerformanceResearchDashboard';

export default function Research() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Performance Research</h1>
        <p className="text-xs text-muted-foreground">Evaluate strategy performance, detect failure patterns, and identify evidence-based improvements.</p>
      </div>
      <PerformanceResearchDashboard />
    </div>
  );
}
