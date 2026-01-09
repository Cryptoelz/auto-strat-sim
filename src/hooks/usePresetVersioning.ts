import { useState, useCallback, useEffect, useRef } from 'react';
import { PresetVersion, PresetVersionHistory, MAX_VERSIONS_PER_SLOT, PresetTagValue, VersionPerformance } from '@/types/preset-version';
import { playSaveSound } from '@/lib/sounds';
import { toast } from 'sonner';

/**
 * Represents a currently loaded version for performance tracking
 */
export interface LoadedVersionInfo {
  slot: '4' | '5' | '6';
  versionId: string;
}

const STORAGE_KEY = 'backtest-preset-versions';
const AUTO_SAVE_KEY = 'backtest-preset-autosave';
const DEBOUNCE_DELAY_KEY = 'backtest-preset-debounce-delay';
const AUTO_CLEANUP_KEY = 'backtest-preset-auto-cleanup';
const CLEANUP_THRESHOLD_KEY = 'backtest-preset-cleanup-threshold';
const DEFAULT_DEBOUNCE_DELAY = 3000; // 3 seconds default
const DEFAULT_CLEANUP_THRESHOLD = 80; // 80% of 5MB limit
const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB localStorage limit

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

  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_CLEANUP_KEY);
      return saved !== null ? JSON.parse(saved) : true; // Default to enabled
    } catch {
      return true;
    }
  });

  const [cleanupThreshold, setCleanupThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CLEANUP_THRESHOLD_KEY);
      return saved !== null ? JSON.parse(saved) : DEFAULT_CLEANUP_THRESHOLD;
    } catch {
      return DEFAULT_CLEANUP_THRESHOLD;
    }
  });

  // Debounce state for pending saves
  const pendingVersionsRef = useRef<Map<'4' | '5' | '6', { data: PresetVersion['data']; timeoutId: NodeJS.Timeout; startedAt: number }>>(new Map());
  const [pendingSlots, setPendingSlots] = useState<Set<'4' | '5' | '6'>>(new Set());
  const [pendingSaveTimestamps, setPendingSaveTimestamps] = useState<Map<'4' | '5' | '6', number>>(new Map());
  
  // Track recently saved slots for animation
  const [recentlySavedSlots, setRecentlySavedSlots] = useState<Set<'4' | '5' | '6'>>(new Set());
  
  // Track currently loaded version for auto performance recording
  const [loadedVersion, setLoadedVersion] = useState<LoadedVersionInfo | null>(null);
  
  // Track recently cancelled slots for shake animation
  const [recentlyCancelledSlots, setRecentlyCancelledSlots] = useState<Set<'4' | '5' | '6'>>(new Set());

  // Persist auto-save preference
  useEffect(() => {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveEnabled));
  }, [autoSaveEnabled]);

  // Persist debounce delay preference
  useEffect(() => {
    localStorage.setItem(DEBOUNCE_DELAY_KEY, JSON.stringify(debounceDelay));
  }, [debounceDelay]);

  // Persist auto-cleanup preference
  useEffect(() => {
    localStorage.setItem(AUTO_CLEANUP_KEY, JSON.stringify(autoCleanupEnabled));
  }, [autoCleanupEnabled]);

  // Persist cleanup threshold preference
  useEffect(() => {
    localStorage.setItem(CLEANUP_THRESHOLD_KEY, JSON.stringify(cleanupThreshold));
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
   * Get current storage usage in bytes
   */
  const getStorageBytes = useCallback((history: PresetVersionHistory): number => {
    return new Blob([JSON.stringify(history)]).size;
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
   * Auto-cleanup oldest unpinned versions when storage exceeds threshold
   * Returns cleaned history, count removed, and details of removed versions
   */
  const performAutoCleanup = useCallback((history: PresetVersionHistory): { 
    cleaned: PresetVersionHistory; 
    removed: number;
    removedVersions: { slot: '4' | '5' | '6'; label: string; savedAt: number }[];
  } => {
    const thresholdBytes = (cleanupThreshold / 100) * MAX_STORAGE_BYTES;
    let currentBytes = getStorageBytes(history);
    
    if (currentBytes <= thresholdBytes) {
      return { cleaned: history, removed: 0, removedVersions: [] };
    }

    // Collect all unpinned versions across all slots with their slot info
    const allUnpinned: { slot: '4' | '5' | '6'; version: PresetVersion }[] = [];
    const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
    
    slots.forEach(slot => {
      history[slot]
        .filter(v => !v.pinned)
        .forEach(version => allUnpinned.push({ slot, version }));
    });

    // Sort by savedAt (oldest first) to remove oldest first
    allUnpinned.sort((a, b) => a.version.savedAt - b.version.savedAt);

    const toRemove = new Set<string>();
    const removedVersions: { slot: '4' | '5' | '6'; label: string; savedAt: number }[] = [];
    let testHistory = { ...history };
    let removed = 0;

    // Remove oldest unpinned versions one by one until under threshold
    for (const item of allUnpinned) {
      if (currentBytes <= thresholdBytes) break;
      
      toRemove.add(item.version.id);
      removedVersions.push({
        slot: item.slot,
        label: item.version.data.label,
        savedAt: item.version.savedAt
      });
      testHistory = {
        ...testHistory,
        [item.slot]: testHistory[item.slot].filter(v => v.id !== item.version.id)
      };
      currentBytes = getStorageBytes(testHistory);
      removed++;
    }

    return { cleaned: testHistory, removed, removedVersions };
  }, [cleanupThreshold, getStorageBytes]);

  // Store cleanup backup for undo
  const [cleanupBackup, setCleanupBackup] = useState<{
    versions: { slot: '4' | '5' | '6'; version: PresetVersion }[];
    timestamp: number;
  } | null>(null);
  
  const cleanupUndoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Manually trigger cleanup to remove oldest unpinned versions
   * @param count Number of versions to remove (default: removes until under 50% threshold)
   */
  const manualCleanup = useCallback((count?: number): number => {
    let removed = 0;
    const removedVersions: { slot: '4' | '5' | '6'; label: string }[] = [];
    const backupVersions: { slot: '4' | '5' | '6'; version: PresetVersion }[] = [];
    
    setVersionHistory(prev => {
      // Collect all unpinned versions across all slots
      const allUnpinned: { slot: '4' | '5' | '6'; version: PresetVersion }[] = [];
      const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
      
      slots.forEach(slot => {
        prev[slot]
          .filter(v => !v.pinned)
          .forEach(version => allUnpinned.push({ slot, version }));
      });

      if (allUnpinned.length === 0) {
        toast.info('No unpinned versions to clean up');
        return prev;
      }

      // Sort by savedAt (oldest first)
      allUnpinned.sort((a, b) => a.version.savedAt - b.version.savedAt);

      // Determine how many to remove
      const toRemoveCount = count ?? Math.max(1, Math.floor(allUnpinned.length / 2));
      const versionsToRemove = allUnpinned.slice(0, toRemoveCount);
      
      if (versionsToRemove.length === 0) {
        return prev;
      }

      const idsToRemove = new Set(versionsToRemove.map(v => v.version.id));
      
      versionsToRemove.forEach(v => {
        removedVersions.push({ slot: v.slot, label: v.version.data.label });
        backupVersions.push({ slot: v.slot, version: v.version });
      });

      const newHistory = {
        '4': prev['4'].filter(v => !idsToRemove.has(v.id)),
        '5': prev['5'].filter(v => !idsToRemove.has(v.id)),
        '6': prev['6'].filter(v => !idsToRemove.has(v.id)),
      };
      
      removed = versionsToRemove.length;
      return newHistory;
    });

    if (removed > 0) {
      // Store backup for undo
      setCleanupBackup({ versions: backupVersions, timestamp: Date.now() });
      
      // Clear any existing timeout
      if (cleanupUndoTimeoutRef.current) {
        clearTimeout(cleanupUndoTimeoutRef.current);
      }
      
      // Auto-clear backup after 30 seconds
      cleanupUndoTimeoutRef.current = setTimeout(() => {
        setCleanupBackup(null);
      }, 30000);
      
      setLastCleanupCount(removed);
      setTimeout(() => setLastCleanupCount(0), 5000);
      
      const slotCounts = removedVersions.reduce((acc, v) => {
        acc[v.slot] = (acc[v.slot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const slotSummary = Object.entries(slotCounts)
        .map(([s, c]) => `Preset ${s}: ${c}`)
        .join(', ');
      
      toast.success(`Cleanup: ${removed} version${removed !== 1 ? 's' : ''} removed`, {
        description: slotSummary,
        duration: 10000,
        action: {
          label: 'Undo',
          onClick: () => {
            undoManualCleanup();
          },
        },
      });
    }

    return removed;
  }, []);

  /**
   * Undo the last manual cleanup operation
   */
  const undoManualCleanup = useCallback((): boolean => {
    if (!cleanupBackup) {
      toast.info('Nothing to undo');
      return false;
    }
    
    const { versions } = cleanupBackup;
    
    setVersionHistory(prev => {
      const newHistory = { ...prev };
      
      versions.forEach(({ slot, version }) => {
        // Check if version doesn't already exist (avoid duplicates)
        if (!newHistory[slot].some(v => v.id === version.id)) {
          newHistory[slot] = [...newHistory[slot], version]
            .sort((a, b) => b.savedAt - a.savedAt);
        }
      });
      
      return newHistory;
    });
    
    const restoredCount = versions.length;
    setCleanupBackup(null);
    
    if (cleanupUndoTimeoutRef.current) {
      clearTimeout(cleanupUndoTimeoutRef.current);
      cleanupUndoTimeoutRef.current = null;
    }
    
    toast.success(`Restored ${restoredCount} version${restoredCount !== 1 ? 's' : ''}`);
    
    return true;
  }, [cleanupBackup]);

  /**
   * Check if cleanup can be undone
   */
  const canUndoCleanup = cleanupBackup !== null;

  /**
   * Clear the cleanup backup (e.g., when user dismisses undo option)
   */
  const clearCleanupBackup = useCallback(() => {
    setCleanupBackup(null);
    if (cleanupUndoTimeoutRef.current) {
      clearTimeout(cleanupUndoTimeoutRef.current);
      cleanupUndoTimeoutRef.current = null;
    }
  }, []);

  /**
   * Update performance metrics for a specific version
   */
  const updateVersionPerformance = useCallback((
    slot: '4' | '5' | '6',
    versionId: string,
    performance: VersionPerformance
  ): boolean => {
    const version = versionHistory[slot].find(v => v.id === versionId);
    if (!version) return false;

    setVersionHistory(prev => ({
      ...prev,
      [slot]: prev[slot].map(v => 
        v.id === versionId ? { ...v, performance } : v
      ),
    }));

    return true;
  }, [versionHistory]);

  /**
   * Calculate a composite performance score for ranking versions
   * Higher is better. Returns -Infinity for versions without performance data.
   */
  const calculatePerformanceScore = useCallback((version: PresetVersion): number => {
    if (!version.performance) return -Infinity;
    
    const p = version.performance;
    
    // Composite score: prioritize Sharpe, profit factor, win rate, and penalize drawdown
    // Sharpe: typically -3 to +3, weight heavily
    // Profit Factor: typically 0 to 5+, weight moderately
    // Win Rate: 0-100, normalize
    // Drawdown: 0-100, penalize
    
    const sharpeScore = p.sharpeRatio * 20; // -60 to +60
    const profitFactorScore = Math.min(p.profitFactor, 5) * 10; // 0 to 50
    const winRateScore = p.winRate * 0.3; // 0 to 30
    const drawdownPenalty = p.maxDrawdown * 0.5; // 0 to 50 penalty
    const pnlScore = Math.max(-50, Math.min(50, p.totalPnlPercent)); // -50 to 50
    
    return sharpeScore + profitFactorScore + winRateScore - drawdownPenalty + pnlScore;
  }, []);

  /**
   * Smart cleanup: keeps the best-performing versions based on backtest metrics
   * @param keepCount Number of best-performing versions to keep per slot
   * @returns Number of versions removed
   */
  const smartCleanup = useCallback((keepCount: number = 3): number => {
    let removed = 0;
    const removedVersions: { slot: '4' | '5' | '6'; label: string }[] = [];
    const backupVersions: { slot: '4' | '5' | '6'; version: PresetVersion }[] = [];
    
    setVersionHistory(prev => {
      const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
      const newHistory = { ...prev };
      
      slots.forEach(slot => {
        const versions = prev[slot];
        if (versions.length === 0) return;
        
        // Separate pinned and unpinned versions
        const pinned = versions.filter(v => v.pinned);
        const unpinned = versions.filter(v => !v.pinned);
        
        if (unpinned.length <= keepCount) return;
        
        // Separate versions with and without performance data
        const withPerformance = unpinned.filter(v => v.performance);
        const withoutPerformance = unpinned.filter(v => !v.performance);
        
        // Sort by performance score (highest first)
        const rankedPerformance = [...withPerformance].sort((a, b) => 
          calculatePerformanceScore(b) - calculatePerformanceScore(a)
        );
        
        // Keep the best performing versions
        const toKeepFromPerformance = rankedPerformance.slice(0, keepCount);
        const toRemoveFromPerformance = rankedPerformance.slice(keepCount);
        
        // If we have room, keep some versions without performance data (oldest first to remove)
        const remainingSlots = Math.max(0, keepCount - toKeepFromPerformance.length);
        const toKeepWithoutPerformance = withoutPerformance.slice(-remainingSlots); // Keep most recent
        const toRemoveWithoutPerformance = withoutPerformance.slice(0, withoutPerformance.length - remainingSlots);
        
        const toRemove = [...toRemoveFromPerformance, ...toRemoveWithoutPerformance];
        const idsToRemove = new Set(toRemove.map(v => v.id));
        
        toRemove.forEach(v => {
          removedVersions.push({ slot, label: v.data.label });
          backupVersions.push({ slot, version: v });
          removed++;
        });
        
        newHistory[slot] = [...pinned, ...toKeepFromPerformance, ...toKeepWithoutPerformance]
          .sort((a, b) => b.savedAt - a.savedAt);
      });
      
      return newHistory;
    });

    if (removed > 0) {
      // Store backup for undo
      setCleanupBackup({ versions: backupVersions, timestamp: Date.now() });
      
      // Clear any existing timeout
      if (cleanupUndoTimeoutRef.current) {
        clearTimeout(cleanupUndoTimeoutRef.current);
      }
      
      // Auto-clear backup after 30 seconds
      cleanupUndoTimeoutRef.current = setTimeout(() => {
        setCleanupBackup(null);
      }, 30000);
      
      setLastCleanupCount(removed);
      setTimeout(() => setLastCleanupCount(0), 5000);
      
      const slotCounts = removedVersions.reduce((acc, v) => {
        acc[v.slot] = (acc[v.slot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const slotSummary = Object.entries(slotCounts)
        .map(([s, c]) => `Preset ${s}: ${c}`)
        .join(', ');
      
      toast.success(`Smart cleanup: ${removed} low-performing version${removed !== 1 ? 's' : ''} removed`, {
        description: slotSummary,
        duration: 10000,
        action: {
          label: 'Undo',
          onClick: () => {
            undoManualCleanup();
          },
        },
      });
    } else {
      toast.info('No versions to clean up', {
        description: 'All versions are either pinned or already optimal',
      });
    }

    return removed;
  }, [calculatePerformanceScore, undoManualCleanup]);

  /**
   * Get count of versions with performance data
   */
  const getVersionsWithPerformanceCount = useCallback((): number => {
    const slots: ('4' | '5' | '6')[] = ['4', '5', '6'];
    return slots.reduce((count, slot) => {
      return count + versionHistory[slot].filter(v => v.performance).length;
    }, 0);
  }, [versionHistory]);


  /**
   * Trigger save animation for a slot
   */
  const triggerSaveAnimation = useCallback((slot: '4' | '5' | '6') => {
    setRecentlySavedSlots(prev => new Set(prev).add(slot));
    // Play subtle save sound
    playSaveSound();
    // Clear after animation duration (1 second)
    setTimeout(() => {
      setRecentlySavedSlots(prev => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    }, 1000);
  }, []);

  // Track cleanup events for UI feedback
  const [lastCleanupCount, setLastCleanupCount] = useState<number>(0);

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
      let newHistory = { ...prev, [slot]: slotHistory };
      
      // Perform auto-cleanup if enabled
      if (autoCleanupEnabled) {
        const { cleaned, removed, removedVersions } = performAutoCleanup(newHistory);
        if (removed > 0) {
          setLastCleanupCount(removed);
          // Clear after a short delay for UI feedback
          setTimeout(() => setLastCleanupCount(0), 5000);
          
          // Show toast notification with details
          const slotCounts = removedVersions.reduce((acc, v) => {
            acc[v.slot] = (acc[v.slot] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const slotSummary = Object.entries(slotCounts)
            .map(([s, count]) => `Preset ${s}: ${count}`)
            .join(', ');
          
          toast.info(`Auto-cleanup: ${removed} version${removed !== 1 ? 's' : ''} removed`, {
            description: slotSummary,
            duration: 5000,
          });
        }
        return cleaned;
      }
      
      return newHistory;
    });

    // Trigger save animation
    if (!skipAnimation) {
      triggerSaveAnimation(slot);
    }

    return version;
  }, [trimVersions, triggerSaveAnimation, autoCleanupEnabled, performAutoCleanup]);

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
      // Trigger cancel animation
      setRecentlyCancelledSlots(prev => new Set(prev).add(slot));
      setTimeout(() => {
        setRecentlyCancelledSlots(prev => {
          const next = new Set(prev);
          next.delete(slot);
          return next;
        });
      }, 400); // Match shake animation duration
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

  /**
   * Set the currently loaded version for performance tracking
   */
  const setLoadedVersionInfo = useCallback((slot: '4' | '5' | '6', versionId: string) => {
    setLoadedVersion({ slot, versionId });
  }, []);

  /**
   * Clear the loaded version tracking
   */
  const clearLoadedVersion = useCallback(() => {
    setLoadedVersion(null);
  }, []);

  /**
   * Get the currently loaded version info
   */
  const getLoadedVersionInfo = useCallback((): LoadedVersionInfo | null => {
    return loadedVersion;
  }, [loadedVersion]);

  /**
   * Record performance for the currently loaded version
   * Returns the recorded version info if successful, null otherwise
   */
  const recordPerformanceForLoadedVersion = useCallback((
    performance: VersionPerformance
  ): LoadedVersionInfo | null => {
    if (!loadedVersion) return null;
    
    const success = updateVersionPerformance(loadedVersion.slot, loadedVersion.versionId, performance);
    return success ? loadedVersion : null;
  }, [loadedVersion, updateVersionPerformance]);

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
    wasCancelledRecently: useCallback((slot: '4' | '5' | '6') => recentlyCancelledSlots.has(slot), [recentlyCancelledSlots]),
    recentlyCancelledSlots,
    // Auto-cleanup controls
    autoCleanupEnabled,
    setAutoCleanupEnabled,
    cleanupThreshold,
    setCleanupThreshold,
    lastCleanupCount,
    getStorageBytes,
    manualCleanup,
    undoManualCleanup,
    canUndoCleanup,
    clearCleanupBackup,
    cleanupBackupTimestamp: cleanupBackup?.timestamp ?? null,
    // Smart cleanup
    smartCleanup,
    updateVersionPerformance,
    getVersionsWithPerformanceCount,
    // Loaded version tracking for auto-performance recording
    loadedVersion,
    setLoadedVersionInfo,
    clearLoadedVersion,
    getLoadedVersionInfo,
    recordPerformanceForLoadedVersion,
  };
}
