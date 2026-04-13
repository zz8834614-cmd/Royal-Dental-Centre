import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";

import Landing from "@/pages/Landing";
import AboutUs from "@/pages/AboutUs";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PatientDashboard from "@/pages/patient/Dashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/about" component={AboutUs} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/patient/dashboard" component={PatientDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <I18nProvider>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </I18nProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
