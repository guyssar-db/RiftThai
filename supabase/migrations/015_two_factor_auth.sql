create table if not exists public.user_two_factor (
	user_id uuid primary key references public.app_users(id) on delete cascade,
	secret_encrypted text not null,
	enabled_at timestamptz,
	backup_code_hashes text[] not null default '{}',
	last_used_step bigint,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists user_two_factor_enabled_idx
on public.user_two_factor(enabled_at)
where enabled_at is not null;

alter table public.user_two_factor enable row level security;
revoke all on public.user_two_factor from anon, authenticated;

create or replace function public.consume_two_factor_backup_code(
	target_user_id uuid,
	code_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
	updated_rows integer;
begin
	update public.user_two_factor
	set
		backup_code_hashes = array_remove(backup_code_hashes, code_hash),
		updated_at = now()
	where user_id = target_user_id
		and enabled_at is not null
		and code_hash = any(backup_code_hashes);

	get diagnostics updated_rows = row_count;
	return updated_rows = 1;
end;
$$;

create or replace function public.consume_two_factor_totp(
	target_user_id uuid,
	expected_step bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
	updated_rows integer;
begin
	update public.user_two_factor
	set
		last_used_step = expected_step,
		updated_at = now()
	where user_id = target_user_id
		and enabled_at is not null
		and (last_used_step is null or last_used_step < expected_step);

	get diagnostics updated_rows = row_count;
	return updated_rows = 1;
end;
$$;

revoke all on function public.consume_two_factor_backup_code(uuid, text) from public, anon, authenticated;
revoke all on function public.consume_two_factor_totp(uuid, bigint) from public, anon, authenticated;
grant execute on function public.consume_two_factor_backup_code(uuid, text) to service_role;
grant execute on function public.consume_two_factor_totp(uuid, bigint) to service_role;
