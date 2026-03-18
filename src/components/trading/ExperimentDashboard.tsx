import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FlaskConical, Star, GitCompare, Tag, FileText, Clock, Trophy,
  ArrowUp, ArrowDown, Minus, Shield, Download, Trash2, Plus, CheckCircle2,
  AlertTriangle, X, Eye, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ExperimentStore, ExperimentRun, ExperimentTag, EXPERIMENT_TAG_COLORS,
  RunComparison, DEFAULT_EXPERIMENT_STORE,
} from '@/types/experiment';
import {
  loadExperimentStore, saveExperimentStore, createRun, updateTags,
  setBaseline, deleteRun, compareRuns, generateRunExplanation,
  checkPromotionEligibility, exportExperiments, createDemoRuns, addNote,
} from '@/lib/experimentEngine';
import { format } from 'date-fns';

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function ExperimentDashboard() {
  const [store, setStore] = useState<ExperimentStore>(() => {
    const loaded = loadExperimentStore();
    if (loaded.runs.length === 0) {
      const demos = createDemoRuns();
      const withDemos: ExperimentStore = { ...loaded, runs: demos, currentBaselineId: 'demo-1' };
      saveExperimentStore(withDemos);
      return withDemos;
    }
    return loaded;
  });

  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RunComparison | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const baseline = useMemo(() => store.runs.find(r => r.isBaseline), [store]);

  const handleSetBaseline = useCallback((runId: string) => {
    setStore(prev => setBaseline(prev, runId));
  }, []);

  const handleDeleteRun = useCallback((runId: string) => {
    setStore(prev => deleteRun(prev, runId));
  }, []);

  const handleToggleTag = useCallback((runId: string, tag: ExperimentTag) => {
    const run = store.runs.find(r => r.id === runId);
    if (!run) return;
    const newTags = run.tags.includes(tag) ? run.tags.filter(t => t !== tag) : [...run.tags, tag];
    setStore(prev => updateTags(prev, runId, newTags));
  }, [store.runs]);

  const handleCompare = useCallback(() => {
    if (compareA && compareB) {
      setComparison(compareRuns(store, compareA, compareB));
    }
  }, [store, compareA, compareB]);

  const handleExport = useCallback(() => {
    const csv = exportExperiments(store);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [store]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Experiment Management
          <Badge variant="secondary" className="ml-auto">{store.runs.length} runs</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Track, compare, and reproduce strategy experiments</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="runs" className="space-y-3">
          <TabsList className="grid grid-cols-5 h-8 text-xs">
            <TabsTrigger value="runs" className="text-xs">Runs</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">Compare</TabsTrigger>
            <TabsTrigger value="best" className="text-xs">Best</TabsTrigger>
            <TabsTrigger value="versions" className="text-xs">Versions</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
          </TabsList>

          {/* ─── Runs Tab ─── */}
          <TabsContent value="runs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Baseline: {baseline ? baseline.name : 'None set'}
              </span>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExport}>
                <Download className="h-3 w-3" />Export
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {store.runs.map(run => (
                  <RunCard
                    key={run.id}
                    run={run}
                    isBaseline={run.isBaseline}
                    baselineRun={baseline}
                    onSetBaseline={handleSetBaseline}
                    onDelete={handleDeleteRun}
                    onToggleTag={handleToggleTag}
                    onSelect={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
                    isSelected={selectedRun === run.id}
                    onAddNote={(note) => setStore(prev => addNote(prev, run.id, note))}
                  />
                ))}
                {store.runs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No experiment runs yet</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ─── Compare Tab ─── */}
          <TabsContent value="compare">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select value={compareA || ''} onValueChange={v => setCompareA(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Run A" /></SelectTrigger>
                  <SelectContent>
                    {store.runs.map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={compareB || ''} onValueChange={v => setCompareB(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Run B" /></SelectTrigger>
                  <SelectContent>
                    {store.runs.map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={handleCompare} disabled={!compareA || !compareB || compareA === compareB}>
                <GitCompare className="h-3 w-3" />Compare Runs
              </Button>
              {comparison && <ComparisonView comparison={comparison} store={store} />}
            </div>
          </TabsContent>

          {/* ─── Best Runs Tab ─── */}
          <TabsContent value="best">
            <BestRunsView store={store} />
          </TabsContent>

          {/* ─── Versions Tab ─── */}
          <TabsContent value="versions">
            <VersionsView store={store} />
          </TabsContent>

          {/* ─── Audit Tab ─── */}
          <TabsContent value="audit">
            <ScrollArea className="h-[350px]">
              <div className="space-y-1">
                {store.auditLog.slice(0, 50).map(event => (
                  <div key={event.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground shrink-0 w-14">{format(event.timestamp, 'HH:mm')}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{event.type.replace(/_/g, ' ')}</Badge>
                    <span className="text-muted-foreground">{event.description}</span>
                  </div>
                ))}
                {store.auditLog.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No audit events</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Run Card ────────────────────────────────────────────────────────────────

function RunCard({ run, isBaseline, baselineRun, onSetBaseline, onDelete, onToggleTag, onSelect, isSelected, onAddNote }: {
  run: ExperimentRun;
  isBaseline: boolean;
  baselineRun?: ExperimentRun;
  onSetBaseline: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleTag: (id: string, tag: ExperimentTag) => void;
  onSelect: () => void;
  isSelected: boolean;
  onAddNote: (note: { purpose: string; expectedOutcome: string; actualOutcome: string; observedProblems: string; nextActions: string; verdict: 'promote' | 'reject' | 'retest' | 'pending' }) => void;
}) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const r = run.result;
  const promo = checkPromotionEligibility(run);
  const explanation = generateRunExplanation(run, baselineRun);

  const allTags: ExperimentTag[] = ['baseline', 'candidate', 'stable', 'experimental', 'failed', 'regression', 'promising', 'needs_review', 'conservative', 'aggressive'];

  return (
    <div className={cn("rounded-lg border p-3 space-y-2 transition-colors", isBaseline ? "border-primary/50 bg-primary/5" : "border-border/30 bg-secondary/10", isSelected && "ring-1 ring-primary/40")}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onSelect}>
          {isBaseline && <Crown className="h-3.5 w-3.5 text-primary" />}
          <div>
            <span className="text-sm font-medium">{run.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[10px] py-0 h-4">{run.type.replace(/_/g, ' ')}</Badge>
              <span className="text-[10px] text-muted-foreground">{format(run.startTime, 'MMM dd HH:mm')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isBaseline && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-0.5" onClick={() => onSetBaseline(run.id)}>
              <Star className="h-3 w-3" />Baseline
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(run.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center">
        <MetricPill label="Return" value={`${r.totalReturn >= 0 ? '+' : ''}${r.totalReturn.toFixed(1)}%`} positive={r.totalReturn >= 0} />
        <MetricPill label="DD" value={`${r.maxDrawdown.toFixed(1)}%`} positive={r.maxDrawdown < 10} />
        <MetricPill label="WR" value={`${r.winRate.toFixed(0)}%`} positive={r.winRate >= 50} />
        <MetricPill label="PF" value={r.profitFactor.toFixed(2)} positive={r.profitFactor >= 1} />
        <MetricPill label="Trades" value={r.tradeCount.toString()} />
        <MetricPill label="Robust" value={r.robustnessScore.toFixed(0)} positive={r.robustnessScore >= 50} />
        <MetricPill label="Gov" value={r.governanceInterventions.toString()} positive={r.governanceInterventions < 3} />
        <MetricPill label="Fails" value={r.failurePointsDetected.toString()} positive={r.failurePointsDetected < 3} />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => onToggleTag(run.id, tag)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full transition-all border",
              run.tags.includes(tag)
                ? EXPERIMENT_TAG_COLORS[tag] + ' border-transparent'
                : 'border-border/30 text-muted-foreground/50 hover:border-border'
            )}
          >
            {tag.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Expanded Detail */}
      {isSelected && (
        <div className="space-y-2 pt-1">
          <Separator className="opacity-30" />

          {/* Explanation */}
          <p className="text-xs text-muted-foreground italic">{explanation}</p>

          {/* Promotion */}
          <div className="flex items-center gap-2">
            {promo.eligible ? (
              <Badge className="text-[10px] bg-green-500/20 text-green-400 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />Eligible for promotion
              </Badge>
            ) : (
              <div className="space-y-0.5">
                <Badge className="text-[10px] bg-red-500/20 text-red-400 border-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />Not eligible
                </Badge>
                {promo.reasons.map((reason, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground ml-2">• {reason}</p>
                ))}
              </div>
            )}
          </div>

          {/* Config summary */}
          <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-1">
            <span>Assets: {run.assetsIncluded.join(', ')}</span>
            <span>Strategies: {run.strategiesIncluded.join(', ')}</span>
            <span>Timeframe: {run.config.timeframe}</span>
            <span>Mode: {run.operatorMode}</span>
            <span>Dataset: {run.datasetOrScenario}</span>
            <span>Duration: {(run.duration / 1000).toFixed(0)}s</span>
          </div>

          {/* Notes */}
          {run.notes.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Notes:</span>
              {run.notes.map(note => (
                <div key={note.id} className="text-[10px] text-muted-foreground bg-secondary/30 rounded p-1.5">
                  <span className="font-medium">{note.purpose}</span> — {note.actualOutcome}
                  <Badge variant="outline" className="text-[9px] ml-1 py-0">{note.verdict}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          {showNoteForm ? (
            <div className="space-y-1">
              <Textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Quick note about this run..."
                className="text-xs h-16 resize-none"
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-[10px]" onClick={() => {
                  if (noteText.trim()) {
                    onAddNote({ purpose: noteText, expectedOutcome: '', actualOutcome: noteText, observedProblems: '', nextActions: '', verdict: 'pending' });
                    setNoteText('');
                    setShowNoteForm(false);
                  }
                }}>Save</Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowNoteForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setShowNoteForm(true)}>
              <Plus className="h-3 w-3" />Add Note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Metric Pill ─────────────────────────────────────────────────────────────

function MetricPill({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="text-[10px]">
      <span className="text-muted-foreground block">{label}</span>
      <span className={cn("font-medium", positive === true && "text-trading-profit", positive === false && "text-trading-loss")}>
        {value}
      </span>
    </div>
  );
}

// ─── Comparison View ─────────────────────────────────────────────────────────

function ComparisonView({ comparison, store }: { comparison: RunComparison; store: ExperimentStore }) {
  const runA = store.runs.find(r => r.id === comparison.runA);
  const runB = store.runs.find(r => r.id === comparison.runB);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="text-[10px]">{runA?.name || 'A'}</Badge>
        <span className="text-muted-foreground">vs</span>
        <Badge variant="outline" className="text-[10px]">{runB?.name || 'B'}</Badge>
      </div>

      {/* Param diffs */}
      {comparison.paramDiffs.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground">Parameter Changes</span>
          {comparison.paramDiffs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground w-24">{d.field}</span>
              <span>{d.valueA}</span>
              <ArrowDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
              <span className="font-medium">{d.valueB}</span>
            </div>
          ))}
        </div>
      )}

      {/* Metric diffs */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground">Metric Comparison</span>
        {comparison.metricDiffs.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
            <span className="text-muted-foreground">{d.metric}</span>
            <div className="flex items-center gap-2">
              <span>{typeof d.valueA === 'number' ? d.valueA.toFixed(2) : d.valueA}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{typeof d.valueB === 'number' ? d.valueB.toFixed(2) : d.valueB}</span>
              <span className={cn("flex items-center gap-0.5", d.improved ? "text-trading-profit" : d.change !== 0 ? "text-trading-loss" : "text-muted-foreground")}>
                {d.change > 0 ? <ArrowUp className="h-3 w-3" /> : d.change < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {Math.abs(d.change).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded p-2">{comparison.summary}</p>
    </div>
  );
}

// ─── Best Runs View ──────────────────────────────────────────────────────────

function BestRunsView({ store }: { store: ExperimentStore }) {
  const categories: Array<{ key: string; label: string; icon: React.ReactNode }> = [
    { key: 'overall', label: 'Best Overall', icon: <Trophy className="h-3 w-3 text-yellow-500" /> },
    { key: 'low_drawdown', label: 'Best Low Drawdown', icon: <Shield className="h-3 w-3 text-blue-400" /> },
    { key: 'robustness', label: 'Most Robust', icon: <Shield className="h-3 w-3 text-green-400" /> },
    { key: 'btc', label: 'Best BTC', icon: <Star className="h-3 w-3 text-orange-400" /> },
    { key: 'xrp', label: 'Best XRP', icon: <Star className="h-3 w-3 text-cyan-400" /> },
    { key: 'stress_test_survivor', label: 'Best Stress Survivor', icon: <AlertTriangle className="h-3 w-3 text-red-400" /> },
  ];

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-2">
        {categories.map(cat => {
          const runId = store.bestRuns[cat.key as keyof typeof store.bestRuns];
          const run = runId ? store.runs.find(r => r.id === runId) : null;
          return (
            <div key={cat.key} className="flex items-center justify-between rounded-lg border border-border/30 p-2.5">
              <div className="flex items-center gap-2">
                {cat.icon}
                <span className="text-xs font-medium">{cat.label}</span>
              </div>
              {run ? (
                <div className="text-right">
                  <span className="text-xs font-medium">{run.name}</span>
                  <div className="text-[10px] text-muted-foreground">
                    {run.result.totalReturn >= 0 ? '+' : ''}{run.result.totalReturn.toFixed(1)}% | DD {run.result.maxDrawdown.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">No qualifying run</span>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ─── Versions View ───────────────────────────────────────────────────────────

function VersionsView({ store }: { store: ExperimentStore }) {
  const versionGroups = useMemo(() => {
    const defaultVersions = [
      { id: 'sma-v1', name: 'SMA Strategy', version: 1, timestamp: Date.now() - 86400000, description: 'Initial SMA crossover', changeSummary: 'Base implementation', source: 'system', compatNotes: '' },
      { id: 'gov-v1', name: 'Governance Rules', version: 1, timestamp: Date.now() - 86400000, description: 'Initial governance layer', changeSummary: 'Health scoring + state transitions', source: 'system', compatNotes: '' },
      { id: 'alloc-v1', name: 'Allocation Logic', version: 1, timestamp: Date.now() - 86400000, description: 'Equal weight allocation', changeSummary: 'Base allocation', source: 'system', compatNotes: '' },
    ];
    return [...store.versions, ...defaultVersions];
  }, [store.versions]);

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-1.5">
        {versionGroups.map(v => (
          <div key={v.id} className="flex items-start justify-between rounded-lg border border-border/30 p-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{v.name}</span>
                <Badge variant="outline" className="text-[10px] py-0 h-4">v{v.version}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{v.description}</p>
              <p className="text-[10px] text-muted-foreground">Changes: {v.changeSummary}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{format(v.timestamp, 'MMM dd')}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
