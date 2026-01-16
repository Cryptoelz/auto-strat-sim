import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Medal, Award, Zap } from 'lucide-react';
import { PresetVersion } from '@/types/preset-version';
import { cn } from '@/lib/utils';

/**
 * Calculate performance score for ranking versions
 */
export function calculatePerformanceScore(performance: PresetVersion['performance']): number {
  if (!performance) return -Infinity;
  
  const p = performance;
  
  // Composite score matching usePresetVersioning logic
  const sharpeScore = p.sharpeRatio * 20;
  const profitFactorScore = Math.min(p.profitFactor, 5) * 10;
  const winRateScore = p.winRate * 0.3;
  const drawdownPenalty = p.maxDrawdown * 0.5;
  const pnlScore = Math.max(-50, Math.min(50, p.totalPnlPercent));
  
  return sharpeScore + profitFactorScore + winRateScore - drawdownPenalty + pnlScore;
}

/**
 * Performance ranking badge component
 */
export function PerformanceRankBadge({ 
  version, 
  allVersions 
}: { 
  version: PresetVersion; 
  allVersions: PresetVersion[];
}) {
  if (!version.performance) return null;
  
  // Get all versions with performance data and rank them
  const versionsWithPerformance = allVersions
    .filter(v => v.performance)
    .map(v => ({
      id: v.id,
      score: calculatePerformanceScore(v.performance),
    }))
    .sort((a, b) => b.score - a.score);
  
  if (versionsWithPerformance.length < 2) {
    // Need at least 2 versions to show ranking
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            <Zap className="h-2.5 w-2.5" />
            Tested
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs font-medium mb-1">Performance Recorded</p>
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p>PnL: {version.performance.totalPnlPercent >= 0 ? '+' : ''}{version.performance.totalPnlPercent.toFixed(2)}%</p>
            <p>Win Rate: {version.performance.winRate.toFixed(1)}%</p>
            <p>Sharpe: {version.performance.sharpeRatio.toFixed(2)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  const rank = versionsWithPerformance.findIndex(v => v.id === version.id) + 1;
  const totalWithPerformance = versionsWithPerformance.length;
  
  // Determine badge style based on rank
  let BadgeIcon = Award;
  let badgeColor = 'bg-muted text-muted-foreground';
  let rankLabel = `#${rank}`;
  
  if (rank === 1) {
    BadgeIcon = Trophy;
    badgeColor = 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
    rankLabel = '1st';
  } else if (rank === 2) {
    BadgeIcon = Medal;
    badgeColor = 'bg-slate-300/30 text-slate-600 dark:text-slate-300';
    rankLabel = '2nd';
  } else if (rank === 3) {
    BadgeIcon = Medal;
    badgeColor = 'bg-amber-700/20 text-amber-700 dark:text-amber-500';
    rankLabel = '3rd';
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-medium",
          badgeColor
        )}>
          <BadgeIcon className="h-2.5 w-2.5" />
          {rankLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <p className="text-xs font-medium mb-1">
          {rank === 1 ? '🥇 Best Performer' : rank === 2 ? '🥈 Second Best' : rank === 3 ? '🥉 Third Best' : `Rank #${rank} of ${totalWithPerformance}`}
        </p>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <p>PnL: {version.performance.totalPnlPercent >= 0 ? '+' : ''}{version.performance.totalPnlPercent.toFixed(2)}%</p>
          <p>Win Rate: {version.performance.winRate.toFixed(1)}%</p>
          <p>Max Drawdown: {version.performance.maxDrawdown.toFixed(2)}%</p>
          <p>Profit Factor: {version.performance.profitFactor.toFixed(2)}</p>
          <p>Sharpe Ratio: {version.performance.sharpeRatio.toFixed(2)}</p>
          <p className="text-muted-foreground/60 pt-1">Trades: {version.performance.totalTrades}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
