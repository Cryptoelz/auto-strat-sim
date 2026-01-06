import { useEffect, useCallback } from 'react';
import { Asset } from '@/types/trading';

interface KeyboardShortcutsOptions {
  enabled: boolean;
  selectedAsset: Asset | null;
  onBuy: (asset: Asset) => void;
  onSell: (asset: Asset) => void;
  onToggleMode: () => void;
  onToggleRunning: () => void;
  onRefresh: () => void;
}

export function useKeyboardShortcuts({
  enabled,
  selectedAsset,
  onBuy,
  onSell,
  onToggleMode,
  onToggleRunning,
  onRefresh,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'b':
          if (selectedAsset) {
            event.preventDefault();
            onBuy(selectedAsset);
          }
          break;
        case 's':
          if (selectedAsset) {
            event.preventDefault();
            onSell(selectedAsset);
          }
          break;
        case 'm':
          event.preventDefault();
          onToggleMode();
          break;
        case ' ':
          event.preventDefault();
          onToggleRunning();
          break;
        case 'r':
          event.preventDefault();
          onRefresh();
          break;
      }
    },
    [enabled, selectedAsset, onBuy, onSell, onToggleMode, onToggleRunning, onRefresh]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: 'B', description: 'Buy selected asset' },
  { key: 'S', description: 'Sell selected asset' },
  { key: 'M', description: 'Toggle auto/manual mode' },
  { key: 'Space', description: 'Start/pause simulation' },
  { key: 'R', description: 'Refresh data' },
];
