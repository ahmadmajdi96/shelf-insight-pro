
-- Planogram Templates table
CREATE TABLE public.planogram_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  shelf_id uuid REFERENCES public.shelves(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.planogram_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all planogram templates"
  ON public.planogram_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users can view their planogram templates"
  ON public.planogram_templates FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Planogram Versions table (version history)
CREATE TABLE public.planogram_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.planogram_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  change_notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);

ALTER TABLE public.planogram_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all planogram versions"
  ON public.planogram_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users can view their planogram versions"
  ON public.planogram_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.planogram_templates pt 
    WHERE pt.id = template_id AND pt.tenant_id = get_user_tenant_id(auth.uid())
  ));

-- Compliance Scans table
CREATE TABLE public.compliance_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.planogram_templates(id) ON DELETE CASCADE,
  shelf_image_id uuid REFERENCES public.shelf_images(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  compliance_score numeric NOT NULL DEFAULT 0,
  total_expected integer NOT NULL DEFAULT 0,
  total_found integer NOT NULL DEFAULT 0,
  total_missing integer NOT NULL DEFAULT 0,
  total_extra integer NOT NULL DEFAULT 0,
  details jsonb DEFAULT '[]'::jsonb,
  scanned_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all compliance scans"
  ON public.compliance_scans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant users can view their compliance scans"
  ON public.compliance_scans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.planogram_templates pt 
    WHERE pt.id = template_id AND pt.tenant_id = get_user_tenant_id(auth.uid())
  ));

-- Triggers for updated_at
CREATE TRIGGER update_planogram_templates_updated_at
  BEFORE UPDATE ON public.planogram_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for compliance_scans
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_scans;
