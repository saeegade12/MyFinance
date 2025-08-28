import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/hooks/useAuth";

export function ExpenseTrends() {
  const { user } = useAuth();

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Process transactions to create trend data
  const trendData = useMemo(() => {
    if (!transactions) return [];

    // Group transactions by date (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyTotals = new Map<string, { income: number; expense: number }>();
    
    // Initialize with last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyTotals.set(dateStr, { income: 0, expense: 0 });
    }

    // Aggregate transactions by date
    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      const amount = parseFloat(transaction.amount);
      
      if (dailyTotals.has(date)) {
        const current = dailyTotals.get(date)!;
        if (transaction.type === 'income') {
          current.income += amount;
        } else {
          current.expense += amount;
        }
      }
    });

    // Convert to chart data format
    return Array.from(dailyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, totals]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: totals.income,
        expense: totals.expense,
      }));
  }, [transactions]);

  if (!transactions) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading expense trends...</p>
        </div>
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LineChart className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No transaction data available</p>
          <p className="text-gray-400 text-sm">Add some transactions to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'income' ? 'Income' : 'Expenses']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="expense" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            name="Expenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
