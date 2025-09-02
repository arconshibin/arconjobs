import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../lib/auth";
import { Icon } from "@iconify/react"; // <-- Add Iconify import

const Login: React.FC = () => {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");      // use admin username here if your backend expects 'username'
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErr(null);
  try {
    // Use the shared stateless login helper which persists refresh in localStorage
    await login(username, password);
    // Refresh AuthContext (loads /api/me/)
    await refresh?.();

    const redirectTo = (location as any).state?.from?.pathname || "/";
    navigate(redirectTo, { replace: true });
  } catch (err: any) {
    setErr(err?.message || "Invalid credentials");
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
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-divider bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your username"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-divider bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 text-secondary hover:text-primary focus:outline-none"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Icon icon={showPassword ? "mdi:eye" : "mdi:eye-off"} width="20" height="20" />
            </button>
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
