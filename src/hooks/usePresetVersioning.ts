import { useState, useCallback, useEffect } from 'react';
import { PresetVersion, PresetVersionHistory, MAX_VERSIONS_PER_SLOT, PresetTagValue } from '@/types/preset-version';

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
      const slotHistory = trimVersions([version, ...prev[slot]]);
      return { ...prev, [slot]: slotHistory };
    });

    return version;
  }, [trimVersions]);

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
  };
}
