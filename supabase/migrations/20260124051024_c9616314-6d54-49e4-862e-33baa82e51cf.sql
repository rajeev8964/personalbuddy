-- Allow buddies to update bookings for their own profile
CREATE POLICY "Buddies can update their bookings"
ON public.friend_bookings
FOR UPDATE
USING (
  friend_id IN (
    SELECT id FROM friend_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  friend_id IN (
    SELECT id FROM friend_profiles WHERE user_id = auth.uid()
  )
);