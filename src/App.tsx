import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import { ExecPageSkeleton } from "@/components/executive/ExecUi";
import { CMC_ENABLED } from "@/lib/cmc/config";
import { AUDIT_ENABLED } from "@/lib/audit/config";
import { EngineAuditObserver } from "@/components/audit/EngineAuditObserver";
const MaintenanceExecutive = lazyWithRetry(() => import("./pages/maintenance/MaintenanceExecutive"));
const MaintenanceInstitutionHealth = lazyWithRetry(() => import("./pages/maintenance/MaintenanceInstitutionHealth"));
const MaintenanceModules = lazyWithRetry(() => import("./pages/maintenance/MaintenanceModules"));
const MaintenanceWorkflows = lazyWithRetry(() => import("./pages/maintenance/MaintenanceWorkflows"));
const MaintenanceGovernanceAuditor = lazyWithRetry(() => import("./pages/maintenance/MaintenanceGovernance"));
const MaintenanceDatabase = lazyWithRetry(() => import("./pages/maintenance/MaintenanceDatabase"));
const MaintenanceKnowledge = lazyWithRetry(() => import("./pages/maintenance/MaintenanceKnowledge"));
const MaintenancePerformanceCentre = lazyWithRetry(() => import("./pages/maintenance/MaintenancePerformance"));
const MaintenanceAutoRepair = lazyWithRetry(() => import("./pages/maintenance/MaintenanceAutoRepair"));
const MaintenancePredictive = lazyWithRetry(() => import("./pages/maintenance/MaintenancePredictive"));
const MaintenanceReportsPage = lazyWithRetry(() => import("./pages/maintenance/MaintenanceReports"));
const MaintenanceSettingsPage = lazyWithRetry(() => import("./pages/maintenance/MaintenanceSettings"));
import Overview from "./pages/Overview";
const Trading = lazyWithRetry(() => import("./pages/Trading"));
const Backtest = lazyWithRetry(() => import("./pages/Backtest"));
const PaperTrading = lazyWithRetry(() => import("./pages/PaperTrading"));
const DualPaperTrading = lazyWithRetry(() => import("./pages/DualPaperTrading"));
const ChampionshipArena = lazyWithRetry(() => import("./pages/ChampionshipArena"));
const PromotionReviewBoard = lazyWithRetry(() => import("./pages/PromotionReviewBoard"));
const ResearchFreezeMode = lazyWithRetry(() => import("./pages/ResearchFreezeMode"));
const PortfolioManager = lazyWithRetry(() => import("./pages/PortfolioManager"));
const InvestmentCommittee = lazyWithRetry(() => import("./pages/InvestmentCommittee"));
const ResearchJournal = lazyWithRetry(() => import("./pages/ResearchJournal"));
const ExecutiveDashboard = lazyWithRetry(() => import("./pages/ExecutiveDashboard"));
const MonthlyResearchReport = lazyWithRetry(() => import("./pages/MonthlyResearchReport"));
const MarketMoveCapture = lazyWithRetry(() => import("./pages/MarketMoveCapture"));
const MomentumScalper = lazyWithRetry(() => import("./pages/MomentumScalper"));
const MomentumScalperV2 = lazyWithRetry(() => import("./pages/MomentumScalperV2"));
const VolatilityCompressionBreakout = lazyWithRetry(() => import("./pages/VolatilityCompressionBreakout"));
const SpecialistAllocationLab = lazyWithRetry(() => import("./pages/SpecialistAllocationLab"));
const SpecialistAllocationLabV2 = lazyWithRetry(() => import("./pages/SpecialistAllocationLabV2"));
const ForwardValidation = lazyWithRetry(() => import("./pages/ForwardValidation"));
const ChampionTrial = lazyWithRetry(() => import("./pages/ChampionTrial"));
const SpecialistChampionship = lazyWithRetry(() => import("./pages/SpecialistChampionship"));
const SpecialistDiscoveryLabV2 = lazyWithRetry(() => import("./pages/SpecialistDiscoveryLabV2"));
const LowVolCoilerV1 = lazyWithRetry(() => import("./pages/LowVolCoilerV1"));
const LowVolCoilerV2 = lazyWithRetry(() => import("./pages/LowVolCoilerV2"));
const SpecialistApprovalBoard = lazyWithRetry(() => import("./pages/SpecialistApprovalBoard"));
const PortfolioArchitectureReview = lazyWithRetry(() => import("./pages/PortfolioArchitectureReview"));
const ExecutiveProgramStatus = lazyWithRetry(() => import("./pages/ExecutiveProgramStatus"));
const ObservationCenter = lazyWithRetry(() => import("./pages/ObservationCenter"));
const AllocationProductionPath = lazyWithRetry(() => import("./pages/AllocationProductionPath"));
const OpportunityAnalysis = lazyWithRetry(() => import("./pages/OpportunityAnalysis"));
const PerformanceAttribution = lazyWithRetry(() => import("./pages/PerformanceAttribution"));
const TradeFrequencyAudit = lazyWithRetry(() => import("./pages/TradeFrequencyAudit"));
const TradingDiagnostics = lazyWithRetry(() => import("./pages/TradingDiagnostics"));
const SpecialistBoard = lazyWithRetry(() => import("./pages/SpecialistBoard"));
const SpecialistIndependence = lazyWithRetry(() => import("./pages/SpecialistIndependence"));
const ApprovalAnalysis = lazyWithRetry(() => import("./pages/ApprovalAnalysis"));
const RouterV21 = lazyWithRetry(() => import("./pages/RouterV21"));
// CMC Hackathon — isolated module (guarded by CMC_ENABLED)
const CmcMarketIntelligence = lazyWithRetry(() => import("./pages/cmc/CmcMarketIntelligence"));
const CmcDecisionContext = lazyWithRetry(() => import("./pages/cmc/CmcDecisionContext"));
const EngineDecisionAudit = lazyWithRetry(() => import("./pages/audit/EngineDecisionAudit"));
const PortfolioAIDirector = lazyWithRetry(() => import("./pages/PortfolioAIDirector"));
const MissionControl = lazyWithRetry(() => import("./pages/MissionControl"));
const AuditVault = lazyWithRetry(() => import("./pages/AuditVault"));
const PerformanceArchive = lazyWithRetry(() => import("./pages/PerformanceArchive"));
const ExecutiveIntelligence = lazyWithRetry(() => import("./pages/ExecutiveIntelligence"));
const ResearchAssistant = lazyWithRetry(() => import("./pages/ResearchAssistant"));
const ChiefInvestmentOfficer = lazyWithRetry(() => import("./pages/ChiefInvestmentOfficer"));
const AutonomousResearch = lazyWithRetry(() => import("./pages/AutonomousResearch"));
const QuantScientist = lazyWithRetry(() => import("./pages/QuantScientist"));
const IntelligenceNetwork = lazyWithRetry(() => import("./pages/IntelligenceNetwork"));
const ResearchBrain = lazyWithRetry(() => import("./pages/ResearchBrain"));
const Atlas = lazyWithRetry(() => import("./pages/Atlas"));
const KnowledgeGraph = lazyWithRetry(() => import("./pages/KnowledgeGraph"));
const IntelligenceExplorer = lazyWithRetry(() => import("./pages/IntelligenceExplorer"));
const AtlasOracle = lazyWithRetry(() => import("./pages/AtlasOracle"));
const ExecutiveBoardroom = lazyWithRetry(() => import("./pages/ExecutiveBoardroom"));
const DigitalTwin = lazyWithRetry(() => import("./pages/DigitalTwin"));
const Strategies = lazyWithRetry(() => import("./pages/Strategies"));
const Portfolio = lazyWithRetry(() => import("./pages/Portfolio"));
const Governance = lazyWithRetry(() => import("./pages/Governance"));
const OperatorControls = lazyWithRetry(() => import("./pages/OperatorControls"));
const Alerts = lazyWithRetry(() => import("./pages/Alerts"));
const Experiments = lazyWithRetry(() => import("./pages/Experiments"));
const Readiness = lazyWithRetry(() => import("./pages/Readiness"));
const Research = lazyWithRetry(() => import("./pages/Research"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const Promotion = lazyWithRetry(() => import("./pages/Promotion"));
const SessionAnalytics = lazyWithRetry(() => import("./pages/SessionAnalytics"));
const AnalyticsHub = lazyWithRetry(() => import("./pages/AnalyticsHub"));
const WeeklyReview = lazyWithRetry(() => import("./pages/WeeklyReview"));
const CommandCenter = lazyWithRetry(() => import("./pages/CommandCenter"));
const BaselineValidation = lazyWithRetry(() => import("./pages/BaselineValidation"));
const ParticipationController = lazyWithRetry(() => import("./pages/ParticipationController"));
const Institution = lazyWithRetry(() => import("./pages/Institution"));
const InstitutionDepartments = lazyWithRetry(() => import("./pages/InstitutionDepartments"));
const InstitutionDepartment = lazyWithRetry(() => import("./pages/InstitutionDepartment"));
const InstitutionCollaboration = lazyWithRetry(() => import("./pages/InstitutionCollaboration"));
const InstitutionCalendar = lazyWithRetry(() => import("./pages/InstitutionCalendar"));
const InstitutionQueue = lazyWithRetry(() => import("./pages/InstitutionQueue"));
const InstitutionAnalytics = lazyWithRetry(() => import("./pages/InstitutionAnalytics"));
const InstitutionScore = lazyWithRetry(() => import("./pages/InstitutionScore"));
const InstitutionHistory = lazyWithRetry(() => import("./pages/InstitutionHistory"));
const InstitutionMemory = lazyWithRetry(() => import("./pages/InstitutionMemory"));
const InstitutionMuseum = lazyWithRetry(() => import("./pages/InstitutionMuseum"));
const InstitutionObservatory = lazyWithRetry(() => import("./pages/InstitutionObservatory"));
const InstitutionCycle = lazyWithRetry(() => import("./pages/InstitutionCycle"));
const InstitutionConversationsLive = lazyWithRetry(() => import("./pages/InstitutionConversations"));
const InstitutionDecisions = lazyWithRetry(() => import("./pages/InstitutionDecisions"));
const InstitutionEvolution = lazyWithRetry(() => import("./pages/InstitutionEvolution"));
const InstitutionForecast = lazyWithRetry(() => import("./pages/InstitutionForecast"));
const BriefingRoom = lazyWithRetry(() => import("./pages/BriefingRoom"));
const InstitutionGenome = lazyWithRetry(() => import("./pages/InstitutionGenome"));
const InstitutionHealth = lazyWithRetry(() => import("./pages/InstitutionHealth"));
const SelfReview = lazyWithRetry(() => import("./pages/SelfReview"));
const InstitutionLearning = lazyWithRetry(() => import("./pages/InstitutionLearning"));
const InstitutionRecommendations = lazyWithRetry(() => import("./pages/InstitutionRecommendations"));
const InstitutionQuality = lazyWithRetry(() => import("./pages/InstitutionQuality"));
const InstitutionExplain = lazyWithRetry(() => import("./pages/InstitutionExplain"));
const InstitutionBenchmark = lazyWithRetry(() => import("./pages/InstitutionBenchmark"));
const ExecutiveSimulator = lazyWithRetry(() => import("./pages/ExecutiveSimulator"));
const InstitutionRiskRadar = lazyWithRetry(() => import("./pages/InstitutionRiskRadar"));
const InstitutionIQ = lazyWithRetry(() => import("./pages/InstitutionIQ"));
const InstitutionEvolutionTimeline = lazyWithRetry(() => import("./pages/InstitutionEvolutionTimeline"));
const ExecutiveHome = lazyWithRetry(() => import("./pages/ExecutiveHome"));
const PerformanceCentre = lazyWithRetry(() => import("./pages/PerformanceCentre"));
const EnterpriseSettings = lazyWithRetry(() => import("./pages/EnterpriseSettings"));
const DocumentationCentre = lazyWithRetry(() => import("./pages/DocumentationCentre"));
const MetricsApi = lazyWithRetry(() => import("./pages/MetricsApi"));
const PresentationMode = lazyWithRetry(() => import("./pages/PresentationMode"));
const ExecutiveDemonstration = lazyWithRetry(() => import("./pages/ExecutiveDemonstration"));
const LaunchChecklist = lazyWithRetry(() => import("./pages/LaunchChecklist"));
const ExtensionManager = lazyWithRetry(() => import("./pages/ExtensionManager"));
const AppMarketplace = lazyWithRetry(() => import("./pages/AppMarketplace"));
const PluginSdk = lazyWithRetry(() => import("./pages/PluginSdk"));
const ThemeEngine = lazyWithRetry(() => import("./pages/ThemeEngine"));
const InstitutionTemplates = lazyWithRetry(() => import("./pages/InstitutionTemplates"));
const WorkflowDesigner = lazyWithRetry(() => import("./pages/WorkflowDesigner"));
const InstitutionPackagePage = lazyWithRetry(() => import("./pages/InstitutionPackagePage"));
const DeveloperCentre = lazyWithRetry(() => import("./pages/DeveloperCentre"));
const InstitutionCertification = lazyWithRetry(() => import("./pages/InstitutionCertification"));
const FutureRoadmap = lazyWithRetry(() => import("./pages/FutureRoadmap"));
const TestValidationCentre = lazyWithRetry(() => import("./pages/TestValidationCentre"));
const AcceptanceProgramme = lazyWithRetry(() => import("./pages/AcceptanceProgramme"));
const ProductionReadiness = lazyWithRetry(() => import("./pages/ProductionReadiness"));
const ExecutiveDecisionCentre = lazyWithRetry(() => import("./pages/ExecutiveDecisionCentre"));
const ExecutiveDecisionQueue = lazyWithRetry(() => import("./pages/ExecutiveDecisionQueue"));
const TradeReviewCentre = lazyWithRetry(() => import("./pages/TradeReviewCentre"));
const PortfolioEvolutionCentre = lazyWithRetry(() => import("./pages/PortfolioEvolutionCentre"));
const InstitutionDaily = lazyWithRetry(() => import("./pages/InstitutionDaily"));
const FoundersOffice = lazyWithRetry(() => import("./pages/FoundersOffice"));
const ReleaseCandidateCentre = lazyWithRetry(() => import("./pages/ReleaseCandidateCentre"));
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

/** Institutional route-level loading state. Matches executive page rhythm. */
const RouteFallback = () => (
  <div className="mx-auto w-full max-w-[1600px] p-6 sm:p-8">
    <ExecPageSkeleton />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {AUDIT_ENABLED && <EngineAuditObserver />}
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Overview />} />
              <Route path="/atlas" element={<Atlas />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="/explorer" element={<IntelligenceExplorer />} />
              <Route path="/explorer/:objectId" element={<IntelligenceExplorer />} />
              <Route path="/oracle" element={<AtlasOracle />} />
              <Route path="/home" element={<ExecutiveHome />} />
              <Route path="/performance" element={<PerformanceCentre />} />
              <Route path="/settings" element={<EnterpriseSettings />} />
              <Route path="/docs" element={<DocumentationCentre />} />
              <Route path="/metrics-api" element={<MetricsApi />} />
              <Route path="/presentation" element={<PresentationMode />} />
              <Route path="/demonstration" element={<ExecutiveDemonstration />} />
              <Route path="/launch" element={<LaunchChecklist />} />
              <Route path="/extensions" element={<ExtensionManager />} />
              <Route path="/marketplace" element={<AppMarketplace />} />
              <Route path="/plugin-sdk" element={<PluginSdk />} />
              <Route path="/themes" element={<ThemeEngine />} />
              <Route path="/templates" element={<InstitutionTemplates />} />
              <Route path="/workflows" element={<WorkflowDesigner />} />
              <Route path="/package" element={<InstitutionPackagePage />} />
              <Route path="/developer" element={<DeveloperCentre />} />
              <Route path="/certification" element={<InstitutionCertification />} />
              <Route path="/roadmap" element={<FutureRoadmap />} />
              <Route path="/validation-centre" element={<TestValidationCentre />} />
              <Route path="/acceptance" element={<AcceptanceProgramme />} />
              <Route path="/production-readiness" element={<ProductionReadiness />} />
              <Route path="/decision-centre" element={<ExecutiveDecisionQueue />} />
              <Route path="/decision-centre/candidate" element={<ExecutiveDecisionCentre />} />
              <Route path="/trade-review" element={<TradeReviewCentre />} />
              <Route path="/portfolio-evolution" element={<PortfolioEvolutionCentre />} />
              <Route path="/institution-daily" element={<InstitutionDaily />} />
              <Route path="/founders-office" element={<FoundersOffice />} />
              <Route path="/release-candidate" element={<ReleaseCandidateCentre />} />

              <Route path="/maintenance" element={<MaintenanceExecutive />} />
              <Route path="/maintenance/health" element={<MaintenanceInstitutionHealth />} />
              <Route path="/maintenance/modules" element={<MaintenanceModules />} />
              <Route path="/maintenance/workflows" element={<MaintenanceWorkflows />} />
              <Route path="/maintenance/governance" element={<MaintenanceGovernanceAuditor />} />
              <Route path="/maintenance/database" element={<MaintenanceDatabase />} />
              <Route path="/maintenance/knowledge" element={<MaintenanceKnowledge />} />
              <Route path="/maintenance/performance" element={<MaintenancePerformanceCentre />} />
              <Route path="/maintenance/repairs" element={<MaintenanceAutoRepair />} />
              <Route path="/maintenance/predictive" element={<MaintenancePredictive />} />
              <Route path="/maintenance/reports" element={<MaintenanceReportsPage />} />
              <Route path="/maintenance/settings" element={<MaintenanceSettingsPage />} />

              <Route path="/boardroom" element={<ExecutiveBoardroom />} />
              <Route path="/digital-twin" element={<DigitalTwin />} />

              <Route path="/institution" element={<Institution />} />
              <Route path="/institution/departments" element={<InstitutionDepartments />} />
              <Route path="/institution/departments/:dept" element={<InstitutionDepartment />} />
              <Route path="/institution/collaboration" element={<InstitutionCollaboration />} />
              <Route path="/calendar" element={<InstitutionCalendar />} />
              <Route path="/institution/queue" element={<InstitutionQueue />} />
              <Route path="/institution/analytics" element={<InstitutionAnalytics />} />
              <Route path="/institution/score" element={<InstitutionScore />} />
              <Route path="/institution/history" element={<InstitutionHistory />} />
              <Route path="/institution/memory" element={<InstitutionMemory />} />

              <Route path="/institution/museum" element={<InstitutionMuseum />} />
              <Route path="/observatory" element={<InstitutionObservatory />} />
              <Route path="/institution/cycle" element={<InstitutionCycle />} />
              <Route path="/institution/conversations" element={<InstitutionConversationsLive />} />
              <Route path="/institution/decisions" element={<InstitutionDecisions />} />
              <Route path="/institution/evolution" element={<InstitutionEvolution />} />
              <Route path="/institution/forecast" element={<InstitutionForecast />} />
              <Route path="/briefing-room" element={<BriefingRoom />} />
              <Route path="/institution/genome" element={<InstitutionGenome />} />
              <Route path="/institution/health" element={<InstitutionHealth />} />
              <Route path="/self-review" element={<SelfReview />} />
              <Route path="/institution/learning" element={<InstitutionLearning />} />
              <Route path="/institution/recommendations" element={<InstitutionRecommendations />} />
              <Route path="/institution/quality" element={<InstitutionQuality />} />
              <Route path="/institution/explain" element={<InstitutionExplain />} />
              <Route path="/institution/explain/:objectId" element={<InstitutionExplain />} />
              <Route path="/institution/benchmark" element={<InstitutionBenchmark />} />
              <Route path="/executive-simulator" element={<ExecutiveSimulator />} />
              <Route path="/institution/risk-radar" element={<InstitutionRiskRadar />} />
              <Route path="/institution/iq" element={<InstitutionIQ />} />
              <Route path="/institution/evolution-timeline" element={<InstitutionEvolutionTimeline />} />



              <Route path="/intelligence-network" element={<IntelligenceNetwork />} />
              <Route path="/research-brain" element={<ResearchBrain />} />
              <Route path="/trading" element={<Trading />} />

              <Route path="/backtest" element={<Backtest />} />
              <Route path="/paper-trading" element={<PaperTrading />} />
              <Route path="/dual-paper" element={<DualPaperTrading />} />
              <Route path="/championship" element={<ChampionshipArena />} />
              <Route path="/promotion-board" element={<PromotionReviewBoard />} />
              <Route path="/freeze" element={<ResearchFreezeMode />} />
              <Route path="/portfolio-manager" element={<PortfolioManager />} />
              <Route path="/committee" element={<InvestmentCommittee />} />
              <Route path="/journal" element={<ResearchJournal />} />
              <Route path="/executive" element={<ExecutiveDashboard />} />
              <Route path="/monthly-report" element={<MonthlyResearchReport />} />
              <Route path="/move-capture" element={<MarketMoveCapture />} />
              <Route path="/momentum-scalper" element={<MomentumScalper />} />
              <Route path="/momentum-scalper-v2" element={<MomentumScalperV2 />} />
              <Route path="/vcb-v1" element={<VolatilityCompressionBreakout />} />
              <Route path="/allocation-lab" element={<SpecialistAllocationLab />} />
              <Route path="/allocation-lab-v2" element={<SpecialistAllocationLabV2 />} />
              <Route path="/forward-validation" element={<ForwardValidation />} />
              <Route path="/champion-trial" element={<ChampionTrial />} />
              <Route path="/specialist-championship" element={<SpecialistChampionship />} />
              <Route path="/specialist-discovery-v2" element={<SpecialistDiscoveryLabV2 />} />
              <Route path="/low-vol-coiler-v1" element={<LowVolCoilerV1 />} />
              <Route path="/low-vol-coiler-v2" element={<LowVolCoilerV2 />} />
              <Route path="/specialist-approval-board" element={<SpecialistApprovalBoard />} />
              <Route path="/portfolio-architecture-review" element={<PortfolioArchitectureReview />} />
              <Route path="/executive-program-status" element={<ExecutiveProgramStatus />} />
              <Route path="/observation-center" element={<ObservationCenter />} />
              <Route path="/allocation-production-path" element={<AllocationProductionPath />} />
              <Route path="/opportunity-analysis" element={<OpportunityAnalysis />} />
              <Route path="/performance-attribution" element={<PerformanceAttribution />} />
              <Route path="/trade-frequency" element={<TradeFrequencyAudit />} />
              <Route path="/trading-diagnostics" element={<TradingDiagnostics />} />
              <Route path="/specialist-board" element={<SpecialistBoard />} />
              <Route path="/specialist-independence" element={<SpecialistIndependence />} />
              <Route path="/approval-analysis" element={<ApprovalAnalysis />} />
              <Route path="/router-v21" element={<RouterV21 />} />
              <Route path="/portfolio-ai-director" element={<PortfolioAIDirector />} />
              <Route path="/mission-control" element={<MissionControl />} />
              <Route path="/audit-vault" element={<AuditVault />} />
              <Route path="/performance-archive" element={<PerformanceArchive />} />
              <Route path="/executive-intelligence" element={<ExecutiveIntelligence />} />
              <Route path="/research-assistant" element={<ResearchAssistant />} />
              <Route path="/cio" element={<ChiefInvestmentOfficer />} />
              <Route path="/autonomous-research" element={<AutonomousResearch />} />
              <Route path="/quant-scientist" element={<QuantScientist />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/operator" element={<OperatorControls />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/research" element={<Research />} />
              <Route path="/readiness" element={<Readiness />} />
              <Route path="/promotion" element={<Promotion />} />
              <Route path="/system-health" element={<SystemHealth />} />
              <Route path="/session-analytics" element={<SessionAnalytics />} />
              <Route path="/analytics-hub" element={<AnalyticsHub />} />
              <Route path="/weekly-review" element={<WeeklyReview />} />
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/baseline-validation" element={<BaselineValidation />} />
              <Route path="/participation" element={<ParticipationController />} />
              {/* CMC Hackathon namespace */}
              {CMC_ENABLED && <Route path="/cmc/market-intelligence" element={<CmcMarketIntelligence />} />}
              {CMC_ENABLED && <Route path="/cmc/decision-context" element={<CmcDecisionContext />} />}
              {AUDIT_ENABLED && <Route path="/audit/engine-decisions" element={<EngineDecisionAudit />} />}
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
