import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1200); // mock
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
      <div className="w-full max-w-md bg-white rounded-xl shadow-card border border-dashboard-border p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-14 mb-2" />
          <h2 className="text-2xl font-bold text-dashboard-text mb-1">Sign in to Emma</h2>
          <p className="text-dashboard-text-secondary text-sm">Welcome back! Please login to your account.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dashboard-text mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-dashboard-border bg-dashboard-bg text-dashboard-text focus:outline-none focus:ring-2 focus:ring-dashboard-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dashboard-text mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-dashboard-border bg-dashboard-bg text-dashboard-text focus:outline-none focus:ring-2 focus:ring-dashboard-accent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-md bg-dashboard-accent hover:bg-dashboard-accent-hover text-white font-semibold transition"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-dashboard-text-secondary">
          <span>Don&apos;t have an account?</span>{" "}
          <a href="#" className="text-dashboard-accent hover:underline font-medium">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}