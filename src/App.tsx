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
