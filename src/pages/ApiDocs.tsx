import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Copy, Check, FileText, Code, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── DATA EXAMPLES ───────────────────────────────────────────────────────────

const examples: Record<string, { request?: any; response?: any }> = {
  // ── Tenants ──
  "GET /rest/v1/tenants": {
    response: [
      {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name: "Acme Retail Corp",
        status: "active",
        is_active: true,
        logo_url: "https://storage.example.com/logos/acme.png",
        username: "acme_admin",
        max_skus: 100,
        max_images_per_month: 5000,
        max_images_per_week: 1500,
        max_images_per_year: 50000,
        processed_images_this_month: 342,
        processed_images_this_week: 87,
        processed_images_this_year: 2100,
        created_at: "2025-01-15T08:30:00Z",
        updated_at: "2025-06-10T14:22:00Z"
      }
    ]
  },
  "POST /rest/v1/tenants": {
    request: {
      name: "New Retail Partner",
      status: "active",
      is_active: true,
      max_skus: 50,
      max_images_per_month: 1000,
      max_images_per_week: 300,
      max_images_per_year: 10000,
      username: "new_partner"
    },
    response: {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "New Retail Partner",
      status: "active",
      is_active: true,
      max_skus: 50,
      max_images_per_month: 1000,
      max_images_per_week: 300,
      max_images_per_year: 10000,
      username: "new_partner",
      processed_images_this_month: 0,
      processed_images_this_week: 0,
      processed_images_this_year: 0,
      created_at: "2026-02-18T10:00:00Z",
      updated_at: "2026-02-18T10:00:00Z"
    }
  },
  "PATCH /rest/v1/tenants?id=eq.{id}": {
    request: { name: "Updated Tenant Name", max_skus: 200, status: "suspended" },
    response: { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Updated Tenant Name", max_skus: 200, status: "suspended" }
  },
  "DELETE /rest/v1/tenants?id=eq.{id}": { response: null },

  // ── Stores ──
  "GET /rest/v1/stores": {
    response: [
      {
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name: "Downtown Flagship Store",
        address: "123 Main Street",
        city: "New York",
        country: "US",
        created_at: "2025-03-01T09:00:00Z",
        updated_at: "2025-06-15T11:30:00Z"
      }
    ]
  },
  "POST /rest/v1/stores": {
    request: {
      tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Westside Branch",
      address: "456 Oak Avenue",
      city: "Los Angeles",
      country: "US"
    },
    response: {
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Westside Branch",
      address: "456 Oak Avenue",
      city: "Los Angeles",
      country: "US",
      created_at: "2026-02-18T10:00:00Z",
      updated_at: "2026-02-18T10:00:00Z"
    }
  },
  "PATCH /rest/v1/stores?id=eq.{id}": {
    request: { name: "Renamed Store", city: "Chicago" },
    response: { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Renamed Store", city: "Chicago" }
  },
  "DELETE /rest/v1/stores?id=eq.{id}": { response: null },

  // ── Products (SKUs) ──
  "GET /rest/v1/skus": {
    response: [
      {
        id: "d4e5f6a7-b8c9-0123-def0-123456789abc",
        tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        category_id: "e5f6a7b8-c9d0-1234-ef01-23456789abcd",
        name: "Cola Classic 330ml",
        description: "Classic cola soft drink, 330ml can",
        barcode: "5901234123457",
        is_active: true,
        training_status: "completed",
        created_at: "2025-02-20T14:00:00Z",
        updated_at: "2025-05-10T09:15:00Z"
      }
    ]
  },
  "POST /rest/v1/skus": {
    request: {
      tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      category_id: "e5f6a7b8-c9d0-1234-ef01-23456789abcd",
      name: "Sparkling Water 500ml",
      description: "Premium sparkling mineral water",
      barcode: "5901234567890",
      is_active: true,
      training_status: "pending"
    },
    response: {
      id: "f6a7b8c9-d0e1-2345-f012-3456789abcde",
      tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Sparkling Water 500ml",
      training_status: "pending",
      created_at: "2026-02-18T10:00:00Z"
    }
  },

  // ── SKU Images ──
  "GET /rest/v1/sku_images": {
    response: [
      { id: "img-001", sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", image_url: "https://storage.example.com/sku-images/cola-front.jpg", created_at: "2025-03-01T10:00:00Z" }
    ]
  },
  "POST /rest/v1/sku_images": {
    request: { sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", image_url: "https://storage.example.com/sku-images/cola-side.jpg" },
    response: { id: "img-002", sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", image_url: "https://storage.example.com/sku-images/cola-side.jpg", created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Categories ──
  "GET /rest/v1/product_categories": {
    response: [
      { id: "e5f6a7b8-c9d0-1234-ef01-23456789abcd", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Beverages", description: "All drink products", created_at: "2025-01-20T08:00:00Z", updated_at: "2025-01-20T08:00:00Z" }
    ]
  },
  "POST /rest/v1/product_categories": {
    request: { tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Snacks", description: "Chips, crackers, and nuts" },
    response: { id: "cat-new-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Snacks", description: "Chips, crackers, and nuts", created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Planograms ──
  "GET /rest/v1/planogram_templates": {
    response: [
      { id: "pt-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Beverage Aisle Layout Q1", description: "Standard beverage aisle planogram", status: "active", layout: [{ row: 1, position: 1, sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", facings: 3 }], created_at: "2025-04-01T12:00:00Z" }
    ]
  },
  "POST /rest/v1/planogram_templates": {
    request: {
      tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "New Snack Aisle Layout",
      status: "draft",
      layout: [{ row: 1, position: 1, sku_id: "f6a7b8c9-d0e1-2345-f012-3456789abcde", facings: 4 }]
    },
    response: { id: "pt-new-001", name: "New Snack Aisle Layout", status: "draft", created_at: "2026-02-18T10:00:00Z" }
  },

  "GET /rest/v1/planogram_versions": {
    response: [
      { id: "pv-001", template_id: "pt-001", version_number: 1, layout: [], change_notes: "Initial version", created_at: "2025-04-01T12:00:00Z" }
    ]
  },
  "POST /rest/v1/planogram_versions": {
    request: { template_id: "pt-001", layout: [{ row: 1, position: 1, sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", facings: 5 }], change_notes: "Increased cola facings to 5" },
    response: { id: "pv-002", template_id: "pt-001", version_number: 2, created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Shelves ──
  "GET /rest/v1/shelves": {
    response: [
      { id: "sh-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Aisle 3 - Top Shelf", description: "Eye-level shelf in beverage aisle", location_in_store: "Aisle 3, Section A", width_cm: 120, created_at: "2025-03-15T10:00:00Z" }
    ]
  },
  "POST /rest/v1/shelves": {
    request: { tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Aisle 5 - Bottom Shelf", location_in_store: "Aisle 5, Section B", width_cm: 90 },
    response: { id: "sh-new-001", name: "Aisle 5 - Bottom Shelf", width_cm: 90, created_at: "2026-02-18T10:00:00Z" }
  },

  "GET /rest/v1/shelf_products": {
    response: [
      { id: "sp-001", shelf_id: "sh-001", sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", expected_facings: 3, position_order: 1, created_at: "2025-03-15T10:30:00Z" }
    ]
  },
  "POST /rest/v1/shelf_products": {
    request: { shelf_id: "sh-001", sku_id: "f6a7b8c9-d0e1-2345-f012-3456789abcde", expected_facings: 2, position_order: 2 },
    response: { id: "sp-new-001", shelf_id: "sh-001", sku_id: "f6a7b8c9-d0e1-2345-f012-3456789abcde", expected_facings: 2, position_order: 2, created_at: "2026-02-18T10:00:00Z" }
  },

  "GET /rest/v1/shelf_images": {
    response: [
      { id: "si-001", shelf_id: "sh-001", image_url: "https://storage.example.com/shelf-images/aisle3-20250601.jpg", detection_result: { predictions: [] }, processed_at: "2025-06-01T14:30:00Z", created_at: "2025-06-01T14:30:00Z" }
    ]
  },
  "POST /rest/v1/shelf_images": {
    request: { shelf_id: "sh-001", image_url: "https://storage.example.com/shelf-images/new-capture.jpg" },
    response: { id: "si-new-001", shelf_id: "sh-001", image_url: "https://storage.example.com/shelf-images/new-capture.jpg", created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Detections ──
  "GET /rest/v1/detections": {
    response: [
      {
        id: "det-001",
        tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        original_image_url: "uploaded",
        detection_result: {
          detections: [{ skuId: "d4e5f6a7-b8c9-0123-def0-123456789abc", skuName: "Cola Classic 330ml", isAvailable: true, facings: 3, confidence: 0.95, boundingBox: { x: 10, y: 20, width: 15, height: 25 } }],
          missingSkus: [],
          shareOfShelf: { totalShelfArea: 100, trainedProductsArea: 35, percentage: 35.0 },
          totalFacings: 3,
          summary: "Detected 1 product with 3 facings"
        },
        share_of_shelf_percentage: 35.0,
        total_facings: 3,
        detected_skus: 1,
        missing_skus: 0,
        processed_at: "2025-06-15T16:00:00Z"
      }
    ]
  },

  // ── Compliance Scans ──
  "GET /rest/v1/compliance_scans": {
    response: [
      { id: "cs-001", template_id: "pt-001", shelf_image_id: "si-001", image_url: "https://storage.example.com/shelf-images/aisle3-scan.jpg", compliance_score: 87.5, total_expected: 8, total_found: 7, total_missing: 1, total_extra: 0, scanned_by: "user-uuid-001", created_at: "2025-06-20T10:00:00Z" }
    ]
  },

  // ── Profiles ──
  "GET /rest/v1/profiles": {
    response: [
      { id: "prof-001", user_id: "auth-user-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", full_name: "John Smith", username: "jsmith", avatar_url: null, last_login: "2026-02-18T08:00:00Z", created_at: "2025-01-15T08:30:00Z" }
    ]
  },
  "PATCH /rest/v1/profiles?user_id=eq.{user_id}": {
    request: { full_name: "John A. Smith", avatar_url: "https://storage.example.com/avatars/john.jpg" },
    response: { id: "prof-001", full_name: "John A. Smith", avatar_url: "https://storage.example.com/avatars/john.jpg" }
  },

  // ── User Roles ──
  "GET /rest/v1/user_roles": {
    response: [{ id: "ur-001", user_id: "auth-user-001", role: "admin" }]
  },
  "POST /rest/v1/user_roles": {
    request: { user_id: "auth-user-002", role: "tenant_user" },
    response: { id: "ur-002", user_id: "auth-user-002", role: "tenant_user" }
  },

  // ── User Access Control ──
  "GET /rest/v1/user_store_access": {
    response: [{ id: "usa-001", user_id: "auth-user-002", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", created_at: "2025-05-01T10:00:00Z" }]
  },
  "POST /rest/v1/user_store_access": {
    request: { user_id: "auth-user-003", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" },
    response: { id: "usa-002", user_id: "auth-user-003", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", created_at: "2026-02-18T10:00:00Z" }
  },
  "GET /rest/v1/user_shelf_access": {
    response: [{ id: "usha-001", user_id: "auth-user-002", shelf_id: "sh-001", created_at: "2025-05-01T10:00:00Z" }]
  },
  "POST /rest/v1/user_shelf_access": {
    request: { user_id: "auth-user-003", shelf_id: "sh-001" },
    response: { id: "usha-002", user_id: "auth-user-003", shelf_id: "sh-001", created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Notifications ──
  "GET /rest/v1/notifications": {
    response: [
      { id: "notif-001", user_id: "auth-user-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", title: "Detection Complete", message: "Shelf scan processed successfully with 95% compliance.", type: "detection", is_read: false, metadata: { detection_id: "det-001" }, created_at: "2025-06-15T16:05:00Z" }
    ]
  },
  "POST /rest/v1/notifications": {
    request: { user_id: "auth-user-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", title: "New SKU Added", message: "Sparkling Water 500ml has been added to your catalog.", type: "system" },
    response: { id: "notif-002", title: "New SKU Added", is_read: false, created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Usage Metrics ──
  "GET /rest/v1/usage_metrics": {
    response: [
      { id: "um-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", period_type: "monthly", period_start: "2026-02-01T00:00:00Z", images_processed: 342, training_jobs: 5, created_at: "2026-02-01T00:00:00Z" }
    ]
  },

  // ── Models ──
  "GET /rest/v1/models": {
    response: [
      { id: "mdl-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", version: "v1.2.0", status: "active", accuracy: 94.5, model_path: "/models/acme/v1.2.0", trained_date: "2025-05-20T12:00:00Z", created_at: "2025-05-20T12:00:00Z" }
    ]
  },

  // ── Processing Jobs ──
  "GET /rest/v1/processing_jobs": {
    response: [
      { id: "pj-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", model_id: "mdl-001", original_image_url: "https://storage.example.com/shelf-images/job-input.jpg", annotated_image_url: "https://storage.example.com/shelf-images/job-output.jpg", status: "completed", start_time: "2025-06-15T15:55:00Z", end_time: "2025-06-15T16:00:00Z", created_at: "2025-06-15T15:55:00Z" }
    ]
  },

  // ── Detection Results ──
  "GET /rest/v1/detection_results": {
    response: [
      { id: "dr-001", job_id: "pj-001", sku_id: "d4e5f6a7-b8c9-0123-def0-123456789abc", is_available: true, facings_count: 3, confidence: 0.95, share_of_shelf: 35.0, bounding_boxes: [{ x: 10, y: 20, width: 15, height: 25 }], created_at: "2025-06-15T16:00:00Z" }
    ]
  },

  // ── RPC ──
  "POST /rest/v1/rpc/check_tenant_quota": {
    request: { _tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
    response: { canProcess: true, monthlyUsage: 342, monthlyLimit: 5000, weeklyUsage: 87, weeklyLimit: 1500, yearlyUsage: 2100, yearlyLimit: 50000, status: "active" }
  },
  "POST /rest/v1/rpc/increment_usage_metric": {
    request: { _tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", _period_type: "monthly", _images_count: 1 },
    response: null
  },
  "POST /rest/v1/rpc/get_user_tenant_id": {
    request: { _user_id: "auth-user-001" },
    response: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "POST /rest/v1/rpc/has_role": {
    request: { _user_id: "auth-user-001", _role: "admin" },
    response: true
  },

  // ── Edge Functions ──
  "POST /functions/v1/detect-skus": {
    request: {
      imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      storeId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      skusToDetect: [
        { id: "d4e5f6a7-b8c9-0123-def0-123456789abc", name: "Cola Classic 330ml", imageUrls: ["https://storage.example.com/sku-images/cola-front.jpg"] },
        { id: "f6a7b8c9-d0e1-2345-f012-3456789abcde", name: "Sparkling Water 500ml", imageUrls: [] }
      ]
    },
    response: {
      success: true,
      detectionId: "det-new-001",
      result: {
        detections: [
          { skuId: "d4e5f6a7-b8c9-0123-def0-123456789abc", skuName: "Cola Classic 330ml", isAvailable: true, facings: 4, confidence: 0.92, boundingBox: { x: 12, y: 18, width: 20, height: 30 } }
        ],
        missingSkus: [
          { skuId: "f6a7b8c9-d0e1-2345-f012-3456789abcde", skuName: "Sparkling Water 500ml" }
        ],
        shareOfShelf: { totalShelfArea: 100, trainedProductsArea: 28, percentage: 28.0 },
        totalFacings: 4,
        summary: "Detected 1 of 2 products. Cola Classic found with 4 facings. Sparkling Water not found."
      }
    }
  },
  "POST /functions/v1/roboflow-detect": {
    request: {
      imageUrl: "https://storage.example.com/shelf-images/aisle3-capture.jpg",
      shelfId: "sh-001",
      tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    response: {
      success: true,
      result: {
        outputs: [{ predictions: { predictions: [{ class: "product", confidence: 0.89, x: 120, y: 80, width: 60, height: 100 }] } }]
      }
    }
  },

  // ── Auth ──
  "POST /auth/v1/signup": {
    request: { email: "newuser@example.com", password: "securePassword123!", data: { full_name: "Jane Doe" } },
    response: { user: { id: "auth-user-new", email: "newuser@example.com", created_at: "2026-02-18T10:00:00Z" }, session: { access_token: "eyJhbGciOiJIUzI1NiIs...", refresh_token: "v1.abc123...", expires_in: 3600 } }
  },
  "POST /auth/v1/token?grant_type=password": {
    request: { email: "user@example.com", password: "password123" },
    response: { access_token: "eyJhbGciOiJIUzI1NiIs...", token_type: "bearer", expires_in: 3600, refresh_token: "v1.abc123...", user: { id: "auth-user-001", email: "user@example.com" } }
  },
  "POST /auth/v1/logout": { response: null },

  // ── Storage ──
  "POST /storage/v1/object/shelf-images/{path}": {
    request: "Binary file upload (multipart/form-data)",
    response: { Key: "shelf-images/tenant-id/2026-02-18/capture.jpg" }
  },
  "GET /storage/v1/object/shelf-images/{path}": { response: "Binary image data" },
  "POST /storage/v1/object/sku-training-images/{path}": {
    request: "Binary file upload (multipart/form-data)",
    response: { Key: "sku-training-images/tenant-id/sku-id/image1.jpg" }
  },
  "GET /storage/v1/object/sku-training-images/{path}": { response: "Binary image data" },
};

// ─── OPEN API SPEC ───────────────────────────────────────────────────────────

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ShelfVision API",
    description: "Complete REST API for the ShelfVision retail shelf detection, planogram compliance, and inventory management platform.",
    version: "2.0.0",
    contact: { name: "ShelfVision Team" }
  },
  servers: [
    { url: "https://{project_id}.supabase.co", description: "Production", variables: { project_id: { default: "your-project-id" } } }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "User's access_token from sign-in" },
      apiKey: { type: "apiKey", in: "header", name: "apikey", description: "Project anon or service_role key" }
    },
    schemas: {
      Tenant: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, status: { type: "string", enum: ["active", "suspended"] }, is_active: { type: "boolean" }, logo_url: { type: "string", nullable: true }, username: { type: "string", nullable: true }, password: { type: "string", nullable: true }, max_skus: { type: "integer", default: 50 }, max_images_per_month: { type: "integer", default: 1000 }, max_images_per_week: { type: "integer", default: 300 }, max_images_per_year: { type: "integer", default: 10000 }, processed_images_this_month: { type: "integer" }, processed_images_this_week: { type: "integer" }, processed_images_this_year: { type: "integer" }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      Store: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, name: { type: "string" }, address: { type: "string", nullable: true }, city: { type: "string", nullable: true }, country: { type: "string", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      SKU: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, category_id: { type: "string", format: "uuid", nullable: true }, name: { type: "string" }, description: { type: "string", nullable: true }, barcode: { type: "string", nullable: true }, is_active: { type: "boolean" }, training_status: { type: "string", enum: ["pending", "training", "completed", "failed"] }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      SKUImage: { type: "object", properties: { id: { type: "string", format: "uuid" }, sku_id: { type: "string", format: "uuid" }, image_url: { type: "string" }, created_at: { type: "string", format: "date-time" } } },
      ProductCategory: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, name: { type: "string" }, description: { type: "string", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      PlanogramTemplate: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, shelf_id: { type: "string", format: "uuid", nullable: true }, name: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["draft", "active", "archived"] }, layout: { type: "array", items: { type: "object" } }, created_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      PlanogramVersion: { type: "object", properties: { id: { type: "string", format: "uuid" }, template_id: { type: "string", format: "uuid" }, version_number: { type: "integer" }, layout: { type: "array", items: { type: "object" } }, change_notes: { type: "string", nullable: true }, created_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      Shelf: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, name: { type: "string" }, description: { type: "string", nullable: true }, location_in_store: { type: "string", nullable: true }, width_cm: { type: "number", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      ShelfProduct: { type: "object", properties: { id: { type: "string", format: "uuid" }, shelf_id: { type: "string", format: "uuid" }, sku_id: { type: "string", format: "uuid" }, expected_facings: { type: "integer", nullable: true }, position_order: { type: "integer", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      ShelfImage: { type: "object", properties: { id: { type: "string", format: "uuid" }, shelf_id: { type: "string", format: "uuid" }, image_url: { type: "string" }, detection_result: { type: "object", nullable: true }, processed_at: { type: "string", format: "date-time", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      Detection: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, original_image_url: { type: "string" }, annotated_image_url: { type: "string", nullable: true }, detection_result: { type: "object", nullable: true }, share_of_shelf_percentage: { type: "number", nullable: true }, total_facings: { type: "integer", nullable: true }, detected_skus: { type: "integer", nullable: true }, missing_skus: { type: "integer", nullable: true }, processed_at: { type: "string", format: "date-time" } } },
      ComplianceScan: { type: "object", properties: { id: { type: "string", format: "uuid" }, template_id: { type: "string", format: "uuid" }, shelf_image_id: { type: "string", format: "uuid", nullable: true }, image_url: { type: "string" }, compliance_score: { type: "number" }, total_expected: { type: "integer" }, total_found: { type: "integer" }, total_missing: { type: "integer" }, total_extra: { type: "integer" }, details: { type: "object", nullable: true }, scanned_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      Profile: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid", nullable: true }, full_name: { type: "string", nullable: true }, username: { type: "string", nullable: true }, avatar_url: { type: "string", nullable: true }, last_login: { type: "string", format: "date-time", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      UserRole: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, role: { type: "string", enum: ["admin", "tenant_admin", "tenant_user"] } } },
      UserStoreAccess: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid" }, created_at: { type: "string", format: "date-time" } } },
      UserShelfAccess: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, shelf_id: { type: "string", format: "uuid" }, created_at: { type: "string", format: "date-time" } } },
      Notification: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid", nullable: true }, title: { type: "string" }, message: { type: "string" }, type: { type: "string" }, is_read: { type: "boolean" }, metadata: { type: "object", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      UsageMetric: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, period_type: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] }, period_start: { type: "string", format: "date-time" }, images_processed: { type: "integer" }, training_jobs: { type: "integer" }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      Model: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, version: { type: "string" }, status: { type: "string" }, accuracy: { type: "number", nullable: true }, model_path: { type: "string", nullable: true }, trained_date: { type: "string", format: "date-time", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      ProcessingJob: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, model_id: { type: "string", format: "uuid", nullable: true }, original_image_url: { type: "string" }, annotated_image_url: { type: "string", nullable: true }, status: { type: "string", enum: ["pending", "processing", "completed", "failed"] }, start_time: { type: "string", format: "date-time", nullable: true }, end_time: { type: "string", format: "date-time", nullable: true }, error_message: { type: "string", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      DetectionResult: { type: "object", properties: { id: { type: "string", format: "uuid" }, job_id: { type: "string", format: "uuid" }, sku_id: { type: "string", format: "uuid", nullable: true }, is_available: { type: "boolean" }, facings_count: { type: "integer" }, confidence: { type: "number", nullable: true }, share_of_shelf: { type: "number", nullable: true }, bounding_boxes: { type: "array", nullable: true, items: { type: "object" } }, created_at: { type: "string", format: "date-time" } } },
      DetectSKUsRequest: { type: "object", required: ["imageBase64", "tenantId"], properties: { imageBase64: { type: "string", description: "Base64-encoded image or data URI" }, tenantId: { type: "string", format: "uuid" }, storeId: { type: "string", format: "uuid" }, skusToDetect: { type: "array", items: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, imageUrls: { type: "array", items: { type: "string" } } } } } } },
      DetectSKUsResponse: { type: "object", properties: { success: { type: "boolean" }, detectionId: { type: "string", format: "uuid" }, result: { type: "object", properties: { detections: { type: "array", items: { type: "object", properties: { skuId: { type: "string" }, skuName: { type: "string" }, isAvailable: { type: "boolean" }, facings: { type: "integer" }, confidence: { type: "number" }, boundingBox: { type: "object", properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } } } } } }, missingSkus: { type: "array", items: { type: "object", properties: { skuId: { type: "string" }, skuName: { type: "string" } } } }, shareOfShelf: { type: "object", properties: { totalShelfArea: { type: "number" }, trainedProductsArea: { type: "number" }, percentage: { type: "number" } } }, totalFacings: { type: "integer" }, summary: { type: "string" } } } } },
      RoboflowDetectRequest: { type: "object", required: ["imageUrl"], properties: { imageUrl: { type: "string", format: "uri" }, shelfId: { type: "string", format: "uuid" }, tenantId: { type: "string", format: "uuid" } } },
      RoboflowDetectResponse: { type: "object", properties: { success: { type: "boolean" }, result: { type: "object" } } }
    }
  },
  security: [{ bearerAuth: [] }, { apiKey: [] }],
  paths: {
    "/rest/v1/tenants": {
      get: { summary: "List tenants", tags: ["Tenants"], parameters: [{ name: "select", in: "query", schema: { type: "string" }, description: "Columns to return (e.g. *)" }, { name: "status", in: "query", schema: { type: "string" }, description: "Filter: eq.active or eq.suspended" }, { name: "is_active", in: "query", schema: { type: "string" }, description: "Filter: eq.true" }], responses: { "200": { description: "Array of Tenant objects" } } },
      post: { summary: "Create tenant", tags: ["Tenants"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Tenant" } } } }, responses: { "201": { description: "Created Tenant object" }, "409": { description: "Conflict – duplicate name" } } }
    },
    "/rest/v1/tenants?id=eq.{id}": {
      patch: { summary: "Update tenant", tags: ["Tenants"], parameters: [{ name: "id", in: "query", required: true, schema: { type: "string", format: "uuid" }, description: "Tenant UUID (eq.{id})" }], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Tenant" } } } }, responses: { "200": { description: "Updated Tenant" }, "404": { description: "Not found" } } },
      delete: { summary: "Delete tenant", tags: ["Tenants"], parameters: [{ name: "id", in: "query", required: true, schema: { type: "string", format: "uuid" } }], responses: { "204": { description: "Deleted (no content)" } } }
    },
    "/rest/v1/stores": {
      get: { summary: "List stores", tags: ["Stores"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }, { name: "select", in: "query", schema: { type: "string" }, description: "Columns (e.g. *,tenants(name))" }], responses: { "200": { description: "Array of Store objects" } } },
      post: { summary: "Create store", tags: ["Stores"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Store" } } } }, responses: { "201": { description: "Created Store" } } }
    },
    "/rest/v1/stores?id=eq.{id}": {
      patch: { summary: "Update store", tags: ["Stores"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Store" } } } }, responses: { "200": { description: "Updated Store" } } },
      delete: { summary: "Delete store", tags: ["Stores"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/skus": {
      get: { summary: "List SKUs (Products)", tags: ["Products"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }, { name: "category_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }, { name: "is_active", in: "query", schema: { type: "string" }, description: "Filter: eq.true" }, { name: "training_status", in: "query", schema: { type: "string" }, description: "Filter: eq.completed" }, { name: "select", in: "query", schema: { type: "string" }, description: "e.g. *,sku_images(*),product_categories(name)" }], responses: { "200": { description: "Array of SKU objects with optional joins" } } },
      post: { summary: "Create SKU", tags: ["Products"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/SKU" } } } }, responses: { "201": { description: "Created SKU" } } }
    },
    "/rest/v1/skus?id=eq.{id}": {
      patch: { summary: "Update SKU", tags: ["Products"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/SKU" } } } }, responses: { "200": { description: "Updated SKU" } } },
      delete: { summary: "Delete SKU", tags: ["Products"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/sku_images": {
      get: { summary: "List SKU images", tags: ["Products"], parameters: [{ name: "sku_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }], responses: { "200": { description: "Array of SKUImage objects" } } },
      post: { summary: "Add SKU image", tags: ["Products"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/SKUImage" } } } }, responses: { "201": { description: "Created SKUImage" } } }
    },
    "/rest/v1/sku_images?id=eq.{id}": {
      delete: { summary: "Delete SKU image", tags: ["Products"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/product_categories": {
      get: { summary: "List categories", tags: ["Categories"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }], responses: { "200": { description: "Array of ProductCategory objects" } } },
      post: { summary: "Create category", tags: ["Categories"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ProductCategory" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/product_categories?id=eq.{id}": {
      patch: { summary: "Update category", tags: ["Categories"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/ProductCategory" } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete category", tags: ["Categories"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/planogram_templates": {
      get: { summary: "List planogram templates", tags: ["Planograms"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, description: "Filter: eq.active" }, { name: "select", in: "query", schema: { type: "string" }, description: "e.g. *,stores(name),shelves(name)" }], responses: { "200": { description: "Array of PlanogramTemplate objects" } } },
      post: { summary: "Create planogram", tags: ["Planograms"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramTemplate" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/planogram_templates?id=eq.{id}": {
      patch: { summary: "Update planogram", tags: ["Planograms"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramTemplate" } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete planogram", tags: ["Planograms"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/planogram_versions": {
      get: { summary: "List planogram versions", tags: ["Planograms"], parameters: [{ name: "template_id", in: "query", schema: { type: "string" }, description: "Filter: eq.{uuid}" }, { name: "order", in: "query", schema: { type: "string" }, description: "e.g. version_number.desc" }], responses: { "200": { description: "Array of PlanogramVersion objects" } } },
      post: { summary: "Create version snapshot", tags: ["Planograms"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramVersion" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelves": {
      get: { summary: "List shelves", tags: ["Shelves"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "store_id", in: "query", schema: { type: "string" } }, { name: "select", in: "query", schema: { type: "string" }, description: "e.g. *,stores(name)" }], responses: { "200": { description: "Array of Shelf objects" } } },
      post: { summary: "Create shelf", tags: ["Shelves"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Shelf" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelves?id=eq.{id}": {
      patch: { summary: "Update shelf", tags: ["Shelves"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Shelf" } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete shelf", tags: ["Shelves"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/shelf_products": {
      get: { summary: "List shelf-product assignments", tags: ["Shelves"], parameters: [{ name: "shelf_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of ShelfProduct objects" } } },
      post: { summary: "Assign product to shelf", tags: ["Shelves"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ShelfProduct" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelf_products?id=eq.{id}": {
      delete: { summary: "Remove product from shelf", tags: ["Shelves"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/shelf_images": {
      get: { summary: "List shelf images", tags: ["Shelves"], parameters: [{ name: "shelf_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of ShelfImage objects" } } },
      post: { summary: "Upload shelf image record", tags: ["Shelves"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ShelfImage" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/detections": {
      get: { summary: "List detections", tags: ["Detection"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "store_id", in: "query", schema: { type: "string" } }, { name: "order", in: "query", schema: { type: "string" }, description: "e.g. processed_at.desc" }], responses: { "200": { description: "Array of Detection objects" } } }
    },
    "/rest/v1/compliance_scans": {
      get: { summary: "List compliance scans", tags: ["Compliance"], parameters: [{ name: "template_id", in: "query", schema: { type: "string" } }, { name: "order", in: "query", schema: { type: "string" }, description: "e.g. created_at.desc" }], responses: { "200": { description: "Array of ComplianceScan objects" } } },
      post: { summary: "Create compliance scan", tags: ["Compliance"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ComplianceScan" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/profiles": {
      get: { summary: "List user profiles", tags: ["Users & Access"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Profile objects" } } }
    },
    "/rest/v1/profiles?user_id=eq.{user_id}": {
      patch: { summary: "Update profile", tags: ["Users & Access"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Profile" } } } }, responses: { "200": { description: "Updated" } } }
    },
    "/rest/v1/user_roles": {
      get: { summary: "List user roles", tags: ["Users & Access"], parameters: [{ name: "user_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of UserRole objects" } } },
      post: { summary: "Assign role", tags: ["Users & Access"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/UserRole" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/user_store_access": {
      get: { summary: "List user-store access grants", tags: ["Users & Access"], parameters: [{ name: "user_id", in: "query", schema: { type: "string" } }, { name: "store_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of UserStoreAccess objects" } } },
      post: { summary: "Grant store access", tags: ["Users & Access"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/UserStoreAccess" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/user_store_access?id=eq.{id}": {
      delete: { summary: "Revoke store access", tags: ["Users & Access"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/user_shelf_access": {
      get: { summary: "List user-shelf access grants", tags: ["Users & Access"], parameters: [{ name: "user_id", in: "query", schema: { type: "string" } }, { name: "shelf_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of UserShelfAccess objects" } } },
      post: { summary: "Grant shelf access", tags: ["Users & Access"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/UserShelfAccess" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/user_shelf_access?id=eq.{id}": {
      delete: { summary: "Revoke shelf access", tags: ["Users & Access"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/notifications": {
      get: { summary: "List notifications", tags: ["Notifications"], parameters: [{ name: "user_id", in: "query", schema: { type: "string" } }, { name: "is_read", in: "query", schema: { type: "string" }, description: "Filter: eq.false" }], responses: { "200": { description: "Array of Notification objects" } } },
      post: { summary: "Create notification", tags: ["Notifications"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Notification" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/notifications?id=eq.{id}": {
      patch: { summary: "Mark notification read/unread", tags: ["Notifications"], requestBody: { content: { "application/json": { schema: { type: "object", properties: { is_read: { type: "boolean" } } } } } }, responses: { "200": { description: "Updated" } } }
    },
    "/rest/v1/usage_metrics": {
      get: { summary: "List usage metrics", tags: ["Usage & Analytics"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "period_type", in: "query", schema: { type: "string" }, description: "Filter: eq.monthly" }], responses: { "200": { description: "Array of UsageMetric objects" } } }
    },
    "/rest/v1/models": {
      get: { summary: "List models", tags: ["Usage & Analytics"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Model objects" } } }
    },
    "/rest/v1/processing_jobs": {
      get: { summary: "List processing jobs", tags: ["Usage & Analytics"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of ProcessingJob objects" } } }
    },
    "/rest/v1/detection_results": {
      get: { summary: "List detection results", tags: ["Detection"], parameters: [{ name: "job_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of DetectionResult objects" } } }
    },
    "/rest/v1/rpc/check_tenant_quota": {
      post: { summary: "Check tenant quota", tags: ["RPC Functions"], description: "Returns quota status including monthly/weekly/yearly usage vs limits and whether more images can be processed.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_tenant_id"], properties: { _tenant_id: { type: "string", format: "uuid", description: "Target tenant UUID" } } } } } }, responses: { "200": { description: "Quota status JSON with canProcess, monthlyUsage, monthlyLimit, etc." } } }
    },
    "/rest/v1/rpc/increment_usage_metric": {
      post: { summary: "Increment usage metric", tags: ["RPC Functions"], description: "Atomically increments the images_processed counter for the specified tenant and period type.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_tenant_id", "_period_type"], properties: { _tenant_id: { type: "string", format: "uuid" }, _period_type: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] }, _images_count: { type: "integer", default: 1 } } } } } }, responses: { "200": { description: "Success (no return value)" } } }
    },
    "/rest/v1/rpc/get_user_tenant_id": {
      post: { summary: "Get user's tenant ID", tags: ["RPC Functions"], description: "Looks up the tenant_id from the profiles table for a given user_id.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_user_id"], properties: { _user_id: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "Tenant UUID string" } } }
    },
    "/rest/v1/rpc/has_role": {
      post: { summary: "Check if user has role", tags: ["RPC Functions"], description: "Returns true/false whether the user has the specified role in user_roles.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_user_id", "_role"], properties: { _user_id: { type: "string", format: "uuid" }, _role: { type: "string", enum: ["admin", "tenant_admin", "tenant_user"] } } } } } }, responses: { "200": { description: "Boolean true/false" } } }
    },
    "/functions/v1/detect-skus": {
      post: { summary: "AI SKU Detection", tags: ["Edge Functions"], description: "Sends a shelf image (base64) to the AI model for product detection. Checks tenant quota, runs detection, stores results in the detections table, and increments usage metrics for all period types.", requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/DetectSKUsRequest" } } } }, responses: { "200": { description: "Detection result", content: { "application/json": { schema: { "$ref": "#/components/schemas/DetectSKUsResponse" } } } }, "400": { description: "Missing required fields" }, "402": { description: "AI credits exhausted" }, "429": { description: "Quota exceeded or rate limited" }, "500": { description: "Server error" } } }
    },
    "/functions/v1/roboflow-detect": {
      post: { summary: "Roboflow Detection", tags: ["Edge Functions"], description: "Sends an image URL to the Roboflow workflow API. Optionally saves detection results to shelf_images and increments usage metrics.", requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/RoboflowDetectRequest" } } } }, responses: { "200": { description: "Detection result from Roboflow", content: { "application/json": { schema: { "$ref": "#/components/schemas/RoboflowDetectResponse" } } } }, "500": { description: "Error" } } }
    },
    "/auth/v1/signup": {
      post: { summary: "Sign up new user", tags: ["Authentication"], description: "Creates a new user account. A profile row is automatically created via database trigger.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 }, data: { type: "object", properties: { full_name: { type: "string" } } } } } } } }, responses: { "200": { description: "User object + session with access_token" }, "422": { description: "Validation error" } } }
    },
    "/auth/v1/token?grant_type=password": {
      post: { summary: "Sign in with password", tags: ["Authentication"], description: "Authenticates a user with email/password and returns a JWT session.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string" } } } } } }, responses: { "200": { description: "Session with access_token, refresh_token, expires_in, and user object" }, "400": { description: "Invalid credentials" } } }
    },
    "/auth/v1/logout": {
      post: { summary: "Sign out", tags: ["Authentication"], description: "Invalidates the current session.", responses: { "204": { description: "Signed out (no content)" } } }
    },
    "/storage/v1/object/shelf-images/{path}": {
      post: { summary: "Upload shelf image file", tags: ["Storage"], description: "Upload a binary image file. Path format: {tenant_id}/{date}/{filename}.", responses: { "200": { description: "Upload result with Key" } } },
      get: { summary: "Download shelf image file", tags: ["Storage"], description: "Returns the binary image data.", responses: { "200": { description: "Image binary (Content-Type: image/*)" } } }
    },
    "/storage/v1/object/sku-training-images/{path}": {
      post: { summary: "Upload SKU training image", tags: ["Storage"], description: "Upload a training image. Path format: {tenant_id}/{sku_id}/{filename}.", responses: { "200": { description: "Upload result with Key" } } },
      get: { summary: "Download SKU training image", tags: ["Storage"], description: "Returns the binary image data.", responses: { "200": { description: "Image binary" } } }
    }
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

const tagIcons: Record<string, string> = {
  "Tenants": "🏢",
  "Stores": "🏪",
  "Products": "📦",
  "Categories": "🏷️",
  "Planograms": "📐",
  "Shelves": "🗄️",
  "Detection": "🔍",
  "Compliance": "✅",
  "Users & Access": "👤",
  "Notifications": "🔔",
  "Usage & Analytics": "📊",
  "RPC Functions": "⚡",
  "Edge Functions": "🤖",
  "Authentication": "🔐",
  "Storage": "📁",
};

function groupByTags(paths: any) {
  const groups: Record<string, { method: string; path: string; op: any }[]> = {};
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods as Record<string, any>)) {
      const tag = (op as any).tags?.[0] || 'Other';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push({ method: method.toUpperCase(), path, op });
    }
  }
  return groups;
}

function generateMarkdown(): string {
  const spec = openApiSpec;
  let md = `# ${spec.info.title} — v${spec.info.version}\n\n`;
  md += `${spec.info.description}\n\n---\n\n`;
  md += `## Authentication\n\nAll requests require:\n- \`apikey\` header: Project anon or service_role key\n- \`Authorization: Bearer <jwt>\` header: User's access_token\n\n---\n\n`;

  const groups = groupByTags(spec.paths);
  for (const [tag, endpoints] of Object.entries(groups)) {
    md += `## ${tagIcons[tag] || '📌'} ${tag}\n\n`;
    for (const { method, path, op } of endpoints) {
      md += `### \`${method} ${path}\`\n\n`;
      md += `${op.summary || ''}${op.description ? '\n\n' + op.description : ''}\n\n`;
      if (op.parameters?.length) {
        md += `**Parameters:**\n\n| Name | In | Type | Required | Description |\n|------|-----|------|----------|-------------|\n`;
        for (const p of op.parameters) {
          md += `| \`${p.name}\` | ${p.in} | ${p.schema?.type || 'string'} | ${p.required ? 'Yes' : 'No'} | ${p.description || ''} |\n`;
        }
        md += `\n`;
      }
      if (op.requestBody) {
        const schema = op.requestBody.content?.['application/json']?.schema;
        if (schema) {
          const ref = schema['$ref'];
          md += ref ? `**Request Body:** \`${ref.split('/').pop()}\`\n\n` : `**Request Body:** Inline schema\n\n`;
        }
      }
      const exKey = `${method} ${path}`;
      if (examples[exKey]) {
        if (examples[exKey].request) md += `**Example Request:**\n\`\`\`json\n${JSON.stringify(examples[exKey].request, null, 2)}\n\`\`\`\n\n`;
        if (examples[exKey].response !== undefined) md += `**Example Response:**\n\`\`\`json\n${JSON.stringify(examples[exKey].response, null, 2)}\n\`\`\`\n\n`;
      }
      md += `**Responses:**\n`;
      for (const [code, res] of Object.entries(op.responses as any)) md += `- \`${code}\`: ${(res as any).description}\n`;
      md += `\n---\n\n`;
    }
  }

  md += `## Schemas\n\n`;
  for (const [name, schema] of Object.entries(spec.components.schemas as any)) {
    if ((schema as any).properties) {
      md += `### ${name}\n\n| Field | Type | Nullable | Notes |\n|-------|------|----------|-------|\n`;
      for (const [field, def] of Object.entries((schema as any).properties || {})) {
        const d = def as any;
        const type = d.format ? `${d.type}(${d.format})` : (d.type || 'object');
        md += `| \`${field}\` | ${type} | ${d.nullable ? 'Yes' : 'No'} | ${d.description || d.enum ? `enum: ${d.enum?.join(',')}` : d.default !== undefined ? `default: ${d.default}` : ''} |\n`;
      }
      md += `\n`;
    }
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

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function EndpointCard({ method, path, op }: { method: string; path: string; op: any }) {
  const [open, setOpen] = useState(false);
  const exKey = `${method} ${path}`;
  const example = examples[exKey];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
          open ? "bg-muted/30 border-border" : "border-transparent"
        )}>
          <Badge variant="outline" className={cn("font-mono text-xs px-2 py-0.5 border", methodColors[method])}>
            {method}
          </Badge>
          <code className="text-sm font-mono text-foreground/80 flex-1 text-left truncate">{path}</code>
          <span className="text-xs text-muted-foreground hidden sm:block">{op.summary}</span>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mr-2 mb-4 mt-1 p-4 rounded-lg bg-card border border-border space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">{op.summary}</h4>
            {op.description && <p className="text-xs text-muted-foreground mt-1">{op.description}</p>}
          </div>

          {/* Parameters */}
          {op.parameters?.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parameters</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">In</th>
                      <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Required</th>
                      <th className="text-left py-1.5 text-muted-foreground font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {op.parameters.map((p: any, i: number) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-3 font-mono text-foreground">{p.name}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{p.in}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{p.schema?.type || 'string'}</td>
                        <td className="py-1.5 pr-3">{p.required ? <Badge variant="destructive" className="text-[10px] px-1 py-0">required</Badge> : <span className="text-muted-foreground">optional</span>}</td>
                        <td className="py-1.5 text-muted-foreground">{p.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body Schema */}
          {op.requestBody && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Request Body</h5>
              {(() => {
                const schema = op.requestBody.content?.['application/json']?.schema;
                if (!schema) return null;
                const ref = schema['$ref'];
                if (ref) {
                  const schemaName = ref.split('/').pop();
                  return <p className="text-xs text-muted-foreground">Schema: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{schemaName}</code> {op.requestBody.required && <Badge variant="destructive" className="text-[10px] px-1 py-0 ml-1">required</Badge>}</p>;
                }
                if (schema.properties) {
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-border"><th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Field</th><th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Type</th><th className="text-left py-1.5 text-muted-foreground font-medium">Required</th></tr></thead>
                        <tbody>
                          {Object.entries(schema.properties).map(([k, v]: [string, any]) => (
                            <tr key={k} className="border-b border-border/50">
                              <td className="py-1.5 pr-3 font-mono text-foreground">{k}</td>
                              <td className="py-1.5 pr-3 text-muted-foreground">{v.format ? `${v.type}(${v.format})` : v.type || 'object'}{v.enum ? ` [${v.enum.join('|')}]` : ''}</td>
                              <td className="py-1.5">{schema.required?.includes(k) ? <Badge variant="destructive" className="text-[10px] px-1 py-0">required</Badge> : <span className="text-muted-foreground">optional</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Example Request */}
          {example?.request && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Example Request Body</h5>
              <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto text-foreground/90 border border-border/50 max-h-60 overflow-y-auto">
                {typeof example.request === 'string' ? example.request : JSON.stringify(example.request, null, 2)}
              </pre>
            </div>
          )}

          {/* Responses */}
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Responses</h5>
            <div className="space-y-1">
              {Object.entries(op.responses as Record<string, any>).map(([code, res]) => (
                <div key={code} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className={cn("font-mono text-[10px] px-1.5 py-0 border",
                    code.startsWith('2') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                    code.startsWith('4') ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                    "bg-red-500/10 text-red-400 border-red-500/30"
                  )}>{code}</Badge>
                  <span className="text-muted-foreground">{res.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Response */}
          {example?.response !== undefined && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Example Response</h5>
              <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto text-foreground/90 border border-border/50 max-h-60 overflow-y-auto">
                {example.response === null ? '(No Content — 204)' : typeof example.response === 'string' ? example.response : JSON.stringify(example.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TagGroup({ tag, endpoints }: { tag: string; endpoints: { method: string; path: string; op: any }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-all cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tagIcons[tag] || '📌'}</span>
            <span className="font-semibold text-foreground">{tag}</span>
            <Badge variant="secondary" className="text-xs">{endpoints.length}</Badge>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-0.5 ml-2">
          {endpoints.map((ep, i) => (
            <EndpointCard key={`${ep.method}-${ep.path}-${i}`} {...ep} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function ApiDocs() {
  const [copied, setCopied] = useState(false);
  const groups = groupByTags(openApiSpec.paths);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(openApiSpec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    downloadFile(JSON.stringify(openApiSpec, null, 2), 'shelfvision-openapi-v2.json', 'application/json');
  };

  const handleDownloadMarkdown = () => {
    downloadFile(generateMarkdown(), 'shelfvision-api-docs-v2.md', 'text/markdown');
  };

  const totalEndpoints = Object.values(groups).reduce((sum, eps) => sum + eps.length, 0);
  const totalSchemas = Object.keys(openApiSpec.components.schemas).length;

  return (
    <MainLayout title="API Documentation" subtitle="Interactive OpenAPI 3.0 specification — ShelfVision v2.0">
      <div className="max-w-5xl space-y-6">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="outline" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> v{openApiSpec.info.version}</Badge>
          <Badge variant="secondary" className="text-xs">{totalEndpoints} endpoints</Badge>
          <Badge variant="secondary" className="text-xs">{totalSchemas} schemas</Badge>
          <Badge variant="secondary" className="text-xs">{Object.keys(groups).length} groups</Badge>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadJson} className="gap-2">
            <Download className="w-4 h-4" /> Download OpenAPI JSON
          </Button>
          <Button onClick={handleDownloadMarkdown} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Download Markdown
          </Button>
          <Button onClick={handleCopyJson} variant="outline" className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
        </div>

        <Tabs defaultValue="swagger" className="w-full">
          <TabsList>
            <TabsTrigger value="swagger" className="gap-2">
              <BookOpen className="w-4 h-4" /> Swagger UI
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-2">
              <Code className="w-4 h-4" /> Raw JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swagger" className="mt-4">
            <ScrollArea className="h-[75vh]">
              <div className="space-y-2 pr-4">
                {/* Auth info */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">🔐 Authentication</h3>
                  <p className="text-xs text-muted-foreground mt-1">All requests require two headers:</p>
                  <div className="mt-2 space-y-1">
                    <code className="block text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">apikey: {"<your-project-anon-key>"}</code>
                    <code className="block text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">Authorization: Bearer {"<user-access-token>"}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Edge functions also accept the <code className="bg-muted px-1 rounded">apikey</code> header for authentication.</p>
                </div>

                {Object.entries(groups).map(([tag, endpoints]) => (
                  <TagGroup key={tag} tag={tag} endpoints={endpoints} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <div className="rounded-xl bg-card border border-border p-6 overflow-auto max-h-[75vh]">
              <pre className="text-xs text-foreground font-mono leading-relaxed">
                {JSON.stringify(openApiSpec, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
