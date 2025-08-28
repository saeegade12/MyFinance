import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus,
  CreditCard,
  PiggyBank,
  Building,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";

export default function Accounts() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
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

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return <Building className="h-6 w-6 text-blue-600" />;
      case 'savings':
        return <PiggyBank className="h-6 w-6 text-green-600" />;
      case 'credit_card':
        return <CreditCard className="h-6 w-6 text-red-600" />;
      case 'investment':
        return <TrendingUp className="h-6 w-6 text-purple-600" />;
      default:
        return <Building className="h-6 w-6 text-gray-600" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'credit_card':
        return 'bg-red-100 text-red-800';
      case 'investment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalBalance = accounts?.reduce((sum: number, account: any) => {
    const balance = parseFloat(account.balance);
    // For credit cards, we typically show negative balances as debt
    return account.type === 'credit_card' ? sum - Math.abs(balance) : sum + balance;
  }, 0) || 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
                <p className="text-gray-600">Manage your financial accounts and track balances</p>
              </div>
              <Button className="bg-primary hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>

            {/* Total Balance Overview */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Net Worth</h3>
                  <div className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(totalBalance).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Across {accounts?.length || 0} active account{accounts?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accounts Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : accounts?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
                <p className="text-gray-500 mb-4">
                  Add your first account to start tracking your finances.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts?.map((account: any) => (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getAccountIcon(account.type)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{account.name}</h4>
                            <Badge className={`text-xs ${getAccountTypeColor(account.type)}`}>
                              {account.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Balance</span>
                          <span className={`text-xl font-bold ${
                            account.type === 'credit_card' 
                              ? parseFloat(account.balance) > 0 ? 'text-red-600' : 'text-green-600'
                              : parseFloat(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {account.type === 'credit_card' && parseFloat(account.balance) > 0 ? '-' : ''}
                            ${Math.abs(parseFloat(account.balance)).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Currency</span>
                          <span>{account.currency}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Last Updated</span>
                          <span>{new Date(account.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Account Summary */}
            {accounts && accounts.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {accounts.filter((acc: any) => acc.type === 'checking').length}
                    </div>
                    <div className="text-sm text-gray-600">Checking Accounts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {accounts.filter((acc: any) => acc.type === 'savings').length}
                    </div>
                    <div className="text-sm text-gray-600">Savings Accounts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {accounts.filter((acc: any) => acc.type === 'credit_card').length}
                    </div>
                    <div className="text-sm text-gray-600">Credit Cards</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {accounts.filter((acc: any) => acc.type === 'investment').length}
                    </div>
                    <div className="text-sm text-gray-600">Investment Accounts</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
