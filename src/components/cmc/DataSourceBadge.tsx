import { Badge } from '@/components/ui/badge';
import { PROVENANCE_LABEL, type DataProvenance } from '@/lib/cmc/config';

const VARIANT: Record<DataProvenance, string> = {
  LIVE_CMC: 'border-primary/50 bg-primary/10 text-primary',
  LIVE_BINANCE: 'border-accent/50 bg-accent/10 text-accent-foreground',
  SEEDED_RESEARCH: 'border-muted-foreground/40 bg-muted/30 text-muted-foreground',
};

export function DataSourceBadge({ provenance }: { provenance: DataProvenance }) {
  return (
    <Badge variant="outline" className={`text-[10px] tracking-wide ${VARIANT[provenance]}`}>
      {PROVENANCE_LABEL[provenance]}
    </Badge>
  );
}
