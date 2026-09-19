/**
 * Stage 3C — Engine Audit Ledger feature flag + configuration.
 *
 * The audit ledger is a passive OBSERVER of the engine's already-public
 * decision log. Setting AUDIT_ENABLED to false removes all capture, all
 * storage writes and the route/nav entry; the trading engine behaves
 * identically either way.
 */

export const AUDIT_ENABLED = true;

export const AUDIT_STORAGE_KEY = 'atlas_engine_audit_v1';

/** Bounded retention — oldest events are dropped beyond this cap. */
export const AUDIT_MAX_EVENTS = 1000;

export const AUDIT_SOURCE_MODULE = 'logger' as const;
