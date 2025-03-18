import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import Students from "./pages/students";
import Courses from "./pages/courses";
import Admin from "./pages/admin";
import { ProtectedRoute } from "./lib/protected-route";
import { Sidebar } from "./components/layout/sidebar";
import PricingPage from "./pages/pricing";

function Router() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Switch>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/students" component={Students} />
          <ProtectedRoute path="/courses" component={Courses} />
          <ProtectedRoute path="/pricing" component={PricingPage} />
          <ProtectedRoute path="/admin" component={Admin} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;