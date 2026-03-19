import { useTradingContext } from '@/contexts/TradingContext';
import { AlertsAndReports } from '@/components/trading/AlertsAndReports';

export default function Alerts() {
  const { state, config, portfolioConfig, unrealizedPnl, drawdown, sessionStartTime } = useTradingContext();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Alerts & Reports</h1>
        <p className="text-xs text-muted-foreground">View alerts, daily summaries, and export trading reports.</p>
      </div>
      <AlertsAndReports
        state={state}
        config={config}
        portfolioConfig={portfolioConfig}
        unrealizedPnl={unrealizedPnl}
        maxDrawdown={drawdown}
        sessionStartTime={sessionStartTime}
      />
    </div>
  );
}
