import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, BarChart } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      setLocation("/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FinanceAI Pro</h1>
          </div>
        </div>
      </header>

      {/* Hero Section with Login Form */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 text-center">
            Smart Finance Management with <span className="text-primary">AI Intelligence</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-center">
            Track expenses, manage budgets, and get AI-powered insights to make smarter financial decisions.
          </p>
          <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleLogin}>
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
            <Button type="button" className="w-full mt-2" variant="outline" onClick={() => setLocation("/signup")}>Go to Signup</Button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatic transaction categorization with AI-powered insights and real-time balance updates.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Budget Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Set smart budgets with progress tracking and intelligent alerts to keep you on track.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Receipt Scanning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Snap photos of receipts and let AI extract transaction details automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Bank-level security with encrypted data storage and privacy-first design principles.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Take Control of Your Finances?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of users who have transformed their financial management with FinanceAI Pro.
          </p>
          {/* The login form above provides the login functionality */}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 FinanceAI Pro. All rights reserved.</p>
      </footer>
    </div>
  );
}