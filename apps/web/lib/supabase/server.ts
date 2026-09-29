import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * The Supabase client for use inside Server Components, Server Actions and
 * Route Handlers. It reads the visitor's session from cookies, so every
 * query it makes is automatically scoped by that user's Row Level Security
 * policies — this is what "server-side" auth means here, not a bypass of it.
 *
 * Never use this file's exports to reach a table with elevated privilege;
 * that is what SUPABASE_SERVICE_ROLE_KEY + a dedicated admin client (used
 * only inside app/api/admin/*) is for, and it must never be wired up here.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // Harmless as long as middleware.ts is also refreshing the
            // session on every request (it is — see apps/web/middleware.ts).
          }
        },
      },
    },
  );
}
