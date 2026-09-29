"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string } | undefined;

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/**
 * Signs an existing user in. Public self-signup is intentionally not offered
 * here in the same form — see docs/PRODUCT_PRD.md § "Registration & login":
 * a school registers through /signup, which creates its Free-plan account;
 * this page is only for returning users.
 */
export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/home");
}

/**
 * Creates a new school's account (email + password only, for now). The PRD's
 * full flow — Google sign-in, a 6-digit email code, and the school-details
 * screen that follows it — is not built yet; this is the minimum that lets a
 * real account be created end-to-end against the real database while that
 * work is scoped. Supabase's own "Confirm email" setting decides whether the
 * session below already exists or the user must verify first.
 */
export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message };

  if (!data.session) {
    return { error: "Account created — check your email to confirm, then sign in." };
  }

  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
