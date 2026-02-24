import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://esm.sh/jszip@3.10.1";

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

    const { dataset_id } = await req.json();
    if (!dataset_id) {
      return new Response(
        JSON.stringify({ error: "dataset_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch dataset images with annotations
    const { data: images, error: imgErr } = await supabase
      .from("dataset_images")
      .select("*")
      .eq("dataset_id", dataset_id);

    if (imgErr) throw imgErr;

    // Fetch classes for class index mapping
    const { data: classes, error: clsErr } = await supabase
      .from("dataset_classes")
      .select("*")
      .eq("dataset_id", dataset_id)
      .order("created_at", { ascending: true });

    if (clsErr) throw clsErr;

    // Build class index map: classId -> index
    const classIndexMap: Record<string, number> = {};
    (classes || []).forEach((c: any, i: number) => {
      classIndexMap[c.id] = i;
    });

    const zip = new JSZip();
    const imagesFolder = zip.folder("images")!;
    const labelsFolder = zip.folder("labels")!;

    // Add classes.txt (YOLOv8 class names file)
    const classNames = (classes || []).map((c: any) => c.name).join("\n");
    zip.file("classes.txt", classNames);

    // Add data.yaml for YOLOv8
    const yamlContent = `# YOLOv8 Dataset Configuration
path: .
train: images
val: images

nc: ${(classes || []).length}
names: [${(classes || []).map((c: any) => `'${c.name}'`).join(", ")}]
`;
    zip.file("data.yaml", yamlContent);

    // Process each image
    for (const img of images || []) {
      const fileName = img.file_name || `${img.id}.jpg`;
      const baseName = fileName.replace(/\.[^.]+$/, "");

      // Download image and add to zip
      try {
        const imgResponse = await fetch(img.image_url);
        if (imgResponse.ok) {
          const imgBlob = await imgResponse.arrayBuffer();
          imagesFolder.file(fileName, imgBlob);
        }
      } catch {
        // Skip images that fail to download
        continue;
      }

      // Convert annotations to YOLOv8 format
      // YOLOv8 format: class_index x_center y_center width height (all normalized 0-1)
      const annotations = (img.annotations as any[]) || [];
      const labelLines: string[] = [];

      for (const ann of annotations) {
        const classIndex = classIndexMap[ann.classId];
        if (classIndex === undefined) continue;

        // Convert from x,y,w,h (top-left) to x_center, y_center, w, h
        const xCenter = ann.x + ann.w / 2;
        const yCenter = ann.y + ann.h / 2;

        labelLines.push(
          `${classIndex} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${ann.w.toFixed(6)} ${ann.h.toFixed(6)}`
        );
      }

      labelsFolder.file(`${baseName}.txt`, labelLines.join("\n"));
    }

    // Generate ZIP
    const zipContent = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(zipContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="dataset-${dataset_id}.zip"`,
      },
    });
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
