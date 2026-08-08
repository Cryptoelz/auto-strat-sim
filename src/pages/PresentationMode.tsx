import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { presentationStory } from '@/lib/enterprise';
import { useAtlasSettings } from '@/hooks/useAtlasSettings';
import { ExecGovernanceFooter } from '@/components/executive/ExecUi';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ExternalLink, Presentation } from 'lucide-react';

export default function PresentationMode() {
  const story = presentationStory();
  const [i, setI] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, update] = useAtlasSettings();
  const chapter = story[i];

  const next = useCallback(() => setI((v) => Math.min(story.length - 1, v + 1)), [story.length]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      if (e.key === 'Home') setI(0);
      if (e.key === 'End') setI(story.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, story.length]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    document.title = `${i + 1}/${story.length} — ${chapter.title} · ATLAS OS™`;
  }, [i, chapter.title, story.length]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  const progress = ((i + 1) / story.length) * 100;

  return (
    <div className="min-h-full bg-gradient-to-b from-background via-background to-card/40">
      <div className="mx-auto max-w-[1200px] space-y-10 p-6 sm:p-10 lg:p-12">
        <header className="exec-head flex flex-wrap items-start justify-between gap-5 border-b border-trading-gold/20">
          <div className="min-w-0 space-y-2.5">
            <Badge variant="outline" className="exec-badge border-trading-gold/40 bg-trading-gold/10 tracking-[0.22em] text-trading-gold">
              <Presentation className="h-3 w-3" aria-hidden="true" /> Presentation Mode
            </Badge>
            <h1 className="exec-head-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {settings.institutionName}
            </h1>
            <p className="exec-head-sub exec-measure text-sm text-muted-foreground">
              {settings.institutionTagline} · guided executive narrative in {story.length} chapters
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 text-[11px]"
              aria-pressed={settings.presentationMode}
              onClick={() => update({ presentationMode: !settings.presentationMode })}
            >
              {settings.presentationMode ? 'Exit large typography' : 'Large typography'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 text-[11px]"
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen
                ? <><Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> Exit fullscreen</>
                : <><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /> Fullscreen</>}
            </Button>
          </div>
        </header>

        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted/30"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={story.length}
          aria-valuenow={i + 1}
          aria-label="Presentation progress"
        >
          <div
            className="h-full rounded-full bg-trading-gold transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <nav aria-label="Chapters" className="flex flex-wrap gap-2">
          {story.map((c, idx) => (
            <button
              key={c.title}
              type="button"
              onClick={() => setI(idx)}
              aria-current={idx === i ? 'step' : undefined}
              className={cn(
                'exec-chip min-h-9 rounded-full border px-3.5 text-[11px] transition-colors duration-150',
                idx === i
                  ? 'border-trading-gold/60 bg-trading-gold/15 text-trading-gold'
                  : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-trading-gold/30 hover:text-foreground',
              )}
            >
              {idx + 1}. {c.title}
            </button>
          ))}
        </nav>

        <article
          key={i}
          className="exec-rise rounded-xl border border-trading-gold/25 bg-card/50 p-7 shadow-[var(--exec-shadow)] sm:p-10 lg:p-12"
          aria-live="polite"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-trading-gold">
            Chapter {i + 1} of {story.length}
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {chapter.title}
          </h2>
          <p className="mt-7 max-w-3xl text-lg leading-[1.65] text-muted-foreground sm:text-xl">
            {chapter.narrative}
          </p>

          <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_290px]">
            <ul className="space-y-4">
              {chapter.talkingPoints.map((t) => (
                <li key={t} className="flex gap-3.5 text-base leading-[1.6] text-foreground sm:text-lg">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-gold sm:mt-3" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="self-start rounded-xl border border-trading-gold/25 bg-trading-gold/[0.05] p-7 text-center">
              <p className="font-mono text-4xl font-semibold leading-none tabular-nums text-trading-gold sm:text-5xl">
                {chapter.stat.value}
              </p>
              <p className="mt-3.5 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
                {chapter.stat.label}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-6 h-10 w-full gap-1.5 text-[11px]">
                <Link to={chapter.to}>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open the module
                </Link>
              </Button>
            </div>
          </div>
        </article>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" className="min-h-11 gap-1.5" onClick={prev} disabled={i === 0}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
          </Button>
          <p className="hidden text-[11px] leading-relaxed text-muted-foreground sm:block">
            Arrow keys or space to move · Home and End to jump
          </p>
          <Button variant="outline" className="min-h-11 gap-1.5" onClick={next} disabled={i === story.length - 1}>
            Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <ExecGovernanceFooter
          badges={['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required', 'No Live Trading']}
        />
      </div>
    </div>
  );
}
