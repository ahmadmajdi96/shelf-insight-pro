import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BACKEND_URL = "https://iralpha.backend.cortanexai.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-path, x-target-method",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const targetPath = req.headers.get("x-target-path");
    const targetMethod = req.headers.get("x-target-method") || "POST";

    if (!targetPath) {
      return new Response(JSON.stringify({ error: "Missing x-target-path header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `${BACKEND_URL}${targetPath}`;
    
    // Forward relevant headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    const apikey = req.headers.get("apikey");
    const authorization = req.headers.get("authorization");
    if (apikey) headers["apikey"] = apikey;
    if (authorization) headers["Authorization"] = authorization;

    const body = targetMethod !== "DELETE" ? await req.text() : undefined;

    const response = await fetch(url, {
      method: targetMethod,
      headers,
      body: body || undefined,
    });

    const responseText = await response.text();
    
    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
