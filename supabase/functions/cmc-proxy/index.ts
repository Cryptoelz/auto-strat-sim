// CMC Hackathon — isolated CoinMarketCap proxy.
// The API key never leaves this server function. Nothing here touches trading logic.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CMC_BASE = "https://pro-api.coinmarketcap.com";

// Allow-list: only these CMC endpoints may be proxied.
const ALLOWED_ENDPOINTS: Record<string, string> = {
  quotes: "/v1/cryptocurrency/quotes/latest",
  listings: "/v1/cryptocurrency/listings/latest",
  global: "/v1/global-metrics/quotes/latest",
  info: "/v2/cryptocurrency/info",
  fearGreed: "/v3/fear-and-greed/latest",
};

// Only simple scalar query params are forwarded.
function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      usp.set(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("CMC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CMC_API_KEY is not configured", code: "missing_key" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const endpointKey = String(body?.endpoint ?? "");
    const path = ALLOWED_ENDPOINTS[endpointKey];

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Unknown endpoint", code: "bad_endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = `${CMC_BASE}${path}${buildQuery(body?.params)}`;
    const upstream = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": apiKey, Accept: "application/json" },
    });

    const text = await upstream.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: "Invalid upstream response", code: "bad_upstream" };
    }

    if (!upstream.ok) {
      // Never echo headers or the key; surface only status + CMC status block.
      const status = (payload as { status?: { error_message?: string } })?.status?.error_message;
      return new Response(
        JSON.stringify({ error: status ?? `CMC request failed (${upstream.status})`, code: "upstream_error" }),
        { status: upstream.status === 401 ? 502 : upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Proxy failure", code: "proxy_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
