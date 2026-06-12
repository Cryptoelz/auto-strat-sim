import { ExperimentDashboard } from '@/components/trading/ExperimentDashboard';
import { BacktestComparisonTable } from '@/components/trading/BacktestComparisonTable';
import { ScenarioComparisonTable } from '@/components/trading/ScenarioComparisonTable';
import { Candidate24Diagnostics } from '@/components/trading/Candidate24Diagnostics';
import { Candidate24Validation } from '@/components/trading/Candidate24Validation';
import { Candidate25Validation } from '@/components/trading/Candidate25Validation';

export default function Experiments() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Experiments</h1>
        <p className="text-xs text-muted-foreground">Track runs, compare configurations, and manage the experiment lifecycle.</p>
      </div>
      <Candidate25Validation />
      <Candidate24Validation />
      <Candidate24Diagnostics />
      <BacktestComparisonTable />
      <ScenarioComparisonTable />
      <ExperimentDashboard />
    </div>
  );
}

