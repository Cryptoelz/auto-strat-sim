import {
  Landmark, Stethoscope, Binoculars,
  LayoutDashboard, LineChart, FlaskConical, Layers, PieChart,
  Shield, UserCog, Bell, Beaker, ClipboardCheck, Activity,
  Radio, Microscope, ArrowUpCircle, BarChart3, Gauge, FileText, Sparkles, Scale, SlidersHorizontal, GitCompare, Trophy, Gavel, Snowflake, Briefcase, Users, BookOpen, Crown, CalendarDays, Target, Zap, GitFork, Compass, Eye, Building2, Rocket, Brain, BrainCircuit, Bot, Atom, Network, Globe2, Share2, Gem, GraduationCap, Lightbulb, BadgeCheck, ScrollText, Radar, History as HistoryIcon, Wand2, Puzzle, Store, Code2, Palette, Workflow, Package, Terminal, Award, Map, TestTube2, HeartPulse, Database, Wrench, Presentation, ShieldCheck, Archive, Fingerprint } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { title: 'Extension Manager™', url: '/extensions', icon: Puzzle },
      { title: 'App Marketplace™', url: '/marketplace', icon: Store },
      { title: 'Plugin SDK™', url: '/plugin-sdk', icon: Code2 },
      { title: 'Theme Engine™', url: '/themes', icon: Palette },
      { title: 'Institution Templates™', url: '/templates', icon: Layers },
      { title: 'Workflow Designer™', url: '/workflows', icon: Workflow },
      { title: 'Institution Package™', url: '/package', icon: Package },
      { title: 'Developer Centre™', url: '/developer', icon: Terminal },
      { title: 'Certification™', url: '/certification', icon: Award },
      { title: 'Future Roadmap™', url: '/roadmap', icon: Map },
    ],
  },
  {
    label: 'ATLAS AI Maintenance™',
    items: [
      { title: 'Executive Dashboard', url: '/maintenance', icon: HeartPulse },
      { title: 'Institution Health', url: '/maintenance/health', icon: Gauge },
      { title: 'Module Health Monitor', url: '/maintenance/modules', icon: Activity },
      { title: 'Workflow Integrity', url: '/maintenance/workflows', icon: Workflow },
      { title: 'Governance Auditor', url: '/maintenance/governance', icon: Shield },
      { title: 'Database Integrity', url: '/maintenance/database', icon: Database },
      { title: 'Knowledge Validator', url: '/maintenance/knowledge', icon: BookOpen },
      { title: 'Performance Centre', url: '/maintenance/performance', icon: Zap },
      { title: 'Auto Repair Engine', url: '/maintenance/repairs', icon: Wrench },
      { title: 'Predictive Maintenance', url: '/maintenance/predictive', icon: Radar },
      { title: 'Maintenance Reports', url: '/maintenance/reports', icon: FileText },
      { title: 'Maintenance Settings', url: '/maintenance/settings', icon: SlidersHorizontal },
    ],
  },
  {

    label: 'Enterprise',
    items: [
      { title: 'Executive Home', url: '/home', icon: Crown },
      { title: 'Executive Demonstration™', url: '/demonstration', icon: Presentation },
      { title: 'Presentation Mode', url: '/presentation', icon: Sparkles },
      { title: 'Documentation Centre', url: '/docs', icon: BookOpen },
      { title: 'Performance Centre', url: '/performance', icon: Gauge },
      { title: 'Metrics API', url: '/metrics-api', icon: Share2 },
      { title: 'Enterprise Settings', url: '/settings', icon: SlidersHorizontal },
      { title: 'Launch Checklist', url: '/launch', icon: Rocket },
      { title: 'Test & Validation Centre™', url: '/validation-centre', icon: TestTube2 },
      { title: 'Acceptance Programme™', url: '/acceptance', icon: BadgeCheck },
      { title: 'Executive Decision Centre™', url: '/decision-centre', icon: ShieldCheck },
      { title: 'Institution Daily™', url: '/institution-daily', icon: CalendarDays },
      { title: "Founder's Office™", url: '/founders-office', icon: Crown },
      { title: 'Executive Intelligence™', url: '/executive-intelligence', icon: BrainCircuit },
      { title: 'Trade Review Centre™', url: '/trade-review', icon: ClipboardCheck },
      { title: 'Portfolio Evolution™', url: '/portfolio-evolution', icon: Activity },
      { title: 'Production Readiness Centre™', url: '/production-readiness', icon: ShieldCheck },
      { title: 'Release Candidate Centre', url: '/release-candidate', icon: Rocket },
    ],
  },
  {

    label: 'Institution',
    items: [
      { title: 'Institution Dashboard™', url: '/institution', icon: Landmark },
      { title: 'Departments', url: '/institution/departments', icon: Building2 },
      { title: 'Collaboration™', url: '/institution/collaboration', icon: Network },
      { title: 'Calendar™', url: '/calendar', icon: CalendarDays },
      { title: 'Work Queue™', url: '/institution/queue', icon: ClipboardCheck },
      { title: 'Analytics™', url: '/institution/analytics', icon: BarChart3 },
      { title: 'Institution Score™', url: '/institution/score', icon: Gauge },
      { title: 'History™', url: '/institution/history', icon: BookOpen },
      { title: 'Museum™', url: '/institution/museum', icon: Landmark },
      { title: 'Institutional Memory™', url: '/institution/memory', icon: Landmark },
    ],
  },
  {
    label: 'Living Institution',
    items: [
      { title: 'Observatory™', url: '/observatory', icon: Eye },
      { title: 'Department Cycle™', url: '/institution/cycle', icon: Activity },
      { title: 'Conversations™', url: '/institution/conversations', icon: Users },
      { title: 'Decisions™', url: '/institution/decisions', icon: Gavel },
      { title: 'Knowledge Evolution™', url: '/institution/evolution', icon: GitFork },
      { title: 'Forecast™', url: '/institution/forecast', icon: Target },
      { title: 'Briefing Room™', url: '/briefing-room', icon: FileText },
      { title: 'Research Genome™', url: '/institution/genome', icon: Atom },
      { title: 'Health Monitor™', url: '/institution/health', icon: Gauge },
    ],
  },
  {
    label: 'Intelligence Engine',
    items: [
      { title: 'Institution IQ™', url: '/institution/iq', icon: Gem },
      { title: 'Self Review™', url: '/self-review', icon: BadgeCheck },
      { title: 'Learning Engine™', url: '/institution/learning', icon: GraduationCap },
      { title: 'Recommendations™', url: '/institution/recommendations', icon: Lightbulb },
      { title: 'Research Quality Index™', url: '/institution/quality', icon: Gauge },
      { title: 'Explainability™', url: '/institution/explain', icon: ScrollText },
      { title: 'Benchmark™', url: '/institution/benchmark', icon: Scale },
      { title: 'Executive Simulator™', url: '/executive-simulator', icon: Wand2 },
      { title: 'Risk Radar™', url: '/institution/risk-radar', icon: Radar },
      { title: 'Evolution Timeline™', url: '/institution/evolution-timeline', icon: HistoryIcon },
    ],
  },
  {
    label: 'Core',
    items: [
      { title: 'Overview', url: '/', icon: LayoutDashboard },
      { title: 'ATLAS™', url: '/atlas', icon: Globe2 },
      { title: 'Institutional Knowledge Graph™', url: '/knowledge-graph', icon: Share2 },
      { title: 'ATLAS Intelligence Explorer™', url: '/explorer', icon: Compass },
      { title: 'ATLAS Oracle™', url: '/oracle', icon: Sparkles },
      { title: 'Executive Boardroom™', url: '/boardroom', icon: Landmark },
      { title: 'Institutional Digital Twin™', url: '/digital-twin', icon: Network },
      { title: 'AI Research Brain', url: '/research-brain', icon: BrainCircuit },
      { title: 'Intelligence Network', url: '/intelligence-network', icon: Network },
      { title: 'Mission Control', url: '/mission-control', icon: Rocket },
      { title: 'Audit Vault™', url: '/audit-vault', icon: Archive },
      { title: 'Performance Archive™', url: '/performance-archive', icon: HistoryIcon },
      { title: 'AI Research Assistant', url: '/research-assistant', icon: BrainCircuit },
      { title: 'AI Chief Investment Officer', url: '/cio', icon: Landmark },
      { title: 'Autonomous Research Engine', url: '/autonomous-research', icon: Bot },
      { title: 'AI Quant Scientist', url: '/quant-scientist', icon: Atom },
      { title: 'Portfolio AI Director', url: '/portfolio-ai-director', icon: Brain },
      { title: 'Executive', url: '/executive', icon: Crown },
      { title: 'Live Trading', url: '/trading', icon: LineChart },
      { title: 'Paper Trade', url: '/paper-trading', icon: Radio },
      { title: 'Dual Paper', url: '/dual-paper', icon: GitCompare },
      { title: 'Championship', url: '/championship', icon: Trophy },
      { title: 'Backtest', url: '/backtest', icon: FlaskConical },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { title: 'Strategies', url: '/strategies', icon: Layers },
      { title: 'Portfolio', url: '/portfolio', icon: PieChart },
      { title: 'Portfolio Manager', url: '/portfolio-manager', icon: Briefcase },
      { title: 'Investment Committee', url: '/committee', icon: Users },
      { title: 'Research Journal', url: '/journal', icon: BookOpen },
      { title: 'Research', url: '/research', icon: Microscope },
      { title: 'Specialist Independence™', url: '/specialist-independence', icon: Fingerprint },
      { title: 'Session Analytics', url: '/session-analytics', icon: BarChart3 },
      { title: 'Analytics Hub', url: '/analytics-hub', icon: Gauge },
      { title: 'Weekly Review', url: '/weekly-review', icon: FileText },
      { title: 'Monthly Report', url: '/monthly-report', icon: CalendarDays },
      { title: 'Move Capture Audit', url: '/move-capture', icon: Target },
      { title: 'Momentum Scalper', url: '/momentum-scalper', icon: Zap },
      { title: 'Momentum Scalper v2', url: '/momentum-scalper-v2', icon: Zap },
      { title: 'VCB v1 (Compression)', url: '/vcb-v1', icon: Compass },
      { title: 'Allocation Lab v1', url: '/allocation-lab', icon: Layers },
      { title: 'Allocation Lab v2', url: '/allocation-lab-v2', icon: Sparkles },
      { title: 'Forward Validation', url: '/forward-validation', icon: Eye },
      { title: 'Champion Trial', url: '/champion-trial', icon: Trophy },
      { title: 'Specialist Championship', url: '/specialist-championship', icon: Crown },
      { title: 'Specialist Discovery v2', url: '/specialist-discovery-v2', icon: Compass },
      { title: 'Low-Vol Coiler v1', url: '/low-vol-coiler-v1', icon: FlaskConical },
      { title: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2', icon: FlaskConical },
      { title: 'Specialist Approval Board', url: '/specialist-approval-board', icon: Gavel },
      { title: 'Portfolio Architecture', url: '/portfolio-architecture-review', icon: Building2 },
      { title: 'Executive Program Status', url: '/executive-program-status', icon: ClipboardCheck },
      { title: 'Observation Center', url: '/observation-center', icon: Eye },
      { title: 'Allocation Production Path', url: '/allocation-production-path', icon: Rocket },
      { title: 'Trade Frequency Audit', url: '/trade-frequency', icon: Activity },
      { title: 'Trading Diagnostics', url: '/trading-diagnostics', icon: Stethoscope },
      { title: 'Specialist Board', url: '/specialist-board', icon: Crown },
      { title: 'Opportunity Analysis', url: '/opportunity-analysis', icon: Binoculars },
      { title: 'Performance Attribution™', url: '/performance-attribution', icon: Landmark },
      { title: 'Router v2.1 (fork)', url: '/router-v21', icon: GitFork },
      { title: 'Command Center', url: '/command-center', icon: Sparkles },
      { title: 'Baseline Validation', url: '/baseline-validation', icon: Scale },
    ],
  },
  {
    label: 'Controls',
    items: [
      { title: 'Participation', url: '/participation', icon: SlidersHorizontal },
      { title: 'Governance', url: '/governance', icon: Shield },
      { title: 'Operator', url: '/operator', icon: UserCog },
      { title: 'Alerts', url: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'Review',
    items: [
      { title: 'Experiments', url: '/experiments', icon: Beaker },
      { title: 'Promotion Board', url: '/promotion-board', icon: Gavel },
      { title: 'Research Freeze', url: '/freeze', icon: Snowflake },
      { title: 'Promotion', url: '/promotion', icon: ArrowUpCircle },
      { title: 'Readiness', url: '/readiness', icon: ClipboardCheck },
      { title: 'System Health', url: '/system-health', icon: Activity },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              CT
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">CryptoTrader</p>
              <p className="text-[10px] text-muted-foreground">Simulation Only</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              CT
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <Badge variant="outline" className="w-full justify-center border-primary/30 bg-primary/5 text-[10px] text-primary">
            SIMULATION ONLY
          </Badge>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
