/**
 * CMC Hackathon — transport layer.
 * All CoinMarketCap calls go through the isolated server function so the API key
 * is never present in browser code, bundles, or network responses.
 */

import { supabase } from '@/integrations/supabase/client';
import { CMC_ENABLED, CMC_PROXY_FUNCTION } from './config';

export type CmcEndpoint = 'quotes' | 'listings' | 'global' | 'info' | 'fearGreed';

export interface CmcRawResponse {
  data?: unknown;
  status?: { error_message?: string | null };
}

export async function callCmc(
  endpoint: CmcEndpoint,
  params?: Record<string, string | number | boolean>,
): Promise<{ raw: CmcRawResponse | null; error: string | null }> {
  if (!CMC_ENABLED) {
    return { raw: null, error: 'CMC feature is disabled' };
  }

  try {
    const { data, error } = await supabase.functions.invoke(CMC_PROXY_FUNCTION, {
      body: { endpoint, params },
    });

    if (error) {
      return { raw: null, error: error.message || 'CMC request failed' };
    }
    const payload = data as CmcRawResponse & { error?: string };
    if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
      return { raw: null, error: String(payload.error) };
    }
    return { raw: payload ?? null, error: null };
  } catch (err) {
    return { raw: null, error: err instanceof Error ? err.message : 'CMC request failed' };
  }
}
