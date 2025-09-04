import { useQuery } from "@tanstack/react-query";

interface User {
  claims?: {
    sub: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    exp?: number;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
  queryKey: ["auth", "user"],
  queryFn: async () => {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    return res.json();
  },
  retry: false,
});

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
