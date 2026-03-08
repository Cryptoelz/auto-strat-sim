import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { History, Trash2, Undo2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PresetVersion, PresetTagValue, PresetVersionHistory } from '@/types/preset-version';

export interface VersionHistoryPanelProps {
  // Version history
  getPresetVersionHistory: (slot: '4' | '5' | '6') => PresetVersion[];
  onRestorePresetVersion: (slot: '4' | '5' | '6', versionId: string) => boolean;
  hasPresetHistory: (slot: '4' | '5' | '6') => boolean;
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

  // External dialog control
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

export function VersionHistoryPanel({
  getPresetVersionHistory,
  hasPresetHistory,
  autoSaveVersions,
  onAutoSaveVersionsChange,
  debounceDelay,
  onDebounceDelayChange,
  getTotalVersionCount,
  onClearAllVersionHistory,
  autoCleanupEnabled,
  onAutoCleanupEnabledChange,
  cleanupThreshold,
  onCleanupThresholdChange,
  onManualCleanup,
  onUndoManualCleanup,
  canUndoCleanup,
  lastCleanupCount,
  onSmartCleanup,
  versionsWithPerformanceCount,
  versionHistoryOpen,
  onVersionHistoryOpenChange,
}: VersionHistoryPanelProps) {
  const totalVersions = getTotalVersionCount?.() ?? 0;
  const hasAnyHistory = hasPresetHistory('4') || hasPresetHistory('5') || hasPresetHistory('6');

  const handleManualCleanup = () => {
    if (onManualCleanup) {
      const removed = onManualCleanup();
      if (removed > 0) {
        toast.success(`Cleaned up ${removed} old versions`, {
          action: canUndoCleanup
            ? { label: 'Undo', onClick: () => onUndoManualCleanup?.() && toast.success('Cleanup undone') }
            : undefined,
        });
      } else {
        toast.info('Nothing to clean up');
      }
    }
  };

  const handleSmartCleanup = () => {
    if (onSmartCleanup) {
      const removed = onSmartCleanup();
      if (removed > 0) {
        toast.success(`Smart cleanup removed ${removed} low-value versions`);
      } else {
        toast.info('No versions to clean up');
      }
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
          {hasAnyHistory && (
            <Badge variant="secondary" className="text-[10px]">
              {totalVersions} version{totalVersions !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Auto-save toggle */}
        {onAutoSaveVersionsChange && (
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save" className="text-xs">Auto-save versions</Label>
            <Switch
              id="auto-save"
              checked={autoSaveVersions}
              onCheckedChange={onAutoSaveVersionsChange}
            />
          </div>
        )}

        {/* Debounce delay */}
        {onDebounceDelayChange && autoSaveVersions && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Save delay</Label>
              <span className="text-xs text-muted-foreground">{debounceDelay}ms</span>
            </div>
            <Slider
              value={[debounceDelay ?? 2000]}
              onValueChange={([v]) => onDebounceDelayChange(v)}
              min={500}
              max={10000}
              step={500}
              className="w-full"
            />
          </div>
        )}

        {/* Auto-cleanup */}
        {onAutoCleanupEnabledChange && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-cleanup" className="text-xs">Auto-cleanup</Label>
              <Switch
                id="auto-cleanup"
                checked={autoCleanupEnabled}
                onCheckedChange={onAutoCleanupEnabledChange}
              />
            </div>
            {autoCleanupEnabled && onCleanupThresholdChange && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Keep per slot</Label>
                  <span className="text-xs text-muted-foreground">{cleanupThreshold}</span>
                </div>
                <Slider
                  value={[cleanupThreshold ?? 50]}
                  onValueChange={([v]) => onCleanupThresholdChange(v)}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          {hasAnyHistory && onVersionHistoryOpenChange && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onVersionHistoryOpenChange(true)}
            >
              <History className="mr-1 h-3 w-3" />
              Browse
            </Button>
          )}
          {onManualCleanup && hasAnyHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleManualCleanup}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Cleanup
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove oldest versions beyond threshold</TooltipContent>
            </Tooltip>
          )}
          {onSmartCleanup && hasAnyHistory && (versionsWithPerformanceCount ?? 0) > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleSmartCleanup}>
                  <Sparkles className="mr-1 h-3 w-3" />
                  Smart
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove low-performing versions</TooltipContent>
            </Tooltip>
          )}
          {canUndoCleanup && onUndoManualCleanup && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    if (onUndoManualCleanup()) toast.success('Cleanup undone');
                  }}
                >
                  <Undo2 className="mr-1 h-3 w-3" />
                  Undo
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo last cleanup</TooltipContent>
            </Tooltip>
          )}
        </div>

        {onClearAllVersionHistory && hasAnyHistory && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 text-destructive hover:text-destructive"
            onClick={() => {
              onClearAllVersionHistory();
              toast.success('All version history cleared');
            }}
          >
            Clear all history
          </Button>
        )}

        {lastCleanupCount != null && lastCleanupCount > 0 && (
          <p className="text-[10px] text-muted-foreground text-center">
            Last cleanup removed {lastCleanupCount} versions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
