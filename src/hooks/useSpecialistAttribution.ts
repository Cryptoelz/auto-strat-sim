import { useEffect, useMemo, useRef, useState } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { buildMarketContext, runAllSpecialists } from '@/lib/specialists/registry';
import { selectChampion } from '@/lib/specialists/selector';
import { deriveStats, loadLedger, appendLedger, LedgerEntry } from '@/lib/specialists/stats';
import {
  FunnelMap, emptyFunnelMap, recordRound, recordExecutionAttempt,
} from '@/lib/specialists/attribution';
import { SpecialistId, SpecialistProposal } from '@/lib/specialists/types';
import { Asset } from '@/types/trading';

/**
 * Attribution is driven by the LIVE engine:
 *  - one comparison round per asset per candle the engine actually evaluated
 *  - approved/rejected/executed resolved from the engine's ExecutionAttempt log
 * Read-only: nothing here influences execution.
 */
export function useSpecialistAttribution() {
  const { candles, executionAttempts } = useTradingContext();
  const [funnels, setFunnels] = useState<FunnelMap>(() => emptyFunnelMap());
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => loadLedger());
  const [championByAsset, setChampionByAsset] = useState<Partial<Record<Asset, SpecialistId>>>({});
  const [latest, setLatest] = useState<Record<string, SpecialistProposal[]>>({});
  const seenCandleRef = useRef<Partial<Record<Asset, number>>>({});
  const seenAttemptRef = useRef<Set<string>>(new Set());

  const stats = useMemo(() => deriveStats(ledger), [ledger]);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  // ── Round recording: one per newly closed candle per asset ──
  useEffect(() => {
    const assets = Object.keys(candles) as Asset[];
    let nextFunnels: FunnelMap | null = null;
    const championUpdates: Partial<Record<Asset, SpecialistId>> = {};
    const proposalUpdates: Record<string, SpecialistProposal[]> = {};
    let ledgerChanged: LedgerEntry[] | null = null;

    assets.forEach((asset) => {
      const arr = candles[asset] ?? [];
      const lastTs = arr.length ? arr[arr.length - 1].timestamp : null;
      if (!lastTs || seenCandleRef.current[asset] === lastTs) return;

      const ctx = buildMarketContext(asset, arr);
      if (!ctx) return;
      seenCandleRef.current[asset] = lastTs;

      const proposals = runAllSpecialists(ctx);
      const result = selectChampion(proposals, statsRef.current);
      const championId = result.champion?.specialistId ?? null;

      nextFunnels = recordRound(nextFunnels ?? funnels, proposals, championId, result.decision === 'PROPOSE', asset);
      if (championId) championUpdates[asset] = championId;
      proposalUpdates[asset] = proposals;
      ledgerChanged = appendLedger({
        timestamp: lastTs,
        asset,
        proposals,
        championId,
        decision: result.decision,
      });
    });

    if (nextFunnels) setFunnels(nextFunnels);
    if (Object.keys(championUpdates).length) setChampionByAsset((prev) => ({ ...prev, ...championUpdates }));
    if (Object.keys(proposalUpdates).length) setLatest((prev) => ({ ...prev, ...proposalUpdates }));
    if (ledgerChanged) setLedger(ledgerChanged);
    // `funnels` intentionally excluded — chained through nextFunnels within the pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  // ── Live gate resolution from the engine's own execution attempts ──
  useEffect(() => {
    let next: FunnelMap | null = null;
    // oldest first so counts accumulate chronologically
    [...executionAttempts].reverse().forEach((a) => {
      if (seenAttemptRef.current.has(a.id)) return;
      seenAttemptRef.current.add(a.id);
      next = recordExecutionAttempt(next ?? funnels, a, championByAsset);
    });
    if (next) setFunnels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionAttempts, championByAsset]);

  return { funnels, stats, ledger, championByAsset, latestProposals: latest };
}
