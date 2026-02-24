
-- Add tenant_id to datasets
ALTER TABLE public.datasets ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
