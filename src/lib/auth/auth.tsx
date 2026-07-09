"use client";

import * as React from "react";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const SESSION_KEY = "autoparts:session";

/**
 * Demo credentials for the localStorage build. In production this whole module
 * is swapped for Supabase Auth (supabase.auth.signInWithPassword / signOut) —
 * the `useAuth` surface stays the same so no screen changes.
 */
export const DEMO_CREDENTIALS = {
  email: "ayoubfellat2016@gmail.com",
  password: "autoparts",
  name: "Ayoub Fellat",
  role: "Administrator",
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const login = React.useCallback((email: string, password: string) => {
    const e = email.trim().toLowerCase();
    if (e === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      const u: AuthUser = {
        email: DEMO_CREDENTIALS.email,
        name: DEMO_CREDENTIALS.name,
        role: DEMO_CREDENTIALS.role,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      setUser(u);
      return { ok: true };
    }
    return { ok: false, error: "Invalid email or password" };
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
