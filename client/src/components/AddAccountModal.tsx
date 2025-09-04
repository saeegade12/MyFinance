// src/components/AddAccountModal.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateAccount } from "@/hooks/useCreateAccount";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
};

function AddAccountModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const createAccount = useCreateAccount();

  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "USD",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const normalizedBalance =
      form.balance.trim() === ""
        ? "0.00"
        : Number(form.balance).toFixed(2).toString();

    const payload = {
      name: form.name.trim(),
      type: form.type as
        | "checking"
        | "savings"
        | "credit_card"
        | "investment",
      balance: normalizedBalance,
      currency: form.currency.trim() || "USD",
    };

    try {
      await createAccount.mutateAsync(payload);
      toast({
        title: "Account added!",
        description: `${payload.name} created.`,
      });
      onClose();
      setForm({ name: "", type: "checking", balance: "", currency: "USD" });
    } catch (err: any) {
      toast({
        title: "Failed to add account",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Add Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Account Name (e.g., HDFC Savings)"
              value={form.name}
              onChange={handleChange}
              required
            />

            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit_card">Credit Card</option>
              <option value="investment">Investment</option>
            </select>

            <Input
              name="balance"
              type="number"
              step="0.01"
              placeholder="Balance (e.g., 1000.00)"
              value={form.balance}
              onChange={handleChange}
            />

            <Input
              name="currency"
              placeholder="Currency (USD, INR...)"
              value={form.currency}
              onChange={handleChange}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createAccount.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddAccountModal;
