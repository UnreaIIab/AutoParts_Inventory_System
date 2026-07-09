"use client";

import * as React from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const SESSION_KEY = "autoparts:session";

/**
 * Demo credentials used only in the localStorage fallback (when Supabase env
 * vars are absent). With Supabase configured, real users come from Supabase Auth.
 */
export const DEMO_CREDENTIALS = {
  email: "ayoubfellat2016@gmail.com",
  password: "autoparts",
  name: "Ayoub Fellat",
  role: "Administrator",
};

function toAuthUser(u: SupabaseUser): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, string>;
  return {
    email: u.email ?? "",
    name: meta.name ?? meta.full_name ?? (u.email ? u.email.split("@")[0] : "User"),
    role: meta.role ?? "Administrator",
  };
}

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
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setUser(data.session ? toAuthUser(data.session.user) : null);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session ? toAuthUser(session.user) : null);
      });
      return () => sub.subscription.unsubscribe();
    }
    // localStorage fallback
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const msg = /invalid login/i.test(error.message)
          ? "Invalid email or password"
          : error.message;
        return { ok: false, error: msg };
      }
      return { ok: true };
    }
    // demo fallback
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

  const logout = React.useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
