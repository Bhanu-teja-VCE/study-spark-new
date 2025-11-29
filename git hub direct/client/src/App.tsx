import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import UploadPage from "@/pages/upload";
import ChatPage from "@/pages/chat";
import FlashcardsPage from "@/pages/flashcards";
import QuestionsPage from "@/pages/questions";
import PlannerPage from "@/pages/planner";
import SubjectsPage from "@/pages/subjects";
import SummaryPage from "@/pages/summary";

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 h-14 px-4 border-b bg-background sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();
  
  // Landing page doesn't use the sidebar layout
  if (location === "/") {
    return <LandingPage />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/upload" component={UploadPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/flashcards" component={FlashcardsPage} />
        <Route path="/questions" component={QuestionsPage} />
        <Route path="/planner" component={PlannerPage} />
        <Route path="/subjects" component={SubjectsPage} />
        <Route path="/subjects/:id" component={SubjectsPage} />
        <Route path="/summaries/:id" component={SummaryPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="studyspark-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
