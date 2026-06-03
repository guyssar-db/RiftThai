-- Add banned column to app_users
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

-- Add hidden column to user_decks for moderation
ALTER TABLE public.user_decks ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
