-- Ensure RLS is enabled on booking_rate_limits (should already be)
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner to ensure complete lockdown
ALTER TABLE public.booking_rate_limits FORCE ROW LEVEL SECURITY;

-- Add explicit deny policy for any direct access attempts
-- The table is only accessed by SECURITY DEFINER trigger function
CREATE POLICY "No direct access to rate limits"
ON public.booking_rate_limits
FOR ALL
TO anon, authenticated
USING (false);