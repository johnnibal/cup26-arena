"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  next?: string;
};

export function GoogleSignInButton({ next }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL("/api/auth/callback", window.location.origin);
    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }

    // On success the browser navigates to Google, so we never reach here.
    // Leave loading=true so the button stays disabled while the redirect
    // is in flight.
  };

  return (
    <div className="flex flex-col items-stretch gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex h-11 items-center justify-center gap-3 rounded-xl border border-white/12 bg-surface-muted/50 px-4 text-sm font-semibold text-heading shadow-inner transition hover:border-white/20 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark />
        {loading ? "Redirecting to Google..." : "Continue with Google"}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-brand-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.7 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
