// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api, initAccessFromRefresh } from "../lib/api";

type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  profile?: {
    id: string;
    role: string;
    organization: string | null;
  };
};

type AuthValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      // IMPORTANT: use api.get so Authorization header + auto-refresh are applied
      const me = await api.get<User>("/me/");
      // MeView returns the user object directly (not { user: ... })
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    // Tell backend to blacklist refresh + clear cookie; ignore body (204 is OK)
    await api.post<any>("/auth/logout/");
    setUser(null);
  }

  useEffect(() => {
    // 1) Try to mint an access token from the httpOnly refresh cookie
    // 2) Then load /me with that access (if minted)
    (async () => {
      try {
        await initAccessFromRefresh();
      } finally {
        await refresh();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
