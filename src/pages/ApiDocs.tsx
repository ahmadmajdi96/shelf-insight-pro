import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Check, FileText, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ShelfVision API",
    description: "REST API for ShelfVision retail shelf detection and planogram compliance platform.",
    version: "1.0.0",
    contact: { name: "ShelfVision Team" }
  },
  servers: [
    { url: "https://{project_id}.supabase.co", description: "Production", variables: { project_id: { default: "your-project-id" } } }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      apiKey: { type: "apiKey", in: "header", name: "apikey" }
    },
    schemas: {
      Tenant: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          status: { type: "string", enum: ["active", "suspended"] },
          is_active: { type: "boolean" },
          logo_url: { type: "string", nullable: true },
          username: { type: "string", nullable: true },
          max_skus: { type: "integer", default: 50 },
          max_images_per_month: { type: "integer", default: 1000 },
          max_images_per_week: { type: "integer", default: 300 },
          max_images_per_year: { type: "integer", default: 10000 },
          processed_images_this_month: { type: "integer" },
          processed_images_this_week: { type: "integer" },
          processed_images_this_year: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      Store: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          address: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      SKU: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid" },
          category_id: { type: "string", format: "uuid", nullable: true },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          barcode: { type: "string", nullable: true },
          is_active: { type: "boolean" },
          training_status: { type: "string", enum: ["pending", "training", "completed", "failed"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      ProductCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      PlanogramTemplate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid" },
          store_id: { type: "string", format: "uuid", nullable: true },
          shelf_id: { type: "string", format: "uuid", nullable: true },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["draft", "active", "archived"] },
          layout: { type: "array", items: { type: "object" } },
          created_by: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      PlanogramVersion: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          template_id: { type: "string", format: "uuid" },
          version_number: { type: "integer" },
          layout: { type: "array", items: { type: "object" } },
          change_notes: { type: "string", nullable: true },
          created_by: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Shelf: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid" },
          store_id: { type: "string", format: "uuid", nullable: true },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          location_in_store: { type: "string", nullable: true },
          width_cm: { type: "number", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      Detection: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid" },
          store_id: { type: "string", format: "uuid", nullable: true },
          original_image_url: { type: "string" },
          annotated_image_url: { type: "string", nullable: true },
          detection_result: { type: "object", nullable: true },
          share_of_shelf_percentage: { type: "number", nullable: true },
          total_facings: { type: "integer", nullable: true },
          detected_skus: { type: "integer", nullable: true },
          missing_skus: { type: "integer", nullable: true },
          processed_at: { type: "string", format: "date-time" }
        }
      },
      ComplianceScan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          template_id: { type: "string", format: "uuid" },
          shelf_image_id: { type: "string", format: "uuid", nullable: true },
          image_url: { type: "string" },
          compliance_score: { type: "number" },
          total_expected: { type: "integer" },
          total_found: { type: "integer" },
          total_missing: { type: "integer" },
          total_extra: { type: "integer" },
          details: { type: "array", nullable: true },
          scanned_by: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid", nullable: true },
          full_name: { type: "string", nullable: true },
          username: { type: "string", nullable: true },
          avatar_url: { type: "string", nullable: true },
          last_login: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          tenant_id: { type: "string", format: "uuid", nullable: true },
          title: { type: "string" },
          message: { type: "string" },
          type: { type: "string" },
          is_read: { type: "boolean" },
          metadata: { type: "object", nullable: true },
          created_at: { type: "string", format: "date-time" }
        }
      },
      DetectSKUsRequest: {
        type: "object",
        required: ["imageBase64", "tenantId"],
        properties: {
          imageBase64: { type: "string", description: "Base64-encoded image or data URI" },
          tenantId: { type: "string", format: "uuid" },
          storeId: { type: "string", format: "uuid" },
          skusToDetect: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                imageUrls: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      DetectSKUsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          detectionId: { type: "string", format: "uuid" },
          result: {
            type: "object",
            properties: {
              detections: { type: "array", items: { type: "object" } },
              missingSkus: { type: "array", items: { type: "object" } },
              shareOfShelf: { type: "object" },
              totalFacings: { type: "integer" },
              summary: { type: "string" }
            }
          }
        }
      },
      RoboflowDetectRequest: {
        type: "object",
        required: ["imageUrl"],
        properties: {
          imageUrl: { type: "string", format: "uri" },
          shelfId: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }, { apiKey: [] }],
  paths: {
    "/rest/v1/tenants": {
      get: { summary: "List tenants", tags: ["Tenants"], parameters: [{ name: "select", in: "query", schema: { type: "string" }, description: "Columns to return (e.g. *)" }, { name: "status", in: "query", schema: { type: "string" }, description: "Filter: eq.active" }], responses: { "200": { description: "Array of tenants" } } },
      post: { summary: "Create tenant", tags: ["Tenants"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Tenant" } } } }, responses: { "201": { description: "Created tenant" } } }
    },
    "/rest/v1/tenants?id=eq.{id}": {
      patch: { summary: "Update tenant", tags: ["Tenants"], responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete tenant", tags: ["Tenants"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/stores": {
      get: { summary: "List stores", tags: ["Stores"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }], responses: { "200": { description: "Array of stores" } } },
      post: { summary: "Create store", tags: ["Stores"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Store" } } } }, responses: { "201": { description: "Created store" } } }
    },
    "/rest/v1/stores?id=eq.{id}": {
      patch: { summary: "Update store", tags: ["Stores"], responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete store", tags: ["Stores"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/skus": {
      get: { summary: "List SKUs (Products)", tags: ["Products"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "category_id", in: "query", schema: { type: "string" } }, { name: "is_active", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of SKUs" } } },
      post: { summary: "Create SKU", tags: ["Products"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/SKU" } } } }, responses: { "201": { description: "Created SKU" } } }
    },
    "/rest/v1/product_categories": {
      get: { summary: "List categories", tags: ["Categories"], responses: { "200": { description: "Array of categories" } } },
      post: { summary: "Create category", tags: ["Categories"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/ProductCategory" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/planogram_templates": {
      get: { summary: "List planogram templates", tags: ["Planograms"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of templates" } } },
      post: { summary: "Create planogram", tags: ["Planograms"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramTemplate" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/planogram_versions": {
      get: { summary: "List planogram versions", tags: ["Planograms"], parameters: [{ name: "template_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of versions" } } },
      post: { summary: "Create version snapshot", tags: ["Planograms"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramVersion" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelves": {
      get: { summary: "List shelves", tags: ["Shelves"], responses: { "200": { description: "Array of shelves" } } },
      post: { summary: "Create shelf", tags: ["Shelves"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Shelf" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelf_products": {
      get: { summary: "List shelf-product assignments", tags: ["Shelves"], responses: { "200": { description: "Array of assignments" } } },
      post: { summary: "Assign product to shelf", tags: ["Shelves"], responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelf_images": {
      get: { summary: "List shelf images", tags: ["Shelves"], responses: { "200": { description: "Array of shelf images" } } },
      post: { summary: "Upload shelf image record", tags: ["Shelves"], responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/detections": {
      get: { summary: "List detections", tags: ["Detection"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of detections" } } }
    },
    "/rest/v1/compliance_scans": {
      get: { summary: "List compliance scans", tags: ["Compliance"], parameters: [{ name: "template_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of compliance scans" } } }
    },
    "/rest/v1/profiles": {
      get: { summary: "List user profiles", tags: ["Users"], responses: { "200": { description: "Array of profiles" } } }
    },
    "/rest/v1/profiles?user_id=eq.{user_id}": {
      patch: { summary: "Update profile", tags: ["Users"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Profile" } } } }, responses: { "200": { description: "Updated" } } }
    },
    "/rest/v1/user_roles": {
      get: { summary: "List user roles", tags: ["Users"], responses: { "200": { description: "Array of user roles" } } },
      post: { summary: "Assign role", tags: ["Users"], responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/notifications": {
      get: { summary: "List notifications", tags: ["Notifications"], responses: { "200": { description: "Array of notifications" } } },
      post: { summary: "Create notification", tags: ["Notifications"], responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/usage_metrics": {
      get: { summary: "List usage metrics", tags: ["Usage"], responses: { "200": { description: "Array of usage metrics" } } }
    },
    "/rest/v1/rpc/check_tenant_quota": {
      post: { summary: "Check tenant quota", tags: ["RPC"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { _tenant_id: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "Quota status JSON" } } }
    },
    "/rest/v1/rpc/increment_usage_metric": {
      post: { summary: "Increment usage metric", tags: ["RPC"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { _tenant_id: { type: "string", format: "uuid" }, _period_type: { type: "string" }, _images_count: { type: "integer" } } } } } }, responses: { "200": { description: "Success" } } }
    },
    "/rest/v1/rpc/get_user_tenant_id": {
      post: { summary: "Get user's tenant ID", tags: ["RPC"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { _user_id: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "Tenant UUID" } } }
    },
    "/rest/v1/rpc/has_role": {
      post: { summary: "Check if user has role", tags: ["RPC"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { _user_id: { type: "string", format: "uuid" }, _role: { type: "string", enum: ["admin", "tenant_admin", "tenant_user"] } } } } } }, responses: { "200": { description: "Boolean" } } }
    },
    "/functions/v1/detect-skus": {
      post: { summary: "AI SKU Detection", tags: ["Edge Functions"], description: "Sends a shelf image to AI for SKU detection, saves results and increments usage.", requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/DetectSKUsRequest" } } } }, responses: { "200": { description: "Detection result", content: { "application/json": { schema: { "$ref": "#/components/schemas/DetectSKUsResponse" } } } }, "402": { description: "AI credits exhausted" }, "429": { description: "Rate limit / quota exceeded" } } }
    },
    "/functions/v1/roboflow-detect": {
      post: { summary: "Roboflow Detection", tags: ["Edge Functions"], description: "Sends image URL to Roboflow workflow, optionally saves to shelf_images and increments usage.", requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/RoboflowDetectRequest" } } } }, responses: { "200": { description: "Detection result" }, "500": { description: "Error" } } }
    },
    "/auth/v1/signup": {
      post: { summary: "Sign up", tags: ["Auth"], requestBody: { content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" }, data: { type: "object", properties: { full_name: { type: "string" } } } } } } } }, responses: { "200": { description: "User + session" } } }
    },
    "/auth/v1/token?grant_type=password": {
      post: { summary: "Sign in", tags: ["Auth"], requestBody: { content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } } }, responses: { "200": { description: "Session with access_token and refresh_token" } } }
    },
    "/auth/v1/logout": {
      post: { summary: "Sign out", tags: ["Auth"], responses: { "204": { description: "Signed out" } } }
    },
    "/storage/v1/object/shelf-images/{path}": {
      post: { summary: "Upload shelf image", tags: ["Storage"], responses: { "200": { description: "Upload result with Key" } } },
      get: { summary: "Download shelf image", tags: ["Storage"], responses: { "200": { description: "Image binary" } } }
    },
    "/storage/v1/object/sku-training-images/{path}": {
      post: { summary: "Upload SKU training image", tags: ["Storage"], responses: { "200": { description: "Upload result with Key" } } },
      get: { summary: "Download SKU training image", tags: ["Storage"], responses: { "200": { description: "Image binary" } } }
    }
  }
};

function generateMarkdown(): string {
  const spec = openApiSpec;
  let md = `# ${spec.info.title}\n\n`;
  md += `**Version:** ${spec.info.version}\n\n`;
  md += `${spec.info.description}\n\n`;
  md += `---\n\n`;

  // Auth info
  md += `## Authentication\n\n`;
  md += `All requests require:\n`;
  md += `- \`apikey\` header: Your project's anon/service key\n`;
  md += `- \`Authorization: Bearer <jwt>\` header: User's access token\n\n`;
  md += `---\n\n`;

  // Group by tags
  const tagGroups: Record<string, { method: string; path: string; op: any }[]> = {};
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods as Record<string, any>)) {
      const tag = (op as any).tags?.[0] || 'Other';
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push({ method: method.toUpperCase(), path, op });
    }
  }

  for (const [tag, endpoints] of Object.entries(tagGroups)) {
    md += `## ${tag}\n\n`;
    for (const { method, path, op } of endpoints) {
      md += `### \`${method} ${path}\`\n\n`;
      md += `${op.summary || ''}${op.description ? ' — ' + op.description : ''}\n\n`;

      if (op.parameters?.length) {
        md += `**Query Parameters:**\n\n`;
        md += `| Name | Type | Description |\n|------|------|-------------|\n`;
        for (const p of op.parameters) {
          md += `| \`${p.name}\` | ${p.schema?.type || 'string'} | ${p.description || ''} |\n`;
        }
        md += `\n`;
      }

      if (op.requestBody) {
        const schema = op.requestBody.content?.['application/json']?.schema;
        if (schema) {
          const ref = schema['$ref'];
          if (ref) {
            md += `**Request Body:** See schema \`${ref.split('/').pop()}\`\n\n`;
          } else if (schema.properties) {
            md += `**Request Body:**\n\n`;
            md += `| Field | Type | Required |\n|-------|------|----------|\n`;
            for (const [k, v] of Object.entries(schema.properties as any)) {
              const req = schema.required?.includes(k) ? 'Yes' : 'No';
              md += `| \`${k}\` | ${(v as any).type || 'object'} | ${req} |\n`;
            }
            md += `\n`;
          }
        }
      }

      md += `**Responses:**\n\n`;
      for (const [code, res] of Object.entries(op.responses as any)) {
        md += `- \`${code}\`: ${(res as any).description}\n`;
      }
      md += `\n---\n\n`;
    }
  }

  // Schemas
  md += `## Schemas\n\n`;
  for (const [name, schema] of Object.entries(spec.components.schemas as any)) {
    md += `### ${name}\n\n`;
    md += `| Field | Type | Nullable | Description |\n|-------|------|----------|-------------|\n`;
    for (const [field, def] of Object.entries((schema as any).properties || {} as any)) {
      const d = def as any;
      const type = d.format ? `${d.type} (${d.format})` : (d.type || 'object');
      const nullable = d.nullable ? 'Yes' : 'No';
      const desc = d.description || (d.enum ? `Enum: ${d.enum.join(', ')}` : (d.default !== undefined ? `Default: ${d.default}` : ''));
      md += `| \`${field}\` | ${type} | ${nullable} | ${desc} |\n`;
    }
    md += `\n`;
  }

  return md;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApiDocs() {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(openApiSpec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    downloadFile(JSON.stringify(openApiSpec, null, 2), 'shelfvision-openapi.json', 'application/json');
  };

  const handleDownloadMarkdown = () => {
    downloadFile(generateMarkdown(), 'shelfvision-api-docs.md', 'text/markdown');
  };

  const markdownContent = generateMarkdown();

  return (
    <MainLayout title="API Documentation" subtitle="OpenAPI 3.0 specification for the ShelfVision platform.">
      <div className="max-w-5xl space-y-6">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadJson} className="gap-2">
            <Download className="w-4 h-4" />
            Download OpenAPI JSON
          </Button>
          <Button onClick={handleDownloadMarkdown} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Download Markdown
          </Button>
          <Button onClick={handleCopyJson} variant="outline" className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
        </div>

        <Tabs defaultValue="markdown" className="w-full">
          <TabsList>
            <TabsTrigger value="markdown" className="gap-2">
              <FileText className="w-4 h-4" />
              Readable Docs
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-2">
              <Code className="w-4 h-4" />
              OpenAPI JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markdown" className="mt-4">
            <div className="rounded-xl bg-card border border-border p-6 prose prose-invert max-w-none overflow-auto max-h-[70vh]">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                {markdownContent}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <div className="rounded-xl bg-card border border-border p-6 overflow-auto max-h-[70vh]">
              <pre className="text-sm text-foreground font-mono leading-relaxed">
                {JSON.stringify(openApiSpec, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
