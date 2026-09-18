import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CmcDisabledNotice() {
  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">CMC Hackathon module disabled</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        The CoinMarketCap enrichment module is switched off. The rest of the platform is unaffected.
        Set <code className="rounded bg-muted px-1">CMC_ENABLED</code> to <code className="rounded bg-muted px-1">true</code> in
        <code className="ml-1 rounded bg-muted px-1">src/lib/cmc/config.ts</code> to re-enable it.
      </CardContent>
    </Card>
  );
}
