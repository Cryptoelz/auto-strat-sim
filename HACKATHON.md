# CMC Hackathon — Stage 1: Safe Isolated Foundation

Option 1 (Parallel CMC Enrichment Adapter). CoinMarketCap data is **read-only enrichment**. It does
not generate trades, alter signals, specialist decisions, risk, allocation, backtests, or replace
Binance candles.

## 1. Files created

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

## 2. Existing files modified

| File | Change |
| --- | --- |
| `src/App.tsx` | Added one lazy import, one `CMC_ENABLED` import, and one flag-guarded route inside the `/cmc/*` namespace. No other routes touched. |
| `src/components/AppSidebar.tsx` | Added one flag-guarded "CMC Hackathon" nav section with a single entry. |
| `package.json` / `supabase/config.toml` / `src/integrations/supabase/*` | Generated automatically when the backend was enabled to provide the server function runtime. |

## 3. Backend / security architecture

- The CoinMarketCap key is stored only as the backend secret `CMC_API_KEY`.
- Browser code never sees the key: it calls the `cmc-proxy` server function, which injects the
  `X-CMC_PRO_API_KEY` header server-side.
- The proxy accepts only an allow-listed endpoint alias (`quotes`, `listings`, `global`, `info`,
  `fearGreed`) plus scalar query params — no arbitrary URL passthrough.
- Errors return a sanitised message and code; upstream headers and key material are never echoed or
  logged.

## 4. CMC endpoints prepared

| Alias | CMC path |
| --- | --- |
| `quotes` | `/v1/cryptocurrency/quotes/latest` |
| `listings` | `/v1/cryptocurrency/listings/latest` |
| `global` | `/v1/global-metrics/quotes/latest` |
| `info` | `/v2/cryptocurrency/info` |
| `fearGreed` | `/v3/fear-and-greed/latest` |

## 5. Feature-flag behaviour

`CMC_ENABLED` in `src/lib/cmc/config.ts`:

- `false` → the `/cmc/*` route is not registered, the sidebar section disappears, `callCmc` short-circuits
  without any network call, and the hook performs no work. No other module changes behaviour.
- `true` → the module is active.

## 6. Isolation boundary

```
CMC proxy (server) -> src/lib/cmc/* -> useCmcMarketData -> src/pages/cmc/*
```

Nothing flows in the other direction. No trading, signal, specialist, risk, portfolio, governance,
attribution, approval-analysis, backtest, Binance market-data, or test file imports `src/lib/cmc/*`.

## 7. Rollback procedure

1. Set `CMC_ENABLED = false` in `src/lib/cmc/config.ts` (instant, zero-risk disable), or
2. Full removal: delete `src/lib/cmc/`, `src/components/cmc/`, `src/pages/cmc/`,
   `src/hooks/useCmcMarketData.ts`, `supabase/functions/cmc-proxy/`, then revert the three added
   lines in `src/App.tsx` and the nav block plus import in `src/components/AppSidebar.tsx`.
3. Delete the `CMC_API_KEY` secret.
