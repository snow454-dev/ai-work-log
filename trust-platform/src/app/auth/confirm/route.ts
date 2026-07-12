import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const noStoreHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!tokenHash && !code) {
    return redirectWithNoStore("/sign-in?error=invalid", request);
  }

  const supabase = await createClient();
  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      })
    : await supabase.auth.exchangeCodeForSession(code!);

  return redirectWithNoStore(
    error ? "/sign-in?error=invalid" : next,
    request,
  );
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function redirectWithNoStore(path: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(path, request.url));

  Object.entries(noStoreHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
