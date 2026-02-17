
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create user_store_access table (simple access control - link users to stores)
CREATE TABLE public.user_store_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

ALTER TABLE public.user_store_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all user store access"
ON public.user_store_access FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own store access"
ON public.user_store_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create user_shelf_access table (link users to shelves/planograms)
CREATE TABLE public.user_shelf_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shelf_id uuid NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, shelf_id)
);

ALTER TABLE public.user_shelf_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all user shelf access"
ON public.user_shelf_access FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own shelf access"
ON public.user_shelf_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add INSERT policy for notifications (so system can create notifications)
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy for notifications
CREATE POLICY "Users can delete their notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
