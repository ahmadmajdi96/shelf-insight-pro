import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BACKEND_URL = "https://iralpha.backend.cortanexai.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-target-path, x-target-method, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Forward relevant headers to the backend
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apikey = req.headers.get("apikey");
    const authorization = req.headers.get("authorization");
    if (apikey) headers["apikey"] = apikey;
    if (authorization) headers["Authorization"] = authorization;

    let body: string | undefined;
    if (targetMethod !== "DELETE" && targetMethod !== "GET" && targetMethod !== "HEAD") {
      try {
        body = await req.text();
        if (!body || body === '{}') body = undefined;
      } catch { /* no body */ }
    }

    const response = await fetch(url, {
      method: targetMethod,
      headers,
      body: body || undefined,
    });

    const responseText = await response.text();
    const responseStatus = response.status;

    // For 204 No Content, return empty response
    if (responseStatus === 204) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    return new Response(responseText || null, {
      status: responseStatus,
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
