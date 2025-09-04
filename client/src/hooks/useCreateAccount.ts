// src/hooks/useCreateAccount.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type NewAccountPayload = {
  name: string;
  type: "checking" | "savings" | "credit_card" | "investment";
  balance: string;
  currency: string;
};

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAccount: NewAccountPayload) => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });

      if (!res.ok) throw new Error("Failed to create account");

      return res.json();
    },
    onSuccess: () => {
      // Refresh accounts list
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
  });
}
