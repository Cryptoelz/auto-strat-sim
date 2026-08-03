// ATLAS OS™ v6.0 — Extensible Platform Layer
// Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required
// No live trading · No exchange connectivity · No API keys · No strategy modification · No automatic allocation
// Everything below is a static, read-only description of the platform. Nothing installs, downloads or executes.

import { KNOWLEDGE_NODES, KNOWLEDGE_EDGES, GOVERNANCE_GUARANTEES } from './knowledgeGraph';
import { DEPARTMENT_PROFILES, institutionScore } from './institutionOS';
import { institutionIQ, qualityIndex } from './institutionIntelligence';
import { launchChecklist, performanceMetrics } from './enterprise';

export const PLATFORM_VERSION = 'ATLAS OS™ v6.0 · Extensible Platform Layer';

export const PLATFORM_LINKS = [
  { label: 'Extension Manager™', to: '/extensions' },
  { label: 'App Marketplace™', to: '/marketplace' },
  { label: 'Plugin SDK™', to: '/plugin-sdk' },
  { label: 'Theme Engine™', to: '/themes' },
  { label: 'Institution Templates™', to: '/templates' },
  { label: 'Workflow Designer™', to: '/workflows' },
  { label: 'Institution Package™', to: '/package' },
  { label: 'Developer Centre™', to: '/developer' },
  { label: 'Certification™', to: '/certification' },
  { label: 'Future Roadmap™', to: '/roadmap' },
];

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

// ══════════════════════════════════════════════════════════
// FEATURE 1 — ATLAS Extension Manager™
// ══════════════════════════════════════════════════════════

export type ExtensionCategory =
  | 'Institution' | 'Research' | 'Analytics' | 'Visualisation'
  | 'Reports' | 'Knowledge' | 'Enterprise' | 'Utilities';

export const EXTENSION_CATEGORIES: ExtensionCategory[] = [
  'Institution', 'Research', 'Analytics', 'Visualisation', 'Reports', 'Knowledge', 'Enterprise', 'Utilities',
];

export interface Extension {
  id: string;
  name: string;
  category: ExtensionCategory;
  version: string;
  status: 'Active' | 'Enabled' | 'Observation Only' | 'Bundled';
  author: string;
  route: string;
  summary: string;
  dependencies: string[];
  compatibility: string;
  impact: string;
  surfaces: number;
}

export const EXTENSIONS: Extension[] = [
  { id: 'ext-institution-os', name: 'Institution OS Core', category: 'Institution', version: '2.0.0', status: 'Active', author: 'ATLAS Core Team', route: '/institution', summary: 'Department registry, work queue, calendar and institution score.', dependencies: ['Knowledge Graph'], compatibility: 'ATLAS ≥ 2.0', impact: 'Defines the operating structure of every department.', surfaces: 9 },
  { id: 'ext-living', name: 'Living Institution', category: 'Institution', version: '3.0.0', status: 'Active', author: 'ATLAS Core Team', route: '/observatory', summary: 'Autonomous department cycles, conversations, decisions and forecasts.', dependencies: ['Institution OS Core'], compatibility: 'ATLAS ≥ 3.0', impact: 'Drives simulated institutional activity across the day.', surfaces: 10 },
  { id: 'ext-intelligence', name: 'Intelligence Engine', category: 'Institution', version: '4.0.0', status: 'Active', author: 'ATLAS Core Team', route: '/institution/iq', summary: 'Institution IQ, quality index, self review and evolution timeline.', dependencies: ['Institution OS Core', 'Knowledge Graph'], compatibility: 'ATLAS ≥ 4.0', impact: 'Continuously measures and critiques institutional research quality.', surfaces: 10 },
  { id: 'ext-brain', name: 'AI Research Brain', category: 'Research', version: '1.4.0', status: 'Active', author: 'Research Department', route: '/research-brain', summary: 'Evidence trees, knowledge timelines and self-reflection.', dependencies: ['Knowledge Graph'], compatibility: 'ATLAS ≥ 3.0', impact: 'Sets the research agenda and reasoning trail.', surfaces: 1 },
  { id: 'ext-quant', name: 'AI Quant Scientist', category: 'Research', version: '1.3.0', status: 'Active', author: 'Quant Department', route: '/quant-scientist', summary: 'Nine-stage research pipeline, peer review and research papers.', dependencies: ['AI Research Brain'], compatibility: 'ATLAS ≥ 3.0', impact: 'Produces validated strategy specifications for review.', surfaces: 1 },
  { id: 'ext-autonomous', name: 'Autonomous Research Engine', category: 'Research', version: '1.2.0', status: 'Observation Only', author: 'Research Department', route: '/autonomous-research', summary: 'Overnight scans, discovery feed and hypothesis generation.', dependencies: ['AI Research Brain'], compatibility: 'ATLAS ≥ 3.0', impact: 'Surfaces overnight discoveries for human review only.', surfaces: 1 },
  { id: 'ext-analytics', name: 'Institution Analytics', category: 'Analytics', version: '2.1.0', status: 'Active', author: 'Analytics Department', route: '/institution/analytics', summary: 'Cross-department analytics, benchmarks and quality metrics.', dependencies: ['Institution OS Core'], compatibility: 'ATLAS ≥ 2.0', impact: 'Provides the measurement layer for every review.', surfaces: 3 },
  { id: 'ext-risk', name: 'Risk Radar', category: 'Analytics', version: '1.1.0', status: 'Active', author: 'Governance Department', route: '/institution/risk-radar', summary: 'Institutional risk detection, severity scoring and mitigation notes.', dependencies: ['Intelligence Engine'], compatibility: 'ATLAS ≥ 4.0', impact: 'Flags degradation and concentration risk early.', surfaces: 1 },
  { id: 'ext-graph', name: 'Knowledge Graph Canvas', category: 'Visualisation', version: '1.5.0', status: 'Active', author: 'Knowledge Department', route: '/knowledge-graph', summary: 'Interactive SVG canvas over institutional nodes and relationships.', dependencies: ['Knowledge Graph'], compatibility: 'ATLAS ≥ 2.0', impact: 'Primary visual surface for institutional knowledge.', surfaces: 1 },
  { id: 'ext-explorer', name: 'Intelligence Explorer', category: 'Visualisation', version: '1.4.0', status: 'Active', author: 'Knowledge Department', route: '/explorer', summary: 'Research replay, DNA radar and institutional time machine.', dependencies: ['Knowledge Graph Canvas'], compatibility: 'ATLAS ≥ 3.0', impact: 'Lets executives inspect how conclusions were reached.', surfaces: 1 },
  { id: 'ext-twin', name: 'Institutional Digital Twin', category: 'Visualisation', version: '1.0.0', status: 'Active', author: 'ATLAS Core Team', route: '/digital-twin', summary: 'Live structural model of the institution.', dependencies: ['Institution OS Core'], compatibility: 'ATLAS ≥ 4.0', impact: 'Explains institutional structure in one view.', surfaces: 1 },
  { id: 'ext-briefing', name: 'Executive Briefing Suite', category: 'Reports', version: '2.0.0', status: 'Active', author: 'Executive Office', route: '/briefing-room', summary: 'Daily briefings, boardroom packs and PDF export.', dependencies: ['Intelligence Engine'], compatibility: 'ATLAS ≥ 3.0', impact: 'Standard executive reporting channel.', surfaces: 3 },
  { id: 'ext-monthly', name: 'Monthly Research Report', category: 'Reports', version: '1.2.0', status: 'Active', author: 'Research Department', route: '/monthly-report', summary: 'Rolling monthly research narrative and metric appendix.', dependencies: ['Institution Analytics'], compatibility: 'ATLAS ≥ 2.0', impact: 'Long-horizon record of institutional progress.', surfaces: 1 },
  { id: 'ext-oracle', name: 'ATLAS Oracle', category: 'Knowledge', version: '1.3.0', status: 'Active', author: 'Knowledge Department', route: '/oracle', summary: 'Natural-language reasoning grounded in graph evidence.', dependencies: ['Knowledge Graph'], compatibility: 'ATLAS ≥ 3.0', impact: 'Answers institutional questions with traceable evidence.', surfaces: 1 },
  { id: 'ext-assistant', name: 'AI Research Assistant', category: 'Knowledge', version: '1.2.0', status: 'Active', author: 'Research Department', route: '/research-assistant', summary: 'Ask anything, metric explainers and executive memory.', dependencies: ['ATLAS Oracle'], compatibility: 'ATLAS ≥ 3.0', impact: 'Reduces time to understand any institutional metric.', surfaces: 1 },
  { id: 'ext-enterprise', name: 'Enterprise Readiness Layer', category: 'Enterprise', version: '5.0.0', status: 'Active', author: 'ATLAS Core Team', route: '/home', summary: 'Executive Home, Global Search 2.0, settings, docs and launch checklist.', dependencies: ['Institution OS Core'], compatibility: 'ATLAS ≥ 5.0', impact: 'Makes ATLAS demonstrable as a commercial product.', surfaces: 7 },
  { id: 'ext-platform', name: 'Extensible Platform Layer', category: 'Enterprise', version: '6.0.0', status: 'Active', author: 'ATLAS Core Team', route: '/extensions', summary: 'Extension manager, marketplace, SDK, themes, templates and certification.', dependencies: ['Enterprise Readiness Layer'], compatibility: 'ATLAS ≥ 6.0', impact: 'Allows new modules without changing core architecture.', surfaces: 10 },
  { id: 'ext-theme', name: 'Theme Engine', category: 'Enterprise', version: '1.0.0', status: 'Enabled', author: 'ATLAS Core Team', route: '/themes', summary: 'Eight institutional themes applied instantly across every surface.', dependencies: ['Extensible Platform Layer'], compatibility: 'ATLAS ≥ 6.0', impact: 'Adapts presentation without touching module code.', surfaces: 1 },
  { id: 'ext-palette', name: 'Global Search 2.0', category: 'Utilities', version: '2.0.0', status: 'Bundled', author: 'ATLAS Core Team', route: '/home', summary: 'CTRL+K palette with natural language, filters and saved searches.', dependencies: ['Knowledge Graph'], compatibility: 'ATLAS ≥ 5.0', impact: 'Primary navigation path across the institution.', surfaces: 1 },
  { id: 'ext-perf', name: 'Performance Diagnostics', category: 'Utilities', version: '1.1.0', status: 'Bundled', author: 'ATLAS Core Team', route: '/performance', summary: 'Render, search latency, graph size and memory diagnostics.', dependencies: ['Enterprise Readiness Layer'], compatibility: 'ATLAS ≥ 5.0', impact: 'Keeps every surface inside its performance budget.', surfaces: 1 },
  { id: 'ext-metrics', name: 'Metrics API (Simulated)', category: 'Utilities', version: '1.0.0', status: 'Observation Only', author: 'ATLAS Core Team', route: '/metrics-api', summary: 'Read-only internal metric payloads for internal visualisations.', dependencies: ['Institution Analytics'], compatibility: 'ATLAS ≥ 5.0', impact: 'No external connectivity. Internal rendering only.', surfaces: 1 },
];

export function extensionSummary() {
  const byCategory = EXTENSION_CATEGORIES.map((c) => ({
    category: c, count: EXTENSIONS.filter((e) => e.category === c).length,
  }));
  return {
    total: EXTENSIONS.length,
    surfaces: EXTENSIONS.reduce((s, e) => s + e.surfaces, 0),
    authors: new Set(EXTENSIONS.map((e) => e.author)).size,
    byCategory,
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 2 — Institution App Marketplace™
// ══════════════════════════════════════════════════════════

export interface MarketApp {
  id: string;
  name: string;
  category: ExtensionCategory;
  version: string;
  publisher: string;
  state: 'Installed' | 'Available (Simulated)' | 'Preview';
  description: string;
  highlights: string[];
  screenshots: { title: string; caption: string; kind: 'graph' | 'table' | 'timeline' | 'chart' | 'report' }[];
  documentation: { heading: string; body: string }[];
  dependencies: string[];
  route?: string;
}

export const MARKET_APPS: MarketApp[] = [
  {
    id: 'app-research-visualiser', name: 'Research Visualiser', category: 'Visualisation', version: '1.4.0',
    publisher: 'Knowledge Department', state: 'Installed', route: '/explorer',
    description: 'Renders any research object as an evidence tree, a replay timeline and a confidence radar.',
    highlights: ['Evidence trees', 'Research replay', 'Confidence radar', 'Deep links from every module'],
    screenshots: [
      { title: 'Evidence tree', caption: 'Origin question to conclusion, every hop annotated with confidence.', kind: 'graph' },
      { title: 'Replay', caption: 'Day-by-day reconstruction of how a conclusion was formed.', kind: 'timeline' },
    ],
    documentation: [
      { heading: 'Purpose', body: 'Turns knowledge graph relationships into an inspectable visual narrative.' },
      { heading: 'Governance', body: 'Read-only. Rendering never mutates a node, edge or confidence score.' },
    ],
    dependencies: ['Knowledge Graph', 'Intelligence Explorer'],
  },
  {
    id: 'app-knowledge-explorer', name: 'Knowledge Explorer', category: 'Knowledge', version: '1.5.0',
    publisher: 'Knowledge Department', state: 'Installed', route: '/knowledge-graph',
    description: 'Browse every institutional object, relationship and evidence link on one canvas.',
    highlights: ['Typed node filters', 'Relationship legend', 'Confidence colouring', 'Object drill-in'],
    screenshots: [
      { title: 'Graph canvas', caption: 'Force-arranged institutional graph with typed relationships.', kind: 'graph' },
      { title: 'Object panel', caption: 'Selected object with evidence, status and dependants.', kind: 'table' },
    ],
    documentation: [
      { heading: 'Data source', body: 'Reads the institutional knowledge graph directly. No secondary store.' },
      { heading: 'Limits', body: 'Rendering is capped by the performance budget in the Performance Centre.' },
    ],
    dependencies: ['Knowledge Graph'],
  },
  {
    id: 'app-evidence-studio', name: 'Evidence Studio', category: 'Research', version: '1.1.0',
    publisher: 'Research Department', state: 'Available (Simulated)',
    description: 'Assemble evidence bundles behind a conclusion and inspect strength, coverage and contradiction.',
    highlights: ['Bundle builder (read-only preview)', 'Contradiction detection', 'Coverage scoring', 'Citation export'],
    screenshots: [
      { title: 'Bundle view', caption: 'Grouped evidence with per-source strength.', kind: 'table' },
      { title: 'Coverage', caption: 'Where a conclusion is under-evidenced.', kind: 'chart' },
    ],
    documentation: [
      { heading: 'Status', body: 'Marketplace preview only. Nothing is downloaded or installed by this platform.' },
      { heading: 'Approval', body: 'Would require human approval and a governance review before activation.' },
    ],
    dependencies: ['Knowledge Graph', 'AI Research Brain'],
  },
  {
    id: 'app-timeline-designer', name: 'Timeline Designer', category: 'Visualisation', version: '1.0.0',
    publisher: 'Executive Office', state: 'Available (Simulated)',
    description: 'Compose institutional timelines for reviews, board packs and museum exhibits.',
    highlights: ['Milestone lanes', 'Phase grouping', 'Export to presentation', 'Museum sync'],
    screenshots: [
      { title: 'Lane editor', caption: 'Read-only preview of milestone lanes across phases.', kind: 'timeline' },
      { title: 'Export', caption: 'Presentation-ready timeline frame.', kind: 'report' },
    ],
    documentation: [
      { heading: 'Purpose', body: 'Standardises how institutional history is presented to executives.' },
      { heading: 'Governance', body: 'Simulation only. No institutional record can be edited.' },
    ],
    dependencies: ['Institution OS Core'],
  },
  {
    id: 'app-executive-reports', name: 'Executive Reports', category: 'Reports', version: '2.0.0',
    publisher: 'Executive Office', state: 'Installed', route: '/briefing-room',
    description: 'Daily, weekly and monthly executive reporting with a consistent institutional template.',
    highlights: ['Daily brief', 'Board pack', 'PDF export', 'Template presets'],
    screenshots: [
      { title: 'Board pack', caption: 'Executive summary, risks, decisions and recommendations.', kind: 'report' },
      { title: 'Metric appendix', caption: 'All supporting metrics with evidence links.', kind: 'table' },
    ],
    documentation: [
      { heading: 'Templates', body: 'Executive, technical and board templates follow the Enterprise Settings default.' },
      { heading: 'Evidence', body: 'Every claim links back to its knowledge graph object.' },
    ],
    dependencies: ['Intelligence Engine'],
  },
  {
    id: 'app-risk-analytics', name: 'Risk Analytics', category: 'Analytics', version: '1.1.0',
    publisher: 'Governance Department', state: 'Installed', route: '/institution/risk-radar',
    description: 'Institutional risk surface with severity, likelihood and mitigation tracking.',
    highlights: ['Risk radar', 'Severity bands', 'Degradation watch', 'Concentration analysis'],
    screenshots: [
      { title: 'Radar', caption: 'Risk categories plotted by severity and likelihood.', kind: 'chart' },
      { title: 'Register', caption: 'Open risks with owning department and mitigation state.', kind: 'table' },
    ],
    documentation: [
      { heading: 'Scope', body: 'Research and simulation risk only. No market or counterparty exposure exists.' },
      { heading: 'Escalation', body: 'High severity risks appear in the executive feed and daily brief.' },
    ],
    dependencies: ['Intelligence Engine'],
  },
  {
    id: 'app-institution-simulator', name: 'Institution Simulator', category: 'Institution', version: '1.2.0',
    publisher: 'ATLAS Core Team', state: 'Installed', route: '/executive-simulator',
    description: 'Simulate institutional decisions and observe the modelled effect on quality, IQ and risk.',
    highlights: ['Decision scenarios', 'Modelled outcomes', 'Reversible by design', 'Never touches allocation'],
    screenshots: [
      { title: 'Scenario', caption: 'Choose a decision and inspect the modelled institutional response.', kind: 'chart' },
      { title: 'Outcome', caption: 'Projected change across quality, IQ and risk.', kind: 'table' },
    ],
    documentation: [
      { heading: 'Governance', body: 'Simulation only. Results are never applied to strategies or capital.' },
    ],
    dependencies: ['Intelligence Engine'],
  },
  {
    id: 'app-presentation-pack', name: 'Presentation Pack', category: 'Enterprise', version: '1.0.0',
    publisher: 'Executive Office', state: 'Installed', route: '/presentation',
    description: 'Guided six-chapter executive narrative with simplified navigation and large typography.',
    highlights: ['Guided storytelling', 'Dev controls hidden', 'Fullscreen reports', 'Theme aware'],
    screenshots: [
      { title: 'Chapter view', caption: 'One institutional idea per screen.', kind: 'report' },
      { title: 'Closing frame', caption: 'Certification and readiness summary.', kind: 'report' },
    ],
    documentation: [
      { heading: 'Usage', body: 'Enable Presentation Mode in Enterprise Settings or the Theme Engine.' },
    ],
    dependencies: ['Enterprise Readiness Layer'],
  },
];

// ══════════════════════════════════════════════════════════
// FEATURE 3 — Plugin SDK™
// ══════════════════════════════════════════════════════════

export interface SdkSection {
  id: string;
  title: string;
  intent: string;
  rules: string[];
  snippet?: string;
}

export const SDK_SECTIONS: SdkSection[] = [
  {
    id: 'page-structure', title: 'Page structure',
    intent: 'Every institutional module renders inside the shared page frame so headers, counters and governance badges stay identical.',
    rules: [
      'Wrap the page body in OsPage with a title, subtitle and owning department.',
      'Maximum content width 1500px, padding p-5 on mobile and p-8 from the sm breakpoint.',
      'Section rhythm is space-y-8; card padding is p-5.',
      'First section is always an executive summary. Detail is progressive disclosure below it.',
    ],
    snippet: `export default function MyModule() {\n  return (\n    <OsPage\n      title="My Module™"\n      subtitle="One sentence describing the institutional question this module answers."\n      department="Research"\n    >\n      {/* sections */}\n    </OsPage>\n  );\n}`,
  },
  {
    id: 'navigation', title: 'Navigation',
    intent: 'Modules are reachable from exactly one sidebar group, the command palette and any module that references them.',
    rules: [
      'Register the route in src/App.tsx above the catch-all route.',
      'Add one entry to the matching NAV_SECTIONS group in AppSidebar.',
      'Expose the module in the palette index so CTRL+K finds it.',
      'Cross-link to related modules instead of duplicating their content.',
    ],
    snippet: `<Route path="/my-module" element={<MyModule />} />`,
  },
  {
    id: 'evidence', title: 'Evidence model',
    intent: 'No claim without a traceable source. Every number a module renders must resolve back to a knowledge graph object.',
    rules: [
      'Read from the knowledge graph, never from a private duplicate store.',
      'Attach node ids to every displayed metric so Explorer can deep link.',
      'Show confidence alongside conclusions, never a conclusion alone.',
      'Contradictions are surfaced, not hidden.',
    ],
  },
  {
    id: 'governance', title: 'Governance model',
    intent: 'The governance guarantees are constitutional. A module may not weaken them.',
    rules: GOVERNANCE_GUARANTEES.slice(0, 8).map(String),
  },
  {
    id: 'export', title: 'Export model',
    intent: 'Everything an executive can see, they can take away.',
    rules: [
      'Provide at least one export action per module.',
      'Respect the Enterprise Settings default export format.',
      'Include evidence links when exportIncludesEvidence is enabled.',
      'Exports are generated in the browser. No upload, no external call.',
    ],
  },
  {
    id: 'styling', title: 'Styling',
    intent: 'Semantic tokens only. A module must survive every theme without edits.',
    rules: [
      'Never hardcode colours. Use background, foreground, muted, border and trading-gold tokens.',
      'Accent is always hsl(var(--trading-gold)); the Theme Engine rewrites it.',
      'Borders use border-border/50 and gold surfaces use trading-gold/20 borders.',
      'Cards use rounded-lg and a single elevation level.',
    ],
    snippet: `<div className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-5" />`,
  },
  {
    id: 'icons', title: 'Icons',
    intent: 'One icon family, one size rhythm.',
    rules: ['lucide-react only.', 'h-3.5 for inline chrome, h-4 for controls, h-5 for section headers.', 'Icons are decorative: set aria-hidden unless the icon is the only label.'],
  },
  {
    id: 'animation', title: 'Animation',
    intent: 'Motion explains change. It never decorates.',
    rules: ['Transitions 150-250ms, ease-out.', 'Only opacity and transform animate.', 'Everything must degrade under html.atlas-reduced-motion.'],
  },
  {
    id: 'accessibility', title: 'Accessibility',
    intent: 'A module is not finished until it is operable from the keyboard and legible to a screen reader.',
    rules: [
      'Every interactive element is reachable by Tab and shows the institutional focus ring.',
      'Use semantic headings; one h1 per page, provided by OsPage.',
      'Icon-only controls need aria-label.',
      'Tables use th scope; charts carry a text summary.',
      'Contrast holds in Executive Dark, Executive Light and High Contrast themes.',
    ],
  },
  {
    id: 'performance', title: 'Performance',
    intent: 'The institution must feel instant at boardroom scale.',
    rules: [
      'Derive data with pure functions; memoise anything above O(n log n).',
      'Render budget per page is 16ms of scripting on the diagnostics run.',
      'Cap any canvas to the node limits published in the Performance Centre.',
      'No module may hold a persistent timer faster than 1s.',
    ],
  },
];

export const SDK_LIFECYCLE = [
  { step: 1, title: 'Propose', detail: 'Register the module idea with an owning department and an origin question.' },
  { step: 2, title: 'Specify', detail: 'Define evidence sources, governance impact and export surface.' },
  { step: 3, title: 'Build', detail: 'Follow the SDK standard: frame, tokens, icons, accessibility, performance.' },
  { step: 4, title: 'Review', detail: 'Peer review for evidence integrity and visual consistency.' },
  { step: 5, title: 'Certify', detail: 'Score against the certification dimensions before it appears in the sidebar.' },
];

// ══════════════════════════════════════════════════════════
// FEATURE 4 — Theme Engine™
// ══════════════════════════════════════════════════════════

export type AtlasTheme =
  | 'executive-dark' | 'executive-light' | 'research-lab' | 'museum'
  | 'presentation' | 'archive' | 'classic' | 'high-contrast';

export interface ThemeDefinition {
  key: AtlasTheme;
  name: string;
  mode: 'dark' | 'light';
  description: string;
  swatches: string[];
}

export const THEMES: ThemeDefinition[] = [
  { key: 'executive-dark', name: 'Executive Dark', mode: 'dark', description: 'The default institutional identity. Deep navy surfaces with institutional gold.', swatches: ['hsl(222 47% 6%)', 'hsl(222 40% 12%)', 'hsl(43 74% 55%)'] },
  { key: 'executive-light', name: 'Executive Light', mode: 'light', description: 'Daylight boardroom variant with the same structure and accent discipline.', swatches: ['hsl(40 30% 97%)', 'hsl(40 20% 92%)', 'hsl(38 70% 42%)'] },
  { key: 'research-lab', name: 'Research Lab', mode: 'dark', description: 'Cool analytical palette tuned for long analysis sessions.', swatches: ['hsl(215 40% 8%)', 'hsl(215 34% 14%)', 'hsl(190 85% 52%)'] },
  { key: 'museum', name: 'Museum', mode: 'dark', description: 'Warm archival tone for the history and museum surfaces.', swatches: ['hsl(28 22% 9%)', 'hsl(28 18% 15%)', 'hsl(32 60% 62%)'] },
  { key: 'presentation', name: 'Presentation', mode: 'dark', description: 'High-luminance accent and larger type for projection.', swatches: ['hsl(230 45% 7%)', 'hsl(230 38% 13%)', 'hsl(265 85% 70%)'] },
  { key: 'archive', name: 'Archive', mode: 'light', description: 'Low-saturation paper theme for printed and exported records.', swatches: ['hsl(45 25% 95%)', 'hsl(45 16% 89%)', 'hsl(25 35% 40%)'] },
  { key: 'classic', name: 'Classic', mode: 'dark', description: 'The original ATLAS terminal look with restrained emerald accent.', swatches: ['hsl(220 30% 7%)', 'hsl(220 26% 13%)', 'hsl(158 64% 45%)'] },
  { key: 'high-contrast', name: 'Accessible High Contrast', mode: 'dark', description: 'Maximum contrast for accessibility compliance and low-light rooms.', swatches: ['hsl(0 0% 4%)', 'hsl(0 0% 12%)', 'hsl(50 100% 62%)'] },
];

export const THEME_BY_KEY = Object.fromEntries(THEMES.map((t) => [t.key, t])) as Record<AtlasTheme, ThemeDefinition>;

// ══════════════════════════════════════════════════════════
// FEATURE 5 — Institution Templates™
// ══════════════════════════════════════════════════════════

export type TemplateKey =
  | 'investment' | 'scientific' | 'engineering' | 'healthcare'
  | 'government' | 'university' | 'innovation';

export interface InstitutionTemplate {
  key: TemplateKey;
  name: string;
  institutionName: string;
  tagline: string;
  summary: string;
  lexicon: { engine: string; template: string }[];
  departments: string[];
}

export const TEMPLATES: InstitutionTemplate[] = [
  {
    key: 'investment', name: 'Investment Research', institutionName: 'ATLAS OS™',
    tagline: 'Institutional Research Operating System',
    summary: 'The native configuration: strategies, allocation research and promotion governance.',
    lexicon: [
      { engine: 'Research object', template: 'Strategy' }, { engine: 'Specialist', template: 'Specialist strategy' },
      { engine: 'Promotion', template: 'Capital promotion' }, { engine: 'Evidence', template: 'Backtest evidence' },
      { engine: 'Review board', template: 'Investment committee' },
    ],
    departments: ['Research', 'Quant', 'Portfolio Director', 'CIO', 'Governance'],
  },
  {
    key: 'scientific', name: 'Scientific Research', institutionName: 'ATLAS Science™',
    tagline: 'Institutional Scientific Research Operating System',
    summary: 'Hypotheses, experiments and peer review replace strategies and promotion.',
    lexicon: [
      { engine: 'Research object', template: 'Study' }, { engine: 'Specialist', template: 'Research programme' },
      { engine: 'Promotion', template: 'Publication' }, { engine: 'Evidence', template: 'Experimental result' },
      { engine: 'Review board', template: 'Peer review panel' },
    ],
    departments: ['Principal Investigators', 'Lab Operations', 'Statistics', 'Ethics', 'Publications'],
  },
  {
    key: 'engineering', name: 'Engineering', institutionName: 'ATLAS Engineering™',
    tagline: 'Institutional Engineering Research Operating System',
    summary: 'Designs, prototypes and readiness reviews across engineering programmes.',
    lexicon: [
      { engine: 'Research object', template: 'Design' }, { engine: 'Specialist', template: 'Subsystem' },
      { engine: 'Promotion', template: 'Design approval' }, { engine: 'Evidence', template: 'Test result' },
      { engine: 'Review board', template: 'Design review board' },
    ],
    departments: ['Systems', 'Reliability', 'Test', 'Safety', 'Programme Office'],
  },
  {
    key: 'healthcare', name: 'Healthcare', institutionName: 'ATLAS Clinical™',
    tagline: 'Institutional Clinical Research Operating System',
    summary: 'Protocols, trials and clinical governance with the same evidence discipline.',
    lexicon: [
      { engine: 'Research object', template: 'Protocol' }, { engine: 'Specialist', template: 'Trial arm' },
      { engine: 'Promotion', template: 'Approval to proceed' }, { engine: 'Evidence', template: 'Clinical finding' },
      { engine: 'Review board', template: 'Clinical governance board' },
    ],
    departments: ['Clinical Research', 'Biostatistics', 'Safety', 'Ethics', 'Quality'],
  },
  {
    key: 'government', name: 'Government', institutionName: 'ATLAS Policy™',
    tagline: 'Institutional Policy Research Operating System',
    summary: 'Policy options, impact assessment and ministerial submission workflows.',
    lexicon: [
      { engine: 'Research object', template: 'Policy option' }, { engine: 'Specialist', template: 'Programme' },
      { engine: 'Promotion', template: 'Ministerial submission' }, { engine: 'Evidence', template: 'Impact assessment' },
      { engine: 'Review board', template: 'Policy board' },
    ],
    departments: ['Analysis', 'Economics', 'Legal', 'Delivery', 'Assurance'],
  },
  {
    key: 'university', name: 'University', institutionName: 'ATLAS Faculty™',
    tagline: 'Institutional Academic Research Operating System',
    summary: 'Faculties, grants, supervision and academic quality assurance.',
    lexicon: [
      { engine: 'Research object', template: 'Project' }, { engine: 'Specialist', template: 'Research group' },
      { engine: 'Promotion', template: 'Grant award' }, { engine: 'Evidence', template: 'Published finding' },
      { engine: 'Review board', template: 'Faculty board' },
    ],
    departments: ['Faculties', 'Grants Office', 'Doctoral School', 'Ethics', 'Quality'],
  },
  {
    key: 'innovation', name: 'Innovation Lab', institutionName: 'ATLAS Lab™',
    tagline: 'Institutional Innovation Operating System',
    summary: 'Fast idea intake, experiment portfolios and stage-gated scaling decisions.',
    lexicon: [
      { engine: 'Research object', template: 'Bet' }, { engine: 'Specialist', template: 'Venture' },
      { engine: 'Promotion', template: 'Scale decision' }, { engine: 'Evidence', template: 'Experiment learning' },
      { engine: 'Review board', template: 'Investment panel' },
    ],
    departments: ['Discovery', 'Experimentation', 'Venture Design', 'Portfolio', 'Governance'],
  },
];

export const TEMPLATE_BY_KEY = Object.fromEntries(TEMPLATES.map((t) => [t.key, t])) as Record<TemplateKey, InstitutionTemplate>;

// ══════════════════════════════════════════════════════════
// FEATURE 6 — Workflow Designer™ (read-only)
// ══════════════════════════════════════════════════════════

export interface WorkflowStage {
  id: string;
  name: string;
  owner: string;
  gate: string;
  detail: string;
  approval: 'Automatic' | 'Human approval required';
}

export interface Workflow {
  key: string;
  name: string;
  purpose: string;
  stages: WorkflowStage[];
}

export const WORKFLOWS: Workflow[] = [
  {
    key: 'research', name: 'Research lifecycle',
    purpose: 'How an origin question becomes a validated institutional conclusion.',
    stages: [
      { id: 'r1', name: 'Origin question', owner: 'AI Research Brain', gate: 'Question is answerable and non-duplicated', detail: 'The institution records why the work exists before any analysis begins.', approval: 'Automatic' },
      { id: 'r2', name: 'Hypothesis', owner: 'AI Quant Scientist', gate: 'Falsifiable statement with a measurable outcome', detail: 'Hypotheses are ranked by expected institutional value.', approval: 'Automatic' },
      { id: 'r3', name: 'Design', owner: 'AI Quant Scientist', gate: 'Validation design covers in-sample, out-of-sample and stress', detail: 'Design fixes the metrics before results are seen.', approval: 'Human approval required' },
      { id: 'r4', name: 'Simulation', owner: 'Research Department', gate: 'Simulation completes across all required regimes', detail: 'Strictly simulated. No live execution at any point.', approval: 'Automatic' },
      { id: 'r5', name: 'Peer review', owner: 'Review Panel', gate: 'Three reviewers, no unresolved objection', detail: 'Reviewers challenge evidence strength and regime dependency.', approval: 'Human approval required' },
      { id: 'r6', name: 'Conclusion', owner: 'AI Research Brain', gate: 'Confidence recorded with supporting evidence', detail: 'The conclusion enters the knowledge graph with full provenance.', approval: 'Automatic' },
    ],
  },
  {
    key: 'governance', name: 'Governance lifecycle',
    purpose: 'How the institution keeps its guarantees permanently intact.',
    stages: [
      { id: 'g1', name: 'Guarantee register', owner: 'Governance', gate: 'All guarantees enumerated and versioned', detail: 'Observation, research, simulation and read-only guarantees are constitutional.', approval: 'Automatic' },
      { id: 'g2', name: 'Continuous check', owner: 'Governance', gate: 'No module weakens a guarantee', detail: 'Every module declares its governance impact in the Extension Manager.', approval: 'Automatic' },
      { id: 'g3', name: 'Risk detection', owner: 'Risk Radar', gate: 'Severity and likelihood assigned', detail: 'Risks are surfaced to the executive feed immediately.', approval: 'Automatic' },
      { id: 'g4', name: 'Executive review', owner: 'Executive Office', gate: 'Reviewed in the daily brief', detail: 'Nothing proceeds on an unreviewed high severity risk.', approval: 'Human approval required' },
      { id: 'g5', name: 'Ratification', owner: 'Board', gate: 'Recorded institutional decision', detail: 'The decision, its rationale and its evidence are stored together.', approval: 'Human approval required' },
    ],
  },
  {
    key: 'promotion', name: 'Promotion lifecycle',
    purpose: 'How a research candidate advances through simulated readiness stages.',
    stages: [
      { id: 'p1', name: 'Research only', owner: 'Research Department', gate: 'Specification complete', detail: 'Default state for every new candidate.', approval: 'Automatic' },
      { id: 'p2', name: 'Validation', owner: 'Quant', gate: 'Validation pack across assets and horizons', detail: 'Includes stress testing across all defined regimes.', approval: 'Automatic' },
      { id: 'p3', name: 'Forward trial', owner: 'Portfolio Director', gate: 'Minimum runtime and trade count reached', detail: 'Forward observation runs before any readiness claim.', approval: 'Automatic' },
      { id: 'p4', name: 'Review board', owner: 'Investment Committee', gate: 'Criteria met on PF, drawdown and stability', detail: 'The board can decline without justification burden.', approval: 'Human approval required' },
      { id: 'p5', name: 'Simulated promotion', owner: 'Board', gate: 'Explicit human approval', detail: 'Promotion remains simulated. No capital and no live venue is involved.', approval: 'Human approval required' },
    ],
  },
  {
    key: 'evidence', name: 'Evidence lifecycle',
    purpose: 'How a single observation becomes citable institutional evidence.',
    stages: [
      { id: 'e1', name: 'Observation', owner: 'Any department', gate: 'Source and timestamp recorded', detail: 'Observations without provenance are rejected.', approval: 'Automatic' },
      { id: 'e2', name: 'Attachment', owner: 'Knowledge', gate: 'Linked to at least one object', detail: 'Free-floating evidence is not permitted in the graph.', approval: 'Automatic' },
      { id: 'e3', name: 'Strength scoring', owner: 'Knowledge', gate: 'Confidence assigned', detail: 'Strength reflects sample size, regime coverage and independence.', approval: 'Automatic' },
      { id: 'e4', name: 'Contradiction check', owner: 'Research Brain', gate: 'Conflicts surfaced, never suppressed', detail: 'Contradictions reduce confidence rather than being discarded.', approval: 'Automatic' },
      { id: 'e5', name: 'Citation', owner: 'All modules', gate: 'Deep link resolves in Explorer', detail: 'Every rendered number can be traced back to this record.', approval: 'Automatic' },
    ],
  },
  {
    key: 'knowledge', name: 'Knowledge lifecycle',
    purpose: 'How institutional knowledge is created, matured, challenged and retired.',
    stages: [
      { id: 'k1', name: 'Creation', owner: 'Knowledge', gate: 'Typed node with owner', detail: 'Every object has a type, an owner and a status.', approval: 'Automatic' },
      { id: 'k2', name: 'Maturation', owner: 'Knowledge', gate: 'Confidence rises with independent evidence', detail: 'Maturity is earned through repeated confirmation.', approval: 'Automatic' },
      { id: 'k3', name: 'Challenge', owner: 'Self Review', gate: 'Periodic re-examination', detail: 'The institution re-tests its own conclusions on a schedule.', approval: 'Automatic' },
      { id: 'k4', name: 'Supersede', owner: 'Knowledge', gate: 'Replacement object linked', detail: 'Superseded knowledge is preserved, not deleted.', approval: 'Human approval required' },
      { id: 'k5', name: 'Archive', owner: 'Museum', gate: 'Historical record kept permanently', detail: 'The museum retains the full institutional memory.', approval: 'Automatic' },
    ],
  },
];

// ══════════════════════════════════════════════════════════
// FEATURE 7 — Institution Package™
// ══════════════════════════════════════════════════════════

export interface PackageSection {
  key: string;
  title: string;
  items: string[];
  count: number;
  route: string;
}

export function institutionPackage(): { generated: string; sections: PackageSection[]; totals: { objects: number; relationships: number; departments: number; modules: number } } {
  const score = institutionScore();
  const iq = institutionIQ();
  const quality = qualityIndex();
  const launch = launchChecklist();
  return {
    generated: new Date().toISOString().slice(0, 10),
    totals: {
      objects: KNOWLEDGE_NODES.length,
      relationships: KNOWLEDGE_EDGES.length,
      departments: DEPARTMENT_PROFILES.length,
      modules: EXTENSIONS.length,
    },
    sections: [
      { key: 'architecture', title: 'Architecture', route: '/developer', count: 5, items: ['Layer map: Knowledge, Institution, Intelligence, Enterprise, Platform', 'Department topology and ownership', 'Routing map across every institutional surface', 'Extension dependency graph', 'Performance budgets per layer'] },
      { key: 'knowledge', title: 'Knowledge', route: '/knowledge-graph', count: KNOWLEDGE_NODES.length, items: [`${KNOWLEDGE_NODES.length} institutional objects`, `${KNOWLEDGE_EDGES.length} typed relationships`, 'Confidence distribution and evidence density', 'Contradiction register', 'Knowledge evolution timeline'] },
      { key: 'reports', title: 'Reports', route: '/briefing-room', count: 4, items: ['Daily executive brief', 'Weekly review', 'Monthly research report', 'Board pack with metric appendix'] },
      { key: 'documentation', title: 'Documentation', route: '/docs', count: SDK_SECTIONS.length, items: ['System map and glossary', 'Plugin SDK standard', 'Governance handbook', 'Research and institution lifecycles', 'Developer Centre reference'] },
      { key: 'screenshots', title: 'Screenshots', route: '/presentation', count: 8, items: ['Executive Home', 'Institution Dashboard', 'Knowledge Graph', 'Intelligence Explorer', 'Oracle', 'Boardroom', 'Certification', 'Roadmap'] },
      { key: 'metrics', title: 'Metrics', route: '/metrics-api', count: 4, items: [`Institution score ${score.total} (${score.grade})`, `Institution IQ ${iq.total}`, `Research quality ${quality.total}`, `Launch readiness ${launch.total}`] },
      { key: 'governance', title: 'Governance', route: '/governance', count: GOVERNANCE_GUARANTEES.length, items: GOVERNANCE_GUARANTEES.slice(0, 6).map(String) },
      { key: 'exports', title: 'Exports', route: '/launch', count: 3, items: ['Markdown institutional record', 'CSV metric appendix', 'JSON metrics payload (internal only)'] },
      { key: 'presentation', title: 'Presentation', route: '/presentation', count: 6, items: ['Six-chapter guided narrative', 'Theme aware projection mode', 'Simplified navigation', 'Fullscreen report frames', 'Certification closing frame', 'Roadmap outlook'] },
    ],
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 8 — Developer Centre™
// ══════════════════════════════════════════════════════════

export interface DevTopic {
  key: string;
  title: string;
  summary: string;
  points: string[];
  link?: { label: string; to: string };
}

const renderSample = () => {
  const m = performanceMetrics().find((x) => x.key === 'render');
  return m ? m.raw : 8;
};

export function developerTopics(): DevTopic[] {
  const perfRender = renderSample();
  return [
    { key: 'architecture', title: 'Architecture', summary: 'Five layers, strictly one-directional. Higher layers read lower layers and never the reverse.', points: ['Layer 1 Knowledge Graph — the single source of institutional truth.', 'Layer 2 Institution OS — departments, queue, calendar, score.', 'Layer 3 Intelligence — IQ, quality, self review, risk.', 'Layer 4 Enterprise — home, search, docs, performance, launch.', 'Layer 5 Platform — extensions, marketplace, SDK, themes, certification.'], link: { label: 'Digital Twin', to: '/digital-twin' } },
    { key: 'components', title: 'Components', summary: 'Shared chrome guarantees visual consistency across every module.', points: ['OsPage provides the header, counters, governance strip and actions.', 'shadcn primitives only; no bespoke button or card implementations.', 'Charts share one axis, grid and tooltip treatment.', 'Empty states use the shared EmptyState component.'] },
    { key: 'routing', title: 'Routing', summary: 'One route per institutional surface, registered centrally.', points: ['All routes live in src/App.tsx inside the AppLayout route element.', 'Detail views use a path parameter rather than a query string.', 'The catch-all NotFound route always stays last.', 'Every route is discoverable from the sidebar and the palette.'] },
    { key: 'graph', title: 'Knowledge Graph', summary: `${KNOWLEDGE_NODES.length} objects and ${KNOWLEDGE_EDGES.length} relationships power every institutional number.`, points: ['Nodes are typed and carry status, confidence and department.', 'Edges are typed relationships with directionality.', 'Never mutate the graph at runtime.', 'Derive views with pure selector functions.'], link: { label: 'Knowledge Graph', to: '/knowledge-graph' } },
    { key: 'oracle', title: 'Oracle', summary: 'Natural-language reasoning constrained to graph evidence.', points: ['Answers must cite at least one object.', 'Unsupported questions return an explicit "insufficient evidence" response.', 'Explain Further expands the reasoning trail rather than rephrasing.'], link: { label: 'Oracle', to: '/oracle' } },
    { key: 'explorer', title: 'Explorer', summary: 'The canonical deep-link target for any institutional object.', points: ['Route /explorer/:objectId opens the object directly.', 'Research Replay reconstructs the formation of a conclusion.', 'The Time Machine slider is read-only.'], link: { label: 'Explorer', to: '/explorer' } },
    { key: 'engine', title: 'Institution Engine', summary: 'Departments behave autonomously inside the simulation boundary.', points: ['Department cycles are deterministic functions of the day index.', 'Conversations and decisions are derived, never randomised per render.', 'Health and score recompute from the same primitives every module uses.'], link: { label: 'Observatory', to: '/observatory' } },
    { key: 'sdk', title: 'Extension SDK', summary: 'The build standard every future module must follow.', points: SDK_SECTIONS.slice(0, 5).map((s) => `${s.title}: ${s.intent}`), link: { label: 'Plugin SDK', to: '/plugin-sdk' } },
    { key: 'performance', title: 'Performance Guide', summary: `Current render sample ${perfRender.toFixed(1)}ms against a 16ms budget.`, points: ['Memoise derived collections above a few hundred items.', 'Virtualise any table beyond 200 rows.', 'Cap graph canvases at the published node limit.', 'Avoid layout thrash: batch reads before writes.'], link: { label: 'Performance Centre', to: '/performance' } },
    { key: 'accessibility', title: 'Accessibility Guide', summary: 'Keyboard first, screen reader complete, contrast safe in every theme.', points: ['Focus ring is provided globally; never remove outline.', 'aria-label every icon-only control.', 'Respect html.atlas-reduced-motion.', 'Validate contrast in Executive Light and High Contrast.'], link: { label: 'Enterprise Settings', to: '/settings' } },
  ];
}

// ══════════════════════════════════════════════════════════
// FEATURE 9 — Institution Certification™
// ══════════════════════════════════════════════════════════

export interface CertificationDimension {
  key: string; label: string; score: number; note: string;
}

export function certification() {
  const score = institutionScore();
  const iq = institutionIQ();
  const quality = qualityIndex();
  const launch = launchChecklist();
  const perfRender = renderSample();

  const dims: CertificationDimension[] = [
    { key: 'architecture', label: 'Architecture', score: clamp(92 + EXTENSIONS.length / 4), note: 'Five-layer separation with one-directional dependencies.' },
    { key: 'performance', label: 'Performance', score: clamp(100 - perfRender * 2), note: `Render sample ${perfRender.toFixed(1)}ms against a 16ms budget.` },
    { key: 'governance', label: 'Governance', score: clamp(96), note: `${GOVERNANCE_GUARANTEES.length} guarantees enforced across every module.` },
    { key: 'documentation', label: 'Documentation', score: clamp(88 + SDK_SECTIONS.length), note: 'SDK, Developer Centre and generated documentation are complete.' },
    { key: 'accessibility', label: 'Accessibility', score: clamp(93), note: 'Keyboard navigation, focus states, reduced motion and high contrast.' },
    { key: 'consistency', label: 'Consistency', score: clamp(94), note: 'Shared page frame, tokens, icons and motion across all surfaces.' },
    { key: 'knowledge', label: 'Knowledge Integrity', score: clamp(quality.total), note: `${KNOWLEDGE_NODES.length} objects, ${KNOWLEDGE_EDGES.length} relationships, full provenance.` },
    { key: 'maturity', label: 'Institution Maturity', score: clamp(score.total), note: `Institution score ${score.total} (${score.grade}).` },
    { key: 'executive', label: 'Executive Readiness', score: clamp(launch.total), note: `Launch readiness ${launch.total} with an exportable audit trail.` },
  ];

  const overall = clamp(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  const grade = overall >= 95 ? 'A+' : overall >= 90 ? 'A' : overall >= 85 ? 'A−' : overall >= 80 ? 'B+' : 'B';
  const level = overall >= 92 ? 'Institutional Grade' : overall >= 85 ? 'Enterprise Grade' : 'Professional Grade';

  return {
    dims, overall, grade, level,
    iq: iq.total,
    issued: new Date().toISOString().slice(0, 10),
    reference: `ATLAS-CERT-${new Date().getFullYear()}-${String(overall).padStart(3, '0')}`,
    statement: 'This certificate records a simulated institutional readiness assessment. ATLAS OS operates permanently in observation, research and simulation mode with no live trading, no exchange connectivity and no API keys.',
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 10 — Future Roadmap™
// ══════════════════════════════════════════════════════════

export type RoadmapState = 'Completed' | 'Current' | 'Next' | 'Planned' | 'Vision';

export interface RoadmapPhase {
  id: string;
  phase: string;
  title: string;
  state: RoadmapState;
  summary: string;
  deliverables: string[];
  link?: { label: string; to: string };
}

export const ROADMAP: RoadmapPhase[] = [
  { id: 'ph1', phase: 'Phase 1', title: 'Research Foundation', state: 'Completed', summary: 'Strategy research, backtesting, validation packs and specialist discovery.', deliverables: ['Backtest engine', 'Validation packs', 'Robustness audits', 'Specialist roster'], link: { label: 'Specialist Approval Board', to: '/specialist-approval-board' } },
  { id: 'ph2', phase: 'Phase 2', title: 'Portfolio Intelligence', state: 'Completed', summary: 'Allocation research, forward validation and the Portfolio AI Director.', deliverables: ['Allocation Lab v1 and v2', 'Champion Forward Trial', 'Portfolio AI Director'], link: { label: 'Portfolio AI Director', to: '/portfolio-ai-director' } },
  { id: 'ph3', phase: 'Phase 3', title: 'AI Departments', state: 'Completed', summary: 'Research Brain, Quant Scientist, CIO, Assistant and the Intelligence Network.', deliverables: ['AI Research Brain', 'AI Quant Scientist', 'AI CIO', 'Intelligence Network'], link: { label: 'Research Brain', to: '/research-brain' } },
  { id: 'ph4', phase: 'Phase 4', title: 'ATLAS Knowledge Layer', state: 'Completed', summary: 'Knowledge Graph, Explorer, Oracle and the institutional intelligence layer.', deliverables: ['Knowledge Graph', 'Intelligence Explorer', 'ATLAS Oracle', 'Command Palette'], link: { label: 'Knowledge Graph', to: '/knowledge-graph' } },
  { id: 'ph5', phase: 'Phase 5', title: 'Institution Operating System', state: 'Completed', summary: 'Departments, living institution cycles and the self-improving intelligence engine.', deliverables: ['ATLAS OS v2 to v4', 'Observatory', 'Institution IQ', 'Evolution Timeline'], link: { label: 'Institution Dashboard', to: '/institution' } },
  { id: 'ph6', phase: 'Phase 6', title: 'Enterprise Readiness', state: 'Completed', summary: 'Executive Home, Global Search 2.0, performance, documentation and launch readiness.', deliverables: ['Executive Home', 'Search 2.0', 'Performance Centre', 'Launch Checklist'], link: { label: 'Launch Checklist', to: '/launch' } },
  { id: 'ph7', phase: 'Phase 7', title: 'Extensible Platform', state: 'Current', summary: 'Extension Manager, Marketplace, Plugin SDK, Theme Engine, Templates, Workflows, Package, Developer Centre, Certification and Roadmap.', deliverables: ['Extension Manager™', 'App Marketplace™', 'Plugin SDK™', 'Theme Engine™', 'Institution Templates™', 'Certification™'], link: { label: 'Extension Manager', to: '/extensions' } },
  { id: 'ph8', phase: 'Phase 8', title: 'Institutional Collaboration', state: 'Next', summary: 'Multi-seat review workflows, annotation of evidence and shared executive workspaces.', deliverables: ['Reviewer seats', 'Evidence annotation', 'Shared workspaces', 'Review sign-off trail'] },
  { id: 'ph9', phase: 'Phase 9', title: 'Extended Knowledge Fabric', state: 'Planned', summary: 'Deeper provenance, versioned knowledge snapshots and cross-institution comparison.', deliverables: ['Knowledge snapshots', 'Provenance diffing', 'Cross-institution benchmarks'] },
  { id: 'ph10', phase: 'Phase 10', title: 'Institutional Autonomy Studies', state: 'Vision', summary: 'Longer-horizon simulated autonomy research under permanent human approval gates.', deliverables: ['Extended simulation horizons', 'Autonomy safety studies', 'Institutional memory at multi-year scale'] },
];

export const ROADMAP_STATE_ORDER: RoadmapState[] = ['Completed', 'Current', 'Next', 'Planned', 'Vision'];

export const PLATFORM_GUARANTEES = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Read Only',
  'Human Approval Required', 'No Live Trading', 'No Exchange Connectivity',
  'No API Keys', 'No Strategy Modification', 'No Automatic Allocation',
];
