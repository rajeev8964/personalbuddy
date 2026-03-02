-- Make customer-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'customer-photos';

-- Drop the old INSERT policy that validates public URL pattern
DROP POLICY IF EXISTS "Validated booking photo insertion" ON public.booking_photos;

-- Create new INSERT policy that accepts the storage path instead of full URL
CREATE POLICY "Validated booking photo insertion"
ON public.booking_photos
FOR INSERT
TO public
WITH CHECK (
  booking_id IN (
    SELECT id FROM friend_bookings
    WHERE created_at > (now() - interval '24 hours')
  )
  AND photo_url ~ '^[a-f0-9-]+/[0-9]+\.(jpg|jpeg|png|gif|webp)$'
);

-- Update storage policies for private bucket access
DROP POLICY IF EXISTS "Authenticated users can view customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Customer photos are publicly accessible" ON storage.objects;

-- Allow authenticated users to download from customer-photos (needed for signed URLs)
CREATE POLICY "Authenticated users can download customer photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'customer-photos');