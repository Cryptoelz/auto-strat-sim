import { useTradingContext } from '@/contexts/TradingContext';
import { AgentGovernanceDashboard } from '@/components/trading/AgentGovernanceDashboard';

export default function Governance() {
  const {
    state, analytics, strategyConfig,
    governanceConfig, setGovernanceConfig, prevGovStatus,
  } = useTradingContext();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Governance & Guardrails</h1>
        <p className="text-xs text-muted-foreground">Monitor governance state, configure guardrails, and review intervention history.</p>
      </div>
      <AgentGovernanceDashboard
        state={state}
        analytics={analytics}
        enabledAssets={strategyConfig.enabledAssets}
        portfolioDrawdown={0}
        governanceConfig={governanceConfig}
        onGovernanceConfigChange={setGovernanceConfig}
        prevStatus={prevGovStatus}
      />
    </div>
  );
}
