-- Create user_collections table
create table if not exists public.user_collections (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.app_users(id) on delete cascade,
	card_code text not null,
	quantity integer not null default 0 check (quantity >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, card_code)
);

-- Index for fast lookup by user_id
create index if not exists user_collections_user_id_idx on public.user_collections(user_id);
create index if not exists user_collections_user_card_idx on public.user_collections(user_id, card_code);
