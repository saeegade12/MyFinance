import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import Accounts from "@/pages/accounts";
import Receipts from "@/pages/receipts";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/useAuth";

// Wrapper for private routes
function PrivateRoute({ component: Component, ...rest }: { component: React.FC }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />

      {/* Protected routes */}
      <Route path="/dashboard" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/transactions" component={() => <PrivateRoute component={Transactions} />} />
      <Route path="/budgets" component={() => <PrivateRoute component={Budgets} />} />
      <Route path="/accounts" component={() => <PrivateRoute component={Accounts} />} />
      <Route path="/receipts" component={() => <PrivateRoute component={Receipts} />} />
      <Route path="/reports" component={() => <PrivateRoute component={Reports} />} />
      <Route path="/settings" component={() => <PrivateRoute component={Settings} />} />

      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
