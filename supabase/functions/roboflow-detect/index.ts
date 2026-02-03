import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ROBOFLOW_API_KEY = Deno.env.get("ROBOFLOW_API_KEY");
    if (!ROBOFLOW_API_KEY) {
      throw new Error("ROBOFLOW_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { imageUrl, shelfId, tenantId } = await req.json();

    if (!imageUrl) {
      throw new Error("imageUrl is required");
    }

    console.log("Calling Roboflow API for image:", imageUrl.substring(0, 100) + "...");

    // Call Roboflow API
    const roboflowResponse = await fetch(
      "https://serverless.roboflow.com/cortanex-ai/workflows/find-h1s-h3s-and-h2s",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: ROBOFLOW_API_KEY,
          inputs: {
            image: { type: "url", value: imageUrl },
          },
        }),
      }
    );

    if (!roboflowResponse.ok) {
      const errorText = await roboflowResponse.text();
      console.error("Roboflow API error:", roboflowResponse.status, errorText);
      throw new Error(`Roboflow API error: ${roboflowResponse.status}`);
    }

    const detectionResult = await roboflowResponse.json();
    console.log("Roboflow detection result:", JSON.stringify(detectionResult).substring(0, 500));

    // If shelfId is provided, save to shelf_images
    if (shelfId) {
      const { error: insertError } = await supabase
        .from("shelf_images")
        .insert({
          shelf_id: shelfId,
          image_url: imageUrl,
          detection_result: detectionResult,
          processed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error saving shelf image:", insertError);
      }
    }

    // Increment usage metrics if tenantId provided
    if (tenantId) {
      await supabase.rpc("increment_usage_metric", {
        _tenant_id: tenantId,
        _period_type: "monthly",
        _images_count: 1,
      });
      await supabase.rpc("increment_usage_metric", {
        _tenant_id: tenantId,
        _period_type: "weekly",
        _images_count: 1,
      });
      await supabase.rpc("increment_usage_metric", {
        _tenant_id: tenantId,
        _period_type: "yearly",
        _images_count: 1,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: detectionResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in roboflow-detect:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
