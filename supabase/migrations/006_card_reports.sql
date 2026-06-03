create table if not exists public.card_reports (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.app_users(id) on delete set null,
	card_code text not null,
	card_name text not null,
	report_type text not null check (report_type in ('translation', 'card_data', 'image', 'rules_text', 'other')),
	message text not null,
	status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
	admin_note text not null default '',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists card_reports_status_created_idx
	on public.card_reports (status, created_at desc);

create index if not exists card_reports_card_code_idx
	on public.card_reports (card_code);
