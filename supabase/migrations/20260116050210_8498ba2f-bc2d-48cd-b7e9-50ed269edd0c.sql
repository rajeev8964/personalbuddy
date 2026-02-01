-- Create function to update timestamps first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for profile status
CREATE TYPE public.profile_status AS ENUM ('available', 'booked');

-- Create friend_profiles table
CREATE TABLE public.friend_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER NOT NULL,
  education TEXT NOT NULL,
  weight TEXT NOT NULL,
  height TEXT NOT NULL,
  hobbies TEXT NOT NULL,
  bio_data TEXT NOT NULL,
  profile_picture_url TEXT,
  status profile_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.friend_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  friend_id UUID NOT NULL REFERENCES public.friend_profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  activity TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for profiles (anyone can view available friends)
CREATE POLICY "Anyone can view available profiles"
ON public.friend_profiles
FOR SELECT
USING (true);

-- Public insert for bookings (anyone can make a booking)
CREATE POLICY "Anyone can create bookings"
ON public.friend_bookings
FOR INSERT
WITH CHECK (true);

-- Public read for bookings by email
CREATE POLICY "Anyone can view bookings"
ON public.friend_bookings
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_friend_profiles_updated_at
BEFORE UPDATE ON public.friend_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample profile data
INSERT INTO public.friend_profiles (full_name, email, age, education, weight, height, hobbies, bio_data, profile_picture_url, status)
VALUES 
  ('Buddy', 'rriscrazy@gmail.com', 21, 'B.Tech Computer Science', '70kg', '5''11"', 'Gaming, Cricket, Traveling, Music', 'Hey there! I''m your friendly companion ready to make your day special. Whether it''s a casual hangout, gaming session, or just someone to talk to, I''m here for you!', NULL, 'available');