import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import { ExecPageSkeleton } from "@/components/executive/ExecUi";
const MaintenanceExecutive = lazy(() => import("./pages/maintenance/MaintenanceExecutive"));
const MaintenanceInstitutionHealth = lazy(() => import("./pages/maintenance/MaintenanceInstitutionHealth"));
const MaintenanceModules = lazy(() => import("./pages/maintenance/MaintenanceModules"));
const MaintenanceWorkflows = lazy(() => import("./pages/maintenance/MaintenanceWorkflows"));
const MaintenanceGovernanceAuditor = lazy(() => import("./pages/maintenance/MaintenanceGovernance"));
const MaintenanceDatabase = lazy(() => import("./pages/maintenance/MaintenanceDatabase"));
const MaintenanceKnowledge = lazy(() => import("./pages/maintenance/MaintenanceKnowledge"));
const MaintenancePerformanceCentre = lazy(() => import("./pages/maintenance/MaintenancePerformance"));
const MaintenanceAutoRepair = lazy(() => import("./pages/maintenance/MaintenanceAutoRepair"));
const MaintenancePredictive = lazy(() => import("./pages/maintenance/MaintenancePredictive"));
const MaintenanceReportsPage = lazy(() => import("./pages/maintenance/MaintenanceReports"));
const MaintenanceSettingsPage = lazy(() => import("./pages/maintenance/MaintenanceSettings"));
import Overview from "./pages/Overview";
const Trading = lazy(() => import("./pages/Trading"));
const Backtest = lazy(() => import("./pages/Backtest"));
const PaperTrading = lazy(() => import("./pages/PaperTrading"));
const DualPaperTrading = lazy(() => import("./pages/DualPaperTrading"));
const ChampionshipArena = lazy(() => import("./pages/ChampionshipArena"));
const PromotionReviewBoard = lazy(() => import("./pages/PromotionReviewBoard"));
const ResearchFreezeMode = lazy(() => import("./pages/ResearchFreezeMode"));
const PortfolioManager = lazy(() => import("./pages/PortfolioManager"));
const InvestmentCommittee = lazy(() => import("./pages/InvestmentCommittee"));
const ResearchJournal = lazy(() => import("./pages/ResearchJournal"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const MonthlyResearchReport = lazy(() => import("./pages/MonthlyResearchReport"));
const MarketMoveCapture = lazy(() => import("./pages/MarketMoveCapture"));
const MomentumScalper = lazy(() => import("./pages/MomentumScalper"));
const MomentumScalperV2 = lazy(() => import("./pages/MomentumScalperV2"));
const VolatilityCompressionBreakout = lazy(() => import("./pages/VolatilityCompressionBreakout"));
const SpecialistAllocationLab = lazy(() => import("./pages/SpecialistAllocationLab"));
const SpecialistAllocationLabV2 = lazy(() => import("./pages/SpecialistAllocationLabV2"));
const ForwardValidation = lazy(() => import("./pages/ForwardValidation"));
const ChampionTrial = lazy(() => import("./pages/ChampionTrial"));
const SpecialistChampionship = lazy(() => import("./pages/SpecialistChampionship"));
const SpecialistDiscoveryLabV2 = lazy(() => import("./pages/SpecialistDiscoveryLabV2"));
const LowVolCoilerV1 = lazy(() => import("./pages/LowVolCoilerV1"));
const LowVolCoilerV2 = lazy(() => import("./pages/LowVolCoilerV2"));
const SpecialistApprovalBoard = lazy(() => import("./pages/SpecialistApprovalBoard"));
const PortfolioArchitectureReview = lazy(() => import("./pages/PortfolioArchitectureReview"));
const ExecutiveProgramStatus = lazy(() => import("./pages/ExecutiveProgramStatus"));
const ObservationCenter = lazy(() => import("./pages/ObservationCenter"));
const AllocationProductionPath = lazy(() => import("./pages/AllocationProductionPath"));
const TradeFrequencyAudit = lazy(() => import("./pages/TradeFrequencyAudit"));
const RouterV21 = lazy(() => import("./pages/RouterV21"));
const PortfolioAIDirector = lazy(() => import("./pages/PortfolioAIDirector"));
const MissionControl = lazy(() => import("./pages/MissionControl"));
const ResearchAssistant = lazy(() => import("./pages/ResearchAssistant"));
const ChiefInvestmentOfficer = lazy(() => import("./pages/ChiefInvestmentOfficer"));
const AutonomousResearch = lazy(() => import("./pages/AutonomousResearch"));
const QuantScientist = lazy(() => import("./pages/QuantScientist"));
const IntelligenceNetwork = lazy(() => import("./pages/IntelligenceNetwork"));
const ResearchBrain = lazy(() => import("./pages/ResearchBrain"));
const Atlas = lazy(() => import("./pages/Atlas"));
const KnowledgeGraph = lazy(() => import("./pages/KnowledgeGraph"));
const IntelligenceExplorer = lazy(() => import("./pages/IntelligenceExplorer"));
const AtlasOracle = lazy(() => import("./pages/AtlasOracle"));
const ExecutiveBoardroom = lazy(() => import("./pages/ExecutiveBoardroom"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const Strategies = lazy(() => import("./pages/Strategies"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Governance = lazy(() => import("./pages/Governance"));
const OperatorControls = lazy(() => import("./pages/OperatorControls"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Experiments = lazy(() => import("./pages/Experiments"));
const Readiness = lazy(() => import("./pages/Readiness"));
const Research = lazy(() => import("./pages/Research"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const Promotion = lazy(() => import("./pages/Promotion"));
const SessionAnalytics = lazy(() => import("./pages/SessionAnalytics"));
const AnalyticsHub = lazy(() => import("./pages/AnalyticsHub"));
const WeeklyReview = lazy(() => import("./pages/WeeklyReview"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const BaselineValidation = lazy(() => import("./pages/BaselineValidation"));
const ParticipationController = lazy(() => import("./pages/ParticipationController"));
const Institution = lazy(() => import("./pages/Institution"));
const InstitutionDepartments = lazy(() => import("./pages/InstitutionDepartments"));
const InstitutionDepartment = lazy(() => import("./pages/InstitutionDepartment"));
const InstitutionCollaboration = lazy(() => import("./pages/InstitutionCollaboration"));
const InstitutionCalendar = lazy(() => import("./pages/InstitutionCalendar"));
const InstitutionQueue = lazy(() => import("./pages/InstitutionQueue"));
const InstitutionAnalytics = lazy(() => import("./pages/InstitutionAnalytics"));
const InstitutionScore = lazy(() => import("./pages/InstitutionScore"));
const InstitutionHistory = lazy(() => import("./pages/InstitutionHistory"));
const InstitutionMemory = lazy(() => import("./pages/InstitutionMemory"));
const InstitutionMuseum = lazy(() => import("./pages/InstitutionMuseum"));
const InstitutionObservatory = lazy(() => import("./pages/InstitutionObservatory"));
const InstitutionCycle = lazy(() => import("./pages/InstitutionCycle"));
const InstitutionConversationsLive = lazy(() => import("./pages/InstitutionConversations"));
const InstitutionDecisions = lazy(() => import("./pages/InstitutionDecisions"));
const InstitutionEvolution = lazy(() => import("./pages/InstitutionEvolution"));
const InstitutionForecast = lazy(() => import("./pages/InstitutionForecast"));
const BriefingRoom = lazy(() => import("./pages/BriefingRoom"));
const InstitutionGenome = lazy(() => import("./pages/InstitutionGenome"));
const InstitutionHealth = lazy(() => import("./pages/InstitutionHealth"));
const SelfReview = lazy(() => import("./pages/SelfReview"));
const InstitutionLearning = lazy(() => import("./pages/InstitutionLearning"));
const InstitutionRecommendations = lazy(() => import("./pages/InstitutionRecommendations"));
const InstitutionQuality = lazy(() => import("./pages/InstitutionQuality"));
const InstitutionExplain = lazy(() => import("./pages/InstitutionExplain"));
const InstitutionBenchmark = lazy(() => import("./pages/InstitutionBenchmark"));
const ExecutiveSimulator = lazy(() => import("./pages/ExecutiveSimulator"));
const InstitutionRiskRadar = lazy(() => import("./pages/InstitutionRiskRadar"));
const InstitutionIQ = lazy(() => import("./pages/InstitutionIQ"));
const InstitutionEvolutionTimeline = lazy(() => import("./pages/InstitutionEvolutionTimeline"));
const ExecutiveHome = lazy(() => import("./pages/ExecutiveHome"));
const PerformanceCentre = lazy(() => import("./pages/PerformanceCentre"));
const EnterpriseSettings = lazy(() => import("./pages/EnterpriseSettings"));
const DocumentationCentre = lazy(() => import("./pages/DocumentationCentre"));
const MetricsApi = lazy(() => import("./pages/MetricsApi"));
const PresentationMode = lazy(() => import("./pages/PresentationMode"));
const LaunchChecklist = lazy(() => import("./pages/LaunchChecklist"));
const ExtensionManager = lazy(() => import("./pages/ExtensionManager"));
const AppMarketplace = lazy(() => import("./pages/AppMarketplace"));
const PluginSdk = lazy(() => import("./pages/PluginSdk"));
const ThemeEngine = lazy(() => import("./pages/ThemeEngine"));
const InstitutionTemplates = lazy(() => import("./pages/InstitutionTemplates"));
const WorkflowDesigner = lazy(() => import("./pages/WorkflowDesigner"));
const InstitutionPackagePage = lazy(() => import("./pages/InstitutionPackagePage"));
const DeveloperCentre = lazy(() => import("./pages/DeveloperCentre"));
const InstitutionCertification = lazy(() => import("./pages/InstitutionCertification"));
const FutureRoadmap = lazy(() => import("./pages/FutureRoadmap"));
const TestValidationCentre = lazy(() => import("./pages/TestValidationCentre"));
const AcceptanceProgramme = lazy(() => import("./pages/AcceptanceProgramme"));
const ReleaseCandidateCentre = lazy(() => import("./pages/ReleaseCandidateCentre"));
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
              <Route path="/trade-frequency" element={<TradeFrequencyAudit />} />
              <Route path="/router-v21" element={<RouterV21 />} />
              <Route path="/portfolio-ai-director" element={<PortfolioAIDirector />} />
              <Route path="/mission-control" element={<MissionControl />} />
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
