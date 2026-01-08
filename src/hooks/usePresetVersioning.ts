import { useState, useCallback, useEffect } from 'react';
import { PresetVersion, PresetVersionHistory, MAX_VERSIONS_PER_SLOT } from '@/types/preset-version';

const STORAGE_KEY = 'backtest-preset-versions';

/**
 * Hook to manage preset version history
 * Tracks changes to custom presets and allows restoring previous versions
 */
export function usePresetVersioning() {
  const [versionHistory, setVersionHistory] = useState<PresetVersionHistory>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { '4': [], '5': [], '6': [] };
    } catch {
      return { '4': [], '5': [], '6': [] };
    }
  });

  // Persist to localStorage when history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versionHistory));
  }, [versionHistory]);

  /**
   * Add a new version to a slot's history
   */
  const addVersion = useCallback((
    slot: '4' | '5' | '6',
    data: PresetVersion['data']
  ) => {
    const version: PresetVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      savedAt: Date.now(),
      data,
    };

    setVersionHistory(prev => {
      const slotHistory = [version, ...prev[slot]].slice(0, MAX_VERSIONS_PER_SLOT);
      return { ...prev, [slot]: slotHistory };
    });

    return version;
  }, []);

  /**
   * Get version history for a specific slot
   */
  const getSlotHistory = useCallback((slot: '4' | '5' | '6'): PresetVersion[] => {
    return versionHistory[slot];
  }, [versionHistory]);

  /**
   * Get a specific version by ID
   */
  const getVersion = useCallback((slot: '4' | '5' | '6', versionId: string): PresetVersion | null => {
    return versionHistory[slot].find(v => v.id === versionId) || null;
  }, [versionHistory]);

  /**
   * Clear version history for a slot
   */
  const clearSlotHistory = useCallback((slot: '4' | '5' | '6') => {
    setVersionHistory(prev => ({ ...prev, [slot]: [] }));
  }, []);

  /**
   * Clear all version history
   */
  const clearAllHistory = useCallback(() => {
    setVersionHistory({ '4': [], '5': [], '6': [] });
  }, []);

  /**
   * Check if a slot has version history
   */
  const hasHistory = useCallback((slot: '4' | '5' | '6'): boolean => {
    return versionHistory[slot].length > 0;
  }, [versionHistory]);

  /**
   * Get total version count across all slots
   */
  const getTotalVersionCount = useCallback((): number => {
    return versionHistory['4'].length + versionHistory['5'].length + versionHistory['6'].length;
  }, [versionHistory]);

  return {
    versionHistory,
    addVersion,
    getSlotHistory,
    getVersion,
    clearSlotHistory,
    clearAllHistory,
    hasHistory,
    getTotalVersionCount,
  };
}
