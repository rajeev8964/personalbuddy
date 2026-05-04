
ALTER TABLE public.friend_profiles
  ADD COLUMN IF NOT EXISTS action_token_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days');

ALTER TABLE public.friend_bookings
  ADD COLUMN IF NOT EXISTS action_token_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days');

UPDATE public.friend_profiles
  SET action_token_expires_at = now() + INTERVAL '7 days'
  WHERE action_token_expires_at IS NULL;

UPDATE public.friend_bookings
  SET action_token_expires_at = now() + INTERVAL '7 days'
  WHERE action_token_expires_at IS NULL;
