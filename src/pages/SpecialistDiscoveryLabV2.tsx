import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Compass, Lightbulb, GitCompare, Sparkles, Trophy, AlertTriangle, CheckCircle2 } from "lucide-react";

type Regime = "Bull Trend" | "Bear Trend" | "Sideways" | "High Volatility" | "Low Volatility";

const COVERAGE: { regime: Regime; coverage: number; primary: string; gap: string; status: "covered" | "partial" | "gap" }[] = [
  { regime: "Bull Trend", coverage: 92, primary: "Trend Rider v1", gap: "Well covered", status: "covered" },
  { regime: "Bear Trend", coverage: 71, primary: "Trend Rider v1", gap: "Limited dedicated short specialist", status: "partial" },
  { regime: "Sideways", coverage: 78, primary: "Mean Reversion v1", gap: "Range edges underserved", status: "partial" },
  { regime: "High Volatility", coverage: 84, primary: "VCB v1", gap: "Post-expansion follow-through gaps", status: "covered" },
  { regime: "Low Volatility", coverage: 41, primary: "Mean Reversion v1 (partial)", gap: "MAJOR GAP - no compression-aware specialist", status: "gap" },
];

type Candidate = {
  id: string;
  name: string;
  thesis: string;
  dominantRegime: Regime;
  tradesPerDay: string;
  captureProfile: string;
  diversification: string;
  overlap: { tr: number; mr: number; ms: number; vcb: number };
  novelty: number;
  regimeCoverage: number;
  portfolioImpact: number;
  cooperation: number;
};

const CANDIDATES: Candidate[] = [
  {
    id: "lvc",
    name: "Low-Vol Coiler v1",
    thesis: "Detect prolonged volatility contraction in low-vol regimes and fade exhaustion edges before expansion.",
    dominantRegime: "Low Volatility",
    tradesPerDay: "0.8 - 1.4",
    captureProfile: "Small, frequent edges (60-75% capture of micro-moves)",
    diversification: "Fills the largest current coverage gap (Low Vol)",
    overlap: { tr: 12, mr: 28, ms: 9, vcb: 22 },
    novelty: 88, regimeCoverage: 94, portfolioImpact: 86, cooperation: 81,
  },
  {
    id: "bsp",
    name: "Bearish Structure Pro v1",
    thesis: "Dedicated short-side specialist using lower-high structure + volume divergence in confirmed bear regimes.",
    dominantRegime: "Bear Trend",
    tradesPerDay: "1.2 - 2.0",
    captureProfile: "Asymmetric short capture (75-85% of dedicated bear legs)",
    diversification: "Reduces Trend Rider dependency in bear regimes",
    overlap: { tr: 41, mr: 8, ms: 14, vcb: 18 },
    novelty: 74, regimeCoverage: 82, portfolioImpact: 79, cooperation: 77,
  },
  {
    id: "rep",
    name: "Range Edge Predator v1",
    thesis: "Mean-revert from statistical extremes at range boundaries with volume confirmation.",
    dominantRegime: "Sideways",
    tradesPerDay: "2.5 - 3.8",
    captureProfile: "Quick range edges (65-72% capture)",
    diversification: "Complements Mean Reversion v1 with structural edge",
    overlap: { tr: 7, mr: 58, ms: 19, vcb: 11 },
    novelty: 52, regimeCoverage: 68, portfolioImpact: 61, cooperation: 64,
  },
  {
    id: "vex",
    name: "Vol Expansion Hunter v1",
    thesis: "Trade the second leg of post-VCB expansions with directional momentum confirmation.",
    dominantRegime: "High Volatility",
    tradesPerDay: "1.5 - 2.3",
    captureProfile: "Tail-capture profile (70-80% of expansion follow-through)",
    diversification: "Extends VCB v1 logic without duplication",
    overlap: { tr: 22, mr: 5, ms: 28, vcb: 47 },
    novelty: 61, regimeCoverage: 74, portfolioImpact: 71, cooperation: 73,
  },
  {
    id: "lpm",
    name: "Liquidity Pocket Miner v1",
    thesis: "Identify thin liquidity pockets pre-impulse and ride mean-reversion snapbacks.",
    dominantRegime: "Low Volatility",
    tradesPerDay: "0.6 - 1.1",
    captureProfile: "Sniper entries (55-70% capture, very low DD)",
    diversification: "Orthogonal entry logic vs all current specialists",
    overlap: { tr: 6, mr: 19, ms: 11, vcb: 14 },
    novelty: 91, regimeCoverage: 86, portfolioImpact: 78, cooperation: 84,
  },
  {
    id: "tcd",
    name: "Trend Continuation Drifter v1",
    thesis: "Capture late-stage trend drift after Trend Rider has booked profits.",
    dominantRegime: "Bull Trend",
    tradesPerDay: "1.0 - 1.7",
    captureProfile: "Trail-the-trend (60-68% capture of remaining leg)",
    diversification: "High overlap with Trend Rider v1 - near duplicate",
    overlap: { tr: 71, mr: 4, ms: 12, vcb: 9 },
    novelty: 31, regimeCoverage: 42, portfolioImpact: 28, cooperation: 38,
  },
  {
    id: "vrf",
    name: "Volatility Regime Flipper v1",
    thesis: "Cross-regime specialist that pivots posture at vol regime transitions.",
    dominantRegime: "High Volatility",
    tradesPerDay: "0.7 - 1.3",
    captureProfile: "Regime-transition capture (65-78%)",
    diversification: "Unique transition-detection logic; spans 2 regimes",
    overlap: { tr: 18, mr: 16, ms: 12, vcb: 31 },
    novelty: 79, regimeCoverage: 88, portfolioImpact: 74, cooperation: 76,
  },
  {
    id: "msc",
    name: "Momentum Stack Confirmer v1",
    thesis: "Stack confirmation across timeframes for momentum bursts.",
    dominantRegime: "Bull Trend",
    tradesPerDay: "3.2 - 4.6",
    captureProfile: "Frequent shorts of momentum (60-65% capture)",
    diversification: "Too close to Momentum Scalper v2",
    overlap: { tr: 29, mr: 6, ms: 67, vcb: 13 },
    novelty: 34, regimeCoverage: 46, portfolioImpact: 32, cooperation: 41,
  },
  {
    id: "nrc",
    name: "News-Reaction Cooler v1",
    thesis: "Fade overreactions to scheduled volatility events.",
    dominantRegime: "High Volatility",
    tradesPerDay: "0.3 - 0.8",
    captureProfile: "Rare but high-edge fades (70-82% capture)",
    diversification: "Event-driven angle absent from current roster",
    overlap: { tr: 5, mr: 17, ms: 8, vcb: 20 },
    novelty: 84, regimeCoverage: 71, portfolioImpact: 66, cooperation: 78,
  },
  {
    id: "sdp",
    name: "Slow Drift Pacer v1",
    thesis: "Capture low-velocity drift in extended sideways/low-vol regimes.",
    dominantRegime: "Sideways",
    tradesPerDay: "0.5 - 0.9",
    captureProfile: "Patient capture (58-68%) with very low trade count",
    diversification: "Covers gap between Mean Reversion and Trend Rider",
    overlap: { tr: 14, mr: 33, ms: 6, vcb: 11 },
    novelty: 72, regimeCoverage: 81, portfolioImpact: 69, cooperation: 75,
  },
];

function maxOverlap(c: Candidate) {
  return Math.max(c.overlap.tr, c.overlap.mr, c.overlap.ms, c.overlap.vcb);
}

function diversificationScore(c: Candidate) {
  const overlapPenalty = maxOverlap(c);
  return Math.round((c.novelty * 0.3 + c.regimeCoverage * 0.3 + c.cooperation * 0.2 + (100 - overlapPenalty) * 0.2));
}

function opportunityScore(c: Candidate) {
  return Math.round((diversificationScore(c) * 0.5 + c.portfolioImpact * 0.5));
}

const ranked = [...CANDIDATES]
  .map(c => ({ ...c, _div: diversificationScore(c), _opp: opportunityScore(c), _max: maxOverlap(c) }))
  .sort((a, b) => b._opp - a._opp);

const REJECT_THRESHOLD = 60;

export default function SpecialistDiscoveryLabV2() {
  const top = ranked[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Compass className="h-7 w-7 text-primary" />
            Specialist Discovery Lab v2
          </h1>
          <p className="text-muted-foreground mt-1">
            Identify the strongest candidate for Specialist #5 · Research only
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-primary/30 bg-primary/5">Research Only</Badge>
          <Badge variant="outline">No Backtests</Badge>
          <Badge variant="outline">No Promotion</Badge>
          <Badge variant="outline">No Portfolio Integration</Badge>
        </div>
      </div>

      {/* Top recommendation */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardDescription>Leading Candidate for Specialist #5</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" /> {top.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Opportunity</p>
            <p className="text-2xl font-bold">{top._opp}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Diversification</p>
            <p className="text-2xl font-bold">{top._div}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Novelty</p>
            <p className="text-2xl font-bold">{top.novelty}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Dominant Regime</p>
            <p className="text-lg font-semibold">{top.dominantRegime}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="coverage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="coverage">Coverage Gaps</TabsTrigger>
          <TabsTrigger value="ideas">Idea Generator</TabsTrigger>
          <TabsTrigger value="overlap">Overlap Detector</TabsTrigger>
          <TabsTrigger value="diversification">Diversification</TabsTrigger>
          <TabsTrigger value="ranking">Ranking Board</TabsTrigger>
        </TabsList>

        <TabsContent value="coverage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Coverage Gap Scanner
              </CardTitle>
              <CardDescription>Current specialist coverage across market regimes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {COVERAGE.map(c => (
                <div key={c.regime} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.regime}</span>
                      <Badge
                        variant="outline"
                        className={
                          c.status === "gap"
                            ? "border-destructive/40 text-destructive bg-destructive/10"
                            : c.status === "partial"
                            ? "border-yellow-500/40 text-yellow-500 bg-yellow-500/10"
                            : "border-success/40 text-success bg-success/10"
                        }
                      >
                        {c.status === "gap" ? "Major Gap" : c.status === "partial" ? "Partial" : "Covered"}
                      </Badge>
                    </div>
                    <span className="text-sm font-mono">{c.coverage}%</span>
                  </div>
                  <Progress value={c.coverage} />
                  <p className="text-xs text-muted-foreground">
                    Primary: <span className="font-medium">{c.primary}</span> — {c.gap}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ideas">
          <div className="grid gap-4 md:grid-cols-2">
            {CANDIDATES.map(c => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      {c.name}
                    </CardTitle>
                    <Badge variant="outline">{c.dominantRegime}</Badge>
                  </div>
                  <CardDescription>{c.thesis}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">Trade frequency: </span>{c.tradesPerDay}/day</div>
                  <div><span className="text-muted-foreground">Capture profile: </span>{c.captureProfile}</div>
                  <div><span className="text-muted-foreground">Diversification: </span>{c.diversification}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overlap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" /> Overlap Detector
              </CardTitle>
              <CardDescription>
                Overlap scored against existing specialists. Candidates above {REJECT_THRESHOLD}% max-overlap are rejected as near-duplicates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">vs Trend Rider</TableHead>
                    <TableHead className="text-right">vs Mean Rev</TableHead>
                    <TableHead className="text-right">vs Mom Scalper v2</TableHead>
                    <TableHead className="text-right">vs VCB v1</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CANDIDATES.map(c => {
                    const m = maxOverlap(c);
                    const rejected = m >= REJECT_THRESHOLD;
                    return (
                      <TableRow key={c.id} className={rejected ? "opacity-60" : ""}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right">{c.overlap.tr}%</TableCell>
                        <TableCell className="text-right">{c.overlap.mr}%</TableCell>
                        <TableCell className="text-right">{c.overlap.ms}%</TableCell>
                        <TableCell className="text-right">{c.overlap.vcb}%</TableCell>
                        <TableCell className="text-right font-semibold">{m}%</TableCell>
                        <TableCell className="text-right">
                          {rejected ? (
                            <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10">
                              Rejected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-success/40 text-success bg-success/10">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Passes
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diversification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Diversification Score
              </CardTitle>
              <CardDescription>
                Weighted blend of Novelty (30%), Regime Coverage (30%), Cooperation w/ Dynamic Allocation (20%), Anti-overlap (20%).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Novelty</TableHead>
                    <TableHead className="text-right">Regime Coverage</TableHead>
                    <TableHead className="text-right">Cooperation</TableHead>
                    <TableHead className="text-right">Anti-Overlap</TableHead>
                    <TableHead className="text-right">Diversification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.novelty}</TableCell>
                      <TableCell className="text-right">{c.regimeCoverage}</TableCell>
                      <TableCell className="text-right">{c.cooperation}</TableCell>
                      <TableCell className="text-right">{100 - c._max}</TableCell>
                      <TableCell className="text-right font-bold">{c._div}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Research Ranking Board · Top 10
              </CardTitle>
              <CardDescription>Recommendation-only ranking of specialist candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead className="text-right">Opportunity</TableHead>
                    <TableHead className="text-right">Diversification</TableHead>
                    <TableHead className="text-right">Novelty</TableHead>
                    <TableHead className="text-right">Portfolio Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.slice(0, 10).map((c, i) => (
                    <TableRow key={c.id} className={i === 0 ? "bg-primary/5" : ""}>
                      <TableCell className="font-bold">#{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="outline">{c.dominantRegime}</Badge></TableCell>
                      <TableCell className="text-right font-bold">{c._opp}</TableCell>
                      <TableCell className="text-right">{c._div}</TableCell>
                      <TableCell className="text-right">{c.novelty}</TableCell>
                      <TableCell className="text-right">{c.portfolioImpact}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
          <p><strong>Governance:</strong> Research-only workspace. No strategy, parameter, allocation, promotion, or portfolio modifications.</p>
          <p><strong>Output:</strong> Recommendation of strongest Specialist #5 candidate for downstream research consideration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
