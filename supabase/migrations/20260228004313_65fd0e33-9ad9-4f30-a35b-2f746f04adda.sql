
-- Add tenant-scoped SELECT policies for tenant_admin and tenant_user roles

-- stores: tenant users can view their own tenant's stores
CREATE POLICY "Tenant users can view their stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- shelves: tenant users can view their own tenant's shelves
CREATE POLICY "Tenant users can view their shelves"
  ON public.shelves FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- skus: tenant users can view their own tenant's SKUs
CREATE POLICY "Tenant users can view their skus"
  ON public.skus FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- product_categories: tenant users can view their own tenant's categories
CREATE POLICY "Tenant users can view their categories"
  ON public.product_categories FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- detections: tenant users can view their own tenant's detections
CREATE POLICY "Tenant users can view their detections"
  ON public.detections FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- shelf_images: tenant users can view shelf images for their tenant's shelves
CREATE POLICY "Tenant users can view their shelf images"
  ON public.shelf_images FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shelves s
    WHERE s.id = shelf_images.shelf_id
    AND s.tenant_id = get_user_tenant_id(auth.uid())
  ));

-- shelf_products: tenant users can view shelf products for their tenant's shelves
CREATE POLICY "Tenant users can view their shelf products"
  ON public.shelf_products FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shelves s
    WHERE s.id = shelf_products.shelf_id
    AND s.tenant_id = get_user_tenant_id(auth.uid())
  ));

-- detection_results: tenant users can view detection results for their tenant's jobs
CREATE POLICY "Tenant users can view their detection results"
  ON public.detection_results FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.processing_jobs pj
    WHERE pj.id = detection_results.job_id
    AND pj.tenant_id = get_user_tenant_id(auth.uid())
  ));

-- models: tenant users can view their own tenant's models
CREATE POLICY "Tenant users can view their models"
  ON public.models FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
