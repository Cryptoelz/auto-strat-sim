import { useMemo } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { AgentGovernanceDashboard } from '@/components/trading/AgentGovernanceDashboard';
import { Asset } from '@/types/trading';

export default function Governance() {
  const {
    state, prices, analytics, strategyConfig,
    governanceConfig, setGovernanceConfig, prevGovStatus,
    peakEquityRef,
  } = useTradingContext();

  const portfolioDrawdown = useMemo(() => {
    let equity = state.balance;
    for (const [asset, pos] of Object.entries(state.positions)) {
      if (!pos || !prices[asset as Asset]) continue;
      const p = prices[asset as Asset]!;
      equity += pos.direction === 'long' ? (p - pos.entryPrice) * pos.size : (pos.entryPrice - p) * pos.size;
    }
    const peak = Math.max(peakEquityRef.current, equity);
    return peak > 0 ? ((peak - equity) / peak) * 100 : 0;
  }, [state, prices, peakEquityRef]);

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
        portfolioDrawdown={portfolioDrawdown}
        governanceConfig={governanceConfig}
        onGovernanceConfigChange={setGovernanceConfig}
        prevStatus={prevGovStatus}
      />
    </div>
  );
}
