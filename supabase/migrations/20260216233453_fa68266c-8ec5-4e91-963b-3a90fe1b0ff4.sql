
-- Add username and password columns to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS password text;

-- Remove stores tenant_id foreign key requirement since stores will be under tenants
-- (stores already have tenant_id, this is fine)

-- Add delete policy for tenants (admins only)
CREATE POLICY "Admins can delete tenants"
ON public.tenants
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for stores (full CRUD for admins)
DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Tenant admins can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Tenant users can view their stores" ON public.stores;

CREATE POLICY "Admins can manage all stores"
ON public.stores
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin full CRUD on categories
DROP POLICY IF EXISTS "Admins can view all categories" ON public.product_categories;
DROP POLICY IF EXISTS "Tenant admins can manage their categories" ON public.product_categories;
DROP POLICY IF EXISTS "Tenant users can view their categories" ON public.product_categories;

CREATE POLICY "Admins can manage all categories"
ON public.product_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin full CRUD on SKUs
DROP POLICY IF EXISTS "Admins can view all skus" ON public.skus;
DROP POLICY IF EXISTS "Tenant admins can manage their skus" ON public.skus;
DROP POLICY IF EXISTS "Tenant users can view their skus" ON public.skus;

CREATE POLICY "Admins can manage all skus"
ON public.skus
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin full CRUD on shelves  
DROP POLICY IF EXISTS "Users can create shelves in their tenant" ON public.shelves;
DROP POLICY IF EXISTS "Users can delete shelves in their tenant" ON public.shelves;
DROP POLICY IF EXISTS "Users can update shelves in their tenant" ON public.shelves;
DROP POLICY IF EXISTS "Users can view shelves in their tenant" ON public.shelves;

CREATE POLICY "Admins can manage all shelves"
ON public.shelves
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin full CRUD on shelf_products
DROP POLICY IF EXISTS "Users can manage shelf products" ON public.shelf_products;
DROP POLICY IF EXISTS "Users can view shelf products" ON public.shelf_products;

CREATE POLICY "Admins can manage all shelf products"
ON public.shelf_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin full CRUD on shelf_images
DROP POLICY IF EXISTS "Users can manage shelf images" ON public.shelf_images;
DROP POLICY IF EXISTS "Users can view shelf images" ON public.shelf_images;

CREATE POLICY "Admins can manage all shelf images"
ON public.shelf_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin manage sku_images
DROP POLICY IF EXISTS "Tenant admins can manage their sku images" ON public.sku_images;
DROP POLICY IF EXISTS "Tenant users can view their sku images" ON public.sku_images;

CREATE POLICY "Admins can manage all sku images"
ON public.sku_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin manage detections
DROP POLICY IF EXISTS "Admins can view all detections" ON public.detections;
DROP POLICY IF EXISTS "Tenant users can insert detections" ON public.detections;
DROP POLICY IF EXISTS "Tenant users can view their detections" ON public.detections;

CREATE POLICY "Admins can manage all detections"
ON public.detections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin manage detection_results
DROP POLICY IF EXISTS "Admins can view all detection results" ON public.detection_results;
DROP POLICY IF EXISTS "Tenant users can view their detection results" ON public.detection_results;

CREATE POLICY "Admins can manage all detection results"
ON public.detection_results
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin manage models
DROP POLICY IF EXISTS "Admins can view all models" ON public.models;
DROP POLICY IF EXISTS "Tenant admins can manage their models" ON public.models;
DROP POLICY IF EXISTS "Tenant users can view their models" ON public.models;

CREATE POLICY "Admins can manage all models"
ON public.models
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
