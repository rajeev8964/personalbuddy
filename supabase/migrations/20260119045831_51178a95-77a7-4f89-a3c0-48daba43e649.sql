-- SECURITY FIX: Remove public access to friend_bookings
-- Drop the overly permissive policy that exposes customer PII
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.friend_bookings;

-- Add policy for authenticated users to view ONLY their own bookings via JWT email
CREATE POLICY "Users can view own bookings"
ON public.friend_bookings
FOR SELECT
USING (client_email = auth.jwt()->>'email');

-- SECURITY FIX: Create a public view for friend_profiles that excludes sensitive email
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
FROM public.friend_profiles;
-- NOTE: email is intentionally excluded from this view to protect privacy

-- Drop the overly permissive SELECT policy on friend_profiles
DROP POLICY IF EXISTS "Anyone can view available profiles" ON public.friend_profiles;

-- Create restrictive policy: admins can SELECT, everyone else denied direct table access
CREATE POLICY "Admins can view all profiles"
ON public.friend_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.friend_profiles_public TO anon, authenticated;