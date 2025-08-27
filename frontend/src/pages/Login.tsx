import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { setAccessToken } from "../lib/api"; 
const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api").replace(/\/$/, "");


const Login: React.FC = () => {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");      // use admin username here if your backend expects 'username'
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErr(null);
  try {
    // POST /api/auth/token/ with credentials: 'include' so backend sets the httpOnly refresh cookie
    const res = await fetch(`${API_BASE}/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: email, password }), // backend expects 'username'
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.detail || "Invalid credentials");
      setLoading(false);
      return;
    }

    const data = await res.json(); // { access: "..." }
    setAccessToken(data.access ?? null);           // <-- IMPORTANT

    // if your AuthContext.refresh() loads /api/me into context, keep it:
    await refresh?.();

    const redirectTo = (location as any).state?.from?.pathname || "/";
    navigate(redirectTo, { replace: true });
  } catch {
    setErr("Network error");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-content1 rounded-xl shadow-card border border-divider p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-14 mb-2" />
          <h2 className="text-xl font-bold text-center text-foreground mb-1">
            Welcome back! Please login to your account.
          </h2>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Username
            </label>
            <input
              id="email"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-divider bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-divider bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded-md bg-primary hover:bg-primary/90 text-white font-semibold transition"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-secondary">
          <span>Don&apos;t have an account?</span>{" "}
          <a href="#" className="text-primary hover:underline font-medium">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
