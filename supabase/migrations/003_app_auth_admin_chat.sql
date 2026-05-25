create table if not exists public.app_users (
	id uuid primary key default gen_random_uuid(),
	email text not null unique,
	password_hash text not null,
	role text not null default 'user' check (role in ('user', 'admin')),
	email_verified_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.email_verification_tokens (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.app_users(id) on delete cascade,
	token_hash text not null unique,
	expires_at timestamptz not null,
	used_at timestamptz,
	created_at timestamptz not null default now()
);

create table if not exists public.user_sessions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.app_users(id) on delete cascade,
	session_token_hash text not null unique,
	expires_at timestamptz not null,
	created_at timestamptz not null default now()
);

create table if not exists public.admin_conversations (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.app_users(id) on delete cascade,
	last_message_at timestamptz,
	last_user_message_at timestamptz,
	last_admin_read_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique(user_id)
);

create table if not exists public.admin_messages (
	id uuid primary key default gen_random_uuid(),
	conversation_id uuid not null references public.admin_conversations(id) on delete cascade,
	sender_user_id uuid not null references public.app_users(id) on delete cascade,
	sender_role text not null check (sender_role in ('user', 'admin')),
	body text not null,
	read_at timestamptz,
	created_at timestamptz not null default now()
);

create index if not exists app_users_email_idx on public.app_users(email);
create index if not exists email_verification_tokens_user_idx on public.email_verification_tokens(user_id);
create index if not exists user_sessions_user_idx on public.user_sessions(user_id);
create index if not exists admin_conversations_last_message_idx on public.admin_conversations(last_message_at desc);
create index if not exists admin_messages_conversation_idx on public.admin_messages(conversation_id, created_at);

