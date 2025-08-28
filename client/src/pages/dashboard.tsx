import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { ExpenseTrends } from "@/components/charts/expense-trends";
import { CategoryBreakdown } from "@/components/charts/category-breakdown";
import { AddTransactionModal } from "@/components/modals/add-transaction-modal";
import { AddBudgetModal } from "@/components/modals/add-budget-modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useFinanceStore } from "@/store/useFinanceStore";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Plus,
  Camera,
  FileText,
  Brain,
  ShoppingCart,
  Briefcase,
  Car
} from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { 
    showAddTransactionModal, 
    showAddBudgetModal,
    setShowAddTransactionModal,
    setShowAddBudgetModal 
  } = useFinanceStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getTransactionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'groceries':
        return <ShoppingCart className="h-4 w-4 text-red-600" />;
      case 'income':
        return <Briefcase className="h-4 w-4 text-green-600" />;
      case 'transportation':
        return <Car className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! Here's your financial overview.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${analyticsLoading ? "..." : analytics?.totalBalance || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Monthly Income</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${analyticsLoading ? "..." : analytics?.monthlyIncome || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Monthly Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${analyticsLoading ? "..." : analytics?.monthlyExpenses || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Net Savings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${analyticsLoading ? "..." : analytics?.budgetRemaining || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseTrends />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdown />
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Transactions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Transactions</CardTitle>
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentTransactions?.slice(0, 5).map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {getTransactionIcon(transaction.category)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(transaction.date).toLocaleDateString()} • {transaction.account?.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">{transaction.category}</p>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-gray-500">
                            No transactions yet. Add your first transaction to get started!
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-primary hover:bg-blue-700" 
                      onClick={() => setShowAddTransactionModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                    
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setShowAddBudgetModal(true)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create Budget
                    </Button>
                    
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                      <Camera className="h-4 w-4 mr-2" />
                      Scan Receipt
                    </Button>
                    
                    <Button className="w-full bg-gray-600 hover:bg-gray-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  {/* AI Insights */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                      <Brain className="h-4 w-4 mr-1" />
                      AI Insights
                    </h4>
                    <p className="text-sm text-blue-800">
                      Based on your spending patterns, you're doing great with your budget management this month!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddTransactionModal 
        open={showAddTransactionModal}
        onOpenChange={setShowAddTransactionModal}
      />
      <AddBudgetModal 
        open={showAddBudgetModal}
        onOpenChange={setShowAddBudgetModal}
      />
    </div>
  );
}
