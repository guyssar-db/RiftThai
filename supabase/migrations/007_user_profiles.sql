alter table public.app_users
	add column if not exists display_name text;

alter table public.app_users
	add column if not exists profile_slug text;

alter table public.app_users
	add column if not exists profile_number text;

with profile_candidates as (
	select
		id,
		coalesce(
			nullif(
				trim(both '-' from lower(
					regexp_replace(
						coalesce(nullif(display_name, ''), split_part(email, '@', 1)),
						'[^a-z0-9]+',
						'-',
						'g'
					)
				)),
				''
			),
			'player'
		) as base_slug,
		lpad(row_number() over (
			partition by coalesce(
				nullif(
					trim(both '-' from lower(
						regexp_replace(
							coalesce(nullif(display_name, ''), split_part(email, '@', 1)),
							'[^a-z0-9]+',
							'-',
							'g'
						)
					)),
					''
				),
				'player'
			)
			order by id
		)::text, 5, '0') as profile_number
	from public.app_users
	where profile_slug is null or profile_number is null
)
update public.app_users
set
	profile_number = coalesce(public.app_users.profile_number, profile_candidates.profile_number),
	profile_slug = coalesce(public.app_users.profile_slug, profile_candidates.base_slug || '-' || profile_candidates.profile_number)
from profile_candidates
where public.app_users.id = profile_candidates.id;

create index if not exists app_users_display_name_idx on public.app_users(display_name);
create index if not exists app_users_profile_number_idx on public.app_users(profile_number);
create unique index if not exists app_users_profile_slug_idx on public.app_users(profile_slug);
