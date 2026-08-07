import { useTradingContext } from '@/contexts/TradingContext';
import { AlertsAndReports } from '@/components/trading/AlertsAndReports';
import { ExecBreadcrumbs, ExecGovernanceFooter } from '@/components/executive/ExecUi';

export default function Alerts() {
  const { state, config, portfolioConfig, unrealizedPnl, drawdown, sessionStartTime } = useTradingContext();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
      <header className="space-y-3 border-b border-border/50 pb-5">
        <ExecBreadcrumbs trail={[{ label: 'ATLAS OS', to: '/atlas' }, { label: 'Executive Layer' }, { label: 'Alerts & Reports' }]} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Alerts &amp; Reports</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Every alert the institution raised, the daily summaries behind them, and exportable reporting for the boardroom.
        </p>
      </header>
      <AlertsAndReports
        state={state}
        config={config}
        portfolioConfig={portfolioConfig}
        unrealizedPnl={unrealizedPnl}
        maxDrawdown={drawdown}
        sessionStartTime={sessionStartTime}
      />
      <ExecGovernanceFooter />
    </div>
  );
}

