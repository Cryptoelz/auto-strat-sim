import { useState, useCallback } from 'react';
import { Asset } from '@/types/trading';
import { BacktestConfig, BacktestResult, SavedRun } from '@/types/backtest';
import { loadSavedRuns, saveSavedRuns, exportResultToCSV, exportComparisonToCSV } from '@/lib/backtest-utils';
import { validateBacktestConfig, ValidationResult } from '@/lib/backtest-validation';
import { subDays } from 'date-fns';

/**
 * Default configuration values for backtesting
 */
const DEFAULT_CONFIG = {
  startDate: () => subDays(new Date(), 30),
  endDate: () => new Date(),
  timeframe: '15m' as const,
  enabledAssets: ['BTCUSDT', 'XRPUSDT'] as Asset[],
  fastSMA: 20,
  slowSMA: 50,
  initialBalance: 10000,
  positionSizePercent: 5,
  stopLossPercent: 2,
  takeProfitPercent: 4,
  feePercent: 0.1,
};

/**
 * Custom hook to manage all backtest configuration state
 * Handles date ranges, SMA settings, risk parameters, and saved runs
 */
export function useBacktestConfig() {
  // Date range state
  const [startDate, setStartDate] = useState<Date>(DEFAULT_CONFIG.startDate);
  const [endDate, setEndDate] = useState<Date>(DEFAULT_CONFIG.endDate);
  
  // Timeframe and assets
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '4h'>(DEFAULT_CONFIG.timeframe);
  const [enabledAssets, setEnabledAssets] = useState<Asset[]>(DEFAULT_CONFIG.enabledAssets);
  
  // SMA settings
  const [fastSMA, setFastSMA] = useState(DEFAULT_CONFIG.fastSMA);
  const [slowSMA, setSlowSMA] = useState(DEFAULT_CONFIG.slowSMA);
  
  // Risk management settings
  const [initialBalance, setInitialBalance] = useState(DEFAULT_CONFIG.initialBalance);
  const [positionSizePercent, setPositionSizePercent] = useState(DEFAULT_CONFIG.positionSizePercent);
  const [stopLossPercent, setStopLossPercent] = useState(DEFAULT_CONFIG.stopLossPercent);
  const [takeProfitPercent, setTakeProfitPercent] = useState(DEFAULT_CONFIG.takeProfitPercent);

  // Saved runs state
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());
  const [showComparison, setShowComparison] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Toggle an asset's inclusion in the backtest
   */
  const toggleAsset = useCallback((asset: Asset) => {
    setEnabledAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
    setValidationErrors([]);
  }, []);

  /**
   * Apply optimal SMA parameters from optimization
   */
  const applyOptimalSMA = useCallback((fast: number, slow: number) => {
    setFastSMA(fast);
    setSlowSMA(slow);
    setValidationErrors([]);
  }, []);

  /**
   * Build a BacktestConfig object from current state
   */
  const buildConfig = useCallback((): BacktestConfig => ({
    assets: enabledAssets,
    startDate,
    endDate,
    timeframe,
    fastSMA,
    slowSMA,
    initialBalance,
    positionSizePercent,
    stopLossPercent,
    takeProfitPercent,
    feePercent: DEFAULT_CONFIG.feePercent,
  }), [enabledAssets, startDate, endDate, timeframe, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent]);

  /**
   * Validate current configuration
   * @returns Validation result with errors if any
   */
  const validateConfig = useCallback((): ValidationResult => {
    const config = buildConfig();
    const result = validateBacktestConfig(config);
    setValidationErrors(result.errors);
    return result;
  }, [buildConfig]);

  /**
   * Clear validation errors
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  /**
   * Save current backtest result for comparison
   */
  const saveCurrentRun = useCallback((result: BacktestResult) => {
    const runName = `SMA ${fastSMA}/${slowSMA} ${timeframe}`;
    const newRun: SavedRun = {
      id: `run-${Date.now()}`,
      name: runName,
      savedAt: Date.now(),
      config: {
        assets: enabledAssets,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeframe,
        fastSMA,
        slowSMA,
        initialBalance,
        positionSizePercent,
        stopLossPercent,
        takeProfitPercent,
      },
      result: {
        finalBalance: result.finalBalance,
        totalPnl: result.totalPnl,
        totalPnlPercent: result.totalPnlPercent,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        maxDrawdown: result.maxDrawdown,
        profitFactor: result.profitFactor,
        sharpeRatio: result.sharpeRatio,
      },
    };

    const updatedRuns = [...savedRuns, newRun];
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  }, [enabledAssets, startDate, endDate, timeframe, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, savedRuns]);

  /**
   * Delete a saved run by ID
   */
  const deleteRun = useCallback((id: string) => {
    const updatedRuns = savedRuns.filter(r => r.id !== id);
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  }, [savedRuns]);

  /**
   * Clear all saved runs
   */
  const clearAllRuns = useCallback(() => {
    setSavedRuns([]);
    saveSavedRuns([]);
    setShowComparison(false);
  }, []);

  /**
   * Toggle comparison view
   */
  const toggleComparison = useCallback(() => {
    setShowComparison(prev => !prev);
  }, []);

  /**
   * Export current result to CSV
   */
  const exportCSV = useCallback((result: BacktestResult) => {
    exportResultToCSV(result, { fastSMA, slowSMA, timeframe });
  }, [fastSMA, slowSMA, timeframe]);

  /**
   * Export comparison data to CSV
   */
  const exportComparison = useCallback(() => {
    exportComparisonToCSV(savedRuns);
  }, [savedRuns]);

  /**
   * Reset all configuration to defaults
   */
  const resetConfig = useCallback(() => {
    setStartDate(DEFAULT_CONFIG.startDate());
    setEndDate(DEFAULT_CONFIG.endDate());
    setTimeframe(DEFAULT_CONFIG.timeframe);
    setEnabledAssets(DEFAULT_CONFIG.enabledAssets);
    setFastSMA(DEFAULT_CONFIG.fastSMA);
    setSlowSMA(DEFAULT_CONFIG.slowSMA);
    setInitialBalance(DEFAULT_CONFIG.initialBalance);
    setPositionSizePercent(DEFAULT_CONFIG.positionSizePercent);
    setStopLossPercent(DEFAULT_CONFIG.stopLossPercent);
    setTakeProfitPercent(DEFAULT_CONFIG.takeProfitPercent);
    setValidationErrors([]);
  }, []);

  return {
    // Date config
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    
    // Timeframe and assets
    timeframe,
    setTimeframe,
    enabledAssets,
    toggleAsset,
    
    // SMA settings
    fastSMA,
    slowSMA,
    setFastSMA,
    setSlowSMA,
    applyOptimalSMA,
    
    // Risk settings
    initialBalance,
    positionSizePercent,
    stopLossPercent,
    takeProfitPercent,
    setInitialBalance,
    setPositionSizePercent,
    setStopLossPercent,
    setTakeProfitPercent,
    
    // Saved runs
    savedRuns,
    showComparison,
    saveCurrentRun,
    deleteRun,
    clearAllRuns,
    toggleComparison,
    
    // Validation
    validationErrors,
    validateConfig,
    clearValidationErrors,
    
    // Actions
    buildConfig,
    exportCSV,
    exportComparison,
    resetConfig,
  };
}
