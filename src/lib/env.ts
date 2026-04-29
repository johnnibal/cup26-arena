// Cup26 Arena - runtime env guard.
//
// Centralizes access to required environment variables so every code path
// fails with the same clear message when a `.env.local` file is missing or
// incomplete, instead of cryptic errors from deep inside the Supabase SDK.

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env.local and fill in your Supabase project values, then restart the dev server.`,
    );
  }

  return { url: url!, anonKey: anonKey! };
}
