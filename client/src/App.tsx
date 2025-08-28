import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import Accounts from "@/pages/accounts";
import Receipts from "@/pages/receipts";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Landing page is always accessible */}
      <Route path="/" component={Landing} />

      {/* Protected routes */}
      {isAuthenticated && (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/budgets" component={Budgets} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/receipts" component={Receipts} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
        </>
      )}

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
