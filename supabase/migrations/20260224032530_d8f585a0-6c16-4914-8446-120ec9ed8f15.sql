-- Drop the foreign key constraint on datasets.tenant_id since tenants live on the custom backend
ALTER TABLE public.datasets DROP CONSTRAINT IF EXISTS datasets_tenant_id_fkey;