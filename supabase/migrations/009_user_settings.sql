alter table public.app_users
	add column if not exists profile_public boolean not null default true;

alter table public.app_users
	add column if not exists public_decks_visible boolean not null default true;

alter table public.app_users
	add column if not exists default_deck_visibility text not null default 'private'
	check (default_deck_visibility in ('private', 'public'));

alter table public.app_users
	add column if not exists default_export_layout text not null default 'portrait'
	check (default_export_layout in ('portrait', 'landscape'));
