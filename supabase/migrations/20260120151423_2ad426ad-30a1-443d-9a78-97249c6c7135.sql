-- Create rate limiting table for bookings
CREATE TABLE IF NOT EXISTS public.booking_rate_limits (
  client_email TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on rate limits table
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to prevent booking spam - database-level rate limiting
CREATE OR REPLACE FUNCTION public.prevent_booking_spam()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
  window_start_time TIMESTAMPTZ;
BEGIN
  -- Get current rate limit record
  SELECT request_count, window_start 
  INTO recent_count, window_start_time
  FROM public.booking_rate_limits
  WHERE client_email = NEW.client_email;
  
  -- If no record or window expired (1 hour), reset
  IF recent_count IS NULL OR NOW() > window_start_time + INTERVAL '1 hour' THEN
    INSERT INTO public.booking_rate_limits (client_email, request_count, window_start)
    VALUES (NEW.client_email, 1, NOW())
    ON CONFLICT (client_email) 
    DO UPDATE SET request_count = 1, window_start = NOW();
    RETURN NEW;
  END IF;
  
  -- Check if rate limit exceeded (3 per hour)
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Too many booking requests from this email. Please try again later.';
  END IF;
  
  -- Increment counter
  UPDATE public.booking_rate_limits
  SET request_count = request_count + 1
  WHERE client_email = NEW.client_email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for spam prevention on bookings
CREATE TRIGGER check_booking_spam
BEFORE INSERT ON public.friend_bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_booking_spam();

-- Add validation constraints to friend_bookings
ALTER TABLE public.friend_bookings
ADD CONSTRAINT valid_client_email CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT valid_client_phone CHECK (length(client_phone) >= 10),
ADD CONSTRAINT valid_client_name CHECK (length(client_name) >= 2);

-- Add explicit RLS policy on friend_profiles_public view for clarity
-- Note: friend_profiles_public is a VIEW, so we need to ensure the underlying table has proper security
-- The view already excludes the email field, which is good

-- Create a function to clean up old rate limit records (maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.booking_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;