import { cache } from "react";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Calls public.is_admin() in Postgres (SECURITY DEFINER, keyed off admin_users).
// Cached per request so layout + page can share one round-trip.
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    console.error("is_admin RPC failed:", error.message);
    return false;
  }

  return Boolean(data);
});

// Use on /admin/* routes. Returns 404 for everyone else so the URL does not
// advertise an admin surface to non-privileged users.
export async function requireAdmin(): Promise<void> {
  if (!(await getIsAdmin())) notFound();
}
