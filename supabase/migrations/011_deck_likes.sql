-- Create deck_likes table
create table if not exists public.deck_likes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.app_users(id) on delete cascade,
	deck_id uuid not null references public.user_decks(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (user_id, deck_id)
);

-- Add likes_count to user_decks if it doesn't exist
alter table public.user_decks
	add column if not exists likes_count integer not null default 0;

-- Create indexes for performance
create index if not exists deck_likes_user_id_idx on public.deck_likes(user_id);
create index if not exists deck_likes_deck_id_idx on public.deck_likes(deck_id);
create index if not exists user_decks_likes_count_idx on public.user_decks(likes_count desc);

-- Create PL/pgSQL function to update likes count
create or replace function public.update_deck_likes_count()
returns trigger as $$
begin
	if (TG_OP = 'INSERT') then
		update public.user_decks
		set likes_count = likes_count + 1
		where id = new.deck_id;
		return new;
	elsif (TG_OP = 'DELETE') then
		update public.user_decks
		set likes_count = greatest(0, likes_count - 1)
		where id = old.deck_id;
		return old;
	end if;
	return null;
end;
$$ language plpgsql security definer;

-- Create trigger on deck_likes
drop trigger if exists tr_deck_likes_count on public.deck_likes;
create trigger tr_deck_likes_count
after insert or delete on public.deck_likes
for each row
execute function public.update_deck_likes_count();
