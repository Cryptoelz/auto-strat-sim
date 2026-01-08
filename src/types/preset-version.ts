/**
 * Preset tag options
 */
export const PRESET_TAGS = [
  { value: 'best-performance', label: 'Best Performance', color: 'bg-green-500/20 text-green-600' },
  { value: 'experimental', label: 'Experimental', color: 'bg-purple-500/20 text-purple-600' },
  { value: 'stable', label: 'Stable', color: 'bg-blue-500/20 text-blue-600' },
  { value: 'backup', label: 'Backup', color: 'bg-yellow-500/20 text-yellow-600' },
  { value: 'deprecated', label: 'Deprecated', color: 'bg-red-500/20 text-red-600' },
] as const;

export type PresetTagValue = typeof PRESET_TAGS[number]['value'];

/**
 * A single version snapshot of a preset
 */
export interface PresetVersion {
  /** Unique version ID */
  id: string;
  /** Timestamp when this version was saved */
  savedAt: number;
  /** Optional note/comment for this version */
  note?: string;
  /** Whether this version is pinned (protected from auto-deletion) */
  pinned?: boolean;
  /** Optional tags for categorizing this version */
  tags?: PresetTagValue[];
  /** The preset values at this version */
  data: {
    label: string;
    description: string;
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    fastSMA: number;
    slowSMA: number;
  };
}

/**
 * Version history for all custom preset slots
 */
export type PresetVersionHistory = Record<'4' | '5' | '6', PresetVersion[]>;

/**
 * Maximum number of versions to keep per preset slot
 */
export const MAX_VERSIONS_PER_SLOT = 10;
