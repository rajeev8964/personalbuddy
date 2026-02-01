-- Add approval status column to friend_profiles
ALTER TABLE public.friend_profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friend_profiles_user_id ON public.friend_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_profiles_is_approved ON public.friend_profiles(is_approved);

-- Update the public view to only show approved profiles
DROP VIEW IF EXISTS public.friend_profiles_public;
CREATE VIEW public.friend_profiles_public AS
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

-- Add RLS policy to allow authenticated users to create their own profile
CREATE POLICY "Users can create their own profile"
ON public.friend_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own profiles (even if not approved)
CREATE POLICY "Users can view their own profile"
ON public.friend_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.friend_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_approved = false);

-- Allow users to delete their own profile (only if not approved)
CREATE POLICY "Users can delete their own unapproved profile"
ON public.friend_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND is_approved = false);