-- Add sideboard_entries column to public.user_decks table
ALTER TABLE public.user_decks 
ADD COLUMN IF NOT EXISTS sideboard_entries jsonb not null default '[]'::jsonb;
