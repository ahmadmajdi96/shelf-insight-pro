-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'tenant_admin', 'tenant_user');

-- Create enum for training status
CREATE TYPE public.training_status AS ENUM ('pending', 'training', 'completed', 'failed');

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  max_skus INTEGER NOT NULL DEFAULT 50,
  max_images_per_month INTEGER NOT NULL DEFAULT 1000,
  max_images_per_week INTEGER NOT NULL DEFAULT 300,
  max_images_per_year INTEGER NOT NULL DEFAULT 10000,
  processed_images_this_month INTEGER NOT NULL DEFAULT 0,
  processed_images_this_week INTEGER NOT NULL DEFAULT 0,
  processed_images_this_year INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skus table
CREATE TABLE public.skus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  barcode TEXT,
  training_status training_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sku_images table for training images
CREATE TABLE public.sku_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id UUID REFERENCES public.skus(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create detections table
CREATE TABLE public.detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  annotated_image_url TEXT,
  detection_result JSONB,
  share_of_shelf_percentage DECIMAL(5,2),
  total_facings INTEGER DEFAULT 0,
  detected_skus INTEGER DEFAULT 0,
  missing_skus INTEGER DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id
$$;

-- RLS Policies for tenants
CREATE POLICY "Admins can view all tenants"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tenants"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant users can view their own tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for product_categories
CREATE POLICY "Tenant users can view their categories"
  ON public.product_categories FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage their categories"
  ON public.product_categories FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid()) 
    AND (public.has_role(auth.uid(), 'tenant_admin') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can view all categories"
  ON public.product_categories FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for skus
CREATE POLICY "Tenant users can view their skus"
  ON public.skus FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage their skus"
  ON public.skus FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid()) 
    AND (public.has_role(auth.uid(), 'tenant_admin') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can view all skus"
  ON public.skus FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sku_images
CREATE POLICY "Tenant users can view their sku images"
  ON public.sku_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.skus 
      WHERE skus.id = sku_images.sku_id 
      AND skus.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  );

CREATE POLICY "Tenant admins can manage their sku images"
  ON public.sku_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.skus 
      WHERE skus.id = sku_images.sku_id 
      AND skus.tenant_id = public.get_user_tenant_id(auth.uid())
    )
    AND (public.has_role(auth.uid(), 'tenant_admin') OR public.has_role(auth.uid(), 'admin'))
  );

-- RLS Policies for stores
CREATE POLICY "Tenant users can view their stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage their stores"
  ON public.stores FOR ALL
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid()) 
    AND (public.has_role(auth.uid(), 'tenant_admin') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can view all stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for detections
CREATE POLICY "Tenant users can view their detections"
  ON public.detections FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can insert detections"
  ON public.detections FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can view all detections"
  ON public.detections FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skus_updated_at BEFORE UPDATE ON public.skus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for shelf images
INSERT INTO storage.buckets (id, name, public) VALUES ('shelf-images', 'shelf-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('sku-training-images', 'sku-training-images', true);

-- Storage policies for shelf-images
CREATE POLICY "Authenticated users can upload shelf images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shelf-images');

CREATE POLICY "Anyone can view shelf images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'shelf-images');

-- Storage policies for sku-training-images
CREATE POLICY "Authenticated users can upload sku training images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sku-training-images');

CREATE POLICY "Anyone can view sku training images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'sku-training-images');