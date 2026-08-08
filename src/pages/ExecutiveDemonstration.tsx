import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExecGovernanceFooter } from '@/components/executive/ExecUi';
import { DEMO_DURATIONS, DEMO_VERSION, demoChapters, demoSummary, type DemoDuration } from '@/lib/executiveDemo';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw, X, Maximize2, Minimize2,
  Volume2, VolumeX, ChevronRight, Sparkles, BarChart3, Brain, ShieldCheck, FileDown,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/* ══════════════════════════════════════════════════════════════
   ATLAS OS™ — Executive Demonstration™
   Presentation layer only. Reads institutional data, changes nothing.
   ══════════════════════════════════════════════════════════════ */

const RESUME_KEY = 'atlas.demo.resume.v1';

type Phase = 'start' | 'running' | 'summary';

interface ResumeState { chapter: number; minutes: DemoDuration }

function readResume(): ResumeState | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ResumeState;
    return typeof v?.chapter === 'number' ? v : null;
  } catch { return null; }
}

function fmt(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ExecutiveDemonstration() {
  const chapters = useMemo(() => demoChapters(), []);
  const summary = useMemo(() => demoSummary(), []);

  const [phase, setPhase] = useState<Phase>('start');
  const [minutes, setMinutes] = useState<DemoDuration>(10);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [narration, setNarration] = useState(true);
  const [highlight, setHighlight] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resume, setResume] = useState<ResumeState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setResume(readResume()); }, []);

  const totalWeight = chapters.reduce((s, c) => s + c.weight, 0);
  const chapterSeconds = useMemo(
    () => chapters.map((c) => (c.weight / totalWeight) * minutes * 60),
    [chapters, totalWeight, minutes],
  );
  const chapter = chapters[index];
  const duration = chapterSeconds[index] ?? 60;
  const chapterProgress = Math.min(100, (elapsed / duration) * 100);
  const overallDone = chapterSeconds.slice(0, index).reduce((s, v) => s + v, 0) + elapsed;
  const overallTotal = minutes * 60;
  const overallPct = Math.min(100, (overallDone / overallTotal) * 100);

  /* ── Navigation ───────────────────────────────────────── */
  const goTo = useCallback((i: number) => {
    setIndex(Math.max(0, Math.min(chapters.length - 1, i)));
    setElapsed(0);
  }, [chapters.length]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= chapters.length - 1) { setPhase('summary'); return i; }
      return i + 1;
    });
    setElapsed(0);
  }, [chapters.length]);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const start = (from = 0) => { setIndex(from); setElapsed(0); setPaused(false); setPhase('running'); };

  const exit = useCallback(() => {
    setPhase('start');
    setPaused(false);
    setElapsed(0);
  }, []);

  /* ── Auto timing ──────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'running' || paused) return;
    const t = window.setInterval(() => setElapsed((e) => e + 0.25), 250);
    return () => window.clearInterval(t);
  }, [phase, paused]);

  useEffect(() => {
    if (phase === 'running' && elapsed >= duration) next();
  }, [elapsed, duration, phase, next]);

  /* ── Resume persistence (presentation state only) ─────── */
  useEffect(() => {
    if (phase !== 'running') return;
    try { localStorage.setItem(RESUME_KEY, JSON.stringify({ chapter: index, minutes })); } catch { /* ignore */ }
  }, [phase, index, minutes]);

  /* ── Automatic scrolling ──────────────────────────────── */
  useEffect(() => {
    if (phase !== 'running') return;
    stageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, phase]);

  useEffect(() => {
    document.title = phase === 'running'
      ? `${index + 1}/${chapters.length} — ${chapter.title} · Executive Demonstration · ATLAS OS™`
      : 'Executive Demonstration · ATLAS OS™';
  }, [phase, index, chapter.title, chapters.length]);

  /* ── Fullscreen ───────────────────────────────────────── */
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  /* ── Keyboard shortcuts ───────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'start') { if (e.key === 'Enter') start(0); return; }
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      if (e.key === 'Escape' && !document.fullscreenElement) exit();
      if (e.key.toLowerCase() === 'r') setElapsed(0);
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
      if (e.key.toLowerCase() === 'h') setHighlight((h) => !h);
      if (e.key.toLowerCase() === 'n') setNarration((n) => !n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next, prev, exit]);

  /* ══ START SCREEN ══════════════════════════════════════ */
  if (phase === 'start') {
    return (
      <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-background via-background to-card/40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--trading-gold)/0.10),transparent_62%)]" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-[1100px] flex-col justify-center px-6 py-20 sm:px-10">
          <div className="exec-rise space-y-8">
            <Badge variant="outline" className="exec-badge border-trading-gold/40 bg-trading-gold/10 tracking-[0.22em] text-trading-gold">
              Executive Demonstration™
            </Badge>
            <div className="space-y-5">
              <h1 className="exec-hero-title text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                ATLAS OS™
              </h1>
              <p className="text-2xl font-light tracking-tight text-trading-gold sm:text-3xl">Executive Demonstration</p>
              <p className="exec-measure text-base leading-[1.7] text-muted-foreground sm:text-lg">
                Institutional Intelligence Operating System. A guided keynote through the institution — its knowledge,
                research discipline, governance, memory and certified readiness — presented automatically and
                explained in executive language.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Estimated duration</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {DEMO_DURATIONS.map((d) => (
                  <button
                    key={d.minutes}
                    type="button"
                    onClick={() => setMinutes(d.minutes)}
                    aria-pressed={minutes === d.minutes}
                    className={cn(
                      'rounded-[var(--exec-radius,12px)] border p-5 text-left transition-all duration-200 motion-reduce:transition-none',
                      minutes === d.minutes
                        ? 'border-trading-gold/60 bg-trading-gold/10'
                        : 'border-border/50 bg-card/40 hover:border-trading-gold/30',
                    )}
                  >
                    <p className={cn('text-xl font-semibold tracking-tight', minutes === d.minutes ? 'text-trading-gold' : 'text-foreground')}>
                      {d.label}
                    </p>
                    <p className="mt-2 text-[12.5px] leading-[1.55] text-muted-foreground">{d.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" className="gap-2 bg-trading-gold text-background hover:bg-trading-gold/90" onClick={() => start(0)}>
                <Play className="h-4 w-4" aria-hidden="true" /> Start Tour
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={!resume}
                className="gap-2"
                onClick={() => { if (resume) { setMinutes(resume.minutes); start(resume.chapter); } }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {resume ? `Resume Tour · Chapter ${resume.chapter + 1}` : 'Resume Tour'}
              </Button>
              <Button asChild size="lg" variant="ghost" className="gap-2 text-muted-foreground">
                <Link to="/institution"><X className="h-4 w-4" aria-hidden="true" /> Exit</Link>
              </Button>
            </div>

            <ol className="grid gap-x-8 gap-y-2 pt-6 text-[12.5px] text-muted-foreground sm:grid-cols-3">
              {chapters.map((c, i) => (
                <li key={c.id} className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] text-trading-gold">{String(i + 1).padStart(2, '0')}</span>
                  {c.title}
                </li>
              ))}
            </ol>

            <ExecGovernanceFooter />
          </div>
        </div>
      </div>
    );
  }

  /* ══ SUMMARY SCREEN ════════════════════════════════════ */
  if (phase === 'summary') {
    return (
      <div className="min-h-full bg-gradient-to-b from-background via-background to-card/40">
        <div className="mx-auto max-w-[1200px] space-y-10 px-6 py-16 sm:px-10">
          <header className="exec-rise space-y-4">
            <Badge variant="outline" className="exec-badge border-trading-gold/40 bg-trading-gold/10 tracking-[0.22em] text-trading-gold">
              Executive Summary
            </Badge>
            <h1 className="exec-hero-title text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Questions?
            </h1>
            <p className="exec-measure text-base leading-[1.7] text-muted-foreground">
              The demonstration is complete. Below is the institution’s standing position, drawn from the same
              indices you have just seen — nothing has been recalculated for this slide.
            </p>
          </header>

          <section className="rounded-[var(--exec-radius,12px)] border border-trading-gold/25 bg-card/50 p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Institution Status</p>
            <p className="mt-3 font-mono text-[13.5px] leading-[1.9] text-trading-gold sm:text-[15px]">{summary.status}</p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <SummaryBlock title="Key Findings" items={summary.findings} />
            <SummaryBlock title="Strengths" items={summary.strengths} />
            <SummaryBlock title="Improvement Opportunities" items={summary.opportunities} />
            <SummaryBlock title="Recommended Next Steps" items={summary.nextSteps} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2 bg-trading-gold text-background hover:bg-trading-gold/90">
              <Link to="/oracle"><Sparkles className="h-4 w-4" aria-hidden="true" /> Ask Oracle</Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/institution/analytics"><BarChart3 className="h-4 w-4" aria-hidden="true" /> Open Analytics</Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/institution/memory"><Brain className="h-4 w-4" aria-hidden="true" /> Open Institution Memory</Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/certification"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Open Certification</Link>
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <FileDown className="h-4 w-4" aria-hidden="true" /> Export Executive Report
            </Button>
            <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => start(0)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Replay demonstration
            </Button>
          </div>

          <ExecGovernanceFooter />
        </div>
      </div>
    );
  }

  /* ══ RUNNING ═══════════════════════════════════════════ */
  const dim = highlight ? 'opacity-40 blur-[0.3px]' : '';

  return (
    <div ref={stageRef} className="relative min-h-full bg-gradient-to-b from-background via-background to-card/40 pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(var(--trading-gold)/0.08),transparent_65%)]" />

      {/* Progress */}
      <div className="sticky top-0 z-30 border-b border-trading-gold/15 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 py-3 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
            <span className="text-foreground">
              Chapter {index + 1} of {chapters.length} · <span className="text-trading-gold">{chapter.title}</span>
            </span>
            <span className="font-mono tabular-nums">
              {fmt(overallTotal - overallDone)} remaining · {Math.round(overallPct)}% complete
            </span>
          </div>
          <div
            className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted/30"
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overallPct)}
            aria-label="Demonstration progress"
          >
            <div className="h-full rounded-full bg-trading-gold transition-[width] duration-200 ease-linear motion-reduce:transition-none" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-muted/20">
            <div className="h-full rounded-full bg-trading-gold/45 transition-[width] duration-200 ease-linear motion-reduce:transition-none" style={{ width: `${chapterProgress}%` }} />
          </div>
        </div>
      </div>

      <main key={chapter.id} className="exec-rise relative mx-auto max-w-[1200px] space-y-12 px-6 py-14 sm:px-10 sm:py-20">
        <header className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.26em] text-trading-gold">{chapter.kicker}</p>
          <h1 className="exec-hero-title text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-6xl">
            {chapter.title}
          </h1>
          <p className="exec-measure text-lg leading-[1.7] text-foreground/90 sm:text-xl">{chapter.narrative}</p>
        </header>

        {/* Metrics */}
        <section aria-label="Highlighted metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chapter.metrics.map((m) => (
            <div key={m.label} className="rounded-[var(--exec-radius,12px)] border border-trading-gold/25 bg-card/50 p-5 transition-colors duration-200 motion-reduce:transition-none">
              <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">{m.label}</p>
              <p className="mt-2.5 font-mono text-3xl tabular-nums text-trading-gold">{m.value}</p>
              <p className="mt-1.5 text-[12px] leading-[1.5] text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </section>

        <div className={cn('grid gap-10', chapter.chart ? 'lg:grid-cols-[1fr_460px]' : '')}>
          {/* Narrative */}
          <section className={cn('space-y-6 transition-opacity duration-200 motion-reduce:transition-none')}>
            <ul className="space-y-3.5">
              {chapter.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-[1.65] text-foreground sm:text-base">
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-trading-gold" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            {narration && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Narrative label="Why it exists" body={chapter.whyExists} />
                <Narrative label="What it measures" body={chapter.whatItMeasures} />
                <Narrative label="Why executives care" body={chapter.whyExecutivesCare} />
                <Narrative label="How it connects" body={chapter.howItConnects} />
              </div>
            )}
          </section>

          {chapter.chart && (
            <section aria-label={chapter.chart.label} className="rounded-[var(--exec-radius,12px)] border border-trading-gold/25 bg-card/50 p-5">
              <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">{chapter.chart.label}</p>
              <p className="mt-1 text-[12px] text-muted-foreground/80">Measured in {chapter.chart.unit}</p>
              <div className="mt-5 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chapter.chart.data} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--trading-gold) / 0.3)',
                        borderRadius: 8, fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--trading-gold))" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {/* Chapter destinations */}
        <section className={cn('flex flex-wrap items-center gap-2 border-t border-border/40 pt-8', dim)}>
          <span className="mr-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Explore live</span>
          {chapter.links.map((l) => (
            <Button key={l.to} asChild size="sm" variant="outline" className="h-8 gap-1.5 text-[11.5px]">
              <Link to={l.to}>{l.label}</Link>
            </Button>
          ))}
        </section>

        {/* Chapter rail */}
        <nav aria-label="Chapters" className={cn('flex flex-wrap gap-2', dim)}>
          {chapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === index ? 'step' : undefined}
              className={cn(
                'exec-chip min-h-8 rounded-full border px-3 text-[11px] transition-colors duration-150 motion-reduce:transition-none',
                i === index
                  ? 'border-trading-gold/60 bg-trading-gold/15 text-trading-gold'
                  : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-trading-gold/30 hover:text-foreground',
              )}
            >
              {i + 1}. {c.title}
            </button>
          ))}
        </nav>

        <ExecGovernanceFooter />
      </main>

      {/* Executive HUD */}
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-trading-gold/30 bg-background/90 px-2 py-1.5 shadow-[var(--exec-shadow)] backdrop-blur">
          <HudButton label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </HudButton>
          <HudButton label="Previous chapter" onClick={prev}><SkipBack className="h-4 w-4" /></HudButton>
          <HudButton label="Replay chapter" onClick={() => setElapsed(0)}><RotateCcw className="h-4 w-4" /></HudButton>
          <HudButton label="Skip chapter" onClick={next}><SkipForward className="h-4 w-4" /></HudButton>
          <span className="mx-1 h-5 w-px bg-border/60" aria-hidden="true" />
          <HudButton label={narration ? 'Hide narrative' : 'Show narrative'} active={narration} onClick={() => setNarration((n) => !n)}>
            {narration ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </HudButton>
          <HudButton label={highlight ? 'Disable highlight mode' : 'Enable highlight mode'} active={highlight} onClick={() => setHighlight((h) => !h)}>
            <Sparkles className="h-4 w-4" />
          </HudButton>
          <HudButton label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </HudButton>
          <HudButton label="Exit demonstration" onClick={exit}><X className="h-4 w-4" /></HudButton>
          <span className="px-2 font-mono text-[11px] tabular-nums text-muted-foreground">{fmt(duration - elapsed)}</span>
        </div>
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          Space pause · ← → chapters · R replay · F fullscreen · Esc exit · {DEMO_VERSION.split('·')[1]?.trim()}
        </p>
      </div>
    </div>
  );
}

function HudButton({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 motion-reduce:transition-none',
        active ? 'text-trading-gold' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Narrative({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[var(--exec-radius,12px)] border border-border/50 bg-muted/10 p-4">
      <p className="text-[10.5px] uppercase tracking-[0.2em] text-trading-gold/80">{label}</p>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-muted-foreground">{body}</p>
    </div>
  );
}

function SummaryBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[var(--exec-radius,12px)] border border-border/50 bg-card/40 p-6">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-trading-gold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5 text-[14px] leading-[1.6] text-muted-foreground">
            <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-trading-gold/70" aria-hidden="true" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
