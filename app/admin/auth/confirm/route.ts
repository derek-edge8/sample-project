import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";

// Landing point for the invite and password-reset emails
// (supabase/templates/*.html). Exchanges the one-time token for a session,
// then sends the admin to choose a password.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const target = request.nextUrl.clone();
  target.search = "";

  if (tokenHash && (type === "invite" || type === "recovery")) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      target.pathname = "/admin/set-password";
      return NextResponse.redirect(target);
    }
  }

  target.pathname = "/admin/login";
  target.searchParams.set("error", "link");
  return NextResponse.redirect(target);
}
