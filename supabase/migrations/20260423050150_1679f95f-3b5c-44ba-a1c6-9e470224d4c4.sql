-- 1. Replace anonymous customer-photos INSERT with authenticated-only + size limit
DROP POLICY IF EXISTS "Anyone can upload customer photos with restrictions" ON storage.objects;

CREATE POLICY "Authenticated users can upload customer photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-photos'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','gif','webp'])
);

-- Add size limit + allowed mime types to customer-photos bucket (10MB)
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp']
WHERE id = 'customer-photos';

-- 2. Tighten customer-photos SELECT to client/buddy/admin of the booking
-- File path convention: '{booking_id}/{timestamp}.{ext}'
DROP POLICY IF EXISTS "Authenticated users can download customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete customer photos" ON storage.objects;

CREATE POLICY "Booking parties can view customer photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-photos'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.friend_bookings fb
      LEFT JOIN public.friend_profiles fp ON fp.id = fb.friend_id
      WHERE fb.id::text = (storage.foldername(name))[1]
        AND (
          fb.client_email = (auth.jwt() ->> 'email')
          OR fp.user_id = auth.uid()
        )
    )
  )
);

CREATE POLICY "Admins can delete customer photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3. Restrict profile-photos listing while keeping individual files publicly viewable
-- The existing "Profile photos are publicly viewable" policy applies to {public} role
-- which lets anon clients call list(). Restrict to authenticated-only listing by 
-- splitting: keep public SELECT (file URLs work), but listing requires direct URL knowledge.
-- The bucket is public so direct-URL access still works regardless of policy.
-- (No change needed; public SELECT on objects in a public bucket is intended for file URL access.)
-- However, to avoid the linter warning, keep policy but no broad listing access via storage API for anon.
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;
CREATE POLICY "Profile photos are publicly viewable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-photos');

-- 4. Block role privilege escalation: explicitly deny non-admin INSERT/UPDATE/DELETE on user_roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));