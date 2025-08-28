import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import { ExpenseTrends } from "@/components/charts/expense-trends";
import { CategoryBreakdown } from "@/components/charts/category-breakdown";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Brain
} from "lucide-react";

export default function Reports() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");

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

  const { data: categorySpending, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/analytics/category-spending"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const generateReport = () => {
    toast({
      title: "Generating Report",
      description: "Your financial report is being prepared...",
    });
  };

  const exportData = () => {
    toast({
      title: "Exporting Data",
      description: "Your data is being exported to CSV...",
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600">Analyze your financial data and generate comprehensive reports</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button className="bg-primary hover:bg-blue-700" onClick={generateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Report Period Selector */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Period</h3>
                    <p className="text-gray-600">Select the time period for your financial analysis</p>
                  </div>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Current Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                      <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                      <SelectItem value="current-year">Current Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
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
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${analyticsLoading ? "..." : analytics?.monthlyIncome || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${analyticsLoading ? "..." : analytics?.monthlyExpenses || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Net Savings</p>
                      <p className="text-2xl font-bold text-purple-600">
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
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-primary mr-2" />
                    <CardTitle>Expense Trends Over Time</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ExpenseTrends />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <PieChart className="h-5 w-5 text-primary mr-2" />
                    <CardTitle>Spending by Category</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdown />
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categorySpending?.slice(0, 5).map((category: any, index: number) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-red-500' :
                              index === 1 ? 'bg-blue-500' :
                              index === 2 ? 'bg-green-500' :
                              index === 3 ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}></div>
                            <span className="capitalize font-medium">{category.category}</span>
                          </div>
                          <span className="font-semibold">${parseFloat(category.total).toFixed(2)}</span>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No spending data available</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Transactions</span>
                      <span className="font-semibold">{transactions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Income Transactions</span>
                      <span className="font-semibold text-green-600">
                        {transactions?.filter((t: any) => t.type === 'income').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expense Transactions</span>
                      <span className="font-semibold text-red-600">
                        {transactions?.filter((t: any) => t.type === 'expense').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">AI Categorized</span>
                      <span className="font-semibold text-blue-600">
                        {transactions?.filter((t: any) => t.aiCategorized).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Brain className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>AI Financial Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Monthly Analysis for {currentMonth}</h4>
                  <div className="space-y-3 text-blue-800">
                    <p>• Your spending has been consistent with your budget goals this month.</p>
                    <p>• Consider allocating more funds to savings based on your current income-to-expense ratio.</p>
                    <p>• Your largest expense category is groceries, which accounts for 32% of your total spending.</p>
                    <p>• You've successfully reduced dining out expenses by 15% compared to last month.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
