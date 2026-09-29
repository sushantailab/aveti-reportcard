import { createBrowserClient } from "@supabase/ssr";

/**
 * The Supabase client for use inside Client Components (anything with "use
 * client" at the top). Reads only the two NEXT_PUBLIC_ variables, which are
 * safe to ship to the browser — see apps/web/.env.local.example.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
