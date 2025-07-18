import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import BotManagement from "./pages/BotManagement";
import ContentGeneration from "./pages/ContentGeneration";
import Analytics from "./pages/Analytics";
import ApiSettings from "./pages/ApiSettings";
import ActivityLogs from "./pages/ActivityLogs";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { data: usage } = useQuery({
    queryKey: ["/api/usage"],
  });

  const apiStatus = {
    twitter: {
      calls: (usage as any)?.twitter?.callsCount || 0,
      limit: (usage as any)?.twitter?.dailyLimit || 1000,
    },
    llm: {
      calls: (usage as any)?.llm?.callsCount || 0,
      limit: (usage as any)?.llm?.dailyLimit || 100,
    },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      <Sidebar apiStatus={apiStatus} />
      <main className="ml-64 min-h-screen">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/bots" component={BotManagement} />
          <Route path="/content" component={ContentGeneration} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={ApiSettings} />
          <Route path="/logs" component={ActivityLogs} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
