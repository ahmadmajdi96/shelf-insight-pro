import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Copy, Check, FileText, Code, ChevronDown, ChevronRight, BookOpen, Shield, Zap, Brain, Server } from 'lucide-react';
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

  // ── Admins ──
  "GET /rest/v1/admins": {
    response: [
      { id: "adm-001", email: "admin@example.com", phone: "+1 555 000 1234", full_name: "Jane Admin", monthly_limit: 50000, is_active: true, created_at: "2025-01-10T08:00:00Z", updated_at: "2025-06-01T09:00:00Z" }
    ]
  },
  "POST /rest/v1/admins": {
    request: { email: "new@admin.com", phone: "+1 555 111 2222", password: "securePass!", full_name: "John Admin", monthly_limit: 30000, is_active: true },
    response: { id: "adm-002", email: "new@admin.com", full_name: "John Admin", monthly_limit: 30000, is_active: true, created_at: "2026-02-25T10:00:00Z" }
  },
  "PATCH /rest/v1/admins?id=eq.{id}": {
    request: { full_name: "Updated Admin", monthly_limit: 60000 },
    response: { id: "adm-001", full_name: "Updated Admin", monthly_limit: 60000 }
  },
  "DELETE /rest/v1/admins?id=eq.{id}": { response: null },

  // ── Stores ──
  "GET /rest/v1/stores": {
    response: [
      { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Downtown Flagship Store", address: "123 Main Street", city: "New York", country: "US", created_at: "2025-03-01T09:00:00Z", updated_at: "2025-06-15T11:30:00Z" }
    ]
  },
  "POST /rest/v1/stores": {
    request: { tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Westside Branch", address: "456 Oak Avenue", city: "Los Angeles", country: "US" },
    response: { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Westside Branch", address: "456 Oak Avenue", city: "Los Angeles", country: "US", created_at: "2026-02-18T10:00:00Z", updated_at: "2026-02-18T10:00:00Z" }
  },
  "PATCH /rest/v1/stores?id=eq.{id}": {
    request: { name: "Renamed Store", city: "Chicago" },
    response: { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Renamed Store", city: "Chicago" }
  },
  "DELETE /rest/v1/stores?id=eq.{id}": { response: null },

  // ── Products (SKUs) ──
  "GET /rest/v1/skus": {
    response: [
      { id: "d4e5f6a7-b8c9-0123-def0-123456789abc", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", category_id: "e5f6a7b8-c9d0-1234-ef01-23456789abcd", name: "Cola Classic 330ml", description: "Classic cola soft drink, 330ml can", barcode: "5901234123457", is_active: true, training_status: "completed", created_at: "2025-02-20T14:00:00Z", updated_at: "2025-05-10T09:15:00Z" }
    ]
  },
  "POST /rest/v1/skus": {
    request: { tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", category_id: "e5f6a7b8-c9d0-1234-ef01-23456789abcd", name: "Sparkling Water 500ml", description: "Premium sparkling mineral water", barcode: "5901234567890", is_active: true, training_status: "pending" },
    response: { id: "f6a7b8c9-d0e1-2345-f012-3456789abcde", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Sparkling Water 500ml", training_status: "pending", created_at: "2026-02-18T10:00:00Z" }
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
    request: { tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "New Snack Aisle Layout", status: "draft", layout: [{ row: 1, position: 1, sku_id: "f6a7b8c9-d0e1-2345-f012-3456789abcde", facings: 4 }] },
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
        id: "det-001", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", store_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        original_image_url: "uploaded",
        detection_result: {
          detections: [{ skuId: "d4e5f6a7-b8c9-0123-def0-123456789abc", skuName: "Cola Classic 330ml", isAvailable: true, facings: 3, confidence: 0.95, boundingBox: { x: 10, y: 20, width: 15, height: 25 } }],
          missingSkus: [],
          shareOfShelf: { totalShelfArea: 100, trainedProductsArea: 35, percentage: 35.0 },
          totalFacings: 3, summary: "Detected 1 product with 3 facings"
        },
        share_of_shelf_percentage: 35.0, total_facings: 3, detected_skus: 1, missing_skus: 0, processed_at: "2025-06-15T16:00:00Z"
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

  // ── Datasets ──
  "GET /rest/v1/datasets": {
    response: [
      { id: "ds-001", name: "Q1 Beverage Training", description: "Training images for beverage category", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", status: "ready", image_count: 450, class_count: 12, created_by: "auth-user-001", created_at: "2025-04-01T10:00:00Z", updated_at: "2025-06-01T14:00:00Z" }
    ]
  },
  "POST /rest/v1/datasets": {
    request: { name: "Q2 Snacks Dataset", description: "Training data for snack products", tenant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", status: "draft" },
    response: { id: "ds-new-001", name: "Q2 Snacks Dataset", status: "draft", image_count: 0, class_count: 0, created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Dataset Image Sets ──
  "GET /rest/v1/dataset_image_sets": {
    response: [
      { id: "dis-001", dataset_id: "ds-001", name: "Batch 1 - Store A", image_count: 150, is_trained: true, created_at: "2025-04-05T10:00:00Z" }
    ]
  },
  "POST /rest/v1/dataset_image_sets": {
    request: { dataset_id: "ds-001", name: "Batch 3 - Store C" },
    response: { id: "dis-new-001", dataset_id: "ds-001", name: "Batch 3 - Store C", image_count: 0, is_trained: false, created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Dataset Images ──
  "GET /rest/v1/dataset_images": {
    response: [
      { id: "di-001", dataset_id: "ds-001", image_set_id: "dis-001", image_url: "https://storage.example.com/dataset-images/img001.jpg", file_name: "img001.jpg", is_annotated: true, annotations: [{ class: "cola_330ml", x: 0.15, y: 0.20, width: 0.10, height: 0.25 }], created_at: "2025-04-05T10:05:00Z" }
    ]
  },
  "POST /rest/v1/dataset_images": {
    request: { dataset_id: "ds-001", image_set_id: "dis-001", image_url: "https://storage.example.com/dataset-images/newimg.jpg", file_name: "newimg.jpg" },
    response: { id: "di-new-001", dataset_id: "ds-001", is_annotated: false, annotations: [], created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Dataset Classes ──
  "GET /rest/v1/dataset_classes": {
    response: [
      { id: "dc-001", dataset_id: "ds-001", name: "Cola Classic 330ml", color: "#EF4444", created_at: "2025-04-01T10:05:00Z" }
    ]
  },
  "POST /rest/v1/dataset_classes": {
    request: { dataset_id: "ds-001", name: "Sparkling Water 500ml", color: "#3B82F6" },
    response: { id: "dc-new-001", dataset_id: "ds-001", name: "Sparkling Water 500ml", color: "#3B82F6", created_at: "2026-02-18T10:00:00Z" }
  },

  // ── Training Jobs ──
  "GET /rest/v1/training_jobs": {
    response: [
      { id: "tj-001", dataset_id: "ds-001", status: "completed", epochs: 100, batch_size: 16, model_type: "yolov8", progress: 100, started_at: "2025-05-20T10:00:00Z", completed_at: "2025-05-20T12:00:00Z", result_url: "https://storage.example.com/models/model-v1.2.pt", created_by: "auth-user-001", created_at: "2025-05-20T10:00:00Z" }
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
      success: true, detectionId: "det-new-001",
      result: {
        detections: [{ skuId: "d4e5f6a7-b8c9-0123-def0-123456789abc", skuName: "Cola Classic 330ml", isAvailable: true, facings: 4, confidence: 0.92, boundingBox: { x: 12, y: 18, width: 20, height: 30 } }],
        missingSkus: [{ skuId: "f6a7b8c9-d0e1-2345-f012-3456789abcde", skuName: "Sparkling Water 500ml" }],
        shareOfShelf: { totalShelfArea: 100, trainedProductsArea: 28, percentage: 28.0 },
        totalFacings: 4, summary: "Detected 1 of 2 products. Cola Classic found with 4 facings. Sparkling Water not found."
      }
    }
  },
  "POST /functions/v1/roboflow-detect": {
    request: { imageUrl: "https://storage.example.com/shelf-images/aisle3-capture.jpg", shelfId: "sh-001", tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
    response: { success: true, result: { outputs: [{ predictions: { predictions: [{ class: "product", confidence: 0.89, x: 120, y: 80, width: 60, height: 100 }] } }] } }
  },
  "POST /functions/v1/start-training": {
    request: { dataset_id: "ds-001", epochs: 100, batch_size: 16 },
    response: { success: true, job_id: "tj-new-001", message: "Training job started." }
  },
  "POST /functions/v1/export-dataset": {
    request: { dataset_id: "ds-001", format: "yolov8" },
    response: { success: true, download_url: "https://storage.example.com/exports/ds-001-export.zip", image_count: 450, class_count: 12 }
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
  "POST /storage/v1/object/dataset-images/{path}": {
    request: "Binary file upload (multipart/form-data)",
    response: { Key: "dataset-images/dataset-id/set-id/image1.jpg" }
  },
  "GET /storage/v1/object/dataset-images/{path}": { response: "Binary image data" },
};

// ─── OPEN API SPEC ───────────────────────────────────────────────────────────

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ALPHA IR API",
    description: "Complete REST API for the ALPHA IR retail shelf detection, planogram compliance, model training, and inventory management platform. This API supports multi-tenant architecture with role-based access control (RBAC), quota management, and AI-powered inferencing.",
    version: "3.0.0",
    contact: { name: "ALPHA IR Engineering Team", email: "api@alpha-ir.com" }
  },
  servers: [
    { url: "https://{project_id}.supabase.co", description: "Production", variables: { project_id: { default: "your-project-id" } } }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "User's access_token obtained from sign-in. Required for all authenticated endpoints." },
      apiKey: { type: "apiKey", in: "header", name: "apikey", description: "Project anon key or service_role key. Required on every request." }
    },
    schemas: {
      Tenant: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, status: { type: "string", enum: ["active", "suspended"] }, is_active: { type: "boolean" }, logo_url: { type: "string", nullable: true }, username: { type: "string", nullable: true }, password: { type: "string", nullable: true }, admin_id: { type: "string", format: "uuid", nullable: true, description: "Foreign key to admins table — scopes admin data visibility" }, max_skus: { type: "integer", default: 50 }, max_images_per_month: { type: "integer", default: 1000 }, max_images_per_week: { type: "integer", default: 300 }, max_images_per_year: { type: "integer", default: 10000 }, processed_images_this_month: { type: "integer" }, processed_images_this_week: { type: "integer" }, processed_images_this_year: { type: "integer" }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      Store: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, name: { type: "string" }, address: { type: "string", nullable: true }, city: { type: "string", nullable: true }, country: { type: "string", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      SKU: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, category_id: { type: "string", format: "uuid", nullable: true }, name: { type: "string" }, description: { type: "string", nullable: true }, barcode: { type: "string", nullable: true }, width_cm: { type: "number", nullable: true }, is_active: { type: "boolean" }, training_status: { type: "string", enum: ["pending", "training", "completed", "failed"] }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      SKUImage: { type: "object", properties: { id: { type: "string", format: "uuid" }, sku_id: { type: "string", format: "uuid" }, image_url: { type: "string" }, created_at: { type: "string", format: "date-time" } } },
      ProductCategory: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, name: { type: "string" }, description: { type: "string", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      PlanogramTemplate: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, shelf_id: { type: "string", format: "uuid", nullable: true }, name: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string", enum: ["draft", "active", "archived"] }, layout: { type: "array", items: { type: "object" } }, created_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      PlanogramVersion: { type: "object", properties: { id: { type: "string", format: "uuid" }, template_id: { type: "string", format: "uuid" }, version_number: { type: "integer" }, layout: { type: "array", items: { type: "object" } }, change_notes: { type: "string", nullable: true }, created_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      Shelf: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, name: { type: "string" }, description: { type: "string", nullable: true }, location_in_store: { type: "string", nullable: true }, width_cm: { type: "number", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      ShelfProduct: { type: "object", properties: { id: { type: "string", format: "uuid" }, shelf_id: { type: "string", format: "uuid" }, sku_id: { type: "string", format: "uuid" }, expected_facings: { type: "integer", nullable: true }, position_order: { type: "integer", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      ShelfImage: { type: "object", properties: { id: { type: "string", format: "uuid" }, shelf_id: { type: "string", format: "uuid" }, image_url: { type: "string" }, detection_result: { type: "object", nullable: true }, processed_at: { type: "string", format: "date-time", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      Detection: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, original_image_url: { type: "string" }, annotated_image_url: { type: "string", nullable: true }, detection_result: { type: "object", nullable: true }, share_of_shelf_percentage: { type: "number", nullable: true }, total_facings: { type: "integer", nullable: true }, detected_skus: { type: "integer", nullable: true }, missing_skus: { type: "integer", nullable: true }, processed_at: { type: "string", format: "date-time" } } },
      ComplianceScan: { type: "object", properties: { id: { type: "string", format: "uuid" }, template_id: { type: "string", format: "uuid" }, shelf_image_id: { type: "string", format: "uuid", nullable: true }, image_url: { type: "string" }, compliance_score: { type: "number" }, total_expected: { type: "integer" }, total_found: { type: "integer" }, total_missing: { type: "integer" }, total_extra: { type: "integer" }, details: { type: "object", nullable: true }, scanned_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      Profile: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid", nullable: true }, admin_id: { type: "string", format: "uuid", nullable: true, description: "Links user to admin scope" }, full_name: { type: "string", nullable: true }, username: { type: "string", nullable: true }, avatar_url: { type: "string", nullable: true }, last_login: { type: "string", format: "date-time", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      UserRole: { type: "object", description: "Roles stored separately — never on profile table. Supports: owner, admin, tenant_admin, tenant_user.", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, role: { type: "string", enum: ["owner", "admin", "tenant_admin", "tenant_user"] } } },
      UserStoreAccess: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid" }, created_at: { type: "string", format: "date-time" } } },
      UserShelfAccess: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, shelf_id: { type: "string", format: "uuid" }, created_at: { type: "string", format: "date-time" } } },
      Admin: { type: "object", properties: { id: { type: "string", format: "uuid" }, email: { type: "string" }, phone: { type: "string", nullable: true }, password: { type: "string" }, full_name: { type: "string" }, monthly_limit: { type: "integer", default: 10000 }, is_active: { type: "boolean" }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      Notification: { type: "object", properties: { id: { type: "string", format: "uuid" }, user_id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid", nullable: true }, title: { type: "string" }, message: { type: "string" }, type: { type: "string" }, is_read: { type: "boolean" }, metadata: { type: "object", nullable: true }, created_at: { type: "string", format: "date-time" } } },
      UsageMetric: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, period_type: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] }, period_start: { type: "string", format: "date-time" }, images_processed: { type: "integer" }, training_jobs: { type: "integer" }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      Model: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, version: { type: "string" }, status: { type: "string" }, accuracy: { type: "number", nullable: true }, model_path: { type: "string", nullable: true }, trained_date: { type: "string", format: "date-time", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      ProcessingJob: { type: "object", properties: { id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, store_id: { type: "string", format: "uuid", nullable: true }, model_id: { type: "string", format: "uuid", nullable: true }, original_image_url: { type: "string" }, annotated_image_url: { type: "string", nullable: true }, status: { type: "string", enum: ["pending", "processing", "completed", "failed"] }, start_time: { type: "string", format: "date-time", nullable: true }, end_time: { type: "string", format: "date-time", nullable: true }, error_message: { type: "string", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      DetectionResult: { type: "object", properties: { id: { type: "string", format: "uuid" }, job_id: { type: "string", format: "uuid" }, sku_id: { type: "string", format: "uuid", nullable: true }, is_available: { type: "boolean" }, facings_count: { type: "integer" }, confidence: { type: "number", nullable: true }, share_of_shelf: { type: "number", nullable: true }, bounding_boxes: { type: "array", nullable: true, items: { type: "object" } }, created_at: { type: "string", format: "date-time" } } },
      Dataset: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, description: { type: "string", nullable: true }, tenant_id: { type: "string", format: "uuid", nullable: true }, status: { type: "string", enum: ["draft", "annotating", "training", "ready"] }, image_count: { type: "integer" }, class_count: { type: "integer" }, created_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      DatasetImageSet: { type: "object", properties: { id: { type: "string", format: "uuid" }, dataset_id: { type: "string", format: "uuid" }, name: { type: "string" }, image_count: { type: "integer" }, is_trained: { type: "boolean" }, created_at: { type: "string", format: "date-time" } } },
      DatasetImage: { type: "object", properties: { id: { type: "string", format: "uuid" }, dataset_id: { type: "string", format: "uuid" }, image_set_id: { type: "string", format: "uuid", nullable: true }, image_url: { type: "string" }, file_name: { type: "string", nullable: true }, is_annotated: { type: "boolean" }, annotations: { type: "array", description: "Array of annotation objects with class, x, y, width, height (relative coordinates 0-1)", items: { type: "object", properties: { class: { type: "string" }, x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } } } }, created_at: { type: "string", format: "date-time" } } },
      DatasetClass: { type: "object", properties: { id: { type: "string", format: "uuid" }, dataset_id: { type: "string", format: "uuid" }, name: { type: "string" }, color: { type: "string", description: "Hex color code for visualization" }, created_at: { type: "string", format: "date-time" } } },
      TrainingJob: { type: "object", properties: { id: { type: "string", format: "uuid" }, dataset_id: { type: "string", format: "uuid" }, status: { type: "string", enum: ["pending", "training", "completed", "failed"] }, epochs: { type: "integer", default: 100 }, batch_size: { type: "integer", default: 16 }, model_type: { type: "string", default: "yolov8" }, progress: { type: "number", nullable: true }, started_at: { type: "string", format: "date-time", nullable: true }, completed_at: { type: "string", format: "date-time", nullable: true }, result_url: { type: "string", nullable: true }, error_message: { type: "string", nullable: true }, created_by: { type: "string", format: "uuid", nullable: true }, created_at: { type: "string", format: "date-time" }, updated_at: { type: "string", format: "date-time" } } },
      DetectSKUsRequest: { type: "object", required: ["imageBase64", "tenantId"], properties: { imageBase64: { type: "string", description: "Base64-encoded image or data URI" }, tenantId: { type: "string", format: "uuid" }, storeId: { type: "string", format: "uuid" }, skusToDetect: { type: "array", items: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, imageUrls: { type: "array", items: { type: "string" } } } } } } },
      DetectSKUsResponse: { type: "object", properties: { success: { type: "boolean" }, detectionId: { type: "string", format: "uuid" }, result: { type: "object", properties: { detections: { type: "array", items: { type: "object", properties: { skuId: { type: "string" }, skuName: { type: "string" }, isAvailable: { type: "boolean" }, facings: { type: "integer" }, confidence: { type: "number" }, boundingBox: { type: "object", properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } } } } } }, missingSkus: { type: "array", items: { type: "object", properties: { skuId: { type: "string" }, skuName: { type: "string" } } } }, shareOfShelf: { type: "object", properties: { totalShelfArea: { type: "number" }, trainedProductsArea: { type: "number" }, percentage: { type: "number" } } }, totalFacings: { type: "integer" }, summary: { type: "string" } } } } },
      StartTrainingRequest: { type: "object", required: ["dataset_id"], properties: { dataset_id: { type: "string", format: "uuid", description: "The dataset to train on" }, epochs: { type: "integer", default: 100, description: "Number of training epochs" }, batch_size: { type: "integer", default: 16, description: "Batch size for training" } } },
      StartTrainingResponse: { type: "object", properties: { success: { type: "boolean" }, job_id: { type: "string", format: "uuid" }, message: { type: "string" } } },
      ExportDatasetRequest: { type: "object", required: ["dataset_id"], properties: { dataset_id: { type: "string", format: "uuid" }, format: { type: "string", enum: ["yolov8", "coco", "pascal_voc"], default: "yolov8" } } },
      ExportDatasetResponse: { type: "object", properties: { success: { type: "boolean" }, download_url: { type: "string" }, image_count: { type: "integer" }, class_count: { type: "integer" } } },
      AutoAnnotateRequest: { type: "object", required: ["image_urls"], description: "Submit images for auto-annotation using the inferencing endpoint", properties: { image_urls: { type: "array", items: { type: "string" }, description: "Array of image URLs to annotate" }, model_id: { type: "string", format: "uuid", description: "Specific model version to use (optional)" }, confidence_threshold: { type: "number", default: 0.5, description: "Minimum confidence for annotations (0-1)" } } },
      AutoAnnotateResponse: { type: "object", properties: { job_id: { type: "string" }, status: { type: "string", enum: ["completed", "processing", "failed"] }, results: { type: "array", items: { type: "object", properties: { image_id: { type: "string" }, predictions: { type: "array", items: { type: "object", properties: { class: { type: "string" }, confidence: { type: "number" }, x: { type: "number", description: "Center X in pixels" }, y: { type: "number", description: "Center Y in pixels" }, width: { type: "number", description: "Width in pixels" }, height: { type: "number", description: "Height in pixels" }, image: { type: "object", properties: { width: { type: "integer" }, height: { type: "integer" } } } } } } } } } } },
      RoboflowDetectRequest: { type: "object", required: ["imageUrl"], properties: { imageUrl: { type: "string", format: "uri" }, shelfId: { type: "string", format: "uuid" }, tenantId: { type: "string", format: "uuid" } } },
      RoboflowDetectResponse: { type: "object", properties: { success: { type: "boolean" }, result: { type: "object" } } }
    }
  },
  security: [{ bearerAuth: [] }, { apiKey: [] }],
  paths: {
    "/rest/v1/admins": {
      get: { summary: "List admins", tags: ["Admins"], parameters: [{ name: "order", in: "query", schema: { type: "string" }, description: "e.g. created_at.desc" }], responses: { "200": { description: "Array of Admin objects" } } },
      post: { summary: "Create admin", tags: ["Admins"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Admin" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/admins?id=eq.{id}": {
      patch: { summary: "Update admin", tags: ["Admins"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Admin" } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete admin", tags: ["Admins"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/tenants": {
      get: { summary: "List tenants", tags: ["Tenants"], parameters: [{ name: "select", in: "query", schema: { type: "string" }, description: "Columns to return (e.g. *)" }, { name: "status", in: "query", schema: { type: "string" }, description: "Filter: eq.active or eq.suspended" }, { name: "is_active", in: "query", schema: { type: "string" }, description: "Filter: eq.true" }, { name: "admin_id", in: "query", schema: { type: "string" }, description: "Filter by admin scope: eq.{uuid}" }], responses: { "200": { description: "Array of Tenant objects" } } },
      post: { summary: "Create tenant", tags: ["Tenants"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Tenant" } } } }, responses: { "201": { description: "Created Tenant object" }, "409": { description: "Conflict – duplicate name" } } }
    },
    "/rest/v1/tenants?id=eq.{id}": {
      patch: { summary: "Update tenant", tags: ["Tenants"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Tenant" } } } }, responses: { "200": { description: "Updated Tenant" }, "404": { description: "Not found" } } },
      delete: { summary: "Delete tenant", tags: ["Tenants"], responses: { "204": { description: "Deleted (no content)" } } }
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
      get: { summary: "List SKUs (Products)", tags: ["Products"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "category_id", in: "query", schema: { type: "string" } }, { name: "is_active", in: "query", schema: { type: "string" } }, { name: "training_status", in: "query", schema: { type: "string" } }, { name: "select", in: "query", schema: { type: "string" }, description: "e.g. *,sku_images(*),product_categories(name)" }], responses: { "200": { description: "Array of SKU objects with optional joins" } } },
      post: { summary: "Create SKU", tags: ["Products"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/SKU" } } } }, responses: { "201": { description: "Created SKU" } } }
    },
    "/rest/v1/skus?id=eq.{id}": {
      patch: { summary: "Update SKU", tags: ["Products"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/SKU" } } } }, responses: { "200": { description: "Updated SKU" } } },
      delete: { summary: "Delete SKU", tags: ["Products"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/sku_images": {
      get: { summary: "List SKU images", tags: ["Products"], parameters: [{ name: "sku_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of SKUImage objects" } } },
      post: { summary: "Add SKU image", tags: ["Products"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/SKUImage" } } } }, responses: { "201": { description: "Created SKUImage" } } }
    },
    "/rest/v1/sku_images?id=eq.{id}": {
      delete: { summary: "Delete SKU image", tags: ["Products"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/product_categories": {
      get: { summary: "List categories", tags: ["Categories"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of ProductCategory objects" } } },
      post: { summary: "Create category", tags: ["Categories"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ProductCategory" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/product_categories?id=eq.{id}": {
      patch: { summary: "Update category", tags: ["Categories"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/ProductCategory" } } } }, responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete category", tags: ["Categories"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/planogram_templates": {
      get: { summary: "List planogram templates", tags: ["Planograms"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }, { name: "select", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of PlanogramTemplate objects" } } },
      post: { summary: "Create planogram", tags: ["Planograms"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramTemplate" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/planogram_templates?id=eq.{id}": {
      patch: { summary: "Update planogram", tags: ["Planograms"], responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete planogram", tags: ["Planograms"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/planogram_versions": {
      get: { summary: "List planogram versions", tags: ["Planograms"], parameters: [{ name: "template_id", in: "query", schema: { type: "string" } }, { name: "order", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of PlanogramVersion objects" } } },
      post: { summary: "Create version snapshot", tags: ["Planograms"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/PlanogramVersion" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelves": {
      get: { summary: "List shelves", tags: ["Shelves"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "store_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Shelf objects" } } },
      post: { summary: "Create shelf", tags: ["Shelves"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Shelf" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/shelves?id=eq.{id}": {
      patch: { summary: "Update shelf", tags: ["Shelves"], responses: { "200": { description: "Updated" } } },
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
      get: { summary: "List detections", tags: ["Inferencing"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "store_id", in: "query", schema: { type: "string" } }, { name: "order", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Detection objects" } } }
    },
    "/rest/v1/detection_results": {
      get: { summary: "List detection results", tags: ["Inferencing"], parameters: [{ name: "job_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of DetectionResult objects" } } }
    },
    "/rest/v1/processing_jobs": {
      get: { summary: "List processing jobs", tags: ["Inferencing"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of ProcessingJob objects" } } }
    },
    "/rest/v1/compliance_scans": {
      get: { summary: "List compliance scans", tags: ["Compliance"], parameters: [{ name: "template_id", in: "query", schema: { type: "string" } }, { name: "order", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of ComplianceScan objects" } } },
      post: { summary: "Create compliance scan", tags: ["Compliance"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ComplianceScan" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/profiles": {
      get: { summary: "List user profiles", tags: ["Users & Access"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Profile objects" } } }
    },
    "/rest/v1/profiles?user_id=eq.{user_id}": {
      patch: { summary: "Update profile", tags: ["Users & Access"], requestBody: { content: { "application/json": { schema: { "$ref": "#/components/schemas/Profile" } } } }, responses: { "200": { description: "Updated" } } }
    },
    "/rest/v1/user_roles": {
      get: { summary: "List user roles", tags: ["Users & Access"], responses: { "200": { description: "Array of UserRole objects" } } },
      post: { summary: "Assign role", tags: ["Users & Access"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/UserRole" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/user_store_access": {
      get: { summary: "List user-store access grants", tags: ["Users & Access"], responses: { "200": { description: "Array of UserStoreAccess" } } },
      post: { summary: "Grant store access", tags: ["Users & Access"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/UserStoreAccess" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/user_store_access?id=eq.{id}": {
      delete: { summary: "Revoke store access", tags: ["Users & Access"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/user_shelf_access": {
      get: { summary: "List user-shelf access grants", tags: ["Users & Access"], responses: { "200": { description: "Array of UserShelfAccess" } } },
      post: { summary: "Grant shelf access", tags: ["Users & Access"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/UserShelfAccess" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/user_shelf_access?id=eq.{id}": {
      delete: { summary: "Revoke shelf access", tags: ["Users & Access"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/notifications": {
      get: { summary: "List notifications", tags: ["Notifications"], parameters: [{ name: "user_id", in: "query", schema: { type: "string" } }, { name: "is_read", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Notification objects" } } },
      post: { summary: "Create notification", tags: ["Notifications"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Notification" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/notifications?id=eq.{id}": {
      patch: { summary: "Mark notification read/unread", tags: ["Notifications"], responses: { "200": { description: "Updated" } } }
    },
    "/rest/v1/usage_metrics": {
      get: { summary: "List usage metrics", tags: ["Usage & Analytics"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "period_type", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of UsageMetric objects" } } }
    },
    "/rest/v1/models": {
      get: { summary: "List models", tags: ["Usage & Analytics"], responses: { "200": { description: "Array of Model objects" } } }
    },
    "/rest/v1/datasets": {
      get: { summary: "List datasets", tags: ["Training"], parameters: [{ name: "tenant_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of Dataset objects" } } },
      post: { summary: "Create dataset", tags: ["Training"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Dataset" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/datasets?id=eq.{id}": {
      patch: { summary: "Update dataset", tags: ["Training"], responses: { "200": { description: "Updated" } } },
      delete: { summary: "Delete dataset", tags: ["Training"], responses: { "204": { description: "Deleted" } } }
    },
    "/rest/v1/dataset_image_sets": {
      get: { summary: "List image sets", tags: ["Training"], parameters: [{ name: "dataset_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of DatasetImageSet objects" } } },
      post: { summary: "Create image set", tags: ["Training"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/DatasetImageSet" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/dataset_images": {
      get: { summary: "List dataset images", tags: ["Training"], parameters: [{ name: "dataset_id", in: "query", schema: { type: "string" } }, { name: "image_set_id", in: "query", schema: { type: "string" } }, { name: "is_annotated", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of DatasetImage objects" } } },
      post: { summary: "Add image to dataset", tags: ["Training"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/DatasetImage" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/dataset_images?id=eq.{id}": {
      patch: { summary: "Update image annotations", tags: ["Training"], description: "Update annotations on a dataset image. Set is_annotated to true when annotations are complete.", responses: { "200": { description: "Updated" } } }
    },
    "/rest/v1/dataset_classes": {
      get: { summary: "List dataset classes", tags: ["Training"], parameters: [{ name: "dataset_id", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of DatasetClass objects" } } },
      post: { summary: "Create dataset class", tags: ["Training"], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/DatasetClass" } } } }, responses: { "201": { description: "Created" } } }
    },
    "/rest/v1/training_jobs": {
      get: { summary: "List training jobs", tags: ["Training"], parameters: [{ name: "dataset_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Array of TrainingJob objects" } } }
    },
    "/rest/v1/rpc/check_tenant_quota": {
      post: { summary: "Check tenant quota", tags: ["RPC Functions"], description: "Returns quota status including monthly/weekly/yearly usage vs limits.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_tenant_id"], properties: { _tenant_id: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "Quota status JSON" } } }
    },
    "/rest/v1/rpc/increment_usage_metric": {
      post: { summary: "Increment usage metric", tags: ["RPC Functions"], description: "Atomically increments images_processed counter.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_tenant_id", "_period_type"], properties: { _tenant_id: { type: "string", format: "uuid" }, _period_type: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] }, _images_count: { type: "integer", default: 1 } } } } } }, responses: { "200": { description: "Success" } } }
    },
    "/rest/v1/rpc/get_user_tenant_id": {
      post: { summary: "Get user's tenant ID", tags: ["RPC Functions"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_user_id"], properties: { _user_id: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "Tenant UUID string" } } }
    },
    "/rest/v1/rpc/has_role": {
      post: { summary: "Check if user has role", tags: ["RPC Functions"], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["_user_id", "_role"], properties: { _user_id: { type: "string", format: "uuid" }, _role: { type: "string", enum: ["owner", "admin", "tenant_admin", "tenant_user"] } } } } } }, responses: { "200": { description: "Boolean" } } }
    },
    "/functions/v1/detect-skus": {
      post: { summary: "AI SKU Detection (Inferencing)", tags: ["Inferencing"], description: "Sends a shelf image (base64) to the AI model for product detection. Checks tenant quota, runs vision AI detection, stores results in the detections table, and increments usage metrics for all period types. Rate limited per tenant quota configuration.", requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/DetectSKUsRequest" } } } }, responses: { "200": { description: "Detection result", content: { "application/json": { schema: { "$ref": "#/components/schemas/DetectSKUsResponse" } } } }, "400": { description: "Missing required fields" }, "402": { description: "AI credits exhausted" }, "429": { description: "Quota exceeded or rate limited" }, "500": { description: "Server error" } } }
    },
    "/functions/v1/roboflow-detect": {
      post: { summary: "Roboflow Detection (Inferencing)", tags: ["Inferencing"], description: "Sends an image URL to the Roboflow workflow API for external model inferencing. Optionally saves detection results to shelf_images.", requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/RoboflowDetectRequest" } } } }, responses: { "200": { description: "Detection result from Roboflow" }, "500": { description: "Error" } } }
    },
    "/functions/v1/start-training": {
      post: { summary: "Start Training Job", tags: ["Training"], description: "Initiates a model training job for a given dataset. Creates a training_jobs record, transitions status from pending → training → completed. Requires a valid Bearer token. The endpoint is designed to be extended with a custom training API endpoint.", requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/StartTrainingRequest" } } } }, responses: { "200": { description: "Training job started", content: { "application/json": { schema: { "$ref": "#/components/schemas/StartTrainingResponse" } } } }, "400": { description: "Missing dataset_id" }, "401": { description: "Unauthorized" }, "500": { description: "Server error" } } }
    },
    "/functions/v1/export-dataset": {
      post: { summary: "Export Dataset", tags: ["Training"], description: "Exports a dataset with its images and annotations in the specified format (YOLOv8, COCO, Pascal VOC). Returns a download URL for the exported ZIP archive.", requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ExportDatasetRequest" } } } }, responses: { "200": { description: "Export result with download URL", content: { "application/json": { schema: { "$ref": "#/components/schemas/ExportDatasetResponse" } } } }, "400": { description: "Missing dataset_id" }, "500": { description: "Server error" } } }
    },
    "/auth/v1/signup": {
      post: { summary: "Sign up new user", tags: ["Authentication"], description: "Creates a new user account. A profile row is automatically created via database trigger. Email verification is required before login.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string", minLength: 8, description: "Min 8 chars, uppercase, lowercase, number" }, data: { type: "object", properties: { full_name: { type: "string" } } } } } } } }, responses: { "200": { description: "User object + session" }, "422": { description: "Validation error" } } }
    },
    "/auth/v1/token?grant_type=password": {
      post: { summary: "Sign in with password", tags: ["Authentication"], description: "Authenticates user and returns JWT session. Token expires in 3600s. Use refresh_token for renewal.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string" } } } } } }, responses: { "200": { description: "Session with tokens" }, "400": { description: "Invalid credentials" } } }
    },
    "/auth/v1/logout": {
      post: { summary: "Sign out", tags: ["Authentication"], responses: { "204": { description: "Signed out" } } }
    },
    "/storage/v1/object/shelf-images/{path}": {
      post: { summary: "Upload shelf image", tags: ["Storage"], description: "Path: {tenant_id}/{date}/{filename}", responses: { "200": { description: "Upload key" } } },
      get: { summary: "Download shelf image", tags: ["Storage"], responses: { "200": { description: "Binary image" } } }
    },
    "/storage/v1/object/sku-training-images/{path}": {
      post: { summary: "Upload SKU training image", tags: ["Storage"], description: "Path: {tenant_id}/{sku_id}/{filename}", responses: { "200": { description: "Upload key" } } },
      get: { summary: "Download SKU training image", tags: ["Storage"], responses: { "200": { description: "Binary image" } } }
    },
    "/storage/v1/object/dataset-images/{path}": {
      post: { summary: "Upload dataset image", tags: ["Storage"], description: "Path: {dataset_id}/{set_id}/{filename}", responses: { "200": { description: "Upload key" } } },
      get: { summary: "Download dataset image", tags: ["Storage"], responses: { "200": { description: "Binary image" } } }
    }
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  PATCH: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  PUT: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-600 border-red-500/30",
};

const tagIcons: Record<string, string> = {
  "Admins": "👑", "Tenants": "🏢", "Stores": "🏪", "Products": "📦", "Categories": "🏷️",
  "Planograms": "📐", "Shelves": "🗄️", "Inferencing": "🔍", "Compliance": "✅",
  "Users & Access": "👤", "Notifications": "🔔", "Usage & Analytics": "📊",
  "RPC Functions": "⚡", "Training": "🧠", "Authentication": "🔐", "Storage": "📁",
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
  md += `## Authentication\n\nAll requests require:\n\`\`\`\napikey: <your-project-anon-key>\nAuthorization: Bearer <user-access-token>\n\`\`\`\n\n`;
  md += `## RBAC Roles\n\n| Role | Description | Scope |\n|------|-------------|-------|\n`;
  md += `| owner | Superuser | Full system access |\n| admin | Administrator | Scoped to assigned tenants via admin_id |\n| tenant_admin | Tenant manager | Full access within own tenant |\n| tenant_user | Standard user | Read + limited write within tenant |\n\n`;
  md += `## Rate Limits & Quotas\n\nEach tenant has configurable limits:\n- **Monthly**: max_images_per_month (default: 1000)\n- **Weekly**: max_images_per_week (default: 300)\n- **Yearly**: max_images_per_year (default: 10000)\n- **SKU cap**: max_skus (default: 50)\n\nQuota is checked before each inference. Returns 429 when exceeded.\n\n---\n\n`;

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods as any)) {
      const o = op as any;
      md += `### ${method.toUpperCase()} \`${path}\`\n\n`;
      md += `**${o.summary}**`;
      if (o.tags) md += ` — _${o.tags.join(', ')}_`;
      md += `\n\n`;
      if (o.description) md += `${o.description}\n\n`;
      if (o.parameters?.length) {
        md += `| Parameter | In | Type | Required | Description |\n|-----------|-----|------|----------|-------------|\n`;
        for (const p of o.parameters) {
          md += `| \`${p.name}\` | ${p.in} | ${p.schema?.type || 'string'} | ${p.required ? 'Yes' : 'No'} | ${p.description || ''} |\n`;
        }
        md += `\n`;
      }
      const exKey = `${method.toUpperCase()} ${path}`;
      if (examples[exKey]) {
        if (examples[exKey].request) md += `**Example Request:**\n\`\`\`json\n${JSON.stringify(examples[exKey].request, null, 2)}\n\`\`\`\n\n`;
        if (examples[exKey].response !== undefined) md += `**Example Response:**\n\`\`\`json\n${JSON.stringify(examples[exKey].response, null, 2)}\n\`\`\`\n\n`;
      }
      md += `---\n\n`;
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
          <div>
            <h4 className="text-sm font-semibold text-foreground">{op.summary}</h4>
            {op.description && <p className="text-xs text-muted-foreground mt-1">{op.description}</p>}
          </div>

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

          {example?.request && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Example Request Body</h5>
              <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto text-foreground/90 border border-border/50 max-h-60 overflow-y-auto">
                {typeof example.request === 'string' ? example.request : JSON.stringify(example.request, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Responses</h5>
            <div className="space-y-1">
              {Object.entries(op.responses as Record<string, any>).map(([code, res]) => (
                <div key={code} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className={cn("font-mono text-[10px] px-1.5 py-0 border",
                    code.startsWith('2') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                    code.startsWith('4') ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                    "bg-red-500/10 text-red-600 border-red-500/30"
                  )}>{code}</Badge>
                  <span className="text-muted-foreground">{res.description}</span>
                </div>
              ))}
            </div>
          </div>

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

// ─── RBAC INFO PANEL ─────────────────────────────────────────────────────────

function RBACPanel() {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-primary" /> Role-Based Access Control (RBAC)</h3>
        <p className="text-sm text-muted-foreground mb-4">ALPHA IR implements a 4-tier RBAC hierarchy. Roles are stored in a dedicated <code className="bg-muted px-1.5 py-0.5 rounded text-xs">user_roles</code> table (never on profiles) with SECURITY DEFINER functions to prevent privilege escalation.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className="text-left py-2 pr-4 text-muted-foreground font-medium">Role</th><th className="text-left py-2 pr-4 text-muted-foreground font-medium">Access Level</th><th className="text-left py-2 text-muted-foreground font-medium">Capabilities</th></tr></thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs"><Badge className="bg-primary/20 text-primary border-primary/30" variant="outline">owner</Badge></td><td className="py-2 pr-4">Full system</td><td className="py-2 text-xs text-muted-foreground">All resources, settings, training, data, API docs. Cannot be assigned via UI.</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs"><Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30" variant="outline">admin</Badge></td><td className="py-2 pr-4">Multi-tenant admin</td><td className="py-2 text-xs text-muted-foreground">CRUD on tenants, stores, users scoped by admin_id link. User management. No training/settings access.</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono text-xs"><Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30" variant="outline">tenant_admin</Badge></td><td className="py-2 pr-4">Single tenant</td><td className="py-2 text-xs text-muted-foreground">Full CRUD within own tenant. Manage stores, shelves, products, planograms.</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs"><Badge className="bg-muted text-muted-foreground border-border" variant="outline">tenant_user</Badge></td><td className="py-2 pr-4">Limited tenant</td><td className="py-2 text-xs text-muted-foreground">Read access + detection submissions. Scoped by user_store_access and user_shelf_access.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-warning" /> Quota & Rate Limiting</h3>
        <p className="text-sm text-muted-foreground mb-3">Each tenant has configurable quotas enforced before every inferencing request:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Monthly", field: "max_images_per_month", default: "1,000" },
            { label: "Weekly", field: "max_images_per_week", default: "300" },
            { label: "Yearly", field: "max_images_per_year", default: "10,000" },
            { label: "SKU Cap", field: "max_skus", default: "50" },
          ].map(q => (
            <div key={q.field} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs font-medium text-foreground">{q.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5"><code>{q.field}</code> — Default: {q.default}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Use <code className="bg-muted px-1 py-0.5 rounded">rpc/check_tenant_quota</code> to verify before submission. Returns 429 when exceeded.</p>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4"><Server className="w-5 h-5 text-accent" /> Row-Level Security (RLS)</h3>
        <p className="text-sm text-muted-foreground mb-3">All tables have RLS enabled with PERMISSIVE (OR logic) policies:</p>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Owner/Admin</strong>: Full access via <code className="bg-muted px-1 rounded">has_role(auth.uid(), 'admin')</code> — owner is included automatically.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Tenant users</strong>: Scoped via <code className="bg-muted px-1 rounded">get_user_tenant_id(auth.uid())</code> matching the row's tenant_id.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Nested resources</strong>: shelf_images, shelf_products, compliance_scans use EXISTS subqueries to resolve tenant ownership through parent tables.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Notifications</strong>: Users can only view/update their own (user_id = auth.uid()). Only admins can insert.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── INFERENCING DOCS ────────────────────────────────────────────────────────

function InferencingDocs() {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-primary" /> Inferencing Pipeline</h3>
        <p className="text-sm text-muted-foreground mb-4">ALPHA IR supports two inferencing modes for shelf image analysis:</p>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">1. AI Vision Detection — <code className="text-xs bg-muted px-1.5 py-0.5 rounded">POST /functions/v1/detect-skus</code></h4>
            <p className="text-xs text-muted-foreground mb-2">Primary detection endpoint using multimodal AI (Gemini Pro Vision). Sends a base64-encoded shelf image with a list of SKUs to detect.</p>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Pipeline Flow</h5>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Validate request (imageBase64, tenantId required)</li>
              <li>Check tenant quota via <code className="bg-muted px-1 rounded">check_tenant_quota</code> RPC</li>
              <li>Build vision prompt with SKU catalog for the tenant</li>
              <li>Submit to AI gateway with system + user prompt</li>
              <li>Parse structured JSON response (detections, missing, share of shelf)</li>
              <li>Store result in <code className="bg-muted px-1 rounded">detections</code> table</li>
              <li>Increment usage metrics for all periods (daily, weekly, monthly, yearly)</li>
              <li>Update tenant counters for backward compatibility</li>
            </ol>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Error Codes</h5>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30">400 — Missing fields</Badge>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">402 — Credits exhausted</Badge>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">429 — Quota exceeded</Badge>
              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30">500 — Server error</Badge>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">2. Roboflow Detection — <code className="text-xs bg-muted px-1.5 py-0.5 rounded">POST /functions/v1/roboflow-detect</code></h4>
            <p className="text-xs text-muted-foreground mb-2">External model detection using Roboflow's workflow API. Uses a pre-configured workflow ID and API key stored as secrets.</p>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Response Format</h5>
            <pre className="text-[10px] font-mono bg-muted/50 rounded p-2 overflow-x-auto text-foreground/80 border border-border/50">
{`{
  "predictions": [{
    "class": "product_name",
    "confidence": 0.89,
    "x": 120,        // center X in pixels
    "y": 80,         // center Y in pixels
    "width": 60,     // box width in pixels
    "height": 100    // box height in pixels
  }]
}`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">3. Auto-Annotation (Batch)</h4>
            <p className="text-xs text-muted-foreground mb-2">Bulk annotation of dataset images using the inferencing endpoint. Available from the Training → Images tab.</p>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Workflow</h5>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Select image sets in the Training Images grid</li>
              <li>Click "Auto Annotate Selected" — submits batch to inferencing endpoint</li>
              <li>System polls for job completion (states: submitting → queued → polling → saving)</li>
              <li>Predictions are converted from pixel coordinates to relative coordinates (0-1)</li>
              <li>Annotations saved to <code className="bg-muted px-1 rounded">dataset_images.annotations</code> as JSON array</li>
              <li>Each image marked <code className="bg-muted px-1 rounded">is_annotated = true</code></li>
            </ol>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Annotation Format</h5>
            <pre className="text-[10px] font-mono bg-muted/50 rounded p-2 overflow-x-auto text-foreground/80 border border-border/50">
{`// Saved in dataset_images.annotations
[{
  "class": "cola_330ml",
  "x": 0.15,          // relative center X (0-1)
  "y": 0.20,          // relative center Y (0-1)  
  "width": 0.10,      // relative width (0-1)
  "height": 0.25      // relative height (0-1)
}]`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRAINING DOCS ───────────────────────────────────────────────────────────

function TrainingDocs() {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4"><Brain className="w-5 h-5 text-primary" /> Training Pipeline</h3>
        <p className="text-sm text-muted-foreground mb-4">The training system supports end-to-end model development from dataset creation to model deployment.</p>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">Dataset Management</h4>
            <p className="text-xs text-muted-foreground mb-2">Datasets organize training images with classes derived from the tenant's SKU catalog.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border"><th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Resource</th><th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Endpoint</th><th className="text-left py-1.5 text-muted-foreground font-medium">Purpose</th></tr></thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50"><td className="py-1.5 pr-3 font-mono text-foreground">datasets</td><td className="py-1.5 pr-3"><code>/rest/v1/datasets</code></td><td className="py-1.5">Container for training projects. Status: draft → annotating → training → ready</td></tr>
                  <tr className="border-b border-border/50"><td className="py-1.5 pr-3 font-mono text-foreground">dataset_image_sets</td><td className="py-1.5 pr-3"><code>/rest/v1/dataset_image_sets</code></td><td className="py-1.5">Named batches within a dataset (e.g., "Store A Batch 1"). Up to 500 images per set.</td></tr>
                  <tr className="border-b border-border/50"><td className="py-1.5 pr-3 font-mono text-foreground">dataset_images</td><td className="py-1.5 pr-3"><code>/rest/v1/dataset_images</code></td><td className="py-1.5">Individual images with annotations. Each annotation is a bounding box with class label.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-mono text-foreground">dataset_classes</td><td className="py-1.5 pr-3"><code>/rest/v1/dataset_classes</code></td><td className="py-1.5">Class labels derived from SKUs. Each gets a unique color for visualization.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">Start Training — <code className="text-xs bg-muted px-1.5 py-0.5 rounded">POST /functions/v1/start-training</code></h4>
            <p className="text-xs text-muted-foreground mb-2">Initiates a YOLOv8 training job. Requires a valid Bearer token (authenticated user).</p>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Pipeline Flow</h5>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Validate JWT and extract user_id from claims</li>
              <li>Create <code className="bg-muted px-1 rounded">training_jobs</code> record (status: pending)</li>
              <li>Transition to status: training (progress: 0)</li>
              <li>Update dataset status to "training"</li>
              <li>Submit to external training endpoint (or simulated 10s completion)</li>
              <li>On completion: status → completed, progress → 100, set completed_at</li>
              <li>Reset dataset status to "ready"</li>
            </ol>
            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Training Parameters</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <div className="p-2 rounded bg-muted/30 border border-border/50">
                <p className="text-[10px] font-medium text-foreground">epochs</p>
                <p className="text-[10px] text-muted-foreground">Default: 100 | Range: 10-500</p>
              </div>
              <div className="p-2 rounded bg-muted/30 border border-border/50">
                <p className="text-[10px] font-medium text-foreground">batch_size</p>
                <p className="text-[10px] text-muted-foreground">Default: 16 | Options: 8, 16, 32</p>
              </div>
              <div className="p-2 rounded bg-muted/30 border border-border/50">
                <p className="text-[10px] font-medium text-foreground">model_type</p>
                <p className="text-[10px] text-muted-foreground">Default: yolov8</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">Export Dataset — <code className="text-xs bg-muted px-1.5 py-0.5 rounded">POST /functions/v1/export-dataset</code></h4>
            <p className="text-xs text-muted-foreground mb-2">Exports a dataset with images and annotations in industry-standard formats.</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">YOLOv8</Badge>
              <Badge variant="secondary" className="text-xs">COCO</Badge>
              <Badge variant="secondary" className="text-xs">Pascal VOC</Badge>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2">Model Versioning</h4>
            <p className="text-xs text-muted-foreground mb-2">Trained models are versioned and managed through the <code className="bg-muted px-1 rounded">models</code> table and the Train tab in the UI.</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Activate</strong>: Set model status to "active" for production use</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Suspend</strong>: Temporarily disable a model version</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> <strong className="text-foreground">Remove</strong>: Permanently delete a model version and its artifacts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
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
    downloadFile(JSON.stringify(openApiSpec, null, 2), 'alpha-ir-openapi-v3.json', 'application/json');
  };

  const handleDownloadMarkdown = () => {
    downloadFile(generateMarkdown(), 'alpha-ir-api-docs-v3.md', 'text/markdown');
  };

  const totalEndpoints = Object.values(groups).reduce((sum, eps) => sum + eps.length, 0);
  const totalSchemas = Object.keys(openApiSpec.components.schemas).length;

  return (
    <MainLayout title="API Documentation" subtitle="ALPHA IR API v3.0 — Complete reference with inferencing & training guides">
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="outline" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> v{openApiSpec.info.version}</Badge>
          <Badge variant="secondary" className="text-xs">{totalEndpoints} endpoints</Badge>
          <Badge variant="secondary" className="text-xs">{totalSchemas} schemas</Badge>
          <Badge variant="secondary" className="text-xs">{Object.keys(groups).length} groups</Badge>
        </div>

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
          <TabsList className="flex-wrap">
            <TabsTrigger value="swagger" className="gap-2"><BookOpen className="w-4 h-4" /> Swagger UI</TabsTrigger>
            <TabsTrigger value="inferencing" className="gap-2"><Zap className="w-4 h-4" /> Inferencing</TabsTrigger>
            <TabsTrigger value="training" className="gap-2"><Brain className="w-4 h-4" /> Training</TabsTrigger>
            <TabsTrigger value="rbac" className="gap-2"><Shield className="w-4 h-4" /> RBAC & Security</TabsTrigger>
            <TabsTrigger value="json" className="gap-2"><Code className="w-4 h-4" /> Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="swagger" className="mt-4">
            <ScrollArea className="h-[75vh]">
              <div className="space-y-2 pr-4">
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

          <TabsContent value="inferencing" className="mt-4">
            <ScrollArea className="h-[75vh]">
              <div className="pr-4">
                <InferencingDocs />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="training" className="mt-4">
            <ScrollArea className="h-[75vh]">
              <div className="pr-4">
                <TrainingDocs />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rbac" className="mt-4">
            <ScrollArea className="h-[75vh]">
              <div className="pr-4">
                <RBACPanel />
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
