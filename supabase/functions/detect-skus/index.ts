import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DetectionRequest {
  imageBase64: string;
  tenantId: string;
  storeId?: string;
  skusToDetect: Array<{
    id: string;
    name: string;
    imageUrls: string[];
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, tenantId, storeId, skusToDetect } = await req.json() as DetectionRequest;
    
    if (!imageBase64 || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageBase64 and tenantId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check tenant quota before processing
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('check_tenant_quota', { _tenant_id: tenantId });

    if (quotaError) {
      console.error("Quota check error:", quotaError);
    }

    if (quotaData && !quotaData.canProcess) {
      return new Response(
        JSON.stringify({ 
          error: "Quota exceeded", 
          details: `Monthly: ${quotaData.monthlyUsage}/${quotaData.monthlyLimit}, Status: ${quotaData.status}` 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt for SKU detection
    const skuList = skusToDetect.map(sku => `- ${sku.name} (ID: ${sku.id})`).join("\n");
    
    const systemPrompt = `You are an expert retail shelf analyzer AI. Your task is to analyze shelf images and detect specific products (SKUs).

For the given shelf image, you must:
1. Identify which of the specified SKUs are visible on the shelf
2. Count the number of "facings" (visible front-facing units) for each detected SKU
3. Estimate the share of shelf (percentage of shelf space occupied by the detected products)
4. Provide bounding box coordinates for each detected product (as percentages of image dimensions)

Respond ONLY with valid JSON in this exact format:
{
  "detections": [
    {
      "skuId": "uuid-of-sku",
      "skuName": "Product Name",
      "isAvailable": true,
      "facings": 3,
      "confidence": 0.95,
      "boundingBox": { "x": 10, "y": 20, "width": 15, "height": 25 }
    }
  ],
  "missingSkus": [
    { "skuId": "uuid", "skuName": "Name" }
  ],
  "shareOfShelf": {
    "totalShelfArea": 100,
    "trainedProductsArea": 35,
    "percentage": 35.0
  },
  "totalFacings": 12,
  "summary": "Brief description of shelf analysis"
}`;

    const userPrompt = `Analyze this retail shelf image and detect the following products:

${skuList}

For each product, determine:
- Whether it's visible on the shelf
- How many facings (front-facing units) are visible
- The approximate bounding box location (as percentage of image width/height)

Also calculate the overall share of shelf for these products compared to the total visible shelf space.`;

    // Call Lovable AI with vision capabilities
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` 
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response from AI
    let detectionResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        detectionResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse detection results");
    }

    // Store the detection in the database
    const { data: detection, error: insertError } = await supabase
      .from("detections")
      .insert({
        tenant_id: tenantId,
        store_id: storeId || null,
        original_image_url: "uploaded",
        detection_result: detectionResult,
        share_of_shelf_percentage: detectionResult.shareOfShelf?.percentage || 0,
        total_facings: detectionResult.totalFacings || 0,
        detected_skus: detectionResult.detections?.length || 0,
        missing_skus: detectionResult.missingSkus?.length || 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save detection:", insertError);
    }

    // Increment usage metrics for all periods
    const periodTypes = ['daily', 'weekly', 'monthly', 'yearly'];
    for (const periodType of periodTypes) {
      const { error: usageError } = await supabase
        .rpc('increment_usage_metric', {
          _tenant_id: tenantId,
          _period_type: periodType,
          _images_count: 1,
        });
      
      if (usageError) {
        console.error(`Failed to update ${periodType} usage:`, usageError);
      }
    }

    // Update tenant's processed images count (for backward compatibility)
    await supabase
      .from("tenants")
      .update({
        processed_images_this_month: (quotaData?.monthlyUsage || 0) + 1,
        processed_images_this_week: (quotaData?.weeklyUsage || 0) + 1,
        processed_images_this_year: (quotaData?.yearlyUsage || 0) + 1,
      })
      .eq("id", tenantId);

    return new Response(
      JSON.stringify({
        success: true,
        detectionId: detection?.id,
        result: detectionResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Detection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Detection failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
