import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, password, full_name, role, tenant_id, admin_id } = await req.json();

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: "email, password, and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const profilePayload: Record<string, any> = {
      user_id: userId,
      full_name: full_name || null,
    };
    if (tenant_id) profilePayload.tenant_id = tenant_id;
    if (admin_id) profilePayload.admin_id = admin_id;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert(profilePayload);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't fail the whole operation, profile might be auto-created by trigger
    }

    // Assign role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    return new Response(
      JSON.stringify({ user_id: userId, success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
