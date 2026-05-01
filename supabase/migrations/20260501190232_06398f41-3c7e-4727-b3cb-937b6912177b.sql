
ALTER TABLE public.friend_profiles
  ADD COLUMN IF NOT EXISTS action_token uuid UNIQUE DEFAULT gen_random_uuid();

UPDATE public.friend_profiles SET action_token = gen_random_uuid() WHERE action_token IS NULL;
ALTER TABLE public.friend_profiles ALTER COLUMN action_token SET NOT NULL;

ALTER TABLE public.friend_bookings
  ADD COLUMN IF NOT EXISTS action_token uuid UNIQUE DEFAULT gen_random_uuid();

UPDATE public.friend_bookings SET action_token = gen_random_uuid() WHERE action_token IS NULL;
ALTER TABLE public.friend_bookings ALTER COLUMN action_token SET NOT NULL;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.friend_bookings;
CREATE POLICY "Users can view own bookings"
ON public.friend_bookings
FOR SELECT
TO authenticated
USING (client_user_id IS NOT NULL AND client_user_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their booking photos" ON public.booking_photos;
CREATE POLICY "Clients can view their booking photos"
ON public.booking_photos
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT id FROM public.friend_bookings
    WHERE client_user_id IS NOT NULL AND client_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block non-admin role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "Block non-admin role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Block non-admin role deletes" ON public.user_roles;

CREATE POLICY "Admins insert roles"
ON public.user_roles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles"
ON public.user_roles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
ON public.user_roles
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Block non-admin role inserts"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Block non-admin role updates"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Block non-admin role deletes"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
