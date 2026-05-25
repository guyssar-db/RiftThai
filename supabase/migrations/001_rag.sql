create extension if not exists vector;

create table if not exists public.rag_documents (
	id uuid primary key default gen_random_uuid(),
	source text not null,
	source_type text not null,
	title text not null,
	content_hash text not null unique,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.rag_chunks (
	id uuid primary key default gen_random_uuid(),
	document_id uuid not null references public.rag_documents(id) on delete cascade,
	chunk_index integer not null,
	content text not null,
	embedding vector(768) not null,
	token_count integer not null default 0,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	unique (document_id, chunk_index)
);

create index if not exists rag_chunks_embedding_hnsw_idx
	on public.rag_chunks using hnsw (embedding vector_cosine_ops);

create index if not exists rag_documents_source_idx
	on public.rag_documents (source, source_type);

create or replace function public.match_rag_chunks(
	query_embedding text,
	match_threshold float default 0.5,
	match_count int default 8
)
returns table (
	id uuid,
	document_id uuid,
	content text,
	source text,
	source_type text,
	title text,
	metadata jsonb,
	similarity float
)
language sql stable
as $$
	select
		c.id,
		c.document_id,
		c.content,
		d.source,
		d.source_type,
		d.title,
		c.metadata || d.metadata as metadata,
		1 - (c.embedding <=> query_embedding::vector(768)) as similarity
	from public.rag_chunks c
	join public.rag_documents d on d.id = c.document_id
	where 1 - (c.embedding <=> query_embedding::vector(768)) >= match_threshold
	order by c.embedding <=> query_embedding::vector(768)
	limit match_count;
$$;

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
