create table if not exists public.rag_chat_usage (
	user_id uuid not null,
	usage_date date not null,
	count integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (user_id, usage_date)
);

create index if not exists rag_chat_usage_date_idx
	on public.rag_chat_usage (usage_date);

