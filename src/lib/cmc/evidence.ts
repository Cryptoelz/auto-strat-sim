/**
 * CMC Hackathon — Stage 3D: lean judge-facing evidence summary.
 *
 * PURE, READ-ONLY AGGREGATION over data that already exists:
 *   - the persisted Engine Audit Ledger (Stage 3C)
 *   - the persisted CMC decision-context store (Stage 3B)
 *   - the in-memory CMC request/cache statistics (Stage 2)
 *
 * This module performs NO network calls, spends NO CMC API credits, writes
 * nothing, and is imported by no trading, signal, specialist, risk,
 * portfolio, governance, execution or backtest module.
 *
 * It makes no performance claim: CMC data is intentionally non-causal here,
 * so nothing in this file computes win-rate, profitability, significance or
 * predictive advantage.
 */

import type { EngineAuditEvent } from '@/lib/audit/types';
import { AUDIT_ENABLED, AUDIT_MAX_EVENTS, AUDIT_STORAGE_KEY } from '@/lib/audit/config';
import { CMC_ENABLED, CMC_PROXY_FUNCTION, CMC_READ_ONLY } from './config';
import { CMC_MIN_REFRESH_MS, CMC_TTL_MS, type CmcRequestStats } from './cache';
import { CMC_CONTEXT_MAX_RECORDS, CMC_CONTEXT_STORAGE_KEY } from './contextStore';
import type { CmcDecisionContextRecord, ContextDataState } from './decisionContext';
import { SYMBOL_MAP } from './symbols';
import { runIsolationChecks, type IsolationCheck } from './isolationCheck';

export const CMC_EVIDENCE_STAGE = 'Stage 3D — CMC Evidence Summary';
export const RETROSPECTIVE_LABEL = 'CMC CONTEXT UNAVAILABLE — RETROSPECTIVE';
export const SMALL_SAMPLE_NOTE =
  'Evidence shown is descriptive integration evidence, not a claim of statistical trading performance.';

/** CMC inputs that genuinely exist in the current implementation. No endpoint is added here. */
export interface CmcInputDescriptor {
  endpoint: string;
  purpose: string;
  fields: string[];
}

export const CMC_INPUTS: CmcInputDescriptor[] = [
  {
    endpoint: 'cryptocurrency/quotes/latest',
    purpose: 'Tracked-asset context (price, market cap, volume, 1h/24h/7d change, CMC rank)',
    fields: ['price', 'market_cap', 'volume_24h', 'percent_change_1h', 'percent_change_24h', 'percent_change_7d', 'cmc_rank'],
  },
  {
    endpoint: 'global-metrics/quotes/latest',
    purpose: 'Market regime context (total market cap, total volume, BTC/ETH dominance)',
    fields: ['total_market_cap', 'total_volume_24h', 'btc_dominance', 'eth_dominance'],
  },
  {
    endpoint: 'fear-and-greed/latest',
    purpose: 'Sentiment context (value and classification)',
    fields: ['value', 'value_classification'],
  },
];

export interface EvidenceClassification {
  eventId: string;
  asset: string;
  eventType: string;
  timestamp: number;
  source: 'logger' | 'trades';
  classification: 'LIVE LOGGER EVENT' | 'BACKFILLED COMPLETED TRADE';
  contextStatus: ContextDataState | 'RETROSPECTIVE';
  contextLabel: string;
}

export interface EvidenceTotals {
  totalAuditEvents: number;
  liveLoggerEvents: number;
  backfilledCompletedTrades: number;
  contemporaneousContextRecords: number;
  retrospectiveRecords: number;
  assets: string[];
  latestEventAt: number | null;
  contextByState: Record<ContextDataState, number>;
}

export interface EvidenceIntegrity {
  keyHandling: 'server-side proxy only — key never present in browser code';
  proxyFunction: string;
  cacheTtlMs: number;
  throttleMs: number;
  staleHandling: string;
  unavailableHandling: string;
  deduplication: string;
  provenance: string;
  observerIsolation: string;
  causalInfluence: false;
  protectedModulesModified: false;
  readOnly: boolean;
}

export interface EvidenceApiStats {
  networkRequests: number;
  cacheHits: number;
  throttled: number;
  rateLimited: number;
  errors: number;
  extraApiCallsForContextCapture: number;
}

export interface EvidenceBundle {
  generatedAt: string;
  stage: string;
  project: string;
  featureFlags: { cmcEnabled: boolean; auditEnabled: boolean };
  configuration: {
    proxyFunction: string;
    trackedAssets: string[];
    cmcInputs: CmcInputDescriptor[];
    auditStore: { key: string; maxEvents: number };
    contextStore: { key: string; maxRecords: number };
  };
  totals: EvidenceTotals;
  classifications: EvidenceClassification[];
  contextRecords: CmcDecisionContextRecord[];
  integrity: EvidenceIntegrity;
  apiStats: EvidenceApiStats;
  isolationChecks: IsolationCheck[];
  isolationVerified: boolean;
  storage: { available: boolean; persisted: number; lastError: string | null };
  limitations: string[];
  disclaimer: string;
}

export interface EvidenceInput {
  auditEvents: EngineAuditEvent[];
  contextRecords: CmcDecisionContextRecord[];
  extraApiCalls: number;
  requestStats: CmcRequestStats;
  storage: { available: boolean; persisted: number; lastError: string | null };
  now?: number;
}

const EMPTY_STATE_COUNTS = (): Record<ContextDataState, number> => ({
  LIVE: 0,
  CACHED: 0,
  STALE: 0,
  UNAVAILABLE: 0,
});

/** Pure: classifies each genuine audit event and its CMC-context availability. */
export function classifyEvents(
  auditEvents: EngineAuditEvent[],
  contextRecords: CmcDecisionContextRecord[],
): EvidenceClassification[] {
  const byEvent = new Map(contextRecords.map((r) => [r.eventId, r]));
  return auditEvents.map((e) => {
    const backfilled = e.backfilled || e.contextContemporaneous === false;
    const record = backfilled ? undefined : byEvent.get(e.eventId);
    return {
      eventId: e.eventId,
      asset: e.asset,
      eventType: e.eventType,
      timestamp: e.timestamp,
      source: e.sourceModule,
      classification: backfilled ? 'BACKFILLED COMPLETED TRADE' : 'LIVE LOGGER EVENT',
      contextStatus: backfilled ? 'RETROSPECTIVE' : record?.dataState ?? 'UNAVAILABLE',
      contextLabel: backfilled
        ? RETROSPECTIVE_LABEL
        : record
          ? `CMC CONTEXT: ${record.dataState}`
          : 'CMC CONTEXT: UNAVAILABLE',
    };
  });
}

/** Pure: descriptive totals only — no performance or significance maths. */
export function computeEvidenceTotals(
  auditEvents: EngineAuditEvent[],
  contextRecords: CmcDecisionContextRecord[],
): EvidenceTotals {
  const assets = new Set<string>();
  let live = 0;
  let backfilled = 0;
  let latest: number | null = null;
  for (const e of auditEvents) {
    assets.add(e.asset);
    if (e.backfilled) backfilled += 1;
    else live += 1;
    if (latest === null || e.timestamp > latest) latest = e.timestamp;
  }

  const contextByState = EMPTY_STATE_COUNTS();
  for (const r of contextRecords) contextByState[r.dataState] += 1;

  return {
    totalAuditEvents: auditEvents.length,
    liveLoggerEvents: live,
    backfilledCompletedTrades: backfilled,
    contemporaneousContextRecords: contextRecords.length,
    retrospectiveRecords: backfilled,
    assets: [...assets].sort(),
    latestEventAt: latest,
    contextByState,
  };
}

export function buildIntegrityEvidence(): EvidenceIntegrity {
  return {
    keyHandling: 'server-side proxy only — key never present in browser code',
    proxyFunction: CMC_PROXY_FUNCTION,
    cacheTtlMs: CMC_TTL_MS,
    throttleMs: CMC_MIN_REFRESH_MS,
    staleHandling: 'last known good snapshot preserved and labelled STALE — never substituted with simulated data',
    unavailableHandling: 'missing values stay null and render as UNAVAILABLE — never fabricated',
    deduplication: 'audit records deduplicated by the engine\'s own immutable event / trade id',
    provenance: 'every record carries source, purpose and causalInfluence = false',
    observerIsolation: 'one-way flow: engine → logger/trade history → audit ledger → CMC context',
    causalInfluence: false,
    protectedModulesModified: false,
    readOnly: CMC_READ_ONLY,
  };
}

export const EVIDENCE_LIMITATIONS = [
  'Simulation only — no live orders, no leverage, no private exchange keys.',
  'CMC data is context, never cause: it cannot change a signal, filter, size or execution.',
  'Backfilled completed trades are observed after execution and can never carry contemporaneous CMC context.',
  'The free CMC tier provides snapshots only — no historical OHLCV — so past context cannot be reconstructed.',
  'The genuine event sample is small; figures are descriptive integration evidence, not performance statistics.',
];

/** Pure: the full judge evidence bundle. Contains no key, secret or credential. */
export function buildEvidenceBundle(input: EvidenceInput): EvidenceBundle {
  const { auditEvents, contextRecords, extraApiCalls, requestStats, storage } = input;
  const now = input.now ?? Date.now();
  const checks = runIsolationChecks(contextRecords);

  return {
    generatedAt: new Date(now).toISOString(),
    stage: CMC_EVIDENCE_STAGE,
    project: 'CryptoTrader — simulation-only trading research platform',
    featureFlags: { cmcEnabled: CMC_ENABLED, auditEnabled: AUDIT_ENABLED },
    configuration: {
      proxyFunction: CMC_PROXY_FUNCTION,
      trackedAssets: SYMBOL_MAP.map((m) => m.pair),
      cmcInputs: CMC_INPUTS,
      auditStore: { key: AUDIT_STORAGE_KEY, maxEvents: AUDIT_MAX_EVENTS },
      contextStore: { key: CMC_CONTEXT_STORAGE_KEY, maxRecords: CMC_CONTEXT_MAX_RECORDS },
    },
    totals: computeEvidenceTotals(auditEvents, contextRecords),
    classifications: classifyEvents(auditEvents, contextRecords),
    contextRecords,
    integrity: buildIntegrityEvidence(),
    apiStats: {
      networkRequests: requestStats.networkRequests,
      cacheHits: requestStats.cacheHits,
      throttled: requestStats.throttled,
      rateLimited: requestStats.rateLimited,
      errors: requestStats.errors,
      extraApiCallsForContextCapture: extraApiCalls,
    },
    isolationChecks: checks,
    isolationVerified: checks.every((c) => c.passed),
    storage,
    limitations: EVIDENCE_LIMITATIONS,
    disclaimer: SMALL_SAMPLE_NOTE,
  };
}

export function evidenceJson(bundle: EvidenceBundle): string {
  return JSON.stringify(bundle, null, 2);
}
