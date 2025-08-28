import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sidebar } from "@/components/layout/sidebar";
import { AddBudgetModal } from "@/components/modals/add-budget-modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useFinanceStore } from "@/store/useFinanceStore";
import { 
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  ShoppingCart,
  Car,
  Film,
  Home,
  Utensils,
  DollarSign
} from "lucide-react";

export default function Budgets() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { showAddBudgetModal, setShowAddBudgetModal } = useFinanceStore();

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

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets"],
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'groceries':
        return <ShoppingCart className="h-5 w-5 text-blue-600" />;
      case 'transportation':
        return <Car className="h-5 w-5 text-green-600" />;
      case 'entertainment':
        return <Film className="h-5 w-5 text-red-600" />;
      case 'utilities':
        return <Home className="h-5 w-5 text-yellow-600" />;
      case 'dining':
        return <Utensils className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const totalBudgeted = budgets?.reduce((sum: number, budget: any) => sum + parseFloat(budget.amount), 0) || 0;
  const totalSpent = budgets?.reduce((sum: number, budget: any) => sum + parseFloat(budget.spent), 0) || 0;
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
                <p className="text-gray-600">Set spending limits and track your financial goals</p>
              </div>
              <Button 
                className="bg-primary hover:bg-blue-700"
                onClick={() => setShowAddBudgetModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>

            {/* Budget Overview */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">${totalBudgeted.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Total Budgeted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">${totalSpent.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Total Spent</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totalRemaining.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Remaining</div>
                  </div>
                </div>
                {totalBudgeted > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Overall Progress</span>
                      <span>{Math.round((totalSpent / totalBudgeted) * 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((totalSpent / totalBudgeted) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Categories */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : budgets?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first budget to start tracking your spending goals.
                </p>
                <Button onClick={() => setShowAddBudgetModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets?.map((budget: any) => (
                  <Card key={budget.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(budget.category)}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">
                            {budget.category}
                          </h4>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Spent</span>
                          <span className="font-medium">${parseFloat(budget.spent).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Budget</span>
                          <span className="font-medium">${parseFloat(budget.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {parseFloat(budget.remaining) >= 0 ? 'Remaining' : 'Over Budget'}
                          </span>
                          <span className={`font-medium ${
                            parseFloat(budget.remaining) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${Math.abs(parseFloat(budget.remaining)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{budget.percentage}%</span>
                        </div>
                        <Progress 
                          value={Math.min(budget.percentage, 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2 flex items-center">
                        {budget.percentage >= 100 ? (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                            Over budget by ${(parseFloat(budget.spent) - parseFloat(budget.amount)).toFixed(2)}
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(budget.endDate).getDate() - new Date().getDate()} days remaining
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Budget Alerts */}
            {budgets?.some((budget: any) => budget.percentage >= 80) && (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-800">Budget Alerts</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {budgets?.filter((budget: any) => budget.percentage >= 100).length > 0
                        ? `You have ${budgets.filter((budget: any) => budget.percentage >= 100).length} budget(s) that are over the limit.`
                        : `You're approaching the limit for ${budgets.filter((budget: any) => budget.percentage >= 80 && budget.percentage < 100).length} budget(s).`
                      } Consider adjusting your spending in these categories.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddBudgetModal 
        open={showAddBudgetModal}
        onOpenChange={setShowAddBudgetModal}
      />
    </div>
  );
}
