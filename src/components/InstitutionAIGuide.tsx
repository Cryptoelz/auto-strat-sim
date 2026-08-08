import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { guideAnswer, GUIDE_PROMPTS, GuideAnswer } from '@/lib/institutionOS';
import { recordMemory } from '@/lib/institutionalMemory';
import { Bot, X, CornerDownLeft } from 'lucide-react';

/** Floating institutional AI guide — summarises, explains and compares using knowledge-graph evidence only. */
export function InstitutionAIGuide() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<GuideAnswer | null>(null);

  const ask = (text: string) => {
    if (!text.trim()) return;
    setQ(text);
    setAnswer(guideAnswer(text));
  };

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-11 gap-2 rounded-full border border-trading-gold/40 bg-card px-4 text-[12px] text-trading-gold shadow-lg hover:bg-card/80"
        >
          <Bot className="h-4 w-4" /> Institution Guide
        </Button>
      )}

      {open && (
        <Card className="fixed bottom-5 right-5 z-50 flex max-h-[70vh] w-[min(420px,calc(100vw-2.5rem))] flex-col border-trading-gold/30 bg-card/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-trading-gold" />
              <p className="text-[12px] font-medium text-foreground">Institution AI Guide™</p>
              <Badge variant="outline" className="border-border/50 px-1.5 py-0 text-[9px] text-muted-foreground">Read-only</Badge>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close guide" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(q)}
              placeholder="Ask about any object, department or metric"
              className="h-8 text-[11.5px]"
            />
            <Button size="sm" className="h-8 px-2" onClick={() => ask(q)} aria-label="Ask"><CornerDownLeft className="h-3.5 w-3.5" /></Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
              {!answer && (
                <>
                  <p className="text-[11.5px] text-muted-foreground">
                    I summarise pages, explain any metric, compare research objects and point you to the evidence behind every institutional answer.
                  </p>
                  <div className="space-y-1.5">
                    {GUIDE_PROMPTS.map((p) => (
                      <button key={p} onClick={() => ask(p)}
                        className="block w-full rounded-md border border-border/40 bg-muted/10 px-3 py-1.5 text-left text-[11.5px] text-foreground hover:border-trading-gold/40">
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {answer && (
                <>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-trading-gold">{answer.title}</p>
                  <p className="text-[12px] leading-relaxed text-foreground/90">{answer.body}</p>
                  <ul className="space-y-1.5">
                    {answer.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-muted-foreground">
                        <span className="text-trading-gold">▸</span>{b}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
                    {answer.links.map((l) => (
                      <Link key={l.to + l.label} to={l.to} onClick={() => setOpen(false)}
                        className="rounded border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-trading-gold/40 hover:text-trading-gold">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setAnswer(null); setQ(''); }}>Ask something else</Button>
                </>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </>
  );
}
