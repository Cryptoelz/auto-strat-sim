# PROJECT INDEPENDENCE™ — Specialist Architecture Blueprint

Architecture only. No code changes in this deliverable. The current engine keeps running untouched until this blueprint is approved.

## 1. Current Architecture (verified)

- `src/hooks/useUnifiedTradingEngine.ts` is the only live loop. It generates exactly one signal per asset: an SMA 10/30 crossover with a 2-candle confirmation and a 1h HTF gate.
- `src/lib/executionSimulator.ts` (`openLong` / `openShort` / `closePosition`) is called from one place: `processSignals` in that hook.
- The five "specialists" (Trend Rider, Momentum Scalper v2, Mean Reversion, VCB, Low-Vol Coiler) exist as research/backtest logic and dashboards only. None of them can emit a live order.
- `src/lib/participationController.ts` (MPC v2) is not wired into the live loop.
- `src/hooks/useDualPaperTrading.ts` runs the same `evaluateStrategy` twice with different numbers ("Baseline v11" vs "Candidate 25") — one strategy, two labels.
- Independence score: 0/100. One strategy displayed five ways.

## 2. Target Architecture

Five autonomous engines, one governance layer, one execution surface.

```text
market data (candles, per asset, per timeframe)
        |
        +--> Trend Specialist        --\
        +--> Momentum Specialist      --\
        +--> Mean Reversion Specialist --> Comparison Engine --> Champion Selector
        +--> Volatility Specialist    --/         |
        +--> Breakout Specialist     --/          v
                                        Risk -> Portfolio -> Allocation
                                                     |
                                              Governance -> Executive Decision
                                                     |
                                                 Execution (single simulator)
                                                     |
                                        Attribution -> per-specialist Learning Store
```

Rules: no specialist imports another specialist; no shared mutable state; each owns its indicators, thresholds, stats and learning record. Only the champion's proposal ever reaches execution, and execution stays behind the existing simulator (paper only).

## 3. Specialist Contract

New `src/lib/specialists/types.ts`:

```ts
interface SpecialistProposal {
  specialistId: SpecialistId;
  asset: Asset;
  regime: MarketRegime;              // own detection
  signal: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;                // 0-100, own scale, own calibration
  risk: number;                      // 0-100
  expectedReward: number;            // R multiple
  expectedValue: number;             // confidence-weighted R
  suggestedSizePercent: number;
  suggestedStop: number;
  suggestedTarget: number;
  evidence: Evidence[];              // indicator name, value, threshold, pass/fail
  reasoning: string[];               // plain English
  institutionScore: number;          // 0-100 self-assessed quality
  timestamp: number;
}

interface Specialist {
  id: SpecialistId;
  meta: { name: string; mission: string; timeframe: Timeframe };
  analyse(ctx: MarketContext): SpecialistProposal;   // pure, deterministic
  onOutcome(event: LearningEvent): void;             // own store only
  stats(): SpecialistStats;
}
```

`MarketContext` is a read-only snapshot (candles per timeframe, price, ATR series, volume, asset profile). Passing it is the only shared dependency.

Engines, each in its own file with its own indicators:
1. **Trend** — SMA/EMA stack, ADX-style slope, HTF alignment; trailing exits.
2. **Momentum** — rate-of-change, volume expansion, 10-candle breakout, tight stop, fast profit take.
3. **Mean Reversion** — RSI/Bollinger deviation from anchor, fade entries, mid-band target.
4. **Volatility** — ATR percentile compression/expansion, BB width rank, expansion trigger.
5. **Breakout** — 20-candle structural highs/lows, retest confirmation, volume filter.

## 4. Execution Flow (per confirmed candle close)

1. Build `MarketContext` for the asset.
2. Run all five `analyse()` calls independently (order irrelevant, no cross-reads).
3. Comparison Engine records all five proposals to the decision ledger — including WAITs.
4. Champion Selector scores each proposal: historical performance, confidence (calibrated), regime fit, risk, expected value, governance standing, research quality, evidence strength. Weighted score; a `WAIT` can win, in which case no order is placed.
5. Champion proposal → Risk Engine (`riskManager.ts`) → Portfolio Manager → Allocation → Governance (`governanceEngine.ts`) → Executive Decision → `executionSimulator`.
6. Outcome and every block/rejection is attributed back to the originating specialist only.

Signals still execute exclusively on confirmed candle closes with the existing 1-candle delay, fees and slippage.

## 5. Data Flow and Storage

- `specialistRegistry.ts` — registration, enable/disable, no cross-talk.
- `specialistLedger.ts` — append-only proposal log (all specialists, every candle), source of truth for the comparison and audit views.
- `specialistStats.ts` — per-specialist Win Rate, Drawdown, PF, Sharpe, Sortino, EV, Alpha vs institution, Opportunity Cost, Correct/Incorrect Waits, Research Score, Institution Rating.
- `specialistLearning.ts` — per-specialist event stream (trade, rejection, missed opportunity, governance block, lesson, attribution) with isolated adaptation state; advisory-only adjustments, never silent parameter drift.
- Persistence via the existing localStorage state layer with a versioned key; capped history like the current session store.

## 6. Executive Dashboard (new page `/specialist-board`)

Specialist Executive Board: live proposal grid (specialist / signal / confidence / EV / regime), Champion, Runner-up, Weakest, Most Improving, Most Conservative, Most Aggressive, Most Accurate, Highest Alpha, Highest Confidence, Largest Drawdown, plus a champion-selection audit panel showing why the winner won. Existing pages unchanged.

## 7. Migration Strategy (5 phases, engine untouched until Phase 4)

- **P1 Contract + registry** — types, registry, ledger, stats scaffolding. No behaviour change.
- **P2 Five engines in shadow** — implemented and run read-only alongside the live engine; proposals logged, nothing executed. Board page becomes live-observable here.
- **P3 Comparison + champion selection** — selector runs in shadow, its would-be decisions logged against actual engine decisions for divergence analysis.
- **P4 Execution switch behind a flag** — `executionSource: 'legacy' | 'specialists'`, default `legacy`. Champion path wired through the existing risk/portfolio/governance chain into the same simulator.
- **P5 Legacy retirement** — only after the success criteria below; legacy loop archived, not deleted.

## 8. Compatibility

Mission Control, Executive Intelligence, Institution Daily, Trade Review, Opportunity Analysis, Performance Attribution, Audit Vault, Institution Memory, Oracle, Production Readiness and Executive Decision Centre all read existing state shapes. Those shapes are additive-only: trades gain an optional `specialistId`, and new stores sit beside the current ones. Nothing existing is renamed or removed, so every listed module keeps working through all five phases.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Five engines multiply signal count and overtrade | Portfolio exposure caps and governance sit after champion selection, unchanged |
| Hidden coupling reappears via shared helpers | Contract test asserts each engine imports no other engine; `MarketContext` read-only |
| Confidence scales not comparable across engines | Selector uses calibrated confidence (historical hit rate per bucket), not raw values |
| Compute cost per candle | Deterministic pure functions, memoised indicator series per asset |
| Downstream dashboards misread new fields | All new fields optional; shadow mode proves parity before the flag flips |
| Learning loops overfit small samples | Adaptation gated at 20+ outcomes, advisory-only, human-approved |

## 10. Testing Plan

- Unit tests per engine: fixed candle fixtures → expected proposal (deterministic).
- Independence test: static import-graph assertion, no specialist-to-specialist edges.
- Contract test: every registered specialist returns a fully populated proposal for every fixture.
- Selector tests: tie-breaks, WAIT-wins, governance veto, regime mismatch.
- Integration: shadow run over 30 days of candles, compare champion decisions vs legacy for divergence and PF/DD/WR impact.
- Regression: existing `governance.test.ts`, `riskManager.test.ts`, `orchestration.test.ts`, `persistence.test.ts`, `executionSimulator.test.ts` must stay green.

## 11. Rollback Plan

Single flag `executionSource` returns the system to the legacy loop instantly; legacy code untouched through P4. Specialist stores are separate keys and can be cleared without affecting existing state. If P5 is reached and later regresses, the archived legacy loop is restored from `src/lib/archive/`.

## 12. Success Criteria

- Independence score 100/100 (zero cross-specialist imports, five distinct entry logics with divergent signals on the same candles).
- Shadow period: at least 30 days and 50 champion decisions, with at least three different specialists winning at least once.
- Champion path PF >= legacy PF, drawdown no worse than legacy, capture rate improved on the previously missed sub-threshold moves.
- All eleven listed modules functional throughout.

## 13. Estimated Engineering Effort

| Phase | Scope | Effort |
| --- | --- | --- |
| P1 | Contract, registry, ledger, stats | 1 sprint-unit |
| P2 | Five independent engines + board page | 3 |
| P3 | Comparison + champion selector + audit panel | 1.5 |
| P4 | Flagged execution wiring + integration tests | 1.5 |
| P5 | Legacy retirement, docs, certification | 1 |

Total ~8 units, sequential; P2 engines are parallelisable across five workstreams.

## Approval

Nothing is built until you approve. On approval I recommend starting with P1 + P2 shadow mode so you can watch five genuinely different opinions form before anything is allowed to trade.
