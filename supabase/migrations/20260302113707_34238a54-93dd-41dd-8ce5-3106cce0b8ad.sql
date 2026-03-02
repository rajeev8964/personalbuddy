
-- 1. Add SELECT policy for customers to view their own booking photos
CREATE POLICY "Clients can view their booking photos"
ON public.booking_photos FOR SELECT
USING (
  booking_id IN (
    SELECT id FROM public.friend_bookings
    WHERE client_email = (auth.jwt() ->> 'email'::text)
  )
);

-- 2. Replace permissive INSERT policy on booking_photos with validated one
DROP POLICY IF EXISTS "Anyone can insert booking photos" ON public.booking_photos;

CREATE POLICY "Validated booking photo insertion"
ON public.booking_photos FOR INSERT
WITH CHECK (
  -- Ensure booking exists and is recent (within 24 hours)
  booking_id IN (
    SELECT id FROM public.friend_bookings
    WHERE created_at > now() - interval '24 hours'
  )
  AND
  -- Validate photo_url is a proper Supabase storage URL
  photo_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/customer-photos/.+'
);

-- 3. Restrict storage upload policy to only allow image content types
DROP POLICY IF EXISTS "Anyone can upload customer photos" ON storage.objects;

CREATE POLICY "Anyone can upload customer photos with restrictions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-photos'
  AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp'))
);

-- 4. Restrict storage SELECT to only buddies/admins (make photos not publicly browsable)
DROP POLICY IF EXISTS "Anyone can view customer photos" ON storage.objects;

CREATE POLICY "Authenticated users can view customer photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-photos'
  AND auth.role() = 'authenticated'
);
