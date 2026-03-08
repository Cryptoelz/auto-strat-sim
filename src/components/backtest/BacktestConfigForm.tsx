import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Share2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { RISK_PRESETS } from '@/hooks/useBacktestConfig';
import {
  BacktestConfigFormProps,
  DateRangeConfig,
  TimeframeConfig,
  AssetsConfig,
  SMAConfig,
  RiskConfig,
  RiskPresetButtons,
  ActionButtons,
} from './config';

export function BacktestConfigForm(props: BacktestConfigFormProps) {
  const {
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    timeframe,
    onTimeframeChange,
    enabledAssets,
    onToggleAsset,
    fastSMA,
    slowSMA,
    onFastSMAChange,
    onSlowSMAChange,
    initialBalance,
    positionSizePercent,
    stopLossPercent,
    takeProfitPercent,
    feePercent,
    onInitialBalanceChange,
    onPositionSizeChange,
    onStopLossChange,
    onTakeProfitChange,
    onFeeChange,
    isRunning,
    progress,
    result,
    onRunBacktest,
    onReset,
    onSaveRun,
    onExportCSV,
    savedRuns,
    showComparison,
    onToggleComparison,
    onClearAllRuns,
    onExportComparison,
    onShareConfig,
    onResetToDefaults,
    onApplyPreset,
  } = props;

  // Field-level validation
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string | undefined> = {};
    
    if (enabledAssets.length === 0) {
      errors.assets = 'Select at least one asset';
    }
    if (startDate >= endDate) {
      errors.dateRange = 'Start date must be before end date';
    }
    if (fastSMA <= 0 || fastSMA > 100) {
      errors.fastSMA = 'Must be between 1-100';
    }
    if (slowSMA <= 0 || slowSMA > 200) {
      errors.slowSMA = 'Must be between 1-200';
    }
    if (fastSMA >= slowSMA) {
      errors.fastSMA = errors.fastSMA || 'Must be less than Slow SMA';
    }
    if (initialBalance < 100) {
      errors.initialBalance = 'Minimum $100';
    }
    if (positionSizePercent < 1 || positionSizePercent > 100) {
      errors.positionSize = 'Must be 1-100%';
    }
    if (stopLossPercent < 0.1 || stopLossPercent > 50) {
      errors.stopLoss = 'Must be 0.1-50%';
    }
    if (takeProfitPercent < 0.1 || takeProfitPercent > 100) {
      errors.takeProfit = 'Must be 0.1-100%';
    }
    if (feePercent < 0 || feePercent > 5) {
      errors.fee = 'Must be 0-5%';
    }
    
    return errors;
  }, [enabledAssets, startDate, endDate, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent]);

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  // Detect active preset
  const activePreset = useMemo(() => {
    for (const [key, preset] of Object.entries(RISK_PRESETS)) {
      if (
        positionSizePercent === preset.positionSizePercent &&
        stopLossPercent === preset.stopLossPercent &&
        takeProfitPercent === preset.takeProfitPercent &&
        fastSMA === preset.fastSMA &&
        slowSMA === preset.slowSMA
      ) {
        return key as keyof typeof RISK_PRESETS;
      }
    }
    return null;
  }, [positionSizePercent, stopLossPercent, takeProfitPercent, fastSMA, slowSMA]);

  const handleShare = async () => {
    if (onShareConfig) {
      const success = await onShareConfig();
      if (success) {
        toast.success('Config URL copied to clipboard');
      } else {
        toast.error('Failed to copy URL');
      }
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Configuration</CardTitle>
          <div className="flex gap-1">
            {onShareConfig && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share config URL</TooltipContent>
              </Tooltip>
            )}
            {onResetToDefaults && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResetToDefaults}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to defaults</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateRangeConfig
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          error={fieldErrors.dateRange}
        />

        <TimeframeConfig
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
        />

        <AssetsConfig
          enabledAssets={enabledAssets}
          onToggleAsset={onToggleAsset}
          error={fieldErrors.assets}
        />

        <SMAConfig
          fastSMA={fastSMA}
          slowSMA={slowSMA}
          onFastSMAChange={onFastSMAChange}
          onSlowSMAChange={onSlowSMAChange}
          fastSMAError={fieldErrors.fastSMA}
          slowSMAError={fieldErrors.slowSMA}
        />

        <RiskConfig
          initialBalance={initialBalance}
          positionSizePercent={positionSizePercent}
          stopLossPercent={stopLossPercent}
          takeProfitPercent={takeProfitPercent}
          feePercent={feePercent}
          onInitialBalanceChange={onInitialBalanceChange}
          onPositionSizeChange={onPositionSizeChange}
          onStopLossChange={onStopLossChange}
          onTakeProfitChange={onTakeProfitChange}
          onFeeChange={onFeeChange}
          errors={{
            initialBalance: fieldErrors.initialBalance,
            positionSize: fieldErrors.positionSize,
            stopLoss: fieldErrors.stopLoss,
            takeProfit: fieldErrors.takeProfit,
            fee: fieldErrors.fee,
          }}
        />

        {onApplyPreset && (
          <RiskPresetButtons
            activePreset={activePreset}
            onApplyPreset={onApplyPreset}
          />
        )}

        <ActionButtons
          isRunning={isRunning}
          progress={progress}
          result={result}
          hasErrors={hasErrors}
          onRunBacktest={onRunBacktest}
          onReset={onReset}
          onSaveRun={onSaveRun}
          onExportCSV={onExportCSV}
          savedRuns={savedRuns}
          showComparison={showComparison}
          onToggleComparison={onToggleComparison}
          onClearAllRuns={onClearAllRuns}
          onExportComparison={onExportComparison}
        />
      </CardContent>
    </Card>
  );
}
