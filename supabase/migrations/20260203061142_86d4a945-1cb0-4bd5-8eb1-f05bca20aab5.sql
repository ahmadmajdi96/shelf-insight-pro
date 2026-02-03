-- Create shelves table
CREATE TABLE public.shelves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  description TEXT,
  location_in_store TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shelf_products junction table for many-to-many relationship
CREATE TABLE public.shelf_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  expected_facings INTEGER DEFAULT 1,
  position_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shelf_id, sku_id)
);

-- Create shelf_images table for image history
CREATE TABLE public.shelf_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  detection_result JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelf_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelf_images ENABLE ROW LEVEL SECURITY;

-- Shelves policies
CREATE POLICY "Users can view shelves in their tenant"
ON public.shelves FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create shelves in their tenant"
ON public.shelves FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update shelves in their tenant"
ON public.shelves FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete shelves in their tenant"
ON public.shelves FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Shelf products policies
CREATE POLICY "Users can view shelf products"
ON public.shelf_products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shelves s 
    WHERE s.id = shelf_id 
    AND (s.tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can manage shelf products"
ON public.shelf_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shelves s 
    WHERE s.id = shelf_id 
    AND (s.tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Shelf images policies
CREATE POLICY "Users can view shelf images"
ON public.shelf_images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shelves s 
    WHERE s.id = shelf_id 
    AND (s.tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can manage shelf images"
ON public.shelf_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shelves s 
    WHERE s.id = shelf_id 
    AND (s.tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_shelves_updated_at
BEFORE UPDATE ON public.shelves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();