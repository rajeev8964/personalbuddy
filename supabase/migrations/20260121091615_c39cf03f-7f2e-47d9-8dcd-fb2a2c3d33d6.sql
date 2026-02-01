-- Remove the policy that exposes email addresses in friend_profiles
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.friend_profiles;

-- The public view (friend_profiles_public) already excludes email
-- Users should query the view, not the base table directly
-- Add policy to allow viewing through the view (which excludes email)
-- The security_invoker view means RLS applies, so we need a policy for the base table
-- that only allows access to non-sensitive columns

-- Create a function to check if access is through the public view
-- Since we can't easily restrict columns in RLS, the view approach is the solution
-- The view already excludes email, we just need to ensure base table isn't directly queryable by public

-- For public/anon users, deny direct access to friend_profiles base table
-- They must use the friend_profiles_public view which excludes email
CREATE POLICY "Public users access via view only"
ON public.friend_profiles
FOR SELECT
TO anon
USING (false);  -- Anon users cannot directly query base table

-- Authenticated non-admin users can only see their own profile or approved ones through view
-- But we need to allow the view to work, so we create a policy that allows
-- viewing approved profiles but the view filters what columns are returned
CREATE POLICY "Authenticated can view approved profiles"
ON public.friend_profiles
FOR SELECT
TO authenticated
USING (
  -- Own profile
  auth.uid() = user_id OR
  -- Approved profiles (view will filter columns)
  (is_approved = true AND status = 'available'::profile_status) OR
  -- Admin access
  has_role(auth.uid(), 'admin'::app_role)
);