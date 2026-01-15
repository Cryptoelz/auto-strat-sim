import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Asset } from '@/types/trading';
import { BacktestResult, SavedRun } from '@/types/backtest';
import { PresetVersion, PRESET_TAGS, PresetTagValue, PresetVersionHistory } from '@/types/preset-version';
import { VersionTimeline } from './VersionTimeline';
import { ParameterSparklines } from './ParameterSparklines';
import { VersionDiffSparklines } from './VersionDiffSparklines';
import { ASSET_INFO } from '@/config/trading';
import { RISK_PRESETS, RiskPreset } from '@/hooks/useBacktestConfig';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  GitCompare,
  Download,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  RefreshCcw,
  X,
  Pencil,
  Upload,
  History,
  Copy,
  MessageSquare,
  Pin,
  Search,
  Tag,
  Volume2,
  ChevronDown,
  Clock,
  Undo2,
  HardDrive,
  Zap,
  Sparkles,
  Trophy,
  Medal,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSaveSoundEnabled, setSaveSoundEnabled } from '@/lib/sounds';

interface TooltipLabelProps {
  label: string;
  tooltip: string;
  className?: string;
  error?: boolean;
}

function TooltipLabel({ label, tooltip, className, error }: TooltipLabelProps) {
  return (
    <div className="flex items-center gap-1">
      <Label className={cn(className, error && "text-destructive")}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface FieldErrors {
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

/**
 * Calculate performance score for ranking versions
 */
function calculatePerformanceScore(performance: PresetVersion['performance']): number {
  if (!performance) return -Infinity;
  
  const p = performance;
  
  // Composite score matching usePresetVersioning logic
  const sharpeScore = p.sharpeRatio * 20;
  const profitFactorScore = Math.min(p.profitFactor, 5) * 10;
  const winRateScore = p.winRate * 0.3;
  const drawdownPenalty = p.maxDrawdown * 0.5;
  const pnlScore = Math.max(-50, Math.min(50, p.totalPnlPercent));
  
  return sharpeScore + profitFactorScore + winRateScore - drawdownPenalty + pnlScore;
}

/**
 * Performance ranking badge component
 */
function PerformanceRankBadge({ 
  version, 
  allVersions 
}: { 
  version: PresetVersion; 
  allVersions: PresetVersion[];
}) {
  if (!version.performance) return null;
  
  // Get all versions with performance data and rank them
  const versionsWithPerformance = allVersions
    .filter(v => v.performance)
    .map(v => ({
      id: v.id,
      score: calculatePerformanceScore(v.performance),
    }))
    .sort((a, b) => b.score - a.score);
  
  if (versionsWithPerformance.length < 2) {
    // Need at least 2 versions to show ranking
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            <Zap className="h-2.5 w-2.5" />
            Tested
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs font-medium mb-1">Performance Recorded</p>
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p>PnL: {version.performance.totalPnlPercent >= 0 ? '+' : ''}{version.performance.totalPnlPercent.toFixed(2)}%</p>
            <p>Win Rate: {version.performance.winRate.toFixed(1)}%</p>
            <p>Sharpe: {version.performance.sharpeRatio.toFixed(2)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  const rank = versionsWithPerformance.findIndex(v => v.id === version.id) + 1;
  const totalWithPerformance = versionsWithPerformance.length;
  
  // Determine badge style based on rank
  let BadgeIcon = Award;
  let badgeColor = 'bg-muted text-muted-foreground';
  let rankLabel = `#${rank}`;
  
  if (rank === 1) {
    BadgeIcon = Trophy;
    badgeColor = 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
    rankLabel = '1st';
  } else if (rank === 2) {
    BadgeIcon = Medal;
    badgeColor = 'bg-slate-300/30 text-slate-600 dark:text-slate-300';
    rankLabel = '2nd';
  } else if (rank === 3) {
    BadgeIcon = Medal;
    badgeColor = 'bg-amber-700/20 text-amber-700 dark:text-amber-500';
    rankLabel = '3rd';
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-medium",
          badgeColor
        )}>
          <BadgeIcon className="h-2.5 w-2.5" />
          {rankLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <p className="text-xs font-medium mb-1">
          {rank === 1 ? '🥇 Best Performer' : rank === 2 ? '🥈 Second Best' : rank === 3 ? '🥉 Third Best' : `Rank #${rank} of ${totalWithPerformance}`}
        </p>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <p>PnL: {version.performance.totalPnlPercent >= 0 ? '+' : ''}{version.performance.totalPnlPercent.toFixed(2)}%</p>
          <p>Win Rate: {version.performance.winRate.toFixed(1)}%</p>
          <p>Max Drawdown: {version.performance.maxDrawdown.toFixed(2)}%</p>
          <p>Profit Factor: {version.performance.profitFactor.toFixed(2)}</p>
          <p>Sharpe Ratio: {version.performance.sharpeRatio.toFixed(2)}</p>
          <p className="text-muted-foreground/60 pt-1">Trades: {version.performance.totalTrades}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Countdown timer component for pending saves
 */
function PendingSaveCountdown({ 
  startTime, 
  delay 
}: { 
  startTime: number; 
  delay: number; 
}) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Date.now() - startTime;
    return Math.max(0, delay - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, delay - elapsed);
      setRemaining(newRemaining);
      
      if (newRemaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, delay]);

  const seconds = (remaining / 1000).toFixed(1);
  const progress = ((delay - remaining) / delay) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-4 w-4">
        <svg className="h-4 w-4 -rotate-90" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted/30"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progress * 0.377} 100`}
            className="text-amber-500 transition-all duration-100"
          />
        </svg>
      </div>
      <span className="font-mono text-xs tabular-nums">{seconds}s</span>
    </div>
  );
}

const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

const AVAILABLE_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'];

interface BacktestConfigFormProps {
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

export function BacktestConfigForm({
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
  customPresetSlots,
  onLoadCustomPreset,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onRenameCustomPreset,
  getCustomPresetData,
  onExportCustomPresets,
  onImportCustomPresets,
  onClearAllCustomPresets,
  lastPresetSync,
  getPresetVersionHistory,
  onRestorePresetVersion,
  hasPresetHistory,
  onImportVersionHistory,
  onDeleteVersions,
  onUndoDeleteVersions,
  onClearDeleteBackup,
  onDuplicateVersion,
  onUpdateVersionNote,
  onToggleVersionPin,
  onToggleVersionTag,
  onBulkToggleVersionTag,
  autoSaveVersions = true,
  onAutoSaveVersionsChange,
  onManualSaveVersion,
  debounceDelay = 3000,
  onDebounceDelayChange,
  hasPendingSave,
  onFlushPendingSave,
  onCancelPendingSave,
  pendingSlots,
  getPendingSaveStartTime,
  wasRecentlySaved,
  wasCancelledRecently,
  versionHistoryOpen: externalVersionHistoryOpen,
  onVersionHistoryOpenChange,
  getTotalVersionCount,
  versionHistory,
  onClearAllVersionHistory,
  autoCleanupEnabled = true,
  onAutoCleanupEnabledChange,
  cleanupThreshold = 80,
  onCleanupThresholdChange,
  lastCleanupCount = 0,
  onManualCleanup,
  onUndoManualCleanup,
  canUndoCleanup = false,
  cleanupBackupTimestamp,
  onSmartCleanup,
  onGetSmartCleanupPreview,
  versionsWithPerformanceCount = 0,
}: BacktestConfigFormProps) {
  const [copied, setCopied] = useState(false);
  const [clearPresetsConfirmOpen, setClearPresetsConfirmOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [saveSoundEnabledState, setSaveSoundEnabledState] = useState(() => getSaveSoundEnabled());
  const [pendingPresetSlot, setPendingPresetSlot] = useState<'4' | '5' | '6' | null>(null);
  const [presetName, setPresetName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [versionHistorySlot, setVersionHistorySlot] = useState<'4' | '5' | '6' | null>(null);
  const [compareVersions, setCompareVersions] = useState<[string | null, string | null]>([null, null]);
  const [versionFieldFilter, setVersionFieldFilter] = useState<string | null>(null);
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [batchSelectedVersions, setBatchSelectedVersions] = useState<Set<string>>(new Set());
  const [deleteVersionsConfirmOpen, setDeleteVersionsConfirmOpen] = useState(false);
  const [editingNoteVersionId, setEditingNoteVersionId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [versionSearchQuery, setVersionSearchQuery] = useState('');
  const [versionTagFilter, setVersionTagFilter] = useState<PresetTagValue | null>(null);
  const [restorePreviewVersionId, setRestorePreviewVersionId] = useState<string | null>(null);
  const [versionHistoryDragging, setVersionHistoryDragging] = useState(false);
  const [clearAllHistoryConfirmOpen, setClearAllHistoryConfirmOpen] = useState(false);
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const [pendingCleanupCount, setPendingCleanupCount] = useState<number | null>(null);
  const [pendingCleanupPreview, setPendingCleanupPreview] = useState<string>('');
  const [smartCleanupPreviewOpen, setSmartCleanupPreviewOpen] = useState(false);
  const [pendingSmartCleanupKeepCount, setPendingSmartCleanupKeepCount] = useState<number>(3);
  const [smartCleanupPreviewData, setSmartCleanupPreviewData] = useState<{
    kept: { slot: '4' | '5' | '6'; version: PresetVersion; score: number }[];
    removed: { slot: '4' | '5' | '6'; version: PresetVersion; score: number }[];
  } | null>(null);
  const [manuallyProtectedVersions, setManuallyProtectedVersions] = useState<Set<string>>(new Set());
  const [cleanupPreviewTab, setCleanupPreviewTab] = useState<'list' | 'compare'>('list');
  const [cleanupSortColumn, setCleanupSortColumn] = useState<'pnl' | 'winRate' | 'sharpe' | null>(null);
  const [cleanupSortDirection, setCleanupSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Force re-render for countdown timer
  const [, setCountdownTick] = useState(0);
  useEffect(() => {
    if (!canUndoCleanup || !cleanupBackupTimestamp) return;
    
    const interval = setInterval(() => {
      setCountdownTick(t => t + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [canUndoCleanup, cleanupBackupTimestamp]);

  // Handle external version history dialog control
  useEffect(() => {
    if (externalVersionHistoryOpen && !versionHistorySlot) {
      // Find first available preset slot with history
      const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
      for (const slot of slots) {
        if (customPresetSlots?.[slot]) {
          setVersionHistorySlot(slot);
          break;
        }
      }
    } else if (!externalVersionHistoryOpen && versionHistorySlot && onVersionHistoryOpenChange) {
      // Keep in sync - if external says closed but we have a slot, close it
    }
  }, [externalVersionHistoryOpen, customPresetSlots]);

  // Sync internal slot state back to parent
  useEffect(() => {
    if (onVersionHistoryOpenChange) {
      onVersionHistoryOpenChange(versionHistorySlot !== null);
    }
  }, [versionHistorySlot, onVersionHistoryOpenChange]);

  // Keyboard shortcuts for version history
  useEffect(() => {
    if (!versionHistorySlot || !batchSelectMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (getPresetVersionHistory) {
          const versions = getPresetVersionHistory(versionHistorySlot);
          setBatchSelectedVersions(new Set(versions.map(v => v.id)));
        }
      }
      
      // Delete or Backspace to open delete confirmation
      if ((e.key === 'Delete' || e.key === 'Backspace') && batchSelectedVersions.size > 0) {
        e.preventDefault();
        setDeleteVersionsConfirmOpen(true);
      }
      
      // Escape to exit batch mode
      if (e.key === 'Escape') {
        e.preventDefault();
        setBatchSelectMode(false);
        setBatchSelectedVersions(new Set());
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [versionHistorySlot, batchSelectMode, batchSelectedVersions, getPresetVersionHistory, onDeleteVersions]);

  // Track currently active custom preset slot for Ctrl+S shortcut
  const [activeCustomPresetSlot, setActiveCustomPresetSlot] = useState<'4' | '5' | '6' | null>(null);

  // Ctrl+S keyboard shortcut to manually save a version
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save version
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        // Check if we have an active custom preset to save
        const slotToSave = activeCustomPresetSlot || versionHistorySlot;
        
        if (slotToSave && onManualSaveVersion && getCustomPresetData) {
          e.preventDefault();
          const presetData = getCustomPresetData(slotToSave);
          if (presetData) {
            onManualSaveVersion(slotToSave, {
              ...presetData,
              description: `Manual save: ${presetData.label}`,
            });
            toast.success('Version saved', {
              description: `Saved "${presetData.label}" to version history (Ctrl+S)`,
            });
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCustomPresetSlot, versionHistorySlot, onManualSaveVersion, getCustomPresetData]);

  // Count existing presets (moved up for use in handleFileDrop)
  const existingPresetCount = useMemo(() => {
    if (!customPresetSlots) return 0;
    return Object.values(customPresetSlots).filter(Boolean).length;
  }, [customPresetSlots]);

  // Handle file drop for import
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!onImportCustomPresets) return;
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      toast.error('Invalid file type', { description: 'Please drop a JSON file' });
      return;
    }
    
    // Validate file size (max 100KB for preset files)
    if (file.size > 100 * 1024) {
      toast.error('File too large', { description: 'Preset files should be under 100KB' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      // Validate JSON structure
      try {
        const data = JSON.parse(json);
        if (!data.presets || typeof data.presets !== 'object') {
          toast.error('Invalid preset file', { description: 'File does not contain valid presets' });
          return;
        }
      } catch {
        toast.error('Invalid JSON', { description: 'Could not parse the file' });
        return;
      }
      
      // If there are existing presets, show confirmation
      if (existingPresetCount > 0) {
        setPendingImportJson(json);
        setImportConfirmOpen(true);
      } else {
        // No existing presets, import directly
        const result = onImportCustomPresets(json);
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error('Import failed', { description: result.message });
        }
      }
    };
    reader.readAsText(file);
  }, [onImportCustomPresets, existingPresetCount]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onImportCustomPresets) {
      setIsDragging(true);
    }
  }, [onImportCustomPresets]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Parse pending import for preview
  type PreviewPreset = { label: string; fastSMA: number; slowSMA: number; positionSizePercent: number; stopLossPercent: number; takeProfitPercent: number };
  const importPreview = useMemo<Record<'4' | '5' | '6', PreviewPreset | null>>(() => {
    if (!pendingImportJson) return { '4': null, '5': null, '6': null };
    try {
      const data = JSON.parse(pendingImportJson);
      if (!data.presets) return { '4': null, '5': null, '6': null };
      const result: Record<'4' | '5' | '6', PreviewPreset | null> = { '4': null, '5': null, '6': null };
      for (const slot of ['4', '5', '6'] as const) {
        const p = data.presets[slot];
        if (p && typeof p.fastSMA === 'number' && typeof p.slowSMA === 'number') {
          result[slot] = {
            label: p.label || `Custom ${slot}`,
            fastSMA: p.fastSMA,
            slowSMA: p.slowSMA,
            positionSizePercent: p.positionSizePercent,
            stopLossPercent: p.stopLossPercent,
            takeProfitPercent: p.takeProfitPercent,
          };
        }
      }
      return result;
    } catch {
      return { '4': null, '5': null, '6': null };
    }
  }, [pendingImportJson]);

  // Real-time validation
  const fieldErrors = useMemo<FieldErrors>(() => {
    const errors: FieldErrors = {};
    
    // Assets validation
    if (enabledAssets.length === 0) {
      errors.assets = 'Select at least one trading pair';
    }
    
    // Date validation
    if (startDate >= endDate) {
      errors.dateRange = 'End date must be after start date';
    }
    if (startDate >= new Date()) {
      errors.dateRange = 'Start date must be in the past';
    }
    
    // SMA validation
    if (fastSMA < 5 || fastSMA > 100) {
      errors.fastSMA = 'Must be between 5 and 100';
    }
    if (slowSMA < 10 || slowSMA > 200) {
      errors.slowSMA = 'Must be between 10 and 200';
    }
    if (slowSMA <= fastSMA) {
      errors.slowSMA = 'Must be greater than Fast SMA';
    }
    
    // Initial balance validation
    if (initialBalance < 100) {
      errors.initialBalance = 'Must be at least $100';
    }
    if (initialBalance > 100000000) {
      errors.initialBalance = 'Must not exceed $100,000,000';
    }
    
    // Position size validation
    if (positionSizePercent < 1 || positionSizePercent > 100) {
      errors.positionSize = 'Must be between 1% and 100%';
    }
    
    // Stop loss validation
    if (stopLossPercent < 0.1 || stopLossPercent > 50) {
      errors.stopLoss = 'Must be between 0.1% and 50%';
    }
    
    // Take profit validation
    if (takeProfitPercent < 0.1 || takeProfitPercent > 100) {
      errors.takeProfit = 'Must be between 0.1% and 100%';
    }
    
    // Fee validation
    if (feePercent < 0 || feePercent > 5) {
      errors.fee = 'Must be between 0% and 5%';
    }
    
    return errors;
  }, [enabledAssets, startDate, endDate, fastSMA, slowSMA, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, feePercent]);

  // Detect which preset matches current values
  const activePreset = useMemo<RiskPreset | null>(() => {
    for (const [key, preset] of Object.entries(RISK_PRESETS)) {
      if (
        positionSizePercent === preset.positionSizePercent &&
        stopLossPercent === preset.stopLossPercent &&
        takeProfitPercent === preset.takeProfitPercent &&
        fastSMA === preset.fastSMA &&
        slowSMA === preset.slowSMA
      ) {
        return key as RiskPreset;
      }
    }
    return null;
  }, [positionSizePercent, stopLossPercent, takeProfitPercent, fastSMA, slowSMA]);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  const handleApplyPreset = useCallback((preset: RiskPreset) => {
    if (!onApplyPreset) return;
    const config = RISK_PRESETS[preset];
    onApplyPreset(preset);
    setActiveCustomPresetSlot(null); // Clear active custom preset when applying built-in
    toast.success(`${config.label} preset applied`, {
      description: `Position: ${config.positionSizePercent}% · SL: ${config.stopLossPercent}% · TP: ${config.takeProfitPercent}% · SMA: ${config.fastSMA}/${config.slowSMA}`,
    });
  }, [onApplyPreset]);

  const handleShare = async () => {
    if (!onShareConfig) return;
    const success = await onShareConfig();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if current form values differ from a saved preset
  const hasUnsavedChanges = useCallback((slot: '4' | '5' | '6'): boolean => {
    if (!getCustomPresetData) return false;
    const presetData = getCustomPresetData(slot);
    if (!presetData) return false;
    
    // Only show unsaved indicator if this is the active preset
    if (activeCustomPresetSlot !== slot) return false;
    
    return (
      presetData.fastSMA !== fastSMA ||
      presetData.slowSMA !== slowSMA ||
      presetData.positionSizePercent !== positionSizePercent ||
      presetData.stopLossPercent !== stopLossPercent ||
      presetData.takeProfitPercent !== takeProfitPercent
    );
  }, [getCustomPresetData, activeCustomPresetSlot, fastSMA, slowSMA, positionSizePercent, stopLossPercent, takeProfitPercent]);

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-1">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Backtest Configuration</CardTitle>
            <CardDescription>Configure your strategy parameters</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onResetToDefaults && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetToDefaults}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to defaults</TooltipContent>
              </Tooltip>
            )}
            {onShareConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-8 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <TooltipLabel 
              label="Date Range" 
              tooltip="Historical period to test your strategy. Longer periods provide more reliable results but take longer to compute."
              className="text-sm font-medium"
            />
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "justify-start text-left font-normal",
                      fieldErrors.dateRange && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && onStartDateChange(date)}
                    disabled={(date) => date > endDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "justify-start text-left font-normal",
                      fieldErrors.dateRange && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && onEndDateChange(date)}
                    disabled={(date) => date < startDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <FieldError message={fieldErrors.dateRange} />
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <TooltipLabel 
              label="Timeframe" 
              tooltip="Candlestick interval for analysis. Shorter timeframes (5m, 15m) generate more signals but may include more noise."
              className="text-sm font-medium"
            />
            <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as typeof timeframe)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assets */}
          <div className="space-y-2">
            <TooltipLabel 
              label="Trading Pairs" 
              tooltip="Cryptocurrency pairs to backtest. Selecting multiple pairs diversifies the test but increases computation time."
              className="text-sm font-medium"
              error={!!fieldErrors.assets}
            />
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ASSETS.map((asset) => (
                <div 
                  key={asset} 
                  className={cn(
                    "flex items-center justify-between rounded-lg border bg-secondary/20 px-3 py-2",
                    fieldErrors.assets ? "border-destructive/50" : "border-border/50"
                  )}
                >
                  <span className="text-sm font-medium">{ASSET_INFO[asset].symbol}</span>
                  <Switch
                    checked={enabledAssets.includes(asset)}
                    onCheckedChange={() => onToggleAsset(asset)}
                  />
                </div>
              ))}
            </div>
            <FieldError message={fieldErrors.assets} />
          </div>

        <Separator />

          {/* SMA Settings */}
          <div className="space-y-3">
            <TooltipLabel 
              label="SMA Indicators" 
              tooltip="Simple Moving Averages used for crossover signals. Buy when Fast crosses above Slow, sell when Fast crosses below."
              className="text-sm font-medium"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <TooltipLabel 
                  label="Fast SMA" 
                  tooltip="Short-term moving average (5-100 periods). Lower values react faster to price changes. Recommended: 10-30."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.fastSMA}
                />
                <Input
                  type="number"
                  value={fastSMA}
                  onChange={(e) => onFastSMAChange(parseInt(e.target.value) || 20)}
                  min={5}
                  max={100}
                  className={cn(fieldErrors.fastSMA && "border-destructive")}
                />
                <FieldError message={fieldErrors.fastSMA} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Slow SMA" 
                  tooltip="Long-term moving average (10-200 periods). Higher values filter out noise. Recommended: 40-100."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.slowSMA}
                />
                <Input
                  type="number"
                  value={slowSMA}
                  onChange={(e) => onSlowSMAChange(parseInt(e.target.value) || 50)}
                  min={10}
                  max={200}
                  className={cn(fieldErrors.slowSMA && "border-destructive")}
                />
                <FieldError message={fieldErrors.slowSMA} />
              </div>
            </div>
          </div>

          {/* Risk Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TooltipLabel 
                label="Risk Management" 
                tooltip="Control your exposure and protect capital. Conservative settings reduce risk but may limit potential returns."
                className="text-sm font-medium"
              />
              {onApplyPreset && (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    activePreset === 'conservative' && "bg-blue-500/20 text-blue-400",
                    activePreset === 'moderate' && "bg-yellow-500/20 text-yellow-400",
                    activePreset === 'aggressive' && "bg-red-500/20 text-red-400",
                    !activePreset && "bg-muted text-muted-foreground"
                  )}>
                    {activePreset ? RISK_PRESETS[activePreset].label : 'Custom'}
                  </span>
                  <Select onValueChange={(v) => handleApplyPreset(v as RiskPreset)}>
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue placeholder="Apply preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RISK_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              key === 'conservative' && "bg-blue-500",
                              key === 'moderate' && "bg-yellow-500",
                              key === 'aggressive' && "bg-red-500"
                            )} />
                            <span>{preset.label}</span>
                            {activePreset === key && <span className="text-muted-foreground">✓</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Custom Preset Slots */}
            {customPresetSlots && (
              <div 
                className={cn(
                  "flex items-center gap-2 mt-2 p-2 -m-2 rounded-lg transition-colors",
                  isDragging && "bg-primary/10 ring-2 ring-dashed ring-primary/50"
                )}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {isDragging ? (
                  <div className="flex-1 flex items-center justify-center py-2">
                    <span className="text-sm text-primary font-medium">Drop JSON file to import presets</span>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Custom:</span>
                {(['4', '5', '6'] as const).map((slot) => {
                  const hasData = customPresetSlots[slot];
                  const presetData = getCustomPresetData?.(slot);
                  const isUnsaved = hasUnsavedChanges(slot);
                  const isActive = activeCustomPresetSlot === slot;
                  const isPending = hasPendingSave?.(slot) ?? false;
                  const justSaved = wasRecentlySaved?.(slot) ?? false;
                  const justCancelled = wasCancelledRecently?.(slot) ?? false;
                  const versionCount = getPresetVersionHistory?.(slot)?.length ?? 0;
                  return (
                    <div key={slot} className="relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={hasData ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                            "h-7 min-w-7 px-1 text-xs font-mono transition-all",
                            hasData && "ring-1 ring-primary/50 pr-14",
                            isActive && "ring-2 ring-primary",
                            justSaved && "ring-2 ring-green-500 bg-green-500/20 animate-pulse",
                            justCancelled && "animate-shake ring-2 ring-destructive/50"
                          )}
                            onClick={() => {
                              if (hasData && onLoadCustomPreset) {
                                if (onLoadCustomPreset(slot)) {
                                  setActiveCustomPresetSlot(slot);
                                  toast.success(`${presetData?.label || `Preset ${slot}`} loaded`, {
                                    description: presetData ? `Position: ${presetData.positionSizePercent}% · SL: ${presetData.stopLossPercent}% · TP: ${presetData.takeProfitPercent}%` : undefined,
                                  });
                                }
                              } else {
                                setPendingPresetSlot(slot);
                                setPresetName('');
                                setPresetDialogOpen(true);
                              }
                            }}
                          >
                            {hasData && presetData ? (
                              <span className="truncate max-w-16">{presetData.label}</span>
                            ) : (
                              slot
                            )}
                            {/* Save complete indicator (green check) */}
                            {justSaved && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3 animate-scale-in">
                                <span className="relative inline-flex items-center justify-center rounded-full h-3 w-3 bg-green-500 text-white">
                                  <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              </span>
                            )}
                            {/* Pending save indicator (takes priority over unsaved) */}
                            {isPending && !justSaved && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3" title="Saving...">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                              </span>
                            )}
                            {/* Unsaved changes indicator */}
                            {isUnsaved && !isPending && !justSaved && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {hasData && presetData ? (
                            <div className="text-xs">
                              <p className="font-medium mb-1">{presetData.label}</p>
                              <p>SMA: {presetData.fastSMA}/{presetData.slowSMA}</p>
                              <p>Position: {presetData.positionSizePercent}%</p>
                              <p>SL: {presetData.stopLossPercent}% · TP: {presetData.takeProfitPercent}%</p>
                              {isPending && (
                                <p className="text-blue-500 mt-1 font-medium">⏳ Saving version...</p>
                              )}
                              {isUnsaved && !isPending && (
                                <p className="text-amber-500 mt-1 font-medium">⚠ Unsaved changes · Ctrl+S to save</p>
                              )}
                              <p className="text-muted-foreground mt-1">Click to load · Shift+{slot} to overwrite</p>
                            </div>
                          ) : (
                            <p className="text-xs">Empty slot · Click or press {slot} to save current config</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      {hasData && hasPresetHistory?.(slot) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="absolute right-9 top-1/2 -translate-y-1/2 h-5 rounded-sm flex items-center gap-0.5 px-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <History className="h-3 w-3" />
                              {versionCount > 0 && (
                                <span className="text-[10px] font-mono leading-none">{versionCount}</span>
                              )}
                              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              Recent Versions ({versionCount})
                            </div>
                            <DropdownMenuSeparator />
                            {(() => {
                              const versions = getPresetVersionHistory?.(slot) ?? [];
                              const recentVersions = versions.slice(0, 5);
                              if (recentVersions.length === 0) {
                                return (
                                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                    No versions saved yet
                                  </div>
                                );
                              }
                              return recentVersions.map((version) => (
                                <DropdownMenuItem
                                  key={version.id}
                                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onRestorePresetVersion?.(slot, version.id)) {
                                      toast.success(`Restored version from ${format(new Date(version.savedAt), 'MMM d, HH:mm')}`);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="text-xs font-medium truncate">
                                      {formatDistanceToNow(new Date(version.savedAt), { addSuffix: true })}
                                    </span>
                                    {version.pinned && (
                                      <Pin className="h-3 w-3 text-amber-500 shrink-0 ml-auto" />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground pl-5 w-full">
                                    <span>SMA: {version.data.fastSMA}/{version.data.slowSMA}</span>
                                    <span className="mx-1">·</span>
                                    <span>SL: {version.data.stopLossPercent}%</span>
                                    <span className="mx-1">·</span>
                                    <span>TP: {version.data.takeProfitPercent}%</span>
                                  </div>
                                  {version.note && (
                                    <div className="text-[10px] text-muted-foreground/70 pl-5 truncate w-full italic">
                                      "{version.note}"
                                    </div>
                                  )}
                                </DropdownMenuItem>
                              ));
                            })()}
                            {versionCount > 5 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs text-center justify-center text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVersionHistorySlot(slot);
                                  }}
                                >
                                  <History className="h-3 w-3 mr-1.5" />
                                  View all {versionCount} versions
                                </DropdownMenuItem>
                              </>
                            )}
                            {versionCount <= 5 && versionCount > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-xs text-center justify-center text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVersionHistorySlot(slot);
                                  }}
                                >
                                  <History className="h-3 w-3 mr-1.5" />
                                  Open full history
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {hasData && onRenameCustomPreset && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingPresetSlot(slot);
                                setPresetName(presetData?.label || '');
                                setIsRenaming(true);
                                setPresetDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Rename preset</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {hasData && onDeleteCustomPreset && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomPreset(slot);
                                toast.success(`${presetData?.label || `Preset ${slot}`} deleted`);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Delete preset</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
                
                {/* Export/Import Buttons */}
                {(onExportCustomPresets || onImportCustomPresets) && (
                  <div className="flex items-center gap-1 ml-auto">
                    {onExportCustomPresets && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              onExportCustomPresets();
                              toast.success('Presets exported');
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Export presets to JSON</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onImportCustomPresets && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.json,application/json';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const json = event.target?.result as string;
                                  // If there are existing presets, show confirmation
                                  if (existingPresetCount > 0) {
                                    setPendingImportJson(json);
                                    setImportConfirmOpen(true);
                                  } else {
                                    // No existing presets, import directly
                                    const result = onImportCustomPresets(json);
                                    if (result.success) {
                                      toast.success(result.message);
                                    } else {
                                      toast.error('Import failed', { description: result.message });
                                    }
                                  }
                                };
                                reader.readAsText(file);
                              };
                              input.click();
                            }}
                          >
                            <Upload className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Import presets from JSON</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onClearAllCustomPresets && existingPresetCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setClearPresetsConfirmOpen(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Clear all custom presets</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
                
                {/* Last Sync Indicator */}
                {lastPresetSync && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-muted-foreground/60 ml-1 cursor-default whitespace-nowrap">
                        {lastPresetSync.action === 'import' ? '↓' : '↑'} {format(new Date(lastPresetSync.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Last {lastPresetSync.action}: {format(new Date(lastPresetSync.timestamp), 'PPpp')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Compact Storage Indicator */}
                {getTotalVersionCount && versionHistory && (() => {
                  const totalVersions = getTotalVersionCount();
                  if (totalVersions === 0) return null;
                  
                  const storageBytes = new Blob([JSON.stringify(versionHistory)]).size;
                  const formatBytes = (bytes: number) => {
                    if (bytes < 1024) return `${bytes}B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
                    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
                  };
                  const usagePercent = Math.min(100, (storageBytes / (5 * 1024 * 1024)) * 100);
                  
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            // Open version history for first available preset
                            const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
                            for (const slot of slots) {
                              if (customPresetSlots?.[slot]) {
                                setVersionHistorySlot(slot);
                                break;
                              }
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer",
                            usagePercent > 80 
                              ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" 
                              : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <HardDrive className="h-3 w-3" />
                          <span className="font-mono">{totalVersions}</span>
                          <span className="opacity-60">·</span>
                          <span className="font-mono">{formatBytes(storageBytes)}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Version Storage</p>
                          <p>{totalVersions} version{totalVersions !== 1 ? 's' : ''} · {formatBytes(storageBytes)}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={usagePercent} className="h-1 w-16" />
                            <span className="text-muted-foreground">{usagePercent.toFixed(1)}%</span>
                          </div>
                          <p className="text-muted-foreground">Click to manage</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
                </>
              )}
              </div>
            )}

            {/* Clear All Presets Confirmation Dialog */}
            <AlertDialog open={clearPresetsConfirmOpen} onOpenChange={setClearPresetsConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all custom presets?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {existingPresetCount} custom preset{existingPresetCount !== 1 ? 's' : ''}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      onClearAllCustomPresets?.();
                      toast.success('All custom presets cleared');
                    }}
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Import Confirmation Dialog */}
            <AlertDialog open={importConfirmOpen} onOpenChange={(open) => {
              setImportConfirmOpen(open);
              if (!open) setPendingImportJson(null);
            }}>
              <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Import Presets</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>
                        {existingPresetCount > 0 
                          ? `You have ${existingPresetCount} existing preset${existingPresetCount !== 1 ? 's' : ''}. Choose how to handle the import:`
                          : 'Preview of presets to import:'
                        }
                      </p>
                      
                      {/* Preview Grid */}
                      <div className="grid gap-2 pt-2">
                        {(['4', '5', '6'] as const).map((slot) => {
                          const incoming = importPreview[slot];
                          const existing = getCustomPresetData?.(slot);
                          const hasExisting = customPresetSlots?.[slot];
                          
                          if (!incoming && !hasExisting) return null;
                          
                          return (
                            <div 
                              key={slot} 
                              className={cn(
                                "rounded-lg border p-3 text-sm",
                                incoming && hasExisting && "border-amber-500/50 bg-amber-500/10",
                                incoming && !hasExisting && "border-green-500/50 bg-green-500/10",
                                !incoming && hasExisting && "border-border bg-muted/30"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">Slot {slot}</span>
                                {incoming && hasExisting && (
                                  <span className="text-xs text-amber-500 font-medium">Will overwrite</span>
                                )}
                                {incoming && !hasExisting && (
                                  <span className="text-xs text-green-500 font-medium">New</span>
                                )}
                                {!incoming && hasExisting && (
                                  <span className="text-xs text-muted-foreground">Not in file</span>
                                )}
                              </div>
                              
                              {incoming && (
                                <div className="text-xs text-foreground">
                                  <span className="font-medium">{incoming.label}</span>
                                  <span className="text-muted-foreground ml-2">
                                    SMA {incoming.fastSMA}/{incoming.slowSMA} · {incoming.positionSizePercent}% pos · {incoming.stopLossPercent}% SL
                                  </span>
                                </div>
                              )}
                              
                              {hasExisting && existing && (
                                <div className={cn("text-xs", incoming ? "text-muted-foreground line-through mt-1" : "text-foreground")}>
                                  <span className={cn(!incoming && "font-medium")}>{existing.label}</span>
                                  <span className="text-muted-foreground ml-2">
                                    SMA {existing.fastSMA}/{existing.slowSMA} · {existing.positionSizePercent}% pos
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel onClick={() => setPendingImportJson(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (pendingImportJson && onImportCustomPresets) {
                        const result = onImportCustomPresets(pendingImportJson, 'merge');
                        if (result.success) {
                          toast.success(result.message);
                        } else {
                          toast.error('Import failed', { description: result.message });
                        }
                      }
                      setPendingImportJson(null);
                      setImportConfirmOpen(false);
                    }}
                  >
                    Fill Empty Slots Only
                  </Button>
                  <AlertDialogAction
                    onClick={() => {
                      if (pendingImportJson && onImportCustomPresets) {
                        const result = onImportCustomPresets(pendingImportJson, 'replace');
                        if (result.success) {
                          toast.success(result.message);
                        } else {
                          toast.error('Import failed', { description: result.message });
                        }
                      }
                      setPendingImportJson(null);
                    }}
                  >
                    Replace All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Custom Preset Name Dialog */}
            <Dialog open={presetDialogOpen} onOpenChange={(open) => {
              setPresetDialogOpen(open);
              if (!open) {
                setIsRenaming(false);
                setPendingPresetSlot(null);
                setPresetName('');
              }
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{isRenaming ? 'Rename Preset' : 'Name Your Preset'}</DialogTitle>
                  <DialogDescription>
                    {isRenaming 
                      ? `Enter a new name for this preset.`
                      : `Give your custom preset a memorable name for slot ${pendingPresetSlot}.`
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="e.g., Aggressive Swing, Safe BTC..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && pendingPresetSlot) {
                        if (isRenaming) {
                          onRenameCustomPreset?.(pendingPresetSlot, presetName.trim());
                          toast.success(`Renamed to "${presetName.trim() || `Custom ${pendingPresetSlot}`}"`);
                        } else {
                          onSaveCustomPreset?.(pendingPresetSlot, presetName.trim() || undefined);
                          toast.success(`Saved as "${presetName.trim() || `Custom ${pendingPresetSlot}`}"`);
                        }
                        setPresetDialogOpen(false);
                        setIsRenaming(false);
                        setPendingPresetSlot(null);
                        setPresetName('');
                      }
                    }}
                    autoFocus
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPresetDialogOpen(false);
                      setIsRenaming(false);
                      setPendingPresetSlot(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (pendingPresetSlot) {
                        if (isRenaming) {
                          onRenameCustomPreset?.(pendingPresetSlot, presetName.trim());
                          toast.success(`Renamed to "${presetName.trim() || `Custom ${pendingPresetSlot}`}"`);
                        } else {
                          onSaveCustomPreset?.(pendingPresetSlot, presetName.trim() || undefined);
                          toast.success(`Saved as "${presetName.trim() || `Custom ${pendingPresetSlot}`}"`);
                        }
                        setPresetDialogOpen(false);
                        setIsRenaming(false);
                        setPendingPresetSlot(null);
                        setPresetName('');
                      }
                    }}
                  >
                    {isRenaming ? (
                      <>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preset
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Version History Dialog */}
            <Dialog open={versionHistorySlot !== null} onOpenChange={(open) => {
              if (!open) {
                setVersionHistorySlot(null);
                setCompareVersions([null, null]);
                setVersionFieldFilter(null);
                setBatchSelectMode(false);
                setBatchSelectedVersions(new Set());
                setVersionSearchQuery('');
                setVersionTagFilter(null);
              }
            }}>
              <DialogContent 
                className={cn(
                  "sm:max-w-2xl transition-colors",
                  versionHistoryDragging && "ring-2 ring-primary ring-offset-2"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!versionHistoryDragging) setVersionHistoryDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setVersionHistoryDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Only set to false if leaving the dialog content entirely
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    setVersionHistoryDragging(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setVersionHistoryDragging(false);
                  
                  if (!onImportVersionHistory || !versionHistorySlot) return;
                  
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  
                  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
                    toast.error('Invalid file type', { description: 'Please drop a JSON file' });
                    return;
                  }
                  
                  if (file.size > 100 * 1024) {
                    toast.error('File too large', { description: 'Version files should be under 100KB' });
                    return;
                  }
                  
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const json = JSON.parse(event.target?.result as string);
                      
                      if (!json.versions || !Array.isArray(json.versions)) {
                        toast.error('Invalid file format', { description: 'File does not contain valid versions' });
                        return;
                      }
                      
                      // Convert ISO date strings back to timestamps
                      const versions = json.versions.map((v: { id: string; savedAt: string | number; data: PresetVersion['data'] }) => ({
                        ...v,
                        savedAt: typeof v.savedAt === 'string' ? new Date(v.savedAt).getTime() : v.savedAt
                      }));
                      
                      const result = onImportVersionHistory(versionHistorySlot, versions, 'merge');
                      
                      if (result.success && result.imported > 0) {
                        toast.success(`Imported ${result.imported} version${result.imported !== 1 ? 's' : ''}`, {
                          description: 'Versions merged into history',
                        });
                      } else if (result.success && result.imported === 0) {
                        toast.info('No new versions to import', {
                          description: 'All versions already exist in history',
                        });
                      } else {
                        toast.error('Import failed', { description: 'Could not import versions' });
                      }
                    } catch {
                      toast.error('Invalid JSON', { description: 'Could not parse the file' });
                    }
                  };
                  reader.readAsText(file);
                }}
              >
                {/* Drag overlay */}
                {versionHistoryDragging && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Drop JSON file to import versions</p>
                      <p className="text-xs text-muted-foreground">Versions will be merged into history</p>
                    </div>
                  </div>
                )}
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Version History
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      {versionHistorySlot && onImportVersionHistory && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                try {
                                  const json = JSON.parse(ev.target?.result as string);
                                  if (!json.versions || !Array.isArray(json.versions)) {
                                    toast.error('Invalid version history file');
                                    return;
                                  }
                                  // Convert ISO date strings back to timestamps
                                  const versions = json.versions.map((v: { id: string; savedAt: string; data: PresetVersion['data'] }) => ({
                                    ...v,
                                    savedAt: typeof v.savedAt === 'string' ? new Date(v.savedAt).getTime() : v.savedAt
                                  }));
                                  const result = onImportVersionHistory(versionHistorySlot, versions, 'merge');
                                  if (result.success) {
                                    toast.success(`Imported ${result.imported} version${result.imported !== 1 ? 's' : ''}`);
                                  } else {
                                    toast.error('No valid versions found in file');
                                  }
                                } catch {
                                  toast.error('Failed to parse version history file');
                                }
                              };
                              reader.readAsText(file);
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Import
                        </Button>
                      )}
                      {versionHistorySlot && getPresetVersionHistory && getPresetVersionHistory(versionHistorySlot).length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const versions = getPresetVersionHistory(versionHistorySlot);
                            const presetLabel = getCustomPresetData?.(versionHistorySlot)?.label || `Custom ${versionHistorySlot}`;
                            const exportData = {
                              preset: presetLabel,
                              slot: versionHistorySlot,
                              exportedAt: new Date().toISOString(),
                              versions: versions.map(v => ({
                                id: v.id,
                                savedAt: new Date(v.savedAt).toISOString(),
                                data: v.data
                              }))
                            };
                            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `preset-history-${versionHistorySlot}-${format(new Date(), 'yyyy-MM-dd')}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success('Version history exported');
                          }}
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Export
                        </Button>
                      )}
                    </div>
                  </div>
                  <DialogDescription>
                    {compareVersions[0] || compareVersions[1] 
                      ? 'Select two versions to compare side-by-side'
                      : versionHistorySlot && getCustomPresetData?.(versionHistorySlot)?.label 
                        ? `Restore a previous version of "${getCustomPresetData(versionHistorySlot)?.label}"`
                        : 'Restore a previous version of this preset'}
                  </DialogDescription>
                </DialogHeader>
                
                {/* Auto-save Toggle with Debounce Control */}
                {onAutoSaveVersionsChange && !compareVersions[0] && !batchSelectMode && (
                  <div className="space-y-3 py-2 px-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <History className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Auto-save versions</p>
                          <p className="text-xs text-muted-foreground">Automatically save when presets change</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Pending save indicator with countdown */}
                        {versionHistorySlot && hasPendingSave?.(versionHistorySlot) && (() => {
                          const startTime = getPendingSaveStartTime?.(versionHistorySlot);
                          return (
                            <div className="flex items-center gap-2 text-xs text-amber-500">
                              {startTime && debounceDelay > 0 && (
                                <PendingSaveCountdown startTime={startTime} delay={debounceDelay} />
                              )}
                              <span>Saving</span>
                              <div className="flex items-center gap-1">
                                {onFlushPendingSave && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-xs hover:text-amber-400"
                                    onClick={() => {
                                      const version = onFlushPendingSave(versionHistorySlot);
                                      if (version) {
                                        toast.success('Version saved immediately');
                                      }
                                    }}
                                  >
                                    Save now
                                  </Button>
                                )}
                                {onCancelPendingSave && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      onCancelPendingSave(versionHistorySlot);
                                      toast.info('Auto-save cancelled');
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                        {/* Save complete animation */}
                        {versionHistorySlot && wasRecentlySaved?.(versionHistorySlot) && !hasPendingSave?.(versionHistorySlot) && (
                          <div className="flex items-center gap-1.5 text-xs text-green-500 animate-fade-in">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">Saved!</span>
                          </div>
                        )}
                        {versionHistorySlot && onManualSaveVersion && getCustomPresetData && !hasPendingSave?.(versionHistorySlot) && !wasRecentlySaved?.(versionHistorySlot) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    const presetData = getCustomPresetData(versionHistorySlot);
                                    if (presetData) {
                                      onManualSaveVersion(versionHistorySlot, {
                                        ...presetData,
                                        description: `Manual save: ${presetData.label}`,
                                      });
                                      toast.success('Version saved', {
                                        description: 'Current state saved to version history',
                                      });
                                    }
                                  }}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save Now
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Manually save current state as a new version</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Switch
                          checked={autoSaveVersions}
                          onCheckedChange={onAutoSaveVersionsChange}
                        />
                      </div>
                    </div>
                    
                    {/* Debounce delay slider */}
                    {autoSaveVersions && onDebounceDelayChange && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Debounce delay</Label>
                          <span className="text-xs font-mono text-muted-foreground">
                            {debounceDelay === 0 ? 'Instant' : `${(debounceDelay / 1000).toFixed(1)}s`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="range"
                            min={0}
                            max={10000}
                            step={500}
                            value={debounceDelay}
                            onChange={(e) => onDebounceDelayChange(parseInt(e.target.value))}
                            className="h-2 accent-primary cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {debounceDelay === 0 
                            ? 'Saves immediately on every change (may create many versions)'
                            : `Waits ${(debounceDelay / 1000).toFixed(1)} seconds after changes before saving`}
                        </p>
                      </div>
                    )}
                    
                    {/* Save sound toggle */}
                    {autoSaveVersions && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <Label htmlFor="save-sound-toggle" className="text-xs font-medium cursor-pointer">
                            Save sound
                          </Label>
                        </div>
                        <Switch
                          id="save-sound-toggle"
                          checked={saveSoundEnabledState}
                          onCheckedChange={(checked) => {
                            setSaveSoundEnabledState(checked);
                            setSaveSoundEnabled(checked);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Storage Usage Indicator */}
                {getTotalVersionCount && versionHistory && !compareVersions[0] && !batchSelectMode && (() => {
                  const totalVersions = getTotalVersionCount();
                  if (totalVersions === 0) return null;
                  
                  // Calculate storage usage
                  const storageKey = 'backtest-preset-versions';
                  let storageBytes = 0;
                  try {
                    const stored = localStorage.getItem(storageKey);
                    if (stored) {
                      storageBytes = new Blob([stored]).size;
                    }
                  } catch {
                    // Ignore storage access errors
                  }
                  
                  const formatBytes = (bytes: number): string => {
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
                  };
                  
                  // Approximate max (5MB is typical localStorage limit)
                  const maxBytes = 5 * 1024 * 1024;
                  const usagePercent = Math.min((storageBytes / maxBytes) * 100, 100);
                  
                  // Version counts per slot
                  const slot4Count = versionHistory['4']?.length || 0;
                  const slot5Count = versionHistory['5']?.length || 0;
                  const slot6Count = versionHistory['6']?.length || 0;
                  
                  return (
                    <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span className="font-medium">Storage Usage</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Total versions</span>
                          <span className="font-mono font-medium text-foreground">{totalVersions}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">4</span>
                            <span>{slot4Count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">5</span>
                            <span>{slot5Count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">6</span>
                            <span>{slot6Count}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Space used</span>
                            <span className="font-mono font-medium text-foreground">{formatBytes(storageBytes)}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                usagePercent < 50 ? "bg-green-500" : usagePercent < 80 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.max(usagePercent, 1)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground/70">
                            {usagePercent.toFixed(1)}% of ~5 MB localStorage limit
                          </p>
                        </div>
                        
                        {/* Auto-Cleanup Controls */}
                        <div className="pt-2 border-t border-border/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3 w-3 text-amber-500" />
                              <span className="text-muted-foreground">Auto-cleanup</span>
                            </div>
                            <Switch
                              checked={autoCleanupEnabled}
                              onCheckedChange={onAutoCleanupEnabledChange}
                              className="scale-75"
                            />
                          </div>
                          
                          {autoCleanupEnabled && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Threshold</span>
                                <span className="font-mono font-medium text-foreground">{cleanupThreshold}%</span>
                              </div>
                              <input
                                type="range"
                                min={50}
                                max={95}
                                step={5}
                                value={cleanupThreshold}
                                onChange={(e) => onCleanupThresholdChange?.(Number(e.target.value))}
                                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                              <p className="text-[10px] text-muted-foreground/70">
                                Removes oldest unpinned versions when storage exceeds {cleanupThreshold}%
                              </p>
                            </div>
                          )}
                          
                          {lastCleanupCount > 0 && (
                            <p className="text-[10px] text-amber-500 flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5" />
                              Auto-cleaned {lastCleanupCount} version{lastCleanupCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        
                        {/* Manual Cleanup Dropdown */}
                        {onManualCleanup && totalVersions > 0 && (() => {
                          // Collect all unpinned versions sorted by age (oldest first)
                          const allUnpinned: { slot: '4' | '5' | '6'; label: string; savedAt: number }[] = [];
                          const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
                          
                          slots.forEach(slot => {
                            versionHistory?.[slot]?.filter(v => !v.pinned).forEach(v => {
                              allUnpinned.push({ slot, label: v.data.label, savedAt: v.savedAt });
                            });
                          });
                          
                          allUnpinned.sort((a, b) => a.savedAt - b.savedAt);
                          const unpinnedCount = allUnpinned.length;
                          
                          if (unpinnedCount === 0) return null;
                          
                          // Helper to get preview text for N versions
                          const getPreviewText = (count: number): string => {
                            const toRemove = allUnpinned.slice(0, count);
                            if (toRemove.length === 0) return 'No versions to remove';
                            
                            const lines = toRemove.slice(0, 4).map(v => 
                              `• ${v.label} (Preset ${v.slot})`
                            );
                            
                            if (toRemove.length > 4) {
                              lines.push(`... and ${toRemove.length - 4} more`);
                            }
                            
                            return lines.join('\n');
                          };
                          
                          // Helper to trigger cleanup with confirmation for larger amounts
                          const handleCleanup = (count: number) => {
                            if (count >= 3) {
                              setPendingCleanupCount(count);
                              setPendingCleanupPreview(getPreviewText(count));
                              setCleanupConfirmOpen(true);
                            } else {
                              onManualCleanup(count);
                            }
                          };
                          
                          return (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-7 text-xs justify-between"
                                  >
                                    <span className="flex items-center">
                                      <Zap className="h-3 w-3 mr-1.5" />
                                      Clean Up Versions
                                    </span>
                                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuItem 
                                        onClick={() => handleCleanup(1)}
                                        disabled={unpinnedCount < 1}
                                        className="text-xs cursor-pointer"
                                      >
                                        Remove 1 oldest version
                                      </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[200px]">
                                      <p className="text-xs font-medium mb-1">Will remove:</p>
                                      <p className="text-xs text-muted-foreground whitespace-pre-line">{getPreviewText(1)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuItem 
                                        onClick={() => handleCleanup(Math.min(5, unpinnedCount))}
                                        disabled={unpinnedCount < 2}
                                        className="text-xs cursor-pointer"
                                      >
                                        Remove up to 5 versions
                                      </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[200px]">
                                      <p className="text-xs font-medium mb-1">Will remove:</p>
                                      <p className="text-xs text-muted-foreground whitespace-pre-line">{getPreviewText(Math.min(5, unpinnedCount))}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuItem 
                                        onClick={() => handleCleanup(Math.min(10, unpinnedCount))}
                                        disabled={unpinnedCount < 5}
                                        className="text-xs cursor-pointer"
                                      >
                                        Remove up to 10 versions
                                      </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[200px]">
                                      <p className="text-xs font-medium mb-1">Will remove:</p>
                                      <p className="text-xs text-muted-foreground whitespace-pre-line">{getPreviewText(Math.min(10, unpinnedCount))}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuItem 
                                        onClick={() => handleCleanup(unpinnedCount)}
                                        className="text-xs text-amber-600 cursor-pointer"
                                      >
                                        Remove all unpinned ({unpinnedCount})
                                      </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[200px]">
                                      <p className="text-xs font-medium mb-1">Will remove:</p>
                                      <p className="text-xs text-muted-foreground whitespace-pre-line">{getPreviewText(unpinnedCount)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  {onSmartCleanup && onGetSmartCleanupPreview && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              const preview = onGetSmartCleanupPreview(3);
                                              setSmartCleanupPreviewData(preview);
                                              setPendingSmartCleanupKeepCount(3);
                                              setManuallyProtectedVersions(new Set());
                                              setSmartCleanupPreviewOpen(true);
                                            }}
                                            disabled={versionsWithPerformanceCount === 0}
                                            className="text-xs text-purple-600 cursor-pointer"
                                          >
                                            <Sparkles className="h-3 w-3 mr-1.5" />
                                            Smart cleanup (keep best 3)
                                          </DropdownMenuItem>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[220px]">
                                          <p className="text-xs font-medium mb-1">Performance-based cleanup</p>
                                          <p className="text-xs text-muted-foreground">
                                            Keeps the top 3 best-performing versions per preset based on Sharpe ratio, profit factor, and win rate.
                                            {versionsWithPerformanceCount === 0 && (
                                              <span className="block mt-1 text-amber-500">
                                                Run backtests first to record performance data.
                                              </span>
                                            )}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              const preview = onGetSmartCleanupPreview(5);
                                              setSmartCleanupPreviewData(preview);
                                              setPendingSmartCleanupKeepCount(5);
                                              setManuallyProtectedVersions(new Set());
                                              setSmartCleanupPreviewOpen(true);
                                            }}
                                            disabled={versionsWithPerformanceCount === 0}
                                            className="text-xs text-purple-600 cursor-pointer"
                                          >
                                            <Sparkles className="h-3 w-3 mr-1.5" />
                                            Smart cleanup (keep best 5)
                                          </DropdownMenuItem>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[220px]">
                                          <p className="text-xs font-medium mb-1">Performance-based cleanup</p>
                                          <p className="text-xs text-muted-foreground">
                                            Keeps the top 5 best-performing versions per preset based on Sharpe ratio, profit factor, and win rate.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              const preview = onGetSmartCleanupPreview(1);
                                              setSmartCleanupPreviewData(preview);
                                              setPendingSmartCleanupKeepCount(1);
                                              setManuallyProtectedVersions(new Set());
                                              setSmartCleanupPreviewOpen(true);
                                            }}
                                            disabled={versionsWithPerformanceCount === 0}
                                            className="text-xs text-purple-600 cursor-pointer"
                                          >
                                            <Sparkles className="h-3 w-3 mr-1.5" />
                                            Smart cleanup (keep best only)
                                          </DropdownMenuItem>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[220px]">
                                          <p className="text-xs font-medium mb-1">Keep only the best</p>
                                          <p className="text-xs text-muted-foreground">
                                            Removes all but the single best-performing version per preset.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              {/* Cleanup Confirmation Dialog */}
                              <AlertDialog open={cleanupConfirmOpen} onOpenChange={setCleanupConfirmOpen}>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <Zap className="h-5 w-5 text-amber-500" />
                                      Confirm Cleanup
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                      <div className="space-y-3">
                                        <p>
                                          You are about to remove {pendingCleanupCount} version{pendingCleanupCount !== 1 ? 's' : ''}. This action cannot be undone.
                                        </p>
                                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                          <p className="font-medium text-foreground mb-2">Versions to be removed:</p>
                                          <p className="text-muted-foreground whitespace-pre-line text-xs">{pendingCleanupPreview}</p>
                                        </div>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => {
                                      setPendingCleanupCount(null);
                                      setPendingCleanupPreview('');
                                    }}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-amber-600 hover:bg-amber-700"
                                      onClick={() => {
                                        if (pendingCleanupCount && onManualCleanup) {
                                          onManualCleanup(pendingCleanupCount);
                                        }
                                        setPendingCleanupCount(null);
                                        setPendingCleanupPreview('');
                                      }}
                                    >
                                      Remove {pendingCleanupCount} Version{pendingCleanupCount !== 1 ? 's' : ''}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              {/* Smart Cleanup Preview Dialog */}
                              <Dialog open={smartCleanupPreviewOpen} onOpenChange={(open) => {
                                setSmartCleanupPreviewOpen(open);
                                if (!open) {
                                  setManuallyProtectedVersions(new Set());
                                }
                              }}>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Sparkles className="h-5 w-5 text-purple-500" />
                                      Smart Cleanup Preview
                                    </DialogTitle>
                                    <DialogDescription>
                                      Review which versions will be kept vs removed based on performance rankings.
                                      Keeping best {pendingSmartCleanupKeepCount} version{pendingSmartCleanupKeepCount !== 1 ? 's' : ''} per preset.
                                      {manuallyProtectedVersions.size > 0 && (
                                        <span className="text-blue-500 ml-1">
                                          (+{manuallyProtectedVersions.size} manually protected)
                                        </span>
                                      )}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {smartCleanupPreviewData && (() => {
                                    // Compute effective kept/removed lists considering manual protections
                                    const effectiveKept = [
                                      ...smartCleanupPreviewData.kept,
                                      ...smartCleanupPreviewData.removed.filter(item => manuallyProtectedVersions.has(item.version.id))
                                    ];
                                    const effectiveRemoved = smartCleanupPreviewData.removed.filter(
                                      item => !manuallyProtectedVersions.has(item.version.id)
                                    );
                                    
                                    // Sorting function
                                    const sortVersions = <T extends { version: { performance?: { totalPnlPercent: number; winRate: number; sharpeRatio: number } } }>(items: T[]): T[] => {
                                      if (!cleanupSortColumn) return items;
                                      return [...items].sort((a, b) => {
                                        const aPerf = a.version.performance;
                                        const bPerf = b.version.performance;
                                        if (!aPerf && !bPerf) return 0;
                                        if (!aPerf) return 1;
                                        if (!bPerf) return -1;
                                        
                                        let aVal: number, bVal: number;
                                        switch (cleanupSortColumn) {
                                          case 'pnl': aVal = aPerf.totalPnlPercent; bVal = bPerf.totalPnlPercent; break;
                                          case 'winRate': aVal = aPerf.winRate; bVal = bPerf.winRate; break;
                                          case 'sharpe': aVal = aPerf.sharpeRatio; bVal = bPerf.sharpeRatio; break;
                                          default: return 0;
                                        }
                                        return cleanupSortDirection === 'desc' ? bVal - aVal : aVal - bVal;
                                      });
                                    };
                                    
                                    const sortedKept = sortVersions(effectiveKept);
                                    const sortedRemoved = sortVersions(effectiveRemoved);
                                    
                                    const handleSortClick = (column: 'pnl' | 'winRate' | 'sharpe') => {
                                      if (cleanupSortColumn === column) {
                                        setCleanupSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                                      } else {
                                        setCleanupSortColumn(column);
                                        setCleanupSortDirection('desc');
                                      }
                                    };
                                    
                                    const SortIcon = ({ column }: { column: 'pnl' | 'winRate' | 'sharpe' }) => {
                                      if (cleanupSortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
                                      return cleanupSortDirection === 'desc' 
                                        ? <ArrowDown className="h-3 w-3 ml-1" />
                                        : <ArrowUp className="h-3 w-3 ml-1" />;
                                    };
                                    
                                    const calculateAverages = (items: typeof effectiveKept) => {
                                      if (items.length === 0) return null;
                                      const sum = items.reduce((acc, item) => ({
                                        positionSize: acc.positionSize + item.version.data.positionSizePercent,
                                        stopLoss: acc.stopLoss + item.version.data.stopLossPercent,
                                        takeProfit: acc.takeProfit + item.version.data.takeProfitPercent,
                                        fastSMA: acc.fastSMA + item.version.data.fastSMA,
                                        slowSMA: acc.slowSMA + item.version.data.slowSMA,
                                      }), { positionSize: 0, stopLoss: 0, takeProfit: 0, fastSMA: 0, slowSMA: 0 });
                                      const count = items.length;
                                      return {
                                        positionSize: sum.positionSize / count,
                                        stopLoss: sum.stopLoss / count,
                                        takeProfit: sum.takeProfit / count,
                                        fastSMA: sum.fastSMA / count,
                                        slowSMA: sum.slowSMA / count,
                                      };
                                    };
                                    
                                    const keptAverages = calculateAverages(effectiveKept);
                                    const removedAverages = calculateAverages(effectiveRemoved);
                                    
                                    return (
                                    <Tabs value={cleanupPreviewTab} onValueChange={(v) => setCleanupPreviewTab(v as 'list' | 'compare')} className="flex-1 flex flex-col overflow-hidden">
                                      <TabsList className="grid w-full grid-cols-2 mb-3">
                                        <TabsTrigger value="list" className="text-xs">
                                          <Check className="h-3 w-3 mr-1.5" />
                                          List View
                                        </TabsTrigger>
                                        <TabsTrigger value="compare" className="text-xs">
                                          <GitCompare className="h-3 w-3 mr-1.5" />
                                          Compare Parameters
                                        </TabsTrigger>
                                      </TabsList>
                                      
                                      {cleanupSortColumn && (
                                        <div className="flex justify-end mb-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                              setCleanupSortColumn(null);
                                              setCleanupSortDirection('desc');
                                            }}
                                          >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            Reset Sort
                                          </Button>
                                        </div>
                                      )}
                                      
                                      <TabsContent value="list" className="flex-1 overflow-auto space-y-4 mt-0">
                                      {/* Versions to Keep */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                            <Check className="h-4 w-4" />
                                            Versions to Keep ({effectiveKept.length})
                                          </div>
                                          {manuallyProtectedVersions.size > 0 && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                              onClick={() => setManuallyProtectedVersions(new Set())}
                                            >
                                              Unprotect All
                                            </Button>
                                          )}
                                        </div>
                                        {effectiveKept.length > 0 ? (
                                          <div className="border rounded-lg overflow-hidden">
                                            <div className="max-h-48 overflow-auto">
                                              <table className="w-full text-xs">
                                                <thead className="bg-muted/50 sticky top-0">
                                                  <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Preset</th>
                                                    <th className="px-3 py-2 text-left font-medium">Version</th>
                                                    <th 
                                                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-muted/80 select-none"
                                                      onClick={() => handleSortClick('pnl')}
                                                    >
                                                      <span className="flex items-center">
                                                        PnL
                                                        <SortIcon column="pnl" />
                                                      </span>
                                                    </th>
                                                    <th 
                                                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-muted/80 select-none"
                                                      onClick={() => handleSortClick('winRate')}
                                                    >
                                                      <span className="flex items-center">
                                                        Win Rate
                                                        <SortIcon column="winRate" />
                                                      </span>
                                                    </th>
                                                    <th 
                                                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-muted/80 select-none"
                                                      onClick={() => handleSortClick('sharpe')}
                                                    >
                                                      <span className="flex items-center">
                                                        Sharpe
                                                        <SortIcon column="sharpe" />
                                                      </span>
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                  {sortedKept.map((item, idx) => {
                                                    const isManuallyProtected = manuallyProtectedVersions.has(item.version.id);
                                                    const originalKeptIndex = smartCleanupPreviewData.kept.findIndex(k => k.version.id === item.version.id);
                                                    
                                                    return (
                                                    <tr key={item.version.id} className={cn(
                                                      "hover:bg-muted/30",
                                                      isManuallyProtected && "bg-blue-500/5"
                                                    )}>
                                                      <td className="px-3 py-2 font-medium">Preset {item.slot}</td>
                                                      <td className="px-3 py-2">
                                                        <span className="truncate max-w-[120px] inline-block">
                                                          {item.version.data.label}
                                                        </span>
                                                      </td>
                                                      <td className={cn(
                                                        "px-3 py-2",
                                                        item.version.performance?.totalPnlPercent && item.version.performance.totalPnlPercent >= 0 
                                                          ? "text-green-600" 
                                                          : "text-red-500"
                                                      )}>
                                                        {item.version.performance 
                                                          ? `${item.version.performance.totalPnlPercent >= 0 ? '+' : ''}${item.version.performance.totalPnlPercent.toFixed(2)}%`
                                                          : '—'
                                                        }
                                                      </td>
                                                      <td className="px-3 py-2">
                                                        {item.version.performance 
                                                          ? `${item.version.performance.winRate.toFixed(1)}%`
                                                          : '—'
                                                        }
                                                      </td>
                                                      <td className="px-3 py-2">
                                                        {item.version.performance 
                                                          ? item.version.performance.sharpeRatio.toFixed(2)
                                                          : '—'
                                                        }
                                                      </td>
                                                      <td className="px-3 py-2">
                                                        {isManuallyProtected ? (
                                                          <button
                                                            onClick={() => {
                                                              setManuallyProtectedVersions(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(item.version.id);
                                                                return next;
                                                              });
                                                            }}
                                                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 transition-colors cursor-pointer"
                                                          >
                                                            <Check className="h-2.5 w-2.5" />
                                                            Protected
                                                          </button>
                                                        ) : item.version.pinned ? (
                                                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600">
                                                            <Pin className="h-2.5 w-2.5" />
                                                            Pinned
                                                          </span>
                                                        ) : originalKeptIndex >= 0 && originalKeptIndex < pendingSmartCleanupKeepCount ? (
                                                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">
                                                            <Trophy className="h-2.5 w-2.5" />
                                                            Top {originalKeptIndex + 1}
                                                          </span>
                                                        ) : (
                                                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                            Recent
                                                          </span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  )})}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                                            No versions will be kept (this shouldn't happen).
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Versions to Remove */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                            Versions to Remove ({effectiveRemoved.length})
                                          </div>
                                          {effectiveRemoved.length > 0 && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-muted-foreground">
                                                Check to protect from removal
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                onClick={() => {
                                                  const allRemovedIds = smartCleanupPreviewData.removed.map(item => item.version.id);
                                                  setManuallyProtectedVersions(new Set(allRemovedIds));
                                                }}
                                              >
                                                Protect All
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        {effectiveRemoved.length > 0 ? (
                                          <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden bg-red-50/50 dark:bg-red-950/20">
                                            <div className="max-h-48 overflow-auto">
                                              <table className="w-full text-xs">
                                                <thead className="bg-red-100/50 dark:bg-red-900/30 sticky top-0">
                                                  <tr>
                                                    <th className="w-8 px-2 py-2 text-center">
                                                      <span className="sr-only">Protect</span>
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium">Preset</th>
                                                    <th className="px-3 py-2 text-left font-medium">Version</th>
                                                    <th 
                                                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-red-200/50 dark:hover:bg-red-800/30 select-none"
                                                      onClick={() => handleSortClick('pnl')}
                                                    >
                                                      <span className="flex items-center">
                                                        PnL
                                                        <SortIcon column="pnl" />
                                                      </span>
                                                    </th>
                                                    <th 
                                                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-red-200/50 dark:hover:bg-red-800/30 select-none"
                                                      onClick={() => handleSortClick('winRate')}
                                                    >
                                                      <span className="flex items-center">
                                                        Win Rate
                                                        <SortIcon column="winRate" />
                                                      </span>
                                                    </th>
                                                    <th 
                                                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-red-200/50 dark:hover:bg-red-800/30 select-none"
                                                      onClick={() => handleSortClick('sharpe')}
                                                    >
                                                      <span className="flex items-center">
                                                        Sharpe
                                                        <SortIcon column="sharpe" />
                                                      </span>
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium">Reason</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-red-200/50 dark:divide-red-900/30">
                                                  {sortedRemoved.map((item) => (
                                                    <tr key={item.version.id} className="hover:bg-red-100/30 dark:hover:bg-red-900/20 group">
                                                      <td className="px-2 py-2 text-center">
                                                        <Checkbox
                                                          checked={false}
                                                          onCheckedChange={(checked) => {
                                                            if (checked) {
                                                              setManuallyProtectedVersions(prev => {
                                                                const next = new Set(prev);
                                                                next.add(item.version.id);
                                                                return next;
                                                              });
                                                            }
                                                          }}
                                                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                        />
                                                      </td>
                                                      <td className="px-3 py-2 font-medium">Preset {item.slot}</td>
                                                      <td className="px-3 py-2">
                                                        <span className="truncate max-w-[120px] inline-block">
                                                          {item.version.data.label}
                                                        </span>
                                                      </td>
                                                      <td className={cn(
                                                        "px-3 py-2",
                                                        item.version.performance?.totalPnlPercent && item.version.performance.totalPnlPercent >= 0 
                                                          ? "text-green-600" 
                                                          : "text-red-500"
                                                      )}>
                                                        {item.version.performance 
                                                          ? `${item.version.performance.totalPnlPercent >= 0 ? '+' : ''}${item.version.performance.totalPnlPercent.toFixed(2)}%`
                                                          : '—'
                                                        }
                                                      </td>
                                                      <td className="px-3 py-2">
                                                        {item.version.performance 
                                                          ? `${item.version.performance.winRate.toFixed(1)}%`
                                                          : '—'
                                                        }
                                                      </td>
                                                      <td className="px-3 py-2">
                                                        {item.version.performance 
                                                          ? item.version.performance.sharpeRatio.toFixed(2)
                                                          : '—'
                                                        }
                                                      </td>
                                                      <td className="px-3 py-2">
                                                        <span className="text-[10px] text-muted-foreground">
                                                          {item.version.performance ? 'Lower performance' : 'No performance data'}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                            No versions will be removed. All versions are either pinned, protected, or within the keep limit.
                                          </div>
                                        )}
                                      </div>
                                      </TabsContent>
                                      
                                      <TabsContent value="compare" className="flex-1 overflow-auto mt-0">
                                        <div className="space-y-4">
                                          {/* Parameter Comparison Table */}
                                          <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-xs">
                                              <thead className="bg-muted/50">
                                                <tr>
                                                  <th className="px-3 py-2 text-left font-medium">Parameter</th>
                                                  <th className="px-3 py-2 text-center font-medium text-green-600">
                                                    Kept ({effectiveKept.length})
                                                  </th>
                                                  <th className="px-3 py-2 text-center font-medium text-red-500">
                                                    Removed ({effectiveRemoved.length})
                                                  </th>
                                                  <th className="px-3 py-2 text-center font-medium">Difference</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {[
                                                  { label: 'Position Size', key: 'positionSize' as const, suffix: '%', decimals: 1 },
                                                  { label: 'Stop Loss', key: 'stopLoss' as const, suffix: '%', decimals: 1 },
                                                  { label: 'Take Profit', key: 'takeProfit' as const, suffix: '%', decimals: 1 },
                                                  { label: 'Fast SMA', key: 'fastSMA' as const, suffix: '', decimals: 0 },
                                                  { label: 'Slow SMA', key: 'slowSMA' as const, suffix: '', decimals: 0 },
                                                ].map(({ label, key, suffix, decimals }) => {
                                                  const keptVal = keptAverages?.[key];
                                                  const removedVal = removedAverages?.[key];
                                                  const diff = keptVal !== undefined && removedVal !== undefined 
                                                    ? keptVal - removedVal 
                                                    : null;
                                                  
                                                  return (
                                                    <tr key={key} className="hover:bg-muted/30">
                                                      <td className="px-3 py-2 font-medium">{label}</td>
                                                      <td className="px-3 py-2 text-center">
                                                        {keptVal !== undefined ? `${keptVal.toFixed(decimals)}${suffix}` : '—'}
                                                      </td>
                                                      <td className="px-3 py-2 text-center">
                                                        {removedVal !== undefined ? `${removedVal.toFixed(decimals)}${suffix}` : '—'}
                                                      </td>
                                                      <td className={cn(
                                                        "px-3 py-2 text-center font-medium",
                                                        diff !== null && diff > 0 ? "text-green-600" : diff !== null && diff < 0 ? "text-red-500" : ""
                                                      )}>
                                                        {diff !== null ? (
                                                          <>
                                                            {diff > 0 ? '+' : ''}{diff.toFixed(decimals)}{suffix}
                                                          </>
                                                        ) : '—'}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                          
                                          {/* Visual Parameter Charts */}
                                          {(effectiveKept.length > 0 || effectiveRemoved.length > 0) && (
                                            <div className="space-y-3">
                                              <div className="text-xs font-medium">Parameter Distribution</div>
                                              <div className="grid grid-cols-1 gap-2">
                                                {[
                                                  { label: 'Position Size', key: 'positionSizePercent' as const, suffix: '%', color: 'blue' },
                                                  { label: 'Stop Loss', key: 'stopLossPercent' as const, suffix: '%', color: 'orange' },
                                                  { label: 'Take Profit', key: 'takeProfitPercent' as const, suffix: '%', color: 'purple' },
                                                ].map(({ label, key, suffix, color }) => {
                                                  const keptValues = effectiveKept.map(item => item.version.data[key]);
                                                  const removedValues = effectiveRemoved.map(item => item.version.data[key]);
                                                  const allValues = [...keptValues, ...removedValues];
                                                  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;
                                                  const keptAvg = keptValues.length > 0 ? keptValues.reduce((a, b) => a + b, 0) / keptValues.length : 0;
                                                  const removedAvg = removedValues.length > 0 ? removedValues.reduce((a, b) => a + b, 0) / removedValues.length : 0;
                                                  
                                                  return (
                                                    <div key={key} className="p-2 rounded border bg-muted/20">
                                                      <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-medium">{label}</span>
                                                        <div className="flex items-center gap-3 text-[9px]">
                                                          <span className="text-green-600">Kept: {keptAvg.toFixed(1)}{suffix}</span>
                                                          <span className="text-red-500">Removed: {removedAvg.toFixed(1)}{suffix}</span>
                                                        </div>
                                                      </div>
                                                      <div className="flex gap-1 h-6">
                                                        {/* Kept versions bars */}
                                                        {keptValues.map((val, i) => (
                                                          <Tooltip key={`kept-${i}`}>
                                                            <TooltipTrigger asChild>
                                                              <div 
                                                                className="bg-green-500/70 rounded-sm min-w-[4px] transition-all hover:bg-green-500"
                                                                style={{ 
                                                                  height: `${Math.max(10, (val / maxVal) * 100)}%`,
                                                                  flex: `0 0 ${Math.max(4, 100 / Math.max(allValues.length, 10))}%`
                                                                }}
                                                              />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-[10px]">
                                                              <div className="font-medium">{effectiveKept[i]?.version.data.label}</div>
                                                              <div>{val.toFixed(1)}{suffix}</div>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        ))}
                                                        {/* Separator */}
                                                        {keptValues.length > 0 && removedValues.length > 0 && (
                                                          <div className="w-px bg-border mx-1" />
                                                        )}
                                                        {/* Removed versions bars */}
                                                        {removedValues.map((val, i) => (
                                                          <Tooltip key={`removed-${i}`}>
                                                            <TooltipTrigger asChild>
                                                              <div 
                                                                className="bg-red-500/70 rounded-sm min-w-[4px] transition-all hover:bg-red-500"
                                                                style={{ 
                                                                  height: `${Math.max(10, (val / maxVal) * 100)}%`,
                                                                  flex: `0 0 ${Math.max(4, 100 / Math.max(allValues.length, 10))}%`
                                                                }}
                                                              />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-[10px]">
                                                              <div className="font-medium">{effectiveRemoved[i]?.version.data.label}</div>
                                                              <div>{val.toFixed(1)}{suffix}</div>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                
                                                {/* SMA Comparison */}
                                                <div className="p-2 rounded border bg-muted/20">
                                                  <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-medium">SMA Periods</span>
                                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500/70" /> Fast
                                                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500/70 ml-1" /> Slow
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    {/* Kept SMA */}
                                                    <div className="space-y-1">
                                                      <div className="text-[9px] text-green-600 font-medium">Kept</div>
                                                      <div className="flex items-end gap-0.5 h-8">
                                                        {effectiveKept.slice(0, 8).map((item, i) => {
                                                          const maxSMA = Math.max(
                                                            ...effectiveKept.map(v => v.version.data.slowSMA),
                                                            ...effectiveRemoved.map(v => v.version.data.slowSMA),
                                                            50
                                                          );
                                                          return (
                                                            <Tooltip key={i}>
                                                              <TooltipTrigger asChild>
                                                                <div className="flex-1 flex gap-px">
                                                                  <div 
                                                                    className="flex-1 bg-blue-500/70 rounded-t-sm"
                                                                    style={{ height: `${(item.version.data.fastSMA / maxSMA) * 100}%` }}
                                                                  />
                                                                  <div 
                                                                    className="flex-1 bg-indigo-500/70 rounded-t-sm"
                                                                    style={{ height: `${(item.version.data.slowSMA / maxSMA) * 100}%` }}
                                                                  />
                                                                </div>
                                                              </TooltipTrigger>
                                                              <TooltipContent side="top" className="text-[10px]">
                                                                <div className="font-medium">{item.version.data.label}</div>
                                                                <div>Fast: {item.version.data.fastSMA}, Slow: {item.version.data.slowSMA}</div>
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          );
                                                        })}
                                                        {effectiveKept.length === 0 && (
                                                          <div className="text-[9px] text-muted-foreground">No data</div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {/* Removed SMA */}
                                                    <div className="space-y-1">
                                                      <div className="text-[9px] text-red-500 font-medium">Removed</div>
                                                      <div className="flex items-end gap-0.5 h-8">
                                                        {effectiveRemoved.slice(0, 8).map((item, i) => {
                                                          const maxSMA = Math.max(
                                                            ...effectiveKept.map(v => v.version.data.slowSMA),
                                                            ...effectiveRemoved.map(v => v.version.data.slowSMA),
                                                            50
                                                          );
                                                          return (
                                                            <Tooltip key={i}>
                                                              <TooltipTrigger asChild>
                                                                <div className="flex-1 flex gap-px">
                                                                  <div 
                                                                    className="flex-1 bg-blue-500/50 rounded-t-sm"
                                                                    style={{ height: `${(item.version.data.fastSMA / maxSMA) * 100}%` }}
                                                                  />
                                                                  <div 
                                                                    className="flex-1 bg-indigo-500/50 rounded-t-sm"
                                                                    style={{ height: `${(item.version.data.slowSMA / maxSMA) * 100}%` }}
                                                                  />
                                                                </div>
                                                              </TooltipTrigger>
                                                              <TooltipContent side="top" className="text-[10px]">
                                                                <div className="font-medium">{item.version.data.label}</div>
                                                                <div>Fast: {item.version.data.fastSMA}, Slow: {item.version.data.slowSMA}</div>
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          );
                                                        })}
                                                        {effectiveRemoved.length === 0 && (
                                                          <div className="text-[9px] text-muted-foreground">No data</div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Performance Metric Charts */}
                                          {(effectiveKept.length > 0 || effectiveRemoved.length > 0) && (
                                            <div className="space-y-3">
                                              <div className="text-xs font-medium">Performance Metrics</div>
                                              <div className="grid grid-cols-3 gap-2">
                                                {[
                                                  { 
                                                    label: 'PnL %', 
                                                    getValue: (v: typeof effectiveKept[0]) => v.version.performance?.totalPnlPercent,
                                                    format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
                                                    colorPositive: true
                                                  },
                                                  { 
                                                    label: 'Win Rate', 
                                                    getValue: (v: typeof effectiveKept[0]) => v.version.performance?.winRate,
                                                    format: (v: number) => `${v.toFixed(1)}%`,
                                                    colorPositive: false
                                                  },
                                                  { 
                                                    label: 'Sharpe', 
                                                    getValue: (v: typeof effectiveKept[0]) => v.version.performance?.sharpeRatio,
                                                    format: (v: number) => v.toFixed(2),
                                                    colorPositive: true
                                                  },
                                                ].map(({ label, getValue, format, colorPositive }) => {
                                                  const keptWithPerf = effectiveKept.filter(v => getValue(v) !== undefined);
                                                  const removedWithPerf = effectiveRemoved.filter(v => getValue(v) !== undefined);
                                                  const keptValues = keptWithPerf.map(v => getValue(v)!);
                                                  const removedValues = removedWithPerf.map(v => getValue(v)!);
                                                  const allValues = [...keptValues, ...removedValues];
                                                  
                                                  if (allValues.length === 0) return null;
                                                  
                                                  const minVal = Math.min(...allValues, 0);
                                                  const maxVal = Math.max(...allValues);
                                                  const range = maxVal - minVal || 1;
                                                  const keptAvg = keptValues.length > 0 ? keptValues.reduce((a, b) => a + b, 0) / keptValues.length : null;
                                                  const removedAvg = removedValues.length > 0 ? removedValues.reduce((a, b) => a + b, 0) / removedValues.length : null;
                                                  
                                                  return (
                                                    <div key={label} className="p-2 rounded border bg-muted/20">
                                                      <div className="text-[10px] font-medium mb-1">{label}</div>
                                                      
                                                      {/* Average comparison bars */}
                                                      <div className="space-y-1 mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                          <span className="text-[9px] w-12 text-green-600">Kept</span>
                                                          <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden relative">
                                                            {keptAvg !== null && (
                                                              <div 
                                                                className={cn(
                                                                  "h-full rounded-sm transition-all",
                                                                  colorPositive && keptAvg >= 0 ? "bg-green-500" : colorPositive && keptAvg < 0 ? "bg-red-500" : "bg-green-500"
                                                                )}
                                                                style={{ 
                                                                  width: `${Math.abs((keptAvg - minVal) / range) * 100}%`,
                                                                }}
                                                              />
                                                            )}
                                                          </div>
                                                          <span className={cn(
                                                            "text-[9px] w-14 text-right font-medium",
                                                            colorPositive && keptAvg !== null && keptAvg >= 0 ? "text-green-600" : colorPositive && keptAvg !== null ? "text-red-500" : ""
                                                          )}>
                                                            {keptAvg !== null ? format(keptAvg) : '—'}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                          <span className="text-[9px] w-12 text-red-500">Removed</span>
                                                          <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden relative">
                                                            {removedAvg !== null && (
                                                              <div 
                                                                className={cn(
                                                                  "h-full rounded-sm transition-all",
                                                                  colorPositive && removedAvg >= 0 ? "bg-green-500/60" : colorPositive && removedAvg < 0 ? "bg-red-500/60" : "bg-red-500/60"
                                                                )}
                                                                style={{ 
                                                                  width: `${Math.abs((removedAvg - minVal) / range) * 100}%`,
                                                                }}
                                                              />
                                                            )}
                                                          </div>
                                                          <span className={cn(
                                                            "text-[9px] w-14 text-right font-medium",
                                                            colorPositive && removedAvg !== null && removedAvg >= 0 ? "text-green-600" : colorPositive && removedAvg !== null ? "text-red-500" : ""
                                                          )}>
                                                            {removedAvg !== null ? format(removedAvg) : '—'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Individual value dots */}
                                                      <div className="flex items-center gap-1 h-4">
                                                        <div className="flex-1 relative h-full bg-muted/50 rounded-sm">
                                                          {/* Zero line for PnL */}
                                                          {colorPositive && minVal < 0 && maxVal > 0 && (
                                                            <div 
                                                              className="absolute top-0 bottom-0 w-px bg-border"
                                                              style={{ left: `${((0 - minVal) / range) * 100}%` }}
                                                            />
                                                          )}
                                                          {/* Kept dots */}
                                                          {keptWithPerf.map((item, i) => {
                                                            const val = getValue(item)!;
                                                            return (
                                                              <Tooltip key={`kept-${i}`}>
                                                                <TooltipTrigger asChild>
                                                                  <div 
                                                                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 border border-green-600 cursor-pointer hover:scale-125 transition-transform"
                                                                    style={{ left: `${((val - minVal) / range) * 100}%` }}
                                                                  />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-[10px]">
                                                                  <div className="font-medium">{item.version.data.label}</div>
                                                                  <div>{label}: {format(val)}</div>
                                                                </TooltipContent>
                                                              </Tooltip>
                                                            );
                                                          })}
                                                          {/* Removed dots */}
                                                          {removedWithPerf.map((item, i) => {
                                                            const val = getValue(item)!;
                                                            return (
                                                              <Tooltip key={`removed-${i}`}>
                                                                <TooltipTrigger asChild>
                                                                  <div 
                                                                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500/70 border border-red-600/70 cursor-pointer hover:scale-125 transition-transform"
                                                                    style={{ left: `${((val - minVal) / range) * 100}%` }}
                                                                  />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-[10px]">
                                                                  <div className="font-medium">{item.version.data.label}</div>
                                                                  <div>{label}: {format(val)}</div>
                                                                </TooltipContent>
                                                              </Tooltip>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Summary Statistics Card */}
                                          {(effectiveKept.length > 0 || effectiveRemoved.length > 0) && (() => {
                                            // Helper to calculate statistics
                                            const calcStats = (values: number[]) => {
                                              if (values.length === 0) return null;
                                              const sorted = [...values].sort((a, b) => a - b);
                                              const min = sorted[0];
                                              const max = sorted[sorted.length - 1];
                                              const median = sorted.length % 2 === 0
                                                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                                                : sorted[Math.floor(sorted.length / 2)];
                                              return { min, max, median };
                                            };

                                            const metrics = [
                                              { 
                                                label: 'PnL %', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.totalPnlPercent,
                                                format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
                                                colorize: true
                                              },
                                              { 
                                                label: 'Win Rate', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.winRate,
                                                format: (v: number) => `${v.toFixed(1)}%`,
                                                colorize: false
                                              },
                                              { 
                                                label: 'Sharpe', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.sharpeRatio,
                                                format: (v: number) => v.toFixed(2),
                                                colorize: true
                                              },
                                              { 
                                                label: 'Max DD', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.maxDrawdown,
                                                format: (v: number) => `${v.toFixed(2)}%`,
                                                colorize: false,
                                                invertColor: true
                                              },
                                              { 
                                                label: 'Profit Factor', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.profitFactor,
                                                format: (v: number) => v.toFixed(2),
                                                colorize: true
                                              },
                                            ];

                                            return (
                                              <div className="space-y-3">
                                                <div className="text-xs font-medium">Summary Statistics</div>
                                                <div className="rounded-lg border overflow-hidden">
                                                  <table className="w-full text-[10px]">
                                                    <thead>
                                                      <tr className="bg-muted/50">
                                                        <th className="px-2 py-1.5 text-left font-medium">Metric</th>
                                                        <th className="px-2 py-1.5 text-center font-medium" colSpan={3}>
                                                          <span className="text-green-600">Kept</span>
                                                        </th>
                                                        <th className="px-2 py-1.5 text-center font-medium" colSpan={3}>
                                                          <span className="text-red-500">Removed</span>
                                                        </th>
                                                      </tr>
                                                      <tr className="bg-muted/30 text-muted-foreground">
                                                        <th className="px-2 py-1 text-left"></th>
                                                        <th className="px-2 py-1 text-center text-[9px]">Min</th>
                                                        <th className="px-2 py-1 text-center text-[9px]">Median</th>
                                                        <th className="px-2 py-1 text-center text-[9px]">Max</th>
                                                        <th className="px-2 py-1 text-center text-[9px]">Min</th>
                                                        <th className="px-2 py-1 text-center text-[9px]">Median</th>
                                                        <th className="px-2 py-1 text-center text-[9px]">Max</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {metrics.map(({ label, getValue, format, colorize, invertColor }) => {
                                                        const keptValues = effectiveKept
                                                          .map(v => getValue(v))
                                                          .filter((v): v is number => v !== undefined);
                                                        const removedValues = effectiveRemoved
                                                          .map(v => getValue(v))
                                                          .filter((v): v is number => v !== undefined);
                                                        
                                                        const keptStats = calcStats(keptValues);
                                                        const removedStats = calcStats(removedValues);

                                                        const getValueColor = (val: number | undefined, isKept: boolean, stat: 'min' | 'median' | 'max') => {
                                                          if (val === undefined || !colorize) return '';
                                                          if (invertColor) {
                                                            // For drawdown, lower is better
                                                            return val < 10 ? 'text-green-600' : val > 20 ? 'text-red-500' : '';
                                                          }
                                                          return val >= 0 ? 'text-green-600' : 'text-red-500';
                                                        };

                                                        return (
                                                          <tr key={label} className="border-t border-border/50 hover:bg-muted/20">
                                                            <td className="px-2 py-1.5 font-medium">{label}</td>
                                                            <td className={cn("px-2 py-1.5 text-center", getValueColor(keptStats?.min, true, 'min'))}>
                                                              {keptStats ? format(keptStats.min) : '—'}
                                                            </td>
                                                            <td className={cn("px-2 py-1.5 text-center font-medium", getValueColor(keptStats?.median, true, 'median'))}>
                                                              {keptStats ? format(keptStats.median) : '—'}
                                                            </td>
                                                            <td className={cn("px-2 py-1.5 text-center", getValueColor(keptStats?.max, true, 'max'))}>
                                                              {keptStats ? format(keptStats.max) : '—'}
                                                            </td>
                                                            <td className={cn("px-2 py-1.5 text-center", getValueColor(removedStats?.min, false, 'min'))}>
                                                              {removedStats ? format(removedStats.min) : '—'}
                                                            </td>
                                                            <td className={cn("px-2 py-1.5 text-center font-medium", getValueColor(removedStats?.median, false, 'median'))}>
                                                              {removedStats ? format(removedStats.median) : '—'}
                                                            </td>
                                                            <td className={cn("px-2 py-1.5 text-center", getValueColor(removedStats?.max, false, 'max'))}>
                                                              {removedStats ? format(removedStats.max) : '—'}
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                {/* Quick comparison badges */}
                                                <div className="flex flex-wrap gap-1.5">
                                                  {metrics.map(({ label, getValue }) => {
                                                    const keptValues = effectiveKept.map(v => getValue(v)).filter((v): v is number => v !== undefined);
                                                    const removedValues = effectiveRemoved.map(v => getValue(v)).filter((v): v is number => v !== undefined);
                                                    if (keptValues.length === 0 || removedValues.length === 0) return null;
                                                    
                                                    const keptMedian = [...keptValues].sort((a, b) => a - b)[Math.floor(keptValues.length / 2)];
                                                    const removedMedian = [...removedValues].sort((a, b) => a - b)[Math.floor(removedValues.length / 2)];
                                                    const diff = keptMedian - removedMedian;
                                                    const percentDiff = removedMedian !== 0 ? ((diff / Math.abs(removedMedian)) * 100) : 0;
                                                    
                                                    if (Math.abs(diff) < 0.01) return null;
                                                    
                                                    const isPositive = label === 'Max DD' ? diff < 0 : diff > 0;
                                                    
                                                    return (
                                                      <span 
                                                        key={label}
                                                        className={cn(
                                                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium",
                                                          isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                                                        )}
                                                      >
                                                        {label}
                                                        {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                                                        {Math.abs(percentDiff).toFixed(0)}%
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Range Spread Visualization */}
                                          {(effectiveKept.length > 0 || effectiveRemoved.length > 0) && (() => {
                                            const metrics = [
                                              { 
                                                label: 'PnL %', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.totalPnlPercent,
                                                format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
                                              },
                                              { 
                                                label: 'Win Rate', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.winRate,
                                                format: (v: number) => `${v.toFixed(0)}%`,
                                              },
                                              { 
                                                label: 'Sharpe', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.sharpeRatio,
                                                format: (v: number) => v.toFixed(2),
                                              },
                                              { 
                                                label: 'Max DD', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.maxDrawdown,
                                                format: (v: number) => `${v.toFixed(1)}%`,
                                              },
                                              { 
                                                label: 'Profit Factor', 
                                                getValue: (v: typeof effectiveKept[0]) => v.version.performance?.profitFactor,
                                                format: (v: number) => v.toFixed(2),
                                              },
                                            ];

                                            return (
                                              <div className="space-y-3">
                                                <div className="text-xs font-medium">Distribution Overlap</div>
                                                <div className="space-y-4">
                                                  {metrics.map(({ label, getValue, format }) => {
                                                    const keptValues = effectiveKept
                                                      .map(v => getValue(v))
                                                      .filter((v): v is number => v !== undefined);
                                                    const removedValues = effectiveRemoved
                                                      .map(v => getValue(v))
                                                      .filter((v): v is number => v !== undefined);
                                                    
                                                    if (keptValues.length === 0 && removedValues.length === 0) return null;
                                                    
                                                    const allValues = [...keptValues, ...removedValues];
                                                    const globalMin = Math.min(...allValues);
                                                    const globalMax = Math.max(...allValues);
                                                    const range = globalMax - globalMin || 1;
                                                    
                                                    const keptMin = keptValues.length > 0 ? Math.min(...keptValues) : null;
                                                    const keptMax = keptValues.length > 0 ? Math.max(...keptValues) : null;
                                                    const removedMin = removedValues.length > 0 ? Math.min(...removedValues) : null;
                                                    const removedMax = removedValues.length > 0 ? Math.max(...removedValues) : null;
                                                    
                                                    // Calculate overlap
                                                    let overlapStart = null;
                                                    let overlapEnd = null;
                                                    if (keptMin !== null && keptMax !== null && removedMin !== null && removedMax !== null) {
                                                      overlapStart = Math.max(keptMin, removedMin);
                                                      overlapEnd = Math.min(keptMax, removedMax);
                                                      if (overlapStart > overlapEnd) {
                                                        overlapStart = null;
                                                        overlapEnd = null;
                                                      }
                                                    }
                                                    
                                                    const getPosition = (val: number) => ((val - globalMin) / range) * 100;
                                                    
                                                    return (
                                                      <div key={label} className="space-y-1">
                                                        <div className="flex items-center justify-between text-[10px]">
                                                          <span className="font-medium">{label}</span>
                                                          <div className="flex items-center gap-3 text-muted-foreground">
                                                            {keptValues.length > 0 && (
                                                              <span className="text-green-600">
                                                                {format(keptMin!)} – {format(keptMax!)}
                                                              </span>
                                                            )}
                                                            {removedValues.length > 0 && (
                                                              <span className="text-red-500">
                                                                {format(removedMin!)} – {format(removedMax!)}
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>
                                                        
                                                        {/* Range visualization bar */}
                                                        <div className="relative h-6 bg-muted/30 rounded overflow-hidden">
                                                          {/* Scale markers */}
                                                          <div className="absolute inset-0 flex justify-between items-end px-1 pb-0.5">
                                                            <span className="text-[8px] text-muted-foreground/60">{format(globalMin)}</span>
                                                            <span className="text-[8px] text-muted-foreground/60">{format(globalMax)}</span>
                                                          </div>
                                                          
                                                          {/* Removed range (red, behind) */}
                                                          {removedMin !== null && removedMax !== null && (
                                                            <div 
                                                              className="absolute top-1 h-2 bg-red-500/40 rounded-sm"
                                                              style={{
                                                                left: `${getPosition(removedMin)}%`,
                                                                width: `${Math.max(1, getPosition(removedMax) - getPosition(removedMin))}%`,
                                                              }}
                                                            />
                                                          )}
                                                          
                                                          {/* Kept range (green, in front) */}
                                                          {keptMin !== null && keptMax !== null && (
                                                            <div 
                                                              className="absolute top-1 h-2 bg-green-500/60 rounded-sm"
                                                              style={{
                                                                left: `${getPosition(keptMin)}%`,
                                                                width: `${Math.max(1, getPosition(keptMax) - getPosition(keptMin))}%`,
                                                              }}
                                                            />
                                                          )}
                                                          
                                                          {/* Overlap region (striped pattern) */}
                                                          {overlapStart !== null && overlapEnd !== null && (
                                                            <div 
                                                              className="absolute top-1 h-2 rounded-sm overflow-hidden"
                                                              style={{
                                                                left: `${getPosition(overlapStart)}%`,
                                                                width: `${Math.max(1, getPosition(overlapEnd) - getPosition(overlapStart))}%`,
                                                                background: 'repeating-linear-gradient(45deg, hsl(var(--chart-1)) 0, hsl(var(--chart-1)) 2px, hsl(var(--chart-2)) 2px, hsl(var(--chart-2)) 4px)',
                                                                opacity: 0.7,
                                                              }}
                                                            />
                                                          )}
                                                          
                                                          {/* Individual version dots - Kept */}
                                                          {keptValues.map((val, idx) => (
                                                            <div
                                                              key={`kept-${idx}`}
                                                              className="absolute top-2.5 w-1.5 h-1.5 bg-green-600 rounded-full border border-green-700 shadow-sm transform -translate-x-1/2"
                                                              style={{ left: `${getPosition(val)}%` }}
                                                              title={`Kept: ${format(val)}`}
                                                            />
                                                          ))}
                                                          
                                                          {/* Individual version dots - Removed */}
                                                          {removedValues.map((val, idx) => (
                                                            <div
                                                              key={`removed-${idx}`}
                                                              className="absolute top-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-red-600 shadow-sm transform -translate-x-1/2"
                                                              style={{ left: `${getPosition(val)}%` }}
                                                              title={`Removed: ${format(val)}`}
                                                            />
                                                          ))}
                                                        </div>
                                                        
                                                        {/* Overlap indicator */}
                                                        {overlapStart !== null && overlapEnd !== null && (
                                                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                            <div className="w-2 h-2 rounded-sm" style={{
                                                              background: 'repeating-linear-gradient(45deg, hsl(var(--chart-1)) 0, hsl(var(--chart-1)) 1px, hsl(var(--chart-2)) 1px, hsl(var(--chart-2)) 2px)',
                                                            }} />
                                                            <span>Overlap: {format(overlapStart)} – {format(overlapEnd)}</span>
                                                          </div>
                                                        )}
                                                        {overlapStart === null && keptValues.length > 0 && removedValues.length > 0 && (
                                                          <div className="text-[9px] text-green-600 font-medium">
                                                            ✓ No overlap - clear separation
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                                
                                                {/* Legend */}
                                                <div className="flex items-center gap-4 text-[9px] text-muted-foreground pt-1 border-t border-border/50">
                                                  <div className="flex items-center gap-1">
                                                    <div className="w-3 h-2 bg-green-500/60 rounded-sm" />
                                                    <span>Kept range</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <div className="w-3 h-2 bg-red-500/40 rounded-sm" />
                                                    <span>Removed range</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full border border-green-700" />
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full border border-red-600 -ml-0.5" />
                                                    <span>Individual versions</span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Correlation Scatter Plot */}
                                          {(effectiveKept.length > 0 || effectiveRemoved.length > 0) && (() => {
                                            const metricPairs = [
                                              { xKey: 'totalPnlPercent', yKey: 'winRate', xLabel: 'PnL %', yLabel: 'Win Rate %' },
                                              { xKey: 'totalPnlPercent', yKey: 'sharpeRatio', xLabel: 'PnL %', yLabel: 'Sharpe Ratio' },
                                              { xKey: 'winRate', yKey: 'profitFactor', xLabel: 'Win Rate %', yLabel: 'Profit Factor' },
                                              { xKey: 'sharpeRatio', yKey: 'maxDrawdown', xLabel: 'Sharpe Ratio', yLabel: 'Max Drawdown %' },
                                            ];
                                            
                                            const [selectedPair, setSelectedPair] = React.useState(0);
                                            const pair = metricPairs[selectedPair];
                                            
                                            type PerformanceKey = 'totalPnlPercent' | 'winRate' | 'sharpeRatio' | 'maxDrawdown' | 'profitFactor';
                                            
                                            const getPoints = (items: typeof effectiveKept, isKept: boolean) => {
                                              return items
                                                .filter(item => item.version.performance)
                                                .map(item => ({
                                                  x: item.version.performance![pair.xKey as PerformanceKey],
                                                  y: item.version.performance![pair.yKey as PerformanceKey],
                                                  label: item.version.data.label,
                                                  isKept,
                                                }));
                                            };
                                            
                                            const keptPoints = getPoints(effectiveKept, true);
                                            const removedPoints = getPoints(effectiveRemoved, false);
                                            const allPoints = [...keptPoints, ...removedPoints];
                                            
                                            if (allPoints.length < 2) return null;
                                            
                                            const xValues = allPoints.map(p => p.x);
                                            const yValues = allPoints.map(p => p.y);
                                            const xMin = Math.min(...xValues);
                                            const xMax = Math.max(...xValues);
                                            const yMin = Math.min(...yValues);
                                            const yMax = Math.max(...yValues);
                                            const xRange = xMax - xMin || 1;
                                            const yRange = yMax - yMin || 1;
                                            const xPadding = xRange * 0.1;
                                            const yPadding = yRange * 0.1;
                                            
                                            const getXPos = (val: number) => ((val - (xMin - xPadding)) / (xRange + 2 * xPadding)) * 100;
                                            const getYPos = (val: number) => 100 - ((val - (yMin - yPadding)) / (yRange + 2 * yPadding)) * 100;
                                            
                                            // Calculate correlation coefficient
                                            const n = allPoints.length;
                                            const sumX = xValues.reduce((a, b) => a + b, 0);
                                            const sumY = yValues.reduce((a, b) => a + b, 0);
                                            const sumXY = allPoints.reduce((a, p) => a + p.x * p.y, 0);
                                            const sumX2 = xValues.reduce((a, b) => a + b * b, 0);
                                            const sumY2 = yValues.reduce((a, b) => a + b * b, 0);
                                            const correlation = (n * sumXY - sumX * sumY) / 
                                              Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)) || 0;
                                            
                                            return (
                                              <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                  <div className="text-xs font-medium">Correlation Scatter Plot</div>
                                                  <div className="flex items-center gap-1">
                                                    {metricPairs.map((mp, idx) => (
                                                      <Button
                                                        key={idx}
                                                        variant={selectedPair === idx ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="h-5 text-[9px] px-1.5"
                                                        onClick={() => setSelectedPair(idx)}
                                                      >
                                                        {mp.xLabel} vs {mp.yLabel}
                                                      </Button>
                                                    ))}
                                                  </div>
                                                </div>
                                                
                                                {/* Scatter plot area */}
                                                <div className="relative h-48 bg-muted/20 rounded border overflow-hidden">
                                                  {/* Grid lines */}
                                                  <div className="absolute inset-0">
                                                    {[0, 25, 50, 75, 100].map(pct => (
                                                      <React.Fragment key={pct}>
                                                        <div 
                                                          className="absolute left-0 right-0 border-t border-border/30"
                                                          style={{ top: `${pct}%` }}
                                                        />
                                                        <div 
                                                          className="absolute top-0 bottom-0 border-l border-border/30"
                                                          style={{ left: `${pct}%` }}
                                                        />
                                                      </React.Fragment>
                                                    ))}
                                                  </div>
                                                  
                                                  {/* Zero lines if applicable */}
                                                  {xMin < 0 && xMax > 0 && (
                                                    <div 
                                                      className="absolute top-0 bottom-0 border-l border-muted-foreground/40"
                                                      style={{ left: `${getXPos(0)}%` }}
                                                    />
                                                  )}
                                                  {yMin < 0 && yMax > 0 && (
                                                    <div 
                                                      className="absolute left-0 right-0 border-t border-muted-foreground/40"
                                                      style={{ top: `${getYPos(0)}%` }}
                                                    />
                                                  )}
                                                  
                                                  {/* Removed points (behind) */}
                                                  {removedPoints.map((point, idx) => (
                                                    <Tooltip key={`removed-${idx}`}>
                                                      <TooltipTrigger asChild>
                                                        <div
                                                          className="absolute w-3 h-3 bg-red-500/70 rounded-full border-2 border-red-600 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform z-10"
                                                          style={{ 
                                                            left: `${getXPos(point.x)}%`, 
                                                            top: `${getYPos(point.y)}%` 
                                                          }}
                                                        />
                                                      </TooltipTrigger>
                                                      <TooltipContent side="top" className="text-[10px]">
                                                        <div className="font-medium text-red-500">{point.label}</div>
                                                        <div>{pair.xLabel}: {point.x.toFixed(2)}</div>
                                                        <div>{pair.yLabel}: {point.y.toFixed(2)}</div>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  ))}
                                                  
                                                  {/* Kept points (in front) */}
                                                  {keptPoints.map((point, idx) => (
                                                    <Tooltip key={`kept-${idx}`}>
                                                      <TooltipTrigger asChild>
                                                        <div
                                                          className="absolute w-3.5 h-3.5 bg-green-500/80 rounded-full border-2 border-green-600 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform z-20"
                                                          style={{ 
                                                            left: `${getXPos(point.x)}%`, 
                                                            top: `${getYPos(point.y)}%` 
                                                          }}
                                                        />
                                                      </TooltipTrigger>
                                                      <TooltipContent side="top" className="text-[10px]">
                                                        <div className="font-medium text-green-600">{point.label}</div>
                                                        <div>{pair.xLabel}: {point.x.toFixed(2)}</div>
                                                        <div>{pair.yLabel}: {point.y.toFixed(2)}</div>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  ))}
                                                  
                                                  {/* Axis labels */}
                                                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground font-medium bg-background/80 px-1 rounded">
                                                    {pair.xLabel}
                                                  </div>
                                                  <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-medium bg-background/80 px-1 rounded -rotate-90 origin-center">
                                                    {pair.yLabel}
                                                  </div>
                                                  
                                                  {/* Corner values */}
                                                  <div className="absolute bottom-1 left-1 text-[8px] text-muted-foreground/60">
                                                    {(xMin - xPadding).toFixed(1)}
                                                  </div>
                                                  <div className="absolute bottom-1 right-1 text-[8px] text-muted-foreground/60">
                                                    {(xMax + xPadding).toFixed(1)}
                                                  </div>
                                                  <div className="absolute top-1 left-1 text-[8px] text-muted-foreground/60">
                                                    {(yMax + yPadding).toFixed(1)}
                                                  </div>
                                                </div>
                                                
                                                {/* Stats and legend */}
                                                <div className="flex items-center justify-between text-[9px]">
                                                  <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                      <div className="w-2.5 h-2.5 bg-green-500/80 rounded-full border border-green-600" />
                                                      <span className="text-muted-foreground">Kept ({keptPoints.length})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <div className="w-2.5 h-2.5 bg-red-500/70 rounded-full border border-red-600" />
                                                      <span className="text-muted-foreground">Removed ({removedPoints.length})</span>
                                                    </div>
                                                  </div>
                                                  <div className={cn(
                                                    "font-medium px-2 py-0.5 rounded",
                                                    Math.abs(correlation) > 0.7 
                                                      ? correlation > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                                                      : "bg-muted text-muted-foreground"
                                                  )}>
                                                    Correlation: {correlation.toFixed(2)}
                                                    {Math.abs(correlation) > 0.7 ? (correlation > 0 ? ' (strong +)' : ' (strong -)') : 
                                                     Math.abs(correlation) > 0.4 ? ' (moderate)' : ' (weak)'}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Side-by-side detailed view */}
                                          <div className="grid grid-cols-2 gap-3">
                                            {/* Kept Versions */}
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                                                <Check className="h-3 w-3" />
                                                Kept Versions
                                              </div>
                                              <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                                                {effectiveKept.map((item) => (
                                                  <div 
                                                    key={item.version.id} 
                                                    className={cn(
                                                      "p-2 rounded border text-[10px] space-y-1",
                                                      manuallyProtectedVersions.has(item.version.id) 
                                                        ? "bg-blue-500/5 border-blue-500/30" 
                                                        : "bg-green-500/5 border-green-500/30"
                                                    )}
                                                  >
                                                    <div className="font-medium truncate">{item.version.data.label}</div>
                                                    <div className="grid grid-cols-2 gap-x-2 text-muted-foreground">
                                                      <span>Position: {item.version.data.positionSizePercent}%</span>
                                                      <span>SL: {item.version.data.stopLossPercent}%</span>
                                                      <span>TP: {item.version.data.takeProfitPercent}%</span>
                                                      <span>SMA: {item.version.data.fastSMA}/{item.version.data.slowSMA}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                                {effectiveKept.length === 0 && (
                                                  <div className="text-muted-foreground text-[10px] p-2">No versions</div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Removed Versions */}
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-xs font-medium text-red-500">
                                                <Trash2 className="h-3 w-3" />
                                                Removed Versions
                                              </div>
                                              <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                                                {effectiveRemoved.map((item) => (
                                                  <div 
                                                    key={item.version.id} 
                                                    className="p-2 rounded border bg-red-500/5 border-red-500/30 text-[10px] space-y-1"
                                                  >
                                                    <div className="font-medium truncate">{item.version.data.label}</div>
                                                    <div className="grid grid-cols-2 gap-x-2 text-muted-foreground">
                                                      <span>Position: {item.version.data.positionSizePercent}%</span>
                                                      <span>SL: {item.version.data.stopLossPercent}%</span>
                                                      <span>TP: {item.version.data.takeProfitPercent}%</span>
                                                      <span>SMA: {item.version.data.fastSMA}/{item.version.data.slowSMA}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                                {effectiveRemoved.length === 0 && (
                                                  <div className="text-muted-foreground text-[10px] p-2">No versions to remove</div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Summary insight */}
                                          {keptAverages && removedAverages && (
                                            <div className="p-3 rounded-lg bg-muted/30 border text-xs">
                                              <div className="font-medium mb-1">Parameter Insights</div>
                                              <div className="text-muted-foreground space-y-0.5">
                                                {keptAverages.positionSize !== removedAverages.positionSize && (
                                                  <div>
                                                    • Kept versions use {keptAverages.positionSize > removedAverages.positionSize ? 'larger' : 'smaller'} position sizes on average
                                                  </div>
                                                )}
                                                {keptAverages.stopLoss !== removedAverages.stopLoss && (
                                                  <div>
                                                    • Kept versions have {keptAverages.stopLoss > removedAverages.stopLoss ? 'wider' : 'tighter'} stop losses
                                                  </div>
                                                )}
                                                {keptAverages.takeProfit !== removedAverages.takeProfit && (
                                                  <div>
                                                    • Kept versions target {keptAverages.takeProfit > removedAverages.takeProfit ? 'higher' : 'lower'} take profits
                                                  </div>
                                                )}
                                                {(keptAverages.fastSMA !== removedAverages.fastSMA || keptAverages.slowSMA !== removedAverages.slowSMA) && (
                                                  <div>
                                                    • SMA periods differ between kept and removed versions
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  );
                                  })()}
                                  
                                  <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <div className="flex gap-2 mr-auto">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-1.5" />
                                            Export
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              if (!smartCleanupPreviewData) return;
                                              
                                              const effectiveKept = [
                                                ...smartCleanupPreviewData.kept,
                                                ...smartCleanupPreviewData.removed.filter(item => manuallyProtectedVersions.has(item.version.id))
                                              ];
                                              const effectiveRemoved = smartCleanupPreviewData.removed.filter(
                                                item => !manuallyProtectedVersions.has(item.version.id)
                                              );
                                              
                                              const headers = ['Status', 'Preset', 'Version', 'PnL %', 'Win Rate %', 'Sharpe Ratio', 'Reason'];
                                              const rows = [
                                                ...effectiveKept.map((item, idx) => {
                                                  const isManuallyProtected = manuallyProtectedVersions.has(item.version.id);
                                                  return [
                                                    isManuallyProtected ? 'Protected (Manual)' : 'Kept',
                                                    `Preset ${item.slot}`,
                                                    item.version.data.label,
                                                    item.version.performance?.totalPnlPercent?.toFixed(2) ?? '',
                                                    item.version.performance?.winRate?.toFixed(1) ?? '',
                                                    item.version.performance?.sharpeRatio?.toFixed(2) ?? '',
                                                    isManuallyProtected ? 'Manually protected' : `Rank #${idx + 1}`
                                                  ];
                                                }),
                                                ...effectiveRemoved.map(item => [
                                                  'Remove',
                                                  `Preset ${item.slot}`,
                                                  item.version.data.label,
                                                  item.version.performance?.totalPnlPercent?.toFixed(2) ?? '',
                                                  item.version.performance?.winRate?.toFixed(1) ?? '',
                                                  item.version.performance?.sharpeRatio?.toFixed(2) ?? '',
                                                  item.version.performance ? 'Lower performance' : 'No performance data'
                                                ])
                                              ];
                                              
                                              const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
                                              const blob = new Blob([csv], { type: 'text/csv' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `cleanup-preview-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
                                              a.click();
                                              URL.revokeObjectURL(url);
                                              toast.success('Exported cleanup preview as CSV');
                                            }}
                                          >
                                            Export as CSV
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              if (!smartCleanupPreviewData) return;
                                              
                                              const effectiveKept = [
                                                ...smartCleanupPreviewData.kept,
                                                ...smartCleanupPreviewData.removed.filter(item => manuallyProtectedVersions.has(item.version.id))
                                              ];
                                              const effectiveRemoved = smartCleanupPreviewData.removed.filter(
                                                item => !manuallyProtectedVersions.has(item.version.id)
                                              );
                                              
                                              const report = {
                                                exportedAt: new Date().toISOString(),
                                                summary: {
                                                  totalKept: effectiveKept.length,
                                                  totalRemoved: effectiveRemoved.length,
                                                  manuallyProtected: manuallyProtectedVersions.size
                                                },
                                                kept: effectiveKept.map((item, idx) => ({
                                                  preset: item.slot,
                                                  label: item.version.data.label,
                                                  id: item.version.id,
                                                  isManuallyProtected: manuallyProtectedVersions.has(item.version.id),
                                                  rank: manuallyProtectedVersions.has(item.version.id) ? null : idx + 1,
                                                  performance: item.version.performance ? {
                                                    pnlPercent: item.version.performance.totalPnlPercent,
                                                    winRate: item.version.performance.winRate,
                                                    sharpeRatio: item.version.performance.sharpeRatio,
                                                    maxDrawdown: item.version.performance.maxDrawdown,
                                                    profitFactor: item.version.performance.profitFactor,
                                                    totalTrades: item.version.performance.totalTrades
                                                  } : null
                                                })),
                                                removed: effectiveRemoved.map(item => ({
                                                  preset: item.slot,
                                                  label: item.version.data.label,
                                                  id: item.version.id,
                                                  reason: item.version.performance ? 'Lower performance' : 'No performance data',
                                                  performance: item.version.performance ? {
                                                    pnlPercent: item.version.performance.totalPnlPercent,
                                                    winRate: item.version.performance.winRate,
                                                    sharpeRatio: item.version.performance.sharpeRatio,
                                                    maxDrawdown: item.version.performance.maxDrawdown,
                                                    profitFactor: item.version.performance.profitFactor,
                                                    totalTrades: item.version.performance.totalTrades
                                                  } : null
                                                }))
                                              };
                                              
                                              const json = JSON.stringify(report, null, 2);
                                              const blob = new Blob([json], { type: 'application/json' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `cleanup-preview-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
                                              a.click();
                                              URL.revokeObjectURL(url);
                                              toast.success('Exported cleanup preview as JSON');
                                            }}
                                          >
                                            Export as JSON
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSmartCleanupPreviewOpen(false);
                                        setSmartCleanupPreviewData(null);
                                        setManuallyProtectedVersions(new Set());
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="default"
                                      className="bg-purple-600 hover:bg-purple-700"
                                      disabled={!smartCleanupPreviewData || (smartCleanupPreviewData.removed.length - manuallyProtectedVersions.size) === 0}
                                      onClick={() => {
                                        if (onSmartCleanup && onDeleteVersions && smartCleanupPreviewData) {
                                          // Get the version IDs that should actually be removed (excluding manually protected)
                                          const versionIdsToRemove = smartCleanupPreviewData.removed
                                            .filter(item => !manuallyProtectedVersions.has(item.version.id))
                                            .map(item => ({ slot: item.slot, id: item.version.id }));
                                          
                                          // Group by slot and delete
                                          const bySlot: Record<'4' | '5' | '6', string[]> = { '4': [], '5': [], '6': [] };
                                          versionIdsToRemove.forEach(({ slot, id }) => {
                                            bySlot[slot].push(id);
                                          });
                                          
                                          let totalDeleted = 0;
                                          for (const slot of ['4', '5', '6'] as const) {
                                            if (bySlot[slot].length > 0) {
                                              totalDeleted += onDeleteVersions(slot, bySlot[slot]);
                                            }
                                          }
                                          
                                          if (totalDeleted > 0) {
                                            toast.success(`Smart cleanup complete`, {
                                              description: `Removed ${totalDeleted} version${totalDeleted !== 1 ? 's' : ''}${manuallyProtectedVersions.size > 0 ? `, protected ${manuallyProtectedVersions.size}` : ''}`,
                                            });
                                          }
                                        }
                                        setSmartCleanupPreviewOpen(false);
                                        setSmartCleanupPreviewData(null);
                                        setManuallyProtectedVersions(new Set());
                                      }}
                                    >
                                      <Sparkles className="h-4 w-4 mr-1.5" />
                                      Remove {smartCleanupPreviewData ? (smartCleanupPreviewData.removed.length - manuallyProtectedVersions.size) : 0} Version{(smartCleanupPreviewData ? (smartCleanupPreviewData.removed.length - manuallyProtectedVersions.size) : 0) !== 1 ? 's' : ''}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          );
                        })()}
                        
                        {/* Undo Cleanup Button with Countdown */}
                        {canUndoCleanup && onUndoManualCleanup && cleanupBackupTimestamp && (() => {
                          const UNDO_TIMEOUT = 30000; // 30 seconds
                          const elapsed = Date.now() - cleanupBackupTimestamp;
                          const remaining = Math.max(0, UNDO_TIMEOUT - elapsed);
                          const remainingSeconds = Math.ceil(remaining / 1000);
                          const progress = (remaining / UNDO_TIMEOUT) * 100;
                          
                          return (
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs border-amber-500/50 text-amber-600 hover:bg-amber-500/10 overflow-hidden"
                                onClick={() => onUndoManualCleanup()}
                              >
                                {/* Progress bar background */}
                                <div 
                                  className="absolute inset-0 bg-amber-500/10 transition-all duration-1000 ease-linear"
                                  style={{ width: `${progress}%` }}
                                />
                                <span className="relative flex items-center gap-1.5">
                                  <Undo2 className="h-3 w-3" />
                                  Undo Cleanup
                                  <span className="font-mono text-[10px] opacity-75">({remainingSeconds}s)</span>
                                </span>
                              </Button>
                              {/* Circular countdown indicator */}
                              <div className="absolute -right-1 -top-1 w-5 h-5">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 20 20">
                                  <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="hsl(var(--background))"
                                    stroke="hsl(var(--border))"
                                    strokeWidth="2"
                                  />
                                  <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="none"
                                    stroke="hsl(38, 92%, 50%)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray={`${progress * 0.502} 100`}
                                    className="transition-all duration-1000 ease-linear"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-amber-600">
                                  {remainingSeconds}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {onClearAllVersionHistory && totalVersions > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setClearAllHistoryConfirmOpen(true)}
                          >
                            <Trash2 className="h-3 w-3 mr-1.5" />
                            Clear All History
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Version History Statistics */}
                {versionHistorySlot && getPresetVersionHistory && !compareVersions[0] && !batchSelectMode && (() => {
                  const versions = getPresetVersionHistory(versionHistorySlot);
                  if (versions.length < 2) return null;
                  
                  const oldest = versions[versions.length - 1];
                  const newest = versions[0];
                  
                  // Calculate change frequency for each parameter
                  const changeCount: Record<string, number> = {
                    label: 0,
                    fastSMA: 0,
                    slowSMA: 0,
                    positionSizePercent: 0,
                    stopLossPercent: 0,
                    takeProfitPercent: 0,
                  };
                  
                  for (let i = 0; i < versions.length - 1; i++) {
                    const current = versions[i];
                    const previous = versions[i + 1];
                    
                    if (current.data.label !== previous.data.label) changeCount.label++;
                    if (current.data.fastSMA !== previous.data.fastSMA) changeCount.fastSMA++;
                    if (current.data.slowSMA !== previous.data.slowSMA) changeCount.slowSMA++;
                    if (current.data.positionSizePercent !== previous.data.positionSizePercent) changeCount.positionSizePercent++;
                    if (current.data.stopLossPercent !== previous.data.stopLossPercent) changeCount.stopLossPercent++;
                    if (current.data.takeProfitPercent !== previous.data.takeProfitPercent) changeCount.takeProfitPercent++;
                  }
                  
                  const paramLabels: Record<string, string> = {
                    label: 'Name',
                    fastSMA: 'Fast SMA',
                    slowSMA: 'Slow SMA',
                    positionSizePercent: 'Position Size',
                    stopLossPercent: 'Stop Loss',
                    takeProfitPercent: 'Take Profit',
                  };
                  
                  // Get top 3 most changed parameters (excluding those with 0 changes)
                  const topChanged = Object.entries(changeCount)
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                  
                  return (
                    <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Versions: </span>
                            <span className="font-medium">{versions.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Range: </span>
                            <span className="font-medium">
                              {format(new Date(oldest.savedAt), 'MMM d')} — {format(new Date(newest.savedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        {topChanged.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Most changed: </span>
                            {topChanged.map(([key, count], idx) => (
                              <span key={key} className="inline-flex items-center">
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px]">
                                  {paramLabels[key]} ({count})
                                </span>
                                {idx < topChanged.length - 1 && <span className="mx-0.5 text-muted-foreground">,</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Version Timeline Chart */}
                {versionHistorySlot && getPresetVersionHistory && !compareVersions[0] && !batchSelectMode && (() => {
                  const versions = getPresetVersionHistory(versionHistorySlot);
                  if (versions.length < 2) return null;
                  
                  return (
                    <VersionTimeline
                      versions={versions}
                      selectedVersionId={restorePreviewVersionId}
                      onVersionClick={(versionId) => {
                        setRestorePreviewVersionId(versionId);
                      }}
                    />
                  );
                })()}
                
                {/* Parameter Sparklines */}
                {versionHistorySlot && getPresetVersionHistory && !compareVersions[0] && !batchSelectMode && (() => {
                  const versions = getPresetVersionHistory(versionHistorySlot);
                  if (versions.length < 2) return null;
                  
                  return <ParameterSparklines versions={versions} />;
                })()}
                
                {/* Comparison View */}
                {compareVersions[0] && compareVersions[1] && versionHistorySlot && getPresetVersionHistory && (() => {
                  const versions = getPresetVersionHistory(versionHistorySlot);
                  const v1 = versions.find(v => v.id === compareVersions[0]);
                  const v2 = versions.find(v => v.id === compareVersions[1]);
                  if (!v1 || !v2) return null;
                  
                  const fields: { key: keyof typeof v1.data; label: string; suffix?: string }[] = [
                    { key: 'label', label: 'Name' },
                    { key: 'fastSMA', label: 'Fast SMA' },
                    { key: 'slowSMA', label: 'Slow SMA' },
                    { key: 'positionSizePercent', label: 'Position Size', suffix: '%' },
                    { key: 'stopLossPercent', label: 'Stop Loss', suffix: '%' },
                    { key: 'takeProfitPercent', label: 'Take Profit', suffix: '%' },
                  ];
                  
                  // Count changes
                  const changeCount = fields.filter(({ key }) => v1.data[key] !== v2.data[key]).length;
                  const increasedCount = fields.filter(({ key }) => {
                    const a = v1.data[key], b = v2.data[key];
                    return typeof a === 'number' && typeof b === 'number' && b > a;
                  }).length;
                  const decreasedCount = fields.filter(({ key }) => {
                    const a = v1.data[key], b = v2.data[key];
                    return typeof a === 'number' && typeof b === 'number' && b < a;
                  }).length;
                  
                  return (
                    <div className="py-4">
                      {/* Change Summary */}
                      <div className="flex items-center justify-center gap-3 mb-4 text-xs">
                        <span className={cn(
                          "px-2 py-1 rounded-full",
                          changeCount > 0 ? "bg-yellow-500/20 text-yellow-600" : "bg-muted text-muted-foreground"
                        )}>
                          {changeCount} change{changeCount !== 1 ? 's' : ''}
                        </span>
                        {increasedCount > 0 && (
                          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-600">
                            ↑ {increasedCount} increased
                          </span>
                        )}
                        {decreasedCount > 0 && (
                          <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-600">
                            ↓ {decreasedCount} decreased
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div className="font-medium text-muted-foreground">Field</div>
                        <div className="text-center">
                          <span className="font-medium">{format(new Date(v1.savedAt), 'MMM d, HH:mm')}</span>
                          {versions[0]?.id === v1.id && (
                            <span className="ml-1 text-[10px] px-1 py-0.5 bg-primary/20 text-primary rounded">Current</span>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="font-medium">{format(new Date(v2.savedAt), 'MMM d, HH:mm')}</span>
                          {versions[0]?.id === v2.id && (
                            <span className="ml-1 text-[10px] px-1 py-0.5 bg-primary/20 text-primary rounded">Current</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {fields.map(({ key, label, suffix }) => {
                          const val1 = v1.data[key as keyof typeof v1.data];
                          const val2 = v2.data[key as keyof typeof v2.data];
                          const isDifferent = val1 !== val2;
                          const isNumeric = typeof val1 === 'number' && typeof val2 === 'number';
                          const increased = isNumeric && (val2 as number) > (val1 as number);
                          const decreased = isNumeric && (val2 as number) < (val1 as number);
                          
                          // Calculate percentage change for numeric values
                          let percentChange: string | null = null;
                          if (isNumeric && isDifferent && (val1 as number) !== 0) {
                            const pct = (((val2 as number) - (val1 as number)) / Math.abs(val1 as number)) * 100;
                            percentChange = pct > 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`;
                          }
                          
                          return (
                            <div key={key} className={cn(
                              "grid grid-cols-3 gap-2 text-xs py-1.5 px-2 rounded",
                              isDifferent && "bg-yellow-500/10"
                            )}>
                              <div className="text-muted-foreground">{label}</div>
                              <div className={cn("text-center", isDifferent && "font-medium text-yellow-500")}>
                                {val1}{suffix || ''}
                              </div>
                              <div className={cn(
                                "text-center flex items-center justify-center gap-1",
                                isDifferent && "font-medium",
                                increased && "text-green-500",
                                decreased && "text-red-500",
                                isDifferent && !isNumeric && "text-yellow-500"
                              )}>
                                {increased && <span className="text-[10px]">↑</span>}
                                {decreased && <span className="text-[10px]">↓</span>}
                                {val2}{suffix || ''}
                                {percentChange && (
                                  <span className="text-[10px] opacity-70 ml-0.5">({percentChange})</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Visual Diff Sparklines */}
                      <VersionDiffSparklines
                        version1={v1}
                        version2={v2}
                        allVersions={versions}
                        className="mt-4"
                      />
                      
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCompareVersions([null, null])}
                        >
                          Back to List
                        </Button>
                        {versions[0]?.id !== v2.id && onRestorePresetVersion && (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (versionHistorySlot && onRestorePresetVersion(versionHistorySlot, v2.id)) {
                                toast.success('Version restored', {
                                  description: `Restored to "${v2.data.label}" from ${format(new Date(v2.savedAt), 'MMM d, HH:mm')}`,
                                });
                                setVersionHistorySlot(null);
                                setCompareVersions([null, null]);
                              }
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restore Right Version
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Version List */}
                {!(compareVersions[0] && compareVersions[1]) && (
                  <div className="py-4">
                    {versionHistorySlot && getPresetVersionHistory && (() => {
                      const allVersions = getPresetVersionHistory(versionHistorySlot);
                      
                      // Filter versions based on search query and field changes
                      const searchFiltered = versionSearchQuery.trim()
                        ? allVersions.filter(version => {
                            const query = versionSearchQuery.toLowerCase();
                            // Search in label
                            if (version.data.label.toLowerCase().includes(query)) return true;
                            // Search in note
                            if (version.note?.toLowerCase().includes(query)) return true;
                            // Search in parameter values
                            if (version.data.fastSMA.toString().includes(query)) return true;
                            if (version.data.slowSMA.toString().includes(query)) return true;
                            if (version.data.positionSizePercent.toString().includes(query)) return true;
                            if (version.data.stopLossPercent.toString().includes(query)) return true;
                            if (version.data.takeProfitPercent.toString().includes(query)) return true;
                            return false;
                          })
                        : allVersions;
                      
                      // Filter by tag
                      const tagFiltered = versionTagFilter
                        ? searchFiltered.filter(version => version.tags?.includes(versionTagFilter))
                        : searchFiltered;
                      
                      // Then filter by field changes
                      const filteredVersions = versionFieldFilter && tagFiltered.length > 1
                        ? tagFiltered.filter((version, index) => {
                            if (index === tagFiltered.length - 1) return true; // Always show oldest
                            const prevVersion = tagFiltered[index + 1];
                            const fieldKey = versionFieldFilter as keyof typeof version.data;
                            return version.data[fieldKey] !== prevVersion.data[fieldKey];
                          })
                        : tagFiltered;
                      
                      const fieldOptions = [
                        { value: 'label', label: 'Name' },
                        { value: 'fastSMA', label: 'Fast SMA' },
                        { value: 'slowSMA', label: 'Slow SMA' },
                        { value: 'positionSizePercent', label: 'Position Size' },
                        { value: 'stopLossPercent', label: 'Stop Loss' },
                        { value: 'takeProfitPercent', label: 'Take Profit' },
                      ];
                      
                      return (
                        <div className="space-y-2">
                          {allVersions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No version history available
                            </p>
                          ) : (
                            <>
                              {/* Search Input */}
                              <div className="relative mb-3">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Search by name, note, or values..."
                                  value={versionSearchQuery}
                                  onChange={(e) => setVersionSearchQuery(e.target.value)}
                                  className="h-8 pl-8 text-xs"
                                />
                                {versionSearchQuery && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                    onClick={() => setVersionSearchQuery('')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Tag Filter */}
                              {allVersions.some(v => v.tags && v.tags.length > 0) && !compareVersions[0] && (
                                <div className="flex items-center gap-2 mb-3">
                                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div className="flex flex-wrap gap-1">
                                    {PRESET_TAGS.map(tag => {
                                      const count = allVersions.filter(v => v.tags?.includes(tag.value)).length;
                                      if (count === 0) return null;
                                      return (
                                        <Button
                                          key={tag.value}
                                          variant={versionTagFilter === tag.value ? "secondary" : "ghost"}
                                          size="sm"
                                          className={cn(
                                            "h-6 text-[10px] px-2 gap-1",
                                            versionTagFilter === tag.value && tag.color
                                          )}
                                          onClick={() => setVersionTagFilter(
                                            versionTagFilter === tag.value ? null : tag.value
                                          )}
                                          disabled={batchSelectMode}
                                        >
                                          {tag.label}
                                          <span className="text-[9px] opacity-60">({count})</span>
                                        </Button>
                                      );
                                    })}
                                    {versionTagFilter && !batchSelectMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-1.5"
                                        onClick={() => setVersionTagFilter(null)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Filter & Batch Mode Bar */}
                              {allVersions.length > 1 && !compareVersions[0] && (
                                <div className="flex flex-col gap-2 mb-3 pb-3 border-b">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Filter by change:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {fieldOptions.map(({ value, label }) => (
                                        <Button
                                          key={value}
                                          variant={versionFieldFilter === value ? "secondary" : "ghost"}
                                          size="sm"
                                          className="h-6 text-[10px] px-2"
                                          onClick={() => setVersionFieldFilter(
                                            versionFieldFilter === value ? null : value
                                          )}
                                          disabled={batchSelectMode}
                                        >
                                          {label}
                                        </Button>
                                      ))}
                                    </div>
                                    {versionFieldFilter && !batchSelectMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-1.5"
                                        onClick={() => setVersionFieldFilter(null)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <div className="ml-auto">
                                      <Button
                                        variant={batchSelectMode ? "secondary" : "outline"}
                                        size="sm"
                                        className="h-6 text-[10px] px-2"
                                        onClick={() => {
                                          setBatchSelectMode(!batchSelectMode);
                                          setBatchSelectedVersions(new Set());
                                        }}
                                      >
                                        {batchSelectMode ? 'Cancel' : 'Select Multiple'}
                                      </Button>
                                    </div>
                                  </div>
                                  {batchSelectMode && (
                                    <div className="flex flex-col gap-2 text-xs">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-muted-foreground">
                                          {batchSelectedVersions.size} selected
                                        </span>
                                        {batchSelectedVersions.size > 0 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 text-[10px] px-1.5"
                                            onClick={() => setBatchSelectedVersions(new Set())}
                                          >
                                            Clear
                                          </Button>
                                        )}
                                        {filteredVersions.length > 0 && batchSelectedVersions.size < filteredVersions.length && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 text-[10px] px-1.5"
                                            onClick={() => setBatchSelectedVersions(new Set(filteredVersions.map(v => v.id)))}
                                          >
                                            Select All
                                          </Button>
                                        )}
                                        <div className="flex items-center gap-2 ml-auto text-[10px] text-muted-foreground/60">
                                          <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">⌘A</kbd>
                                            <span>select all</span>
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Del</kbd>
                                            <span>delete</span>
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Esc</kbd>
                                            <span>exit</span>
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Bulk Tag Actions */}
                                      {batchSelectedVersions.size > 0 && onBulkToggleVersionTag && versionHistorySlot && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                                          <Tag className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-muted-foreground text-[10px]">Bulk tags:</span>
                                          <div className="flex flex-wrap gap-1">
                                            {PRESET_TAGS.map(tag => {
                                              // Check how many selected versions have this tag
                                              const selectedVersionsArray = Array.from(batchSelectedVersions);
                                              const versionsWithTag = filteredVersions.filter(
                                                v => batchSelectedVersions.has(v.id) && v.tags?.includes(tag.value)
                                              ).length;
                                              const allHaveTag = versionsWithTag === batchSelectedVersions.size;
                                              const someHaveTag = versionsWithTag > 0 && !allHaveTag;
                                              
                                              return (
                                                <Popover key={tag.value}>
                                                  <PopoverTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className={cn(
                                                        "h-5 text-[9px] px-1.5 gap-1",
                                                        allHaveTag && tag.color,
                                                        someHaveTag && "border border-dashed"
                                                      )}
                                                    >
                                                      {tag.label}
                                                      {someHaveTag && <span className="opacity-60">({versionsWithTag})</span>}
                                                    </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-2" align="start">
                                                    <div className="flex flex-col gap-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs justify-start"
                                                        onClick={() => {
                                                          const count = onBulkToggleVersionTag(
                                                            versionHistorySlot,
                                                            selectedVersionsArray,
                                                            tag.value,
                                                            'add'
                                                          );
                                                          if (count > 0) {
                                                            toast.success(`Added "${tag.label}" to ${count} version${count !== 1 ? 's' : ''}`);
                                                          }
                                                        }}
                                                        disabled={allHaveTag}
                                                      >
                                                        <Check className="h-3 w-3 mr-1.5" />
                                                        Add to all selected
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs justify-start text-destructive hover:text-destructive"
                                                        onClick={() => {
                                                          const count = onBulkToggleVersionTag(
                                                            versionHistorySlot,
                                                            selectedVersionsArray,
                                                            tag.value,
                                                            'remove'
                                                          );
                                                          if (count > 0) {
                                                            toast.success(`Removed "${tag.label}" from ${count} version${count !== 1 ? 's' : ''}`);
                                                          }
                                                        }}
                                                        disabled={versionsWithTag === 0}
                                                      >
                                                        <X className="h-3 w-3 mr-1.5" />
                                                        Remove from all selected
                                                      </Button>
                                                    </div>
                                                  </PopoverContent>
                                                </Popover>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Filter Results Info */}
                              {(versionSearchQuery || versionFieldFilter || versionTagFilter) && filteredVersions.length !== allVersions.length && (
                                <p className="text-xs text-muted-foreground mb-2 text-center">
                                  Showing {filteredVersions.length} of {allVersions.length} versions
                                  {versionSearchQuery && ` matching "${versionSearchQuery}"`}
                                  {versionTagFilter && ` tagged "${PRESET_TAGS.find(t => t.value === versionTagFilter)?.label}"`}
                                  {versionFieldFilter && ` with ${fieldOptions.find(f => f.value === versionFieldFilter)?.label} changes`}
                                </p>
                              )}
                              
                              {filteredVersions.length === 0 && (versionSearchQuery || versionTagFilter) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No versions match your filters
                                </p>
                              )}
                              
                              {compareVersions[0] && !compareVersions[1] && (
                                <p className="text-xs text-muted-foreground mb-2 text-center">
                                  Select another version to compare
                                </p>
                              )}
                              
                              <div className="max-h-[250px] overflow-y-auto space-y-2">
                                {filteredVersions.map((version) => {
                                  const originalIndex = allVersions.findIndex(v => v.id === version.id);
                                  const isSelected = compareVersions[0] === version.id || compareVersions[1] === version.id;
                                  const isBatchSelected = batchSelectedVersions.has(version.id);
                                  return (
                                    <div
                                      key={version.id}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                        isSelected 
                                          ? "border-primary bg-primary/10" 
                                          : isBatchSelected
                                            ? "border-primary/50 bg-primary/5"
                                            : "border-border/50 hover:bg-muted/50"
                                      )}
                                      onClick={batchSelectMode ? () => {
                                        setBatchSelectedVersions(prev => {
                                          const next = new Set(prev);
                                          if (next.has(version.id)) {
                                            next.delete(version.id);
                                          } else {
                                            next.add(version.id);
                                          }
                                          return next;
                                        });
                                      } : undefined}
                                      style={batchSelectMode ? { cursor: 'pointer' } : undefined}
                                    >
                                      {batchSelectMode && (
                                        <div className={cn(
                                          "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                          isBatchSelected 
                                            ? "bg-primary border-primary" 
                                            : "border-muted-foreground/30"
                                        )}>
                                          {isBatchSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-medium">
                                            {version.data.label}
                                          </span>
                                          {version.pinned && (
                                            <Pin className="h-3 w-3 text-primary" />
                                          )}
                                          {originalIndex === 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                              Current
                                            </span>
                                          )}
                                          <PerformanceRankBadge version={version} allVersions={allVersions} />
                                        </div>
                                        {/* Tags display */}
                                        {version.tags && version.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {version.tags.map(tag => {
                                              const tagInfo = PRESET_TAGS.find(t => t.value === tag);
                                              if (!tagInfo) return null;
                                              return (
                                                <span 
                                                  key={tag} 
                                                  className={cn("text-[9px] px-1.5 py-0.5 rounded", tagInfo.color)}
                                                >
                                                  {tagInfo.label}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {format(new Date(version.savedAt), 'MMM d, yyyy · HH:mm')}
                                          <span className="text-muted-foreground/60"> · {formatDistanceToNow(new Date(version.savedAt), { addSuffix: true })}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          SMA: {version.data.fastSMA}/{version.data.slowSMA} · 
                                          Pos: {version.data.positionSizePercent}% · 
                                          SL: {version.data.stopLossPercent}% · 
                                          TP: {version.data.takeProfitPercent}%
                                        </p>
                                        {/* Version note display/edit */}
                                        {!batchSelectMode && (
                                          editingNoteVersionId === version.id ? (
                                            <div className="flex items-center gap-1 mt-1">
                                              <Input
                                                value={editingNoteText}
                                                onChange={(e) => setEditingNoteText(e.target.value)}
                                                placeholder="Add a note..."
                                                className="h-6 text-xs flex-1"
                                                maxLength={200}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    if (versionHistorySlot && onUpdateVersionNote) {
                                                      onUpdateVersionNote(versionHistorySlot, version.id, editingNoteText);
                                                    }
                                                    setEditingNoteVersionId(null);
                                                    setEditingNoteText('');
                                                  } else if (e.key === 'Escape') {
                                                    setEditingNoteVersionId(null);
                                                    setEditingNoteText('');
                                                  }
                                                }}
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                  if (versionHistorySlot && onUpdateVersionNote) {
                                                    onUpdateVersionNote(versionHistorySlot, version.id, editingNoteText);
                                                  }
                                                  setEditingNoteVersionId(null);
                                                  setEditingNoteText('');
                                                }}
                                              >
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                  setEditingNoteVersionId(null);
                                                  setEditingNoteText('');
                                                }}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : version.note ? (
                                            <p 
                                              className="text-xs text-muted-foreground/80 italic mt-1 cursor-pointer hover:text-foreground transition-colors"
                                              onClick={() => {
                                                if (onUpdateVersionNote) {
                                                  setEditingNoteVersionId(version.id);
                                                  setEditingNoteText(version.note || '');
                                                }
                                              }}
                                            >
                                              <MessageSquare className="h-3 w-3 inline mr-1" />
                                              {version.note}
                                            </p>
                                          ) : null
                                        )}
                                      </div>
                                      {!batchSelectMode && (
                                        <div className="flex items-center gap-1">
                                          {onUpdateVersionNote && !compareVersions[0] && !version.note && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 w-7 p-0"
                                                  onClick={() => {
                                                    setEditingNoteVersionId(version.id);
                                                    setEditingNoteText('');
                                                  }}
                                                >
                                                  <MessageSquare className="h-3 w-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Add note</TooltipContent>
                                            </Tooltip>
                                          )}
                                          <Button
                                            variant={isSelected ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                              if (isSelected) {
                                                // Deselect
                                                if (compareVersions[0] === version.id) {
                                                  setCompareVersions([compareVersions[1], null]);
                                                } else {
                                                  setCompareVersions([compareVersions[0], null]);
                                                }
                                              } else if (!compareVersions[0]) {
                                                setCompareVersions([version.id, null]);
                                              } else if (!compareVersions[1]) {
                                                setCompareVersions([compareVersions[0], version.id]);
                                              }
                                            }}
                                          >
                                            {isSelected ? <Check className="h-3 w-3" /> : <GitCompare className="h-3 w-3" />}
                                          </Button>
                                          {originalIndex > 0 && onRestorePresetVersion && !compareVersions[0] && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-7 text-xs"
                                                  onClick={(e) => {
                                                    if (e.shiftKey) {
                                                      // Quick restore - skip preview
                                                      if (versionHistorySlot && onRestorePresetVersion(versionHistorySlot, version.id)) {
                                                        toast.success('Version restored', {
                                                          description: `Restored to "${version.data.label}"`,
                                                        });
                                                        setVersionHistorySlot(null);
                                                      }
                                                    } else {
                                                      // Show preview
                                                      setRestorePreviewVersionId(version.id);
                                                    }
                                                  }}
                                                >
                                                  <RotateCcw className="h-3 w-3 mr-1" />
                                                  Restore
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Click to preview changes</p>
                                                <p className="text-[10px] text-muted-foreground">Shift+click to restore instantly</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                          {onDuplicateVersion && !compareVersions[0] && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 w-7 p-0"
                                                  onClick={() => {
                                                    if (versionHistorySlot) {
                                                      const duplicate = onDuplicateVersion(versionHistorySlot, version.id);
                                                      if (duplicate) {
                                                        toast.success('Version duplicated', {
                                                          description: `Created "${duplicate.data.label}"`,
                                                        });
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Duplicate version</TooltipContent>
                                            </Tooltip>
                                          )}
                                          {onToggleVersionPin && !compareVersions[0] && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant={version.pinned ? "secondary" : "ghost"}
                                                  size="sm"
                                                  className="h-7 w-7 p-0"
                                                  onClick={() => {
                                                    if (versionHistorySlot) {
                                                      const isPinned = onToggleVersionPin(versionHistorySlot, version.id);
                                                      toast.success(isPinned ? 'Version pinned' : 'Version unpinned', {
                                                        description: isPinned 
                                                          ? 'This version will be protected from auto-deletion' 
                                                          : 'This version can now be auto-deleted',
                                                      });
                                                    }
                                                  }}
                                                >
                                                  <Pin className={cn("h-3 w-3", version.pinned && "text-primary")} />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>{version.pinned ? 'Unpin version' : 'Pin version'}</TooltipContent>
                                            </Tooltip>
                                          )}
                                          {onToggleVersionTag && !compareVersions[0] && (
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant={(version.tags?.length ?? 0) > 0 ? "secondary" : "ghost"}
                                                  size="sm"
                                                  className="h-7 w-7 p-0"
                                                >
                                                  <Tag className={cn("h-3 w-3", (version.tags?.length ?? 0) > 0 && "text-primary")} />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-48 p-2" align="end">
                                                <p className="text-xs font-medium mb-2">Add tags</p>
                                                <div className="space-y-1">
                                                  {PRESET_TAGS.map(tag => {
                                                    const isActive = version.tags?.includes(tag.value);
                                                    return (
                                                      <button
                                                        key={tag.value}
                                                        className={cn(
                                                          "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors",
                                                          isActive ? tag.color : "hover:bg-muted"
                                                        )}
                                                        onClick={() => {
                                                          if (versionHistorySlot) {
                                                            onToggleVersionTag(versionHistorySlot, version.id, tag.value);
                                                          }
                                                        }}
                                                      >
                                                        {isActive && <Check className="h-3 w-3" />}
                                                        <span className={!isActive ? "ml-5" : ""}>{tag.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Version Diff View */}
                {compareVersions[0] && compareVersions[1] && versionHistorySlot && getPresetVersionHistory && (() => {
                  const versions = getPresetVersionHistory(versionHistorySlot);
                  const version1 = versions.find(v => v.id === compareVersions[0]);
                  const version2 = versions.find(v => v.id === compareVersions[1]);
                  
                  if (!version1 || !version2) return null;
                  
                  const diffFields = [
                    { key: 'label', label: 'Name', format: (v: string | number) => v },
                    { key: 'fastSMA', label: 'Fast SMA', format: (v: string | number) => v },
                    { key: 'slowSMA', label: 'Slow SMA', format: (v: string | number) => v },
                    { key: 'positionSizePercent', label: 'Position Size', format: (v: string | number) => `${v}%` },
                    { key: 'stopLossPercent', label: 'Stop Loss', format: (v: string | number) => `${v}%` },
                    { key: 'takeProfitPercent', label: 'Take Profit', format: (v: string | number) => `${v}%` },
                  ] as const;
                  
                  const changedFields = diffFields.filter(
                    field => version1.data[field.key] !== version2.data[field.key]
                  );
                  const unchangedFields = diffFields.filter(
                    field => version1.data[field.key] === version2.data[field.key]
                  );
                  
                  return (
                    <div className="border-t pt-4 mt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <GitCompare className="h-4 w-4" />
                          Comparison
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setCompareVersions([null, null])}
                        >
                          Clear
                        </Button>
                      </div>
                      
                      {/* Version headers */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="font-medium text-muted-foreground">Parameter</div>
                        <div className="font-medium text-center px-2 py-1 bg-red-500/10 rounded text-red-600 dark:text-red-400 truncate">
                          {version1.data.label}
                        </div>
                        <div className="font-medium text-center px-2 py-1 bg-green-500/10 rounded text-green-600 dark:text-green-400 truncate">
                          {version2.data.label}
                        </div>
                      </div>
                      
                      {/* Changed fields */}
                      {changedFields.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Changed ({changedFields.length})</p>
                          {changedFields.map(field => {
                            const val1 = version1.data[field.key];
                            const val2 = version2.data[field.key];
                            const isNumeric = typeof val1 === 'number' && typeof val2 === 'number';
                            const diff = isNumeric ? val2 - val1 : null;
                            
                            return (
                              <div key={field.key} className="grid grid-cols-3 gap-2 text-xs items-center">
                                <div className="text-muted-foreground">{field.label}</div>
                                <div className="text-center px-2 py-1.5 bg-red-500/5 border border-red-500/20 rounded font-mono">
                                  {field.format(val1)}
                                </div>
                                <div className="text-center px-2 py-1.5 bg-green-500/5 border border-green-500/20 rounded font-mono flex items-center justify-center gap-1">
                                  {field.format(val2)}
                                  {diff !== null && diff !== 0 && (
                                    <span className={cn(
                                      "text-[10px]",
                                      diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                      ({diff > 0 ? '+' : ''}{diff})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Unchanged fields (collapsible) */}
                      {unchangedFields.length > 0 && (
                        <details className="text-xs">
                          <summary className="text-[10px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground">
                            Unchanged ({unchangedFields.length})
                          </summary>
                          <div className="mt-1 space-y-1">
                            {unchangedFields.map(field => (
                              <div key={field.key} className="grid grid-cols-3 gap-2 items-center opacity-60">
                                <div className="text-muted-foreground">{field.label}</div>
                                <div className="text-center px-2 py-1 bg-muted/30 rounded font-mono col-span-2">
                                  {field.format(version1.data[field.key])}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                      
                      {/* Date comparison */}
                      <div className="pt-2 border-t text-[10px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>{format(new Date(version1.savedAt), 'MMM d, yyyy HH:mm')}</span>
                          <span>→</span>
                          <span>{format(new Date(version2.savedAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {batchSelectMode && batchSelectedVersions.size >= 2 && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => {
                        const ids = Array.from(batchSelectedVersions);
                        setCompareVersions([ids[0], ids[1]]);
                        setBatchSelectMode(false);
                        setBatchSelectedVersions(new Set());
                      }}
                    >
                      <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                      Compare First 2
                    </Button>
                  )}
                  {batchSelectMode && batchSelectedVersions.size === 1 && onRestorePresetVersion && versionHistorySlot && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => {
                        const versionId = Array.from(batchSelectedVersions)[0];
                        if (onRestorePresetVersion(versionHistorySlot, versionId)) {
                          toast.success('Version restored');
                          setVersionHistorySlot(null);
                          setBatchSelectMode(false);
                          setBatchSelectedVersions(new Set());
                        }
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Restore Selected
                    </Button>
                  )}
                  {batchSelectMode && batchSelectedVersions.size > 0 && getPresetVersionHistory && versionHistorySlot && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const versions = getPresetVersionHistory(versionHistorySlot);
                        const selectedVersions = versions.filter(v => batchSelectedVersions.has(v.id));
                        
                        if (selectedVersions.length === 0) return;
                        
                        const exportData = {
                          exportedAt: new Date().toISOString(),
                          slot: versionHistorySlot,
                          count: selectedVersions.length,
                          versions: selectedVersions,
                        };
                        
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `preset-${versionHistorySlot}-versions-${format(new Date(), 'yyyy-MM-dd')}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast.success(`Exported ${selectedVersions.length} version${selectedVersions.length !== 1 ? 's' : ''}`);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export ({batchSelectedVersions.size})
                    </Button>
                  )}
                  {batchSelectMode && batchSelectedVersions.size > 0 && onDeleteVersions && versionHistorySlot && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setDeleteVersionsConfirmOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete ({batchSelectedVersions.size})
                    </Button>
                  )}
                  
                  {/* Delete Confirmation Dialog */}
                  <AlertDialog open={deleteVersionsConfirmOpen} onOpenChange={setDeleteVersionsConfirmOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {batchSelectedVersions.size} version{batchSelectedVersions.size !== 1 ? 's' : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The selected version{batchSelectedVersions.size !== 1 ? 's' : ''} will be permanently removed from the history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            if (onDeleteVersions && versionHistorySlot) {
                              const ids = Array.from(batchSelectedVersions);
                              const deleted = onDeleteVersions(versionHistorySlot, ids);
                              if (deleted > 0) {
                                toast.success(`Deleted ${deleted} version${deleted !== 1 ? 's' : ''}`, {
                                  action: onUndoDeleteVersions ? {
                                    label: 'Undo',
                                    onClick: () => {
                                      if (onUndoDeleteVersions()) {
                                        toast.success('Versions restored');
                                      }
                                    },
                                  } : undefined,
                                  duration: 10000,
                                  onDismiss: () => onClearDeleteBackup?.(),
                                  onAutoClose: () => onClearDeleteBackup?.(),
                                });
                                setBatchSelectedVersions(new Set());
                              }
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {/* Clear All History Confirmation Dialog */}
                  <AlertDialog open={clearAllHistoryConfirmOpen} onOpenChange={setClearAllHistoryConfirmOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all version history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all saved versions across all preset slots. This action cannot be undone and will free up localStorage space.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            if (onClearAllVersionHistory) {
                              const totalBefore = getTotalVersionCount?.() ?? 0;
                              onClearAllVersionHistory();
                              toast.success('All version history cleared', {
                                description: `Deleted ${totalBefore} version${totalBefore !== 1 ? 's' : ''} across all presets`,
                              });
                            }
                          }}
                        >
                          Clear All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {compareVersions[0] && !compareVersions[1] && (
                    <Button variant="ghost" size="sm" onClick={() => setCompareVersions([null, null])}>
                      Cancel Compare
                    </Button>
                  )}
                  {!batchSelectMode && !compareVersions[0] && onImportVersionHistory && versionHistorySlot && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json,application/json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          
                          if (file.size > 100 * 1024) {
                            toast.error('File too large', { description: 'Version files should be under 100KB' });
                            return;
                          }
                          
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const json = event.target?.result as string;
                              const data = JSON.parse(json);
                              
                              // Validate structure
                              if (!data.versions || !Array.isArray(data.versions)) {
                                toast.error('Invalid file format', { description: 'File does not contain valid versions' });
                                return;
                              }
                              
                              // Import with merge mode
                              const result = onImportVersionHistory(versionHistorySlot, data.versions, 'merge');
                              
                              if (result.success && result.imported > 0) {
                                toast.success(`Imported ${result.imported} version${result.imported !== 1 ? 's' : ''}`, {
                                  description: 'Versions merged into history',
                                });
                              } else if (result.success && result.imported === 0) {
                                toast.info('No new versions to import', {
                                  description: 'All versions already exist in history',
                                });
                              } else {
                                toast.error('Import failed', { description: 'Could not import versions' });
                              }
                            } catch {
                              toast.error('Invalid JSON', { description: 'Could not parse the file' });
                            }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Import
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    setVersionHistorySlot(null);
                    setCompareVersions([null, null]);
                    setBatchSelectMode(false);
                    setBatchSelectedVersions(new Set());
                  }}>
                    Close
                  </Button>
                </DialogFooter>
                
                {/* Restore Preview Dialog */}
                <AlertDialog open={restorePreviewVersionId !== null} onOpenChange={(open) => !open && setRestorePreviewVersionId(null)}>
                  <AlertDialogContent className="max-w-md">
                    {(() => {
                      if (!restorePreviewVersionId || !versionHistorySlot || !getPresetVersionHistory) return null;
                      
                      const versions = getPresetVersionHistory(versionHistorySlot);
                      const targetVersion = versions.find(v => v.id === restorePreviewVersionId);
                      const currentVersion = versions[0]; // Current is always first
                      
                      if (!targetVersion || !currentVersion) return null;
                      
                      const diffFields = [
                        { key: 'label', label: 'Name', format: (v: string | number) => v },
                        { key: 'fastSMA', label: 'Fast SMA', format: (v: string | number) => v },
                        { key: 'slowSMA', label: 'Slow SMA', format: (v: string | number) => v },
                        { key: 'positionSizePercent', label: 'Position Size', format: (v: string | number) => `${v}%` },
                        { key: 'stopLossPercent', label: 'Stop Loss', format: (v: string | number) => `${v}%` },
                        { key: 'takeProfitPercent', label: 'Take Profit', format: (v: string | number) => `${v}%` },
                      ] as const;
                      
                      const changedFields = diffFields.filter(
                        field => currentVersion.data[field.key] !== targetVersion.data[field.key]
                      );
                      
                      return (
                        <>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <RotateCcw className="h-4 w-4" />
                              Restore Version
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Restore to "{targetVersion.data.label}" from {format(new Date(targetVersion.savedAt), 'MMM d, yyyy HH:mm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <div className="py-4 space-y-3">
                            {changedFields.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No changes — this version has the same parameters as current.
                              </p>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  {changedFields.length} parameter{changedFields.length !== 1 ? 's' : ''} will change:
                                </p>
                                <div className="space-y-2">
                                  {changedFields.map(field => {
                                    const currentVal = currentVersion.data[field.key];
                                    const targetVal = targetVersion.data[field.key];
                                    const isNumeric = typeof currentVal === 'number' && typeof targetVal === 'number';
                                    const diff = isNumeric ? targetVal - currentVal : null;
                                    
                                    return (
                                      <div key={field.key} className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground w-24 shrink-0">{field.label}</span>
                                        <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded font-mono text-xs line-through">
                                          {field.format(currentVal)}
                                        </span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-mono text-xs">
                                          {field.format(targetVal)}
                                          {diff !== null && diff !== 0 && (
                                            <span className="ml-1 opacity-70">
                                              ({diff > 0 ? '+' : ''}{diff})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                          
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (onRestorePresetVersion && onRestorePresetVersion(versionHistorySlot, restorePreviewVersionId)) {
                                  toast.success('Version restored', {
                                    description: `Restored to "${targetVersion.data.label}"`,
                                  });
                                  setRestorePreviewVersionId(null);
                                  setVersionHistorySlot(null);
                                }
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                              Restore
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </>
                      );
                    })()}
                  </AlertDialogContent>
                </AlertDialog>
              </DialogContent>
            </Dialog>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <TooltipLabel 
                  label="Initial Balance ($)" 
                  tooltip="Starting capital for the backtest. Use realistic amounts matching your planned investment ($100 - $100M)."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.initialBalance}
                />
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => onInitialBalanceChange(parseInt(e.target.value) || 10000)}
                  min={100}
                  className={cn(fieldErrors.initialBalance && "border-destructive")}
                />
                <FieldError message={fieldErrors.initialBalance} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Position Size (%)" 
                  tooltip="Percentage of balance to risk per trade. Conservative: 1-5%, Moderate: 5-15%, Aggressive: 15%+."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.positionSize}
                />
                <Input
                  type="number"
                  value={positionSizePercent}
                  onChange={(e) => onPositionSizeChange(parseInt(e.target.value) || 5)}
                  min={1}
                  max={100}
                  className={cn(fieldErrors.positionSize && "border-destructive")}
                />
                <FieldError message={fieldErrors.positionSize} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Stop Loss (%)" 
                  tooltip="Maximum loss before auto-closing a trade (0.1-50%). Tighter stops reduce losses but may exit good trades early."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.stopLoss}
                />
                <Input
                  type="number"
                  value={stopLossPercent}
                  onChange={(e) => onStopLossChange(parseFloat(e.target.value) || 2)}
                  min={0.1}
                  max={50}
                  step={0.1}
                  className={cn(fieldErrors.stopLoss && "border-destructive")}
                />
                <FieldError message={fieldErrors.stopLoss} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Take Profit (%)" 
                  tooltip="Target profit before auto-closing a trade (0.1-100%). Higher targets may miss profits but capture larger moves."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.takeProfit}
                />
                <Input
                  type="number"
                  value={takeProfitPercent}
                  onChange={(e) => onTakeProfitChange(parseFloat(e.target.value) || 4)}
                  min={0.1}
                  max={100}
                  step={0.1}
                  className={cn(fieldErrors.takeProfit && "border-destructive")}
                />
                <FieldError message={fieldErrors.takeProfit} />
              </div>
              <div className="space-y-1">
                <TooltipLabel 
                  label="Trading Fee (%)" 
                  tooltip="Exchange fee per trade (0-5%). Typical exchanges: 0.1% (Binance), 0.5% (Coinbase). Affects profitability significantly."
                  className="text-xs text-muted-foreground"
                  error={!!fieldErrors.fee}
                />
                <Input
                  type="number"
                  value={feePercent}
                  onChange={(e) => onFeeChange(parseFloat(e.target.value) || 0.1)}
                  min={0}
                  max={5}
                  step={0.01}
                  className={cn(fieldErrors.fee && "border-destructive")}
                />
                <FieldError message={fieldErrors.fee} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Button
              onClick={onRunBacktest}
              disabled={isRunning || hasErrors}
              className="flex-1"
            >
              {isRunning ? (
                <>Running...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
            {result && (
              <Button variant="outline" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {result && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onSaveRun}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save for Comparison
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Saved Runs */}
        {savedRuns.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Saved Runs ({savedRuns.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={onClearAllRuns}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={onToggleComparison}
                className="flex-1"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                {showComparison ? 'Hide Comparison' : 'Compare Runs'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportComparison}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Fetching historical data... {progress.toFixed(0)}%
            </p>
          </div>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
