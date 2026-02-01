-- Fix Issue 1: Remove email from public view to prevent exposure
DROP VIEW IF EXISTS public.friend_profiles_public;
CREATE VIEW public.friend_profiles_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  age,
  education,
  weight,
  height,
  hobbies,
  bio_data,
  profile_picture_url,
  status,
  created_at,
  updated_at
  -- email is intentionally excluded from public view
FROM public.friend_profiles
WHERE is_approved = true AND status = 'available';

-- Fix Issue 2: Update booking INSERT policy to add validation
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.friend_bookings;

-- Create a more restrictive INSERT policy with validation
CREATE POLICY "Validated booking creation"
ON public.friend_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Ensure required fields are provided and valid
  client_name IS NOT NULL AND length(trim(client_name)) > 0 AND
  client_email IS NOT NULL AND client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  client_phone IS NOT NULL AND length(trim(client_phone)) >= 10 AND
  friend_id IS NOT NULL AND
  booking_date >= CURRENT_DATE AND
  duration >= 1 AND duration <= 8
);