# ATLAS OS™

## Build with CMC: API Hackathon

### What is ATLAS OS?

ATLAS OS is a **simulation-only crypto trading research platform**. It runs a paper-trading
engine end to end — market data in, signals and risk checks applied, simulated orders filled,
results recorded — so every decision can be inspected after the fact.

**No live orders are ever placed.** There is no real exchange account, no leverage and no
private exchange key anywhere in the system.

CoinMarketCap data is used as an **independent market-context and explainability layer**. It
describes the environment a decision was made in. It **cannot** alter trading signals, filters,
position sizing or execution — there is no code path from CoinMarketCap back into the engine,
and that boundary is asserted by automated tests.

---

### Live Demo

**Application:** https://auto-strat-sim.lovable.app

> **Judge evidence page (start here):** https://auto-strat-sim.lovable.app/cmc/evidence
> — one-screen explanation of the CMC integration, the genuine evidence behind it, and a
> one-click JSON evidence export.

| Page | Path | What it shows |
| --- | --- | --- |
| CMC Evidence Summary | [`/cmc/evidence`](https://auto-strat-sim.lovable.app/cmc/evidence) | Integration explanation, verified evidence totals, integrity checks, JSON export |
| CMC Market Intelligence | [`/cmc/market-intelligence`](https://auto-strat-sim.lovable.app/cmc/market-intelligence) | Live CMC market regime, breadth and deterministic snapshot |
| CMC Decision Context | [`/cmc/decision-context`](https://auto-strat-sim.lovable.app/cmc/decision-context) | Engine decisions joined to the CMC conditions captured at that instant |
| Engine Decision Audit | [`/audit/engine-decisions`](https://auto-strat-sim.lovable.app/audit/engine-decisions) | Persistent audit ledger of genuine engine events and completed simulated trades |

Audit and CMC evidence are stored per browser (local storage), so a judge opening the app starts
from an empty ledger — the exported evidence file is the portable record.

---

### CoinMarketCap Integration

Three CoinMarketCap endpoints are used, nothing else:

| Endpoint | What it provides |
| --- | --- |
| `cryptocurrency/quotes/latest` | Tracked-asset context: price, market cap, 24h volume, 1h/24h/7d change, CMC rank |
| `global-metrics/quotes/latest` | Market regime context: total market cap, total 24h volume, BTC and ETH dominance |
| `fear-and-greed/latest` | Sentiment context: fear & greed value and classification |

Tracked assets: BTC, ETH, SOL, XRP, FET, XLM.

```text
CMC_READ_ONLY   = true
causalInfluence = false
```

Every CMC request goes through the **server-side `cmc-proxy`** function. The proxy injects the
`X-CMC_PRO_API_KEY` header server-side, accepts only an allow-listed set of endpoint aliases
(no arbitrary URL passthrough), and returns sanitised errors. **The CMC API key is never present
in browser code, source, bundles or exports.**

Requests are cached per endpoint for 120s with a 15s minimum spacing, a concurrent-load guard,
explicit HTTP 429 detection and last-known-good retention, so repeated renders cost no credits.

---

### Architecture

The relationship between the engine and CoinMarketCap is strictly one-way:

```text
Trading Engine (unmodified)
      ↓
Logger / Trade History  (existing engine output)
      ↓
Engine Audit Ledger     (atlas_engine_audit_v1)
      ↓
CMC Context Observer    (read-only, attaches context afterwards)
      ↓
CMC Evidence
```

CMC data is attached **after** an engine decision has already been produced and persisted.
**CMC cannot feed back into or modify the trading engine** — no trading, signal, specialist,
risk, portfolio, governance, execution or backtest module imports the CMC or audit modules,
which is verified by an import-boundary test and re-checked at runtime on the evidence page.

---

### Evidence & Integrity

- **CMC integration:** ACTIVE (feature-flag gated)
- **Engine influence from CMC:** NONE (`causalInfluence = false`)
- **Simulation:** PAPER ONLY — no live orders
- **Audit ledger:** VERIFIED — persistent, deduplicated by the engine's own immutable event /
  trade ids, bounded at 1000 records
- **API key:** SERVER-SIDE ONLY (`cmc-proxy`)
- **Evidence export:** one JSON bundle from the CMC Evidence Summary (totals, classifications,
  captured context records, integrity and cache statistics, isolation checks, limitations)
- **Context states:** every record is labelled `LIVE` / `CACHED` / `STALE` / `UNAVAILABLE`
- **Missing data is never fabricated** — unavailable values stay `null` and render as
  `UNAVAILABLE`; stale data is kept and labelled, never silently replaced
- **Historical / backfilled trades** are labelled `BACKFILLED COMPLETED TRADE` and shown as
  `CMC CONTEXT UNAVAILABLE — RETROSPECTIVE`; past snapshots are never reconstructed
- **Automated evidence:** 127 tests passing, typecheck clean, production build passing;
  protected trading modules unchanged

Detailed technical and stage-by-stage documentation lives in
[`HACKATHON.md`](HACKATHON.md).

---

### Limitations

- Simulation only — no live orders are placed against any exchange.
- No leverage, no margin, no private exchange keys.
- CMC is **context, never cause**: it cannot change a signal, filter, position size or execution.
- Backfilled completed trades are observed after execution and can never carry contemporaneous
  CMC context.
- The free CMC tier provides current snapshots, not historical OHLCV, so past context cannot be
  reconstructed.
- The genuine event sample is small; the figures shown are **descriptive integration evidence,
  not a claim of trading performance**. No win-rate, profitability, statistical-significance or
  predictive-advantage claim is computed anywhere in this project.

---

### Repository

This is the public source repository for the **ATLAS OS** submission to the
**Build with CMC: API Hackathon**.
