import { useState } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workflow as WorkflowIcon, Lock, ArrowDown } from 'lucide-react';
import { WORKFLOWS } from '@/lib/platform';

export default function WorkflowDesigner() {
  const [key, setKey] = useState(WORKFLOWS[0].key);
  const wf = WORKFLOWS.find((w) => w.key === key) ?? WORKFLOWS[0];

  return (
    <OsPage
      title="Workflow Designer™"
      subtitle="Every institutional lifecycle rendered as an inspectable workflow. The designer is deliberately read-only — workflows are constitutional and cannot be edited from the interface."
      department="Governance"
      actions={<Badge variant="outline" className="gap-1 border-border/60 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" aria-hidden="true" /> Read-only</Badge>}
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select workflow">
        {WORKFLOWS.map((w) => (
          <Button key={w.key} size="sm" variant={w.key === key ? 'default' : 'outline'} className="h-7 text-[11px]" aria-pressed={w.key === key} onClick={() => setKey(w.key)}>
            {w.name}
          </Button>
        ))}
      </div>

      <section className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <WorkflowIcon className="h-4 w-4 text-trading-gold" aria-hidden="true" /> {wf.name}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{wf.purpose}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <span><span className="text-foreground">{wf.stages.length}</span> stages</span>
          <span><span className="text-foreground">{wf.stages.filter((s) => s.approval !== 'Automatic').length}</span> human approval gates</span>
          <span>Editing disabled by governance</span>
        </div>
      </section>

      <section className="space-y-0">
        {wf.stages.map((s, i) => (
          <div key={s.id}>
            <article className="rounded-lg border border-border/50 bg-card/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-trading-gold/40 bg-trading-gold/10 font-mono text-[11px] text-trading-gold">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Owner · {s.owner}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${s.approval === 'Automatic' ? 'border-border/60 text-muted-foreground' : 'border-amber-500/40 bg-amber-500/10 text-amber-400'}`}>
                  {s.approval}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.detail}</p>
              <p className="mt-2 rounded-md border border-border/40 bg-muted/10 p-2.5 text-[11px] text-foreground">
                <span className="text-muted-foreground">Gate · </span>{s.gate}
              </p>
            </article>
            {i < wf.stages.length - 1 && (
              <div className="flex justify-center py-1.5" aria-hidden="true">
                <ArrowDown className="h-4 w-4 text-trading-gold/60" />
              </div>
            )}
          </div>
        ))}
      </section>
    </OsPage>
  );
}
