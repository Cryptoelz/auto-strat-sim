import { useTradingContext } from '@/contexts/TradingContext';
import { OperatorControlDashboard } from '@/components/trading/OperatorControlDashboard';

export default function OperatorControls() {
  const { operatorState, setOperatorState, operatorConfig, setOperatorConfig } = useTradingContext();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Operator Controls</h1>
        <p className="text-xs text-muted-foreground">Set autonomy level, enforce policy rules, and manage manual overrides.</p>
      </div>
      <OperatorControlDashboard
        operatorState={operatorState}
        onStateChange={setOperatorState}
        operatorConfig={operatorConfig}
        onConfigChange={setOperatorConfig}
      />
    </div>
  );
}
