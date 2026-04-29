import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

// Paths that do not require authentication. Anything else in the matcher
// below (so: every page route, and any non-excluded API) is gated.
const PUBLIC_PATHS = new Set<string>(["/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase must hit /api/auth/callback to exchange ?code= for a session. If the
  // IdP or dashboard redirect lands on a bad path (e.g. /? or /** from a mis-set
  // "redirect URL" wildcard), forward here so OAuth still completes.
  const oauthCode = request.nextUrl.searchParams.get("code");
  if (oauthCode && !pathname.startsWith("/api/auth/callback")) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/api/auth/callback";
    return NextResponse.redirect(callback);
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // Touching getUser() here also refreshes the session cookie, which is
  // what keeps users logged in across SSR pages.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    // Preserve the original path so we can send the user there after auth.
    if (pathname !== "/") {
      redirectUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/login") {
    const nextParam = request.nextUrl.searchParams.get("next");
    const target =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = target;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  // Run on every route *except*:
  //   - /api/*          : route handlers manage their own auth
  //   - /_next/*        : Next.js build assets
  //   - /favicon.ico    : browser chrome
  //   - /flags/*        : public static folder for country flags
  //   - any file-looking path (anything with a dot)
  matcher: [
    "/((?!api|_next|favicon.ico|flags|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|woff|woff2|ttf|css|js|map)$).*)",
  ],
};
