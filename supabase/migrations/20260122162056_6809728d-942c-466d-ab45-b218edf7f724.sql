-- Allow buddies to view bookings made for them via their profile's user_id
CREATE POLICY "Buddies can view their bookings"
ON public.friend_bookings
FOR SELECT
TO authenticated
USING (
  friend_id IN (
    SELECT id FROM public.friend_profiles WHERE user_id = auth.uid()
  )
);