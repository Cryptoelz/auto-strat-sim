// Institutional Knowledge Graph™ — permanent reasoning map of the institution.
// OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY / HUMAN APPROVAL REQUIRED.
// Read-only knowledge model. No exchange connectivity, no API keys, no strategy
// modification, no allocation change, no live trading.

export type KnowledgeNodeType =
  | 'question'
  | 'hypothesis'
  | 'experiment'
  | 'validation'
  | 'discovery'
  | 'breakthrough'
  | 'paper'
  | 'thread'
  | 'specialist'
  | 'department'
  | 'governance'
  | 'promotion'
  | 'recommendation'
  | 'report'
  | 'lesson'
  | 'risk'
  | 'architecture'
  | 'portfolio'
  | 'allocation'
  | 'memory'
  | 'rejected';

export type RelationshipType =
  | 'supports'
  | 'contradicts'
  | 'derived-from'
  | 'validated-by'
  | 'rejected-by'
  | 'feeds'
  | 'depends-on'
  | 'inspired'
  | 'created'
  | 'superseded'
  | 'promoted-to'
  | 'blocked-by'
  | 'archived-as'
  | 'used-by';

export type KnowledgeStrength = 'very-strong' | 'strong' | 'moderate' | 'weak' | 'rejected' | 'unknown';

export type NodeStatus = 'validated' | 'active' | 'open' | 'rejected' | 'archived' | 'blocked';

export interface KnowledgeNode {
  id: string;
  title: string;
  type: KnowledgeNodeType;
  status: NodeStatus;
  created: string;
  confidence: number;      // 0-100
  evidenceScore: number;   // 0-100
  owner: string;
  department: string;
  summary: string;
  supportingEvidence: string[];
  counterEvidence: string[];
  lessons: string[];
  promotionHistory: string[];
  governanceHistory: string[];
  currentUsage: string[];
  futureResearch: string[];
  link?: string;
  x: number;
  y: number;
}

export interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  strength: KnowledgeStrength;
  confidence: number;
  note: string;
}

export interface NodeTypeMeta {
  label: string;
  color: string;   // css var reference
  icon: string;    // lucide icon key resolved in the UI
}

export const NODE_TYPE_META: Record<KnowledgeNodeType, NodeTypeMeta> = {
  question:       { label: 'Question',                 color: 'var(--kg-question)',       icon: 'HelpCircle' },
  hypothesis:     { label: 'Hypothesis',               color: 'var(--kg-hypothesis)',     icon: 'Lightbulb' },
  experiment:     { label: 'Experiment',               color: 'var(--kg-experiment)',     icon: 'FlaskConical' },
  validation:     { label: 'Validation',               color: 'var(--kg-validation)',     icon: 'ShieldCheck' },
  discovery:      { label: 'Discovery',                color: 'var(--kg-discovery)',      icon: 'Sparkles' },
  breakthrough:   { label: 'Breakthrough',             color: 'var(--kg-breakthrough)',   icon: 'Rocket' },
  paper:          { label: 'Research Paper',           color: 'var(--kg-paper)',          icon: 'FileText' },
  thread:         { label: 'Research Thread',          color: 'var(--kg-thread)',         icon: 'GitBranch' },
  specialist:     { label: 'Specialist',               color: 'var(--kg-specialist)',     icon: 'Crosshair' },
  department:     { label: 'Department',               color: 'var(--kg-department)',     icon: 'Building2' },
  governance:     { label: 'Governance Decision',      color: 'var(--kg-governance)',     icon: 'Gavel' },
  promotion:      { label: 'Promotion Decision',       color: 'var(--kg-promotion)',      icon: 'ArrowUpCircle' },
  recommendation: { label: 'Executive Recommendation', color: 'var(--kg-recommendation)', icon: 'Crown' },
  report:         { label: 'Executive Report',         color: 'var(--kg-report)',         icon: 'ClipboardCheck' },
  lesson:         { label: 'Lesson Learned',           color: 'var(--kg-lesson)',         icon: 'BookOpen' },
  risk:           { label: 'Risk',                     color: 'var(--kg-risk)',           icon: 'AlertTriangle' },
  architecture:   { label: 'Architecture Decision',    color: 'var(--kg-architecture)',   icon: 'Layers' },
  portfolio:      { label: 'Portfolio Study',          color: 'var(--kg-portfolio)',      icon: 'PieChart' },
  allocation:     { label: 'Allocation Study',         color: 'var(--kg-allocation)',     icon: 'Scale' },
  memory:         { label: 'Institutional Memory',     color: 'var(--kg-memory)',         icon: 'Library' },
  rejected:       { label: 'Rejected Idea',            color: 'var(--kg-rejected)',       icon: 'XCircle' },
};

export const RELATIONSHIP_META: Record<RelationshipType, { label: string; color: string }> = {
  supports:      { label: 'Supports',      color: 'var(--kg-rel-support)' },
  contradicts:   { label: 'Contradicts',   color: 'var(--kg-rel-contradict)' },
  'derived-from':{ label: 'Derived From',  color: 'var(--kg-rel-derive)' },
  'validated-by':{ label: 'Validated By',  color: 'var(--kg-rel-validate)' },
  'rejected-by': { label: 'Rejected By',   color: 'var(--kg-rel-contradict)' },
  feeds:         { label: 'Feeds',         color: 'var(--kg-rel-feed)' },
  'depends-on':  { label: 'Depends On',    color: 'var(--kg-rel-depend)' },
  inspired:      { label: 'Inspired',      color: 'var(--kg-rel-inspire)' },
  created:       { label: 'Created',       color: 'var(--kg-rel-create)' },
  superseded:    { label: 'Superseded',    color: 'var(--kg-rel-supersede)' },
  'promoted-to': { label: 'Promoted To',   color: 'var(--kg-rel-promote)' },
  'blocked-by':  { label: 'Blocked By',    color: 'var(--kg-rel-block)' },
  'archived-as': { label: 'Archived As',   color: 'var(--kg-rel-archive)' },
  'used-by':     { label: 'Used By',       color: 'var(--kg-rel-use)' },
};

export const STRENGTH_META: Record<KnowledgeStrength, { label: string; width: number }> = {
  'very-strong': { label: 'Very Strong', width: 3.4 },
  strong:        { label: 'Strong',      width: 2.6 },
  moderate:      { label: 'Moderate',    width: 1.8 },
  weak:          { label: 'Weak',        width: 1.1 },
  rejected:      { label: 'Rejected',    width: 1.4 },
  unknown:       { label: 'Unknown',     width: 0.9 },
};

// ─── Nodes ───────────────────────────────────────────────────────────

const n = (
  id: string, title: string, type: KnowledgeNodeType, status: NodeStatus,
  x: number, y: number, confidence: number, evidenceScore: number,
  created: string, owner: string, department: string, summary: string,
  extra: Partial<KnowledgeNode> = {},
): KnowledgeNode => ({
  id, title, type, status, x, y, confidence, evidenceScore, created, owner, department, summary,
  supportingEvidence: [], counterEvidence: [], lessons: [], promotionHistory: [],
  governanceHistory: [], currentUsage: [], futureResearch: [], ...extra,
});

export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  // Origin questions
  n('Q-001', 'Why does Router v2 ignore profitable sub-threshold moves?', 'question', 'validated', 60, 320, 88, 82,
    '2026-03-02', 'Research Brain', 'AI Research Brain',
    'Origin question behind the Trade Frequency Opportunity Audit and the entire threshold-reduction research line.',
    { supportingEvidence: ['Trade Frequency Audit: XRP 1.8–2.99% band under-captured', '30-day idle-capital measurement'], currentUsage: ['Router v2.1 research', 'Move Capture Audit'], link: '/trade-frequency', futureResearch: ['Extend band analysis to ETH and SOL'] }),
  n('Q-002', 'Can low-volatility compression be traded as a distinct edge?', 'question', 'validated', 60, 640, 84, 79,
    '2026-04-11', 'Quant Scientist', 'AI Quant Scientist',
    'Question that produced the compression research family (VCB v1 and Low-Vol Coiler).',
    { supportingEvidence: ['Coverage Gap Scanner flagged low-vol blind spot', 'Specialist Discovery Lab v2 ranking board'], currentUsage: ['VCB v1', 'Low-Vol Coiler v2'], link: '/specialist-discovery-v2' }),
  n('Q-003', 'How should specialists share capital across regimes?', 'question', 'active', 60, 980, 80, 74,
    '2026-05-06', 'Portfolio AI Director', 'Portfolio AI Director',
    'Allocation question that generated Allocation Lab v1 and v2.',
    { supportingEvidence: ['Regime coverage map', 'Specialist contribution table (90d)'], currentUsage: ['Allocation Lab v2', 'Champion Trial'], link: '/allocation-lab-v2' }),

  // Hypotheses
  n('HYP-014', 'Reducing entry thresholds by 10% increases frequency without damaging PF', 'hypothesis', 'validated', 340, 240, 76, 71,
    '2026-03-05', 'Research Brain', 'AI Research Brain', 'Threshold-reduction hypothesis behind Router v2.1.',
    { supportingEvidence: ['Sub-threshold band profitability +0.42R average'], counterEvidence: ['Simulated drawdown increases 0.3pts at -30%'], currentUsage: ['Router v2.1'], link: '/router-v21' }),
  n('HYP-018', 'Compression persistence predicts expansion direction quality', 'hypothesis', 'validated', 340, 600, 81, 84,
    '2026-04-14', 'Quant Scientist', 'AI Quant Scientist', 'Core hypothesis behind Low-Vol Coiler and VCB.',
    { supportingEvidence: ['BB-width percentile study', 'ATR contraction persistence >4 candles improves PF'], currentUsage: ['Low-Vol Coiler v2', 'VCB v1'], link: '/low-vol-coiler-v2' }),
  n('HYP-021', 'Confidence-weighted allocation beats fixed regime weights', 'hypothesis', 'validated', 340, 980, 79, 80,
    '2026-05-09', 'Portfolio AI Director', 'Portfolio AI Director', 'Allocation hypothesis validated in Allocation Lab v2.',
    { supportingEvidence: ['PF 2.11 vs 1.86 dynamic v1'], counterEvidence: ['Sensitive to regime-confidence calibration drift'], link: '/allocation-lab-v2' }),
  n('HYP-009', 'A volume-breakout clone adds uncorrelated edge', 'hypothesis', 'rejected', 340, 1300, 24, 31,
    '2026-04-02', 'Discovery Lab', 'AI Quant Scientist', 'Rejected hypothesis retained as institutional knowledge.',
    { counterEvidence: ['74% behavioural overlap with Momentum Scalper v2', 'PF 1.08 out-of-sample'] }),

  // Experiments
  n('EXP-041', 'Threshold sensitivity sweep (-10/-20/-30%)', 'experiment', 'validated', 620, 180, 74, 77,
    '2026-03-08', 'Backtest Engine', 'Research Operations', 'Grid sweep of entry threshold reductions across BTC/XRP/ETH/SOL.',
    { supportingEvidence: ['-10%: PF 1.94, DD 2.5%, WR 54%'], counterEvidence: ['-30%: PF 1.61, DD 3.4%'], link: '/trade-frequency' }),
  n('EXP-052', 'Compression persistence validation pack', 'experiment', 'validated', 620, 560, 86, 89,
    '2026-04-18', 'Quant Scientist', 'AI Quant Scientist', 'Multi-asset, multi-window validation of compression persistence.',
    { supportingEvidence: ['PF 1.74 across 90d', 'Capture 64%', 'Stable across BTC/ETH/SOL/XRP'], link: '/low-vol-coiler-v2' }),
  n('EXP-058', 'Confidence-weighted allocation stress test', 'experiment', 'validated', 620, 1000, 78, 81,
    '2026-05-13', 'Allocation Lab', 'Portfolio AI Director', 'Stress test of confidence weighting under 12 synthetic regimes.',
    { supportingEvidence: ['Worst-case DD 2.8%'], counterEvidence: ['Chop regime PF dips to 1.42'], link: '/allocation-lab-v2' }),
  n('EXP-033', 'Volume breakout clone out-of-sample test', 'experiment', 'rejected', 620, 1340, 30, 44,
    '2026-04-05', 'Discovery Lab', 'AI Quant Scientist', 'Out-of-sample test that produced the counter evidence for HYP-009.',
    { counterEvidence: ['PF 1.08', 'Overlap detector 74%'] }),

  // Validation / discovery
  n('VAL-012', 'Router v2.1 forward validation', 'validation', 'active', 900, 200, 66, 63,
    '2026-03-22', 'Forward Validation', 'Research Operations', 'Observation-mode forward validation of the -10% threshold fork.',
    { supportingEvidence: ['21 days runtime, 14 trades'], counterEvidence: ['Promotion gate not met (30d / 20 trades)'], link: '/forward-validation' }),
  n('VAL-019', 'Low-Vol Coiler v2 robustness audit', 'validation', 'validated', 900, 520, 83, 86,
    '2026-04-25', 'Robustness Audit', 'AI Quant Scientist', 'Regime-decay audit confirming specialist status.',
    { supportingEvidence: ['PF 1.74 with regime gating', 'Dead-zone behaviour understood'], link: '/low-vol-coiler-v2' }),
  n('DIS-007', 'Activation lag inflates Low-Vol Coiler entry slippage', 'discovery', 'active', 900, 700, 71, 68,
    '2026-04-28', 'Autonomous Research Engine', 'Autonomous Research Engine',
    'Unexpected discovery found while reviewing EXP-052 audit logs.',
    { supportingEvidence: ['Median 1.6 candle activation lag'], futureResearch: ['Test pre-arm activation window'] }),
  n('BRK-003', 'Compression → expansion regime handoff is tradable', 'breakthrough', 'validated', 1180, 620, 88, 90,
    '2026-05-02', 'Quant Scientist', 'AI Quant Scientist', 'Breakthrough that unified VCB and Low-Vol Coiler research.',
    { supportingEvidence: ['Handoff window PF 2.2', 'Reproduced across 4 assets'], link: '/quant-scientist' }),

  // Specialists
  n('SPC-LVC', 'Low-Vol Coiler v2', 'specialist', 'validated', 1180, 460, 82, 85,
    '2026-04-30', 'Specialist Board', 'Specialist Programme', 'Approved compression specialist. Research only.',
    { supportingEvidence: ['Capture 64%, PF 1.74'], currentUsage: ['Confidence Weighted Allocation', 'Champion Trial'], link: '/low-vol-coiler-v2' }),
  n('SPC-VCB', 'VCB v1', 'specialist', 'validated', 1180, 820, 79, 81,
    '2026-04-20', 'Specialist Board', 'Specialist Programme', 'Volatility compression breakout specialist.',
    { supportingEvidence: ['PF 1.64, capture 67%'], link: '/vcb-v1' }),
  n('SPC-MS2', 'Momentum Scalper v2', 'specialist', 'validated', 1180, 1140, 74, 76,
    '2026-04-08', 'Specialist Board', 'Specialist Programme', 'Regime-gated momentum specialist (PF 1.21 → 1.56).',
    { supportingEvidence: ['Activation precision 81.6%'], counterEvidence: ['Metric drift flagged in forward validation'], link: '/momentum-scalper-v2' }),

  // Allocation / portfolio
  n('ALO-002', 'Confidence Weighted Allocation', 'allocation', 'active', 1460, 860, 80, 83,
    '2026-05-16', 'Allocation Lab v2', 'Portfolio AI Director', 'Research champion allocation model, PF 2.11 in-sample.',
    { supportingEvidence: ['Beats Dynamic v1 by 13%'], counterEvidence: ['Calibration sensitivity'], link: '/allocation-lab-v2' }),
  n('PRT-004', 'Portfolio PF (observation)', 'portfolio', 'active', 1740, 760, 72, 70,
    '2026-05-20', 'Forward Validation', 'Portfolio AI Director', 'Observed portfolio profit factor under forward validation.',
    { supportingEvidence: ['PF 2.04 rolling'], counterEvidence: ['PF -0.07 over last 7 days'], link: '/forward-validation' }),
  n('TRL-001', 'Champion Forward Trial', 'thread', 'active', 1740, 1040, 69, 72,
    '2026-05-22', 'Champion Trial', 'Research Operations', 'Head-to-head forward trial: Confidence Weighted vs Dynamic v1.',
    { supportingEvidence: ['Challenger win probability 72%'], link: '/champion-trial' }),

  // Governance / promotion / recommendation / reports
  n('GOV-011', 'Promotion locked until 30 days and 20 trades', 'governance', 'blocked', 1460, 200, 95, 92,
    '2026-03-24', 'Governance', 'Governance', 'Hard promotion gate applied to Router v2.1 and all challengers.',
    { governanceHistory: ['Applied 2026-03-24', 'Re-affirmed 2026-05-18'], link: '/governance' }),
  n('GOV-016', 'Volume breakout clone rejected at governance review', 'governance', 'rejected', 900, 1340, 90, 88,
    '2026-04-07', 'Governance', 'Governance', 'Governance review that formally rejected HYP-009.',
    { governanceHistory: ['Rejected 2026-04-07 — overlap threshold breach'], link: '/governance' }),
  n('PRM-005', 'Specialist approval — Low-Vol Coiler v2', 'promotion', 'validated', 1460, 460, 85, 84,
    '2026-05-01', 'Specialist Approval Board', 'Specialist Programme', 'Board approval of LVC v2 to specialist roster.',
    { promotionHistory: ['Approved 2026-05-01 (roster readiness 94)'], link: '/specialist-approval-board' }),
  n('REC-021', 'Advance Confidence Weighted to extended forward trial', 'recommendation', 'active', 2020, 900, 74, 76,
    '2026-05-25', 'ATLAS', 'ATLAS', 'Primary executive recommendation, 74% board consensus. Human approval required.',
    { supportingEvidence: ['6 of 8 departments in favour'], counterEvidence: ['Governance: gate not yet cleared'], link: '/atlas' }),
  n('RPT-009', 'Monthly Research Report — May', 'report', 'archived', 2020, 620, 88, 80,
    '2026-06-01', 'Research Operations', 'Research Operations', 'Monthly institutional report referencing the compression research family.',
    { link: '/monthly-report' }),
  n('PAP-004', 'Adaptive Compression Momentum (research paper)', 'paper', 'validated', 1460, 620, 77, 79,
    '2026-05-05', 'Quant Scientist', 'AI Quant Scientist', 'Peer-reviewed internal paper formalising BRK-003.',
    { supportingEvidence: ['3 of 3 AI peer reviewers accepted'], link: '/quant-scientist' }),

  // Risk / architecture / lessons / memory / rejected
  n('RSK-006', 'Regime-confidence calibration drift', 'risk', 'open', 1740, 1300, 62, 58,
    '2026-05-27', 'Risk Radar', 'Portfolio AI Director', 'Open risk: allocation confidence inputs may drift with regime detector recalibration.',
    { futureResearch: ['Backfill calibration audit across 90 days'], link: '/portfolio-ai-director' }),
  n('ARC-003', 'Five-layer portfolio architecture', 'architecture', 'validated', 1740, 460, 86, 87,
    '2026-05-10', 'Architecture Review', 'Portfolio AI Director', 'Regime → selection → allocation → execution → risk. Verdict: mature.',
    { link: '/portfolio-architecture-review' }),
  n('LES-014', 'Behavioural overlap above 60% destroys diversification value', 'lesson', 'archived', 1180, 1340, 91, 89,
    '2026-04-09', 'Institutional Memory', 'Governance', 'Lesson extracted from the rejected volume-breakout clone.',
    { lessons: ['Run overlap detection before validation spend'], link: '/research-brain' }),
  n('LES-008', 'Specialists must be regime-gated before promotion', 'lesson', 'archived', 1460, 1140, 89, 88,
    '2026-04-10', 'Institutional Memory', 'Specialist Programme', 'Lesson from Momentum Scalper v1 → v2 conversion.',
    { lessons: ['Gate first, then measure PF'], link: '/momentum-scalper-v2' }),
  n('MEM-001', 'Institutional Memory — compression research family', 'memory', 'archived', 2300, 760, 93, 91,
    '2026-06-02', 'ATLAS', 'ATLAS', 'Permanent archive of the compression research line and every decision attached to it.',
    { link: '/research-brain' }),
  n('MEM-002', 'Institutional Memory — rejected ideas ledger', 'memory', 'archived', 1460, 1340, 92, 90,
    '2026-04-12', 'ATLAS', 'ATLAS', 'Permanent ledger of rejected research, retained so failures remain institutional knowledge.',
    { link: '/research-brain' }),
  n('REJ-002', 'Volume Breakout Clone', 'rejected', 'rejected', 60, 1300, 22, 35,
    '2026-03-30', 'Discovery Lab', 'AI Quant Scientist', 'Rejected specialist candidate. Retained permanently for institutional learning.',
    { counterEvidence: ['Overlap 74%', 'PF 1.08 out-of-sample'], link: '/specialist-discovery-v2' }),

  // Departments
  n('DPT-BRAIN', 'AI Research Brain', 'department', 'active', 60, 60, 87, 84, '2026-02-01', 'ATLAS', 'ATLAS',
    'Decides what should be researched next.', { link: '/research-brain' }),
  n('DPT-QUANT', 'AI Quant Scientist', 'department', 'active', 340, 60, 85, 83, '2026-02-01', 'ATLAS', 'ATLAS',
    'Designs and validates new strategy ideas.', { link: '/quant-scientist' }),
  n('DPT-DIR', 'Portfolio AI Director', 'department', 'active', 620, 60, 84, 82, '2026-02-01', 'ATLAS', 'ATLAS',
    'Owns allocation and portfolio architecture research.', { link: '/portfolio-ai-director' }),
  n('DPT-GOV', 'Governance', 'department', 'active', 900, 60, 96, 95, '2026-02-01', 'ATLAS', 'ATLAS',
    'Enforces observation-only guardrails and promotion gates.', { link: '/governance' }),
  n('DPT-ATLAS', 'ATLAS Executive', 'department', 'active', 1180, 60, 89, 86, '2026-02-01', 'ATLAS', 'ATLAS',
    'Coordinates every department into one recommendation.', { link: '/atlas' }),
];

// ─── Edges ───────────────────────────────────────────────────────────

const e = (from: string, to: string, type: RelationshipType, strength: KnowledgeStrength, confidence: number, note: string): KnowledgeEdge =>
  ({ id: `${from}->${to}:${type}`, from, to, type, strength, confidence, note });

export const KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  // Departments create the origin work
  e('DPT-BRAIN', 'Q-001', 'created', 'strong', 90, 'Research Brain raised the frequency question.'),
  e('DPT-QUANT', 'Q-002', 'created', 'strong', 88, 'Quant Scientist raised the compression question.'),
  e('DPT-DIR', 'Q-003', 'created', 'strong', 85, 'Portfolio Director raised the allocation question.'),
  e('DPT-QUANT', 'REJ-002', 'created', 'moderate', 60, 'Discovery Lab generated the clone candidate.'),
  e('DPT-GOV', 'GOV-011', 'created', 'very-strong', 97, 'Governance issued the promotion gate.'),
  e('DPT-GOV', 'GOV-016', 'created', 'very-strong', 95, 'Governance issued the rejection decision.'),
  e('DPT-ATLAS', 'REC-021', 'created', 'strong', 86, 'ATLAS produced the executive recommendation.'),

  // Frequency line
  e('HYP-014', 'Q-001', 'derived-from', 'strong', 84, 'Hypothesis derived directly from the frequency question.'),
  e('EXP-041', 'HYP-014', 'validated-by', 'strong', 79, 'Sweep tested the -10/-20/-30% variants.'),
  e('EXP-041', 'VAL-012', 'feeds', 'moderate', 72, 'Sweep result fed the Router v2.1 forward validation.'),
  e('VAL-012', 'GOV-011', 'blocked-by', 'very-strong', 96, 'Promotion blocked until 30 days and 20 trades.'),
  e('EXP-041', 'PRT-004', 'feeds', 'weak', 48, 'Frequency work contributes marginally to portfolio PF study.'),

  // Compression line (example chain)
  e('HYP-018', 'Q-002', 'derived-from', 'very-strong', 90, 'Compression persistence derived from the low-vol question.'),
  e('REJ-002', 'HYP-018', 'inspired', 'weak', 40, 'The failed clone pushed research toward compression instead.'),
  e('EXP-052', 'HYP-018', 'validated-by', 'very-strong', 91, 'Validation pack confirmed persistence effect.'),
  e('EXP-052', 'VAL-019', 'feeds', 'strong', 84, 'Validation pack fed the robustness audit.'),
  e('VAL-019', 'SPC-LVC', 'supports', 'very-strong', 88, 'Robustness audit supported specialist approval.'),
  e('SPC-LVC', 'HYP-018', 'derived-from', 'strong', 86, 'Specialist derived from compression persistence.'),
  e('DIS-007', 'EXP-052', 'derived-from', 'moderate', 70, 'Activation lag discovered inside EXP-052 audit logs.'),
  e('DIS-007', 'SPC-LVC', 'contradicts', 'moderate', 64, 'Lag partially contradicts clean entry assumptions.'),
  e('BRK-003', 'EXP-052', 'derived-from', 'very-strong', 89, 'Breakthrough emerged from compression validation.'),
  e('BRK-003', 'SPC-VCB', 'supports', 'strong', 82, 'Breakthrough explains VCB behaviour.'),
  e('SPC-VCB', 'Q-002', 'derived-from', 'strong', 80, 'VCB derived from the same origin question.'),
  e('PAP-004', 'BRK-003', 'derived-from', 'strong', 83, 'Paper formalises the breakthrough.'),
  e('PRM-005', 'SPC-LVC', 'promoted-to', 'strong', 85, 'Specialist Approval Board added LVC v2 to the roster.'),

  // Allocation line
  e('HYP-021', 'Q-003', 'derived-from', 'strong', 82, 'Confidence weighting derived from the allocation question.'),
  e('EXP-058', 'HYP-021', 'validated-by', 'strong', 81, 'Stress test validated the weighting model.'),
  e('ALO-002', 'EXP-058', 'derived-from', 'strong', 80, 'Allocation model built on the stress-tested design.'),
  e('SPC-LVC', 'ALO-002', 'supports', 'strong', 84, 'LVC v2 supplies the compression sleeve.'),
  e('SPC-VCB', 'ALO-002', 'supports', 'moderate', 74, 'VCB supplies breakout capture.'),
  e('SPC-MS2', 'ALO-002', 'supports', 'moderate', 68, 'Momentum sleeve, currently drifting.'),
  e('ALO-002', 'PRT-004', 'feeds', 'very-strong', 87, 'Allocation model drives observed portfolio PF.'),
  e('PRT-004', 'TRL-001', 'used-by', 'strong', 83, 'Portfolio PF is the trial scoring metric.'),
  e('TRL-001', 'REC-021', 'feeds', 'strong', 80, 'Trial evidence underpins the recommendation.'),
  e('REC-021', 'GOV-011', 'blocked-by', 'strong', 84, 'Recommendation cannot execute until the gate clears.'),
  e('RSK-006', 'ALO-002', 'contradicts', 'moderate', 61, 'Calibration drift threatens allocation confidence inputs.'),
  e('ARC-003', 'ALO-002', 'depends-on', 'strong', 82, 'Architecture allocation layer depends on the model.'),
  e('RPT-009', 'BRK-003', 'used-by', 'moderate', 74, 'Monthly report references the breakthrough.'),
  e('RPT-009', 'PRT-004', 'used-by', 'moderate', 71, 'Monthly report references portfolio PF.'),

  // Failure chain
  e('HYP-009', 'REJ-002', 'derived-from', 'moderate', 58, 'Hypothesis written for the clone candidate.'),
  e('EXP-033', 'HYP-009', 'validated-by', 'rejected', 30, 'Test produced counter evidence, not support.'),
  e('EXP-033', 'GOV-016', 'feeds', 'strong', 86, 'Counter evidence escalated to governance review.'),
  e('GOV-016', 'HYP-009', 'rejected-by', 'rejected', 92, 'Governance formally rejected the hypothesis.'),
  e('LES-014', 'GOV-016', 'derived-from', 'strong', 88, 'Lesson extracted from the rejection.'),
  e('LES-014', 'MEM-002', 'archived-as', 'very-strong', 93, 'Lesson archived permanently.'),
  e('REJ-002', 'MEM-002', 'archived-as', 'very-strong', 92, 'Rejected idea retained in the ledger.'),
  e('LES-008', 'SPC-MS2', 'derived-from', 'strong', 85, 'Lesson from the v1 → v2 gating conversion.'),
  e('LES-008', 'MEM-002', 'archived-as', 'strong', 87, 'Archived into institutional memory.'),

  // Archive into memory
  e('REC-021', 'MEM-001', 'archived-as', 'strong', 85, 'Recommendation archived with full evidence trail.'),
  e('BRK-003', 'MEM-001', 'archived-as', 'very-strong', 90, 'Breakthrough permanently archived.'),
  e('PAP-004', 'MEM-001', 'archived-as', 'strong', 86, 'Paper permanently archived.'),
  e('SPC-MS2', 'LES-008', 'superseded', 'moderate', 66, 'v1 superseded by the regime-gated v2.'),
];

// ─── Derived indices ─────────────────────────────────────────────────

export const NODE_BY_ID: Record<string, KnowledgeNode> = Object.fromEntries(KNOWLEDGE_NODES.map((k) => [k.id, k]));

export function outgoing(id: string) { return KNOWLEDGE_EDGES.filter((k) => k.from === id); }
export function incoming(id: string) { return KNOWLEDGE_EDGES.filter((k) => k.to === id); }
export function connections(id: string) { return KNOWLEDGE_EDGES.filter((k) => k.from === id || k.to === id); }

export function degree(id: string) { return connections(id).length; }

export interface TraceStep { node: KnowledgeNode; edge?: KnowledgeEdge; depth: number }

/** Trace backwards (what this came from) or forwards (what it produced). */
export function trace(id: string, direction: 'back' | 'forward', maxDepth = 6): TraceStep[] {
  const seen = new Set<string>([id]);
  const out: TraceStep[] = [{ node: NODE_BY_ID[id], depth: 0 }];
  let frontier = [id];
  for (let d = 1; d <= maxDepth && frontier.length; d++) {
    const next: string[] = [];
    for (const cur of frontier) {
      const edges = direction === 'back' ? outgoing(cur) : incoming(cur);
      for (const edge of edges) {
        const other = direction === 'back' ? edge.to : edge.from;
        if (seen.has(other) || !NODE_BY_ID[other]) continue;
        seen.add(other);
        out.push({ node: NODE_BY_ID[other], edge, depth: d });
        next.push(other);
      }
    }
    frontier = next;
  }
  return out;
}

export interface ImpactAnalysis {
  modules: string[];
  specialists: string[];
  reports: string[];
  experiments: string[];
  portfolioStudies: string[];
  promotions: string[];
  governance: string[];
  recommendations: string[];
}

export function impactAnalysis(id: string): ImpactAnalysis {
  const reachable = trace(id, 'forward', 6).slice(1).map((s) => s.node)
    .concat(trace(id, 'back', 6).slice(1).map((s) => s.node));
  const uniq = Array.from(new Map(reachable.map((r) => [r.id, r])).values());
  const pick = (t: KnowledgeNodeType[]) => uniq.filter((u) => t.includes(u.type)).map((u) => `${u.id} · ${u.title}`);
  return {
    modules: Array.from(new Set(uniq.filter((u) => u.link).map((u) => u.department))),
    specialists: pick(['specialist']),
    reports: pick(['report', 'paper']),
    experiments: pick(['experiment', 'validation']),
    portfolioStudies: pick(['portfolio', 'allocation', 'architecture']),
    promotions: pick(['promotion']),
    governance: pick(['governance']),
    recommendations: pick(['recommendation']),
  };
}

export const EXEC_CARDS = [
  { key: 'nodes', label: 'Knowledge Nodes', value: String(KNOWLEDGE_NODES.length), detail: 'Every research object retained permanently.' },
  { key: 'rels', label: 'Relationships', value: String(KNOWLEDGE_EDGES.length), detail: 'Explainable, typed and confidence-scored links.' },
  { key: 'evidence', label: 'Evidence Links', value: String(KNOWLEDGE_NODES.reduce((s, k) => s + k.supportingEvidence.length + k.counterEvidence.length, 0)), detail: 'Supporting and counter evidence items attached to nodes.' },
  { key: 'validated', label: 'Validated Discoveries', value: String(KNOWLEDGE_NODES.filter((k) => k.status === 'validated' && ['discovery', 'breakthrough', 'experiment', 'validation', 'hypothesis'].includes(k.type)).length), detail: 'Discoveries that cleared validation.' },
  { key: 'rejected', label: 'Rejected Ideas', value: String(KNOWLEDGE_NODES.filter((k) => k.status === 'rejected').length), detail: 'Failures retained as institutional knowledge.' },
  { key: 'open', label: 'Open Knowledge Chains', value: String(KNOWLEDGE_NODES.filter((k) => k.status === 'open' || k.status === 'active').length), detail: 'Chains still under active research.' },
];

export interface HeatmapGroup { label: string; items: { id: string; label: string; metric: string }[] }

export const KNOWLEDGE_HEATMAP: HeatmapGroup[] = [
  {
    label: 'Most Connected Discoveries',
    items: ['BRK-003', 'SPC-LVC', 'ALO-002', 'EXP-052'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${degree(id)} links` })),
  },
  {
    label: 'Most Influential Questions',
    items: ['Q-002', 'Q-001', 'Q-003'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${trace(id, 'forward', 6).length - 1} downstream objects` })),
  },
  {
    label: 'Most Referenced Experiments',
    items: ['EXP-052', 'EXP-058', 'EXP-041', 'EXP-033'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${degree(id)} references` })),
  },
  {
    label: 'Largest Evidence Trees',
    items: ['ALO-002', 'PRT-004', 'REC-021'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${trace(id, 'back', 6).length - 1} ancestors` })),
  },
  {
    label: 'Fastest Growing Knowledge Areas',
    items: [
      { id: 'BRK-003', label: 'Compression → expansion handoff', metric: '+9 objects (30d)' },
      { id: 'ALO-002', label: 'Confidence weighted allocation', metric: '+6 objects (30d)' },
      { id: 'DIS-007', label: 'Activation lag research', metric: '+3 objects (30d)' },
    ],
  },
  {
    label: 'Research Dead Ends',
    items: [
      { id: 'REJ-002', label: 'Volume Breakout Clone', metric: 'Rejected 2026-04-07' },
      { id: 'HYP-009', label: 'Uncorrelated volume edge', metric: 'PF 1.08 out-of-sample' },
    ],
  },
  {
    label: 'Highest Confidence Discoveries',
    items: ['BRK-003', 'EXP-052', 'ARC-003'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${NODE_BY_ID[id].confidence}% confidence` })),
  },
  {
    label: 'Most Valuable Lessons',
    items: ['LES-014', 'LES-008'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${NODE_BY_ID[id].evidenceScore} evidence score` })),
  },
  {
    label: 'Most Active Specialists',
    items: ['SPC-LVC', 'SPC-VCB', 'SPC-MS2'].map((id) => ({ id, label: NODE_BY_ID[id].title, metric: `${degree(id)} connections` })),
  },
];

export const TIMELINE_STAGES: { stage: string; nodeIds: string[] }[] = [
  { stage: 'Question', nodeIds: ['Q-002', 'Q-001', 'Q-003'] },
  { stage: 'Hypothesis', nodeIds: ['HYP-018', 'HYP-014', 'HYP-021', 'HYP-009'] },
  { stage: 'Experiment', nodeIds: ['EXP-052', 'EXP-041', 'EXP-058', 'EXP-033'] },
  { stage: 'Validation', nodeIds: ['VAL-019', 'VAL-012', 'BRK-003'] },
  { stage: 'Forward Trial', nodeIds: ['TRL-001', 'PRT-004'] },
  { stage: 'Promotion', nodeIds: ['PRM-005', 'GOV-011', 'GOV-016'] },
  { stage: 'Executive Recommendation', nodeIds: ['REC-021', 'RPT-009'] },
  { stage: 'Institutional Memory', nodeIds: ['MEM-001', 'MEM-002', 'LES-014', 'LES-008'] },
];

export const DISCOVERY_CHAIN = ['Q-002', 'HYP-018', 'EXP-052', 'DIS-007', 'VAL-019', 'BRK-003', 'PRM-005', 'MEM-001'];
export const FAILURE_CHAIN = ['REJ-002', 'HYP-009', 'EXP-033', 'GOV-016', 'LES-014', 'MEM-002'];
export const EXAMPLE_CHAIN = ['SPC-LVC', 'HYP-018', 'EXP-052', 'ALO-002', 'PRT-004', 'TRL-001', 'REC-021', 'MEM-001'];

export const EVOLUTION_STAGES = [
  'Idea Birth', 'Hypothesis', 'Testing', 'Validation', 'Forward Trial', 'Promotion', 'Institutional Memory', 'Historical Record',
];

export const GOVERNANCE_GUARANTEES = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'No Exchange Connectivity',
  'No API Keys',
  'No Strategy Modification',
  'No Allocation Changes',
  'No Live Trading',
  'Human Approval Required',
  'Every object fully traceable',
];

export interface SearchHit { node: KnowledgeNode; reason: string }

export function searchKnowledge(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const node of KNOWLEDGE_NODES) {
    const haystacks: [string, string][] = [
      [node.id, 'Identifier match'],
      [node.title, 'Title match'],
      [NODE_TYPE_META[node.type].label, 'Object type match'],
      [node.department, 'Department match'],
      [node.owner, 'Research owner match'],
      [node.summary, 'Summary match'],
      [node.supportingEvidence.join(' '), 'Supporting evidence match'],
      [node.counterEvidence.join(' '), 'Counter evidence match'],
      [node.lessons.join(' '), 'Lesson match'],
      [node.governanceHistory.join(' '), 'Governance history match'],
    ];
    const found = haystacks.find(([text]) => text.toLowerCase().includes(q));
    if (found) hits.push({ node, reason: found[1] });
  }
  return hits.sort((a, b) => b.node.confidence - a.node.confidence).slice(0, 25);
}

export interface NodeExplanation {
  summary: string;
  history: string[];
  reasoning: string;
  supporting: string[];
  counter: string[];
  futureResearch: string[];
  governanceImpact: string[];
  dependencies: string[];
}

export function explainNode(id: string): NodeExplanation {
  const node = NODE_BY_ID[id];
  const back = trace(id, 'back', 3).slice(1);
  const fwd = trace(id, 'forward', 3).slice(1);
  const meta = NODE_TYPE_META[node.type];
  return {
    summary: `${node.title} is a ${meta.label.toLowerCase()} owned by ${node.owner} (${node.department}), currently ${node.status}, with ${node.confidence}% confidence and an evidence score of ${node.evidenceScore}.`,
    history: [
      `Created ${node.created} by ${node.owner}.`,
      ...back.slice(0, 4).map((s) => `${RELATIONSHIP_META[s.edge!.type].label} → ${s.node.id} · ${s.node.title}`),
      ...node.promotionHistory,
      ...node.governanceHistory,
    ],
    reasoning: back.length
      ? `This object stands on ${back.length} upstream objects and currently influences ${fwd.length} downstream objects. The strongest upstream link is "${RELATIONSHIP_META[back[0].edge!.type].label}" to ${back[0].node.id} at ${back[0].edge!.confidence}% confidence.`
      : `This object is an origin node: nothing upstream feeds it. It currently influences ${fwd.length} downstream objects.`,
    supporting: node.supportingEvidence.length ? node.supportingEvidence : ['No supporting evidence recorded.'],
    counter: node.counterEvidence.length ? node.counterEvidence : ['No counter evidence recorded.'],
    futureResearch: node.futureResearch.length ? node.futureResearch : ['No open research threads attached.'],
    governanceImpact: [
      ...node.governanceHistory,
      ...connections(id).filter((c) => c.type === 'blocked-by' || c.type === 'rejected-by').map((c) => `${RELATIONSHIP_META[c.type].label}: ${c.note}`),
      'Advisory only — human approval required before any action.',
    ],
    dependencies: connections(id).filter((c) => c.type === 'depends-on' || c.type === 'feeds' || c.type === 'used-by')
      .map((c) => `${c.from === id ? NODE_BY_ID[c.to].title : NODE_BY_ID[c.from].title} (${RELATIONSHIP_META[c.type].label}, ${c.confidence}%)`),
  };
}
