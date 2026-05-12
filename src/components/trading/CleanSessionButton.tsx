/**
 * One-click "Start Clean v11 + MPC v2 Session" button.
 * Archives current session, applies Baseline v11 + MPC v2 defaults, and starts a fresh paper run.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTradingContext } from '@/contexts/TradingContext';
import { DEFAULT_CONFIG } from '@/config/trading';
import { Asset } from '@/types/trading';
import { archiveSession } from '@/lib/sessionHistory';
import { DEFAULT_GOVERNANCE_CONFIG } from '@/types/governance';

export function CleanSessionButton() {
  const [open, setOpen] = useState(false);
  const {
    state, drawdown, sessionStartTime,
    setStrategyConfig, setGovernanceConfig,
    reset, toggleRunning, clearEmergencyStop, emergencyStop,
  } = useTradingContext();

  const handleConfirm = () => {
    // 1. Archive current session if it has trades
    if (state.trades.length > 0) {
      archiveSession(state, sessionStartTime, drawdown, 'Pre-clean v11 + MPC v2');
    }

    // 2 & 3. Reset & apply Baseline v11 configuration (includes real-world conditions:
    //   0.1% fees, 0.075% slippage, 1-candle execution delay — see DEFAULT_CONFIG).
    setStrategyConfig({
      timeframe: DEFAULT_CONFIG.timeframe as '5m' | '15m' | '1h' | '4h',
      enabledAssets: DEFAULT_CONFIG.assets as Asset[],
      fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
      slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
      positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
      stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
      takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
      pnlAlertProfit: null,
      pnlAlertLoss: null,
      filters: { ...DEFAULT_CONFIG.filters },
    });

    // 4. MPC v2 is already the active controller (v1 archived). No toggle needed.
    // 5. Participation override defaults to OFF / Use Live Inputs ON on the
    //    /participation page (local state initialized to false).

    // 6. Governance guardrails enabled
    setGovernanceConfig({ ...DEFAULT_GOVERNANCE_CONFIG, enabled: true });

    // Clear any emergency stop, reset state, then start
    if (emergencyStop) clearEmergencyStop();
    reset();

    // 8. Start the agent (reset leaves it stopped)
    setTimeout(() => {
      if (!state.isRunning) toggleRunning();
      toast.success('Clean v11 + MPC v2 session started.');
    }, 50);

    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
      >
        <Sparkles className="h-4 w-4" />
        Start Clean v11 + MPC v2 Session
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a clean Baseline v11 + MPC v2 session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the current session and start a clean Baseline v11 + MPC v2 paper session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Archive & Start</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
