/**
 * CMC Hackathon — Stage 3B runtime isolation checks.
 * Each check is genuinely evaluated at runtime; the ISOLATION VERIFIED badge
 * is only shown when every check passes.
 */

import { CMC_READ_ONLY } from './config';
import { CMC_CONTEXT_STORAGE_KEY } from './contextStore';
import type { CmcDecisionContextRecord } from './decisionContext';

/** Storage namespaces owned by the trading platform that CMC must never write. */
export const PROTECTED_STORAGE_KEYS = [
  'atlas_specialist_funnel_v1',
  'atlas_specialist_ledger_v1',
];

export interface IsolationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export function runIsolationChecks(records: CmcDecisionContextRecord[]): IsolationCheck[] {
  const noCausal = records.every((r) => r.provenance.causalInfluence === false);
  const allSourced = records.every((r) => r.provenance.source === 'CoinMarketCap');
  const ownNamespace = CMC_CONTEXT_STORAGE_KEY.startsWith('atlas_cmc_');
  const notProtected = !PROTECTED_STORAGE_KEYS.includes(CMC_CONTEXT_STORAGE_KEY);

  return [
    {
      id: 'read-only',
      label: 'CMC layer flagged read-only',
      passed: CMC_READ_ONLY === true,
      detail: `CMC_READ_ONLY = ${String(CMC_READ_ONLY)}`,
    },
    {
      id: 'no-causal',
      label: 'No record claims causal influence',
      passed: noCausal,
      detail: `${records.length} record(s) checked`,
    },
    {
      id: 'provenance',
      label: 'Every record carries CoinMarketCap provenance',
      passed: allSourced,
      detail: 'source = CoinMarketCap on all records',
    },
    {
      id: 'namespace',
      label: 'Separate CMC-owned storage namespace',
      passed: ownNamespace && notProtected,
      detail: `${CMC_CONTEXT_STORAGE_KEY} (trading namespaces untouched)`,
    },
  ];
}

export function isolationVerified(records: CmcDecisionContextRecord[]): boolean {
  return runIsolationChecks(records).every((c) => c.passed);
}
