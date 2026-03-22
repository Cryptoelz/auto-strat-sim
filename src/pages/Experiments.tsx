import { ExperimentDashboard } from '@/components/trading/ExperimentDashboard';
import { BacktestComparisonTable } from '@/components/trading/BacktestComparisonTable';
import { ScenarioComparisonTable } from '@/components/trading/ScenarioComparisonTable';

export default function Experiments() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Experiments</h1>
        <p className="text-xs text-muted-foreground">Track runs, compare configurations, and manage the experiment lifecycle.</p>
      </div>
      <BacktestComparisonTable />
      <ScenarioComparisonTable />
      <ExperimentDashboard />
    </div>
  );
}
