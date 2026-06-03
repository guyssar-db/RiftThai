alter table public.app_users
	add column if not exists display_name_locked boolean not null default false;
