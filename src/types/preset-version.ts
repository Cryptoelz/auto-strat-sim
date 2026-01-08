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
