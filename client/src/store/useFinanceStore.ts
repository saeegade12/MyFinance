import { create } from 'zustand';

interface FinanceStore {
  // Modal states
  showAddTransactionModal: boolean;
  showAddBudgetModal: boolean;
  showAddAccountModal: boolean;
  
  // Actions
  setShowAddTransactionModal: (show: boolean) => void;
  setShowAddBudgetModal: (show: boolean) => void;
  setShowAddAccountModal: (show: boolean) => void;
  
  // Filters
  transactionFilters: {
    search: string;
    category: string;
    type: string;
    dateRange: string;
  };
  setTransactionFilters: (filters: Partial<FinanceStore['transactionFilters']>) => void;
  
  // Selected items
  selectedTransactionId: string | null;
  selectedBudgetId: string | null;
  selectedAccountId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  setSelectedBudgetId: (id: string | null) => void;
  setSelectedAccountId: (id: string | null) => void;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  // Modal states
  showAddTransactionModal: false,
  showAddBudgetModal: false,
  showAddAccountModal: false,
  
  // Actions
  setShowAddTransactionModal: (show) => set({ showAddTransactionModal: show }),
  setShowAddBudgetModal: (show) => set({ showAddBudgetModal: show }),
  setShowAddAccountModal: (show) => set({ showAddAccountModal: show }),
  
  // Filters
  transactionFilters: {
    search: '',
    category: '',
    type: '',
    dateRange: '30',
  },
  setTransactionFilters: (filters) => 
    set((state) => ({
      transactionFilters: { ...state.transactionFilters, ...filters }
    })),
  
  // Selected items
  selectedTransactionId: null,
  selectedBudgetId: null,
  selectedAccountId: null,
  setSelectedTransactionId: (id) => set({ selectedTransactionId: id }),
  setSelectedBudgetId: (id) => set({ selectedBudgetId: id }),
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}));
