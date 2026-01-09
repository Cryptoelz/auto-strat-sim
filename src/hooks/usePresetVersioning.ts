import { useState, useCallback, useEffect, useRef } from 'react';
import { PresetVersion, PresetVersionHistory, MAX_VERSIONS_PER_SLOT, PresetTagValue } from '@/types/preset-version';

const STORAGE_KEY = 'backtest-preset-versions';
const AUTO_SAVE_KEY = 'backtest-preset-autosave';
const DEBOUNCE_DELAY_KEY = 'backtest-preset-debounce-delay';
const DEFAULT_DEBOUNCE_DELAY = 3000; // 3 seconds default

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

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      return saved !== null ? JSON.parse(saved) : true; // Default to enabled
    } catch {
      return true;
    }
  });

  const [debounceDelay, setDebounceDelay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(DEBOUNCE_DELAY_KEY);
      return saved !== null ? JSON.parse(saved) : DEFAULT_DEBOUNCE_DELAY;
    } catch {
      return DEFAULT_DEBOUNCE_DELAY;
    }
  });

  // Debounce state for pending saves
  const pendingVersionsRef = useRef<Map<'4' | '5' | '6', { data: PresetVersion['data']; timeoutId: NodeJS.Timeout; startedAt: number }>>(new Map());
  const [pendingSlots, setPendingSlots] = useState<Set<'4' | '5' | '6'>>(new Set());
  const [pendingSaveTimestamps, setPendingSaveTimestamps] = useState<Map<'4' | '5' | '6', number>>(new Map());
  
  // Track recently saved slots for animation
  const [recentlySavedSlots, setRecentlySavedSlots] = useState<Set<'4' | '5' | '6'>>(new Set());

  // Persist auto-save preference
  useEffect(() => {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveEnabled));
  }, [autoSaveEnabled]);

  // Persist debounce delay preference
  useEffect(() => {
    localStorage.setItem(DEBOUNCE_DELAY_KEY, JSON.stringify(debounceDelay));
  }, [debounceDelay]);

  // Persist to localStorage when history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versionHistory));
  }, [versionHistory]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      pendingVersionsRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    };
  }, []);

  /**
   * Trim versions while preserving pinned ones
   */
  const trimVersions = useCallback((versions: PresetVersion[]): PresetVersion[] => {
    if (versions.length <= MAX_VERSIONS_PER_SLOT) return versions;
    
    const pinned = versions.filter(v => v.pinned);
    const unpinned = versions.filter(v => !v.pinned);
    
    // Keep all pinned + as many unpinned as possible up to the limit
    const unpinnedToKeep = Math.max(0, MAX_VERSIONS_PER_SLOT - pinned.length);
    return [...pinned, ...unpinned.slice(0, unpinnedToKeep)]
      .sort((a, b) => b.savedAt - a.savedAt);
  }, []);

  /**
   * Trigger save animation for a slot
   */
  const triggerSaveAnimation = useCallback((slot: '4' | '5' | '6') => {
    setRecentlySavedSlots(prev => new Set(prev).add(slot));
    // Clear after animation duration (1 second)
    setTimeout(() => {
      setRecentlySavedSlots(prev => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    }, 1000);
  }, []);

  /**
   * Internal function to immediately add a version (no debounce)
   */
  const addVersionImmediate = useCallback((
    slot: '4' | '5' | '6',
    data: PresetVersion['data'],
    skipAnimation = false
  ) => {
    const version: PresetVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      savedAt: Date.now(),
      data,
    };

    setVersionHistory(prev => {
      const slotHistory = trimVersions([version, ...prev[slot]]);
      return { ...prev, [slot]: slotHistory };
    });

    // Trigger save animation
    if (!skipAnimation) {
      triggerSaveAnimation(slot);
    }

    return version;
  }, [trimVersions, triggerSaveAnimation]);

  /**
   * Add a new version to a slot's history with debouncing
   * Multiple saves within the debounce delay will only create one version
   */
  const addVersion = useCallback((
    slot: '4' | '5' | '6',
    data: PresetVersion['data']
  ) => {
    // Clear any existing pending save for this slot
    const existing = pendingVersionsRef.current.get(slot);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    // If debounce is 0, save immediately
    if (debounceDelay === 0) {
      return addVersionImmediate(slot, data);
    }

    const startedAt = Date.now();

    // Set up debounced save
    const timeoutId = setTimeout(() => {
      pendingVersionsRef.current.delete(slot);
      setPendingSlots(prev => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
      setPendingSaveTimestamps(prev => {
        const next = new Map(prev);
        next.delete(slot);
        return next;
      });
      addVersionImmediate(slot, data);
    }, debounceDelay);

    pendingVersionsRef.current.set(slot, { data, timeoutId, startedAt });
    setPendingSlots(prev => new Set(prev).add(slot));
    setPendingSaveTimestamps(prev => new Map(prev).set(slot, startedAt));

    // Return a placeholder version (actual version created after debounce)
    return {
      id: `pending-${slot}`,
      savedAt: Date.now(),
      data,
    } as PresetVersion;
  }, [debounceDelay, addVersionImmediate]);

  /**
   * Cancel a pending debounced save for a slot
   */
  const cancelPendingSave = useCallback((slot: '4' | '5' | '6') => {
    const existing = pendingVersionsRef.current.get(slot);
    if (existing) {
      clearTimeout(existing.timeoutId);
      pendingVersionsRef.current.delete(slot);
      setPendingSlots(prev => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
      setPendingSaveTimestamps(prev => {
        const next = new Map(prev);
        next.delete(slot);
        return next;
      });
    }
  }, []);

  /**
   * Force save any pending version immediately
   */
  const flushPendingSave = useCallback((slot: '4' | '5' | '6') => {
    const existing = pendingVersionsRef.current.get(slot);
    if (existing) {
      clearTimeout(existing.timeoutId);
      pendingVersionsRef.current.delete(slot);
      setPendingSlots(prev => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
      setPendingSaveTimestamps(prev => {
        const next = new Map(prev);
        next.delete(slot);
        return next;
      });
      return addVersionImmediate(slot, existing.data);
    }
    return null;
  }, [addVersionImmediate]);

  /**
   * Check if a slot has a pending save
   */
  const hasPendingSave = useCallback((slot: '4' | '5' | '6'): boolean => {
    return pendingSlots.has(slot);
  }, [pendingSlots]);

  /**
   * Check if a slot was recently saved (for animation)
   */
  const wasRecentlySaved = useCallback((slot: '4' | '5' | '6'): boolean => {
    return recentlySavedSlots.has(slot);
  }, [recentlySavedSlots]);

  /**
   * Get the start timestamp of a pending save for countdown calculation
   */
  const getPendingSaveStartTime = useCallback((slot: '4' | '5' | '6'): number | null => {
    return pendingSaveTimestamps.get(slot) ?? null;
  }, [pendingSaveTimestamps]);

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
   * Duplicate a version - creates a copy with a new ID and current timestamp
   */
  const duplicateVersion = useCallback((
    slot: '4' | '5' | '6',
    versionId: string
  ): PresetVersion | null => {
    const original = versionHistory[slot].find(v => v.id === versionId);
    if (!original) return null;

    const duplicate: PresetVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      savedAt: Date.now(),
      data: {
        ...original.data,
        label: `${original.data.label} (Copy)`,
      },
    };

    setVersionHistory(prev => {
      const slotHistory = trimVersions([duplicate, ...prev[slot]]);
      return { ...prev, [slot]: slotHistory };
    });

    return duplicate;
  }, [versionHistory, trimVersions]);

  /**
   * Update a version's note
   */
  const updateVersionNote = useCallback((
    slot: '4' | '5' | '6',
    versionId: string,
    note: string
  ): boolean => {
    const version = versionHistory[slot].find(v => v.id === versionId);
    if (!version) return false;

    setVersionHistory(prev => ({
      ...prev,
      [slot]: prev[slot].map(v => 
        v.id === versionId ? { ...v, note: note.trim() || undefined } : v
      ),
    }));

    return true;
  }, [versionHistory]);

  /**
   * Toggle a version's pinned state
   */
  const toggleVersionPin = useCallback((
    slot: '4' | '5' | '6',
    versionId: string
  ): boolean => {
    const version = versionHistory[slot].find(v => v.id === versionId);
    if (!version) return false;

    setVersionHistory(prev => ({
      ...prev,
      [slot]: prev[slot].map(v => 
        v.id === versionId ? { ...v, pinned: !v.pinned } : v
      ),
    }));

    return !version.pinned;
  }, [versionHistory]);

  /**
   * Toggle a tag on a version
   */
  const toggleVersionTag = useCallback((
    slot: '4' | '5' | '6',
    versionId: string,
    tag: PresetTagValue
  ): boolean => {
    const version = versionHistory[slot].find(v => v.id === versionId);
    if (!version) return false;

    const currentTags = version.tags || [];
    const hasTag = currentTags.includes(tag);
    const newTags = hasTag 
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    setVersionHistory(prev => ({
      ...prev,
      [slot]: prev[slot].map(v => 
        v.id === versionId ? { ...v, tags: newTags.length > 0 ? newTags : undefined } : v
      ),
    }));

    return !hasTag;
  }, [versionHistory]);

  /**
   * Bulk apply or remove a tag on multiple versions
   * @param action 'add' to add tag to all, 'remove' to remove from all, 'toggle' to toggle each
   * @returns number of versions modified
   */
  const bulkToggleVersionTag = useCallback((
    slot: '4' | '5' | '6',
    versionIds: string[],
    tag: PresetTagValue,
    action: 'add' | 'remove' = 'add'
  ): number => {
    const idsSet = new Set(versionIds);
    let modifiedCount = 0;

    setVersionHistory(prev => ({
      ...prev,
      [slot]: prev[slot].map(v => {
        if (!idsSet.has(v.id)) return v;
        
        const currentTags = v.tags || [];
        const hasTag = currentTags.includes(tag);
        
        if (action === 'add' && !hasTag) {
          modifiedCount++;
          return { ...v, tags: [...currentTags, tag] };
        } else if (action === 'remove' && hasTag) {
          modifiedCount++;
          const newTags = currentTags.filter(t => t !== tag);
          return { ...v, tags: newTags.length > 0 ? newTags : undefined };
        }
        return v;
      }),
    }));

    return modifiedCount;
  }, []);

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

  /**
   * Import version history for a slot from JSON
   */
  const importSlotHistory = useCallback((
    slot: '4' | '5' | '6',
    versions: PresetVersion[],
    mode: 'replace' | 'merge' = 'merge'
  ): { success: boolean; imported: number } => {
    try {
      const validVersions = versions.filter(v => 
        v.id && v.savedAt && v.data &&
        typeof v.data.label === 'string' &&
        typeof v.data.positionSizePercent === 'number' &&
        typeof v.data.stopLossPercent === 'number' &&
        typeof v.data.takeProfitPercent === 'number' &&
        typeof v.data.fastSMA === 'number' &&
        typeof v.data.slowSMA === 'number'
      );

      if (validVersions.length === 0) {
        return { success: false, imported: 0 };
      }

      setVersionHistory(prev => {
        let newHistory: PresetVersion[];
        if (mode === 'replace') {
          newHistory = validVersions.slice(0, MAX_VERSIONS_PER_SLOT);
        } else {
          // Merge: add new versions, avoid duplicates by ID
          const existingIds = new Set(prev[slot].map(v => v.id));
          const newVersions = validVersions.filter(v => !existingIds.has(v.id));
          newHistory = [...newVersions, ...prev[slot]]
            .sort((a, b) => b.savedAt - a.savedAt)
            .slice(0, MAX_VERSIONS_PER_SLOT);
        }
        return { ...prev, [slot]: newHistory };
      });

      return { success: true, imported: validVersions.length };
    } catch {
      return { success: false, imported: 0 };
    }
  }, []);

  // Store deleted versions for undo
  const [deletedVersionsBackup, setDeletedVersionsBackup] = useState<{
    slot: '4' | '5' | '6';
    versions: PresetVersion[];
  } | null>(null);

  /**
   * Delete specific versions from a slot's history
   * Returns the deleted count for potential undo
   */
  const deleteVersions = useCallback((
    slot: '4' | '5' | '6',
    versionIds: string[]
  ): number => {
    const idsToDelete = new Set(versionIds);
    const deletedVersions: PresetVersion[] = [];
    
    setVersionHistory(prev => {
      const kept: PresetVersion[] = [];
      prev[slot].forEach(v => {
        if (idsToDelete.has(v.id)) {
          deletedVersions.push(v);
        } else {
          kept.push(v);
        }
      });
      return { ...prev, [slot]: kept };
    });
    
    // Store backup for undo
    if (deletedVersions.length > 0) {
      setDeletedVersionsBackup({ slot, versions: deletedVersions });
    }
    
    return deletedVersions.length;
  }, []);

  /**
   * Undo the last delete operation
   */
  const undoDeleteVersions = useCallback((): boolean => {
    if (!deletedVersionsBackup) return false;
    
    const { slot, versions } = deletedVersionsBackup;
    
    setVersionHistory(prev => {
      // Merge back the deleted versions and sort by savedAt
      const merged = [...versions, ...prev[slot]]
        .sort((a, b) => b.savedAt - a.savedAt)
        .slice(0, MAX_VERSIONS_PER_SLOT);
      return { ...prev, [slot]: merged };
    });
    
    setDeletedVersionsBackup(null);
    return true;
  }, [deletedVersionsBackup]);

  /**
   * Clear the delete backup (call after undo timeout expires)
   */
  const clearDeleteBackup = useCallback(() => {
    setDeletedVersionsBackup(null);
  }, []);

  return {
    versionHistory,
    addVersion,
    addVersionImmediate,
    getSlotHistory,
    getVersion,
    duplicateVersion,
    updateVersionNote,
    toggleVersionPin,
    toggleVersionTag,
    bulkToggleVersionTag,
    clearSlotHistory,
    clearAllHistory,
    hasHistory,
    getTotalVersionCount,
    importSlotHistory,
    deleteVersions,
    undoDeleteVersions,
    clearDeleteBackup,
    canUndoDelete: deletedVersionsBackup !== null,
    autoSaveEnabled,
    setAutoSaveEnabled,
    // Debounce controls
    debounceDelay,
    setDebounceDelay,
    hasPendingSave,
    cancelPendingSave,
    flushPendingSave,
    pendingSlots,
    getPendingSaveStartTime,
    wasRecentlySaved,
    recentlySavedSlots,
  };
}
