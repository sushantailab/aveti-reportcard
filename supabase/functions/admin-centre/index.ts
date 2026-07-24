import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Missing authentication token.");
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed.");
    const { data: master } = await admin.from("platform_admins").select("user_id").eq("user_id", user.id).eq("active", true).maybeSingle();
    if (!master) throw new Error("Only the Master Admin can manage centre logins.");

    const body = await request.json();
    const centreId = String(body.centre_id || "");
    if (!centreId) throw new Error("Centre is required.");
    const { data: centre } = await admin.from("centres").select("id").eq("id", centreId).maybeSingle();
    if (!centre) throw new Error("Centre not found.");
    if (body.action === "list_centre_logins") {
      const { data: memberships, error: membershipError } = await admin.from("centre_memberships").select("user_id,role,active,created_at").eq("centre_id", centreId);
      if (membershipError) throw new Error(membershipError.message);
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw new Error(usersError.message);
      const byId = new Map(users.users.map((item) => [item.id, item.email || ""]));
      return new Response(JSON.stringify({ logins: (memberships || []).map((item) => ({ ...item, email: byId.get(item.user_id) || item.user_id })) }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (body.action === "set_centre_login_status") {
      const userId = String(body.user_id || "");
      const active = Boolean(body.active);
      if (!userId) throw new Error("User is required.");
      const { error: membershipError } = await admin.from("centre_memberships").update({ active }).eq("centre_id", centreId).eq("user_id", userId);
      if (membershipError) throw new Error(membershipError.message);
      await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
      await admin.from("audit_log").insert({ centre_id: centreId, actor_user_id: user.id, action: active ? "enable_centre_login" : "disable_centre_login", table_name: "centre_memberships", record_id: userId });
      return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (body.action !== "create_centre_login") throw new Error("Unsupported action.");
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || password.length < 8) throw new Error("Email and a password of at least 8 characters are required.");
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError || !created.user) throw new Error(createError?.message || "Login could not be created.");
    const { error: membershipError } = await admin.from("centre_memberships").upsert({ centre_id: centreId, user_id: created.user.id, role: "centre_admin", active: true });
    if (membershipError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error(membershipError.message);
    }
    await admin.from("audit_log").insert({ centre_id: centreId, actor_user_id: user.id, action: "create_centre_login", table_name: "centre_memberships", record_id: created.user.id, details: { email } });
    return new Response(JSON.stringify({ success: true, email }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
