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
