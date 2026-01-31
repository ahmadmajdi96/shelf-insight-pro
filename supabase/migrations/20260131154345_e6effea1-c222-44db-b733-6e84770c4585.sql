-- Add status to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'inactive'));

-- Create models table for training versioning
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'training', 'active', 'inactive', 'failed')),
  accuracy NUMERIC,
  trained_date TIMESTAMP WITH TIME ZONE,
  model_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processing_jobs table
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  annotated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create detection_results table (linked to processing jobs)
CREATE TABLE public.detection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.processing_jobs(id) ON DELETE CASCADE,
  sku_id UUID REFERENCES public.skus(id) ON DELETE SET NULL,
  bounding_boxes JSONB,
  facings_count INTEGER NOT NULL DEFAULT 0,
  share_of_shelf NUMERIC,
  confidence NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage_metrics table for quota tracking
CREATE TABLE public.usage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  images_processed INTEGER NOT NULL DEFAULT 0,
  training_jobs INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, period_type, period_start)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('processing_complete', 'training_complete', 'quota_warning', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add last_login to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Models policies
CREATE POLICY "Admins can view all models" ON public.models FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant users can view their models" ON public.models FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage their models" ON public.models FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()) 
  AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'admin')));

-- Processing jobs policies
CREATE POLICY "Admins can view all jobs" ON public.processing_jobs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant users can view their jobs" ON public.processing_jobs FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users can create jobs" ON public.processing_jobs FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Detection results policies
CREATE POLICY "Tenant users can view their detection results" ON public.detection_results FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.processing_jobs pj 
  WHERE pj.id = detection_results.job_id 
  AND pj.tenant_id = get_user_tenant_id(auth.uid())
));

CREATE POLICY "Admins can view all detection results" ON public.detection_results FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Usage metrics policies
CREATE POLICY "Admins can view all usage metrics" ON public.usage_metrics FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant admins can view their usage" ON public.usage_metrics FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_models_tenant_id ON public.models(tenant_id);
CREATE INDEX idx_models_status ON public.models(status);
CREATE INDEX idx_processing_jobs_tenant_id ON public.processing_jobs(tenant_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX idx_detection_results_job_id ON public.detection_results(job_id);
CREATE INDEX idx_usage_metrics_tenant_period ON public.usage_metrics(tenant_id, period_type, period_start);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Add updated_at triggers
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON public.usage_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment usage metrics
CREATE OR REPLACE FUNCTION public.increment_usage_metric(
  _tenant_id UUID,
  _period_type TEXT,
  _images_count INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period_start DATE;
BEGIN
  -- Calculate period start based on type
  CASE _period_type
    WHEN 'daily' THEN _period_start := CURRENT_DATE;
    WHEN 'weekly' THEN _period_start := date_trunc('week', CURRENT_DATE)::DATE;
    WHEN 'monthly' THEN _period_start := date_trunc('month', CURRENT_DATE)::DATE;
    WHEN 'yearly' THEN _period_start := date_trunc('year', CURRENT_DATE)::DATE;
  END CASE;
  
  INSERT INTO public.usage_metrics (tenant_id, period_type, period_start, images_processed)
  VALUES (_tenant_id, _period_type, _period_start, _images_count)
  ON CONFLICT (tenant_id, period_type, period_start)
  DO UPDATE SET 
    images_processed = usage_metrics.images_processed + _images_count,
    updated_at = now();
END;
$$;

-- Function to check tenant quota
CREATE OR REPLACE FUNCTION public.check_tenant_quota(_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant RECORD;
  _monthly_usage INTEGER;
  _weekly_usage INTEGER;
  _yearly_usage INTEGER;
  _sku_count INTEGER;
BEGIN
  SELECT * INTO _tenant FROM public.tenants WHERE id = _tenant_id;
  
  SELECT COALESCE(SUM(images_processed), 0) INTO _monthly_usage
  FROM public.usage_metrics
  WHERE tenant_id = _tenant_id 
    AND period_type = 'monthly' 
    AND period_start = date_trunc('month', CURRENT_DATE)::DATE;
    
  SELECT COALESCE(SUM(images_processed), 0) INTO _weekly_usage
  FROM public.usage_metrics
  WHERE tenant_id = _tenant_id 
    AND period_type = 'weekly' 
    AND period_start = date_trunc('week', CURRENT_DATE)::DATE;
    
  SELECT COALESCE(SUM(images_processed), 0) INTO _yearly_usage
  FROM public.usage_metrics
  WHERE tenant_id = _tenant_id 
    AND period_type = 'yearly' 
    AND period_start = date_trunc('year', CURRENT_DATE)::DATE;
    
  SELECT COUNT(*) INTO _sku_count FROM public.skus WHERE tenant_id = _tenant_id AND is_active = true;
  
  RETURN jsonb_build_object(
    'canProcess', _tenant.status = 'active' 
      AND _monthly_usage < _tenant.max_images_per_month
      AND _weekly_usage < _tenant.max_images_per_week
      AND _yearly_usage < _tenant.max_images_per_year,
    'canAddSku', _sku_count < _tenant.max_skus,
    'skuCount', _sku_count,
    'skuLimit', _tenant.max_skus,
    'monthlyUsage', _monthly_usage,
    'monthlyLimit', _tenant.max_images_per_month,
    'weeklyUsage', _weekly_usage,
    'weeklyLimit', _tenant.max_images_per_week,
    'yearlyUsage', _yearly_usage,
    'yearlyLimit', _tenant.max_images_per_year,
    'status', _tenant.status
  );
END;
$$;