import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import Overview from "./pages/Overview";
import Trading from "./pages/Trading";
import Backtest from "./pages/Backtest";
import PaperTrading from "./pages/PaperTrading";
import DualPaperTrading from "./pages/DualPaperTrading";
import ChampionshipArena from "./pages/ChampionshipArena";
import PromotionReviewBoard from "./pages/PromotionReviewBoard";
import ResearchFreezeMode from "./pages/ResearchFreezeMode";
import PortfolioManager from "./pages/PortfolioManager";
import InvestmentCommittee from "./pages/InvestmentCommittee";
import ResearchJournal from "./pages/ResearchJournal";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import MonthlyResearchReport from "./pages/MonthlyResearchReport";
import MarketMoveCapture from "./pages/MarketMoveCapture";
import MomentumScalper from "./pages/MomentumScalper";
import MomentumScalperV2 from "./pages/MomentumScalperV2";
import VolatilityCompressionBreakout from "./pages/VolatilityCompressionBreakout";
import SpecialistAllocationLab from "./pages/SpecialistAllocationLab";
import SpecialistAllocationLabV2 from "./pages/SpecialistAllocationLabV2";
import ForwardValidation from "./pages/ForwardValidation";
import ChampionTrial from "./pages/ChampionTrial";
import SpecialistChampionship from "./pages/SpecialistChampionship";
import SpecialistDiscoveryLabV2 from "./pages/SpecialistDiscoveryLabV2";
import LowVolCoilerV1 from "./pages/LowVolCoilerV1";
import LowVolCoilerV2 from "./pages/LowVolCoilerV2";
import SpecialistApprovalBoard from "./pages/SpecialistApprovalBoard";
import PortfolioArchitectureReview from "./pages/PortfolioArchitectureReview";
import ExecutiveProgramStatus from "./pages/ExecutiveProgramStatus";
import ObservationCenter from "./pages/ObservationCenter";
import AllocationProductionPath from "./pages/AllocationProductionPath";
import TradeFrequencyAudit from "./pages/TradeFrequencyAudit";
import RouterV21 from "./pages/RouterV21";
import PortfolioAIDirector from "./pages/PortfolioAIDirector";
import MissionControl from "./pages/MissionControl";
import ResearchAssistant from "./pages/ResearchAssistant";
import ChiefInvestmentOfficer from "./pages/ChiefInvestmentOfficer";
import AutonomousResearch from "./pages/AutonomousResearch";
import QuantScientist from "./pages/QuantScientist";
import IntelligenceNetwork from "./pages/IntelligenceNetwork";
import ResearchBrain from "./pages/ResearchBrain";
import Atlas from "./pages/Atlas";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import IntelligenceExplorer from "./pages/IntelligenceExplorer";
import AtlasOracle from "./pages/AtlasOracle";
import ExecutiveBoardroom from "./pages/ExecutiveBoardroom";
import DigitalTwin from "./pages/DigitalTwin";
import Strategies from "./pages/Strategies";
import Portfolio from "./pages/Portfolio";
import Governance from "./pages/Governance";
import OperatorControls from "./pages/OperatorControls";
import Alerts from "./pages/Alerts";
import Experiments from "./pages/Experiments";
import Readiness from "./pages/Readiness";
import Research from "./pages/Research";
import SystemHealth from "./pages/SystemHealth";
import Promotion from "./pages/Promotion";
import SessionAnalytics from "./pages/SessionAnalytics";
import AnalyticsHub from "./pages/AnalyticsHub";
import WeeklyReview from "./pages/WeeklyReview";
import CommandCenter from "./pages/CommandCenter";
import BaselineValidation from "./pages/BaselineValidation";
import ParticipationController from "./pages/ParticipationController";
import Institution from "./pages/Institution";
import InstitutionDepartments from "./pages/InstitutionDepartments";
import InstitutionDepartment from "./pages/InstitutionDepartment";
import InstitutionCollaboration from "./pages/InstitutionCollaboration";
import InstitutionCalendar from "./pages/InstitutionCalendar";
import InstitutionQueue from "./pages/InstitutionQueue";
import InstitutionAnalytics from "./pages/InstitutionAnalytics";
import InstitutionScore from "./pages/InstitutionScore";
import InstitutionHistory from "./pages/InstitutionHistory";
import InstitutionMuseum from "./pages/InstitutionMuseum";
import InstitutionObservatory from "./pages/InstitutionObservatory";
import InstitutionCycle from "./pages/InstitutionCycle";
import InstitutionConversationsLive from "./pages/InstitutionConversations";
import InstitutionDecisions from "./pages/InstitutionDecisions";
import InstitutionEvolution from "./pages/InstitutionEvolution";
import InstitutionForecast from "./pages/InstitutionForecast";
import BriefingRoom from "./pages/BriefingRoom";
import InstitutionGenome from "./pages/InstitutionGenome";
import InstitutionHealth from "./pages/InstitutionHealth";
import SelfReview from "./pages/SelfReview";
import InstitutionLearning from "./pages/InstitutionLearning";
import InstitutionRecommendations from "./pages/InstitutionRecommendations";
import InstitutionQuality from "./pages/InstitutionQuality";
import InstitutionExplain from "./pages/InstitutionExplain";
import InstitutionBenchmark from "./pages/InstitutionBenchmark";
import ExecutiveSimulator from "./pages/ExecutiveSimulator";
import InstitutionRiskRadar from "./pages/InstitutionRiskRadar";
import InstitutionIQ from "./pages/InstitutionIQ";
import InstitutionEvolutionTimeline from "./pages/InstitutionEvolutionTimeline";
import ExecutiveHome from "./pages/ExecutiveHome";
import PerformanceCentre from "./pages/PerformanceCentre";
import EnterpriseSettings from "./pages/EnterpriseSettings";
import DocumentationCentre from "./pages/DocumentationCentre";
import MetricsApi from "./pages/MetricsApi";
import PresentationMode from "./pages/PresentationMode";
import LaunchChecklist from "./pages/LaunchChecklist";
import ExtensionManager from "./pages/ExtensionManager";
import AppMarketplace from "./pages/AppMarketplace";
import PluginSdk from "./pages/PluginSdk";
import ThemeEngine from "./pages/ThemeEngine";
import InstitutionTemplates from "./pages/InstitutionTemplates";
import WorkflowDesigner from "./pages/WorkflowDesigner";
import InstitutionPackagePage from "./pages/InstitutionPackagePage";
import DeveloperCentre from "./pages/DeveloperCentre";
import InstitutionCertification from "./pages/InstitutionCertification";
import FutureRoadmap from "./pages/FutureRoadmap";
import TestValidationCentre from "./pages/TestValidationCentre";
import AcceptanceProgramme from "./pages/AcceptanceProgramme";
import ReleaseCandidateCentre from "./pages/ReleaseCandidateCentre";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
