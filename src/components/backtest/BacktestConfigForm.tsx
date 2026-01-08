import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
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
import { Asset } from '@/types/trading';
import { BacktestResult, SavedRun } from '@/types/backtest';
import { PresetVersion, PRESET_TAGS, PresetTagValue } from '@/types/preset-version';
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
  Tag
} from 'lucide-react';

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
  
  // External version history dialog control
  versionHistoryOpen?: boolean;
  onVersionHistoryOpenChange?: (open: boolean) => void;
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
  versionHistoryOpen: externalVersionHistoryOpen,
  onVersionHistoryOpenChange,
}: BacktestConfigFormProps) {
  const [copied, setCopied] = useState(false);
  const [clearPresetsConfirmOpen, setClearPresetsConfirmOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
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
                  return (
                    <div key={slot} className="relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={hasData ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                            "h-7 min-w-7 px-1 text-xs font-mono",
                            hasData && "ring-1 ring-primary/50 pr-14"
                          )}
                            onClick={() => {
                              if (hasData && onLoadCustomPreset) {
                                if (onLoadCustomPreset(slot)) {
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
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {hasData && presetData ? (
                            <div className="text-xs">
                              <p className="font-medium mb-1">{presetData.label}</p>
                              <p>SMA: {presetData.fastSMA}/{presetData.slowSMA}</p>
                              <p>Position: {presetData.positionSizePercent}%</p>
                              <p>SL: {presetData.stopLossPercent}% · TP: {presetData.takeProfitPercent}%</p>
                              <p className="text-muted-foreground mt-1">Click to load · Shift+{slot} to overwrite</p>
                            </div>
                          ) : (
                            <p className="text-xs">Empty slot · Click or press {slot} to save current config</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      {hasData && hasPresetHistory?.(slot) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-5 rounded-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVersionHistorySlot(slot);
                              }}
                            >
                              <History className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">View version history</p>
                          </TooltipContent>
                        </Tooltip>
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
              <DialogContent className="sm:max-w-2xl">
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
                                        <div className="flex items-center gap-2">
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
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs"
                                              onClick={() => {
                                                if (versionHistorySlot && onRestorePresetVersion(versionHistorySlot, version.id)) {
                                                  toast.success('Version restored', {
                                                    description: `Restored to "${version.data.label}" from ${format(new Date(version.savedAt), 'MMM d, HH:mm')}`,
                                                  });
                                                  setVersionHistorySlot(null);
                                                }
                                              }}
                                            >
                                              <RotateCcw className="h-3 w-3 mr-1" />
                                              Restore
                                            </Button>
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
                  {compareVersions[0] && !compareVersions[1] && (
                    <Button variant="ghost" size="sm" onClick={() => setCompareVersions([null, null])}>
                      Cancel Compare
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
