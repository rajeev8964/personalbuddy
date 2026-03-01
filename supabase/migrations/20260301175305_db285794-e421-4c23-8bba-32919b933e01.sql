
-- Create storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-photos', 'customer-photos', true);

-- Allow anyone to upload photos (customers don't need auth)
CREATE POLICY "Anyone can upload customer photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'customer-photos');

-- Anyone can view customer photos  
CREATE POLICY "Anyone can view customer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-photos');

-- Buddies can delete photos from their bookings
CREATE POLICY "Authenticated users can delete customer photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'customer-photos' AND auth.role() = 'authenticated');

-- Create table to link photos to bookings
CREATE TABLE public.booking_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.friend_bookings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (customers upload during booking without auth)
CREATE POLICY "Anyone can insert booking photos"
ON public.booking_photos FOR INSERT
WITH CHECK (true);

-- Buddies can view photos for their bookings
CREATE POLICY "Buddies can view their booking photos"
ON public.booking_photos FOR SELECT
USING (
  booking_id IN (
    SELECT fb.id FROM friend_bookings fb
    JOIN friend_profiles fp ON fb.friend_id = fp.id
    WHERE fp.user_id = auth.uid()
  )
);

-- Admins can view all photos
CREATE POLICY "Admins can view all booking photos"
ON public.booking_photos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
