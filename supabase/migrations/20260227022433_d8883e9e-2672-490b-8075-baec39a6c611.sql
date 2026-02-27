
-- Update has_role to treat 'owner' as superset of all roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'owner')
  )
$$;

-- Add admin_id to profiles for linking auth users to admin records
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL;
