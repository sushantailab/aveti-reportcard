import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on every request. Without this,
 * sessions expire unpredictably from a user's point of view (server
 * components can read cookies but not reliably write the refreshed ones
 * back) — this is a well-known gap when wiring Supabase Auth into the
 * Next.js App Router, so it is not optional. See middleware.ts at the app
 * root for where this is called from.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching getUser() is what actually triggers the refresh when the
  // access token is close to expiring.
  await supabase.auth.getUser();

  return response;
}
