import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { presentationStory } from '@/lib/enterprise';
import { useAtlasSettings } from '@/hooks/useAtlasSettings';
import { ChevronLeft, ChevronRight, Maximize2, ExternalLink, Presentation } from 'lucide-react';

export default function PresentationMode() {
  const story = presentationStory();
  const [i, setI] = useState(0);
  const [settings, update] = useAtlasSettings();
  const chapter = story[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((v) => Math.min(story.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [story.length]);

  useEffect(() => { document.title = `${i + 1}/${story.length} — ${chapter.title} · ATLAS OS™`; }, [i, chapter.title, story.length]);

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-background via-background to-card/40">
      <div className="mx-auto max-w-[1200px] space-y-8 p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-trading-gold/20 pb-6">
          <div>
            <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] uppercase tracking-[0.22em] text-trading-gold">
              <Presentation className="mr-1.5 h-3 w-3" aria-hidden="true" /> Presentation Mode
            </Badge>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{settings.institutionName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{settings.institutionTagline} · guided executive narrative in {story.length} chapters</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[11px]" onClick={() => update({ presentationMode: !settings.presentationMode })}>
              {settings.presentationMode ? 'Exit large typography' : 'Large typography'}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[11px]" onClick={fullscreen}>
              <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
            </Button>
          </div>
        </header>

        <nav aria-label="Chapters" className="flex flex-wrap gap-1.5">
          {story.map((c, idx) => (
            <button
              key={c.title}
              onClick={() => setI(idx)}
              aria-current={idx === i ? 'step' : undefined}
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                idx === i ? 'border-trading-gold/60 bg-trading-gold/15 text-trading-gold' : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              {idx + 1}. {c.title}
            </button>
          ))}
        </nav>

        <article className="rounded-xl border border-trading-gold/25 bg-card/50 p-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-trading-gold">Chapter {i + 1} of {story.length}</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-foreground">{chapter.title}</h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{chapter.narrative}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
            <ul className="space-y-3">
              {chapter.talkingPoints.map((t) => (
                <li key={t} className="flex gap-3 text-base leading-relaxed text-foreground">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-gold" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border border-trading-gold/25 bg-trading-gold/[0.05] p-5 text-center">
              <p className="font-mono text-4xl leading-none text-trading-gold">{chapter.stat.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{chapter.stat.label}</p>
              <Button asChild size="sm" variant="outline" className="mt-4 h-8 w-full gap-1.5 text-[11px]">
                <Link to={chapter.to}><ExternalLink className="h-3.5 w-3.5" /> Open the module</Link>
              </Button>
            </div>
          </div>
        </article>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" className="gap-1.5" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <p className="text-[11px] text-muted-foreground">Use the arrow keys to move between chapters</p>
          <Button variant="outline" className="gap-1.5" onClick={() => setI((v) => Math.min(story.length - 1, v + 1))} disabled={i === story.length - 1}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-5">
          {['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required', 'No Live Trading'].map((b) => (
            <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
          ))}
        </footer>
      </div>
    </div>
  );
}
