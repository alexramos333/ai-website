import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const next = searchParams.get("next");
      const redirectTo =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", request.url)
  );
}
