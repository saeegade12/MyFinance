import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refetch, isAuthenticated } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Refetch auth state before redirecting
      await refetch();

      // Wait for isAuthenticated to be true before redirecting
      const waitForAuth = async (retries = 20) => {
        if (isAuthenticated) {
          setLocation("/dashboard");
        } else if (retries > 0) {
          setTimeout(() => waitForAuth(retries - 1), 100);
        } else {
          setError("Login succeeded but authentication state did not update. Please refresh.");
        }
      };
      waitForAuth();

    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <Input
          type="email"
          placeholder="Email"
          className="mb-3"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          className="mb-3"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>
        <Button
          type="button"
          className="w-full mt-2"
          variant="outline"
          onClick={() => setLocation("/signup")}
        >
          Signup
        </Button>
      </form>
    </div>
  );
}
