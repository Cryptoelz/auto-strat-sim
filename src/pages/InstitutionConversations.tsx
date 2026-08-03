import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { conversations, type ConversationMessage } from '@/lib/institutionLife';

const STANCE: Record<ConversationMessage['stance'], string> = {
  proposes: 'text-trading-gold',
  challenges: 'text-rose-400',
  supports: 'text-emerald-400',
  schedules: 'text-sky-400',
  defers: 'text-amber-400',
};

export default function InstitutionConversations() {
  const threads = useMemo(() => conversations(16), []);
  const [active, setActive] = useState(threads[0]?.id ?? '');
  const thread = threads.find((t) => t.id === active) ?? threads[0];

  return (
    <OsPage
      title="Institution Conversations™"
      subtitle="Departments question, challenge and validate each other. Every message links to evidence and becomes permanent institutional history."
      department="Conversations™"
    >
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="border-border/50 bg-card/60">
          <p className="border-b border-border/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Threads</p>
          <div className="max-h-[620px] divide-y divide-border/30 overflow-y-auto">
            {threads.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/20 ${t.id === active ? 'bg-trading-gold/10' : ''}`}>
                <p className="text-[11.5px] leading-snug text-foreground">{t.topic}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-mono">{t.date}</span>
                  <Badge variant="outline" className="border-border/50 px-1 py-0 text-[9px]">{t.status}</Badge>
                  <span>{t.messages.length} msgs</span>
                </p>
              </button>
            ))}
          </div>
        </Card>

        {thread && (
          <Card className="border-trading-gold/25 bg-card/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Conversation</p>
                <h2 className="text-base font-semibold text-foreground">{thread.topic}</h2>
              </div>
              <Link to={`/explorer/${thread.objectId}`} className="text-[11px] text-trading-gold hover:underline">Open in Explorer →</Link>
            </div>

            <div className="mt-4 space-y-3">
              {thread.messages.map((m) => (
                <div key={m.id} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-foreground">{m.department}</span>
                    <span className={`text-[10px] uppercase tracking-wider ${STANCE[m.stance]}`}>{m.stance}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{m.date}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/90">{m.text}</p>
                  {m.evidence.length > 0 && (
                    <ul className="mt-2 space-y-0.5 border-l border-trading-gold/30 pl-3">
                      {m.evidence.map((e, i) => (
                        <li key={i} className="text-[10.5px] leading-relaxed text-muted-foreground">{e}</li>
                      ))}
                    </ul>
                  )}
                  <Link to={`/explorer/${m.objectId}`} className="mt-2 inline-block text-[10px] text-trading-gold hover:underline">Evidence trail: {m.objectId} →</Link>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </OsPage>
  );
}
