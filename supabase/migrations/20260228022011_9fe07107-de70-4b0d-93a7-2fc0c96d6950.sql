
-- ============================================================
-- FIX: Convert ALL RESTRICTIVE RLS policies to PERMISSIVE
-- This is the root cause of CRUD and data visibility failures.
-- RESTRICTIVE = AND logic (all must pass), PERMISSIVE = OR logic (any can pass)
-- ============================================================

-- =================== TENANTS ===================
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant users can view their own tenant" ON public.tenants;

CREATE POLICY "Admins full access tenants" ON public.tenants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (id = get_user_tenant_id(auth.uid()));

-- =================== STORES ===================
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
DROP POLICY IF EXISTS "Tenant users can view their stores" ON public.stores;

CREATE POLICY "Admins full access stores" ON public.stores FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own stores" ON public.stores FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own stores" ON public.stores FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own stores" ON public.stores FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users delete own stores" ON public.stores FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== SHELVES ===================
DROP POLICY IF EXISTS "Admins can manage all shelves" ON public.shelves;
DROP POLICY IF EXISTS "Tenant users can view their shelves" ON public.shelves;

CREATE POLICY "Admins full access shelves" ON public.shelves FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own shelves" ON public.shelves FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own shelves" ON public.shelves FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own shelves" ON public.shelves FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users delete own shelves" ON public.shelves FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== SKUS ===================
DROP POLICY IF EXISTS "Admins can manage all skus" ON public.skus;
DROP POLICY IF EXISTS "Tenant users can view their skus" ON public.skus;

CREATE POLICY "Admins full access skus" ON public.skus FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own skus" ON public.skus FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own skus" ON public.skus FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own skus" ON public.skus FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users delete own skus" ON public.skus FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== PRODUCT_CATEGORIES ===================
DROP POLICY IF EXISTS "Admins can manage all categories" ON public.product_categories;
DROP POLICY IF EXISTS "Tenant users can view their categories" ON public.product_categories;

CREATE POLICY "Admins full access categories" ON public.product_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own categories" ON public.product_categories FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own categories" ON public.product_categories FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own categories" ON public.product_categories FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users delete own categories" ON public.product_categories FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== DETECTIONS ===================
DROP POLICY IF EXISTS "Admins can manage all detections" ON public.detections;
DROP POLICY IF EXISTS "Tenant users can view their detections" ON public.detections;

CREATE POLICY "Admins full access detections" ON public.detections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own detections" ON public.detections FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own detections" ON public.detections FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== SHELF_IMAGES ===================
DROP POLICY IF EXISTS "Admins can manage all shelf images" ON public.shelf_images;
DROP POLICY IF EXISTS "Tenant users can view their shelf images" ON public.shelf_images;

CREATE POLICY "Admins full access shelf_images" ON public.shelf_images FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own shelf_images" ON public.shelf_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM shelves s WHERE s.id = shelf_images.shelf_id AND s.tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant users insert own shelf_images" ON public.shelf_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM shelves s WHERE s.id = shelf_images.shelf_id AND s.tenant_id = get_user_tenant_id(auth.uid())));

-- =================== SHELF_PRODUCTS ===================
DROP POLICY IF EXISTS "Admins can manage all shelf products" ON public.shelf_products;
DROP POLICY IF EXISTS "Tenant users can view their shelf products" ON public.shelf_products;

CREATE POLICY "Admins full access shelf_products" ON public.shelf_products FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own shelf_products" ON public.shelf_products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM shelves s WHERE s.id = shelf_products.shelf_id AND s.tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant users manage own shelf_products" ON public.shelf_products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM shelves s WHERE s.id = shelf_products.shelf_id AND s.tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant users update own shelf_products" ON public.shelf_products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM shelves s WHERE s.id = shelf_products.shelf_id AND s.tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant users delete own shelf_products" ON public.shelf_products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM shelves s WHERE s.id = shelf_products.shelf_id AND s.tenant_id = get_user_tenant_id(auth.uid())));

-- =================== DETECTION_RESULTS ===================
DROP POLICY IF EXISTS "Admins can manage all detection results" ON public.detection_results;
DROP POLICY IF EXISTS "Tenant users can view their detection results" ON public.detection_results;

CREATE POLICY "Admins full access detection_results" ON public.detection_results FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own detection_results" ON public.detection_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM processing_jobs pj WHERE pj.id = detection_results.job_id AND pj.tenant_id = get_user_tenant_id(auth.uid())));

-- =================== MODELS ===================
DROP POLICY IF EXISTS "Admins can manage all models" ON public.models;
DROP POLICY IF EXISTS "Tenant users can view their models" ON public.models;

CREATE POLICY "Admins full access models" ON public.models FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own models" ON public.models FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== PROFILES ===================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- =================== USER_ROLES ===================
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins full access user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =================== NOTIFICATIONS ===================
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;

CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =================== PLANOGRAM_TEMPLATES ===================
DROP POLICY IF EXISTS "Admins can manage all planogram templates" ON public.planogram_templates;
DROP POLICY IF EXISTS "Tenant users can view their planogram templates" ON public.planogram_templates;

CREATE POLICY "Admins full access planogram_templates" ON public.planogram_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own planogram_templates" ON public.planogram_templates FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own planogram_templates" ON public.planogram_templates FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own planogram_templates" ON public.planogram_templates FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users delete own planogram_templates" ON public.planogram_templates FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== PLANOGRAM_VERSIONS ===================
DROP POLICY IF EXISTS "Admins can manage all planogram versions" ON public.planogram_versions;
DROP POLICY IF EXISTS "Tenant users can view their planogram versions" ON public.planogram_versions;

CREATE POLICY "Admins full access planogram_versions" ON public.planogram_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own planogram_versions" ON public.planogram_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM planogram_templates pt WHERE pt.id = planogram_versions.template_id AND pt.tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant users insert own planogram_versions" ON public.planogram_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM planogram_templates pt WHERE pt.id = planogram_versions.template_id AND pt.tenant_id = get_user_tenant_id(auth.uid())));

-- =================== COMPLIANCE_SCANS ===================
DROP POLICY IF EXISTS "Admins can manage all compliance scans" ON public.compliance_scans;
DROP POLICY IF EXISTS "Tenant users can view their compliance scans" ON public.compliance_scans;

CREATE POLICY "Admins full access compliance_scans" ON public.compliance_scans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own compliance_scans" ON public.compliance_scans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM planogram_templates pt WHERE pt.id = compliance_scans.template_id AND pt.tenant_id = get_user_tenant_id(auth.uid())));

CREATE POLICY "Tenant users insert own compliance_scans" ON public.compliance_scans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM planogram_templates pt WHERE pt.id = compliance_scans.template_id AND pt.tenant_id = get_user_tenant_id(auth.uid())));

-- =================== PROCESSING_JOBS ===================
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.processing_jobs;
DROP POLICY IF EXISTS "Tenant users can view their jobs" ON public.processing_jobs;
DROP POLICY IF EXISTS "Tenant users can create jobs" ON public.processing_jobs;

CREATE POLICY "Admins full access processing_jobs" ON public.processing_jobs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own processing_jobs" ON public.processing_jobs FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users insert own processing_jobs" ON public.processing_jobs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== USAGE_METRICS ===================
DROP POLICY IF EXISTS "Admins can view all usage metrics" ON public.usage_metrics;
DROP POLICY IF EXISTS "Tenant admins can view their usage" ON public.usage_metrics;

CREATE POLICY "Admins view all usage_metrics" ON public.usage_metrics FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users view own usage_metrics" ON public.usage_metrics FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- =================== ADMINS ===================
DROP POLICY IF EXISTS "Admins can manage all admins" ON public.admins;
DROP POLICY IF EXISTS "Authenticated users can view admins" ON public.admins;

CREATE POLICY "Admins full access admins" ON public.admins FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth users view admins" ON public.admins FOR SELECT TO authenticated
  USING (true);

-- =================== USER_SHELF_ACCESS ===================
DROP POLICY IF EXISTS "Admins can manage all user shelf access" ON public.user_shelf_access;
DROP POLICY IF EXISTS "Users can view their own shelf access" ON public.user_shelf_access;

CREATE POLICY "Admins full access user_shelf_access" ON public.user_shelf_access FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own shelf_access" ON public.user_shelf_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =================== USER_STORE_ACCESS ===================
DROP POLICY IF EXISTS "Admins can manage all user store access" ON public.user_store_access;
DROP POLICY IF EXISTS "Users can view their own store access" ON public.user_store_access;

CREATE POLICY "Admins full access user_store_access" ON public.user_store_access FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own store_access" ON public.user_store_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =================== SKU_IMAGES ===================
DROP POLICY IF EXISTS "Admins can manage all sku images" ON public.sku_images;
DROP POLICY IF EXISTS "Authenticated users can view sku images" ON public.sku_images;
DROP POLICY IF EXISTS "Authenticated users can insert sku images" ON public.sku_images;

CREATE POLICY "Admins full access sku_images" ON public.sku_images FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth users view sku_images" ON public.sku_images FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth users insert sku_images" ON public.sku_images FOR INSERT TO authenticated
  WITH CHECK (true);
