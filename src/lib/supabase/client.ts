import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both Supabase env vars are present. When false, the app falls back
 * to the localStorage data + demo auth so it still runs without a backend.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Shared Supabase client (null when not configured). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
