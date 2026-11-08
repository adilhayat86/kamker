import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseSecretKey);

if (process.env.NODE_ENV === "production" && !isSupabaseConfigured) {
  throw new Error("Kamker requires a server-only SUPABASE_SECRET_KEY.");
}

if (process.env.NODE_ENV !== "production" && !isSupabaseConfigured) {
  console.warn(
    [
      "Kamker Supabase is not configured.",
      "Set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SECRET_KEY for database access.",
      "Worker registration may use the local .kamker-local fallback in development only.",
    ].join(" "),
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseSecretKey as string, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
          if (response.ok || !url.startsWith(`${supabaseUrl}/rest/v1/`)) return response;
          const error = await response.clone().json().catch(() => null);
          if (!error || typeof error.code !== "string") return response;
          // PostgreSQL errors may include an entire failing row, including hashes.
          const constraint = String(error.message ?? "").match(/constraint "([A-Za-z0-9_]+)"/)?.[1];
          return new Response(JSON.stringify({ code: error.code, details: null, hint: null,
            message: `Database request failed (${error.code}${constraint ? `; ${constraint}` : ""})` }), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          });
        },
      },
    })
  : null;
