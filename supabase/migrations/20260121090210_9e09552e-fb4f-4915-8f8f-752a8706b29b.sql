-- Drop and recreate view with security_invoker to fix SECURITY DEFINER issue
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
FROM public.friend_profiles
WHERE is_approved = true AND status = 'available';

-- Add a policy to allow everyone to view approved profiles through the view
CREATE POLICY "Anyone can view approved profiles"
ON public.friend_profiles
FOR SELECT
TO anon, authenticated
USING (is_approved = true AND status = 'available'::profile_status);