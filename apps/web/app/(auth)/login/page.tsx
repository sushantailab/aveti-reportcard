import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <AuthForm action={signIn} submitLabel="Sign in" />
      <p className="text-sm text-[var(--muted)]">
        New school?{" "}
        <Link href="/signup" className="font-medium text-[var(--brand)] hover:underline">
          Start free
        </Link>
      </p>
    </main>
  );
}
