import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VolumeControl } from '@/components/VolumeControl';
import { NotificationToggle } from '@/components/NotificationToggle';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { StrategySettings, StrategyConfig } from '@/components/StrategySettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  lastUpdate: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  onReset: () => void;
  onConfigChange: (config: StrategyConfig) => void;
  strategyConfig: StrategyConfig;
  notificationPermission: NotificationPermission;
  notificationsSupported: boolean;
  onRequestNotifications: () => void;
  keyboardEnabled: boolean;
  onToggleKeyboard: () => void;
}

export function DashboardHeader({
  lastUpdate,
  isLoading,
  onRefresh,
  onReset,
  onConfigChange,
  strategyConfig,
  notificationPermission,
  notificationsSupported,
  onRequestNotifications,
  keyboardEnabled,
  onToggleKeyboard,
}: DashboardHeaderProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    onReset();
    setShowResetDialog(false);
  };

  return (
    <>
      <header className="border-b border-border/50 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 py-3 md:py-4">
          {/* Mobile: stacked layout, Desktop: side by side */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Title section */}
            <div className="flex items-center justify-between md:block">
              <div>
                <h1 className="text-lg font-bold md:text-2xl">Crypto Trading Simulator</h1>
                <p className="text-xs text-muted-foreground md:text-sm">
                  SMA {strategyConfig.fastSMA}/{strategyConfig.slowSMA} • SL {strategyConfig.stopLossPercent}% / TP {strategyConfig.takeProfitPercent}%
                </p>
              </div>
              {/* Mobile only: settings, theme and volume toggles */}
              <div className="flex items-center gap-2 md:hidden">
                <StrategySettings onConfigChange={onConfigChange} />
                <KeyboardShortcutsHelp enabled={keyboardEnabled} onToggle={onToggleKeyboard} />
                <NotificationToggle
                  permission={notificationPermission}
                  isSupported={notificationsSupported}
                  onRequestPermission={onRequestNotifications}
                />
                <VolumeControl />
                <ThemeToggle />
              </div>
            </div>

            {/* Controls section */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              {lastUpdate && (
                <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                  <Clock className="h-4 w-4" />
                  <span>Updated {format(lastUpdate, 'HH:mm:ss')}</span>
                </div>
              )}

              <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs">
                PAPER TRADING
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetClick}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive md:h-9 md:px-3 md:text-sm"
              >
                <RotateCcw className="h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden md:inline">Reset</span>
              </Button>

              {/* Desktop only: settings, theme and volume toggles */}
              <div className="hidden items-center gap-2 md:flex">
                <StrategySettings onConfigChange={onConfigChange} />
                <KeyboardShortcutsHelp enabled={keyboardEnabled} onToggle={onToggleKeyboard} />
                <NotificationToggle
                  permission={notificationPermission}
                  isSupported={notificationsSupported}
                  onRequestPermission={onRequestNotifications}
                />
                <VolumeControl />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reset All Trading Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your trades, positions, and journal notes. 
              Your balance will be reset to $10,000. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
