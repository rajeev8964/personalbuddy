
-- =========================================================
-- 1. Link bookings to auth user (preferred over email claim)
-- =========================================================
ALTER TABLE public.friend_bookings
  ADD COLUMN IF NOT EXISTS client_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_friend_bookings_client_user_id
  ON public.friend_bookings(client_user_id);

-- Replace fragile email-claim policy with auth.uid()-first policy
DROP POLICY IF EXISTS "Users can view own bookings" ON public.friend_bookings;

CREATE POLICY "Users can view own bookings"
ON public.friend_bookings
FOR SELECT
TO authenticated
USING (
  client_user_id = auth.uid()
  OR (client_user_id IS NULL AND client_email = (auth.jwt() ->> 'email'))
);

-- =========================================================
-- 2. booking_photos: restrict INSERT to parties of the booking
-- =========================================================
DROP POLICY IF EXISTS "Validated booking photo insertion" ON public.booking_photos;

CREATE POLICY "Booking parties can insert photos"
ON public.booking_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.friend_bookings b
    LEFT JOIN public.friend_profiles fp ON fp.id = b.friend_id
    WHERE b.id = booking_photos.booking_id
      AND b.created_at > now() - interval '24 hours'
      AND (
        b.client_user_id = auth.uid()
        OR (b.client_user_id IS NULL AND b.client_email = (auth.jwt() ->> 'email'))
        OR fp.user_id = auth.uid()
      )
  )
);

-- Allow buddies and admins to delete booking photos
CREATE POLICY "Buddies and admins can delete booking photos"
ON public.booking_photos
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.friend_bookings b
    JOIN public.friend_profiles fp ON fp.id = b.friend_id
    WHERE b.id = booking_photos.booking_id
      AND fp.user_id = auth.uid()
  )
);

-- =========================================================
-- 3. customer-photos storage: ownership-checked uploads & deletes
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can upload customer photos" ON storage.objects;

CREATE POLICY "Booking parties can upload customer photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-photos'
  AND lower(right(name, 4)) IN ('.jpg', '.png', '.jpeg', '.webp', '.gif')
  AND EXISTS (
    SELECT 1
    FROM public.friend_bookings b
    LEFT JOIN public.friend_profiles fp ON fp.id = b.friend_id
    WHERE b.id::text = (storage.foldername(name))[1]
      AND (
        b.client_user_id = auth.uid()
        OR (b.client_user_id IS NULL AND b.client_email = (auth.jwt() ->> 'email'))
        OR fp.user_id = auth.uid()
      )
  )
);

CREATE POLICY "Buddies can delete their customer photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-photos'
  AND EXISTS (
    SELECT 1
    FROM public.friend_bookings b
    JOIN public.friend_profiles fp ON fp.id = b.friend_id
    WHERE b.id::text = (storage.foldername(name))[1]
      AND fp.user_id = auth.uid()
  )
);

-- =========================================================
-- 4. user_roles self-read
-- =========================================================
CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- 5. Auto-populate client_user_id on booking insert when logged in
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_booking_client_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_user_id IS NULL THEN
    NEW.client_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_client_user_id ON public.friend_bookings;
CREATE TRIGGER trg_set_booking_client_user_id
BEFORE INSERT ON public.friend_bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_client_user_id();
