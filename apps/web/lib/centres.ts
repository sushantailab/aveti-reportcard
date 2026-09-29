import { createClient } from "@/lib/supabase/server";

/**
 * Ports listAccessibleCentres() from the current app
 * (assets/js/core/database.js) unchanged in behaviour: a platform admin sees
 * every centre; anyone else sees only the centres they have an active
 * membership row for. Row Level Security enforces this independently on the
 * database side (supabase/migrations/20260724_multi_centre_access.sql) — this
 * function does not grant access, it only reads what RLS already allows for
 * the signed-in user.
 */

export type Centre = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  centre_head_name: string | null;
  logo_url: string | null;
  band_config: unknown;
  status: string;
  archived_at: string | null;
  owner_user_id: string | null;
  role: "master_admin" | "centre_admin" | "viewer";
};

const CENTRE_COLS =
  "id,name,address,phone,email,centre_head_name,logo_url,band_config,status,archived_at,owner_user_id";

export async function getAccessibleCentres(): Promise<Centre[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: master } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (master) {
    const { data, error } = await supabase.from("centres").select(CENTRE_COLS).order("created_at");
    if (error) throw error;
    return (data ?? []).map((centre) => ({ ...centre, role: "master_admin" as const }));
  }

  const { data, error } = await supabase
    .from("centre_memberships")
    .select(`centre_id,role,active,centres(${CENTRE_COLS})`)
    .eq("user_id", user.id)
    .eq("active", true);
  if (error) throw error;

  return (data ?? [])
    .map((row) => (row.centres ? { ...(row.centres as object), role: row.role } : null))
    .filter((centre): centre is Centre => centre !== null);
}
