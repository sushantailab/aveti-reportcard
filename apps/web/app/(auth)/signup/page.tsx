import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/auth/actions";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Start free</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Free for up to 50 students. No card needed.</p>
      </div>
      <AuthForm action={signUp} submitLabel="Create account" />
      <p className="text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
