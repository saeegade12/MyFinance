import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
  password?: string;
}

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refetch();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
    logout,
  };
}

