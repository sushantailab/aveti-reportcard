import Link from "next/link";

/**
 * Shared header for every public marketing page (landing, terms, privacy,
 * refunds, contact — see docs/ARCHITECTURE.md §2's folder tree). Keeps a
 * permanent "Sign in" link visible for existing customers, separate from the
 * hero's "Start free" button, which is for first-time visitors. Without
 * this, a returning customer had no way back in except retyping /login by
 * hand — see the founder's 2026-10 feedback on the live site.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            MarksKhata
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Sign in
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
