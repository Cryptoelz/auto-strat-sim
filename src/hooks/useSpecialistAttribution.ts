import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { buildMarketContext, runAllSpecialists } from '@/lib/specialists/registry';
import { selectChampion } from '@/lib/specialists/selector';
import { deriveStats, loadLedger, appendLedger, LedgerEntry } from '@/lib/specialists/stats';
import {
  FunnelMap, recordRound, recordExecutionAttempt, recordTradeOutcome,
} from '@/lib/specialists/attribution';
import {
  loadFunnelState, saveFunnelState, clearFunnelState, emptyPersistedState,
} from '@/lib/specialists/funnelStore';
import { SpecialistId, SpecialistProposal } from '@/lib/specialists/types';
import { Asset } from '@/types/trading';

/**
 * Attribution is driven by the LIVE engine:
 *  - one comparison round per asset per candle the engine actually evaluated
 *  - approved/rejected/executed resolved from the engine's ExecutionAttempt log
 *
 * State is persisted (see funnelStore) so counts survive navigation and
 * refresh, and de-duplication keys are persisted alongside so nothing is
 * counted twice. Read-only: nothing here influences execution.
 */
export function useSpecialistAttribution() {
  const { candles, executionAttempts, state } = useTradingContext();

  const initialRef = useRef(loadFunnelState());
  const [funnels, setFunnels] = useState<FunnelMap>(() => initialRef.current.funnels);
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => loadLedger());
  const [championByAsset, setChampionByAsset] = useState<Partial<Record<Asset, SpecialistId>>>(
    () => initialRef.current.championByAsset,
  );
  const [latest, setLatest] = useState<Record<string, SpecialistProposal[]>>({});

  const seenCandleRef = useRef<Partial<Record<Asset, number>>>({ ...initialRef.current.seenCandles });
  const seenAttemptRef = useRef<Set<string>>(new Set(initialRef.current.seenAttempts));
  const seenTradeRef = useRef<Set<string>>(new Set(initialRef.current.seenTrades));

  const stats = useMemo(() => deriveStats(ledger), [ledger]);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  // ── Persistence: single writer, mirrors the current institutional state ──
  const championRef = useRef(championByAsset);
  championRef.current = championByAsset;
  const persist = useCallback((map: FunnelMap) => {
    saveFunnelState({
      funnels: map,
      championByAsset: championRef.current,
      seenCandles: seenCandleRef.current,
      seenAttempts: [...seenAttemptRef.current],
      seenTrades: [...seenTradeRef.current],
    });
  }, []);

  const commit = useCallback((map: FunnelMap) => {
    setFunnels(map);
    persist(map);
  }, [persist]);

  /** Wipes the persisted attribution ledger (used by the dashboard reset). */
  const resetAttribution = useCallback(() => {
    clearFunnelState();
    const fresh = emptyPersistedState();
    seenCandleRef.current = {};
    seenAttemptRef.current = new Set();
    seenTradeRef.current = new Set();
    setChampionByAsset({});
    setFunnels(fresh.funnels);
  }, []);

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

    if (Object.keys(championUpdates).length) {
      championRef.current = { ...championRef.current, ...championUpdates };
      setChampionByAsset((prev) => ({ ...prev, ...championUpdates }));
    }
    if (nextFunnels) commit(nextFunnels);
    if (Object.keys(proposalUpdates).length) setLatest((prev) => ({ ...prev, ...proposalUpdates }));
    if (ledgerChanged) setLedger(ledgerChanged);
    // `funnels` intentionally excluded — chained through nextFunnels within the pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, commit]);

  // ── Live gate resolution from the engine's own execution attempts ──
  // Race-safe: an attempt that arrives before champion selection has committed
  // is queued (never dropped) and retried on every subsequent pass, while its
  // audit record is written to the attempt log immediately.
  useEffect(() => {
    let next: FunnelMap | null = null;
    let logChanged = false;
    const queue: ExecutionAttempt[] = [];

    // oldest first so counts accumulate chronologically
    [...executionAttempts].reverse().forEach((a) => {
      if (seenAttemptRef.current.has(a.id) || pendingAttemptsRef.current.some((p) => p.id === a.id)) return;
      queue.push(a);
    });
    // retry anything still awaiting champion resolution
    const retry = pendingAttemptsRef.current;
    pendingAttemptsRef.current = [];
    const all = [...retry, ...queue];

    all.forEach((a) => {
      const res = recordExecutionAttempt(next ?? funnels, a, championByAsset);
      if (res.deferred) {
        pendingAttemptsRef.current.push(a);
        // Record the audit entry once, even while unattributed.
        if (!attemptLogRef.current.some((r) => r.id === a.id)) {
          attemptLogRef.current = [...attemptLogRef.current, res.record].slice(-200);
          logChanged = true;
        }
        return;
      }
      seenAttemptRef.current.add(a.id);
      next = res.map;
      const idx = attemptLogRef.current.findIndex((r) => r.id === a.id);
      attemptLogRef.current = idx >= 0
        ? attemptLogRef.current.map((r, i) => (i === idx ? res.record : r))
        : [...attemptLogRef.current, res.record].slice(-200);
      logChanged = true;
    });

    if (next) commit(next);
    if (logChanged) {
      setAttemptLog(attemptLogRef.current);
      if (!next) persist(funnels);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionAttempts, championByAsset, commit, persist]);

  // ── Outcome resolution: closed trades complete the funnel (won / lessons) ──
  useEffect(() => {
    let next: FunnelMap | null = null;
    const trades = state.trades ?? [];
    const retry = pendingTradesRef.current;
    pendingTradesRef.current = [];
    const all = [
      ...retry,
      ...trades.filter((t) => !seenTradeRef.current.has(t.id) && !retry.some((r) => r.id === t.id)),
    ];

    all.forEach((t) => {
      const res = recordTradeOutcome(next ?? funnels, t, championByAsset);
      if (res.deferred) { pendingTradesRef.current.push(t); return; }
      seenTradeRef.current.add(t.id);
      next = res.map;
    });
    if (next) commit(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.trades, championByAsset, commit]);

  return {
    funnels, stats, ledger, championByAsset, latestProposals: latest,
    attemptLog,
    pendingAttempts: pendingAttemptsRef.current.length,
    resetAttribution,
    lastPersistedAt: initialRef.current.updatedAt,
  };
}

