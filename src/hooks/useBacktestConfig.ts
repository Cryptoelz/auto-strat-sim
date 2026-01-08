import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Asset } from '@/types/trading';
import { BacktestConfig, BacktestResult, SavedRun } from '@/types/backtest';
import { loadSavedRuns, saveSavedRuns, exportResultToCSV, exportComparisonToCSV } from '@/lib/backtest-utils';
import { validateBacktestConfig, ValidationResult } from '@/lib/backtest-validation';
import { subDays, parseISO, format } from 'date-fns';

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
 * Risk profile presets
 */
export const RISK_PRESETS = {
  conservative: {
    label: 'Conservative',
    description: 'Lower risk, smaller positions, tighter stops',
    positionSizePercent: 2,
    stopLossPercent: 1,
    takeProfitPercent: 2,
    fastSMA: 10,
    slowSMA: 30,
  },
  moderate: {
    label: 'Moderate',
    description: 'Balanced risk/reward approach',
    positionSizePercent: 5,
    stopLossPercent: 2,
    takeProfitPercent: 4,
    fastSMA: 20,
    slowSMA: 50,
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Higher risk, larger positions, wider stops',
    positionSizePercent: 10,
    stopLossPercent: 4,
    takeProfitPercent: 8,
    fastSMA: 8,
    slowSMA: 21,
  },
} as const;

export type RiskPreset = keyof typeof RISK_PRESETS;

const VALID_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'];
const VALID_TIMEFRAMES = ['5m', '15m', '1h', '4h'] as const;

/**
 * Parse URL search params into config values
 */
function parseUrlConfig(searchParams: URLSearchParams) {
  const parseDate = (key: string, defaultFn: () => Date): Date => {
    const value = searchParams.get(key);
    if (!value) return defaultFn();
    try {
      const parsed = parseISO(value);
      return isNaN(parsed.getTime()) ? defaultFn() : parsed;
    } catch {
      return defaultFn();
    }
  };

  const parseNumber = (key: string, defaultValue: number, min?: number, max?: number): number => {
    const value = searchParams.get(key);
    if (!value) return defaultValue;
    const num = parseFloat(value);
    if (isNaN(num)) return defaultValue;
    if (min !== undefined && num < min) return defaultValue;
    if (max !== undefined && num > max) return defaultValue;
    return num;
  };

  const parseAssets = (): Asset[] => {
    const value = searchParams.get('assets');
    if (!value) return DEFAULT_CONFIG.enabledAssets;
    const assets = value.split(',').filter((a): a is Asset => VALID_ASSETS.includes(a as Asset));
    return assets.length > 0 ? assets : DEFAULT_CONFIG.enabledAssets;
  };

  const parseTimeframe = (): '5m' | '15m' | '1h' | '4h' => {
    const value = searchParams.get('tf');
    if (!value || !VALID_TIMEFRAMES.includes(value as typeof VALID_TIMEFRAMES[number])) {
      return DEFAULT_CONFIG.timeframe;
    }
    return value as '5m' | '15m' | '1h' | '4h';
  };

  return {
    startDate: parseDate('start', DEFAULT_CONFIG.startDate),
    endDate: parseDate('end', DEFAULT_CONFIG.endDate),
    timeframe: parseTimeframe(),
    enabledAssets: parseAssets(),
    fastSMA: parseNumber('fast', DEFAULT_CONFIG.fastSMA, 5, 100),
    slowSMA: parseNumber('slow', DEFAULT_CONFIG.slowSMA, 10, 200),
    initialBalance: parseNumber('balance', DEFAULT_CONFIG.initialBalance, 100),
    positionSizePercent: parseNumber('posSize', DEFAULT_CONFIG.positionSizePercent, 1, 100),
    stopLossPercent: parseNumber('sl', DEFAULT_CONFIG.stopLossPercent, 0.1, 50),
    takeProfitPercent: parseNumber('tp', DEFAULT_CONFIG.takeProfitPercent, 0.1, 100),
    feePercent: parseNumber('fee', DEFAULT_CONFIG.feePercent, 0, 5),
  };
}

/**
 * Custom hook to manage all backtest configuration state
 * Handles date ranges, SMA settings, risk parameters, saved runs, and URL persistence
 */
export function useBacktestConfig() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse initial state from URL or use defaults
  const initialConfig = parseUrlConfig(searchParams);

  // Date range state
  const [startDate, setStartDateState] = useState<Date>(initialConfig.startDate);
  const [endDate, setEndDateState] = useState<Date>(initialConfig.endDate);
  
  // Timeframe and assets
  const [timeframe, setTimeframeState] = useState<'5m' | '15m' | '1h' | '4h'>(initialConfig.timeframe);
  const [enabledAssets, setEnabledAssets] = useState<Asset[]>(initialConfig.enabledAssets);
  
  // SMA settings
  const [fastSMA, setFastSMAState] = useState(initialConfig.fastSMA);
  const [slowSMA, setSlowSMAState] = useState(initialConfig.slowSMA);
  
  // Risk management settings
  const [initialBalance, setInitialBalanceState] = useState(initialConfig.initialBalance);
  const [positionSizePercent, setPositionSizePercentState] = useState(initialConfig.positionSizePercent);
  const [stopLossPercent, setStopLossPercentState] = useState(initialConfig.stopLossPercent);
  const [takeProfitPercent, setTakeProfitPercentState] = useState(initialConfig.takeProfitPercent);
  const [feePercent, setFeePercentState] = useState(initialConfig.feePercent);

  // Saved runs state
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());
  const [showComparison, setShowComparison] = useState(false);
  
  // Custom presets state (slots 4-6)
  type CustomPreset = {
    label: string;
    description: string;
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    fastSMA: number;
    slowSMA: number;
  } | null;
  
  const [customPresets, setCustomPresets] = useState<Record<'4' | '5' | '6', CustomPreset>>(() => {
    try {
      const saved = localStorage.getItem('backtest-custom-presets');
      return saved ? JSON.parse(saved) : { '4': null, '5': null, '6': null };
    } catch {
      return { '4': null, '5': null, '6': null };
    }
  });
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Update URL params when config changes
   */
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('start', format(startDate, 'yyyy-MM-dd'));
    params.set('end', format(endDate, 'yyyy-MM-dd'));
    params.set('tf', timeframe);
    params.set('assets', enabledAssets.join(','));
    params.set('fast', fastSMA.toString());
    params.set('slow', slowSMA.toString());
    params.set('balance', initialBalance.toString());
    params.set('posSize', positionSizePercent.toString());
    params.set('sl', stopLossPercent.toString());
    params.set('tp', takeProfitPercent.toString());
    params.set('fee', feePercent.toString());
    setSearchParams(params, { replace: true });
  }, [startDate, endDate, timeframe, enabledAssets, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent, setSearchParams]);

  // Sync URL when config changes
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Wrapped setters that also clear validation errors
  const setStartDate = useCallback((date: Date) => {
    setStartDateState(date);
    setValidationErrors([]);
  }, []);

  const setEndDate = useCallback((date: Date) => {
    setEndDateState(date);
    setValidationErrors([]);
  }, []);

  const setTimeframe = useCallback((tf: '5m' | '15m' | '1h' | '4h') => {
    setTimeframeState(tf);
    setValidationErrors([]);
  }, []);

  const setFastSMA = useCallback((value: number) => {
    setFastSMAState(value);
    setValidationErrors([]);
  }, []);

  const setSlowSMA = useCallback((value: number) => {
    setSlowSMAState(value);
    setValidationErrors([]);
  }, []);

  const setInitialBalance = useCallback((value: number) => {
    setInitialBalanceState(value);
    setValidationErrors([]);
  }, []);

  const setPositionSizePercent = useCallback((value: number) => {
    setPositionSizePercentState(value);
    setValidationErrors([]);
  }, []);

  const setStopLossPercent = useCallback((value: number) => {
    setStopLossPercentState(value);
    setValidationErrors([]);
  }, []);

  const setTakeProfitPercent = useCallback((value: number) => {
    setTakeProfitPercentState(value);
    setValidationErrors([]);
  }, []);

  const setFeePercent = useCallback((value: number) => {
    setFeePercentState(value);
    setValidationErrors([]);
  }, []);

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
    setFastSMAState(fast);
    setSlowSMAState(slow);
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
    feePercent,
  }), [enabledAssets, startDate, endDate, timeframe, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent]);

  /**
   * Validate current configuration
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
   * Get shareable URL for current configuration
   */
  const getShareableUrl = useCallback((): string => {
    const params = new URLSearchParams();
    params.set('start', format(startDate, 'yyyy-MM-dd'));
    params.set('end', format(endDate, 'yyyy-MM-dd'));
    params.set('tf', timeframe);
    params.set('assets', enabledAssets.join(','));
    params.set('fast', fastSMA.toString());
    params.set('slow', slowSMA.toString());
    params.set('balance', initialBalance.toString());
    params.set('posSize', positionSizePercent.toString());
    params.set('sl', stopLossPercent.toString());
    params.set('tp', takeProfitPercent.toString());
    return `${window.location.origin}/backtest?${params.toString()}`;
  }, [startDate, endDate, timeframe, enabledAssets, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent]);

  /**
   * Copy shareable URL to clipboard
   */
  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      return true;
    } catch {
      return false;
    }
  }, [getShareableUrl]);

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
    setStartDateState(DEFAULT_CONFIG.startDate());
    setEndDateState(DEFAULT_CONFIG.endDate());
    setTimeframeState(DEFAULT_CONFIG.timeframe);
    setEnabledAssets(DEFAULT_CONFIG.enabledAssets);
    setFastSMAState(DEFAULT_CONFIG.fastSMA);
    setSlowSMAState(DEFAULT_CONFIG.slowSMA);
    setInitialBalanceState(DEFAULT_CONFIG.initialBalance);
    setPositionSizePercentState(DEFAULT_CONFIG.positionSizePercent);
    setStopLossPercentState(DEFAULT_CONFIG.stopLossPercent);
    setTakeProfitPercentState(DEFAULT_CONFIG.takeProfitPercent);
    setFeePercentState(DEFAULT_CONFIG.feePercent);
    setValidationErrors([]);
  }, []);

  /**
   * Apply a risk preset
   */
  const applyPreset = useCallback((preset: RiskPreset) => {
    const config = RISK_PRESETS[preset];
    setPositionSizePercentState(config.positionSizePercent);
    setStopLossPercentState(config.stopLossPercent);
    setTakeProfitPercentState(config.takeProfitPercent);
    setFastSMAState(config.fastSMA);
    setSlowSMAState(config.slowSMA);
    setValidationErrors([]);
  }, []);

  /**
   * Save current config to a custom preset slot (4, 5, or 6)
   */
  const saveCustomPreset = useCallback((slot: '4' | '5' | '6', name?: string) => {
    const preset = {
      label: name || `Custom ${slot}`,
      description: name ? `Custom preset: ${name}` : `Saved preset in slot ${slot}`,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent,
      fastSMA,
      slowSMA,
    };
    const updated = { ...customPresets, [slot]: preset };
    setCustomPresets(updated);
    localStorage.setItem('backtest-custom-presets', JSON.stringify(updated));
  }, [positionSizePercent, stopLossPercent, takeProfitPercent, fastSMA, slowSMA, customPresets]);

  /**
   * Load a custom preset from slot (4, 5, or 6)
   */
  const loadCustomPreset = useCallback((slot: '4' | '5' | '6'): boolean => {
    const preset = customPresets[slot];
    if (!preset) return false;
    setPositionSizePercentState(preset.positionSizePercent);
    setStopLossPercentState(preset.stopLossPercent);
    setTakeProfitPercentState(preset.takeProfitPercent);
    setFastSMAState(preset.fastSMA);
    setSlowSMAState(preset.slowSMA);
    setValidationErrors([]);
    return true;
  }, [customPresets]);

  /**
   * Check if a custom preset slot has data
   */
  const hasCustomPreset = useCallback((slot: '4' | '5' | '6'): boolean => {
    return customPresets[slot] !== null;
  }, [customPresets]);

  /**
   * Get custom preset data for a slot
   */
  const getCustomPreset = useCallback((slot: '4' | '5' | '6') => {
    return customPresets[slot];
  }, [customPresets]);

  /**
   * Delete a custom preset from a slot
   */
  const deleteCustomPreset = useCallback((slot: '4' | '5' | '6') => {
    const updated = { ...customPresets, [slot]: null };
    setCustomPresets(updated);
    localStorage.setItem('backtest-custom-presets', JSON.stringify(updated));
  }, [customPresets]);

  /**
   * Rename a custom preset in a slot
   */
  const renameCustomPreset = useCallback((slot: '4' | '5' | '6', newName: string) => {
    const preset = customPresets[slot];
    if (!preset) return;
    const updated = {
      ...customPresets,
      [slot]: {
        ...preset,
        label: newName || `Custom ${slot}`,
        description: newName ? `Custom preset: ${newName}` : `Saved preset in slot ${slot}`,
      },
    };
    setCustomPresets(updated);
    localStorage.setItem('backtest-custom-presets', JSON.stringify(updated));
  }, [customPresets]);

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
    feePercent,
    setInitialBalance,
    setPositionSizePercent,
    setStopLossPercent,
    setTakeProfitPercent,
    setFeePercent,
    
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
    
    // URL sharing
    getShareableUrl,
    copyShareableUrl,
    
    // Actions
    buildConfig,
    exportCSV,
    exportComparison,
    resetConfig,
    applyPreset,
    
    // Custom presets
    saveCustomPreset,
    loadCustomPreset,
    hasCustomPreset,
    getCustomPreset,
    deleteCustomPreset,
    renameCustomPreset,
  };
}
