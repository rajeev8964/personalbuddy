-- Restrict friend_profiles base table SELECT to owners and admins only.
-- Public/authenticated browsing must go through friend_profiles_public view (no email column).
DROP POLICY IF EXISTS "Authenticated can view approved profiles" ON public.friend_profiles;

-- Owners and admins already have explicit SELECT policies:
-- "Users can view their own profile" and "Admins can view all profiles".
-- No further policy is needed; non-owners use the public view which excludes email.