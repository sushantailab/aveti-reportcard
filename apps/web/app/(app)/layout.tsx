import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

/**
 * Every route under app/(app)/ requires a signed-in user. This check runs on
 * the server for every request to this layout (and everything nested under
 * it) — there is no client-side-only gate to bypass.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <span className="font-semibold text-[var(--brand)]">MarksKhata</span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-[var(--muted)] hover:underline">
            Sign out
          </button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
