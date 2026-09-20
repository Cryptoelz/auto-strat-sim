import { Card, CardContent } from '@/components/ui/card';
import type { EvidenceBundle } from '@/lib/cmc/evidence';

interface Props {
  bundle: EvidenceBundle;
}

function dominantContextState(bundle: EvidenceBundle): string {
  const { contextByState } = bundle.totals;
  const order: Array<keyof typeof contextByState> = ['LIVE', 'CACHED', 'STALE', 'UNAVAILABLE'];
  const present = order.filter((k) => contextByState[k] > 0);
  return present.length ? present.join(' / ') : 'UNAVAILABLE';
}

export function EvidenceStatusCards({ bundle }: Props) {
  const cards = [
    { label: 'CMC INTEGRATION', value: bundle.featureFlags.cmcEnabled ? 'ACTIVE' : 'DISABLED' },
    { label: 'ENGINE INFLUENCE', value: 'NONE' },
    { label: 'SIMULATION', value: 'PAPER ONLY' },
    { label: 'AUDIT LEDGER', value: bundle.storage.available ? 'VERIFIED' : 'STORAGE ERROR' },
    { label: 'CMC CONTEXT', value: dominantContextState(bundle) },
    { label: 'API KEY', value: 'SERVER-SIDE ONLY' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.label} className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-1 p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="text-sm font-semibold text-primary">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
