import "./lib/api-setup";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { AppLayout } from "@/components/layout/AppLayout";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Calendar from "./pages/calendar";
import Trips from "./pages/trips";
import Drivers from "./pages/drivers";
import WhatsApp from "./pages/whatsapp";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/trips" component={Trips} />
        <Route path="/drivers" component={Drivers} />
        <Route path="/whatsapp" component={WhatsApp} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/:rest*" component={ProtectedRoutes} />
      <Route path="/" component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
