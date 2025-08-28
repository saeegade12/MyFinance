import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Target, Loader2 } from "lucide-react";

interface AddBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBudgetModal({ open, onOpenChange }: AddBudgetModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    alertThreshold: '80',
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/budgets', data);
    },
    onSuccess: () => {
      toast({
        title: "Budget created",
        description: "Your budget has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Failed to create budget",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
      alertThreshold: '80',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const budgetData = {
      ...formData,
      amount: formData.amount,
      alertThreshold: parseInt(formData.alertThreshold),
      startDate,
      endDate,
    };

    createBudgetMutation.mutate(budgetData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const categoryOptions = [
    { value: 'groceries', label: 'Groceries' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'dining', label: 'Dining' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'travel', label: 'Travel' },
    { value: 'education', label: 'Education' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Budget Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={formData.period} onValueChange={(value) => handleInputChange('period', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
            <Select value={formData.alertThreshold} onValueChange={(value) => handleInputChange('alertThreshold', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Get notified when you reach this percentage of your budget
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-blue-700"
              disabled={createBudgetMutation.isPending}
            >
              {createBudgetMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              Create Budget
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
