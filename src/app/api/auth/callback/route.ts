import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// OAuth redirect target. Supabase sends the user back here with ?code=... ,
// we exchange that code for a session (which also drops the auth cookies
// on the response), then send the user to their originally requested page.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNext(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

// Only allow internal redirect targets. Rejects absolute URLs, protocol-
// relative URLs, and anything that isn't a clean same-origin path.
function sanitizeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}
