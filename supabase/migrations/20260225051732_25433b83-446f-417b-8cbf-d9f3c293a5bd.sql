
-- Add admin_id column to tenants table
ALTER TABLE public.tenants ADD COLUMN admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_tenants_admin_id ON public.tenants(admin_id);
