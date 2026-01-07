import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, TrendingDown, Target, Clock, Scale, Zap } from 'lucide-react';
import { BacktestTrade } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface TradeQualityScoreCardProps {
  trades: BacktestTrade[];
  stopLossPercent: number;
  takeProfitPercent: number;
}

interface TradeScore {
  trade: BacktestTrade;
  index: number;
  overallScore: number;
  riskRewardScore: number;
  executionScore: number;
  timingScore: number;
  efficiencyScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface QualityStats {
  scoredTrades: TradeScore[];
  avgScore: number;
  gradeDistribution: Record<string, number>;
  topTrades: TradeScore[];
  worstTrades: TradeScore[];
  scoreByOutcome: { wins: number; losses: number };
  correlationWithPnl: number;
}

function calculateTradeScore(
  trade: BacktestTrade,
  index: number,
  allTrades: BacktestTrade[],
  stopLossPercent: number,
  takeProfitPercent: number
): TradeScore {
  const isWin = trade.pnl > 0;
  const pnlPercent = Math.abs(trade.pnlPercent);
  
  // Risk/Reward Score (0-25): How well did the trade capture the intended R:R?
  let riskRewardScore = 0;
  const intendedRR = takeProfitPercent / stopLossPercent;
  const actualRR = isWin 
    ? pnlPercent / stopLossPercent 
    : -pnlPercent / takeProfitPercent;
  
  if (isWin) {
    // Reward based on how close to or exceeding the take profit
    riskRewardScore = Math.min(25, (pnlPercent / takeProfitPercent) * 25);
  } else {
    // Penalize less if stopped out at planned level vs worse
    const stoppedAtPlan = pnlPercent <= stopLossPercent * 1.1;
    riskRewardScore = stoppedAtPlan ? 10 : Math.max(0, 10 - (pnlPercent - stopLossPercent) * 2);
  }

  // Execution Score (0-25): Based on exit reason
  let executionScore = 0;
  switch (trade.exitReason) {
    case 'take_profit':
      executionScore = 25; // Perfect execution
      break;
    case 'stop_loss':
      executionScore = 15; // Disciplined exit
      break;
    case 'signal':
      executionScore = isWin ? 20 : 12; // Signal-based, depends on outcome
      break;
    default:
      executionScore = 10;
  }

  // Timing Score (0-25): Based on trade duration efficiency
  const duration = trade.exitTime - trade.entryTime;
  const avgDuration = allTrades.reduce((sum, t) => sum + (t.exitTime - t.entryTime), 0) / allTrades.length;
  
  let timingScore = 0;
  if (isWin) {
    // For wins: faster is better (captured profit quickly)
    const speedRatio = avgDuration / Math.max(duration, 1);
    timingScore = Math.min(25, speedRatio * 15);
  } else {
    // For losses: faster exit is also better (cut losses quickly)
    const speedRatio = avgDuration / Math.max(duration, 1);
    timingScore = Math.min(25, 10 + speedRatio * 10);
  }
  timingScore = Math.max(0, Math.min(25, timingScore));

  // Efficiency Score (0-25): PnL relative to position size and fees
  const grossPnl = trade.pnl + trade.fees;
  const feeImpact = trade.fees / Math.abs(grossPnl || 1);
  let efficiencyScore = 0;
  
  if (isWin) {
    // For wins: high profit with low fee impact
    efficiencyScore = Math.min(25, 20 - feeImpact * 50 + (pnlPercent / takeProfitPercent) * 10);
  } else {
    // For losses: minimize damage
    efficiencyScore = Math.max(0, 15 - (pnlPercent / stopLossPercent) * 10);
  }
  efficiencyScore = Math.max(0, Math.min(25, efficiencyScore));

  // Calculate overall score
  const overallScore = riskRewardScore + executionScore + timingScore + efficiencyScore;

  // Assign grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 65) grade = 'B';
  else if (overallScore >= 50) grade = 'C';
  else if (overallScore >= 35) grade = 'D';
  else grade = 'F';

  return {
    trade,
    index,
    overallScore,
    riskRewardScore,
    executionScore,
    timingScore,
    efficiencyScore,
    grade,
  };
}

export function TradeQualityScoreCard({ trades, stopLossPercent, takeProfitPercent }: TradeQualityScoreCardProps) {
  const stats = useMemo<QualityStats | null>(() => {
    if (trades.length < 5) return null;

    const scoredTrades = trades.map((trade, index) =>
      calculateTradeScore(trade, index, trades, stopLossPercent, takeProfitPercent)
    );

    const avgScore = scoredTrades.reduce((sum, t) => sum + t.overallScore, 0) / scoredTrades.length;

    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    scoredTrades.forEach(t => gradeDistribution[t.grade]++);

    const sortedByScore = [...scoredTrades].sort((a, b) => b.overallScore - a.overallScore);
    const topTrades = sortedByScore.slice(0, 5);
    const worstTrades = sortedByScore.slice(-5).reverse();

    const wins = scoredTrades.filter(t => t.trade.pnl > 0);
    const losses = scoredTrades.filter(t => t.trade.pnl <= 0);
    const scoreByOutcome = {
      wins: wins.length > 0 ? wins.reduce((sum, t) => sum + t.overallScore, 0) / wins.length : 0,
      losses: losses.length > 0 ? losses.reduce((sum, t) => sum + t.overallScore, 0) / losses.length : 0,
    };

    // Calculate correlation between score and PnL
    const n = scoredTrades.length;
    const sumX = scoredTrades.reduce((sum, t) => sum + t.overallScore, 0);
    const sumY = scoredTrades.reduce((sum, t) => sum + t.trade.pnl, 0);
    const sumXY = scoredTrades.reduce((sum, t) => sum + t.overallScore * t.trade.pnl, 0);
    const sumX2 = scoredTrades.reduce((sum, t) => sum + t.overallScore ** 2, 0);
    const sumY2 = scoredTrades.reduce((sum, t) => sum + t.trade.pnl ** 2, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    const correlationWithPnl = denominator !== 0 ? numerator / denominator : 0;

    return {
      scoredTrades,
      avgScore,
      gradeDistribution,
      topTrades,
      worstTrades,
      scoreByOutcome,
      correlationWithPnl,
    };
  }, [trades, stopLossPercent, takeProfitPercent]);

  if (!stats) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-6 text-center text-muted-foreground">
          Not enough trade data for quality scoring (minimum 5 trades required)
        </CardContent>
      </Card>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-trading-profit bg-trading-profit/10 border-trading-profit/30';
      case 'B': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'C': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'D': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'F': return 'text-trading-loss bg-trading-loss/10 border-trading-loss/30';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(142, 76%, 45%)';
    if (score >= 65) return 'hsl(142, 50%, 50%)';
    if (score >= 50) return 'hsl(45, 93%, 47%)';
    if (score >= 35) return 'hsl(25, 95%, 53%)';
    return 'hsl(0, 84%, 60%)';
  };

  // Prepare scatter data for score vs PnL
  const scatterData = stats.scoredTrades.map(t => ({
    score: t.overallScore,
    pnl: t.trade.pnl,
    grade: t.grade,
    index: t.index + 1,
  }));

  // Grade distribution data for bar chart
  const gradeData = Object.entries(stats.gradeDistribution).map(([grade, count]) => ({
    grade,
    count,
    percentage: (count / stats.scoredTrades.length) * 100,
  }));

  const overallGrade = stats.avgScore >= 80 ? 'A' : stats.avgScore >= 65 ? 'B' : stats.avgScore >= 50 ? 'C' : stats.avgScore >= 35 ? 'D' : 'F';

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Trade Quality Score
            </CardTitle>
            <CardDescription>Multi-metric rating for each trade</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-lg font-bold px-3 py-1 ${getGradeColor(overallGrade)}`}>
              {overallGrade}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Avg: {stats.avgScore.toFixed(1)}/100
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Components Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Risk/Reward</span>
            </div>
            <p className="text-sm font-semibold">0-25 pts</p>
            <p className="text-[10px] text-muted-foreground">R:R capture efficiency</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Execution</span>
            </div>
            <p className="text-sm font-semibold">0-25 pts</p>
            <p className="text-[10px] text-muted-foreground">Exit reason quality</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Timing</span>
            </div>
            <p className="text-sm font-semibold">0-25 pts</p>
            <p className="text-[10px] text-muted-foreground">Duration efficiency</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Efficiency</span>
            </div>
            <p className="text-sm font-semibold">0-25 pts</p>
            <p className="text-[10px] text-muted-foreground">PnL vs fee impact</p>
          </div>
        </div>

        {/* Score by Outcome */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-trading-profit/5 rounded-lg border border-trading-profit/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-trading-profit" />
              <span className="text-sm font-medium">Winning Trades</span>
            </div>
            <p className="text-2xl font-bold text-trading-profit">
              {stats.scoreByOutcome.wins.toFixed(1)}
            </p>
            <Progress 
              value={stats.scoreByOutcome.wins} 
              className="h-2 mt-2"
            />
          </div>
          <div className="p-4 bg-trading-loss/5 rounded-lg border border-trading-loss/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-trading-loss" />
              <span className="text-sm font-medium">Losing Trades</span>
            </div>
            <p className="text-2xl font-bold text-trading-loss">
              {stats.scoreByOutcome.losses.toFixed(1)}
            </p>
            <Progress 
              value={stats.scoreByOutcome.losses} 
              className="h-2 mt-2"
            />
          </div>
        </div>

        {/* Grade Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">Grade Distribution</h4>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="grade"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${props.payload.count} trades (${props.payload.percentage.toFixed(1)}%)`,
                    `Grade ${props.payload.grade}`
                  ]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.grade === 'A' ? 'hsl(142, 76%, 45%)' :
                        entry.grade === 'B' ? 'hsl(142, 50%, 55%)' :
                        entry.grade === 'C' ? 'hsl(45, 93%, 47%)' :
                        entry.grade === 'D' ? 'hsl(25, 95%, 53%)' :
                        'hsl(0, 84%, 60%)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score vs PnL Scatter */}
        <div>
          <h4 className="text-sm font-medium mb-1">Score vs P&L Correlation</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Correlation: {stats.correlationWithPnl.toFixed(3)} 
            {stats.correlationWithPnl > 0.5 ? ' (strong positive)' : 
             stats.correlationWithPnl > 0.2 ? ' (moderate positive)' :
             stats.correlationWithPnl < -0.2 ? ' (negative)' : ' (weak)'}
          </p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="score"
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Quality Score', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  dataKey="pnl"
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'score' ? `${value.toFixed(1)} pts` : formatCurrency(value),
                    name === 'score' ? 'Score' : 'P&L'
                  ]}
                />
                <Scatter data={scatterData} fill="hsl(var(--primary))">
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getScoreColor(entry.score)}
                      fillOpacity={0.8}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top & Worst Trades */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-trading-profit" />
              Top Quality Trades
            </h4>
            <div className="space-y-2">
              {stats.topTrades.slice(0, 3).map((scored, i) => (
                <div 
                  key={i}
                  className="p-2 bg-trading-profit/5 rounded-lg border border-trading-profit/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getGradeColor(scored.grade)}`}>
                      {scored.grade}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Trade #{scored.index + 1}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{scored.overallScore.toFixed(1)}</span>
                    <span className={`text-xs ml-2 ${scored.trade.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      {formatCurrency(scored.trade.pnl)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-trading-loss" />
              Lowest Quality Trades
            </h4>
            <div className="space-y-2">
              {stats.worstTrades.slice(0, 3).map((scored, i) => (
                <div 
                  key={i}
                  className="p-2 bg-trading-loss/5 rounded-lg border border-trading-loss/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getGradeColor(scored.grade)}`}>
                      {scored.grade}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Trade #{scored.index + 1}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{scored.overallScore.toFixed(1)}</span>
                    <span className={`text-xs ml-2 ${scored.trade.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      {formatCurrency(scored.trade.pnl)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Quality Analysis:</strong> {' '}
            {stats.avgScore >= 65 
              ? 'Your trades show high overall quality with good risk management and execution.'
              : stats.avgScore >= 50
                ? 'Trade quality is moderate. Focus on improving exit timing and R:R capture.'
                : 'Trade quality needs improvement. Review your entry/exit criteria and risk management.'}{' '}
            {stats.scoreByOutcome.wins > stats.scoreByOutcome.losses + 10
              ? 'Winning trades are significantly higher quality than losing trades - good execution on winners.'
              : stats.scoreByOutcome.losses > stats.scoreByOutcome.wins
                ? 'Losing trades score higher than winners, suggesting you may be cutting winners too early.'
                : 'Quality is consistent across wins and losses.'}{' '}
            {stats.correlationWithPnl > 0.4
              ? 'Strong correlation between quality score and P&L validates the scoring methodology.'
              : 'Moderate score-PnL correlation suggests factors outside these metrics also influence outcomes.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
