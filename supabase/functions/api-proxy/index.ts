import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BACKEND_URL = "https://iralpha.backend.cortanexai.com";
const NO_BODY_STATUSES = new Set([101, 103, 204, 205, 304]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-target-path, x-target-method, x-target-url, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const targetPath = req.headers.get("x-target-path");
    const targetMethod = (req.headers.get("x-target-method") || "POST").toUpperCase();
    const targetBaseUrl = req.headers.get("x-target-url"); // optional override

    if (!targetPath) {
      return new Response(JSON.stringify({ error: "Missing x-target-path header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = targetBaseUrl ? targetBaseUrl.replace(/\/+$/, "") : BACKEND_URL;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apikey = req.headers.get("apikey");
    const authorization = req.headers.get("authorization");

    if (apikey) headers["apikey"] = apikey;
    if (authorization) headers["Authorization"] = authorization;

    let body: string | undefined;
    if (!["DELETE", "GET", "HEAD"].includes(targetMethod)) {
      const raw = await req.text();
      if (raw && raw !== "{}") body = raw;
    }

    const upstream = await fetch(`${baseUrl}${targetPath}`, {
      method: targetMethod,
      headers,
      body,
    });

    const status = upstream.status;
    const responseText = NO_BODY_STATUSES.has(status) ? "" : await upstream.text();

    if (NO_BODY_STATUSES.has(status)) {
      return new Response(null, {
        status,
        headers: corsHeaders,
      });
    }

    return new Response(responseText || null, {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
    console.error("api-proxy runtime error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
