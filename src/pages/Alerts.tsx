import { useTradingContext } from '@/contexts/TradingContext';
import { AlertsAndReports } from '@/components/trading/AlertsAndReports';
import { Asset } from '@/types/trading';

export default function Alerts() {
  const { state, config, portfolioConfig, prices, sessionStartTime } = useTradingContext();

  const unrealizedPnl = Object.entries(state.positions).reduce((sum, [asset, pos]) => {
    if (!pos || !prices[asset as Asset]) return sum;
    const p = prices[asset as Asset]!;
    return sum + (pos.direction === 'long' ? (p - pos.entryPrice) * pos.size : (pos.entryPrice - p) * pos.size);
  }, 0);

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
        maxDrawdown={0}
        sessionStartTime={sessionStartTime}
      />
    </div>
  );
}
