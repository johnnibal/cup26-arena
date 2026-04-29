import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Sign-out is POST-only so it can't be triggered by a stray <img> or link
// preload. The Navbar renders it as a <form method="post"> button.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // 303 See Other converts the POST into a GET on /login, which is
  // what every browser expects after a form submission.
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
