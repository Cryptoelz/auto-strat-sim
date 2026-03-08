import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RISK_PRESETS, RiskPreset } from '@/hooks/useBacktestConfig';
import { BacktestResult } from '@/types/backtest';

export const BACKTEST_SHORTCUTS = [
  { key: 'Enter', description: 'Run backtest' },
  { key: 'R', description: 'Reset results' },
  { key: '⌘/Ctrl+S', description: 'Save run for comparison' },
  { key: '⌘/Ctrl+E', description: 'Export results to CSV' },
  { key: '⌘/Ctrl+H', description: 'Open version history' },
  { key: 'C', description: 'Toggle comparison view' },
  { key: 'D', description: 'Delete all saved runs' },
  { key: '1', description: 'Apply Conservative preset' },
  { key: '2', description: 'Apply Moderate preset' },
  { key: '3', description: 'Apply Aggressive preset' },
  { key: '4-6', description: 'Load custom preset' },
  { key: 'Shift+4-6', description: 'Save to custom preset' },
  { key: 'Alt+4-6', description: 'Delete custom preset' },
  { key: 'Alt+0', description: 'Clear all custom presets' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Cancel auto-save / close dialogs' },
];

interface UseBacktestShortcutsParams {
  config: {
    applyPreset: (preset: RiskPreset) => void;
    hasPendingSave: (slot: '4' | '5' | '6') => boolean;
    cancelPendingSave: (slot: '4' | '5' | '6') => void;
    showComparison: boolean;
    toggleComparison: () => void;
    saveCurrentRun: (result: BacktestResult) => void;
    exportCSV: (result: BacktestResult) => void;
    hasCustomPreset: (slot: '4' | '5' | '6') => boolean;
    loadCustomPreset: (slot: '4' | '5' | '6') => boolean;
    saveCustomPreset: (slot: '4' | '5' | '6') => void;
    deleteCustomPreset: (slot: '4' | '5' | '6') => void;
    getCustomPreset: (slot: '4' | '5' | '6') => {
      label: string;
      positionSizePercent: number;
      stopLossPercent: number;
      takeProfitPercent: number;
      fastSMA: number;
      slowSMA: number;
    } | null;
    clearAllCustomPresets: () => void;
    savedRuns: unknown[];
  };
  isRunning: boolean;
  result: BacktestResult | null;
  reset: () => void;
  onRunBacktest: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  setClearPresetsConfirmOpen: (open: boolean) => void;
}

export function useBacktestShortcuts({
  config,
  isRunning,
  result,
  reset,
  onRunBacktest,
  setShortcutsOpen,
  setVersionHistoryOpen,
  setDeleteConfirmOpen,
  setClearPresetsConfirmOpen,
}: UseBacktestShortcutsParams) {
  const handlePresetShortcut = useCallback((preset: RiskPreset) => {
    const presetConfig = RISK_PRESETS[preset];
    config.applyPreset(preset);
    toast.success(`${presetConfig.label} preset applied`, {
      description: `Position: ${presetConfig.positionSizePercent}% · SL: ${presetConfig.stopLossPercent}% · TP: ${presetConfig.takeProfitPercent}% · SMA: ${presetConfig.fastSMA}/${presetConfig.slowSMA}`,
    });
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        let cancelledAny = false;
        (['4', '5', '6'] as const).forEach(slot => {
          if (config.hasPendingSave(slot)) {
            config.cancelPendingSave(slot);
            cancelledAny = true;
          }
        });
        if (cancelledAny) toast.info('Auto-save cancelled');
        setShortcutsOpen(false);
        setVersionHistoryOpen(false);
        if (config.showComparison) config.toggleComparison();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (result) {
          config.saveCurrentRun(result);
          toast.success('Run saved for comparison');
        } else {
          toast.error('No result to save', { description: 'Run a backtest first before saving' });
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (result) {
          config.exportCSV(result);
          toast.success('Results exported to CSV');
        } else {
          toast.error('No result to export', { description: 'Run a backtest first before exporting' });
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        const hasAnyPreset = config.hasCustomPreset('4') || config.hasCustomPreset('5') || config.hasCustomPreset('6');
        if (hasAnyPreset) {
          setVersionHistoryOpen(true);
        } else {
          toast.error('No custom presets', { description: 'Save a custom preset first to view version history' });
        }
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!isRunning) onRunBacktest();
          break;
        case '1':
          e.preventDefault();
          handlePresetShortcut('conservative');
          break;
        case '2':
          e.preventDefault();
          handlePresetShortcut('moderate');
          break;
        case '3':
          e.preventDefault();
          handlePresetShortcut('aggressive');
          break;
        case '4':
        case '5':
        case '6': {
          e.preventDefault();
          const slotKey = e.key as '4' | '5' | '6';
          if (e.altKey) {
            if (config.hasCustomPreset(slotKey)) {
              config.deleteCustomPreset(slotKey);
              toast.success(`Custom Preset ${slotKey} deleted`);
            } else {
              toast.error(`Custom Preset ${slotKey} is empty`);
            }
          } else if (e.shiftKey) {
            config.saveCustomPreset(slotKey);
            const preset = config.getCustomPreset(slotKey);
            toast.success(`Saved to Custom Preset ${slotKey}`, {
              description: preset ? `Position: ${preset.positionSizePercent}% · SL: ${preset.stopLossPercent}% · TP: ${preset.takeProfitPercent}% · SMA: ${preset.fastSMA}/${preset.slowSMA}` : undefined,
            });
          } else {
            if (config.loadCustomPreset(slotKey)) {
              const preset = config.getCustomPreset(slotKey);
              toast.success(`Custom Preset ${slotKey} loaded`, {
                description: preset ? `Position: ${preset.positionSizePercent}% · SL: ${preset.stopLossPercent}% · TP: ${preset.takeProfitPercent}% · SMA: ${preset.fastSMA}/${preset.slowSMA}` : undefined,
              });
            } else {
              toast.error(`Custom Preset ${slotKey} is empty`, { description: `Press Shift+${slotKey} to save current settings` });
            }
          }
          break;
        }
        case '0':
          if (e.altKey) {
            e.preventDefault();
            const hasAnyPreset = config.hasCustomPreset('4') || config.hasCustomPreset('5') || config.hasCustomPreset('6');
            if (hasAnyPreset) setClearPresetsConfirmOpen(true);
            else toast.error('No custom presets to clear');
          }
          break;
        case '?':
          e.preventDefault();
          setShortcutsOpen(true);
          break;
        case 'r':
          e.preventDefault();
          if (result) { reset(); toast.success('Results cleared'); }
          break;
        case 'c':
          e.preventDefault();
          if (config.savedRuns.length > 0) {
            config.toggleComparison();
            toast.success(config.showComparison ? 'Showing results' : 'Showing comparison');
          } else {
            toast.error('No saved runs', { description: 'Save some runs first to compare' });
          }
          break;
        case 'd':
          e.preventDefault();
          if (config.savedRuns.length > 0) setDeleteConfirmOpen(true);
          else toast.error('No saved runs to delete');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePresetShortcut, isRunning, onRunBacktest, result, config, reset, setShortcutsOpen, setVersionHistoryOpen, setDeleteConfirmOpen, setClearPresetsConfirmOpen]);
}
