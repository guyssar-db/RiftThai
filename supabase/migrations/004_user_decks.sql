create table if not exists public.user_decks (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.app_users(id) on delete cascade,
	local_deck_id text not null,
	name text not null,
	champion_code text not null default '',
	entries jsonb not null default '[]'::jsonb,
	visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, local_deck_id)
);

create index if not exists user_decks_user_updated_idx
	on public.user_decks (user_id, updated_at desc);

create index if not exists user_decks_visibility_updated_idx
	on public.user_decks (visibility, updated_at desc);
