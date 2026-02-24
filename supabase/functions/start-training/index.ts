import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { dataset_id, epochs = 100, batch_size = 16 } = await req.json();

    if (!dataset_id) {
      return new Response(
        JSON.stringify({ error: "dataset_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create training job
    const { data: job, error: jobErr } = await adminClient
      .from("training_jobs")
      .insert({
        dataset_id,
        epochs,
        batch_size,
        status: "pending",
        created_by: userId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobErr) throw jobErr;

    // Update job to "training" status
    await adminClient
      .from("training_jobs")
      .update({ status: "training", progress: 0 })
      .eq("id", job.id);

    // Update dataset status
    await adminClient
      .from("datasets")
      .update({ status: "training" })
      .eq("id", dataset_id);

    // TODO: Replace with actual training endpoint
    // When you provide the custom endpoint, this section will:
    // 1. Export dataset as ZIP (call export-dataset function)
    // 2. POST the ZIP to your training API
    // 3. Poll for status updates
    //
    // For now, simulate training completion after a short delay
    // In production, this would be an async webhook-based flow

    // Simulate: mark as completed after creation
    // The actual endpoint will handle real training status updates
    setTimeout(async () => {
      try {
        await adminClient
          .from("training_jobs")
          .update({
            status: "completed",
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        await adminClient
          .from("datasets")
          .update({ status: "ready" })
          .eq("id", dataset_id);
      } catch (e) {
        console.error("Failed to update training status:", e);
      }
    }, 10000); // 10 second simulated training

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        message:
          "Training job started. Currently using simulated training — replace with custom endpoint.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
