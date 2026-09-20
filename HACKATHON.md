# CMC Hackathon — CoinMarketCap Enrichment Module

Option 1 (Parallel CMC Enrichment Adapter). CoinMarketCap data is **read-only enrichment**. It does
not generate trades, alter signals, specialist decisions, risk, allocation, backtests, or replace
Binance candles.

---

## Stage 1 — Safe Isolated Foundation

### 1. Files created

| File | Purpose |
| --- | --- |
| `supabase/functions/cmc-proxy/index.ts` | Server-side proxy holding the CMC API key. Endpoint allow-list, no key in responses, no logging. |
| `src/lib/cmc/config.ts` | `CMC_ENABLED` feature flag, proxy name, provenance labels, read-only marker. |
| `src/lib/cmc/symbols.ts` | Extensible symbol translation layer (BTCUSDT ↔ BTC, …) with suffix fallback. |
| `src/lib/cmc/types.ts` | Normalised CMC types (quote, global metrics, fear & greed) with provenance field. |
| `src/lib/cmc/client.ts` | Transport: invokes the proxy function only; disabled when the flag is off. |
| `src/lib/cmc/adapter.ts` | Normalises raw CMC payloads before any consumer sees them. |
| `src/lib/cmc/index.ts` | Module barrel. |
| `src/hooks/useCmcMarketData.ts` | Read-only enrichment hook used by the CMC page only. |
| `src/components/cmc/DataSourceBadge.tsx` | Explicit LIVE CMC / LIVE BINANCE / SEEDED labelling. |
| `src/components/cmc/CmcDisabledNotice.tsx` | Rendered when the feature flag is off. |
| `src/pages/cmc/CmcMarketIntelligence.tsx` | `/cmc/market-intelligence` dashboard. |
| `HACKATHON.md` | This document. |

### 2. Existing files modified

| File | Change |
| --- | --- |
| `src/App.tsx` | Added one lazy import, one `CMC_ENABLED` import, and one flag-guarded route inside the `/cmc/*` namespace. No other routes touched. |
| `src/components/AppSidebar.tsx` | Added one flag-guarded "CMC Hackathon" nav section with a single entry. |
| `package.json` / `supabase/config.toml` / `src/integrations/supabase/*` | Generated automatically when the backend was enabled to provide the server function runtime. |

### 3. Backend / security architecture

- The CoinMarketCap key is stored only as the backend secret `CMC_API_KEY`.
- Browser code never sees the key: it calls the `cmc-proxy` server function, which injects the
  `X-CMC_PRO_API_KEY` header server-side.
- The proxy accepts only an allow-listed endpoint alias (`quotes`, `listings`, `global`, `info`,
  `fearGreed`) plus scalar query params — no arbitrary URL passthrough.
- Errors return a sanitised message and code; upstream headers and key material are never echoed or
  logged.

### 4. CMC endpoints prepared

| Alias | CMC path |
| --- | --- |
| `quotes` | `/v1/cryptocurrency/quotes/latest` |
| `listings` | `/v1/cryptocurrency/listings/latest` |
| `global` | `/v1/global-metrics/quotes/latest` |
| `info` | `/v2/cryptocurrency/info` |
| `fearGreed` | `/v3/fear-and-greed/latest` |

### 5. Feature-flag behaviour

`CMC_ENABLED` in `src/lib/cmc/config.ts`:

- `false` → the `/cmc/*` route is not registered, the sidebar section disappears, `callCmc` short-circuits
  without any network call, and the hook performs no work. No other module changes behaviour.
- `true` → the module is active.

### 6. Isolation boundary

```text
CMC proxy (server) -> src/lib/cmc/* -> useCmcMarketData -> src/pages/cmc/* + src/components/cmc/*
```

Nothing flows in the other direction. No trading, signal, specialist, risk, portfolio, governance,
attribution, approval-analysis, backtest, Binance market-data, or existing test file imports
`src/lib/cmc/*`.

### 7. Rollback procedure

1. Set `CMC_ENABLED = false` in `src/lib/cmc/config.ts` (instant, zero-risk disable), or
2. Full removal: delete `src/lib/cmc/`, `src/components/cmc/`, `src/pages/cmc/`,
   `src/hooks/useCmcMarketData.ts`, `src/test/cmcIntelligence.test.ts`,
   `supabase/functions/cmc-proxy/`, then revert the three added lines in `src/App.tsx` and the nav
   block plus import in `src/components/AppSidebar.tsx`.
3. Delete the `CMC_API_KEY` secret.

---

## Stage 2 — Market Intelligence Layer

Analysis and visualisation only. No CMC value enters signal generation, trade approval, allocation,
risk, execution or backtesting.

### A. Files created

| File | Purpose |
| --- | --- |
| `src/lib/cmc/cache.ts` | TTL cache, refresh-spacing guard, 429 detection, request/credit statistics. |
| `src/lib/cmc/intelligence.ts` | Deterministic breadth and snapshot calculations. |
| `src/lib/cmc/format.ts` | Display formatting helpers (USD, supply, percent, tone class). |
| `src/components/cmc/MarketRegimePanel.tsx` | CMC Market Regime panel (factual global conditions). |
| `src/components/cmc/MarketBreadthPanel.tsx` | CMC Market Breadth panel (1h / 24h / 7d, strongest / weakest). |
| `src/components/cmc/IntelligenceSnapshotPanel.tsx` | Deterministic CMC Intelligence Snapshot. |
| `src/components/cmc/CmcDiagnosticsPanel.tsx` | API usage diagnostics and per-endpoint status. |
| `src/components/cmc/CmcProvenanceNote.tsx` | Data provenance / methodology statement. |
| `src/test/cmcIntelligence.test.ts` | 5 unit tests for breadth and snapshot arithmetic. |

### B. Files modified

| File | Change |
| --- | --- |
| `src/lib/cmc/client.ts` | Cache-aware `callCmc` with `force`, TTL, throttle guard, 429 flag, stale fallback. |
| `src/lib/cmc/adapter.ts` | Added CMC numeric ID, circulating supply, 24h volume change; forwards cache/stale metadata. |
| `src/lib/cmc/types.ts` | Added `cmcId`, `circulatingSupply`, `volumeChange24h`, `fromCache`, `stale`. |
| `src/lib/cmc/index.ts` | Exports the new intelligence and cache modules. |
| `src/hooks/useCmcMarketData.ts` | Per-endpoint status, stale flag, rate-limit flag, refresh cooldown, request stats. |
| `src/pages/cmc/CmcMarketIntelligence.tsx` | Composed the Stage 2 panels and expanded the tracked-asset table. |

No file outside `src/lib/cmc`, `src/components/cmc`, `src/pages/cmc`, `src/hooks/useCmcMarketData.ts`
and the new test was modified in Stage 2.

### C. Endpoints used

`quotes` (`/v1/cryptocurrency/quotes/latest`), `global` (`/v1/global-metrics/quotes/latest`),
`fearGreed` (`/v3/fear-and-greed/latest`). Breadth reuses the existing quotes payload — no extra call.

### D. Calculations introduced

- **Breadth per window (1h / 24h / 7d):** positive = `change > 0`, negative = `change < 0`,
  flat = remainder; `positivePct = positive / total * 100`.
- **Strongest / weakest:** max / min of `percentChange24h` across tracked quotes.
- **Snapshot:** sentiment (`classification (value/100)`), participation (`positive of total`),
  dominance (BTC / ETH %), breadth (% positive / % negative), top and weakest performer,
  total market-cap and volume change. All string formatting of already displayed numbers — no model
  generated commentary, no recommendation, no BUY/SELL/LONG/SHORT language.

### E. Caching / rate protection

- Responses cached per endpoint+params for `CMC_TTL_MS` = 120 s; renders and remounts reuse the cache.
- Network calls per key spaced at least `CMC_MIN_REFRESH_MS` = 15 s; manual refresh inside that window
  serves the cache and shows a "Refresh throttled" notice.
- Concurrent loads are suppressed by an in-flight guard.
- HTTP 429 (or any "rate limit" message) is detected and surfaced as a distinct banner.
- Diagnostics panel exposes proxy requests, cache hits, throttled refreshes, errors, 429 count, TTL,
  spacing and last request time. No key material is exposed.

### F. Failure behaviour

| Scenario | Behaviour |
| --- | --- |
| CMC API unavailable | Last known good snapshot kept, `STALE DATA` badge, error banner. No substitution. |
| Invalid response | Proxy returns a sanitised error; the adapter returns `data: null` and the UI reports it. |
| 429 rate limit | Dedicated rate-limit banner, cached snapshot retained, counter incremented. |
| One endpoint fails | Other panels keep their live values; only the failing endpoint shows FAILED / STALE. |
| Feature flag off | Route and nav entry disappear; the page renders the disabled notice; no network calls. |
| Any CMC failure | Contained in the CMC module — the rest of CryptoTrader is unaffected. |

### G. Data provenance rules

Every panel carries the `LIVE CMC DATA` badge and the page shows `Last retrieved <timestamp>` plus the
last known good time when stale. The Provenance & Methodology card states the source, the proxy, the
read-only guarantee, Binance separation, and that seeded/research data is never mixed in.

### H. Confirmation

- CMC remains strictly read-only enrichment; `CMC_READ_ONLY = true`.
- Trading and simulation logic is unchanged: no protected file was modified in Stage 2.
- Regression: 79/79 pre-existing tests pass (84 total with the 5 new CMC tests); production build passes;
  no API key appears in source or bundle.

---

## Stage 3B — CMC Decision Context™ (Option A)

Auditable capture of the CoinMarketCap market environment surrounding decisions the
existing CryptoTrader engine produces **independently**. CMC is context, never cause.

### A. Architecture (observer pattern)

```
Trading Engine (unmodified)
      ↓
TradingContext.executionAttempts   ← existing public decision/event stream
      ↓
useCmcDecisionContext              ← read-only observer, CMC-owned
      ↓
atlas_cmc_context_v1               ← CMC-owned localStorage store
```

There is no dependency from any trading module back into CMC — asserted at runtime on the
page and by an automated test that greps the protected modules for CMC imports.

### B. Files created

| File | Purpose |
| --- | --- |
| `src/lib/cmc/decisionContext.ts` | Snapshot capture + pure record construction, data-state resolution, diagnostics |
| `src/lib/cmc/contextStore.ts` | `atlas_cmc_context_v1` persistence, de-duplication by event ID, 500-record cap |
| `src/lib/cmc/isolationCheck.ts` | Runtime isolation checks behind the ISOLATION VERIFIED badge |
| `src/hooks/useCmcDecisionContext.ts` | Read-only observer of `executionAttempts` |
| `src/components/cmc/CmcExplainabilityPanel.tsx` | Context-never-cause statement |
| `src/components/cmc/CmcJudgeEvidencePanel.tsx` | HACKATHON EVIDENCE panel |
| `src/components/cmc/CmcContextDiagnosticsPanel.tsx` | Capture/cache/stale/unavailable/extra-call counters |
| `src/components/cmc/CmcDecisionContextTable.tsx` | Timeline table + per-record provenance dialog |
| `src/pages/cmc/CmcDecisionContext.tsx` | `/cmc/decision-context` page |
| `src/test/cmcDecisionContext.test.ts` | 11 Stage 3B tests |

### C. Existing files modified (minimal wiring only)

- `src/App.tsx` — one lazy import, one `CMC_ENABLED`-guarded route.
- `src/components/AppSidebar.tsx` — one nav item inside the existing CMC Hackathon section.
- `src/lib/cmc/index.ts` — three re-exports (inside the CMC boundary).
- `HACKATHON.md` — this section.

No protected trading/simulation/specialist/risk/governance/backtest file was touched.
ApprovalAnalysis was not modified.

### D. Snapshot schema

Event: context ID, event ID, timestamp, asset, decision type, decision outcome, engine detail.
CMC context: total market cap, market-cap 24h change, total 24h volume, volume 24h change,
BTC dominance, ETH dominance, Fear & Greed value + classification, tracked-asset breadth
1h/24h/7d, asset CMC rank, asset 1h/24h/7d change.
Provenance: `source = CoinMarketCap`, `purpose = research context`, `causalInfluence = false`,
`fetchedAt`, `snapshotAgeMs`, `cacheStatus`, `stale`, `unavailableReason`.
Any missing value is stored as `null` and displayed as unavailable — never fabricated.

### E. API / cache behaviour

`captureContextSnapshot()` calls the adapters with `force: false`, so a valid 120s cache is
reused and **zero** network requests are made. Network calls performed during capture are
measured (not assumed) by diffing `getCmcRequestStats().networkRequests` and are surfaced as
"Additional API calls from Decision Context". Refresh throttling, 429 handling and
last-known-good behaviour from Stage 2 are untouched. One snapshot is taken per batch of new
events, not per event.

### F. Failure behaviour

CMC failure records `CONTEXT UNAVAILABLE`, or the last known snapshot explicitly marked
`STALE`. Capture runs in a try/catch inside an effect that only reads already-published engine
output, so CMC cannot block signal generation, specialist evaluation, risk, governance, paper
execution or the simulation. With `CMC_ENABLED = false` there is no route, no nav item, no
capture and no network activity.

### G. Evidence produced

Timeline joining each engine decision to the CMC conditions at that instant, per-record
provenance dialog, diagnostics counters, runtime isolation checks, and the HACKATHON EVIDENCE
panel (contexts recorded, CMC source, API calls saved by caching, stale/unavailable counts,
trading engine modified: NO, CMC causal influence: NONE, simulation only).

### H. Test results

- Baseline before Stage 3B: 84/84 pass.
- After Stage 3B: **95/95 pass** (84 unchanged + 11 new CMC tests). No existing test modified.
- `tsgo --noEmit` clean; production build passes; no API key in source or bundle.

### I. Rollback

Set `CMC_ENABLED = false` in `src/lib/cmc/config.ts`, or delete
`src/lib/cmc/{decisionContext,contextStore,isolationCheck}.ts`,
`src/hooks/useCmcDecisionContext.ts`, the Stage 3B components, `src/pages/cmc/CmcDecisionContext.tsx`
and `src/test/cmcDecisionContext.test.ts`, then revert the two lines in `App.tsx` and the one
nav entry in `AppSidebar.tsx`. Stored records can be cleared with the page's "Clear context log"
button or by removing the `atlas_cmc_context_v1` key.

---

## Stage 3C — Persistent Engine Audit Ledger (minimum safe version)

### A. One-way architecture

```
TRADING ENGINE — UNMODIFIED
        ↓  logDecision()
src/lib/logger.ts  (existing public subscribeToLog / getLogEntries)
        ↓  passive subscription
AUDIT OBSERVER  (useEngineAuditObserver, mounted once in App)
        ↓
atlas_engine_audit_v1  (localStorage ledger)
        ↓  read-only
CMC DECISION CONTEXT  (atlas_cmc_context_v1)
```

There is no dependency in the opposite direction: no trading, signal, specialist, risk,
governance, allocation, execution or backtest module imports `src/lib/audit/**` or
`src/lib/cmc/**` (asserted by test).

### B. Genuine event source

`src/lib/logger.ts` only — the engine's existing decision log. Captured event types are those
the engine already emits: `blocked`, `risk_pause`, `opened_long`, `opened_short`, `closed_long`,
`closed_short`, `flipped`. Execution attempts, specialist HOLD and the specialist ledger are
deliberately NOT wired in at this stage.

### C. Files created

- `src/lib/audit/config.ts` — `AUDIT_ENABLED`, `atlas_engine_audit_v1`, 1000-event cap.
- `src/lib/audit/types.ts` — `EngineAuditEvent`, `AuditSummary`, `AuditStorageStatus`.
- `src/lib/audit/auditLedger.ts` — `toAuditEvent`, `dedupeAppend`, `summariseAudit`,
  persisted observable store (`getAuditEvents`, `subscribeToAudit`, `recordLoggerEntries`,
  `clearAuditLedger`, `resetAuditCache`, `getAuditStorageStatus`, `exportAuditJson`).
- `src/hooks/useEngineAuditLedger.ts` — `useEngineAuditObserver` (capture) and
  `useEngineAuditLedger` (read-only view).
- `src/components/audit/EngineAuditObserver.tsx` — renders nothing; app-level mount point.
- `src/components/audit/EngineAuditTable.tsx` — evidence table.
- `src/pages/audit/EngineDecisionAudit.tsx` — ENGINE DECISION AUDIT™ page.
- `src/test/engineAudit.test.ts` — 12 tests.

### D. Files modified

- `src/App.tsx` — one flag import, one component import, one lazy page import, one mounted
  `<EngineAuditObserver />`, one guarded route.
- `src/components/AppSidebar.tsx` — one flag import, one nav item.
- `src/hooks/useCmcDecisionContext.ts` — CMC-owned; event source switched from
  `executionAttempts` to the persisted audit ledger.
- `HACKATHON.md` — this section.

### E. Schema

`eventId`, `timestamp`, `asset`, `eventType`, `signal`, `explanation`, `regime`,
`filterBlocked`, `sourceModule: 'logger'`, `capturedAt`,
`provenance: { engineModified: false, observerOnly: true }`. Fields the engine did not supply
are recorded as `null` — never inferred, never fabricated.

### F. Persistence, deduplication, retention

`localStorage` key `atlas_engine_audit_v1`, `{ version, events, updatedAt }`. Deduplication by
the immutable logger event id; retention bounded at 1000 events (oldest dropped). Reads and
writes are wrapped in try/catch: corrupt JSON yields an empty ledger, a quota error flags
storage unavailable, and neither throws.

### G. Failure isolation

Capture runs in an effect after the logger has already published. Every capture path is
try/catch-guarded, listener errors are swallowed, and no audit code path calls into the engine.
Audit failure therefore cannot block signal generation, specialist evaluation, risk, governance
or paper execution. CMC failure leaves the genuine audit record intact and only produces
`CONTEXT UNAVAILABLE`.

### H. CMC attachment order

1. Engine creates the decision → 2. logger publishes it → 3. audit observer persists it →
4. the CMC observer sees the persisted audit event → 5. CMC context is attached afterwards and
joined by `eventId`, with `causalInfluence = false`. When `AUDIT_ENABLED` is false the CMC
observer has no source and captures nothing (fails safe).

### I. Tests

12 new tests: genuine capture without inference, survives store reload, duplicate rejection,
1000-event retention, corrupt storage, storage-write failure not affecting the logger, disabled
observer writes nothing, export contains only genuine records, CMC derives from a persisted
audit event, CMC unavailable leaves the audit event intact, no protected trading module imports
audit/CMC, no specialist module imports audit/CMC.

Result: **107/107 pass** (95 baseline unchanged + 12 new). `tsgo --noEmit` clean, production
build passes.

### J. Protected files

Byte-identical: `useUnifiedTradingEngine.ts`, `logger.ts`, `TradingContext.tsx`,
`signalEngine.ts`, `filters.ts`, `indicators.ts`, `executionSimulator.ts`, `riskManager.ts`,
`portfolioManager.ts`, `governanceEngine.ts`, `src/lib/specialists/*`, `funnelStore.ts`,
`attribution.ts`, `approvalAnalysis.ts`, `backtest-engine.ts`, `liveMarketData.ts`,
`marketData.ts`.

### K. Rollback

Set `AUDIT_ENABLED = false` in `src/lib/audit/config.ts` — no capture, no storage writes, no
route, no nav entry, engine unchanged. Full removal: delete `src/lib/audit/**`,
`src/hooks/useEngineAuditLedger.ts`, `src/components/audit/**`, `src/pages/audit/**` and
`src/test/engineAudit.test.ts`; revert the four lines in `App.tsx`, the two in `AppSidebar.tsx`
and the event source in `useCmcDecisionContext.ts`. Removing the `atlas_engine_audit_v1` key
deletes all audit data with zero effect on CryptoTrader.

### L. Evidence methodology

Evidence is only ever the engine's own events: the observer copies logger entries verbatim and
persists them. Nothing is inserted manually, no threshold is loosened, and the JSON export
contains exactly the persisted genuine records. Page: `/audit/engine-decisions`.

## Stage 3C repair — audit persistence asymmetry

The logger's buffer is in-memory (200 entries, lost on reload) while completed simulated trades
are persisted by the engine. The audit ledger therefore showed 0 events while Paper Trading held
43 genuine trades. Repair: a SECOND, clearly-labelled audit source.

- Primary live source unchanged: `subscribeToLog` / `getLogEntries` (contemporaneous).
- Secondary source: `TradingContext.state.trades` — the engine's already-public, already-persisted
  completed-trade history, read-only, deduplicated by the engine's immutable trade id
  (`trade:<id>`). Reload, rerender and observer remount cannot create duplicates.
- Trade-sourced records are always `sourceModule: 'trades'`, `backfilled: true`,
  `contextContemporaneous: false` — observed strictly AFTER execution.
- CMC context is NEVER attached to non-contemporaneous records; the UI shows
  `CMC CONTEXT: UNAVAILABLE — RETROSPECTIVE`. No historical snapshot is reconstructed or faked.
- Provenance preserved: `engineModified: false`, `observerOnly: true`, `causalInfluence: false`.

Files modified: `src/lib/audit/types.ts`, `src/lib/audit/auditLedger.ts`
(`recordCompletedTrades`, `toTradeAuditEvent`, `tradeEventId`, legacy-record normalisation),
`src/hooks/useEngineAuditLedger.ts` (`useCompletedTradeAuditObserver`),
`src/components/audit/EngineAuditObserver.tsx`, `src/components/audit/EngineAuditTable.tsx`
(Source + CMC context columns), `src/pages/audit/EngineDecisionAudit.tsx` (live vs backfilled
counters), `src/hooks/useCmcDecisionContext.ts` (skips non-contemporaneous records),
`src/App.tsx` (observer mount removed), `src/components/AppLayout.tsx` (observer mounted inside
`TradingProvider`), `src/test/engineAudit.test.ts` (+8 tests).

No protected trading file was modified. Tests: 108 -> 116 passing.
