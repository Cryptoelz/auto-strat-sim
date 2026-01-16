import { Asset } from '@/types/trading';
import { BacktestResult, SavedRun } from '@/types/backtest';
import { PresetVersion, PresetTagValue, PresetVersionHistory } from '@/types/preset-version';
import { RiskPreset } from '@/hooks/useBacktestConfig';

export interface FieldErrors {
  assets?: string;
  dateRange?: string;
  fastSMA?: string;
  slowSMA?: string;
  initialBalance?: string;
  positionSize?: string;
  stopLoss?: string;
  takeProfit?: string;
  fee?: string;
}

export interface BacktestConfigFormProps {
  // Date config
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  
  // Timeframe
  timeframe: '5m' | '15m' | '1h' | '4h';
  onTimeframeChange: (tf: '5m' | '15m' | '1h' | '4h') => void;
  
  // Assets
  enabledAssets: Asset[];
  onToggleAsset: (asset: Asset) => void;
  
  // SMA settings
  fastSMA: number;
  slowSMA: number;
  onFastSMAChange: (value: number) => void;
  onSlowSMAChange: (value: number) => void;
  
  // Risk settings
  initialBalance: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  feePercent: number;
  onInitialBalanceChange: (value: number) => void;
  onPositionSizeChange: (value: number) => void;
  onStopLossChange: (value: number) => void;
  onTakeProfitChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  
  // Actions
  isRunning: boolean;
  progress: number;
  result: BacktestResult | null;
  onRunBacktest: () => void;
  onReset: () => void;
  onSaveRun: () => void;
  onExportCSV: () => void;
  
  // Saved runs
  savedRuns: SavedRun[];
  showComparison: boolean;
  onToggleComparison: () => void;
  onClearAllRuns: () => void;
  onExportComparison: () => void;
  
  // Share & Reset
  onShareConfig?: () => Promise<boolean>;
  onResetToDefaults?: () => void;
  onApplyPreset?: (preset: RiskPreset) => void;
  
  // Custom presets
  customPresetSlots?: { '4': boolean; '5': boolean; '6': boolean };
  onLoadCustomPreset?: (slot: '4' | '5' | '6') => boolean;
  onSaveCustomPreset?: (slot: '4' | '5' | '6', name?: string) => void;
  onDeleteCustomPreset?: (slot: '4' | '5' | '6') => void;
  onRenameCustomPreset?: (slot: '4' | '5' | '6', newName: string) => void;
  getCustomPresetData?: (slot: '4' | '5' | '6') => { label: string; positionSizePercent: number; stopLossPercent: number; takeProfitPercent: number; fastSMA: number; slowSMA: number } | null;
  onExportCustomPresets?: () => boolean;
  onImportCustomPresets?: (json: string, mode?: 'replace' | 'merge') => { success: boolean; message: string };
  onClearAllCustomPresets?: () => void;
  lastPresetSync?: { action: 'import' | 'export'; timestamp: number } | null;
  
  // Preset versioning
  getPresetVersionHistory?: (slot: '4' | '5' | '6') => PresetVersion[];
  onRestorePresetVersion?: (slot: '4' | '5' | '6', versionId: string) => boolean;
  hasPresetHistory?: (slot: '4' | '5' | '6') => boolean;
  onImportVersionHistory?: (slot: '4' | '5' | '6', versions: PresetVersion[], mode?: 'replace' | 'merge') => { success: boolean; imported: number };
  onDeleteVersions?: (slot: '4' | '5' | '6', versionIds: string[]) => number;
  onUndoDeleteVersions?: () => boolean;
  onClearDeleteBackup?: () => void;
  onDuplicateVersion?: (slot: '4' | '5' | '6', versionId: string) => PresetVersion | null;
  onUpdateVersionNote?: (slot: '4' | '5' | '6', versionId: string, note: string) => boolean;
  onToggleVersionPin?: (slot: '4' | '5' | '6', versionId: string) => boolean;
  onToggleVersionTag?: (slot: '4' | '5' | '6', versionId: string, tag: PresetTagValue) => boolean;
  onBulkToggleVersionTag?: (slot: '4' | '5' | '6', versionIds: string[], tag: PresetTagValue, action: 'add' | 'remove') => number;
  
  // Auto-save control
  autoSaveVersions?: boolean;
  onAutoSaveVersionsChange?: (enabled: boolean) => void;
  onManualSaveVersion?: (slot: '4' | '5' | '6', data: PresetVersion['data']) => PresetVersion;
  
  // Debounce control
  debounceDelay?: number;
  onDebounceDelayChange?: (delay: number) => void;
  hasPendingSave?: (slot: '4' | '5' | '6') => boolean;
  onFlushPendingSave?: (slot: '4' | '5' | '6') => PresetVersion | null;
  onCancelPendingSave?: (slot: '4' | '5' | '6') => void;
  pendingSlots?: Set<'4' | '5' | '6'>;
  getPendingSaveStartTime?: (slot: '4' | '5' | '6') => number | null;
  wasRecentlySaved?: (slot: '4' | '5' | '6') => boolean;
  wasCancelledRecently?: (slot: '4' | '5' | '6') => boolean;
  
  // External version history dialog control
  versionHistoryOpen?: boolean;
  onVersionHistoryOpenChange?: (open: boolean) => void;
  
  // Storage usage
  getTotalVersionCount?: () => number;
  versionHistory?: PresetVersionHistory;
  onClearAllVersionHistory?: () => void;
  
  // Auto-cleanup
  autoCleanupEnabled?: boolean;
  onAutoCleanupEnabledChange?: (enabled: boolean) => void;
  cleanupThreshold?: number;
  onCleanupThresholdChange?: (threshold: number) => void;
  lastCleanupCount?: number;
  onManualCleanup?: (count?: number) => number;
  onUndoManualCleanup?: () => boolean;
  canUndoCleanup?: boolean;
  cleanupBackupTimestamp?: number | null;
  
  // Smart cleanup
  onSmartCleanup?: (keepCount?: number) => number;
  onGetSmartCleanupPreview?: (keepCount?: number) => {
    kept: { slot: '4' | '5' | '6'; version: PresetVersion; score: number }[];
    removed: { slot: '4' | '5' | '6'; version: PresetVersion; score: number }[];
  };
  versionsWithPerformanceCount?: number;
}

export const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

export const AVAILABLE_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'];
